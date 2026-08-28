import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedActivityDepartmentsAndPositions } from "./departments-positions";
import { seedActivityTypes } from "./activity-types";
import { seedPromotionalMaterials } from "./promotional-materials";
import { ensureTestAssetsExist } from "./test-assets";
import { resolveSeedContext } from "./seed-helpers";
import { seedType1 } from "./type1";
import { seedType2 } from "./type2";
import { seedType3 } from "./type3";
import { seedType4 } from "./type4";
import { seedType5 } from "./type5";
import { seedType6 } from "./type6";
import { seedType7 } from "./type7";
import { seedType8 } from "./type8";
import { seedType9 } from "./type9";
import { seedType10 } from "./type10";
import { seedType11 } from "./type11";
import { seedType12 } from "./type12";

export async function seedActivityTestData(prisma: PrismaClient) {
  console.log("========================================");
  console.log("Activity Seed");
  console.log("========================================");

  // 1. ActivityType Master (12 ประเภทงาน)
  await seedActivityTypes(prisma);
  console.log("Activity Types: OK\n");

  // 2. Departments & Positions
  await seedActivityDepartmentsAndPositions(prisma);

  // 3. Promotional Materials (สื่อส่งเสริมการขาย)
  await seedPromotionalMaterials(prisma);

  // 4. Ensure test asset files exist
  ensureTestAssetsExist();

  // 5. Resolve Database Context
  const ctx = await resolveSeedContext(prisma);

  // 6. Seed each Work Type
  await seedType1(prisma, ctx);
  console.log("TYPE_1\n  Plans: 3\n  Actual Results: 1\n");

  await seedType2(prisma, ctx);
  console.log("TYPE_2\n  Plans: 3\n  Actual Results: 1\n");

  await seedType3(prisma, ctx);
  console.log("TYPE_3\n  Plans: 3\n  Actual Results: 2\n");

  await seedType4(prisma, ctx);
  console.log("TYPE_4\n  Plans: 3\n  Actual Results: 1\n");

  await seedType5(prisma, ctx);
  console.log("TYPE_5\n  Plans: 3\n  Actual Results: 2\n");

  await seedType6(prisma, ctx);
  console.log("TYPE_6\n  Plans: 3\n  Actual Results: 2\n");

  await seedType7(prisma, ctx);
  console.log("TYPE_7\n  Plans: 3\n  Actual Results: 2\n");

  await seedType8(prisma, ctx);
  console.log("TYPE_8\n  Plans: 3\n  Actual Results: 2\n");

  await seedType9(prisma, ctx);
  console.log("TYPE_9\n  Plans: 3\n  Actual Results: 2\n");

  await seedType10(prisma, ctx);
  console.log("TYPE_10\n  Plans: 3\n  Actual Results: 2\n");

  await seedType11(prisma, ctx);
  console.log("TYPE_11\n  Plans: 3\n  Actual Results: 2\n");

  await seedType12(prisma, ctx);
  console.log("TYPE_12\n  Plans: 3\n  Actual Results: 0\n  (No Actual)\n");

  console.log("========================================");
  console.log("Seed Completed");
  console.log("========================================");
}

// Standalone execution entrypoint
if (process.argv[1]?.includes("activity")) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  seedActivityTestData(prisma)
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (error) => {
      console.error("❌ Activity Seed failed:", error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
