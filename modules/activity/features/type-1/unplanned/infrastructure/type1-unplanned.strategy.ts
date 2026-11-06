import { ActivityResultStatus, AttachmentCategory } from "@prisma/client";
import type {
  PrismaTransaction,
  StrategyValidationResult,
  WorkTypeStrategy,
} from "@/modules/activity/types/strategy.interface";
import { normalizeAttachmentCategory } from "@/modules/activity/infrastructure/activity-result.repository";
import { type1PlannedStrategy } from "../../planned/infrastructure/type1-planned.strategy";

/**
 * Strategy for TYPE_1 Unplanned Activities
 * In an unplanned activity, stores and actual results are saved together.
 */
export const type1UnplannedStrategy: WorkTypeStrategy = {
  code: "TYPE_1",

  async validatePlan(planData: any, db: any): Promise<StrategyValidationResult> {
    return type1PlannedStrategy.validatePlan!(planData, db);
  },

  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    // 1. Save Plan Stores
    await type1PlannedStrategy.savePlan(tx, activityPlanId, planData);

    // 2. If unplanned items have actual outcome (discussionResult, etc.), save actual outcome as well
    const items =
      planData.type1UnplannedItems ||
      planData.unplannedItems ||
      planData.items ||
      [];

    if (items.length > 0) {
      await type1PlannedStrategy.saveActual!(tx, activityPlanId, {
        targetActualResults: items,
      });
    }

    // 3. Ensure header ActivityResult & Type 1 Attachments are persisted
    const startDate = planData.startDate ? new Date(planData.startDate) : new Date();
    const endDate = planData.endDate ? new Date(planData.endDate) : startDate;

    const result = await tx.activityResult.upsert({
      where: { activityPlanId },
      create: {
        activityPlanId,
        actualStartDate: startDate,
        actualEndDate: endDate,
        resultStatus: ActivityResultStatus.COMPLETED,
      },
      update: {
        actualStartDate: startDate,
        actualEndDate: endDate,
        resultStatus: ActivityResultStatus.COMPLETED,
      },
    });

    const rawAttachments =
      planData.actualData?.attachments !== undefined
        ? planData.actualData.attachments
        : planData.attachments;

    if (Array.isArray(rawAttachments)) {
      const t1Attachments = rawAttachments.filter(
        (att: any) =>
          (att?.fileUrl || att?.url) &&
          (!att.workTypeCode || att.workTypeCode === "TYPE_1"),
      );

      await tx.activityAttachment.deleteMany({
        where: {
          activityPlanId,
          workTypeCode: "TYPE_1",
        },
      });

      if (t1Attachments.length > 0) {
        await tx.activityAttachment.createMany({
          data: t1Attachments.map((att: any) => ({
            activityPlanId,
            activityResultId: result.id,
            workTypeCode: "TYPE_1",
            category: normalizeAttachmentCategory(
              att.category,
              AttachmentCategory.PLOT,
            ),
            fileUrl: att.fileUrl || att.url,
            fileName: att.fileName || att.name || "รูปภาพ",
            fileSize: Math.round(Number(att.fileSize || att.size || 0)),
            mimeType: att.mimeType || att.type || "image/jpeg",
          })),
        });
      }
    }
  },

  async loadPlan(tx: PrismaTransaction, activityPlanId: string): Promise<any[]> {
    return type1PlannedStrategy.loadPlan!(tx, activityPlanId);
  },

  async saveActual(
    tx: PrismaTransaction,
    activityPlanId: string,
    actualData: any,
  ): Promise<void> {
    return type1PlannedStrategy.saveActual!(tx, activityPlanId, actualData);
  },

  async loadActual(
    tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<any | null> {
    return type1PlannedStrategy.loadActual!(tx, activityPlanId);
  },
};
