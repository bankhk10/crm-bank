import "dotenv/config";
import { PrismaClient, ProductStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const productsToSeed = [
  {
    productCode: "PROD-001",
    name: "สารกำจัดแมลง สูตรพิเศษ (ขวด 1 ลิตร)",
    commonName: "อะบาเมกติน 1.8% EC",
    unit: "ขวด",
    productGroup: "สารกำจัดแมลง",
    brand: "ตราหัวสิงห์",
    packageSize: "1 ลิตร",
    packageSizePerBox: "12 ขวด/ลัง",
    totalPackageSizePerBox: "12 ลิตร",
    status: ProductStatus.ACTIVE,
    usedForPlants: ["ข้าว", "ข้าวโพด", "พืชผัก", "ไม้ผล"],
    salesPoint: "ออกฤทธิ์น็อคและดูดซึม, เป็นยาเย็น ฉีดผ่าดอกได้",
    properties: "ใช้ป้องกันกำจัดหนอนชอนใบ, หนอนม้วนใบ, เพลี้ยไฟ",
    price: 350.0,
    cartonPrice: 4000.0,
    promotionBudget: 20.0,
    pointPerUnit: 10,
    chemicalGroup: "กลุ่ม 6",
  },
  {
    productCode: "PROD-002",
    name: "สารกำจัดวัชพืช หลังงอก",
    commonName: "บิสไพริแบค-โซเดียม 20% WP",
    unit: "ซอง",
    productGroup: "สารกำจัดวัชพืช",
    brand: "ตราช้างคู่",
    packageSize: "100 กรัม",
    packageSizePerBox: "50 ซอง/ลัง",
    totalPackageSizePerBox: "5 กิโลกรัม",
    status: ProductStatus.ACTIVE,
    usedForPlants: ["ข้าว"],
    salesPoint: "ฆ่าหญ้าข้าวนก, หญ้าแดง ปลอดภัยต่อข้าว",
    properties: "ดูดซึมเข้าทางใบและรากได้อย่างรวดเร็ว",
    price: 150.0,
    cartonPrice: 7000.0,
    promotionBudget: 5.0,
    pointPerUnit: 5,
    chemicalGroup: "กลุ่ม B",
  },
  {
    productCode: "PROD-003",
    name: "ปุ๋ยเกล็ด ทางใบ สูตรบำรุงดอก",
    commonName: "10-20-30+TE",
    unit: "กิโลกรัม",
    productGroup: "ฮอร์โมน/อาหารเสริม",
    brand: "ตราพ่นรวย",
    packageSize: "1 กิโลกรัม",
    packageSizePerBox: "20 ถุง/ลัง",
    totalPackageSizePerBox: "20 กิโลกรัม",
    status: ProductStatus.ACTIVE,
    usedForPlants: ["ทุเรียน", "มะม่วง", "พืชไร่"],
    salesPoint: "ละลายน้ำดีเยี่ยม พืชดูดซึมไว ช่วยดึงดอก",
    properties: "ธาตุอาหารครบถ้วน ปรับสมดุลพืชก่อนออกดอก",
    price: 180.0,
    cartonPrice: 3400.0,
    promotionBudget: 10.0,
    pointPerUnit: 3,
    chemicalGroup: "-",
  },
  {
    productCode: "PROD-004",
    name: "สารป้องกันกำจัดโรคพืช (ชนิดหมดอายุ/ยกเลิกจำหน่าย)",
    commonName: "คาร์เบนดาซิม 50% SC",
    unit: "ขวด",
    productGroup: "สารกำจัดโรคพืช",
    brand: "ตราดอกบัว",
    packageSize: "500 ซีซี",
    packageSizePerBox: "24 ขวด/ลัง",
    totalPackageSizePerBox: "12 ลิตร",
    status: ProductStatus.INACTIVE,
    usedForPlants: ["ทั่วไป"],
    salesPoint: "รักษาแผลตามต้น",
    properties: "ยาดูดซึม ป้องกันเชื้อรา",
    price: null,
    cartonPrice: null,
    promotionBudget: null,
    pointPerUnit: 0,
    chemicalGroup: "กลุ่ม 1",
  },
];

async function main() {
  console.log("Start seeding products...");

  for (const p of productsToSeed) {
    const product = await prisma.product.upsert({
      where: { productCode: p.productCode },
      update: p,
      create: p,
    });
    console.log(
      `✅ Upserted Product: ${product.name} (Code: ${product.productCode})`,
    );
  }

  console.log("🎉 Seeding products finished.");
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
