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
            availableQuantity: 0,
            reservedQuantity: requestedQty,
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

  const hadDeliveryDate = !!sale.deliveryDate;

  const release = async (client: Prisma.TransactionClient) => {
    for (const item of sale.items) {
      const releaseQty = item.quantity;

      if (hadDeliveryDate) {
        const lot = await StockRepository.getFirstAvailableLot(
          item.productId,
          client,
        );

        if (lot) {
          await StockRepository.updateLotQuantity(lot.id, releaseQty, client);
        } else {
          const anyLot = await StockRepository.getAnyLot(
            item.productId,
            client,
          );

          if (anyLot) {
            await StockRepository.reactivateLot(anyLot.id, releaseQty, client);
          }
        }

        try {
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
        try {
          await StockRepository.updateProductStock(
            item.productId,
            {
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

      const lots = await StockRepository.getAvailableLots(
        item.productId,
        client,
      );

      let deductedFromLots = 0;
      for (const lot of lots) {
        if (deductedFromLots >= requestedQty) break;

        const deduction = Math.min(
          lot.quantity,
          requestedQty - deductedFromLots,
        );

        await StockRepository.updateLotQuantity(lot.id, -deduction, client);
        deductedFromLots += deduction;
      }

      await StockRepository.updateProductStock(
        item.productId,
        {
          availableQuantityIncrement: -requestedQty,
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
          availableQuantityIncrement: returnQty,
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
          throw new Error(
            `LOT ${lot.lotNumber} has insufficient quantity: ` +
              `available ${lot.quantity}, requested ${alloc.quantity}`,
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
          availableQuantityIncrement: -item.quantity,
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
          availableQuantityIncrement: item.quantity,
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
