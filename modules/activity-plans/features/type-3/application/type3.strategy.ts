import { Prisma } from "@prisma/client";
import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity-plans/application/strategies/work-type-strategy.interface";

/**
 * Type 3 Strategy (เสนอขายสินค้า / Sales Proposal)
 * Encapsulates validation, persistence (Dedicated Table: ActivityPlanType3Target & ActivityPlanType3Product),
 * and loading for Type 3 plans and actual sales results.
 */
export const type3Strategy: WorkTypeStrategy = {
  code: "TYPE_3",

  /**
   * Validate business rules for Type 3 before saving Plan
   */
  async validatePlan(planData: any, _db: any): Promise<StrategyValidationResult> {
    const rawStores: any[] = planData.planStores || planData.stores || [];
    const rawProducts: any[] = planData.planProducts || planData.products || [];

    const t3Stores = rawStores.filter(
      (s) => !s.workTypeCode || s.workTypeCode === "TYPE_3" || s.workTypeCode === "เสนอขายสินค้า",
    );
    const t3Products = rawProducts.filter(
      (p) => !p.workTypeCode || p.workTypeCode === "TYPE_3" || p.workTypeCode === "เสนอขายสินค้า",
    );

    // If Type 3 is active, ensure at least one target store or product is specified
    if (t3Stores.length === 0 && t3Products.length === 0) {
      return {
        valid: false,
        error: "กรุณาระบุร้านค้าเป้าหมายหรือสินค้าที่ต้องการเสนอขาย (Type 3)",
      };
    }

    return { valid: true };
  },

  /**
   * Save Type 3 Plan data (stores & products) inside an atomic transaction
   * Persists to dedicated tables (ActivityPlanType3Target & ActivityPlanType3Product)
   * while keeping backward-compatible sync with legacy tables.
   */
  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    const rawStores: any[] = planData.planStores || planData.stores || [];
    const rawProducts: any[] = planData.planProducts || planData.products || [];

    const t3Stores = rawStores.filter(
      (s) => !s.workTypeCode || s.workTypeCode === "TYPE_3" || s.workTypeCode === "เสนอขายสินค้า",
    );
    const t3Products = rawProducts.filter(
      (p) => !p.workTypeCode || p.workTypeCode === "TYPE_3" || p.workTypeCode === "เสนอขายสินค้า",
    );

    // ─────────────────────────────────────────────────────────────
    // 1. DEDICATED TABLES: ActivityPlanType3Target & Product
    // ─────────────────────────────────────────────────────────────
    await (tx as any).activityPlanType3Product.deleteMany({
      where: { activityPlanId },
    });

    await (tx as any).activityPlanType3Target.deleteMany({
      where: { activityPlanId },
    });

    if (t3Stores.length > 0) {
      for (let idx = 0; idx < t3Stores.length; idx++) {
        const s = t3Stores[idx];
        const isSub = Boolean(s.isSubDealer || s.subDealerStore);

        const targetRecord = await (tx as any).activityPlanType3Target.create({
          data: {
            activityPlanId,
            storeId: s.storeId || null,
            isSubDealer: isSub,
            subDealerStore: s.subDealerStore || null,
            notes: s.notes || s.remarks || null,
          },
        });

        // Find products belonging to this target
        const matchedProducts = t3Stores.length === 1
          ? t3Products
          : t3Products.filter((p) => p.storeId && s.storeId && p.storeId === s.storeId);

        const effectiveProducts = matchedProducts.length > 0
          ? matchedProducts
          : (idx === 0 && t3Products.some((p) => !p.storeId)
              ? t3Products.filter((p) => !p.storeId)
              : []);

        if (effectiveProducts.length > 0) {
          await (tx as any).activityPlanType3Product.createMany({
            data: effectiveProducts.map((p) => {
              const qty = p.targetQuantity != null ? Number(p.targetQuantity) : null;
              const unitPrice = p.unitPrice != null ? new Prisma.Decimal(p.unitPrice) : null;
              const targetAmount = p.targetAmount != null
                ? new Prisma.Decimal(p.targetAmount)
                : qty != null && unitPrice != null
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
    } else if (t3Products.length > 0) {
      // If products exist without explicit stores, create a default target record
      const defaultTarget = await (tx as any).activityPlanType3Target.create({
        data: {
          activityPlanId,
          storeId: null,
          isSubDealer: false,
          subDealerStore: null,
          notes: null,
        },
      });

      await (tx as any).activityPlanType3Product.createMany({
        data: t3Products.map((p) => {
          const qty = p.targetQuantity != null ? Number(p.targetQuantity) : null;
          const unitPrice = p.unitPrice != null ? new Prisma.Decimal(p.unitPrice) : null;
          const targetAmount = p.targetAmount != null
            ? new Prisma.Decimal(p.targetAmount)
            : qty != null && unitPrice != null
              ? unitPrice.mul(qty)
              : null;

          return {
            targetId: defaultTarget.id,
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

    // ─────────────────────────────────────────────────────────────
    // 2. DUAL-WRITE SYNC TO LEGACY TABLES (activityPlanStore & Product)
    // ─────────────────────────────────────────────────────────────
    // Only perform legacy sync if the caller is delegating specific Type 3 handling
    if (planData._syncLegacy !== false) {
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

      if (t3Stores.length > 0) {
        await tx.activityPlanStore.createMany({
          data: t3Stores.map((s) => ({
            activityPlanId,
            workTypeCode: "TYPE_3",
            storeId: s.storeId || null,
            subDealerStore: s.subDealerStore || null,
            notes: s.notes || s.remarks || null,
          })),
        });
      }

      if (t3Products.length > 0) {
        await tx.activityPlanProduct.createMany({
          data: t3Products.map((p) => {
            const qty = p.targetQuantity != null ? Number(p.targetQuantity) : null;
            const unitPrice = p.unitPrice != null ? new Prisma.Decimal(p.unitPrice) : null;
            const targetAmount = p.targetAmount != null
              ? new Prisma.Decimal(p.targetAmount)
              : qty != null && unitPrice != null
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
    }
  },

  /**
   * Save Type 3 Actual Outcome (ActivityResultSaleItem)
   */
  async saveActual(
    tx: PrismaTransaction,
    activityPlanId: string,
    outcomeData: any,
  ): Promise<void> {
    const saleResults: any[] =
      outcomeData.productSalesDetails ||
      outcomeData.saleResults ||
      outcomeData.t3ProductSalesDetails ||
      [];

    const t3SaleResults = saleResults.filter(
      (s) => !s.workTypeCode || s.workTypeCode === "TYPE_3" || s.workTypeCode === "เสนอขายสินค้า",
    );

    let resultId = outcomeData.activityResultId;
    if (!resultId) {
      const result = await tx.activityResult.findFirst({
        where: { activityPlanId },
        select: { id: true },
      });
      resultId = result?.id;
    }

    if (!resultId) return;

    await (tx as any).activityResultSaleItem.deleteMany({
      where: {
        activityResultId: resultId,
        workTypeCode: "TYPE_3",
      },
    });

    if (t3SaleResults.length > 0) {
      await (tx as any).activityResultSaleItem.createMany({
        data: t3SaleResults.map((item) => {
          const qty = Number(item.actualQty ?? item.actualQuantity ?? 0);
          const unitPrice = new Prisma.Decimal(item.unitPrice ?? item.actualUnitPrice ?? 0);
          const total = item.actualSales != null || item.actualTotal != null
            ? new Prisma.Decimal(item.actualSales ?? item.actualTotal)
            : unitPrice.mul(qty);

          return {
            activityResultId: resultId,
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
   * Load Type 3 Stores and Products from Dedicated Tables with fallback to legacy
   */
  async loadPlan(
    tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<{ stores: any[]; products: any[] }> {
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
        isSubDealer: t.isSubDealer,
        subDealerStore: t.subDealerStore,
        notes: t.notes,
        store: t.store,
      }));

      const products = dedicatedTargets.flatMap((t: any) =>
        (t.products || []).map((p: any) => ({
          id: p.id,
          workTypeCode: "TYPE_3",
          storeId: t.storeId,
          productId: p.productId,
          productName: p.product?.name || null,
          targetQuantity: p.targetQuantity,
          unitPrice: p.unitPrice,
          targetAmount: p.targetAmount,
          notes: p.notes,
          product: p.product,
        })),
      );

      return { stores, products };
    }

    // Fallback: Legacy tables
    const stores = await tx.activityPlanStore.findMany({
      where: {
        activityPlanId,
        workTypeCode: "TYPE_3",
      },
      include: {
        store: true,
      },
    });

    const products = await tx.activityPlanProduct.findMany({
      where: {
        activityPlanId,
        workTypeCode: "TYPE_3",
      },
      include: {
        product: true,
      },
    });

    return { stores, products };
  },
};
