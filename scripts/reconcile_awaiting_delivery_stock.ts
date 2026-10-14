import "dotenv/config";
import { db } from "@/lib/db";
import { revertStockDeductionFromLotsUseCase } from "@/modules/products/application";

async function reconcileAwaitingDeliveryStock(isDryRun = true) {
  console.log("================================================================");
  console.log(`📦 STOCK RECONCILIATION: Awaiting Delivery Sales (${isDryRun ? "DRY RUN - Preview Only" : "EXECUTE - Updating DB"})`);
  console.log("================================================================\n");

  // 1. Fetch sales that are AWAITING_DELIVERY but have isStockDeducted = true
  const sales = await db.sale.findMany({
    where: {
      deletedAt: null,
      status: "AWAITING_DELIVERY",
      isStockDeducted: true,
      hasPartialDelivery: false,
    },
    include: {
      customer: { select: { name: true } },
      items: {
        include: {
          product: {
            include: { stock: true },
          },
        },
      },
    },
    orderBy: { saleNumber: "asc" },
  });

  console.log(`Found ${sales.length} sales in AWAITING_DELIVERY with isStockDeducted = true:\n`);

  if (sales.length === 0) {
    console.log("✅ No sales require reconciliation. Database is consistent!");
    return;
  }

  // 2. Aggregate impact per product
  interface ProductImpact {
    productId: string;
    productCode: string;
    name: string;
    currentPhysical: number;
    currentReserved: number;
    currentAvailable: number;
    restoreQuantity: number;
    salesInvolved: string[];
  }

  const productImpactMap = new Map<string, ProductImpact>();

  for (const sale of sales) {
    const deliveryDateStr = sale.deliveryDate
      ? sale.deliveryDate.toISOString().split("T")[0]
      : "No Date";
    console.log(`- Sale ${sale.saleNumber} (${sale.customer?.name || "No Customer"}) | Delivery: ${deliveryDateStr} | Items: ${sale.items.length}`);

    for (const item of sale.items) {
      const prod = item.product;
      const existing = productImpactMap.get(prod.id) || {
        productId: prod.id,
        productCode: prod.productCode,
        name: prod.name,
        currentPhysical: prod.stock?.physicalBalance ?? 0,
        currentReserved: prod.stock?.reservedQuantity ?? 0,
        currentAvailable: prod.stock?.availableQuantity ?? 0,
        restoreQuantity: 0,
        salesInvolved: [],
      };

      existing.restoreQuantity += item.quantity;
      if (!existing.salesInvolved.includes(sale.saleNumber)) {
        existing.salesInvolved.push(sale.saleNumber);
      }
      productImpactMap.set(prod.id, existing);
    }
  }

  console.log("\n📊 IMPACT SUMMARY PER PRODUCT:");
  const tableData = Array.from(productImpactMap.values()).map((p) => {
    const newReserved = p.currentReserved + p.restoreQuantity;
    const newAvailable = p.currentPhysical - newReserved;
    return {
      "Product Code": p.productCode,
      "Product Name": p.name.length > 25 ? p.name.slice(0, 25) + "..." : p.name,
      "Physical": p.currentPhysical,
      "Current Reserved": p.currentReserved,
      "Restored (+Qty)": `+${p.restoreQuantity}`,
      "New Reserved": newReserved,
      "Current Avail": p.currentAvailable,
      "New Avail": newAvailable,
      "Sales": p.salesInvolved.join(", "),
    };
  });
  console.table(tableData);

  if (isDryRun) {
    console.log("\nℹ️ [DRY RUN] No database changes were made.");
    console.log("👉 To apply these changes, run with: pnpm tsx scripts/reconcile_awaiting_delivery_stock.ts --execute\n");
    return;
  }

  // 3. Execute in Transaction
  console.log("\n🚀 Executing Reconciliation in Database Transaction...");
  await db.$transaction(async (tx) => {
    const systemUser = await tx.user.findFirst({ where: { isActive: true } });

    for (const sale of sales) {
      // Revert deduction for this sale (restores reserved in ProductStock and deletes temporary lots)
      await revertStockDeductionFromLotsUseCase(sale.id, tx);

      // Mark sale isStockDeducted = false
      await tx.sale.update({
        where: { id: sale.id },
        data: { isStockDeducted: false },
      });

      // Audit Log for Sale
      await tx.auditLog.create({
        data: {
          module: "sales",
          action: "UPDATE",
          entityType: "Sale",
          entityId: sale.id,
          entityName: sale.saleNumber,
          userId: systemUser?.id,
          userName: systemUser?.name || "System Reconciliation",
          endpoint: "script:reconcile_awaiting_delivery_stock",
          changedFields: ["isStockDeducted"],
          oldValue: { isStockDeducted: true },
          newValue: { isStockDeducted: false },
        },
      });
    }

    // Audit Log for updated products
    for (const impact of productImpactMap.values()) {
      const updatedStock = await tx.productStock.findUnique({
        where: { productId: impact.productId },
      });

      await tx.auditLog.create({
        data: {
          module: "products",
          action: "UPDATE",
          entityType: "ProductStock",
          entityId: updatedStock?.id || impact.productId,
          entityName: impact.productCode,
          userId: systemUser?.id,
          userName: systemUser?.name || "System Reconciliation",
          endpoint: "script:reconcile_awaiting_delivery_stock",
          changedFields: ["reservedQuantity", "availableQuantity"],
          oldValue: {
            reservedQuantity: impact.currentReserved,
            availableQuantity: impact.currentAvailable,
          },
          newValue: {
            reservedQuantity: updatedStock?.reservedQuantity,
            availableQuantity: updatedStock?.availableQuantity,
          },
        },
      });
    }
  });

  console.log("✅ Reconciliation completed successfully in transaction!");
  console.log(`🎉 ${sales.length} sales updated to isStockDeducted = false and stock reservations restored.\n`);
}

const isExecute = process.argv.includes("--execute");
reconcileAwaitingDeliveryStock(!isExecute)
  .catch(console.error)
  .finally(() => db.$disconnect());
