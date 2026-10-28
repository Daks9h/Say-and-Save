import base64
import sys
import requests

path = sys.argv[1]
prompt = sys.argv[2] if len(sys.argv) > 2 else (
    "Transcribe this audio exactly. Output only the transcript."
)

audio_b64 = base64.b64encode(open(path, "rb").read()).decode()

r = requests.post(
    "http://localhost:11434/api/chat",
    json={
        "model": "gemma4:e2b",
        "stream": False,
        "messages": [
            {"role": "user", "content": prompt, "images": [audio_b64]}
        ],
    },
    timeout=300,
)

print("HTTP status:", r.status_code)
data = r.json()
print("Reply:", data.get("message", {}).get("content", data))