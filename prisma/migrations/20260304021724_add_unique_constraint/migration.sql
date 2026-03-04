/*
  Warnings:

  - You are about to drop the column `level` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Course` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Course` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Course" DROP COLUMN "level",
DROP COLUMN "price",
ADD COLUMN     "fileKey" TEXT,
ADD COLUMN     "slug" TEXT,
ALTER COLUMN "schwierigkeit" SET DEFAULT 'EASY';

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");
