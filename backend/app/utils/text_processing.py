import re
from typing import List, Dict, Any

def clean_text(text: str) -> str:
    """Cleans extracted text by normalizing whitespace, removing null bytes and non-printable characters."""
    if not text:
        return ""
    # Replace null bytes
    text = text.replace("\x00", " ")
    # Normalize carriage returns
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Replace excessive consecutive spaces/tabs
    text = re.sub(r"[ \t]+", " ", text)
    # Replace more than 3 consecutive newlines with 2
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()

def chunk_document_pages(
    pages: List[Dict[str, Any]],
    document_id: str,
    document_name: str,
    chunk_size: int = 700,
    chunk_overlap: int = 150
) -> List[Dict[str, Any]]:
    """
    Chunks document content page by page.
    Each item in `pages` has {"page": int, "text": str}.
    Returns chunks with:
      chunk_id, document_id, document_name, page_number, text
    """
    chunks = []
    chunk_counter = 0

    for page_info in pages:
        page_num = page_info.get("page", 1)
        raw_text = page_info.get("text", "")
        cleaned = clean_text(raw_text)
        if not cleaned:
            continue

        # If page text is within chunk size, keep it as a single chunk
        if len(cleaned) <= chunk_size:
            chunk_counter += 1
            chunks.append({
                "chunk_id": f"{document_id}_p{page_num}_c{chunk_counter}",
                "document_id": document_id,
                "document_name": document_name,
                "page_number": page_num,
                "text": cleaned
            })
            continue

        # Split into paragraphs or sentences
        paragraphs = cleaned.split("\n\n")
        current_chunk = ""
        
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            if len(current_chunk) + len(para) + 2 <= chunk_size:
                current_chunk = (current_chunk + "\n\n" + para).strip()
            else:
                if current_chunk:
                    chunk_counter += 1
                    chunks.append({
                        "chunk_id": f"{document_id}_p{page_num}_c{chunk_counter}",
                        "document_id": document_id,
                        "document_name": document_name,
                        "page_number": page_num,
                        "text": current_chunk
                    })
                    # Keep overlap from the end of current_chunk
                    overlap_text = current_chunk[-chunk_overlap:] if len(current_chunk) > chunk_overlap else ""
                    current_chunk = (overlap_text + " " + para).strip()
                else:
                    # Paragraph itself is larger than chunk_size, split by characters/sentences
                    start = 0
                    while start < len(para):
                        end = min(start + chunk_size, len(para))
                        part = para[start:end].strip()
                        if part:
                            chunk_counter += 1
                            chunks.append({
                                "chunk_id": f"{document_id}_p{page_num}_c{chunk_counter}",
                                "document_id": document_id,
                                "document_name": document_name,
                                "page_number": page_num,
                                "text": part
                            })
                        start += (chunk_size - chunk_overlap)
                    current_chunk = ""

        if current_chunk:
            chunk_counter += 1
            chunks.append({
                "chunk_id": f"{document_id}_p{page_num}_c{chunk_counter}",
                "document_id": document_id,
                "document_name": document_name,
                "page_number": page_num,
                "text": current_chunk
            })

    return chunks
