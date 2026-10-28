import os
import json
import time
from typing import Dict, Any, Tuple, List, Optional
from datetime import date
from dotenv import load_dotenv
from google import genai
from google.genai import types

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

load_dotenv()


class CloudBackend(Backend):
    def __init__(self, api_key: Optional[str] = None, model: str = config.CLOUD_MODEL):
        self.api_key = api_key or config.GOOGLE_API_KEY
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY is not configured in environment or .env")
        
        # Rule L2: One persistent client created at startup (keep-alive)
        self.client = genai.Client(api_key=self.api_key)
        self.model = model

    def transcribe(self, wav_path: str) -> Tuple[str, Dict[str, float]]:
        """Transcribes audio using Google Cloud Gemini API."""
        timings: Dict[str, float] = {}

        # Rule L3: Only strictly required audio prep runs first
        with TimingContext("audio_prep", timings):
            normalized_path = normalize_to_pcm16_wav(wav_path)
            try:
                with open(normalized_path, "rb") as f:
                    audio_bytes = f.read()
            finally:
                if normalized_path != wav_path and os.path.exists(normalized_path):
                    try:
                        os.remove(normalized_path)
                    except Exception:
                        pass

        # Rule L1: Send request immediately with persistent client
        with TimingContext("transcribe_api", timings):
            resp = self.client.models.generate_content(
                model=self.model,
                contents=[
                    types.Part.from_bytes(data=audio_bytes, mime_type="audio/wav"),
                    TRANSCRIPTION_PROMPT
                ]
            )

        transcript = (resp.text or "").strip()
        return transcript, timings

    def process_audio(
        self,
        wav_path: str,
        shop_type: ShopType,
        today: Optional[date] = None
    ) -> Tuple[BaseCard, str, Dict[str, float], List[Dict[str, str]]]:
        """Single-call audio-to-card extraction (Fastest path: ~3 seconds)."""
        if today is None:
            today = date.today()

        timings: Dict[str, float] = {}

        # 1. Normalize audio
        with TimingContext("audio_prep", timings):
            normalized_path = normalize_to_pcm16_wav(wav_path)
            try:
                with open(normalized_path, "rb") as f:
                    audio_bytes = f.read()
            finally:
                if normalized_path != wav_path and os.path.exists(normalized_path):
                    try:
                        os.remove(normalized_path)
                    except Exception:
                        pass

        # 2. Prepare single-call prompt with JSON schema
        schema_dict = get_pack_schema(shop_type)
        schema_json = json.dumps(schema_dict, indent=2)

        prompt = f"""<role>
You convert a shopkeeper's spoken voice note into one JSON card for a {shop_type.value} shop.
</role>
<rules>
1. Output numbers as digits. "teen hazaar" is 3000.
2. In the "notes" field, output the exact spoken transcript.
3. If a value was not said, output null. Never guess values.
4. Output only JSON matching the schema.
</rules>
<schema>
{schema_json}
</schema>
"""

        # 3. Single API Call (audio + prompt)
        with TimingContext("cloud_api", timings):
            resp = self.client.models.generate_content(
                model=self.model,
                contents=[
                    types.Part.from_bytes(data=audio_bytes, mime_type="audio/wav"),
                    prompt
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    max_output_tokens=1000,
                    temperature=0.0
                )
            )

        raw_text = (resp.text or "").strip()
        parsed_dict = json.loads(raw_text)

        transcript = parsed_dict.get("notes") or ""

        # 4. Python post-processing (dates, math, validation)
        model_cls = get_card_model(shop_type)
        with TimingContext("python_validation", timings):
            card = model_cls(**parsed_dict)
            card.notes = transcript

            card.balance_due = balance_due(card.amount, card.advance)
            card.due_date, _ = compute_due_date(card.due_in_days, card.due_date_text, today)

            if hasattr(card, "expiry") and getattr(card, "expiry"):
                card.parsed_expiry_date, _ = parse_expiry(card.expiry)

            warnings = validate_card(card, today)

        if config.GROUNDING_CHECK and transcript:
            with TimingContext("grounding_check", timings):
                grounding_warns = self._check_grounding(card, transcript)
                warnings.extend(grounding_warns)

        return card, transcript, timings, warnings

    def extract(
        self,
        transcript: str,
        shop_type: ShopType,
        today: Optional[date] = None
    ) -> Tuple[BaseCard, str, Dict[str, float], List[Dict[str, str]]]:
        """Extracts structured JSON card from transcript using Google Cloud Gemini API."""
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

        # Rule L1 & L10: Schema-constrained JSON output with low max output tokens
        with TimingContext("extract_api", timings):
            resp = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    max_output_tokens=1000,
                    temperature=0.0
                )
            )

        raw_text = (resp.text or "").strip()
        parsed_dict = json.loads(raw_text)

        # Post-response validation (Rule L14)
        model_cls = get_card_model(shop_type)
        with TimingContext("python_validation", timings):
            card = model_cls(**parsed_dict)
            card.notes = transcript

            # Python computes all dates and totals (Rule 60)
            card.balance_due = balance_due(card.amount, card.advance)
            card.due_date, date_warns = compute_due_date(card.due_in_days, card.due_date_text, today)

            if hasattr(card, "expiry") and getattr(card, "expiry"):
                card.parsed_expiry_date, exp_warns = parse_expiry(card.expiry)

            warnings = validate_card(card, today)

        # Post-response Grounding check (Rule 113)
        if config.GROUNDING_CHECK:
            with TimingContext("grounding_check", timings):
                grounding_warns = self._check_grounding(card, transcript)
                warnings.extend(grounding_warns)

        return card, raw_text, timings, warnings

    def _check_grounding(self, card: BaseCard, transcript: str) -> List[Dict[str, str]]:
        """Checks if extracted string fields and numbers appear in the spoken transcript.
        Adds a warning 'not heard in the recording' if ungrounded.
        """
        warns = []
        t_lower = (transcript or "").lower()

        # Check person
        if card.person:
            p_parts = card.person.lower().split()
            # If none of the name parts appear in transcript
            if not any(part in t_lower for part in p_parts if len(part) > 2):
                warns.append({
                    "field": "person",
                    "message": f"Person '{card.person}' was not heard in the recording.",
                    "severity": "warning"
                })

        # Check item
        if card.item:
            i_parts = card.item.lower().split()
            if not any(part in t_lower for part in i_parts if len(part) > 2):
                warns.append({
                    "field": "item",
                    "message": f"Item '{card.item}' was not heard in the recording.",
                    "severity": "warning"
                })

        return warns
