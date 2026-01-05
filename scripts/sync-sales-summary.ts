import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Sales Summary Sync...");

  // ใช้ Raw Query เพื่อประสิทธิภาพในการ Aggregate ข้อมูลจำนวนมาก
  // และเพื่อดึงข้อมูลข้ามตาราง (Sale -> SaleItem -> Product) ในครั้งเดียว
  const summaries = (await prisma.$queryRaw`
    SELECT 
      DATE(s."saleDate") as date,
      CAST(EXTRACT(YEAR FROM s."saleDate") AS INTEGER) as year,
      CAST(EXTRACT(MONTH FROM s."saleDate") AS INTEGER) as month,
      s."customerId",
      s."employeeId",
      si."productId",
      p."brand",
      p."productGroup",
      SUM(si."quantity") as quantity,
      SUM(si."totalPrice") as "totalAmount",
      COUNT(DISTINCT s."id") as "orderCount"
    FROM "SaleItem" si
    JOIN "Sale" s ON si."saleId" = s."id"
    JOIN "Product" p ON si."productId" = p."id"
    WHERE s."status" = 'COMPLETED' 
      AND s."deletedAt" IS NULL
    GROUP BY 
      DATE(s."saleDate"), 
      EXTRACT(YEAR FROM s."saleDate"), 
      EXTRACT(MONTH FROM s."saleDate"),
      s."customerId",
      s."employeeId",
      si."productId",
      p."brand",
      p."productGroup"
  `) as any[];

  console.log(`Found ${summaries.length} summary groups. Updating database...`);

  let count = 0;
  for (const summary of summaries) {
    // Upsert เพื่อรองรับทั้งการสร้างใหม่และการอัปเดตยอดเดิม
    await prisma.dailySalesSummary.upsert({
      where: {
        date_customerId_employeeId_productId: {
          date: new Date(summary.date),
          customerId: summary.customerId,
          employeeId: summary.employeeId,
          productId: summary.productId,
        },
      },
      update: {
        quantity: Number(summary.quantity),
        totalAmount: Number(summary.totalAmount),
        orderCount: Number(summary.orderCount),
        brand: summary.brand,
        productGroup: summary.productGroup,
        // Update updated time
        updatedAt: new Date(),
      },
      create: {
        date: new Date(summary.date),
        year: summary.year,
        month: summary.month,
        customerId: summary.customerId,
        employeeId: summary.employeeId,
        productId: summary.productId,
        quantity: Number(summary.quantity),
        totalAmount: Number(summary.totalAmount),
        orderCount: Number(summary.orderCount),
        brand: summary.brand,
        productGroup: summary.productGroup,
      },
    });

    count++;
    if (count % 100 === 0) {
      console.log(`Processed ${count} records...`);
    }
  }

  console.log(`Sync completed successfully. Total processed: ${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
