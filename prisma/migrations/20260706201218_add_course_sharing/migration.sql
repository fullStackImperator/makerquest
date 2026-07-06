-- AlterTable
ALTER TABLE "Exercise" ALTER COLUMN "intro" SET DATA TYPE JSON;

-- AlterTable
ALTER TABLE "ExerciseQuestion" ALTER COLUMN "prompt" SET DATA TYPE JSON,
ALTER COLUMN "spec" SET DATA TYPE JSON,
ALTER COLUMN "solution" SET DATA TYPE JSON,
ALTER COLUMN "explanation" SET DATA TYPE JSON;

-- AlterTable
ALTER TABLE "ExerciseResponse" ALTER COLUMN "answer" SET DATA TYPE JSON;

-- CreateTable
CREATE TABLE "_CourseShares" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CourseShares_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CourseShares_B_index" ON "_CourseShares"("B");

-- AddForeignKey
ALTER TABLE "_CourseShares" ADD CONSTRAINT "_CourseShares_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseShares" ADD CONSTRAINT "_CourseShares_B_fkey" FOREIGN KEY ("B") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
