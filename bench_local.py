import base64
import sys
import time
import json
import statistics
import requests

sys.stdout.reconfigure(encoding='utf-8')

path = "test.wav"
audio_b64 = base64.b64encode(open(path, "rb").read()).decode()

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

session = requests.Session()

def run_transcribe():
    t0 = time.perf_counter()
    r = session.post(
        "http://localhost:11434/api/chat",
        json={
            "model": "gemma4:e2b",
            "stream": False,
            "messages": [
                {"role": "user", "content": transcribe_prompt, "images": [audio_b64]}
            ],
            "options": {"temperature": 0.0}
        },
        timeout=300
    )
    t1 = time.perf_counter()
    data = r.json()
    return (t1 - t0) * 1000, data.get("message", {}).get("content", "")

def run_extract():
    t0 = time.perf_counter()
    r = session.post(
        "http://localhost:11434/api/chat",
        json={
            "model": "gemma4:e2b",
            "stream": False,
            "format": "json",
            "messages": [
                {"role": "user", "content": extract_prompt}
            ],
            "options": {"temperature": 0.0}
        },
        timeout=300
    )
    t1 = time.perf_counter()
    data = r.json()
    return (t1 - t0) * 1000, data.get("message", {}).get("content", "")

print("--- Warming up Ollama local backend ---")
lat_w_t, res_w_t = run_transcribe()
print(f"Warm-up transcribe: {lat_w_t:.1f}ms: {res_w_t[:60]}")
lat_w_e, res_w_e = run_extract()
print(f"Warm-up extract: {lat_w_e:.1f}ms: {res_w_e[:60]}")

print("\n--- Running 10 timed transcribe runs ---")
t_times = []
for i in range(10):
    lat, text = run_transcribe()
    t_times.append(lat)
    print(f"Run {i+1}: {lat:.1f}ms")

print("\n--- Running 10 timed extract runs ---")
e_times = []
for i in range(10):
    lat, text = run_extract()
    e_times.append(lat)
    print(f"Run {i+1}: {lat:.1f}ms")

def calc_stats(times):
    s = sorted(times)
    p10 = s[1] # approx 10th percentile
    p90 = s[8] # approx 90th percentile
    p95 = s[9] # approx 95th percentile
    return {
        "min": s[0],
        "median": statistics.median(s),
        "p90": p90,
        "p95": p95,
        "max": s[-1],
        "noise_floor": p90 - p10
    }

results = {
    "transcribe": calc_stats(t_times),
    "extract": calc_stats(e_times)
}

with open("local_baseline.json", "w") as f:
    json.dump(results, f, indent=2)

print("\nLocal baseline completed:")
print(json.dumps(results, indent=2))

