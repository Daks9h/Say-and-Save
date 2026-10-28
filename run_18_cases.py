import json
import sys
from datetime import date
from backends.local import LocalBackend
from packs import ShopType

sys.stdout.reconfigure(encoding='utf-8')

FIXED_TODAY = date(2026, 10, 28)

def main():
    backend = LocalBackend()
    with open("tests/transcripts.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    results = []
    print(f"{'ID':<4} | {'Pack':<8} | {'Type':<22} | {'Person/Item':<22} | {'Due / Exp':<12} | {'Warnings'}")
    print("-" * 90)

    for pack_name, cases in data.items():
        shop_type = ShopType(pack_name)
        for item in cases:
            cid = item["id"]
            ctype = item["type"]
            transcript = item["transcript"]

            card, raw_json, timings, warnings = backend.extract(transcript, shop_type, today=FIXED_TODAY)

            person_or_item = f"{card.person or ''} / {card.item or ''}".strip(" /")
            if hasattr(card, "parsed_expiry_date") and card.parsed_expiry_date:
                due_or_exp = str(card.parsed_expiry_date)
            elif card.due_date:
                due_or_exp = str(card.due_date)
            else:
                due_or_exp = "-"

            warn_summary = "; ".join([f"{w['field']}: {w['message']}" for w in warnings]) if warnings else "None"
            print(f"{cid:<4} | {pack_name:<8} | {ctype:<22} | {person_or_item[:20]:<22} | {due_or_exp:<12} | {warn_summary[:35]}")

            results.append({
                "id": cid,
                "pack": pack_name,
                "type": ctype,
                "transcript": transcript,
                "card": card.model_dump(mode="json"),
                "raw_json": raw_json,
                "timings": timings,
                "warnings": warnings
            })

    with open("tests/results_18_cases.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print("\n18-case test matrix completed and saved to tests/results_18_cases.json")

if __name__ == "__main__":
    main()

