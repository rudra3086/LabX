"use client";

import React, { useState, useEffect } from "react";
import { PlatformReportData } from "@/lib/server/services/reports";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  GraduationCap,
  BookOpen,
  FolderKanban,
  FileText,
  CheckCircle2,
  Award,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { ClassReportView } from "./class-report-view";

export function AdminReportView({
  sessions,
  initialYear,
  initialMonth,
}: {
  sessions: Array<{
    id: string;
    name: string;
    subjectCode: string;
    subjectName: string;
  }>;
  initialYear: number;
  initialMonth: number;
}) {
  const [activeTab, setActiveTab] = useState<"platform" | "class">("platform");
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [report, setReport] = useState<PlatformReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlatformReport = async (y: number, m: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/overview?year=${y}&month=${m}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to load platform report");
      }
      setReport(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "platform") {
      fetchPlatformReport(year, month);
    }
  }, [year, month, activeTab]);

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
      {/* Tab Switcher */}
      <div className="flex border-b border-surface-200">
        <button
          type="button"
          onClick={() => setActiveTab("platform")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "platform"
              ? "border-navy-900 text-navy-900"
              : "border-transparent text-surface-500 hover:text-slate-800"
          }`}
        >
          Platform Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("class")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "class"
              ? "border-navy-900 text-navy-900"
              : "border-transparent text-surface-500 hover:text-slate-800"
          }`}
        >
          Session Class Reports
        </button>
      </div>

      {activeTab === "class" ? (
        <ClassReportView
          sessions={sessions}
          initialSessionId={sessions[0]?.id || ""}
          initialYear={year}
          initialMonth={month}
        />
      ) : (
        <>
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-surface-200 bg-white p-4 shadow-card">
            <div className="flex flex-wrap items-center gap-3">
              <Calendar className="h-5 w-5 text-navy-700" />
              <span className="text-sm font-semibold text-slate-800">Reporting Period:</span>
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

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPlatformReport(year, month)}
              disabled={loading}
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {loading && (
            <div className="flex h-48 items-center justify-center rounded-lg border border-surface-200 bg-white">
              <div className="flex items-center gap-2 text-sm text-surface-500">
                <RefreshCw className="h-4 w-4 animate-spin text-navy-700" />
                Generating platform monthly performance overview...
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
              {/* Platform Metrics */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                <StatCard
                  title="Students"
                  value={report.platformMetrics.totalActiveStudents}
                  icon={<Users className="h-4 w-4 text-navy-700" />}
                />
                <StatCard
                  title="Faculty"
                  value={report.platformMetrics.totalActiveFaculty}
                  icon={<GraduationCap className="h-4 w-4 text-navy-700" />}
                />
                <StatCard
                  title="Subjects"
                  value={report.platformMetrics.totalActiveSubjects}
                  icon={<BookOpen className="h-4 w-4 text-navy-700" />}
                />
                <StatCard
                  title="Sessions"
                  value={report.platformMetrics.totalActiveSessions}
                  icon={<FolderKanban className="h-4 w-4 text-navy-700" />}
                />
                <StatCard
                  title="Tasks in Month"
                  value={report.platformMetrics.totalTasksInPeriod}
                  icon={<FileText className="h-4 w-4 text-navy-700" />}
                />
                <StatCard
                  title="Submissions"
                  value={report.platformMetrics.totalSubmissionsInPeriod}
                  icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                />
                <StatCard
                  title="Overall Score"
                  value={report.platformMetrics.overallAveragePercentage !== null ? `${report.platformMetrics.overallAveragePercentage}%` : "—"}
                  icon={<Award className="h-4 w-4 text-navy-700" />}
                />
              </div>

              {/* Subject Breakdown Table */}
              <div className="rounded-lg border border-surface-200 bg-white p-5 shadow-card">
                <h3 className="mb-4 text-base font-semibold text-slate-900">
                  Subject-Level Practical Performance
                </h3>
                {report.subjects.length === 0 ? (
                  <p className="py-6 text-center text-sm text-surface-400">
                    No active subjects found.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-surface-200 bg-surface-50 text-xs font-semibold text-surface-500">
                          <th className="py-2.5 px-3">Subject</th>
                          <th className="py-2.5 px-3">Department</th>
                          <th className="py-2.5 px-3 text-center">Sessions</th>
                          <th className="py-2.5 px-3 text-center">Students</th>
                          <th className="py-2.5 px-3 text-center">Tasks</th>
                          <th className="py-2.5 px-3 text-center">Submissions</th>
                          <th className="py-2.5 px-3 text-right">Average Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-100">
                        {report.subjects.map((subj) => (
                          <tr key={subj.subjectId} className="hover:bg-surface-50/50">
                            <td className="py-3 px-3">
                              <span className="font-semibold text-navy-900">{subj.code}</span>
                              <span className="block text-xs text-surface-500">{subj.name}</span>
                            </td>
                            <td className="py-3 px-3 text-surface-600">{subj.department}</td>
                            <td className="py-3 px-3 text-center font-medium">{subj.sessionCount}</td>
                            <td className="py-3 px-3 text-center font-medium">{subj.studentCount}</td>
                            <td className="py-3 px-3 text-center font-medium">{subj.taskCount}</td>
                            <td className="py-3 px-3 text-center font-medium text-emerald-700">
                              {subj.submissionCount}
                            </td>
                            <td className="py-3 px-3 text-right font-semibold text-slate-900">
                              {subj.averagePercentage !== null ? `${subj.averagePercentage}%` : "—"}
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
        </>
      )}
    </div>
  );
}
