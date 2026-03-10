import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const employeesToSeed = [
  {
    employeeCode: "EMP-001",
    name: "สมเกียรติ ยอดขาย (หัวหน้าทีมเซลล์)",
    email: "somkiat.sales@example.com",
    prefix: "นาย",
    firstName: "สมเกียรติ",
    lastName: "ยอดขาย",
    birthDate: new Date("1985-02-14"),
    addressLine: "123/45 หมู่บ้านเศรษฐี ถ.เพชรเกษม",
    province: "กรุงเทพมหานคร",
    district: "หนองแขม",
    subdistrict: "หนองค้างพลู",
    postalCode: "10160",
    responsibilityArea: "ภาคกลางและภาคตะวันตก",
    status: "ACTIVE",
    positionTitle: "Sales Manager",
    departmentName: "ฝ่ายขายองค์กร",
    roleTitle: "Manager",
    phone: "089-111-2233",
  },
  {
    employeeCode: "EMP-002",
    name: "วิไลวรรณ ขยันยิ่ง (เซลล์ภาคเหนือ)",
    email: "wilaiwan.n@example.com",
    prefix: "นางสาว",
    firstName: "วิไลวรรณ",
    lastName: "ขยันยิ่ง",
    birthDate: new Date("1992-07-20"),
    addressLine: "9/9 หมู่ 1 ถ.ห้วยแก้ว",
    province: "เชียงใหม่",
    district: "เมืองเชียงใหม่",
    subdistrict: "สุเทพ",
    postalCode: "50200",
    responsibilityArea: "ภาคเหนือตอนบน",
    status: "ACTIVE",
    positionTitle: "Senior Sales Representative",
    departmentName: "ฝ่ายขายองค์กร",
    roleTitle: "Sales",
    phone: "081-444-5566",
  },
  {
    employeeCode: "EMP-003",
    name: "ประพนธ์ คนดี (เซลล์ภาคอีสาน)",
    email: "prapol.k@example.com",
    prefix: "นาย",
    firstName: "ประพนธ์",
    lastName: "คนดี",
    birthDate: new Date("1990-11-05"),
    addressLine: "88/8 ถ.มิตรภาพ",
    province: "ขอนแก่น",
    district: "เมืองขอนแก่น",
    subdistrict: "ในเมือง",
    postalCode: "40000",
    responsibilityArea: "ภาคอีสาน",
    status: "ACTIVE",
    positionTitle: "Sales Representative",
    departmentName: "ฝ่ายขายองค์กร",
    roleTitle: "Sales",
    phone: "088-777-8899",
  },
  {
    employeeCode: "EMP-004",
    name: "มานี มีนา (ลาออก)",
    email: "manee.m@example.com",
    prefix: "นาง",
    firstName: "มานี",
    lastName: "มีนา",
    birthDate: new Date("1988-04-12"),
    addressLine: "44 ซ.อารีย์ ถ.พหลโยธิน",
    province: "กรุงเทพมหานคร",
    district: "พญาไท",
    subdistrict: "สามเสนใน",
    postalCode: "10400",
    responsibilityArea: "ภาคตะวันออก",
    status: "RESIGNED",
    positionTitle: "Sales Representative",
    departmentName: "ฝ่ายขายองค์กร",
    roleTitle: "Sales",
    phone: "082-333-4455",
  },
];

async function main() {
  console.log("Start seeding employees...");

  for (const emp of employeesToSeed) {
    const employee = await prisma.employee.upsert({
      where: { email: emp.email },
      update: emp,
      create: emp,
    });
    console.log(
      `✅ Upserted Employee: ${employee.name} (Code: ${employee.employeeCode})`,
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
