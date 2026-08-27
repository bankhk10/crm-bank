/**
 * Stock Management Use Cases
 * Business logic for stock management
 */

import { db as prisma } from "@/lib/db";
import type { Prisma } from "@/lib/db";
import type {
  StockAllocationResult,
  BackorderItem,
  LotAllocation,
} from "../types/stock";
import * as StockRepository from "../infrastructure/stock.repository";

/**
 * Use case: Reserves stock for a sale on approval.
 */
export async function allocateStockUseCase(
  saleId: string,
  tx?: Prisma.TransactionClient,
): Promise<StockAllocationResult> {
  const db = tx || prisma;

  const sale = await db.sale.findUnique({
    where: { id: saleId },
    include: {
      items: {
        include: {
          product: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (!sale) {
    throw new Error("Sale not found");
  }

  const backorders: BackorderItem[] = [];

  const allocate = async (client: Prisma.TransactionClient) => {
    for (const item of sale.items) {
      const requestedQty = item.quantity;

      const lots = await StockRepository.getAvailableLots(
        item.productId,
        client,
      );

      const totalAvailable = lots.reduce((sum, lot) => sum + lot.quantity, 0);

      const canReserve = Math.min(totalAvailable, requestedQty);
      const backorderQty = Math.max(0, requestedQty - totalAvailable);

      if (backorderQty > 0) {
        backorders.push({
          productId: item.productId,
          productName: (item as any).product?.name,
          requested: item.quantity,
          allocated: canReserve,
          backorder: backorderQty,
        });
      }

      if (requestedQty > 0) {
        await StockRepository.upsertProductStock(
          item.productId,
          {
            availableQuantityIncrement: -requestedQty,
            reservedQuantityIncrement: requestedQty,
          },
          client,
        );
      }
    }
  };

  if (tx) {
    await allocate(tx);
  } else {
    await prisma.$transaction(async (client) => {
      await allocate(client);
    });
  }

  return {
    success: true,
    backorders,
  };
}

/**
 * Use case: Releases stock for a sale (e.g., cancellation or status revert).
 */
export async function releaseStockUseCase(
  saleId: string,
  tx?: Prisma.TransactionClient,
) {
  const db = tx || prisma;

  const sale = await db.sale.findUnique({
    where: { id: saleId },
    include: {
      items: {
        include: {
          shipmentItems: {
            include: {
              shipment: true,
            },
          },
        },
      },
      shipments: {
        where: { status: { not: "CANCELLED" } },
      },
    },
  });

  if (!sale) {
    throw new Error("Sale not found");
  }

  const release = async (client: Prisma.TransactionClient) => {
    // Delete any allocated sale item lots
    try {
      await StockRepository.deleteSaleItemLots(saleId, client);
    } catch (e) {
      console.warn("Could not delete lots during releaseStockUseCase", e);
    }

    const isSplitShipmentSale =
      sale.hasPartialDelivery || sale.shipments.length > 0;

    for (const item of sale.items) {
      let releaseQty = 0;

      if (isSplitShipmentSale) {
        // For split shipment: calculate remaining reserved portion (ordered - delivered/in-transit)
        const shippedItems = item.shipmentItems.filter(
          (si) =>
            si.shipment.status === "IN_TRANSIT" ||
            si.shipment.status === "DELIVERED" ||
            si.shipment.status === "COMPLETED",
        );
        const shippedQty = shippedItems.reduce((sum, si) => sum + si.quantity, 0);
        releaseQty = Math.max(0, item.quantity - shippedQty);
      } else {
        // For single delivery: only release if not yet deducted/fulfilled
        if (!sale.isStockDeducted) {
          releaseQty = item.quantity;
        }
      }

      if (releaseQty > 0) {
        try {
          await StockRepository.updateProductStock(
            item.productId,
            {
              availableQuantityIncrement: releaseQty,
              reservedQuantityIncrement: -releaseQty,
            },
            client,
          );
        } catch (e) {
          console.warn(`Could not update product stock for ${item.productId}:`, e);
          throw e;
        }
      }
    }
  };

  if (tx) {
    await release(tx);
  } else {
    await prisma.$transaction(async (client) => {
      await release(client);
    });
  }
}

/**
 * Use case: Confirms stock deduction (clears reservation) when a delivery date is set / fulfilled.
 * Note: CS One does NOT own Physical Stock (Physical comes from E-Con).
 * Fulfilling an order only unreserves the stock without modifying physicalBalance.
 */
export async function confirmStockDeductionUseCase(
  saleId: string,
  tx?: Prisma.TransactionClient,
) {
  const db = tx || prisma;
  const sale = await db.sale.findUnique({
    where: { id: saleId },
    include: {
      items: true,
      shipments: { where: { status: { not: "CANCELLED" } } },
    },
  });

  if (!sale) throw new Error("Sale not found");

  // Idempotency & Split Shipment Guard:
  // If sale was already deducted or has split shipments, do not perform sale-level deduction.
  if (sale.isStockDeducted) {
    return;
  }
  if (sale.hasPartialDelivery || sale.shipments.length > 0) {
    return;
  }

  const confirm = async (client: Prisma.TransactionClient) => {
    for (const item of sale.items) {
      const requestedQty = item.quantity;

      // Auto-assign LOTs (FIFO) for traceability records without modifying physical lot balance
      const lots = await StockRepository.getAvailableLotsOrderByDate(
        item.productId,
        client,
      );

      let allocated = 0;
      for (const lot of lots) {
        if (allocated >= requestedQty) break;
        const remainingToAllocate = requestedQty - allocated;

        const deduction = Math.min(
          Math.max(0, lot.quantity),
          remainingToAllocate,
        );

        if (deduction > 0) {
          await StockRepository.createSaleItemLot(
            {
              saleItemId: item.id,
              lotId: lot.id,
              quantity: deduction,
            },
            client,
          );
          allocated += deduction;
        }
      }

      if (allocated < requestedQty) {
        const remainingToAllocate = requestedQty - allocated;
        const anyLot = await StockRepository.getAnyLot(item.productId, client);

        if (anyLot) {
          await StockRepository.createSaleItemLot(
            {
              saleItemId: item.id,
              lotId: anyLot.id,
              quantity: remainingToAllocate,
            },
            client,
          );
        } else {
          console.warn(
            `[Warning] No LOTs found for product ${item.productId}. Cannot auto-assign LOT.`,
          );
        }
      }

      // Un-reserve stock (Physical is NOT modified)
      await StockRepository.updateProductStock(
        item.productId,
        {
          reservedQuantityIncrement: -requestedQty,
          availableQuantityIncrement: requestedQty,
        },
        client,
      );
    }
  };

  if (tx) {
    await confirm(tx);
  } else {
    await prisma.$transaction(async (client) => {
      await confirm(client);
    });
  }
}

/**
 * Use case: Reverts stock deduction to reservation when a delivery date is removed.
 */
export async function revertStockDeductionUseCase(
  saleId: string,
  tx?: Prisma.TransactionClient,
) {
  const db = tx || prisma;
  const sale = await db.sale.findUnique({
    where: { id: saleId },
    include: { items: true },
  });

  if (!sale) throw new Error("Sale not found");

  const revert = async (client: Prisma.TransactionClient) => {
    // Delete any allocated sale item lots
    await StockRepository.deleteSaleItemLots(saleId, client);

    for (const item of sale.items) {
      const returnQty = item.quantity;

      // Re-reserve stock (Physical is NOT modified)
      await StockRepository.updateProductStock(
        item.productId,
        {
          reservedQuantityIncrement: returnQty,
          availableQuantityIncrement: -returnQty,
        },
        client,
      );
    }
  };

  if (tx) {
    await revert(tx);
  } else {
    await prisma.$transaction(async (client) => {
      await revert(client);
    });
  }
}

/**
 * Use case: Confirms stock deduction with specific LOT selection.
 */
export async function confirmStockDeductionWithLotsUseCase(
  saleId: string,
  lotAllocations: LotAllocation[],
  tx?: Prisma.TransactionClient,
) {
  const db = tx || prisma;

  const sale = await db.sale.findUnique({
    where: { id: saleId },
    include: {
      items: true,
      shipments: { where: { status: { not: "CANCELLED" } } },
    },
  });

  if (!sale) throw new Error("Sale not found");

  // Idempotency & Split Shipment Guard:
  if (sale.isStockDeducted) {
    return;
  }
  if (sale.hasPartialDelivery || sale.shipments.length > 0) {
    return;
  }

  const confirm = async (client: Prisma.TransactionClient) => {
    const allocationsByItem = new Map<string, LotAllocation[]>();
    for (const alloc of lotAllocations) {
      const existing = allocationsByItem.get(alloc.saleItemId) || [];
      existing.push(alloc);
      allocationsByItem.set(alloc.saleItemId, existing);
    }

    for (const item of sale.items) {
      const itemAllocations = allocationsByItem.get(item.id) || [];

      const totalAllocated = itemAllocations.reduce(
        (sum, a) => sum + a.quantity,
        0,
      );

      if (totalAllocated !== item.quantity) {
        throw new Error(
          `LOT allocation mismatch for sale item ${item.id}: ` +
            `required ${item.quantity}, allocated ${totalAllocated}`,
        );
      }

      for (const alloc of itemAllocations) {
        const lot = await StockRepository.getLotById(alloc.lotId, client);
        if (!lot) {
          throw new Error(`LOT ${alloc.lotId} not found`);
        }
        if (lot.productId !== item.productId) {
          throw new Error(`LOT ${lot.lotNumber} is for a different product`);
        }

        // Record for traceability
        await StockRepository.createSaleItemLot(
          {
            saleItemId: item.id,
            lotId: alloc.lotId,
            quantity: alloc.quantity,
          },
          client,
        );
      }

      // Un-reserve stock (Physical is NOT modified)
      await StockRepository.updateProductStock(
        item.productId,
        {
          reservedQuantityIncrement: -item.quantity,
          availableQuantityIncrement: item.quantity,
        },
        client,
      );
    }
  };

  if (tx) {
    await confirm(tx);
  } else {
    await prisma.$transaction(async (client) => {
      await confirm(client);
    });
  }
}

/**
 * Use case: Reverts stock deduction and restores LOT allocations.
 */
export async function revertStockDeductionFromLotsUseCase(
  saleId: string,
  tx?: Prisma.TransactionClient,
) {
  const db = tx || prisma;

  const saleItemLots = await StockRepository.getSaleItemLots(saleId, db);

  if (!saleItemLots || saleItemLots.length === 0) {
    return revertStockDeductionUseCase(saleId, tx);
  }

  const sale = await db.sale.findUnique({
    where: { id: saleId },
    include: { items: true },
  });

  if (!sale) throw new Error("Sale not found");

  const revert = async (client: Prisma.TransactionClient) => {
    // Delete traceability records
    await StockRepository.deleteSaleItemLots(saleId, client);

    for (const item of sale.items) {
      await StockRepository.updateProductStock(
        item.productId,
        {
          reservedQuantityIncrement: item.quantity,
          availableQuantityIncrement: -item.quantity,
        },
        client,
      );
    }
  };

  if (tx) {
    await revert(tx);
  } else {
    await prisma.$transaction(async (client) => {
      await revert(client);
    });
  }
}

/**
 * Use case: Un-reserves stock and records LOTs for a specific Shipment (Partial Delivery).
 */
export async function deductStockForShipmentUseCase(
  shipmentId: string,
  tx?: Prisma.TransactionClient,
) {
  const db = tx || prisma;

  const shipment = await db.shipment.findUnique({
    where: { id: shipmentId },
    include: {
      items: {
        include: {
          saleItem: true,
        },
      },
    },
  });

  if (!shipment) throw new Error("Shipment not found");

  const autoAssign = async (client: Prisma.TransactionClient) => {
    for (const shipmentItem of shipment.items) {
      const requestedQty = shipmentItem.quantity;
      const productId = shipmentItem.saleItem.productId;

      const lots = await StockRepository.getAvailableLotsOrderByDate(
        productId,
        client,
      );

      let allocated = 0;
      for (const lot of lots) {
        if (allocated >= requestedQty) break;
        const remainingToAllocate = requestedQty - allocated;

        const deduction = Math.min(
          Math.max(0, lot.quantity),
          remainingToAllocate,
        );

        if (deduction > 0) {
          await StockRepository.createSaleItemLot(
            {
              saleItemId: shipmentItem.saleItemId,
              lotId: lot.id,
              quantity: deduction,
            },
            client,
          );
          allocated += deduction;
        }
      }

      if (allocated < requestedQty) {
        const remainingToAllocate = requestedQty - allocated;
        const anyLot = await StockRepository.getAnyLot(productId, client);

        if (anyLot) {
          await StockRepository.createSaleItemLot(
            {
              saleItemId: shipmentItem.saleItemId,
              lotId: anyLot.id,
              quantity: remainingToAllocate,
            },
            client,
          );
        } else {
          console.warn(
            `[Warning] No LOTs found for product ${productId}. Cannot auto-assign LOT for shipment.`,
          );
        }
      }

      // Un-reserve stock for this ShipmentItem (Physical is NOT modified)
      await StockRepository.updateProductStock(
        productId,
        {
          reservedQuantityIncrement: -requestedQty,
          availableQuantityIncrement: requestedQty,
        },
        client,
      );
    }
  };

  if (tx) {
    await autoAssign(tx);
  } else {
    await prisma.$transaction(async (client) => {
      await autoAssign(client);
    });
  }
}

/**
 * Use case: Restores reservation when a Shipment is cancelled.
 */
export async function revertStockForShipmentUseCase(
  shipmentId: string,
  tx?: Prisma.TransactionClient,
) {
  const db = tx || prisma;

  const shipment = await db.shipment.findUnique({
    where: { id: shipmentId },
    include: {
      items: {
        include: {
          saleItem: true,
        },
      },
    },
  });

  if (!shipment) throw new Error("Shipment not found");

  const revert = async (client: Prisma.TransactionClient) => {
    for (const shipmentItem of shipment.items) {
      let quantityToRestore = shipmentItem.quantity;
      const productId = shipmentItem.saleItem.productId;
      const saleItemId = shipmentItem.saleItemId;

      // 1. Restore reservation (Physical is NOT modified)
      await StockRepository.updateProductStock(
        productId,
        {
          reservedQuantityIncrement: shipmentItem.quantity,
          availableQuantityIncrement: -shipmentItem.quantity,
        },
        client,
      );

      // 2. Clean up SaleItemLot records
      const saleItemLots = await client.saleItemLot.findMany({
        where: { saleItemId: saleItemId },
        orderBy: { updatedAt: "desc" },
      });

      for (const saleItemLot of saleItemLots) {
        if (quantityToRestore <= 0) break;

        const restoreQty = Math.min(saleItemLot.quantity, quantityToRestore);

        if (restoreQty > 0) {
          if (saleItemLot.quantity === restoreQty) {
            await client.saleItemLot.delete({ where: { id: saleItemLot.id } });
          } else {
            await client.saleItemLot.update({
              where: { id: saleItemLot.id },
              data: { quantity: { decrement: restoreQty } },
            });
          }

          quantityToRestore -= restoreQty;
        }
      }
    }
  };

  if (tx) {
    await revert(tx);
  } else {
    await prisma.$transaction(async (client) => {
      await revert(client);
    });
  }
}
