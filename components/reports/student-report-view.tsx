"use client";

import React, { useState, useEffect } from "react";
import { StudentMonthlyReportData } from "@/lib/server/services/reports";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Award,
  BookOpen,
  MessageSquare,
  RefreshCw,
} from "lucide-react";

export function StudentReportView({
  studentId,
  initialYear,
  initialMonth,
}: {
  studentId: string;
  initialYear: number;
  initialMonth: number;
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [report, setReport] = useState<StudentMonthlyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async (y: number, m: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/student/${studentId}?year=${y}&month=${m}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to load report");
      }
      setReport(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(year, month);
  }, [studentId, year, month]);

  const handleExportCsv = () => {
    window.open(`/api/reports/export?type=student&id=${studentId}&year=${year}&month=${month}`, "_blank");
  };

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  return (
    <div className="space-y-6">
      {/* Controls & Period Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-surface-200 bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <Calendar className="h-5 w-5 text-navy-700" />
          <span className="text-sm font-semibold text-slate-800">Reporting Month:</span>
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value, 10))}
            className="rounded-md border border-surface-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm focus:border-navy-600 focus:outline-none"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            className="rounded-md border border-surface-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm focus:border-navy-600 focus:outline-none"
          >
            {[2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchReport(year, month)}
            disabled={loading}
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExportCsv}
            disabled={loading || !report || report.status === "NO DATA"}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex h-48 items-center justify-center rounded-lg border border-surface-200 bg-white">
          <div className="flex items-center gap-2 text-sm text-surface-500">
            <RefreshCw className="h-4 w-4 animate-spin text-navy-700" />
            Generating monthly performance report...
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {!loading && report && (
        <>
          {/* Status & Student Profile Header */}
          <div className="rounded-lg border border-surface-200 bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    {report.student.name}
                  </h2>
                  <Badge
                    variant={
                      report.status === "COMPLETE"
                        ? "emerald"
                        : report.status === "PARTIALLY GRADED"
                        ? "amber"
                        : "slate"
                    }
                  >
                    {report.status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-surface-500">
                  Roll No: <span className="font-semibold text-slate-700">{report.student.rollNumber}</span> • Student ID: <span className="font-semibold text-slate-700">{report.student.studentId}</span> • Dept: <span className="font-semibold text-slate-700">{report.student.department}</span> (Sem {report.student.semester})
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-surface-400">Reporting Period</span>
                <p className="text-sm font-semibold text-navy-900">
                  {report.period.monthName} {report.period.year}
                </p>
              </div>
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard
              title="Assigned Tasks"
              value={report.summary.assignedTasks}
              icon={<BookOpen className="h-4 w-4 text-navy-700" />}
            />
            <StatCard
              title="Submitted"
              value={report.summary.submittedCount}
              subtitle={`${report.summary.submissionRate}% rate`}
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
            />
            <StatCard
              title="Late Submissions"
              value={report.summary.lateCount}
              icon={<Clock className="h-4 w-4 text-amber-600" />}
            />
            <StatCard
              title="Missed Tasks"
              value={report.summary.missedCount}
              icon={<AlertTriangle className="h-4 w-4 text-rose-600" />}
            />
            <StatCard
              title="Graded"
              value={report.summary.gradedCount}
              subtitle={`of ${report.summary.submittedCount} submitted`}
              icon={<Award className="h-4 w-4 text-teal-600" />}
            />
            <StatCard
              title="Average Score"
              value={report.summary.averageScore !== null ? `${report.summary.averageScore}%` : "—"}
              subtitle={`${report.summary.totalMarksObtained} / ${report.summary.totalMaximumMarks} marks`}
              icon={<Award className="h-4 w-4 text-navy-700" />}
            />
          </div>

          {/* Subject Performance Breakdown */}
          <div className="rounded-lg border border-surface-200 bg-white p-5 shadow-card">
            <h3 className="mb-4 text-base font-semibold text-slate-900">
              Subject-wise Performance
            </h3>
            {report.subjectPerformance.length === 0 ? (
              <p className="py-6 text-center text-sm text-surface-400">
                No practical subjects assigned for this period.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-surface-200 bg-surface-50 text-xs font-semibold text-surface-500">
                      <th className="py-2.5 px-3">Subject</th>
                      <th className="py-2.5 px-3 text-center">Assigned</th>
                      <th className="py-2.5 px-3 text-center">Submitted</th>
                      <th className="py-2.5 px-3 text-center">Late</th>
                      <th className="py-2.5 px-3 text-center">Missed</th>
                      <th className="py-2.5 px-3 text-center">Graded</th>
                      <th className="py-2.5 px-3 text-right">Marks</th>
                      <th className="py-2.5 px-3 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {report.subjectPerformance.map((subj) => (
                      <tr key={subj.subjectId} className="hover:bg-surface-50/50">
                        <td className="py-3 px-3">
                          <span className="font-semibold text-navy-900">{subj.subjectCode}</span>
                          <span className="block text-xs text-surface-500">{subj.subjectName}</span>
                        </td>
                        <td className="py-3 px-3 text-center font-medium">{subj.assignedTasks}</td>
                        <td className="py-3 px-3 text-center font-medium text-emerald-700">
                          {subj.submittedCount}
                        </td>
                        <td className="py-3 px-3 text-center font-medium text-amber-700">
                          {subj.lateCount}
                        </td>
                        <td className="py-3 px-3 text-center font-medium text-rose-700">
                          {subj.missedCount}
                        </td>
                        <td className="py-3 px-3 text-center font-medium text-teal-700">
                          {subj.gradedCount}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-surface-600">
                          {subj.totalMarksObtained} / {subj.totalMaximumMarks}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {subj.averagePercentage !== null ? (
                            <div className="inline-flex items-center gap-2">
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-200">
                                <div
                                  className="h-full bg-navy-700"
                                  style={{ width: `${Math.min(100, subj.averagePercentage)}%` }}
                                />
                              </div>
                              <span className="font-semibold tabular-nums text-slate-800">
                                {subj.averagePercentage}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-surface-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Verbatim Faculty Remarks (Spec §164, §165: No AI Summaries) */}
          <div className="rounded-lg border border-surface-200 bg-white p-5 shadow-card">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-navy-700" />
              <h3 className="text-base font-semibold text-slate-900">Faculty Remarks</h3>
              <span className="text-xs text-surface-400">(Aggregated verbatim from graded tasks)</span>
            </div>

            {report.remarks.length === 0 ? (
              <p className="py-6 text-center text-sm text-surface-400">
                No faculty remarks recorded for this reporting period.
              </p>
            ) : (
              <div className="space-y-3">
                {report.remarks.map((r, i) => (
                  <div
                    key={i}
                    className="rounded-md border border-surface-200 bg-surface-50/50 p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-200 pb-2">
                      <div className="flex items-center gap-2 font-medium text-navy-900">
                        <Badge variant="navy" size="sm">
                          {r.subjectCode}
                        </Badge>
                        <span>{r.taskTitle}</span>
                      </div>
                      <span className="text-xs font-semibold tabular-nums text-teal-800">
                        {r.marks} / {r.maximumMarks} marks
                      </span>
                    </div>
                    <p className="mt-2 text-surface-700 italic">
                      &ldquo;{r.remarks}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
