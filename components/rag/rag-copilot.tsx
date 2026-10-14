"use client";

import { useEffect, useState } from "react";
import { Bot, FileUp, Send, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Subject = { id: string; code: string; name: string };
type Source = { document_name: string; page_number: number; unit: string; score: number };

export function RagCopilot({ subjects, faculty = false }: { subjects: Subject[]; faculty?: boolean }) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<{ answer: string; sources: Source[] } | null>(null);
  const [busy, setBusy] = useState(false);
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

  async function ask() {
    if (!subjectId || !question.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/rag/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ subjectId, question }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message ?? "Unable to answer.");
      setAnswer(json.data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to answer.");
    } finally {
      setBusy(false);
    }
  }

  async function upload() {
    if (!file || !subjectId || !unit.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("file", file); form.set("subjectId", subjectId); form.set("unit", unit);
      const response = await fetch("/api/rag/documents/upload", { method: "POST", body: form });
      if (!response.ok) throw new Error("Material indexing failed.");
      const json = await response.json();
      setDocuments((current) => [json.data, ...current]);
      setFile(null); setUnit("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Material indexing failed.");
    } finally { setBusy(false); }
  }

  async function removeDocument(id: string) {
    const response = await fetch(`/api/rag/documents/${id}`, { method: "DELETE" });
    if (response.ok) setDocuments((current) => current.filter((document) => document.id !== id));
  }

  async function startViva() {
    setError(null);
    const response = await fetch("/api/rag/viva/start", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ subjectId }) });
    const json = await response.json();
    if (!response.ok) {
      setError(json.error?.message ?? "Unable to start viva.");
      return;
    }
    setViva({ ...json.data, current: 0 }); setFeedback(null);
  }

  async function submitViva() {
    if (!viva || !vivaAnswer.trim()) return;
    const response = await fetch(`/api/rag/viva/${viva.id}/answer`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ answer: vivaAnswer }) });
    const json = await response.json();
    if (!response.ok) {
      setError(json.error?.message ?? "Unable to evaluate answer.");
      return;
    }
    setFeedback(json.data); setVivaAnswer("");
    setViva((current) => current ? { ...current, current: current.current + 1 } : current);
  }

  const currentQuestion = viva ? viva.questions[viva.current] : undefined;
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-navy-700" />AI Viva Copilot</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="w-full rounded-md border border-surface-300 bg-white px-3 py-2 text-sm">
            {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.code} — {subject.name}</option>)}
          </select>
          <div className="flex gap-2">
            <input value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} placeholder="Ask a question from the course material..." className="min-w-0 flex-1 rounded-md border border-surface-300 px-3 py-2 text-sm" />
            <Button onClick={ask} disabled={busy || !question.trim()}><Send className="mr-2 h-4 w-4" />Ask</Button>
          </div>
          {answer && <div className="rounded-md bg-surface-50 p-4 text-sm"><p className="whitespace-pre-wrap text-slate-800">{answer.answer}</p><div className="mt-3 flex flex-wrap gap-2">{answer.sources.map((source, index) => <span key={`${source.document_name}-${index}`} className="rounded bg-white px-2 py-1 text-xs text-surface-600">{source.document_name}, p. {source.page_number}</span>)}</div></div>}
        </CardContent>
      </Card>

      {faculty ? <Card><CardHeader><CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-navy-700" />Course material</CardTitle></CardHeader><CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-3"><input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit or module" className="rounded-md border border-surface-300 px-3 py-2 text-sm" /><input type="file" accept=".pdf,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="rounded-md border border-surface-300 px-3 py-2 text-sm" /><Button onClick={upload} disabled={busy || !file || !unit.trim()}><FileUp className="mr-2 h-4 w-4" />Index PDF</Button></div>
        <div className="divide-y divide-surface-100 rounded-md border border-surface-200">{documents.length === 0 ? <p className="p-3 text-sm text-surface-500">No indexed material yet.</p> : documents.map((document) => <div key={document.id} className="flex items-center justify-between gap-3 p-3 text-sm"><span><strong>{document.subject.code}</strong> · {document.originalName} <span className="text-surface-500">({document.unit}, {document.pageCount} pages)</span></span><button type="button" onClick={() => removeDocument(document.id)} className="rounded p-1 text-surface-500 hover:bg-rose-50 hover:text-rose-600" aria-label={`Delete ${document.originalName}`}><Trash2 className="h-4 w-4" /></button></div>)}</div>
      </CardContent></Card> : <Card><CardHeader><CardTitle>Viva preparation</CardTitle></CardHeader><CardContent className="space-y-3">
        {!viva ? <Button onClick={startViva} disabled={busy}>Start viva</Button> : <><p className="font-medium">{currentQuestion?.question ?? "Viva complete"}</p><textarea value={vivaAnswer} onChange={(e) => setVivaAnswer(e.target.value)} placeholder="Write your answer..." className="min-h-24 w-full rounded-md border border-surface-300 p-3 text-sm" /><Button onClick={submitViva} disabled={busy || !vivaAnswer.trim()}>Submit answer</Button>{feedback && <div className="rounded-md bg-surface-50 p-3 text-sm"><strong>Score: {feedback.score}/10</strong><p className="mt-1 whitespace-pre-wrap">{feedback.feedback}</p></div>}</>}
      </CardContent></Card>}
    </div>
  );
}
