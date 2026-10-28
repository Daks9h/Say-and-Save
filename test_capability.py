import os
import time
import json
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
client = genai.Client(api_key=api_key)

candidates = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemma-4-26b-a4b-it",
    "gemma-4-31b-it"
]

samples = {
    "tailor": "Meena madam blouse, chest 36, waist 30, 5 din mein, advance 500, total 800",
    "medical": "Crocin batch A123 expiry 08/2027, 20 units",
    "baker": "Chocolate cake 2 kg kal shaam tak, advance 500, Rahul ke liye"
}

with open("test.wav", "rb") as f:
    audio_bytes = f.read()

results = {}

for model in candidates:
    print(f"\n================ Testing {model} ================", flush=True)
    results[model] = {"text": {}, "audio": {}}
    
    # 1. Text extraction tests
    for pack, transcript in samples.items():
        prompt = f"Extract a JSON card for {pack} shop from this transcript: '{transcript}'. Return valid JSON only."
        t0 = time.perf_counter()
        try:
            resp = client.models.generate_content(
                model=model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            lat = (time.perf_counter() - t0) * 1000
            print(f"[{model}] Text {pack} SUCCESS in {lat:.1f}ms: {resp.text[:50]}...", flush=True)
            results[model]["text"][pack] = {"pass": True, "latency_ms": lat, "reply": resp.text}
        except Exception as e:
            lat = (time.perf_counter() - t0) * 1000
            print(f"[{model}] Text {pack} FAILED in {lat:.1f}ms: {e}", flush=True)
            results[model]["text"][pack] = {"pass": False, "latency_ms": lat, "error": str(e)}

    # 2. Audio test with test.wav
    t0 = time.perf_counter()
    try:
        resp = client.models.generate_content(
            model=model,
            contents=[
                types.Part.from_bytes(data=audio_bytes, mime_type="audio/wav"),
                "Transcribe this audio exactly. Output only the transcript."
            ]
        )
        lat = (time.perf_counter() - t0) * 1000
        print(f"[{model}] Audio test SUCCESS in {lat:.1f}ms: {resp.text.strip()[:60]}...", flush=True)
        results[model]["audio"] = {"pass": True, "latency_ms": lat, "transcript": resp.text.strip()}
    except Exception as e:
        lat = (time.perf_counter() - t0) * 1000
        print(f"[{model}] Audio test FAILED in {lat:.1f}ms: {e}", flush=True)
        results[model]["audio"] = {"pass": False, "latency_ms": lat, "error": str(e)}

with open("capability_results.json", "w") as f:
    json.dump(results, f, indent=2)
print("\nDone testing capabilities.", flush=True)

