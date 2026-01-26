export { prisma, db } from "./prisma";

// Re-export commonly used Prisma types and utilities explicitly
export {
  Prisma,
  PrismaClient,
  DataAccessLevel,
  EditAccessLevel,
  DeleteAccessLevel,
  PermissionType,
  // Add other specific exports you need from @prisma/client
} from "@prisma/client";

// Export Prisma types
export type {
  Permission,
  RolePermission,
  UserPermissionOverride,
} from "@prisma/client";
