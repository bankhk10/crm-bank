import { db } from "@/lib/db";
import { Prisma, PromotionalMaterialStatus } from "@prisma/client";

export interface ListPromotionalMaterialsParams {
  page?: number;
  perPage?: number;
  q?: string;
  category?: string;
  status?: "ACTIVE" | "INACTIVE";
  sortBy?: "name" | "category" | "price" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface CreatePromotionalMaterialInput {
  sku?: string;
  name: string;
  category: string;
  price?: number;
  unit?: string;
  description?: string;
  status?: PromotionalMaterialStatus;
  createdById?: string;
}

export interface UpdatePromotionalMaterialInput {
  sku?: string;
  name?: string;
  category?: string;
  price?: number;
  unit?: string;
  description?: string;
  status?: PromotionalMaterialStatus;
  updatedById?: string;
}

/**
 * Generate a unique SKU based on category
 */
async function generateSku(category: string): Promise<string> {
  const prefixMap: Record<string, string> = {
    Premium_item: "PREM",
    PP_Board: "PPB",
    Banner: "BNR",
    Leaflet: "LFL",
    อุปกรณ์จัดงาน: "EQP",
  };

  const prefix = prefixMap[category] || "MKT";
  const count = await db.promotionalMaterial.count({
    where: { category },
  });

  const nextNumber = String(count + 1).padStart(3, "0");
  const candidateSku = `${prefix}-${nextNumber}`;

  const exists = await db.promotionalMaterial.findUnique({
    where: { sku: candidateSku },
  });

  if (!exists) return candidateSku;

  return `${prefix}-${Date.now().toString().slice(-4)}`;
}

/**
 * List promotional materials with filters, pagination, and sorting (soft-delete filtered)
 */
export async function findPromotionalMaterials(params: ListPromotionalMaterialsParams = {}) {
  const {
    page = 1,
    perPage = 20,
    q,
    category,
    status,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  const where: Prisma.PromotionalMaterialWhereInput = {
    deletedAt: null,
  };

  if (category && category !== "ALL") {
    where.category = category;
  }

  if (status) {
    where.status = status as PromotionalMaterialStatus;
  }

  if (q && q.trim()) {
    const trimmed = q.trim();
    where.OR = [
      { name: { contains: trimmed, mode: "insensitive" } },
      { sku: { contains: trimmed, mode: "insensitive" } },
      { description: { contains: trimmed, mode: "insensitive" } },
      { category: { contains: trimmed, mode: "insensitive" } },
    ];
  }

  const [total, materials] = await Promise.all([
    db.promotionalMaterial.count({ where }),
    db.promotionalMaterial.findMany({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),
  ]);

  return {
    promotionalMaterials: materials.map((m) => ({
      ...m,
      price: m.price ? Number(m.price) : 0,
    })),
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

/**
 * Find all active promotional materials grouped by category for dynamic dropdowns in Activity Plan form
 */
export async function findActivePromotionalMaterialsGrouped() {
  const materials = await db.promotionalMaterial.findMany({
    where: {
      deletedAt: null,
      status: "ACTIVE",
    },
    orderBy: [
      { category: "asc" },
      { name: "asc" },
    ],
  });

  const grouped: Record<
    string,
    Array<{
      id: string;
      sku: string;
      name: string;
      category: string;
      unit: string;
      price: number;
      status: string;
    }>
  > = {};

  for (const m of materials) {
    if (!grouped[m.category]) {
      grouped[m.category] = [];
    }
    grouped[m.category].push({
      id: m.id,
      sku: m.sku,
      name: m.name,
      category: m.category,
      unit: m.unit || "ชิ้น",
      price: m.price ? Number(m.price) : 0,
      status: m.status,
    });
  }

  return grouped;
}

/**
 * Get distinct categories of promotional materials
 */
export async function findDistinctCategories() {
  const categories = await db.promotionalMaterial.findMany({
    where: { deletedAt: null },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });

  return categories.map((c) => c.category);
}

/**
 * Find promotional material by ID
 */
export async function findPromotionalMaterialById(id: string) {
  const material = await db.promotionalMaterial.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!material) return null;

  return {
    ...material,
    price: material.price ? Number(material.price) : 0,
  };
}

/**
 * Create promotional material
 */
export async function createPromotionalMaterial(input: CreatePromotionalMaterialInput) {
  let sku = input.sku?.trim();
  if (!sku) {
    sku = await generateSku(input.category);
  }

  const material = await db.promotionalMaterial.create({
    data: {
      sku,
      name: input.name.trim(),
      category: input.category.trim(),
      price: input.price !== undefined ? new Prisma.Decimal(input.price) : new Prisma.Decimal(0),
      unit: input.unit?.trim() || "ชิ้น",
      description: input.description?.trim() || null,
      status: input.status || "ACTIVE",
      createdById: input.createdById || null,
    },
  });

  return {
    ...material,
    price: material.price ? Number(material.price) : 0,
  };
}

/**
 * Update promotional material
 */
export async function updatePromotionalMaterial(
  id: string,
  input: UpdatePromotionalMaterialInput,
) {
  const data: Prisma.PromotionalMaterialUpdateInput = {
    updatedAt: new Date(),
  };

  if (input.sku !== undefined) data.sku = input.sku.trim();
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.category !== undefined) data.category = input.category.trim();
  if (input.price !== undefined) data.price = new Prisma.Decimal(input.price);
  if (input.unit !== undefined) data.unit = input.unit.trim();
  if (input.description !== undefined) data.description = input.description.trim() || null;
  if (input.status !== undefined) data.status = input.status;
  if (input.updatedById !== undefined) data.updatedById = input.updatedById;

  const material = await db.promotionalMaterial.update({
    where: { id },
    data,
  });

  return {
    ...material,
    price: material.price ? Number(material.price) : 0,
  };
}

/**
 * Soft delete promotional material
 */
export async function softDeletePromotionalMaterial(id: string) {
  return db.promotionalMaterial.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });
}

/**
 * Check if a promotional material is used in any activity plans
 */
export async function checkPromotionalMaterialUsage(productName: string) {
  const count = await db.activityPlanItem.count({
    where: {
      storeProductName: productName,
    },
  });
  return count;
}
