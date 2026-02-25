import { Prisma } from "@/lib/db";
import { createProduct } from "../infrastructure/product.repository";
import { productSchema } from "./validations";

/**
 * Use case: Create a new product.
 * Validates input, checks uniqueness, and persists.
 */
export async function createProductUseCase(rawData: unknown) {
  const parsed = productSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false as const,
      error: "Invalid payload",
      issues: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const product = await createProduct({
      ...parsed.data,
      status: parsed.data.status as "ACTIVE" | "INACTIVE",
      categoryId: parsed.data.categoryId || null,
      productChainId: parsed.data.productChainId || null,
    });

    return { success: true as const, product };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const target = (err.meta && (err.meta as any).target) || [];
      const fields = Array.isArray(target) ? target.join(", ") : String(target);
      return {
        success: false as const,
        error: `มีรหัสสินค้านี้อยู่ในระบบแล้ว: (${fields})`,
      };
    }
    throw err;
  }
}
