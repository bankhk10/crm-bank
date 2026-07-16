import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

export async function seedActivityTestData(prisma: PrismaClient) {
  console.log("🏃 Seeding Activity Permissions...");

  // 1. Ensure required Permissions exist
  const permissionsToSeed = [
    {
      key: "menu.activity_plans",
      name: "เมนูการวางแผนกิจกรรม",
      action: "menu",
      category: "MENU" as const,
      resource: "activity_plan",
    },
    {
      key: "activity.create",
      name: "สร้างแผนกิจกรรม",
      action: "create",
      category: "ACTION" as const,
      resource: "activity_plan",
    },
    {
      key: "activity.edit",
      name: "แก้ไขแผนกิจกรรม",
      action: "edit",
      category: "ACTION" as const,
      resource: "activity_plan",
    },
    {
      key: "activity.delete",
      name: "ลบแผนกิจกรรม",
      action: "delete",
      category: "ACTION" as const,
      resource: "activity_plan",
    },
    {
      key: "activity.view",
      name: "ดูแผนกิจกรรม",
      action: "view",
      category: "ACTION" as const,
      resource: "activity_plan",
    },
    {
      key: "activity.approve",
      name: "อนุมัติแผนกิจกรรม",
      action: "approve",
      category: "ACTION" as const,
      resource: "activity_plan",
    },
    {
      key: "activity.manage",
      name: "จัดการแผนกิจกรรมทั้งหมด",
      action: "manage",
      category: "ACTION" as const,
      resource: "activity_plan",
    },
  ];

  for (const perm of permissionsToSeed) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: {},
      create: perm,
    });
  }

  console.log("✅ Seeding of Activity Permissions completed.");

  console.log(
    "🏃 Seeding Sales & Promotion Officer (spo@gmail.com) test user...",
  );

  // 2. Fetch Department "SA" (แผนกบริหารงานขาย)
  const salesDept = await prisma.department.findUnique({
    where: { code: "SA" },
  });

  if (!salesDept) {
    throw new Error(
      "Sales Department (SA) not found. Make sure seedMaster has run first.",
    );
  }

  // 3. Fetch Position "พนักงานฝ่ายขาย"
  const salesPosition = await prisma.position.findFirst({
    where: { name: "เจ้าหน้าที่ขายและส่งเสริมการขาย" },
  });

  if (!salesPosition) {
    throw new Error(
      "Sales Position (เจ้าหน้าที่ขายและส่งเสริมการขาย) not found. Make sure seedUsers has run first.",
    );
  }

  // 4. Create Role "เจ้าหน้าที่ขายและส่งเสริม"
  const roleSlug = "sales_and_promotion";
  const roleName = "เจ้าหน้าที่ขายและส่งเสริมการขาย";
  const spoRole = await prisma.role.upsert({
    where: { slug: roleSlug },
    update: {
      name: roleName,
      description: "เจ้าหน้าที่ขายและส่งเสริมการขาย",
    },
    create: {
      name: roleName,
      slug: roleSlug,
      description: "เจ้าหน้าที่ขายและส่งเสริมการขาย",
    },
  });

  // 5. Link Permissions to the Role
  const keysToAssign = [
    "menu.activity_plans",
    "activity.create",
    "activity.edit",
    "activity.delete",
    "activity.view",
  ];

  const permissions = await prisma.permission.findMany({
    where: { key: { in: keysToAssign } },
  });

  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: spoRole.id,
          permissionId: perm.id,
        },
      },
      update: {
        allow: true,
      },
      create: {
        roleId: spoRole.id,
        permissionId: perm.id,
        allow: true,
      },
    });
  }

  // 6. Create User "spo@gmail.com"
  const email = "spo@gmail.com";
  const hashedPassword = await hash(email, 12);
  const userName = "เจ้าหน้าที่ขายและส่งเสริมการขาย";

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      departmentId: salesDept.id,
      positionId: salesPosition.id,
    },
    create: {
      name: userName,
      email,
      password: hashedPassword,
      departmentId: salesDept.id,
      positionId: salesPosition.id,
    },
  });

  // Ensure user is mapped to the Role
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: spoRole.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      roleId: spoRole.id,
    },
  });

  // 7. Create/Update Employee Profile for the User
  await prisma.employee.upsert({
    where: { email },
    update: {
      name: userName,
      status: "ACTIVE",
      userId: user.id,
      departmentId: salesDept.id,
      positionId: salesPosition.id,
      positionTitle: salesPosition.name,
      departmentName: salesDept.name,
    },
    create: {
      name: userName,
      email,
      status: "ACTIVE",
      userId: user.id,
      departmentId: salesDept.id,
      positionId: salesPosition.id,
      positionTitle: salesPosition.name,
      departmentName: salesDept.name,
    },
  });

  console.log("✅ Sales & Promotion Officer test user seeded successfully.");
}
