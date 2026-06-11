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
            physicalBalance: 0,
            availableQuantity: -requestedQty,
            reservedQuantity: requestedQty,
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
      items: true,
    },
  });

  if (!sale) {
    throw new Error("Sale not found");
  }

  // We check isStockDeducted to know exactly if physical stock was deducted.
  const didDeductPhysical = sale.isStockDeducted;

  const release = async (client: Prisma.TransactionClient) => {
    for (const item of sale.items) {
      const releaseQty = item.quantity;

      if (didDeductPhysical) {
        // Physical was deducted, so we restore physical.
        // We also must restore the LOT quantities that were auto-assigned, and delete the SaleItemLot records.
        try {
          // Restore lot quantities
          const saleItemLots = await StockRepository.getSaleItemLots(saleId, client);
          for (const saleItemLot of saleItemLots) {
            if (saleItemLot.saleItem.productId === item.productId) {
              await StockRepository.updateLotQuantity(
                saleItemLot.lotId,
                saleItemLot.quantity,
                client,
              );
            }
          }

          // Delete the SaleItemLot records for this sale
          await StockRepository.deleteSaleItemLots(saleId, client);

          await StockRepository.updateProductStock(
            item.productId,
            {
              availableQuantityIncrement: releaseQty,
              physicalBalanceIncrement: releaseQty,
            },
            client,
          );
        } catch {
          console.warn(`Could not update product stock for ${item.productId}`);
        }
      } else {
        // Only reserved was deducted, so we clear reserved.
        try {
          await StockRepository.updateProductStock(
            item.productId,
            {
              availableQuantityIncrement: releaseQty,
              reservedQuantityIncrement: -releaseQty,
            },
            client,
          );
        } catch {
          console.warn(`Could not update product stock for ${item.productId}`);
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
 * Use case: Confirms stock deduction when a delivery date is set.
 */
export async function confirmStockDeductionUseCase(
  saleId: string,
  tx?: Prisma.TransactionClient,
) {
  const db = tx || prisma;
  const sale = await db.sale.findUnique({
    where: { id: saleId },
    include: { items: true },
  });

  if (!sale) throw new Error("Sale not found");

  const confirm = async (client: Prisma.TransactionClient) => {
    for (const item of sale.items) {
      const requestedQty = item.quantity;

      // Auto-assign LOTs (FIFO) for traceability without blocking on insufficient stock
      const lots = await StockRepository.getAvailableLotsOrderByDate(item.productId, client);

      let allocated = 0;
      for (const lot of lots) {
        if (allocated >= requestedQty) break;
        const remainingToAllocate = requestedQty - allocated;
        
        // Take up to remainingToAllocate.
        const deduction = Math.min(Math.max(0, lot.quantity), remainingToAllocate);
        
        if (deduction > 0) {
          await StockRepository.updateLotQuantity(lot.id, -deduction, client);
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
          await StockRepository.updateLotQuantity(anyLot.id, -remainingToAllocate, client);
          await StockRepository.createSaleItemLot(
            {
              saleItemId: item.id,
              lotId: anyLot.id,
              quantity: remainingToAllocate,
            },
            client,
          );
        } else {
          console.warn(`[Warning] No LOTs found for product ${item.productId}. Cannot auto-assign LOT.`);
        }
      }

      await StockRepository.updateProductStock(
        item.productId,
        {
          reservedQuantityIncrement: -requestedQty,
          physicalBalanceIncrement: -requestedQty,
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
    for (const item of sale.items) {
      const returnQty = item.quantity;

      const lot = await StockRepository.getFirstAvailableLot(
        item.productId,
        client,
      );

      if (lot) {
        await StockRepository.updateLotQuantity(lot.id, returnQty, client);
      } else {
        const anyLot = await StockRepository.getAnyLot(item.productId, client);

        if (anyLot) {
          await StockRepository.reactivateLot(anyLot.id, returnQty, client);
        }
      }

      await StockRepository.updateProductStock(
        item.productId,
        {
          reservedQuantityIncrement: returnQty,
          physicalBalanceIncrement: returnQty,
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
    include: { items: true },
  });

  if (!sale) throw new Error("Sale not found");

  const confirm = async (client: Prisma.TransactionClient) => {
    const allocationsByItem = new Map<string, LotAllocation[]>();
    for (const alloc of lotAllocations) {
      const existing = allocationsByItem.get(alloc.saleItemId) || [];
      existing.push(alloc);
      allocationsByItem.set(alloc.saleItemId, existing);
    }

    // Pre-validate: aggregate total requested quantity per lot across ALL items
    const totalByLot = new Map<string, number>();
    for (const alloc of lotAllocations) {
      totalByLot.set(
        alloc.lotId,
        (totalByLot.get(alloc.lotId) || 0) + alloc.quantity,
      );
    }

    for (const [lotId, totalRequested] of totalByLot.entries()) {
      const lot = await StockRepository.getLotById(lotId, client);
      if (!lot) {
        throw new Error(`LOT ${lotId} not found`);
      }
      if (lot.quantity < totalRequested) {
        console.warn(
          `[Warning] LOT ${lot.lotNumber} has insufficient quantity: ` +
            `available ${lot.quantity}, total requested across items ${totalRequested}. Proceeding with negative inventory.`
        );
      }
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
        if (lot.quantity < alloc.quantity) {
          console.warn(
            `[Warning] LOT ${lot.lotNumber} has insufficient quantity: ` +
              `available ${lot.quantity}, requested ${alloc.quantity}. Proceeding with negative inventory.`
          );
        }
        if (lot.productId !== item.productId) {
          throw new Error(`LOT ${lot.lotNumber} is for a different product`);
        }

        await StockRepository.updateLotQuantity(
          lot.id,
          -alloc.quantity,
          client,
        );

        await StockRepository.createSaleItemLot(
          {
            saleItemId: item.id,
            lotId: alloc.lotId,
            quantity: alloc.quantity,
          },
          client,
        );
      }

      await StockRepository.updateProductStock(
        item.productId,
        {
          reservedQuantityIncrement: -item.quantity,
          physicalBalanceIncrement: -item.quantity,
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
    for (const saleItemLot of saleItemLots) {
      await StockRepository.updateLotQuantity(
        saleItemLot.lotId,
        saleItemLot.quantity,
        client,
      );
    }

    for (const item of sale.items) {
      await StockRepository.updateProductStock(
        item.productId,
        {
          reservedQuantityIncrement: item.quantity,
          physicalBalanceIncrement: item.quantity,
        },
        client,
      );
    }

    await StockRepository.deleteSaleItemLots(saleId, client);
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
 * Use case: Auto-assigns LOTs for a specific Shipment (Partial Delivery) using FIFO.
 * Does NOT throw errors if lot stock is insufficient. Allows negative LOT quantities.
 * Does NOT update physicalBalance or availableQuantity (these are handled by status change to AWAITING_DELIVERY).
 * Only records SaleItemLot for traceability.
 */
export async function autoAssignLotsForShipmentUseCase(
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

      const lots = await StockRepository.getAvailableLotsOrderByDate(productId, client);

      let allocated = 0;
      for (const lot of lots) {
        if (allocated >= requestedQty) break;
        const remainingToAllocate = requestedQty - allocated;
        
        // Even if lot.quantity is small, we take up to remainingToAllocate
        // If it goes negative, that's fine. We use Math.min only if lot has more than we need.
        const deduction = Math.min(Math.max(0, lot.quantity), remainingToAllocate);
        
        if (deduction > 0) {
          await StockRepository.updateLotQuantity(lot.id, -deduction, client);
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

      // If we still haven't allocated enough (all lots were 0 or no lots existed)
      if (allocated < requestedQty) {
        const remainingToAllocate = requestedQty - allocated;
        
        // Find ANY lot for this product, preferably the newest one
        const anyLot = await StockRepository.getAnyLot(productId, client);
        
        if (anyLot) {
          await StockRepository.updateLotQuantity(anyLot.id, -remainingToAllocate, client);
          await StockRepository.createSaleItemLot(
            {
              saleItemId: shipmentItem.saleItemId,
              lotId: anyLot.id,
              quantity: remainingToAllocate,
            },
            client,
          );
        } else {
          console.warn(`[Warning] No LOTs found for product ${productId}. Cannot auto-assign LOT for shipment.`);
        }
      }
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

