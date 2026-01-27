export { prisma, db } from "./prisma";

// Re-export commonly used Prisma types and utilities explicitly
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
  // Add other specific exports you need from @prisma/client
} from "@prisma/client";

// Export Prisma types
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
