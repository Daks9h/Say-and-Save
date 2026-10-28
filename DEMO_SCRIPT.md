# Dukaan Diary: 2-Minute Hackathon Demo Script

> **Goal:** Showcase the local-first voice notebook in under 2 minutes. Clear, compelling, and impossible to fail on demo day.

---

## ⏱️ Video / Live Pitch Outline (Total: 2 Minutes)

### 0:00 - 0:25 &bull; The Problem (Hook)
- *"Over 12 million small shop owners in India—tailors, medical store chemists, and local bakers—operate single-handedly. When a customer walks in, the shopkeeper's hands are occupied holding chalk, fabric, or pill strips. They don't have time to type into complicated POS or ERP software. Orders are scribbled on scraps of paper or forgotten."*
- *"We built **Dukaan Diary (दुकान डायरी)**: a voice-first, local-first notebook that listens to spoken notes in natural Hinglish or English and instantly turns them into structured order cards with automated ledger tracking."*

---

### 0:25 - 1:00 &bull; Demo 1: The Tailor Shop (Voice Entry & Deterministic Math)
1. **Show the Screen:** Open `http://localhost:3000` with the **Tailor (दर्जी)** pack selected.
2. **Action:** Click **"Click to Speak"** (or use the *"Load sample note"* button).
3. **Speak:**  
   > *"Sunita bhabhi ka suit, chest 36, waist 30, kal tak chahiye, advance 300, total 900"*
4. **Highlight to Judges:**
   - Notice the **engine badge**: processed in real-time.
   - **Deterministic Python calculations:** The AI did **not** do the math or invent dates. Plain Python computed:
     - `Balance Due = ₹600` (₹900 total - ₹300 advance).
     - `Due Date = Tomorrow` (from spoken *"kal tak"*).
   - **Human Confirmation Gate:** The card is editable so the owner can verify names before saving.
   - Click **"Confirm & Save Order"**.

---

### 1:00 - 1:30 &bull; Demo 2: The Medical Store (Safety & Expiry Alerts)
1. **Switch Shop Type:** Select **Medical Store (दवाखाना)** from the dropdown.
2. **Action:** Speak or load:
   > *"Amoxicillin capsule, batch AM12, expiry 01/2020, 30 units, total 450"*
3. **Highlight to Judges:**
   - Point out the **Amber Warning Pill**:  
     `⚠️ Expiry: Medicine has already expired on 2020-01-31`
   - Explain: *"Dukaan Diary treats model output as untrusted input. Our Python safety layer validates dates, ranges, and leap-year months to protect shopkeepers from critical errors."*

---

### 1:30 - 1:50 &bull; Demo 3: Notifications & The "Needs Attention" Ledger
1. **Show Customer Invoice:**
   - Toggle *"Send Email Bill"* with `customer@email.com`.
   - Show the generated HTML order receipt with advance, balance due, and delivery date.
2. **Filter Ledger:**
   - Click the **"⚠️ Needs Attention"** tab on the right ledger.
   - Show orders due within 2 days or medicines expiring within 30 days automatically surfaced for action.
   - Click **"Mark Done"** with the green checkmark.

---

### 1:50 - 2:00 &bull; Wrap-Up (Why Open-Source AI Matters)
- *"Dukaan Diary runs 100% offline and private on the shopkeeper's PC using local **Gemma 4** through Ollama, with zero cloud fees. When higher speed is needed on low-end hardware, our speed-first router can seamlessly leverage **Google Gemini** with instant local failover."*
- *"Real utility. Zero hallucinations. Built for the heartbeat of local retail."*

---

## 🎒 Backup Test Notes (If Mic is Not Available)
- **Tailor:** `Ramesh Kumar pant and shirt, chest 38, waist 32, 5 din mein, advance 500, total 1500`
- **Bakery:** `Happy Birthday Aryan chocolate cake, 1.5 kg, advance 200, total 600, due in 2 days`
- **Medical:** `Paracetamol 500mg, batch B204, expiry 12/2027, 50 units, amount 250`
