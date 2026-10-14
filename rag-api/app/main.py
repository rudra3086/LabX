from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile

from .rag import RAGService
from .schemas import (
    ChatRequest,
    ChatResponse,
    DocumentResponse,
    SearchRequest,
    Source,
    VivaEvaluateRequest,
    VivaQuestion,
    VivaStartRequest,
)
from .settings import settings

rag = RAGService()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    await rag.startup()
    yield
    await rag.shutdown()


app = FastAPI(title="LabX RAG API", version="1.1.0", lifespan=lifespan)


def authorize(token: str | None) -> None:
    if token != settings.internal_token:
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "model": settings.embedding_model, "llm": settings.llm_model}


@app.post("/documents/index", response_model=DocumentResponse)
async def index_document(
    file: UploadFile = File(...),
    document_id: str | None = Form(default=None),
    documentId: str | None = Form(default=None),
    document_name: str | None = Form(default=None),
    originalName: str | None = Form(default=None),
    subject_id: str | None = Form(default=None),
    subjectId: str | None = Form(default=None),
    faculty_id: str | None = Form(default=None),
    facultyId: str | None = Form(default=None),
    unit: str = Form(...),
    x_internal_token: str | None = Header(default=None),
) -> DocumentResponse:
    authorize(x_internal_token)
    doc_id = document_id or documentId
    doc_name = document_name or originalName or file.filename or "document.pdf"
    sub_id = subject_id or subjectId
    fac_id = faculty_id or facultyId

    if not doc_id or not sub_id or not fac_id:
        raise HTTPException(status_code=422, detail="document_id, subject_id, and faculty_id are required.")

    if file.content_type and "pdf" not in file.content_type.lower() and not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    content = await file.read()
    try:
        pages, chunks = await rag.index_document(content, doc_id, doc_name, sub_id, fac_id, unit)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return DocumentResponse(document_id=doc_id, chunks=chunks, pages=pages)


@app.delete("/documents/{document_id}")
async def delete_document(document_id: str, x_internal_token: str | None = Header(default=None)) -> dict[str, bool]:
    authorize(x_internal_token)
    await rag.delete_document(document_id)
    return {"deleted": True}


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, x_internal_token: str | None = Header(default=None)) -> ChatResponse:
    authorize(x_internal_token)
    answer, sources = await rag.answer(request.subject_id, request.question)
    return ChatResponse(answer=answer, sources=sources)


@app.post("/search", response_model=list[Source])
async def search(request: SearchRequest, x_internal_token: str | None = Header(default=None)) -> list[Source]:
    authorize(x_internal_token)
    hits = await rag.search(request.subject_id, request.question, request.limit)
    return [
        Source(
            document_id=str(hit["document_id"]),
            document_name=str(hit["document_name"]),
            page_number=int(hit["page_number"]),
            unit=str(hit["unit"]),
            chunk_index=int(hit["chunk_index"]),
            score=float(hit["score"]),
        )
        for hit in hits
    ]


@app.post("/viva/questions", response_model=list[VivaQuestion])
async def viva_questions(
    request: VivaStartRequest, x_internal_token: str | None = Header(default=None)
) -> list[VivaQuestion]:
    authorize(x_internal_token)
    return [VivaQuestion(**question) for question in await rag.generate_questions(request.subject_id, request.count)]


@app.post("/viva/evaluate")
async def viva_evaluate(
    request: VivaEvaluateRequest, x_internal_token: str | None = Header(default=None)
) -> dict[str, object]:
    authorize(x_internal_token)
    feedback, score, sources = await rag.evaluate(request.subject_id, request.question, request.answer)
    return {"feedback": feedback, "score": score, "sources": sources}
