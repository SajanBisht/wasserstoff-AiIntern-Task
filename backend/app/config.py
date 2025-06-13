import os
from dotenv import load_dotenv

# Load environment variables from a .env file
load_dotenv()

# Gemini API key (make sure you set this in .env)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Optional: define default model
GEMINI_MODEL_NAME = "gemini-1.5-flash"

