-- CreateEnum
CREATE TYPE "TemporaryCreditStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "TemporaryCreditLimit" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "requestedAmount" DECIMAL(15,2) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "status" "TemporaryCreditStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "requestedById" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TemporaryCreditLimit_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TemporaryCreditLimit" ADD CONSTRAINT "TemporaryCreditLimit_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemporaryCreditLimit" ADD CONSTRAINT "TemporaryCreditLimit_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemporaryCreditLimit" ADD CONSTRAINT "TemporaryCreditLimit_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
