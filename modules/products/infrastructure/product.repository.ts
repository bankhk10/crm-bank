import { startOfDay, endOfDay } from "date-fns";
import { Prisma } from "@/lib/db";
import { db } from "@/lib/db";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type ListProductsParams = {
  page?: number;
  perPage?: number;
  q?: string;
  status?: string;
  from?: Date;
  to?: Date;
};

// ─────────────────────────────────────────────
// Product CRUD
// ─────────────────────────────────────────────

/**
 * Retrieve a paginated list of products with optional search, status & date filtering.
 */
export async function findProducts(params: ListProductsParams) {
  const { page = 1, perPage = 12, q, status, from, to } = params;

  const where: Prisma.ProductWhereInput = { deletedAt: null };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { productCode: { contains: q, mode: "insensitive" } },
      { commonName: { contains: q, mode: "insensitive" } },
    ];
  }

  if (status && (status === "ACTIVE" || status === "INACTIVE")) {
    where.status = status;
  }

  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: startOfDay(from) } : {}),
      ...(to ? { lte: endOfDay(to) } : {}),
    };
  }

  const [total, productsRaw] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        images: {
          orderBy: { order: "asc" },
        },
        promotionItems: true,
        freeItems: true,
        stockLots: {
          where: {
            isUsed: false,
          },
        },
        stock: true,
        _count: {
          select: {
            freeItems: true,
            promotionItems: true,
            stockLots: true,
          },
        },
      },
    }),
  ]);

  // Calculate stock quantity from stock lots
  const products = productsRaw.map((product) => {
    // Prefer data from ProductStock table if available
    if (product.stock) {
      return {
        ...product,
        stockQuantity: product.stock.physicalBalance,
        availableQuantity: product.stock.availableQuantity,
        reservedQuantity: product.stock.reservedQuantity,
        physicalQuantity: product.stock.physicalBalance,
      };
    }

    // Fallback to calculation if sync hasn't run yet
    const availableQuantity = product.stockLots.reduce(
      (sum, lot) => sum + lot.quantity,
      0,
    );
    const reservedQuantity = 0;

    return {
      ...product,
      stockQuantity: availableQuantity,
      availableQuantity,
      reservedQuantity,
      physicalQuantity: availableQuantity + reservedQuantity,
    };
  });

  return { total, products };
}

/**
 * Retrieve a single product by ID with full relation data.
 */
export async function findProductById(id: string) {
  return db.product.findFirst({
    where: { id, deletedAt: null },
    include: {
      images: {
        orderBy: { order: "asc" },
      },
      freeItems: {
        orderBy: { createdAt: "desc" },
      },
      promotionItems: {
        orderBy: { createdAt: "desc" },
      },
      stockLots: {
        orderBy: { createdAt: "desc" },
      },
      category: true,
      productChain: true,
    },
  });
}

/**
 * Create a new product.
 */
export async function createProduct(data: {
  productCode: string;
  name: string;
  commonName?: string;
  unit?: string;
  productGroup?: string;
  brand?: string;
  chemicalGroup?: string;
  packageSize?: string;
  packageSizePerBox?: string;
  totalPackageSizePerBox?: string;
  status: "ACTIVE" | "INACTIVE";
  usedForPlants: string[];
  salesPoint?: string;
  properties?: string;
  pointPerUnit?: number;
  categoryId?: string | null;
  productChainId?: string | null;
}) {
  return db.product.create({
    data: {
      productCode: data.productCode,
      name: data.name,
      commonName: data.commonName,
      unit: data.unit,
      productGroup: data.productGroup,
      brand: data.brand,
      chemicalGroup: data.chemicalGroup,
      packageSize: data.packageSize,
      packageSizePerBox: data.packageSizePerBox,
      totalPackageSizePerBox: data.totalPackageSizePerBox,
      status: data.status,
      usedForPlants: data.usedForPlants,
      salesPoint: data.salesPoint,
      properties: data.properties,
      pointPerUnit: data.pointPerUnit ?? 0,
      categoryId: data.categoryId || null,
      productChainId: data.productChainId || null,
    },
    include: {
      images: true,
    },
  });
}

/**
 * Update a product by ID.
 */
export async function updateProduct(id: string, data: Record<string, any>) {
  return db.product.update({
    where: { id },
    data,
    include: {
      images: true,
    },
  });
}

/**
 * Soft-delete a product by setting `deletedAt`.
 * Also deletes image records.
 */
export async function softDeleteProduct(id: string) {
  // Delete image records from DB
  await (db as any).productImage.deleteMany({
    where: { productId: id },
  });

  // Soft delete the product
  return db.product.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

// ─────────────────────────────────────────────
// Product Management (Pricing, Stock, Promotions)
// ─────────────────────────────────────────────

export async function manageProduct(productId: string, parsedData: any) {
  return db.$transaction(async (tx) => {
    // Update price and promotion budget
    await tx.product.update({
      where: { id: productId, deletedAt: null },
      data: {
        price: parsedData.price,
        cartonPrice: parsedData.cartonPrice,
        packageSizePerBox: parsedData.packageSizePerBox,
        promotionBudget: parsedData.promotionBudget,
        pointPerUnit: parsedData.pointPerUnit,
      },
    });

    // Handle free items
    if (parsedData.freeItems) {
      const freeItemsToKeep = parsedData.freeItems
        .filter((item: any) => item.id)
        .map((item: any) => item.id);

      // Delete removed items
      await tx.productFreeItem.deleteMany({
        where: {
          productId,
          id: {
            notIn: freeItemsToKeep.length > 0 ? freeItemsToKeep : undefined,
          },
        },
      });

      // Update or create free items
      for (const item of parsedData.freeItems) {
        if (item.id) {
          await tx.productFreeItem.update({
            where: { id: item.id },
            data: {
              purchaseQty: item.purchaseQty,
              freeQty: item.freeQty,
              netPrice: item.netPrice,
              notes: item.notes,
            },
          });
        } else {
          await tx.productFreeItem.create({
            data: {
              productId,
              purchaseQty: item.purchaseQty,
              freeQty: item.freeQty,
              netPrice: item.netPrice,
              notes: item.notes,
            },
          });
        }
      }
    }

    // Handle promotion items
    if (parsedData.promotionItems) {
      const promotionItemsToKeep = parsedData.promotionItems
        .filter((item: any) => item.id)
        .map((item: any) => item.id);

      await tx.productPromotionItem.deleteMany({
        where: {
          productId,
          id: {
            notIn:
              promotionItemsToKeep.length > 0
                ? promotionItemsToKeep
                : undefined,
          },
        },
      });

      for (const item of parsedData.promotionItems) {
        if (item.id) {
          await tx.productPromotionItem.update({
            where: { id: item.id },
            data: {
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              notes: item.notes,
            },
          });
        } else {
          await tx.productPromotionItem.create({
            data: {
              productId,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              notes: item.notes,
            },
          });
        }
      }
    }

    // Handle stock lots
    if (parsedData.stockLots) {
      const existingLots = await tx.productStockLot.findMany({
        where: { productId },
      });

      const stockLotsToKeep = parsedData.stockLots
        .filter((item: any) => item.id)
        .map((item: any) => item.id);

      const lotsToDelete = existingLots.filter(
        (lot) => !stockLotsToKeep.includes(lot.id) && !lot.isUsed,
      );

      if (lotsToDelete.length > 0) {
        await tx.productStockLot.deleteMany({
          where: {
            id: { in: lotsToDelete.map((lot) => lot.id) },
          },
        });
      }

      const lotCount = existingLots.length;
      let newLotIndex = 0;

      for (const item of parsedData.stockLots) {
        if (item.id) {
          const existingLot = existingLots.find((lot) => lot.id === item.id);
          if (existingLot && !existingLot.isUsed) {
            await tx.productStockLot.update({
              where: { id: item.id },
              data: {
                quantity: item.quantity,
                initialQuantity: item.initialQuantity,
                importDate: new Date(item.importDate),
                expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
                storageLocation: item.storageLocation,
                notes: item.notes,
              },
            });
          }
        } else {
          const newLotNumber =
            item.lotNumber?.trim() ||
            `LOT-${String(lotCount + newLotIndex + 1)}`;
          newLotIndex++;
          await tx.productStockLot.create({
            data: {
              productId,
              lotNumber: newLotNumber,
              quantity: item.quantity,
              initialQuantity: item.initialQuantity ?? item.quantity,
              importDate: new Date(item.importDate),
              expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
              storageLocation: item.storageLocation,
              notes: item.notes,
              isUsed: false,
            },
          });
        }
      }
    }

    // Sync ProductStock table
    if (parsedData.stockLots) {
      const allLots = await tx.productStockLot.findMany({
        where: { productId, isUsed: false },
      });

      const physicalBalance = allLots.reduce(
        (sum, lot) => sum + lot.quantity,
        0,
      );

      const currentStock = await tx.productStock.findUnique({
        where: { productId },
      });

      const currentReserved = currentStock?.reservedQuantity || 0;
      const availableQuantity = physicalBalance - currentReserved;

      await tx.productStock.upsert({
        where: { productId },
        create: {
          productId,
          availableQuantity: physicalBalance,
          reservedQuantity: 0,
          physicalBalance: physicalBalance,
        },
        update: {
          availableQuantity: availableQuantity,
          physicalBalance: physicalBalance,
        },
      });
    }

    return tx.product.findUnique({
      where: { id: productId },
      include: {
        images: true,
        freeItems: true,
        promotionItems: true,
        stockLots: true,
      },
    });
  });
}

// ─────────────────────────────────────────────
// Form Options (for dropdowns)
// ─────────────────────────────────────────────

export async function findUnits() {
  return db.unit.findMany({
    where: { deletedAt: null },
    orderBy: { code: "asc" },
    take: 100,
  });
}

export async function findProductGroups() {
  return db.productGroupMaster.findMany({
    where: { deletedAt: null },
    orderBy: { code: "asc" },
    take: 100,
    include: {
      category: {
        select: { id: true, code: true, description: true },
      },
    },
  });
}

export async function findBrands() {
  return db.brand.findMany({
    where: { deletedAt: null },
    orderBy: { code: "asc" },
    take: 100,
  });
}

export async function findChemicalGroups() {
  return db.chemicalGroup.findMany({
    where: { deletedAt: null },
    orderBy: { code: "asc" },
    take: 100,
  });
}

export async function findPlants() {
  return db.plant.findMany({
    where: { deletedAt: null },
    orderBy: { code: "asc" },
    take: 100,
  });
}

export async function findProductCategories() {
  return db.productCategory.findMany({
    where: { deletedAt: null },
    orderBy: { code: "asc" },
    take: 100,
  });
}

export async function findProductChains() {
  return db.productChain.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    take: 100,
  });
}
