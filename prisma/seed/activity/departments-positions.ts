import { PrismaClient } from "@prisma/client";

export async function seedActivityDepartmentsAndPositions(prisma: PrismaClient) {
  console.log("🏢 Seeding Activity Departments & Positions...");

  // 1. Fetch/Ensure Departments
  const salesDept = await prisma.department.upsert({
    where: { code: "SA" },
    update: {},
    create: { name: "แผนกบริหารงานขาย", code: "SA" },
  });

  const mktDept = await prisma.department.upsert({
    where: { code: "MKT" },
    update: {},
    create: { name: "แผนกการตลาด", code: "MKT" },
  });

  // 2. Fetch or Create Positions Helper
  const getOrCreatePosition = async (
    name: string,
    level: number,
    isManagerial: boolean,
    departmentId: string | null
  ) => {
    let pos = await prisma.position.findFirst({ where: { name } });
    if (!pos) {
      pos = await prisma.position.create({
        data: { name, level, isManagerial, departmentId },
      });
    }
    return pos;
  };

  const spoPosition = await getOrCreatePosition("พนักงานส่งเสริมการขาย", 1, false, salesDept.id);
  const salesPosition = await getOrCreatePosition("พนักงานขาย", 1, false, salesDept.id);
  const areaPosition = await getOrCreatePosition("ผู้จัดการภาค", 2, true, salesDept.id);
  const salesAdminPosition = await getOrCreatePosition("ผู้จัดการแผนกบริหารงานขาย", 3, true, salesDept.id);
  const mktPosition = await getOrCreatePosition("พนักงานการตลาด", 1, false, mktDept.id);
  const mktManagerPosition = await getOrCreatePosition("ผู้จัดการแผนกการตลาด", 3, true, mktDept.id);
  const salesDirectorPosition = await getOrCreatePosition("ผู้จัดการฝ่ายขาย", 4, true, salesDept.id);

  console.log("✅ Activity Departments & Positions seeded successfully.");

  return {
    departments: { salesDept, mktDept },
    positions: {
      spoPosition,
      salesPosition,
      areaPosition,
      salesAdminPosition,
      mktPosition,
      mktManagerPosition,
      salesDirectorPosition,
    },
  };
}
