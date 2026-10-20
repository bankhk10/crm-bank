import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity/types/strategy.interface";
import { findType12TourByPlanId, saveType12Tour } from "./type12.repository";
import { WORK_TYPE_CODE } from "../../shared/constants";

export const type12PlannedStrategy: WorkTypeStrategy = {
  code: WORK_TYPE_CODE,

  /**
   * Validate Type 12 Plan Data
   */
  async validatePlan(
    planData: any,
    _db: any,
  ): Promise<StrategyValidationResult> {
    const tourData = planData.tourData !== undefined ? planData.tourData : planData.tour;

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
   * Save Type 12 Plan tour details in ActivityPlanTour
   */
  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    const tourData = planData.tourData !== undefined ? planData.tourData : planData.tour;
    await saveType12Tour(tx, activityPlanId, tourData);
  },

  /**
   * Load Type 12 Plan Data
   */
  async loadPlan(
    db: any,
    activityPlanId: string,
  ): Promise<any> {
    return findType12TourByPlanId(db, activityPlanId);
  },

  /**
   * Save Type 12 Actual Execution
   */
  async saveActual(
    tx: PrismaTransaction,
    activityPlanId: string,
    actualData: any,
  ): Promise<void> {
    const t12Actual = actualData.type12Actual || actualData.t12Actual;
    if (!t12Actual) return;

    // Attachments are handled centrally or via activity attachments
    if (Array.isArray(t12Actual.images) && t12Actual.images.length > 0) {
      for (const img of t12Actual.images) {
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
  },
};

export const type12Strategy = type12PlannedStrategy;
