/**
 * Stock Service
 * Business logic for stock management
 *
 * Flow:
 * 1. On APPROVE: Reserve stock (increase reservedQuantity) but DON'T deduct from lots
 * 2. On SET DELIVERY DATE: Deduct from lots using FIFO, decrease availableQuantity/reservedQuantity/physicalBalance
 * 3. On REMOVE DELIVERY DATE: Return stock to lots, increase all quantities back
 */

import { db as prisma } from "@/src/infrastructure/database";
import type { Prisma } from "@/src/infrastructure/database";
import type { StockAllocationResult, BackorderItem } from "./stock.types";
import * as StockRepository from "./stock.repository";

/**
 * Reserves stock for a sale on approval.
 * Only tracks reservation in reservedQuantity - does NOT deduct from lots.
 * Lots will be deducted when delivery date is set via confirmStockDeduction.
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
      const requestedQty = item.quantity;

      // Fetch available lots to check stock availability
      const lots = await StockRepository.getAvailableLots(
        item.productId,
        client
      );

      // Calculate total available
      const totalAvailable = lots.reduce((sum, lot) => sum + lot.quantity, 0);

      // Calculate how much we can reserve vs backorder
      const canReserve = Math.min(totalAvailable, requestedQty);
      const backorderQty = Math.max(0, requestedQty - totalAvailable);

      // Track backorder if stock is insufficient
      if (backorderQty > 0) {
        backorders.push({
          productId: item.productId,
          productName: (item as { product?: { name?: string } }).product?.name,
          requested: item.quantity,
          allocated: canReserve,
          backorder: backorderQty,
        });
      }

      // DON'T deduct from lots here - that happens when delivery date is set
      // Just reserve the stock in reservedQuantity

      // Update ProductStock summary - only add to reservedQuantity
      if (requestedQty > 0) {
        await StockRepository.upsertProductStock(
          item.productId,
          {
            physicalBalance: 0,
            availableQuantity: 0,
            reservedQuantity: requestedQty,
            reservedQuantityIncrement: requestedQty,
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
    `Stock reserved for sale ${saleId}${
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
 * Handles two scenarios:
 * 1. If delivery date was set: Lots were deducted, so return stock to lots
 * 2. If no delivery date: Lots were NOT deducted, just release reservation
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

  const hadDeliveryDate = !!sale.deliveryDate;

  const release = async (client: Prisma.TransactionClient) => {
    for (const item of sale.items) {
      const releaseQty = item.quantity;

      if (hadDeliveryDate) {
        // Delivery date was set, so lots were deducted - return stock to lots
        const lot = await StockRepository.getFirstAvailableLot(
          item.productId,
          client
        );

        if (lot) {
          await StockRepository.updateLotQuantity(lot.id, releaseQty, client);
        } else {
          const anyLot = await StockRepository.getAnyLot(
            item.productId,
            client
          );

          if (anyLot) {
            await StockRepository.reactivateLot(anyLot.id, releaseQty, client);
          }
        }

        // Update ProductStock summary - restore all quantities
        try {
          await StockRepository.updateProductStock(
            item.productId,
            {
              availableQuantityIncrement: releaseQty,
              reservedQuantityIncrement: -releaseQty, // Was already at 0 after confirm, but decrement to handle edge cases
              physicalBalanceIncrement: releaseQty,
            },
            client
          );
        } catch {
          console.warn(`Could not update product stock for ${item.productId}`);
        }
      } else {
        // No delivery date was set, lots were NOT deducted - just release reservation
        try {
          await StockRepository.updateProductStock(
            item.productId,
            {
              reservedQuantityIncrement: -releaseQty,
            },
            client
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

  console.log(
    `Stock released for sale ${saleId} (hadDeliveryDate: ${hadDeliveryDate})`
  );
}

/**
 * Confirms stock deduction when a delivery date is set for a previously reserved sale.
 * This is when the ACTUAL stock deduction happens:
 * - Deducts from physical lots using FIFO
 * - Decreases availableQuantity (the stock that can be sold)
 * - Decreases reservedQuantity (moving from reserved to deducted)
 * - Decreases physicalBalance (actual physical stock)
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
      const requestedQty = item.quantity;

      // Fetch available lots ordered by lotNumber ASC (FIFO)
      const lots = await StockRepository.getAvailableLots(
        item.productId,
        client
      );

      // Deduct from physical lots (FIFO)
      let deductedFromLots = 0;
      for (const lot of lots) {
        if (deductedFromLots >= requestedQty) break;

        const deduction = Math.min(
          lot.quantity,
          requestedQty - deductedFromLots
        );

        await StockRepository.updateLotQuantity(lot.id, -deduction, client);
        deductedFromLots += deduction;
      }

      // Update ProductStock summary
      // - Decrease availableQuantity (stock is now committed/shipped)
      // - Decrease reservedQuantity (moving from reserved to deducted)
      // - Decrease physicalBalance (actual physical stock leaving warehouse)
      await StockRepository.updateProductStock(
        item.productId,
        {
          availableQuantityIncrement: -requestedQty,
          reservedQuantityIncrement: -requestedQty,
          physicalBalanceIncrement: -requestedQty,
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

  console.log(`Stock deducted for sale ${saleId}`);
}

/**
 * Reverts stock deduction to reservation when a delivery date is removed.
 * This reverses the confirmStockDeduction operation:
 * - Returns stock to physical lots
 * - Increases availableQuantity
 * - Increases reservedQuantity (back to reserved state)
 * - Increases physicalBalance
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
      const returnQty = item.quantity;

      // Return stock to the first available lot (or reactivate a lot)
      const lot = await StockRepository.getFirstAvailableLot(
        item.productId,
        client
      );

      if (lot) {
        await StockRepository.updateLotQuantity(lot.id, returnQty, client);
      } else {
        // No available lot found, try to reactivate any lot
        const anyLot = await StockRepository.getAnyLot(item.productId, client);

        if (anyLot) {
          await StockRepository.reactivateLot(anyLot.id, returnQty, client);
        }
      }

      // Update ProductStock summary
      // - Increase availableQuantity (stock is available again)
      // - Increase reservedQuantity (back to reserved state)
      // - Increase physicalBalance (stock returned to warehouse)
      await StockRepository.updateProductStock(
        item.productId,
        {
          availableQuantityIncrement: returnQty,
          reservedQuantityIncrement: returnQty,
          physicalBalanceIncrement: returnQty,
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

  console.log(`Stock deduction reverted for sale ${saleId}`);
}
