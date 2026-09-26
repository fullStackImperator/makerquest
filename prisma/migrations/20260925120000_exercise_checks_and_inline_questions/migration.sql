-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "chapterId" TEXT,
ADD COLUMN     "xpReward" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ExerciseQuestion" ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ExerciseAttempt" ADD COLUMN     "xpAwarded" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "xpAwardedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ExerciseResponse" ADD COLUMN     "checkedAt" TIMESTAMP(3),
ADD COLUMN     "correct" BOOLEAN,
ADD COLUMN     "firstTryScore" INTEGER,
ADD COLUMN     "tries" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_chapterId_key" ON "Exercise"("chapterId");

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Data: Aufgaben that awarded XP before get the default suggestion
-- (15 % of the quest XP = 10 × Klassenstufe × difficulty factor), instead of the full quest XP.
UPDATE "Exercise" AS e
SET "xpReward" = ROUND(0.15 * 10 * c."klassenstufe" * CASE c."schwierigkeit"
    WHEN 'VERY_EASY' THEN 1
    WHEN 'EASY' THEN 2
    WHEN 'MEDIUM' THEN 3
    WHEN 'DIFFICULT' THEN 4
    WHEN 'VERY_DIFFICULT' THEN 5
    ELSE 1 END)
FROM "Course" AS c
WHERE e."courseId" = c."id" AND e."awardXp" = true AND c."klassenstufe" IS NOT NULL;

-- Data: answers of already submitted attempts count as the first try.
UPDATE "ExerciseResponse" AS r
SET "tries" = 1,
    "firstTryScore" = COALESCE(r."finalScore", r."autoScore"),
    "correct" = COALESCE(r."finalScore", r."autoScore", 0) >= q."points",
    "checkedAt" = COALESCE(a."submittedAt", r."updatedAt")
FROM "ExerciseAttempt" AS a, "ExerciseQuestion" AS q
WHERE r."attemptId" = a."id" AND r."questionId" = q."id" AND a."status" <> 'IN_PROGRESS';

-- Data: attempts graded under the old rules already received XP; don't award again.
UPDATE "ExerciseAttempt"
SET "xpAwardedAt" = COALESCE("submittedAt", "startedAt")
WHERE "status" = 'GRADED';
