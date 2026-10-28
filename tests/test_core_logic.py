import pytest
from datetime import date, timedelta
from packs import (
    ShopType,
    BaseCard,
    TailorCard,
    MedicalCard,
    BakerCard,
    RepairCard,
    LaundryCard,
    get_card_model,
    get_pack_schema,
    balance_due,
    parse_date_words,
    compute_due_date,
    parse_expiry,
    validate_card,
    needs_attention,
)

FIXED_TODAY = date(2026, 10, 28)


def test_date_word_mappings():
    """Covers: each date word mapping (aaj=0, kal=1, parso=2, N din mein, agle hafte=7)"""
    assert parse_date_words("aaj") == 0
    assert parse_date_words("kal") == 1
    assert parse_date_words("parso") == 2
    assert parse_date_words("5 din mein") == 5
    assert parse_date_words("10 din mein") == 10
    assert parse_date_words("agle hafte") == 7

    # Test compute_due_date with date words
    d0, _ = compute_due_date(due_date_text="aaj", today=FIXED_TODAY)
    assert d0 == FIXED_TODAY

    d1, _ = compute_due_date(due_date_text="kal", today=FIXED_TODAY)
    assert d1 == FIXED_TODAY + timedelta(days=1)

    d2, _ = compute_due_date(due_date_text="parso", today=FIXED_TODAY)
    assert d2 == FIXED_TODAY + timedelta(days=2)

    d5, _ = compute_due_date(due_date_text="5 din mein", today=FIXED_TODAY)
    assert d5 == FIXED_TODAY + timedelta(days=5)

    d7, _ = compute_due_date(due_date_text="agle hafte", today=FIXED_TODAY)
    assert d7 == FIXED_TODAY + timedelta(days=7)


def test_leap_year_february_expiry():
    """Covers: leap-year February expiry (2028 is leap year -> 29, 2027 is not -> 28)"""
    exp_leap, warn_leap = parse_expiry("02/2028")
    assert not warn_leap
    assert exp_leap == date(2028, 2, 29)

    exp_non_leap, warn_non_leap = parse_expiry("02/2027")
    assert not warn_non_leap
    assert exp_non_leap == date(2027, 2, 28)


def test_month_end_expiry():
    """Covers: month-end expiry across 30-day and 31-day months"""
    exp_apr, _ = parse_expiry("04/2026")
    assert exp_apr == date(2026, 4, 30)

    exp_dec, _ = parse_expiry("12/2026")
    assert exp_dec == date(2026, 12, 31)

    exp_jan, _ = parse_expiry("01/2027")
    assert exp_jan == date(2027, 1, 31)


def test_past_expiry():
    """Covers: past expiry generates a warning"""
    card = MedicalCard(
        item="Paracetamol",
        expiry="05/2024",
        parsed_expiry_date=date(2024, 5, 31)
    )
    warnings = validate_card(card, today=FIXED_TODAY)
    assert any(w["field"] == "expiry" and "expired" in w["message"].lower() for w in warnings)


def test_expiry_more_than_five_years_ahead():
    """Covers: expiry > 5 years ahead generates a warning"""
    # 2026 + 5 = 2031; 2033 is > 5 years ahead
    card = MedicalCard(
        item="FutureVax",
        expiry="10/2033",
        parsed_expiry_date=date(2033, 10, 31)
    )
    warnings = validate_card(card, today=FIXED_TODAY)
    assert any(w["field"] == "expiry" and "5 years" in w["message"] for w in warnings)


def test_tailor_measurement_bounds():
    """Covers: measurement bounds (10 and 70 inclusive, 9.9 and 70.1 fail)"""
    # Exact bounds: 10.0 and 70.0 should produce NO warnings
    card_bounds = TailorCard(
        person="Ramesh",
        chest=10.0,
        waist=70.0,
        shoulder=10.0,
        length=70.0
    )
    warns = validate_card(card_bounds, today=FIXED_TODAY)
    measurement_warns = [w for w in warns if w["field"] in ("chest", "waist", "shoulder", "length")]
    assert len(measurement_warns) == 0

    # 9.9 and 70.1 should fail / produce warnings
    card_out = TailorCard(
        person="Suresh",
        chest=9.9,
        waist=70.1
    )
    warns_out = validate_card(card_out, today=FIXED_TODAY)
    chest_warn = next((w for w in warns_out if w["field"] == "chest"), None)
    waist_warn = next((w for w in warns_out if w["field"] == "waist"), None)
    assert chest_warn is not None
    assert "between 10 and 70" in chest_warn["message"]
    assert waist_warn is not None
    assert "between 10 and 70" in waist_warn["message"]


def test_negative_values():
    """Covers: negative values for quantity, amount, advance produce warnings"""
    card = BaseCard(
        shop_type=ShopType.TAILOR,
        quantity=-2,
        amount=-500,
        advance=-100
    )
    warns = validate_card(card, today=FIXED_TODAY)
    assert any(w["field"] == "quantity" and "negative" in w["message"] for w in warns)
    assert any(w["field"] == "amount" and "negative" in w["message"] for w in warns)
    assert any(w["field"] == "advance" and "negative" in w["message"] for w in warns)


def test_advance_greater_than_amount():
    """Covers: advance greater than amount produces a warning"""
    card = BaseCard(
        shop_type=ShopType.BAKER,
        amount=500.0,
        advance=600.0
    )
    warns = validate_card(card, today=FIXED_TODAY)
    assert any(w["field"] == "advance" and "exceeds" in w["message"] for w in warns)


def test_due_date_in_past():
    """Covers: due date in the past produces a warning"""
    past_due = FIXED_TODAY - timedelta(days=3)
    card = BaseCard(
        shop_type=ShopType.REPAIR,
        due_date=past_due
    )
    warns = validate_card(card, today=FIXED_TODAY)
    assert any(w["field"] == "due_date" and "past" in w["message"] for w in warns)


def test_needs_attention_boundaries():
    """Covers: needs_attention boundaries (exactly 2 days, exactly 30 days)"""
    # Tailor: exactly 2 days ahead -> True
    card_tailor_2d = TailorCard(due_date=FIXED_TODAY + timedelta(days=2))
    assert needs_attention(card_tailor_2d, today=FIXED_TODAY) is True

    # Tailor: 3 days ahead -> False
    card_tailor_3d = TailorCard(due_date=FIXED_TODAY + timedelta(days=3))
    assert needs_attention(card_tailor_3d, today=FIXED_TODAY) is False

    # Medical: exactly 30 days ahead -> True
    card_med_30d = MedicalCard(parsed_expiry_date=FIXED_TODAY + timedelta(days=30))
    assert needs_attention(card_med_30d, today=FIXED_TODAY) is True

    # Medical: 31 days ahead -> False
    card_med_31d = MedicalCard(parsed_expiry_date=FIXED_TODAY + timedelta(days=31))
    assert needs_attention(card_med_31d, today=FIXED_TODAY) is False


def test_unknown_pack_name():
    """Covers: unknown pack name raises ValueError"""
    with pytest.raises(ValueError) as exc:
        get_card_model("spaceship_repair")
    assert "Unknown shop type" in str(exc.value)


def test_baker_weight_validation():
    """Covers: baker cake weight between 0.25 and 20 kg inclusive"""
    # Valid
    valid_cake = BakerCard(weight_kg=1.5)
    assert len(validate_card(valid_cake, today=FIXED_TODAY)) == 0

    # Under 0.25
    tiny_cake = BakerCard(weight_kg=0.1)
    warns_tiny = validate_card(tiny_cake, today=FIXED_TODAY)
    assert any(w["field"] == "weight_kg" for w in warns_tiny)

    # Over 20
    huge_cake = BakerCard(weight_kg=25.0)
    warns_huge = validate_card(huge_cake, today=FIXED_TODAY)
    assert any(w["field"] == "weight_kg" for w in warns_huge)


def test_balance_due_computation():
    """Covers: balance due computation round amount - advance"""
    assert balance_due(1000.0, 300.0) == 700.0
    assert balance_due(500.0, 500.0) == 0.0
    assert balance_due(0.0, 0.0) == 0.0


def test_json_schema_export():
    """Covers: JSON schema export for each pack"""
    for shop in ShopType:
        schema = get_pack_schema(shop)
        assert "properties" in schema
        assert "shop_type" in schema["properties"]

