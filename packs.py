import re
import calendar
from datetime import date, datetime, timedelta
from enum import Enum
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field


class ShopType(str, Enum):
    TAILOR = "tailor"
    MEDICAL = "medical"
    BAKER = "baker"
    REPAIR = "repair"
    LAUNDRY = "laundry"


class BaseCard(BaseModel):
    shop_type: ShopType
    person: Optional[str] = None
    item: Optional[str] = None
    quantity: float = 1.0
    amount: float = 0.0
    advance: float = 0.0
    due_in_days: Optional[int] = None
    due_date_text: Optional[str] = None
    notes: Optional[str] = None

    # Computed fields (in Python)
    due_date: Optional[date] = None
    balance_due: Optional[float] = None


class TailorCard(BaseCard):
    shop_type: ShopType = ShopType.TAILOR
    chest: Optional[float] = None
    waist: Optional[float] = None
    shoulder: Optional[float] = None
    length: Optional[float] = None


class MedicalCard(BaseCard):
    shop_type: ShopType = ShopType.MEDICAL
    batch: Optional[str] = None
    expiry: Optional[str] = None  # Expected MM/YYYY
    units: Optional[int] = None
    parsed_expiry_date: Optional[date] = None


class BakerCard(BaseCard):
    shop_type: ShopType = ShopType.BAKER
    flavour: Optional[str] = None
    weight_kg: Optional[float] = None
    cake_message: Optional[str] = None


class RepairCard(BaseCard):
    shop_type: ShopType = ShopType.REPAIR
    device: Optional[str] = None
    fault: Optional[str] = None
    estimate: Optional[float] = None


class LaundryCard(BaseCard):
    shop_type: ShopType = ShopType.LAUNDRY
    item_count: Optional[int] = None
    service: Optional[str] = None  # wash, iron, dry_clean


PACK_MODELS = {
    ShopType.TAILOR: TailorCard,
    ShopType.MEDICAL: MedicalCard,
    ShopType.BAKER: BakerCard,
    ShopType.REPAIR: RepairCard,
    ShopType.LAUNDRY: LaundryCard,
}


def get_card_model(shop_type: Union[str, ShopType]):
    if isinstance(shop_type, str):
        try:
            shop_type = ShopType(shop_type.lower())
        except ValueError:
            raise ValueError(f"Unknown shop type: {shop_type}")
    return PACK_MODELS[shop_type]


def get_pack_schema(shop_type: Union[str, ShopType]) -> Dict[str, Any]:
    model = get_card_model(shop_type)
    return model.model_json_schema()


def balance_due(amount: float, advance: float) -> float:
    return round((amount or 0.0) - (advance or 0.0), 2)


def parse_date_words(phrase: str) -> Optional[int]:
    """Maps spoken words to due_in_days:
    aaj = 0, kal = 1, parso = 2, 'N din mein' = N, 'agle hafte' = 7
    """
    if not phrase:
        return None
    p = phrase.strip().lower()
    if p in ("aaj", "today"):
        return 0
    if p in ("kal", "tomorrow"):
        return 1
    if p in ("parso", "day after tomorrow"):
        return 2
    if p in ("agle hafte", "next week"):
        return 7
    m = re.search(r"(\d+)\s*din\s*mein", p)
    if m:
        return int(m.group(1))
    m = re.search(r"in\s*(\d+)\s*days?", p)
    if m:
        return int(m.group(1))
    return None


MONTH_NAMES = {
    "january": 1, "jan": 1,
    "february": 2, "feb": 2,
    "march": 3, "mar": 3,
    "april": 4, "apr": 4,
    "may": 5,
    "june": 6, "jun": 6,
    "july": 7, "jul": 7,
    "august": 8, "aug": 8,
    "september": 9, "sep": 9, "sept": 9,
    "october": 10, "oct": 10,
    "november": 11, "nov": 11,
    "december": 12, "dec": 12
}


def compute_due_date(
    due_in_days: Optional[int] = None,
    due_date_text: Optional[str] = None,
    today: Optional[date] = None
) -> tuple[Optional[date], List[Dict[str, str]]]:
    """Computes an exact due_date.
    If due_in_days is provided: today + due_in_days.
    If absolute text (e.g. '15 November'): assumes the next occurrence.
    Returns (computed_date, warnings).
    """
    if today is None:
        today = date.today()

    warnings = []
    if due_in_days is not None:
        try:
            return today + timedelta(days=int(due_in_days)), warnings
        except Exception as e:
            warnings.append({"field": "due_in_days", "message": f"Invalid due_in_days: {e}", "severity": "warning"})
            return None, warnings

    if due_date_text:
        text = due_date_text.strip().lower()
        # Check date words first
        word_days = parse_date_words(text)
        if word_days is not None:
            return today + timedelta(days=word_days), warnings

        # Try matching day + month, e.g., '15 november' or '15th nov' or 'november 15'
        match1 = re.search(r"(\d{1,2})(?:st|nd|rd|th)?\s+([a-zA-Z]+)(?:\s+(\d{4}))?", text)
        match2 = re.search(r"([a-zA-Z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\d{4}))?", text)
        day, month_str, year_str = None, None, None

        if match1:
            day = int(match1.group(1))
            month_str = match1.group(2)
            year_str = match1.group(3)
        elif match2:
            month_str = match2.group(1)
            day = int(match2.group(2))
            year_str = match2.group(3)

        if day and month_str in MONTH_NAMES:
            month = MONTH_NAMES[month_str]
            if year_str:
                year = int(year_str)
                try:
                    return date(year, month, day), warnings
                except ValueError as e:
                    warnings.append({"field": "due_date_text", "message": f"Invalid date: {e}", "severity": "warning"})
                    return None, warnings
            else:
                # Next occurrence assumption
                candidate_year = today.year
                try:
                    cand = date(candidate_year, month, day)
                    if cand < today:
                        cand = date(candidate_year + 1, month, day)
                    return cand, warnings
                except ValueError as e:
                    warnings.append({"field": "due_date_text", "message": f"Invalid day/month: {e}", "severity": "warning"})
                    return None, warnings

        warnings.append({
            "field": "due_date_text",
            "message": f"Ambiguous date '{due_date_text}'. Please select using date picker.",
            "severity": "warning"
        })
        return None, warnings

    return None, warnings


def parse_expiry(expiry_str: Optional[str]) -> tuple[Optional[date], List[Dict[str, str]]]:
    """Parses 'MM/YYYY' to the last day of that month.
    Handles leap-year Februaries (29 days) and standard months.
    Returns (expiry_date, warnings).
    """
    warnings = []
    if not expiry_str:
        return None, warnings

    s = expiry_str.strip()
    match = re.match(r"^(\d{1,2})[/-](\d{4})$", s)
    if not match:
        warnings.append({
            "field": "expiry",
            "message": f"Expiry '{expiry_str}' does not match MM/YYYY format.",
            "severity": "warning"
        })
        return None, warnings

    month = int(match.group(1))
    year = int(match.group(2))

    if month < 1 or month > 12:
        warnings.append({
            "field": "expiry",
            "message": f"Invalid month {month} in expiry date.",
            "severity": "warning"
        })
        return None, warnings

    last_day = calendar.monthrange(year, month)[1]
    return date(year, month, last_day), warnings


def validate_card(card: BaseCard, today: Optional[date] = None) -> List[Dict[str, str]]:
    """Runs pure-Python validation rules.
    NEVER modifies the card.
    Returns list of warning dicts: [{"field": ..., "message": ..., "severity": "warning"}]
    """
    if today is None:
        today = date.today()

    warnings: List[Dict[str, str]] = []

    # 1. Core validations
    if card.quantity is not None and card.quantity < 0:
        warnings.append({"field": "quantity", "message": "Quantity cannot be negative.", "severity": "warning"})
    if card.amount is not None and card.amount < 0:
        warnings.append({"field": "amount", "message": "Amount cannot be negative.", "severity": "warning"})
    if card.advance is not None and card.advance < 0:
        warnings.append({"field": "advance", "message": "Advance cannot be negative.", "severity": "warning"})
    if card.amount is not None and card.advance is not None and card.advance > card.amount:
        warnings.append({"field": "advance", "message": f"Advance ({card.advance}) exceeds total amount ({card.amount}).", "severity": "warning"})

    # Due date check
    due = card.due_date
    if due is None and (card.due_in_days is not None or card.due_date_text):
        due, date_warns = compute_due_date(card.due_in_days, card.due_date_text, today)
        warnings.extend(date_warns)

    if due is not None and due < today:
        warnings.append({"field": "due_date", "message": f"Due date ({due}) is in the past.", "severity": "warning"})

    # 2. Pack-specific validations
    if isinstance(card, TailorCard):
        for field_name in ("chest", "waist", "shoulder", "length"):
            val = getattr(card, field_name)
            if val is not None:
                if val < 10.0 or val > 70.0:
                    warnings.append({
                        "field": field_name,
                        "message": f"{field_name.capitalize()} ({val} in) must be between 10 and 70 inches.",
                        "severity": "warning"
                    })

    elif isinstance(card, MedicalCard):
        exp_date = card.parsed_expiry_date
        if exp_date is None and card.expiry:
            exp_date, exp_warns = parse_expiry(card.expiry)
            warnings.extend(exp_warns)

        if exp_date is not None:
            if exp_date < today:
                warnings.append({
                    "field": "expiry",
                    "message": f"Medicine has already expired on {exp_date}.",
                    "severity": "warning"
                })
            # Not more than 5 years ahead
            five_years_ahead = date(today.year + 5, today.month, min(today.day, calendar.monthrange(today.year + 5, today.month)[1]))
            if exp_date > five_years_ahead:
                warnings.append({
                    "field": "expiry",
                    "message": f"Expiry date ({exp_date}) is more than 5 years in the future.",
                    "severity": "warning"
                })

    elif isinstance(card, BakerCard):
        if card.weight_kg is not None:
            if card.weight_kg < 0.25 or card.weight_kg > 20.0:
                warnings.append({
                    "field": "weight_kg",
                    "message": f"Cake weight ({card.weight_kg} kg) must be between 0.25 and 20 kg.",
                    "severity": "warning"
                })

    return warnings


def needs_attention(card: BaseCard, today: Optional[date] = None) -> bool:
    """Calculates whether a card needs attention based on per-pack windows:
    - Tailor, Baker, Repair, Laundry: due within 2 days (inclusive).
    - Medical: expires within 30 days (inclusive).
    """
    if today is None:
        today = date.today()

    if isinstance(card, MedicalCard):
        exp_date = card.parsed_expiry_date
        if exp_date is None and card.expiry:
            exp_date, _ = parse_expiry(card.expiry)
        if exp_date is not None:
            days_left = (exp_date - today).days
            return 0 <= days_left <= 30
        return False
    else:
        due = card.due_date
        if due is None and (card.due_in_days is not None or card.due_date_text):
            due, _ = compute_due_date(card.due_in_days, card.due_date_text, today)
        if due is not None:
            days_left = (due - today).days
            return 0 <= days_left <= 2
        return False

