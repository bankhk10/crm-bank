import { Prisma } from "@prisma/client";
import type {
  PrismaTransaction,
  StrategyValidationResult,
  WorkTypeStrategy,
} from "@/modules/activity/types/strategy.interface";

/**
 * Type 3 Strategy: เสนอขายสินค้า (Product Sales Proposal)
 * Handles validation, persistence into dedicated tables (ActivityPlanType3Target & ActivityPlanType3Product)
 * as well as generic relation tables (ActivityPlanStore, ActivityPlanProduct, ActivityResultSaleItem).
 */
export const type3PlannedStrategy: WorkTypeStrategy = {
  code: "TYPE_3",

  /**
   * Validate business rules for Type 3 before saving Plan
   */
  async validatePlan(planData: any, db: any): Promise<StrategyValidationResult> {
    const rawStores: any[] = planData.planStores || planData.stores || [];
    const rawProducts: any[] = planData.planProducts || planData.products || [];
    const t3Items: any[] = planData.type3Items || [];

    const t3Stores = rawStores.filter(
      (s) =>
        !s.workTypeCode ||
        s.workTypeCode === "TYPE_3" ||
        s.workTypeCode === "เสนอขายสินค้า",
    );
    const t3Products = rawProducts.filter(
      (p) =>
        !p.workTypeCode ||
        p.workTypeCode === "TYPE_3" ||
        p.workTypeCode === "เสนอขายสินค้า",
    );

    if (t3Stores.length === 0 && t3Products.length === 0 && t3Items.length === 0) {
      return {
        valid: false,
        error: "กรุณาระบุร้านค้าเป้าหมายและรายการสินค้าที่เสนอขาย (Type 3)",
      };
    }

    // Check store existence if storeId is provided
    for (const s of t3Stores) {
      if (s.storeId) {
        const customer = await db.customer.findUnique({
          where: { id: s.storeId },
          select: { id: true, customerType: true },
        });
        if (!customer) {
          return { valid: false, error: "ไม่พบข้อมูลร้านค้าในระบบ" };
        }
      }
    }

    return { valid: true };
  },

  /**
   * Save Type 3 Plan data (stores & products) inside an atomic transaction
   */
  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    const rawTargets: any[] = planData.type3Targets || planData.type3Items || [];
    const rawStores: any[] = planData.planStores || planData.stores || [];
    const rawProducts: any[] = planData.planProducts || planData.products || [];

    const t3Stores = rawStores.filter(
      (s) =>
        !s.workTypeCode ||
        s.workTypeCode === "TYPE_3" ||
        s.workTypeCode === "เสนอขายสินค้า",
    );
    const t3Products = rawProducts.filter(
      (p) =>
        !p.workTypeCode ||
        p.workTypeCode === "TYPE_3" ||
        p.workTypeCode === "เสนอขายสินค้า",
    );

    // 1. Clean up existing dedicated tables
    await (tx as any).activityPlanType3Target.deleteMany({
      where: { activityPlanId },
    });

    // 2. Clean up existing generic relation tables
    await tx.activityPlanProduct.deleteMany({
      where: {
        activityPlanId,
        workTypeCode: "TYPE_3",
      },
    });

    await tx.activityPlanStore.deleteMany({
      where: {
        activityPlanId,
        workTypeCode: "TYPE_3",
      },
    });

    // 3. Save into Dedicated Tables
    if (rawTargets.length > 0) {
      for (const t of rawTargets) {
        const isSubDealer = Boolean(t.isSubDealer);
        const targetRecord = await (tx as any).activityPlanType3Target.create({
          data: {
            activityPlanId,
            storeId: t.storeId || null,
            isSubDealer,
            subDealerStore: isSubDealer ? t.subDealerStore || null : null,
            notes: t.detail || t.notes || null,
          },
        });

        const targetProducts = Array.isArray(t.products)
          ? t.products
          : t.productId
            ? [
                {
                  productId: t.productId,
                  quantity: t.quantity || 1,
                  unitPrice: t.unitPrice || 0,
                  price: t.price || 0,
                  notes: t.notes || null,
                },
              ]
            : [];

        const validProducts = targetProducts.filter(
          (p: any) => p && (p.productId || p.productName),
        );

        if (validProducts.length > 0) {
          await (tx as any).activityPlanType3Product.createMany({
            data: validProducts.map((p: any) => {
              const qty = p.quantity != null ? Number(p.quantity) : 1;
              const unitPrice =
                p.unitPrice != null
                  ? new Prisma.Decimal(p.unitPrice)
                  : p.price != null
                    ? new Prisma.Decimal(p.price)
                    : null;
              const targetAmount =
                p.price != null
                  ? new Prisma.Decimal(p.price)
                  : unitPrice != null
                    ? unitPrice.mul(qty)
                    : null;

              return {
                targetId: targetRecord.id,
                activityPlanId,
                productId: p.productId,
                targetQuantity: qty,
                unitPrice,
                targetAmount,
                notes: p.notes || null,
              };
            }),
          });
        }
      }
    } else if (t3Stores.length > 0) {
      // Fallback: Build dedicated targets from t3Stores & t3Products
      for (const s of t3Stores) {
        const isSubDealer = Boolean(s.isSubDealer || s.subDealerStore);
        const targetRecord = await (tx as any).activityPlanType3Target.create({
          data: {
            activityPlanId,
            storeId: s.storeId || null,
            isSubDealer,
            subDealerStore: isSubDealer ? s.subDealerStore || null : null,
            notes: s.notes || s.remarks || null,
          },
        });

        const matchedProds = t3Products.filter(
          (p) => !p.storeId || p.storeId === s.storeId,
        );
        const effectiveProds =
          matchedProds.length > 0 ? matchedProds : t3Products;

        if (effectiveProds.length > 0) {
          await (tx as any).activityPlanType3Product.createMany({
            data: effectiveProds.map((p) => {
              const qty = p.targetQuantity != null ? Number(p.targetQuantity) : 1;
              const unitPrice =
                p.unitPrice != null ? new Prisma.Decimal(p.unitPrice) : null;
              const targetAmount =
                p.targetAmount != null
                  ? new Prisma.Decimal(p.targetAmount)
                  : unitPrice != null
                    ? unitPrice.mul(qty)
                    : null;

              return {
                targetId: targetRecord.id,
                activityPlanId,
                productId: p.productId,
                targetQuantity: qty,
                unitPrice,
                targetAmount,
                notes: p.notes || null,
              };
            }),
          });
        }
      }
    }

    // 4. Sync to Generic Tables (activity_plan_stores & activity_plan_products)
    if (t3Stores.length > 0) {
      await tx.activityPlanStore.createMany({
        data: t3Stores.map((s) => ({
          activityPlanId,
          workTypeCode: "TYPE_3",
          storeId: s.storeId || null,
          storeName: s.storeName || null,
          subDealerStore: s.subDealerStore || null,
          notes: s.notes || null,
        })),
      });
    }

    if (t3Products.length > 0) {
      await tx.activityPlanProduct.createMany({
        data: t3Products.map((p) => {
          const qty = p.targetQuantity != null ? Number(p.targetQuantity) : 1;
          const unitPrice =
            p.unitPrice != null ? new Prisma.Decimal(p.unitPrice) : null;
          const targetAmount =
            p.targetAmount != null
              ? new Prisma.Decimal(p.targetAmount)
              : unitPrice != null
                ? unitPrice.mul(qty)
                : null;

          return {
            activityPlanId,
            workTypeCode: "TYPE_3",
            storeId: p.storeId || null,
            productId: p.productId,
            productName: p.productName || null,
            targetQuantity: qty,
            unitPrice,
            targetAmount,
            notes: p.notes || null,
          };
        }),
      });
    }
  },

  /**
   * Save Type 3 Actual Outcome (ActivityResultSaleItem)
   */
  async saveActual(
    tx: PrismaTransaction,
    activityPlanId: string,
    actualData: any,
  ): Promise<void> {
    const saleResults: any[] =
      actualData.productSalesDetails ||
      actualData.saleResults ||
      actualData.t3ProductSalesDetails ||
      [];

    const t3SaleResults = saleResults.filter(
      (s) =>
        !s.workTypeCode ||
        s.workTypeCode === "TYPE_3" ||
        s.workTypeCode === "เสนอขายสินค้า",
    );

    let result = await tx.activityResult.findFirst({
      where: { activityPlanId },
      select: { id: true },
    });

    if (!result) {
      const plan = await tx.activityPlan.findUnique({
        where: { id: activityPlanId },
        select: { startDate: true, endDate: true },
      });

      if (plan) {
        result = await tx.activityResult.create({
          data: {
            activityPlanId,
            actualStartDate: actualData.actualStartDate || plan.startDate,
            actualEndDate: actualData.actualEndDate || plan.endDate,
            resultStatus: actualData.resultStatus || "COMPLETED",
          },
          select: { id: true },
        });
      }
    }

    if (!result) return;

    await (tx as any).activityResultSaleItem.deleteMany({
      where: {
        activityResultId: result.id,
        workTypeCode: "TYPE_3",
      },
    });

    if (t3SaleResults.length > 0) {
      await (tx as any).activityResultSaleItem.createMany({
        data: t3SaleResults.map((item) => {
          const qty = Number(item.actualQty ?? item.actualQuantity ?? 0);
          const unitPrice = new Prisma.Decimal(
            item.unitPrice ?? item.actualUnitPrice ?? 0,
          );
          const total =
            item.actualSales != null || item.actualTotal != null
              ? new Prisma.Decimal(item.actualSales ?? item.actualTotal)
              : unitPrice.mul(qty);

          return {
            activityResultId: result.id,
            workTypeCode: "TYPE_3",
            storeId: item.storeId || null,
            productId: item.productId,
            productName: item.productName || null,
            actualQuantity: qty,
            actualUnitPrice: unitPrice,
            actualTotal: total,
            unclosedReason: item.unclosedReason || null,
            isAdditional: Boolean(item.isAdditional),
          };
        }),
      });
    }
  },

  /**
   * Load Type 3 Stores and Products from Dedicated Tables with fallback
   */
  async loadPlan(
    tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<{ targets: any[]; stores: any[]; products: any[] }> {
    const dedicatedTargets = await (tx as any).activityPlanType3Target.findMany({
      where: { activityPlanId },
      include: {
        store: true,
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    if (dedicatedTargets && dedicatedTargets.length > 0) {
      const stores = dedicatedTargets.map((t: any) => ({
        id: t.id,
        workTypeCode: "TYPE_3",
        storeId: t.storeId,
        storeName: t.store?.name || null,
        subDealerStore: t.subDealerStore,
        notes: t.notes,
      }));

      const products = dedicatedTargets.flatMap((t: any) =>
        (t.products || []).map((p: any) => ({
          id: p.id,
          workTypeCode: "TYPE_3",
          storeId: t.storeId,
          productId: p.productId,
          productName: p.product?.name || null,
          targetQuantity: p.targetQuantity,
          unitPrice: p.unitPrice ? Number(p.unitPrice) : null,
          targetAmount: p.targetAmount ? Number(p.targetAmount) : null,
          notes: p.notes,
        })),
      );

      return { targets: dedicatedTargets, stores, products };
    }

    // Fallback: load from generic tables
    const stores = await tx.activityPlanStore.findMany({
      where: {
        activityPlanId,
        workTypeCode: "TYPE_3",
      },
      include: { store: true },
    });

    const products = await tx.activityPlanProduct.findMany({
      where: {
        activityPlanId,
        workTypeCode: "TYPE_3",
      },
      include: { product: true },
    });

    return { targets: [], stores, products };
  },

  /**
   * Load Type 3 Actual Results
   */
  async loadActual(
    tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<any | null> {
    const result = await tx.activityResult.findFirst({
      where: { activityPlanId },
      include: {
        saleResults: {
          where: { workTypeCode: "TYPE_3" },
          include: {
            product: true,
            store: true,
          },
        },
      },
    });

    return result;
  },
};
