import { db as prisma } from '../lib/db';

async function main() {
  console.log('Starting backfill for SaleItem...');
  const items = await prisma.saleItem.findMany({
    include: { product: true }
  });

  console.log(`Found ${items.length} SaleItems. Updating...`);

  let count = 0;
  for (const item of items) {
    if (item.product) {
      await prisma.saleItem.update({
        where: { id: item.id },
        data: {
          productABCTypeId: item.product.productABCTypeId,
          tradeNameGroupId: item.product.tradeNameGroupId,
        }
      });
      count++;
      if (count % 100 === 0) {
        console.log(`Updated ${count} items...`);
      }
    }
  }

  console.log(`Finished updating ${count} SaleItems.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
