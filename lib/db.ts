/**
 * Prisma Database Client
 * Singleton pattern to prevent multiple instances during development
 * Updated for Prisma 7 with driver adapter
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

/**
 * Shared Prisma instance
 */
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Re-export as 'db' for cleaner usage
 */
export const db = prisma;

/**
 * Re-export commonly used Prisma types and enums explicitly
 */
export {
  Prisma,
  PrismaClient,
  DataAccessLevel,
  EditAccessLevel,
  DeleteAccessLevel,
  PermissionType,
  SaleStatus,
  PaymentTerm,
  AuditAction,
  LogSeverity,
  SecurityEventType,
  CreditLimitStatus,
  TemporaryCreditStatus,
  CustomerType,
  CustomerStatus,
  NotificationType,
  ProductStatus,
  CompanyStatus,
  ShippingCompanyStatus,
} from "@prisma/client";

/**
 * Export Prisma model types
 */
export type {
  Permission,
  RolePermission,
  UserPermissionOverride,
  Sale,
  SaleItem,
  Department,
  Position,
  Role,
  User,
  Notification,
  SalesTarget,
  SalesTargetItem,
  AuditLog,
  SecurityLog,
  ApplicationLog,
  CreditLimit,
  TemporaryCreditLimit,
  Customer,
  Product,
  ProductCategory,
  ProductGroupMaster,
} from "@prisma/client";

export default prisma;
