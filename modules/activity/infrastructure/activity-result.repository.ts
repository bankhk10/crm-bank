import { randomUUID } from "crypto";
import { Prisma, ActivityResultStatus, CalendarEventStatus, AttachmentCategory } from "@prisma/client";
import { db } from "@/lib/db";
import type { PrismaTransaction } from "../types/strategy.interface";
import { saveStrategiesForActual } from "./strategy.registry";
import { getWorkTypeCode } from "../constants";
import { syncActivityResultToCalendarUseCase } from "./calendar-integration";

const VALID_ATTACHMENT_CATEGORIES: Record<string, AttachmentCategory> = {
  PRICE_TAG: AttachmentCategory.PRICE_TAG,
  SHELF: AttachmentCategory.SHELF,
  CROP: AttachmentCategory.CROP,
  PLOT: AttachmentCategory.PLOT,
  ATMOSPHERE: AttachmentCategory.ATMOSPHERE,
  MEETING: AttachmentCategory.ATMOSPHERE,
  ISSUE: AttachmentCategory.ISSUE,
  SURVEY_BOTTLE: AttachmentCategory.SURVEY_BOTTLE,
  SURVEY_PROMO_MATERIAL: AttachmentCategory.SURVEY_PROMO_MATERIAL,
  GENERAL: AttachmentCategory.GENERAL,
};

function normalizeAttachmentCategory(rawCategory: any): AttachmentCategory {
  if (!rawCategory || typeof rawCategory !== "string") {
    return AttachmentCategory.GENERAL;
  }
  const upper = rawCategory.trim().toUpperCase();
  return VALID_ATTACHMENT_CATEGORIES[upper] || AttachmentCategory.GENERAL;
}

function toDecimalSafe(val: any): Prisma.Decimal | null {
  if (val == null) return null;
  const str = String(val).replace(/,/g, "").trim();
  if (str === "" || isNaN(Number(str))) return null;
  return new Prisma.Decimal(str);
}

export interface UpsertActivityResultInput {
  activityPlanId: string;
  actualStartDate: Date;
  actualEndDate: Date;
  actualAttendeesCount?: number | null;
  resultStatus?: ActivityResultStatus | string | null;
  resultSummary?: string | null;
  cancelReason?: string | null;
  postponedDate?: Date | null;
  postponedTime?: string | null;
  postponedReason?: string | null;
  postponedNotes?: string | null;
  actualSalesPromotionSpent?: number | Prisma.Decimal | null;
  actualMarketingSpent?: number | Prisma.Decimal | null;
  salesResultAmount?: number | Prisma.Decimal | null;
  salesOrdersCount?: number | null;
  collectResultAmount?: number | Prisma.Decimal | null;
  demoPlotsCreated?: number | null;
  demoPlotsFollowedUp?: number | null;
  distributorsCount?: number | null;
  farmersCount?: number | null;
  recordedById?: string | null;

  // Relation arrays
  saleResults?: any[];
  stockResults?: any[];
  surveyResults?: any[];
  demoResults?: any[];
  followupResults?: any[];
  issueResults?: any[];
  attachments?: any[];

  // Plan metadata
  planWorkTypeCodes?: string[];
  [key: string]: any;
}

/**
 * Upsert ActivityResult and sync work-type strategies inside a Prisma transaction
 */
export async function upsertActivityResult(
  input: UpsertActivityResultInput,
  txClient?: PrismaTransaction
) {
  const handler = async (tx: PrismaTransaction) => {
    const spSpent = Number(input.actualSalesPromotionSpent ?? 0);
    const mktSpent = Number(input.actualMarketingSpent ?? 0);
    const actualTotalSpent = spSpent + mktSpent;

    const rawStatus = input.resultStatus || ActivityResultStatus.COMPLETED;
    const resultStatus = (
      Object.values(ActivityResultStatus).includes(rawStatus as ActivityResultStatus)
        ? rawStatus
        : ActivityResultStatus.COMPLETED
    ) as ActivityResultStatus;

    // 1. Upsert Header ActivityResult
    const result = await tx.activityResult.upsert({
      where: { activityPlanId: input.activityPlanId },
      create: {
        activityPlanId: input.activityPlanId,
        actualStartDate: input.actualStartDate,
        actualEndDate: input.actualEndDate,
        actualAttendeesCount: input.actualAttendeesCount ?? null,
        resultStatus,
        cancelReason: input.cancelReason ?? null,
        postponedDate: input.postponedDate ?? null,
        postponedTime: input.postponedTime ?? null,
        postponedReason: input.postponedReason ?? null,
        postponedNotes: input.postponedNotes ?? null,
        actualSalesPromotionSpent: input.actualSalesPromotionSpent
          ? new Prisma.Decimal(input.actualSalesPromotionSpent.toString())
          : null,
        actualMarketingSpent: input.actualMarketingSpent
          ? new Prisma.Decimal(input.actualMarketingSpent.toString())
          : null,
        actualTotalSpent: new Prisma.Decimal(actualTotalSpent.toString()),
        salesResultAmount: input.salesResultAmount
          ? new Prisma.Decimal(input.salesResultAmount.toString())
          : null,
        salesOrdersCount: input.salesOrdersCount ?? null,
        collectResultAmount: input.collectResultAmount
          ? new Prisma.Decimal(input.collectResultAmount.toString())
          : null,
        demoPlotsCreated: input.demoPlotsCreated ?? null,
        demoPlotsFollowedUp: input.demoPlotsFollowedUp ?? null,
        distributorsCount: input.distributorsCount ?? null,
        farmersCount: input.farmersCount ?? null,
        recordedById: input.recordedById ?? null,
      },
      update: {
        actualStartDate: input.actualStartDate,
        actualEndDate: input.actualEndDate,
        actualAttendeesCount: input.actualAttendeesCount ?? null,
        resultStatus,
        cancelReason: input.cancelReason ?? null,
        postponedDate: input.postponedDate ?? null,
        postponedTime: input.postponedTime ?? null,
        postponedReason: input.postponedReason ?? null,
        postponedNotes: input.postponedNotes ?? null,
        actualSalesPromotionSpent: input.actualSalesPromotionSpent
          ? new Prisma.Decimal(input.actualSalesPromotionSpent.toString())
          : null,
        actualMarketingSpent: input.actualMarketingSpent
          ? new Prisma.Decimal(input.actualMarketingSpent.toString())
          : null,
        actualTotalSpent: new Prisma.Decimal(actualTotalSpent.toString()),
        salesResultAmount: input.salesResultAmount
          ? new Prisma.Decimal(input.salesResultAmount.toString())
          : null,
        salesOrdersCount: input.salesOrdersCount ?? null,
        collectResultAmount: input.collectResultAmount
          ? new Prisma.Decimal(input.collectResultAmount.toString())
          : null,
        demoPlotsCreated: input.demoPlotsCreated ?? null,
        demoPlotsFollowedUp: input.demoPlotsFollowedUp ?? null,
        distributorsCount: input.distributorsCount ?? null,
        farmersCount: input.farmersCount ?? null,
        recordedById: input.recordedById ?? null,
      },
    });

    // 2. Delegate to Work Type Strategies via Central Strategy Registry
    await tx.activityPlan.update({
      where: { id: input.activityPlanId },
      data: { isActualRecorded: true },
    });
    await saveStrategiesForActual(
      tx,
      input.activityPlanId,
      {
        ...input,
        activityResultId: result.id,
      },
      input.planWorkTypeCodes || []
    );

    // 3. Sync Attachments (general plan-level attachments)
    if (input.attachments !== undefined) {
      await (tx as any).activityAttachment.deleteMany({
        where: {
          activityPlanId: input.activityPlanId,
          type5ResultId: null,
          type6ResultId: null,
          type7aResultId: null,
          type7bResultId: null,
          type12ResultId: null,
          type13ResultId: null,
          type14ResultId: null,
        },
      });
      if (Array.isArray(input.attachments) && input.attachments.length > 0) {
        await (tx as any).activityAttachment.createMany({
          data: input.attachments.map((att: any) => ({
            activityPlanId: input.activityPlanId,
            activityResultId: result.id,
            workTypeCode: att.workTypeCode ? getWorkTypeCode(att.workTypeCode) : null,
            category: normalizeAttachmentCategory(att.category),
            storeId: att.storeId || null,
            productId: att.productId || null,
            fileUrl: att.fileUrl || att.url,
            fileName: att.fileName || att.name || "รูปภาพ",
            fileSize: att.fileSize || att.size || 0,
            mimeType: att.mimeType || att.type || "image/jpeg",
          })),
        });
      }
    }

    // 4. Sync Calendar Status & Reschedule if Postponed
    try {
      await syncActivityResultToCalendarUseCase(
        input.activityPlanId,
        resultStatus,
        tx,
        {
          postponedDate: input.postponedDate ?? null,
          postponedTime: input.postponedTime ?? null,
        },
      );
    } catch (calErr) {
      console.warn("[activity-result.repository] Calendar sync warning:", calErr);
    }

    return result;
  };

  if (txClient) {
    return handler(txClient);
  }
  return db.$transaction(handler);
}
