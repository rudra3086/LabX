from typing import Any
from pydantic import BaseModel, Field


class Source(BaseModel):
    document_id: str
    document_name: str
    page_number: int
    unit: str
    chunk_index: int
    score: float


class ChatRequest(BaseModel):
    subject_id: str
    question: str = Field(min_length=3, max_length=2000)


class SearchRequest(ChatRequest):
    limit: int = Field(default=6, ge=1, le=20)


class VivaStartRequest(BaseModel):
    subject_id: str
    count: int = Field(default=5, ge=1, le=10)


class VivaEvaluateRequest(BaseModel):
    subject_id: str
    question: str
    answer: str = Field(min_length=1, max_length=4000)


class ChatResponse(BaseModel):
    answer: str
    sources: list[Source]


class VivaQuestion(BaseModel):
    question: str
    sources: list[Source]


class VivaEvaluation(BaseModel):
    feedback: str
    score: float
    sources: list[Source]


class DocumentResponse(BaseModel):
    document_id: str
    chunks: int
    pages: int
