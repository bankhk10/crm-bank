import { Prisma } from "@prisma/client";
import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity/types/strategy.interface";
import type { Type10SoldProductItem } from "../../shared/types";
import { findType10ByPlanId } from "./type10.repository";
import { parseType10ActualResult } from "../application/actual-mapper";

export const type10PlannedStrategy: WorkTypeStrategy = {
  code: "TYPE_10",

  /**
   * Validate Type 10 Plan Data
   */
  async validatePlan(
    planData: any,
    _db: any,
  ): Promise<StrategyValidationResult> {
    const rawTargets: any[] =
      planData.type10Targets ||
      planData.type10UnplannedItems ||
      planData.type10Plots ||
      planData.type10Data?.events ||
      [];

    if (rawTargets.length > 0) {
      for (let i = 0; i < rawTargets.length; i++) {
        const t = rawTargets[i];
        if (!t.demoPlotId && !t.plotName && !t.location) {
          return {
            valid: false,
            error: `รายการ Field Day ที่ ${i + 1}: กรุณาระบุแปลงสาธิตหรือสถานที่จัดงาน`,
          };
        }
      }
      return { valid: true };
    }

    const demoPlotId =
      planData.submittedDemoPlotId ||
      planData.type10DemoPlot ||
      planData.demoPlotId;

    if (!demoPlotId && !planData.location && !planData.type10Location) {
      return {
        valid: false,
        error: "กรุณาระบุแปลงสาธิตหรือสถานที่สำหรับการจัดงาน Field Day",
      };
    }

    return { valid: true };
  },

  /**
   * Save Type 10 Plan targets in Dedicated Tables:
   * 1. activity_type_10_targets
   * 2. activity_type_10_products
   * And mirror to demoPlotVisit for timeline history.
   */
  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    // 1. Clean previous dedicated records for this plan (Cascade deletes products & result)
    await (tx as any).activityPlanType10Target.deleteMany({
      where: { activityPlanId },
    });

    await (tx as any).activityPlanType10Product.deleteMany({
      where: { activityPlanId },
    });

    // Mirror clean legacy demo plot visits for this type
    await (tx as any).demoPlotVisit.deleteMany({
      where: {
        activityPlanId,
        workTypeCode: "TYPE_10",
      },
    });

    // 2. Extract targets array
    let targets: any[] =
      planData.type10Targets ||
      planData.type10UnplannedItems ||
      planData.type10Plots ||
      planData.type10Data?.events ||
      [];

    // Fallback if single target passed at top-level
    if (targets.length === 0) {
      const demoPlotId =
        planData.submittedDemoPlotId ||
        planData.type10DemoPlot ||
        planData.demoPlotId ||
        null;

      const location = planData.type10Location || planData.location || null;
      const targetCrop = planData.type10TargetCrop || null;
      const showcase = planData.type10Showcase || null;
      const attendees =
        planData.type10Attendees != null
          ? Number(planData.type10Attendees)
          : planData.targetAttendeesCount != null
            ? Number(planData.targetAttendeesCount)
            : 0;
      const bookingSales =
        planData.type10BookingSales != null
          ? Number(planData.type10BookingSales)
          : planData.targetBookingSales != null
            ? Number(planData.targetBookingSales)
            : null;

      if (demoPlotId || location || showcase || targetCrop) {
        targets = [
          {
            demoPlotId,
            location,
            cropName: targetCrop,
            showcaseProductName: showcase,
            targetAttendeesCount: attendees,
            targetBookingSales: bookingSales,
            products: planData.type10Products || planData.products || [],
            notes: planData.notes || null,
          },
        ];
      }
    }

    if (targets && Array.isArray(targets) && targets.length > 0) {
      for (let i = 0; i < targets.length; i++) {
        const item = targets[i];

        const demoPlotId = item.demoPlotId || null;
        let plotName = item.plotName || item.plot || null;
        let farmerName = item.farmerName || null;
        let cropCategory = item.cropCategory || null;
        let cropName = item.cropName || item.targetCrop || item.crop || null;
        let location = item.location || null;
        let province = item.province || null;
        let district = item.district || null;
        let subdistrict = item.subdistrict || null;
        let latitude = item.latitude || null;
        let longitude = item.longitude || null;
        let showcaseProductId = item.showcaseProductId || null;
        let showcaseProductName = item.showcaseProductName || item.showcaseProduct || item.showcase || null;

        // Auto enrich from DemoPlot if available
        if (demoPlotId) {
          const demoPlot = await (tx as any).demoPlot.findUnique({
            where: { id: demoPlotId },
          });

          if (demoPlot) {
            plotName = plotName || demoPlot.name;
            farmerName = farmerName || demoPlot.ownerName;
            cropCategory = cropCategory || demoPlot.cropCategory;
            cropName = cropName || demoPlot.cropName || demoPlot.customCropName;
            location = location || demoPlot.location;
            province = province || demoPlot.province;
            district = district || demoPlot.district;
            latitude = latitude || (demoPlot.latitude ? String(demoPlot.latitude) : null);
            longitude = longitude || (demoPlot.longitude ? String(demoPlot.longitude) : null);
            showcaseProductName = showcaseProductName || demoPlot.primaryProductName;
          }
        }

        const attendeesNum =
          item.targetAttendeesCount != null
            ? Number(item.targetAttendeesCount)
            : item.expectedAttendees != null
              ? Number(item.expectedAttendees)
              : item.targetAttendees != null
                ? Number(item.targetAttendees)
                : 0;

        const bookingSalesNum =
          item.targetBookingSales != null && !isNaN(Number(item.targetBookingSales))
            ? Number(item.targetBookingSales)
            : item.targetSales != null && !isNaN(Number(item.targetSales))
              ? Number(item.targetSales)
              : null;

        const targetBookingSalesDec =
          bookingSalesNum != null ? new Prisma.Decimal(bookingSalesNum) : null;

        const eventDate = item.eventDate ? new Date(item.eventDate) : null;
        const notes = item.notes || null;

        // 2.1 Create Target record
        const targetRecord = await (tx as any).activityPlanType10Target.create({
          data: {
            activityPlanId,
            demoPlotId,
            plotName,
            farmerName,
            cropCategory,
            cropName,
            location,
            province,
            district,
            subdistrict,
            latitude,
            longitude,
            showcaseProductId,
            showcaseProductName,
            targetAttendeesCount: attendeesNum,
            targetBookingSales: targetBookingSalesDec,
            eventDate,
            notes,
          },
        });

        // 2.2 Create Planned / Actual Products
        const prodItems: any[] =
          item.soldProducts ||
          item.products ||
          item.productSalesDetails ||
          [];

        for (const p of prodItems) {
          if (!p || (!p.productName && !p.productId)) continue;

          const targetQtyNum =
            p.targetQuantity != null && !isNaN(Number(p.targetQuantity))
              ? Number(p.targetQuantity)
              : p.quantity != null && !isNaN(Number(p.quantity))
                ? Number(p.quantity)
                : null;
          const targetQtyDec = targetQtyNum != null ? new Prisma.Decimal(targetQtyNum) : null;

          const targetPriceNum =
            p.targetUnitPrice != null && !isNaN(Number(p.targetUnitPrice))
              ? Number(p.targetUnitPrice)
              : p.unitPrice != null && !isNaN(Number(p.unitPrice))
                ? Number(p.unitPrice)
                : null;
          const targetPriceDec = targetPriceNum != null ? new Prisma.Decimal(targetPriceNum) : null;

          const targetAmountNum =
            p.targetAmount != null && !isNaN(Number(p.targetAmount))
              ? Number(p.targetAmount)
              : targetQtyNum != null && targetPriceNum != null
                ? targetQtyNum * targetPriceNum
                : null;
          const targetAmountDec = targetAmountNum != null ? new Prisma.Decimal(targetAmountNum) : null;

          // Actual fields (if Unplanned 2-in-1)
          const actualQtyNum =
            p.actualQuantity != null && !isNaN(Number(p.actualQuantity))
              ? Number(p.actualQuantity)
              : p.actualQty != null && !isNaN(Number(p.actualQty))
                ? Number(p.actualQty)
                : null;
          const actualQtyDec = actualQtyNum != null ? new Prisma.Decimal(actualQtyNum) : null;

          const actualPriceNum =
            p.actualUnitPrice != null && !isNaN(Number(p.actualUnitPrice))
              ? Number(p.actualUnitPrice)
              : p.unitPrice != null && !isNaN(Number(p.unitPrice))
                ? Number(p.unitPrice)
                : targetPriceNum;
          const actualPriceDec = actualPriceNum != null ? new Prisma.Decimal(actualPriceNum) : null;

          const actualTotalNum =
            p.actualTotal != null && !isNaN(Number(p.actualTotal))
              ? Number(p.actualTotal)
              : p.actualSales != null && !isNaN(Number(p.actualSales))
                ? Number(p.actualSales)
                : actualQtyNum != null && actualPriceNum != null
                  ? actualQtyNum * actualPriceNum
                  : null;
          const actualTotalDec = actualTotalNum != null ? new Prisma.Decimal(actualTotalNum) : null;

          await (tx as any).activityPlanType10Product.create({
            data: {
              activityPlanId,
              targetId: targetRecord.id,
              productId: p.productId || null,
              productName: p.productName || null,
              productRole: p.productRole || (actualQtyDec ? "ADDITIONAL_SALE" : "TARGET"),
              targetQuantity: targetQtyDec,
              targetUnitPrice: targetPriceDec,
              targetAmount: targetAmountDec,
              actualQuantity: actualQtyDec,
              actualUnitPrice: actualPriceDec,
              actualTotal: actualTotalDec,
              actualNotes: p.actualNotes || p.remarks || null,
            },
          });
        }

        // 2.3 Save Result if passed (Unplanned 2-in-1 per item)
        const hasActualOutcome =
          item.actualAttendees != null ||
          item.actualSalesOrBooking != null ||
          item.farmerFeedback ||
          item.targetFarmersList ||
          item.summary;

        if (hasActualOutcome) {
          const actAttendeesNum =
            item.actualAttendees != null && !isNaN(Number(item.actualAttendees))
              ? Number(item.actualAttendees)
              : 0;

          const actSalesNum =
            item.actualSalesOrBooking != null && !isNaN(Number(item.actualSalesOrBooking))
              ? Number(item.actualSalesOrBooking)
              : null;
          const actSalesDec = actSalesNum != null ? new Prisma.Decimal(actSalesNum) : null;

          await (tx as any).activityResultType10.create({
            data: {
              activityPlanId,
              targetId: targetRecord.id,
              actualAttendeesCount: actAttendeesNum,
              actualTotalSales: actSalesDec,
              farmerFeedback: item.farmerFeedback || null,
              targetFarmersList: item.targetFarmersList || null,
              summary: item.summary || item.notes || null,
            },
          });
        }

        // 2.4 Mirror DemoPlotVisit for timeline
        if (demoPlotId) {
          await (tx as any).demoPlotVisit.create({
            data: {
              activityPlanId,
              demoPlotId,
              workTypeCode: "TYPE_10",
              visitNumber: i + 1,
              visitDate: eventDate || new Date(),
            },
          });
        }
      }
    }
  },

  /**
   * Save Type 10 Actual outcome data into:
   * 1. activity_type_10_result (per target)
   * 2. activity_type_10_products (updating target actual or adding ADDITIONAL_SALE)
   * 3. activity_result_sale_items (legacy mirror)
   */
  async saveActual(
    tx: PrismaTransaction,
    planIdOrResultId: string,
    actualData: any,
  ): Promise<void> {
    if (!actualData) return;

    // Resolve activityPlanId and activityResultId
    let activityPlanId = planIdOrResultId;
    let activityResultId: string | null = actualData?.activityResultId || null;

    const maybeResult = await (tx as any).activityResult.findUnique({
      where: { id: planIdOrResultId },
      select: { id: true, activityPlanId: true },
    });

    if (maybeResult) {
      activityResultId = maybeResult.id;
      activityPlanId = maybeResult.activityPlanId;
    } else if (!activityResultId) {
      const existingResult = await (tx as any).activityResult.findFirst({
        where: { activityPlanId },
        select: { id: true },
      });
      if (existingResult) {
        activityResultId = existingResult.id;
      }
    }

    const t10Data = actualData?.type10Actual || actualData || {};
    const actualAttendees = t10Data.actualAttendees ?? t10Data.t10ActualAttendees;
    const actualSalesTotal = t10Data.actualSalesOrBooking ?? t10Data.actualSales ?? t10Data.salesResultAmount;
    const farmerFeedback = t10Data.farmerFeedback ?? null;
    const targetFarmersList = t10Data.targetFarmersList ?? null;
    const summary = t10Data.summary ?? actualData.resultSummary ?? null;
    const soldProducts: Type10SoldProductItem[] =
      t10Data.soldProducts ||
      t10Data.productSalesDetails ||
      actualData.soldProducts ||
      actualData.productSalesDetails ||
      [];

    // Find targets for this plan
    const targets = await (tx as any).activityPlanType10Target.findMany({
      where: { activityPlanId },
      orderBy: { createdAt: "asc" },
    });

    if (targets.length > 0) {
      const primaryTarget =
        (t10Data.targetId && targets.find((t: any) => t.id === t10Data.targetId)) ||
        targets[0];

      // Upsert into activity_type_10_result
      const actAttendeesNum =
        actualAttendees != null && !isNaN(Number(actualAttendees))
          ? Number(actualAttendees)
          : 0;

      const actSalesClean =
        actualSalesTotal != null
          ? String(actualSalesTotal).replace(/,/g, "").trim()
          : "";
      const actSalesDec =
        actSalesClean !== "" && !isNaN(Number(actSalesClean))
          ? new Prisma.Decimal(actSalesClean)
          : null;

      await (tx as any).activityResultType10.upsert({
        where: { targetId: primaryTarget.id },
        create: {
          activityPlanId,
          targetId: primaryTarget.id,
          actualAttendeesCount: actAttendeesNum,
          actualTotalSales: actSalesDec,
          farmerFeedback: farmerFeedback || null,
          targetFarmersList: targetFarmersList || null,
          summary: summary || null,
        },
        update: {
          actualAttendeesCount: actAttendeesNum,
          actualTotalSales: actSalesDec,
          farmerFeedback: farmerFeedback || null,
          targetFarmersList: targetFarmersList || null,
          summary: summary || null,
        },
      });

      // Save/Update Product Sales in activity_type_10_products
      if (Array.isArray(soldProducts) && soldProducts.length > 0) {
        // Delete previous additional sales for this target to keep idempotency
        await (tx as any).activityPlanType10Product.deleteMany({
          where: {
            targetId: primaryTarget.id,
            productRole: "ADDITIONAL_SALE",
          },
        });

        for (const sale of soldProducts) {
          if (!sale || (!sale.productName && !sale.productId)) continue;

          const qtyClean =
            sale.actualQty != null
              ? String(sale.actualQty).replace(/,/g, "").trim()
              : sale.quantity != null
                ? String(sale.quantity).replace(/,/g, "").trim()
                : "";
          const actualQtyDec =
            qtyClean !== "" && !isNaN(Number(qtyClean)) ? new Prisma.Decimal(qtyClean) : null;

          const priceClean =
            sale.unitPrice != null
              ? String(sale.unitPrice).replace(/,/g, "").trim()
              : sale.pricePerCase != null
                ? String(sale.pricePerCase).replace(/,/g, "").trim()
                : "";
          const unitPriceDec =
            priceClean !== "" && !isNaN(Number(priceClean)) ? new Prisma.Decimal(priceClean) : null;

          const totalClean =
            sale.actualSales != null
              ? String(sale.actualSales).replace(/,/g, "").trim()
              : sale.actualTotal != null
                ? String(sale.actualTotal).replace(/,/g, "").trim()
                : sale.amount != null
                  ? String(sale.amount).replace(/,/g, "").trim()
                  : "";
          const actualTotalDec =
            totalClean !== "" && !isNaN(Number(totalClean))
              ? new Prisma.Decimal(totalClean)
              : actualQtyDec && unitPriceDec
                ? actualQtyDec.mul(unitPriceDec)
                : null;

          // Check if product already exists as a planned target product
          const existingProduct = sale.productId
            ? await (tx as any).activityPlanType10Product.findFirst({
                where: {
                  targetId: primaryTarget.id,
                  productId: sale.productId,
                  productRole: "TARGET",
                },
              })
            : null;

          if (existingProduct) {
            await (tx as any).activityPlanType10Product.update({
              where: { id: existingProduct.id },
              data: {
                actualQuantity: actualQtyDec,
                actualUnitPrice: unitPriceDec,
                actualTotal: actualTotalDec,
                actualNotes: sale.remarks || sale.actualNotes || null,
              },
            });
          } else {
            await (tx as any).activityPlanType10Product.create({
              data: {
                activityPlanId,
                targetId: primaryTarget.id,
                productId: sale.productId || null,
                productName: sale.productName || null,
                productRole: "ADDITIONAL_SALE",
                actualQuantity: actualQtyDec,
                actualUnitPrice: unitPriceDec,
                actualTotal: actualTotalDec,
                actualNotes: sale.remarks || sale.actualNotes || null,
              },
            });
          }
        }
      }
    }
  },

  async loadPlan(tx: PrismaTransaction, activityPlanId: string): Promise<any[]> {
    const plan = await findType10ByPlanId(activityPlanId, tx);
    return plan?.type10Targets || [];
  },

  async loadActual(
    tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<any | null> {
    const plan = await findType10ByPlanId(activityPlanId, tx);
    if (!plan) return null;
    return parseType10ActualResult(undefined, plan);
  },
};

export const type10Strategy = type10PlannedStrategy;
