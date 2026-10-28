# Dukaan Diary: Build Plan for the Antigravity Agent

Version: 2026-10-28 · Owner: the user · Time budget: about 6 hours
Environment: Windows, PowerShell, Python virtual environment (`venv`), Ollama 0.40.11, local model `gemma4:e2b`.

This file is your complete brief. Read all of it before you do anything. The user is a hackathon builder who is short on time, so accuracy of your reports matters more than speed of your typing.

---

## 0. OPERATING RULES (apply to every phase)

1. **Phase gating.** Work one phase at a time. At the end of each phase, stop at the CHECKPOINT, post the report in the format in Section 9, and wait for the user to say "go". Never start the next phase on your own.
2. **Ask, don't guess.** If anything is ambiguous, missing, or a decision changes behavior, ask the user in chat. Batch your questions into one message, give 2 to 4 options, and state your recommendation. Items marked **BLOCKING** must never proceed on a default.
3. **No-solution rule.** Section 7 lists known risks with solutions. If you hit a failure that has no listed solution, or the listed solution fails, stop and ask the user in chat. Do not improvise a workaround that changes the architecture, the models, or the scope.
4. **Evidence rule.** Never write "works", "passes" or "verified" unless you ran it and can paste the real output. Paste raw output, not summaries. If you could not run something, say so.
5. **Frozen files.** `record.py` and `audio_test.py` already work on the user's machine. Copy them into the project as references and never edit them. The audio request format in `audio_test.py` is verified; reuse it exactly (see Section 8).
6. **Empty-file check.** After creating any file, run `dir` and confirm its length is above 0. The user has already lost time to a 0-byte file.
7. **Scope.** Build only what this file lists. No extra features, frameworks, or models. Cut order if time runs out: (1) Telegram, (2) search, (3) experimental packs, (4) previous-measurements button. Never cut: confirm-before-save, Python validation, the latency rules in Section 4.
8. **Secrets.** The Google API key lives only in `.env` as `GOOGLE_API_KEY`. Add `.env` to `.gitignore`, never print or log the key, and never ask the user to paste it into chat. Tell them to put it in `.env` themselves.
9. **Honest claims.** Never write "offline", "private" or "data never leaves the device" about any path that can use the cloud. Wording rules are in Section 7 (risk R17).
10. **Do not verify from memory.** Model names, SDK package names, API parameter names and Ollama options must be checked against the installed version or the official documentation before use. This file marks the things I could not verify with "VERIFY".

---

## 1. INTAKE: ask the user these questions FIRST, in one chat message

Do not write any code until the user has answered or said "use defaults". Items marked BLOCKING have no default.

| ID | Question to the user | Why it matters | Default if the user says "you decide" |
|---|---|---|---|
| I1 | **BLOCKING.** Which hackathon is this for? Please paste its rules or link, especially: does an API-hosted Gemma model count as "open", is Gemini (closed) allowed, and what is the submission format and deadline? | A cloud path could break the challenge rules. The user earlier shared the DEV "Hacktoberfest Open-Source AI Challenge Week 2: Side Hustle" brief, but said this is for a "next hackathon", so do not assume it is the same one. | None. Ask. |
| I2 | **BLOCKING.** Is `GOOGLE_API_KEY` saved in `.env` in the project folder? (Do not paste it in chat.) | The cloud path cannot be built or tested without it. | None. Ask. |
| I3 | May the router send audio to Google **automatically** when it is faster? Should that be ON or OFF when the app starts? | Speed-first routing sends voice notes off the device. The owner must consent. | App starts with cloud consent **OFF**. The user can switch it ON in the sidebar. A separate "demo profile" setting can start it ON. |
| I4 | What accuracy floor must a backend meet before the router may prefer it automatically? | Fast but wrong is worse than slow. | A backend is auto-preferred only if its field accuracy on the Phase 5 test set is at least 80% and within 5 percentage points of the best backend. |
| I5 | What counts as "added overhead" on the API path? | The user wants no added overhead. | Anything that adds more than the baseline noise floor (measured in Phase 0) must be flagged off or justified in writing. If noise is under 50 ms, use 50 ms as the threshold. |
| I6 | Which language mix will the demo use? | Hindi accuracy is unproven. | English plus Hinglish in Roman script. |
| I7 | How many hours are left, and what is the deadline? | Decides what gets cut. | 6 hours. |
| I8 | Who is the first real user (a tailor, medical store, or baker you can reach)? Is anyone lined up? | A first user is the strongest evidence for the submission. | None. The agent only records the answer. |
| I9 | Confirm project name, currency, units. | Used in UI and README. | Dukaan Diary, INR, inches for measurements, kg for weights. |
| I10 | Should Telegram or a separate local Whisper model be added? | Both add scope. | No to both. Revisit Whisper only if Phase 5 shows Hindi accuracy is unacceptable, and ask first. |
| I11 | Has the user read Google's current data-use terms for the API tier their key is on? | Sending real customer audio to the API has privacy consequences the agent cannot verify. | Tell the user to read them. The agent must not make any claim about how Google uses the data. |

The agent can discover hardware (RAM, GPU, disk), Python version, Ollama version, ffmpeg and Streamlit version itself. Do not ask the user for those.

---

## 2. WHAT WE ARE BUILDING AND WHAT IS ALREADY DECIDED

**Product:** a voice notebook for very small shops (one or two people, no existing software). The owner picks their shop type once, then records voice notes. The app turns each note into a structured card, shows it for confirmation, saves it, and surfaces anything due soon.

**Decisions already made. Do not re-open them. Ask only if something here is impossible.**

| Topic | Decision |
|---|---|
| Shop types | Five packs: tailor, medical, baker (**fully tested**), repair, laundry (**experimental**, config-only) |
| Card design | One fixed core plus pack-specific extras (Section 3). The model never invents field names. |
| Pack choice | The owner picks the shop type once at setup. There is no per-note auto-detection. |
| Model calls | Two steps: (1) audio to transcript, (2) transcript to JSON by the chosen pack's schema. |
| Safety | The model proposes, Python verifies, the human confirms, and only then is anything saved. |
| Python, not the model | Dates, totals, balance due, expiry parsing, range checks. |
| Local model | `gemma4:e2b` through Ollama at `http://localhost:11434`. |
| Cloud model | A Google API model chosen after the agent checks which models the user's key can use (Phase 0). |
| Routing | **Speed-first:** prefer the backend with the lowest recent end-to-end latency, among backends that are allowed (consent), reachable, and above the accuracy floor. See Section 5. |
| UI | A local Streamlit app. Telegram is out of scope unless the user asks. |
| Storage | SQLite (`dukaan.db`). |
| Validation | Pydantic schemas plus plain-Python rules. |
| Cloud services to avoid | No ElevenLabs, no Wispr Flow, no other cloud service in the pipeline. The only cloud dependency is the Google API. |

**Evidence so far (from the user's own tests, not guesses):**
- Local audio transcription works: a WAV sent to `/api/chat` on `gemma4:e2b` returned a transcript. Numbers were converted to digits correctly ("three thousand" became 3000).
- One test gave a wrong name: "Mr Sharma" came back as "sharma uncle". A later test with a different sentence ("verma uncle", amount 3000, "bill pending") came back correct. Conclusion: names can be wrong sometimes, so the confirm step is mandatory.
- Audio to JSON output worked on that sample. It is one data point, not proof.
- Hindi accuracy and speed have **not** been measured yet.

**Unverified, so check them (VERIFY):**
- Which Gemma models the Gemini API serves, and whether any accepts audio. One source listed `gemma-4-31b-it` on the Gemini API, and Ollama's release notes say the 26B and 31B checkpoints reject audio. Do not assume.
- The exact Python SDK package name and the parameter names for JSON schema output and for turning thinking off, on both Ollama and the Google API.

---

## 3. CARD SPECIFICATION (build exactly this)

**Core fields on every card:**

| Field | Type | Notes |
|---|---|---|
| shop_type | enum | tailor, medical, baker, repair, laundry |
| person | string | customer or supplier name |
| item | string | what the card is about |
| quantity | number | default 1 |
| amount | number | default 0 |
| advance | number | default 0 |
| due_in_days | integer or null | The model returns "5 din mein" as 5. Never a date. |
| due_date_text | string or null | Only for absolute dates the person spoke, such as "15 November" |
| notes | string | the transcript |

**Computed in Python only:** `due_date`, `balance_due = amount - advance`.

**Packs:**

| Pack | Extra fields | What the due date means | Validation (warnings, never silent fixes) | "Needs attention" rule |
|---|---|---|---|---|
| tailor | chest, waist, shoulder, length (inches, optional) | delivery | each measurement between 10 and 70 | due within 2 days |
| medical | batch (string), expiry ("MM/YYYY"), units (int) | expiry, parsed to the last day of that month | expiry not in the past and not more than 5 years ahead | expires within 30 days |
| baker | flavour, weight_kg, cake_message | pickup | weight between 0.25 and 20 kg | due within 2 days |
| repair (experimental) | device, fault, estimate | pickup | none beyond the core checks | due within 2 days |
| laundry (experimental) | item_count (int), service (wash, iron, dry_clean) | pickup | none beyond the core checks | due within 2 days |

**Core validation for every pack:** no negative quantity, amount or advance; advance must not exceed amount; due date must not be in the past.

**Date words the model must map to `due_in_days`:** aaj = 0, kal = 1, parso = 2, "N din mein" = N, "agle hafte" = 7. If an absolute date has no year, Python assumes the next occurrence. If the date is ambiguous, show a warning and a date picker. Never guess silently.

**Grounding check (post-response, warnings only):** after the response arrives, flag any string value (person, item) with a fuzzy match score under 70 against the transcript, and any number that does not appear in the transcript as a digit or number word. Show "not heard in the recording" next to that field. This catches invented values like a stray "pending".

---

## 4. LATENCY PROTECTION RULES (non-negotiable; the user's most important requirement)

**The user's requirement:** the speed of the Google API path must not be hindered by any functionality, code block, or element. If something hinders it, **flag it off** and tell the user.

**Definitions**
- **API critical path:** from the moment the request is triggered until the response is received and parsed.
- **Baseline:** the speed of a bare script that does nothing except make the same API call (built in Phase 0). **Overhead** is the app's measured time for the same call minus the baseline.
- **Noise floor:** the p90 minus p10 of the baseline runs. Overhead inside the noise floor counts as no overhead.

**Rules**

| # | Rule |
|---|---|
| L1 | Send the API request **immediately**. No pre-flight calls on the critical path: no model listing, health check, token counting, connectivity test, or benchmark. |
| L2 | Use **one persistent HTTP client** created at startup (keep-alive). Never create a new client or session per request. Warm the connection in a background thread at startup. |
| L3 | **Nothing slow runs before the request.** Only audio preparation that is strictly required (format and length check) runs first. Skip conversion when the audio already conforms. |
| L4 | **No retries on the cloud critical path** unless measured p95 impact is within the noise floor. On failure, fail over immediately (Section 5) instead of retrying or sleeping. |
| L5 | **No client-side throttling, backoff sleeps or waits** before a request. On a 429 or timeout, skip to the failover. |
| L6 | **Never race both backends** on a normal request. Racing doubles cost and silently sends audio off-device. It exists only in the optional benchmark mode, off by default and started by an explicit user action. |
| L7 | Background probes and health checks run on a timer, use **synthetic data only**, and **pause while any real request is in flight**. |
| L8 | **Streamlit reruns must never re-trigger an API call.** Put the call in a button callback, store the result in `st.session_state`, and cache backend clients with `st.cache_resource`. |
| L9 | Keep prompts short. Few-shot examples add latency. Keep only the smallest set that meets the accuracy floor, and measure with and without them. |
| L10 | Cap output tokens low (a card is small) and use schema-constrained output where the API supports it. |
| L11 | If an API option reduces thinking or reasoning latency, use the lowest-latency setting that still meets the accuracy floor. VERIFY the parameter name in the official docs. Never guess it. |
| L12 | **Logging must not touch the critical path.** Timing data is kept in memory. Disk logging is buffered and written after the response is displayed. |
| L13 | Instrumentation uses `time.perf_counter()` around each stage. Measure the instrumentation's own cost. If it adds more than 1 ms, flag it off. |
| L14 | Everything after the response (validation, grounding check, fuzzy name match, database lookup) must be measured. Together they should add no visible delay. If the total exceeds 50 ms, flag the slowest element off. |
| L15 | Choose the SDK or raw REST by measurement. If the official SDK's measured time for the same call exceeds the raw REST baseline by more than the noise floor, use raw REST with a persistent `requests.Session`. |
| L16 | Compare audio upload formats on the cloud path (the 16 kHz mono WAV versus a smaller supported format). Pick whichever has the lower total of conversion time plus upload time. |

**Flag-off protocol.** For any element that fails a rule above or adds overhead beyond the noise floor:
1. Measure the cloud path with the element ON and OFF, at least 10 runs each. Report median and p95.
2. If it adds overhead, set its flag to OFF by default in `config.py`.
3. Record it in `LATENCY_REPORT.md` with the numbers.
4. Tell the user in chat at the next checkpoint.
5. If turning it off removes a **safety** feature (confirm step, range validation), do not silently remove it. Move it after the response is displayed, or ask the user.

**Feature flags to create in `config.py`** (name, purpose, starting default):

| Flag | Default | Note |
|---|---|---|
| AUTO_EXTRACT | ON | Run extraction immediately after transcription. No extra click. |
| RETRY_ON_INVALID_JSON_LOCAL | ON | Local only. |
| RETRY_ON_INVALID_JSON_CLOUD | OFF | Turn ON only if measured overhead is inside the noise floor. |
| GROUNDING_CHECK | ON | Post-response, warnings only. |
| FUZZY_NAME_MATCH | ON | Post-response, capped at 5000 customers. |
| AUDIO_NORMALIZE | ON | Skipped when the audio is already 16 kHz mono 16-bit. |
| DEBUG_TIMING_PANEL | ON | In-memory only. |
| DISK_LOGGING | OFF | Buffered and post-response only if enabled. |
| BACKGROUND_PROBES | ON | Obeys L7. |
| CLOUD_SINGLE_CALL_EXPERIMENT | OFF | Audio to JSON in one call. Evaluate in Phase 5 only. |
| BENCHMARK_MODE | OFF | User-triggered only (L6). |
| CLOUD_CONSENT | OFF | See intake I3. |

---

## 5. ROUTER POLICY (speed-first, with guard rails)

**Eligibility.** A backend is eligible only if all of these hold:
- **local:** Ollama reachable and `gemma4:e2b` installed.
- **cloud:** `CLOUD_CONSENT` is ON, the API key is present, the network is reachable, and the backend is not in cooldown.
- **accuracy gate:** its Phase 5 field accuracy meets the floor from intake I4. Until Phase 5 is done, the cloud backend is **manual-only**.

**Selection.** Among eligible backends, pick the one with the lowest rolling median end-to-end latency over its last 10 real requests. Seed this with background probe results at startup. Ties go to local.

**Hysteresis.** Switch only if the other backend has been at least 20% faster over 3 consecutive measurements. This stops flapping.

**Cost of routing.** The routing decision must be a dictionary lookup that takes microseconds. Measure it (L14).

**Failover.**
- Cloud error, timeout or 429: fail over to local at once and put cloud in cooldown for 60 seconds.
- Local failure: use cloud only if consent is ON, otherwise show the manual entry form.
- Both fail: show the transcript if there is one and a blank card form. The owner fills it by hand. Nothing is lost.

**Visibility.** The UI always shows which backend handled the last request and its latency. A badge says "cloud used" on any card that touched the cloud. The user can override with a manual selector (Auto, Local, Cloud).

**The user's question: which backend is faster after deployment?** Do not assume. Hypotheses to test, not facts: cloud is likely faster on weak CPU-only shop PCs; local is likely faster and steadier on a machine with a GPU or on a slow or flaky network; cloud adds network latency and rate-limit variability. Phase 0 and Phase 5 measure both on the user's machine. The user's deployment machine may differ from the dev machine, so the router must keep measuring at runtime instead of hard-coding a winner.

---

## 6. PHASES

Time guide: Phase 0 45 min · 1: 45 · 2: 45 · 3: 60 · 4: 60 · 5: 45 · 6: 30 · 7: 30 = about 6 hours.

### PHASE 0: Intake, preflight and baselines (about 45 min)

**Goal:** know exactly what works on this machine before building anything.

```text
<role>
You are a careful build engineer working on a local-first voice notebook for small shops. You verify before you claim and you ask before you guess.
</role>

<context>
Read plan.md fully. Frozen files: record.py and audio_test.py (copy to the project as reference, never edit). The user's Windows machine runs Ollama 0.40.11 with gemma4:e2b. Local audio transcription already works using the request format in audio_test.py. The Google API key is expected in .env as GOOGLE_API_KEY.
</context>

<task>
1. Post the Section 1 intake questions in ONE chat message. Wait for answers.
2. Environment report (run commands, paste output): Python version, active venv, Ollama version, `ollama list`, whether gemma4:e2b is installed, ffmpeg present or not, Streamlit version and whether st.audio_input exists, CPU model, RAM, GPU (if any), free disk.
3. Google model discovery: in a standalone script (not in the app), load GOOGLE_API_KEY from .env and call the API's model-list function ONCE. Print every model whose name contains "gemma" or "gemini". Do not guess model names. VERIFY the SDK package name and call in the official documentation first.
4. Capability tests, at most 4 candidate cloud models (the smallest Gemma models first, then one fast Gemini-class model). For each candidate: (a) text-to-JSON extraction on 3 short sample transcripts (one tailor, one medical, one baker) with schema-constrained output; (b) an audio test with test.wav using the audio input method the API documents. Record pass or fail, exact error text, and latency for each.
5. Baselines: write bench_local.py and bench_cloud.py. Each must do nothing except make the call (cloud: one persistent requests.Session or the SDK client created once outside the timing loop). Run 10 timed runs each for (i) transcription of test.wav and (ii) text extraction. Report min, median, p90, p95, max, and the noise floor (p90 minus p10). Discard the first run as warm-up and say so.
6. Write PREFLIGHT.md with everything above.
</task>

<constraints>
- Do not build any app code in this phase.
- Do not put the API key in any file other than .env. Never print it.
- If no cloud model accepts audio, do NOT choose one yourself. Report it and ask the user which of these they want: (a) cloud path does text extraction only, from the locally produced transcript; (b) a closed Gemini model handles audio in cloud mode, with the open-source tradeoff stated; (c) no cloud audio path.
- If a call fails, show the full error. Do not retry in a loop.
</constraints>

<acceptance>
PREFLIGHT.md exists and is larger than 0 bytes, contains real pasted outputs, and lists which cloud models passed text and audio tests, with baseline numbers.
</acceptance>

<stop>
Stop at CHECKPOINT 0. Post the Section 9 report and wait for "go".
</stop>
```

**Fallbacks for this phase:**
- Ollama not running: tell the user to start it, then check `http://localhost:11434`.
- Key invalid, quota exhausted or region restricted: stop and ask the user (R12).
- No audio-capable cloud model: ask the three-option question above.
- `st.audio_input` missing: note it. Phase 4 uses a file uploader plus the working `record.py` flow.
- ffmpeg missing: not needed, because audio is handled with soundfile and numpy.

**CHECKPOINT 0, the user should see:** the intake answers recorded, the environment report, the cloud model table (text pass, audio pass, latency), baseline numbers, and a recommendation for the cloud model.

---

### PHASE 1: Core logic with no AI (about 45 min)

**Goal:** cards, packs, validation and date logic, fully unit-tested.

```text
<role>
You are a Python engineer who writes small, boring, well-tested code.
</role>

<context>
Read plan.md Sections 0, 3 and 7. This phase contains no model calls. The user's shop owners cannot afford wrong dates, wrong totals or wrong balances, so all of that logic is plain Python.
</context>

<task>
1. Create the project structure: app.py, config.py, packs.py, db.py, prompts.py, router.py, backends/ (base.py, local.py, cloud.py), tests/. Create empty files only where a later phase fills them, and verify none are 0 bytes if they should have content.
2. In packs.py implement exactly the card in Section 3 with Pydantic: the core model, the five pack models, and a JSON-schema export per pack for later use.
3. Implement in plain Python: compute_due_date (from due_in_days or due_date_text), parse_expiry ("MM/YYYY" to the last day of that month), balance_due, validate(card, today) returning a list of warning objects (field, message, severity) that NEVER modifies the card, and needs_attention(card, today) using the per-pack windows in Section 3.
4. Write pytest tests covering: each date word mapping, leap-year February expiry, month-end expiry, past expiry, expiry more than 5 years ahead, measurement bounds (10 and 70 inclusive, 9.9 and 70.1 fail), negative values, advance greater than amount, due date in the past, needs_attention boundaries (exactly 2 days, exactly 30 days), and an unknown pack name.
5. Run the tests and paste the full result.
</task>

<constraints>
- No model calls, no network calls, no UI.
- Validators return warnings only; they never "fix" values.
- Use an injectable `today` parameter so tests are deterministic.
</constraints>

<acceptance>
All tests pass with the real output pasted. The test list shows every case named in task item 4.
</acceptance>

<stop>
Stop at CHECKPOINT 1 and wait for "go".
</stop>
```

**Fallbacks:** a rule in Section 3 is ambiguous (for example an unparseable date phrase) → ask the user; do not guess.

**CHECKPOINT 1, the user should see:** the test output and the list of cases covered.

---

### PHASE 2: Local backend (about 45 min)

**Goal:** voice to validated card on local Gemma, with a script, not a UI.

```text
<role>
You are an engineer integrating a small local language model. You treat model output as untrusted input.
</role>

<context>
Read plan.md Sections 3, 4 and 8. The local model is gemma4:e2b on Ollama at http://localhost:11434. The audio request format in audio_test.py is verified; reuse it exactly. Extraction is a SEPARATE text-only call.
</context>

<task>
1. In backends/base.py define a Backend interface: transcribe(wav_path) returning text plus timings, and extract(transcript, pack) returning card, raw output, timings and errors. Add a timing helper using time.perf_counter().
2. In backends/local.py implement transcribe: reject audio longer than 30 seconds with a clear error; if the file is not already 16 kHz mono 16-bit PCM WAV, convert it with soundfile and numpy; send it exactly as in audio_test.py; use one persistent client.
3. Implement extract: text-only /api/chat with the pack's JSON schema in the `format` field, temperature 0, the prompt template from Section 8, and thinking mode OFF. VERIFY the exact option name for turning thinking off against the installed Ollama version before using it. Validate the result with the Pydantic model. On invalid JSON, retry once if RETRY_ON_INVALID_JSON_LOCAL is ON.
4. Add a keep_alive setting so the model stays loaded between requests, and a warm-up call at startup.
5. Write test_local.py that takes a WAV path and a pack name and prints the transcript, the card, the warnings, and per-stage timings. Run it on test.wav with the tailor pack and paste the output.
6. Create tests/transcripts.json with 6 text transcripts per tested pack (tailor, medical, baker; English, Hinglish in Roman script) including one with a missing field, one with a number said in words, and one with an out-of-range value. Run extraction on all 18 and paste a table of transcript, extracted card, warnings.
</task>

<constraints>
- Do not modify audio_test.py or record.py.
- Never let the model compute a date, total or balance.
- If a value is not mentioned, the model returns null. Never accept a default the model invented.
- Do not add few-shot examples beyond Section 8 yet.
</constraints>

<acceptance>
Real outputs pasted for task items 5 and 6, and a list of every case that looks wrong with your guess at why. Do not fix prompts in this phase.
</acceptance>

<stop>
Stop at CHECKPOINT 2 and wait for "go".
</stop>
```

**Fallbacks:** invalid JSON often → the Pydantic gate plus retry plus the manual form (R3). Thinking mode breaks structured output → turn thinking off and strip any thinking text before parsing (R4). Slow first call → warm-up and keep_alive (R7).

**CHECKPOINT 2, the user should see:** the transcript and card from `test.wav`, the 18-case table, and the failure list.

---

### PHASE 3: Cloud backend, router and latency instrumentation (about 60 min)

**Goal:** speed-first routing with zero added overhead on the API path, proven by numbers.

```text
<role>
You are a performance-minded engineer. The user's top requirement is that nothing you add may slow down the Google API response. You measure everything and you turn off anything that hinders it.
</role>

<context>
Read plan.md Sections 4 and 5 completely before writing code. The Phase 0 baseline numbers and the user's chosen cloud model are in PREFLIGHT.md. The cloud backend must match the baseline within the noise floor.
</context>

<task>
1. Implement backends/cloud.py with the same interface as the local backend, using the cloud model the user approved at Checkpoint 0 and the verified SDK or raw REST client (rule L15). Create the client once and reuse it. Use schema-constrained output and low max output tokens. Set the lowest-latency thinking setting that still passes the 18-case set (VERIFY the parameter name; rule L11).
2. Implement router.py exactly as in Section 5: eligibility, rolling median latency over the last 10 real requests, hysteresis, failover with 60-second cooldown, accuracy-gate (cloud manual-only until Phase 5), consent flag, and a manual override. The decision must be a dictionary lookup.
3. Implement background probes using synthetic data only, on a timer, paused while any request is in flight (rule L7).
4. Implement instrumentation: perf_counter timings for each stage (audio prep, request send, first byte, last byte, parse, validate, grounding check, name match) stored in memory, with a debug panel data function. Measure the instrumentation's own cost.
5. Create the full flag registry in config.py from Section 4.
6. Overhead test: run the cloud path through the app code (not the UI) 20 times, and compare against the Phase 0 bare baseline. Produce LATENCY_REPORT.md containing: baseline median and p95, app-path median and p95, overhead, noise floor, and a per-stage table.
7. Apply the flag-off protocol to every element whose overhead exceeds the noise floor. Report exactly which flags you turned off and the before/after numbers.
</task>

<constraints>
- Nothing may run before the API request except the strictly required audio check or conversion (L3).
- No retries, sleeps, backoff or throttling on the cloud critical path (L4, L5).
- Never send real user audio during probes or tests. Use test.wav or synthetic data that the user created for testing.
- If the cloud path cannot match baseline within the noise floor and you cannot find the cause, stop and ask the user. Do not hide the gap.
</constraints>

<acceptance>
LATENCY_REPORT.md exists, is larger than 0 bytes, and contains real measured numbers. The report lists every flag turned off with its measured effect. If overhead is within the noise floor, state that plainly.
</acceptance>

<stop>
Stop at CHECKPOINT 3 and wait for "go".
</stop>
```

**Fallbacks:** the cloud model rejects audio → use the option the user chose at Checkpoint 0 (R9). Rate limit hit during testing → space test runs, do not add waits to the product path, tell the user (R12). Router flapping → hysteresis (R11).

**CHECKPOINT 3, the user should see:** `LATENCY_REPORT.md`, the flags turned off, and a statement "cloud path overhead is X ms against a noise floor of Y ms".

---

### PHASE 4: Database and Streamlit UI (about 60 min)

**Goal:** the working app.

```text
<role>
You are a UI engineer building for a shop owner who is not technical and is often busy with a customer.
</role>

<context>
Read plan.md Sections 3, 4, 5 and 7. Phases 1 to 3 are done. The UI must never add delay to the API path (rules L8, L12, L14).
</context>

<task>
1. db.py with SQLite (dukaan.db): table cards (id, shop_type, created_at, card JSON, person, item, due_date, status open or done, backend_used, used_cloud boolean). Functions: save_card, list_open_cards, mark_done, search_by_person, latest_card_for_person, list_people. Write pytest tests using a temporary database file and paste the results.
2. app.py (Streamlit):
   - Sidebar: shop type (chosen once, remembered in session state), cloud consent toggle (default from config, clearly labelled "Voice notes will be sent to Google"), backend selector (Auto, Local, Cloud), and the last backend and latency.
   - Record section: use st.audio_input if available (check with hasattr), else a WAV file uploader. Show a 1-second countdown before recording so the first word is not clipped.
   - After audio arrives, chain automatically (AUTO_EXTRACT): transcribe, then extract. Show the transcript in an editable box and the card in an editable form, with validation and grounding warnings beside each field, balance due and due date computed by Python, and a "Re-read card" button if the transcript was edited.
   - Nothing is saved until "Confirm and save" is pressed. If both backends fail, show the transcript and a blank card form.
   - "Needs attention" list for the chosen shop type with a Done button on each row.
   - Search by person name; for the tailor pack a "Use previous measurements" button.
   - A badge on cards that used the cloud.
3. Run the app and confirm it starts without errors. Paste the startup output.
</task>

<constraints>
- Never call a backend from the main script body. Only from callbacks (rule L8).
- Cache backend clients with st.cache_resource.
- No features beyond this list.
- Do not touch router.py or the backends except to fix a defect you report to the user.
</constraints>

<acceptance>
App starts, db tests pass with pasted output, and one end-to-end run with test.wav is shown (transcript, card, warnings, save, appears in the list).
</acceptance>

<stop>
Stop at CHECKPOINT 4. Ask the user to record 3 voice notes by hand and tell you what happened. Wait for "go".
</stop>
```

**Fallbacks:** `st.audio_input` missing → file uploader plus `record.py` (R6). Streamlit rerun re-calls the API → callbacks and session state (R8). Hardware too slow for local → router prefers cloud if consent is ON (Section 5).

**CHECKPOINT 4, the user should see:** a screenshot or description of the app, the end-to-end run, and the user's own three manual recordings with the results.

---

### PHASE 5: Accuracy and speed evaluation on real recordings (about 45 min)

**Goal:** real numbers for both backends, and the router's accuracy gate.

```text
<role>
You are an evaluator. You report results as they are, including bad ones.
</role>

<context>
The user will record real voice notes for the three tested packs. Read plan.md Sections 4 and 5. The accuracy floor from intake I4 decides which backends the router may prefer.
</context>

<task>
1. Ask the user to record at least 5 notes per tested pack (15 total), as WAV files, with a half-second pause before speaking, mixing English and Hinglish (and a few Hindi if the user wants to test it), including: one with a name, one with a number said in words, one with a missing field, and one with an out-of-range value. The user also records one sample in a noisy setting if possible. Wait until the files exist.
2. Write expected_cards.json together with the user: for each recording, the user states what they actually said and the correct card. Do not infer the expected values from model output.
3. Run every recording through the local backend and the cloud backend (when allowed). Produce a table: recording, transcript, extracted fields, field-by-field correct or wrong, latency per stage.
4. Compute per backend: transcript word accuracy on key fields (names, numbers), field accuracy, median and p95 latency, number of invalid-JSON events, number of fabricated values.
5. Apply the accuracy gate from I4 and set which backends are auto-eligible. Report it.
6. Allow at most TWO prompt-improvement iterations: add 3 to 4 few-shot examples drawn from the failures (not copied test cases), rerun, and report the change. Then stop tuning.
7. Optional, only if the user agrees: evaluate CLOUD_SINGLE_CALL_EXPERIMENT (audio to JSON in one call) for speed and accuracy and report.
8. Write EVALUATION.md.
</task>

<constraints>
- Never edit the expected values after seeing results.
- Never describe a result as good if it did not meet the floor.
- Use only the user's own test recordings. No real customer audio.
</constraints>

<acceptance>
EVALUATION.md exists with the tables, the gate decision, and an honest "where this fails" list.
</acceptance>

<stop>
Stop at CHECKPOINT 5 and wait for "go". If Hindi accuracy is below the floor, ask the user whether to demo in English or Hinglish, or to add a local Whisper step.
</stop>
```

**Fallbacks:** Hindi numbers wrong → the owner says digits, or the demo uses Hinglish with digits; offer Whisper only after asking the user (R2). Names wrong → confirm step plus a name dropdown from `list_people` (R1). Both backends below the floor → keep manual-only mode and tell the user plainly.

**CHECKPOINT 5, the user should see:** the per-backend accuracy and speed table, the gate result, and the prompt-iteration changes.

---

### PHASE 6: Failure drills and hardening (about 30 min)

**Goal:** prove the app fails safely.

```text
<role>
You are a tester whose job is to break the app on purpose and make sure nothing is lost silently.
</role>

<context>
Read plan.md Section 7. Run each drill and paste the real result.
</context>

<task>
Run and report each of these:
1. Ollama stopped (local backend).
2. No internet (cloud backend) with consent ON.
3. Invalid API key.
4. A simulated 429 or timeout from the cloud (a stub is fine).
5. Audio over 30 seconds.
6. Silent audio file.
7. Invalid JSON returned by the model (stub).
8. Both backends failing.
9. A card with an out-of-range measurement and a past expiry date.
10. Restarting the app and confirming saved cards persist.
11. Scan the repository for secrets: the key must appear only in .env, and .env must be in .gitignore.
12. Confirm no per-request calls to any cloud service exist other than the Google API and only when consent is ON.
13. Re-run the Phase 3 overhead test to confirm nothing added since then has slowed the cloud path. Update LATENCY_REPORT.md.
</task>

<constraints>
Fix only defects you find, in the smallest possible change. Do not add features.
</constraints>

<acceptance>
A drill table with the real result for each item.
</acceptance>

<stop>
Stop at CHECKPOINT 6 and wait for "go".
</stop>
```

**CHECKPOINT 6, the user should see:** the drill table and any defects fixed.

---

### PHASE 7: Packaging and submission (about 30 min)

**Goal:** honest documentation and a demo that cannot fail on the day.

```text
<role>
You are a technical writer who never overclaims.
</role>

<context>
Read plan.md Section 7 (R13 to R19) and the hackathon rules the user gave in intake I1. Use only measured numbers from LATENCY_REPORT.md and EVALUATION.md.
</context>

<task>
1. README.md: what it is and who it is for (very small shops with one or two people and no existing system), install steps (ollama pull, pip install, streamlit run), the five packs and which are tested versus experimental, how routing works, how to turn cloud off, and a "Known limitations" section.
2. Known limitations must include, with real data where available: names can be misheard; Hindi accuracy as measured; E2B accuracy ceiling; hardware requirements for local mode; noisy shops; single-machine, single-user design; cloud mode sends audio to Google; no claim about Google's data handling.
3. Wording rules: never say "offline" or "private" without saying which mode; say "runs fully on the shop's own computer when cloud mode is off".
4. A demo script (about 2 minutes): tailor note then medical note, showing the transcript, the warnings, the confirm step, the needs-attention list, and the backend badge. Prepare 3 pre-recorded WAV files as a backup.
5. A "why open matters" section grounded in what the project really does: local inference, a swappable model, no per-use fee in local mode, owner-controlled data.
6. A first-user section template for the user to fill in (who, what they said, did they pay or would they). Do not invent a user.
7. A submission-post draft following the hackathon's required headings from I1.
</task>

<constraints>
No marketing language. No invented numbers, users, quotes or testimonials.
</constraints>

<stop>
Stop at CHECKPOINT 7 (final). List what the user must do by hand (Section 10).
</stop>
```

---

## 7. FALLBACK REGISTER: every known risk, how to detect it, how to solve it

For each row: if the solution is not listed or does not work, **stop and ask the user in chat**.

| ID | Risk | Detect | Solution the agent applies | If unsolved |
|---|---|---|---|---|
| R1 | Misheard names (for example "Mr Sharma" became "sharma uncle") | Grounding check; the user sees the transcript | Editable transcript and card, confirm before save, name dropdown with fuzzy matching against saved customers | Ask the user |
| R2 | Hindi or Hinglish numbers misheard | Phase 5 evaluation | Owner says digits, or types the number; demo in English or Hinglish; offer a local Whisper step only after asking | Ask the user |
| R3 | Invalid or broken JSON | Pydantic validation | Schema-constrained output; one retry (local only); fall back to the manual card form | Ask the user |
| R4 | Thinking mode breaks structured output or adds latency | Phase 2 and 3 tests | Turn thinking off (VERIFY parameter name); strip any thinking text before parsing | Ask the user |
| R5 | Model invents values (such as a stray word) | Grounding check | "null if not mentioned" in prompts; show "not heard in the recording" on any ungrounded field | Ask the user |
| R6 | `st.audio_input` missing in the installed Streamlit | Phase 0 check | File uploader plus the existing `record.py` | Ask the user |
| R7 | First call slow (model loading) | Phase 0 timing | Warm-up call at startup; keep_alive; show a progress message; record the demo after warm-up | Ask the user |
| R8 | Streamlit reruns re-trigger API calls | Counting calls in tests | Callbacks, `session_state`, `st.cache_resource` | Ask the user |
| R9 | Cloud model does not accept audio | Phase 0 capability test | Use the option the user picks at Checkpoint 0 (text extraction from local transcript, a closed Gemini model, or no cloud audio) | Ask the user |
| R10 | Recording clips the first word | Phase 4 testing | One-second countdown; tell the user to pause half a second before speaking | Ask the user |
| R11 | Router flapping between backends | Router logs in memory | Hysteresis (20% faster for 3 measurements) | Ask the user |
| R12 | API quota exhausted, key invalid, 429s, region block | Error codes | Immediate failover to local if allowed; never add waits to the request path; tell the user plainly | Ask the user |
| R13 | Both backends fail | Phase 6 drill | Manual card form with transcript if available; nothing lost | Ask the user |
| R14 | Date or total errors | Unit tests | Python computes all dates, totals and balances; the model never does | Ask the user |
| R15 | Overbuilding, or running out of time | Time check at each checkpoint | Use the cut order in Section 0 rule 7 | Ask the user |
| R16 | Environment problems, such as a 0-byte file | `dir` after each file | Section 0 rule 6; if stuck on one error for 30 minutes, simplify and tell the user | Ask the user |
| R17 | Privacy claims become false when cloud is used | README review | Consent toggle, a "cloud used" badge, and the wording rules in Phase 7. Never claim anything about Google's data handling. | Ask the user |
| R18 | Hackathon rules might not allow an API-hosted or closed model | Intake I1 | If not allowed, set cloud to disabled by default and document it as an optional extra | Ask the user |
| R19 | Live demo fails | Pre-demo rehearsal | Pre-recorded WAV files, a backup screen recording, check `localhost:11434` before every recording | Ask the user |
| R20 | Ollama not running or model unloaded | Connection error | Show a clear message; the router fails over if cloud is allowed | Ask the user |
| R21 | API key leaks | Phase 6 scan | `.env` only, `.gitignore`, never logged | Ask the user |
| R22 | Each extra shop pack adds a test surface | Phase 5 coverage | Three tested packs; two labeled "experimental" in the README and UI | Ask the user |

**Risks that cannot be solved by code. Do not pretend otherwise; document them honestly and tell the user:**
- **Hardware barrier:** many small shops may not have a computer that can run the local model. State this in the README.
- **Whether anyone would pay:** only a real user can answer this. It is the user's task (Section 10).
- **E2B accuracy ceiling:** the model's accuracy cannot be raised by wrapping it. The design limits the damage with validation and confirmation.
- **Noisy shops:** can only be tested properly in a real shop. Test at least one noisy sample.

---

## 8. MODEL PROMPT TEMPLATES

**8.1 Transcription (frozen).** Use the exact request format from `audio_test.py`: POST to `/api/chat`, model `gemma4:e2b`, stream false, one user message with content `Transcribe this audio exactly. Output only the transcript.` and the base64 audio in the `images` field. Do not change it. The cloud backend uses the same instruction text with the audio method that the chosen API documents.

**8.2 Extraction (text only).** Use a system and user structure like this, filled in per pack:

```text
<role>
You convert a shopkeeper's spoken note into one JSON card for a {PACK} shop.
</role>

<rules>
1. The transcript may be Hindi (Roman script), Hinglish or English.
2. Output numbers as digits. "teen hazaar" is 3000.
3. Never calculate dates, totals or balances. Never output a date computed from today.
4. For "aaj" output due_in_days 0, "kal" 1, "parso" 2, "N din mein" N, "agle hafte" 7.
5. If a value was not said, output null. Never invent or guess a value.
6. Copy names exactly as heard. Do not add titles or relations the speaker did not say.
7. Output only JSON that matches the schema.
</rules>

<schema>
{PACK_JSON_SCHEMA}
</schema>

<transcript>
{TRANSCRIPT}
</transcript>
```

**8.3 Starting few-shot examples** (keep to one or two per tested pack at first; measure their latency cost, rule L9):

- tailor: transcript `Meena madam blouse, chest 36, waist 30, 5 din mein, advance 500, total 800` produces person "Meena madam", item "blouse", chest 36, waist 30, due_in_days 5, advance 500, amount 800, other fields null.
- medical: transcript `Crocin batch A123 expiry 08/2027, 20 units` produces item "Crocin", batch "A123", expiry "08/2027", units 20, other fields null.
- baker: transcript `Chocolate cake 2 kg kal shaam tak, advance 500, Rahul ke liye` produces person "Rahul", item "cake", flavour "chocolate", weight_kg 2, due_in_days 1, advance 500, other fields null.

Measure the cost of these examples. After Phase 5, add 3 to 4 more drawn from real failures, not copies of test cases.

**8.4 Temperature.** Use 0 for extraction. Google's recommended sampling for the model family may differ (VERIFY in the model card); run one comparison in Phase 5 and report.

---

## 9. REPORTING AND QUESTION FORMAT

**Checkpoint report. Use this exact structure:**

```text
CHECKPOINT <n> REPORT
1. Built: files created or changed, with sizes
2. Evidence: raw command output and test results, pasted not summarized
3. Latency: numbers if this phase touched speed
4. Flags turned off: name, reason, measured effect
5. Deviations from plan: anything you did differently and why
6. Open questions: each with options and your recommendation
7. What I need from you: manual tasks
8. Say "go" to start Phase <n+1>
```

**Question format:**

```text
QUESTION <id> [BLOCKING or NON-BLOCKING]
Context: one line
Options: A) ...  B) ...  C) ...
Recommendation: X, because ...
Default if you say "decide": ...  (never applies to BLOCKING)
```

Batch questions into one message. Never ask the same question twice. Never ask for things you can discover yourself.

---

## 10. DEFINITION OF DONE AND WHAT THE USER MUST DO BY HAND

**Done means:**
- All phases passed their checkpoints.
- The cloud path has measured overhead inside the noise floor, or every cause of overhead is flagged off and reported.
- Evaluation numbers exist for both backends, and the router's gate is applied.
- The README is honest about limits and about which mode keeps data on the device.
- A backup demo exists.

**The agent cannot do these. Remind the user at the right checkpoint:**
1. Put the Google API key in `.env` (Phase 0).
2. Read Google's current data-use terms for their key's tier (intake I11).
3. Record the voice notes for Phases 4 and 5, including at least one in a noisy setting.
4. State what they actually said for each recording (the expected cards).
5. Find one real shop owner (a tailor, a medical store, or a baker), let them try it, and write down what they said and whether they would pay. This is the strongest part of the submission.
6. Record the demo video and publish the submission.
