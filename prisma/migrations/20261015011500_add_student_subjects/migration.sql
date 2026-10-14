CREATE TABLE "StudentSubject" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentSubject_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudentSubject_studentId_subjectId_key"
ON "StudentSubject"("studentId", "subjectId");

CREATE INDEX "StudentSubject_subjectId_idx" ON "StudentSubject"("subjectId");

ALTER TABLE "StudentSubject"
ADD CONSTRAINT "StudentSubject_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentSubject"
ADD CONSTRAINT "StudentSubject_subjectId_fkey"
FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
