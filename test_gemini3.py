import os
import time
import json
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
client = genai.Client(api_key=api_key)

with open("test.wav", "rb") as f:
    audio_bytes = f.read()

models = ["gemini-3.8-flash", "gemini-3.5-flash-lite"]
samples = {
    "tailor": "Meena madam blouse, chest 36, waist 30, 5 din mein, advance 500, total 800",
    "medical": "Crocin batch A123 expiry 08/2027, 20 units",
    "baker": "Chocolate cake 2 kg kal shaam tak, advance 500, Rahul ke liye"
}

results = {}
for m in models:
    print(f"\nTesting {m}...", flush=True)
    results[m] = {"text": {}, "audio": {}}
    for pack, text in samples.items():
        t0 = time.perf_counter()
        try:
            resp = client.models.generate_content(
                model=m,
                contents=f"Extract JSON for {pack}: {text}",
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )
            lat = (time.perf_counter() - t0) * 1000
            print(f"[{m}] {pack} text: {lat:.1f}ms", flush=True)
            results[m]["text"][pack] = {"pass": True, "latency_ms": lat, "reply": resp.text}
        except Exception as e:
            lat = (time.perf_counter() - t0) * 1000
            print(f"[{m}] {pack} text FAILED: {lat:.1f}ms, {e}", flush=True)
            results[m]["text"][pack] = {"pass": False, "latency_ms": lat, "error": str(e)}

    t0 = time.perf_counter()
    try:
        resp = client.models.generate_content(
            model=m,
            contents=[
                types.Part.from_bytes(data=audio_bytes, mime_type="audio/wav"),
                "Transcribe this audio exactly. Output only the transcript."
            ]
        )
        lat = (time.perf_counter() - t0) * 1000
        print(f"[{m}] Audio SUCCESS: {lat:.1f}ms - {resp.text.strip()[:60]}", flush=True)
        results[m]["audio"] = {"pass": True, "latency_ms": lat, "transcript": resp.text.strip()}
    except Exception as e:
        lat = (time.perf_counter() - t0) * 1000
        print(f"[{m}] Audio FAILED: {lat:.1f}ms, {e}", flush=True)
        results[m]["audio"] = {"pass": False, "latency_ms": lat, "error": str(e)}

with open("gemini3_results.json", "w") as f:
    json.dump(results, f, indent=2)
print("gemini3 done!", flush=True)

