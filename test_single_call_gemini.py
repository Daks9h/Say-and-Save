import os
import time
import json
from dotenv import load_dotenv
from google import genai
from google.genai import types
from packs import ShopType, get_pack_schema, BaseCard, TailorCard, balance_due, compute_due_date, validate_card

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
client = genai.Client(api_key=api_key)

model_name = "gemini-3.5-flash-lite"
shop_type = ShopType.TAILOR
schema_dict = get_pack_schema(shop_type)

# We include transcript field in the schema so it outputs both transcript and card in 1 single call!
schema_json = json.dumps(schema_dict, indent=2)

prompt = f"""<role>
You convert a shopkeeper's spoken voice note into one JSON card for a {shop_type.value} shop.
</role>
<rules>
1. Output numbers as digits. "teen hazaar" is 3000.
2. In the "notes" field, include the exact spoken transcript.
3. If a value was not said, output null. Never guess values.
4. Output only JSON matching the schema.
</rules>
<schema>
{schema_json}
</schema>
"""

with open("test.wav", "rb") as f:
    audio_bytes = f.read()

print("--- Testing Single-Call Audio-to-JSON with Gemini 3.5 Flash Lite ---", flush=True)
t0 = time.perf_counter()

resp = client.models.generate_content(
    model=model_name,
    contents=[
        types.Part.from_bytes(data=audio_bytes, mime_type="audio/wav"),
        prompt
    ],
    config=types.GenerateContentConfig(
        response_mime_type="application/json",
        max_output_tokens=1000,
        temperature=0.0
    )
)

total_ms = (time.perf_counter() - t0) * 1000
print(f"Total time taken: {total_ms:.1f} ms ({total_ms/1000:.2f} seconds)", flush=True)
print(f"Raw reply:\n{resp.text}", flush=True)

data = json.loads(resp.text)
card = TailorCard(**data)
card.balance_due = balance_due(card.amount, card.advance)
card.due_date, _ = compute_due_date(card.due_in_days, card.due_date_text)
warnings = validate_card(card)

print("\nFinal Card:")
print(json.dumps(card.model_dump(mode="json"), indent=2))
print(f"Warnings ({len(warnings)}):", warnings)
