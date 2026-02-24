"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { isAuthorized } from "@/modules/rbac";
import {
  createProductUseCase,
  updateProductUseCase,
  manageProductUseCase,
  getProductDetailUseCase,
  listProductsUseCase,
  getProductFormOptionsUseCase,
} from "../application";
import {
  softDeleteProduct,
  type ListProductsParams,
} from "../infrastructure/product.repository";
import { deleteFolder } from "@/lib/file-storage";

const resourcePath = "/api/products";

/**
 * List products with pagination & filtering.
 */
export async function listProductsAction(params: ListProductsParams) {
  const session = await auth();
  if (!session?.user) return { products: [], total: 0 };

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    return { products: [], total: 0 };
  }

  try {
    const result = await listProductsUseCase(params);
    // Serialize Decimal fields (price, cartonPrice, promotionBudget) for client
    return JSON.parse(JSON.stringify(result));
  } catch (_err) {
    return { products: [], total: 0 };
  }
}

/**
 * Get a single product by ID.
 */
export async function getProductAction(id: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  try {
    const result = await getProductDetailUseCase(id);
    // Serialize Decimal fields for client component compatibility
    if (result.success && result.product) {
      return {
        success: true as const,
        product: JSON.parse(JSON.stringify(result.product)),
      };
    }
    return result;
  } catch (_err) {
    return { success: false, error: "Failed to fetch" };
  }
}

/**
 * Create a new product.
 */
export async function createProductAction(rawData: unknown) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const permissionKeys = session.user.permissionKeys ?? [];
  if (!isAuthorized(resourcePath, permissionKeys)) {
    return { success: false, error: "Forbidden" };
  }

  if (!permissionKeys.includes("product.create")) {
    return { success: false, error: "Forbidden - missing product.create" };
  }

  try {
    const result = await createProductUseCase(rawData);
    if (result.success) {
      revalidatePath("/products");
    }
    return JSON.parse(JSON.stringify(result));
  } catch (err: any) {
    return {
      success: false,
      error: err.message ?? "An unexpected error occurred.",
    };
  }
}

/**
 * Update an existing product.
 */
export async function updateProductAction(id: string, rawData: unknown) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const permissionKeys = session.user.permissionKeys ?? [];
  if (!isAuthorized(resourcePath, permissionKeys)) {
    return { success: false, error: "Forbidden" };
  }

  if (
    !permissionKeys.includes("product.edit") &&
    !permissionKeys.includes("product.manage")
  ) {
    return { success: false, error: "Forbidden - missing product.edit" };
  }

  try {
    const result = await updateProductUseCase(id, rawData);
    if (result.success) {
      revalidatePath("/products");
      revalidatePath(`/products/${id}`);
      revalidatePath(`/products/${id}/edit`);
    }
    return JSON.parse(JSON.stringify(result));
  } catch (err: any) {
    return {
      success: false,
      error: err.message ?? "An unexpected error occurred.",
    };
  }
}

/**
 * Manage a product (pricing, stock, promotion).
 */
export async function manageProductAction(id: string, rawData: unknown) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const permissionKeys = session.user.permissionKeys ?? [];
  if (!isAuthorized(resourcePath, permissionKeys)) {
    return { success: false, error: "Forbidden" };
  }

  if (!permissionKeys.includes("product.manage")) {
    return { success: false, error: "Forbidden - missing product.manage" };
  }

  try {
    const result = await manageProductUseCase(id, rawData);
    if (result.success) {
      revalidatePath("/products");
      revalidatePath(`/products/${id}`);
      revalidatePath(`/products/${id}/manage`);
    }
    return JSON.parse(JSON.stringify(result));
  } catch (err: any) {
    return {
      success: false,
      error: err.message ?? "An unexpected error occurred.",
    };
  }
}

/**
 * Delete a product (soft delete).
 */
export async function deleteProductAction(id: string) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const permissionKeys = session.user.permissionKeys ?? [];
  if (!isAuthorized(resourcePath, permissionKeys)) {
    return { success: false, error: "Forbidden" };
  }

  if (!permissionKeys.includes("product.delete")) {
    return { success: false, error: "Forbidden - missing product.delete" };
  }

  try {
    // Delete images physically
    try {
      await deleteFolder(`products/${id}`);
    } catch (_err) {
      console.error("Failed to delete product folder:", _err);
    }

    await softDeleteProduct(id);
    revalidatePath("/products");
    return { success: true };
  } catch (_err) {
    return { success: false, error: "Failed to delete product." };
  }
}

/**
 * Get form options for product creation/editing.
 * Returns all dropdown options in a single call.
 */
export async function getProductFormOptionsAction() {
  const session = await auth();
  if (!session?.user) return null;

  try {
    return await getProductFormOptionsUseCase();
  } catch (_err) {
    return null;
  }
}
