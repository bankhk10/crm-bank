import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity/types/strategy.interface";
import { findType12ByPlanId, findType12TourByPlanId, saveType12Tour, saveType12Actual } from "./type12.repository";
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
   * Save Type 12 Plan tour details into activity_type_12_targets
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
   * Save Type 12 Actual Execution into activity_type_12_result and attachments
   */
  async saveActual(
    tx: PrismaTransaction,
    activityPlanId: string,
    actualData: any,
  ): Promise<void> {
    await saveType12Actual(tx, activityPlanId, actualData);
  },

  /**
   * Load Type 12 Actual outcome data from dedicated tables
   */
  async loadActual(
    tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<any | null> {
    const res = await findType12ByPlanId(activityPlanId, tx);
    const target = res?.type12Targets?.[0];
    const result = target?.result || res?.type12Results?.[0];
    if (!target && !result) return null;

    return {
      actualAttendees: result?.actualAttendeesCount ? String(result.actualAttendeesCount) : "",
      tourHighlights: result?.tourHighlights || "",
      feedbackIssues: result?.feedbackIssues || "",
      images: (result?.attachments || []).map((a: any) => ({
        id: a.id,
        url: a.fileUrl,
        name: a.fileName,
        size: a.fileSize || 0,
        type: a.mimeType || "image/jpeg",
      })),
    };
  },
};

export const type12Strategy = type12PlannedStrategy;
