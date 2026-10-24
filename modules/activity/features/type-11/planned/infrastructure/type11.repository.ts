import { prisma } from "@/lib/db";
import type { PrismaTransaction } from "@/modules/activity/types/strategy.interface";

/**
 * Finds Type 11 plan and its dedicated relational data (targets, products, results).
 */
export async function findType11ByPlanId(
  activityPlanId: string,
  tx?: PrismaTransaction,
) {
  const db = tx || prisma;
  return (db as any).activityPlan.findUnique({
    where: { id: activityPlanId },
    include: {
      type11Targets: {
        include: {
          store: true,
          dealer: true,
          products: {
            include: { product: true },
            orderBy: { createdAt: "asc" },
          },
          result: true,
        },
        orderBy: { createdAt: "asc" },
      },
      type11Products: {
        include: { product: true },
        orderBy: { createdAt: "asc" },
      },
      type11Results: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

/**
 * Finds Type 11 stores for an activity plan strictly from dedicated targets.
 */
export async function findType11StoresByPlanId(
  activityPlanId: string,
  tx?: PrismaTransaction,
) {
  const db = tx || prisma;
  return (db as any).activityPlanType11Target.findMany({
    where: { activityPlanId },
    include: {
      store: true,
      dealer: true,
      products: {
        include: { product: true },
        orderBy: { createdAt: "asc" },
      },
      result: true,
    },
    orderBy: { createdAt: "asc" },
  });
}
