import { Prisma } from "@prisma/client";
import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "../../../../types/strategy.interface";
import { WORK_TYPE_CODE } from "../../shared/constants";
import { validateType14FormValues } from "../application/planned-validation";
import { syncType14Data, findType14ByPlanId } from "./type14.repository";

export const type14PlannedStrategy: WorkTypeStrategy = {
  code: WORK_TYPE_CODE,

  async validatePlan(
    planData: any,
    _db: any,
  ): Promise<StrategyValidationResult> {
    const rawT14 = planData.type14Data || planData.type14;
    if (!rawT14) {
      return { valid: true };
    }
    const valResult = validateType14FormValues(rawT14);
    if (!valResult.isValid) {
      return {
        valid: false,
        error: valResult.error || "ข้อมูลติดตามแปลงแฮตแทคไม่ถูกต้อง (TYPE_14)",
      };
    }
    return { valid: true };
  },

  async savePlan(
    tx: PrismaTransaction,
    planId: string,
    planData: any,
  ): Promise<void> {
    const rawT14 = planData.type14Data || planData.type14;
    const startDate = planData.startDate
      ? new Date(planData.startDate)
      : new Date();

    if (rawT14) {
      await syncType14Data(tx, planId, rawT14, startDate);
    }
  },

  async saveActual(
    tx: PrismaTransaction,
    planId: string,
    actualData: any,
  ): Promise<void> {
    const t14Actual = actualData.type14Actual || actualData;
    const rounds: any[] = t14Actual.rounds || t14Actual.sprayRounds || [];

    if (!rounds || rounds.length === 0) {
      return;
    }

    // 1. Fetch targets for this plan
    const targets = await tx.activityPlanType14Target.findMany({
      where: { activityPlanId: planId },
      select: { id: true, demoPlotId: true },
    });
    const primaryTarget = targets[0] || null;
    const demoPlotId = primaryTarget?.demoPlotId || actualData.demoPlotId || null;

    // 2. Delete existing actual results for this plan (cascade deletes productsUsed)
    await tx.activityResultType14.deleteMany({
      where: { activityPlanId: planId },
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
          activityPlanId: planId,
          targetId: primaryTarget?.id || null,
          demoPlotId,
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
            activityPlanId: planId,
            type14ResultId: createdResult.id,
            demoPlotId: demoPlotId || null,
            workTypeCode: WORK_TYPE_CODE,
            category: "PLOT",
            fileUrl: img.url || img.fileUrl,
            fileName: img.name || img.fileName || `ภาพติดตามแปลงแฮตแทค รอบที่ ${round.roundNumber || i + 1}`,
            fileSize: img.size || img.fileSize || 0,
            mimeType: img.type || img.mimeType || "image/jpeg",
          })),
        });
      }

      // Link / Update existing DemoPlotVisits for this activity plan
      const visits = await tx.demoPlotVisit.findMany({
        where: {
          activityPlanId: planId,
          workTypeCode: "TYPE_14",
        },
      });

      for (const visit of visits) {
        await tx.demoPlotVisit.update({
          where: { id: visit.id },
          data: {
            visitDate,
            daysSinceStart: isNaN(daysSinceStart) ? 0 : daysSinceStart,
            productResponse:
              round.productResponse || round.trackingResult || "ปกติ",
            productProblemDesc: round.trackingResult || null,
            notes: round.additionalNotes || null,
          },
        });
      }
    }
  },

  async loadPlan(
    _tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<any> {
    return findType14ByPlanId(activityPlanId);
  },
};

export const type14Strategy = type14PlannedStrategy;
