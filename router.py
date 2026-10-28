import time
import threading
import statistics
from collections import deque
from typing import Dict, Any, Optional, Tuple, List
import requests

import config
from backends.base import Backend
from backends.local import LocalBackend
from backends.cloud import CloudBackend
from packs import ShopType, BaseCard


class Router:
    def __init__(
        self,
        local_backend: Optional[LocalBackend] = None,
        cloud_backend: Optional[CloudBackend] = None
    ):
        self.local = local_backend or LocalBackend()
        self.cloud: Optional[CloudBackend] = None
        try:
            self.cloud = cloud_backend or CloudBackend()
        except Exception:
            self.cloud = None

        # Latency histories (last 10 requests)
        self.history: Dict[str, deque] = {
            "local": deque(maxlen=config.ROUTER_ROLLING_WINDOW),
            "cloud": deque(maxlen=config.ROUTER_ROLLING_WINDOW),
        }

        # Health & State (Default to ultra-fast Cloud Gemini per user priority)
        self.cloud_cooldown_until: float = 0.0
        self.current_preferred: str = "cloud"
        self.consecutive_faster_count: int = 0
        self.last_used_backend: str = "cloud"
        self.last_latency_ms: float = 0.0
        self.manual_mode: str = "cloud"  # User priority: "cloud" for sub-second responses

        # Accuracy Gate
        self.accuracy_gate_passed: Dict[str, bool] = {
            "local": True,
            "cloud": True
        }

        # Request state tracking (Rule L7: Probes pause during real requests)
        self.request_in_flight = False
        self._probe_thread: Optional[threading.Thread] = None
        self._stop_probes = threading.Event()

    def set_accuracy_gate(self, backend: str, passed: bool):
        """Sets accuracy gate for auto-routing eligibility."""
        self.accuracy_gate_passed[backend] = passed

    def is_cloud_eligible(self) -> bool:
        """Checks if cloud backend is eligible for automatic routing."""
        if not config.CLOUD_CONSENT:
            return False
        if not self.cloud or not self.cloud.api_key:
            return False
        if time.time() < self.cloud_cooldown_until:
            return False
        if not self.accuracy_gate_passed.get("cloud", False):
            return False
        return True

    def is_local_eligible(self) -> bool:
        """Checks if local backend is eligible."""
        return True

    def get_rolling_median(self, backend: str) -> Optional[float]:
        """Calculates rolling median latency over last 10 runs."""
        h = self.history.get(backend)
        if not h:
            return None
        return statistics.median(h)

    def select_backend(self) -> str:
        """Selects backend using speed-first policy with hysteresis and safety guards.
        Cost: dictionary lookup (microseconds).
        """
        # Manual override takes top precedence
        if self.manual_mode == "local":
            return "local"
        if self.manual_mode == "cloud":
            if self.cloud and time.time() >= self.cloud_cooldown_until:
                return "cloud"
            return "local"

        # Check eligibility
        cloud_ok = self.is_cloud_eligible()
        local_ok = self.is_local_eligible()

        if not cloud_ok:
            self.current_preferred = "local"
            return "local"
        if not local_ok:
            self.current_preferred = "cloud"
            return "cloud"

        local_med = self.get_rolling_median("local")
        cloud_med = self.get_rolling_median("cloud")

        if local_med is None and cloud_med is None:
            return "local"
        if cloud_med is None:
            return "local"
        if local_med is None:
            return "cloud"

        # Hysteresis: Switch only if other backend is >= 20% faster over 3 consecutive checks
        other_backend = "cloud" if self.current_preferred == "local" else "local"
        current_med = local_med if self.current_preferred == "local" else cloud_med
        other_med = cloud_med if self.current_preferred == "local" else local_med

        if other_med < (current_med * (1.0 - config.ROUTER_HYSTERESIS_RATIO)):
            self.consecutive_faster_count += 1
            if self.consecutive_faster_count >= 3:
                self.current_preferred = other_backend
                self.consecutive_faster_count = 0
        else:
            self.consecutive_faster_count = 0

        return self.current_preferred

    def record_success(self, backend: str, latency_ms: float):
        """Records a successful request duration."""
        self.history[backend].append(latency_ms)
        self.last_used_backend = backend
        self.last_latency_ms = latency_ms

    def record_failure(self, backend: str, error: Exception):
        """Puts cloud in cooldown for 60 seconds on failure."""
        if backend == "cloud":
            self.cloud_cooldown_until = time.time() + config.COOLDOWN_SECONDS
            self.current_preferred = "local"
            self.consecutive_faster_count = 0

    def process(
        self,
        wav_path: str,
        shop_type: ShopType,
        today=None
    ) -> Tuple[BaseCard, str, str, Dict[str, Any], List[Dict[str, str]]]:
        """Routes transcription and extraction with automatic failover.
        Returns (card, transcript, backend_used, timings, warnings).
        """
        self.request_in_flight = True
        preferred = self.select_backend()
        backend_used = preferred
        card = None
        transcript = ""
        timings: Dict[str, Any] = {}
        warnings: List[Dict[str, str]] = []

        # Drill guard: Check audio length (30-second cap)
        try:
            import soundfile as sf
            info = sf.info(wav_path)
            if info.duration > 30.0:
                from packs import get_card_model
                model_cls = get_card_model(shop_type)
                card = model_cls(shop_type=shop_type)
                warnings.append({
                    "field": "audio",
                    "message": f"Audio duration {info.duration:.1f}s exceeds maximum allowed 30 seconds. Please fill manually.",
                    "severity": "error"
                })
                return card, "", "manual_fallback", timings, warnings
        except Exception:
            pass

        try:
            # 1. Attempt preferred backend (Fast single-call path for Cloud Gemini)
            if preferred == "cloud" and self.cloud:
                try:
                    t0 = time.perf_counter()
                    card, transcript, e_timings, warnings = self.cloud.process_audio(wav_path, shop_type, today)
                    total_lat = (time.perf_counter() - t0) * 1000
                    timings = {**e_timings, "total_ms": total_lat}
                    self.record_success("cloud", total_lat)
                    return card, transcript, "cloud", timings, warnings
                except Exception as e:
                    self.record_failure("cloud", e)
                    # Immediate failover to local (Rule L4)
                    backend_used = "local"

            # 2. Local backend execution (or failover)
            t0 = time.perf_counter()
            transcript, t_timings = self.local.transcribe(wav_path)
            card, raw_json, e_timings, warnings = self.local.extract(transcript, shop_type, today)
            total_lat = (time.perf_counter() - t0) * 1000
            timings = {**t_timings, **e_timings, "total_ms": total_lat}
            self.record_success("local", total_lat)
            return card, transcript, "local", timings, warnings

        except Exception as e:
            # If both backends fail (R13): fallback blank card
            from packs import get_card_model
            model_cls = get_card_model(shop_type)
            card = model_cls(shop_type=shop_type, notes=transcript)
            warnings.append({"field": "system", "message": f"Backend failure: {e}. Please fill manually.", "severity": "error"})
            return card, transcript, "manual_fallback", timings, warnings

        finally:
            self.request_in_flight = False

    def start_background_probes(self, interval_sec: int = 60):
        """Starts background synthetic probes obeying Rule L7 (pauses during real requests)."""
        if not config.BACKGROUND_PROBES:
            return

        def _probe_worker():
            while not self._stop_probes.is_set():
                time.sleep(interval_sec)
                # Rule L7: Pause if real request is in flight
                if self.request_in_flight:
                    continue
                # Local synthetic probe
                try:
                    t0 = time.perf_counter()
                    self.local.session.post(
                        f"{self.local.base_url}/api/chat",
                        json={"model": self.local.model, "messages": [{"role": "user", "content": "1"}], "stream": False, "keep_alive": "60m"},
                        timeout=5
                    )
                    lat = (time.perf_counter() - t0) * 1000
                    if not self.history["local"]:
                        self.history["local"].append(lat)
                except Exception:
                    pass

        self._probe_thread = threading.Thread(target=_probe_worker, daemon=True)
        self._probe_thread.start()

    def stop_background_probes(self):
        self._stop_probes.set()
