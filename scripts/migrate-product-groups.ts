import { db } from "@/lib/db";
import {
  extractTradeNameGroup,
  findOrCreateTradeNameGroup,
} from "@/modules/products/infrastructure/product.repository";

interface MigrationOptions {
  dryRun?: boolean;
}

export async function runProductGroupMigration(options: MigrationOptions = { dryRun: false }) {
  const { dryRun } = options;

  console.log("================================================================");
  console.log(`📦 PRODUCT DATA MIGRATION (${dryRun ? "DRY RUN MODE" : "EXECUTE MODE"})`);
  console.log("================================================================\n");

  // 1. Fetch all products (including soft-deleted if any, but we track them)
  const allProducts = await db.product.findMany({
    select: {
      id: true,
      productCode: true,
      name: true,
      tradeNameGroupId: true,
      tradeNameGroup: { select: { id: true, code: true, description: true } },
      productGroupId: true,
      productGroup: { select: { id: true, code: true, name: true } },
      deletedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const totalProducts = allProducts.length;
  const activeProducts = allProducts.filter((p) => p.deletedAt === null).length;
  const deletedProducts = totalProducts - activeProducts;

  console.log(`📊 Total Products Found: ${totalProducts}`);
  console.log(`   - Active: ${activeProducts}`);
  console.log(`   - Deleted (soft-delete): ${deletedProducts}\n`);

  if (totalProducts === 0) {
    console.log("No products found to migrate.");
    return;
  }

  // 2. Pre-calculate changes and statistics
  console.log("🔍 Analyzing changes for each product...");
  const changes: {
    product: typeof allProducts[0];
    newTradeNameGroupName: string;
    oldTradeNameGroupName: string;
    oldProductGroupCode: string;
  }[] = [];

  for (const product of allProducts) {
    const extractedGroupName = extractTradeNameGroup(product.name);
    const oldTradeGroupName =
      product.tradeNameGroup?.description || product.tradeNameGroup?.code || "-";
    const oldProductGroupCode =
      product.productGroup ? `${product.productGroup.code} (${product.productGroup.name})` : "-";

    changes.push({
      product,
      newTradeNameGroupName: extractedGroupName,
      oldTradeNameGroupName: oldTradeGroupName,
      oldProductGroupCode,
    });
  }

  // 3. Show preview of first 10 items
  console.log("\n📋 Preview of Changes (First 10 items):");
  console.log("----------------------------------------------------------------");
  const sampleChanges = changes.slice(0, 10);
  sampleChanges.forEach((item, index) => {
    console.log(
      `[${index + 1}] Product [${item.product.productCode}]: "${item.product.name}"\n` +
      `    - กลุ่มชื่อการค้า (Trade Name Group): "${item.oldTradeNameGroupName}" ➔ "${item.newTradeNameGroupName}"\n` +
      `    - กลุ่มสินค้า (Product Group): "${item.oldProductGroupCode}" ➔ "" (null)`
    );
  });
  console.log("----------------------------------------------------------------\n");

  if (dryRun) {
    console.log("💡 [DRY RUN] No database changes were applied.");
    console.log("To execute the migration, run with --execute");
    return;
  }

  // 4. Execution
  console.log(`🚀 Starting database migration for ${totalProducts} products...`);
  let updatedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < changes.length; i++) {
    const item = changes[i];
    try {
      // Resolve or create TradeNameGroup in DB
      let newTradeNameGroupId: string | null = null;
      if (item.newTradeNameGroupName) {
        newTradeNameGroupId = await findOrCreateTradeNameGroup(item.newTradeNameGroupName);
      }

      // Update product record: ONLY productGroupId and tradeNameGroupId
      await db.product.update({
        where: { id: item.product.id },
        data: {
          productGroupId: null, // กลุ่มสินค้า = "" (null in DB)
          tradeNameGroupId: newTradeNameGroupId, // กลุ่มชื่อการค้า = คำนวณจากชื่อการค้า
        },
      });

      updatedCount++;
      if ((i + 1) % 50 === 0 || i + 1 === totalProducts) {
        console.log(`   Progress: ${i + 1}/${totalProducts} (${Math.round(((i + 1) / totalProducts) * 100)}%)`);
      }
    } catch (err) {
      console.error(`❌ Error updating product ${item.product.productCode} (${item.product.id}):`, err);
      errorCount++;
    }
  }

  console.log("\n================================================================");
  console.log(`✅ MIGRATION COMPLETED`);
  console.log(`   - Successfully updated: ${updatedCount}`);
  console.log(`   - Errors: ${errorCount}`);
  console.log("================================================================\n");

  // 5. Post-verification: inspect random sample of updated products
  console.log("🔎 Post-Migration Verification (Sample 5 records):");
  console.log("----------------------------------------------------------------");
  const verificationSamples = await db.product.findMany({
    take: 5,
    select: {
      id: true,
      productCode: true,
      name: true,
      tradeNameGroupId: true,
      tradeNameGroup: { select: { id: true, code: true, description: true } },
      productGroupId: true,
      productGroup: { select: { id: true, code: true, name: true } },
    },
  });

  verificationSamples.forEach((p, idx) => {
    const expectedGroup = extractTradeNameGroup(p.name);
    const actualGroup = p.tradeNameGroup?.description || p.tradeNameGroup?.code || "-";
    const groupMatches = expectedGroup === actualGroup;
    const productGroupIsNull = p.productGroupId === null;

    console.log(
      `[${idx + 1}] Product [${p.productCode}]: "${p.name}"\n` +
      `    - กลุ่มชื่อการค้า: "${actualGroup}" ${groupMatches ? "✅ (ตรงตามเงื่อนไข)" : "❌ (ไม่ตรง)"}\n` +
      `    - กลุ่มสินค้า: ${p.productGroupId === null ? "null / ว่าง ✅" : String(p.productGroupId) + " ❌"}`
    );
  });
  console.log("----------------------------------------------------------------\n");
}

// If invoked directly from CLI
if (require.main === module || process.argv[1]?.includes("migrate-product-groups")) {
  const isExecute = process.argv.includes("--execute");
  runProductGroupMigration({ dryRun: !isExecute })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}
