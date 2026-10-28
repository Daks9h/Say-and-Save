import sys
import json
from backends.local import LocalBackend
from packs import ShopType

sys.stdout.reconfigure(encoding='utf-8')

def main():
    wav_path = sys.argv[1] if len(sys.argv) > 1 else "test.wav"
    pack_name = sys.argv[2] if len(sys.argv) > 2 else "tailor"
    shop_type = ShopType(pack_name.lower())

    backend = LocalBackend()
    print(f"--- Running Local End-to-End Test ---")
    print(f"WAV File: {wav_path}")
    print(f"Shop Pack: {shop_type.value}")

    # Stage 1: Transcription
    transcript, t_timings = backend.transcribe(wav_path)
    print(f"\n[1] Transcript: {transcript}")
    print(f"Transcription timings (ms): {t_timings}")

    # Stage 2: Extraction
    card, raw_json, e_timings, warnings = backend.extract(transcript, shop_type)
    print(f"\n[2] Raw JSON from model:\n{raw_json}")
    print(f"\n[3] Validated Card:\n{json.dumps(card.model_dump(mode='json'), indent=2)}")
    print(f"\n[4] Warnings ({len(warnings)}):")
    for w in warnings:
        print(f" - [{w.get('field', 'unknown')}]: {w.get('message')}")
    print(f"\n[5] Extraction timings (ms): {e_timings}")

if __name__ == "__main__":
    main()

