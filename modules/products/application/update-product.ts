import { Prisma } from "@/lib/db";
import {
  findProductById,
  updateProduct,
} from "../infrastructure/product.repository";
import { productUpdateSchema } from "./validations";

/**
 * Use case: Update an existing product.
 * Validates input, checks existence, and persists changes.
 */
export async function updateProductUseCase(id: string, rawData: unknown) {
  const parsed = productUpdateSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false as const,
      error: "Invalid payload",
      issues: parsed.error.flatten().fieldErrors,
    };
  }

  // Check the product exists
  const existing = await findProductById(id);
  if (!existing) {
    return { success: false as const, error: "Product not found" };
  }

  try {
    const payloadToUpdate: Record<string, any> = { ...parsed.data };
    if ("parentId" in payloadToUpdate) {
      payloadToUpdate.parentId = payloadToUpdate.parentId || null;
    }
    const product = await updateProduct(id, payloadToUpdate);
    return { success: true as const, product };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const target =
        (err.meta && (err.meta as Record<string, unknown>).target) || [];
      const fields = Array.isArray(target) ? target.join(", ") : String(target);
      return {
        success: false as const,
        error: `มีรหัสสินค้านี้อยู่ในระบบแล้ว: (${fields})`,
      };
    }
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return { success: false as const, error: "Product not found" };
    }
    throw err;
  }
}
