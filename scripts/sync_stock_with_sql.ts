import "dotenv/config";
import { db } from "@/lib/db";

async function syncStockWithSql(isDryRun = true) {
  console.log("================================================================");
  console.log(`🔄 SYNC PRODUCT STOCK WITH SQL QUERY (${isDryRun ? "DRY RUN - Preview" : "EXECUTE - Updating DB"})`);
  console.log("================================================================\n");

  const sql = `
WITH ShippedPerSaleItem AS (
    SELECT 
        si."saleItemId",
        SUM(si."quantity") AS "shippedQty"
    FROM "ShipmentItem" si
    JOIN "Shipment" sh ON si."shipmentId" = sh."id"
    WHERE sh."status" IN ('IN_TRANSIT', 'DELIVERED', 'COMPLETED')
    GROUP BY si."saleItemId"
),
ActiveOrders AS (
    SELECT 
        p."id" AS "productId",
        p."productCode",
        p."name" AS "productName",
        CASE 
            WHEN s."hasPartialDelivery" = true 
                 OR EXISTS (SELECT 1 FROM "Shipment" sh WHERE sh."saleId" = s."id" AND sh."status" != 'CANCELLED')
            THEN GREATEST(0, item."quantity" - COALESCE(shipped."shippedQty", 0))
            WHEN s."isStockDeducted" = false THEN item."quantity"
            ELSE 0
        END AS "reservedQty"
    FROM "SaleItem" item
    JOIN "Sale" s ON item."saleId" = s."id"
    JOIN "Product" p ON item."productId" = p."id"
    LEFT JOIN ShippedPerSaleItem shipped ON shipped."saleItemId" = item."id"
    WHERE s."deletedAt" IS NULL
      AND s."status" IN ('APPROVED', 'AWAITING_DELIVERY', 'PARTIALLY_DELIVERED', 'PAID')
),
AggregatedReserved AS (
    SELECT 
        "productId",
        "productCode",
        "productName",
        SUM("reservedQty")::integer AS "sqlExpectedReserved"
    FROM ActiveOrders
    GROUP BY "productId", "productCode", "productName"
)
SELECT 
    p."id" AS "productId",
    p."productCode",
    p."name" AS "productName",
    ps."physicalBalance",
    ps."reservedQuantity" AS "currentDbReserved",
    ps."availableQuantity" AS "currentDbAvailable",
    COALESCE(ar."sqlExpectedReserved", 0) AS "sqlExpectedReserved",
    (ps."physicalBalance" - COALESCE(ar."sqlExpectedReserved", 0)) AS "sqlExpectedAvailable",
    (ps."reservedQuantity" - COALESCE(ar."sqlExpectedReserved", 0)) AS "diff"
FROM "Product" p
JOIN "ProductStock" ps ON ps."productId" = p."id"
LEFT JOIN AggregatedReserved ar ON ar."productId" = p."id"
WHERE (ps."reservedQuantity" - COALESCE(ar."sqlExpectedReserved", 0)) != 0
ORDER BY ABS(ps."reservedQuantity" - COALESCE(ar."sqlExpectedReserved", 0)) DESC;
`;

  const discrepancies = (await db.$queryRawUnsafe(sql)) as Array<{
    productId: string;
    productCode: string;
    productName: string;
    physicalBalance: number;
    currentDbReserved: number;
    currentDbAvailable: number;
    sqlExpectedReserved: number;
    sqlExpectedAvailable: number;
    diff: number;
  }>;

  console.log(`Found ${discrepancies.length} products with differences between DB and SQL:\n`);

  if (discrepancies.length === 0) {
    console.log("✅ All products in ProductStock perfectly match the SQL query! No sync needed.");
    return;
  }

  const previewTable = discrepancies.map((d) => ({
    "Product Code": d.productCode,
    "Product Name": d.productName.length > 25 ? d.productName.slice(0, 25) + "..." : d.productName,
    "Physical": d.physicalBalance,
    "Current Res": d.currentDbReserved,
    "SQL Expected Res": d.sqlExpectedReserved,
    "Diff": d.diff > 0 ? `+${d.diff}` : `${d.diff}`,
    "Current Avail": d.currentDbAvailable,
    "New Avail": d.sqlExpectedAvailable,
  }));
  console.table(previewTable);

  if (isDryRun) {
    console.log("\nℹ️ [DRY RUN] No database changes made.");
    console.log("👉 To sync ProductStock with SQL query, run with: pnpm tsx scripts/sync_stock_with_sql.ts --execute\n");
    return;
  }

  console.log("\n🚀 Executing Sync in Database Transaction...");
  await db.$transaction(async (tx) => {
    const systemUser = await tx.user.findFirst({ where: { isActive: true } });

    for (const d of discrepancies) {
      await tx.productStock.update({
        where: { productId: d.productId },
        data: {
          reservedQuantity: d.sqlExpectedReserved,
          availableQuantity: d.sqlExpectedAvailable,
        },
      });

      await tx.auditLog.create({
        data: {
          module: "products",
          action: "UPDATE",
          entityType: "ProductStock",
          entityId: d.productId,
          entityName: d.productCode,
          userId: systemUser?.id,
          userName: systemUser?.name || "System SQL Sync",
          endpoint: "script:sync_stock_with_sql",
          changedFields: ["reservedQuantity", "availableQuantity"],
          oldValue: {
            reservedQuantity: d.currentDbReserved,
            availableQuantity: d.currentDbAvailable,
          },
          newValue: {
            reservedQuantity: d.sqlExpectedReserved,
            availableQuantity: d.sqlExpectedAvailable,
          },
        },
      });
    }
  });

  console.log("✅ Sync completed successfully in transaction!");
  console.log(`🎉 ${discrepancies.length} products updated to match SQL Expected Reserved exactly.\n`);
}

const isExecute = process.argv.includes("--execute");
syncStockWithSql(!isExecute)
  .catch(console.error)
  .finally(() => db.$disconnect());
