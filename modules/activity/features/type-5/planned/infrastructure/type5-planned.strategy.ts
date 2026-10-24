import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity/types/strategy.interface";

function toDecimalSafe(val: any): Prisma.Decimal | null {
  if (val == null) return null;
  const str = String(val).replace(/,/g, "").trim();
  if (str === "" || isNaN(Number(str))) return null;
  return new Prisma.Decimal(str);
}

/**
 * Type 5 Strategy: สำรวจตลาดของคู่แข่ง (Competitor Market Survey)
 * Handles validation, persistence into dedicated table (ActivityPlanType5Target)
 * and survey outcome persistence (ActivityResultSurveyItem),
 * while keeping dual-write synchronization with generic store/product tables.
 */
export const type5PlannedStrategy: WorkTypeStrategy = {
  code: "TYPE_5",

  /**
   * Validate business rules for Type 5 before saving Plan
   */
  async validatePlan(
    planData: any,
    _db: any,
  ): Promise<StrategyValidationResult> {
    const rawStores: any[] = planData.planStores || planData.stores || [];
    const rawProducts: any[] =
      planData.planProducts || planData.products || [];
    const directItems: any[] = planData.type5Items || [];

    const t5Stores = rawStores.filter(
      (s) =>
        !s.workTypeCode ||
        s.workTypeCode === "TYPE_5" ||
        s.workTypeCode === "สำรวจตลาดของคู่แข่ง",
    );
    const t5Products = rawProducts.filter(
      (p) =>
        !p.workTypeCode ||
        p.workTypeCode === "TYPE_5" ||
        p.workTypeCode === "สำรวจตลาดของคู่แข่ง",
    );

    const hasSurveyItems =
      directItems.length > 0 ||
      t5Stores.length > 0 ||
      t5Products.length > 0;

    if (!hasSurveyItems) {
      return {
        valid: false,
        error: "กรุณาระบุรายการสำรวจตลาดของคู่แข่ง (Type 5)",
      };
    }

    if (directItems.length > 0) {
      for (let i = 0; i < directItems.length; i++) {
        const it = directItems[i];
        if (!it.storeId && !it.storeName?.trim()) {
          return {
            valid: false,
            error: `กรุณาระบุร้านค้าเป้าหมายในรายการสำรวจที่ ${i + 1} (Type 5)`,
          };
        }
        if (!it.productId && !it.comparedProduct?.trim()) {
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
   * while keeping backward-compatible sync with generic tables.
   */
  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    const directItems: any[] =
      planData.type5Items ||
      planData.type5Targets ||
      planData.type5UnplannedItems ||
      [];
    const rawStores: any[] = planData.planStores || planData.stores || [];
    const rawProducts: any[] =
      planData.planProducts || planData.products || [];

    const t5Stores = rawStores.filter(
      (s) =>
        !s.workTypeCode ||
        s.workTypeCode === "TYPE_5" ||
        s.workTypeCode === "สำรวจตลาดของคู่แข่ง",
    );
    const t5Products = rawProducts.filter(
      (p) =>
        !p.workTypeCode ||
        p.workTypeCode === "TYPE_5" ||
        p.workTypeCode === "สำรวจตลาดของคู่แข่ง",
    );

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
        storeName:
          it.storeName ||
          (typeof it.store === "string" ? it.store : it.store?.name) ||
          null,
        productId: it.productId || null,
        productName:
          it.comparedProduct ||
          it.productName ||
          (typeof it.product === "string" ? it.product : it.product?.name) ||
          null,
        detail: it.detail || it.notes || null,
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
  },

  /**
   * Save Type 5 Actual outcome data (activityResultType5)
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

    if (!resultId) {
      const plan = await tx.activityPlan.findUnique({
        where: { id: activityPlanId },
        select: { startDate: true, endDate: true, createdById: true },
      });
      if (plan) {
        const created = await tx.activityResult.create({
          data: {
            activityPlanId,
            actualStartDate: actualData.actualStartDate || plan.startDate || new Date(),
            actualEndDate: actualData.actualEndDate || plan.endDate || new Date(),
            resultStatus: actualData.resultStatus || "COMPLETED",
          },
          select: { id: true },
        });
        resultId = created.id;
      }
    }
    if (!resultId) return;

    const surveyResults: any[] =
      actualData.surveyResults ||
      actualData.t5SurveyDetails ||
      actualData.type5SurveyRecords ||
      actualData.targetActualResults ||
      actualData.type5UnplannedItems ||
      [];
    if (!surveyResults || surveyResults.length === 0) return;

    // Delete existing records from dedicated table
    await (tx as any).activityResultType5.deleteMany({
      where: { activityPlanId },
    });

    const existingTargets = await (tx as any).activityPlanType5Target.findMany({
      where: { activityPlanId },
      select: { id: true, storeId: true, productId: true },
    });

    const itemsToCreate = surveyResults.map((item: any) => {
      const dbId = item.id || randomUUID();
      const matchedTarget =
        item.targetId ||
        existingTargets.find(
          (t: any) =>
            t.storeId === item.storeId &&
            (!item.productId || t.productId === item.productId),
        )?.id ||
        null;

      return {
        id: dbId,
        activityPlanId,
        targetId: matchedTarget,
        storeId: item.storeId || null,
        productId: item.productId ?? null,
        competitorBrand: item.competitorBrand || "-",
        competitorProduct: item.competitorProduct || "-",
        posPrice: toDecimalSafe(item.posPrice),
        dealerPrice: toDecimalSafe(item.dealerPrice),
        subdealerPrice: toDecimalSafe(item.subdealerPrice),
        farmerPrice: toDecimalSafe(item.farmerPrice),
        sellingPoints: item.sellingPoints ?? null,
        competitorPrice: toDecimalSafe(item.competitorPrice),
        competitorUnit: item.competitorUnit ?? null,
        promotionDetail: item.promotionDetail ?? null,
        isAdditional: Boolean(item.isAdditional || !matchedTarget),
      };
    });

    await (tx as any).activityResultType5.createMany({
      data: itemsToCreate,
    });

    // Sync attachments for Type 5 survey results
    const itemAttachments: any[] = [];
    surveyResults.forEach((item: any, idx: number) => {
      const dbId = itemsToCreate[idx]?.id;
      if (Array.isArray(item.bottleImages)) {
        for (const img of item.bottleImages) {
          itemAttachments.push({
            activityPlanId,
            activityResultId: resultId,
            workTypeCode: "TYPE_5",
            category: "SURVEY_BOTTLE",
            storeId: item.storeId || null,
            productId: item.productId || null,
            type5ResultId: dbId,
            fileUrl: img.url || img.fileUrl,
            fileName: img.name || img.fileName || "รูปถ่ายขวดผลิตภัณฑ์",
            fileSize: img.size || img.fileSize || 0,
            mimeType: img.type || img.mimeType || "image/jpeg",
          });
        }
      }
      if (Array.isArray(item.promotionalImages)) {
        for (const img of item.promotionalImages) {
          itemAttachments.push({
            activityPlanId,
            activityResultId: resultId,
            workTypeCode: "TYPE_5",
            category: "SURVEY_PROMO_MATERIAL",
            storeId: item.storeId || null,
            productId: item.productId || null,
            type5ResultId: dbId,
            fileUrl: img.url || img.fileUrl,
            fileName: img.name || img.fileName || "รูปภาพสื่อโปรโมท",
            fileSize: img.size || img.fileSize || 0,
            mimeType: img.type || img.mimeType || "image/jpeg",
          });
        }
      }
    });

    const rawAttachments: any[] = Array.isArray(actualData.attachments)
      ? actualData.attachments
      : [];
    for (const att of rawAttachments) {
      if (att.workTypeCode === "TYPE_5" || !att.workTypeCode) {
        if (!itemAttachments.some((ia) => ia.fileUrl === (att.fileUrl || att.url))) {
          const isBottle =
            att.category === "PRODUCT" ||
            att.category === "SURVEY_BOTTLE" ||
            att.category === "BOTTLE";
          const isPromo =
            att.category === "MEDIA" ||
            att.category === "SURVEY_PROMO_MATERIAL" ||
            att.category === "PROMOTION";
          const cat = isBottle
            ? "SURVEY_BOTTLE"
            : isPromo
              ? "SURVEY_PROMO_MATERIAL"
              : att.category || "GENERAL";
          itemAttachments.push({
            activityPlanId,
            activityResultId: resultId,
            workTypeCode: "TYPE_5",
            category: cat,
            storeId: att.storeId || null,
            productId: att.productId || null,
            type5ResultId: att.type5ResultId || itemsToCreate[0]?.id || null,
            fileUrl: att.fileUrl || att.url,
            fileName: att.fileName || att.name || "รูปภาพสำรวจตลาด",
            fileSize: att.fileSize || att.size || 0,
            mimeType: att.mimeType || att.type || "image/jpeg",
          });
        }
      }
    }

    if (itemAttachments.length > 0) {
      await (tx as any).activityAttachment.deleteMany({
        where: {
          activityPlanId,
          workTypeCode: "TYPE_5",
        },
      });
      await (tx as any).activityAttachment.createMany({
        data: itemAttachments,
      });
    }
  },

  /**
   * Load Type 5 Plan data from database
   */
  async loadPlan(
    tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<any> {
    const targets = await (tx as any).activityPlanType5Target.findMany({
      where: { activityPlanId },
      include: {
        store: true,
        product: true,
        results: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return {
      targets: targets.map((t: any) => ({
        id: t.id,
        storeId: t.storeId,
        storeName: t.store?.shopName || t.store?.name || "",
        productId: t.productId,
        productName: t.product?.name || "",
        detail: t.detail,
        results: t.results || [],
      })),
    };
  },

  /**
   * Load Type 5 Actual outcome data from database
   */
  async loadActual(
    tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<any> {
    const results = await (tx as any).activityResultType5.findMany({
      where: { activityPlanId },
      include: {
        store: true,
        product: true,
        attachments: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return {
      surveyResults: results,
      type5Results: results,
    };
  },
};
