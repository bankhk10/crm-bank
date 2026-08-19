import { db } from "@/lib/db";

interface SyncOptions {
  dryRun?: boolean;
}

export async function syncSaleItemNames(options: SyncOptions = { dryRun: false }) {
  const { dryRun } = options;

  console.log("================================================================");
  console.log(`🔄 SYNC PRODUCT DATA TO SALE ITEMS (${dryRun ? "DRY RUN MODE" : "EXECUTE MODE"})`);
  console.log("================================================================\n");

  // 1. Fetch all products
  const products = await db.product.findMany({
    select: {
      id: true,
      productCode: true,
      name: true,
      commonName: true,
      unit: true,
      packageSize: true,
      packageSizeUnit: true,
      packageSizePerBox: true,
      totalPackageSizePerBox: true,
      tradeNameGroupId: true,
      tradeNameGroup: { select: { id: true, description: true } },
    },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  // 2. Fetch all SaleItems
  const saleItems = await db.saleItem.findMany({
    select: {
      id: true,
      productId: true,
      name: true,
      productCode: true,
      commonName: true,
      unit: true,
      packageSize: true,
      packageSizeUnit: true,
      packageSizePerBox: true,
      totalPackageSizePerBox: true,
      tradeNameGroupId: true,
      tradeNameGroupName: true,
      productGroupId: true,
      productGroupName: true,
    },
  });

  const totalSaleItems = saleItems.length;
  console.log(`📊 Total SaleItem records: ${totalSaleItems}`);

  const toStr = (v: any) => (v !== null && v !== undefined ? String(Number(v)) : "");
  const toRawStr = (v: any) => (v !== null && v !== undefined ? String(v).trim() : "");

  // 3. Find SaleItems where any fields differ from current Product
  const itemsToUpdate: {
    item: typeof saleItems[0];
    product: typeof products[0];
    diffs: string[];
  }[] = [];

  for (const item of saleItems) {
    const prod = productMap.get(item.productId);
    if (!prod) continue;

    const diffs: string[] = [];

    if (toRawStr(item.name) !== toRawStr(prod.name)) {
      diffs.push(`name: "${item.name}" ➔ "${prod.name}"`);
    }
    if (toRawStr(item.unit) !== toRawStr(prod.unit)) {
      diffs.push(`unit: "${item.unit}" ➔ "${prod.unit}"`);
    }
    if (toRawStr(item.packageSizeUnit) !== toRawStr(prod.packageSizeUnit)) {
      diffs.push(`packageSizeUnit: "${item.packageSizeUnit}" ➔ "${prod.packageSizeUnit}"`);
    }
    if (toStr(item.packageSize) !== toStr(prod.packageSize)) {
      diffs.push(`packageSize: "${item.packageSize}" ➔ "${prod.packageSize}"`);
    }
    if (toStr(item.packageSizePerBox) !== toStr(prod.packageSizePerBox)) {
      diffs.push(`packageSizePerBox: "${item.packageSizePerBox}" ➔ "${prod.packageSizePerBox}"`);
    }
    if (toStr(item.totalPackageSizePerBox) !== toStr(prod.totalPackageSizePerBox)) {
      diffs.push(`totalPackageSizePerBox: "${item.totalPackageSizePerBox}" ➔ "${prod.totalPackageSizePerBox}"`);
    }
    if (item.productGroupId !== null || item.productGroupName !== null) {
      diffs.push(`productGroup: "${item.productGroupName || item.productGroupId}" ➔ null / ว่าง`);
    }
    if (
      item.tradeNameGroupId !== prod.tradeNameGroupId ||
      item.tradeNameGroupName !== (prod.tradeNameGroup?.description || null)
    ) {
      diffs.push(
        `tradeNameGroup: "${item.tradeNameGroupName || item.tradeNameGroupId || "-"}" ➔ "${prod.tradeNameGroup?.description || "-"}"`
      );
    }

    if (diffs.length > 0) {
      itemsToUpdate.push({ item, product: prod, diffs });
    }
  }

  console.log(`🔍 SaleItem records with differences: ${itemsToUpdate.length}\n`);

  if (itemsToUpdate.length > 0) {
    console.log("📋 Preview of changes (First 10 items):");
    console.log("----------------------------------------------------------------");
    itemsToUpdate.slice(0, 10).forEach((entry, idx) => {
      console.log(`[${idx + 1}] Product [${entry.product.productCode}]: "${entry.product.name}"`);
      entry.diffs.forEach((d) => console.log(`    - ${d}`));
    });
    console.log("----------------------------------------------------------------\n");
  } else {
    console.log("✅ All SaleItem records already match Product details.");
    if (!dryRun) return;
  }

  if (dryRun) {
    console.log(`💡 [DRY RUN] ${itemsToUpdate.length} SaleItem records would be updated.`);
    console.log("To execute the update, run with --execute\n");
    return;
  }

  // 4. Execute update
  console.log(`🚀 Updating SaleItem records to match current Product details...`);
  let updatedSaleItemsCount = 0;
  let updatedProductsCount = 0;

  for (const product of products) {
    const result = await db.saleItem.updateMany({
      where: {
        productId: product.id,
      },
      data: {
        name: product.name,
        productCode: product.productCode,
        commonName: product.commonName,
        unit: product.unit,
        packageSize: product.packageSize,
        packageSizeUnit: product.packageSizeUnit,
        packageSizePerBox: product.packageSizePerBox,
        totalPackageSizePerBox: product.totalPackageSizePerBox,
        tradeNameGroupId: product.tradeNameGroupId,
        tradeNameGroupName: product.tradeNameGroup?.description || null,
        productGroupId: null,
        productGroupName: null,
      },
    });

    if (result.count > 0) {
      updatedSaleItemsCount += result.count;
      updatedProductsCount++;
    }
  }

  console.log("\n================================================================");
  console.log(`✅ SYNC COMPLETED`);
  console.log(`   - Products processed: ${updatedProductsCount}`);
  console.log(`   - Total SaleItem records updated: ${updatedSaleItemsCount}`);
  console.log("================================================================\n");

  // 5. Post-verification
  console.log("🔎 Post-Verification Check:");
  const remainingSaleItems = await db.saleItem.findMany({
    select: {
      id: true,
      productId: true,
      name: true,
      unit: true,
      packageSize: true,
      packageSizeUnit: true,
      packageSizePerBox: true,
      totalPackageSizePerBox: true,
      product: {
        select: {
          name: true,
          unit: true,
          packageSize: true,
          packageSizeUnit: true,
          packageSizePerBox: true,
          totalPackageSizePerBox: true,
        },
      },
    },
  });

  const remainingMismatches = remainingSaleItems.filter((item) => {
    if (!item.product) return false;
    return (
      toRawStr(item.name) !== toRawStr(item.product.name) ||
      toRawStr(item.unit) !== toRawStr(item.product.unit) ||
      toRawStr(item.packageSizeUnit) !== toRawStr(item.product.packageSizeUnit) ||
      toStr(item.packageSize) !== toStr(item.product.packageSize) ||
      toStr(item.packageSizePerBox) !== toStr(item.product.packageSizePerBox) ||
      toStr(item.totalPackageSizePerBox) !== toStr(item.product.totalPackageSizePerBox)
    );
  });

  console.log(`   - Remaining mismatches: ${remainingMismatches.length}`);

  if (remainingMismatches.length === 0) {
    console.log("🎉 All SaleItem records are now 100% in sync with Product details (name, unit, package sizes)!");
  }
}

if (require.main === module || process.argv[1]?.includes("sync-sale-item-names")) {
  const isExecute = process.argv.includes("--execute");
  syncSaleItemNames({ dryRun: !isExecute })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Sync failed:", err);
      process.exit(1);
    });
}
