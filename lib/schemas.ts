import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address").trim().toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z.string().min(8, "New password must be at least 8 characters.").max(128),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    path: ["newPassword"],
    message: "New password must be different from your current password.",
  });

export type PasswordChangeData = z.infer<typeof passwordChangeSchema>;

// ---------------------------------------------------------------------------
// Admin CRUD (spec §11, §12, §13)
// ---------------------------------------------------------------------------

export const subjectUpsertSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Subject code is required (e.g. CS301)")
    .max(12)
    .regex(/^[A-Za-z0-9-]+$/, "Use letters, numbers and hyphens only"),
  name: z.string().trim().min(3, "Subject name is required").max(120),
  semester: z.coerce
    .number()
    .int()
    .min(1, "Semester must be between 1 and 8")
    .max(8, "Semester must be between 1 and 8"),
  department: z.string().trim().min(2, "Department is required").max(120),
  description: z
    .string()
    .trim()
    .max(1000, "Description must be under 1000 characters")
    .nullable()
    .optional()
    .transform((v) => v || null),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export type SubjectUpsertData = z.infer<typeof subjectUpsertSchema>;

export const facultyUpsertSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  employeeId: z.string().trim().min(2, "Employee ID is required").max(40),
  email: z.string().email("Enter a valid email address").trim().toLowerCase(),
  department: z.string().trim().min(2, "Department is required").max(120),
  designation: z
    .string()
    .trim()
    .max(120)
    .nullable()
    .optional()
    .transform((v) => v || null),
  subjectIds: z.array(z.string()).default([]),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export type FacultyUpsertData = z.infer<typeof facultyUpsertSchema>;

export const studentUpsertSchema = z.object({
  studentId: z.string().trim().min(2, "Student ID is required").max(40),
  rollNumber: z.string().trim().min(2, "Roll number is required").max(40),
  name: z.string().trim().min(2, "Name is required").max(120),
  email: z.string().email("Enter a valid email address").trim().toLowerCase(),
  semester: z.coerce.number().int().min(1).max(8),
  department: z.string().trim().min(2, "Department is required").max(120),
  batch: z
    .string()
    .trim()
    .max(120)
    .nullable()
    .optional()
    .transform((v) => v || null),
  subjectIds: z.array(z.string()).default([]),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export type StudentUpsertData = z.infer<typeof studentUpsertSchema>;

export const statusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type StatusData = z.infer<typeof statusSchema>;

// PATCH bodies: every field optional; absent fields are never touched so a
// partial update (e.g. a status toggle) cannot wipe other columns.
export const subjectPatchSchema = z.object({
  code: subjectUpsertSchema.shape.code.optional(),
  name: subjectUpsertSchema.shape.name.optional(),
  semester: subjectUpsertSchema.shape.semester.optional(),
  department: subjectUpsertSchema.shape.department.optional(),
  description: subjectUpsertSchema.shape.description.optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const facultyPatchSchema = z.object({
  name: facultyUpsertSchema.shape.name.optional(),
  employeeId: facultyUpsertSchema.shape.employeeId.optional(),
  email: facultyUpsertSchema.shape.email.optional(),
  department: facultyUpsertSchema.shape.department.optional(),
  designation: facultyUpsertSchema.shape.designation.optional(),
  subjectIds: facultyUpsertSchema.shape.subjectIds.optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const studentPatchSchema = z.object({
  studentId: studentUpsertSchema.shape.studentId.optional(),
  rollNumber: studentUpsertSchema.shape.rollNumber.optional(),
  name: studentUpsertSchema.shape.name.optional(),
  email: studentUpsertSchema.shape.email.optional(),
  semester: studentUpsertSchema.shape.semester.optional(),
  department: studentUpsertSchema.shape.department.optional(),
  batch: studentUpsertSchema.shape.batch.optional(),
  subjectIds: z.array(z.string()).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export type ZodFieldErrors = Record<string, string[] | undefined>;

export function zodFieldErrors(err: z.ZodError): ZodFieldErrors {
  return err.flatten().fieldErrors;
}

// ---------------------------------------------------------------------------
// Faculty: sessions, roster, tasks (spec §16, §17, §18, §20)
// ---------------------------------------------------------------------------

export const sessionUpsertSchema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  name: z.string().trim().min(3, "Session name is required").max(200),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be under 2000 characters")
    .nullable()
    .optional()
    .transform((v) => v || null),
  semester: z.coerce.number().int().min(1, "Semester must be between 1 and 8").max(8),
  batch: z
    .string()
    .trim()
    .max(120)
    .nullable()
    .optional()
    .transform((v) => v || null),
  // ISO date strings "YYYY-MM-DD" (submitted by <input type="date">).
  startDate: z.string().trim().nullable().optional().transform((v) => v || null),
  endDate: z.string().trim().nullable().optional().transform((v) => v || null),
});

export type SessionUpsertData = z.infer<typeof sessionUpsertSchema>;

export const sessionPatchSchema = z.object({
  subjectId: sessionUpsertSchema.shape.subjectId.optional(),
  name: sessionUpsertSchema.shape.name.optional(),
  description: sessionUpsertSchema.shape.description.optional(),
  semester: sessionUpsertSchema.shape.semester.optional(),
  batch: sessionUpsertSchema.shape.batch.optional(),
  startDate: sessionUpsertSchema.shape.startDate.optional(),
  endDate: sessionUpsertSchema.shape.endDate.optional(),
  status: z.enum(["DRAFT", "ACTIVE", "COMPLETED", "ARCHIVED"]).optional(),
});

export const rosterSchema = z.object({
  batchNames: z.array(z.string().trim().min(1)).min(1, "Select at least one batch.").max(50),
});

export const rosterRemoveSchema = z.object({
  studentIds: z.array(z.string().min(1)).min(1, "Select at least one student.").max(200),
});

export const taskUpsertSchema = z.object({
  title: z.string().trim().min(3, "Task title is required").max(200),
  description: z
    .string()
    .trim()
    .max(3000, "Description must be under 3000 characters")
    .nullable()
    .optional()
    .transform((v) => v || null),
  instructions: z
    .string()
    .trim()
    .max(10000, "Instructions must be under 10000 characters")
    .nullable()
    .optional()
    .transform((v) => v || null),
  maximumMarks: z.coerce.number().positive("Maximum marks must be greater than zero").max(1000),
  // ISO "YYYY-MM-DDTHH:mm" from <input type="datetime-local">.
  deadline: z.string().trim().nullable().optional().transform((v) => v || null),
  allowLateSubmission: z.boolean().default(true),
  submissionFormat: z
    .string()
    .trim()
    .max(500)
    .nullable()
    .optional()
    .transform((v) => v || null),
  fileNamingConvention: z
    .string()
    .trim()
    .max(500)
    .nullable()
    .optional()
    .transform((v) => v || null),
  requiredFileTypes: z
    .string()
    .trim()
    .max(200)
    .nullable()
    .optional()
    .transform((v) => v || null),
});

export type TaskUpsertData = z.infer<typeof taskUpsertSchema>;

// ---------------------------------------------------------------------------
// Student submissions & grading (spec §26, §34, §35)
// ---------------------------------------------------------------------------

export const submissionNotesSchema = z.object({
  notes: z.string().max(5000, "Notes must be under 5000 characters").optional().transform((v) => v ?? ""),
});

export const gradeSchema = z.object({
  marks: z.coerce.number().min(0, "Marks cannot be negative").max(100000),
  remarks: z
    .string()
    .trim()
    .max(5000, "Remarks must be under 5000 characters")
    .nullable()
    .optional()
    .transform((v) => v || null),
});

export type GradeData = z.infer<typeof gradeSchema>;

export const taskPatchSchema = z.object({
  title: taskUpsertSchema.shape.title.optional(),
  description: taskUpsertSchema.shape.description.optional(),
  instructions: taskUpsertSchema.shape.instructions.optional(),
  maximumMarks: taskUpsertSchema.shape.maximumMarks.optional(),
  deadline: taskUpsertSchema.shape.deadline.optional(),
  allowLateSubmission: taskUpsertSchema.shape.allowLateSubmission.optional(),
  submissionFormat: taskUpsertSchema.shape.submissionFormat.optional(),
  fileNamingConvention: taskUpsertSchema.shape.fileNamingConvention.optional(),
  requiredFileTypes: taskUpsertSchema.shape.requiredFileTypes.optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"]).optional(),
});