import "dotenv/config";
import {
  PrismaClient,
  DataAccessLevel,
  EditAccessLevel,
  DeleteAccessLevel,
  PermissionType,
} from "@prisma/client";

// ============================================================================
// Activity RBAC Master Data Seed
// Single Source of Truth: Uses standard activity.* permissions from core RBAC
// ============================================================================

export interface ActivityPermissionDef {
  key: string;
  name: string;
  description: string;
  category: PermissionType;
  resource: string;
  menuPath?: string | null;
  defaultDataAccess?: DataAccessLevel | null;
}

// All activity permissions are maintained in prisma/seed/core/rbac.ts
// Kept for backward-compatibility if any external module imports this array
export const activityPermissions: ActivityPermissionDef[] = [];

// ────────────────────────────────────────────────────────────────────────────
// Common Permission Bundles for Matrix Configuration
// ────────────────────────────────────────────────────────────────────────────

// 1. Creator Base: ทุกบทบาทที่สร้างแผนงานได้
const creatorPermissions = [
  "menu.activity_plans",
  "activity.view",
  "activity.create",
  "activity.edit",
  "activity.delete",
];

// 2. Line Approver Base: สำหรับ Approver ตามสายงานจริง
const lineApproverPermissions = [
  "activity.approve",
];

export interface RoleMatrixItem {
  key: string;
  dataAccess?: DataAccessLevel;
  editAccess?: EditAccessLevel;
  deleteAccess?: DeleteAccessLevel;
}

export interface ActivityRoleDefinition {
  name: string;
  slug: string;
  description: string;
  isSystem: boolean;
  isActive: boolean;
  permissions: RoleMatrixItem[];
}

export const activityRoles: ActivityRoleDefinition[] = [
  // 1. พนักงานส่งเสริมการขาย-กิจกรรม
  {
    name: "พนักงานส่งเสริมการขาย-กิจกรรม",
    slug: "activity_promoter",
    description: "พนักงานส่งเสริมการขาย - สร้าง/ส่งแผนงานกิจกรรมภาคสนาม และบันทึกผลงานจริง",
    isSystem: false,
    isActive: true,
    permissions: [
      ...creatorPermissions.map((key) => ({ key })),
      { key: "promotional_material.view" },
      { key: "product.view" },
      { key: "product.stock.view" },
      { key: "customer.view.dealer" },
      { key: "customer.view.subdealer" },
      { key: "customer.view.farmer" },
      { key: "customer.view.broker" },
      { key: "customer.create.farmer" },
      { key: "customer.create.subdealer" },
      { key: "customer.create.broker" },
      { key: "customer.edit.farmer" },
      { key: "customer.edit.subdealer" },
      { key: "customer.edit.broker" },
      { key: "employee.view" },
      {
        key: "data.activity_plans",
        dataAccess: DataAccessLevel.VIEW_OWN,
        editAccess: EditAccessLevel.EDIT_OWN,
        deleteAccess: DeleteAccessLevel.DELETE_OWN,
      },
      {
        key: "data.promotional_materials",
        dataAccess: DataAccessLevel.VIEW_ALL,
      },
      {
        key: "data.customers",
        dataAccess: DataAccessLevel.VIEW_ALL,
        editAccess: EditAccessLevel.EDIT_OWN,
      },
    ],
  },

  // 2. พนักงานขาย-กิจกรรม
  {
    name: "พนักงานขาย-กิจกรรม",
    slug: "activity_sales_employee",
    description: "พนักงานขาย - สร้าง/ส่งแผนงานตนเอง และอนุมัติตามสายงานให้ผู้ใต้บังคับบัญชา",
    isSystem: false,
    isActive: true,
    permissions: [
      ...creatorPermissions.map((key) => ({ key })),
      ...lineApproverPermissions.map((key) => ({ key })),
      {
        key: "data.activity_plans",
        dataAccess: DataAccessLevel.VIEW_TEAM,
        editAccess: EditAccessLevel.EDIT_OWN,
        deleteAccess: DeleteAccessLevel.DELETE_OWN,
      },
    ],
  },

  // 3. ผู้จัดการภาค-กิจกรรม
  {
    name: "ผู้จัดการภาค-กิจกรรม",
    slug: "activity_area_manager",
    description: "ผู้จัดการภาค - สร้างแผนงานระดับภาค และอนุมัติตามสายงานให้ผู้ใต้บังคับบัญชา",
    isSystem: false,
    isActive: true,
    permissions: [
      ...creatorPermissions.map((key) => ({ key })),
      ...lineApproverPermissions.map((key) => ({ key })),
      {
        key: "data.activity_plans",
        dataAccess: DataAccessLevel.VIEW_TEAM,
        editAccess: EditAccessLevel.EDIT_OWN,
        deleteAccess: DeleteAccessLevel.DELETE_OWN,
      },
    ],
  },

  // 4. ผู้จัดการเขต-กิจกรรม
  {
    name: "ผู้จัดการเขต-กิจกรรม",
    slug: "activity_district_manager",
    description: "ผู้จัดการเขต - สร้างแผนงานระดับเขต และอนุมัติตามสายงานให้ผู้ใต้บังคับบัญชา",
    isSystem: false,
    isActive: true,
    permissions: [
      ...creatorPermissions.map((key) => ({ key })),
      ...lineApproverPermissions.map((key) => ({ key })),
      {
        key: "data.activity_plans",
        dataAccess: DataAccessLevel.VIEW_TEAM,
        editAccess: EditAccessLevel.EDIT_OWN,
        deleteAccess: DeleteAccessLevel.DELETE_OWN,
      },
    ],
  },

  // 5. ผู้จัดการแผนกบริหารงานขาย-กิจกรรม
  {
    name: "ผู้จัดการแผนกบริหารงานขาย-กิจกรรม",
    slug: "activity_sales_admin_manager",
    description: "ผู้จัดการแผนกบริหารงานขาย - สร้างแผนงานตนเอง, อนุมัติงบ SP, ตรวจผู้ช่วยงานขาย",
    isSystem: false,
    isActive: true,
    permissions: [
      ...creatorPermissions.map((key) => ({ key })),
      ...lineApproverPermissions.map((key) => ({ key })),
      { key: "activity.approve.sp_budget" },
      { key: "activity.approve.sales_helper" },
      {
        key: "data.activity_plans",
        dataAccess: DataAccessLevel.VIEW_ALL,
        editAccess: EditAccessLevel.EDIT_OWN,
        deleteAccess: DeleteAccessLevel.DELETE_OWN,
      },
    ],
  },

  // 6. ผู้จัดการแผนกการตลาด-กิจกรรม
  {
    name: "ผู้จัดการแผนกการตลาด-กิจกรรม",
    slug: "activity_marketing_manager",
    description: "ผู้จัดการแผนกการตลาด - สร้างแผนงานตนเอง, อนุมัติงบ MKT, ตรวจผู้ช่วยงานตลาด",
    isSystem: false,
    isActive: true,
    permissions: [
      ...creatorPermissions.map((key) => ({ key })),
      ...lineApproverPermissions.map((key) => ({ key })),
      { key: "activity.approve.mkt_budget" },
      { key: "activity.approve.product_withdrawal" },
      { key: "activity.approve.mkt_helper" },
      {
        key: "data.activity_plans",
        dataAccess: DataAccessLevel.VIEW_ALL,
        editAccess: EditAccessLevel.EDIT_OWN,
        deleteAccess: DeleteAccessLevel.DELETE_OWN,
      },
    ],
  },

  // 7. ผู้จัดการฝ่ายขาย-กิจกรรม
  {
    name: "ผู้จัดการฝ่ายขาย-กิจกรรม",
    slug: "activity_sales_director",
    description: "ผู้จัดการฝ่ายขาย - สร้างแผนงานระดับฝ่าย, อนุมัติงบรวมขั้นสุดท้าย (Final Approval)",
    isSystem: false,
    isActive: true,
    permissions: [
      ...creatorPermissions.map((key) => ({ key })),
      ...lineApproverPermissions.map((key) => ({ key })),
      { key: "activity.approve.total_budget" },
      {
        key: "data.activity_plans",
        dataAccess: DataAccessLevel.VIEW_ALL,
        editAccess: EditAccessLevel.EDIT_OWN,
        deleteAccess: DeleteAccessLevel.DELETE_OWN,
      },
    ],
  },

  // 8. พนักงานการตลาด-กิจกรรม
  {
    name: "พนักงานการตลาด-กิจกรรม",
    slug: "activity_marketing_employee",
    description: "พนักงานการตลาด - สร้าง/ส่งแผนงานกิจกรรมการตลาดของตนเอง และบันทึกผลงานจริง",
    isSystem: false,
    isActive: true,
    permissions: [
      ...creatorPermissions.map((key) => ({ key })),
      {
        key: "data.activity_plans",
        dataAccess: DataAccessLevel.VIEW_OWN,
        editAccess: EditAccessLevel.EDIT_OWN,
        deleteAccess: DeleteAccessLevel.DELETE_OWN,
      },
    ],
  },

  // 9. แอดมินการตลาด-กิจกรรม
  {
    name: "แอดมินการตลาด-กิจกรรม",
    slug: "activity_marketing_admin",
    description: "แอดมินการตลาด - ดูแลและจัดการข้อมูลสื่อส่งเสริมการขาย (Promotional Materials)",
    isSystem: false,
    isActive: true,
    permissions: [
      { key: "menu.promotional_materials" },
      { key: "promotional_material.view" },
      { key: "promotional_material.create" },
      { key: "promotional_material.edit" },
      { key: "promotional_material.delete" },
      {
        key: "data.promotional_materials",
        dataAccess: DataAccessLevel.VIEW_ALL,
        editAccess: EditAccessLevel.EDIT_ALL,
        deleteAccess: DeleteAccessLevel.DELETE_ALL,
      },
    ],
  },
];

// ============================================================================
// Seed Execution Function (Idempotent & Safe)
// ============================================================================

export async function seedActivityRBAC(prisma: PrismaClient) {
  console.log("🛡️ Seeding Activity RBAC Master Data (Roles & Mapping)...");

  // 1. Fetch all permission map
  const allPerms = await prisma.permission.findMany({
    where: { deletedAt: null },
    select: { id: true, key: true },
  });
  const permMap = new Map(allPerms.map((p) => [p.key, p.id]));

  // 2. Seed / Upsert 9 Activity Roles & RolePermissions
  let createdRoles = 0;
  let updatedRoles = 0;
  let mappedPermissionsCount = 0;

  for (const roleDef of activityRoles) {
    let role = await prisma.role.findUnique({
      where: { slug: roleDef.slug },
    });

    if (!role) {
      role = await prisma.role.create({
        data: {
          name: roleDef.name,
          slug: roleDef.slug,
          description: roleDef.description,
          isSystem: roleDef.isSystem,
          isActive: roleDef.isActive,
        },
      });
      createdRoles++;
    } else {
      if (
        role.name !== roleDef.name ||
        role.description !== roleDef.description ||
        role.isActive !== roleDef.isActive
      ) {
        role = await prisma.role.update({
          where: { id: role.id },
          data: {
            name: roleDef.name,
            description: roleDef.description,
            isActive: roleDef.isActive,
          },
        });
        updatedRoles++;
      }
    }

    // Map permissions
    for (const item of roleDef.permissions) {
      const permissionId = permMap.get(item.key);
      if (!permissionId) {
        console.warn(`⚠️ Warning: Permission ${item.key} not found for role ${roleDef.slug}`);
        continue;
      }

      const existingRolePerm = await prisma.rolePermission.findUnique({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId,
          },
        },
      });

      if (!existingRolePerm) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId,
            allow: true,
            dataAccess: item.dataAccess ?? null,
            editAccess: item.editAccess ?? null,
            deleteAccess: item.deleteAccess ?? null,
          },
        });
        mappedPermissionsCount++;
      } else {
        // Update if accesses differ
        if (
          existingRolePerm.dataAccess !== (item.dataAccess ?? null) ||
          existingRolePerm.editAccess !== (item.editAccess ?? null) ||
          existingRolePerm.deleteAccess !== (item.deleteAccess ?? null) ||
          !existingRolePerm.allow
        ) {
          await prisma.rolePermission.update({
            where: { id: existingRolePerm.id },
            data: {
              allow: true,
              dataAccess: item.dataAccess ?? null,
              editAccess: item.editAccess ?? null,
              deleteAccess: item.deleteAccess ?? null,
            },
          });
          mappedPermissionsCount++;
        }
      }
    }
  }

  console.log(`   - Activity Roles: ${createdRoles} created, ${updatedRoles} updated.`);
  console.log(`   - RolePermissions: processed ${mappedPermissionsCount} permission mappings.`);
  console.log("✅ Activity RBAC Master Data seeded successfully.\n");
}

// Standalone execution entrypoint
if (process.argv[1]?.includes("activity-rbac")) {
  const { db } = require("../../../lib/db");
  seedActivityRBAC(db)
    .then(async () => {
      await db.$disconnect();
    })
    .catch(async (error) => {
      console.error("❌ Activity RBAC Seed failed:", error);
      await db.$disconnect();
      process.exit(1);
    });
}
