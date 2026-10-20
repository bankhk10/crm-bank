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

  const allAttachments: any[] = Array.isArray(resData.attachments)
    ? resData.attachments
    : [];

  // 1. Direct from surveyResults relation
  if (
    resData.surveyResults &&
    Array.isArray(resData.surveyResults) &&
    resData.surveyResults.length > 0
  ) {
    result.t5SurveyDetails = resData.surveyResults.map((sv: any) => {
      let itemAttachments =
        Array.isArray(sv.attachments) && sv.attachments.length > 0
          ? sv.attachments
          : allAttachments.filter((att: any) => att.surveyItemId === sv.id);

      if (itemAttachments.length === 0) {
        itemAttachments = allAttachments.filter((att: any) => {
          const isSurveyCat =
            att.category === "SURVEY_BOTTLE" ||
            att.category === "SURVEY_PROMO_MATERIAL";
          if (!isSurveyCat) return false;
          if (att.surveyItemId && att.surveyItemId !== sv.id) return false;
          if (resData.surveyResults.length === 1) return true;
          return (
            (att.storeId && att.storeId === sv.storeId) ||
            (att.productId && att.productId === sv.productId)
          );
        });
      }

      const bottleImages: Type5ImageFile[] = itemAttachments
        .filter((att: any) => att.category === "SURVEY_BOTTLE")
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
        .filter((att: any) => att.category === "SURVEY_PROMO_MATERIAL")
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
        storeId: sv.storeId,
        store: sv.store?.shopName || sv.store?.name || sv.storeName || "",
        productId: sv.productId,
        product: sv.product?.name || sv.productName || "",
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
