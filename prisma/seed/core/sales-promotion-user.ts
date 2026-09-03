import "dotenv/config";
import {
  PrismaClient,
  DataAccessLevel,
  EditAccessLevel,
  DeleteAccessLevel,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

// ============================================================================
// Permission List for Sales Promotion Roles
//
// 1. sales_promotion (พนักงานส่งเสริมการขาย ทั่วไป) -> data.activity_plans: VIEW_OWN
// 2. sales_promotion_supervisor (พนักงานส่งเสริมการขาย - ผู้ควบคุมงาน) -> data.activity_plans: VIEW_ALL
// ============================================================================

interface PermissionConfigItem {
  key: string;
  dataAccess?: DataAccessLevel;
  editAccess?: EditAccessLevel;
  deleteAccess?: DeleteAccessLevel;
}

// 1. Regular Role Permissions (VIEW_OWN)
const regularSalesPromotionPermissions: PermissionConfigItem[] = [
  // 📋 1. Activity Plans (การวางแผนกิจกรรม & บันทึกผลจริง)
  { key: "menu.activity_plans" },
  { key: "activity.view" },
  { key: "activity.create" },
  { key: "activity.edit" },
  { key: "activity.delete" },
  {
    key: "data.activity_plans",
    dataAccess: DataAccessLevel.VIEW_OWN,
    editAccess: EditAccessLevel.EDIT_OWN,
    deleteAccess: DeleteAccessLevel.DELETE_OWN,
  },

  // 🏷️ 2. Promotional Materials (ให้สิทธิ์ดูข้อมูลสำหรับเลือกในแบบฟอร์ม โดยไม่เปิดเมนู sidebar)
  { key: "promotional_material.view" },
  {
    key: "data.promotional_materials",
    dataAccess: DataAccessLevel.VIEW_ALL,
    editAccess: EditAccessLevel.EDIT_NONE,
    deleteAccess: DeleteAccessLevel.DELETE_NONE,
  },

  // 👥 3. Customers (ให้สิทธิ์ดู/เลือกข้อมูลลูกค้าทั้งหมดในระบบสำหรับ Test User โดยไม่ต้องมี Responsible Employee และไม่เปิดเมนู sidebar)
  { key: "customer.view.dealer", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.view.subdealer", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.view.farmer", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.view.broker", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.create.farmer" },
  { key: "customer.create.subdealer" },
  { key: "customer.create.broker" },
  { key: "customer.edit.farmer" },
  { key: "customer.edit.subdealer" },
  { key: "customer.edit.broker" },
  {
    key: "data.customers",
    dataAccess: DataAccessLevel.VIEW_ALL,
    editAccess: EditAccessLevel.EDIT_OWN,
    deleteAccess: DeleteAccessLevel.DELETE_NONE,
  },

  // 📦 4. Products & Stock (ให้สิทธิ์ดูข้อมูลสำหรับเลือกในแบบฟอร์ม โดยไม่เปิดเมนู sidebar)
  { key: "product.view", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "product.stock.view" },

  // 👔 5. Employees (พนักงาน สำหรับเลือกผู้ร่วมเดินทาง/หัวหน้า)
  { key: "employee.view", dataAccess: DataAccessLevel.VIEW_ALL },

  // 📊 6. Reports & Test Activity (รายงานและแบบฟอร์มกิจกรรม)
  { key: "menu.test_activity" },
  { key: "menu.test_activity.trip_plan" },
  { key: "menu.test_activity.activity_report" },
  { key: "menu.test_activity.budget_report" },
  { key: "menu.test_activity.customer_report" },
];

// 2. Supervisor Role Permissions (VIEW_ALL for activity_plans)
const supervisorSalesPromotionPermissions: PermissionConfigItem[] = [
  // 📋 1. Activity Plans (มองเห็นข้อมูล Activity Plan และ Actual ของทุกคน)
  { key: "menu.activity_plans" },
  { key: "activity.view" },
  { key: "activity.create" },
  { key: "activity.edit" },
  { key: "activity.delete" },
  {
    key: "data.activity_plans",
    dataAccess: DataAccessLevel.VIEW_ALL, // ✨ มองเห็นของพนักงานทุกคน
    editAccess: EditAccessLevel.EDIT_OWN, // 🔒 แก้ไขได้เฉพาะของตนเอง
    deleteAccess: DeleteAccessLevel.DELETE_OWN, // 🔒 ลบได้เฉพาะของตนเอง
  },

  // 🏷️ 2. Promotional Materials
  { key: "promotional_material.view" },
  {
    key: "data.promotional_materials",
    dataAccess: DataAccessLevel.VIEW_ALL,
    editAccess: EditAccessLevel.EDIT_NONE,
    deleteAccess: DeleteAccessLevel.DELETE_NONE,
  },

  // 👥 3. Customers
  { key: "customer.view.dealer", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.view.subdealer", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.view.farmer", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.view.broker", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "customer.create.farmer" },
  { key: "customer.create.subdealer" },
  { key: "customer.create.broker" },
  { key: "customer.edit.farmer" },
  { key: "customer.edit.subdealer" },
  { key: "customer.edit.broker" },
  {
    key: "data.customers",
    dataAccess: DataAccessLevel.VIEW_ALL,
    editAccess: EditAccessLevel.EDIT_OWN,
    deleteAccess: DeleteAccessLevel.DELETE_NONE,
  },

  // 📦 4. Products & Stock
  { key: "product.view", dataAccess: DataAccessLevel.VIEW_ALL },
  { key: "product.stock.view" },

  // 👔 5. Employees
  { key: "employee.view", dataAccess: DataAccessLevel.VIEW_ALL },

  // 📊 6. Reports & Test Activity
  { key: "menu.test_activity" },
  { key: "menu.test_activity.trip_plan" },
  { key: "menu.test_activity.activity_report" },
  { key: "menu.test_activity.budget_report" },
  { key: "menu.test_activity.customer_report" },
];

// ============================================================================
// Test Employees List (All normalized to lowercase email)
// ============================================================================

interface TestEmployeeInput {
  email: string;
  name: string;
  nickname: string;
  prefix?: string;
  firstName?: string;
  lastName?: string;
  employeeCode?: string;
  roleSlug: "sales_promotion" | "sales_promotion_supervisor";
}

const testEmployees: TestEmployeeInput[] = [
  // พนักงานส่งเสริมการขายทั่วไป (VIEW_OWN)
  {
    email: "warapornboonaoi1@gmail.com",
    name: "วราภรณ์ บุญอ้อย",
    nickname: "นุ๊ก",
    prefix: "นางสาว",
    firstName: "วราภรณ์",
    lastName: "บุญอ้อย",
    employeeCode: "SP-TEST-001",
    roleSlug: "sales_promotion",
  },
  {
    email: "koiijai14@gmail.com",
    name: "นส. นิธินาถ อริยมงคลชัย",
    nickname: "ก้อย",
    prefix: "นส.",
    firstName: "นิธินาถ",
    lastName: "อริยมงคลชัย",
    employeeCode: "SP-TEST-002",
    roleSlug: "sales_promotion",
  },
  {
    email: "mueanfan011199@gmail.com",
    name: "เหมือนฝัน การปรีชา",
    nickname: "ปลาย",
    prefix: "นางสาว",
    firstName: "เหมือนฝัน",
    lastName: "การปรีชา",
    employeeCode: "SP-TEST-003",
    roleSlug: "sales_promotion",
  },
  {
    email: "marchmellow2541@gmail.com",
    name: "ธีระวัฒน์ วงค์ใหญ่",
    nickname: "มาร์ท",
    prefix: "นาย",
    firstName: "ธีระวัฒน์",
    lastName: "วงค์ใหญ่",
    employeeCode: "SP-TEST-004",
    roleSlug: "sales_promotion",
  },
  {
    email: "sales-promotion.test@example.com",
    name: "พนักงานส่งเสริมการขาย (Test)",
    nickname: "ทดสอบ",
    prefix: "นาย",
    firstName: "พนักงานส่งเสริมการขาย",
    lastName: "(Test)",
    employeeCode: "SP-TEST-000",
    roleSlug: "sales_promotion",
  },

  // พนักงานส่งเสริมการขาย - ผู้ควบคุมงาน (VIEW_ALL)
  {
    email: "ck_08@hotmail.co.th",
    name: "ธีระยุทธ ธณศักดิ์กุล",
    nickname: "หนึ่ง",
    prefix: "นาย",
    firstName: "ธีระยุทธ",
    lastName: "ธณศักดิ์กุล",
    employeeCode: "6900005",
    roleSlug: "sales_promotion_supervisor",
  },
  {
    email: "topten_mju@hotmail.com",
    name: "เจตน์สกฤษฎิ์ อาจฤทธิ์",
    nickname: "ท็อป",
    prefix: "นาย",
    firstName: "เจตน์สกฤษฎิ์",
    lastName: "อาจฤทธิ์",
    employeeCode: "6900018",
    roleSlug: "sales_promotion_supervisor",
  },
  {
    email: "komsan@cropsciences.co.th",
    name: "คมสัน อ่อนช้อย",
    nickname: "หนูหนึ่ง",
    prefix: "นาย",
    firstName: "คมสัน",
    lastName: "อ่อนช้อย",
    employeeCode: "6900020",
    roleSlug: "sales_promotion_supervisor",
  },
];

// Helper to sync permissions for a role
async function syncRolePermissions(
  prisma: PrismaClient,
  roleId: string,
  permissions: PermissionConfigItem[]
) {
  const targetPermKeys = new Set(permissions.map((p) => p.key));
  const existingRolePerms = await prisma.rolePermission.findMany({
    where: { roleId },
    include: { permission: true },
  });

  for (const rp of existingRolePerms) {
    if (!targetPermKeys.has(rp.permission.key)) {
      await prisma.rolePermission.delete({
        where: { id: rp.id },
      });
      console.log(`  🗑️ Removed menu permission: ${rp.permission.key}`);
    }
  }

  let assignedCount = 0;
  for (const item of permissions) {
    const perm = await prisma.permission.findUnique({
      where: { key: item.key },
    });

    if (!perm) {
      console.warn(`  ⚠️ Permission not found in DB: ${item.key}`);
      continue;
    }

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId: perm.id,
        },
      },
      update: {
        allow: true,
        dataAccess:
          item.dataAccess ??
          (perm.category === "DATA" ? perm.defaultDataAccess : null),
        editAccess:
          item.editAccess ??
          (perm.category === "DATA" ? perm.defaultEditAccess : null),
        deleteAccess:
          item.deleteAccess ??
          (perm.category === "DATA" ? perm.defaultDeleteAccess : null),
        deletedAt: null,
      },
      create: {
        roleId,
        permissionId: perm.id,
        allow: true,
        dataAccess:
          item.dataAccess ??
          (perm.category === "DATA" ? perm.defaultDataAccess : null),
        editAccess:
          item.editAccess ??
          (perm.category === "DATA" ? perm.defaultEditAccess : null),
        deleteAccess:
          item.deleteAccess ??
          (perm.category === "DATA" ? perm.defaultDeleteAccess : null),
      },
    });
    assignedCount++;
  }

  return assignedCount;
}

// ============================================================================
// Seed Function
// ============================================================================

export async function seedSalesPromotionUser(prisma: PrismaClient) {
  console.log("🌱 Seeding Sales Promotion Roles, Users, and Permissions...");

  // 1. Role 1: sales_promotion (พนักงานส่งเสริมการขาย - VIEW_OWN)
  const regularRole = await prisma.role.upsert({
    where: { slug: "sales_promotion" },
    update: {
      name: "พนักงานส่งเสริมการขาย",
      description:
        "พนักงานส่งเสริมการขาย - สร้างและบันทึกผลการปฏิบัติงานตามแผนงาน (Trip Plan & Actual)",
      isActive: true,
    },
    create: {
      name: "พนักงานส่งเสริมการขาย",
      slug: "sales_promotion",
      description:
        "พนักงานส่งเสริมการขาย - สร้างและบันทึกผลการปฏิบัติงานตามแผนงาน (Trip Plan & Actual)",
      isSystem: false,
      isActive: true,
    },
  });

  const regCount = await syncRolePermissions(
    prisma,
    regularRole.id,
    regularSalesPromotionPermissions
  );
  console.log(
    `  ✅ Role: "${regularRole.name}" (${regularRole.slug}) [Permissions: ${regCount}]`
  );

  // 2. Role 2: sales_promotion_supervisor (พนักงานส่งเสริมการขาย - ผู้ควบคุมงาน - VIEW_ALL)
  const supervisorRole = await prisma.role.upsert({
    where: { slug: "sales_promotion_supervisor" },
    update: {
      name: "พนักงานส่งเสริมการขาย - ผู้ควบคุมงาน",
      description:
        "พนักงานส่งเสริมการขาย (ผู้ควบคุมงาน) - ตรวจสอบและติดตามแผนงานและผลการปฏิบัติงานของทุกคน",
      isActive: true,
    },
    create: {
      name: "พนักงานส่งเสริมการขาย - ผู้ควบคุมงาน",
      slug: "sales_promotion_supervisor",
      description:
        "พนักงานส่งเสริมการขาย (ผู้ควบคุมงาน) - ตรวจสอบและติดตามแผนงานและผลการปฏิบัติงานของทุกคน",
      isSystem: false,
      isActive: true,
    },
  });

  const supCount = await syncRolePermissions(
    prisma,
    supervisorRole.id,
    supervisorSalesPromotionPermissions
  );
  console.log(
    `  ✅ Role: "${supervisorRole.name}" (${supervisorRole.slug}) [Permissions: ${supCount}]`
  );

  // 3. Resolve Master Data: Department (SA), Position (พนักงานส่งเสริมการขาย), Company
  const salesDept = await prisma.department.findUnique({
    where: { code: "SA" },
  });

  let position = await prisma.position.findFirst({
    where: { name: "พนักงานส่งเสริมการขาย" },
  });

  if (!position) {
    position = await prisma.position.create({
      data: {
        name: "พนักงานส่งเสริมการขาย",
        level: 1,
        isManagerial: false,
        departmentId: salesDept?.id ?? null,
        defaultRoleId: regularRole.id,
      },
    });
  }

  const company = await prisma.company.findFirst({
    where: { status: "ACTIVE" },
  });

  // 4. Seed / Sync All Test Employees (Normalized to Lowercase)
  console.log(`  👤 Seeding & Linking ${testEmployees.length} Test Users (All Lowercase Email)...`);

  for (let i = 0; i < testEmployees.length; i++) {
    const emp = testEmployees[i];
    const normalizedEmail = emp.email.trim().toLowerCase();
    const targetRoleId =
      emp.roleSlug === "sales_promotion_supervisor"
        ? supervisorRole.id
        : regularRole.id;
    const hashedPassword = await hash(normalizedEmail, 12);

    // 4.1 Check for existing mixed-case User record and migrate to normalized lowercase
    let user = await prisma.user.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: "insensitive" },
      },
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          email: normalizedEmail,
          name: emp.name,
          password: hashedPassword,
          departmentId: salesDept?.id ?? null,
          positionId: position.id,
          isActive: true,
          deletedAt: null,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          name: emp.name,
          email: normalizedEmail,
          password: hashedPassword,
          departmentId: salesDept?.id ?? null,
          positionId: position.id,
          isActive: true,
        },
      });
    }

    // 4.2 UserRole: Link User -> Target Role (Preserves existing roles)
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: targetRoleId,
        },
      },
      update: {
        deletedAt: null,
      },
      create: {
        userId: user.id,
        roleId: targetRoleId,
      },
    });

    // 4.3 Check for existing mixed-case Employee record and migrate to normalized lowercase
    let employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { userId: user.id },
          { email: { equals: normalizedEmail, mode: "insensitive" } },
        ],
      },
    });

    if (employee) {
      employee = await prisma.employee.update({
        where: { id: employee.id },
        data: {
          name: emp.name,
          email: normalizedEmail,
          firstName: emp.firstName ?? null,
          lastName: emp.lastName ?? null,
          prefix: emp.prefix ?? null,
          nickname: emp.nickname ?? null,
          userId: user.id,
          companyId: company?.id ?? null,
          departmentId: salesDept?.id ?? null,
          positionId: position.id,
          status: "ACTIVE",
          roleTitle: "พนักงานส่งเสริมการขาย",
          departmentName: salesDept?.name ?? "แผนกบริหารงานขาย",
          positionTitle: position.name,
          deletedAt: null,
        },
      });
    } else {
      employee = await prisma.employee.create({
        data: {
          name: emp.name,
          email: normalizedEmail,
          employeeCode: emp.employeeCode ?? `SP-TEST-00${i + 1}`,
          firstName: emp.firstName ?? null,
          lastName: emp.lastName ?? null,
          prefix: emp.prefix ?? null,
          nickname: emp.nickname ?? null,
          userId: user.id,
          companyId: company?.id ?? null,
          departmentId: salesDept?.id ?? null,
          positionId: position.id,
          status: "ACTIVE",
          roleTitle: "พนักงานส่งเสริมการขาย",
          departmentName: salesDept?.name ?? "แผนกบริหารงานขาย",
          positionTitle: position.name,
        },
      });
    }

    console.log(
      `    [${i + 1}/${testEmployees.length}] ✅ User & Employee: "${emp.name}" (${emp.nickname}) <${normalizedEmail}> -> Role: ${emp.roleSlug}`
    );
  }

  console.log("✅ Sales Promotion Roles & Users seeded successfully with Normalized Emails!");
}

// Standalone execution entrypoint
if (
  process.argv[1]?.includes("sales-promotion-user") ||
  process.argv[1]?.includes("sales_promotion")
) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // @ts-ignore
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  seedSalesPromotionUser(prisma)
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (error) => {
      console.error("❌ Seed failed:", error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
