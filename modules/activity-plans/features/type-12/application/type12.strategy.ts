import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity-plans/application/strategies/work-type-strategy.interface";
import { TourType, TourSize } from "@prisma/client";

export const type12Strategy: WorkTypeStrategy = {
  code: "TYPE_12",

  /**
   * Validate Type 12 Plan Data
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
   * Save Type 12 Plan tour details in ActivityPlanTour
   */
  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    const tourData = planData.tourData !== undefined ? planData.tourData : planData.tour;

    if (tourData !== undefined) {
      await (tx as any).activityPlanTour.deleteMany({
        where: { activityPlanId },
      });

      if (tourData) {
        const isStore =
          tourData.tourType === "STORE" || tourData.tourType === "ทัวร์ร้านค้า";

        const tourType = isStore ? TourType.STORE : TourType.CENTRAL;

        const tourSize =
          tourData.tourSize === "LARGE" || tourData.tourSize === "ทัวร์ใหญ่"
            ? TourSize.LARGE
            : tourData.tourSize === "SMALL" || tourData.tourSize === "ทัวร์เล็ก"
              ? TourSize.SMALL
              : null;

        await (tx as any).activityPlanTour.create({
          data: {
            activityPlanId,
            tourType,
            tourSize: isStore ? null : tourSize,
            country: isStore ? null : tourData.country ?? null,
            storeId: isStore ? tourData.storeId ?? null : null,
            destination: isStore ? tourData.destination ?? null : null,
          },
        });
      }
    }
  },

  /**
   * Load Type 12 Plan Data
   */
  async loadPlan(
    db: any,
    activityPlanId: string,
  ): Promise<any> {
    return db.activityPlanTour.findUnique({
      where: { activityPlanId },
      include: {
        store: true,
      },
    });
  },
};
