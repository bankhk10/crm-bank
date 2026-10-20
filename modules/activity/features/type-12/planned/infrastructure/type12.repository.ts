import type { PrismaTransaction } from "@/modules/activity/types/strategy.interface";
import { TourType, TourSize } from "@prisma/client";

/**
 * Loads Type 12 Tour relation for a plan
 */
export async function findType12TourByPlanId(db: any, activityPlanId: string) {
  return db.activityPlanTour.findUnique({
    where: { activityPlanId },
    include: {
      store: {
        select: {
          id: true,
          name: true,
          customerCode: true,
          province: true,
          district: true,
        },
      },
    },
  });
}

/**
 * Persists Type 12 Tour relation within a Prisma transaction
 */
export async function saveType12Tour(
  tx: PrismaTransaction,
  activityPlanId: string,
  tourData: any,
): Promise<void> {
  if (tourData === undefined) return;

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
