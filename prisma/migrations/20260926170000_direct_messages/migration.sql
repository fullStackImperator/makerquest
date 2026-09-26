-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "teacherId" TEXT,
ALTER COLUMN "courseId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Conversation_teacherId_lastMessageAt_idx" ON "Conversation"("teacherId", "lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_teacherId_studentId_key" ON "Conversation"("teacherId", "studentId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A conversation belongs to a quest or to one teacher, never both or neither.
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_quest_or_teacher_check"
  CHECK (("courseId" IS NULL) <> ("teacherId" IS NULL));
