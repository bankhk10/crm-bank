import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity/types/strategy.interface";
import { saveType12Tour, findType12TourByPlanId } from "../../planned/infrastructure/type12.repository";
import { WORK_TYPE_CODE } from "../../shared/constants";
import { formatType12ActualSummary } from "../../shared/notes";

export const type12UnplannedStrategy: WorkTypeStrategy = {
  code: WORK_TYPE_CODE,

  /**
   * Validate Type 12 Unplanned Plan Data
   */
  async validatePlan(
    planData: any,
    _db: any,
  ): Promise<StrategyValidationResult> {
    const tourData = planData.tourData || planData.tour;

    if (tourData) {
      const isStore =
        tourData.tourType === "STORE" || tourData.tourType === "ทัวร์ร้านค้า";

      if (isStore && !tourData.storeId && !tourData.destination) {
        return {
          valid: false,
          error: "กรุณาระบุร้านค้าหรือสถานที่ปลายทางสำหรับทัวร์ร้านค้า",
        };
      }

      if (!isStore && !tourData.country) {
        return {
          valid: false,
          error: "กรุณาระบุประเทศปลายทางสำหรับทัวร์กลาง",
        };
      }
    }

    return { valid: true };
  },

  /**
   * Save Type 12 Unplanned Activity (Plan details + execution results in 1 transaction)
   */
  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    const tourData = planData.tourData !== undefined ? planData.tourData : planData.tour;
    await saveType12Tour(tx, activityPlanId, tourData);

    const actual = planData.type12Actual || planData.t12Actual;
    if (actual) {
      const summaryText = formatType12ActualSummary({
        actualAttendees: actual.actualAttendees,
        tourHighlights: actual.tourHighlights,
        feedbackIssues: actual.feedbackIssues,
      });

      // Save or update activity_plan_results
      const existingResult = await (tx as any).activityPlanResult.findFirst({
        where: { activityPlanId },
      });

      if (existingResult) {
        await (tx as any).activityPlanResult.update({
          where: { id: existingResult.id },
          data: {
            summary: existingResult.summary
              ? `${existingResult.summary}\n${summaryText}`
              : summaryText,
          },
        });
      } else {
        await (tx as any).activityPlanResult.create({
          data: {
            activityPlanId,
            summary: summaryText,
          },
        });
      }

      // Save attachments if any
      if (Array.isArray(actual.images) && actual.images.length > 0) {
        for (const img of actual.images) {
          if (!img.url) continue;
          await (tx as any).activityAttachment.create({
            data: {
              activityPlanId,
              fileUrl: img.url,
              fileName: img.name || "ภาพกิจกรรมศึกษาดูงาน",
              fileSize: img.size || 0,
              mimeType: img.type || "image/jpeg",
              category: "TOUR",
              workTypeCode: WORK_TYPE_CODE,
            },
          });
        }
      }
    }
  },

  /**
   * Load Type 12 Unplanned Data
   */
  async loadPlan(
    db: any,
    activityPlanId: string,
  ): Promise<any> {
    return findType12TourByPlanId(db, activityPlanId);
  },
};
