import type { Type5SurveyRecord } from "../types/actual.types";
import type { Type5ImageFile } from "../../shared/types";

/**
 * Parse Type 5 Actual Results from raw backend ActivityResult payload
 */
export function parseType5ActualResult(resData: any): {
  t5SurveyDetails?: Type5SurveyRecord[];
  t5CompetitorBrand?: string;
  t5CompetitorProduct?: string;
  t5CompetitorPrice?: string;
  t5CompetitorUnit?: string;
  t5PromotionDetail?: string;
} {
  const result: {
    t5SurveyDetails?: Type5SurveyRecord[];
    t5CompetitorBrand?: string;
    t5CompetitorProduct?: string;
    t5CompetitorPrice?: string;
    t5CompetitorUnit?: string;
    t5PromotionDetail?: string;
  } = {};

  if (!resData) return result;

  const allAttachments: any[] =
    Array.isArray(resData.attachments) && resData.attachments.length > 0
      ? resData.attachments
      : Array.isArray(resData.result?.attachments)
        ? resData.result.attachments
        : Array.isArray(resData.activityPlan?.attachments)
          ? resData.activityPlan.attachments
          : [];

  const rawSurveyResults: any[] =
    Array.isArray(resData.type5Results) && resData.type5Results.length > 0
      ? resData.type5Results
      : Array.isArray(resData.result?.type5Results) &&
          resData.result.type5Results.length > 0
        ? resData.result.type5Results
        : Array.isArray(resData.activityPlan?.type5Results) &&
            resData.activityPlan.type5Results.length > 0
          ? resData.activityPlan.type5Results
          : Array.isArray(resData.surveyResults) && resData.surveyResults.length > 0
            ? resData.surveyResults
            : Array.isArray(resData.result?.surveyResults) &&
                resData.result.surveyResults.length > 0
              ? resData.result.surveyResults
              : Array.isArray(resData.activityPlan?.result?.surveyResults) &&
                  resData.activityPlan.result.surveyResults.length > 0
                ? resData.activityPlan.result.surveyResults
                : Array.isArray(resData.t5SurveyDetails) &&
                    resData.t5SurveyDetails.length > 0
                  ? resData.t5SurveyDetails
                  : [];

  // 1. Direct from surveyResults or type5Results relation
  if (rawSurveyResults.length > 0) {
    result.t5SurveyDetails = rawSurveyResults.map((sv: any) => {
      let itemAttachments =
        Array.isArray(sv.attachments) && sv.attachments.length > 0
          ? sv.attachments
          : allAttachments.filter(
              (att: any) =>
                att.type5ResultId === sv.id || att.surveyItemId === sv.id,
            );

      if (itemAttachments.length === 0) {
        itemAttachments = allAttachments.filter((att: any) => {
          const isSurveyCat =
            att.category === "SURVEY_BOTTLE" ||
            att.category === "SURVEY_PROMO_MATERIAL" ||
            att.category === "BOTTLE" ||
            att.category === "bottle" ||
            att.category === "PROMOTION" ||
            att.category === "promo";
          if (!isSurveyCat) return false;
          if (
            (att.type5ResultId && att.type5ResultId === sv.id) ||
            (att.surveyItemId && att.surveyItemId === sv.id)
          ) {
            return true;
          }
          if (
            (att.type5ResultId && att.type5ResultId !== sv.id) ||
            (att.surveyItemId && att.surveyItemId !== sv.id)
          ) {
            return false;
          }
          if (rawSurveyResults.length === 1) return true;
          return (
            (att.storeId && att.storeId === sv.storeId) ||
            (att.productId && att.productId === sv.productId)
          );
        });
      }

      const bottleImages: Type5ImageFile[] = itemAttachments
        .filter(
          (att: any) =>
            att.category === "SURVEY_BOTTLE" ||
            att.category === "BOTTLE" ||
            att.category === "bottle",
        )
        .map((att: any) => ({
          id: att.id,
          url: att.fileUrl || att.url,
          name: att.fileName || att.name || "ภาพขวดสินค้า",
          size: att.fileSize || att.size || undefined,
          type: att.mimeType || att.type || undefined,
          category: att.category,
          surveyItemId: sv.id,
        }));

      const promotionalImages: Type5ImageFile[] = itemAttachments
        .filter(
          (att: any) =>
            att.category === "SURVEY_PROMO_MATERIAL" ||
            att.category === "PROMOTION" ||
            att.category === "promo",
        )
        .map((att: any) => ({
          id: att.id,
          url: att.fileUrl || att.url,
          name: att.fileName || att.name || "ภาพสื่อส่งเสริมการขาย",
          size: att.fileSize || att.size || undefined,
          type: att.mimeType || att.type || undefined,
          category: att.category,
          surveyItemId: sv.id,
        }));

      return {
        id: sv.id,
        targetId: sv.targetId || undefined,
        storeId: sv.storeId,
        store: sv.store?.shopName || sv.store?.name || sv.storeName || sv.store || "",
        productId: sv.productId,
        product: sv.product?.name || sv.productName || sv.product || "",
        competitorBrand: sv.competitorBrand || "",
        competitorProduct: sv.competitorProduct || "",
        posPrice: sv.posPrice != null ? String(sv.posPrice) : "",
        dealerPrice: sv.dealerPrice != null ? String(sv.dealerPrice) : "",
        subdealerPrice:
          sv.subdealerPrice != null ? String(sv.subdealerPrice) : "",
        farmerPrice: sv.farmerPrice != null ? String(sv.farmerPrice) : "",
        sellingPoints: sv.sellingPoints || "",
        bottleImages,
        promotionalImages,
        competitorPrice:
          sv.competitorPrice != null ? String(sv.competitorPrice) : "",
        competitorUnit: sv.competitorUnit || "",
        promotionDetail: sv.promotionDetail || "",
      };
    });

    if (result.t5SurveyDetails && result.t5SurveyDetails.length > 0) {
      const first = result.t5SurveyDetails[0];
      if (!result.t5CompetitorBrand) result.t5CompetitorBrand = first.competitorBrand || "";
      if (!result.t5CompetitorProduct) result.t5CompetitorProduct = first.competitorProduct || "";
      if (!result.t5CompetitorPrice) result.t5CompetitorPrice = first.competitorPrice || "";
      if (!result.t5CompetitorUnit) result.t5CompetitorUnit = first.competitorUnit || "";
      if (!result.t5PromotionDetail) result.t5PromotionDetail = first.promotionDetail || "";
    }
  }

  // 2. Fallback: Parse from actualSummary text
  const summaryText = resData.actualSummary || "";
  if (summaryText) {
    const compBrandMatch = summaryText.match(/แบรนด์คู่แข่ง:\s*(.+)/);
    if (compBrandMatch && compBrandMatch[1]) {
      result.t5CompetitorBrand = compBrandMatch[1].split("\n")[0].trim();
    }
    const compProdMatch = summaryText.match(/สินค้าคู่แข่ง:\s*(.+)/);
    if (compProdMatch && compProdMatch[1]) {
      result.t5CompetitorProduct = compProdMatch[1].split("\n")[0].trim();
    }
    const compPriceMatch = summaryText.match(/ราคาคู่แข่ง:\s*(.+)/);
    if (compPriceMatch && compPriceMatch[1]) {
      result.t5CompetitorPrice = compPriceMatch[1].split("\n")[0].trim();
    }
    const compUnitMatch = summaryText.match(/หน่วยสินค้าคู่แข่ง:\s*(.+)/);
    if (compUnitMatch && compUnitMatch[1]) {
      result.t5CompetitorUnit = compUnitMatch[1].split("\n")[0].trim();
    }
    const promoMatch = summaryText.match(/โปรโมชั่นคู่แข่ง:\s*(.+)/);
    if (promoMatch && promoMatch[1]) {
      result.t5PromotionDetail = promoMatch[1].split("\n")[0].trim();
    }
  }

  return result;
}
