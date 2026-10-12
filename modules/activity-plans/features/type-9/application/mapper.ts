import type { ImageFile } from "@/modules/activity-plans/features/shared/actual-view/types";
import type {
  Type9TargetItem,
  Type9TargetProductItem,
  Type9ProductSaleDetail,
  Type9ActualRecord,
} from "../types";

/**
 * Pure helper to convert attachment entity to UI ImageFile
 */
function toImage(att: any): ImageFile {
  return {
    id: att.id,
    url: att.fileUrl,
    name: att.fileName || "รูปภาพหน้าร้าน",
    size: att.fileSize ?? undefined,
    type: att.fileType ?? undefined,
  };
}

/**
 * Extracts Type 9 (จัดกิจกรรมส่งเสริมการขายหน้าร้าน) Plan Targets from Activity Plan.
 * Supports single target fallback and multiple store targets.
 */
export function extractType9PlanTargets(
  plan: any,
  prevTarget?: Partial<Type9TargetItem>,
): {
  primary: Type9TargetItem;
  list: Type9TargetItem[];
} {
  const stores = (plan.stores || []).filter(
    (s: any) => s.workTypeCode === "TYPE_9",
  );
  const products = (plan.products || []).filter(
    (pr: any) => pr.workTypeCode === "TYPE_9",
  );

  const allItems: Type9TargetProductItem[] = products.map((pr: any, idx: number) => {
    const qty = pr.targetQuantity != null ? Number(pr.targetQuantity) : 0;
    const price = pr.unitPrice != null ? Number(pr.unitPrice) : 0;
    const totalAmount =
      pr.targetAmount != null
        ? Number(pr.targetAmount)
        : qty * price;

    return {
      id: pr.id || String(idx + 1),
      productId: pr.productId,
      storeId: pr.storeId || stores[0]?.storeId || null,
      productName: pr.productName || pr.product?.name || "",
      quantityCases: qty,
      pricePerCase: price,
      totalAmount,
    };
  });

  const totalProductSales = allItems.reduce(
    (sum, item) => sum + (item.totalAmount || 0),
    0,
  );

  const targetAttendeesStr = plan.targetAttendeesCount
    ? `${plan.targetAttendeesCount} คน`
    : prevTarget?.targetAttendees || "";

  const list: Type9TargetItem[] = [];

  if (stores.length > 0) {
    for (const s of stores) {
      const storeName = s.store?.name || s.storeName || "";
      const isSubDealer = Boolean(s.subDealerStore);
      const subDealerStore = s.subDealerStore || "";
      const storeItems =
        stores.length === 1
          ? allItems
          : allItems.filter(
              (it) => it.storeId === s.storeId || (!it.storeId && s.storeId),
            );

      const storeSales =
        storeItems.length > 0
          ? storeItems.reduce((sum, it) => sum + (it.totalAmount || 0), 0)
          : s.targetAmount != null
            ? Number(s.targetAmount)
            : 0;

      const productSummary = storeItems
        .map((p) => `${p.productName} (${p.quantityCases || 0} ลัง)`)
        .filter(Boolean)
        .join(", ");

      list.push({
        id: s.id,
        storeId: s.storeId || null,
        store: storeName,
        isSubDealer,
        subDealerStore,
        province: s.province || "",
        product: productSummary,
        targetSales:
          storeSales > 0 ? `${storeSales.toLocaleString()} บาท` : "",
        targetAttendees: targetAttendeesStr,
        items: storeItems,
      });
    }
  } else {
    // No explicit store records, build fallback from products/header
    const fallbackSales =
      totalProductSales > 0
        ? `${totalProductSales.toLocaleString()} บาท`
        : prevTarget?.targetSales || "";

    const fallbackProductSummary = allItems
      .map((p) => `${p.productName} (${p.quantityCases || 0} ลัง)`)
      .filter(Boolean)
      .join(", ");

    list.push({
      store: prevTarget?.store || "",
      isSubDealer: prevTarget?.isSubDealer || false,
      subDealerStore: prevTarget?.subDealerStore || "",
      product: fallbackProductSummary || prevTarget?.product || "",
      targetSales: fallbackSales,
      targetAttendees: targetAttendeesStr,
      items: allItems,
    });
  }

  const primary: Type9TargetItem = list[0] || {
    store: prevTarget?.store || "",
    isSubDealer: prevTarget?.isSubDealer || false,
    subDealerStore: prevTarget?.subDealerStore || "",
    product: prevTarget?.product || "",
    targetSales: prevTarget?.targetSales || "",
    targetAttendees: targetAttendeesStr,
    items: allItems,
  };

  return { primary, list };
}

/**
 * Pure parser for Type 9 Actual Outcome Data
 */
export function parseType9ActualResult(resData: any): Partial<
  Type9ActualRecord & {
    t9ActualSales?: string;
    t9ActualAttendees?: string;
    t9ProductSalesDetails?: Type9ProductSaleDetail[];
    t9Images?: ImageFile[];
  }
> {
  const parsed: Partial<
    Type9ActualRecord & {
      t9ActualSales?: string;
      t9ActualAttendees?: string;
      t9ProductSalesDetails?: Type9ProductSaleDetail[];
      t9Images?: ImageFile[];
    }
  > = {};

  if (!resData) return parsed;

  // 1. Direct collections from normalized relations (saleResults)
  if (Array.isArray(resData.saleResults) && resData.saleResults.length > 0) {
    const t9Sales = resData.saleResults.filter(
      (s: any) => s.workTypeCode === "TYPE_9",
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
      if (totalSales > 0) {
        parsed.actualSales = String(totalSales);
        parsed.t9ActualSales = String(totalSales);
      }
    }
  }

  // 2. Attachments
  if (Array.isArray(resData.attachments) && resData.attachments.length > 0) {
    const t9Att = resData.attachments.filter(
      (a: any) => a.workTypeCode === "TYPE_9",
    );
    if (t9Att.length > 0) {
      const imgs = t9Att.map(toImage);
      parsed.images = imgs;
      parsed.t9Images = imgs;
    }
  }

  // 3. Header fields
  if (resData.actualAttendeesCount != null) {
    const attendees = String(resData.actualAttendeesCount);
    parsed.actualAttendees = attendees;
    parsed.t9ActualAttendees = attendees;
  }
  if (resData.salesResultAmount != null && !parsed.actualSales) {
    const sales = String(resData.salesResultAmount);
    parsed.actualSales = sales;
    parsed.t9ActualSales = sales;
  }

  // 4. Regex fallback from resultSummary text
  const summaryText = resData.resultSummary || "";
  if (summaryText && typeof summaryText === "string") {
    const t9SalesMatch = summaryText.match(/ยอดขายหน้าร้านจริง:\s*(.+)/);
    if (t9SalesMatch && t9SalesMatch[1] && !parsed.t9ActualSales) {
      const sales = t9SalesMatch[1].split("\n")[0].trim();
      parsed.t9ActualSales = sales;
      parsed.actualSales = sales;
    }

    const t9ProductsMatch = summaryText.match(
      /(?:ยอดขายแยกสินค้าหน้าร้าน|t9ProductSalesDetails):\s*(\[.+\])/,
    );
    if (
      t9ProductsMatch &&
      t9ProductsMatch[1] &&
      (!parsed.t9ProductSalesDetails || parsed.t9ProductSalesDetails.length === 0)
    ) {
      try {
        const json = JSON.parse(t9ProductsMatch[1].trim());
        if (Array.isArray(json)) {
          parsed.t9ProductSalesDetails = json;
          parsed.productSalesDetails = json;
        }
      } catch (e) {
        console.error("Failed to parse t9ProductSalesDetails JSON:", e);
      }
    }

    const t9AttendeesMatch = summaryText.match(
      /(?:เกษตรกรที่เข้าร่วมจริง|ผู้เข้าร่วมหน้าร้านจริง|t9ActualAttendees):\s*(.+)/,
    );
    if (t9AttendeesMatch && t9AttendeesMatch[1] && !parsed.t9ActualAttendees) {
      const att = t9AttendeesMatch[1].split("\n")[0].trim();
      parsed.t9ActualAttendees = att;
      parsed.actualAttendees = att;
    }

    const t9ImagesMatch = summaryText.match(
      /(?:รูปภาพกิจกรรมส่งเสริมการขายหน้าร้าน|ภาพถ่ายกิจกรรมส่งเสริมการขายหน้าร้าน|รูปภาพหน้าร้าน|t9Images):\s*(\[.+\])/,
    );
    if (
      t9ImagesMatch &&
      t9ImagesMatch[1] &&
      (!parsed.t9Images || parsed.t9Images.length === 0)
    ) {
      try {
        const json = JSON.parse(t9ImagesMatch[1].trim());
        if (Array.isArray(json)) {
          parsed.t9Images = json;
          parsed.images = json;
        }
      } catch (e) {
        console.error("Failed to parse t9Images JSON:", e);
      }
    }
  }

  return parsed;
}

/**
 * Pure mapper for Type 9 Plan Detail View Section items
 */
export function mapType9ToSectionItems(
  type9Stores: any[],
  type9Products: any[],
  objectiveLines: string[] = [],
): {
  typeIndex: number;
  title: string;
  badge: string;
  items: any[];
  rawSummary?: string;
} | null {
  const t9Line = objectiveLines.find(
    (l) => l.includes("[กิจกรรมหน้าร้าน") || l.includes("กิจกรรมหน้าร้าน"),
  );

  if (type9Stores.length === 0 && type9Products.length === 0 && !t9Line) {
    return null;
  }

  const list = type9Products.map((pr: any) => ({
    title: pr.productName || "สินค้า",
    subtitle: type9Stores[0]?.storeName
      ? `ร้านค้า: ${type9Stores[0].storeName}`
      : undefined,
    extraFields: [
      ...(pr.targetQuantity != null
        ? [{ label: "จำนวน", value: `${pr.targetQuantity} ลัง` }]
        : []),
      ...(pr.targetAmount != null
        ? [
            {
              label: "ยอดขายเป้าหมาย",
              value: `${Number(pr.targetAmount).toLocaleString()} บาท`,
            },
          ]
        : []),
    ],
  }));

  return {
    typeIndex: 9,
    title: "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
    badge: "กิจกรรมหน้าร้าน",
    items: list,
    rawSummary: t9Line ? t9Line.replace(/^\[.*?\]\s*/, "") : undefined,
  };
}
