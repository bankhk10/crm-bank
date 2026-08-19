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
  unit?: string;
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
  const { page = 1, perPage = 12, q, status, unit, from, to } = params;

  const where: Prisma.ProductWhereInput = { deletedAt: null };

  if (q && q.trim()) {
    const normalizedQ = q.trim().replace(/\s+/g, "");
    const likePattern = `%${normalizedQ}%`;

    // ใช้ Raw Query เพื่อรองรับการค้นหาแบบไม่สนช่องว่าง (Space-insensitive search)
    // โดยการ REPLACE ช่องว่างออกทั้งใน Column และในคำค้นหา
    const matchingIds = await db.$queryRaw<{ id: string }[]>`
      SELECT DISTINCT p.id 
      FROM "Product" p
      LEFT JOIN "Product" c ON c."parentId" = p.id
      WHERE (
        (REPLACE(p.name, ' ', '') ILIKE ${likePattern}
         OR REPLACE(p."productCode", ' ', '') ILIKE ${likePattern}
         OR REPLACE(p."commonName", ' ', '') ILIKE ${likePattern})
        OR (c.id IS NOT NULL AND c."deletedAt" IS NULL AND (
             REPLACE(c.name, ' ', '') ILIKE ${likePattern}
             OR REPLACE(c."productCode", ' ', '') ILIKE ${likePattern}
             OR REPLACE(c."commonName", ' ', '') ILIKE ${likePattern}
           ))
      )
      AND p."deletedAt" IS NULL
    `;

    const ids = matchingIds.map((m) => m.id);
    where.id = { in: ids };
  }

  if (status && (status === "ACTIVE" || status === "INACTIVE")) {
    where.status = status;
  }

  if (unit && unit.trim()) {
    where.unit = unit.trim();
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
        children: {
          where: { deletedAt: null },
          include: {
            stock: true,
            stockLots: {
              where: { isUsed: false },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            freeItems: true,
            promotionItems: true,
            stockLots: true,
            children: true,
          },
        },
        tradeNameGroup: true,
        productGroup: true,
      },
    } as any),
  ]);

  // Calculate stock quantity from stock lots
  const products = (productsRaw as any[]).map((product) => {
    // Prefer data from ProductStock table if available
    if (product.stock) {
      return {
        ...product,
        stockQuantity: product.stock.physicalBalance,
        availableQuantity: product.stock.availableQuantity,
        reservedQuantity: product.stock.reservedQuantity,
        physicalQuantity: product.stock.physicalBalance,
        children: (product as any).children?.map((child: any) => {
          let childAvail = 0;
          let childRes = 0;
          let childPhys = 0;
          if ((child as any).stock) {
            childAvail = (child as any).stock.availableQuantity;
            childRes = (child as any).stock.reservedQuantity;
            childPhys = (child as any).stock.physicalBalance;
          } else if ((child as any).stockLots) {
            childAvail = (child as any).stockLots.reduce(
              (sum: number, lot: any) => sum + lot.quantity,
              0,
            );
            childPhys = childAvail;
          }
          return {
            ...child,
            stockQuantity: childPhys,
            availableQuantity: childAvail,
            reservedQuantity: childRes,
            physicalQuantity: childPhys,
          };
        }),
      };
    }

    // Fallback to calculation if sync hasn't run yet
    const availableQuantity = (product as any).stockLots.reduce(
      (sum: number, lot: any) => sum + lot.quantity,
      0,
    );
    const reservedQuantity = 0;

    return {
      ...product,
      stockQuantity: availableQuantity,
      availableQuantity,
      reservedQuantity,
      physicalQuantity: availableQuantity + reservedQuantity,
      children: (product as any).children?.map((child: any) => {
        let childAvail = 0;
        let childRes = 0;
        let childPhys = 0;
        if ((child as any).stock) {
          childAvail = (child as any).stock.availableQuantity;
          childRes = (child as any).stock.reservedQuantity;
          childPhys = (child as any).stock.physicalBalance;
        } else if ((child as any).stockLots) {
          childAvail = (child as any).stockLots.reduce(
            (sum: number, lot: any) => sum + lot.quantity,
            0,
          );
          childPhys = childAvail;
        }
        return {
          ...child,
          stockQuantity: childPhys,
          availableQuantity: childAvail,
          reservedQuantity: childRes,
          physicalQuantity: childPhys,
        };
      }),
    };
  });

  return { total, products };
}

/**
 * Retrieve a single product by ID with full relation data.
 */
export async function findProductById(id: string) {
  const product = await db.product.findFirst({
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
      productABCType: true,
      tradeNameGroup: true,
      productGroup: true,
      parent: {
        select: {
          id: true,
          name: true,
          productCode: true,
        },
      },
    },
  } as any);

  if (!product) return null;

  // Manually fetch unit master data (not linked by relation yet)
  const unitObj = product.unit
    ? await db.unit.findFirst({
        where: { description: product.unit, deletedAt: null },
      })
    : null;

  return {
    ...(product as any),
    chemicalGroupObj: (product as any).productGroup, // Mapping for backward compatibility in UI
    productGroupObj: (product as any).tradeNameGroup, // Mapping for backward compatibility in UI
    unitObj: unitObj,
  };
}

/**
 * Create a new product.
 */
export async function createProduct(data: {
  productCode: string;
  name: string;
  commonName?: string;
  unit?: string;
  tradeNameGroupId?: string | null;
  brand?: string;
  productGroupId?: string | null;
  packageSize?: string | number | null;
  packageSizeUnit?: string | null;
  packageSizePerBox?: string | number | null;
  totalPackageSizePerBox?: string | number | null;
  status: "ACTIVE" | "INACTIVE";
  usedForPlants: string[];
  salesPoint?: string;
  properties?: string;
  pointPerUnit?: number;
  categoryId?: string | null;
  productABCTypeId?: string | null;
  parentId?: string | null;
}) {
  return db.product.create({
    data: {
      productCode: data.productCode,
      name: data.name,
      commonName: data.commonName,
      unit: data.unit,
      tradeNameGroupId: data.tradeNameGroupId,
      brand: data.brand,
      productGroupId: data.productGroupId,
      packageSize: data.packageSize,
      packageSizeUnit: data.packageSizeUnit,
      packageSizePerBox: data.packageSizePerBox,
      totalPackageSizePerBox: data.totalPackageSizePerBox,
      status: data.status,
      usedForPlants: data.usedForPlants,
      salesPoint: data.salesPoint,
      properties: data.properties,
      pointPerUnit: data.pointPerUnit ?? 0,
      categoryId: data.categoryId || null,
      productABCTypeId: data.productABCTypeId || null,
      parentId: data.parentId || null,
    },
    include: {
      images: true,
    },
  } as any);
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
    take: 1000,
  });
}

export async function findTradeNameGroups() {
  return db.tradeNameGroup.findMany({
    where: { deletedAt: null },
    orderBy: { code: "asc" },
    take: 1000,
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
    take: 1000,
  });
}

export async function findProductGroups() {
  return db.productGroup.findMany({
    where: { deletedAt: null },
    orderBy: { code: "asc" },
    take: 1000,
  });
}

export async function findPlants() {
  return db.plant.findMany({
    where: { deletedAt: null },
    orderBy: { code: "asc" },
    take: 1000,
  });
}

export async function findProductCategories() {
  return db.productCategory.findMany({
    where: { deletedAt: null },
    orderBy: { code: "asc" },
    take: 1000,
  });
}

export async function findProductABCTypes() {
  return db.productABCTypes.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    take: 1000,
  });
}

/**
 * Extracts trade name group from a trade name string.
 * Logic: Take text before ':', trim leading and trailing spaces.
 * If no ':', use full text after trim.
 */
export function extractTradeNameGroup(tradeName: string): string {
  if (!tradeName || typeof tradeName !== "string") return "";
  const colonIndex = tradeName.indexOf(":");
  if (colonIndex !== -1) {
    return tradeName.substring(0, colonIndex).trim();
  }
  return tradeName.trim();
}

/**
 * Finds or creates a TradeNameGroup record based on product trade name.
 * If group exists, returns its ID. If soft-deleted, restores it.
 * If not exists, creates a new TradeNameGroup record.
 */
export async function findOrCreateTradeNameGroup(
  nameOrGroupName: string,
): Promise<string | null> {
  const groupName = extractTradeNameGroup(nameOrGroupName);
  if (!groupName) return null;

  try {
    // 1. Try finding existing active TradeNameGroup
    let group = await db.tradeNameGroup.findFirst({
      where: {
        OR: [
          { description: { equals: groupName, mode: "insensitive" } },
          { code: { equals: groupName, mode: "insensitive" } },
        ],
        deletedAt: null,
      },
    });

    if (group) return group.id;

    // 2. Try finding soft-deleted TradeNameGroup and restore it
    group = await db.tradeNameGroup.findFirst({
      where: {
        OR: [
          { description: { equals: groupName, mode: "insensitive" } },
          { code: { equals: groupName, mode: "insensitive" } },
        ],
      },
    });

    if (group) {
      if (group.deletedAt) {
        group = await db.tradeNameGroup.update({
          where: { id: group.id },
          data: { deletedAt: null },
        });
      }
      return group.id;
    }

    // 3. Create new TradeNameGroup
    const created = await db.tradeNameGroup.create({
      data: {
        code: groupName,
        description: groupName,
      },
    });
    return created.id;
  } catch {
    // Fallback if concurrent creation or collision occurs
    const fallback = await db.tradeNameGroup.findFirst({
      where: {
        OR: [
          { description: { equals: groupName, mode: "insensitive" } },
          { code: { equals: groupName, mode: "insensitive" } },
        ],
      },
    });
    return fallback?.id ?? null;
  }
}
