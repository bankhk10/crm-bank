import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedActivityDepartmentsAndPositions } from "./departments-positions";
import { seedActivityRBAC } from "./activity-rbac";
import { seedActivityTypes } from "./activity-types";
import { seedPromotionalMaterials } from "./promotional-materials";

export async function seedActivityMasterData(prisma: PrismaClient) {
  console.log("========================================");
  console.log("Activity Master Data Seed (Production)");
  console.log("========================================");

  // 1. ActivityType Master (15 ประเภทงาน Type 1 - Type 14)
  await seedActivityTypes(prisma);
  console.log("Activity Types: OK\n");

  // 2. Departments & Positions
  await seedActivityDepartmentsAndPositions(prisma);

  // 3. Activity RBAC Master Data (Roles, Permissions & Mapping)
  await seedActivityRBAC(prisma);

  // 4. Promotional Materials (สื่อส่งเสริมการขาย 197 รายการ)
  await seedPromotionalMaterials(prisma);

  console.log("========================================");
  console.log("Activity Master Data Seed Completed");
  console.log("========================================");
}

// Backward-compatible alias
export const seedActivityTestData = seedActivityMasterData;

// Standalone execution entrypoint
if (process.argv[1]?.includes("activity")) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  seedActivityMasterData(prisma)
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (error) => {
      console.error("❌ Activity Master Data Seed failed:", error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
