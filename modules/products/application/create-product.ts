import { Prisma } from "@/lib/db";
import {
  createProduct,
  findOrCreateTradeNameGroup,
} from "../infrastructure/product.repository";
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
    // Automatically resolve tradeNameGroupId from product name
    let tradeNameGroupId = parsed.data.tradeNameGroupId || null;
    if (parsed.data.name) {
      const resolvedGroupId = await findOrCreateTradeNameGroup(parsed.data.name);
      if (resolvedGroupId) {
        tradeNameGroupId = resolvedGroupId;
      }
    }

    const product = await createProduct({
      ...parsed.data,
      tradeNameGroupId,
      productGroupId: parsed.data.productGroupId || null,
      status: parsed.data.status as "ACTIVE" | "INACTIVE",
      packageSizeUnit: parsed.data.packageSizeUnit,
      categoryId: parsed.data.categoryId || null,
      productABCTypeId: parsed.data.productABCTypeId || null,
      parentId: parsed.data.parentId || null,
    });

    return { success: true as const, product };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaErr = err as Prisma.PrismaClientKnownRequestError;
      if (prismaErr.code === "P2002") {
        const target = (prismaErr.meta && (prismaErr.meta as any).target) || [];
        const fields = Array.isArray(target)
          ? target.join(", ")
          : String(target);
        return {
          success: false as const,
          error: `มีรหัสสินค้านี้อยู่ในระบบแล้ว: (${fields})`,
        };
      }
    }
    throw err;
  }
}
