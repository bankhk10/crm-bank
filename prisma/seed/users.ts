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
  const adminPosition = await prisma.position.create({
    data: {
      name: "Admin",
      level: 99,
      isManagerial: true,
      departmentId: salesDept.id,
    },
  });

  await prisma.position.create({
    data: {
      name: "พนักงานขาย",
      level: 1,
      departmentId: salesDept.id,
    },
  });

  await prisma.position.create({
    data: {
      name: "ผู้จัดการขาย",
      level: 3,
      isManagerial: true,
      departmentId: salesDept.id,
    },
  });

  // Fetch Admin Role
  const adminRole = await prisma.role.findUnique({
    where: { slug: "administrator" },
  });

  if (!adminRole) {
    throw new Error("Administrator Role not found. Run seedRBAC first.");
  }

  // Create Admin User
  const adminPassword = await hash("b@b.com", 12);

  await prisma.user.create({
    data: {
      name: "Bank Admin",
      email: "b@b.com",
      password: adminPassword,
      departmentId: salesDept.id,
      positionId: adminPosition.id,
      userRoles: {
        create: { roleId: adminRole.id },
      },
    },
    include: { userRoles: true },
  });

  console.log("✅ Users seeded.");
}
