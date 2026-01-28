-- Add pointPerUnit to Product
ALTER TABLE "Product" ADD COLUMN "pointPerUnit" INTEGER NOT NULL DEFAULT 0;

-- Create EmployeePointSummary
CREATE TABLE "EmployeePointSummary" (
    "employeeId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeePointSummary_pkey" PRIMARY KEY ("employeeId"),
    CONSTRAINT "EmployeePointSummary_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create EmployeePointHistory
CREATE TABLE "EmployeePointHistory" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "saleItemId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "pointPerUnit" INTEGER NOT NULL,
    "totalPoints" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeePointHistory_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "EmployeePointHistory_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmployeePointHistory_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmployeePointHistory_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EmployeePointHistory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "EmployeePointHistory_saleItemId_key" ON "EmployeePointHistory"("saleItemId");
CREATE INDEX "EmployeePointHistory_employeeId_createdAt_idx" ON "EmployeePointHistory"("employeeId", "createdAt");
CREATE INDEX "EmployeePointHistory_saleId_idx" ON "EmployeePointHistory"("saleId");
