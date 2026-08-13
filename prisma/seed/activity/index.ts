import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedActivityPermissions } from "./permissions";
import { seedActivityDepartmentsAndPositions } from "./departments-positions";

export async function seedActivityTestData(prisma: PrismaClient) {
  console.log("🏃 Starting Activity Test Data Seed...");

  // 1. Activity Permissions
  await seedActivityPermissions(prisma);

  // 2. Departments & Positions
  await seedActivityDepartmentsAndPositions(prisma);

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
