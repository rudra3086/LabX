"use client";

import { useEffect, useState } from "react";
import { Bot, FileUp, Loader2, Send, Sparkles, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Subject = { id: string; code: string; name: string };
type Source = { document_name: string; page_number: number; unit: string; score: number };

const QUICK_PROMPTS = [
  "What are the main topics covered in this subject?",
  "List the core viva questions and concepts.",
  "Explain the key lab procedures and precautions.",
];

export function RagCopilot({ subjects, faculty = false }: { subjects: Subject[]; faculty?: boolean }) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<{ answer: string; sources: Source[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyMessage, setBusyMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<Array<{ id: string; originalName: string; unit: string; subject: { code: string }; pageCount: number }>>([]);
  const [viva, setViva] = useState<{ id: string; questions: Array<{ question: string }>; current: number } | null>(null);
  const [vivaAnswer, setVivaAnswer] = useState("");
  const [feedback, setFeedback] = useState<{ feedback: string; score: number } | null>(null);

  useEffect(() => {
    if (!faculty) return;
    fetch("/api/rag/documents")
      .then((response) => response.json())
      .then((json) => setDocuments(json.data ?? []))
      .catch(() => setDocuments([]));
  }, [faculty]);

  async function ask(queryText?: string) {
    const q = (queryText ?? question).trim();
    if (!subjectId || !q) return;
    setBusy(true);
    setBusyMessage("Searching syllabus and generating answer...");
    setError(null);
    try {
      const response = await fetch("/api/rag/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subjectId, question: q }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message ?? "Unable to answer.");
      setAnswer(json.data);
      if (queryText) setQuestion(queryText);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to answer.");
    } finally {
      setBusy(false);
      setBusyMessage("");
    }
  }

  async function upload() {
    if (!file || !subjectId || !unit.trim()) return;
    setBusy(true);
    setBusyMessage("Parsing PDF, generating embeddings, and indexing...");
    setError(null);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("subjectId", subjectId);
      form.set("unit", unit);
      const response = await fetch("/api/rag/documents/upload", { method: "POST", body: form });
      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(json.error?.message ?? "Material indexing failed.");
      }
      const json = await response.json();
      setDocuments((current) => [json.data, ...current]);
      setFile(null);
      setUnit("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Material indexing failed.");
    } finally {
      setBusy(false);
      setBusyMessage("");
    }
  }

  async function removeDocument(id: string) {
    const response = await fetch(`/api/rag/documents/${id}`, { method: "DELETE" });
    if (response.ok) setDocuments((current) => current.filter((document) => document.id !== id));
  }

  async function startViva() {
    setBusy(true);
    setBusyMessage("Extracting key concepts & generating viva questions...");
    setError(null);
    try {
      const response = await fetch("/api/rag/viva/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subjectId }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error?.message ?? "Unable to start viva.");
      }
      setViva({ ...json.data, current: 0 });
      setFeedback(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to start viva.");
    } finally {
      setBusy(false);
      setBusyMessage("");
    }
  }

  async function submitViva() {
    if (!viva || !vivaAnswer.trim()) return;
    setBusy(true);
    setBusyMessage("Evaluating your response against course material...");
    setError(null);
    try {
      const response = await fetch(`/api/rag/viva/${viva.id}/answer`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answer: vivaAnswer }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error?.message ?? "Unable to evaluate answer.");
      }
      setFeedback(json.data);
      setVivaAnswer("");
      setViva((current) => (current ? { ...current, current: current.current + 1 } : current));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to evaluate answer.");
    } finally {
      setBusy(false);
      setBusyMessage("");
    }
  }

  const currentQuestion = viva ? viva.questions[viva.current] : undefined;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-brand" />
            AI Viva & Course Copilot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label htmlFor="subject-select" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Subject:
            </label>
            <select
              id="subject-select"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="flex-1 rounded-md border border-surface-300 bg-white px-3 py-2 text-sm"
            >
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.code} — {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {QUICK_PROMPTS.map((qp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => ask(qp)}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-full border border-surface-200 bg-surface-50 px-3 py-1 text-xs text-slate-700 hover:bg-surface-100 hover:border-surface-300 transition-colors disabled:opacity-50"
              >
                <Sparkles className="h-3 w-3 text-brand" />
                {qp}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !busy && ask()}
              placeholder="Ask a question from the course material..."
              className="min-w-0 flex-1 rounded-md border border-surface-300 px-3 py-2 text-sm focus:outline-brand"
              disabled={busy}
            />
            <Button onClick={() => ask()} disabled={busy || !question.trim()}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {busy ? "Thinking..." : "Ask"}
            </Button>
          </div>

          {busy && busyMessage && (
            <div className="flex items-center gap-2 text-xs text-slate-500 animate-pulse">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />
              <span>{busyMessage}</span>
            </div>
          )}

          {answer && (
            <div className="rounded-md border border-surface-200 bg-surface-50 p-4 text-sm space-y-3">
              <p className="whitespace-pre-wrap text-slate-800 leading-relaxed">{answer.answer}</p>
              {answer.sources && answer.sources.length > 0 && (
                <div className="border-t border-surface-200/80 pt-2">
                  <span className="text-xs font-semibold text-slate-500 block mb-1.5">Grounded Sources:</span>
                  <div className="flex flex-wrap gap-2">
                    {answer.sources.map((source, index) => (
                      <span
                        key={`${source.document_name}-${index}`}
                        className="inline-flex items-center rounded-md border border-surface-200 bg-white px-2 py-1 text-xs text-slate-600 shadow-sm"
                      >
                        📄 {source.document_name} · p. {source.page_number} ({source.unit})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {faculty ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-brand" />
              Course Material Indexing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Unit or Module (e.g. Unit 1)"
                className="rounded-md border border-surface-300 px-3 py-2 text-sm focus:outline-brand"
                disabled={busy}
              />
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="rounded-md border border-surface-300 px-3 py-2 text-sm"
                disabled={busy}
              />
              <Button onClick={upload} disabled={busy || !file || !unit.trim()}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
                {busy ? "Indexing..." : "Index PDF"}
              </Button>
            </div>
            <div className="divide-y divide-surface-100 rounded-md border border-surface-200">
              {documents.length === 0 ? (
                <p className="p-4 text-center text-sm text-surface-500">No indexed course material yet.</p>
              ) : (
                documents.map((document) => (
                  <div key={document.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                    <span>
                      <strong className="text-slate-800">{document.subject.code}</strong> · {document.originalName}{" "}
                      <span className="text-surface-500">
                        ({document.unit}, {document.pageCount} pages)
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeDocument(document.id)}
                      className="rounded p-1 text-surface-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      aria-label={`Delete ${document.originalName}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand" />
              Interactive Viva Preparation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!viva ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  Generate mock viva questions pulled directly from the course syllabus to test your knowledge with AI grading.
                </p>
                <Button onClick={startViva} disabled={busy}>
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  {busy ? "Starting viva..." : "Start viva session"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-surface-200 pb-2">
                  <span className="text-xs font-semibold uppercase text-brand tracking-wider">
                    Question {viva.current + 1} of {viva.questions.length}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  {currentQuestion?.question ?? "Viva session complete!"}
                </p>
                {currentQuestion && (
                  <>
                    <textarea
                      value={vivaAnswer}
                      onChange={(e) => setVivaAnswer(e.target.value)}
                      placeholder="Write your answer clearly..."
                      className="min-h-28 w-full rounded-md border border-surface-300 p-3 text-sm focus:outline-brand"
                      disabled={busy}
                    />
                    <Button onClick={submitViva} disabled={busy || !vivaAnswer.trim()}>
                      {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      {busy ? "Evaluating..." : "Submit Answer"}
                    </Button>
                  </>
                )}
                {feedback && (
                  <div className="rounded-md border border-surface-200 bg-surface-50 p-4 text-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-brand">Score: {feedback.score} / 10</strong>
                    </div>
                    <p className="text-slate-700 whitespace-pre-wrap">{feedback.feedback}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
