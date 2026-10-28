import os
import sys
import time
import json
import statistics
from dotenv import load_dotenv
from google import genai
from google.genai import types

sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
client = genai.Client(api_key=api_key)

model_name = "gemini-3.5-flash-lite"
path = "test.wav"
with open(path, "rb") as f:
    audio_bytes = f.read()

transcribe_prompt = "Transcribe this audio exactly. Output only the transcript."
extract_prompt = """<role>
You convert a shopkeeper's spoken note into one JSON card for a tailor shop.
</role>
<rules>
1. Output numbers as digits.
2. Never calculate dates or balances.
3. If a value was not said, output null.
4. Output only valid JSON.
</rules>
<transcript>
Meena madam blouse, chest 36, waist 30, 5 din mein, advance 500, total 800
</transcript>
"""

def run_cloud_transcribe():
    t0 = time.perf_counter()
    resp = client.models.generate_content(
        model=model_name,
        contents=[
            types.Part.from_bytes(data=audio_bytes, mime_type="audio/wav"),
            transcribe_prompt
        ]
    )
    t1 = time.perf_counter()
    return (t1 - t0) * 1000, resp.text

def run_cloud_extract():
    t0 = time.perf_counter()
    resp = client.models.generate_content(
        model=model_name,
        contents=extract_prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json"
        )
    )
    t1 = time.perf_counter()
    return (t1 - t0) * 1000, resp.text

print(f"--- Warming up Cloud backend ({model_name}) ---", flush=True)
lat_w_t, res_w_t = run_cloud_transcribe()
print(f"Warm-up transcribe: {lat_w_t:.1f}ms: {res_w_t[:60]}", flush=True)
lat_w_e, res_w_e = run_cloud_extract()
print(f"Warm-up extract: {lat_w_e:.1f}ms: {res_w_e[:60]}", flush=True)

print("\n--- Running 10 timed cloud transcribe runs ---", flush=True)
t_times = []
for i in range(10):
    lat, text = run_cloud_transcribe()
    t_times.append(lat)
    print(f"Run {i+1}: {lat:.1f}ms", flush=True)

print("\n--- Running 10 timed cloud extract runs ---", flush=True)
e_times = []
for i in range(10):
    lat, text = run_cloud_extract()
    e_times.append(lat)
    print(f"Run {i+1}: {lat:.1f}ms", flush=True)

def calc_stats(times):
    s = sorted(times)
    p10 = s[1]
    p90 = s[8]
    p95 = s[9]
    return {
        "min": s[0],
        "median": statistics.median(s),
        "p90": p90,
        "p95": p95,
        "max": s[-1],
        "noise_floor": p90 - p10
    }

results = {
    "model": model_name,
    "transcribe": calc_stats(t_times),
    "extract": calc_stats(e_times)
}

with open("cloud_baseline.json", "w") as f:
    json.dump(results, f, indent=2)

print("\nCloud baseline completed:", flush=True)
print(json.dumps(results, indent=2), flush=True)

