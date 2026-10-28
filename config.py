import os
from dotenv import load_dotenv

load_dotenv()

# Feature Flags (plan.md Section 4)
AUTO_EXTRACT = True
RETRY_ON_INVALID_JSON_LOCAL = True
RETRY_ON_INVALID_JSON_CLOUD = False
GROUNDING_CHECK = True
FUZZY_NAME_MATCH = True
AUDIO_NORMALIZE = True
DEBUG_TIMING_PANEL = True
DISK_LOGGING = False
BACKGROUND_PROBES = True
CLOUD_SINGLE_CALL_EXPERIMENT = False
BENCHMARK_MODE = False
CLOUD_CONSENT = True  # User confirmed ON in intake

# Model Configurations
LOCAL_MODEL = "gemma4:e2b"
LOCAL_OLLAMA_URL = "http://localhost:11434"
CLOUD_MODEL = "gemini-3.5-flash-lite"
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

# Project Settings
PROJECT_NAME = "Say & Save"
CURRENCY = "INR"
CURRENCY_SYMBOL = "₹"
UNIT_MEASUREMENT = "inches"
UNIT_WEIGHT = "kg"

# Latency and Routing
OVERHEAD_THRESHOLD_MS = 50.0
ACCURACY_FLOOR = 0.80
COOLDOWN_SECONDS = 60
ROUTER_HYSTERESIS_RATIO = 0.20  # 20% faster for 3 consecutive checks
ROUTER_ROLLING_WINDOW = 10

