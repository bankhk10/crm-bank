import {
  PrismaClient,
  DataAccessLevel,
  EditAccessLevel,
  DeleteAccessLevel,
  PermissionType,
} from "@prisma/client";

export async function seedActivityPermissions(prisma: PrismaClient) {
  console.log("🏃 Seeding Activity Permissions & Role Permissions...");

  const permissionsToSeed = [
    {
      key: "menu.activity_plans",
      name: "เมนูการวางแผนกิจกรรม",
      action: "menu",
      category: PermissionType.MENU,
      resource: "activity_plan",
      menuPath: "/activity-plans",
    },
    {
      key: "menu.test_activity",
      name: "เมนูทดสอบกิจกรรม",
      action: "menu",
      category: PermissionType.MENU,
      resource: "test_activity",
      menuPath: "/test-activity",
    },
    {
      key: "activity.create",
      name: "สร้างแผนกิจกรรม",
      action: "create",
      category: PermissionType.ACTION,
      resource: "activity_plan",
    },
    {
      key: "activity.edit",
      name: "แก้ไขแผนกิจกรรม",
      action: "edit",
      category: PermissionType.ACTION,
      resource: "activity_plan",
    },
    {
      key: "activity.delete",
      name: "ลบแผนกิจกรรม",
      action: "delete",
      category: PermissionType.ACTION,
      resource: "activity_plan",
    },
    {
      key: "activity.view",
      name: "ดูแผนกิจกรรม",
      action: "view",
      category: PermissionType.ACTION,
      resource: "activity_plan",
    },
    {
      key: "activity.approve",
      name: "อนุมัติแผนกิจกรรม",
      action: "approve",
      category: PermissionType.ACTION,
      resource: "activity_plan",
    },
    {
      key: "activity.manage",
      name: "จัดการแผนกิจกรรมทั้งหมด",
      action: "manage",
      category: PermissionType.ACTION,
      resource: "activity_plan",
    },
    {
      key: "data.activity_plans",
      name: "ขอบเขตข้อมูลแผนกิจกรรม",
      category: PermissionType.DATA,
      resource: "activity_plan",
      defaultDataAccess: DataAccessLevel.VIEW_OWN,
      defaultEditAccess: EditAccessLevel.EDIT_OWN,
      defaultDeleteAccess: DeleteAccessLevel.DELETE_OWN,
    },
  ];

  for (const perm of permissionsToSeed) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: {
        name: perm.name,
        action: perm.action,
        category: perm.category,
        resource: perm.resource,
        menuPath: perm.menuPath,
      },
      create: perm,
    });
  }

  // Assign menu & action permissions to all existing roles so users can see and interact with activity-plans
  const roles = await prisma.role.findMany();
  const permissions = await prisma.permission.findMany({
    where: {
      key: {
        in: permissionsToSeed.map((p) => p.key),
      },
    },
  });

  const permMap = new Map(permissions.map((p) => [p.key, p]));

  for (const role of roles) {
    // Menu permissions: grant to all roles
    const menuKeys = ["menu.activity_plans", "menu.test_activity"];
    for (const key of menuKeys) {
      const perm = permMap.get(key);
      if (perm) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: perm.id,
            },
          },
          update: { allow: true },
          create: {
            roleId: role.id,
            permissionId: perm.id,
            allow: true,
          },
        });
      }
    }

    // Action permissions per role category
    const isManager =
      role.slug.includes("manager") ||
      role.slug === "admin" ||
      role.slug === "administrator";
    const isAdmin = role.slug === "admin" || role.slug === "administrator";
    const isCeo = role.slug === "ceo";

    const actionsToAssign = [
      { key: "activity.view", allow: true },
      { key: "activity.create", allow: !isCeo },
      { key: "activity.edit", allow: !isCeo },
      { key: "activity.delete", allow: !isCeo },
      { key: "activity.approve", allow: isManager },
      { key: "activity.manage", allow: isAdmin },
    ];

    for (const { key, allow } of actionsToAssign) {
      const perm = permMap.get(key);
      if (perm) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: perm.id,
            },
          },
          update: { allow },
          create: {
            roleId: role.id,
            permissionId: perm.id,
            allow,
          },
        });
      }
    }

    // Data permission
    const dataPerm = permMap.get("data.activity_plans");
    if (dataPerm) {
      let dataAccess: DataAccessLevel = DataAccessLevel.VIEW_OWN;
      let editAccess: EditAccessLevel = EditAccessLevel.EDIT_OWN;
      let deleteAccess: DeleteAccessLevel = DeleteAccessLevel.DELETE_OWN;

      if (isAdmin || isCeo) {
        dataAccess = DataAccessLevel.VIEW_ALL;
        editAccess = isAdmin
          ? EditAccessLevel.EDIT_ALL
          : EditAccessLevel.EDIT_NONE;
        deleteAccess = isAdmin
          ? DeleteAccessLevel.DELETE_ALL
          : DeleteAccessLevel.DELETE_NONE;
      } else if (isManager) {
        dataAccess = DataAccessLevel.VIEW_DEPARTMENT;
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: dataPerm.id,
          },
        },
        update: { allow: true, dataAccess, editAccess, deleteAccess },
        create: {
          roleId: role.id,
          permissionId: dataPerm.id,
          allow: true,
          dataAccess,
          editAccess,
          deleteAccess,
        },
      });
    }
  }

  console.log("✅ Activity Permissions seeded & assigned successfully.");
}
