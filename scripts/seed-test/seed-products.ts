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
    productCode: "91ABA-0180L001-CS4",
    name: "เทคนิค  : 12 x 1 ลิตร",
    commonName: "ABAMECTIN 1.8% EC ) LOT10",
    unit: "กล่อง",
    productGroup: "เทคนิค",
    brand: "Crop Science",
    packageSize: "1 L",
    packageSizePerBox: "12",
    totalPackageSizePerBox: "12 L",
    status: ProductStatus.ACTIVE,
    usedForPlants: [],
    salesPoint: null,
    properties: null,
    price: 449.0,
    cartonPrice: 5388.0,
    promotionBudget: 35.0,
    pointPerUnit: 0,
    chemicalGroup: "ABA",
  },
  {
    productCode: "9124D-8400L001-CS1 ",
    name: "พาเหรด 84 :12 x 1 ลิตร",
    commonName: "2,4-Ddimethylammonium 84%SL",
    unit: "กล่อง",
    productGroup: "พาเหรด",
    brand: "Crop Science",
    packageSize: "1 L",
    packageSizePerBox: "12",
    totalPackageSizePerBox: "12 L",
    status: ProductStatus.ACTIVE,
    usedForPlants: [],
    salesPoint: null,
    properties: null,
    price: 105.0,
    cartonPrice: 1260.0,
    promotionBudget: null,
    pointPerUnit: 0,
    chemicalGroup: "24D",
  },
  {
    productCode: "91SEW-XXXXG100-CS1 ",
    name: "สติมเท็กซ์ โกลด์: 8x(10x100 กรัม)  ",
    commonName: "Seaweed Powder",
    unit: "กล่อง",
    productGroup: "สติมเท็กซ์",
    brand: "Crop Science",
    packageSize: "100 G",
    packageSizePerBox: "80",
    totalPackageSizePerBox: "8000 G",
    status: ProductStatus.ACTIVE,
    usedForPlants: [],
    salesPoint: null,
    properties: null,
    price: 200.0,
    cartonPrice: 16000.0,
    promotionBudget: 50.0,
    pointPerUnit: 0,
    chemicalGroup: "SEW",
  },
  {
    productCode: "91PRM-2500K001-CS1",
    name: " อัคคาบัน 12x1 กิโลกรัม",
    commonName: "(Propamocarb hydrochloride 10%+metalaxyl 15% WP",
    unit: "กล่อง",
    productGroup: "อัคคาบัน",
    brand: "Crop Science",
    packageSize: "1 KG",
    packageSizePerBox: "12",
    totalPackageSizePerBox: "12 KG",
    status: ProductStatus.ACTIVE,
    usedForPlants: [],
    salesPoint: null,
    properties: null,
    price: 305.0,
    cartonPrice: 3660.0,
    promotionBudget: 10.0,
    pointPerUnit: 0,
    chemicalGroup: "FPRM",
  },
  {
    productCode: "91CAR-5000L001-CS1",
    name: "คอนซัลท์ : 12 x 1 ลิตร",
    commonName: "CARBENDAZIM 50% SC",
    unit: "กล่อง",
    productGroup: "คอนซัลท์",
    brand: "Crop Science",
    packageSize: "1 L",
    packageSizePerBox: "12",
    totalPackageSizePerBox: "12 L",
    status: ProductStatus.ACTIVE,
    usedForPlants: [],
    salesPoint: null,
    properties: null,
    price: 289.0,
    cartonPrice: 3468.0,
    promotionBudget: 20.0,
    pointPerUnit: 0,
    chemicalGroup: "CAR",
  },
  {
    productCode: "91AMN-0800L001-CS1  ",
    name: "อัลเทอร่า แมกนีเซียม ซิงค์ : 12x1 ลิตร   ",
    commonName: "Magnesium chloride4%+Zinc chloride4%",
    unit: "ลัง",
    productGroup: "อัลเทอร่า แมกซิงค์",
    brand: "Crop Science",
    packageSize: "1 L",
    packageSizePerBox: "12",
    totalPackageSizePerBox: "12 L",
    status: ProductStatus.ACTIVE,
    usedForPlants: [],
    salesPoint: null,
    properties: null,
    price: 320.0,
    cartonPrice: 3840.0,
    promotionBudget: 35.0,
    pointPerUnit: 0,
    chemicalGroup: "AMN",
  },
  {
    productCode: "91AMN-XXXXL001-CS4  ",
    name: "เทอรา-ซอร์บ 12x1 ลิตร  ",
    commonName: "AMINO",
    unit: "ลัง",
    productGroup: "เทอรา-ซอรบ์",
    brand: "Crop Science",
    packageSize: "1 L",
    packageSizePerBox: "12",
    totalPackageSizePerBox: "12 L",
    status: ProductStatus.ACTIVE,
    usedForPlants: [],
    salesPoint: null,
    properties: null,
    price: 385.0,
    cartonPrice: 4620.0,
    promotionBudget: 50.0,
    pointPerUnit: 0,
    chemicalGroup: "AMN",
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
