import { db } from "@/lib/db";
import { upsertProductStock } from "@/modules/products/infrastructure/stock.repository";

interface SyncOptions {
  dryRun?: boolean;
}

export async function syncProductStocks(options: SyncOptions = { dryRun: false }) {
  const { dryRun } = options;

  console.log("================================================================");
  console.log(`📦 PRODUCT STOCK SYNC (${dryRun ? "DRY RUN MODE" : "EXECUTE MODE"})`);
  console.log("================================================================\n");

  const products = await db.product.findMany({
    where: { deletedAt: null },
    include: {
      stock: true,
      stockLots: {
        where: { isUsed: false },
      },
      saleItems: {
        where: {
          sale: {
            status: "APPROVED",
            isStockDeducted: false,
            deletedAt: null,
          },
        },
        select: {
          quantity: true,
          sale: {
            select: {
              saleNumber: true,
            },
          },
        },
      },
    },
  });

  console.log(`📊 Total Active Products: ${products.length}\n`);

  let syncedCount = 0;
  let updatedCount = 0;

  for (const product of products) {
    const physicalBalance = product.stockLots.reduce(
      (sum, lot) => sum + lot.quantity,
      0,
    );

    const reservedQuantity = product.saleItems.reduce(
      (sum, item) => sum + Number(item.quantity),
      0,
    );

    const availableQuantity = physicalBalance - reservedQuantity;

    const currentStock = product.stock;
    const needsSync =
      !currentStock ||
      currentStock.physicalBalance !== physicalBalance ||
      currentStock.reservedQuantity !== reservedQuantity ||
      currentStock.availableQuantity !== availableQuantity;

    if (needsSync) {
      console.log(
        `🔹 Product: ${product.productCode} (${product.name})\n` +
          `   Before: Stock=${currentStock ? `Phys:${currentStock.physicalBalance}, Res:${currentStock.reservedQuantity}, Avail:${currentStock.availableQuantity}` : "NULL"}\n` +
          `   After : Phys:${physicalBalance}, Res:${reservedQuantity} (${product.saleItems.length} approved sales: ${product.saleItems.map((s) => `${s.sale.saleNumber}(${s.quantity})`).join(", ") || "none"}), Avail:${availableQuantity}`,
      );

      if (!dryRun) {
        await upsertProductStock(product.id, {
          physicalBalance,
          reservedQuantity,
          availableQuantity,
        });
      }
      updatedCount++;
    }

    syncedCount++;
  }

  console.log("\n================================================================");
  console.log(
    `✅ Done! Processed ${syncedCount} products. Updated ${updatedCount} products.`,
  );
  console.log("================================================================\n");
}

if (require.main === module) {
  const isDryRun = process.argv.includes("--dry-run");
  syncProductStocks({ dryRun: isDryRun })
    .catch((err) => {
      console.error("❌ Sync failed:", err);
      process.exit(1);
    })
    .finally(() => db.$disconnect());
}
