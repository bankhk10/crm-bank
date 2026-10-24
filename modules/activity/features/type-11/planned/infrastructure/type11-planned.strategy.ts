import { Prisma } from "@prisma/client";
import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity/types/strategy.interface";
import {
  findType11ByPlanId,
  saveType11ActualStockItems,
} from "./type11.repository";
import { parseType11ActualResult } from "../application/actual-mapper";

export const type11PlannedStrategy: WorkTypeStrategy = {
  code: "TYPE_11",

  /**
   * Validate Type 11 Plan Data
   */
  async validatePlan(
    planData: any,
    _db: any,
  ): Promise<StrategyValidationResult> {
    const stores =
      planData.type11Targets ||
      planData.type11Stores ||
      planData.type11UnplannedItems ||
      planData.stores?.filter(
        (s: any) => s.workTypeCode === "TYPE_11" || !s.workTypeCode,
      );

    if (Array.isArray(stores) && stores.length === 0) {
      return {
        valid: false,
        error: "กรุณาระบุร้านค้าอย่างน้อย 1 ร้านสำหรับการตรวจเช็คสต๊อก",
      };
    }

    return { valid: true };
  },

  /**
   * Save Type 11 Plan data into dedicated tables:
   * 1. activity_type_11_targets
   * 2. activity_type_11_products
   * 3. activity_type_11_result (if 2-in-1 unplanned outcome provided)
   * And mirror to activityPlanStore for backward compatibility.
   */
  async savePlan(
    tx: PrismaTransaction,
    activityPlanId: string,
    planData: any,
  ): Promise<void> {
    // 1. Clean previous dedicated records for this plan (Cascade deletes products & result)
    await (tx as any).activityPlanType11Target.deleteMany({
      where: { activityPlanId },
    });

    await (tx as any).activityPlanType11Product.deleteMany({
      where: { activityPlanId },
    });

    await (tx as any).activityResultType11.deleteMany({
      where: { activityPlanId },
    });

    // Mirror clean legacy activity plan stores for this type
    await (tx as any).activityPlanStore.deleteMany({
      where: {
        activityPlanId,
        workTypeCode: "TYPE_11",
      },
    });

    // 2. Extract targets array
    let targets: any[] =
      planData.type11Targets ||
      planData.type11Stores ||
      planData.type11UnplannedItems ||
      planData.stores?.filter(
        (s: any) => s.workTypeCode === "TYPE_11" || !s.workTypeCode,
      ) ||
      [];

    // Fallback if single store passed at top-level
    if (targets.length === 0) {
      const storeId =
        planData.storeId ||
        planData.submittedStoreId ||
        planData.type11StoreId ||
        null;
      const storeName = planData.storeName || planData.type11StoreName || null;
      if (storeId || storeName) {
        targets = [
          {
            storeId,
            storeName,
            isUnregisteredStore: !storeId,
            notes: planData.notes || planData.remarks || null,
            products: planData.type11Products || planData.stockItems || [],
          },
        ];
      }
    }

    if (targets && Array.isArray(targets) && targets.length > 0) {
      for (let i = 0; i < targets.length; i++) {
        const item = targets[i];
        if (!item) continue;

        let storeId = item.storeId || item.id || null;
        let isUnregisteredStore = Boolean(item.isUnregisteredStore);

        // If storeId is not a valid UUID format (or client generated temp id), treat as unregistered
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (storeId && !uuidRegex.test(storeId)) {
          storeId = null;
          isUnregisteredStore = true;
        }

        let storeName = item.storeName || item.store || item.name || null;
        let storeCode = item.storeCode || null;
        let province = item.province || null;
        let district = item.district || null;
        let dealerId = item.dealerId || null;
        let dealerName = item.dealerName || null;

        // Auto-enrich from Customer if storeId exists
        if (storeId) {
          try {
            const storeCust = await (tx as any).customer.findUnique({
              where: { id: storeId },
              include: {
                parentDealer: {
                  select: { id: true, name: true },
                },
              },
            });

            if (storeCust) {
              storeName = storeName || storeCust.name;
              storeCode = storeCode || storeCust.customerCode;
              province = province || storeCust.province;
              district = district || storeCust.district;
              dealerId = dealerId || storeCust.parentDealerId || null;
              dealerName = dealerName || storeCust.parentDealer?.name || null;
            }
          } catch {
            // Customer lookup fallback
          }
        }

        if (!storeName && !storeId) {
          storeName = `ร้านค้าเป้าหมาย ${i + 1}`;
        }

        // 2.1 Create Target record
        const targetRecord = await (tx as any).activityPlanType11Target.create({
          data: {
            activityPlanId,
            storeId: storeId || null,
            storeName: storeName || "ร้านค้า",
            isUnregisteredStore,
            storeCode,
            province,
            district,
            dealerId,
            dealerName,
            visitPurpose: item.visitPurpose || null,
            notes: item.notes || item.remarks || item.detail || null,
          },
        });

        // 2.2 Create Product records
        const productsList =
          item.products || item.stockItems || planData.type11Products || [];

        if (Array.isArray(productsList) && productsList.length > 0) {
          for (const p of productsList) {
            if (!p) continue;

            const targetQtyNum =
              p.targetQuantity != null && !isNaN(Number(p.targetQuantity))
                ? Number(p.targetQuantity)
                : null;
            const targetQtyDec =
              targetQtyNum != null ? new Prisma.Decimal(targetQtyNum) : null;

            const actQtyNum =
              p.actualQuantity != null && !isNaN(Number(p.actualQuantity))
                ? Number(p.actualQuantity)
                : p.remainingQuantity != null && !isNaN(Number(p.remainingQuantity))
                  ? Number(p.remainingQuantity)
                  : p.remainingQty != null &&
                      p.remainingQty !== "" &&
                      !isNaN(Number(String(p.remainingQty).replace(/,/g, "")))
                    ? Number(String(p.remainingQty).replace(/,/g, ""))
                    : null;
            const actQtyDec =
              actQtyNum != null ? new Prisma.Decimal(actQtyNum) : null;

            const suggestedOrderQtyNum =
              p.suggestedOrderQty != null && !isNaN(Number(p.suggestedOrderQty))
                ? Number(p.suggestedOrderQty)
                : null;
            const suggestedOrderQtyDec =
              suggestedOrderQtyNum != null
                ? new Prisma.Decimal(suggestedOrderQtyNum)
                : null;

            let prodId = p.productId || null;
            if (prodId && !uuidRegex.test(prodId)) {
              prodId = null;
            }

            await (tx as any).activityPlanType11Product.create({
              data: {
                activityPlanId,
                targetId: targetRecord.id,
                productId: prodId,
                productName: p.productName || null,
                productRole:
                  p.productRole || (p.isCustom ? "ADDITIONAL_AUDIT" : "TARGET"),
                targetQuantity: targetQtyDec,
                targetNotes: p.targetNotes || null,
                actualQuantity: actQtyDec,
                stockStatus: p.stockStatus || null,
                reorderOpportunity: p.reorderOpportunity || null,
                suggestedOrderQty: suggestedOrderQtyDec,
                remarks: p.remarks || null,
                nextAction: p.nextAction || null,
              },
            });
          }
        }

        // 2.3 Save Result if passed (Unplanned 2-in-1 per item)
        const hasActualOutcome =
          item.overallStockStatus != null ||
          item.overallReorderOpportunity != null ||
          item.feedback != null ||
          item.nextAction != null ||
          item.summary != null ||
          (Array.isArray(item.stockItems) && item.stockItems.length > 0);

        if (hasActualOutcome) {
          await (tx as any).activityResultType11.create({
            data: {
              activityPlanId,
              targetId: targetRecord.id,
              overallStockStatus: item.overallStockStatus || null,
              overallReorderOpportunity:
                item.overallReorderOpportunity || null,
              feedback: item.feedback || null,
              nextAction: item.nextAction || null,
              summary: item.summary || item.remarks || null,
            },
          });
        }

        // 2.4 Mirror legacy ActivityPlanStore
        if (storeId) {
          await (tx as any).activityPlanStore.create({
            data: {
              activityPlanId,
              workTypeCode: "TYPE_11",
              storeId,
              storeName: storeName || null,
              remarks:
                item.remarks ||
                item.notes ||
                item.detail ||
                "ตรวจเช็คสต๊อกสินค้าคงเหลือหน้าร้าน",
              notes:
                item.notes ||
                item.remarks ||
                item.detail ||
                "ตรวจเช็คสต๊อกสินค้าคงเหลือหน้าร้าน",
            },
          });
        }
      }
    }
  },

  /**
   * Save Type 11 Actual outcome data into:
   * 1. activity_type_11_result (per target)
   * 2. activity_type_11_products (updating stock actuals or creating audit items)
   * 3. activity_result_stock_items (legacy mirror)
   */
  async saveActual(
    tx: PrismaTransaction,
    resultId: string,
    actualData: any,
  ): Promise<void> {
    const resultRecord = await (tx as any).activityResult.findUnique({
      where: { id: resultId },
      select: { activityPlanId: true },
    });

    const activityPlanId =
      resultRecord?.activityPlanId ||
      actualData.activityPlanId ||
      actualData.planId;

    if (!activityPlanId) return;

    // Load existing targets
    let targets = await (tx as any).activityPlanType11Target.findMany({
      where: { activityPlanId },
      include: { products: true },
      orderBy: { createdAt: "asc" },
    });

    // If no dedicated target exists (legacy plan), create one
    if (targets.length === 0) {
      const storeId =
        actualData.storeId ||
        actualData.target?.storeId ||
        actualData.targetId ||
        null;
      const storeName =
        actualData.storeName ||
        actualData.target?.storeName ||
        actualData.target?.store ||
        "ร้านค้าเป้าหมาย";

      const fallbackTarget = await (tx as any).activityPlanType11Target.create({
        data: {
          activityPlanId,
          storeId,
          storeName,
          isUnregisteredStore: !storeId,
          notes: actualData.remarks || null,
        },
      });
      targets = [fallbackTarget];
    }

    const primaryTarget = targets[0];
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    // 1. Save or update activity_type_11_result
    const overallStatus =
      actualData.t11StockStatus ||
      actualData.overallStockStatus ||
      actualData.stockStatus ||
      null;

    const overallOpportunity =
      actualData.t11ReorderOpportunity ||
      actualData.overallReorderOpportunity ||
      actualData.reorderOpportunity ||
      null;

    const feedback =
      actualData.t11Feedback || actualData.feedback || null;

    const nextAction =
      actualData.t11NextAction || actualData.nextAction || null;

    const summary =
      actualData.t11Summary ||
      actualData.summary ||
      actualData.t11Remarks ||
      actualData.remarks ||
      null;

    if (primaryTarget) {
      await (tx as any).activityResultType11.deleteMany({
        where: {
          activityPlanId,
          targetId: primaryTarget.id,
        },
      });

      await (tx as any).activityResultType11.create({
        data: {
          activityPlanId,
          targetId: primaryTarget.id,
          overallStockStatus: overallStatus,
          overallReorderOpportunity: overallOpportunity,
          feedback,
          nextAction,
          summary,
        },
      });
    }

    // 2. Save or update activity_type_11_products
    const stockItems =
      actualData.stockResults ||
      actualData.t11StockItems ||
      actualData.stockItems ||
      [];

    if (Array.isArray(stockItems) && stockItems.length > 0) {
      for (const item of stockItems) {
        if (!item) continue;

        // Determine which target this stock item belongs to
        const matchedTarget =
          targets.find(
            (t: any) =>
              (item.targetId && t.id === item.targetId) ||
              (item.storeId && t.storeId === item.storeId) ||
              (item.storeName && t.storeName === item.storeName),
          ) || primaryTarget;

        if (!matchedTarget) continue;

        const actQtyNum =
          item.actualQuantity != null && !isNaN(Number(item.actualQuantity))
            ? Number(item.actualQuantity)
            : item.remainingQuantity != null && !isNaN(Number(item.remainingQuantity))
              ? Number(item.remainingQuantity)
              : item.remainingStockQty != null && !isNaN(Number(item.remainingStockQty))
                ? Number(item.remainingStockQty)
                : item.remainingQty != null &&
                    item.remainingQty !== "" &&
                    !isNaN(Number(String(item.remainingQty).replace(/,/g, "")))
                  ? Number(String(item.remainingQty).replace(/,/g, ""))
                  : null;
        const actQtyDec =
          actQtyNum != null ? new Prisma.Decimal(actQtyNum) : null;

        const suggestedOrderQtyNum =
          item.suggestedOrderQty != null && !isNaN(Number(item.suggestedOrderQty))
            ? Number(item.suggestedOrderQty)
            : null;
        const suggestedOrderQtyDec =
          suggestedOrderQtyNum != null
            ? new Prisma.Decimal(suggestedOrderQtyNum)
            : null;

        let prodId = item.productId || null;
        if (prodId && !uuidRegex.test(prodId)) {
          prodId = null;
        }

        // Check if product exists in this target as TARGET
        const existingProduct = prodId
          ? await (tx as any).activityPlanType11Product.findFirst({
              where: {
                targetId: matchedTarget.id,
                productId: prodId,
                productRole: "TARGET",
              },
            })
          : null;

        if (existingProduct) {
          await (tx as any).activityPlanType11Product.update({
            where: { id: existingProduct.id },
            data: {
              actualQuantity: actQtyDec,
              stockStatus: item.stockStatus || null,
              reorderOpportunity: item.reorderOpportunity || null,
              suggestedOrderQty: suggestedOrderQtyDec,
              remarks: item.remarks || null,
              nextAction: item.nextAction || null,
            },
          });
        } else {
          await (tx as any).activityPlanType11Product.create({
            data: {
              activityPlanId,
              targetId: matchedTarget.id,
              productId: prodId,
              productName: item.productName || null,
              productRole:
                item.productRole ||
                (item.isCustom ? "ADDITIONAL_AUDIT" : "TARGET"),
              actualQuantity: actQtyDec,
              stockStatus: item.stockStatus || null,
              reorderOpportunity: item.reorderOpportunity || null,
              suggestedOrderQty: suggestedOrderQtyDec,
              remarks: item.remarks || null,
              nextAction: item.nextAction || null,
            },
          });
        }
      }
    }

    // 3. Mirror legacy activity_result_stock_items
    if (resultId && Array.isArray(stockItems) && stockItems.length > 0) {
      await saveType11ActualStockItems(
        tx,
        resultId,
        stockItems,
        nextAction || undefined,
      );
    }
  },

  /**
   * Load Type 11 Plan Data
   */
  async loadPlan(tx: PrismaTransaction, activityPlanId: string): Promise<any[]> {
    const plan = await findType11ByPlanId(activityPlanId, tx);
    return plan?.type11Targets || [];
  },

  /**
   * Load Type 11 Actual Data
   */
  async loadActual(
    tx: PrismaTransaction,
    activityPlanId: string,
  ): Promise<any | null> {
    const plan = await findType11ByPlanId(activityPlanId, tx);
    if (!plan) return null;
    return parseType11ActualResult(undefined, plan);
  },
};

export const type11Strategy = type11PlannedStrategy;
