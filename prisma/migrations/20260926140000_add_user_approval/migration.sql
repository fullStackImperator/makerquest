-- AlterTable
ALTER TABLE "user" ADD COLUMN     "approvedAt" TIMESTAMP(3);

-- Existing accounts stay usable.
UPDATE "user" SET "approvedAt" = "createdAt";
