import sys
import os

# 1. Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

# 2. Now import your config
from backend.app.config import GEMINI_API_KEY

import google.generativeai as genai

def list_models():
    genai.configure(api_key=GEMINI_API_KEY)
    models = genai.list_models()
    for m in models:
        print(f"{m.name} → supports: {m.supported_generation_methods}")

if __name__ == "__main__":
    list_models()
