import {
  PrismaClient,
  DataAccessLevel,
  EditAccessLevel,
  DeleteAccessLevel,
  PermissionType,
} from "@prisma/client";

// ============================================================================
// Activity RBAC Master Data Seed
// Reference: docs/activity/ACTIVITY-RBAC-PERMISSIONS.md
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

export const activityPermissions: ActivityPermissionDef[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // 3.1 กลุ่มการจัดการแผนงาน (Activity Plan Operations)
  // ──────────────────────────────────────────────────────────────────────────
  {
    key: "activity_plan.view",
    name: "ดูรายการและรายละเอียดแผนงาน",
    description: "สิทธิ์เข้าดูข้อมูล Trip Plan ในหน้ารายการ ปฏิทิน และหน้ารายละเอียด",
    category: "ACTION",
    resource: "activity_plan",
  },
  {
    key: "activity_plan.create",
    name: "สร้างแผนงานใหม่",
    description: "สิทธิ์เปิดฟอร์มและบันทึกสร้าง Trip Plan ในสถานะ Draft",
    category: "ACTION",
    resource: "activity_plan",
  },
  {
    key: "activity_plan.edit",
    name: "แก้ไขแผนงาน",
    description: "สิทธิ์แก้ไขรายละเอียดแผนงานในสถานะ Draft หรือ รอแก้ไข",
    category: "ACTION",
    resource: "activity_plan",
  },
  {
    key: "activity_plan.submit",
    name: "ส่งแผนงานเพื่อขออนุมัติ",
    description: "สิทธิ์กดส่งแผนงานเข้าสู่กระบวนการอนุมัติ (Trigger Line Approval)",
    category: "ACTION",
    resource: "activity_plan",
  },
  {
    key: "activity_plan.view_own",
    name: "ดูแผนงานของตนเอง",
    description: "สิทธิ์การเข้าถึงและมองเห็นรายการแผนงานที่ตนเองเป็นผู้สร้าง หรือเป็นผู้ช่วยงาน",
    category: "ACTION",
    resource: "activity_plan",
  },
  {
    key: "activity_plan.view_pending",
    name: "ดูรายการรออนุมัติ",
    description: "สิทธิ์เข้าถึงหน้าและแท็บ \"คิวรออนุมัติ\" (Approval Queue)",
    category: "ACTION",
    resource: "activity_plan",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 3.2 กลุ่มการอนุมัติตามสายงาน (Approval Actions)
  // ──────────────────────────────────────────────────────────────────────────
  {
    key: "activity_plan.approve",
    name: "อนุมัติแผนงาน",
    description: "สิทธิ์กดปุ่มอนุมัติแผนงานตามสายงานที่ได้รับมอบหมาย",
    category: "ACTION",
    resource: "activity_plan",
  },
  {
    key: "activity_plan.reject",
    name: "ปฏิเสธแผนงาน",
    description: "สิทธิ์ปฏิเสธแผนงานและยุติ Workflow (สถานะ Rejected)",
    category: "ACTION",
    resource: "activity_plan",
  },
  {
    key: "activity_plan.request_correction",
    name: "ส่งแผนงานกลับไปแก้ไข (ตีกลับ)",
    description: "สิทธิ์ส่งแผนงานกลับไปให้ผู้สร้างแก้ไขข้อมูลเพิ่มเติม",
    category: "ACTION",
    resource: "activity_plan",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 3.3 กลุ่มการอนุมัติงบประมาณ (Budget Approvals)
  // ──────────────────────────────────────────────────────────────────────────
  {
    key: "activity_plan.approve_sales_promotion_budget",
    name: "อนุมัติงบส่งเสริมการขาย",
    description: "ตรวจสอบและอนุมัติงบส่งเสริมการขาย (SP Budget)",
    category: "ACTION",
    resource: "activity_plan",
  },
  {
    key: "activity_plan.approve_marketing_budget",
    name: "อนุมัติงบการตลาด",
    description: "ตรวจสอบและอนุมัติงบการตลาด (Marketing Budget)",
    category: "ACTION",
    resource: "activity_plan",
  },
  {
    key: "activity_plan.approve_total_budget",
    name: "อนุมัติงบประมาณรวมทั้งหมด",
    description: "อนุมัติงบประมาณรวมขั้นสุดท้าย (Final Approval)",
    category: "ACTION",
    resource: "activity_plan",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 3.4 กลุ่มการตรวจสอบผู้ช่วยงาน (Helper Reviews)
  // ──────────────────────────────────────────────────────────────────────────
  {
    key: "activity_plan.review_sales_helper",
    name: "ตรวจสอบผู้ช่วยงานฝ่ายขาย",
    description: "ตรวจสอบและอนุมัติรายชื่อพนักงานฝ่ายขาย/ส่งเสริมที่มาช่วยงาน",
    category: "ACTION",
    resource: "activity_plan",
  },
  {
    key: "activity_plan.review_marketing_helper",
    name: "ตรวจสอบผู้ช่วยงานการตลาด",
    description: "ตรวจสอบและอนุมัติรายชื่อพนักงานการตลาดที่มาช่วยงาน",
    category: "ACTION",
    resource: "activity_plan",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 3.5 กลุ่มปฏิทินและบันทึกผลงานจริง (Calendar & Actual Work)
  // ──────────────────────────────────────────────────────────────────────────
  {
    key: "activity_plan.view_calendar",
    name: "เข้าดูปฏิทินแผนงาน",
    description: "สิทธิ์เปิดดูปฏิทินนัดหมายกิจกรรม (Activity Calendar)",
    category: "ACTION",
    resource: "activity_plan",
  },
  {
    key: "activity_plan.record_actual",
    name: "บันทึกผลการปฏิบัติงานจริง",
    description: "สิทธิ์เปิดฟอร์มและบันทึกผลลัพธ์หลังเสร็จสิ้นกิจกรรม",
    category: "ACTION",
    resource: "activity_plan",
  },
  {
    key: "activity_plan.edit_actual",
    name: "แก้ไขผลการปฏิบัติงานจริง",
    description: "สิทธิ์แก้ไขข้อมูลและรูปภาพผลการปฏิบัติงานจริง",
    category: "ACTION",
    resource: "activity_plan",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // เมนูและขอบเขตข้อมูล
  // ──────────────────────────────────────────────────────────────────────────
  {
    key: "menu.activity_plans",
    name: "เมนูแผนงาน (Trip Plan)",
    description: "เมนูการวางแผนกิจกรรมและบันทึกผลจริง",
    category: "MENU",
    resource: "activity_plan",
    menuPath: "/dashboard/activity-plans",
  },
  {
    key: "data.activity_plans",
    name: "ขอบเขตข้อมูลแผนงาน",
    description: "ขอบเขตการมองเห็นข้อมูลแผนงานกิจกรรม",
    category: "DATA",
    resource: "activity_plan",
    defaultDataAccess: DataAccessLevel.VIEW_OWN,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 3.6 สื่อส่งเสริมการขาย (Promotional Materials)
  // ──────────────────────────────────────────────────────────────────────────
  {
    key: "menu.promotional_materials",
    name: "เมนูสื่อส่งเสริมการขาย",
    description: "เมนูจัดการสื่อส่งเสริมการขาย",
    category: "MENU",
    resource: "promotional_material",
    menuPath: "/activity-plans/promotional-materials",
  },
  {
    key: "promotional_material.view",
    name: "ดูสื่อส่งเสริมการขาย",
    description: "สิทธิ์ดูรายการและรายละเอียดของสื่อส่งเสริมการขาย",
    category: "ACTION",
    resource: "promotional_material",
  },
  {
    key: "promotional_material.create",
    name: "สร้างสื่อส่งเสริมการขาย",
    description: "สิทธิ์สร้างสื่อส่งเสริมการขายใหม่",
    category: "ACTION",
    resource: "promotional_material",
  },
  {
    key: "promotional_material.edit",
    name: "แก้ไขสื่อส่งเสริมการขาย",
    description: "สิทธิ์แก้ไขสื่อส่งเสริมการขาย",
    category: "ACTION",
    resource: "promotional_material",
  },
  {
    key: "promotional_material.delete",
    name: "ลบสื่อส่งเสริมการขาย",
    description: "สิทธิ์ลบสื่อส่งเสริมการขาย",
    category: "ACTION",
    resource: "promotional_material",
  },
  {
    key: "data.promotional_materials",
    name: "ขอบเขตข้อมูลสื่อส่งเสริมการขาย",
    description: "ขอบเขตการมองเห็นข้อมูลสื่อส่งเสริมการขาย",
    category: "DATA",
    resource: "promotional_material",
    defaultDataAccess: DataAccessLevel.VIEW_ALL,
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Common Permission Bundles for Matrix Configuration
// ────────────────────────────────────────────────────────────────────────────

// 1. Creator Base: ทุกบทบาทที่สร้างแผนงานได้ (Promoter & Managers ทุกระดับ)
const creatorPermissions = [
  "activity_plan.view",
  "activity_plan.create",
  "activity_plan.edit",
  "activity_plan.submit",
  "activity_plan.view_own",
  "activity_plan.view_calendar",
  "activity_plan.record_actual",
  "activity_plan.edit_actual",
  "menu.activity_plans",
];

// 2. Line Approver Base: สำหรับ Approver ตามสายงานจริง
const lineApproverPermissions = [
  "activity_plan.view_pending",
  "activity_plan.approve",
  "activity_plan.reject",
  "activity_plan.request_correction",
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
      {
        key: "data.activity_plans",
        dataAccess: DataAccessLevel.VIEW_OWN,
        editAccess: EditAccessLevel.EDIT_OWN,
        deleteAccess: DeleteAccessLevel.DELETE_OWN,
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
      { key: "activity_plan.approve_sales_promotion_budget" },
      { key: "activity_plan.review_sales_helper" },
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
      { key: "activity_plan.approve_marketing_budget" },
      { key: "activity_plan.review_marketing_helper" },
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
      { key: "activity_plan.approve_total_budget" },
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
  console.log("🛡️ Seeding Activity RBAC Master Data (Permissions, Roles & Mapping)...");

  // 1. Seed / Upsert Permissions
  let createdPerms = 0;
  let updatedPerms = 0;

  for (const permDef of activityPermissions) {
    const existing = await prisma.permission.findUnique({
      where: { key: permDef.key },
    });

    if (!existing) {
      await prisma.permission.create({
        data: {
          key: permDef.key,
          name: permDef.name,
          description: permDef.description,
          category: permDef.category,
          resource: permDef.resource,
          menuPath: permDef.menuPath ?? null,
          defaultDataAccess: permDef.defaultDataAccess ?? null,
        },
      });
      createdPerms++;
    } else {
      // Update if properties differ
      if (
        existing.name !== permDef.name ||
        existing.description !== permDef.description ||
        existing.category !== permDef.category ||
        existing.resource !== permDef.resource ||
        existing.menuPath !== (permDef.menuPath ?? null)
      ) {
        await prisma.permission.update({
          where: { id: existing.id },
          data: {
            name: permDef.name,
            description: permDef.description,
            category: permDef.category,
            resource: permDef.resource,
            menuPath: permDef.menuPath ?? null,
          },
        });
        updatedPerms++;
      }
    }
  }

  console.log(`   - Permissions: ${createdPerms} created, ${updatedPerms} updated.`);

  // 2. Fetch all permission map
  const allPerms = await prisma.permission.findMany({
    where: { deletedAt: null },
    select: { id: true, key: true },
  });
  const permMap = new Map(allPerms.map((p) => [p.key, p.id]));

  // 3. Seed / Upsert 9 Activity Roles & RolePermissions
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
