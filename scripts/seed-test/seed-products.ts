import "dotenv/config";
import { PrismaClient, ProductStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Product data to seed - using codes for lookup
const productsToSeed = [
  {
    productCode: "91AMN-0800L001-CS5",
    name: "อัลเทอร่า แมกนีเซียม ซิงค์ : 12x1 ลิตร",
    commonName: "Magnesium chloride4%+Zinc chloride4%",
    unit: "ลัง",
    brand: "Crop Science",
    status: ProductStatus.ACTIVE,
    usedForPlants: ["ข้าวฟ่าง", "งา"],
    salesPoint: "ทดสอบขาย",
    properties: "ทดสอบคุณสมบัติ",
    price: 180,
    cartonPrice: 2160,
    pointPerUnit: 5,
    promotionBudget: 0,
    // We will use codes to find these IDs in main()
    categoryCode: "ACA",
    abcTypeCode: "A",
    productGroupCode: "ACE",
    tradeNameGroupCode: "คอนซัลท์",
    packageSizeUnit: "L",
    packageSize: 1,
    packageSizePerBox: 12,
    totalPackageSizePerBox: 12,
  },
];

async function main() {
  console.log("🚀 Start seeding products from real data...");

  // 1. Fetch real data maps
  const categories = await prisma.productCategory.findMany();
  const categoryMap = new Map(categories.map(c => [c.code, c.id]));

  const abcTypes = await prisma.productABCTypes.findMany();
  const abcTypeMap = new Map(abcTypes.map(t => [t.code, t.id]));

  const tradeNameGroups = await prisma.tradeNameGroup.findMany();
  const tradeNameGroupMap = new Map(tradeNameGroups.map(g => [g.code, g.id]));

  const productGroups = await prisma.productGroup.findMany();
  const productGroupMap = new Map(productGroups.map(g => [g.code, g.id]));

  // 2. Seed Products
  console.log("Seeding Products...");
  for (const p of productsToSeed) {
    const {
      price,
      cartonPrice,
      promotionBudget,
      packageSize,
      packageSizePerBox,
      totalPackageSizePerBox,
      categoryCode,
      abcTypeCode,
      productGroupCode,
      tradeNameGroupCode,
      ...otherData
    } = p;

    const categoryId = categoryMap.get(categoryCode as string) || null;
    const productABCTypeId = abcTypeMap.get(abcTypeCode as string) || null;
    const productGroupId = productGroupMap.get(productGroupCode as string) || null;
    const tradeNameGroupId = tradeNameGroupMap.get(tradeNameGroupCode as string) || null;

    if (!categoryId) console.warn(`⚠️ Warning: Category code "${categoryCode}" not found.`);
    if (!productABCTypeId) console.warn(`⚠️ Warning: ABC Type code "${abcTypeCode}" not found.`);

    await prisma.product.upsert({
      where: { productCode: p.productCode },
      update: {
        ...otherData,
        categoryId,
        productABCTypeId,
        productGroupId,
        tradeNameGroupId,
        price: price ? (price as any) : null,
        cartonPrice: cartonPrice ? (cartonPrice as any) : null,
        promotionBudget: promotionBudget ? (promotionBudget as any) : null,
        packageSize: packageSize ? (packageSize as any) : null,
        packageSizePerBox: packageSizePerBox ? (packageSizePerBox as any) : null,
        totalPackageSizePerBox: totalPackageSizePerBox ? (totalPackageSizePerBox as any) : null,
      },
      create: {
        ...otherData,
        categoryId,
        productABCTypeId,
        productGroupId,
        tradeNameGroupId,
        price: price ? (price as any) : null,
        cartonPrice: cartonPrice ? (cartonPrice as any) : null,
        promotionBudget: promotionBudget ? (promotionBudget as any) : null,
        packageSize: packageSize ? (packageSize as any) : null,
        packageSizePerBox: packageSizePerBox ? (packageSizePerBox as any) : null,
        totalPackageSizePerBox: totalPackageSizePerBox ? (totalPackageSizePerBox as any) : null,
      },
    });
    console.log(`✅ Upserted Product: ${p.name} (${p.productCode})`);
  }

  console.log("🎉 Seeding products finished successfully.");
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
