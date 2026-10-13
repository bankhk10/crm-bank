import { db } from "@/lib/db";

/**
 * Find all active product categories (ProductCategory)
 */
export async function findProductCategories() {
  return db.productCategory.findMany({
    where: { deletedAt: null },
    orderBy: { code: "asc" },
    select: {
      id: true,
      code: true,
      description: true,
    },
  });
}
