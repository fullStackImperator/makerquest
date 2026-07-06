-- CreateEnum
CREATE TYPE "QuestionKind" AS ENUM ('MC_SINGLE', 'FILL_BLANK', 'SHORT_TEXT', 'MATH', 'DRAG_DROP');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'NEEDS_REVIEW', 'GRADED');

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "intro" JSONB,
    "position" INTEGER NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "passingScore" INTEGER,
    "awardXp" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseQuestion" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "kind" "QuestionKind" NOT NULL,
    "prompt" JSONB NOT NULL,
    "spec" JSONB NOT NULL,
    "solution" JSONB NOT NULL,
    "explanation" JSONB,
    "points" INTEGER NOT NULL DEFAULT 1,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExerciseQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "maxScore" INTEGER NOT NULL DEFAULT 0,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',

    CONSTRAINT "ExerciseAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseResponse" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" JSONB NOT NULL,
    "autoScore" INTEGER,
    "finalScore" INTEGER,
    "feedback" JSONB,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExerciseResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Exercise_courseId_idx" ON "Exercise"("courseId");

-- CreateIndex
CREATE INDEX "ExerciseQuestion_exerciseId_idx" ON "ExerciseQuestion"("exerciseId");

-- CreateIndex
CREATE INDEX "ExerciseAttempt_exerciseId_idx" ON "ExerciseAttempt"("exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseAttempt_userId_exerciseId_key" ON "ExerciseAttempt"("userId", "exerciseId");

-- CreateIndex
CREATE INDEX "ExerciseResponse_attemptId_idx" ON "ExerciseResponse"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseResponse_attemptId_questionId_key" ON "ExerciseResponse"("attemptId", "questionId");

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseQuestion" ADD CONSTRAINT "ExerciseQuestion_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseAttempt" ADD CONSTRAINT "ExerciseAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseAttempt" ADD CONSTRAINT "ExerciseAttempt_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "ExerciseAttempt_userId_idx" ON "ExerciseAttempt"("userId");

-- AddForeignKey
ALTER TABLE "ExerciseResponse" ADD CONSTRAINT "ExerciseResponse_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ExerciseAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseResponse" ADD CONSTRAINT "ExerciseResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ExerciseQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
