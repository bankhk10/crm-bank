/**
 * Stock Repository
 * Data access layer for stock operations
 */

import { db as prisma } from "@/src/infrastructure/database";
import type { Prisma } from "@/src/infrastructure/database";
import type { StockLot, ProductStockSummary } from "./stock.types";

/**
 * Get stock lots for a product ordered by lot number (FIFO)
 */
export async function getAvailableLots(
  productId: string,
  tx?: Prisma.TransactionClient
): Promise<StockLot[]> {
  const db = tx || prisma;

  return db.productStockLot.findMany({
    where: {
      productId,
      isUsed: false,
      quantity: { gt: 0 },
    },
    orderBy: { lotNumber: "asc" },
  });
}

/**
 * Get product stock summary
 */
export async function getProductStock(
  productId: string,
  tx?: Prisma.TransactionClient
): Promise<ProductStockSummary | null> {
  const db = tx || prisma;

  return db.productStock.findUnique({
    where: { productId },
  });
}

/**
 * Update lot quantity
 */
export async function updateLotQuantity(
  lotId: string,
  quantityChange: number,
  tx?: Prisma.TransactionClient
) {
  const db = tx || prisma;

  return db.productStockLot.update({
    where: { id: lotId },
    data: {
      quantity: { increment: quantityChange },
    },
  });
}

/**
 * Upsert product stock summary
 */
export async function upsertProductStock(
  productId: string,
  data: {
    physicalBalance?: number;
    availableQuantity?: number;
    reservedQuantity?: number;
    physicalBalanceIncrement?: number;
    availableQuantityIncrement?: number;
    reservedQuantityIncrement?: number;
  },
  tx?: Prisma.TransactionClient
) {
  const db = tx || prisma;

  const updateData: Prisma.ProductStockUpdateInput = {};
  const createData: Prisma.ProductStockCreateInput = {
    product: { connect: { id: productId } },
    physicalBalance: data.physicalBalance ?? 0,
    availableQuantity: data.availableQuantity ?? 0,
    reservedQuantity: data.reservedQuantity ?? 0,
  };

  // Handle increments in update
  if (data.physicalBalanceIncrement !== undefined) {
    updateData.physicalBalance = { increment: data.physicalBalanceIncrement };
  }
  if (data.availableQuantityIncrement !== undefined) {
    updateData.availableQuantity = {
      increment: data.availableQuantityIncrement,
    };
  }
  if (data.reservedQuantityIncrement !== undefined) {
    updateData.reservedQuantity = { increment: data.reservedQuantityIncrement };
  }

  return db.productStock.upsert({
    where: { productId },
    create: createData,
    update: updateData,
  });
}

/**
 * Update product stock quantities
 */
export async function updateProductStock(
  productId: string,
  data: {
    physicalBalanceIncrement?: number;
    availableQuantityIncrement?: number;
    reservedQuantityIncrement?: number;
  },
  tx?: Prisma.TransactionClient
) {
  const db = tx || prisma;

  const updateData: Prisma.ProductStockUpdateInput = {};

  if (data.physicalBalanceIncrement !== undefined) {
    updateData.physicalBalance = { increment: data.physicalBalanceIncrement };
  }
  if (data.availableQuantityIncrement !== undefined) {
    updateData.availableQuantity = {
      increment: data.availableQuantityIncrement,
    };
  }
  if (data.reservedQuantityIncrement !== undefined) {
    updateData.reservedQuantity = { increment: data.reservedQuantityIncrement };
  }

  return db.productStock.update({
    where: { productId },
    data: updateData,
  });
}

/**
 * Get first available lot for a product
 */
export async function getFirstAvailableLot(
  productId: string,
  tx?: Prisma.TransactionClient
) {
  const db = tx || prisma;

  return db.productStockLot.findFirst({
    where: {
      productId,
      isUsed: false,
    },
    orderBy: { lotNumber: "asc" },
  });
}

/**
 * Get any lot for a product (including used ones)
 */
export async function getAnyLot(
  productId: string,
  tx?: Prisma.TransactionClient
) {
  const db = tx || prisma;

  return db.productStockLot.findFirst({
    where: { productId },
    orderBy: { lotNumber: "desc" },
  });
}

/**
 * Reactivate and update lot quantity
 */
export async function reactivateLot(
  lotId: string,
  quantityIncrement: number,
  tx?: Prisma.TransactionClient
) {
  const db = tx || prisma;

  return db.productStockLot.update({
    where: { id: lotId },
    data: {
      quantity: { increment: quantityIncrement },
      isUsed: false,
    },
  });
}
