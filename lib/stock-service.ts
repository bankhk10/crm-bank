import { db as prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

/**
 * Allocates stock for a sale using FIFO strategy.
 * Decrements quantity from ProductStockLot.
 * Throws error if insufficient stock.
 */
export async function allocateStock(
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

  // Define the logic as a reusable function or execute directly
  const allocate = async (client: Prisma.TransactionClient) => {
    for (const item of sale.items) {
      let remainingQtyToDeduct = item.quantity;

      // unique id/query for finding lots
      // Fetch available lots ordered by importDate ASC (FIFO)
      const lots = await client.productStockLot.findMany({
        where: {
          productId: item.productId,
          isUsed: false,
          quantity: { gt: 0 },
        },
        orderBy: { importDate: "asc" },
      });

      // Calculate total available to verify first
      const totalAvailable = lots.reduce((sum, lot) => sum + lot.quantity, 0);
      if (totalAvailable < remainingQtyToDeduct) {
        throw new Error(
          `Insufficient stock for product ${item.productId}. Required: ${remainingQtyToDeduct}, Available: ${totalAvailable}`
        );
      }

      for (const lot of lots) {
        if (remainingQtyToDeduct <= 0) break;

        const deduction = Math.min(lot.quantity, remainingQtyToDeduct);

        await client.productStockLot.update({
          where: { id: lot.id },
          data: {
            quantity: { decrement: deduction },
          },
        });

        // Update ProductStock summary
        const isRealDeduction = !!sale.deliveryDate;

        await client.productStock.upsert({
          where: { productId: item.productId },
          create: {
            productId: item.productId,
            physicalBalance: isRealDeduction ? 0 : deduction, // If real deduction, started at deduction and cut to 0? Or just 0?
            // If creating new record:
            // Sync script should handle this, but if we create:
            // If real deduction: Physical started as D, we subtract D -> 0. Available started D, sub D -> 0.
            // If reserved: Physical started D. Reserved D. Available D - D = 0.
            // Actually 'create' implies we found NO record. If we found NO record, we imply we had NO stock.
            // But we successfully found LOTS. So there is a sync mismatch.
            // Let's assume if upsert creates, we set it to safe baseline related to this transaction.
            // If lots existed, physicalBalance *should* be at least deduction.
            // But let's stick to update logic mainly.
            availableQuantity: 0,
            reservedQuantity: isRealDeduction ? 0 : deduction,
          },
          update: {
            availableQuantity: { decrement: deduction },
            reservedQuantity: isRealDeduction
              ? undefined
              : { increment: deduction },
            physicalBalance: isRealDeduction
              ? { decrement: deduction }
              : undefined,
          },
        });

        remainingQtyToDeduct -= deduction;
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

  console.log(`Stock allocated for sale ${saleId}`);
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
