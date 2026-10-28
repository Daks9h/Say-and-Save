from fastapi.testclient import TestClient
from app import app
import os

client = TestClient(app)

def test_api_health():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["project"] == "Dukaan Diary"

def test_api_config():
    res = client.get("/config")
    assert res.status_code == 200
    assert "flags" in res.json()

def test_api_card_lifecycle():
    card_payload = {
        "card": {
            "shop_type": "tailor",
            "person": "Test Customer",
            "item": "Pant and Shirt",
            "amount": 1500.0,
            "advance": 500.0,
            "balance_due": 1000.0,
            "due_date": "2026-11-05",
            "chest": 38.0
        },
        "backend_used": "local",
        "used_cloud": False,
        "customer_email": "test@example.com",
        "send_email": False,
        "send_telegram": False
    }
    # Create
    res = client.post("/cards", json=card_payload)
    assert res.status_code == 200
    card_id = res.json()["card_id"]
    assert card_id > 0

    # Read
    res = client.get("/cards")
    assert res.status_code == 200
    cards = res.json()
    found = any(c["id"] == card_id for c in cards)
    assert found is True

    # Complete
    res = client.put(f"/cards/{card_id}/done")
    assert res.status_code == 200

    # Delete
    res = client.delete(f"/cards/{card_id}")
    assert res.status_code == 200

