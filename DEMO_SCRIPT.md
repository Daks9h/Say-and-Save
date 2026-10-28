# Dukaan Diary: 2-Minute Hackathon Demo Script

> **Goal:** Showcase the local-first voice flashcard notebook in under 2 minutes. Clear, compelling, and impossible to fail on demo day.

---

## ⏱️ Video / Live Pitch Outline (Total: 2 Minutes)

### 0:00 - 0:25 &bull; The Problem (Hook)
- *"Over 12 million small shop owners in India—tailors, medical chemists, and local bakers—operate single-handedly. When a customer walks in, the shopkeeper's hands are occupied holding chalk, fabric, or pill strips. They don't have time to type into complicated POS software. Orders are scribbled on scraps of paper or forgotten."*
- *"We built **Dukaan Diary (दुकान डायरी)**: a voice-first, local-first flashcard notebook that listens to spoken notes in natural Hinglish or English and instantly turns them into structured order flashcards with automated ledger tracking."*

---

### 0:25 - 1:05 &bull; Demo 1: Instant Voice-to-Flashcard & English Auto-Fill
1. **Show the Screen:** Open `http://localhost:3000` with the **Tailor (दर्जी)** pack selected.
2. **Action:** Click **"Click to Speak Order"** (or click *"Test with Sample Note (test.wav)"*).
3. **Speak:**  
   > *"Verma uncle suit 5 din mein dena hai, total 1200, advance 500"*
4. **Highlight to Judges:**
   - Notice the **instant auto-save**: within ~3.5 seconds, the order flashcard is created and saved directly to the database with zero manual steps!
   - **Clean English Conversion:** The AI transcribed the regional speech and auto-filled the customer name (*"Verma Uncle"*) and item (*"Tailoring Service" / "Suit"*) in clean English.
   - **Deterministic Python calculations:** The AI did **not** guess dates or balances. Plain Python computed:
     - `Balance Due = ₹700` (₹1200 total - ₹500 advance).
     - `Due Date = 5 days from today`.
   - **Inline Edit Action:** Click **"✏️ Edit Flashcard"** to demonstrate modifying any field (e.g. changing advance to ₹600, showing balance due update to ₹600 in real time), then click **"Save Changes"**.

---

### 1:05 - 1:35 &bull; Demo 2: Customer Email Bill & The Medical Store Pack
1. **Send Customer Email:**
   - In the flashcard slip, enter customer email (`customer@email.com`) and click **"Email Bill"**.
   - Show the clean HTML receipt with total, advance paid, and balance due.
2. **Switch Shop Type:** Select **Medical Store (दवाखाना)** from the top pack dropdown.
3. **Action:** Speak or load:
   > *"Amoxicillin capsule, batch AM12, expiry 01/2020, 30 units, total 450"*
4. **Highlight to Judges:**
   - Point out the **Amber Warning Pill**:  
     `⚠️ Expiry: Medicine has already expired on 2020-01-31`
   - Explain: *"Dukaan Diary treats model output as untrusted input. Our Python safety layer validates dates, ranges, and leap-year months to protect shopkeepers from critical errors."*

---

### 1:35 - 1:50 &bull; Demo 3: The "Needs Attention" Ledger
1. **Filter Ledger:**
   - Click the **"⚠️ Needs Attention"** tab on the right ledger.
   - Show orders due within 2 days or medicines expiring within 30 days automatically surfaced for action.
   - Click **"Done"** with the green checkmark to complete the order.

---

### 1:50 - 2:00 &bull; Wrap-Up (Why Open-Source AI Matters)
- *"Dukaan Diary runs 100% offline and private on the shopkeeper's PC using local **Gemma 4** through Ollama, with zero cloud fees. When higher speed is needed, our speed-first router can seamlessly leverage **Google Gemini** with instant local failover."*
- *"Real utility. Zero hallucinations. Built for the heartbeat of local retail."*

---

## 🎒 Backup Test Notes (If Mic is Not Available)
- **Tailor:** `Ramesh Kumar pant and shirt, chest 38, waist 32, 5 din mein, advance 500, total 1500`
- **Bakery:** `Happy Birthday Aryan chocolate cake, 1.5 kg, advance 200, total 600, due in 2 days`
- **Medical:** `Paracetamol 500mg, batch B204, expiry 12/2027, 50 units, amount 250`
