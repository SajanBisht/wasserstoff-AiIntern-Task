# app/upload/utils.py
from pdfminer.high_level import extract_text as pdfminer_extract
from pdf2image import convert_from_path
import pytesseract

def extract_text_from_txt(path: str) -> str:
    return open(path, 'r', encoding='utf-8').read()

def extract_text_from_pdf(path: str) -> str:
    txt = pdfminer_extract(path).strip()
    if txt:
        return txt
    pages = convert_from_path(path)
    full = ''.join(pytesseract.image_to_string(p) for p in pages)
    return full
