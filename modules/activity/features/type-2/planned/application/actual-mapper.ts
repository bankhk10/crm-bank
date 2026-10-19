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

  // 1. From dedicated relation result.followupResults or result.t2FollowupResults
  const rawFollowupList =
    result.followupResults || result.t2FollowupResults;

  if (rawFollowupList && Array.isArray(rawFollowupList) && rawFollowupList.length > 0) {
    const list: FollowupProductItem[] = rawFollowupList.map((item: any) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName || item.product?.name || "สินค้า",
      storeId: item.storeId,
      customer: item.store?.name || item.customerName || item.customer || "",
      usageResult: item.usageResult as any,
      followupDetail: item.followupDetail || "",
      problemDetail: item.problemDetail || "",
      isAdditional: Boolean(item.isAdditional),
    }));

    const primary = list[0];
    return {
      followupResults: list,
      customerName: primary?.customer || result.customerName || result.t2CustomerName,
      usageResult: primary?.usageResult || result.usageResult || result.t2UsageResult,
      followupDetail: primary?.followupDetail || result.followupDetail || result.t2FollowupDetail,
      problemDetail: primary?.problemDetail || result.problemDetail || result.t2ProblemDetail,
      detail: primary?.followupDetail || result.detail || result.t2Detail,
    };
  }

  // 2. From resultSummary JSON
  const rawSummary = typeof result === "string" ? result : result.resultSummary;
  if (rawSummary) {
    try {
      const parsed = typeof rawSummary === "string" ? JSON.parse(rawSummary) : rawSummary;
      const parsedList = parsed?.followupResults || parsed?.t2FollowupResults;
      if (parsedList && Array.isArray(parsedList) && parsedList.length > 0) {
        return {
          followupResults: parsedList,
          customerName: parsed.t2CustomerName || parsed.customerName,
          usageResult: parsed.t2UsageResult || parsed.usageResult,
          followupDetail: parsed.t2FollowupDetail || parsed.followupDetail,
          problemDetail: parsed.t2ProblemDetail || parsed.problemDetail,
          detail: parsed.t2Detail || parsed.detail,
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
