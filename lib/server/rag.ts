import { readStoredFile } from "./uploads";

const RAG_API_URL = process.env.RAG_API_URL ?? "http://rag-api:8000";
const RAG_INTERNAL_TOKEN = process.env.RAG_INTERNAL_TOKEN ?? "change-me";

async function ragFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("x-internal-token", RAG_INTERNAL_TOKEN);
  const response = await fetch(`${RAG_API_URL}${path}`, { ...init, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.detail ?? "RAG service request failed.");
  }
  return body;
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
  form.set("file", new Blob([content], { type: "application/pdf" }), input.originalName);
  for (const [key, value] of Object.entries(input)) {
    if (key !== "storageKey") form.set(key, value);
  }
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
