import { startOfDay, endOfDay } from "date-fns";
import { Prisma } from "@/src/infrastructure/database";
import { db } from "@/src/infrastructure/database";

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
