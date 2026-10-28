import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional
import requests
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
DEFAULT_SENDER = os.getenv("SMTP_SENDER", SMTP_USER or "noreply@dukaandiary.com")

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_DEFAULT_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")


def send_customer_email(
    to_email: str,
    card_data: Dict[str, Any],
    shop_name: str = "Dukaan Diary"
) -> Dict[str, Any]:
    """Sends an order confirmation / balance due email to the customer.
    Falls back gracefully and logs if SMTP credentials are not yet configured.
    """
    if not to_email:
        return {"status": "error", "message": "No customer email provided."}

    person = card_data.get("person", "Valued Customer")
    item = card_data.get("item", "Service / Order")
    amount = card_data.get("amount", 0.0)
    advance = card_data.get("advance", 0.0)
    balance = card_data.get("balance_due", amount - advance)
    due_date = card_data.get("due_date", "Soon")

    subject = f"Order Confirmation: {item} - {shop_name}"

    body_html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0;">{shop_name}</h2>
            <p style="margin: 5px 0 0 0;">Voice-Powered Shop Order</p>
          </div>
          <div style="padding: 24px;">
            <p>Hello <b>{person}</b>,</p>
            <p>Your order details have been recorded successfully:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b;">Item / Service:</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">{item}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b;">Total Amount:</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">₹{amount}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b;">Advance Paid:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #16a34a; text-align: right;">₹{advance}</td>
              </tr>
              <tr style="border-bottom: 2px solid #e2e8f0;">
                <td style="padding: 8px 0; font-weight: bold;">Balance Due:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #dc2626; text-align: right;">₹{balance}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Ready / Delivery Date:</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">{due_date}</td>
              </tr>
            </table>
            <p style="font-size: 14px; color: #64748b;">Thank you for your business!</p>
          </div>
        </div>
      </body>
    </html>
    """

    if not SMTP_USER or not SMTP_PASS:
        # SMTP credentials not provided in .env - log simulated delivery
        print(f"[Simulated Email] Sent to {to_email}: Subject: {subject}, Balance: ₹{balance}")
        return {
            "status": "simulated",
            "message": f"Email queued and simulated to {to_email} (Configure SMTP_USER & SMTP_PASS in .env for live sending).",
            "to": to_email,
            "subject": subject
        }

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = DEFAULT_SENDER
        msg["To"] = to_email
        msg.attach(MIMEText(body_html, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(DEFAULT_SENDER, [to_email], msg.as_string())

        return {"status": "success", "message": f"Email successfully sent to {to_email}."}
    except Exception as e:
        return {"status": "error", "message": f"SMTP error: {str(e)}"}


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

