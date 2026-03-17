import { db as prisma } from "@/lib/db";
import { Prisma } from "@/lib/db";

export async function syncSalesSummary(targetDate?: Date) {
  console.log("Starting Sales Summary Sync...");
  if (targetDate) {
    console.log(`Targeting date: ${targetDate.toISOString().split("T")[0]}`);
  }

  // Use raw query for aggregation
  // We need to construct the WHERE clause dynamically based on targetDate
  let query = Prisma.sql`
    SELECT 
      DATE(s."saleDate") as date,
      CAST(EXTRACT(YEAR FROM s."saleDate") AS INTEGER) as year,
      CAST(EXTRACT(MONTH FROM s."saleDate") AS INTEGER) as month,
      s."customerId",
      s."employeeId",
      si."productId",
      p."brand",
      p."productGroupId",
      p."tradeNameGroupId",
      SUM(si."quantity") as quantity,
      SUM(si."totalPrice") as "totalAmount",
      COUNT(DISTINCT s."id") as "orderCount"
    FROM "SaleItem" si
    JOIN "Sale" s ON si."saleId" = s."id"
    JOIN "Product" p ON si."productId" = p."id"
    WHERE s."status" = 'COMPLETED' 
      AND s."deletedAt" IS NULL
  `;

  if (targetDate) {
    // Add date filter
    // Note: This relies on PostgreSQL specific date functions
    const dateStr = targetDate.toISOString().split("T")[0];
    query = Prisma.sql`
      SELECT 
        DATE(s."saleDate") as date,
        CAST(EXTRACT(YEAR FROM s."saleDate") AS INTEGER) as year,
        CAST(EXTRACT(MONTH FROM s."saleDate") AS INTEGER) as month,
        s."customerId",
        s."employeeId",
        si."productId",
        p."brand",
        p."productGroupId",
        p."tradeNameGroupId",
        SUM(si."quantity") as quantity,
        SUM(si."totalPrice") as "totalAmount",
        COUNT(DISTINCT s."id") as "orderCount"
      FROM "SaleItem" si
      JOIN "Sale" s ON si."saleId" = s."id"
      JOIN "Product" p ON si."productId" = p."id"
      WHERE s."status" = 'COMPLETED' 
        AND s."deletedAt" IS NULL
        AND DATE(s."saleDate") = DATE(${dateStr})
      GROUP BY 
        DATE(s."saleDate"), 
        EXTRACT(YEAR FROM s."saleDate"), 
        EXTRACT(MONTH FROM s."saleDate"),
        s."customerId",
        s."employeeId",
        si."productId",
        p."brand",
        p."productGroupId",
        p."tradeNameGroupId"
    `;
  } else {
    query = Prisma.sql`
      SELECT 
        DATE(s."saleDate") as date,
        CAST(EXTRACT(YEAR FROM s."saleDate") AS INTEGER) as year,
        CAST(EXTRACT(MONTH FROM s."saleDate") AS INTEGER) as month,
        s."customerId",
        s."employeeId",
        si."productId",
        p."brand",
        p."productGroupId",
        p."tradeNameGroupId",
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
        p."productGroupId",
        p."tradeNameGroupId"
    `;
  }

  const summaries = (await prisma.$queryRaw(query)) as any[];

  console.log(`Found ${summaries.length} summary groups. Updating database...`);

  let count = 0;
  for (const summary of summaries) {
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
        productGroupId: summary.productGroupId,
        tradeNameGroupId: summary.tradeNameGroupId,
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
        productGroupId: summary.productGroupId,
        tradeNameGroupId: summary.tradeNameGroupId,
      },
    });

    count++;
  }

  console.log(`Sync completed. Processed: ${count}`);
}
