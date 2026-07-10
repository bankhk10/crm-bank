import 'dotenv/config';
import { db as prisma } from '../lib/db';

async function main() {
  const currentYear = 2026;
  const startDate = new Date(`${currentYear}-01-01T00:00:00.000Z`);
  const endDate = new Date(`${currentYear}-12-31T23:59:59.999Z`);
  const excludeDate = new Date('2026-01-01T11:27:21+07:00');

  const items = await prisma.saleItem.findMany({
    where: {
      sale: {
        deletedAt: null,
        saleDate: {
          gte: startDate,
          lte: endDate,
        },
        OR: [
          { paymentDate: { gte: excludeDate } },
          { paymentDate: null }
        ],
      },
    },
    include: {
      product: {
        include: {
          productABCType: true,
        },
      },
    },
  });

  const liveGroups: Record<string, { count: number, totalSales: number }> = {};
  const snapshotGroups: Record<string, { count: number, totalSales: number }> = {};

  for (const item of items) {
    const liveName = item.product?.productABCType?.name || 'UNKNOWN';
    const snapshotName = item.productABCTypeName || 'UNKNOWN';

    if (!liveGroups[liveName]) liveGroups[liveName] = { count: 0, totalSales: 0 };
    liveGroups[liveName].count++;
    liveGroups[liveName].totalSales += Number(item.totalPrice);

    if (!snapshotGroups[snapshotName]) snapshotGroups[snapshotName] = { count: 0, totalSales: 0 };
    snapshotGroups[snapshotName].count++;
    snapshotGroups[snapshotName].totalSales += Number(item.totalPrice);
  }

  console.log('\n--- 1. Sales Grouped by Live Product ABC Type (Master) ---');
  console.log('This is computed from current Product configuration.');
  console.table(Object.entries(liveGroups).map(([name, val]) => ({
    'ABC Type Name': name,
    'Item Count': val.count,
    'Total Sales (Baht)': val.totalSales.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  })));

  console.log('\n--- 2. Sales Grouped by SaleItem Snapshot ABC Type ---');
  console.log('This is computed from the SaleItem table snapshot (which drives the dashboards/reports).');
  console.table(Object.entries(snapshotGroups).map(([name, val]) => ({
    'ABC Type Name': name,
    'Item Count': val.count,
    'Total Sales (Baht)': val.totalSales.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  })));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
