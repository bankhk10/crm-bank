import type { Type11ActualRecord } from "../types/actual.types";

/**
 * Parses Type 11 actual outcome data strictly from dedicated tables
 * (type11Targets, type11Products, type11Results).
 */
export function parseType11ActualResult(
  resData: any,
  plan?: any,
): Partial<Type11ActualRecord> {
  const result: Partial<Type11ActualRecord> = {};

  const sourceData = resData || plan;
  const planData = plan || resData?.activityPlan || sourceData;

  // 1. Gather all targets and build target lookup map
  const targets: any[] =
    sourceData?.type11Targets ||
    planData?.type11Targets ||
    sourceData?.type11Data?.targets ||
    planData?.type11Data?.targets ||
    [];

  const targetMap = new Map<string, any>();
  targets.forEach((t) => {
    if (t?.id) targetMap.set(t.id, t);
  });

  // 2. Extract products from targets (most reliable source of store info)
  const rawProducts: any[] = [];

  if (targets.length > 0) {
    targets.forEach((t: any) => {
      if (Array.isArray(t.products) && t.products.length > 0) {
        t.products.forEach((p: any) => {
          rawProducts.push({
            ...p,
            targetId: p.targetId || t.id,
            target: p.target || t,
            _parentTarget: t,
          });
        });
      }
    });
  }

  // Also check direct type11Products (e.g. standalone audit items)
  const directProducts: any[] =
    sourceData?.type11Products ||
    planData?.type11Products ||
    [];

  if (directProducts.length > 0) {
    directProducts.forEach((dp: any) => {
      const alreadyIncluded = rawProducts.some((p) => p.id === dp.id);
      if (!alreadyIncluded) {
        const matchedTarget = dp.target || targetMap.get(dp.targetId);
        rawProducts.push({
          ...dp,
          target: matchedTarget,
          _parentTarget: matchedTarget,
        });
      }
    });
  }

  // Fallback to stockResults or legacy stock items if present
  if (rawProducts.length === 0) {
    const legacyStock =
      sourceData?.stockResults ||
      sourceData?.stockItems ||
      sourceData?.t11StockItems ||
      planData?.stockResults;
    if (Array.isArray(legacyStock) && legacyStock.length > 0) {
      rawProducts.push(...legacyStock);
    }
  }

  if (rawProducts.length > 0) {
    result.t11StockItems = rawProducts.map((p: any) => {
      const parentTarget =
        p._parentTarget || p.target || (p.targetId ? targetMap.get(p.targetId) : undefined);
      const storeName =
        p.storeName ||
        parentTarget?.storeName ||
        parentTarget?.store?.name ||
        (typeof parentTarget?.store === "string" ? parentTarget.store : "") ||
        "ร้านค้า";

      const storeId =
        p.storeId ||
        parentTarget?.storeId ||
        parentTarget?.store?.id ||
        null;

      const actQty =
        p.actualQuantity != null
          ? p.actualQuantity
          : p.remainingQty != null
            ? p.remainingQty
            : p.remainingQuantity != null
              ? p.remainingQuantity
              : p.remainingStockQty;

      return {
        id: p.id || crypto.randomUUID(),
        targetId: p.targetId || parentTarget?.id,
        storeId,
        storeName,
        productId: p.productId || null,
        productName: p.productName || p.product?.name || "สินค้า",
        productCode: p.product?.productCode || p.productCode || undefined,
        productRole: p.productRole || "TARGET",
        targetQuantity: p.targetQuantity != null ? Number(p.targetQuantity) : null,
        targetNotes: p.targetNotes || null,
        remainingQty:
          actQty != null && String(actQty).trim() !== "" ? String(actQty) : "",
        remainingQuantity:
          actQty != null && !isNaN(Number(actQty)) ? Number(actQty) : undefined,
        remainingStockQty:
          actQty != null && !isNaN(Number(actQty)) ? Number(actQty) : undefined,
        actualQuantity:
          actQty != null && !isNaN(Number(actQty)) ? Number(actQty) : undefined,
        stockStatus: p.stockStatus || "ปกติ",
        reorderOpportunity: p.reorderOpportunity || "",
        suggestedOrderQty:
          p.suggestedOrderQty != null ? Number(p.suggestedOrderQty) : undefined,
        remarks: p.remarks || "",
        nextAction: p.nextAction || "",
        isCustom: p.productRole === "ADDITIONAL_AUDIT",
      };
    });

    const foundNextAction = rawProducts.find((p: any) => p.nextAction)?.nextAction;
    if (foundNextAction) {
      result.t11NextAction = foundNextAction;
    }
  }

  // 3. Dedicated relational results (type11Results / target.result)
  const dedicatedResults =
    sourceData?.type11Results ||
    planData?.type11Results ||
    targets.map((t: any) => t.result).filter(Boolean);

  if (Array.isArray(dedicatedResults) && dedicatedResults.length > 0) {
    const firstRes = dedicatedResults[0];
    if (firstRes) {
      if (firstRes.overallStockStatus)
        result.t11StockStatus = firstRes.overallStockStatus as any;
      if (firstRes.overallReorderOpportunity)
        result.t11ReorderOpportunity = firstRes.overallReorderOpportunity as any;
      if (firstRes.nextAction) result.t11NextAction = firstRes.nextAction;
      if (firstRes.summary) result.t11Summary = firstRes.summary;
      if (firstRes.feedback) result.t11Feedback = firstRes.feedback;
    }
  }

  // 4. Attachments
  const allAttachments =
    sourceData?.attachments ||
    planData?.attachments ||
    [];

  if (Array.isArray(allAttachments) && allAttachments.length > 0) {
    const stockImgs = allAttachments
      .filter(
        (att: any) =>
          att.workTypeCode === "TYPE_11" ||
          att.category === "stock" ||
          att.category === "STOCK" ||
          att.category === "t11",
      )
      .map((att: any) => ({
        id: att.id,
        url: att.fileUrl || att.url,
        name: att.fileName || att.name || "รูปภาพสต็อกสินค้า",
        size: att.fileSize,
        type: att.fileType || "image/jpeg",
      }));
    if (stockImgs.length > 0) {
      result.t11Images = stockImgs;
    }
  }

  return result;
}
