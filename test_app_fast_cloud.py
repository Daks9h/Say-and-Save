import time
import json
import sys
from fastapi.testclient import TestClient
from app import app

sys.stdout.reconfigure(encoding='utf-8')
client = TestClient(app)

print("=" * 60)
print("Testing High-Speed Gemini Cloud Processing on test.wav")
print("=" * 60, flush=True)

t0 = time.perf_counter()

with open("test.wav", "rb") as f:
    resp = client.post(
        "/process-audio",
        files={"file": ("test.wav", f, "audio/wav")},
        data={"shop_type": "tailor", "mode": "cloud"}
    )

total_duration_ms = (time.perf_counter() - t0) * 1000

print(f"\nHTTP Status: {resp.status_code}")
print(f"Total Client Round-Trip Latency: {total_duration_ms:.1f} ms ({total_duration_ms/1000:.2f} seconds)")

assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
data = resp.json()

print(f"Backend Used: {data.get('backend_used')} (Cloud: {data.get('used_cloud')})")
print(f"Transcript: {data.get('transcript')}")
print(f"\nExtracted Card:")
print(json.dumps(data.get("card", {}), indent=2, ensure_ascii=False))
print(f"\nWarnings ({len(data.get('warnings', []))}): {data.get('warnings')}")
print(f"Server-side Timings: {data.get('timings')}")

print("\n" + "=" * 60)
print("SUCCESS: High-speed Cloud Gemini pipeline verified on test.wav!")
print("=" * 60)

