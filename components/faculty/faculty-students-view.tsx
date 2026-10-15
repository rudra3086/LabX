"use client";

import React, { useState } from "react";
import { FacultyStudentOverviewRow } from "@/lib/server/services/faculty";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Eye, Users } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { StudentReportView } from "@/components/reports/student-report-view";

export function FacultyStudentsView({
  students,
  currentYear,
  currentMonth,
}: {
  students: FacultyStudentOverviewRow[];
  currentYear: number;
  currentMonth: number;
}) {
  const [search, setSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-surface-200 bg-white p-4 shadow-card">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-navy-700" />
          <h2 className="text-base font-semibold text-slate-900">Enrolled Students</h2>
          <span className="text-xs text-surface-400">({filtered.length} total)</span>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-surface-400" />
          <input
            type="text"
            placeholder="Search student, roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 rounded-md border border-surface-300 pl-8 pr-3 py-1.5 text-xs focus:border-navy-600 focus:outline-none"
          />
        </div>
      </div>

      <div className="rounded-lg border border-surface-200 bg-white shadow-card">
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-surface-400">
            No students found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50 text-xs font-semibold text-surface-500">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Department & Sem</th>
                  <th className="py-3 px-4">Enrolled Sessions</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-50/50">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900">{s.name}</span>
                      <span className="block text-xs text-surface-500">{s.email}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-navy-900">
                      {s.rollNumber}
                    </td>
                    <td className="py-3 px-4 text-surface-600">
                      {s.department} · Sem {s.semester} {s.batch ? `(${s.batch})` : ""}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {s.sessions.map((sess, idx) => (
                          <Badge key={idx} variant="navy" size="sm">
                            {sess.subjectCode}: {sess.name}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setSelectedStudentId(s.id)}
                        aria-label={`View monthly report for ${s.name}`}
                        title="Monthly Report"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedStudentId && (
        <Modal
          isOpen={!!selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
          title="Student Monthly Performance Report"
          maxWidth="4xl"
        >

          <div className="p-4">
            <StudentReportView
              studentId={selectedStudentId}
              initialYear={currentYear}
              initialMonth={currentMonth}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
