export { prisma, db } from "./prisma";

// Re-export commonly used Prisma types and utilities explicitly
export {
  Prisma,
  PrismaClient,
  // Add other specific exports you need from @prisma/client
} from "@prisma/client";
