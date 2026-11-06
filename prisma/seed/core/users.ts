import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

export async function seedUsers(prisma: PrismaClient) {
  console.log("👤 Seeding Users and Positions...");

  // Fetch Departments
  const salesDept = await prisma.department.findUnique({
    where: { code: "SA" },
  });

  if (!salesDept) {
    throw new Error("Sales Department (SA) not found. Run seedMaster first.");
  }

  // Create Positions
  const positions = [
    { name: "Admin", level: 10, isManagerial: true, departmentId: null },
    { name: "ผู้บริหาร", level: 10, isManagerial: true, departmentId: null },
    { name: "พนักงานฝ่ายขาย", level: 1, isManagerial: false, departmentId: salesDept.id },
    { name: "ผู้จัดการฝ่ายขาย", level: 3, isManagerial: true, departmentId: salesDept.id },
    { name: "ธุรการขาย", level: 1, isManagerial: false, departmentId: null },
  ];

  let adminPosition: any;

  for (const pos of positions) {
    const existingPos = await prisma.position.findFirst({
      where: { name: pos.name },
    });

    if (existingPos) {
      if (pos.name === "Admin") adminPosition = existingPos;
    } else {
      const newPos = await prisma.position.create({
        data: {
          name: pos.name,
          level: pos.level,
          isManagerial: pos.isManagerial,
          departmentId: pos.departmentId,
        },
      });
      if (pos.name === "Admin") adminPosition = newPos;
    }
  }

  // Fetch Admin Role
  const adminRole = await prisma.role.findUnique({
    where: { slug: "administrator" },
  });

  if (!adminRole) {
    throw new Error("Administrator Role not found. Run seedRBAC first.");
  }

  // Create Admin User
  const adminPassword = await hash("b@b.com", 12);

  await prisma.user.upsert({
    where: { email: "b@b.com" },
    update: {},
    create: {
      name: "Bank Admin",
      email: "b@b.com",
      password: adminPassword,
      departmentId: salesDept.id,
      positionId: adminPosition.id,
      userRoles: {
        create: { roleId: adminRole.id },
      },
    },
  });

  console.log("✅ Users seeded.");
}
