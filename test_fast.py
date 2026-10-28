import os
import sys
import time
from dotenv import load_dotenv
from google import genai
from google.genai import types

sys.stdout.reconfigure(encoding='utf-8')
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
client = genai.Client(api_key=api_key)

test_models = [
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-flash-latest",
    "gemini-3-flash-preview"
]

with open("test.wav", "rb") as f:
    audio_bytes = f.read()

for m in test_models:
    print(f"\n--- Checking {m} ---", flush=True)
    # text test
    t0 = time.perf_counter()
    try:
        r = client.models.generate_content(
            model=m,
            contents="Extract tailor JSON: Meena madam blouse 5 din mein total 800",
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        print(f"[{m}] Text SUCCESS ({(time.perf_counter()-t0)*1000:.1f}ms): {r.text[:50]}", flush=True)
    except Exception as e:
        print(f"[{m}] Text FAILED ({(time.perf_counter()-t0)*1000:.1f}ms): {e}", flush=True)

    # audio test
    t0 = time.perf_counter()
    try:
        r = client.models.generate_content(
            model=m,
            contents=[
                types.Part.from_bytes(data=audio_bytes, mime_type="audio/wav"),
                "Transcribe this audio exactly. Output only the transcript."
            ]
        )
        print(f"[{m}] Audio SUCCESS ({(time.perf_counter()-t0)*1000:.1f}ms): {r.text[:50]}", flush=True)
    except Exception as e:
        print(f"[{m}] Audio FAILED ({(time.perf_counter()-t0)*1000:.1f}ms): {e}", flush=True)

