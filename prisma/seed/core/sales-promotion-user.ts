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
// Permission List for "พนักงานส่งเสริมการขาย" (Sales Promotion Officer)
//
// หมายเหตุ:
// - เมนู "แดชบอร์ดของฉัน", "หน้าแรก", "สินค้า", "ลูกค้า", "สื่อส่งเสริมการขาย" ถูกซ่อนจาก Sidebar
//   โดยการไม่ใส่ menu.* keys ใน Role นี้
// - แต่ยังคงให้สิทธิ์ DATA / ACTION เช่น product.view (VIEW_ALL), data.customers (VIEW_ALL)
//   เพื่อให้ Test User สามารถค้นหาและเลือกร้านค้า / Key Farmer / สินค้า / สื่อฯ ในแบบฟอร์มได้
//   โดยไม่ต้องมี Employee Assignment และไม่กระทบ User อื่น
// ============================================================================

interface PermissionConfigItem {
  key: string;
  dataAccess?: DataAccessLevel;
  editAccess?: EditAccessLevel;
  deleteAccess?: DeleteAccessLevel;
}

const salesPromotionPermissions: PermissionConfigItem[] = [
  // 📋 1. Activity Plans (การวางแผนกิจกรรม & บันทึกผลจริง)
  { key: "menu.activity_plans" },
  { key: "activity.view" },
  { key: "activity.create" },
  { key: "activity.edit" },
  {
    key: "data.activity_plans",
    dataAccess: DataAccessLevel.VIEW_OWN,
    editAccess: EditAccessLevel.EDIT_OWN,
    deleteAccess: DeleteAccessLevel.DELETE_NONE,
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
    dataAccess: DataAccessLevel.VIEW_ALL, // ให้สิทธิ์ VIEW_ALL เพื่อให้เลือก ร้านค้า / Key Farmer ในระบบได้โดยไม่ต้องมี Assignment
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

// ============================================================================
// Seed Function
// ============================================================================

export async function seedSalesPromotionUser(prisma: PrismaClient) {
  console.log("🌱 Seeding Sales Promotion Role, User, and Permissions...");

  // 1. Role: พนักงานส่งเสริมการขาย (Idempotent Upsert)
  const role = await prisma.role.upsert({
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

  console.log(`  ✅ Role: "${role.name}" (${role.slug}) [ID: ${role.id}]`);

  // 2. Clean up any obsolete permissions not in salesPromotionPermissions for this role
  const targetPermKeys = new Set(salesPromotionPermissions.map((p) => p.key));
  const existingRolePerms = await prisma.rolePermission.findMany({
    where: { roleId: role.id },
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

  // 3. Assign / Update Permissions to Role (Idempotent Upsert for each permission)
  let assignedPermCount = 0;
  for (const item of salesPromotionPermissions) {
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
          roleId: role.id,
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
        roleId: role.id,
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
    assignedPermCount++;
  }

  console.log(`  ✅ Role Permissions: Assigned ${assignedPermCount} permissions.`);

  // 4. Resolve Master Data: Department (SA), Position (พนักงานส่งเสริมการขาย), Company
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
        defaultRoleId: role.id,
      },
    });
  }

  const company = await prisma.company.findFirst({
    where: { status: "ACTIVE" },
  });

  // 5. Test User: sales-promotion.test@example.com (Password Hashed with bcryptjs)
  const testEmail = "sales-promotion.test@example.com";
  const hashedPassword = await hash(testEmail, 12);

  const user = await prisma.user.upsert({
    where: { email: testEmail },
    update: {
      name: "พนักงานส่งเสริมการขาย (Test)",
      password: hashedPassword,
      departmentId: salesDept?.id ?? null,
      positionId: position.id,
      isActive: true,
      deletedAt: null,
    },
    create: {
      name: "พนักงานส่งเสริมการขาย (Test)",
      email: testEmail,
      password: hashedPassword,
      departmentId: salesDept?.id ?? null,
      positionId: position.id,
      isActive: true,
    },
  });

  console.log(`  ✅ User: "${user.name}" (${user.email}) [ID: ${user.id}]`);

  // 6. UserRole: Link User -> Role (Idempotent Upsert)
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: role.id,
      },
    },
    update: {
      deletedAt: null,
    },
    create: {
      userId: user.id,
      roleId: role.id,
    },
  });

  console.log(`  ✅ UserRole: Linked User "${user.email}" -> Role "${role.name}"`);

  // 7. Employee Profile: Link Employee -> User (Idempotent Upsert)
  const employee = await prisma.employee.upsert({
    where: { email: testEmail },
    update: {
      name: "พนักงานส่งเสริมการขาย (Test)",
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
    create: {
      name: "พนักงานส่งเสริมการขาย (Test)",
      email: testEmail,
      employeeCode: "SP-TEST-001",
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

  console.log(
    `  ✅ Employee: "${employee.name}" (${employee.employeeCode}) [ID: ${employee.id}] linked to User.`
  );

  console.log("✅ Sales Promotion User Seed completed successfully!");
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
