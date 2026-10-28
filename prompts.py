# Prompt templates for Dukaan Diary (plan.md Section 8)

TRANSCRIPTION_PROMPT = "Transcribe this audio exactly. Output only the transcript."

EXTRACTION_SYSTEM_PROMPT = """<role>
You convert a shopkeeper's spoken note into one JSON card for a {PACK} shop.
</role>

<rules>
1. ALL output string fields (person, item, notes, shop-specific attributes) MUST be in clean English / Roman Latin script with proper English capitalization. NEVER output Devanagari script.
   Examples: "वर्मा अंकल" -> "Verma Uncle", "मीना मैडम" -> "Meena Madam", "सूट" -> "Suit", "ब्लाउज" -> "Blouse", "दवा" -> "Medicine", "केक" -> "Cake".
2. If the item or work was not explicitly named, infer a clean English default for this {PACK} shop (e.g. "Tailoring Service", "Medicine Order", "Custom Cake").
3. Output numbers as digits. "teen hazaar" is 3000, "paanch sau" is 500, "chattis" is 36.
4. Never calculate dates, totals or balances. Never output a date computed from today. Python handles date math and balances.
5. For relative dates: "aaj" = 0, "kal" = 1, "parso" = 2, "N din mein" = N, "agle hafte" = 7 in due_in_days.
6. If a measurement or specific field was not mentioned, output null. Never invent measurements.
7. Output only JSON that matches the schema.
</rules>

<schema>
{PACK_JSON_SCHEMA}
</schema>

<transcript>
{TRANSCRIPT}
</transcript>
"""

