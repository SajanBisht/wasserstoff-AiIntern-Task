import os
import shutil
import uuid

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from uploads.utils import extract_text_from_txt, extract_text_from_pdf
from config import GEMINI_API_KEY, GEMINI_MODEL_NAME

import google.generativeai as genai
from PIL import Image
import pytesseract

# ─── Setup ────────────────────────────────────────────────────────────────────
load_dotenv()
genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI()

# Allow CORS from React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory for temporary uploads
dir_path = os.path.dirname(__file__)
UPLOAD_DIR = os.path.join(dir_path, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Pydantic models
class TextInput(BaseModel):
    input: str

# Models for multi-document Q&A
class Document(BaseModel):
    id: str
    text: str

class QueryInput(BaseModel):
    question: str
    documents: list[Document]

# ─── File upload & extraction ─────────────────────────────────────────────────
@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Accept .txt, .pdf, .png, .jpg, or .jpeg.
    Save temporarily, extract text, then delete and return.
    """
    ext = os.path.splitext(file.filename)[1].lower()
    temp_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}{ext}")

    # Save uploaded file
    with open(temp_path, "wb") as buf:
        shutil.copyfileobj(file.file, buf)

    try:
        # Extract text
        if ext == ".txt":
            text = extract_text_from_txt(temp_path)
        elif ext == ".pdf":
            text = extract_text_from_pdf(temp_path)
        elif ext in [".png", ".jpg", ".jpeg"]:
            image = Image.open(temp_path)
            text = pytesseract.image_to_string(image)
        else:
            return {"error": "Unsupported file type"}
    finally:
        # Always clean up
        os.remove(temp_path)

    return {"text": text}

# ─── Theme detection via Gemini ───────────────────────────────────────────────
@app.post("/api/theme")
async def detect_theme(payload: TextInput):
    """
    Call Gemini to identify the main theme of the text.
    """
    prompt = (
        "Identify the main theme of the following text:\n\n"
        f"{payload.input}\n\nTheme:"
    )
    model = genai.GenerativeModel(GEMINI_MODEL_NAME)
    response = model.generate_content(prompt)
    return {"theme": response.text.strip()}

# ─── Narrative summary via Gemini ─────────────────────────────────────────────
@app.post("/api/narrate")
async def narrate_text(payload: TextInput):
    """
    Call Gemini to generate a storytelling-style summary.
    """
    prompt = (
        "Write a concise storytelling-style summary of the following text:\n\n"
        f"{payload.input}\n\nNarration:"
    )
    model = genai.GenerativeModel(GEMINI_MODEL_NAME)
    response = model.generate_content(prompt)
    return {"summary": response.text.strip()}

# ─── Multi-Document Question Answering ────────────────────────────────────────
@app.post("/api/query")
async def query_documents(payload: QueryInput):
    """
    For each uploaded document, answer the question with clear citations.
    """
    answers = []
    for doc in payload.documents:
        prompt = (
            "Use the following document to answer the question and provide a citation (e.g., sentence number or paragraph).\n"
            f"Document ID: {doc.id}\n"
            f"Document Text:\n{doc.text}\n\n"
            f"Question: {payload.question}\n"
            "Answer and citation:"
        )
        model = genai.GenerativeModel(GEMINI_MODEL_NAME)
        response = model.generate_content(prompt)
        answers.append({
            "docId": doc.id,
            "answer": response.text.strip(),
            "citation": "(see above text)"  # optional: refine later
        })
    return answers
