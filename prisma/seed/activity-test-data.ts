import {
  PrismaClient,
  DataAccessLevel,
  EditAccessLevel,
  DeleteAccessLevel,
} from "@prisma/client";
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
    {
      key: "data.activity_plans",
      name: "ขอบเขตข้อมูลแผนกิจกรรม",
      category: "DATA" as const,
      resource: "activity_plan",
      defaultDataAccess: DataAccessLevel.VIEW_OWN,
      defaultEditAccess: EditAccessLevel.EDIT_OWN,
      defaultDeleteAccess: DeleteAccessLevel.DELETE_OWN,
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

  // 2. Fetch Department "SA"
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

  const spoRole = await createRoleWithPermissions(
    "sales_and_promotion",
    "พนักงานส่งเสริมการขาย",
    [
      "menu.activity_plans",
      "activity.create",
      "activity.edit",
      "activity.delete",
      "activity.view",
      "data.activity_plans",
    ],
  );
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
      "data.activity_plans",
    ],
  );
  const areaRole = await createRoleWithPermissions(
    "area_manager",
    "ผู้จัดการภาค",
    [
      "menu.activity_plans",
      "activity.view",
      "activity.approve",
      "data.activity_plans",
    ],
  );
  const salesAdminRole = await createRoleWithPermissions(
    "sales_admin_manager",
    "ผู้จัดการแผนกบริหารงานขาย",
    [
      "menu.activity_plans",
      "activity.view",
      "activity.approve",
      "activity.manage",
      "data.activity_plans",
    ],
  );

  // Configure Data Permissions
  const configureDataPermission = async (
    roleId: string,
    permissionKey: string,
    config: {
      dataAccess?: DataAccessLevel;
      editAccess?: EditAccessLevel;
      deleteAccess?: DeleteAccessLevel;
    },
  ) => {
    const perm = await prisma.permission.findUnique({
      where: { key: permissionKey },
    });
    if (!perm) return;
    await prisma.rolePermission.update({
      where: { roleId_permissionId: { roleId, permissionId: perm.id } },
      data: {
        dataAccess: config.dataAccess ?? null,
        editAccess: config.editAccess ?? null,
        deleteAccess: config.deleteAccess ?? null,
      },
    });
  };

  await configureDataPermission(spoRole.id, "data.activity_plans", {
    dataAccess: DataAccessLevel.VIEW_OWN,
    editAccess: EditAccessLevel.EDIT_OWN,
    deleteAccess: DeleteAccessLevel.DELETE_OWN,
  });
  await configureDataPermission(salesRole.id, "data.activity_plans", {
    dataAccess: DataAccessLevel.VIEW_TEAM,
    editAccess: EditAccessLevel.EDIT_OWN,
    deleteAccess: DeleteAccessLevel.DELETE_OWN,
  });
  await configureDataPermission(areaRole.id, "data.activity_plans", {
    dataAccess: DataAccessLevel.VIEW_TEAM,
    editAccess: EditAccessLevel.EDIT_NONE,
    deleteAccess: DeleteAccessLevel.DELETE_NONE,
  });
  await configureDataPermission(salesAdminRole.id, "data.activity_plans", {
    dataAccess: DataAccessLevel.VIEW_DEPARTMENT,
    editAccess: EditAccessLevel.EDIT_NONE,
    deleteAccess: DeleteAccessLevel.DELETE_NONE,
  });

  // 5. Create Users & Employees

  // 5.1 Admin (หัวหน้าใหญ่สุดของทั้ง 2 ทีม)
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

  console.log(
    "✅ All test users seeded successfully with 2 parallel teams and proper Manager Chaining.",
  );
}
