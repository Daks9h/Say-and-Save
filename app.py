import os
import shutil
import tempfile
from datetime import date
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import config
import db
from router import Router
from backends.local import LocalBackend
from backends.cloud import CloudBackend
from packs import ShopType, get_card_model, validate_card, needs_attention, balance_due
from notifications import (
    send_customer_email,
    send_telegram_alert,
    send_owner_order_card,
    send_owner_sms,
)

# Initialize Database
db.init_db()

# Initialize Backend Router
local_backend = LocalBackend()
cloud_backend = None
try:
    cloud_backend = CloudBackend()
except Exception as e:
    print(f"CloudBackend init warning: {e}")

router = Router(local_backend=local_backend, cloud_backend=cloud_backend)

# Fast Warmup
try:
    local_backend.warm_up()
except Exception:
    pass

app = FastAPI(title="Dukaan Diary API", version="1.0.0")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "project": config.PROJECT_NAME,
        "local_model": config.LOCAL_MODEL,
        "cloud_model": config.CLOUD_MODEL,
        "cloud_consent": config.CLOUD_CONSENT,
        "preferred_backend": router.current_preferred,
        "last_used_backend": router.last_used_backend,
        "last_latency_ms": router.last_latency_ms,
        "router_mode": router.manual_mode,
        "local_rolling_median_ms": router.get_rolling_median("local"),
        "cloud_rolling_median_ms": router.get_rolling_median("cloud"),
    }


@app.get("/config")
def get_config():
    return {
        "project_name": config.PROJECT_NAME,
        "currency": config.CURRENCY,
        "currency_symbol": config.CURRENCY_SYMBOL,
        "unit_measurement": config.UNIT_MEASUREMENT,
        "unit_weight": config.UNIT_WEIGHT,
        "cloud_consent": config.CLOUD_CONSENT,
        "manual_mode": router.manual_mode,
        "current_preferred": router.current_preferred,
        "accuracy_gate_passed": router.accuracy_gate_passed,
        "cloud_cooldown_active": router.cloud_cooldown_until > 0,
        "flags": {
            "AUTO_EXTRACT": config.AUTO_EXTRACT,
            "GROUNDING_CHECK": config.GROUNDING_CHECK,
            "FUZZY_NAME_MATCH": config.FUZZY_NAME_MATCH,
            "AUDIO_NORMALIZE": config.AUDIO_NORMALIZE,
        }
    }


class ConfigUpdate(BaseModel):
    cloud_consent: Optional[bool] = None
    manual_mode: Optional[str] = None  # "auto", "local", "cloud"


@app.post("/config")
def update_config(update: ConfigUpdate):
    if update.cloud_consent is not None:
        config.CLOUD_CONSENT = update.cloud_consent
    if update.manual_mode in ("auto", "local", "cloud"):
        router.manual_mode = update.manual_mode
    return get_config()


@app.post("/process-audio")
async def process_audio(
    file: UploadFile = File(...),
    shop_type: str = Form("tailor"),
    mode: Optional[str] = Form(None),
    auto_save: bool = Form(True),
    owner_email: Optional[str] = Form(None),
    owner_phone: Optional[str] = Form(None),
    customer_email: Optional[str] = Form(None),
    customer_phone: Optional[str] = Form(None),
    send_email: bool = Form(False),
    send_telegram: bool = Form(False),
):
    """Takes uploaded audio, executes routing (transcription + structured extraction in clean English),
    applies Python validation, and automatically creates the flashcard in SQLite ledger when auto_save=True.
    """
    try:
        st = ShopType(shop_type.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid shop_type: {shop_type}")

    # Set temporary mode override if specified
    if mode in ("auto", "local", "cloud"):
        router.manual_mode = mode

    suffix = os.path.splitext(file.filename or "temp.wav")[1] or ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        card, transcript, backend_used, timings, warnings = router.process(tmp_path, st)
        card_dict = card.model_dump(mode="json")
        card_dict["needs_attention"] = needs_attention(card)

        card_id = None
        notifications_sent = {}

        if auto_save:
            card_id = db.save_card(
                card_data=card_dict,
                backend_used=backend_used,
                used_cloud=(backend_used == "cloud"),
                customer_email=customer_email,
                customer_phone=customer_phone,
            )
            card_dict["id"] = card_id

            # Dispatch owner notifications if credentials provided
            if owner_email:
                email_res = send_owner_order_card(owner_email, card_dict, shop_name=config.PROJECT_NAME)
                notifications_sent["owner_email"] = email_res

            if owner_phone:
                sms_res = send_owner_sms(owner_phone, card_dict, shop_name=config.PROJECT_NAME)
                notifications_sent["owner_sms"] = sms_res

            if send_email and customer_email:
                email_res = send_customer_email(customer_email, card_dict, shop_name=config.PROJECT_NAME)
                notifications_sent["customer_email"] = email_res

            if send_telegram:
                msg = f"<b>New {st.value.capitalize()} Order #{card_id}</b>\n" \
                      f"Person: {card_dict.get('person')}\n" \
                      f"Item: {card_dict.get('item')}\n" \
                      f"Total: ₹{card_dict.get('amount')}, Advance: ₹{card_dict.get('advance')}\n" \
                      f"Balance Due: ₹{card_dict.get('balance_due')}\n" \
                      f"Due Date: {card_dict.get('due_date')}"
                tg_res = send_telegram_alert(msg)
                notifications_sent["telegram"] = tg_res

        return {
            "status": "auto_saved" if auto_save else "extracted",
            "card_id": card_id,
            "transcript": transcript,
            "backend_used": backend_used,
            "used_cloud": backend_used == "cloud",
            "card": card_dict,
            "warnings": warnings,
            "timings": timings,
            "notifications": notifications_sent,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


class ExtractRequest(BaseModel):
    transcript: str
    shop_type: str = "tailor"
    backend: Optional[str] = None  # "local", "cloud", or None (auto)


@app.post("/extract")
def extract_from_text(req: ExtractRequest):
    """Re-extracts structured card from edited transcript text."""
    try:
        st = ShopType(req.shop_type.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid shop_type: {req.shop_type}")

    backend_to_use = req.backend or router.select_backend()
    target = router.cloud if (backend_to_use == "cloud" and router.cloud) else router.local

    try:
        card, raw_json, timings, warnings = target.extract(req.transcript, st)
        card_dict = card.model_dump(mode="json")
        card_dict["needs_attention"] = needs_attention(card)
        return {
            "backend_used": backend_to_use,
            "used_cloud": backend_to_use == "cloud",
            "card": card_dict,
            "warnings": warnings,
            "timings": timings,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/cards")
def get_cards(
    status: Optional[str] = Query(None),
    shop_type: Optional[str] = Query(None),
    q: Optional[str] = Query(None)
):
    """Returns stored cards from SQLite."""
    cards = db.list_cards(status=status, shop_type=shop_type, person_query=q)
    # Check needs_attention for each card
    for c in cards:
        c_json = c.get("parsed_card", {})
        try:
            model_cls = get_card_model(c["shop_type"])
            card_obj = model_cls(**c_json)
            c["needs_attention"] = needs_attention(card_obj)
        except Exception:
            c["needs_attention"] = False
    return cards


class SaveCardRequest(BaseModel):
    card: Dict[str, Any]
    backend_used: str = "local"
    used_cloud: bool = False
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    send_email: bool = False
    send_telegram: bool = False


@app.post("/cards")
def create_card(req: SaveCardRequest):
    """Confirmed save endpoint: saves validated card to SQLite and dispatches notifications."""
    card_id = db.save_card(
        card_data=req.card,
        backend_used=req.backend_used,
        used_cloud=req.used_cloud,
        customer_email=req.customer_email,
        customer_phone=req.customer_phone
    )

    notifications_sent = {}

    if req.send_email and req.customer_email:
        email_res = send_customer_email(req.customer_email, req.card, shop_name=config.PROJECT_NAME)
        notifications_sent["email"] = email_res

    if req.send_telegram:
        msg = f"<b>New {req.card.get('shop_type', '').capitalize()} Order #{card_id}</b>\n" \
              f"Person: {req.card.get('person')}\n" \
              f"Item: {req.card.get('item')}\n" \
              f"Total: ₹{req.card.get('amount')}, Advance: ₹{req.card.get('advance')}\n" \
              f"Due: {req.card.get('due_date')}"
        tg_res = send_telegram_alert(msg)
        notifications_sent["telegram"] = tg_res

    return {
        "status": "saved",
        "card_id": card_id,
        "notifications": notifications_sent
    }


@app.get("/cards/{card_id}")
def get_card_endpoint(card_id: int):
    c = db.get_card(card_id)
    if not c:
        raise HTTPException(status_code=404, detail="Card not found")
    c_json = c.get("parsed_card", {})
    try:
        model_cls = get_card_model(c["shop_type"])
        card_obj = model_cls(**c_json)
        c["needs_attention"] = needs_attention(card_obj)
    except Exception:
        c["needs_attention"] = False
    return c


class UpdateCardRequest(BaseModel):
    card: Dict[str, Any]
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    send_email: bool = False
    send_telegram: bool = False


@app.put("/cards/{card_id}")
def update_card_endpoint(card_id: int, req: UpdateCardRequest):
    card_data = dict(req.card)
    
    # Python deterministic math for amounts
    amt = float(card_data.get("amount") or 0.0)
    adv = float(card_data.get("advance") or 0.0)
    card_data["balance_due"] = balance_due(amt, adv)

    if req.customer_email:
        card_data["customer_email"] = req.customer_email
    if req.customer_phone:
        card_data["customer_phone"] = req.customer_phone

    success = db.update_card(card_id, card_data)
    if not success:
        raise HTTPException(status_code=404, detail="Card not found")

    notifications_sent = {}
    if req.send_email and req.customer_email:
        email_res = send_customer_email(req.customer_email, card_data, shop_name=config.PROJECT_NAME)
        notifications_sent["email"] = email_res

    if req.send_telegram:
        msg = f"<b>Updated Order #{card_id}</b>\n" \
              f"Person: {card_data.get('person')}\n" \
              f"Item: {card_data.get('item')}\n" \
              f"Total: ₹{card_data.get('amount')}, Advance: ₹{card_data.get('advance')}\n" \
              f"Balance Due: ₹{card_data.get('balance_due')}\n" \
              f"Due Date: {card_data.get('due_date')}"
        tg_res = send_telegram_alert(msg)
        notifications_sent["telegram"] = tg_res

    updated_card = db.get_card(card_id)
    return {
        "status": "updated",
        "card_id": card_id,
        "card": updated_card.get("parsed_card", card_data),
        "notifications": notifications_sent
    }


@app.put("/cards/{card_id}/done")
def complete_card(card_id: int):
    success = db.mark_done(card_id)
    if not success:
        raise HTTPException(status_code=404, detail="Card not found")
    return {"status": "success", "card_id": card_id}


@app.delete("/cards/{card_id}")
def remove_card(card_id: int):
    success = db.delete_card(card_id)
    if not success:
        raise HTTPException(status_code=404, detail="Card not found")
    return {"status": "deleted", "card_id": card_id}


@app.get("/customers")
def get_customers(shop_type: Optional[str] = Query(None)):
    return db.list_people(shop_type=shop_type)


@app.get("/customers/{person_name}/latest")
def get_latest_customer_card(person_name: str, shop_type: Optional[str] = Query(None)):
    card = db.latest_card_for_person(person_name, shop_type=shop_type)
    if not card:
        raise HTTPException(status_code=404, detail="No previous card found for customer")
    return card


class NotificationRequest(BaseModel):
    card: Dict[str, Any]
    owner_email: Optional[str] = None
    owner_phone: Optional[str] = None
    email: Optional[str] = None
    telegram: bool = False


@app.post("/notify")
def trigger_notification(req: NotificationRequest):
    results = {}
    target_email = req.owner_email or req.email
    if target_email:
        results["email"] = send_owner_order_card(target_email, req.card, shop_name=config.PROJECT_NAME)
    if req.owner_phone:
        results["sms"] = send_owner_sms(req.owner_phone, req.card, shop_name=config.PROJECT_NAME)
    if req.telegram:
        msg = f"<b>Order Alert</b>: {req.card.get('person')} - {req.card.get('item')} (Balance: ₹{req.card.get('balance_due')}, Due: {req.card.get('due_date')})"
        results["telegram"] = send_telegram_alert(msg)
    return results
