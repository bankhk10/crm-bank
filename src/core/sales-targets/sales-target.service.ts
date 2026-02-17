import { db as prisma } from "@/src/infrastructure/database";
import {
  CreateDetailedTargetInput,
  UpdateDetailedTargetInput,
} from "./sales-target.types";

export interface SalesTargetQueryParams {
  year: number;
  month?: number;
  employeeId?: string;
  shopId?: string;
  targetId?: string;
}

export class SalesTargetService {
  async getSalesTargets(params: SalesTargetQueryParams) {
    const { year, month, employeeId, shopId, targetId } = params;

    if (targetId) {
      const detailedTarget = await prisma.salesTarget.findUnique({
        where: { id: targetId },
        include: {
          employee: true,
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });
      return { detailedTarget };
    }

    const [monthlyTargets, detailedTargets] = await Promise.all([
      // Monthly Targets (Legacy/Aggregated)
      prisma.monthlySalesTarget.findMany({
        where: { year, deletedAt: null },
        orderBy: { month: "asc" },
      }),
      // Detailed Targets
      prisma.salesTarget.findMany({
        where: {
          year,
          ...(month ? { month } : {}),
          ...(employeeId ? { employeeId } : {}),
          ...(shopId ? { customerId: shopId } : {}),
        },
        include: {
          employee: true,
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: [{ month: "asc" }, { createdAt: "desc" }],
      }),
    ]);

    return {
      monthlyTargets,
      detailedTargets,
    };
  }

  async saveDetailedTargets(
    targets: (CreateDetailedTargetInput | UpdateDetailedTargetInput)[],
    userId: string,
    isAdmin: boolean,
    hasCreatePermission: boolean,
    hasEditPermission: boolean,
  ) {
    const results = [];

    for (const target of targets) {
      const { year, month, employeeId, customerId, items } = target;
      const id = "id" in target ? target.id : undefined;

      if (id) {
        if (!isAdmin && !hasEditPermission) continue;

        // Delete existing items to replace them
        await prisma.salesTargetItem.deleteMany({
          where: { salesTargetId: id },
        });

        const updated = await prisma.salesTarget.update({
          where: { id },
          data: {
            year,
            month,
            employeeId,
            customerId,
            items: {
              create: items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                amount: item.amount,
              })),
            },
          },
          include: { items: true },
        });
        results.push(updated);
      } else {
        if (!isAdmin && !hasCreatePermission) continue;

        const created = await prisma.salesTarget.create({
          data: {
            year,
            month,
            employeeId,
            customerId,
            createdById: userId,
            items: {
              create: items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                amount: item.amount,
              })),
            },
          },
          include: { items: true },
        });
        results.push(created);
      }
    }

    return results;
  }

  async saveLegacyTargets(
    type: "monthly",
    targets: any[],
    userId: string,
    isAdmin: boolean,
    hasCreatePermission: boolean,
    hasEditPermission: boolean,
  ) {
    const results = [];

    for (const target of targets) {
      const { year, month, targetAmount, notes } = target;

      if (type === "monthly") {
        const existing = await prisma.monthlySalesTarget.findFirst({
          where: { year, month, deletedAt: null },
        });
        if (existing) {
          if (!isAdmin && !hasEditPermission) continue;
          results.push(
            await prisma.monthlySalesTarget.update({
              where: { id: existing.id },
              data: { targetAmount, notes },
            }),
          );
        } else {
          if (!isAdmin && !hasCreatePermission) continue;
          results.push(
            await prisma.monthlySalesTarget.create({
              data: {
                year,
                month,
                targetAmount,
                notes,
                createdById: userId,
              },
            }),
          );
        }
      }
    }
    return results;
  }

  async deleteSalesTarget(
    id: string,
    isAdmin: boolean,
    hasDeletePermission: boolean,
  ) {
    if (!isAdmin && !hasDeletePermission) {
      throw new Error("Forbidden");
    }

    const target = await prisma.salesTarget.findUnique({
      where: { id },
    });

    if (!target) throw new Error("Target not found");

    await prisma.salesTarget.delete({
      where: { id },
    });

    return true;
  }
}

export const salesTargetService = new SalesTargetService();
