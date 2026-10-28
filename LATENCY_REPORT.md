# LATENCY REPORT: Cloud API Critical Path

Date: 2026-10-28
Model: gemini-3.5-flash-lite
Target: Zero added overhead on the Google API critical path (Rules L1-L16).

---

## 1. Summary Comparison

| Metric | Bare Baseline (Phase 0) | App Critical Path (Phase 3) | Overhead (App - Base) | Baseline Noise Floor | Status |
|---|---|---|---|---|---|
| **Text Extract Median** | **1,053.9 ms** | **1,120.8 ms** | **+66.9 ms** | **291.7 ms** | **PASS (Inside Noise Floor)** |
| **Audio Transcribe Median**| **2,162.3 ms** | **2,185.0 ms** | **+22.7 ms** | **1,415.1 ms** | **PASS (Inside Noise Floor)** |

---

## 2. Per-Stage Latency Breakdown (App Critical Path)

- **API Call (`extract_api`)**: Median `1,120.6 ms`
- **Python Validation (`python_validation`)**: Median `0.06 ms` (Budget: < 50 ms)
- **Grounding Check (`grounding_check`)**: Median `0.02 ms` (Budget: < 50 ms)
- **Audio Prep (`audio_prep`)**: Median `2.49 ms` (Budget: < 50 ms)

**Total App-Layer Post-Response Overhead**: `0.08 ms` (well below the 50 ms ceiling).

---

## 3. Flag-Off Protocol Decision

- Measured overhead added by app code (validation + grounding + audio prep) is **under 3 ms total**.
- All flags remain enabled in `config.py`.

