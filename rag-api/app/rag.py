import re
from dataclasses import dataclass
from typing import Any

import fitz
import httpx
from qdrant_client import QdrantClient
from qdrant_client.http import models
from sentence_transformers import SentenceTransformer

from .schemas import Source
from .settings import settings


@dataclass
class Chunk:
    text: str
    page_number: int
    chunk_index: int


class RAGService:
    def __init__(self) -> None:
        self.embedder = SentenceTransformer(settings.embedding_model)
        self.qdrant = QdrantClient(url=settings.qdrant_url)
        self._ensure_collection()

    def _ensure_collection(self) -> None:
        if not self.qdrant.collection_exists(settings.qdrant_collection):
            self.qdrant.create_collection(
                collection_name=settings.qdrant_collection,
                vectors_config=models.VectorParams(
                    size=self.embedder.get_sentence_embedding_dimension(),
                    distance=models.Distance.COSINE,
                ),
            )

    def extract_chunks(self, content: bytes, unit: str) -> tuple[list[Chunk], int]:
        document = fitz.open(stream=content, filetype="pdf")
        chunks: list[Chunk] = []
        index = 0
        for page_number, page in enumerate(document, start=1):
            text = re.sub(r"\s+", " ", page.get_text()).strip()
            if not text:
                continue
            words = text.split()
            for start in range(0, len(words), 180):
                part = " ".join(words[start : start + 220]).strip()
                if part:
                    chunks.append(Chunk(part, page_number, index))
                    index += 1
        return chunks, len(document)

    def index_document(
        self,
        content: bytes,
        document_id: str,
        document_name: str,
        subject_id: str,
        faculty_id: str,
        unit: str,
    ) -> tuple[int, int]:
        chunks, pages = self.extract_chunks(content, unit)
        if not chunks:
            raise ValueError("The PDF contains no extractable text.")
        vectors = self.embedder.encode([c.text for c in chunks], normalize_embeddings=True)
        points = [
            models.PointStruct(
                id=f"{document_id}:{chunk.chunk_index}",
                vector=vector.tolist(),
                payload={
                    "document_id": document_id,
                    "document_name": document_name,
                    "subject_id": subject_id,
                    "faculty_id": faculty_id,
                    "unit": unit,
                    "page_number": chunk.page_number,
                    "chunk_index": chunk.chunk_index,
                    "text": chunk.text,
                },
            )
            for chunk, vector in zip(chunks, vectors)
        ]
        self.qdrant.upsert(collection_name=settings.qdrant_collection, points=points)
        return pages, len(points)

    def delete_document(self, document_id: str) -> None:
        self.qdrant.delete(
            collection_name=settings.qdrant_collection,
            points_selector=models.FilterSelector(
                filter=models.Filter(
                    must=[models.FieldCondition(
                        key="document_id", match=models.MatchValue(value=document_id)
                    )]
                )
            ),
        )

    def search(self, subject_id: str, question: str, limit: int | None = None) -> list[dict[str, Any]]:
        vector = self.embedder.encode(question, normalize_embeddings=True).tolist()
        results = self.qdrant.query_points(
            collection_name=settings.qdrant_collection,
            query=vector,
            query_filter=models.Filter(
                must=[models.FieldCondition(
                    key="subject_id", match=models.MatchValue(value=subject_id)
                )]
            ),
            limit=limit or settings.retrieval_limit,
            score_threshold=settings.retrieval_threshold,
            with_payload=True,
        ).points
        return [point.payload | {"score": point.score} for point in results if point.payload]

    async def answer(self, subject_id: str, question: str) -> tuple[str, list[Source]]:
        hits = self.search(subject_id, question)
        sources = [self._source(hit) for hit in hits]
        if not hits:
            return "The available course material is insufficient to answer that question.", []
        context = "\n\n".join(
            f"[{hit['document_name']}, page {hit['page_number']}]\n{hit['text']}" for hit in hits
        )
        prompt = (
            "Answer only from the provided course material. If it does not contain the answer, "
            "say exactly that the available course material is insufficient. Do not invent facts.\n\n"
            f"COURSE MATERIAL:\n{context}\n\nQUESTION: {question}"
        )
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                f"{settings.ollama_url}/api/generate",
                json={"model": settings.ollama_model, "prompt": prompt, "stream": False},
            )
            response.raise_for_status()
            answer = response.json().get("response", "").strip()
        if not answer:
            raise RuntimeError("Ollama returned an empty answer.")
        return answer, sources

    async def generate_questions(self, subject_id: str, count: int) -> list[dict[str, Any]]:
        hits = self.search(subject_id, "important concepts definitions procedures viva", 12)
        if not hits:
            raise ValueError("The available course material is insufficient to generate viva questions.")
        context = "\n".join(hit["text"] for hit in hits)
        prompt = (
            f"Create exactly {count} concise viva questions from this material. "
            "Return one question per line, without numbering or answers.\n\n" + context
        )
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                f"{settings.ollama_url}/api/generate",
                json={"model": settings.ollama_model, "prompt": prompt, "stream": False},
            )
            response.raise_for_status()
            text = response.json().get("response", "")
        questions = [line.strip("- 0123456789.").strip() for line in text.splitlines() if line.strip()]
        return [{"question": question, "sources": [
            self._source(hit).model_dump()
            for hit in hits[:3]
        ]} for question in questions[:count]]

    async def evaluate(self, subject_id: str, question: str, answer: str) -> tuple[str, float, list[Source]]:
        hits = self.search(subject_id, question)
        sources = [self._source(hit) for hit in hits]
        if not hits:
            return "The available course material is insufficient to evaluate this answer.", 0.0, []
        context = "\n\n".join(hit["text"] for hit in hits)
        prompt = (
            "Evaluate the student's answer only against the course material. "
            "Return a score from 0 to 10 followed by concise feedback.\n"
            f"MATERIAL:\n{context}\nQUESTION: {question}\nSTUDENT ANSWER: {answer}"
        )
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                f"{settings.ollama_url}/api/generate",
                json={"model": settings.ollama_model, "prompt": prompt, "stream": False},
            )
            response.raise_for_status()
            feedback = response.json().get("response", "").strip()
        match = re.search(r"\b(10(?:\.0)?|[0-9](?:\.[0-9])?)\b", feedback)
        score = min(10.0, max(0.0, float(match.group(1)))) if match else 0.0
        return feedback, score, sources

    @staticmethod
    def _source(hit: dict[str, Any]) -> Source:
        return Source(
            document_id=str(hit["document_id"]),
            document_name=str(hit["document_name"]),
            page_number=int(hit["page_number"]),
            unit=str(hit["unit"]),
            chunk_index=int(hit["chunk_index"]),
            score=float(hit["score"]),
        )
