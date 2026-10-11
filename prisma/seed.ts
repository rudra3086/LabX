/**
 * SmartLab — Development seed script.
 *
 * IMPORTANT: This data is DEVELOPMENT SEED DATA only (spec §83). It is clearly
 * separated from runtime behavior and must never be mistaken for production data.
 *
 * It provides a complete, immediately usable demo universe:
 *   1 Admin, 3 Faculty, 20 Students, 3 Subjects, 3 Sessions, 10 Tasks,
 *   submissions + grades + notifications for the past tasks.
 *
 * Run: npx tsx prisma/seed.ts
 */
import { PrismaClient, Prisma, Role, SessionStatus, SubmissionStatus, TaskStatus } from "@prisma/client";

import { hashPassword } from "../lib/server/password";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "password123";

const DAY_MS = 24 * 60 * 60 * 1000;
function daysFromNow(days: number, hour = 23, minute = 59): Date {
  const d = new Date(Date.now() + days * DAY_MS);
  d.setHours(hour, minute, 0, 0);
  return d;
}

// ---------------------------------------------------------------------------
// Seed collections
// ---------------------------------------------------------------------------
const admin = {
  name: "Dr. Alok Verma",
  email: "admin@smartlab.dev",
  password: DEMO_PASSWORD,
  role: Role.ADMIN,
  department: "Computer Science & Engineering",
  employeeId: "ADM-1001",
};

const faculty = [
  {
    name: "Prof. Sarah Jenkins",
    email: "faculty.ds@smartlab.dev",
    password: DEMO_PASSWORD,
    role: Role.FACULTY,
    department: "Computer Science & Engineering",
    employeeId: "FAC-1001",
    designation: "Associate Professor",
  },
  {
    name: "Dr. Marcus Vance",
    email: "faculty.db@smartlab.dev",
    password: DEMO_PASSWORD,
    role: Role.FACULTY,
    department: "Computer Science & Engineering",
    employeeId: "FAC-1002",
    designation: "Assistant Professor",
  },
  {
    name: "Prof. Ananya Iyer",
    email: "faculty.os@smartlab.dev",
    password: DEMO_PASSWORD,
    role: Role.FACULTY,
    department: "Computer Science & Engineering",
    employeeId: "FAC-1003",
    designation: "Professor",
  },
];

const studentNames = [
  "Rudra Patel", "Aarav Mehta", "Ishaan Rao", "Sneha Kulkarni", "Arjun Nair",
  "Diya Sharma", "Vihaan Bhat", "Ananya Reddy", "Kabir Sen", "Meera Pillai",
  "Advait Joshi", "Sana Qureshi", "Devansh Kapoor", "Riya Das", "Yash Thakur",
  "Nandini Verma", "Rohan Gupta", "Tara Menon", "Farhan Ali", "Priya Desai",
];

const subjects = [
  { code: "CS301", name: "Data Structures", semester: 4, department: "CSE", description: "Linear and non-linear data structures with analysis." },
  { code: "CS302", name: "Database Management System", semester: 4, department: "CSE", description: "SQL, ER modeling, normalization and indexing." },
  { code: "CS303", name: "Operating Systems", semester: 4, department: "CSE", description: "Processes, scheduling, concurrency and memory management." },
];

const sessionDefs = [
  { subjectCode: "CS301", name: "Data Structures Practical", batch: "2024-2028 CSE-A" },
  { subjectCode: "CS302", name: "DBMS Practical", batch: "2024-2028 CSE-A" },
  { subjectCode: "CS303", name: "Operating Systems Practical", batch: "2024-2028 CSE-A" },
];

// Tasks keyed by faculty email so they attach to the right session/subject.
const taskDefs: Array<{
  facultyEmail: string;
  sessionName: string;
  title: string;
  issue: number;
  deadlineDays: number;
  maxMarks: number;
  status: TaskStatus;
  instructions: string;
}> = [
  {
    facultyEmail: "faculty.ds@smartlab.dev",
    sessionName: "Data Structures Practical",
    title: "Implement Binary Search Tree",
    issue: 1, deadlineDays: 2, maxMarks: 10, status: TaskStatus.PUBLISHED,
    instructions: "Implement BST with insert, search, delete and inorder traversal. Submit source code and output screenshot.",
  },
  {
    facultyEmail: "faculty.ds@smartlab.dev",
    sessionName: "Data Structures Practical",
    title: "Heap Sort & Priority Queue",
    issue: 2, deadlineDays: 5, maxMarks: 10, status: TaskStatus.PUBLISHED,
    instructions: "Implement heap sort and a min-priority queue. Analyze time complexity in your documentation.",
  },
  {
    facultyEmail: "faculty.ds@smartlab.dev",
    sessionName: "Data Structures Practical",
    title: "Graph Traversals (BFS/DFS)",
    issue: 3, deadlineDays: -21, maxMarks: 10, status: TaskStatus.CLOSED,
    instructions: "Implement BFS and DFS on an adjacency-list graph. Demonstrate on a sample graph.",
  },
  {
    facultyEmail: "faculty.db@smartlab.dev",
    sessionName: "DBMS Practical",
    title: "SQL Joins & Aggregation",
    issue: 1, deadlineDays: 1, maxMarks: 10, status: TaskStatus.PUBLISHED,
    instructions: "Write SQL queries using inner/outer joins and GROUP BY aggregation on the given schema. Export query results as PDF.",
  },
  {
    facultyEmail: "faculty.db@smartlab.dev",
    sessionName: "DBMS Practical",
    title: "ER Diagram & Normalization",
    issue: 2, deadlineDays: 7, maxMarks: 10, status: TaskStatus.PUBLISHED,
    instructions: "Draw the ER diagram for a library management system and normalize to 3NF. Submit PDF.",
  },
  {
    facultyEmail: "faculty.db@smartlab.dev",
    sessionName: "DBMS Practical",
    title: "B+ Tree Indexing Basics",
    issue: 3, deadlineDays: -18, maxMarks: 10, status: TaskStatus.CLOSED,
    instructions: "Demonstrate B+ tree insertion, splitting and range scan on a numeric dataset.",
  },
  {
    facultyEmail: "faculty.db@smartlab.dev",
    sessionName: "DBMS Practical",
    title: "Transaction Isolation Levels",
    issue: 4, deadlineDays: 9, maxMarks: 10, status: TaskStatus.PUBLISHED,
    instructions: "Explain and demonstrate the four isolation levels with example transactions. Submit documentation.",
  },
  {
    facultyEmail: "faculty.os@smartlab.dev",
    sessionName: "Operating Systems Practical",
    title: "CPU Scheduling Simulator",
    issue: 1, deadlineDays: 3, maxMarks: 10, status: TaskStatus.PUBLISHED,
    instructions: "Simulate FCFS, SJF and Round Robin scheduling. Plot Gantt charts and compute average waiting time.",
  },
  {
    facultyEmail: "faculty.os@smartlab.dev",
    sessionName: "Operating Systems Practical",
    title: "Producer-Consumer with Semaphores",
    issue: 2, deadlineDays: 1, maxMarks: 10, status: TaskStatus.PUBLISHED,
    instructions: "Implement the bounded buffer producer-consumer problem using semaphores. Submit source code.",
  },
  {
    facultyEmail: "faculty.os@smartlab.dev",
    sessionName: "Operating Systems Practical",
    title: "Deadlock Avoidance (Banker's Algorithm)",
    issue: 3, deadlineDays: -15, maxMarks: 10, status: TaskStatus.CLOSED,
    instructions: "Implement Banker's algorithm for deadlock avoidance. Verify with safe and unsafe state sequences.",
  },
];

async function main() {
  console.log("Seeding SmartLab development dataset...");

  // --- Clear previous development data (dependency order) ---
  await prisma.gradeAudit.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.submissionFile.deleteMany();
  await prisma.submissionVersion.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.taskResource.deleteMany();
  await prisma.task.deleteMany();
  await prisma.sessionStudent.deleteMany();
  await prisma.practicalSession.deleteMany();
  await prisma.monthlyReport.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.facultySubject.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.faculty.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();

  // --- Users ---
  const adminUser = await prisma.user.create({
    data: {
      name: admin.name,
      email: admin.email,
      passwordHash: await hashPassword(admin.password),
      role: admin.role,
      department: admin.department,
    },
  });

  const facultyByEmail: Record<string, string> = {};
  for (const f of faculty) {
    const user = await prisma.user.create({
      data: {
        name: f.name,
        email: f.email,
        passwordHash: await hashPassword(f.password),
        role: f.role,
        department: f.department,
        faculty: { create: { employeeId: f.employeeId, department: f.department, designation: f.designation } },
      },
    });
    facultyByEmail[f.email] = user.id;
  }

  // --- Students ---
  const studentMap = new Map<number, string>(); // index -> userId
  for (let i = 0; i < studentNames.length; i++) {
    const roll = `24CS${String(i + 1).padStart(3, "0")}`;
    const user = await prisma.user.create({
      data: {
        name: studentNames[i],
        email: `student${String(i + 1).padStart(2, "0")}@smartlab.dev`,
        passwordHash: await hashPassword(DEMO_PASSWORD),
        role: Role.STUDENT,
        department: "CSE",
        student: {
          create: {
            studentId: roll,
            rollNumber: roll,
            semester: 4,
            department: "CSE",
            batch: "2024-2028 CSE-A",
          },
        },
      },
    });
    studentMap.set(i, user.id);
  }

  // --- Subjects + faculty assignments ---
  const facultyIdMap = await prisma.faculty.findMany({
    where: { userId: { in: Object.values(facultyByEmail) } },
  });
  const facultyIdByUserId = new Map(facultyIdMap.map((f) => [f.userId, f.id]));

  const subjectIdByCode: Record<string, string> = {};
  for (const s of subjects) {
    const created = await prisma.subject.create({
      data: { code: s.code, name: s.name, semester: s.semester, department: s.department, description: s.description },
    });
    subjectIdByCode[s.code] = created.id;
  }

  // CS301 -> Sarah, CS302 -> Marcus, CS303 -> Ananya
  const subjectToFacultyEmail: Record<string, string> = {
    CS301: "faculty.ds@smartlab.dev",
    CS302: "faculty.db@smartlab.dev",
    CS303: "faculty.os@smartlab.dev",
  };
  for (const s of subjects) {
    const facultyUserId = facultyByEmail[subjectToFacultyEmail[s.code]!];
    const facultyProfileId = facultyIdByUserId.get(facultyUserId)!;
    await prisma.facultySubject.create({
      data: { facultyId: facultyProfileId, subjectId: subjectIdByCode[s.code]! },
    });
  }

  // --- Sessions + enroll all students ---
  const studentProfiles = await prisma.student.findMany();
  const sessionIdByName: Record<string, string> = {};
  for (const sd of sessionDefs) {
    const subjectId = subjectIdByCode[sd.subjectCode]!;
    const facultyUserId = facultyByEmail[subjectToFacultyEmail[sd.subjectCode]!]!;
    const facultyProfileId = facultyIdByUserId.get(facultyUserId)!;
    const session = await prisma.practicalSession.create({
      data: {
        subjectId,
        facultyId: facultyProfileId,
        name: sd.name,
        description: `Practical session for ${sd.subjectCode}`,
        semester: 4,
        batch: sd.batch,
        startDate: daysFromNow(-30),
        endDate: daysFromNow(60),
        status: SessionStatus.ACTIVE,
        students: {
          create: studentProfiles.map((sp) => ({ studentId: sp.id })),
        },
      },
    });
    sessionIdByName[sd.name] = session.id;
  }

  // --- Tasks ---
  const taskIdByKey = new Map<string, string>();
  for (const t of taskDefs) {
    const sessionId = sessionIdByName[t.sessionName]!;
    const task = await prisma.task.create({
      data: {
        sessionId,
        title: t.title,
        description: `Practical ${String(t.issue).padStart(2, "0")}: ${t.title}`,
        instructions: t.instructions,
        maximumMarks: t.maxMarks,
        deadline: daysFromNow(t.deadlineDays),
        allowLateSubmission: true,
        allowResubmission: false,
        status: t.status,
      },
    });
    taskIdByKey.set(`${t.sessionName}|${t.title}`, task.id);
  }

  // --- Submissions + grades for the closed (past) tasks ---
  // Faculty exercise their own subjects: DS->Sarah, DB->Marcus, OS->Ananya
  const closedTasks = taskDefs.filter((t) => t.status === TaskStatus.CLOSED);
  const gradedByEmail: Record<string, string> = {};
  for (const t of closedTasks) {
    const taskId = taskIdByKey.get(`${t.sessionName}|${t.title}`)!;
    const facultyUserId = facultyByEmail[t.facultyEmail]!;
    const facultyProfileId = facultyIdByUserId.get(facultyUserId)!;
    const session = await prisma.practicalSession.findUnique({
      where: { id: sessionIdByName[t.sessionName] },
    });

    for (let i = 0; i < 8; i++) {
      const studentUserId = studentMap.get(i)!;
      const studentProfile = studentProfiles.find((sp) => sp.userId === studentUserId)!;
      const late = i % 4 === 1; // students #2, #6 are late
      const submittedAt = late
        ? new Date(daysFromNow(t.deadlineDays).getTime() + 6 * 60 * 60 * 1000)
        : daysFromNow(t.deadlineDays, i % 2 === 0 ? 18 : 20, i % 2 === 0 ? 10 : 40);

      // Grade the first 6 on-time students; late and later students stay
      // ungraded so the demo shows pending/late/ungraded states.
      const willGrade = !late && i < 6;
      const status: SubmissionStatus = willGrade
        ? SubmissionStatus.GRADED
        : late
          ? SubmissionStatus.LATE
          : SubmissionStatus.SUBMITTED;

      const submission = await prisma.submission.create({
        data: {
          taskId,
          studentId: studentProfile.id,
          status,
          notes: `Development seed submission for ${t.title}.`,
          submittedAt,
          versions: {
            create: [{ versionNumber: 1, createdById: studentUserId, notes: "Seed initial draft" }],
          },
        },
      });

      if (willGrade) {
        const marks = Math.round((7 + ((i * 7) % 3)) * 10) / 10; // 7.0–10.0
        await prisma.grade.create({
          data: {
            submissionId: submission.id,
            marks: Math.min(marks, t.maxMarks),
            maximumMarks: t.maxMarks,
            remarks: "Good implementation. Improve code documentation.",
            isFinalized: true,
            gradedById: facultyUserId,
            gradedAt: new Date(daysFromNow(t.deadlineDays).getTime() + 2 * DAY_MS),
          },
        });
      }

      gradedByEmail[session?.id ?? t.sessionName] = gradedByEmail[session?.id ?? t.sessionName] ?? facultyUserId;
    }
  }

  // --- Draft submissions for upcoming tasks (student 1) ---
  const upcomingTasks = taskDefs.filter((t) => t.status === TaskStatus.PUBLISHED);
  const firstStudentProfile = studentProfiles.find((sp) => sp.userId === studentMap.get(0)!)!;
  for (const t of upcomingTasks.slice(0, 3)) {
    const taskId = taskIdByKey.get(`${t.sessionName}|${t.title}`)!;
    await prisma.submission.create({
      data: {
        taskId,
        studentId: firstStudentProfile.id,
        status: SubmissionStatus.DRAFT,
        notes: `Working draft for ${t.title}.`,
        versions: {
          create: [{ versionNumber: 1, createdById: studentMap.get(0)!, notes: "Seed draft" }],
        },
      },
    });
  }

  // --- Notifications ---
  const adminUserId = adminUser.id;
  const notificationData: Prisma.NotificationCreateManyInput[] = [
    {
      userId: adminUserId,
      type: "GENERAL",
      title: "Development seed data loaded",
      message: "SmartLab development dataset was initialized. This data is for development only.",
    },
    ...Object.values(facultyByEmail).map((uid) => ({
      userId: uid,
      type: "TASK_CREATED" as const,
      title: "Practical tasks published",
      message: "Your published practicals now have enrolled students. Review submissions from the dashboard.",
    })),
    ...Array.from({ length: 4 }, (_, i) => ({
      userId: studentMap.get(i)!,
      type: "DEADLINE_REMINDER" as const,
      title: "Deadline approaching",
      message: "SQL Joins & Aggregation (CS302) and Producer-Consumer with Semaphores (CS303) are due within 24 hours.",
      link: "/student/dashboard",
    })),
  ];
  await prisma.notification.createMany({ data: notificationData });

  await prisma.auditLog.create({
    data: {
      actorId: adminUserId,
      action: "SEED_DATA_LOADED",
      entityType: "SYSTEM",
      metadata: { note: "Development seed data created. Not production data." },
    },
  });

  const counts = {
    users: await prisma.user.count(),
    students: await prisma.student.count(),
    faculty: await prisma.faculty.count(),
    subjects: await prisma.subject.count(),
    sessions: await prisma.practicalSession.count(),
    tasks: await prisma.task.count(),
    submissions: await prisma.submission.count(),
    grades: await prisma.grade.count(),
    notifications: await prisma.notification.count(),
  };

  console.log("Seed complete:", counts);
  console.log("Demo accounts (password: password123) — admin@smartlab.dev, faculty.*@smartlab.dev, studentNN@smartlab.dev");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });