import "dotenv/config";
import { PrismaClient, CustomerType, CustomerStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const customersToSeed = [
  {
    id: "cmlg41g2m002601oi2lfujlen",
    customerCode: "BR0103RY",
    customerType: CustomerType.DEALER,

    name: "นายวิรุธ รุจิวงศ์",
    prefix: "นาย",
    firstName: "กฤษณ์",
    lastName: "พฤฒิสุขนิรันดร์",
    birthDate: null,

    email: null,
    phone: "038886463",
    taxId: null,

    addressLine: "95/3 หมู่ที่4",
    province: "ระยอง",
    region: "ภาคตะวันออก",
    district: "แกลง",
    subdistrict: "กระแสบน",
    postalCode: "21110",

    billingAddressLine: "33/2 หมู่ 2",
    billingProvince: "ระยอง",
    billingDistrict: "แกลง",
    billingSubdistrict: "ทางเกวียน",
    billingPostalCode: "21110",

    shippingAddressLine: "33/2 หมู่ 2",
    shippingProvince: "ระยอง",
    shippingDistrict: "แกลง",
    shippingSubdistrict: "ทางเกวียน",
    shippingPostalCode: "21110",

    status: CustomerStatus.ACTIVE,

    contactPerson: "กฤษณ์ พฤฒิสุขนิรันดร์",
    contactPhone: "0815902595",
    contactEmail: null,

    notes: null,

    latitude: null,
    longitude: null,

    relationshipScore: 3,
    parentDealerId: null,
    responsibleEmployeeId: null,

    receiveFromDealer: null,
    mainCompetitor: null,
    areaCrops: null,

    averageMonthlyPurchase: null,
    mainProductSold: [],
    brandsSold: [],

    areaType: null,
    farmPlots: [],
    cropTypes: null,

    currentYield: null,
    farmerCount: null,
    plotCount: null,
    totalAreaRai: null,

    harvestPerYear: null,
    creditDays: null,

    chemicalValuePerCycle: null,
    chemicalQtyPerCycle: null,

    regularShops: null,
    serviceTypes: null,
    usedBrands: null,

    createdAt: new Date("2026-02-10T04:38:03.927Z"),
    updatedAt: new Date("2026-02-10T04:38:40.333Z"),
    deletedAt: null,
  },
  {
    customerCode: "CUST-D-001",
    customerType: CustomerType.DEALER,
    name: "ร้าน โชคชัยการเกษตร",
    prefix: "บจก.",
    firstName: "สมชาย",
    lastName: "ใจดี",
    birthDate: new Date("1980-05-15"),
    email: "chokchai.agri@example.com",
    phone: "081-123-4567",
    taxId: "0105566778899",
    addressLine: "123/45 หมู่ 1 ถ.เจริญราษฎร์",
    province: "กรุงเทพมหานคร",
    region: "ภาคกลาง",
    district: "เขตบางคอแหลม",
    subdistrict: "บางคอแหลม",
    postalCode: "10120",
    billingAddressLine: "123/45 หมู่ 1 ถ.เจริญราษฎร์ (ฝ่ายบัญชี)",
    billingProvince: "กรุงเทพมหานคร",
    billingDistrict: "เขตบางคอแหลม",
    billingSubdistrict: "บางคอแหลม",
    billingPostalCode: "10120",
    shippingAddressLine: "99/9 โกดัง A",
    shippingProvince: "ปทุมธานี",
    shippingDistrict: "คลองหลวง",
    shippingSubdistrict: "คลองหนึ่ง",
    shippingPostalCode: "12120",
    status: CustomerStatus.ACTIVE,
    contactPerson: "คุณสมชาย",
    contactPhone: "081-123-4567",
    contactEmail: "somchai@example.com",
    notes: "ลูกค้ารายใหญ่ จ่ายเงินตรงเวลา",
    latitude: "13.7563",
    longitude: "100.5018",
    relationshipScore: 90,
  },
  {
    customerCode: "CUST-SD-002",
    customerType: CustomerType.SUBDEALER,
    name: "ร้าน เกษตรพูนผล",
    prefix: "หจก.",
    firstName: "สมศรี",
    lastName: "พูนผล",
    birthDate: new Date("1985-08-20"),
    email: "poonphon@example.com",
    phone: "089-987-6543",
    taxId: "0103566778899",
    addressLine: "456/78 หมู่ 2",
    province: "เชียงใหม่",
    region: "ภาคเหนือ",
    district: "เมืองเชียงใหม่",
    subdistrict: "ช้างเผือก",
    postalCode: "50300",
    status: CustomerStatus.ACTIVE,
    relationshipScore: 75,
    // SUBDEALER specific
    receiveFromDealer: "ร้าน โชคชัยการเกษตร",
    mainCompetitor: "ร้าน เกษตรเจริญ",
    areaCrops: "ข้าว, ลำไย",
    averageMonthlyPurchase: "500000",
    mainProductSold: ["ปุ๋ยเคมี", "ยาฆ่าแมลง"],
    brandsSold: ["ตราหัวสิงห์", "ตราพ่นรวย"],
    areaType: "ภูเขา/ที่ราบ",
  },
  {
    customerCode: "CUST-F-003",
    customerType: CustomerType.FARMER,
    name: "เกษตรกร บุญมี",
    prefix: "นาย",
    firstName: "บุญมี",
    lastName: "รักดิน",
    birthDate: new Date("1970-12-05"),
    email: "boonmee.f@example.com",
    phone: "082-345-6789",
    addressLine: "789 หมู่ 3",
    province: "สุพรรณบุรี",
    region: "ภาคกลาง",
    district: "เมืองสุพรรณบุรี",
    subdistrict: "ท่าพี่เลี้ยง",
    postalCode: "72000",
    status: CustomerStatus.ACTIVE,
    relationshipScore: 80,
    // FARMER specific
    farmPlots: [
      {
        plotName: "แปลงนาที่ 1",
        areaRai: 20,
        cropType: "ข้าว",
        harvestDate: "2024-05-01",
      },
      {
        plotName: "แปลงกล้วย",
        areaRai: 5,
        cropType: "กล้วยน้ำว้า",
        harvestDate: "2024-06-15",
      },
    ] as any,
  },
  {
    customerCode: "CUST-B-004",
    customerType: CustomerType.BROKER,
    name: "นายหน้า วิชัย",
    prefix: "นาย",
    firstName: "วิชัย",
    lastName: "นำโชค",
    birthDate: new Date("1990-03-10"),
    phone: "085-555-4444",
    addressLine: "12 หมู่ 4",
    province: "นครสวรรค์",
    region: "ภาคเหนือตอนล่าง",
    district: "เมืองนครสวรรค์",
    subdistrict: "ปากน้ำโพ",
    postalCode: "60000",
    status: CustomerStatus.ACTIVE,
    relationshipScore: 60,
    // BROKER specific
    cropTypes: "อ้อย, มันสำปะหลัง",
    currentYield: "1000 ตัน/ปี",
    farmerCount: "50 คน",
    plotCount: "100 แปลง",
    totalAreaRai: "1500 ไร่",
    harvestPerYear: "1 ครั้ง/ปี",
    creditDays: "30 วัน",
    chemicalValuePerCycle: "2,000,000 บาท",
    chemicalQtyPerCycle: "500 กระสอบ",
    regularShops: "ร้าน เกษตรพูนผล",
    serviceTypes: "โดรนพ่นยา, รถตัดอ้อย",
    usedBrands: "ตราหัวสิงห์",
  },
];

async function main() {
  console.log("Start seeding customers...");

  for (const c of customersToSeed) {
    const customer = await prisma.customer.upsert({
      where: { customerCode: c.customerCode },
      update: c,
      create: c,
    });
    console.log(
      `✅ Upserted Customer: ${customer.name} (Code: ${customer.customerCode}, Type: ${customer.customerType})`,
    );
  }

  console.log("🎉 Seeding customers finished.");
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
