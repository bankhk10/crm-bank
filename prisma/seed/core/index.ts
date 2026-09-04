import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedMaster } from "./master";
import { seedProductMaster } from "./product-master";
import { seedRBAC } from "./rbac";
import { seedUsers } from "./users";
import { seedSalesPromotionUser } from "./sales-promotion-user";
import { seedPromotionalMaterials } from "../activity/promotional-materials";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// @ts-ignore
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export async function seedCore() {
  console.log("🌱 Starting Core Database Seed...");

  try {
    // 1. Master Data (Company, Dept, Unit, Category, Plant)
    await seedMaster(prisma);

    // 2. Product Master (requires Category from Master)
    await seedProductMaster(prisma);

    // 3. RBAC (Roles, Permissions)
    await seedRBAC(prisma);

    // 4. Users (requires Dept, Roles)
    await seedUsers(prisma);

    // 5. Sales Promotion Test User & Permissions
    await seedSalesPromotionUser(prisma);

    // 6. Promotional Materials Master Data (197 items)
    await seedPromotionalMaterials(prisma);

    console.log("✅ Core Database Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Core seed failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Standalone execution entrypoint
if (process.argv[1]?.includes("core")) {
  seedCore();
}
