import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity-plans/application/strategies/work-type-strategy.interface";
import { extractType5PlanTargets } from "./mapper";

/**
 * Type 5 Strategy (สำรวจตลาดของคู่แข่ง - Competitor Market Survey)
 * Encapsulates validation, persistence (Dedicated Tables: ActivityPlanType5Target & ActivityResultSurveyItem),
 * and loading for Type 5 plans and actual survey outcomes.
 */
export const type5Strategy: WorkTypeStrategy = {
  code: "TYPE_5",

  /**
   * Validate business rules for Type 5 before saving Plan
   */
  async validatePlan(planData: any, _db: any): Promise<StrategyValidationResult> {
    const rawStores: any[] = planData.planStores || planData.stores || [];
    const rawProducts: any[] = planData.planProducts || planData.products || [];
    const directItems: any[] = planData.type5Items || [];

    const t5Stores = rawStores.filter(
      (s) => !s.workTypeCode || s.workTypeCode === "TYPE_5" || s.workTypeCode === "สำรวจตลาดของคู่แข่ง",
    );
    const t5Products = rawProducts.filter(
      (p) => !p.workTypeCode || p.workTypeCode === "TYPE_5" || p.workTypeCode === "สำรวจตลาดของคู่แข่ง",
    );

    const hasSurveyItems = directItems.length > 0 || t5Stores.length > 0 || t5Products.length > 0;

    if (!hasSurveyItems) {
      return {
        valid: false,
        error: "กรุณาระบุรายการสำรวจตลาดของคู่แข่ง (Type 5)",
      };
    }

    // Validate direct items if present
    if (directItems.length > 0) {
      for (let i = 0; i < directItems.length; i++) {
        const it = directItems[i];
        if (!it.storeId && !it.storeName) {
          return {
            valid: false,
            error: `กรุณาระบุร้านค้าเป้าหมายในรายการสำรวจที่ ${i + 1} (Type 5)`,
          };
        }
        if (!it.productId && !it.comparedProduct) {
          return {
            valid: false,
            error: `กรุณาระบุสินค้าที่นำไปเปรียบเทียบในรายการสำรวจที่ ${i + 1} (Type 5)`,
          };
        }
      }
    }

    return { valid: true };
  },

  /**
   * Save Type 5 Plan data inside an atomic transaction
   * Persists to dedicated table (ActivityPlanType5Target)
   * while keeping backward-compatible sync with legacy tables.
   */
  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    const directItems: any[] = planData.type5Items || [];
    const rawStores: any[] = planData.planStores || planData.stores || [];
    const rawProducts: any[] = planData.planProducts || planData.products || [];

    const t5Stores = rawStores.filter(
      (s) => !s.workTypeCode || s.workTypeCode === "TYPE_5" || s.workTypeCode === "สำรวจตลาดของคู่แข่ง",
    );
    const t5Products = rawProducts.filter(
      (p) => !p.workTypeCode || p.workTypeCode === "TYPE_5" || p.workTypeCode === "สำรวจตลาดของคู่แข่ง",
    );

    // Normalize target rows to save
    let itemsToSave: Array<{
      storeId?: string | null;
      storeName?: string | null;
      productId?: string | null;
      productName?: string | null;
      detail?: string | null;
    }> = [];

    if (directItems.length > 0) {
      itemsToSave = directItems.map((it) => ({
        storeId: it.storeId || null,
        storeName: it.storeName || null,
        productId: it.productId || null,
        productName: it.comparedProduct || null,
        detail: it.detail || null,
      }));
    } else {
      const maxCount = Math.max(t5Stores.length, t5Products.length);
      for (let i = 0; i < maxCount; i++) {
        const st = t5Stores[i] || t5Stores[0] || {};
        const pr = t5Products[i] || t5Products[0] || {};
        itemsToSave.push({
          storeId: st.storeId || null,
          storeName: st.storeName || (st as any).store?.name || null,
          productId: pr.productId || null,
          productName: pr.productName || (pr as any).product?.name || null,
          detail: pr.notes || st.notes || null,
        });
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 1. DEDICATED TABLE: ActivityPlanType5Target
    // ─────────────────────────────────────────────────────────────
    await (tx as any).activityPlanType5Target.deleteMany({
      where: { activityPlanId },
    });

    if (itemsToSave.length > 0) {
      await (tx as any).activityPlanType5Target.createMany({
        data: itemsToSave.map((it) => ({
          activityPlanId,
          storeId: it.storeId,
          productId: it.productId,
          detail: it.detail,
        })),
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 2. DUAL-WRITE SYNC TO LEGACY TABLES (activityPlanStore & activityPlanProduct)
    // ─────────────────────────────────────────────────────────────
    if (planData._syncLegacy !== false) {
      await tx.activityPlanStore.deleteMany({
        where: {
          activityPlanId,
          workTypeCode: "TYPE_5",
        },
      });

      if (itemsToSave.length > 0) {
        await tx.activityPlanStore.createMany({
          data: itemsToSave.map((it) => ({
            activityPlanId,
            workTypeCode: "TYPE_5",
            storeId: it.storeId,
            storeName: it.storeName,
            notes: it.detail,
          })),
        });
      }

      await tx.activityPlanProduct.deleteMany({
        where: {
          activityPlanId,
          workTypeCode: "TYPE_5",
        },
      });

      if (itemsToSave.length > 0) {
        await tx.activityPlanProduct.createMany({
          data: itemsToSave.map((it) => ({
            activityPlanId,
            workTypeCode: "TYPE_5",
            storeId: it.storeId,
            productId: it.productId || "",
            productName: it.productName,
            notes: it.detail,
          })),
        });
      }
    }
  },

  /**
   * Save Type 5 Actual outcome data (surveyResults)
   */
  async saveActual(
    tx: PrismaTransaction,
    activityPlanId: string,
    actualData: any,
  ): Promise<void> {
    let resultId = actualData?.activityResultId || actualData?.resultId;
    if (!resultId) {
      const result = await tx.activityResult.findFirst({
        where: { activityPlanId },
        select: { id: true },
      });
      resultId = result?.id;
    }
    if (!resultId) return;

    const surveyResults: any[] = actualData.surveyResults || [];
    if (!surveyResults || surveyResults.length === 0) return;

    await (tx as any).activityResultSurveyItem.deleteMany({
      where: { activityResultId: resultId },
    });

    const itemsToCreate = surveyResults.map((item: any) => {
      const dbId = randomUUID();
      return {
        id: dbId,
        activityResultId: resultId,
        storeId: item.storeId,
        productId: item.productId ?? null,
        competitorBrand: item.competitorBrand || "-",
        competitorProduct: item.competitorProduct || "-",
        posPrice: item.posPrice != null && item.posPrice !== "" ? new Prisma.Decimal(item.posPrice) : null,
        dealerPrice: item.dealerPrice != null && item.dealerPrice !== "" ? new Prisma.Decimal(item.dealerPrice) : null,
        subdealerPrice: item.subdealerPrice != null && item.subdealerPrice !== "" ? new Prisma.Decimal(item.subdealerPrice) : null,
        farmerPrice: item.farmerPrice != null && item.farmerPrice !== "" ? new Prisma.Decimal(item.farmerPrice) : null,
        sellingPoints: item.sellingPoints ?? null,
        competitorPrice: item.competitorPrice != null && item.competitorPrice !== "" ? new Prisma.Decimal(item.competitorPrice) : null,
        competitorUnit: item.competitorUnit ?? null,
        promotionDetail: item.promotionDetail ?? null,
      };
    });

    await (tx as any).activityResultSurveyItem.createMany({
      data: itemsToCreate,
    });
  },

  /**
   * Load Type 5 Plan data from database
   */
  async loadPlan(tx: PrismaTransaction, activityPlanId: string): Promise<any> {
    const targets = await (tx as any).activityPlanType5Target.findMany({
      where: { activityPlanId },
      include: {
        store: true,
        product: true,
      },
      orderBy: { createdAt: "asc" },
    });

    if (targets.length > 0) {
      return {
        targets: targets.map((t: any) => ({
          id: t.id,
          storeId: t.storeId,
          storeName: t.store?.shopName || t.store?.storeName || "",
          productId: t.productId,
          productName: t.product?.name || "",
          detail: t.detail,
        })),
      };
    }

    // Fallback: Legacy tables
    const [planStores, planProducts] = await Promise.all([
      tx.activityPlanStore.findMany({
        where: { activityPlanId, workTypeCode: "TYPE_5" },
        include: { store: true },
      }),
      tx.activityPlanProduct.findMany({
        where: { activityPlanId, workTypeCode: "TYPE_5" },
        include: { product: true },
      }),
    ]);

    return { planStores, planProducts };
  },
};
