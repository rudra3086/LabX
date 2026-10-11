// ============================================================================
// SmartLab client-shared domain types (serializable, spec-compliant)
// ============================================================================

export type Role = "ADMIN" | "FACULTY" | "STUDENT";
export type UserStatus = "ACTIVE" | "INACTIVE";

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string | null;
  status: UserStatus;
  student?: {
    studentId: string;
    rollNumber: string;
    semester: number;
    batch: string | null;
  };
  faculty?: {
    employeeId: string;
    department: string;
    designation: string | null;
  };
}

export type SessionStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
export type TaskStatus = "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
export type SubmissionStatus =
  | "NOT_STARTED"
  | "DRAFT"
  | "SUBMITTED"
  | "LATE"
  | "GRADED"
  | "MISSED";

// Deadline/submission visibility states (spec §20, §32)
export type TaskViewStatus =
  | "UPCOMING"
  | "DUE_SOON"
  | "DUE_TODAY"
  | "MISSED"
  | "SUBMITTED"
  | "SUBMITTED_LATE"
  | "GRADED"
  | "CLOSED";

// ----------------------------------------------------------------------------
// Dashboards
// ----------------------------------------------------------------------------
export interface AdminDashboardStats {
  totalStudents: number;
  totalFaculty: number;
  totalSubjects: number;
  activeSessions: number;
  totalTasks: number;
  totalSubmissions: number;
}

export interface FacultySubjectCard {
  subjectId: string;
  code: string;
  name: string;
  sessionId: string;
  sessionName: string;
  batch: string | null;
  students: number;
  totalTasks: number;
  pendingSubmissions: number;
  lateSubmissions: number;
  gradedSubmissions: number;
  submissionRatePercent: number | null;
  averageScorePercent: number | null;
  upcomingDeadlines: number;
}

export interface AttentionStudent {
  studentId: string;
  name: string;
  rollNumber: string;
  averagePercent: number | null;
  missedCount: number;
  flags: string[];
}

export interface FacultyDashboardStats {
  pendingSubmissions: number;
  ungradedSubmissions: number;
  lateSubmissions: number;
  upcomingDeadlines: number;
  subjects: FacultySubjectCard[];
  studentsNeedingAttention: AttentionStudent[];
}

export interface StudentTaskCard {
  taskId: string;
  sessionId: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  sessionName: string;
  title: string;
  description: string | null;
  maximumMarks: number;
  deadline: string | null;
  taskStatus: TaskStatus;
  viewStatus: TaskViewStatus;
  submissionStatus: SubmissionStatus;
  marks: { obtained: number; max: number } | null;
  submittedAt: string | null;
}

export interface RecentGradeItem {
  taskId: string;
  taskTitle: string;
  subjectName: string;
  subjectCode: string;
  marks: number;
  maximumMarks: number;
  percentage: number;
  remarks: string | null;
  gradedAt: string;
}

export interface StudentDashboardStats {
  assignedTasks: number;
  submittedTasks: number;
  pendingTasks: number;
  lateSubmissions: number;
  missedTasks: number;
  gradedTasks: number;
  averageScorePercent: number | null;
  upcoming: StudentTaskCard[];
  recentGrades: RecentGradeItem[];
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  activeMatch: string; // path prefix used to highlight current nav item
}

// ----------------------------------------------------------------------------
// Student side — submissions, task detail, grades (spec §21, §24–§28, §37)
// ----------------------------------------------------------------------------

export interface SubmissionFileItem {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  versionNumber: number;
  isLatest: boolean;
  createdAt: string;
}

export interface SubmissionVersionItem {
  versionNumber: number;
  notes: string | null;
  createdAt: string;
  authorName: string;
}

export interface GradeView {
  marks: number;
  maximumMarks: number;
  percentage: number;
  remarks: string | null;
  gradedAt: string;
  isFinalized: boolean;
}

export interface SubmissionState {
  id: string | null;
  status: SubmissionStatus;
  notes: string;
  submittedAt: string | null;
  updatedAt: string | null;
  latestVersion: number | null;
  files: SubmissionFileItem[];
  versions: SubmissionVersionItem[];
  grade: GradeView | null;
}

export interface StudentTaskDetail {
  task: {
    id: string;
    title: string;
    description: string | null;
    instructions: string | null;
    maximumMarks: number;
    deadline: string | null;
    allowLateSubmission: boolean;
    allowResubmission: boolean;
    resubmissionDeadline: string | null;
    maxFiles: number;
    maxFileSizeMb: number;
    requiredFileTypes: string | null;
    submissionFormat: string | null;
    fileNamingConvention: string | null;
    status: TaskStatus;
  };
  subject: { id: string; code: string; name: string; department: string };
  session: { id: string; name: string; batch: string | null; semester: number; facultyName: string };
  resources: {
    id: string;
    title: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: string;
  }[];
  viewStatus: TaskViewStatus;
  serverNow: string;
  submission: SubmissionState;
  policy: SubmissionPolicy;
}

export interface SubmissionPolicy {
  /** Can the student edit notes / add or remove files right now? */
  canEditFiles: boolean;
  /** Can the student perform the final submit action right now? */
  canSubmit: boolean;
  /** Reasoned explanation when an action is blocked. */
  lockReason: string | null;
  /** Status that would be recorded if they submit now. */
  statusOnSubmit: "SUBMITTED" | "LATE";
}

export interface StudentSubmissionListItem {
  id: string | null;
  taskId: string;
  taskTitle: string;
  subjectCode: string;
  subjectName: string;
  sessionName: string;
  maximumMarks: number;
  deadline: string | null;
  status: SubmissionStatus;
  viewStatus: TaskViewStatus;
  submittedAt: string | null;
  fileCount: number;
  marks: number | null;
}

export interface StudentSubjectSummary {
  subjectId: string;
  code: string;
  name: string;
  semester: number;
  department: string;
  description: string | null;
  sessionNames: string[];
  taskCount: number;
  submittedCount: number;
  pendingCount: number;
  missedCount: number;
}