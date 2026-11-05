import { prisma } from "@/lib/db";
import type { PrismaTransaction } from "@/modules/activity/types/strategy.interface";
import { TourType, TourSize } from "@prisma/client";

/**
 * Loads Type 12 plan and all dedicated relational targets and results
 */
export async function findType12ByPlanId(activityPlanId: string, tx?: PrismaTransaction) {
  const db = tx || prisma;
  return (db as any).activityPlan.findUnique({
    where: { id: activityPlanId },
    include: {
      type12Targets: {
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
          result: {
            include: {
              attachments: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      type12Results: {
        include: {
          attachments: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

/**
 * Backward-compatible wrapper for previous repository contract
 */
export async function findType12TourByPlanId(db: any, activityPlanId: string) {
  const res = await findType12ByPlanId(activityPlanId, db);
  const target = res?.type12Targets?.[0];
  if (!target) return null;

  return {
    id: target.id,
    activityPlanId: target.activityPlanId,
    tourType: target.tourType,
    tourSize: target.tourSize,
    country: target.country,
    storeId: target.storeId,
    destination: target.destination,
    targetAttendeesCount: target.targetAttendeesCount,
    detail: target.detail,
    store: target.store,
    result: target.result,
  };
}

/**
 * Persists Type 12 Target relations within a Prisma transaction
 */
export async function saveType12Tour(
  tx: PrismaTransaction,
  activityPlanId: string,
  tourData: any,
): Promise<any> {
  if (tourData === undefined) return null;

  // 1. Delete previous targets for this plan
  await (tx as any).activityPlanType12Target.deleteMany({
    where: { activityPlanId },
  });

  if (!tourData) return null;

  const isStore =
    tourData.tourType === "STORE" ||
    tourData.tourType === "ทัวร์ร้านค้า" ||
    tourData.tourType === TourType.STORE;

  const tourType = isStore ? TourType.STORE : TourType.CENTRAL;

  const tourSize =
    tourData.tourSize === "LARGE" ||
    tourData.tourSize === "ทัวร์ใหญ่" ||
    tourData.tourSize === TourSize.LARGE
      ? TourSize.LARGE
      : tourData.tourSize === "SMALL" ||
        tourData.tourSize === "ทัวร์เล็ก" ||
        tourData.tourSize === TourSize.SMALL
        ? TourSize.SMALL
        : null;

  const targetAttendeesCount =
    tourData.targetAttendeesCount != null && !isNaN(Number(tourData.targetAttendeesCount))
      ? Number(tourData.targetAttendeesCount)
      : tourData.targetAttendees != null && !isNaN(Number(tourData.targetAttendees))
        ? Number(tourData.targetAttendees)
        : 0;

  return (tx as any).activityPlanType12Target.create({
    data: {
      activityPlanId,
      tourType,
      tourSize: isStore ? null : tourSize,
      country: isStore ? null : tourData.country ?? null,
      storeId: isStore ? tourData.storeId ?? null : null,
      destination: isStore ? tourData.destination ?? null : null,
      targetAttendeesCount,
      detail: tourData.detail ?? null,
    },
  });
}

/**
 * Persists Type 12 Actual outcome in activity_type_12_result and attachments
 */
export async function saveType12Actual(
  tx: PrismaTransaction,
  activityPlanId: string,
  actualData: any,
): Promise<void> {
  const t12Actual = actualData.type12Actual || actualData.t12Actual || actualData;
  if (!t12Actual) return;

  // 1. Find existing target or create a fallback target if none exists
  let targets = await (tx as any).activityPlanType12Target.findMany({
    where: { activityPlanId },
    orderBy: { createdAt: "asc" },
  });

  let targetId: string;
  if (targets.length > 0) {
    targetId = targets[0].id;
  } else {
    const newTarget = await (tx as any).activityPlanType12Target.create({
      data: {
        activityPlanId,
        tourType: TourType.CENTRAL,
        targetAttendeesCount: 0,
      },
    });
    targetId = newTarget.id;
  }

  const attendees =
    t12Actual.actualAttendees != null && !isNaN(Number(t12Actual.actualAttendees))
      ? Number(t12Actual.actualAttendees)
      : 0;
  const tourHighlights = t12Actual.tourHighlights ?? null;
  const feedbackIssues = t12Actual.feedbackIssues ?? null;

  // Build summary text
  const parts: string[] = [];
  if (attendees > 0) parts.push(`ผู้ร่วมเดินทางจริง: ${attendees} คน`);
  if (tourHighlights) parts.push(`ไฮไลท์การดูงาน: ${tourHighlights}`);
  if (feedbackIssues) parts.push(`ข้อคิดเห็น/ปัญหา: ${feedbackIssues}`);
  const summary = parts.length > 0 ? parts.join(" | ") : null;

  // 2. Upsert into activity_type_12_result
  const resultRecord = await (tx as any).activityResultType12.upsert({
    where: { targetId },
    create: {
      activityPlanId,
      targetId,
      actualAttendeesCount: attendees,
      tourHighlights,
      feedbackIssues,
      summary,
    },
    update: {
      actualAttendeesCount: attendees,
      tourHighlights,
      feedbackIssues,
      summary,
    },
  });

  // 3. Update central ActivityResult attendees count
  const centralResult = await (tx as any).activityResult.findFirst({
    where: { activityPlanId },
    select: { id: true },
  });

  if (centralResult && attendees > 0) {
    await (tx as any).activityResult.update({
      where: { id: centralResult.id },
      data: {
        actualAttendeesCount: attendees,
      },
    });
  }

  // 4. Handle attachments
  const images: any[] = t12Actual.images || [];
  if (Array.isArray(images) && images.length > 0) {
    for (const img of images) {
      if (!img.url && !img.fileUrl) continue;
      const fileUrl = img.url || img.fileUrl;
      const fileName = img.name || img.fileName || "ภาพกิจกรรมศึกษาดูงาน";
      const fileSize = img.size || img.fileSize || 0;
      const mimeType = img.type || img.mimeType || "image/jpeg";

      // Check if attachment already linked
      const existing = await (tx as any).activityAttachment.findFirst({
        where: {
          activityPlanId,
          type12ResultId: resultRecord.id,
          fileUrl,
        },
      });

      if (!existing) {
        await (tx as any).activityAttachment.create({
          data: {
            activityPlanId,
            activityResultId: centralResult?.id ?? null,
            type12ResultId: resultRecord.id,
            workTypeCode: "TYPE_12",
            fileUrl,
            fileName,
            fileSize,
            mimeType,
            category: "ATMOSPHERE",
          },
        });
      }
    }
  }
}
