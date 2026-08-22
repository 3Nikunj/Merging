"""Extract plain text from uploaded resume files (PDF / DOCX)."""

from __future__ import annotations

import io

from fastapi import HTTPException, UploadFile
from pypdf import PdfReader
from docx import Document

MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB, matches frontend's "Max 5MB" label
ALLOWED_EXTENSIONS = {"pdf", "docx"}


def _extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail="Could not read this PDF. It may be corrupted or password-protected.",
        ) from exc

    pages_text = []
    for page in reader.pages:
        try:
            pages_text.append(page.extract_text() or "")
        except Exception:
            # Skip unreadable pages rather than failing the whole upload
            continue

    text = "\n".join(pages_text).strip()
    if not text:
        raise HTTPException(
            status_code=422,
            detail="No readable text found in this PDF. It may be a scanned image without a text layer.",
        )
    return text


def _extract_text_from_docx(file_bytes: bytes) -> str:
    try:
        document = Document(io.BytesIO(file_bytes))
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail="Could not read this DOCX file. It may be corrupted.",
        ) from exc

    paragraphs = [p.text for p in document.paragraphs if p.text.strip()]
    text = "\n".join(paragraphs).strip()
    if not text:
        raise HTTPException(
            status_code=422,
            detail="No readable text found in this document.",
        )
    return text


async def extract_resume_text(file: UploadFile) -> str:
    """Read an uploaded resume file and return its plain text content."""

    filename = file.filename or ""
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are supported.",
        )

    file_bytes = await file.read()

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    if len(file_bytes) > MAX_RESUME_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail="File is too large. Maximum allowed size is 5MB.",
        )

    if extension == "pdf":
        text = _extract_text_from_pdf(file_bytes)
    else:
        text = _extract_text_from_docx(file_bytes)

    # Keep this bounded so it fits comfortably inside LLM prompts downstream
    max_chars = 8000
    if len(text) > max_chars:
        text = text[:max_chars]

    return text