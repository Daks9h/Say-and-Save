import subprocess
import os
import tempfile
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

def test_browser_webm_audio():
    """Simulates a browser recording in WebM/Opus named 'recording.wav' or 'recording.webm'.
    Must be converted by normalize_to_pcm16_wav and processed by the AI without format errors!
    """
    # Create a dummy webm file with ffmpeg
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
        webm_path = tmp.name

    try:
        # Convert test.wav to webm opus
        res = subprocess.run([
            "ffmpeg", "-y", "-i", "test.wav",
            "-c:a", "libopus",
            "-b:a", "32k",
            webm_path
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        assert res.returncode == 0

        # Send it with filename recording.wav (exactly what browser did)
        with open(webm_path, "rb") as f:
            res = client.post(
                "/process-audio",
                files={"file": ("recording.wav", f, "audio/webm")},
                data={"shop_type": "tailor"}
            )
        assert res.status_code == 200
        data = res.json()
        # Verify AI processed it and backend didn't fail with 'Format not recognised'
        assert data["backend_used"] in ("local", "cloud")
        assert "card" in data
        assert data["card"]["person"] is not None or data["card"]["amount"] is not None
    finally:
        if os.path.exists(webm_path):
            os.remove(webm_path)

