import "dotenv/config";
import { PrismaClient, ShippingCompanyStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const shippingCompaniesToSeed = [
  {
    name: "Kerry Express (Thailand)",
    phone: "1217",
    address: "บริษัท เคอรี่ เอ็กซ์เพรส (ประเทศไทย) จำกัด (มหาชน)",
    addressLine:
      "89 อาคารเจ้าพระยาทาวเวอร์ ชั้นที่ 9 ห้องเลขที่ 906 ซอยวัดสวนพลู ถนนเจริญกรุง",
    province: "กรุงเทพมหานคร",
    district: "เขตบางรัก",
    subdistrict: "บางรัก",
    postalCode: "10500",
    notes: "จัดส่งทั่วประเทศ รับประกันของเสียหายสูงสุด 2000 บาท/กล่อง",
    status: ShippingCompanyStatus.ACTIVE,
  },
  {
    name: "Flash Express",
    phone: "1436",
    address: "บริษัท แฟลช เอ็กซ์เพรส จำกัด",
    addressLine: "161 ถนนรัชดาภิเษก แขวงดินแดง",
    province: "กรุงเทพมหานคร",
    district: "เขตดินแดง",
    subdistrict: "ดินแดง",
    postalCode: "10400",
    notes: "รับฝากพัสดุขนาดใหญ่และรับสินค้าถึงที่",
    status: ShippingCompanyStatus.ACTIVE,
  },
  {
    name: "J&T Express",
    phone: "02-280-2828",
    address: "เจแอนด์ที เอ็กซ์เพรส สาขาใหญ่",
    addressLine: "อาคารภิรัช ทาวเวอร์ แอท ไบเทค",
    province: "สมุทรปราการ",
    district: "เมืองสมุทรปราการ",
    subdistrict: "บางนาใต้",
    postalCode: "10260",
    notes: "จัดส่งรวดเร็ว โดดเด่นด้านราคาประหยัด",
    status: ShippingCompanyStatus.ACTIVE,
  },
  {
    name: "ไปรษณีย์ไทย (Thai Post)",
    phone: "1545",
    address: "บริษัท ไปรษณีย์ไทย จำกัด",
    addressLine: "111 ถนนแจ้งวัฒนะ",
    province: "กรุงเทพมหานคร",
    district: "เขตหลักสี่",
    subdistrict: "ทุ่งสองห้อง",
    postalCode: "10210-0299",
    notes: "รองรับการส่งสินค้าเพื่อการเกษตรขนาดใหญ่แบบเหมาจ่าย",
    status: ShippingCompanyStatus.INACTIVE, // example status
  },
];

async function main() {
  console.log("Start seeding shipping companies...");

  for (const sc of shippingCompaniesToSeed) {
    // using findFirst because name is not implicitly unique in prisma schema yet, but acts as a unique identifier for seeding logically.
    let company = await prisma.shippingCompany.findFirst({
      where: { name: sc.name },
    });

    if (company) {
      company = await prisma.shippingCompany.update({
        where: { id: company.id },
        data: sc,
      });
      console.log(`✅ Updated Shipping Company: ${company.name}`);
    } else {
      company = await prisma.shippingCompany.create({
        data: sc,
      });
      console.log(`✅ Created Shipping Company: ${company.name}`);
    }
  }

  console.log("🎉 Seeding shipping companies finished.");
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
