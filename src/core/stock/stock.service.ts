/**
 * Stock Service
 * Business logic for stock management
 */

import { db as prisma } from "@/src/infrastructure/database";
import type { Prisma } from "@/src/infrastructure/database";
import type { StockAllocationResult, BackorderItem } from "./stock.types";
import * as StockRepository from "./stock.repository";

/**
 * Allocates stock for a sale using FIFO strategy.
 * Decrements quantity from ProductStockLot.
 * If stock is insufficient, allocates what's available and creates a "backorder" (reserved quantity).
 * Never throws error for insufficient stock - allows sale to proceed with partial allocation.
 */
export async function allocateStock(
  saleId: string,
  tx?: Prisma.TransactionClient
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
      const remainingQtyToDeduct = item.quantity;

      // Fetch available lots ordered by lotNumber ASC (lowest LOT number first)
      const lots = await StockRepository.getAvailableLots(
        item.productId,
        client
      );

      // Calculate total available
      const totalAvailable = lots.reduce((sum, lot) => sum + lot.quantity, 0);

      // Calculate how much we can actually allocate vs backorder
      const canAllocate = Math.min(totalAvailable, remainingQtyToDeduct);
      const backorderQty = Math.max(0, remainingQtyToDeduct - totalAvailable);

      // Track backorder if any
      if (backorderQty > 0) {
        backorders.push({
          productId: item.productId,
          productName: (item as { product?: { name?: string } }).product?.name,
          requested: item.quantity,
          allocated: canAllocate,
          backorder: backorderQty,
        });
      }

      // Deduct from physical lots (FIFO) - only what's available
      let deductedFromLots = 0;
      for (const lot of lots) {
        if (deductedFromLots >= canAllocate) break;

        const deduction = Math.min(
          lot.quantity,
          canAllocate - deductedFromLots
        );

        await StockRepository.updateLotQuantity(lot.id, -deduction, client);
        deductedFromLots += deduction;
      }

      // Update ProductStock summary
      const isRealDeduction = !!sale.deliveryDate;

      // For the part that was allocated from lots
      if (canAllocate > 0) {
        await StockRepository.upsertProductStock(
          item.productId,
          {
            physicalBalance: 0,
            availableQuantity: 0,
            reservedQuantity: isRealDeduction ? 0 : canAllocate,
            availableQuantityIncrement: -canAllocate,
            reservedQuantityIncrement: isRealDeduction
              ? undefined
              : canAllocate,
            physicalBalanceIncrement: isRealDeduction
              ? -canAllocate
              : undefined,
          },
          client
        );
      }

      // For backorder - reserve in reservedQuantity
      if (backorderQty > 0) {
        await StockRepository.upsertProductStock(
          item.productId,
          {
            physicalBalance: 0,
            availableQuantity: -backorderQty,
            reservedQuantity: backorderQty,
            availableQuantityIncrement: -backorderQty,
            reservedQuantityIncrement: backorderQty,
          },
          client
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

  const hasBackorders = backorders.length > 0;
  console.log(
    `Stock allocated for sale ${saleId}${
      hasBackorders ? ` with ${backorders.length} backorders` : ""
    }`
  );

  return {
    success: true,
    backorders,
  };
}

/**
 * Releases stock for a sale (e.g., cancellation or status revert).
 * Adds quantity back to available lots.
 * Strategy: Add to the oldest active lot or most appropriate one.
 */
export async function releaseStock(
  saleId: string,
  tx?: Prisma.TransactionClient
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

  const release = async (client: Prisma.TransactionClient) => {
    for (const item of sale.items) {
      const lot = await StockRepository.getFirstAvailableLot(
        item.productId,
        client
      );

      if (lot) {
        await StockRepository.updateLotQuantity(lot.id, item.quantity, client);
      } else {
        const anyLot = await StockRepository.getAnyLot(item.productId, client);

        if (anyLot) {
          await StockRepository.reactivateLot(anyLot.id, item.quantity, client);
        }
      }

      // Update ProductStock summary
      try {
        await StockRepository.updateProductStock(
          item.productId,
          {
            availableQuantityIncrement: item.quantity,
            reservedQuantityIncrement: -item.quantity,
          },
          client
        );
      } catch {
        console.warn(`Could not update product stock for ${item.productId}`);
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

  console.log(`Stock released for sale ${saleId}`);
}

/**
 * Confirms stock deduction when a delivery date is set for a previously reserved sale.
 * Moves stock from "Reserved" to "Real Deducted" (Physical decreases).
 * Does NOT affect Available Quantity or Lots (since they were already handled).
 */
export async function confirmStockDeduction(
  saleId: string,
  tx?: Prisma.TransactionClient
) {
  const db = tx || prisma;
  const sale = await db.sale.findUnique({
    where: { id: saleId },
    include: { items: true },
  });

  if (!sale) throw new Error("Sale not found");

  const confirm = async (client: Prisma.TransactionClient) => {
    for (const item of sale.items) {
      await StockRepository.updateProductStock(
        item.productId,
        {
          reservedQuantityIncrement: -item.quantity,
          physicalBalanceIncrement: -item.quantity,
        },
        client
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
 * Reverts stock deduction to reservation when a delivery date is removed.
 * Moves stock from "Real Deducted" back to "Reserved".
 */
export async function revertStockDeduction(
  saleId: string,
  tx?: Prisma.TransactionClient
) {
  const db = tx || prisma;
  const sale = await db.sale.findUnique({
    where: { id: saleId },
    include: { items: true },
  });

  if (!sale) throw new Error("Sale not found");

  const revert = async (client: Prisma.TransactionClient) => {
    for (const item of sale.items) {
      await StockRepository.updateProductStock(
        item.productId,
        {
          reservedQuantityIncrement: item.quantity,
          physicalBalanceIncrement: item.quantity,
        },
        client
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
