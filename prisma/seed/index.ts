import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedClear } from "./clear";
import { seedMaster } from "./master";
import { seedProductMaster } from "./product-master";
import { seedRBAC } from "./rbac";
import { seedUsers } from "./users";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Setup Prisma Client with Pg Adapter matching original seed.js
// @ts-ignore - The original seed.js passed connectionString directly
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed process...");

  try {
    // 1. Clear Data
    // await seedClear(prisma);

    // 2. Master Data (Company, Dept, Unit, Category, Plant)
    await seedMaster(prisma);

    // 3. Product Master (requires Category from Master)
    await seedProductMaster(prisma);

    // 4. RBAC (Roles, Permissions)
    await seedRBAC(prisma);

    // 5. Users (requires Dept, Roles)
    await seedUsers(prisma);

    console.log("✅ Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
