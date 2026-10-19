import type { FollowupProductItem } from "../types/planned.types";

/**
 * Parses raw ActivityResult object/record into structured FollowupProductItem[]
 */
export function parseType2ActualResult(result: any): {
  followupResults: FollowupProductItem[];
  customerName?: string;
  detail?: string;
  followupDetail?: string;
  usageResult?: "พืชตอบสนองดี" | "ลูกค้าพึงพอใจ" | "พบปัญหา" | "";
  problemDetail?: string;
} {
  if (!result) {
    return { followupResults: [] };
  }

  // 1. From dedicated relation result.followupResults
  if (result.followupResults && Array.isArray(result.followupResults) && result.followupResults.length > 0) {
    const list: FollowupProductItem[] = result.followupResults.map((item: any) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName || item.product?.name || "สินค้า",
      storeId: item.storeId,
      customer: item.store?.name,
      usageResult: item.usageResult as any,
      followupDetail: item.followupDetail || "",
      problemDetail: item.problemDetail || "",
      isAdditional: Boolean(item.isAdditional),
    }));

    const primary = list[0];
    return {
      followupResults: list,
      customerName: primary?.customer,
      usageResult: primary?.usageResult,
      followupDetail: primary?.followupDetail,
      problemDetail: primary?.problemDetail,
    };
  }

  // 2. From resultSummary JSON
  const rawSummary = typeof result === "string" ? result : result.resultSummary;
  if (rawSummary) {
    try {
      const parsed = typeof rawSummary === "string" ? JSON.parse(rawSummary) : rawSummary;
      if (parsed?.followupResults && Array.isArray(parsed.followupResults)) {
        return {
          followupResults: parsed.followupResults,
          customerName: parsed.t2CustomerName,
          usageResult: parsed.t2UsageResult,
          followupDetail: parsed.t2FollowupDetail,
          problemDetail: parsed.t2ProblemDetail,
        };
      }
    } catch (e) {
      // JSON parse error ignored
    }
  }

  return { followupResults: [] };
}

/**
 * Maps Type 2 Actual results into database mutation payload
 */
export function mapType2ActualFormToDb(followupResults: FollowupProductItem[]) {
  return followupResults.map((item) => ({
    storeId: item.storeId || null,
    productId: item.productId,
    productName: item.productName || null,
    usageResult: item.usageResult || null,
    followupDetail: item.followupDetail || null,
    problemDetail: item.problemDetail || null,
    isAdditional: Boolean(item.isAdditional),
  }));
}
