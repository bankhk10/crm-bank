import type {
  Type8TargetItem,
  Type8ActualRecord,
  ProductSaleDetail,
  Type8PromotionalProductLine,
} from "../types";
import { decodeType8StoreNotes } from "../shared/type8-notes";

/**
 * Extract Type 8 targets from an ActivityPlan (supporting Multi-Target Meetings)
 */
export function extractType8PlanTargets(
  plan: any,
  prevTarget?: Type8TargetItem,
): {
  primary: Type8TargetItem;
  list: Type8TargetItem[];
} {
  const fallbackItem: Type8TargetItem = {
    topic: "",
    products: "",
    targetAttendees: "",
    customer: "",
    dealerName: "",
    subDealerStore: "",
    detail: "",
    targetProducts: [],
    targetProductItems: [],
    promotionalProducts: [],
    items: [],
    ...prevTarget,
  };

  const rawStores: any[] = plan?.stores || plan?.planStores || [];
  const rawProducts: any[] = plan?.products || plan?.planProducts || [];

  const t8Stores = rawStores.filter(
    (s: any) =>
      s.workTypeCode === "TYPE_8" ||
      s.workTypeCode === "จัดประชุม" ||
      s.workTypeCode === "จัดประชุมการเกษตร" ||
      s.workTypeCode === "จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์",
  );

  const t8Products = rawProducts.filter(
    (pr: any) => pr.workTypeCode === "TYPE_8",
  );
  const t8PromoProducts = rawProducts.filter(
    (pr: any) => pr.workTypeCode === "TYPE_8_PROMOTION",
  );

  const targetProductNames = t8Products
    .map((pr: any) => pr.productName || pr.product?.name)
    .filter(Boolean) as string[];

  const targetProductItems = t8Products.map((pr: any, idx: number) => ({
    id: pr.id || `t8-prod-${idx}`,
    productId: pr.productId || pr.product?.id,
    productName: pr.productName || pr.product?.name || "",
  }));

  const attendeesDisplay =
    plan?.targetAttendeesCount != null && Number(plan.targetAttendeesCount) > 0
      ? `${plan.targetAttendeesCount} คน`
      : "";

  if (t8Stores.length > 0) {
    const list: Type8TargetItem[] = t8Stores.map((s: any, idx: number) => {
      const decodedStoreNotes = decodeType8StoreNotes(s.notes);
      const storeName = s.storeName || s.store?.name || "";
      const storeDisplay = s.subDealerStore
        ? `${s.subDealerStore} (Dealer: ${storeName || "-"})`
        : storeName;

      const promotionalProducts: Type8PromotionalProductLine[] =
        decodedStoreNotes.promotions.length > 0
          ? decodedStoreNotes.promotions.map((p, pIdx) => ({
              id: `promo-${idx}-${pIdx + 1}`,
              productId: "",
              productName: "",
              quantity: 1,
              quantityCases: 1,
              unitPrice: 0,
              pricePerCase: 0,
              totalAmount: 0,
              notes: p,
              storeId: s.storeId || null,
            }))
          : t8PromoProducts.map((pr: any) => ({
              id: pr.id,
              productId: pr.productId || pr.product?.id,
              productName:
                pr.productName || pr.product?.name || "สินค้าโปรโมชัน",
              quantity: pr.targetQuantity ?? 1,
              quantityCases: pr.targetQuantity ?? 1,
              unitPrice: pr.unitPrice ? Number(pr.unitPrice) : 0,
              pricePerCase: pr.unitPrice ? Number(pr.unitPrice) : 0,
              totalAmount: pr.targetAmount ? Number(pr.targetAmount) : 0,
              notes: pr.notes || "",
              storeId: pr.storeId || s.storeId || null,
            }));

      const topic = s.remarks || plan?.objective || "";
      const detail =
        decodedStoreNotes.detail || s.notes || plan?.description || "";

      return {
        id: s.id || `t8-target-${idx}`,
        storeId: s.storeId || s.store?.id,
        topic,
        customer: storeDisplay,
        dealerName: storeName,
        subDealerStore: s.subDealerStore || "",
        detail,
        targetProducts: targetProductNames,
        targetProductItems,
        products: targetProductNames.join(", "),
        promotionalProducts,
        targetAttendees: attendeesDisplay,
        items: targetProductItems.map((tp) => ({
          productName: tp.productName,
          targetQty: "-",
        })),
      };
    });

    const primaryTarget: Type8TargetItem = {
      ...list[0],
      items: list.flatMap((l) => l.items || []),
    };

    return {
      primary: primaryTarget,
      list,
    };
  }

  // Fallback: If no dedicated stores but TYPE_8 products or attendees exist
  if (t8Products.length > 0 || t8PromoProducts.length > 0 || attendeesDisplay) {
    const promotionalProducts: Type8PromotionalProductLine[] = t8PromoProducts.map(
      (pr: any) => ({
        id: pr.id,
        productId: pr.productId || pr.product?.id,
        productName:
          pr.productName || pr.product?.name || "สินค้าโปรโมชัน",
        quantity: pr.targetQuantity ?? 1,
        quantityCases: pr.targetQuantity ?? 1,
        unitPrice: pr.unitPrice ? Number(pr.unitPrice) : 0,
        pricePerCase: pr.unitPrice ? Number(pr.unitPrice) : 0,
        totalAmount: pr.targetAmount ? Number(pr.targetAmount) : 0,
        notes: pr.notes || "",
        storeId: pr.storeId || null,
      }),
    );

    const fallbackTarget: Type8TargetItem = {
      id: "t8-target-fallback",
      topic: plan?.objective || "",
      customer: plan?.location || "",
      dealerName: "",
      subDealerStore: "",
      detail: plan?.description || "",
      targetProducts: targetProductNames,
      targetProductItems,
      products: targetProductNames.join(", "),
      promotionalProducts,
      targetAttendees: attendeesDisplay,
      items: targetProductItems.map((tp) => ({
        productName: tp.productName,
        targetQty: "-",
      })),
    };

    return {
      primary: fallbackTarget,
      list: [fallbackTarget],
    };
  }

  return {
    primary: fallbackItem,
    list: [],
  };
}

/**
 * Parse Type 8 Actual Results from raw backend ActivityResult payload
 */
export function parseType8ActualResult(resData: any): Partial<Type8ActualRecord> {
  const result: Partial<Type8ActualRecord> = {};
  if (!resData) return result;

  const summaryText = resData.resultSummary || "";

  // 1. Direct fields from ActivityResult
  if (resData.actualAttendeesCount != null) {
    const num = Number(resData.actualAttendeesCount);
    if (!isNaN(num)) {
      result.t8ActualAttendees = String(num);
    }
  }

  // 2. Structured Sale Results
  if (Array.isArray(resData.saleResults) && resData.saleResults.length > 0) {
    const t8Sales = resData.saleResults.filter(
      (s: any) =>
        s.workTypeCode === "TYPE_8_PROMOTION" || s.workTypeCode === "TYPE_8",
    );
    if (t8Sales.length > 0) {
      result.t8ProductSalesDetails = t8Sales.map((s: any) => ({
        id: s.id,
        productId: s.productId,
        productName: s.productName || s.product?.name || "",
        actualQty: String(s.actualQuantity ?? ""),
        notes: s.unclosedReason || s.notes || "",
        isAdditional: Boolean(s.isAdditional),
      }));
    }
  }

  // 3. Text Parsing from summaryText
  const t8AttendeesMatch = summaryText.match(
    /จำนวนผู้เข้าร่วมประชุมจริง:\s*(.+)/,
  );
  if (t8AttendeesMatch && t8AttendeesMatch[1] && !result.t8ActualAttendees) {
    result.t8ActualAttendees = t8AttendeesMatch[1].split("\n")[0].trim();
  }

  const qnaMatch = summaryText.match(/Q&A:\s*(.+)/);
  if (qnaMatch && qnaMatch[1]) {
    result.t8FeedbackQnA = qnaMatch[1].split("\n")[0].trim();
  }

  const t8SalesMatch = summaryText.match(
    /(?:ยอดขายแยกสินค้าประชุม|t8ProductSalesDetails):\s*(\[.+\])/,
  );
  if (t8SalesMatch && t8SalesMatch[1] && !result.t8ProductSalesDetails) {
    try {
      const trimmed = t8SalesMatch[1].trim();
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          result.t8ProductSalesDetails = parsed;
        }
      }
    } catch {
      // ignore
    }
  }

  const t8ImagesMatch = summaryText.match(
    /(?:รูปภาพบรรยากาศการประชุม|ภาพถ่ายบรรยากาศการประชุม|รูปภาพการประชุม|t8Images):\s*(\[.+\])/,
  );
  if (t8ImagesMatch && t8ImagesMatch[1]) {
    try {
      const parsed = JSON.parse(t8ImagesMatch[1]);
      if (Array.isArray(parsed)) result.t8Images = parsed;
    } catch {
      // ignore
    }
  }

  const t8RegMatch = summaryText.match(
    /(?:รูปใบลงทะเบียนผู้เข้าร่วมงาน|ภาพใบลงทะเบียน|รูปใบลงทะเบียน|t8RegistrationImages):\s*(\[.+\])/,
  );
  if (t8RegMatch && t8RegMatch[1]) {
    try {
      const parsed = JSON.parse(t8RegMatch[1]);
      if (Array.isArray(parsed)) result.t8RegistrationImages = parsed;
    } catch {
      // ignore
    }
  }

  return result;
}

/**
 * Format Type 8 Meeting details for detail view section display
 */
export function mapType8ToSectionItems(
  stores: any[],
  products: any[] = [],
  targetAttendeesCount?: number | null,
): Array<{
  title: string;
  subtitle?: string;
  details?: string;
  extraFields?: Array<{ label: string; value: string }>;
}> {
  const type8Stores = (stores || []).filter(
    (s) =>
      s.workTypeCode === "TYPE_8" ||
      s.workTypeCode === "จัดประชุม" ||
      s.workTypeCode === "จัดประชุมการเกษตร",
  );

  const type8Products = (products || []).filter(
    (pr) => pr.workTypeCode === "TYPE_8",
  );
  const type8PromoProducts = (products || []).filter(
    (pr) => pr.workTypeCode === "TYPE_8_PROMOTION",
  );

  if (type8Stores.length > 0) {
    return type8Stores.map((s, idx) => {
      const storeName = s.storeName || s.store?.name || "";
      const storeDisplay = s.subDealerStore
        ? `${s.subDealerStore} (Dealer: ${storeName || "-"})`
        : storeName;
      const decodedNotes = decodeType8StoreNotes(s.notes);

      const title = s.remarks || `การประชุมเกษตรกร #${idx + 1}`;
      const subtitle = storeDisplay ? `สถานที่/ร้านค้า: ${storeDisplay}` : undefined;
      const details = decodedNotes.detail || s.notes || undefined;

      const extraFields: Array<{ label: string; value: string }> = [];

      if (targetAttendeesCount) {
        extraFields.push({
          label: "ผู้เข้าร่วมเป้าหมาย",
          value: `${targetAttendeesCount} คน`,
        });
      }

      if (type8Products.length > 0) {
        const prodNames = type8Products
          .map((p) => p.productName || p.product?.name)
          .filter(Boolean)
          .join(", ");
        if (prodNames) {
          extraFields.push({ label: "สินค้าเป้าหมาย", value: prodNames });
        }
      }

      if (decodedNotes.promotions.length > 0) {
        extraFields.push({
          label: "รายละเอียดโปรโมชัน",
          value: decodedNotes.promotions.join(", "),
        });
      } else if (type8PromoProducts.length > 0) {
        const promoNames = type8PromoProducts
          .map((p) => p.productName || p.product?.name)
          .filter(Boolean)
          .join(", ");
        if (promoNames) {
          extraFields.push({ label: "รายการสินค้าโปรโมชัน", value: promoNames });
        }
      }

      return {
        title,
        subtitle,
        details,
        extraFields: extraFields.length > 0 ? extraFields : undefined,
      };
    });
  }

  // Fallback if no stores but attendees or products
  if (type8Products.length > 0 || targetAttendeesCount) {
    const extraFields: Array<{ label: string; value: string }> = [];
    if (targetAttendeesCount) {
      extraFields.push({
        label: "ผู้เข้าร่วมเป้าหมาย",
        value: `${targetAttendeesCount} คน`,
      });
    }
    if (type8Products.length > 0) {
      const prodNames = type8Products
        .map((p) => p.productName || p.product?.name)
        .filter(Boolean)
        .join(", ");
      if (prodNames) {
        extraFields.push({ label: "สินค้าเป้าหมาย", value: prodNames });
      }
    }

    return [
      {
        title: "จัดประชุมเกษตรกร",
        extraFields: extraFields.length > 0 ? extraFields : undefined,
      },
    ];
  }

  return [];
}
