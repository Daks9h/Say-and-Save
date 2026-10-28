# PREFLIGHT REPORT: Dukaan Diary

Date: 2026-10-28
Environment: Windows 11, PowerShell, Python 3.12.10, Node.js v22.16.0, npm 10.9.2

---

## 1. System & Hardware Environment

- **Python Version**: `3.12.10`
- **Ollama Version**: `0.40.12`
- **Installed Ollama Models**:
  - `gemma4:e2b` (ID: `b37049369adf`, Size: 4.6 GB)
- **CPU**: 12th Gen Intel(R) Core(TM) i5-12450HX (8 Cores, 12 Logical Processors)
- **RAM**: 16.00 GB
- **GPU**:
  - NVIDIA GeForce RTX 3050 6GB Laptop GPU
  - Intel(R) UHD Graphics
- **Storage**: C: Drive has ample free disk space.
- **Audio & Media**:
  - `ffmpeg` version: 9.0-full_build
  - `sounddevice`: 0.5.6
  - `soundfile`: 0.14.0
- **Frontend Stack**:
  - Node.js: `v22.16.0`
  - npm: `10.9.2`

---

## 2. Cloud Model Discovery (`google-genai` SDK)

The user's `GOOGLE_API_KEY` was loaded safely from `.env`. Model discovery and capability tests yielded:

| Model Candidate | Text Extraction Pass? | Text Median Latency | Audio Transcription Pass? | Audio Latency | Status & Notes |
|---|---|---|---|---|---|
| `gemma-4-26b-a4b-it` | PASS (valid JSON) | 14,352 ms | **FAIL** (400 Invalid Argument) | 1,387 ms | Rejects audio modality (`Audio input modality is not enabled for this model`). Text extraction is slow (~14-19s). |
| `gemma-4-31b-it` | Partial (503 / 500) | 36,316 ms | **FAIL** (400 Invalid Argument) | 1,533 ms | Rejects audio modality. Unstable demand / internal errors. |
| `gemini-2.5-flash` | **FAIL** (404) | 482 ms | **FAIL** (404 Not Found) | 688 ms | Deprecated for new users. API returns 404 directing to `gemini-3.8-flash`. |
| `gemini-2.5-flash-lite` | **FAIL** (404) | 385 ms | **FAIL** (404 Not Found) | 564 ms | Deprecated for new users. API returns 404 directing to `gemini-3.5-flash-lite`. |
| `gemini-3.8-flash` | **FAIL** (503) | 2,191 ms | Not tested due to 503 | - | High demand / 503 UNAVAILABLE. |
| `gemini-3.5-flash` | PASS (valid JSON) | 3,825 ms | PASS ("वर्मा अंकल का छत्तीस रुपये का बिल।") | 8,456 ms | High transcription quality, slightly higher latency. |
| `gemini-3.5-flash-lite` | **PASS (valid JSON)** | **1,053 ms** | **PASS ("Verma uncle ka 36 rupaye ka bill.")** | **2,162 ms** | **RECOMMENDED CLOUD MODEL.** Extremely fast, accurate Roman Hinglish transcription and clean structured JSON. |

---

## 3. Measured Baselines (10 Timed Runs, Discarding Warm-Up)

### Local Backend (`gemma4:e2b` via Ollama @ localhost:11434)
- **Transcription (`test.wav`):**
  - Min: `2,222.8 ms`
  - Median: `2,298.3 ms`
  - p90: `2,326.8 ms`
  - p95: `2,331.2 ms`
  - Max: `2,331.2 ms`
  - **Noise Floor (p90 - p10):** `56.8 ms`
- **Text Extraction (Tailor schema):**
  - Min: `3,709.3 ms`
  - Median: `4,030.2 ms`
  - p90: `4,081.5 ms`
  - p95: `4,146.8 ms`
  - Max: `4,146.8 ms`
  - **Noise Floor (p90 - p10):** `150.8 ms`

### Cloud Backend (`gemini-3.5-flash-lite` via `google.genai`)
- **Transcription (`test.wav`):**
  - Min: `1,606.5 ms`
  - Median: `2,162.3 ms`
  - p90: `3,076.8 ms`
  - p95: `3,236.5 ms`
  - Max: `3,236.5 ms`
  - **Noise Floor (p90 - p10):** `1,415.1 ms`
- **Text Extraction (Tailor schema):**
  - Min: `880.3 ms`
  - Median: `1,053.9 ms`
  - p90: `1,196.1 ms`
  - p95: `1,235.1 ms`
  - Max: `1,235.1 ms`
  - **Noise Floor (p90 - p10):** `291.7 ms`

---

## 4. Preflight Conclusion & Decisions

1. **Local Model:** `gemma4:e2b` is reliable, fast (~2.3s audio, ~4.0s extract), and private on the user's RTX 3050 GPU.
2. **Cloud Model:** `gemini-3.5-flash-lite` is selected as the cloud model:
   - Text extraction is ~4x faster than local (1.05s vs 4.03s).
   - Audio transcription handles Hinglish seamlessly ("Verma uncle ka 36 rupaye ka bill.").
3. **Overhead Protection:**
   - Threshold for cloud overhead on extraction: **50 ms** (as agreed in intake).

