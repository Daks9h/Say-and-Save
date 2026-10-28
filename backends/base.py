import time
from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple, List, Optional
from packs import ShopType, BaseCard

class TimingContext:
    def __init__(self, name: str, timings_dict: Dict[str, float]):
        self.name = name
        self.timings_dict = timings_dict
        self.start = 0.0

    def __enter__(self):
        self.start = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        duration_ms = (time.perf_counter() - self.start) * 1000.0
        self.timings_dict[self.name] = duration_ms

class Backend(ABC):
    @abstractmethod
    def transcribe(self, wav_path: str) -> Tuple[str, Dict[str, float]]:
        """Transcribes audio file to raw text.
        Returns (transcript, timings_dict).
        """
        pass

    @abstractmethod
    def extract(self, transcript: str, shop_type: ShopType) -> Tuple[BaseCard, str, Dict[str, float], List[Dict[str, str]]]:
        """Extracts structured card from text transcript.
        Returns (card, raw_json_str, timings_dict, warnings).
        """
        pass
