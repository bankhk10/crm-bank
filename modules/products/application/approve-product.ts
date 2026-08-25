import { Prisma } from "@/lib/db";
import {
  findProductById,
  approveProduct,
} from "../infrastructure/product.repository";

/**
 * Use case: Approve a product.
 * Validates existence, checks current status, ensures required info is present, and activates the product.
 */
export async function approveProductUseCase(
  id: string,
  approverUserId?: string | null,
) {
  if (!id || typeof id !== "string") {
    return { success: false as const, error: "Product ID is required" };
  }

  const existing = await findProductById(id);
  if (!existing) {
    return { success: false as const, error: "ไม่พบข้อมูลสินค้านี้ในระบบ" };
  }

  if (existing.status === "ACTIVE") {
    return {
      success: false as const,
      error: "สินค้านี้ได้รับการอนุมัติใช้งานอยู่แล้ว",
    };
  }

  if (!existing.name || !existing.productCode) {
    return {
      success: false as const,
      error: "ข้อมูลสินค้าไม่ครบถ้วน (ต้องมีชื่อสินค้าและรหัสสินค้า)",
    };
  }

  try {
    const product = await approveProduct(id, approverUserId);
    return { success: true as const, product };
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        return { success: false as const, error: "ไม่พบข้อมูลสินค้า" };
      }
    }
    throw err;
  }
}
