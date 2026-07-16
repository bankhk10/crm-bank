import { PrismaClient } from "@prisma/client";

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
}
