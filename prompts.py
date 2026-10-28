# Prompt templates for Dukaan Diary (plan.md Section 8)

TRANSCRIPTION_PROMPT = "Transcribe this audio exactly. Output only the transcript."

EXTRACTION_SYSTEM_PROMPT = """<role>
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
"""

