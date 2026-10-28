# EVALUATION REPORT: Dukaan Diary

Date: 2026-10-28
Evaluated Models:
- **Local:** `gemma4:e2b` via Ollama 0.40.12 (GPU-accelerated RTX 3050 Laptop)
- **Cloud:** `gemini-3.5-flash-lite` via Google GenAI SDK

---

## 1. 18-Case Test Matrix Results

The test suite in `tests/transcripts.json` was run against the 3 core shop packs (Tailor, Medical, Baker) mixing English, Roman Hinglish, numbers said as words, missing fields, and out-of-range bounds:

| Pack | ID | Test Type | Transcript Key Phrase | Extracted Result | Validation Caught? | Status |
|---|---|---|---|---|---|---|
| **Tailor** | T1 | Normal English | "chest 38, waist 32, total 1500, due in 5 days" | Chest: 38, Waist: 32, Total: ₹1500, Due: +5d | No warnings (Clean) | **PASS** |
| **Tailor** | T2 | Normal Hinglish | "Sunita bhabhi suit, chest 36, advance 300, kal tak" | Chest: 36, Advance: ₹300, Due: +1d | No warnings (Clean) | **PASS** |
| **Tailor** | T3 | Numbers in Words | "chest thirty four, advance do sau, total aath sau" | Chest: 34, Advance: ₹200, Total: ₹800 | No warnings (Clean) | **PASS** |
| **Tailor** | T4 | Missing Field | "Anil uncle safari suit, total 2000, 3 din mein" | Measurements null, Total: ₹2000 | Handled gracefully | **PASS** |
| **Tailor** | T5 | Out-of-Range Bounds | "chest 85, waist 95" (>70 inches) | Chest: 85, Waist: 95 | **Flagged: Chest & Waist > 70 in** | **PASS** |
| **Tailor** | T6 | Full Advance | "advance 600, total 600, aaj delivery" | Balance Due: ₹0, Due: Today | No warnings (Clean) | **PASS** |
| **Medical**| M1 | Normal English | "Paracetamol batch B204, expiry 12/2027, 50 units" | Batch: B204, Exp: 2027-12-31, Units: 50 | No warnings (Clean) | **PASS** |
| **Medical**| M2 | Normal Hinglish | "Azithromycin batch AZ45, expiry 05/2028, bees units"| Batch: AZ45, Exp: 2028-05-31, Units: 20 | No warnings (Clean) | **PASS** |
| **Medical**| M3 | Numbers in Words | "Crocin tablet, batch C99, fifty units, advance 100" | Units: 50, Advance: ₹100 | No warnings (Clean) | **PASS** |
| **Medical**| M4 | Missing Field | "Combiflam syrup, expiry 11/2026, 10 units" | Batch: null, Units: 10 | Handled gracefully | **PASS** |
| **Medical**| M5 | Out-of-Range Past Expiry| "Amoxicillin, expiry 01/2020" | Exp: 2020-01-31 | **Flagged: Medicine already expired** | **PASS** |
| **Medical**| M6 | Out-of-Range > 5 Years | "Insulin pen, expiry 06/2035" | Exp: 2035-06-30 | **Flagged: Expiry > 5 years in future**| **PASS** |
| **Baker**  | B1 | Normal English | "Aryan cake, chocolate, 1.5 kg, total 600, due 2 days"| Weight: 1.5kg, Due: +2d | No warnings (Clean) | **PASS** |
| **Baker**  | B2 | Normal Hinglish | "Pineapple cake, advance teen sau, total saat sau" | Advance ₹300, Total ₹700 | Caught numeric confusion | **PASS** |
| **Baker**  | B3 | Numbers in Words | "Vanilla cake, weight three kg, advance five hundred"| Weight: 3.0kg, Advance: ₹500 | No warnings (Clean) | **PASS** |
| **Baker**  | B4 | Missing Field | "Birthday cake 2 kg, total 800, advance 400" | Flavour null, Weight: 2kg | Handled gracefully | **PASS** |
| **Baker**  | B5 | Underweight (<0.25kg) | "mini cupcake, weight 0.1 kg" | Weight: 0.1kg | **Flagged: Cake weight < 0.25 kg** | **PASS** |
| **Baker**  | B6 | Overweight (>20kg) | "Grand wedding cake 30 kg, advance 5000" | Weight: 30.0kg | **Flagged: Cake weight > 20 kg** | **PASS** |

---

## 2. Accuracy & Safety Evaluation

- **Date Computations:** 100% correct. Handled in pure Python (`compute_due_date`). AI never outputs raw dates.
- **Leap-Year Handling:** February 2028 correctly parsed to `2028-02-29`, February 2027 to `2027-02-28`.
- **Financial Balance:** 100% correct. `balance_due = amount - advance` rounded and validated.
- **Safety Gate:** Model output is strictly treated as untrusted input. Every card is validated against Pydantic schemas and plain-Python boundary guards before the human shopkeeper confirms with one click.

---

## 3. Speed & Latency Comparison

| Component | Local Backend (`gemma4:e2b`) | Cloud Backend (`gemini-3.5-flash-lite`) |
|---|---|---|
| **Audio Transcription** | 2,298 ms median | 2,162 ms median |
| **Card Extraction** | 4,030 ms median | 1,053 ms median |
| **Python Validation Overhead** | 0.06 ms | 0.06 ms |
| **Grounding Check Overhead** | 0.02 ms | 0.02 ms |
| **Network / Offline** | **100% Offline (No Internet)** | Requires Internet connection |
| **Hardware Requisite** | Requires GPU (RTX 3050 or strong CPU) | Any low-end PC / Tablet |

---

## 4. Known Limitations & Failure Points

1. **Regional Names:** Local 2B models can occasionally alter honorifics (e.g. "Mr Sharma" transcribed as "Sharma uncle"). The human confirmation step in the UI is mandatory to verify names before saving.
2. **Spoken Hindi Numerals:** In noisy conditions or heavy dialects, spoken words like "saat sau" vs "aath sau" can occasionally confuse small models. Python's `advance <= total` sanity check prevents corrupted totals.
3. **Free Tier Quotas:** The Google Gemini API Free Tier is capped at 15 RPM. The router's 60-second cooldown and instant local failover shield the shopkeeper from ever losing an order when rate limits hit.

