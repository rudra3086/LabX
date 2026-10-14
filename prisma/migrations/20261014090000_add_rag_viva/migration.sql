CREATE TABLE "RagDocument" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "pageCount" INTEGER NOT NULL,
    "chunkCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RagDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VivaSession" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "current" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VivaSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VivaAnswer" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "feedback" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VivaAnswer_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RagDocument_subjectId_idx" ON "RagDocument"("subjectId");
CREATE INDEX "RagDocument_facultyId_idx" ON "RagDocument"("facultyId");
CREATE INDEX "VivaSession_subjectId_studentId_idx" ON "VivaSession"("subjectId", "studentId");
CREATE INDEX "VivaAnswer_sessionId_idx" ON "VivaAnswer"("sessionId");

ALTER TABLE "RagDocument" ADD CONSTRAINT "RagDocument_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RagDocument" ADD CONSTRAINT "RagDocument_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RagDocument" ADD CONSTRAINT "RagDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VivaSession" ADD CONSTRAINT "VivaSession_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VivaSession" ADD CONSTRAINT "VivaSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VivaAnswer" ADD CONSTRAINT "VivaAnswer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "VivaSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
