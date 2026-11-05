import { randomUUID } from "crypto";
import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity/types/strategy.interface";
import { validateType15Planned } from "../application/planned-validation";
import { TYPE_15_CODE } from "../../shared/constants";

export const type15PlannedStrategy: WorkTypeStrategy = {
  code: TYPE_15_CODE,

  /**
   * Validate Type 15 Plan Data
   */
  async validatePlan(
    planData: any,
    _db: any,
  ): Promise<StrategyValidationResult> {
    const items: any[] =
      planData.type15Items ||
      planData.type15Targets ||
      planData.stores?.filter(
        (s: any) =>
          s.workTypeCode === TYPE_15_CODE ||
          s.workTypeCode === "บูมทีม / คาราวาน" ||
          s.workTypeCode === "บูมทีม",
      ) ||
      [];

    if (!items || items.length === 0) {
      return {
        valid: false,
        error: "กรุณาระบุข้อมูลเป้าหมายบูมทีม / คาราวานอย่างน้อย 1 รายการ",
      };
    }

    const validation = validateType15Planned(items);
    if (!validation.isValid) {
      return {
        valid: false,
        error: validation.error || "ข้อมูลเป้าหมายบูมทีม / คาราวานไม่ถูกต้อง",
      };
    }

    return { valid: true };
  },

  /**
   * Save Type 15 Plan targets in dedicated table activity_type_15_targets
   */
  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    let items: any[] = [];

    if (planData.type15Items && Array.isArray(planData.type15Items)) {
      items = planData.type15Items;
    } else if (planData.type15Targets && Array.isArray(planData.type15Targets)) {
      items = planData.type15Targets;
    } else if (planData.planStores && Array.isArray(planData.planStores)) {
      items = planData.planStores.filter(
        (s: any) =>
          s.workTypeCode === TYPE_15_CODE ||
          s.workTypeCode === "บูมทีม / คาราวาน" ||
          s.workTypeCode === "บูมทีม",
      );
    }

    // 1. Delete existing dedicated targets
    await (tx as any).activityPlanType15Target.deleteMany({
      where: { activityPlanId },
    });

    if (items.length > 0) {
      const targetsToCreate = items.map((item: any) => ({
        id: item.id && item.id.length > 20 ? item.id : randomUUID(),
        activityPlanId,
        storeId: item.storeId || null,
        subdealerId: item.subdealerId || null,
        isSubDealer: Boolean(item.isSubDealer),
        isUnregisteredSubdealer: Boolean(item.isUnregisteredSubdealer),
        subDealerStore: item.subDealerStore || null,
        village: item.village || null,
        objective: item.objective || null,
        detail: item.detail || null,
      }));

      await (tx as any).activityPlanType15Target.createMany({
        data: targetsToCreate,
      });
    }
  },

  /**
   * Load Type 15 Plan targets from database
   */
  async loadPlan(tx: PrismaTransaction, activityPlanId: string): Promise<any> {
    const targets = await (tx as any).activityPlanType15Target.findMany({
      where: { activityPlanId },
      include: {
        store: true,
        subdealer: true,
        results: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const type15Items = targets.map((t: any) => ({
      id: t.id,
      storeId: t.storeId,
      dealerName: t.store?.name || "",
      customerName: t.store?.name || "",
      isSubDealer: t.isSubDealer,
      subdealerId: t.subdealerId,
      subdealerName: t.subdealer?.name || "",
      isUnregisteredSubdealer: t.isUnregisteredSubdealer,
      subDealerStore: t.subDealerStore || "",
      village: t.village || "",
      objective: t.objective || "",
      detail: t.detail || "",
      results: t.results || [],
    }));

    return {
      type15Items,
      type15Targets: targets,
    };
  },

  /**
   * Validate Type 15 Actual Outcome Data
   */
  async validateActual(
    actualData: any,
    _db: any,
  ): Promise<StrategyValidationResult> {
    const images =
      actualData.type15Actual?.images ||
      actualData.images ||
      [];

    if (Array.isArray(images) && images.length > 10) {
      return {
        valid: false,
        error: "สามารถอัพโหลดรูปภาพได้สูงสุด 10 รูป",
      };
    }

    return { valid: true };
  },

  /**
   * Save Type 15 Actual Outcome in activity_type_15_results & attachments
   */
  async saveActual(
    tx: PrismaTransaction,
    activityPlanId: string,
    actualData: any,
  ): Promise<void> {
    // 1. Ensure core ActivityResult exists
    let resultId = actualData.activityResultId;
    if (!resultId) {
      const existing = await tx.activityResult.findUnique({
        where: { activityPlanId },
        select: { id: true },
      });
      if (existing) {
        resultId = existing.id;
      }
    }

    if (!resultId) {
      const plan = await tx.activityPlan.findUnique({
        where: { id: activityPlanId },
        select: { startDate: true, endDate: true },
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

    // 2. Extract Type 15 actual outcome
    const type15Data = actualData.type15Actual || actualData;
    const detail =
      type15Data.detail !== undefined
        ? type15Data.detail
        : actualData.detail || "";

    const targets = await (tx as any).activityPlanType15Target.findMany({
      where: { activityPlanId },
      select: { id: true },
    });
    const targetId = targets[0]?.id || null;

    // 3. Delete existing Type 15 result
    await (tx as any).activityResultType15.deleteMany({
      where: { activityPlanId },
    });

    // 4. Create new Type 15 result
    const createdResult = await (tx as any).activityResultType15.create({
      data: {
        id: randomUUID(),
        activityPlanId,
        targetId,
        detail,
      },
    });

    // 5. Save Attachments
    const images: any[] =
      type15Data.images ||
      actualData.images ||
      [];

    if (images.length > 0) {
      // Remove previous attachments for type15ResultId
      await tx.activityAttachment.deleteMany({
        where: {
          activityPlanId,
          type15ResultId: createdResult.id,
        },
      });

      const attachmentsToCreate = images.map((img: any, idx: number) => ({
        id: randomUUID(),
        activityPlanId,
        activityResultId: resultId || null,
        type15ResultId: createdResult.id,
        workTypeCode: TYPE_15_CODE,
        category: "GENERAL" as const,
        fileUrl: img.url || img.fileUrl,
        fileName: img.name || img.fileName || `boom-photo-${idx + 1}.jpg`,
        fileSize: img.size || img.fileSize || 0,
        mimeType: img.mimeType || img.type || "image/jpeg",
      }));

      await tx.activityAttachment.createMany({
        data: attachmentsToCreate,
      });
    }
  },

  /**
   * Load Type 15 Actual Outcome Data from database
   */
  async loadActual(tx: PrismaTransaction, activityPlanId: string): Promise<any> {
    const results = await (tx as any).activityResultType15.findMany({
      where: { activityPlanId },
      include: {
        target: true,
        attachments: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return {
      type15Results: results,
      type15Actual: results[0]
        ? {
            detail: results[0].detail,
            images: results[0].attachments,
          }
        : null,
    };
  },
};

// Aliases
export const type15Strategy = type15PlannedStrategy;

