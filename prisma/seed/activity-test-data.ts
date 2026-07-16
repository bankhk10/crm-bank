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
  console.log("🏃 Seeding Test Users & Manager Chain...");

  // 2. Fetch Department "SA" (แผนกบริหารงานขาย)
  const salesDept = await prisma.department.findUnique({
    where: { code: "SA" },
  });

  if (!salesDept) {
    throw new Error(
      "Sales Department (SA) not found. Make sure seedMaster has run first.",
    );
  }

  // 3. Fetch Positions
  const spoPosition = await prisma.position.findFirst({
    where: { name: "พนักงานส่งเสริมการขาย" },
  });
  const salesPosition = await prisma.position.findFirst({
    where: { name: "พนักงานขาย" },
  });
  const areaPosition = await prisma.position.findFirst({
    where: { name: "ผู้จัดการภาค" },
  });
  const salesAdminPosition = await prisma.position.findFirst({
    where: { name: "ผู้จัดการแผนกบริหารงานขาย" },
  });

  if (!spoPosition || !salesPosition || !areaPosition || !salesAdminPosition) {
    throw new Error(
      "One or more Positions not found. Please ensure master data exists.",
    );
  }

  // 4. Create Roles & Assign Permissions
  const createRoleWithPermissions = async (
    slug: string,
    name: string,
    permKeys: string[],
  ) => {
    const role = await prisma.role.upsert({
      where: { slug },
      update: { name, description: name },
      create: { name, slug, description: name },
    });

    const permissions = await prisma.permission.findMany({
      where: { key: { in: permKeys } },
    });

    for (const perm of permissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: perm.id },
        },
        update: { allow: true },
        create: { roleId: role.id, permissionId: perm.id, allow: true },
      });
    }
    return role;
  };

  // 4.1 SPO Role (เน้นสร้างและแก้ไข)
  const spoRole = await createRoleWithPermissions(
    "sales_and_promotion",
    "พนักงานส่งเสริมการขาย",
    [
      "menu.activity_plans",
      "activity.create",
      "activity.edit",
      "activity.delete",
      "activity.view",
    ],
  );

  // 4.2 Sales Role (เน้นสร้างแก้ไข เหมือน SPO แต่อาจจะมีสิทธิ์อนุมัติของลูกน้องในอนาคต)
  const salesRole = await createRoleWithPermissions(
    "sales_person",
    "พนักงานขาย",
    [
      "menu.activity_plans",
      "activity.create",
      "activity.edit",
      "activity.delete",
      "activity.view",
      "activity.approve",
    ],
  );

  // 4.3 Area Manager Role (เน้นดูและอนุมัติ)
  const areaRole = await createRoleWithPermissions(
    "area_manager",
    "ผู้จัดการภาค",
    ["menu.activity_plans", "activity.view", "activity.approve"],
  );

  // 4.4 Sales Admin Manager Role (เน้นดู อนุมัติ และจัดการภาพรวม)
  const salesAdminRole = await createRoleWithPermissions(
    "sales_admin_manager",
    "ผู้จัดการแผนกบริหารงานขาย",
    [
      "menu.activity_plans",
      "activity.view",
      "activity.approve",
      "activity.manage",
    ],
  );

  // 5. Create Users & Employees (ทำย้อนกลับเพื่อผูก Manager ID แบบลูกโซ่)

  // 5.1 สร้าง ผู้จัดการแผนกบริหารงานขาย (salesadmin@gmail.com) -> สุดสาย ไม่ต้องผูก Manager
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
    },
  });

  // 5.2 สร้าง ผู้จัดการภาค (area@gmail.com) -> ผูกหัวหน้าไปที่ "ผู้จัดการแผนกบริหารงานขาย"
  const areaEmail = "area@gmail.com";
  const areaUser = await prisma.user.upsert({
    where: { email: areaEmail },
    update: {
      password: await hash(areaEmail, 12),
      departmentId: salesDept.id,
      positionId: areaPosition.id,
    },
    create: {
      name: "ผู้จัดการภาค",
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
      name: "ผู้จัดการภาค",
      status: "ACTIVE",
      userId: areaUser.id,
      departmentId: salesDept.id,
      positionId: areaPosition.id,
      positionTitle: areaPosition.name,
      departmentName: salesDept.name,
      managerId: adminEmployee.id,
    },
    create: {
      name: "ผู้จัดการภาค",
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

  // 5.3 สร้าง พนักงานขาย (sales@gmail.com) -> ผูกหัวหน้าไปที่ "ผู้จัดการภาค"
  const salesEmail = "sales@gmail.com";
  const salesUser = await prisma.user.upsert({
    where: { email: salesEmail },
    update: {
      password: await hash(salesEmail, 12),
      departmentId: salesDept.id,
      positionId: salesPosition.id,
    },
    create: {
      name: "พนักงานขาย",
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
      name: "พนักงานขาย",
      status: "ACTIVE",
      userId: salesUser.id,
      departmentId: salesDept.id,
      positionId: salesPosition.id,
      positionTitle: salesPosition.name,
      departmentName: salesDept.name,
      managerId: areaEmployee.id,
    },
    create: {
      name: "พนักงานขาย",
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

  // 5.4 สร้าง พนักงานส่งเสริมการขาย (spo@gmail.com) -> ผูกหัวหน้าไปที่ "พนักงานขาย"
  const spoEmail = "spo@gmail.com";
  const spoUser = await prisma.user.upsert({
    where: { email: spoEmail },
    update: {
      password: await hash(spoEmail, 12),
      departmentId: salesDept.id,
      positionId: spoPosition.id,
    },
    create: {
      name: "พนักงานส่งเสริมการขาย",
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
      name: "พนักงานส่งเสริมการขาย",
      status: "ACTIVE",
      userId: spoUser.id,
      departmentId: salesDept.id,
      positionId: spoPosition.id,
      positionTitle: spoPosition.name,
      departmentName: salesDept.name,
      managerId: salesEmployee.id,
    },
    create: {
      name: "พนักงานส่งเสริมการขาย",
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

  console.log(
    "✅ All test users seeded successfully with the correct Manager Chaining (SPO -> Sales -> Area -> Admin).",
  );
}
