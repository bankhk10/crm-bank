import { db as prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

/**
 * Result of stock allocation
 */
export interface StockAllocationResult {
  success: boolean;
  backorders: {
    productId: string;
    productName?: string;
    requested: number;
    allocated: number;
    backorder: number;
  }[];
}

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

  const backorders: StockAllocationResult["backorders"] = [];

  // Define the logic as a reusable function or execute directly
  const allocate = async (client: Prisma.TransactionClient) => {
    for (const item of sale.items) {
      const remainingQtyToDeduct = item.quantity;

      // Fetch available lots ordered by importDate ASC (FIFO)
      const lots = await client.productStockLot.findMany({
        where: {
          productId: item.productId,
          isUsed: false,
          quantity: { gt: 0 },
        },
        orderBy: { importDate: "asc" },
      });

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

        await client.productStockLot.update({
          where: { id: lot.id },
          data: {
            quantity: { decrement: deduction },
          },
        });

        deductedFromLots += deduction;
      }

      // Update ProductStock summary
      const isRealDeduction = !!sale.deliveryDate;

      // For the part that was allocated from lots
      if (canAllocate > 0) {
        await client.productStock.upsert({
          where: { productId: item.productId },
          create: {
            productId: item.productId,
            physicalBalance: 0,
            availableQuantity: 0,
            reservedQuantity: isRealDeduction ? 0 : canAllocate,
          },
          update: {
            availableQuantity: { decrement: canAllocate },
            reservedQuantity: isRealDeduction
              ? undefined
              : { increment: canAllocate },
            physicalBalance: isRealDeduction
              ? { decrement: canAllocate }
              : undefined,
          },
        });
      }

      // For backorder - reserve in reservedQuantity (negative available is allowed for backorder tracking)
      if (backorderQty > 0) {
        await client.productStock.upsert({
          where: { productId: item.productId },
          create: {
            productId: item.productId,
            physicalBalance: 0,
            availableQuantity: -backorderQty, // Negative indicates backorder
            reservedQuantity: backorderQty,
          },
          update: {
            availableQuantity: { decrement: backorderQty },
            reservedQuantity: { increment: backorderQty },
          },
        });
      }
    }
  };

  if (tx) {
    await allocate(tx);
  } else {
    // Start a new transaction if one wasn't provided
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
      const lot = await client.productStockLot.findFirst({
        where: {
          productId: item.productId,
          isUsed: false,
        },
        orderBy: { importDate: "asc" },
      });

      if (lot) {
        await client.productStockLot.update({
          where: { id: lot.id },
          data: {
            quantity: { increment: item.quantity },
          },
        });
      } else {
        const anyLot = await client.productStockLot.findFirst({
          where: { productId: item.productId },
          orderBy: { importDate: "desc" },
        });

        if (anyLot) {
          await client.productStockLot.update({
            where: { id: anyLot.id },
            data: {
              quantity: { increment: item.quantity },
              isUsed: false,
            },
          });
        }
      }

      // Update ProductStock summary
      // We upsert just in case, but really should expect it to exist.
      try {
        await client.productStock.update({
          where: { productId: item.productId },
          data: {
            availableQuantity: { increment: item.quantity },
            reservedQuantity: { decrement: item.quantity },
          },
        });
      } catch (e) {
        // Ignore if not found? Or log.
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
      await client.productStock.update({
        where: { productId: item.productId },
        data: {
          reservedQuantity: { decrement: item.quantity },
          physicalBalance: { decrement: item.quantity },
        },
      });
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
      await client.productStock.update({
        where: { productId: item.productId },
        data: {
          reservedQuantity: { increment: item.quantity },
          physicalBalance: { increment: item.quantity },
        },
      });
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
