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

app = FastAPI(title="LabX RAG API", version="1.0.0")
rag = RAGService()


def authorize(token: str | None) -> None:
    if token != settings.internal_token:
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/documents/index", response_model=DocumentResponse)
async def index_document(
    file: UploadFile = File(...),
    document_id: str = Form(...),
    document_name: str = Form(...),
    subject_id: str = Form(...),
    faculty_id: str = Form(...),
    unit: str = Form(...),
    x_internal_token: str | None = Header(default=None),
) -> DocumentResponse:
    authorize(x_internal_token)
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    content = await file.read()
    try:
        pages, chunks = rag.index_document(content, document_id, document_name, subject_id, faculty_id, unit)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return DocumentResponse(document_id=document_id, chunks=chunks, pages=pages)


@app.delete("/documents/{document_id}")
async def delete_document(document_id: str, x_internal_token: str | None = Header(default=None)) -> dict[str, bool]:
    authorize(x_internal_token)
    rag.delete_document(document_id)
    return {"deleted": True}


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, x_internal_token: str | None = Header(default=None)) -> ChatResponse:
    authorize(x_internal_token)
    answer, sources = await rag.answer(request.subject_id, request.question)
    return ChatResponse(answer=answer, sources=sources)


@app.post("/search", response_model=list[Source])
async def search(request: SearchRequest, x_internal_token: str | None = Header(default=None)) -> list[Source]:
    authorize(x_internal_token)
    return [
        Source(
            document_id=hit["document_id"],
            document_name=hit["document_name"],
            page_number=hit["page_number"],
            unit=hit["unit"],
            chunk_index=hit["chunk_index"],
            score=hit["score"],
        )
        for hit in rag.search(request.subject_id, request.question, request.limit)
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
