import { db as prisma } from '../lib/db';

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(`Starting sync... Mode: ${isDryRun ? 'DRY RUN (No database writes)' : 'LIVE UPDATE'}`);

  const currentYear = new Date().getFullYear(); // 2026
  const startDate = new Date(`${currentYear}-01-01T00:00:00.000Z`);
  const endDate = new Date(`${currentYear}-12-31T23:59:59.999Z`);

  console.log(`Target saleDate range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

  // Find all SaleItems belonging to non-deleted sales in the current year
  const items = await prisma.saleItem.findMany({
    where: {
      sale: {
        deletedAt: null,
        saleDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    },
    include: {
      product: {
        include: {
          category: true,
          productABCType: true,
          productGroup: true,
          tradeNameGroup: true,
        },
      },
    },
  });

  console.log(`Found ${items.length} SaleItems within the specified scope.`);

  let updateCount = 0;
  let skipCount = 0;

  for (const item of items) {
    if (!item.product) {
      skipCount++;
      continue;
    }

    const product = item.product;

    // Extract current product details
    const newBrand = product.brand;
    const newCommonName = product.commonName;
    const newName = product.name;
    const newProductABCTypeId = product.productABCTypeId;
    const newTradeNameGroupId = product.tradeNameGroupId;
    const newCategoryId = product.categoryId;
    const newCategoryName = product.category?.description ?? null;
    const newProductABCTypeName = product.productABCType?.name ?? null;
    const newProductGroupId = product.productGroupId;
    const newProductGroupName = product.productGroup?.name ?? null;

    // Check if any field differs from what's currently stored
    const hasChanges =
      item.brand !== newBrand ||
      item.commonName !== newCommonName ||
      item.name !== newName ||
      item.productABCTypeId !== newProductABCTypeId ||
      item.tradeNameGroupId !== newTradeNameGroupId ||
      item.categoryId !== newCategoryId ||
      item.categoryName !== newCategoryName ||
      item.productABCTypeName !== newProductABCTypeName ||
      item.productGroupId !== newProductGroupId ||
      item.productGroupName !== newProductGroupName;

    if (!hasChanges) {
      skipCount++;
      continue;
    }

    if (isDryRun) {
      console.log(`[DRY RUN] Would update SaleItem ID: ${item.id} (Product: ${product.productCode})`);
      console.log(`  - brand: "${item.brand}" -> "${newBrand}"`);
      console.log(`  - commonName: "${item.commonName}" -> "${newCommonName}"`);
      console.log(`  - name: "${item.name}" -> "${newName}"`);
      console.log(`  - productABCTypeId: "${item.productABCTypeId}" -> "${newProductABCTypeId}"`);
      console.log(`  - tradeNameGroupId: "${item.tradeNameGroupId}" -> "${newTradeNameGroupId}"`);
      console.log(`  - categoryId: "${item.categoryId}" -> "${newCategoryId}"`);
      console.log(`  - categoryName: "${item.categoryName}" -> "${newCategoryName}"`);
      console.log(`  - productABCTypeName: "${item.productABCTypeName}" -> "${newProductABCTypeName}"`);
      console.log(`  - productGroupId: "${item.productGroupId}" -> "${newProductGroupId}"`);
      console.log(`  - productGroupName: "${item.productGroupName}" -> "${newProductGroupName}"`);
    } else {
      await prisma.saleItem.update({
        where: { id: item.id },
        data: {
          brand: newBrand,
          commonName: newCommonName,
          name: newName,
          productABCTypeId: newProductABCTypeId,
          tradeNameGroupId: newTradeNameGroupId,
          categoryId: newCategoryId,
          categoryName: newCategoryName,
          productABCTypeName: newProductABCTypeName,
          productGroupId: newProductGroupId,
          productGroupName: newProductGroupName,
        },
      });
    }
    updateCount++;
  }

  console.log(`\nSync Completed!`);
  console.log(`Total processed items: ${items.length}`);
  console.log(`Updated items: ${updateCount}`);
  console.log(`Skipped items (no change/no product): ${skipCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
