import { Prisma } from "@prisma/client";
import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity/types/strategy.interface";
import type { Type9ProductSaleDetail } from "../../shared/types";
import { findType9ByPlanId } from "./type9.repository";

export const type9PlannedStrategy: WorkTypeStrategy = {
  code: "TYPE_9",

  /**
   * Validate Type 9 Plan Data
   */
  async validatePlan(
    planData: any,
    _db: any,
  ): Promise<StrategyValidationResult> {
    const rawStores: any[] =
      planData.type9Targets ||
      planData.type9Stores ||
      planData.type9UnplannedItems ||
      (planData.planStores || []).filter(
        (s: any) =>
          s.workTypeCode === "TYPE_9" ||
          s.workTypeCode === "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
      );

    if (rawStores && rawStores.length > 0) {
      for (let i = 0; i < rawStores.length; i++) {
        const s = rawStores[i];
        if (!s.storeId && !s.subdealerId && !s.subDealerStore && !s.storeName && !s.subdealerName) {
          return {
            valid: false,
            error: `รายการกิจกรรมหน้าร้านที่ ${i + 1}: กรุณาระบุร้านค้าหลักหรือชื่อร้าน Sub Dealer`,
          };
        }
      }
    }

    return { valid: true };
  },

  /**
   * Save Type 9 Plan targets in Dedicated Tables:
   * 1. activity_type_9_targets
   * 2. activity_type_9_products
   * And mirror to legacy tables for backward compatibility.
   */
  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    // 1. Clean previous dedicated records for this plan (Cascade deletes products & result)
    await (tx as any).activityPlanType9Target.deleteMany({
      where: { activityPlanId },
    });

    await (tx as any).activityPlanType9Product.deleteMany({
      where: { activityPlanId },
    });

    // 2. Extract targets/stores array
    let targets: any[] =
      planData.type9Targets ||
      planData.type9Stores ||
      planData.type9UnplannedItems ||
      planData.type9Data?.stores ||
      [];

    // Fallback if single target passed at top-level
    if (targets.length === 0 && (planData.subdealerId || planData.subDealerStore || planData.subdealerName || planData.type9Store)) {
      targets = [
        {
          subdealerId: planData.subdealerId || null,
          subdealerName: planData.subdealerName || planData.type9Store || null,
          isUnregisteredSubdealer: Boolean(planData.isUnregisteredSubdealer),
          subDealerStore: planData.subDealerStore || null,
          province: planData.province || planData.subDealerProvince || null,
          district: planData.district || planData.subDealerDistrict || null,
          dealerId: planData.parentDealerId || null,
          dealerName: planData.parentDealerName || null,
          targetSales: planData.type9Sales != null ? Number(planData.type9Sales) : null,
          products: planData.type9ProductItems || [],
          notes: planData.notes || null,
        },
      ];
    } else if (targets.length === 0 && Array.isArray(planData.planStores)) {
      targets = planData.planStores.filter(
        (s: any) =>
          s.workTypeCode === "TYPE_9" ||
          s.workTypeCode === "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
      );
    }

    if (targets && Array.isArray(targets) && targets.length > 0) {
      for (let i = 0; i < targets.length; i++) {
        const item = targets[i];

        const isUnregistered = Boolean(item.isUnregisteredSubdealer || item.isUnregistered);
        const subdealerId = (!isUnregistered && (item.subdealerId || item.storeId)) ? (item.subdealerId || item.storeId) : null;
        const subdealerName = item.subdealerName || (!isUnregistered ? item.storeName : null);
        const subDealerStore = (item.subDealerStore || (isUnregistered ? item.storeName || item.store : null) || "").trim() || null;
        const dealerId = item.dealerId || item.parentDealerId || null;
        const dealerName = item.dealerName || item.parentDealerName || null;
        const province = item.province || null;
        const district = item.district || null;
        const targetSalesNum = item.targetSales != null ? Number(item.targetSales) : (item.targetAmount != null ? Number(item.targetAmount) : null);
        const targetSalesDec = targetSalesNum != null ? new Prisma.Decimal(targetSalesNum) : null;
        const attendeesNum = item.targetAttendeesCount != null ? Number(item.targetAttendeesCount) : (item.targetAttendees != null ? Number(item.targetAttendees) : 0);
        const notes = item.notes || item.remarks || null;

        // 2.1 Create Target record
        const targetRecord = await (tx as any).activityPlanType9Target.create({
          data: {
            activityPlanId,
            subdealerId,
            subdealerName,
            isUnregisteredSubdealer: isUnregistered,
            subDealerStore,
            province,
            district,
            dealerId,
            dealerName,
            targetSales: targetSalesDec,
            targetAttendeesCount: attendeesNum,
            notes,
          },
        });

        // 2.2 Create Planned Products
        const prodItems: any[] =
          item.products ||
          item.items ||
          item.type9ProductItems ||
          (targets.length === 1 ? planData.type9ProductItems || [] : []);

        for (const p of prodItems) {
          if (!p || (!p.productName && !p.productId)) continue;

          const qty = p.quantityCases != null ? Number(p.quantityCases) : (p.quantity != null ? Number(p.quantity) : 0);
          const price = p.pricePerCase != null ? Number(p.pricePerCase) : (p.unitPrice != null ? Number(p.unitPrice) : 0);
          const total = p.totalAmount != null ? Number(p.totalAmount) : qty * price;

          const targetQtyDec = new Prisma.Decimal(qty);
          const targetPriceDec = new Prisma.Decimal(price);
          const targetAmountDec = new Prisma.Decimal(total);

          // Actual fields if Unplanned 2-in-1
          const actualQtyDec =
            p.actualQuantityCases != null && p.actualQuantityCases !== "" && !isNaN(Number(p.actualQuantityCases))
              ? new Prisma.Decimal(p.actualQuantityCases)
              : p.actualQuantity != null && !isNaN(Number(p.actualQuantity))
                ? new Prisma.Decimal(p.actualQuantity)
                : null;

          const actualPriceDec =
            p.actualUnitPrice != null && !isNaN(Number(p.actualUnitPrice))
              ? new Prisma.Decimal(p.actualUnitPrice)
              : actualQtyDec ? targetPriceDec : null;

          const actualTotalDec =
            p.actualSales != null && p.actualSales !== "" && !isNaN(Number(p.actualSales))
              ? new Prisma.Decimal(p.actualSales)
              : p.actualTotal != null && !isNaN(Number(p.actualTotal))
                ? new Prisma.Decimal(p.actualTotal)
                : actualQtyDec && actualPriceDec
                  ? actualQtyDec.mul(actualPriceDec)
                  : null;

          await (tx as any).activityPlanType9Product.create({
            data: {
              activityPlanId,
              targetId: targetRecord.id,
              productId: p.productId || null,
              productName: p.productName || null,
              productRole: p.productRole || "TARGET",
              targetQuantity: targetQtyDec,
              targetUnitPrice: targetPriceDec,
              targetAmount: targetAmountDec,
              actualQuantity: actualQtyDec,
              actualUnitPrice: actualPriceDec,
              actualTotal: actualTotalDec,
              actualNotes: p.actualNotes || p.notes || null,
            },
          });
        }

        // 2.3 Additional Sales (e.g. from Unplanned 2-in-1 ProductSalesDetails)
        const salesDetails: Type9ProductSaleDetail[] = item.productSalesDetails || [];
        for (const sale of salesDetails) {
          if (!sale || (!sale.productName && !sale.productId)) continue;

          const existingProduct = await (tx as any).activityPlanType9Product.findFirst({
            where: {
              targetId: targetRecord.id,
              productRole: "TARGET",
              OR: [
                sale.productId ? { productId: sale.productId } : undefined,
                sale.productName ? { productName: sale.productName } : undefined,
              ].filter(Boolean) as any,
            },
          });

          const actualQtyDec =
            sale.actualQuantityCases != null && sale.actualQuantityCases !== "" && !isNaN(Number(sale.actualQuantityCases))
              ? new Prisma.Decimal(sale.actualQuantityCases)
              : null;
          const actualPriceDec =
            sale.pricePerCase != null && !isNaN(Number(sale.pricePerCase))
              ? new Prisma.Decimal(sale.pricePerCase)
              : null;
          const actualTotalDec =
            sale.actualSales != null && sale.actualSales !== "" && !isNaN(Number(sale.actualSales))
              ? new Prisma.Decimal(sale.actualSales)
              : actualQtyDec && actualPriceDec
                ? actualQtyDec.mul(actualPriceDec)
                : null;

          if (existingProduct) {
            await (tx as any).activityPlanType9Product.update({
              where: { id: existingProduct.id },
              data: {
                actualQuantity: actualQtyDec,
                actualUnitPrice: actualPriceDec,
                actualTotal: actualTotalDec,
                actualNotes: sale.actualNotes || null,
              },
            });
          } else {
            await (tx as any).activityPlanType9Product.create({
              data: {
                activityPlanId,
                targetId: targetRecord.id,
                productId: sale.productId || null,
                productName: sale.productName || null,
                productRole: "ADDITIONAL_SALE",
                actualQuantity: actualQtyDec,
                actualUnitPrice: actualPriceDec,
                actualTotal: actualTotalDec,
                actualNotes: sale.actualNotes || null,
              },
            });
          }
        }

        // 2.4 If Actual Result Outcome was passed per item (Unplanned 2-in-1)
        if (item.actualAttendees != null || item.actualSales != null || item.summary || item.customerFeedback) {
          const actAttendees = item.actualAttendees != null ? Number(item.actualAttendees) : 0;
          const actTotalSales = item.actualSales != null && !isNaN(Number(item.actualSales)) ? new Prisma.Decimal(item.actualSales) : null;

          await (tx as any).activityResultType9.upsert({
            where: { targetId: targetRecord.id },
            create: {
              activityPlanId,
              targetId: targetRecord.id,
              actualAttendeesCount: actAttendees,
              actualTotalSales: actTotalSales,
              customerFeedback: item.customerFeedback || null,
              summary: item.summary || item.notes || null,
            },
            update: {
              actualAttendeesCount: actAttendees,
              actualTotalSales: actTotalSales,
              customerFeedback: item.customerFeedback || null,
              summary: item.summary || item.notes || null,
            },
          });
        }
      }
    }
  },

  /**
   * Save Type 9 Actual outcome data into:
   * 1. activity_type_9_result
   * 2. activity_type_9_products (updating target actual or adding ADDITIONAL_SALE)
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

    const t9Data = actualData?.type9Actual || actualData || {};
    const actualAttendees = t9Data.actualAttendees ?? t9Data.t9ActualAttendees;
    const actualSalesTotal = t9Data.actualSales ?? t9Data.t9ActualSales;
    const customerFeedback = t9Data.customerFeedback ?? t9Data.t9CustomerFeedback ?? null;
    const summary = t9Data.summary ?? t9Data.t9Summary ?? actualData.resultSummary ?? null;
    const salesDetails: Type9ProductSaleDetail[] =
      t9Data.productSalesDetails ?? t9Data.t9ProductSalesDetails ?? actualData.productSalesDetails ?? [];

    // Find targets for this plan
    const targets = await (tx as any).activityPlanType9Target.findMany({
      where: { activityPlanId },
      orderBy: { createdAt: "asc" },
    });

    if (targets.length > 0) {
      const primaryTarget = targets[0];

      // Upsert into activity_type_9_result
      const actAttendeesNum = actualAttendees != null ? Number(actualAttendees) : 0;
      const actSalesDec =
        actualSalesTotal != null && !isNaN(Number(String(actualSalesTotal).replace(/,/g, "")))
          ? new Prisma.Decimal(String(actualSalesTotal).replace(/,/g, ""))
          : null;

      await (tx as any).activityResultType9.upsert({
        where: { targetId: primaryTarget.id },
        create: {
          activityPlanId,
          targetId: primaryTarget.id,
          actualAttendeesCount: actAttendeesNum,
          actualTotalSales: actSalesDec,
          customerFeedback,
          summary,
        },
        update: {
          actualAttendeesCount: actAttendeesNum,
          actualTotalSales: actSalesDec,
          customerFeedback,
          summary,
        },
      });

      // Save/Update Product Sales in activity_type_9_products
      if (Array.isArray(salesDetails) && salesDetails.length > 0) {
        for (const sale of salesDetails) {
          if (!sale || (!sale.productName && !sale.productId)) continue;

          const qtyClean = sale.actualQuantityCases != null ? String(sale.actualQuantityCases).replace(/,/g, "").trim() : "";
          const actualQtyDec = qtyClean !== "" && !isNaN(Number(qtyClean)) ? new Prisma.Decimal(qtyClean) : null;

          const priceClean = sale.pricePerCase != null ? String(sale.pricePerCase).replace(/,/g, "").trim() : "";
          const unitPriceDec = priceClean !== "" && !isNaN(Number(priceClean)) ? new Prisma.Decimal(priceClean) : null;

          const totalClean = sale.actualSales != null ? String(sale.actualSales).replace(/,/g, "").trim() : "";
          const actualTotalDec =
            totalClean !== "" && !isNaN(Number(totalClean))
              ? new Prisma.Decimal(totalClean)
              : actualQtyDec && unitPriceDec
                ? actualQtyDec.mul(unitPriceDec)
                : null;

          // Check if already exists in this target as TARGET product
          const existingTargetProduct = await (tx as any).activityPlanType9Product.findFirst({
            where: {
              targetId: primaryTarget.id,
              productRole: "TARGET",
              OR: [
                sale.productId ? { productId: sale.productId } : undefined,
                sale.productName ? { productName: sale.productName } : undefined,
              ].filter(Boolean) as any,
            },
          });

          if (existingTargetProduct) {
            await (tx as any).activityPlanType9Product.update({
              where: { id: existingTargetProduct.id },
              data: {
                actualQuantity: actualQtyDec,
                actualUnitPrice: unitPriceDec,
                actualTotal: actualTotalDec,
                actualNotes: sale.actualNotes || null,
              },
            });
          } else {
            // Check if existing ADDITIONAL_SALE product already recorded
            const existingAdditional = await (tx as any).activityPlanType9Product.findFirst({
              where: {
                targetId: primaryTarget.id,
                productRole: "ADDITIONAL_SALE",
                OR: [
                  sale.productId ? { productId: sale.productId } : undefined,
                  sale.productName ? { productName: sale.productName } : undefined,
                ].filter(Boolean) as any,
              },
            });

            if (existingAdditional) {
              await (tx as any).activityPlanType9Product.update({
                where: { id: existingAdditional.id },
                data: {
                  actualQuantity: actualQtyDec,
                  actualUnitPrice: unitPriceDec,
                  actualTotal: actualTotalDec,
                  actualNotes: sale.actualNotes || null,
                },
              });
            } else {
              await (tx as any).activityPlanType9Product.create({
                data: {
                  activityPlanId,
                  targetId: primaryTarget.id,
                  productId: sale.productId || null,
                  productName: sale.productName || null,
                  productRole: "ADDITIONAL_SALE",
                  actualQuantity: actualQtyDec,
                  actualUnitPrice: unitPriceDec,
                  actualTotal: actualTotalDec,
                  actualNotes: sale.actualNotes || null,
                },
              });
            }
          }
        }
      }
    }
  },

  /**
   * Load Type 9 Plan Data
   */
  async loadPlan(
    db: any,
    activityPlanId: string,
  ): Promise<any> {
    return findType9ByPlanId(activityPlanId, db);
  },

  /**
   * Load Type 9 Actual Data
   */
  async loadActual(
    tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<any | null> {
    const plan = await findType9ByPlanId(activityPlanId, tx);
    if (!plan) return null;

    const targets = plan.type9Targets || [];
    const products = plan.type9Products || [];
    const results = plan.type9Results || [];

    return {
      targets,
      products,
      results,
    };
  },
};

// Backward-compatible alias
export const type9Strategy = type9PlannedStrategy;
