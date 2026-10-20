"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/modules/auth/infrastructure/next-auth";
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

function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/**
 * List promotional materials with filters and pagination
 */
export async function getPromotionalMaterialsAction(params: ListPromotionalMaterialsParams = {}) {
  const session = await auth();
  if (!session?.user) {
    return serialize({
      success: false,
      error: "Unauthorized",
      promotionalMaterials: [],
      total: 0,
      page: 1,
      perPage: 20,
      totalPages: 0,
    });
  }

  try {
    const result = await findPromotionalMaterials(params);
    return serialize({ success: true, ...result });
  } catch (err: any) {
    console.error("Failed to list promotional materials:", err);
    return serialize({
      success: false,
      error: err.message || "เกิดข้อผิดพลาดในการดึงข้อมูลสื่อส่งเสริมการขาย",
      promotionalMaterials: [],
      total: 0,
      page: 1,
      perPage: 20,
      totalPages: 0,
    });
  }
}

/**
 * Get active promotional materials grouped by category (for Budget Section dropdowns)
 */
export async function getActivePromotionalMaterialsGroupedAction() {
  try {
    const grouped = await findActivePromotionalMaterialsGrouped();
    return serialize({ success: true, grouped });
  } catch (err: any) {
    console.error("Failed to get grouped promotional materials:", err);
    return serialize({
      success: false,
      error: err.message || "เกิดข้อผิดพลาดในการดึงรายการสื่อส่งเสริมการขาย",
      grouped: {},
    });
  }
}

/**
 * Get distinct categories of promotional materials
 */
export async function getDistinctPromotionalCategoriesAction() {
  try {
    const categories = await findDistinctCategories();
    return serialize({ success: true, categories });
  } catch (err: any) {
    console.error("Failed to get distinct categories:", err);
    return serialize({ success: false, categories: [] });
  }
}

/**
 * Get promotional material detail by ID
 */
export async function getPromotionalMaterialDetailAction(id: string) {
  const session = await auth();
  if (!session?.user) {
    return serialize({ success: false, error: "Unauthorized" });
  }

  try {
    const material = await findPromotionalMaterialById(id);
    return serialize({ success: true, material });
  } catch (err: any) {
    return serialize({
      success: false,
      error: err.message || "ไม่พบข้อมูลสื่อส่งเสริมการขาย",
    });
  }
}

/**
 * Create a new promotional material
 */
export async function createPromotionalMaterialAction(rawData: any) {
  const session = await auth();
  if (!session?.user) {
    return serialize({ success: false, error: "Unauthorized" });
  }

  const perms = session.user.permissionKeys ?? [];
  const roles = (session.user as any)?.roles ?? [];
  const isAdmin =
    roles.includes("administrator") ||
    roles.includes("admin") ||
    roles.includes("ceo") ||
    (session.user as any)?.role === "administrator" ||
    (session.user as any)?.role === "ADMIN";

  const canCreate =
    isAdmin ||
    perms.includes("promotional_material.create") ||
    perms.includes("menu.promotional_materials") ||
    perms.includes("activity.manage") ||
    perms.includes("system.settings");

  if (!canCreate) {
    return serialize({
      success: false,
      error: "Forbidden: ไม่มีสิทธิ์สร้างสื่อส่งเสริมการขาย",
    });
  }

  try {
    const item = await createPromotionalMaterial({
      ...rawData,
      createdById: session.user.id,
    });
    revalidatePath("/activity-plans/promotional-materials");
    revalidatePath("/activity-plans/new");
    revalidatePath("/activity-plans");
    return serialize({ success: true, data: item });
  } catch (err: any) {
    return serialize({
      success: false,
      error: err.message || "ไม่สามารถบันทึกข้อมูลสื่อส่งเสริมการขายได้",
    });
  }
}

/**
 * Update an existing promotional material
 */
export async function updatePromotionalMaterialAction(id: string, rawData: any) {
  const session = await auth();
  if (!session?.user) {
    return serialize({ success: false, error: "Unauthorized" });
  }

  const perms = session.user.permissionKeys ?? [];
  const roles = (session.user as any)?.roles ?? [];
  const isAdmin =
    roles.includes("administrator") ||
    roles.includes("admin") ||
    roles.includes("ceo") ||
    (session.user as any)?.role === "administrator" ||
    (session.user as any)?.role === "ADMIN";

  const canEdit =
    isAdmin ||
    perms.includes("promotional_material.edit") ||
    perms.includes("menu.promotional_materials") ||
    perms.includes("activity.manage") ||
    perms.includes("system.settings");

  if (!canEdit) {
    return serialize({
      success: false,
      error: "Forbidden: ไม่มีสิทธิ์แก้ไขสื่อส่งเสริมการขาย",
    });
  }

  try {
    const item = await updatePromotionalMaterial(id, {
      ...rawData,
      updatedById: session.user.id,
    });
    revalidatePath("/activity-plans/promotional-materials");
    revalidatePath("/activity-plans/new");
    revalidatePath("/activity-plans");
    return serialize({ success: true, data: item });
  } catch (err: any) {
    return serialize({
      success: false,
      error: err.message || "ไม่สามารถแก้ไขข้อมูลสื่อส่งเสริมการขายได้",
    });
  }
}

/**
 * Delete (Soft Delete) a promotional material
 */
export async function deletePromotionalMaterialAction(id: string) {
  const session = await auth();
  if (!session?.user) {
    return serialize({ success: false, error: "Unauthorized" });
  }

  const perms = session.user.permissionKeys ?? [];
  const roles = (session.user as any)?.roles ?? [];
  const isAdmin =
    roles.includes("administrator") ||
    roles.includes("admin") ||
    roles.includes("ceo") ||
    (session.user as any)?.role === "administrator" ||
    (session.user as any)?.role === "ADMIN";

  const canDelete =
    isAdmin ||
    perms.includes("promotional_material.delete") ||
    perms.includes("menu.promotional_materials") ||
    perms.includes("activity.manage") ||
    perms.includes("system.settings");

  if (!canDelete) {
    return serialize({
      success: false,
      error: "Forbidden: ไม่มีสิทธิ์ลบสื่อส่งเสริมการขาย",
    });
  }

  try {
    const usageCount = await checkPromotionalMaterialUsage(id);
    if (usageCount > 0) {
      return serialize({
        success: false,
        error: `ไม่สามารถลบรายการนี้ได้เนื่องจากถูกอ้างอิงอยู่ในกิจกรรมแล้ว (${usageCount} รายการ)`,
      });
    }

    const item = await softDeletePromotionalMaterial(id);
    revalidatePath("/activity-plans/promotional-materials");
    revalidatePath("/activity-plans/new");
    revalidatePath("/activity-plans");
    return serialize({ success: true, data: item });
  } catch (err: any) {
    return serialize({
      success: false,
      error: err.message || "ไม่สามารถลบข้อมูลสื่อส่งเสริมการขายได้",
    });
  }
}
