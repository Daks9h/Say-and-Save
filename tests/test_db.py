import os
import pytest
from db import init_db, save_card, list_cards, mark_done, delete_card, list_people, latest_card_for_person

TEST_DB = "test_dukaan.db"

@pytest.fixture(autouse=True)
def setup_teardown():
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)
    init_db(TEST_DB)
    yield
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)

def test_db_lifecycle():
    # 1. Save card
    card_data = {
        "shop_type": "tailor",
        "person": "Aman Verma",
        "item": "Kurta Pajama",
        "amount": 1200.0,
        "advance": 500.0,
        "balance_due": 700.0,
        "due_date": "2026-11-05",
        "chest": 38.0,
        "notes": "Fast delivery"
    }
    cid = save_card(card_data, backend_used="local", used_cloud=False, customer_email="aman@example.com", db_path=TEST_DB)
    assert cid > 0

    # 2. List cards
    cards = list_cards(db_path=TEST_DB)
    assert len(cards) == 1
    assert cards[0]["person"] == "Aman Verma"
    assert cards[0]["status"] == "open"
    assert cards[0]["customer_email"] == "aman@example.com"
    assert cards[0]["parsed_card"]["chest"] == 38.0

    # 3. People list
    people = list_people(db_path=TEST_DB)
    assert "Aman Verma" in people

    # 4. Latest card for person
    latest = latest_card_for_person("Aman Verma", db_path=TEST_DB)
    assert latest is not None
    assert latest["item"] == "Kurta Pajama"

    # 5. Mark done
    assert mark_done(cid, db_path=TEST_DB) is True
    open_cards = list_cards(status="open", db_path=TEST_DB)
    assert len(open_cards) == 0

    # 6. Delete
    assert delete_card(cid, db_path=TEST_DB) is True
    assert len(list_cards(db_path=TEST_DB)) == 0

