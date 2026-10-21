import type {
  Type3ProductSaleDetail,
  Type3SaleResultItem,
  Type3ActualData,
} from "../types/actual.types";

/**
 * Parses actual sales data from ActivityResult or summary payload
 */
export function parseType3ActualResult(resData: any): {
  t3SoldProducts?: string;
  t3ActualSales?: string;
  t3ActualQuantity?: string;
  t3UnclosedReason?: string;
  t3ProductSalesDetails?: Type3ProductSaleDetail[];
} {
  const result: {
    t3SoldProducts?: string;
    t3ActualSales?: string;
    t3ActualQuantity?: string;
    t3UnclosedReason?: string;
    t3ProductSalesDetails?: Type3ProductSaleDetail[];
  } = {};

  if (!resData) return result;

  // 1. From relation table: ActivityResultSaleItem
  const rawSaleResults: any[] = resData.saleResults || resData.activityResultSaleItems || [];
  const t3SaleResults = rawSaleResults.filter(
    (s) =>
      !s.workTypeCode ||
      s.workTypeCode === "TYPE_3" ||
      s.workTypeCode === "เสนอขายสินค้า",
  );

  if (t3SaleResults.length > 0) {
    const details: Type3ProductSaleDetail[] = t3SaleResults.map((item) => {
      const pName = item.productName || item.product?.name || "สินค้า";
      const actualQty = Number(item.actualQuantity ?? 0);
      const unitPrice = Number(item.actualUnitPrice ?? 0);
      const actualTotal = Number(item.actualTotal ?? actualQty * unitPrice);

      return {
        id: item.id,
        productId: item.productId,
        productName: pName,
        customer: item.store?.name || item.customerName || "",
        storeId: item.storeId || undefined,
        actualQty,
        unitPrice,
        actualSales: actualTotal,
        actualQuantity: actualQty,
        actualUnitPrice: unitPrice,
        actualTotal,
        unclosedReason: item.unclosedReason || "",
        isAdditional: Boolean(item.isAdditional),
      };
    });

    result.t3ProductSalesDetails = details;

    const totalQty = details.reduce((sum, d) => sum + (Number(d.actualQty) || 0), 0);
    const totalSales = details.reduce((sum, d) => sum + (Number(d.actualSales) || 0), 0);

    result.t3ActualQuantity = String(totalQty);
    result.t3ActualSales = String(totalSales);
    result.t3SoldProducts = details.map((d) => d.productName).filter(Boolean).join(", ");

    const reasons = details.map((d) => d.unclosedReason).filter(Boolean);
    if (reasons.length > 0) {
      result.t3UnclosedReason = reasons.join(" | ");
    }

    return result;
  }

  // 2. From resultSummary JSON payload
  const rawSummary = typeof resData === "string" ? resData : resData?.resultSummary;
  if (rawSummary) {
    try {
      const parsed = typeof rawSummary === "string" ? JSON.parse(rawSummary) : rawSummary;
      if (parsed && typeof parsed === "object") {
        if (parsed.t3SoldProducts) result.t3SoldProducts = parsed.t3SoldProducts;
        if (parsed.t3ActualSales) result.t3ActualSales = String(parsed.t3ActualSales);
        if (parsed.t3ActualQuantity) result.t3ActualQuantity = String(parsed.t3ActualQuantity);
        if (parsed.t3UnclosedReason) result.t3UnclosedReason = parsed.t3UnclosedReason;
        if (parsed.t3ProductSalesDetails) result.t3ProductSalesDetails = parsed.t3ProductSalesDetails;
      }
    } catch {
      // ignore parse errors
    }
  }

  return result;
}

/**
 * Maps actual form data to database payload for saveActual
 */
export function mapType3ActualFormToDb(
  actualData: Type3ActualData,
  activityPlanId: string,
): {
  activityPlanId: string;
  productSalesDetails: Type3SaleResultItem[];
} {
  const details = actualData.productSalesDetails || [];

  const saleResults: Type3SaleResultItem[] = details.map((d) => {
    const qty = Number(d.actualQty ?? 0);
    const unitPrice = Number(d.unitPrice ?? 0);
    const total =
      d.actualSales != null
        ? Number(d.actualSales)
        : qty * unitPrice;

    return {
      id: d.id,
      productId: d.productId || "",
      productName: d.productName || null,
      storeId: d.storeId || null,
      actualQuantity: qty,
      actualUnitPrice: unitPrice,
      actualTotal: total,
      unclosedReason: d.unclosedReason || null,
      isAdditional: Boolean(d.isAdditional),
    };
  });

  return {
    activityPlanId,
    productSalesDetails: saleResults,
  };
}
