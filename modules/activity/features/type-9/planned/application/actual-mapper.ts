import type { Type9ImageFile, Type9ProductSaleDetail } from "../../shared/types";
import type { Type9ActualRecord } from "../types/actual.types";

function toImage(att: any): Type9ImageFile {
  return {
    id: att.id,
    url: att.fileUrl || att.url,
    name: att.fileName || att.name || "รูปภาพหน้าร้าน",
    size: att.fileSize ?? att.size ?? undefined,
    type: att.fileType ?? att.mimeType ?? undefined,
  };
}

/**
 * Pure parser for Type 9 Actual Outcome Data
 * Supports dedicated relational storage (activity_type_9_products, activity_type_9_result)
 * with backward-compatible fallback to legacy tables.
 */
export function parseType9ActualResult(resData: any): Partial<
  Type9ActualRecord & {
    t9ActualSales?: string;
    t9ActualAttendees?: string;
    t9ProductSalesDetails?: Type9ProductSaleDetail[];
    t9Images?: Type9ImageFile[];
    t9CustomerFeedback?: string;
  }
> {
  const parsed: Partial<
    Type9ActualRecord & {
      t9ActualSales?: string;
      t9ActualAttendees?: string;
      t9ProductSalesDetails?: Type9ProductSaleDetail[];
      t9Images?: Type9ImageFile[];
      t9CustomerFeedback?: string;
      }
  > = {};

  if (!resData) return parsed;

  const planRef = resData.plan || resData.activityPlan || resData;

  // 1. Dedicated Relational Storage: Products actual outcomes
  const dedicatedProducts = planRef?.type9Products || resData?.type9Products || planRef?.type9Targets?.flatMap((t: any) => t.products || []) || resData?.type9Targets?.flatMap((t: any) => t.products || []);
  if (Array.isArray(dedicatedProducts) && dedicatedProducts.length > 0) {
    const productsWithActuals = dedicatedProducts.filter(
      (p: any) =>
        (p.actualQuantity != null && p.actualQuantity !== "") ||
        (p.actualTotal != null && p.actualTotal !== ""),
    );

    if (productsWithActuals.length > 0) {
      const details: Type9ProductSaleDetail[] = productsWithActuals.map((p: any) => {
        const qty = Number(p.actualQuantity || 0);
        const price = Number(p.actualUnitPrice || p.targetUnitPrice || 0);
        const total = p.actualTotal != null ? Number(p.actualTotal) : qty * price;

        return {
          id: p.id,
          targetId: p.targetId,
          productId: p.productId,
          productName: p.productName || p.product?.name || "",
          productRole: p.productRole || "TARGET",
          actualQuantityCases: qty,
          pricePerCase: price,
          actualSales: total,
          actualNotes: p.actualNotes || undefined,
        };
      });

      parsed.productSalesDetails = details;
      parsed.t9ProductSalesDetails = details;

      const sumActualSales = details.reduce((sum, it) => sum + (Number(it.actualSales) || 0), 0);
      if (sumActualSales > 0) {
        parsed.actualSales = String(sumActualSales);
        parsed.t9ActualSales = String(sumActualSales);
      }
    }
  }

  // 2. Dedicated Relational Storage: Results
  const dedicatedResults = planRef?.type9Results || resData?.type9Results || (planRef?.type9Targets?.[0]?.result ? [planRef.type9Targets[0].result] : []) || (resData?.type9Targets?.[0]?.result ? [resData.type9Targets[0].result] : []);
  if (Array.isArray(dedicatedResults) && dedicatedResults.length > 0) {
    const firstResult = dedicatedResults[0];
    if (firstResult.actualAttendeesCount != null) {
      const attStr = String(firstResult.actualAttendeesCount);
      parsed.actualAttendees = attStr;
      parsed.t9ActualAttendees = attStr;
    }
    if (firstResult.actualTotalSales != null) {
      const salesStr = String(firstResult.actualTotalSales);
      parsed.actualSales = salesStr;
      parsed.t9ActualSales = salesStr;
    }
    if (firstResult.customerFeedback) {
      parsed.t9CustomerFeedback = firstResult.customerFeedback;
    }
  }

  // 3. Fallback: Legacy collections from normalized relations (saleResults)
  if (!parsed.productSalesDetails && Array.isArray(resData.saleResults) && resData.saleResults.length > 0) {
    const t9Sales = resData.saleResults.filter(
      (s: any) =>
        s.workTypeCode === "TYPE_9" ||
        s.workTypeCode === "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
    );
    if (t9Sales.length > 0) {
      const details: Type9ProductSaleDetail[] = t9Sales.map((s: any) => ({
        id: s.id,
        productId: s.productId,
        productName: s.productName || s.product?.name || "",
        actualQuantityCases: Number(s.actualQuantity || 0),
        pricePerCase: Number(s.actualUnitPrice || 0),
        actualSales: Number(s.actualTotal || 0),
        storeId: s.storeId,
      }));
      parsed.productSalesDetails = details;
      parsed.t9ProductSalesDetails = details;

      const totalSales = details.reduce(
        (sum, it) => sum + (Number(it.actualSales) || 0),
        0,
      );
      if (totalSales > 0 && !parsed.actualSales) {
        parsed.actualSales = String(totalSales);
        parsed.t9ActualSales = String(totalSales);
      }
    }
  }

  // 4. Attachments (Images)
  const allAttachments = resData?.attachments || planRef?.attachments || [];
  if (Array.isArray(allAttachments) && allAttachments.length > 0) {
    const t9Att = allAttachments.filter(
      (a: any) =>
        a.workTypeCode === "TYPE_9" ||
        a.workTypeCode === "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
    );
    if (t9Att.length > 0) {
      const imgs = t9Att.map(toImage);
      parsed.images = imgs;
      parsed.t9Images = imgs;
    }
  }

  // 5. Fallback Header fields
  if (resData.actualAttendeesCount != null && !parsed.actualAttendees) {
    const attendees = String(resData.actualAttendeesCount);
    parsed.actualAttendees = attendees;
    parsed.t9ActualAttendees = attendees;
  }
  if (resData.salesResultAmount != null && !parsed.actualSales) {
    const sales = String(resData.salesResultAmount);
    parsed.actualSales = sales;
    parsed.t9ActualSales = sales;
  }

  // 6. Regex fallback from resultSummary text
  const summaryText = resData.resultSummary || "";
  if (summaryText && typeof summaryText === "string") {
    const t9SalesMatch = summaryText.match(/ยอดขายหน้าร้านจริง:\s*(.+)/);
    if (t9SalesMatch && t9SalesMatch[1] && !parsed.t9ActualSales) {
      const sales = t9SalesMatch[1].split("\n")[0].trim();
      parsed.t9ActualSales = sales;
      parsed.actualSales = sales;
    }

    const t9AttMatch = summaryText.match(/ผู้เข้าร่วมหน้าร้านจริง:\s*(\d+)/);
    if (t9AttMatch && t9AttMatch[1] && !parsed.t9ActualAttendees) {
      parsed.t9ActualAttendees = t9AttMatch[1];
      parsed.actualAttendees = t9AttMatch[1];
    }
  }

  return parsed;
}
