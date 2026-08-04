import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

export async function seedActivityUsersAndEmployees(
  prisma: PrismaClient,
  departments: { salesDept: any; mktDept: any },
  positions: {
    spoPosition: any;
    salesPosition: any;
    areaPosition: any;
    salesAdminPosition: any;
    mktPosition: any;
    mktManagerPosition: any;
    salesDirectorPosition: any;
  },
  roles: {
    spoRole: any;
    salesRole: any;
    areaRole: any;
    salesAdminRole: any;
    mktRole: any;
    mktManagerRole: any;
    salesDirectorRole: any;
  }
) {
  console.log("👤 Seeding Activity Test Users & Manager Chain...");

  const { salesDept, mktDept } = departments;
  const {
    spoPosition,
    salesPosition,
    areaPosition,
    salesAdminPosition,
    mktPosition,
    mktManagerPosition,
    salesDirectorPosition,
  } = positions;

  const {
    spoRole,
    salesRole,
    areaRole,
    salesAdminRole,
    mktRole,
    mktManagerRole,
    salesDirectorRole,
  } = roles;

  // 1. ผู้จัดการฝ่ายขาย (Top Level Executive)
  const salesDirectorEmail = "salesdirector@gmail.com";
  const salesDirectorUser = await prisma.user.upsert({
    where: { email: salesDirectorEmail },
    update: {
      password: await hash(salesDirectorEmail, 12),
      departmentId: salesDept.id,
      positionId: salesDirectorPosition.id,
    },
    create: {
      name: "ผู้จัดการฝ่ายขาย",
      email: salesDirectorEmail,
      password: await hash(salesDirectorEmail, 12),
      departmentId: salesDept.id,
      positionId: salesDirectorPosition.id,
    },
  });
  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: salesDirectorUser.id, roleId: salesDirectorRole.id },
    },
    update: {},
    create: { userId: salesDirectorUser.id, roleId: salesDirectorRole.id },
  });
  const salesDirectorEmployee = await prisma.employee.upsert({
    where: { email: salesDirectorEmail },
    update: {
      name: "ผู้จัดการฝ่ายขาย",
      status: "ACTIVE",
      userId: salesDirectorUser.id,
      departmentId: salesDept.id,
      positionId: salesDirectorPosition.id,
      positionTitle: salesDirectorPosition.name,
      departmentName: salesDept.name,
    },
    create: {
      name: "ผู้จัดการฝ่ายขาย",
      email: salesDirectorEmail,
      status: "ACTIVE",
      userId: salesDirectorUser.id,
      departmentId: salesDept.id,
      positionId: salesDirectorPosition.id,
      positionTitle: salesDirectorPosition.name,
      departmentName: salesDept.name,
    },
  });

  // 2. Admin (ผู้จัดการแผนกบริหารงานขาย)
  const adminEmail = "salesadmin@gmail.com";
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: await hash(adminEmail, 12),
      departmentId: salesDept.id,
      positionId: salesAdminPosition.id,
    },
    create: {
      name: "ผู้จัดการแผนกบริหารงานขาย",
      email: adminEmail,
      password: await hash(adminEmail, 12),
      departmentId: salesDept.id,
      positionId: salesAdminPosition.id,
    },
  });
  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: adminUser.id, roleId: salesAdminRole.id },
    },
    update: {},
    create: { userId: adminUser.id, roleId: salesAdminRole.id },
  });
  const adminEmployee = await prisma.employee.upsert({
    where: { email: adminEmail },
    update: {
      name: "ผู้จัดการแผนกบริหารงานขาย",
      status: "ACTIVE",
      userId: adminUser.id,
      departmentId: salesDept.id,
      positionId: salesAdminPosition.id,
      positionTitle: salesAdminPosition.name,
      departmentName: salesDept.name,
      managerId: salesDirectorEmployee.id,
    },
    create: {
      name: "ผู้จัดการแผนกบริหารงานขาย",
      email: adminEmail,
      status: "ACTIVE",
      userId: adminUser.id,
      departmentId: salesDept.id,
      positionId: salesAdminPosition.id,
      positionTitle: salesAdminPosition.name,
      departmentName: salesDept.name,
      managerId: salesDirectorEmployee.id,
    },
  });

  // 3. ผู้จัดการแผนกการตลาด
  const mktManagerEmail = "mktmanager@gmail.com";
  const mktManagerUser = await prisma.user.upsert({
    where: { email: mktManagerEmail },
    update: {
      password: await hash(mktManagerEmail, 12),
      departmentId: mktDept.id,
      positionId: mktManagerPosition.id,
    },
    create: {
      name: "ผู้จัดการแผนกการตลาด",
      email: mktManagerEmail,
      password: await hash(mktManagerEmail, 12),
      departmentId: mktDept.id,
      positionId: mktManagerPosition.id,
    },
  });
  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: mktManagerUser.id, roleId: mktManagerRole.id },
    },
    update: {},
    create: { userId: mktManagerUser.id, roleId: mktManagerRole.id },
  });
  const mktManagerEmployee = await prisma.employee.upsert({
    where: { email: mktManagerEmail },
    update: {
      name: "ผู้จัดการแผนกการตลาด",
      status: "ACTIVE",
      userId: mktManagerUser.id,
      departmentId: mktDept.id,
      positionId: mktManagerPosition.id,
      positionTitle: mktManagerPosition.name,
      departmentName: mktDept.name,
      managerId: salesDirectorEmployee.id,
    },
    create: {
      name: "ผู้จัดการแผนกการตลาด",
      email: mktManagerEmail,
      status: "ACTIVE",
      userId: mktManagerUser.id,
      departmentId: mktDept.id,
      positionId: mktManagerPosition.id,
      positionTitle: mktManagerPosition.name,
      departmentName: mktDept.name,
      managerId: salesDirectorEmployee.id,
    },
  });

  // 4. พนักงานการตลาด
  const mktEmail = "mkt@gmail.com";
  const mktUser = await prisma.user.upsert({
    where: { email: mktEmail },
    update: {
      password: await hash(mktEmail, 12),
      departmentId: mktDept.id,
      positionId: mktPosition.id,
    },
    create: {
      name: "พนักงานการตลาด",
      email: mktEmail,
      password: await hash(mktEmail, 12),
      departmentId: mktDept.id,
      positionId: mktPosition.id,
    },
  });
  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: mktUser.id, roleId: mktRole.id },
    },
    update: {},
    create: { userId: mktUser.id, roleId: mktRole.id },
  });
  await prisma.employee.upsert({
    where: { email: mktEmail },
    update: {
      name: "พนักงานการตลาด",
      status: "ACTIVE",
      userId: mktUser.id,
      departmentId: mktDept.id,
      positionId: mktPosition.id,
      positionTitle: mktPosition.name,
      departmentName: mktDept.name,
      managerId: mktManagerEmployee.id,
    },
    create: {
      name: "พนักงานการตลาด",
      email: mktEmail,
      status: "ACTIVE",
      userId: mktUser.id,
      departmentId: mktDept.id,
      positionId: mktPosition.id,
      positionTitle: mktPosition.name,
      departmentName: mktDept.name,
      managerId: mktManagerEmployee.id,
    },
  });

  // ==================== ทีมที่ 1 ====================
  const areaEmail = "area@gmail.com";
  const areaUser = await prisma.user.upsert({
    where: { email: areaEmail },
    update: {
      password: await hash(areaEmail, 12),
      departmentId: salesDept.id,
      positionId: areaPosition.id,
    },
    create: {
      name: "ผู้จัดการภาค (ทีม 1)",
      email: areaEmail,
      password: await hash(areaEmail, 12),
      departmentId: salesDept.id,
      positionId: areaPosition.id,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: areaUser.id, roleId: areaRole.id } },
    update: {},
    create: { userId: areaUser.id, roleId: areaRole.id },
  });
  const areaEmployee = await prisma.employee.upsert({
    where: { email: areaEmail },
    update: {
      name: "ผู้จัดการภาค (ทีม 1)",
      status: "ACTIVE",
      userId: areaUser.id,
      departmentId: salesDept.id,
      positionId: areaPosition.id,
      positionTitle: areaPosition.name,
      departmentName: salesDept.name,
      managerId: adminEmployee.id,
    },
    create: {
      name: "ผู้จัดการภาค (ทีม 1)",
      email: areaEmail,
      status: "ACTIVE",
      userId: areaUser.id,
      departmentId: salesDept.id,
      positionId: areaPosition.id,
      positionTitle: areaPosition.name,
      departmentName: salesDept.name,
      managerId: adminEmployee.id,
    },
  });

  const salesEmail = "sales@gmail.com";
  const salesUser = await prisma.user.upsert({
    where: { email: salesEmail },
    update: {
      password: await hash(salesEmail, 12),
      departmentId: salesDept.id,
      positionId: salesPosition.id,
    },
    create: {
      name: "พนักงานขาย (ทีม 1)",
      email: salesEmail,
      password: await hash(salesEmail, 12),
      departmentId: salesDept.id,
      positionId: salesPosition.id,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: salesUser.id, roleId: salesRole.id } },
    update: {},
    create: { userId: salesUser.id, roleId: salesRole.id },
  });
  const salesEmployee = await prisma.employee.upsert({
    where: { email: salesEmail },
    update: {
      name: "พนักงานขาย (ทีม 1)",
      status: "ACTIVE",
      userId: salesUser.id,
      departmentId: salesDept.id,
      positionId: salesPosition.id,
      positionTitle: salesPosition.name,
      departmentName: salesDept.name,
      managerId: areaEmployee.id,
    },
    create: {
      name: "พนักงานขาย (ทีม 1)",
      email: salesEmail,
      status: "ACTIVE",
      userId: salesUser.id,
      departmentId: salesDept.id,
      positionId: salesPosition.id,
      positionTitle: salesPosition.name,
      departmentName: salesDept.name,
      managerId: areaEmployee.id,
    },
  });

  const spoEmail = "spo@gmail.com";
  const spoUser = await prisma.user.upsert({
    where: { email: spoEmail },
    update: {
      password: await hash(spoEmail, 12),
      departmentId: salesDept.id,
      positionId: spoPosition.id,
    },
    create: {
      name: "พนักงานส่งเสริมการขาย (ทีม 1)",
      email: spoEmail,
      password: await hash(spoEmail, 12),
      departmentId: salesDept.id,
      positionId: spoPosition.id,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: spoUser.id, roleId: spoRole.id } },
    update: {},
    create: { userId: spoUser.id, roleId: spoRole.id },
  });
  await prisma.employee.upsert({
    where: { email: spoEmail },
    update: {
      name: "พนักงานส่งเสริมการขาย (ทีม 1)",
      status: "ACTIVE",
      userId: spoUser.id,
      departmentId: salesDept.id,
      positionId: spoPosition.id,
      positionTitle: spoPosition.name,
      departmentName: salesDept.name,
      managerId: salesEmployee.id,
    },
    create: {
      name: "พนักงานส่งเสริมการขาย (ทีม 1)",
      email: spoEmail,
      status: "ACTIVE",
      userId: spoUser.id,
      departmentId: salesDept.id,
      positionId: spoPosition.id,
      positionTitle: spoPosition.name,
      departmentName: salesDept.name,
      managerId: salesEmployee.id,
    },
  });

  // ==================== ทีมที่ 2 ====================
  const area2Email = "area2@gmail.com";
  const area2User = await prisma.user.upsert({
    where: { email: area2Email },
    update: {
      password: await hash(area2Email, 12),
      departmentId: salesDept.id,
      positionId: areaPosition.id,
    },
    create: {
      name: "ผู้จัดการภาค (ทีม 2)",
      email: area2Email,
      password: await hash(area2Email, 12),
      departmentId: salesDept.id,
      positionId: areaPosition.id,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: area2User.id, roleId: areaRole.id } },
    update: {},
    create: { userId: area2User.id, roleId: areaRole.id },
  });
  const area2Employee = await prisma.employee.upsert({
    where: { email: area2Email },
    update: {
      name: "ผู้จัดการภาค (ทีม 2)",
      status: "ACTIVE",
      userId: area2User.id,
      departmentId: salesDept.id,
      positionId: areaPosition.id,
      positionTitle: areaPosition.name,
      departmentName: salesDept.name,
      managerId: adminEmployee.id,
    },
    create: {
      name: "ผู้จัดการภาค (ทีม 2)",
      email: area2Email,
      status: "ACTIVE",
      userId: area2User.id,
      departmentId: salesDept.id,
      positionId: areaPosition.id,
      positionTitle: areaPosition.name,
      departmentName: salesDept.name,
      managerId: adminEmployee.id,
    },
  });

  const sales2Email = "sales2@gmail.com";
  const sales2User = await prisma.user.upsert({
    where: { email: sales2Email },
    update: {
      password: await hash(sales2Email, 12),
      departmentId: salesDept.id,
      positionId: salesPosition.id,
    },
    create: {
      name: "พนักงานขาย (ทีม 2)",
      email: sales2Email,
      password: await hash(sales2Email, 12),
      departmentId: salesDept.id,
      positionId: salesPosition.id,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: sales2User.id, roleId: salesRole.id } },
    update: {},
    create: { userId: sales2User.id, roleId: salesRole.id },
  });
  const sales2Employee = await prisma.employee.upsert({
    where: { email: sales2Email },
    update: {
      name: "พนักงานขาย (ทีม 2)",
      status: "ACTIVE",
      userId: sales2User.id,
      departmentId: salesDept.id,
      positionId: salesPosition.id,
      positionTitle: salesPosition.name,
      departmentName: salesDept.name,
      managerId: area2Employee.id,
    },
    create: {
      name: "พนักงานขาย (ทีม 2)",
      email: sales2Email,
      status: "ACTIVE",
      userId: sales2User.id,
      departmentId: salesDept.id,
      positionId: salesPosition.id,
      positionTitle: salesPosition.name,
      departmentName: salesDept.name,
      managerId: area2Employee.id,
    },
  });

  const spo2Email = "spo2@gmail.com";
  const spo2User = await prisma.user.upsert({
    where: { email: spo2Email },
    update: {
      password: await hash(spo2Email, 12),
      departmentId: salesDept.id,
      positionId: spoPosition.id,
    },
    create: {
      name: "พนักงานส่งเสริมการขาย (ทีม 2)",
      email: spo2Email,
      password: await hash(spo2Email, 12),
      departmentId: salesDept.id,
      positionId: spoPosition.id,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: spo2User.id, roleId: spoRole.id } },
    update: {},
    create: { userId: spo2User.id, roleId: spoRole.id },
  });
  await prisma.employee.upsert({
    where: { email: spo2Email },
    update: {
      name: "พนักงานส่งเสริมการขาย (ทีม 2)",
      status: "ACTIVE",
      userId: spo2User.id,
      departmentId: salesDept.id,
      positionId: spoPosition.id,
      positionTitle: spoPosition.name,
      departmentName: salesDept.name,
      managerId: sales2Employee.id,
    },
    create: {
      name: "พนักงานส่งเสริมการขาย (ทีม 2)",
      email: spo2Email,
      status: "ACTIVE",
      userId: spo2User.id,
      departmentId: salesDept.id,
      positionId: spoPosition.id,
      positionTitle: spoPosition.name,
      departmentName: salesDept.name,
      managerId: sales2Employee.id,
    },
  });

  console.log("✅ All test users seeded successfully with 2 parallel teams and Manager Chaining.");
}
