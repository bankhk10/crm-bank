import "dotenv/config";
import { PermissionType } from "@prisma/client";
import { db } from "../lib/db";

const prisma = db;

const newPermissions = [
  {
    key: "activity.approve.sp_budget",
    name: "อนุมัติงบส่งเสริมการขาย",
    category: PermissionType.ACTION,
    resource: "activity_plan",
    action: "approve_sp_budget",
  },
  {
    key: "activity.approve.mkt_budget",
    name: "อนุมัติงบการตลาด",
    category: PermissionType.ACTION,
    resource: "activity_plan",
    action: "approve_mkt_budget",
  },
  {
    key: "activity.approve.total_budget",
    name: "อนุมัติงบประมาณภาพรวม (ผู้จัดการฝ่าย)",
    category: PermissionType.ACTION,
    resource: "activity_plan",
    action: "approve_total_budget",
  },
  {
    key: "activity.approve.product_withdrawal",
    name: "อนุมัติการเบิกสินค้าในแปลงสาธิต",
    category: PermissionType.ACTION,
    resource: "activity_plan",
    action: "approve_product_withdrawal",
  },
  {
    key: "activity.approve.sales_helper",
    name: "อนุมัติพนักงานช่วยงานฝ่ายขาย",
    category: PermissionType.ACTION,
    resource: "activity_plan",
    action: "approve_sales_helper",
  },
  {
    key: "activity.approve.mkt_helper",
    name: "อนุมัติพนักงานช่วยงานฝ่ายการตลาด",
    category: PermissionType.ACTION,
    resource: "activity_plan",
    action: "approve_mkt_helper",
  },
];

async function main() {
  console.log("Upserting new activity approval permissions...");
  for (const perm of newPermissions) {
    const p = await prisma.permission.upsert({
      where: { key: perm.key },
      update: {
        name: perm.name,
        category: perm.category,
        resource: perm.resource,
        action: perm.action,
        deletedAt: null,
      },
      create: {
        key: perm.key,
        name: perm.name,
        category: perm.category,
        resource: perm.resource,
        action: perm.action,
      },
    });
    console.log(`- Upserted permission: ${p.key}`);
  }

  // Also grant them to roles:
  const approverRoles = ["administrator", "admin", "activity_plan_admin", "activity_plan_approver"];
  for (const slug of approverRoles) {
    const role = await prisma.role.findUnique({ where: { slug } });
    if (!role) continue;
    for (const perm of newPermissions) {
      const p = await prisma.permission.findUnique({ where: { key: perm.key } });
      if (!p) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: p.id } },
        update: { allow: true, deletedAt: null },
        create: { roleId: role.id, permissionId: p.id, allow: true },
      });
    }
    console.log(`- Granted all new permissions to role: ${slug}`);
  }

  // Sales Manager role -> sp_budget, sales_helper
  const salesMgrRole = await prisma.role.findUnique({ where: { slug: "sales_manager" } });
  if (salesMgrRole) {
    for (const key of ["activity.approve.sp_budget", "activity.approve.sales_helper"]) {
      const p = await prisma.permission.findUnique({ where: { key } });
      if (!p) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: salesMgrRole.id, permissionId: p.id } },
        update: { allow: true, deletedAt: null },
        create: { roleId: salesMgrRole.id, permissionId: p.id, allow: true },
      });
    }
    console.log(`- Granted sp_budget & sales_helper to role: sales_manager`);
  }

  // Marketing Manager role -> mkt_budget, product_withdrawal, mkt_helper
  const mktMgrRole = await prisma.role.findUnique({ where: { slug: "marketing_manager" } });
  if (mktMgrRole) {
    for (const key of ["activity.approve.mkt_budget", "activity.approve.product_withdrawal", "activity.approve.mkt_helper"]) {
      const p = await prisma.permission.findUnique({ where: { key } });
      if (!p) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: mktMgrRole.id, permissionId: p.id } },
        update: { allow: true, deletedAt: null },
        create: { roleId: mktMgrRole.id, permissionId: p.id, allow: true },
      });
    }
    console.log(`- Granted mkt_budget, product_withdrawal & mkt_helper to role: marketing_manager`);
  }

  // Grant overrides to test users if they exist
  const setTestOverride = async (email: string, keys: string[]) => {
    const user = await prisma.user.findFirst({ where: { email, deletedAt: null } });
    if (!user) return;
    for (const key of keys) {
      const p = await prisma.permission.findUnique({ where: { key } });
      if (!p) continue;
      await prisma.userPermissionOverride.upsert({
        where: { userId_permissionId: { userId: user.id, permissionId: p.id } },
        update: { allow: true, deletedAt: null },
        create: { userId: user.id, permissionId: p.id, allow: true, reason: "Activity Approval Testing" },
      });
    }
    console.log(`- Set overrides for test user: ${email} -> ${keys.join(", ")}`);
  };

  await setTestOverride("test.salesadmin@crm.local", ["activity.approve.sp_budget", "activity.approve.sales_helper"]);
  await setTestOverride("test.mktmgr@crm.local", ["activity.approve.mkt_budget", "activity.approve.product_withdrawal", "activity.approve.mkt_helper"]);
  await setTestOverride("test.salesdir@crm.local", ["activity.approve.total_budget"]);

  console.log("Sync complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
