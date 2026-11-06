import { prisma } from "@/lib/db";
import type { PrismaTransaction } from "@/modules/activity/types/strategy.interface";

/**
 * Find Type 8 plan and all dedicated relational data (targets, products, results)
 */
export async function findType8ByPlanId(activityPlanId: string, tx?: PrismaTransaction) {
  const db = tx || prisma;
  return (db as any).activityPlan.findUnique({
    where: { id: activityPlanId },
    include: {
      type8Targets: {
        include: {
          dealer: true,
          subdealer: true,
          products: {
            include: { product: true },
            orderBy: { createdAt: "asc" },
          },
          result: true,
        },
        orderBy: { createdAt: "asc" },
      },
      type8Products: {
        include: { product: true },
        orderBy: { createdAt: "asc" },
      },
      type8Results: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}
