import { Prisma, AttachmentCategory } from "@prisma/client";
import type {
  WorkTypeStrategy,
  PrismaTransaction,
  StrategyValidationResult,
} from "@/modules/activity/types/strategy.interface";
import { findType11ByPlanId } from "./type11.repository";
import { parseType11ActualResult } from "../application/actual-mapper";
import { normalizeAttachmentCategory } from "@/modules/activity/infrastructure/activity-result.repository";

/**
 * Validates whether an ID is a valid database CUID or UUID,
 * rejecting null, empty strings, and client-generated temp strings (temp-, t11-).
 */
const isValidId = (id: unknown): id is string =>
  typeof id === "string" &&
  id.trim().length > 0 &&
  !id.startsWith("temp-") &&
  !id.startsWith("t11-") &&
  (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) ||
    /^c[a-z0-9]{20,32}$/i.test(id)
  );

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
   * Save Type 11 Plan data exclusively into dedicated tables:
   * 1. activity_type_11_targets
   * 2. activity_type_11_products
   * 3. activity_type_11_result (if 2-in-1 unplanned outcome provided)
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

        // If storeId is not a valid DB CUID/UUID format (or client generated temp id), treat as unregistered
        if (storeId && !isValidId(storeId)) {
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
          item.products ||
          item.stockItems ||
          (Array.isArray(planData.type11Products)
            ? planData.type11Products.filter(
                (p: any) =>
                  (item.id && (p.targetId === item.id || p.target?.id === item.id)) ||
                  (storeId && (p.storeId === storeId || p.target?.storeId === storeId)) ||
                  (storeName && (p.storeName === storeName || p.target?.storeName === storeName)),
              )
            : []);

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
            if (prodId && !isValidId(prodId)) {
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
      }
    }
  },

  /**
   * Save Type 11 Actual outcome data exclusively into:
   * 1. activity_type_11_result (per target)
   * 2. activity_type_11_products (updating stock actuals or creating audit items)
   */
  async saveActual(
    tx: PrismaTransaction,
    activityPlanIdOrResultId: string,
    actualData: any,
  ): Promise<void> {
    let activityPlanId =
      actualData.activityPlanId ||
      actualData.planId;

    if (!activityPlanId && activityPlanIdOrResultId) {
      const planCheck = await (tx as any).activityPlan.findUnique({
        where: { id: activityPlanIdOrResultId },
        select: { id: true },
      });
      if (planCheck) {
        activityPlanId = planCheck.id;
      } else {
        const resultRecord = await (tx as any).activityResult.findUnique({
          where: { id: activityPlanIdOrResultId },
          select: { activityPlanId: true },
        });
        activityPlanId = resultRecord?.activityPlanId || activityPlanIdOrResultId;
      }
    }

    if (!activityPlanId) return;

    // Load existing targets
    let targets = await (tx as any).activityPlanType11Target.findMany({
      where: { activityPlanId },
      include: { products: true },
      orderBy: { createdAt: "asc" },
    });

    // If no dedicated target exists, create one
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

    // 2. Save, update, and prune activity_type_11_products
    const stockItems =
      actualData.stockResults ||
      actualData.t11StockItems ||
      actualData.stockItems ||
      [];

    const existingProducts = await (tx as any).activityPlanType11Product.findMany({
      where: { activityPlanId },
    });
    const existingMap = new Map<string, any>();
    existingProducts.forEach((p: any) => {
      existingMap.set(p.id, p);
    });

    const keptProductIds = new Set<string>();

    if (Array.isArray(stockItems) && stockItems.length > 0) {
      for (const item of stockItems) {
        if (!item) continue;

        // Determine which target this stock item belongs to
        const matchedTarget =
          targets.find(
            (t: any) =>
              (item.targetId && t.id === item.targetId) ||
              (item.storeId && t.storeId === item.storeId) ||
              (item.storeName &&
                t.storeName &&
                t.storeName.trim().toLowerCase() === item.storeName.trim().toLowerCase()),
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
        if (prodId && !isValidId(prodId)) {
          prodId = null;
        }

        // Match existing product:
        // 1. By item.id if already in DB
        // 2. Or by targetId + productId (if productId exists)
        // 3. Or by targetId + productName
        let existingProduct: any = null;
        if (item.id && existingMap.has(item.id)) {
          existingProduct = existingMap.get(item.id);
        } else if (prodId) {
          existingProduct = existingProducts.find(
            (ep: any) =>
              ep.targetId === matchedTarget.id &&
              ep.productId === prodId &&
              !keptProductIds.has(ep.id),
          );
        } else if (item.productName) {
          existingProduct = existingProducts.find(
            (ep: any) =>
              ep.targetId === matchedTarget.id &&
              ep.productName?.trim().toLowerCase() === item.productName.trim().toLowerCase() &&
              !keptProductIds.has(ep.id),
          );
        }

        if (existingProduct) {
          keptProductIds.add(existingProduct.id);
          await (tx as any).activityPlanType11Product.update({
            where: { id: existingProduct.id },
            data: {
              targetId: matchedTarget.id,
              productId: prodId || existingProduct.productId,
              productName: item.productName || existingProduct.productName,
              actualQuantity: actQtyDec,
              stockStatus: item.stockStatus || null,
              reorderOpportunity: item.reorderOpportunity || null,
              suggestedOrderQty: suggestedOrderQtyDec,
              remarks: item.remarks || null,
              nextAction: item.nextAction || null,
            },
          });
        } else {
          const created = await (tx as any).activityPlanType11Product.create({
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
          keptProductIds.add(created.id);
        }
      }
    }

    // 4. Sync attachments
    const rawAttachments: any[] = [
      ...(Array.isArray(actualData.attachments) ? actualData.attachments : []),
      ...(Array.isArray(actualData.images) ? actualData.images : []),
      ...(Array.isArray(actualData.t11Images) ? actualData.t11Images : []),
      ...(Array.isArray(actualData.type11UnplannedItems)
        ? actualData.type11UnplannedItems.flatMap((item: any) =>
            (item.images || []).map((img: any) => ({
              ...img,
              category: "STOCK",
              storeId: item.storeId || item.id || null,
              workTypeCode: "TYPE_11",
            })),
          )
        : []),
    ];

    const hasAttachmentsInput =
      actualData.attachments !== undefined ||
      actualData.images !== undefined ||
      actualData.t11Images !== undefined ||
      actualData.type11UnplannedItems !== undefined;

    if (hasAttachmentsInput) {
      await (tx as any).activityAttachment.deleteMany({
        where: {
          activityPlanId,
          workTypeCode: "TYPE_11",
        },
      });

      const seenUrls = new Set<string>();
      const validT11Attachments: any[] = [];
      for (const att of rawAttachments) {
        const u = att?.fileUrl || att?.url;
        if (u && !seenUrls.has(u)) {
          seenUrls.add(u);
          validT11Attachments.push(att);
        }
      }

      if (validT11Attachments.length > 0) {
        const resultRecord = await (tx as any).activityResult.findFirst({
          where: { activityPlanId },
          select: { id: true },
        });
        const resolvedResultId = resultRecord?.id || actualData.activityResultId || null;

        await (tx as any).activityAttachment.createMany({
          data: validT11Attachments.map((att: any) => ({
            activityPlanId,
            activityResultId: resolvedResultId,
            workTypeCode: "TYPE_11",
            storeId: att.storeId || null,
            category: normalizeAttachmentCategory(
              att.category,
              AttachmentCategory.SHELF,
            ),
            fileUrl: att.fileUrl || att.url,
            fileName: att.fileName || att.name || "รูปภาพสต็อกสินค้า",
            fileSize: Math.round(Number(att.fileSize || att.size || 0)),
            mimeType: att.mimeType || att.type || "image/jpeg",
          })),
        });
      }
    }


    await (tx as any).activityPlanType11Product.deleteMany({
      where: {
        activityPlanId,
        id: {
          notIn: Array.from(keptProductIds),
        },
      },
    });
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
