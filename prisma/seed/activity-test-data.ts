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

  // 2. Fetch/Ensure Departments
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

  // 3. Fetch or Create Positions
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
  const mktRole = await createRoleWithPermissions(
    "marketing_officer",
    "พนักงานการตลาด",
    [
      "menu.activity_plans",
      "activity.create",
      "activity.edit",
      "activity.delete",
      "activity.view",
      "data.activity_plans",
    ],
  );
  const mktManagerRole = await createRoleWithPermissions(
    "marketing_manager",
    "ผู้จัดการแผนกการตลาด",
    [
      "menu.activity_plans",
      "activity.view",
      "activity.approve",
      "activity.manage",
      "data.activity_plans",
    ],
  );
  const salesDirectorRole = await createRoleWithPermissions(
    "sales_director",
    "ผู้จัดการฝ่ายขาย",
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
  await configureDataPermission(mktRole.id, "data.activity_plans", {
    dataAccess: DataAccessLevel.VIEW_DEPARTMENT,
    editAccess: EditAccessLevel.EDIT_OWN,
    deleteAccess: DeleteAccessLevel.DELETE_OWN,
  });
  await configureDataPermission(mktManagerRole.id, "data.activity_plans", {
    dataAccess: DataAccessLevel.VIEW_DEPARTMENT,
    editAccess: EditAccessLevel.EDIT_NONE,
    deleteAccess: DeleteAccessLevel.DELETE_NONE,
  });
  await configureDataPermission(salesDirectorRole.id, "data.activity_plans", {
    dataAccess: DataAccessLevel.VIEW_ALL,
    editAccess: EditAccessLevel.EDIT_NONE,
    deleteAccess: DeleteAccessLevel.DELETE_NONE,
  });

  // 5. Create Users & Employees

  // 5.0 ผู้จัดการฝ่ายขาย (Top Level Executive)
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

  // 5.1 Admin (ผู้จัดการแผนกบริหารงานขาย)
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

  // 5.2 ผู้จัดการแผนกการตลาด
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

  // 5.3 พนักงานการตลาด
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

  console.log(
    "✅ All test users seeded successfully with 2 parallel teams and proper Manager Chaining.",
  );
}
