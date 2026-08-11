import {
  PrismaClient,
  DataAccessLevel,
  EditAccessLevel,
  DeleteAccessLevel,
} from "@prisma/client";

export async function seedActivityRoles(prisma: PrismaClient) {
  console.log("🔐 Seeding Activity Roles & Data Permissions...");

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

  console.log("✅ Activity Roles & Data Permissions seeded successfully.");

  return {
    spoRole,
    salesRole,
    areaRole,
    salesAdminRole,
    mktRole,
    mktManagerRole,
    salesDirectorRole,
  };
}
