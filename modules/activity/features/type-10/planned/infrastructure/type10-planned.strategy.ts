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

    // 2. Extract targets array
    let targets: any[] =
      planData.type10Targets ||
      planData.type10UnplannedItems ||
      planData.type10Plots ||
      planData.type10Data?.type10Targets ||
      planData.type10Data?.targets ||
      planData.type10Data?.plots ||
      planData.type10Data?.events ||
      [];

    // Fallback if single target passed at top-level
    if (targets.length === 0) {
      const type7aTargetId =
        planData.type7aTargetId ||
        planData.type10Data?.submittedDemoPlotId ||
        planData.type10Data?.demoPlotId ||
        planData.submittedDemoPlotId ||
        planData.type10DemoPlot ||
        planData.demoPlotId ||
        null;

      const location =
        planData.type10Location ||
        planData.location ||
        planData.type10Data?.location ||
        null;
      const targetCrop =
        planData.type10TargetCrop ||
        planData.type10Data?.targetCrop ||
        null;
      const showcase =
        planData.type10Showcase ||
        planData.type10Data?.showcase ||
        null;
      const attendees =
        planData.type10Attendees != null
          ? Number(planData.type10Attendees)
          : planData.type10Data?.targetAttendees != null
            ? Number(planData.type10Data.targetAttendees)
            : planData.targetAttendeesCount != null
              ? Number(planData.targetAttendeesCount)
              : 0;
      const bookingSales =
        planData.type10BookingSales != null
          ? Number(planData.type10BookingSales)
          : planData.type10Data?.targetBookingSales != null
            ? Number(planData.type10Data.targetBookingSales)
            : planData.targetBookingSales != null
              ? Number(planData.targetBookingSales)
              : null;

      if (type7aTargetId || location || showcase || targetCrop) {
        targets = [
          {
            type7aTargetId,
            plotName: planData.type10DemoPlot || null,
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

        const candidatePlotId =
          item.type7aTargetId || item.demoPlotId || null;
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
        let showcaseProductName =
          item.showcaseProductName ||
          item.showcaseProduct ||
          item.showcase ||
          null;

        // Auto enrich and strictly validate Foreign Key for type7aTarget
        let valid7aTargetId: string | null = null;
        if (candidatePlotId) {
          const t7a = await (tx as any).activityPlanType7aTarget.findUnique({
            where: { id: candidatePlotId },
            include: {
              store: true,
              results: true,
              products: { include: { product: true } },
            },
          });

          if (t7a) {
            valid7aTargetId = t7a.id;
            plotName = plotName || t7a.plotName;
            farmerName =
              farmerName ||
              t7a.results?.[0]?.farmerName ||
              t7a.store?.name ||
              t7a.dealerName;
            cropCategory = cropCategory || t7a.cropCategory;
            cropName = cropName || t7a.customCropName || t7a.cropName;
            location =
              location ||
              (t7a.results?.[0]?.latitude && t7a.results?.[0]?.longitude
                ? `${t7a.results[0].latitude}, ${t7a.results[0].longitude}`
                : null);
            province = province || t7a.results?.[0]?.province || t7a.store?.province;
            district = district || t7a.results?.[0]?.district || t7a.store?.district;
            latitude =
              latitude ||
              (t7a.results?.[0]?.latitude
                ? String(t7a.results[0].latitude)
                : null);
            longitude =
              longitude ||
              (t7a.results?.[0]?.longitude
                ? String(t7a.results[0].longitude)
                : null);
            showcaseProductName =
              showcaseProductName ||
              t7a.products?.[0]?.product?.name ||
              t7a.products?.[0]?.productName;
            if (!showcaseProductId && t7a.products?.[0]?.productId) {
              showcaseProductId = t7a.products[0].productId;
            }
          } else if (candidatePlotId.startsWith("farmplot-")) {
            // Farmer customer's farm plot (not a Type 7A target record)
            const parts = candidatePlotId.split("-");
            const customerId = parts[1];
            const plotIndex = parseInt(parts[2] || "0", 10);
            if (customerId && (tx as any).customer) {
              const customer = await (tx as any).customer.findUnique({
                where: { id: customerId },
                select: {
                  name: true,
                  province: true,
                  district: true,
                  subdistrict: true,
                  latitude: true,
                  longitude: true,
                  farmPlots: true,
                },
              });
              if (customer) {
                farmerName = farmerName || customer.name;
                province = province || customer.province;
                district = district || customer.district;
                subdistrict = subdistrict || customer.subdistrict;
                const fp = Array.isArray(customer.farmPlots)
                  ? customer.farmPlots[plotIndex]
                  : null;
                if (fp) {
                  plotName =
                    plotName ||
                    `แปลงที่ ${plotIndex + 1}: ${fp.cropType || "พืชเกษตร"}`;
                  cropCategory = cropCategory || fp.cropType;
                  cropName = cropName || fp.cropType;
                  latitude =
                    latitude ||
                    (fp.latitude
                      ? String(fp.latitude)
                      : customer.latitude
                        ? String(customer.latitude)
                        : null);
                  longitude =
                    longitude ||
                    (fp.longitude
                      ? String(fp.longitude)
                      : customer.longitude
                        ? String(customer.longitude)
                        : null);
                }
              }
            }
          } else {
            // User entered a freeform plot name / text in combobox
            if (!plotName) {
              plotName = candidatePlotId;
            }
          }
        }

        // Validate showcaseProductId against Product table
        let validShowcaseProductId: string | null = null;
        if (showcaseProductId && (tx as any).product) {
          const prod = await (tx as any).product.findUnique({
            where: { id: showcaseProductId },
            select: { id: true, name: true },
          });
          if (prod) {
            validShowcaseProductId = prod.id;
            showcaseProductName = showcaseProductName || prod.name;
          }
        }
        if (!validShowcaseProductId && showcaseProductName && (tx as any).product) {
          const prodByName = await (tx as any).product.findFirst({
            where: { name: showcaseProductName },
            select: { id: true, name: true },
          });
          if (prodByName) {
            validShowcaseProductId = prodByName.id;
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

        // 2.1 Create Target record safely
        const targetRecord = await (tx as any).activityPlanType10Target.create({
          data: {
            activityPlanId,
            type7aTargetId: valid7aTargetId,
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
            showcaseProductId: validShowcaseProductId,
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

          let validProdId: string | null = null;
          let prodName: string | null = p.productName || null;
          if (p.productId && (tx as any).product) {
            const existingProd = await (tx as any).product.findUnique({
              where: { id: p.productId },
              select: { id: true, name: true },
            });
            if (existingProd) {
              validProdId = existingProd.id;
              prodName = prodName || existingProd.name;
            }
          }
          if (!validProdId && prodName && (tx as any).product) {
            const existingByName = await (tx as any).product.findFirst({
              where: { name: prodName },
              select: { id: true, name: true },
            });
            if (existingByName) {
              validProdId = existingByName.id;
            }
          }

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
              productId: validProdId,
              productName: prodName,
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

          let validSaleProdId: string | null = null;
          let saleProdName: string | null = sale.productName || null;
          if (sale.productId && (tx as any).product) {
            const existingProd = await (tx as any).product.findUnique({
              where: { id: sale.productId },
              select: { id: true, name: true },
            });
            if (existingProd) {
              validSaleProdId = existingProd.id;
              saleProdName = saleProdName || existingProd.name;
            }
          }
          if (!validSaleProdId && saleProdName && (tx as any).product) {
            const existingByName = await (tx as any).product.findFirst({
              where: { name: saleProdName },
              select: { id: true, name: true },
            });
            if (existingByName) {
              validSaleProdId = existingByName.id;
            }
          }

          // Check if product already exists as a planned target product
          const existingProduct = validSaleProdId
            ? await (tx as any).activityPlanType10Product.findFirst({
                where: {
                  targetId: primaryTarget.id,
                  productId: validSaleProdId,
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
                productId: validSaleProdId,
                productName: saleProdName,
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
