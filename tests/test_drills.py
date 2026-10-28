import os
import pytest
from fastapi.testclient import TestClient
from app import app
import config
from packs import ShopType

client = TestClient(app)

def test_drill_secrets_scan():
    """Drill: Confirm GOOGLE_API_KEY only exists in .env and .gitignore contains .env"""
    # 1. Check .gitignore
    with open(".gitignore", "r") as f:
        gitignore_content = f.read()
    assert ".env" in gitignore_content

    # 2. Scan all python files to ensure no hardcoded API key
    key = config.GOOGLE_API_KEY
    if key and len(key) > 10:
        for root, _, files in os.walk("."):
            if "venv" in root or ".git" in root or ".next" in root or "node_modules" in root:
                continue
            for file in files:
                if file.endswith((".py", ".js", ".jsx", ".json", ".md")) and file not in (".env", "PREFLIGHT.md"):
                    file_path = os.path.join(root, file)
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                    assert key not in content, f"Secret leaked in {file_path}!"

def test_drill_audio_over_30_seconds():
    """Drill: Audio exceeding 30 seconds must be rejected gracefully"""
    import soundfile as sf
    import numpy as np
    import tempfile

    # Generate 35 seconds of silence
    sr = 16000
    long_audio = np.zeros(35 * sr, dtype=np.float32)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        sf.write(tmp.name, long_audio, sr, subtype="PCM_16")
        tmp_name = tmp.name

    try:
        with open(tmp_name, "rb") as f:
            res = client.post(
                "/process-audio",
                files={"file": ("long.wav", f, "audio/wav")},
                data={"shop_type": "tailor"}
            )
        assert res.status_code == 200
        data = res.json()
        assert data["backend_used"] == "manual_fallback"
        assert any("exceeds maximum allowed 30 seconds" in w["message"] for w in data["warnings"])
    finally:
        if os.path.exists(tmp_name):
            os.remove(tmp_name)

def test_drill_card_persistence_and_recovery():
    """Drill: Database persistence across requests"""
    # Save a card
    res = client.post("/cards", json={
        "card": {
            "shop_type": "baker",
            "person": "Persistence Tester",
            "item": "Pineapple Cake",
            "amount": 800.0,
            "advance": 200.0,
            "balance_due": 600.0,
            "weight_kg": 2.0
        },
        "backend_used": "local",
        "used_cloud": False
    })
    assert res.status_code == 200
    card_id = res.json()["card_id"]

    # Re-fetch from fresh query
    res2 = client.get(f"/cards?q=Persistence+Tester")
    assert res2.status_code == 200
    items = res2.json()
    assert len(items) >= 1
    assert any(i["id"] == card_id for i in items)

    # Clean up
    client.delete(f"/cards/{card_id}")
