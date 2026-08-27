import "dotenv/config";
import { db } from "@/lib/db";
import { upsertProductStock } from "@/modules/products/infrastructure/stock.repository";

async function repairStock(isDryRun = true) {
  console.log("================================================================");
  console.log(`🔧 DATA REPAIR: Product 91CHT-3000C500-CS1 (${isDryRun ? "DRY RUN" : "EXECUTE"})`);
  console.log("================================================================\n");

  const product = await db.product.findFirst({
    where: { productCode: "91CHT-3000C500-CS1" },
    include: {
      stock: true,
      stockLots: { where: { isUsed: false } },
      saleItems: {
        where: {
          sale: {
            deletedAt: null,
            status: { in: ["APPROVED", "AWAITING_DELIVERY", "PARTIALLY_DELIVERED"] },
          },
        },
        include: {
          sale: {
            include: {
              shipments: { where: { status: { not: "CANCELLED" } } },
            },
          },
          shipmentItems: {
            include: {
              shipment: true,
            },
          },
        },
      },
    },
  });

  if (!product) {
    throw new Error("Product 91CHT-3000C500-CS1 not found");
  }

  const currentStock = product.stock;
  const currentPhysical = currentStock?.physicalBalance ?? 0;
  const currentReserved = currentStock?.reservedQuantity ?? 0;
  const currentAvailable = currentStock?.availableQuantity ?? 0;

  // Compute Expected Physical
  const expectedPhysical = product.stockLots.reduce((sum, lot) => sum + lot.quantity, 0);

  // Compute Expected Reserved
  let expectedReserved = 0;
  for (const item of product.saleItems) {
    const sale = item.sale;
    const isSplit = sale.hasPartialDelivery || sale.shipments.length > 0;
    if (isSplit) {
      const shippedItems = item.shipmentItems.filter((si) =>
        ["IN_TRANSIT", "DELIVERED", "COMPLETED"].includes(si.shipment.status),
      );
      const shippedQty = shippedItems.reduce((sum, si) => sum + si.quantity, 0);
      const rem = Math.max(0, item.quantity - shippedQty);
      expectedReserved += rem;
    } else {
      if (!sale.isStockDeducted) {
        expectedReserved += item.quantity;
      }
    }
  }

  const expectedAvailable = expectedPhysical - expectedReserved;

  console.log("📊 RECONCILIATION SUMMARY FOR 91CHT-3000C500-CS1:");
  console.log(`1. Expected Reserved  : ${expectedReserved}`);
  console.log(`2. Current Reserved   : ${currentReserved}`);
  console.log(`3. Expected Available : ${expectedAvailable}`);
  console.log(`4. Current Available  : ${currentAvailable}`);
  console.log(`5. Difference         : Reserved Diff = ${currentReserved - expectedReserved} (${currentReserved} -> ${expectedReserved}), Available Diff = ${currentAvailable - expectedAvailable} (${currentAvailable} -> ${expectedAvailable})`);
  console.log(`   Physical Balance   : ${currentPhysical} (Expected: ${expectedPhysical})`);

  if (!isDryRun) {
    console.log("\n🚀 Executing Transactional Repair...");
    await db.$transaction(async (tx) => {
      // Fetch system user for audit log
      const systemUser = await tx.user.findFirst({ where: { isActive: true } });

      const beforeState = {
        physicalBalance: currentPhysical,
        reservedQuantity: currentReserved,
        availableQuantity: currentAvailable,
      };

      const updated = await upsertProductStock(
        product.id,
        {
          physicalBalance: expectedPhysical,
          reservedQuantity: expectedReserved,
          availableQuantity: expectedAvailable,
        },
        tx,
      );

      const afterState = {
        physicalBalance: updated.physicalBalance,
        reservedQuantity: updated.reservedQuantity,
        availableQuantity: updated.availableQuantity,
      };

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          module: "products",
          action: "UPDATE",
          entityType: "ProductStock",
          entityId: updated.id,
          entityName: product.productCode,
          userId: systemUser?.id,
          userName: systemUser?.name || "System Admin",
          endpoint: "script:repair_product_stock_91CHT",
          changedFields: ["reservedQuantity", "availableQuantity"],
          oldValue: beforeState,
          newValue: afterState,
        },
      });
    });

    console.log("✅ Repair completed successfully in transaction!");
  } else {
    console.log("\nℹ️ Dry run complete. No database changes were made.");
  }
}

const isExecute = process.argv.includes("--execute");
repairStock(!isExecute).catch(console.error).finally(() => db.$disconnect());
