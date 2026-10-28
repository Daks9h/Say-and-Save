# Dukaan Diary (दुकान डायरी)

> **Voice-Powered Order Notebook and Ledger for Local Indian Shops**  
> *Built for Hacktoberfest Open-Source AI Challenge*

Dukaan Diary turns spoken voice notes into clean, validated customer order cards with zero typing. Designed for small single-person shops—such as tailors, chemists, and bakers—who are too busy attending customers to type into complex billing software.

---

## 🌟 Key Capabilities

1. **Voice-First Order Entry**: Speak naturally in English or Hinglish:
   > *"Sunita bhabhi blouse, chest 36, waist 30, 5 din mein chahiye, advance 300, total 900"*
2. **Speed-First Hybrid Routing**:
   - **Local Mode (Default)**: Uses local `gemma4:e2b` running via Ollama. 100% offline, zero cloud fees, and private.
   - **Cloud Mode (Optional)**: Uses Google `gemini-3.5-flash-lite` for sub-second text extraction when cloud consent is enabled.
   - **Instant Failover**: If the cloud API errors or hits 429 rate limits, it automatically fails over to the local model with a 60-second cooldown.
3. **Strict Safety & Verification (AI Never Computes Math or Dates)**:
   - The AI model only extracts spoken entities.
   - All financial balances (`balance_due = amount - advance`), due dates (`kal`, `parso`, `5 din mein`), and leap-year expiry dates are computed deterministically in **plain Python**.
   - Model proposes $\rightarrow$ Python validates range bounds $\rightarrow$ Shopkeeper reviews and confirms before anything is saved.
4. **Tailored Shop Packs**:
   - ✂️ **Tailor**: Chest, waist, shoulder, length in inches (10–70 in bounds), and customer measurement memory.
   - 💊 **Medical Store**: Batch number, expiry date (MM/YYYY), unit counts, and automatic alerts for medicines expiring within 30 days.
   - 🎂 **Bakery & Cakes**: Flavour, cake message, and weight limits (0.25 kg to 20 kg).
   - 🔧 **Repair Shop & 🧺 Laundry**: Configurable experimental packs.
5. **Customer Notifications**:
   - Instant HTML invoice emails to customers detailing advance paid, balance due, and ready date.
   - Telegram notifications for shop owners.
6. **Needs Attention Dashboard**:
   - Real-time highlights of urgent orders due within 2 days or medicines nearing expiry.

---

## 🚀 Quick Start (1-Click Run)

### Prerequisites
- **Python**: 3.12+
- **Node.js**: v18+
- **Ollama**: Installed with `ollama pull gemma4:e2b`

### Run Both Servers in 1 Command
```bash
# Clone the repository and navigate into the folder
cd niat-sgsu

# Install python dependencies
pip install -r requirements.txt

# Start both FastAPI Backend (:8000) and Next.js Argon Frontend (:3000)
python start_app.py
```

Open your browser at **`http://localhost:3000`**.

---

## 🛠️ Architecture

```
                                ┌───────────────────────────────────────┐
                                │       Next.js Argon Dashboard         │
                                │   (Audio recorder, Order review,      │
                                │    Needs-Attention ledger, Search)    │
                                └───────────────────┬───────────────────┘
                                                    │ REST API
                                                    ▼
                                ┌───────────────────────────────────────┐
                                │         FastAPI Python Engine         │
                                │   (/process-audio, /extract, /cards)  │
                                └───────────────────┬───────────────────┘
                                                    │
                                     ┌──────────────┴──────────────┐
                                     ▼                             ▼
                        ┌─────────────────────────┐   ┌─────────────────────────┐
                        │   Local Backend (Ollama)│   │   Cloud Backend (Gemini)│
                        │        gemma4:e2b       │   │   gemini-3.5-flash-lite │
                        │  (100% Offline/Private) │   │  (High-Speed Fallback)  │
                        └────────────┬────────────┘   └────────────┬────────────┘
                                     └──────────────┬──────────────┘
                                                    │
                                                    ▼
                                ┌───────────────────────────────────────┐
                                │       Python Verification Gate        │
                                │  - Pydantic Schema Validation         │
                                │  - Range bounds (10-70 in, 0.25-20kg) │
                                │  - Deterministic Date & Math Calc     │
                                │  - Grounding Check ("not heard" alert)│
                                └───────────────────┬───────────────────┘
                                                    │
                                                    ▼
                                ┌───────────────────────────────────────┐
                                │          SQLite (dukaan.db)           │
                                │   + Email & Telegram Notifications    │
                                └───────────────────────────────────────┘
```

---

## ⏱️ Measured Performance & Latency

From [`LATENCY_REPORT.md`](file:///c:/Users/ADMIN/Desktop/niat-sgsu/LATENCY_REPORT.md) and [`PREFLIGHT.md`](file:///c:/Users/ADMIN/Desktop/niat-sgsu/PREFLIGHT.md) on an RTX 3050 Laptop / Intel Core i5:

| Pipeline Stage | Local Backend (`gemma4:e2b`) | Cloud Backend (`gemini-3.5-flash-lite`) |
|---|---|---|
| Audio Transcription | `2,298 ms` | `2,162 ms` |
| Structured Extraction | `4,030 ms` | `1,053 ms` |
| Python Validation | `0.06 ms` | `0.06 ms` |
| Grounding Check | `0.02 ms` | `0.02 ms` |
| Total Post-Response Overhead | **< 0.1 ms** (Budget: 50 ms) | **< 0.1 ms** (Budget: 50 ms) |

---

## 🔒 Honest Claims & Known Limitations

- **Privacy & Offline Guarantee:** Runs fully on the shop's own computer when cloud mode is OFF. No voice data or customer records leave the machine in Local Mode.
- **Cloud Mode Notice:** When Cloud Mode is toggled ON by the user, audio recordings are sent to the Google Gemini API to accelerate extraction.
- **Hardware Requirement:** Local Gemma 4 requires a decent GPU (e.g., NVIDIA RTX 3050 or higher) or modern multi-core CPU. On low-end shop hardware, Cloud Mode provides high responsiveness.
- **Regional Speech:** Names with regional honorifics or loud background shop noises can occasionally be misheard. The editable preview card and human confirmation button are strictly mandatory to ensure 100% accuracy.

---

## 🧪 Testing

Run all unit tests covering date words, leap-year handling, expiry parsing, and range bounds:
```bash
pytest -v tests/test_core_logic.py
pytest -v tests/test_db.py
```
*(All 15 tests pass in < 0.5s).*

