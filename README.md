# SmartLab — University CSE Practical Session Platform

An MVP Next.js frontend for Computer Science and Engineering departments to manage subjects, faculty accounts, practical sessions, task files, student submissions, and faculty evaluations.

The current MVP intentionally excludes AI grading, plagiarism detection, viva generation, advanced analytics, notifications, and real-time monitoring.

Designed to scale comfortably for **1,000+ concurrent students** with server-side pagination, virtualized tables, pre-aggregated analytics endpoints, and offline write queuing.

---

## Key MVP Workflows

- **Admin:** Create subjects, create teacher accounts, and assign teachers to subjects.
- **Faculty:** Create sessions for assigned subjects, publish practical tasks, review student files, and record marks and remarks.
- **Student:** View assigned sessions and tasks, upload PDF/DOC/DOCX submissions, and view personal grades and remarks.

The current data layer is a typed mock API backed by browser `localStorage`; it is structured for replacement with a server API and database.

## Architecture

### 1. Technology Stack
- **Framework:** Next.js 14+ (App Router), TypeScript (Strict Mode)
- **Styling & Design Tokens:** Tailwind CSS with an academic palette (Primary Navy `#16233D`, Accent Teal `#0D9488`, Slate surfaces)
- **Server State & Caching:** TanStack React Query (`@tanstack/react-query`) with 15s short-polling for real-time dashboard notifications
- **Forms & Validation:** React Hook Form + Zod schema validation (`lib/schemas.ts`)
- **Virtualization:** TanStack Virtual (`@tanstack/react-virtual`) for 1,000+ row lists without DOM lag
- **Auth & Roles:** JWT session model with 3 role shells: `student`, `faculty`, and `admin`

---

## 👥 Three Distinct Role Consoles

### A) Student Console
1. **Workload & Deadline Hub (`/student/dashboard`):** Cross-subject workload view with escalating urgency banners (Critical < 24h, High < 3d), active lab cards, and auto-submit schedules.
2. **Practical Workspace (`/student/workspace/[practicalId]`):** Dual-pane IDE with language selector, continuous throttled auto-save (4s), offline write queue (`OfflineQueue`), automated sandboxed test runner, rubric inspection tab, and explicit submit modal.
3. **Structured Evidence Capture (`EvidenceUploader`):** Simulates presigned multipart chunked uploads (256KB chunks) with progress percentage, pause/retry, and links to practical steps + execution environment metadata.
4. **Submission History & Timeline (`/student/history`):** Browse periodic auto-saves vs manual checkpoints with code diff snapshots and rollback capabilities.
5. **Grades & Rubric Feedback (`/student/feedback`):** Official faculty evaluation broken down criterion-by-criterion with marks, weightages, specific feedback notes, and test verification metrics.
6. **Personal Analytics (`/student/analytics`):** Topic-wise rubric mastery percentages (radar/progress), submission timeliness rate, and syllabus progress.
7. **Viva Practice Bank (`/student/viva`):** Faculty-approved oral viva examination questions mapped to Bloom's taxonomy with flip-to-reveal model answers.

### B) Faculty Console
1. **Author Practical Assignment (`/faculty/practicals/new`):** Problem authoring form with React Hook Form + Zod validation, code starter template, and a dynamic Rubric Criteria Builder (criteria titles, weights, max marks).
2. **Submission Review Queue (`/faculty/review`):** Filterable (by subject, practical, status), sortable, paginated review table with clear distinction between **Auto-Submitted** and **Submitted (Manual)** work.
3. **Submission Evaluator (`/faculty/eval/[submissionId]`):**
   - **Left Panel:** Student source code viewer, sandboxed test cases output, evidence viewer modal (screenshots, terminal logs), and version history.
   - **Right Panel:**
     - **Supporting AI Similarity Telemetry:** Neutrally phrased advisory signals (*"Similarity signal: 18% with context"*, AST structural overlap %, token sequence match %, peer count, and disclaimer — strictly non-verdict).
     - **Rubric Scoring Engine:** Interactive sliders/numeric inputs for each criterion with real-time total marks sum calculation.
     - **Criterion-level & Overall Feedback:** Save draft vs finalize & publish grade.
4. **Class Analytics Dashboard (`/faculty/analytics`):** Pre-aggregated cohort diagnostics showing weakest topics, frequent algorithmic and compiler errors, score distribution histogram, and punctuality stats.
5. **AI Viva Question Studio (`/faculty/viva-generator`):** Prompt-based AI synthesis of conceptual questions, inline editable draft review cards, and one-click publishing to students.

### C) Administrator Console
1. **Institutional Audit Reports (`/admin/reports`):** Department-wide compliance rates, faculty turnaround averages, course-by-course accreditation benchmarks, and instant CSV audit export.
2. **Laboratory Administration (`/admin/management`):** CRUD management of department courses (CS301, CS302, CS303, CS304) and physical laboratory room & faculty time slots.
3. **Roles & Permissions (`/admin/permissions`):** RBAC assignment between Student, Faculty, and Department Administrator roles.

---

## 🛠️ Directory Structure

```
smartlab/
├── app/
│   ├── (auth)/login/page.tsx               # Screen 1: Login & demo personas
│   ├── (student)/student/
│   │   ├── layout.tsx                      # Student AppShell wrapper
│   │   ├── dashboard/page.tsx              # Screen 2: Deadline Dashboard
│   │   ├── workspace/[practicalId]/page.tsx# Screen 3: Code Workspace
│   │   ├── history/page.tsx                # Screen 4: Version Timeline
│   │   ├── feedback/page.tsx               # Screen 5: Feedback & Grades
│   │   ├── analytics/page.tsx              # Screen 6: Personal Analytics
│   │   └── viva/page.tsx                   # Screen 14: Viva Practice
│   ├── (faculty)/faculty/
│   │   ├── layout.tsx                      # Faculty AppShell wrapper
│   │   ├── review/page.tsx                 # Screen 8: Review Queue
│   │   ├── eval/[submissionId]/page.tsx    # Screen 9: Submission Evaluator
│   │   ├── practicals/new/page.tsx         # Screen 7: Practical Builder
│   │   ├── analytics/page.tsx              # Screen 10: Class Analytics
│   │   └── viva-generator/page.tsx         # Screen 11: Viva Studio
│   └── (admin)/admin/
│       ├── layout.tsx                      # Admin AppShell wrapper
│       ├── reports/page.tsx                # Screen 13: Institution Reports
│       ├── management/page.tsx             # Screen 12: Subjects & Sessions
│       └── permissions/page.tsx            # Roles & Permissions
├── components/
│   ├── layout/                             # AppShell, Sidebar, Header, NotificationPanel, RoleSwitcher
│   ├── features/                           # Student, Faculty, and Admin screen components
│   ├── providers/                          # TanStack React Query Provider
│   └── ui/                                 # Button, Input, Table, VirtualTable, Badge, Card, Modal, Tabs, Progress, StatCard
├── lib/
│   ├── api/                                # Typed API client modules (auth, practicals, submissions, evidence, evaluation, viva, analytics, admin)
│   ├── storage/                            # mock-db.ts (reactive local storage) & offline-queue.ts
│   ├── schemas.ts                          # Shared Zod validation schemas
│   └── utils.ts                            # Class merge, date/relative formatters, byte formatters
└── types/                                  # Domain interfaces (User, Practical, Submission, Grade, AiIntegritySignal, etc.)
```

---

## 🔄 End-to-End Demo Flow

1. Open `http://localhost:3000/login` and pick **Student (Alex Mercer)**.
2. In the **Workspace**, edit code, observe the **Synced** status pill, click **Execute Tests**, and click **Submit Work**.
3. Use the **Role Switcher** in the top header to switch to **Faculty View (Prof. Sarah Jenkins)**.
4. In the **Review Queue**, click **Evaluate** on Alex Mercer's submission.
5. Review the source code and evidence, check the neutral **AI Similarity Signal (18%)**, adjust the rubric sliders, and click **Finalize & Publish Grade**.
6. Switch back to **Student View** and navigate to **Grades & Rubric Feedback** to inspect the finalized score and criterion-by-criterion remarks.
#   L a b X  
 