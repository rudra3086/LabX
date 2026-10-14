import asyncio
import re
import time
from dataclasses import dataclass
from typing import Any

import fitz
import httpx
from qdrant_client import AsyncQdrantClient
from qdrant_client.http import models
from sentence_transformers import SentenceTransformer

from .schemas import Source
from .settings import settings

try:
    import torch
    if hasattr(torch, "set_num_threads"):
        torch.set_num_threads(settings.num_threads)
except Exception:
    pass


@dataclass
class Chunk:
    text: str
    page_number: int
    chunk_index: int


class RAGService:
    def __init__(self) -> None:
        self.embedder = SentenceTransformer(settings.embedding_model)
        self.qdrant = AsyncQdrantClient(url=settings.qdrant_url)
        self.http_client: httpx.AsyncClient | None = None
        self._query_cache: dict[str, list[float]] = {}
        self._query_cache_max: int = 1000
        self._response_cache: dict[str, tuple[float, Any]] = {}
        self._initialized = False

    async def startup(self) -> None:
        if self._initialized:
            return
        self.http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(60.0, connect=10.0),
            limits=httpx.Limits(max_keepalive_connections=20, max_connections=50),
        )
        await self._ensure_collection()
        self._initialized = True

    async def shutdown(self) -> None:
        if self.http_client:
            await self.http_client.aclose()
            self.http_client = None
        await self.qdrant.close()
        self._initialized = False

    async def _ensure_collection(self) -> None:
        exists = await self.qdrant.collection_exists(settings.qdrant_collection)
        if not exists:
            await self.qdrant.create_collection(
                collection_name=settings.qdrant_collection,
                vectors_config=models.VectorParams(
                    size=self.embedder.get_sentence_embedding_dimension(),
                    distance=models.Distance.COSINE,
                ),
            )
        # Ensure fast indexed lookups on filtered payload fields
        try:
            await self.qdrant.create_payload_index(
                collection_name=settings.qdrant_collection,
                field_name="subject_id",
                field_schema=models.PayloadSchemaType.KEYWORD,
            )
        except Exception:
            pass
        try:
            await self.qdrant.create_payload_index(
                collection_name=settings.qdrant_collection,
                field_name="document_id",
                field_schema=models.PayloadSchemaType.KEYWORD,
            )
        except Exception:
            pass

    def _invalidate_subject_cache(self, subject_id: str) -> None:
        prefix = f"{subject_id}:"
        keys_to_remove = [k for k in self._response_cache if k.startswith(prefix)]
        for k in keys_to_remove:
            self._response_cache.pop(k, None)

    def _encode_sync(self, texts: list[str]) -> list[list[float]]:
        try:
            import torch
            with torch.inference_mode():
                embeddings = self.embedder.encode(
                    texts,
                    batch_size=settings.embedding_batch_size,
                    normalize_embeddings=True,
                    show_progress_bar=False,
                )
                return embeddings.tolist()
        except Exception:
            embeddings = self.embedder.encode(
                texts,
                batch_size=settings.embedding_batch_size,
                normalize_embeddings=True,
                show_progress_bar=False,
            )
            return embeddings.tolist()

    async def _encode_query(self, query: str) -> list[float]:
        clean = query.strip().lower()
        if clean in self._query_cache:
            return self._query_cache[clean]

        vectors = await asyncio.to_thread(self._encode_sync, [query])
        vec = vectors[0]
        if len(self._query_cache) >= self._query_cache_max:
            try:
                first = next(iter(self._query_cache))
                del self._query_cache[first]
            except Exception:
                self._query_cache.clear()
        self._query_cache[clean] = vec
        return vec

    def extract_chunks(self, content: bytes, unit: str) -> tuple[list[Chunk], int]:
        with fitz.open(stream=content, filetype="pdf") as document:
            chunks: list[Chunk] = []
            index = 0
            total_pages = len(document)
            for page_number, page in enumerate(document, start=1):
                raw_text = page.get_text()
                text = re.sub(r"\s+", " ", raw_text).strip()
                if not text:
                    continue
                words = text.split()
                if len(words) < 5:
                    continue
                for start in range(0, len(words), 180):
                    chunk_words = words[start : start + 220]
                    if len(chunk_words) < 5:
                        continue
                    part = " ".join(chunk_words).strip()
                    if part:
                        chunks.append(Chunk(part, page_number, index))
                        index += 1
            return chunks, total_pages

    async def index_document(
        self,
        content: bytes,
        document_id: str,
        document_name: str,
        subject_id: str,
        faculty_id: str,
        unit: str,
    ) -> tuple[int, int]:
        chunks, pages = await asyncio.to_thread(self.extract_chunks, content, unit)
        if not chunks:
            raise ValueError("The PDF contains no extractable text.")

        vectors = await asyncio.to_thread(self._encode_sync, [c.text for c in chunks])
        points = [
            models.PointStruct(
                id=f"{document_id}:{chunk.chunk_index}",
                vector=vector,
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

        batch_size = 100
        for i in range(0, len(points), batch_size):
            await self.qdrant.upsert(
                collection_name=settings.qdrant_collection,
                points=points[i : i + batch_size],
            )

        self._invalidate_subject_cache(subject_id)
        return pages, len(points)

    async def delete_document(self, document_id: str) -> None:
        await self.qdrant.delete(
            collection_name=settings.qdrant_collection,
            points_selector=models.FilterSelector(
                filter=models.Filter(
                    must=[models.FieldCondition(
                        key="document_id", match=models.MatchValue(value=document_id)
                    )]
                )
            ),
        )
        self._response_cache.clear()

    async def search(self, subject_id: str, question: str, limit: int | None = None) -> list[dict[str, Any]]:
        vector = await self._encode_query(question)
        query_limit = limit or settings.retrieval_limit
        results = (await self.qdrant.query_points(
            collection_name=settings.qdrant_collection,
            query=vector,
            query_filter=models.Filter(
                must=[models.FieldCondition(
                    key="subject_id", match=models.MatchValue(value=subject_id)
                )]
            ),
            limit=query_limit,
            score_threshold=settings.retrieval_threshold,
            with_payload=True,
        )).points
        return [point.payload | {"score": point.score} for point in results if point.payload]

    async def _generate(self, system_prompt: str, user_prompt: str, max_tokens: int = 800) -> str:
        if not settings.llm_api_key:
            raise RuntimeError("LLM_API_KEY is not configured for the external RAG model.")
        if not self.http_client:
            self.http_client = httpx.AsyncClient(
                timeout=httpx.Timeout(60.0, connect=10.0),
                limits=httpx.Limits(max_keepalive_connections=20, max_connections=50),
            )
        response = await self.http_client.post(
            settings.llm_api_url,
            headers={
                "Authorization": f"Bearer {settings.llm_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.llm_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.2,
                "max_tokens": max_tokens,
            },
        )
        response.raise_for_status()
        payload = response.json()
        try:
            answer = payload["choices"][0]["message"]["content"].strip()
        except (KeyError, IndexError, AttributeError) as exc:
            raise RuntimeError("External LLM returned an invalid chat-completions response.") from exc
        if not answer:
            raise RuntimeError("External LLM returned an empty answer.")
        return answer

    async def answer(self, subject_id: str, question: str) -> tuple[str, list[Source]]:
        cache_key = f"{subject_id}:chat:{question.strip().lower()}"
        now = time.time()
        if cache_key in self._response_cache:
            timestamp, cached_val = self._response_cache[cache_key]
            if now - timestamp < settings.cache_ttl_seconds:
                return cached_val

        hits = await self.search(subject_id, question)
        sources = [self._source(hit) for hit in hits]
        if not hits:
            result = ("The available course material is insufficient to answer that question.", [])
            self._response_cache[cache_key] = (now, result)
            return result

        context = "\n\n".join(
            f"[{hit['document_name']}, page {hit['page_number']}]\n{hit['text']}" for hit in hits
        )
        answer = await self._generate(
            "Answer only from the provided course material. If it does not contain the answer, "
            "say exactly that the available course material is insufficient. Do not invent facts.",
            f"COURSE MATERIAL:\n{context}\n\nQUESTION: {question}",
            max_tokens=600,
        )
        result = (answer, sources)
        self._response_cache[cache_key] = (now, result)
        return result

    async def generate_questions(self, subject_id: str, count: int) -> list[dict[str, Any]]:
        hits = await self.search(subject_id, "important concepts definitions procedures viva", settings.viva_context_limit)
        if not hits:
            raise ValueError("The available course material is insufficient to generate viva questions.")
        context = "\n".join(hit["text"] for hit in hits)
        text = await self._generate(
            "Create concise viva questions from the supplied course material. "
            "Return one question per line, without numbering or answers.",
            f"Create exactly {count} concise viva questions from this material.\n\n{context}",
            max_tokens=400,
        )
        questions = [line.strip("- 0123456789.").strip() for line in text.splitlines() if line.strip()]
        return [{"question": question, "sources": [
            self._source(hit).model_dump()
            for hit in hits[:3]
        ]} for question in questions[:count]]

    async def evaluate(self, subject_id: str, question: str, answer: str) -> tuple[str, float, list[Source]]:
        hits = await self.search(subject_id, question, limit=4)
        sources = [self._source(hit) for hit in hits]
        if not hits:
            return "The available course material is insufficient to evaluate this answer.", 0.0, []
        context = "\n\n".join(hit["text"] for hit in hits)
        feedback = await self._generate(
            "Evaluate the student's answer only against the course material. "
            "Return a score from 0 to 10 followed by concise feedback.",
            f"MATERIAL:\n{context}\nQUESTION: {question}\nSTUDENT ANSWER: {answer}",
            max_tokens=400,
        )
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
