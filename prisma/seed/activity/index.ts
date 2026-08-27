import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedActivityDepartmentsAndPositions } from "./departments-positions";
import { seedActivityTypes } from "./activity-types";
import { seedPromotionalMaterials } from "./promotional-materials";

export async function seedActivityTestData(prisma: PrismaClient) {
  console.log("🏃 Starting Activity Test Data Seed...");

  // 1. ActivityType Master (11 ประเภทงาน)
  await seedActivityTypes(prisma);

  // 2. Departments & Positions
  await seedActivityDepartmentsAndPositions(prisma);

  // 3. Promotional Materials (สื่อส่งเสริมการขาย)
  await seedPromotionalMaterials(prisma);

  console.log("✅ Activity Test Data Seed completed successfully!");
}

// Standalone execution entrypoint
if (process.argv[1]?.includes("activity")) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // @ts-ignore
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  seedActivityTestData(prisma)
    .then(() => {
      console.log("✅ Activity Seed finished.");
      return prisma.$disconnect();
    })
    .catch(async (error) => {
      console.error("❌ Activity Seed failed:", error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
