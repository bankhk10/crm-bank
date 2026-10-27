import { prisma } from "@/lib/db";
import type { PrismaTransaction } from "@/modules/activity/types/strategy.interface";

/**
 * Finds Type 10 plan and all dedicated relational data (targets, products, results)
 * with backward compatibility fallback.
 */
export async function findType10ByPlanId(
  activityPlanId: string,
  tx?: PrismaTransaction,
) {
  const db = tx || prisma;
  return (db as any).activityPlan.findUnique({
    where: { id: activityPlanId },
    include: {
      type10Targets: {
        include: {
          type7aTarget: true,
          showcaseProduct: true,
          products: {
            include: { product: true },
            orderBy: { createdAt: "asc" },
          },
          result: true,
        },
        orderBy: { createdAt: "asc" },
      },
      type10Products: {
        include: { product: true },
        orderBy: { createdAt: "asc" },
      },
      type10Results: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}
