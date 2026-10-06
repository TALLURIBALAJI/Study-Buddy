import os
import re
from pathlib import Path
from typing import List, Dict, Any, Tuple
from pypdf import PdfReader
from docx import Document as DocxDocument
from app.config import ALLOWED_EXTENSIONS, MAX_FILE_SIZE_MB

def sanitize_filename(filename: str) -> str:
    """Removes path traversals and illegal characters from uploaded filenames."""
    # Strip any directory components
    name = Path(filename).name
    # Keep only alphanumeric, hyphens, underscores, dots, spaces
    name = re.sub(r"[^\w\s\.\-]", "", name)
    # Collapse whitespace
    name = re.sub(r"\s+", " ", name).strip()
    return name or "uploaded_document.txt"

def validate_file(filename: str, file_size: int) -> Tuple[bool, str]:
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"This file type isn't supported. Please upload a PDF, DOCX or TXT file."
    
    max_bytes = MAX_FILE_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        return False, f"File size exceeds the {MAX_FILE_SIZE_MB}MB limit."
        
    if file_size == 0:
        return False, "The uploaded file is empty."
        
    return True, ""

def extract_text_from_file(file_path: str) -> List[Dict[str, Any]]:
    """
    Extracts text page-by-page.
    Returns: List[{"page": int, "text": str}]
    """
    path = Path(file_path)
    ext = path.suffix.lower()
    pages_data = []

    if ext == ".pdf":
        try:
            reader = PdfReader(str(path))
            for i, page in enumerate(reader.pages):
                extracted = page.extract_text() or ""
                pages_data.append({
                    "page": i + 1,
                    "text": extracted
                })
        except Exception as e:
            raise ValueError(f"Failed to read PDF: {str(e)}")

    elif ext == ".docx":
        try:
            doc = DocxDocument(str(path))
            # Group every ~500 words or 5 paragraphs into an estimated page
            current_page_text = []
            page_num = 1
            word_count = 0
            
            for para in doc.paragraphs:
                text = para.text.strip()
                if not text:
                    continue
                current_page_text.append(text)
                word_count += len(text.split())
                if word_count >= 400:
                    pages_data.append({
                        "page": page_num,
                        "text": "\n\n".join(current_page_text)
                    })
                    current_page_text = []
                    page_num += 1
                    word_count = 0

            if current_page_text:
                pages_data.append({
                    "page": page_num,
                    "text": "\n\n".join(current_page_text)
                })
        except Exception as e:
            raise ValueError(f"Failed to read Word document: {str(e)}")

    elif ext == ".txt":
        try:
            with open(path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
            
            # Split into estimated pages every 500 words or by sections
            paragraphs = content.split("\n\n")
            current_page = []
            page_num = 1
            word_count = 0
            
            for p in paragraphs:
                p_clean = p.strip()
                if not p_clean:
                    continue
                current_page.append(p_clean)
                word_count += len(p_clean.split())
                if word_count >= 400:
                    pages_data.append({
                        "page": page_num,
                        "text": "\n\n".join(current_page)
                    })
                    current_page = []
                    page_num += 1
                    word_count = 0
                    
            if current_page:
                pages_data.append({
                    "page": page_num,
                    "text": "\n\n".join(current_page)
                })
        except Exception as e:
            raise ValueError(f"Failed to read text file: {str(e)}")
            
    else:
        raise ValueError(f"Unsupported file format: {ext}")

    # Check if any readable text was extracted
    total_text = "".join(p["text"].strip() for p in pages_data)
    if not total_text:
        raise ValueError("We couldn't extract readable text from this document.")

    return pages_data
