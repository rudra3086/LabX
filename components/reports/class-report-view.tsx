"use client";

import React, { useState, useEffect } from "react";
import { ClassMonthlyReportData, ClassStudentRow } from "@/lib/server/services/reports";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  FileText,
  Download,
  FileDown,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Award,
  RefreshCw,
  Search,
  AlertCircle,
  Eye,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { StudentReportView } from "./student-report-view";

interface SessionOption {
  id: string;
  name: string;
  subjectCode: string;
  subjectName: string;
}

export function ClassReportView({
  sessions,
  initialSessionId,
  initialYear,
  initialMonth,
}: {
  sessions: SessionOption[];
  initialSessionId: string;
  initialYear: number;
  initialMonth: number;
}) {
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [report, setReport] = useState<ClassMonthlyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & filter
  const [searchTerm, setSearchTerm] = useState("");
  const [filterIndicator, setFilterIndicator] = useState<string>("ALL");

  // Student drill-down modal
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const fetchReport = async (sId: string, y: number, m: number) => {
    if (!sId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/class/${sId}?year=${y}&month=${m}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to load class report");
      }
      setReport(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(sessionId, year, month);
  }, [sessionId, year, month]);

  const handleExport = (format: "csv" | "pdf") => {
    window.open(
      `/api/reports/export?type=class&id=${sessionId}&year=${year}&month=${month}&format=${format}`,
      "_blank"
    );
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

  const filteredStudents = (report?.students || []).filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterIndicator === "ATTENTION") {
      return s.indicator !== "GOOD_STANDING";
    }
    if (filterIndicator === "LOW_PERFORMANCE") {
      return s.indicator === "LOW_PERFORMANCE";
    }
    if (filterIndicator === "HIGH_MISSED") {
      return s.indicator === "HIGH_MISSED";
    }
    if (filterIndicator === "HIGH_LATE") {
      return s.indicator === "HIGH_LATE";
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Session and Month Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-surface-200 bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="mr-2 text-xs font-semibold text-surface-500">Session:</label>
            <select
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="rounded-md border border-surface-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm focus:border-navy-600 focus:outline-none"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.subjectCode} — {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mr-2 text-xs font-semibold text-surface-500">Month:</label>
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
          </div>

          <div>
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
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 rounded-md p-0 shadow-none"
            aria-label="Refresh class report"
            title="Refresh class report"
            onClick={() => fetchReport(sessionId, year, month)}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <div className="group relative">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 rounded-md p-0 shadow-none"
              aria-label="Download class report"
              title="Download class report"
              disabled={loading || !report}
            >
              <Download className="h-4 w-4" />
            </Button>
            <div className="invisible absolute right-0 top-full z-20 mt-1 w-40 rounded-md border border-surface-200 bg-white p-1 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <button
                type="button"
                onClick={() => handleExport("pdf")}
                className="flex w-full items-center rounded px-3 py-2 text-left text-sm text-surface-700 hover:bg-surface-100"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Download PDF
              </button>
              <button
                type="button"
                onClick={() => handleExport("csv")}
                className="flex w-full items-center rounded px-3 py-2 text-left text-sm text-surface-700 hover:bg-surface-100"
              >
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex h-48 items-center justify-center rounded-lg border border-surface-200 bg-white">
          <div className="flex items-center gap-2 text-sm text-surface-500">
            <RefreshCw className="h-4 w-4 animate-spin text-navy-700" />
            Generating class performance report...
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
          {/* Class Overview Header */}
          <div className="rounded-lg border border-surface-200 bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  {report.session.subjectCode} — {report.session.subjectName}
                </h2>
                <p className="mt-1 text-xs text-surface-500">
                  Practical Session: <span className="font-semibold text-slate-700">{report.session.name}</span> • Faculty: <span className="font-semibold text-slate-700">{report.session.facultyName}</span> • Sem {report.session.semester} {report.session.batch ? `(${report.session.batch})` : ""}
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

          {/* Class Summary Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            <StatCard
              title="Students"
              value={report.classMetrics.totalStudents}
              icon={<Users className="h-4 w-4 text-navy-700" />}
            />
            <StatCard
              title="Tasks in Month"
              value={report.classMetrics.totalTasks}
              icon={<FileText className="h-4 w-4 text-navy-700" />}
            />
            <StatCard
              title="Expected"
              value={report.classMetrics.expectedSubmissions}
              subtitle="submissions"
            />
            <StatCard
              title="Submitted"
              value={report.classMetrics.totalSubmissions}
              subtitle={`${report.classMetrics.submissionRate}% rate`}
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
            />
            <StatCard
              title="Late"
              value={report.classMetrics.totalLateSubmissions}
              subtitle={`${report.classMetrics.lateRate}% late`}
              icon={<Clock className="h-4 w-4 text-amber-600" />}
            />
            <StatCard
              title="Missed"
              value={report.classMetrics.totalMissedSubmissions}
              subtitle={`${report.classMetrics.missedRate}% missed`}
              icon={<AlertTriangle className="h-4 w-4 text-rose-600" />}
            />
            <StatCard
              title="Graded"
              value={report.classMetrics.totalGradedSubmissions}
              subtitle={`of ${report.classMetrics.totalSubmissions}`}
              icon={<Award className="h-4 w-4 text-teal-600" />}
            />
            <StatCard
              title="Class Avg"
              value={report.classMetrics.classAverageScore !== null ? `${report.classMetrics.classAverageScore}%` : "—"}
              icon={<Award className="h-4 w-4 text-navy-700" />}
            />
          </div>

          {/* Student Roster Table with Indicators */}
          <div className="rounded-lg border border-surface-200 bg-white p-5 shadow-card">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-navy-700" />
                <h3 className="text-base font-semibold text-slate-900">Student Performance Roster</h3>
                <span className="text-xs text-surface-400">({filteredStudents.length} students)</span>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-surface-400" />
                  <input
                    type="text"
                    placeholder="Search name, roll number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-48 rounded-md border border-surface-300 pl-8 pr-3 py-1.5 text-xs focus:border-navy-600 focus:outline-none"
                  />
                </div>

                <select
                  value={filterIndicator}
                  onChange={(e) => setFilterIndicator(e.target.value)}
                  className="rounded-md border border-surface-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 shadow-sm focus:border-navy-600 focus:outline-none"
                >
                  <option value="ALL">All Students</option>
                  <option value="ATTENTION">Needs Attention</option>
                  <option value="LOW_PERFORMANCE">Low Performance (&lt;40%)</option>
                  <option value="HIGH_MISSED">High Missed (≥2)</option>
                  <option value="HIGH_LATE">High Late (≥2)</option>
                </select>
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <p className="py-8 text-center text-sm text-surface-400">
                No students match the current filter.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-surface-200 bg-surface-50 text-xs font-semibold text-surface-500">
                      <th className="py-2.5 px-3">Student</th>
                      <th className="py-2.5 px-3 text-center">Assigned</th>
                      <th className="py-2.5 px-3 text-center">Submitted</th>
                      <th className="py-2.5 px-3 text-center">Late</th>
                      <th className="py-2.5 px-3 text-center">Missed</th>
                      <th className="py-2.5 px-3 text-center">Graded</th>
                      <th className="py-2.5 px-3 text-right">Average</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-center">Indicator</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {filteredStudents.map((s) => (
                      <tr key={s.studentId} className="hover:bg-surface-50/50">
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-900">{s.name}</span>
                          <span className="block text-xs text-surface-500">
                            {s.rollNumber} {s.batch ? `• ${s.batch}` : ""}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-medium">{s.assignedTasks}</td>
                        <td className="py-3 px-3 text-center font-medium text-emerald-700">
                          {s.submittedCount}
                        </td>
                        <td className="py-3 px-3 text-center font-medium text-amber-700">
                          {s.lateCount}
                        </td>
                        <td className="py-3 px-3 text-center font-medium text-rose-700">
                          {s.missedCount}
                        </td>
                        <td className="py-3 px-3 text-center font-medium text-teal-700">
                          {s.gradedCount}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {s.averagePercentage !== null ? (
                            <span className="font-semibold tabular-nums text-slate-900">
                              {s.averagePercentage}%
                            </span>
                          ) : (
                            <span className="text-surface-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Badge
                            variant={
                              s.status === "COMPLETE"
                                ? "emerald"
                                : s.status === "PARTIALLY GRADED"
                                ? "amber"
                                : "slate"
                            }
                            size="sm"
                          >
                            {s.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {s.indicator === "GOOD_STANDING" && (
                            <Badge variant="emerald" size="sm">
                              Good standing
                            </Badge>
                          )}
                          {s.indicator === "LOW_PERFORMANCE" && (
                            <Badge variant="rose" size="sm">
                              Low score (&lt;40%)
                            </Badge>
                          )}
                          {s.indicator === "HIGH_MISSED" && (
                            <Badge variant="rose" size="sm">
                              High missed (≥2)
                            </Badge>
                          )}
                          {s.indicator === "HIGH_LATE" && (
                            <Badge variant="amber" size="sm">
                              High late (≥2)
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedStudentId(s.studentId)}
                          >
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            Report
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Student Drilldown Modal */}
      {selectedStudentId && (
        <Modal
          isOpen={!!selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
          title="Student Monthly Report"
          maxWidth="4xl"
        >

          <div className="p-4">
            <StudentReportView
              studentId={selectedStudentId}
              initialYear={year}
              initialMonth={month}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
