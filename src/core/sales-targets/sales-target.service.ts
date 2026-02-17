import { db as prisma } from "@/src/infrastructure/database";
import { getRegionByProvince } from "@/lib/province-region-mapping";
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

    const [
      monthlyTargets,
      productGroupTargets,
      regionTargets,
      productTargets,
      detailedTargets,
    ] = await Promise.all([
      // Monthly Targets
      prisma.monthlySalesTarget.findMany({
        where: { year, deletedAt: null },
        orderBy: { month: "asc" },
      }),
      // Product Group Targets
      prisma.productGroupSalesTarget.findMany({
        where: { year, deletedAt: null },
        orderBy: [{ productGroup: "asc" }, { month: "asc" }],
      }),
      // Region Targets
      prisma.regionSalesTarget.findMany({
        where: { year, deletedAt: null },
        orderBy: [{ region: "asc" }, { month: "asc" }],
      }),
      // Product Targets
      prisma.productSalesTarget.findMany({
        where: { year, deletedAt: null },
        include: {
          product: {
            select: {
              id: true,
              productCode: true,
              name: true,
              productGroup: true,
            },
          },
        },
        orderBy: [{ productId: "asc" }, { month: "asc" }],
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
      productGroupTargets,
      regionTargets,
      productTargets,
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
    const syncKeys = new Map<string, { year: number; month: number }>();

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

      if (year && month) {
        syncKeys.set(`${year}-${month}`, { year, month });
      }
    }

    // Sync Derived Targets
    await Promise.all(
      Array.from(syncKeys.values()).map(({ year, month }) =>
        this.syncDerivedTargets(year, month),
      ),
    );

    return results;
  }

  async syncDerivedTargets(year: number, month: number) {
    const detailedTargets = await prisma.salesTarget.findMany({
      where: { year, month },
      include: {
        customer: {
          select: {
            region: true,
            province: true,
          },
        },
        items: {
          include: {
            product: {
              select: { productGroup: true },
            },
          },
        },
      },
    });

    const regionTotals = new Map<string, number>();
    const productGroupTotals = new Map<string, number>();

    detailedTargets.forEach((target) => {
      const region =
        target.customer.region?.trim() ||
        getRegionByProvince(target.customer.province);

      target.items.forEach((item) => {
        const amount = Number(item.amount || 0);

        if (region) {
          regionTotals.set(region, (regionTotals.get(region) || 0) + amount);
        }

        const productGroup = item.product?.productGroup?.trim();
        if (productGroup) {
          productGroupTotals.set(
            productGroup,
            (productGroupTotals.get(productGroup) || 0) + amount,
          );
        }
      });
    });

    const regionKeys = [...regionTotals.keys()];
    const productGroupKeys = [...productGroupTotals.keys()];

    const regionOps = regionKeys.map((region) =>
      prisma.regionSalesTarget.upsert({
        where: { region_year_month: { region, year, month } },
        update: { targetAmount: regionTotals.get(region) || 0 },
        create: {
          region,
          year,
          month,
          targetAmount: regionTotals.get(region) || 0,
        },
      }),
    );

    const productGroupOps = productGroupKeys.map((productGroup) =>
      prisma.productGroupSalesTarget.upsert({
        where: { productGroup_year_month: { productGroup, year, month } },
        update: { targetAmount: productGroupTotals.get(productGroup) || 0 },
        create: {
          productGroup,
          year,
          month,
          targetAmount: productGroupTotals.get(productGroup) || 0,
        },
      }),
    );

    await prisma.$transaction([
      prisma.regionSalesTarget.deleteMany({
        where: {
          year,
          month,
          ...(regionKeys.length > 0 ? { region: { notIn: regionKeys } } : {}),
        },
      }),
      prisma.productGroupSalesTarget.deleteMany({
        where: {
          year,
          month,
          ...(productGroupKeys.length > 0
            ? { productGroup: { notIn: productGroupKeys } }
            : {}),
        },
      }),
      ...regionOps,
      ...productGroupOps,
    ]);
  }

  async saveLegacyTargets(
    type: "monthly" | "productGroup" | "region" | "product",
    targets: any[],
    userId: string,
    isAdmin: boolean,
    hasCreatePermission: boolean,
    hasEditPermission: boolean,
  ) {
    const results = [];

    for (const target of targets) {
      const {
        year,
        month,
        targetAmount,
        productGroup,
        region,
        productId,
        notes,
      } = target;

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
      } else if (type === "productGroup") {
        const existing = await prisma.productGroupSalesTarget.findFirst({
          where: { productGroup, year, month, deletedAt: null },
        });
        if (existing) {
          if (!isAdmin && !hasEditPermission) continue;
          results.push(
            await prisma.productGroupSalesTarget.update({
              where: { id: existing.id },
              data: { targetAmount, notes },
            }),
          );
        } else {
          if (!isAdmin && !hasCreatePermission) continue;
          results.push(
            await prisma.productGroupSalesTarget.create({
              data: {
                productGroup,
                year,
                month,
                targetAmount,
                notes,
                createdById: userId,
              },
            }),
          );
        }
      } else if (type === "region") {
        const existing = await prisma.regionSalesTarget.findFirst({
          where: { region, year, month, deletedAt: null },
        });
        if (existing) {
          if (!isAdmin && !hasEditPermission) continue;
          results.push(
            await prisma.regionSalesTarget.update({
              where: { id: existing.id },
              data: { targetAmount, notes },
            }),
          );
        } else {
          if (!isAdmin && !hasCreatePermission) continue;
          results.push(
            await prisma.regionSalesTarget.create({
              data: {
                region,
                year,
                month,
                targetAmount,
                notes,
                createdById: userId,
              },
            }),
          );
        }
      } else if (type === "product") {
        const existing = await prisma.productSalesTarget.findFirst({
          where: { productId, year, month, deletedAt: null },
        });
        if (existing) {
          if (!isAdmin && !hasEditPermission) continue;
          results.push(
            await prisma.productSalesTarget.update({
              where: { id: existing.id },
              data: { targetAmount, notes },
            }),
          );
        } else {
          if (!isAdmin && !hasCreatePermission) continue;
          results.push(
            await prisma.productSalesTarget.create({
              data: {
                productId,
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
      select: { year: true, month: true },
    });

    if (!target) throw new Error("Target not found");

    await prisma.salesTarget.delete({
      where: { id },
    });

    if (target.year && target.month) {
      await this.syncDerivedTargets(target.year, target.month);
    }
    return true;
  }
}

export const salesTargetService = new SalesTargetService();
