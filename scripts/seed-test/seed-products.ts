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
    id: "cmlfxbelg000k01oimv7moefo",
    productCode: "91ABA-0180L001-CS4",
    name: "เทคนิค  : 12 x 1 ลิตร",
    commonName: "ABAMECTIN 1.8% EC ) LOT10",
    unit: "กล่อง",
    tradeNameGroupCode: "เทคนิค",
    brand: "Crop Science",
    packageSize: "1",
    packageSizePerBox: "12",
    totalPackageSizePerBox: "12",
    status: ProductStatus.ACTIVE,
    usedForPlants: [],
    salesPoint: null,
    properties: null,
    price: 449.0,
    cartonPrice: 5388.0,
    promotionBudget: 35.0,
    pointPerUnit: 0,
    categoryId: null,
    productABCTypeId: null,
    productGroupCode: "ABA",
    packageSizeUnit: "L",
  },
  {
    id: "cmlfxt214000l01oil0vibhy2",
    productCode: "9124D-8400L001-CS1 ",
    name: "พาเหรด 84 :12 x 1 ลิตร",
    commonName: "2,4-Ddimethylammonium 84%SL",
    unit: "กล่อง",
    tradeNameGroupCode: "พาเหรด",
    brand: "Crop Science",
    packageSize: "1",
    packageSizePerBox: "12",
    totalPackageSizePerBox: "12",
    status: ProductStatus.ACTIVE,
    usedForPlants: [],
    salesPoint: null,
    properties: null,
    price: 105.0,
    cartonPrice: 1260.0,
    promotionBudget: null,
    pointPerUnit: 0,
    categoryId: null,
    productABCTypeId: null,
    productGroupCode: "24D",
    packageSizeUnit: "L",
  },
  {
    id: "cmlfwyncb000e01oitnj78yvm",
    productCode: "91SEW-XXXXG100-CS1 ",
    name: "สติมเท็กซ์ โกลด์: 8x(10x100 กรัม)  ",
    commonName: "Seaweed Powder",
    unit: "กล่อง",
    tradeNameGroupCode: "สติมเท็กซ์",
    brand: "Crop Science",
    packageSize: "100",
    packageSizePerBox: "80",
    totalPackageSizePerBox: "8000",
    status: ProductStatus.ACTIVE,
    usedForPlants: [],
    salesPoint: null,
    properties: null,
    price: 200.0,
    cartonPrice: 16000.0,
    promotionBudget: 50.0,
    pointPerUnit: 0,
    categoryId: null,
    productABCTypeId: null,
    productGroupCode: "SEW",
    packageSizeUnit: "G",
  },
  {
    id: "cmlg1m6ab001z01oifsqhi9ek",
    productCode: "91PRM-2500K001-CS1",
    name: " อัคคาบัน 12x1 กิโลกรัม",
    commonName: "(Propamocarb hydrochloride 10%+metalaxyl 15% WP",
    unit: "กล่อง",
    tradeNameGroupCode: "อัคคาบัน",
    brand: "Crop Science",
    packageSize: "1",
    packageSizePerBox: "12",
    totalPackageSizePerBox: "12",
    status: ProductStatus.ACTIVE,
    usedForPlants: [],
    salesPoint: null,
    properties: null,
    price: 305.0,
    cartonPrice: 3660.0,
    promotionBudget: 10.0,
    pointPerUnit: 0,
    categoryId: null,
    productABCTypeId: null,
    productGroupCode: "FPRM",
    packageSizeUnit: "KG",
  },
  {
    id: "cmlg1hp36001v01oi888bbarv",
    productCode: "91CAR-5000L001-CS1",
    name: "คอนซัลท์ : 12 x 1 ลิตร",
    commonName: "CARBENDAZIM 50% SC",
    unit: "กล่อง",
    tradeNameGroupCode: "คอนซัลท์",
    brand: "Crop Science",
    packageSize: "1",
    packageSizePerBox: "12",
    totalPackageSizePerBox: "12",
    status: ProductStatus.ACTIVE,
    usedForPlants: [],
    salesPoint: null,
    properties: null,
    price: 289.0,
    cartonPrice: 3468.0,
    promotionBudget: 20.0,
    pointPerUnit: 0,
    categoryId: null,
    productABCTypeId: null,
    productGroupCode: "CAR",
    packageSizeUnit: "L",
  },
  {
    id: "cmlrk7ei9000u01ql0mdrydvo",
    productCode: "91AMN-0800L001-CS1  ",
    name: "อัลเทอร่า แมกนีเซียม ซิงค์ : 12x1 ลิตร   ",
    commonName: "Magnesium chloride4%+Zinc chloride4%",
    unit: "ลัง",
    tradeNameGroupCode: "อัลเทอร่า แมกซิงค์",
    brand: "Crop Science",
    packageSize: "1",
    packageSizePerBox: "12",
    totalPackageSizePerBox: "12",
    status: ProductStatus.ACTIVE,
    usedForPlants: [],
    salesPoint: null,
    properties: null,
    price: 320.0,
    cartonPrice: 3840.0,
    promotionBudget: 35.0,
    pointPerUnit: 0,
    categoryId: null,
    productABCTypeId: null,
    productGroupCode: "AMN",
    packageSizeUnit: "L",
  },
  {
    id: "cmlrkfapo000z01qly7f1t669",
    productCode: "91AMN-XXXXL001-CS4  ",
    name: "เทอรา-ซอร์บ 12x1 ลิตร  ",
    commonName: "AMINO",
    unit: "ลัง",
    tradeNameGroupCode: "เทอรา-ซอรบ์",
    brand: "Crop Science",
    packageSize: "1",
    packageSizePerBox: "12",
    totalPackageSizePerBox: "12",
    status: ProductStatus.ACTIVE,
    usedForPlants: [],
    salesPoint: null,
    properties: null,
    price: 385.0,
    cartonPrice: 4620.0,
    promotionBudget: 50.0,
    pointPerUnit: 0,
    categoryId: null,
    productABCTypeId: null,
    productGroupCode: "AMN",
    packageSizeUnit: "L",
  },
];

async function main() {
  console.log("Start seeding products...");

  // Cache groups to avoid multiple lookups
  const tradeNameGroups = await prisma.tradeNameGroup.findMany();
  const productGroups = await prisma.productGroup.findMany();

  for (const p of productsToSeed) {
    const tradeNameGroup = tradeNameGroups.find(g => g.code === p.tradeNameGroupCode);
    const productGroup = productGroups.find(g => g.code === p.productGroupCode);

    const { tradeNameGroupCode, productGroupCode, ...rest } = p;

    const data: any = {
      ...rest,
      tradeNameGroupId: tradeNameGroup?.id,
      productGroupId: productGroup?.id,
    };

    const product = await prisma.product.upsert({
      where: { productCode: p.productCode },
      update: data,
      create: data,
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
