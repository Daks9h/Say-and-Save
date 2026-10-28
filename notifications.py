import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional
import requests
from dotenv import load_dotenv

load_dotenv()

# Resend API Configuration
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_FROM = os.getenv("RESEND_FROM", "Dukaan Diary <onboarding@resend.dev>")

# TextBee SMS Gateway Configuration
TEXTBEE_API_KEY = os.getenv("TEXTBEE_API_KEY", "")
TEXTBEE_DEVICE_ID = os.getenv("TEXTBEE_DEVICE_ID", "")

# Fallback SMTP Configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
DEFAULT_SENDER = os.getenv("SMTP_SENDER", SMTP_USER or "noreply@dukaandiary.com")

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_DEFAULT_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")


def send_owner_order_card(
    owner_email: str,
    card_data: Dict[str, Any],
    shop_name: str = "Dukaan Diary"
) -> Dict[str, Any]:
    """Sends a concise info card to the shopkeeper's registered email via Resend API
    highlighting pending balance dues, delivery deadlines, and critical specifications.
    """
    if not owner_email:
        return {"status": "error", "message": "No owner email registered."}

    order_id = card_data.get("id") or "New"
    person = card_data.get("person", "Customer")
    item = card_data.get("item", "Service / Order")
    amount = float(card_data.get("amount") or 0.0)
    advance = float(card_data.get("advance") or 0.0)
    balance = float(card_data.get("balance_due") or (amount - advance))
    due_date = card_data.get("due_date") or "No deadline set"
    shop_type = card_data.get("shop_type", "shop").capitalize()
    notes = card_data.get("notes", "")

    subject = f"[Dukaan Diary Alert] Order #{order_id} Due: {person} | Collect ₹{balance:,.0f}"

    # Build occupation specific highlight rows
    extra_details = ""
    measurements = card_data.get("measurements") or {}
    if isinstance(measurements, dict) and measurements:
        specs = ", ".join([f"{k}: {v}" for k, v in measurements.items()])
        extra_details += f"<tr><td style='padding: 6px 0; color: #64748b;'>Specifications:</td><td style='padding: 6px 0; font-weight: bold; text-align: right;'>{specs}</td></tr>"

    if card_data.get("chest") or card_data.get("waist"):
        extra_details += f"<tr><td style='padding: 6px 0; color: #64748b;'>Measurements:</td><td style='padding: 6px 0; font-weight: bold; text-align: right;'>Chest: {card_data.get('chest')}\", Waist: {card_data.get('waist')}\"</td></tr>"
    if card_data.get("expiry"):
        extra_details += f"<tr><td style='padding: 6px 0; color: #dc2626;'>Medicine Expiry:</td><td style='padding: 6px 0; font-weight: bold; color: #dc2626; text-align: right;'>{card_data.get('expiry')}</td></tr>"
    if card_data.get("flavour") or card_data.get("weight_kg"):
        extra_details += f"<tr><td style='padding: 6px 0; color: #64748b;'>Cake Spec:</td><td style='padding: 6px 0; font-weight: bold; text-align: right;'>{card_data.get('flavour')}, {card_data.get('weight_kg')} kg</td></tr>"

    body_html = f"""
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 20px; margin: 0;">
        <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          
          <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #ffffff; padding: 16px 20px;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.85;">{shop_name} &bull; {shop_type} Alert</div>
            <h2 style="margin: 4px 0 0 0; font-size: 18px; font-weight: bold;">Order #{order_id} &bull; {person}</h2>
          </div>

          <div style="padding: 20px;">
            <!-- Pending Date Highlight Pill -->
            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
              <div style="font-size: 11px; font-weight: bold; color: #b91c1c; text-transform: uppercase;">Delivery Deadline</div>
              <div style="font-size: 16px; font-weight: 800; color: #dc2626; margin-top: 2px;">{due_date}</div>
            </div>

            <!-- Financial Card Grid -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px;">
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 6px 0; color: #64748b;">Item / Work:</td>
                <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #0f172a;">{item}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 6px 0; color: #64748b;">Total Amount:</td>
                <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #0f172a;">₹{amount:,.0f}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 6px 0; color: #64748b;">Advance Received:</td>
                <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #16a34a;">₹{advance:,.0f}</td>
              </tr>
              <tr style="border-bottom: 2px solid #e2e8f0;">
                <td style="padding: 8px 0; font-weight: bold; color: #dc2626;">Balance to Collect:</td>
                <td style="padding: 8px 0; font-weight: 800; font-size: 15px; text-align: right; color: #dc2626;">₹{balance:,.0f}</td>
              </tr>
              {extra_details}
            </table>

            {f'<div style="background: #f8fafc; border-left: 3px solid #6366f1; padding: 8px 12px; border-radius: 4px; font-size: 12px; color: #475569; margin-bottom: 16px;"><strong>Voice Note:</strong> "{notes}"</div>' if notes else ''}

            <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
              Sent to registered owner email: <b>{owner_email}</b> via Resend API
            </p>
          </div>
        </div>
      </body>
    </html>
    """

    # 1. Primary path: Resend REST API
    resend_key = os.getenv("RESEND_API_KEY", RESEND_API_KEY)
    resend_from = os.getenv("RESEND_FROM", RESEND_FROM)
    if resend_key:
        try:
            url = "https://api.resend.com/emails"
            headers = {
                "Authorization": f"Bearer {resend_key}",
                "Content-Type": "application/json",
            }
            payload = {
                "from": resend_from,
                "to": [owner_email],
                "subject": subject,
                "html": body_html,
            }
            resp = requests.post(url, json=payload, headers=headers, timeout=10)
            if resp.status_code in (200, 201):
                res_data = resp.json()
                print(f"[Resend API Success] Email sent to {owner_email} (ID: {res_data.get('id')})")
                return {
                    "status": "success",
                    "message": f"Owner alert card sent to {owner_email} via Resend.",
                    "id": res_data.get("id"),
                    "provider": "resend",
                }
            else:
                print(f"[Resend API Error {resp.status_code}] {resp.text}")
                return {
                    "status": "error",
                    "message": f"Resend API error ({resp.status_code}): {resp.text}",
                    "provider": "resend",
                }
        except Exception as e:
            return {"status": "error", "message": f"Resend network error: {str(e)}", "provider": "resend"}

    # 2. Fallback: SMTP if configured
    if SMTP_USER and SMTP_PASS:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = DEFAULT_SENDER
            msg["To"] = owner_email
            msg.attach(MIMEText(body_html, "html"))

            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASS)
                server.sendmail(DEFAULT_SENDER, [owner_email], msg.as_string())

            return {"status": "success", "message": f"Owner alert card sent to {owner_email} via SMTP.", "provider": "smtp"}
        except Exception as e:
            return {"status": "error", "message": f"SMTP error: {str(e)}", "provider": "smtp"}

    # 3. Simulated fallback when keys are not set
    print(f"[Simulated Owner Email via Resend] To: {owner_email} | Subject: {subject} | Balance: ₹{balance} | Due: {due_date}")
    return {
        "status": "simulated",
        "message": f"Owner order alert card queued to {owner_email} (Add RESEND_API_KEY to .env for live dispatch).",
        "to": owner_email,
        "subject": subject,
        "provider": "simulated",
    }


def send_owner_sms(
    owner_phone: str,
    card_data: Dict[str, Any],
    shop_name: str = "Dukaan Diary"
) -> Dict[str, Any]:
    """Sends an SMS notification via TextBee gateway to the shopkeeper's registered phone."""
    if not owner_phone:
        return {"status": "error", "message": "No owner phone registered."}

    order_id = card_data.get("id") or "New"
    person = card_data.get("person", "Customer")
    item = card_data.get("item", "Order")
    amount = float(card_data.get("amount") or 0.0)
    advance = float(card_data.get("advance") or 0.0)
    balance = float(card_data.get("balance_due") or (amount - advance))
    due_date = card_data.get("due_date") or "Pending"

    sms_text = (
        f"[{shop_name}] Order #{order_id} recorded for {person} ({item}). "
        f"Balance Due: Rs.{balance:,.0f}. Delivery Deadline: {due_date}. "
        f"Collect balance on delivery."
    )

    clean_phone = owner_phone.strip().replace(" ", "").replace("-", "")

    # 1. Primary path: TextBee SMS Gateway API
    textbee_key = os.getenv("TEXTBEE_API_KEY", TEXTBEE_API_KEY)
    textbee_device_id = os.getenv("TEXTBEE_DEVICE_ID", TEXTBEE_DEVICE_ID)
    if textbee_key:
        target_device_id = textbee_device_id
        # Auto-discover device ID if not explicitly specified in .env
        if not target_device_id:
            try:
                dev_resp = requests.get(
                    "https://api.textbee.dev/api/v1/gateway/devices",
                    headers={"x-api-key": textbee_key},
                    timeout=5
                )
                if dev_resp.status_code == 200:
                    dev_data = dev_resp.json().get("data", [])
                    if dev_data and len(dev_data) > 0:
                        first_dev = dev_data[0]
                        target_device_id = first_dev.get("id") or first_dev.get("_id")
                    else:
                        return {
                            "status": "warning",
                            "message": "TextBee API key authenticated, but no Android device is linked yet. Link your phone in textbee.dev to send live SMS.",
                            "provider": "textbee"
                        }
            except Exception as e:
                pass

        if target_device_id:
            try:
                url = f"https://api.textbee.dev/api/v1/gateway/devices/{target_device_id}/send-sms"
                headers = {
                    "x-api-key": textbee_key,
                    "Content-Type": "application/json",
                }
                payload = {
                    "recipients": [clean_phone],
                    "message": sms_text,
                }
                resp = requests.post(url, json=payload, headers=headers, timeout=10)
                if resp.status_code in (200, 201):
                    res_data = resp.json() if resp.text else {}
                    print(f"[TextBee SMS Success] Dispatched to {clean_phone}")
                    return {
                        "status": "success",
                        "message": f"SMS alert sent to {clean_phone} via TextBee.",
                        "provider": "textbee",
                        "data": res_data,
                    }
                else:
                    print(f"[TextBee SMS Error {resp.status_code}] {resp.text}")
                    return {
                        "status": "error",
                        "message": f"TextBee API error ({resp.status_code}): {resp.text}",
                        "provider": "textbee",
                    }
            except Exception as e:
                return {"status": "error", "message": f"TextBee network error: {str(e)}", "provider": "textbee"}

    # 2. Simulated fallback when keys are not set
    print(f"[Simulated Owner SMS via TextBee] To: {clean_phone} | Message: {sms_text}")
    return {
        "status": "simulated",
        "message": f"SMS notification queued to {clean_phone} (Add TEXTBEE_API_KEY and TEXTBEE_DEVICE_ID to .env for live SMS).",
        "phone": clean_phone,
        "sms_text": sms_text,
        "provider": "simulated",
    }


def send_customer_email(
    to_email: str,
    card_data: Dict[str, Any],
    shop_name: str = "Dukaan Diary"
) -> Dict[str, Any]:
    """Sends an order confirmation / balance due email to the customer using Resend (or SMTP fallback)."""
    return send_owner_order_card(to_email, card_data, shop_name=shop_name)


def send_telegram_alert(
    message: str,
    chat_id: Optional[str] = None
) -> Dict[str, Any]:
    """Sends a notification message to Telegram."""
    target_chat = chat_id or TELEGRAM_DEFAULT_CHAT_ID
    if not TELEGRAM_BOT_TOKEN or not target_chat:
        print(f"[Simulated Telegram] {message}")
        return {
            "status": "simulated",
            "message": "Telegram message logged (Add TELEGRAM_BOT_TOKEN & TELEGRAM_CHAT_ID to .env for live sending)."
        }

    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        resp = requests.post(url, json={"chat_id": target_chat, "text": message, "parse_mode": "HTML"}, timeout=5)
        if resp.status_code == 200:
            return {"status": "success", "message": "Telegram notification delivered."}
        return {"status": "error", "message": f"Telegram API returned {resp.status_code}: {resp.text}"}
    except Exception as e:
        return {"status": "error", "message": f"Telegram error: {str(e)}"}
