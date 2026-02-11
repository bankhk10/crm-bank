-- CreateEnum
CREATE TYPE "ShippingCompanyStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "ShippingCompany" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "status" "ShippingCompanyStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ShippingCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerShippingCompany" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "shippingCompanyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerShippingCompany_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerShippingCompany_customerId_idx" ON "CustomerShippingCompany"("customerId");

-- CreateIndex
CREATE INDEX "CustomerShippingCompany_shippingCompanyId_idx" ON "CustomerShippingCompany"("shippingCompanyId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerShippingCompany_customerId_shippingCompanyId_key" ON "CustomerShippingCompany"("customerId", "shippingCompanyId");

-- AddForeignKey
ALTER TABLE "CustomerShippingCompany" ADD CONSTRAINT "CustomerShippingCompany_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerShippingCompany" ADD CONSTRAINT "CustomerShippingCompany_shippingCompanyId_fkey" FOREIGN KEY ("shippingCompanyId") REFERENCES "ShippingCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;
