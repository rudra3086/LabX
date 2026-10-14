import { readStoredFile } from "./uploads";

const RAG_API_URL = process.env.RAG_API_URL ?? "http://rag-api:8000";
const RAG_INTERNAL_TOKEN = process.env.RAG_INTERNAL_TOKEN ?? "change-me";
const RAG_TIMEOUT_MS = 45_000;

async function ragFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("x-internal-token", RAG_INTERNAL_TOKEN);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RAG_TIMEOUT_MS);

  try {
    const response = await fetch(`${RAG_API_URL}${path}`, {
      ...init,
      headers,
      signal: init.signal ?? controller.signal,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.detail ?? `RAG service error (${response.status})`);
    }
    return body;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("RAG service request timed out. Please try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function checkRagHealth(): Promise<{ status: string; model?: string; llm?: string }> {
  return ragFetch("/health", { method: "GET" });
}

export async function indexRagDocument(input: {
  storageKey: string;
  originalName: string;
  documentId: string;
  subjectId: string;
  facultyId: string;
  unit: string;
}) {
  const content = await readStoredFile(input.storageKey);
  const form = new FormData();
  form.set("file", new Blob([new Uint8Array(content)], { type: "application/pdf" }), input.originalName);
  form.set("document_id", input.documentId);
  form.set("document_name", input.originalName);
  form.set("subject_id", input.subjectId);
  form.set("faculty_id", input.facultyId);
  form.set("unit", input.unit);

  return ragFetch("/documents/index", { method: "POST", body: form });
}

export function deleteRagDocument(documentId: string) {
  return ragFetch(`/documents/${documentId}`, { method: "DELETE" });
}

export function ragChat(subjectId: string, question: string) {
  return ragFetch("/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ subject_id: subjectId, question }),
  });
}

export function ragSearch(subjectId: string, question: string, limit = 6) {
  return ragFetch("/search", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ subject_id: subjectId, question, limit }),
  });
}

export function ragVivaQuestions(subjectId: string, count = 5) {
  return ragFetch("/viva/questions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ subject_id: subjectId, count }),
  });
}

export function ragVivaEvaluate(subjectId: string, question: string, answer: string) {
  return ragFetch("/viva/evaluate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ subject_id: subjectId, question, answer }),
  });
}
