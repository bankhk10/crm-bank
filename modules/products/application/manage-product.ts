import { Prisma } from "@/lib/db";
import {
  findProductById,
  manageProduct,
} from "../infrastructure/product.repository";
import { productManagementSchema } from "./validations";

/**
 * Use case: Manage product pricing, promotions, and stock.
 * Validates input, checks existence, and persists changes.
 */
export async function manageProductUseCase(id: string, rawData: unknown) {
  const parsed = productManagementSchema.safeParse(rawData);

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
    const product = await manageProduct(id, parsed.data);
    return { success: true as const, product };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return { success: false as const, error: "Product not found" };
    }
    throw err;
  }
}
