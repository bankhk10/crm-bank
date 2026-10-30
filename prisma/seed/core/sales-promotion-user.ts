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
// Real Staff List for Field / Promotion & Activity Roles
// ============================================================================

interface TestEmployeeInput {
  email: string;
  name: string;
  nickname: string;
  prefix?: string;
  firstName?: string;
  lastName?: string;
  employeeCode?: string;
  roleSlug: string;
}

const realEmployees: TestEmployeeInput[] = [
  // พนักงานส่งเสริมการขายทั่วไป -> activity_promoter
  {
    email: "warapornboonaoi1@gmail.com",
    name: "วราภรณ์ บุญอ้อย",
    nickname: "นุ๊ก",
    prefix: "นางสาว",
    firstName: "วราภรณ์",
    lastName: "บุญอ้อย",
    employeeCode: "SP-TEST-001",
    roleSlug: "activity_promoter",
  },
  {
    email: "koiijai14@gmail.com",
    name: "นส. นิธินาถ อริยมงคลชัย",
    nickname: "ก้อย",
    prefix: "นส.",
    firstName: "นิธินาถ",
    lastName: "อริยมงคลชัย",
    employeeCode: "SP-TEST-002",
    roleSlug: "activity_promoter",
  },
  {
    email: "mueanfan011199@gmail.com",
    name: "เหมือนฝัน การปรีชา",
    nickname: "ปลาย",
    prefix: "นางสาว",
    firstName: "เหมือนฝัน",
    lastName: "การปรีชา",
    employeeCode: "SP-TEST-003",
    roleSlug: "activity_promoter",
  },
  {
    email: "marchmellow2541@gmail.com",
    name: "ธีระวัฒน์ วงค์ใหญ่",
    nickname: "มาร์ท",
    prefix: "นาย",
    firstName: "ธีระวัฒน์",
    lastName: "วงค์ใหญ่",
    employeeCode: "SP-TEST-004",
    roleSlug: "activity_promoter",
  },

  // หัวหน้างานส่งเสริมการขาย / ผู้จัดการ
  {
    email: "ck_08@hotmail.co.th",
    name: "ธีระยุทธ ธณศักดิ์กุล",
    nickname: "หนึ่ง",
    prefix: "นาย",
    firstName: "ธีระยุทธ",
    lastName: "ธณศักดิ์กุล",
    employeeCode: "6900005",
    roleSlug: "activity_sales_admin_manager",
  },
  {
    email: "topten_mju@hotmail.com",
    name: "เจตน์สกฤษฎิ์ อาจฤทธิ์",
    nickname: "ท็อป",
    prefix: "นาย",
    firstName: "เจตน์สกฤษฎิ์",
    lastName: "อาจฤทธิ์",
    employeeCode: "6900018",
    roleSlug: "activity_area_manager",
  },
  {
    email: "komsan@cropsciences.co.th",
    name: "คมสัน อ่อนช้อย",
    nickname: "หนูหนึ่ง",
    prefix: "นาย",
    firstName: "คมสัน",
    lastName: "อ่อนช้อย",
    employeeCode: "6900020",
    roleSlug: "activity_marketing_manager",
  },
];

// ============================================================================
// Seed Function
// ============================================================================

export async function seedSalesPromotionUser(prisma: PrismaClient) {
  console.log("🌱 Seeding Promotion Staff Users & Hierarchy...");

  // 1. Resolve activity_promoter Role
  let promoterRole = await prisma.role.findUnique({
    where: { slug: "activity_promoter" },
  });

  if (!promoterRole) {
    promoterRole = await prisma.role.create({
      data: {
        name: "พนักงานส่งเสริมการขาย-กิจกรรม",
        slug: "activity_promoter",
        description:
          "พนักงานส่งเสริมการขาย - สร้าง/ส่งแผนงานกิจกรรมภาคสนาม และบันทึกผลงานจริง",
        isSystem: false,
        isActive: true,
      },
    });
  }

  // 2. Resolve Master Data: Department (SA), Position (พนักงานส่งเสริมการขาย), Company
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
        defaultRoleId: promoterRole.id,
      },
    });
  }

  const company = await prisma.company.findFirst({
    where: { status: "ACTIVE" },
  });

  // 3. Seed / Sync All Real Staff
  console.log(`  👤 Seeding & Linking ${realEmployees.length} Promotion Staff Users...`);

  for (let i = 0; i < realEmployees.length; i++) {
    const emp = realEmployees[i];
    const normalizedEmail = emp.email.trim().toLowerCase();
    const targetRole = await prisma.role.findUnique({
      where: { slug: emp.roleSlug },
    });
    const targetRoleId = targetRole?.id ?? promoterRole.id;
    const hashedPassword = await hash(normalizedEmail, 12);

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

    // Link User -> Role
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: targetRoleId,
        },
      },
      update: { deletedAt: null },
      create: {
        userId: user.id,
        roleId: targetRoleId,
      },
    });

    // Link User -> Employee Profile
    let employee = await prisma.employee.findUnique({
      where: { email: normalizedEmail },
    });

    const isSupervisor =
      emp.roleSlug !== "activity_promoter";

    if (employee) {
      employee = await prisma.employee.update({
        where: { id: employee.id },
        data: {
          name: emp.name,
          userId: user.id,
          employeeCode: emp.employeeCode || employee.employeeCode,
          prefix: emp.prefix || employee.prefix,
          firstName: emp.firstName || employee.firstName,
          lastName: emp.lastName || employee.lastName,
          nickname: emp.nickname || employee.nickname,
          companyId: company?.id ?? employee.companyId,
          departmentId: salesDept?.id ?? employee.departmentId,
          positionId: position.id,
          positionTitle: isSupervisor
            ? "หัวหน้างานส่งเสริมการขาย"
            : "พนักงานส่งเสริมการขาย",
          departmentName: salesDept?.name ?? "แผนกบริหารงานขาย",
          status: "ACTIVE",
          deletedAt: null,
        },
      });
    } else {
      employee = await prisma.employee.create({
        data: {
          name: emp.name,
          email: normalizedEmail,
          userId: user.id,
          employeeCode: emp.employeeCode,
          prefix: emp.prefix,
          firstName: emp.firstName,
          lastName: emp.lastName,
          nickname: emp.nickname,
          companyId: company?.id ?? null,
          departmentId: salesDept?.id ?? null,
          positionId: position.id,
          positionTitle: isSupervisor
            ? "หัวหน้างานส่งเสริมการขาย"
            : "พนักงานส่งเสริมการขาย",
          departmentName: salesDept?.name ?? "แผนกบริหารงานขาย",
          status: "ACTIVE",
        },
      });
    }
  }

  // 4. Link Hierarchy (Supervisor -> Staff)
  const supervisorEmp = await prisma.employee.findFirst({
    where: { email: "ck_08@hotmail.co.th" },
  });

  if (supervisorEmp) {
    const staffEmails = [
      "warapornboonaoi1@gmail.com",
      "koiijai14@gmail.com",
      "mueanfan011199@gmail.com",
      "marchmellow2541@gmail.com",
    ];

    await prisma.employee.updateMany({
      where: {
        email: { in: staffEmails },
      },
      data: {
        managerId: supervisorEmp.id,
      },
    });
    console.log(`  🔗 Linked 4 field staff under Supervisor (${supervisorEmp.name})`);
  }

  console.log("✅ Promotion Staff Seeding completed successfully.\n");
}

// Standalone execution entrypoint
if (process.argv[1]?.includes("sales-promotion-user")) {
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
