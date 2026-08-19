import { db } from "@/lib/db";

interface SyncOptions {
  dryRun?: boolean;
}

export async function syncSaleItemsSnapshot(options: SyncOptions = { dryRun: false }) {
  const { dryRun } = options;

  console.log("================================================================");
  console.log(`🧾 SALE ITEMS SNAPSHOT SYNC (${dryRun ? "DRY RUN MODE" : "EXECUTE MODE"})`);
  console.log("================================================================\n");

  const totalSaleItems = await db.saleItem.count();
  console.log(`📊 Total SaleItem records: ${totalSaleItems}\n`);

  if (totalSaleItems === 0) {
    console.log("No SaleItem records found.");
    return;
  }

  // Fetch all products map
  const products = await db.product.findMany({
    select: {
      id: true,
      tradeNameGroupId: true,
      tradeNameGroup: { select: { id: true, description: true } },
      productGroupId: true,
    },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  if (dryRun) {
    console.log("🔍 Sample 5 SaleItem snapshots that will be updated:");
    console.log("----------------------------------------------------------------");
    const sampleItems = await db.saleItem.findMany({
      take: 5,
      select: {
        id: true,
        productId: true,
        name: true,
        tradeNameGroupId: true,
        tradeNameGroupName: true,
        productGroupId: true,
        productGroupName: true,
      },
    });

    sampleItems.forEach((item, idx) => {
      const prod = productMap.get(item.productId);
      console.log(
        `[${idx + 1}] SaleItem [${item.id}] - "${item.name}":\n` +
        `    - กลุ่มชื่อการค้า: "${item.tradeNameGroupName || item.tradeNameGroupId || "-"}" ➔ "${prod?.tradeNameGroup?.description || "-"}"\n` +
        `    - กลุ่มสินค้า: "${item.productGroupName || item.productGroupId || "-"}" ➔ null / ว่าง`
      );
    });
    console.log("----------------------------------------------------------------\n");
    console.log("💡 [DRY RUN] No database changes were applied.");
    console.log("To execute the sync, run with --execute");
    return;
  }

  console.log(`🚀 Syncing snapshots for ${totalSaleItems} SaleItem records...`);

  // Batch update sale items based on their product
  let updatedCount = 0;
  for (const product of products) {
    const res = await db.saleItem.updateMany({
      where: { productId: product.id },
      data: {
        productGroupId: null,
        productGroupName: null,
        tradeNameGroupId: product.tradeNameGroupId,
        tradeNameGroupName: product.tradeNameGroup?.description || null,
      },
    });
    updatedCount += res.count;
  }

  console.log("\n================================================================");
  console.log(`✅ SALE ITEMS SYNC COMPLETED`);
  console.log(`   - Total records updated: ${updatedCount}`);
  console.log("================================================================\n");
}

if (require.main === module || process.argv[1]?.includes("sync-sale-items-snapshot")) {
  const isExecute = process.argv.includes("--execute");
  syncSaleItemsSnapshot({ dryRun: !isExecute })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Sync failed:", err);
      process.exit(1);
    });
}
