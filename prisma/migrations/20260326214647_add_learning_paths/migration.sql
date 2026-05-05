-- CreateEnum
CREATE TYPE "LernpfadDifficulty" AS ENUM ('ANFAENGER', 'FORTGESCHRITTEN', 'PRO');

-- CreateTable
CREATE TABLE "LearningPath" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "difficulty" "LernpfadDifficulty" NOT NULL,
    "ownerId" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "badgeId" TEXT,
    "flowData" JSON NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningPath_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningPathStep" (
    "id" TEXT NOT NULL,
    "learningPathId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "bonusXp" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LearningPathStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningPathEnrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "learningPathId" TEXT NOT NULL,
    "currentStepIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningPathEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningPathStepCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "learningPathStepId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningPathStepCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningPathCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "learningPathId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningPathCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LearningPath_slug_key" ON "LearningPath"("slug");

-- CreateIndex
CREATE INDEX "LearningPath_ownerId_idx" ON "LearningPath"("ownerId");

-- CreateIndex
CREATE INDEX "LearningPathStep_courseId_idx" ON "LearningPathStep"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "LearningPathStep_learningPathId_position_key" ON "LearningPathStep"("learningPathId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "LearningPathStep_learningPathId_courseId_key" ON "LearningPathStep"("learningPathId", "courseId");

-- CreateIndex
CREATE INDEX "LearningPathEnrollment_learningPathId_idx" ON "LearningPathEnrollment"("learningPathId");

-- CreateIndex
CREATE UNIQUE INDEX "LearningPathEnrollment_userId_learningPathId_key" ON "LearningPathEnrollment"("userId", "learningPathId");

-- CreateIndex
CREATE INDEX "LearningPathStepCompletion_userId_idx" ON "LearningPathStepCompletion"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LearningPathStepCompletion_userId_learningPathStepId_key" ON "LearningPathStepCompletion"("userId", "learningPathStepId");

-- CreateIndex
CREATE INDEX "LearningPathCompletion_learningPathId_idx" ON "LearningPathCompletion"("learningPathId");

-- CreateIndex
CREATE UNIQUE INDEX "LearningPathCompletion_userId_learningPathId_key" ON "LearningPathCompletion"("userId", "learningPathId");

-- AddForeignKey
ALTER TABLE "LearningPath" ADD CONSTRAINT "LearningPath_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPath" ADD CONSTRAINT "LearningPath_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPathStep" ADD CONSTRAINT "LearningPathStep_learningPathId_fkey" FOREIGN KEY ("learningPathId") REFERENCES "LearningPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPathStep" ADD CONSTRAINT "LearningPathStep_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPathEnrollment" ADD CONSTRAINT "LearningPathEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPathEnrollment" ADD CONSTRAINT "LearningPathEnrollment_learningPathId_fkey" FOREIGN KEY ("learningPathId") REFERENCES "LearningPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPathStepCompletion" ADD CONSTRAINT "LearningPathStepCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPathStepCompletion" ADD CONSTRAINT "LearningPathStepCompletion_learningPathStepId_fkey" FOREIGN KEY ("learningPathStepId") REFERENCES "LearningPathStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPathCompletion" ADD CONSTRAINT "LearningPathCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPathCompletion" ADD CONSTRAINT "LearningPathCompletion_learningPathId_fkey" FOREIGN KEY ("learningPathId") REFERENCES "LearningPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;
