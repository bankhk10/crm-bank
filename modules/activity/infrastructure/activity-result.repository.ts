import { randomUUID } from "crypto";
import { Prisma, ActivityResultStatus, CalendarEventStatus } from "@prisma/client";
import { db } from "@/lib/db";
import type { PrismaTransaction } from "../types/strategy.interface";
import { saveStrategiesForActual } from "./strategy.registry";
import { getWorkTypeCode } from "../constants";

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
    await saveStrategiesForActual(
      tx,
      input.activityPlanId,
      {
        ...input,
        activityResultId: result.id,
      },
      input.planWorkTypeCodes || []
    );

    // 3. Sync Sale Results
    if (input.saleResults !== undefined) {
      await (tx as any).activityResultSaleItem.deleteMany({
        where: { activityResultId: result.id },
      });
      if (Array.isArray(input.saleResults) && input.saleResults.length > 0) {
        await (tx as any).activityResultSaleItem.createMany({
          data: input.saleResults.map((item: any) => {
            const qty =
              Number(item.actualQuantity ?? item.actualQty ?? 0) || 0;
            const unitPrice =
              Number(item.actualUnitPrice ?? item.unitPrice ?? 0) || 0;
            const total =
              item.actualTotal != null || item.actualSales != null
                ? Number(item.actualTotal ?? item.actualSales) || 0
                : qty * unitPrice;

            return {
              activityResultId: result.id,
              workTypeCode: getWorkTypeCode(item.workTypeCode || "TYPE_3"),
              storeId: item.storeId ?? null,
              productId: item.productId,
              productName: item.productName ?? null,
              actualQuantity: qty,
              actualUnitPrice: new Prisma.Decimal(unitPrice),
              actualTotal: new Prisma.Decimal(total),
              unclosedReason: item.unclosedReason ?? null,
              isAdditional: Boolean(item.isAdditional),
            };
          }),
        });
      }
    }

    // 4. Sync Stock Results
    if (input.stockResults !== undefined) {
      await (tx as any).activityResultStockItem.deleteMany({
        where: { activityResultId: result.id },
      });
      if (Array.isArray(input.stockResults) && input.stockResults.length > 0) {
        await (tx as any).activityResultStockItem.createMany({
          data: input.stockResults.map((item) => ({
            activityResultId: result.id,
            storeId: item.storeId,
            productId: item.productId,
            remainingQuantity: item.remainingQuantity,
            stockStatus: item.stockStatus ?? null,
            reorderOpportunity: item.reorderOpportunity ?? null,
            remarks: item.remarks ?? null,
            nextAction: item.nextAction ?? null,
          })),
        });
      }
    }

    // 5. Sync Survey Results (fallback if not handled by strategy)
    const isType5HandledByStrategy = input.planWorkTypeCodes?.some(
      (c: string) => getWorkTypeCode(c) === "TYPE_5",
    );
    if (input.surveyResults !== undefined && !isType5HandledByStrategy) {
      await (tx as any).activityResultSurveyItem.deleteMany({
        where: { activityResultId: result.id },
      });
      if (Array.isArray(input.surveyResults) && input.surveyResults.length > 0) {
        await (tx as any).activityResultSurveyItem.createMany({
          data: input.surveyResults.map((item: any) => ({
            id: item.id || randomUUID(),
            activityResultId: result.id,
            storeId: item.storeId || null,
            productId: item.productId ?? null,
            competitorBrand: item.competitorBrand || "-",
            competitorProduct: item.competitorProduct || "-",
            posPrice: toDecimalSafe(item.posPrice),
            dealerPrice: toDecimalSafe(item.dealerPrice),
            subdealerPrice: toDecimalSafe(item.subdealerPrice),
            farmerPrice: toDecimalSafe(item.farmerPrice),
            sellingPoints: item.sellingPoints ?? null,
            competitorPrice: toDecimalSafe(item.competitorPrice),
            competitorUnit: item.competitorUnit ?? null,
            promotionDetail: item.promotionDetail ?? null,
          })),
        });
      }
    }

    // 6. Sync Demo Results
    if (input.demoResults !== undefined) {
      await (tx as any).activityResultDemoItem.deleteMany({
        where: { activityResultId: result.id },
      });
      if (Array.isArray(input.demoResults) && input.demoResults.length > 0) {
        await (tx as any).activityResultDemoItem.createMany({
          data: input.demoResults.map((item) => ({
            activityResultId: result.id,
            demoPlotId: item.demoPlotId ?? null,
            plannedProductId: item.plannedProductId ?? null,
            actualProductId: item.actualProductId ?? null,
            changeReason: item.changeReason ?? null,
            plotObjective: item.plotObjective ?? null,
            cropAgeValue: item.cropAgeValue ?? null,
            cropAgeUnit: item.cropAgeUnit ?? null,
            growthStage: item.growthStage ?? null,
            cropCondition: item.cropCondition ?? null,
            productResponse: item.productResponse ?? null,
            problemDescription: item.problemDescription ?? null,
            finalYieldKg:
              item.finalYieldKg != null
                ? new Prisma.Decimal(item.finalYieldKg)
                : null,
            controlYieldKg:
              item.controlYieldKg != null
                ? new Prisma.Decimal(item.controlYieldKg)
                : null,
            satisfactionScore: item.satisfactionScore ?? null,
            applicationRate: item.applicationRate ?? null,
          })),
        });
      }
    }

    // 7. Sync Followup Results
    if (input.followupResults !== undefined) {
      await (tx as any).activityResultFollowupItem.deleteMany({
        where: { activityResultId: result.id },
      });
      if (Array.isArray(input.followupResults) && input.followupResults.length > 0) {
        await (tx as any).activityResultFollowupItem.createMany({
          data: input.followupResults.map((item) => ({
            activityResultId: result.id,
            storeId: item.storeId ?? null,
            productId: item.productId,
            productName: item.productName ?? null,
            usageResult: item.usageResult ?? null,
            followupDetail: item.followupDetail ?? null,
            problemDetail: item.problemDetail ?? null,
            isAdditional: Boolean(item.isAdditional),
          })),
        });
      }
    }

    // 8. Sync Issue Results
    if (input.issueResults !== undefined) {
      await (tx as any).activityResultIssueItem.deleteMany({
        where: { activityResultId: result.id },
      });
      if (Array.isArray(input.issueResults) && input.issueResults.length > 0) {
        await (tx as any).activityResultIssueItem.createMany({
          data: input.issueResults.map((item) => ({
            id: randomUUID(),
            activityResultId: result.id,
            productId: item.productId ?? null,
            productName: item.productName ?? null,
            lotNumber: item.lotNumber ?? null,
            purchaseChannel: item.purchaseChannel,
            storeId: item.storeId ?? null,
            storeName: item.storeName ?? null,
            issueType: item.issueType,
            detail: item.detail ?? null,
            status: item.status || "เสร็จสิ้น",
            problemFound: item.problemFound ?? item.detail ?? null,
            initialSolution: item.initialSolution ?? null,
            nextAction: item.nextAction ?? null,
          })),
        });
      }
    }

    // 9. Sync Attachments
    if (input.attachments !== undefined) {
      await (tx as any).activityAttachment.deleteMany({
        where: {
          activityPlanId: input.activityPlanId,
          sprayRoundId: null, // Preserve round-level attachments managed by strategies (e.g. Type 7B spray rounds)
        },
      });
      if (Array.isArray(input.attachments) && input.attachments.length > 0) {
        // Exclude attachments that belong to spray rounds to avoid duplicates without sprayRoundId
        const generalAttachments = input.attachments.filter((att) => !att.sprayRoundId);
        if (generalAttachments.length > 0) {
          await (tx as any).activityAttachment.createMany({
            data: generalAttachments.map((att) => ({
              activityPlanId: input.activityPlanId,
              activityResultId: result.id,
              workTypeCode: att.workTypeCode ? getWorkTypeCode(att.workTypeCode) : null,
              category: att.category || "GENERAL",
              storeId: att.storeId || null,
              productId: att.productId || null,
              surveyItemId: att.surveyItemId || null,
              issueItemId: att.issueItemId || null,
              fileUrl: att.fileUrl || att.url,
              fileName: att.fileName || att.name || "รูปภาพ",
              fileSize: att.fileSize || att.size || 0,
              mimeType: att.mimeType || att.type || "image/jpeg",
            })),
          });
        }
      }
    }

    // 10. Sync Calendar Status
    let calendarStatus: CalendarEventStatus | null = null;
    if (
      resultStatus === ActivityResultStatus.COMPLETED ||
      resultStatus === ActivityResultStatus.PARTIAL ||
      resultStatus === ActivityResultStatus.FAILED
    ) {
      calendarStatus = CalendarEventStatus.COMPLETED;
    } else if (resultStatus === ActivityResultStatus.CANCELLED) {
      calendarStatus = CalendarEventStatus.CANCELLED;
    }

    if (calendarStatus) {
      await (tx as any).activityCalendarEvent.updateMany({
        where: { activityPlanId: input.activityPlanId },
        data: { status: calendarStatus },
      });
    }

    return result;
  };

  if (txClient) {
    return handler(txClient);
  }
  return db.$transaction(handler);
}
