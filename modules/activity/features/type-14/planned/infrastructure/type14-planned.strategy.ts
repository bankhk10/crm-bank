import { Prisma } from "@prisma/client";
import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity/types/strategy.interface";
import {
  syncType14Data,
  findType14ByPlanId,
} from "./type14.repository";
import { WORK_TYPE_CODE } from "../../shared/constants";

export const type14PlannedStrategy: WorkTypeStrategy = {
  code: WORK_TYPE_CODE,

  /**
   * Validate Type 14 Plan targets
   */
  async validatePlan(
    planData: any,
    _db: any,
  ): Promise<StrategyValidationResult> {
    const t14 = planData.type14Data || planData.type14;
    const mode = t14?.mode || planData.type14Mode || "EXISTING_PLOT";

    if (mode === "EXISTING_PLOT") {
      const plotIds =
        t14?.selectedPlotIds ||
        t14?.type13TargetIds ||
        t14?.demoPlotIds ||
        (t14?.type13TargetId ? [t14.type13TargetId] : []) ||
        (t14?.demoPlotId ? [t14.demoPlotId] : []) ||
        (planData.type14Plots && planData.type14Plots.length > 0 ? planData.type14Plots : []);

      if (!plotIds || plotIds.length === 0) {
        return {
          valid: false,
          error: "กรุณาเลือกแปลงแฮตแทคที่ต้องการติดตามอย่างน้อย 1 แปลง",
        };
      }
    } else if (mode === "NEW_PLOT") {
      const name = t14?.name || planData.name;
      if (!name) {
        return {
          valid: false,
          error: "กรุณาระบุชื่อแปลงแฮตแทค",
        };
      }
    }

    return { valid: true };
  },

  /**
   * Save Type 14 Plan targets (ActivityPlanType14Target, ActivityPlanType14Product)
   */
  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    const raw14Data = planData.type14Data || planData.type14;
    if (raw14Data !== undefined || planData.type14Plots !== undefined) {
      const startDate = planData.startDate ? new Date(planData.startDate) : new Date();
      const payload = raw14Data || {
        mode: planData.type14Mode || "EXISTING_PLOT",
        selectedPlanId: planData.type14SourcePlanId,
        selectedPlotIds: planData.type14Plots,
        withdrawnProducts: planData.type14Products,
        notes: planData.notes,
        name: planData.name,
        dealerName: planData.dealerName,
        ownerName: planData.ownerName,
        province: planData.province,
        district: planData.district,
      };

      await syncType14Data(
        tx,
        activityPlanId,
        payload,
        startDate,
      );
    }
  },

  /**
   * Save Type 14 Actual outcome data in dedicated tables (ActivityResultType14, ProductUsed)
   */
  async saveActual(
    tx: PrismaTransaction,
    activityPlanId: string,
    actualData: any,
  ): Promise<void> {
    const t14Actual = actualData.type14Actual || actualData;
    const rounds: any[] = t14Actual.rounds || t14Actual.sprayRounds || [];

    if (!rounds || rounds.length === 0) {
      return;
    }

    // 1. Fetch targets for this plan
    const targets = await tx.activityPlanType14Target.findMany({
      where: { activityPlanId },
      select: { id: true, type13TargetId: true },
    });
    const primaryTarget = targets[0] || null;
    const type13TargetId = primaryTarget?.type13TargetId || actualData.type13TargetId || actualData.demoPlotId || null;

    // 2. Delete existing actual results for this plan (cascade deletes productsUsed)
    await tx.activityResultType14.deleteMany({
      where: { activityPlanId },
    });

    // 3. Insert each round
    for (let i = 0; i < rounds.length; i++) {
      const round = rounds[i];
      if (!round.actualVisitDate && !round.visitDate) continue;

      const visitDate = round.actualVisitDate
        ? new Date(round.actualVisitDate)
        : round.visitDate
          ? new Date(round.visitDate)
          : new Date();
      const daysSinceStart = round.daysAfterSpray
        ? parseInt(String(round.daysAfterSpray), 10)
        : 0;

      const createdResult = await tx.activityResultType14.create({
        data: {
          activityPlanId,
          targetId: primaryTarget?.id || null,
          type13TargetId,
          roundNumber: round.roundNumber || i + 1,
          actualVisitDate: visitDate,
          daysAfterSpray: isNaN(daysSinceStart) ? 0 : daysSinceStart,
          trackingResult: round.trackingResult || "ปกติ",
          productResponse: round.productResponse || round.trackingResult || "ปกติ",
          actualLatitude:
            round.actualLatitude != null && String(round.actualLatitude).trim() !== ""
              ? new Prisma.Decimal(Number(round.actualLatitude))
              : null,
          actualLongitude:
            round.actualLongitude != null && String(round.actualLongitude).trim() !== ""
              ? new Prisma.Decimal(Number(round.actualLongitude))
              : null,
          additionalNotes: round.additionalNotes || round.notes || null,
        },
      });

      // Products Used in this round
      const prods: any[] = round.products || [];
      const validProds = prods.filter((p) => Boolean(p.productId));
      if (validProds.length > 0) {
        const pIds = validProds.map((p) => p.productId);
        const dbProducts = await tx.product.findMany({
          where: { id: { in: pIds } },
          select: { id: true, name: true, unit: true },
        });
        const pMap = new Map(dbProducts.map((p) => [p.id, p]));

        const itemsToInsert = validProds
          .map((p, pIdx) => {
            const dbP = pMap.get(p.productId);
            if (!dbP) return null;
            return {
              resultId: createdResult.id,
              productId: dbP.id,
              productName: p.productName || dbP.name || null,
              quantityUsed:
                p.quantityUsed != null && String(p.quantityUsed).trim() !== ""
                  ? new Prisma.Decimal(Number(p.quantityUsed))
                  : new Prisma.Decimal(1),
              actualRate: p.actualRate || null,
              unit: p.unit || dbP.unit || null,
              detail: p.detail || null,
              sortOrder: pIdx,
            };
          })
          .filter((item): item is NonNullable<typeof item> => item !== null);

        if (itemsToInsert.length > 0) {
          await tx.activityResultType14ProductUsed.createMany({
            data: itemsToInsert,
          });
        }
      }

      // Attachments
      const images: any[] = round.afterSprayImages || round.attachments || [];
      const validImages = images.filter((img) => img && (img.url || img.fileUrl));
      if (validImages.length > 0) {
        await tx.activityAttachment.createMany({
          data: validImages.map((img) => ({
            activityPlanId,
            type14ResultId: createdResult.id,
            workTypeCode: WORK_TYPE_CODE,
            category: "PLOT",
            fileUrl: img.url || img.fileUrl,
            fileName: img.name || img.fileName || `ภาพติดตามแปลงแฮตแทค รอบที่ ${round.roundNumber || i + 1}`,
            fileSize: img.size || img.fileSize || 0,
            mimeType: img.type || img.mimeType || "image/jpeg",
          })),
        });
      }
    }
  },

  /**
   * Load Type 14 Plan targets
   */
  async loadPlan(
    _tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<any> {
    return findType14ByPlanId(activityPlanId);
  },
};

export const type14Strategy = type14PlannedStrategy;
