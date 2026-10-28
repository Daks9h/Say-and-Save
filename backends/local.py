import os
import re
import json
import base64
import requests
import soundfile as sf
import numpy as np
from typing import Dict, Any, Tuple, List, Optional
from datetime import date

import config
from backends.base import Backend, TimingContext
from packs import (
    ShopType,
    BaseCard,
    get_card_model,
    get_pack_schema,
    balance_due,
    compute_due_date,
    parse_expiry,
    validate_card,
)
from prompts import TRANSCRIPTION_PROMPT, EXTRACTION_SYSTEM_PROMPT
from audio_utils import normalize_to_pcm16_wav


class LocalBackend(Backend):
    def __init__(self, base_url: str = config.LOCAL_OLLAMA_URL, model: str = config.LOCAL_MODEL):
        self.base_url = base_url
        self.model = model
        self.session = requests.Session()
        self._is_warmed_up = False

    def warm_up(self):
        """Warms up local Ollama backend and ensures model stays in VRAM."""
        try:
            self.session.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model,
                    "messages": [{"role": "user", "content": "ping"}],
                    "stream": False,
                    "keep_alive": "60m",
                    "options": {"temperature": 0.0}
                },
                timeout=30
            )
            self._is_warmed_up = True
        except Exception:
            self._is_warmed_up = False

    def _prepare_audio(self, wav_path: str, timings: Dict[str, float]) -> str:
        """Validates duration (<30s) and normalizes to 16kHz mono 16-bit PCM if needed."""
        with TimingContext("audio_prep", timings):
            normalized_path = normalize_to_pcm16_wav(wav_path)
            try:
                info = sf.info(normalized_path)
                if info.duration > 30.0:
                    raise ValueError(f"Audio duration ({info.duration:.1f}s) exceeds maximum allowed 30 seconds.")

                with open(normalized_path, "rb") as f:
                    audio_bytes = f.read()

                return base64.b64encode(audio_bytes).decode("utf-8")
            finally:
                if normalized_path != wav_path and os.path.exists(normalized_path):
                    try:
                        os.remove(normalized_path)
                    except Exception:
                        pass

    def transcribe(self, wav_path: str) -> Tuple[str, Dict[str, float]]:
        """Transcribes audio using local Ollama model (gemma4:e2b)."""
        timings: Dict[str, float] = {}
        audio_b64 = self._prepare_audio(wav_path, timings)

        payload = {
            "model": self.model,
            "stream": False,
            "keep_alive": "60m",
            "messages": [
                {
                    "role": "user",
                    "content": TRANSCRIPTION_PROMPT,
                    "images": [audio_b64]
                }
            ],
            "options": {"temperature": 0.0}
        }

        with TimingContext("transcribe_api", timings):
            resp = self.session.post(
                f"{self.base_url}/api/chat",
                json=payload,
                timeout=300
            )

        if resp.status_code != 200:
            raise RuntimeError(f"Ollama transcribe failed with status {resp.status_code}: {resp.text}")

        data = resp.json()
        transcript = data.get("message", {}).get("content", "").strip()
        # Clean potential think blocks
        transcript = re.sub(r"<think>.*?</think>", "", transcript, flags=re.DOTALL).strip()
        return transcript, timings

    def _call_extract_api(self, prompt: str) -> Tuple[str, Dict[str, Any]]:
        payload = {
            "model": self.model,
            "stream": False,
            "format": "json",
            "keep_alive": "60m",
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "options": {"temperature": 0.0}
        }
        resp = self.session.post(
            f"{self.base_url}/api/chat",
            json=payload,
            timeout=300
        )
        if resp.status_code != 200:
            raise RuntimeError(f"Ollama extract failed with status {resp.status_code}: {resp.text}")
        data = resp.json()
        raw_text = data.get("message", {}).get("content", "").strip()
        cleaned_text = re.sub(r"<think>.*?</think>", "", raw_text, flags=re.DOTALL).strip()
        return cleaned_text, data

    def extract(
        self,
        transcript: str,
        shop_type: ShopType,
        today: Optional[date] = None
    ) -> Tuple[BaseCard, str, Dict[str, float], List[Dict[str, str]]]:
        """Extracts structured JSON card from transcript using local Ollama model."""
        if today is None:
            today = date.today()

        timings: Dict[str, float] = {}
        schema_dict = get_pack_schema(shop_type)
        schema_json = json.dumps(schema_dict, indent=2)

        prompt = EXTRACTION_SYSTEM_PROMPT.format(
            PACK=shop_type.value,
            PACK_JSON_SCHEMA=schema_json,
            TRANSCRIPT=transcript
        )

        with TimingContext("extract_api", timings):
            raw_text, _ = self._call_extract_api(prompt)

        # Attempt to parse JSON; retry once if invalid
        parsed_dict = None
        try:
            parsed_dict = json.loads(raw_text)
        except json.JSONDecodeError:
            if config.RETRY_ON_INVALID_JSON_LOCAL:
                with TimingContext("extract_retry_api", timings):
                    retry_prompt = prompt + "\nNote: Your previous output was not valid JSON. Output strictly valid JSON matching the schema."
                    raw_text, _ = self._call_extract_api(retry_prompt)
                    parsed_dict = json.loads(raw_text)
            else:
                raise

        # Map to Pydantic model
        model_cls = get_card_model(shop_type)
        with TimingContext("python_validation", timings):
            # Strip extra unrecognized fields
            card = model_cls(**parsed_dict)
            card.notes = transcript

            # Python computes all dates and totals (Rule 60)
            card.balance_due = balance_due(card.amount, card.advance)
            card.due_date, date_warns = compute_due_date(card.due_in_days, card.due_date_text, today)
            
            if hasattr(card, "expiry") and getattr(card, "expiry"):
                card.parsed_expiry_date, exp_warns = parse_expiry(card.expiry)

            # Validate card
            warnings = validate_card(card, today)

        # Post-response Grounding check (Rule 113)
        if config.GROUNDING_CHECK:
            with TimingContext("grounding_check", timings):
                grounding_warns = self._check_grounding(card, transcript)
                warnings.extend(grounding_warns)

        return card, raw_text, timings, warnings

    def _check_grounding(self, card: BaseCard, transcript: str) -> List[Dict[str, str]]:
        warns = []
        t_lower = (transcript or "").lower()
        if card.person:
            p_parts = card.person.lower().split()
            if not any(part in t_lower for part in p_parts if len(part) > 2):
                warns.append({
                    "field": "person",
                    "message": f"Person '{card.person}' was not heard in the recording.",
                    "severity": "warning"
                })
        if card.item:
            i_parts = card.item.lower().split()
            if not any(part in t_lower for part in i_parts if len(part) > 2):
                warns.append({
                    "field": "item",
                    "message": f"Item '{card.item}' was not heard in the recording.",
                    "severity": "warning"
                })
        return warns
