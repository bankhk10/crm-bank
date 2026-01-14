/**
 * @deprecated Use `import { db } from "@/src/infrastructure/database"` instead
 * This file is kept for backward compatibility during migration
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

// Re-export prisma alias for convenience
export const prisma = db;
