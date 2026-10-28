# Dukaan Diary (दुकान डायरी): Voice-Powered Flashcard Ledger for Small Business Owners

*Submission for Hacktoberfest Open-Source AI Challenge: Side Hustle Track*

---

## 💡 What I Built

Over 12 million micro-merchants and single-operator shops in India—such as local tailors, chemists, neighborhood bakers, repair shops, and dry cleaners—run their entire livelihood single-handedly. When a customer walks in to give measurements or drop off a repair, the shopkeeper's hands are physically occupied holding fabric, chalk, or soldering irons. They simply don't have the time to type into complicated POS systems or desktop spreadsheets. As a result, critical orders, measurement numbers, advances, and delivery deadlines are scribbled onto scraps of cardboard or lost from memory.

**Dukaan Diary (दुकान डायरी)** solves this with a **voice-first, local-first flashcard notebook and bahi-khata ledger** designed to run right on the shopkeeper's desktop PC.

The shopkeeper speaks naturally into their microphone in Hindi, Hinglish, or English:
> *"Verma uncle suit 5 din mein dena hai, total 1200, advance 500"*

Within **3 to 4 seconds**, Dukaan Diary:
1. Transcribes the spoken audio.
2. Translates and extracts clean, capitalized English entities (`person: "Verma Uncle"`, `item: "Tailoring Service"`).
3. Deterministically computes financial math (`balance_due = 1200 - 500 = ₹700`) and target delivery dates in **pure Python**.
4. **Auto-generates a tactile order flashcard** in the ledger with zero typing.
5. Surfaces an **inline "Edit Flashcard"** button allowing the shopkeeper to tweak measurements, amounts, or customer contacts at any time.
6. Dispatches an instant HTML email invoice to the customer and a Telegram alert to the owner.

---

## 🎥 Demo & Screenshots

### 1-Click Startup
```bash
git clone https://github.com/your-repo/dukaan-diary.git
cd dukaan-diary
pip install -r requirements.txt
python start_app.py
```
Open **`http://localhost:3000`** in any browser.

### Key Workflows Demonstrated
- **Instant Voice-to-Flashcard:** One click on the mic auto-creates the order slip with customer name, item, advance, and remaining balance.
- **English Auto-Fill:** Spoken regional phrasing is cleanly translated and romanized into standard English slip format.
- **Physical Bahi-Khata Flashcard:** Clean receipt slip visualization with real-time balance highlights (bold red for pending amounts, emerald green for paid).
- **Inline Card Editing:** Click "✏️ Edit Flashcard" to adjust measurements, dates, or prices; balances recalculate on the fly.
- **Customer Email Invoices:** Built-in HTML bill generator detailing advance paid, balance due, and delivery date.
- **"Needs Attention" Ledger:** Smart filtering for urgent orders due within 48 hours or medicines nearing expiry.

---

## 🧠 Architecture: Local-First with Speed-First Hybrid Routing

```
                         ┌───────────────────────────────────────────┐
                         │         Next.js Argon UI Dashboard        │
                         │   (Microphone, Auto-Flashcards, Ledger)   │
                         └─────────────────────┬─────────────────────┘
                                               │ HTTP / REST
                                               ▼
                         ┌───────────────────────────────────────────┐
                         │           FastAPI Python Engine           │
                         │    (/process-audio, /cards, /notify)      │
                         └─────────────────────┬─────────────────────┘
                                               │
                                 ┌─────────────┴─────────────┐
                                 ▼                           ▼
                    ┌─────────────────────────┐ ┌─────────────────────────┐
                    │  Local Offline Backend  │ │   Cloud Fast Backend    │
                    │       gemma4:e2b        │ │  gemini-3.5-flash-lite  │
                    │   (100% Private, Free)  │ │   (~3.5s Single-Call)   │
                    └────────────┬────────────┘ └────────────┬────────────┘
                                 └─────────────┬─────────────┘
                                               ▼
                         ┌───────────────────────────────────────────┐
                         │         Python Verification Gate          │
                         │  - Pydantic Schema Validation             │
                         │  - Range bounds (10-70 in, 0.25-20 kg)    │
                         │  - Deterministic Math & Date Compute      │
                         │  - Grounding Check ("not heard" alert)    │
                         └─────────────────────┬─────────────────────┘
                                               ▼
                         ┌───────────────────────────────────────────┐
                         │            SQLite (dukaan.db)             │
                         │      + Email & Telegram Dispatcher        │
                         └───────────────────────────────────────────┘
```

### The Non-Negotiable Safety Gate (AI Never Does Math or Dates)
Language models are notoriously prone to math errors and date hallucinations. Dukaan Diary adheres to a strict separation of concerns:
- **The AI Model's Only Job:** Extract spoken entity words and relative day offsets (`due_in_days: 5`).
- **Python's Strict Job:** 
  - `balance_due = round(amount - advance, 2)`
  - `due_date = today + timedelta(days=due_in_days)`
  - Leap-year month-end expiry parsing (`02/2028` $\rightarrow$ `2028-02-29`)
  - Range validation (measurements between 10" and 70", bakery weights 0.25kg to 20kg).
  - Model proposes $\rightarrow$ Python computes $\rightarrow$ Human confirms & edits.

---

## ⚡ Speed & Latency Benchmarks

Tested on a Windows laptop (Intel Core i5, NVIDIA RTX 3050):

| Stage | Local `gemma4:e2b` | Cloud `gemini-3.5-flash-lite` |
|---|---|---|
| Audio-to-JSON Pipeline | ~21.0s | **~3.5s** |
| Post-Response Python Gate | **< 0.1 ms** | **< 0.1 ms** |
| Database Insert + Flashcard Prep | **1.2 ms** | **1.2 ms** |
| **Total Round-Trip Latency** | ~21.0s | **~3.5s** |

---

## 🛠️ Tech Stack & Open-Source Tools Used

- **Language Model (Local):** Google Gemma 4 (`gemma4:e2b`) served via **Ollama**.
- **Language Model (Cloud Speed-First):** Google Gemini 3.5 Flash Lite (`google-genai` Python SDK).
- **Backend Server:** **FastAPI** (Python 3.12) with Pydantic v2 validation.
- **Frontend Dashboard:** **Next.js 14** (React 18), **Tailwind CSS**, Lucide React.
- **Audio Processing:** Browser `MediaRecorder` API + `ffmpeg` & `soundfile` 16kHz mono normalization.
- **Database:** Local **SQLite3** (`dukaan.db`) with zero external DB dependencies.
- **Notifications:** Python standard library `smtplib` + Telegram Bot API.

---

## 🌍 Why Open-Source AI Matters

Small neighborhood businesses operate under thin margins and intermittent internet. Commercial voice APIs charge per-minute fees that small shopkeepers cannot sustain. 

By building Dukaan Diary around **local-first open weights (Gemma 4)**:
1. **Zero Cost of Goods Sold:** The shopkeeper pays ₹0 per note transcribed locally.
2. **Total Customer Privacy:** Sensitive customer names, phone numbers, and measurements never leave the shopkeeper's hard drive in offline mode.
3. **No Vendor Lock-In:** The entire application runs self-contained from a single Python command.

---

## 🔮 What's Next

- **WhatsApp Invoice Integration:** Automatically send bill summaries over WhatsApp Web.
- **Regional Languages:** Fine-tune local Gemma on Gujarati, Marathi, and Tamil voice vocabulary.
- **Barcode & Camera Integration:** Optical scanning of prescription labels and garment tags.

