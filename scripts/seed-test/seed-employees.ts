import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const employeesToSeed = [
  {
    employeeCode: "EMP-001",
    name: "นายสมชาย ใจดี",
    email: "somchai.j@example.com",
    prefix: "นาย",
    firstName: "สมชาย",
    lastName: "ใจดี",
    birthDate: new Date("1985-05-15"),
    phone: "081-234-5678",
    addressLine: "123/45 หมู่ 1",
    province: "กรุงเทพมหานคร",
    district: "เขตบางนา",
    subdistrict: "บางนา",
    postalCode: "10260",
    responsibilityArea: "กรุงเทพและปริมณฑล",
    status: "ACTIVE",
    departmentCode: "SA",
    positionName: "ผู้จัดการฝ่ายขาย",
    password: "password123",
  },
  {
    employeeCode: "EMP-002",
    name: "นางสาวสมศรี มีสุข",
    email: "somsri.m@example.com",
    prefix: "นางสาว",
    firstName: "สมศรี",
    lastName: "มีสุข",
    birthDate: new Date("1990-08-20"),
    phone: "089-876-5432",
    addressLine: "456/78 หมู่ 2",
    province: "ปทุมธานี",
    district: "คลองหลวง",
    subdistrict: "คลองหนึ่ง",
    postalCode: "12120",
    responsibilityArea: "ภาคกลาง",
    status: "ACTIVE",
    departmentCode: "SA",
    positionName: "พนักงานฝ่ายขาย",
    password: "password123",
  },
  {
    employeeCode: "EMP-003",
    name: "นายวิชัย รักงาน",
    email: "wichai.r@example.com",
    prefix: "นาย",
    firstName: "วิชัย",
    lastName: "รักงาน",
    birthDate: new Date("1992-03-10"),
    phone: "085-555-4444",
    addressLine: "12 หมู่ 4",
    province: "นครสวรรค์",
    district: "เมืองนครสวรรค์",
    subdistrict: "ปากน้ำโพ",
    postalCode: "60000",
    responsibilityArea: "ภาคเหนือตอนล่าง",
    status: "ACTIVE",
    departmentCode: "SS",
    positionName: "ธุรการขาย",
    password: "password123",
  },
];

async function main() {
  console.log("🚀 Start seeding employees from database metadata...");

  // 1. Fetch real data maps
  const departments = await prisma.department.findMany();
  const departmentMap = new Map(departments.map((d) => [d.code, d.id]));

  const positions = await prisma.position.findMany();
  const positionMap = new Map(positions.map((p) => [p.name, p.id]));

  // 2. Loop through employees to seed
  for (const e of employeesToSeed) {
    const { password, departmentCode, positionName, ...employeeData } = e;

    const departmentId = departmentMap.get(departmentCode) || null;
    const positionId = positionMap.get(positionName) || null;

    if (!departmentId)
      console.warn(`⚠️ Warning: Department code "${departmentCode}" not found.`);
    if (!positionId)
      console.warn(`⚠️ Warning: Position name "${positionName}" not found.`);

    // 1. Create/Update User
    const hashedPassword = await hash(password, 12);
    const user = await prisma.user.upsert({
      where: { email: e.email },
      update: {
        name: e.name,
        password: hashedPassword,
        departmentId,
        positionId,
      },
      create: {
        name: e.name,
        email: e.email,
        password: hashedPassword,
        departmentId,
        positionId,
      },
    });

    console.log(`👤 Upserted User: ${user.email}`);

    // 2. Create/Update Employee linked to User
    const employee = await prisma.employee.upsert({
      where: { email: e.email },
      update: {
        ...employeeData,
        userId: user.id,
        departmentId,
        positionId,
      },
      create: {
        ...employeeData,
        userId: user.id,
        departmentId,
        positionId,
      },
    });

    console.log(
      `✅ Upserted Employee: ${employee.name} (Code: ${employee.employeeCode}) linked to User ID: ${user.id}`,
    );
  }

  console.log("🎉 Seeding employees finished.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
