-- CreateEnum
CREATE TYPE "SalesTargetChangeType" AS ENUM ('CREATED', 'UPDATED', 'DELETED');

-- CreateTable
CREATE TABLE "SalesTargetHistory" (
    "id" TEXT NOT NULL,
    "salesTargetId" TEXT NOT NULL,
    "changeType" "SalesTargetChangeType" NOT NULL,
    "changedById" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "snapshotBefore" JSONB,
    "snapshotAfter" JSONB,
    "changeSummary" TEXT,

    CONSTRAINT "SalesTargetHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalesTargetHistory_salesTargetId_changedAt_idx" ON "SalesTargetHistory"("salesTargetId", "changedAt");

-- CreateIndex
CREATE INDEX "SalesTargetHistory_changedById_changedAt_idx" ON "SalesTargetHistory"("changedById", "changedAt");

-- CreateIndex
CREATE INDEX "SalesTargetHistory_changedAt_idx" ON "SalesTargetHistory"("changedAt");

-- AddForeignKey
ALTER TABLE "SalesTargetHistory" ADD CONSTRAINT "SalesTargetHistory_salesTargetId_fkey" FOREIGN KEY ("salesTargetId") REFERENCES "SalesTarget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTargetHistory" ADD CONSTRAINT "SalesTargetHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
