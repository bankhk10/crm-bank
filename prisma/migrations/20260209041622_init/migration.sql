-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "PermissionType" AS ENUM ('MENU', 'ACTION', 'DATA');

-- CreateEnum
CREATE TYPE "DataAccessLevel" AS ENUM ('VIEW_OWN', 'VIEW_DEPARTMENT', 'VIEW_ALL');

-- CreateEnum
CREATE TYPE "EditAccessLevel" AS ENUM ('EDIT_NONE', 'EDIT_OWN', 'EDIT_DEPARTMENT', 'EDIT_ALL');

-- CreateEnum
CREATE TYPE "DeleteAccessLevel" AS ENUM ('DELETE_NONE', 'DELETE_OWN', 'DELETE_DEPARTMENT', 'DELETE_ALL');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('DEALER', 'SUBDEALER', 'FARMER', 'BROKER');

-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "CreditLimitStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TemporaryCreditStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('PENDING', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'AWAITING_PAYMENT', 'PAID', 'AWAITING_DELIVERY', 'DELIVERED', 'DELIVERY_COMPLETED', 'EXPIRED', 'OVERDUE', 'WAITING_FOR_CORRECTION', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PaymentTerm" AS ENUM ('CREDIT_90', 'CASH_7', 'PREPAID', 'CREDIT_OVER_90');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'APPROVE', 'REJECT', 'EXPORT', 'IMPORT', 'LOGIN', 'LOGOUT');

-- CreateEnum
CREATE TYPE "SecurityEventType" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGE', 'PASSWORD_RESET', 'PERMISSION_CHANGE', 'ROLE_CHANGE', 'ADMIN_ACTION', 'DATA_EXPORT', 'SUSPICIOUS_ACTIVITY', 'SESSION_EXPIRED', 'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED');

-- CreateEnum
CREATE TYPE "LogSeverity" AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "departmentId" TEXT,
    "positionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company_code" TEXT,
    "short_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "tax_id" TEXT,
    "address_line" TEXT,
    "province" TEXT,
    "district" TEXT,
    "subdistrict" TEXT,
    "postalCode" TEXT,
    "status" "CompanyStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "prefix" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "employeeCode" TEXT,
    "birthDate" TIMESTAMP(3),
    "address_line" TEXT,
    "province" TEXT,
    "district" TEXT,
    "subdistrict" TEXT,
    "postalCode" TEXT,
    "responsibilityArea" TEXT,
    "status" TEXT,
    "positionTitle" TEXT,
    "departmentName" TEXT,
    "roleTitle" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "userId" TEXT,
    "companyId" TEXT,
    "departmentId" TEXT,
    "positionId" TEXT,
    "managerId" TEXT,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "isManagerial" BOOLEAN NOT NULL DEFAULT false,
    "departmentId" TEXT,
    "defaultRoleId" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "PermissionType" NOT NULL,
    "menuPath" TEXT,
    "action" TEXT,
    "resource" TEXT,
    "defaultDataAccess" "DataAccessLevel",
    "defaultEditAccess" "EditAccessLevel",
    "defaultDeleteAccess" "DeleteAccessLevel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "allow" BOOLEAN NOT NULL DEFAULT true,
    "dataAccess" "DataAccessLevel",
    "editAccess" "EditAccessLevel",
    "deleteAccess" "DeleteAccessLevel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedBy" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPermissionOverride" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "allow" BOOLEAN NOT NULL,
    "dataAccess" "DataAccessLevel",
    "editAccess" "EditAccessLevel",
    "deleteAccess" "DeleteAccessLevel",
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "UserPermissionOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "customerCode" TEXT NOT NULL,
    "customerType" "CustomerType" NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT,
    "firstName" TEXT,
    "birthDate" TIMESTAMP(3),
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "tax_id" TEXT,
    "address_line" TEXT,
    "province" TEXT,
    "region" TEXT,
    "district" TEXT,
    "subdistrict" TEXT,
    "postal_code" TEXT,
    "billing_address_line" TEXT,
    "billing_province" TEXT,
    "billing_district" TEXT,
    "billing_subdistrict" TEXT,
    "billing_postal_code" TEXT,
    "shipping_address_line" TEXT,
    "shipping_province" TEXT,
    "shipping_district" TEXT,
    "shipping_subdistrict" TEXT,
    "shipping_postal_code" TEXT,
    "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "contact_person" TEXT,
    "contact_phone" TEXT,
    "contact_email" TEXT,
    "notes" TEXT,
    "latitude" TEXT,
    "longitude" TEXT,
    "relationshipScore" INTEGER,
    "parentDealerId" TEXT,
    "responsibleEmployeeId" TEXT,
    "receiveFromDealer" TEXT,
    "mainCompetitor" TEXT,
    "areaCrops" TEXT,
    "averageMonthlyPurchase" TEXT,
    "mainProductSold" TEXT[],
    "brandsSold" TEXT[],
    "areaType" TEXT,
    "farmPlots" JSONB,
    "cropTypes" TEXT,
    "currentYield" TEXT,
    "farmerCount" TEXT,
    "plotCount" TEXT,
    "totalAreaRai" TEXT,
    "harvestPerYear" TEXT,
    "creditDays" TEXT,
    "chemicalValuePerCycle" TEXT,
    "chemicalQtyPerCycle" TEXT,
    "regularShops" TEXT,
    "serviceTypes" TEXT,
    "usedBrands" TEXT,
    "created_by_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditLimit" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "limitAmount" DECIMAL(15,2) NOT NULL,
    "promoAmount" DECIMAL(15,2),
    "usedAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "availableAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "CreditLimitStatus" NOT NULL DEFAULT 'ACTIVE',
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "created_by_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "temporaryCreditAmount" DECIMAL(15,2) DEFAULT 0,
    "temporaryCreditExpiryDate" TIMESTAMP(3),

    CONSTRAINT "CreditLimit_pkey" PRIMARY KEY ("id")
);

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
    "appliedToCreditLimitId" TEXT,
    "isReverted" BOOLEAN NOT NULL DEFAULT false,
    "revertedAt" TIMESTAMP(3),

    CONSTRAINT "TemporaryCreditLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCategory" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductGroupMaster" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ProductGroupMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductChain" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ProductChain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plant" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT,
    "group" TEXT,
    "recommendedMedicines" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Plant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "productCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "commonName" TEXT,
    "unit" TEXT,
    "productGroup" TEXT,
    "brand" TEXT,
    "packageSize" TEXT,
    "packageSizePerBox" TEXT,
    "totalPackageSizePerBox" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "usedForPlants" TEXT[],
    "salesPoint" TEXT,
    "properties" TEXT,
    "price" DECIMAL(15,2),
    "cartonPrice" DECIMAL(15,2),
    "promotionBudget" DECIMAL(15,2),
    "pointPerUnit" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "categoryId" TEXT,
    "productChainId" TEXT,
    "chemicalGroup" TEXT,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChemicalGroup" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "abbreviation" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ChemicalGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductStock" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "physicalBalance" INTEGER NOT NULL DEFAULT 0,
    "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
    "availableQuantity" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerImage" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductFreeItem" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "purchaseQty" INTEGER NOT NULL,
    "freeQty" INTEGER NOT NULL,
    "netPrice" DECIMAL(15,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductFreeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductPromotionItem" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(15,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductPromotionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductStockLot" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "lotNumber" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "initialQuantity" INTEGER NOT NULL DEFAULT 0,
    "importDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "storageLocation" TEXT,
    "notes" TEXT,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductStockLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "saleNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "status" "SaleStatus" NOT NULL DEFAULT 'PENDING',
    "paymentTerm" "PaymentTerm" NOT NULL,
    "creditDays" INTEGER,
    "creditDueDate" TIMESTAMP(3),
    "usePromotionalCredit" BOOLEAN NOT NULL DEFAULT false,
    "promotionalCreditUsed" DECIMAL(15,2),
    "saleDate" TIMESTAMP(3) NOT NULL,
    "requestedDeliveryDate" TIMESTAMP(3),
    "deliveryDate" TIMESTAMP(3),
    "actualDeliveryDate" TIMESTAMP(3),
    "deliveryUpdateCount" INTEGER NOT NULL DEFAULT 0,
    "maxDeliveryUpdates" INTEGER NOT NULL DEFAULT 3,
    "isDeliveryLocked" BOOLEAN NOT NULL DEFAULT false,
    "orderExpiryDate" TIMESTAMP(3),
    "lastDeliveryUpdate" TIMESTAMP(3),
    "deliveryMethod" TEXT,
    "pickupCompanyId" TEXT,
    "billingAddress" TEXT,
    "shippingAddress" TEXT,
    "useCustomShipping" BOOLEAN NOT NULL DEFAULT false,
    "subtotalAmount" DECIMAL(15,2) NOT NULL,
    "shippingCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "otherCosts" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "otherCostsDescription" TEXT,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "notes" TEXT,
    "paymentDate" TIMESTAMP(3),
    "paymentNotes" TEXT,
    "deliveryNotes" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "originalPrice" DECIMAL(15,2) NOT NULL,
    "priceModified" BOOLEAN NOT NULL DEFAULT false,
    "totalPrice" DECIMAL(15,2) NOT NULL,
    "stockAtSale" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

    CONSTRAINT "EmployeePointHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeePointSummary" (
    "employeeId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeePointSummary_pkey" PRIMARY KEY ("employeeId")
);

-- CreateTable
CREATE TABLE "SaleItemLot" (
    "id" TEXT NOT NULL,
    "saleItemId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaleItemLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleStatusHistory" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "status" "SaleStatus" NOT NULL,
    "notes" TEXT,
    "changedById" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaleStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailySalesSummary" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "customerId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "brand" TEXT,
    "productGroup" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailySalesSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegionSalesTarget" (
    "id" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER,
    "targetAmount" DECIMAL(15,2) NOT NULL,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "RegionSalesTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductGroupSalesTarget" (
    "id" TEXT NOT NULL,
    "productGroup" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER,
    "targetAmount" DECIMAL(15,2) NOT NULL,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ProductGroupSalesTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlySalesTarget" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER,
    "targetAmount" DECIMAL(15,2) NOT NULL,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MonthlySalesTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSalesTarget" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER,
    "targetAmount" DECIMAL(15,2) NOT NULL,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ProductSalesTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "userEmail" TEXT,
    "userName" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "entityName" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "changedFields" TEXT[],
    "module" TEXT,
    "requestId" TEXT,
    "sessionId" TEXT,
    "endpoint" TEXT,
    "method" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "duration" INTEGER,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" "SecurityEventType" NOT NULL,
    "severity" "LogSeverity" NOT NULL DEFAULT 'INFO',
    "message" TEXT,
    "userId" TEXT,
    "userEmail" TEXT,
    "userName" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "geoLocation" TEXT,
    "sessionId" TEXT,
    "requestId" TEXT,
    "details" JSONB,
    "targetUserId" TEXT,
    "targetUserEmail" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "failureReason" TEXT,
    "riskScore" INTEGER,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "attemptCount" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "SecurityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" "LogSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "module" TEXT,
    "functionName" TEXT,
    "requestId" TEXT,
    "userId" TEXT,
    "sessionId" TEXT,
    "errorName" TEXT,
    "errorMessage" TEXT,
    "stackTrace" TEXT,
    "metadata" JSONB,
    "duration" INTEGER,

    CONSTRAINT "ApplicationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesTarget" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "employeeId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesTargetItem" (
    "id" TEXT NOT NULL,
    "salesTargetId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "amount" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "SalesTargetItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Company_company_code_key" ON "Company"("company_code");

-- CreateIndex
CREATE UNIQUE INDEX "Company_email_key" ON "Company"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Role_slug_key" ON "Role"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermissionOverride_userId_permissionId_key" ON "UserPermissionOverride"("userId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_customerCode_key" ON "Customer"("customerCode");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_code_key" ON "ProductCategory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProductGroupMaster_code_key" ON "ProductGroupMaster"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_code_key" ON "Unit"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_code_key" ON "Brand"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Plant_code_key" ON "Plant"("code");

-- CreateIndex
CREATE INDEX "Plant_code_idx" ON "Plant"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Product_productCode_key" ON "Product"("productCode");

-- CreateIndex
CREATE UNIQUE INDEX "ChemicalGroup_code_key" ON "ChemicalGroup"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProductStock_productId_key" ON "ProductStock"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_saleNumber_key" ON "Sale"("saleNumber");

-- CreateIndex
CREATE INDEX "Sale_customerId_saleDate_idx" ON "Sale"("customerId", "saleDate");

-- CreateIndex
CREATE INDEX "Sale_employeeId_saleDate_idx" ON "Sale"("employeeId", "saleDate");

-- CreateIndex
CREATE INDEX "EmployeePointHistory_employeeId_createdAt_idx" ON "EmployeePointHistory"("employeeId", "createdAt");

-- CreateIndex
CREATE INDEX "EmployeePointHistory_saleId_idx" ON "EmployeePointHistory"("saleId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeePointHistory_saleItemId_key" ON "EmployeePointHistory"("saleItemId");

-- CreateIndex
CREATE INDEX "SaleItemLot_saleItemId_idx" ON "SaleItemLot"("saleItemId");

-- CreateIndex
CREATE INDEX "SaleItemLot_lotId_idx" ON "SaleItemLot"("lotId");

-- CreateIndex
CREATE UNIQUE INDEX "SaleItemLot_saleItemId_lotId_key" ON "SaleItemLot"("saleItemId", "lotId");

-- CreateIndex
CREATE INDEX "DailySalesSummary_year_customerId_idx" ON "DailySalesSummary"("year", "customerId");

-- CreateIndex
CREATE INDEX "DailySalesSummary_year_employeeId_idx" ON "DailySalesSummary"("year", "employeeId");

-- CreateIndex
CREATE INDEX "DailySalesSummary_date_idx" ON "DailySalesSummary"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailySalesSummary_date_customerId_employeeId_productId_key" ON "DailySalesSummary"("date", "customerId", "employeeId", "productId");

-- CreateIndex
CREATE INDEX "RegionSalesTarget_year_month_idx" ON "RegionSalesTarget"("year", "month");

-- CreateIndex
CREATE INDEX "RegionSalesTarget_region_idx" ON "RegionSalesTarget"("region");

-- CreateIndex
CREATE UNIQUE INDEX "RegionSalesTarget_region_year_month_key" ON "RegionSalesTarget"("region", "year", "month");

-- CreateIndex
CREATE INDEX "ProductGroupSalesTarget_year_month_idx" ON "ProductGroupSalesTarget"("year", "month");

-- CreateIndex
CREATE INDEX "ProductGroupSalesTarget_productGroup_idx" ON "ProductGroupSalesTarget"("productGroup");

-- CreateIndex
CREATE UNIQUE INDEX "ProductGroupSalesTarget_productGroup_year_month_key" ON "ProductGroupSalesTarget"("productGroup", "year", "month");

-- CreateIndex
CREATE INDEX "MonthlySalesTarget_year_idx" ON "MonthlySalesTarget"("year");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlySalesTarget_year_month_key" ON "MonthlySalesTarget"("year", "month");

-- CreateIndex
CREATE INDEX "ProductSalesTarget_year_month_idx" ON "ProductSalesTarget"("year", "month");

-- CreateIndex
CREATE INDEX "ProductSalesTarget_productId_idx" ON "ProductSalesTarget"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSalesTarget_productId_year_month_key" ON "ProductSalesTarget"("productId", "year", "month");

-- CreateIndex
CREATE INDEX "AuditLog_userId_timestamp_idx" ON "AuditLog"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_timestamp_idx" ON "AuditLog"("entityType", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_action_timestamp_idx" ON "AuditLog"("action", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_module_timestamp_idx" ON "AuditLog"("module", "timestamp");

-- CreateIndex
CREATE INDEX "SecurityLog_userId_timestamp_idx" ON "SecurityLog"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "SecurityLog_eventType_timestamp_idx" ON "SecurityLog"("eventType", "timestamp");

-- CreateIndex
CREATE INDEX "SecurityLog_ipAddress_timestamp_idx" ON "SecurityLog"("ipAddress", "timestamp");

-- CreateIndex
CREATE INDEX "SecurityLog_severity_timestamp_idx" ON "SecurityLog"("severity", "timestamp");

-- CreateIndex
CREATE INDEX "SecurityLog_timestamp_idx" ON "SecurityLog"("timestamp");

-- CreateIndex
CREATE INDEX "SecurityLog_riskScore_idx" ON "SecurityLog"("riskScore");

-- CreateIndex
CREATE INDEX "ApplicationLog_level_timestamp_idx" ON "ApplicationLog"("level", "timestamp");

-- CreateIndex
CREATE INDEX "ApplicationLog_module_timestamp_idx" ON "ApplicationLog"("module", "timestamp");

-- CreateIndex
CREATE INDEX "ApplicationLog_requestId_idx" ON "ApplicationLog"("requestId");

-- CreateIndex
CREATE INDEX "ApplicationLog_timestamp_idx" ON "ApplicationLog"("timestamp");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "SalesTarget_year_month_idx" ON "SalesTarget"("year", "month");

-- CreateIndex
CREATE INDEX "SalesTarget_employeeId_idx" ON "SalesTarget"("employeeId");

-- CreateIndex
CREATE INDEX "SalesTarget_customerId_idx" ON "SalesTarget"("customerId");

-- CreateIndex
CREATE INDEX "SalesTargetItem_salesTargetId_idx" ON "SalesTargetItem"("salesTargetId");

-- CreateIndex
CREATE INDEX "SalesTargetItem_productId_idx" ON "SalesTargetItem"("productId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_defaultRoleId_fkey" FOREIGN KEY ("defaultRoleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermissionOverride" ADD CONSTRAINT "UserPermissionOverride_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermissionOverride" ADD CONSTRAINT "UserPermissionOverride_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_parentDealerId_fkey" FOREIGN KEY ("parentDealerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_responsibleEmployeeId_fkey" FOREIGN KEY ("responsibleEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditLimit" ADD CONSTRAINT "CreditLimit_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemporaryCreditLimit" ADD CONSTRAINT "TemporaryCreditLimit_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemporaryCreditLimit" ADD CONSTRAINT "TemporaryCreditLimit_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemporaryCreditLimit" ADD CONSTRAINT "TemporaryCreditLimit_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductGroupMaster" ADD CONSTRAINT "ProductGroupMaster_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_productChainId_fkey" FOREIGN KEY ("productChainId") REFERENCES "ProductChain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStock" ADD CONSTRAINT "ProductStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerImage" ADD CONSTRAINT "CustomerImage_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFreeItem" ADD CONSTRAINT "ProductFreeItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPromotionItem" ADD CONSTRAINT "ProductPromotionItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStockLot" ADD CONSTRAINT "ProductStockLot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_pickupCompanyId_fkey" FOREIGN KEY ("pickupCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeePointHistory" ADD CONSTRAINT "EmployeePointHistory_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeePointHistory" ADD CONSTRAINT "EmployeePointHistory_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeePointHistory" ADD CONSTRAINT "EmployeePointHistory_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeePointHistory" ADD CONSTRAINT "EmployeePointHistory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeePointSummary" ADD CONSTRAINT "EmployeePointSummary_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItemLot" ADD CONSTRAINT "SaleItemLot_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItemLot" ADD CONSTRAINT "SaleItemLot_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "ProductStockLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleStatusHistory" ADD CONSTRAINT "SaleStatusHistory_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleStatusHistory" ADD CONSTRAINT "SaleStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailySalesSummary" ADD CONSTRAINT "DailySalesSummary_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailySalesSummary" ADD CONSTRAINT "DailySalesSummary_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailySalesSummary" ADD CONSTRAINT "DailySalesSummary_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSalesTarget" ADD CONSTRAINT "ProductSalesTarget_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityLog" ADD CONSTRAINT "SecurityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityLog" ADD CONSTRAINT "SecurityLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTarget" ADD CONSTRAINT "SalesTarget_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTarget" ADD CONSTRAINT "SalesTarget_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTargetItem" ADD CONSTRAINT "SalesTargetItem_salesTargetId_fkey" FOREIGN KEY ("salesTargetId") REFERENCES "SalesTarget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTargetItem" ADD CONSTRAINT "SalesTargetItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
