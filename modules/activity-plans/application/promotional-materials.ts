import { z } from "zod";
import {
  findPromotionalMaterials,
  findActivePromotionalMaterialsGrouped,
  findDistinctCategories,
  findPromotionalMaterialById,
  createPromotionalMaterial,
  updatePromotionalMaterial,
  softDeletePromotionalMaterial,
  checkPromotionalMaterialUsage,
  type ListPromotionalMaterialsParams,
  type CreatePromotionalMaterialInput,
  type UpdatePromotionalMaterialInput,
} from "../infrastructure/promotional-material.repository";

// ─────────────────────────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────────────────────────

export const createPromotionalMaterialSchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อรายการ"),
  category: z.string().min(1, "กรุณาระบุหมวดหมู่"),
  price: z.number().min(0, "ราคาต้องไม่ติดลบ").default(0),
  unit: z.string().min(1, "กรุณาระบุหน่วยนับ").default("ชิ้น"),
  sku: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const updatePromotionalMaterialSchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อรายการ").optional(),
  category: z.string().min(1, "กรุณาระบุหมวดหมู่").optional(),
  price: z.number().min(0, "ราคาต้องไม่ติดลบ").optional(),
  unit: z.string().min(1, "กรุณาระบุหน่วยนับ").optional(),
  sku: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export type CreatePromotionalMaterialDto = z.infer<typeof createPromotionalMaterialSchema>;
export type UpdatePromotionalMaterialDto = z.infer<typeof updatePromotionalMaterialSchema>;

// ─────────────────────────────────────────────────────────────
// Use Cases
// ─────────────────────────────────────────────────────────────

export async function listPromotionalMaterialsUseCase(params: ListPromotionalMaterialsParams = {}) {
  return findPromotionalMaterials(params);
}

export async function getActivePromotionalMaterialsGroupedUseCase() {
  return findActivePromotionalMaterialsGrouped();
}

export async function getDistinctCategoriesUseCase() {
  return findDistinctCategories();
}

export async function getPromotionalMaterialDetailUseCase(id: string) {
  const item = await findPromotionalMaterialById(id);
  if (!item) {
    throw new Error("ไม่พบรายการสื่อส่งเสริมการขายนี้");
  }
  const usageCount = await checkPromotionalMaterialUsage(item.name);
  return {
    ...item,
    usageCount,
  };
}

export async function createPromotionalMaterialUseCase(
  rawData: unknown,
  userId?: string,
) {
  const parsed = createPromotionalMaterialSchema.safeParse(rawData);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
    throw new Error(errorMsg);
  }

  const input: CreatePromotionalMaterialInput = {
    ...parsed.data,
    createdById: userId,
  };

  const created = await createPromotionalMaterial(input);
  return {
    success: true,
    data: created,
  };
}

export async function updatePromotionalMaterialUseCase(
  id: string,
  rawData: unknown,
  userId?: string,
) {
  const existing = await findPromotionalMaterialById(id);
  if (!existing) {
    throw new Error("ไม่พบรายการที่ต้องการแก้ไข");
  }

  const parsed = updatePromotionalMaterialSchema.safeParse(rawData);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
    throw new Error(errorMsg);
  }

  const input: UpdatePromotionalMaterialInput = {
    ...parsed.data,
    updatedById: userId,
  };

  const updated = await updatePromotionalMaterial(id, input);
  return {
    success: true,
    data: updated,
  };
}

export async function deletePromotionalMaterialUseCase(id: string) {
  const existing = await findPromotionalMaterialById(id);
  if (!existing) {
    throw new Error("ไม่พบรายการที่ต้องการลบ");
  }

  const usageCount = await checkPromotionalMaterialUsage(existing.name);

  // Soft delete preserves all historical Activity Plan relations
  await softDeletePromotionalMaterial(id);

  return {
    success: true,
    usageCount,
    message: usageCount > 0
      ? `ลบรายการเรียบร้อย (มีประวัติการใช้งานใน Trip Plan ${usageCount} รายการ - ข้อมูลเดิมจะไม่ได้รับผลกระทบ)`
      : "ลบรายการเรียบร้อย",
  };
}
