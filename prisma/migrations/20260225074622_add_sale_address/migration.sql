-- CreateTable
CREATE TABLE "SaleAddress" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "companyAddressId" TEXT,
    "billingCustomerAddressId" TEXT,
    "shippingCustomerAddressId" TEXT,
    "pickupCompanyAddressId" TEXT,
    "shippingCompanyAddressId" TEXT,
    "companyAddressSnapshot" TEXT,
    "billingAddressSnapshot" TEXT,
    "shippingAddressSnapshot" TEXT,
    "pickupAddressSnapshot" TEXT,
    "shippingCompanyAddressSnapshot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaleAddress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SaleAddress_saleId_key" ON "SaleAddress"("saleId");

-- AddForeignKey
ALTER TABLE "SaleAddress" ADD CONSTRAINT "SaleAddress_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
