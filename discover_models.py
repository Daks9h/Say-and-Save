import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

print("Checking with google-genai SDK...")
try:
    from google import genai
    client = genai.Client(api_key=api_key)
    models = list(client.models.list())
    print("Found models via google.genai:")
    for m in models:
        name = getattr(m, 'name', '') or getattr(m, 'display_name', '')
        if "gemini" in name.lower() or "gemma" in name.lower():
            print(f" - {name}")
except Exception as e:
    print(f"google.genai error: {e}")

print("\nChecking with google-generativeai SDK...")
try:
    import google.generativeai as genai_legacy
    genai_legacy.configure(api_key=api_key)
    for m in genai_legacy.list_models():
        name = m.name
        if "gemini" in name.lower() or "gemma" in name.lower():
            print(f" - {name} (supported_actions: {m.supported_generation_methods})")
except Exception as e:
    print(f"google.generativeai error: {e}")

