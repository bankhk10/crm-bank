import { PrismaClient } from "@prisma/client";

export async function seedMaster(prisma: PrismaClient) {
  console.log(
    "🏢 Seeding Master Data (Companies, Departments, Units, Categories, Plants)...",
  );

  // Create companies
  await prisma.company.createMany({
    data: [
      {
        companyCode: "IC",
        shortName: "IC",
        name: "บริษัท อินเตอร์ คร็อพ จำกัด",
        addressLine: "22 ICG Building ถ.พระรามที่ 6",
        email: "info@intercrop.co.th",
        phone: "0-2271-1001",
        taxId: "0105531048113",
        province: "กรุงเทพมหานคร",
        district: "เขตพญาไท",
        subdistrict: "พญาไท",
        postalCode: "10400",
        status: "ACTIVE",
      },
      {
        companyCode: "AI",
        shortName: "AI",
        name: "บริษัท แอ็กโฟรีแพ็กซ์อินดัสตรีส์ จำกัด",
        addressLine: "828 หมู่ 4 นิคมอุตสาหกรรมบางปู ซ.13B",
        email: "info@agforepax.co.th",
        phone: "02-709-3525",
        taxId: "0115537008016",
        province: "สมุทรปราการ",
        district: "เมืองสมุทรปราการ",
        subdistrict: "แพรกษา",
        postalCode: "10280",
        status: "ACTIVE",
      },
      {
        companyCode: "UP",
        shortName: "UP",
        name: "บริษัท ยูนิพรีมา จำกัด",
        addressLine: "831 หมู่ 4 นิคมอุตสาหกรรมบางปู ซ.13B",
        email: "info@uniprema.co.th",
        phone: "02-709-6841",
        taxId: "0105547144354",
        province: "สมุทรปราการ",
        district: "เมืองสมุทรปราการ",
        subdistrict: "แพรกษา",
        postalCode: "10280",
        status: "ACTIVE",
      },
      {
        companyCode: "AM",
        shortName: "AM",
        name: "บริษัท เอแม็กซ์ อินเตอร์ จำกัด",
        addressLine: "22 ICG Building ถ.พระรามที่ 6",
        email: "info@amax-inter.co.th",
        phone: "0",
        taxId: "0105554109810",
        province: "กรุงเทพมหานคร",
        district: "เขตพญาไท",
        subdistrict: "พญาไท",
        postalCode: "10400",
        status: "ACTIVE",
      },
      {
        companyCode: "BF",
        shortName: "BF",
        name: "บริษัท บีแฟค อินเตอร์ จำกัด",
        addressLine: "22 ICG Building ถ.พระรามที่ 6",
        email: "info@bfac-inter.co.th",
        phone: "0",
        taxId: "0105554109879",
        province: "กรุงเทพมหานคร",
        district: "เขตพญาไท",
        subdistrict: "พญาไท",
        postalCode: "10400",
        status: "ACTIVE",
      },
      {
        companyCode: "CP",
        shortName: "CP",
        name: "บริษัท ซีเพช อินเตอร์ จำกัด",
        addressLine: "22 ICG Building ถ.พระรามที่ 6",
        email: "info@cpech-inter.co.th",
        phone: "0",
        taxId: "0105554109828",
        province: "กรุงเทพมหานคร",
        district: "เขตพญาไท",
        subdistrict: "พญาไท",
        postalCode: "10400",
        status: "ACTIVE",
      },
      {
        companyCode: "CS",
        shortName: "CS",
        name: "บริษัท คร็อพ ซายน์ จำกัด",
        addressLine: "22 ICG Building ถ.พระรามที่ 6",
        email: "cs@cropsciences.co.th",
        phone: "02-618-4522",
        taxId: "0105542089762",
        province: "กรุงเทพมหานคร",
        district: "เขตพญาไท",
        subdistrict: "พญาไท",
        postalCode: "10400",
        status: "ACTIVE",
      },
    ],
    skipDuplicates: true,
  });

  // Create departments
  const departments = [
    { name: "แผนกเทคโนโลยีสารสนเทศ", code: "IT" },
    { name: "แผนกบริหารงานขาย", code: "SA" },
    { name: "แผนกธุรการขาย", code: "SS" },
    { name: "แผนกการตลาด", code: "MKT" },
    { name: "แผนกพัฒนาตลาด", code: "MD" },
    { name: "แผนกบัญชี", code: "ACC" },
    { name: "แผนกทรัพยากรบุคคล", code: "HR" },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: dept,
    });
  }

  // Create Units
  await prisma.unit.createMany({
    data: [
      { code: "BOT", description: "ขวด" },
      { code: "BOX", description: "กล่อง" },
      { code: "CTN", description: "ลัง" },
      { code: "DRUM", description: "ถัง" },
      { code: "GAL", description: "แกลลอน" },
      { code: "GM", description: "กรัม" },
      { code: "INNERBOX", description: "กล่องใน" },
      { code: "JAR", description: "กระปุก" },
      { code: "KG", description: "กิโลกรัม" },
      { code: "LTR", description: "ลิตร" },
      { code: "PCS", description: "ชิ้น" },
      { code: "ROLL", description: "ม้วน" },
      { code: "SACK", description: "กระสอบ" },
      { code: "SBOX", description: "กล่องใน" },
      { code: "SET", description: "ชุด" },
      { code: "STAL", description: "ซอง" },
    ],
    skipDuplicates: true,
  });

  // Create Categories (Needed for Product Groups)
  const categories = [
    { code: "ACA", description: "Acaricide : ฆ่าไร,เห็บ" },
    { code: "FUN", description: "Fungicide : ฆ่าเชื้อรา,โรคพืช" },
    { code: "HER", description: "Herbicide : ฆ่าหญ้า" },
    { code: "INS", description: "Insecticide : ฆ่าแมลง" },
    { code: "PLA", description: "Plant Nutrient : ธาตุอาหารพืช" },
    { code: "SEA", description: "Seaweed : สาหร่ายทะเล" },
  ];

  for (const cat of categories) {
    const existing = await prisma.productCategory.findFirst({
      where: { code: cat.code },
    });
    if (!existing) {
      await prisma.productCategory.create({
        data: cat,
      });
    }
  }

  // Create Plants
  await prisma.plant.createMany({
    data: [
      { code: "RICE", name: "ข้าว", abbreviation: "RIC", group: "พืชไร่" },
      { code: "CORN", name: "ข้าวโพด", abbreviation: "CRN", group: "พืชไร่" },
      {
        code: "CASSAVA",
        name: "มันสำปะหลัง",
        abbreviation: "CAS",
        group: "พืชไร่",
      },
      { code: "SUGARCANE", name: "อ้อย", abbreviation: "SUG", group: "พืชไร่" },
      {
        code: "SOYBEAN",
        name: "ถั่วเหลือง",
        abbreviation: "SOY",
        group: "พืชไร่",
      },
      {
        code: "PEANUT",
        name: "ถั่วลิสง",
        abbreviation: "PEA",
        group: "พืชไร่",
      },
      {
        code: "SUNFLOWER",
        name: "ทานตะวัน",
        abbreviation: "SUN",
        group: "พืชไร่",
      },
      { code: "COTTON", name: "ฝ้าย", abbreviation: "COT", group: "พืชไร่" },
      { code: "SESAME", name: "งา", abbreviation: "SES", group: "พืชไร่" },
      {
        code: "SORGHUM",
        name: "ข้าวฟ่าง",
        abbreviation: "SOR",
        group: "พืชไร่",
      },
      {
        code: "MUNGBEAN",
        name: "ถั่วเขียว",
        abbreviation: "MUN",
        group: "พืชไร่",
      },
      { code: "CHILI", name: "พริก", abbreviation: "CHL", group: "พืชไร่" },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Master Data seeded.");
}
