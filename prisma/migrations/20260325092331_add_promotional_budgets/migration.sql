-- CreateEnum
CREATE TYPE "PromotionalBudgetType" AS ENUM ('SALES_PROMOTION', 'MARKETING');

-- CreateTable
CREATE TABLE "PromotionalBudget" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "salesPromotionLimit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "salesPromotionUsed" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "marketingLimit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "marketingUsed" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "CreditLimitStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PromotionalBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionalBudgetDetail" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "type" "PromotionalBudgetType" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "saleId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PromotionalBudgetDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PromotionalBudget_customerId_idx" ON "PromotionalBudget"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionalBudget_customerId_year_key" ON "PromotionalBudget"("customerId", "year");

-- AddForeignKey
ALTER TABLE "PromotionalBudget" ADD CONSTRAINT "PromotionalBudget_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionalBudgetDetail" ADD CONSTRAINT "PromotionalBudgetDetail_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "PromotionalBudget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionalBudgetDetail" ADD CONSTRAINT "PromotionalBudgetDetail_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
