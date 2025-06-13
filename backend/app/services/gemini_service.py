import sys
import os

# Add the root directory of the project to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from backend.app.config import GEMINI_API_KEY, GEMINI_MODEL_NAME
import google.generativeai as genai

def test_gemini():
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel(GEMINI_MODEL_NAME)

    response = model.generate_content("Summarize the theme of AI in education.")
    print(response.text)

if __name__ == "__main__":
    test_gemini()
