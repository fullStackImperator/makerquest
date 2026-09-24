-- CreateTable
CREATE TABLE "ProfileChange" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorId" TEXT,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfileChange_createdAt_idx" ON "ProfileChange"("createdAt");

-- CreateIndex
CREATE INDEX "ProfileChange_userId_createdAt_idx" ON "ProfileChange"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "ProfileChange" ADD CONSTRAINT "ProfileChange_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileChange" ADD CONSTRAINT "ProfileChange_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

