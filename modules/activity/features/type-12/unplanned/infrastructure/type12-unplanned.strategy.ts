import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity/types/strategy.interface";
import { saveType12Tour, saveType12Actual, findType12TourByPlanId } from "../../planned/infrastructure/type12.repository";
import { WORK_TYPE_CODE } from "../../shared/constants";

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
      await saveType12Actual(tx, activityPlanId, { type12Actual: actual });
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
