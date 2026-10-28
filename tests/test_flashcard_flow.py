import os
from fastapi.testclient import TestClient
from app import app
import db

client = TestClient(app)

def test_flashcard_auto_create_and_edit():
    # 1. Process audio with auto_save enabled (default)
    with open("test.wav", "rb") as f:
        res = client.post(
            "/process-audio",
            files={"file": ("test.wav", f, "audio/wav")},
            data={"shop_type": "tailor", "mode": "cloud", "auto_save": "true"}
        )

    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "auto_saved"
    card_id = data["card_id"]
    assert card_id is not None
    assert isinstance(card_id, int)

    # Validate English fields
    card = data["card"]
    assert "Verma" in card.get("person", "")
    assert card.get("amount") is not None
    assert card.get("balance_due") is not None

    # 2. Retrieve the auto-created card from database
    get_res = client.get(f"/cards/{card_id}")
    assert get_res.status_code == 200
    fetched = get_res.json()
    assert fetched["person"] == card["person"]

    # 3. Modify the flashcard via PUT /cards/{card_id}
    update_res = client.put(
        f"/cards/{card_id}",
        json={
            "card": {
                "person": "Verma Uncle Senior",
                "item": "Designer Suit",
                "amount": 2500,
                "advance": 1000,
                "shop_type": "tailor",
                "chest": 40.0,
                "waist": 36.0,
            }
        }
    )
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["status"] == "updated"
    updated_card = updated_data["card"]
    assert updated_card["person"] == "Verma Uncle Senior"
    assert updated_card["item"] == "Designer Suit"
    assert updated_card["amount"] == 2500
    assert updated_card["advance"] == 1000
    # Deterministic balance_due calculation in Python: 2500 - 1000 = 1500
    assert updated_card["balance_due"] == 1500.0

    # 4. Clean up
    del_res = client.delete(f"/cards/{card_id}")
    assert del_res.status_code == 200
