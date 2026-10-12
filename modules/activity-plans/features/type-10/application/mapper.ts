import type { ImageFile } from "@/modules/activity-plans/features/shared/actual-view/types";
import type {
  Type10TargetItem,
  Type10SoldProductItem,
  Type10ActualRecord,
} from "../types";

/**
 * Pure helper to convert attachment entity to UI ImageFile
 */
function toImage(att: any): ImageFile {
  return {
    id: att.id,
    url: att.fileUrl,
    name: att.fileName || "รูปภาพ Field Day",
    size: att.fileSize ?? undefined,
    type: att.fileType ?? undefined,
  };
}

/**
 * Extracts Type 10 (จัดงาน Field Day) Plan Targets from Activity Plan.
 * Supports multiple plot targets or single fallback.
 */
export function extractType10PlanTargets(
  plan: any,
  prevTarget?: Partial<Type10TargetItem>,
): {
  primary: Type10TargetItem;
  list: Type10TargetItem[];
} {
  const visits = (plan.demoPlotVisits || []).filter(
    (v: any) => v.workTypeCode === "TYPE_10" || !v.workTypeCode,
  );

  const products = (plan.products || []).filter(
    (pr: any) => pr.workTypeCode === "TYPE_10",
  );

  const defaultShowcase =
    products[0]?.productName ||
    products[0]?.product?.name ||
    prevTarget?.showcase ||
    "";

  const targetAttendeesStr = plan.targetAttendeesCount
    ? `${plan.targetAttendeesCount} คน`
    : prevTarget?.targetAttendees || "";

  const targetSalesStr = plan.targetBookingSales
    ? `฿${Number(plan.targetBookingSales).toLocaleString()}`
    : prevTarget?.targetSales || "";

  const list: Type10TargetItem[] = [];

  if (visits.length > 0) {
    for (const v of visits) {
      const plot = v.demoPlot || plan.demoPlot;
      const plotName = plot?.ownerName
        ? `${plot.ownerName}${plot.name ? ` (${plot.name})` : ""}`
        : plot?.name || "";

      const location =
        plot?.location || plan.location || prevTarget?.location || "";

      const showcase =
        plot?.primaryProductName ||
        plot?.showcase ||
        defaultShowcase;

      const crop = plot?.targetCrop || plot?.cropName || prevTarget?.crop || "";

      list.push({
        id: v.id || plot?.id,
        demoPlotId: v.demoPlotId || plot?.id || null,
        plot: plotName,
        location,
        showcase,
        crop,
        targetAttendees: targetAttendeesStr,
        targetSales: targetSalesStr,
      });
    }
  } else if (plan.demoPlot) {
    const plot = plan.demoPlot;
    const plotName = plot.ownerName
      ? `${plot.ownerName}${plot.name ? ` (${plot.name})` : ""}`
      : plot.name || "";

    const location =
      plot.location || plan.location || prevTarget?.location || "";

    const showcase =
      plot.primaryProductName ||
      plot.showcase ||
      defaultShowcase;

    const crop = plot.targetCrop || plot.cropName || prevTarget?.crop || "";

    list.push({
      demoPlotId: plot.id || null,
      plot: plotName,
      location,
      showcase,
      crop,
      targetAttendees: targetAttendeesStr,
      targetSales: targetSalesStr,
    });
  } else {
    list.push({
      plot: prevTarget?.plot || "",
      location: plan.location || prevTarget?.location || "",
      showcase: defaultShowcase || prevTarget?.showcase || "",
      crop: prevTarget?.crop || "",
      targetAttendees: targetAttendeesStr,
      targetSales: targetSalesStr,
    });
  }

  const primary: Type10TargetItem = list[0] || {
    plot: prevTarget?.plot || "",
    location: plan.location || prevTarget?.location || "",
    showcase: defaultShowcase || prevTarget?.showcase || "",
    crop: prevTarget?.crop || "",
    targetAttendees: targetAttendeesStr,
    targetSales: targetSalesStr,
  };

  return { primary, list };
}

/**
 * Pure parser for Type 10 Actual Outcome Data
 */
export function parseType10ActualResult(resData: any): Partial<
  Type10ActualRecord & {
    t10ActualAttendees?: string;
    t10ActualSalesOrBooking?: string;
    t10FarmerFeedback?: "สูง" | "กลาง" | "ต่ำ" | "";
    t10TargetFarmersList?: string;
    t10ProductSalesDetails?: Type10SoldProductItem[];
    t10SoldProducts?: Type10SoldProductItem[];
    t10Images?: ImageFile[];
  }
> {
  const parsed: Partial<
    Type10ActualRecord & {
      t10ActualAttendees?: string;
      t10ActualSalesOrBooking?: string;
      t10FarmerFeedback?: "สูง" | "กลาง" | "ต่ำ" | "";
      t10TargetFarmersList?: string;
      t10ProductSalesDetails?: Type10SoldProductItem[];
      t10SoldProducts?: Type10SoldProductItem[];
      t10Images?: ImageFile[];
    }
  > = {};

  if (!resData) return parsed;

  // 1. Direct collections from normalized relations (saleResults)
  if (Array.isArray(resData.saleResults) && resData.saleResults.length > 0) {
    const t10Sales = resData.saleResults.filter(
      (s: any) => s.workTypeCode === "TYPE_10",
    );
    if (t10Sales.length > 0) {
      const details: Type10SoldProductItem[] = t10Sales.map((s: any) => ({
        id: s.id,
        productId: s.productId || undefined,
        productName: s.productName || s.product?.name || "",
        productCode: s.product?.productCode || undefined,
        quantity: String(s.actualQuantity ?? ""),
        actualQty: String(s.actualQuantity ?? ""),
        unitPrice: Number(s.actualUnitPrice || 0),
        actualSales: String(s.actualTotal ?? ""),
        remarks: s.unclosedReason || "",
        isCustom: !s.productId,
        isCustomProduct: !s.productId,
      }));
      parsed.productSalesDetails = details;
      parsed.soldProducts = details;
      parsed.t10ProductSalesDetails = details;
      parsed.t10SoldProducts = details;
    }
  }

  // 2. Attachments
  if (Array.isArray(resData.attachments) && resData.attachments.length > 0) {
    const t10Att = resData.attachments.filter(
      (a: any) => a.workTypeCode === "TYPE_10",
    );
    if (t10Att.length > 0) {
      const imgs = t10Att.map(toImage);
      parsed.images = imgs;
      parsed.t10Images = imgs;
    }
  }

  // 3. Header fields
  if (resData.actualAttendeesCount != null && Number(resData.actualAttendeesCount) > 0) {
    const attendees = String(resData.actualAttendeesCount);
    parsed.actualAttendees = attendees;
    parsed.t10ActualAttendees = attendees;
  }
  if (resData.salesResultAmount != null && Number(resData.salesResultAmount) > 0) {
    const sales = String(Number(resData.salesResultAmount));
    parsed.actualSalesOrBooking = sales;
    parsed.t10ActualSalesOrBooking = sales;
  }

  // 4. Regex fallback from resultSummary text
  const summaryText = resData.resultSummary || "";
  if (summaryText && typeof summaryText === "string") {
    const t10AttendeesMatch = summaryText.match(
      /จำนวนผู้เข้าร่วม Field Day จริง:\s*(.+)/,
    );
    if (t10AttendeesMatch && t10AttendeesMatch[1] && !parsed.t10ActualAttendees) {
      const att = t10AttendeesMatch[1].split("\n")[0].trim();
      parsed.t10ActualAttendees = att;
      parsed.actualAttendees = att;
    }

    const t10SalesMatch = summaryText.match(
      /ยอดขายหรือยอดจอง Field Day จริง:\s*(.+)/,
    );
    if (t10SalesMatch && t10SalesMatch[1] && !parsed.t10ActualSalesOrBooking) {
      const sales = t10SalesMatch[1].split("\n")[0].trim();
      parsed.t10ActualSalesOrBooking = sales;
      parsed.actualSalesOrBooking = sales;
    }

    const t10FeedbackMatch = summaryText.match(/ความสนใจเกษตรกร:\s*(.+)/);
    if (t10FeedbackMatch && t10FeedbackMatch[1]) {
      const fb = t10FeedbackMatch[1].split("\n")[0].trim() as any;
      parsed.farmerFeedback = fb;
      parsed.t10FarmerFeedback = fb;
    }

    const t10FarmersMatch = summaryText.match(
      /รายชื่อเกษตรกรเป้าหมาย:\s*(.+)/,
    );
    if (t10FarmersMatch && t10FarmersMatch[1]) {
      const list = t10FarmersMatch[1].split("\n")[0].trim();
      parsed.targetFarmersList = list;
      parsed.t10TargetFarmersList = list;
    }

    const t10ProductsMatch = summaryText.match(
      /(?:ยอดขายแยกสินค้า Field Day|t10ProductSalesDetails):\s*(\[.+\])/,
    );
    if (
      t10ProductsMatch &&
      t10ProductsMatch[1] &&
      (!parsed.t10ProductSalesDetails || parsed.t10ProductSalesDetails.length === 0)
    ) {
      try {
        const trimmed = t10ProductsMatch[1].trim();
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
          const json = JSON.parse(trimmed);
          if (Array.isArray(json) && json.length > 0) {
            const mapped = json.map((item: any, idx: number) => {
              const isCustom = Boolean(
                item.isCustomProduct || item.isCustom || !item.productId,
              );
              return {
                id: item.id || `item-${idx + 1}`,
                productId: isCustom ? undefined : item.productId,
                productName: item.productName || item.customProductName || "",
                productCode: isCustom ? undefined : item.productCode,
                quantity: String(item.quantity ?? item.actualQty ?? ""),
                actualQty: String(item.quantity ?? item.actualQty ?? ""),
                actualSales: String(item.actualSales ?? ""),
                remarks:
                  item.remarks || item.notes || item.unclosedReason || "",
                isCustom,
                isCustomProduct: isCustom,
              };
            });
            parsed.t10ProductSalesDetails = mapped;
            parsed.productSalesDetails = mapped;
            parsed.soldProducts = mapped;
            parsed.t10SoldProducts = mapped;
          }
        }
      } catch (e) {
        console.error("Failed to parse t10ProductSalesDetails JSON:", e);
      }
    }

    const t10ImagesMatch = summaryText.match(
      /(?:รูปภาพบรรยากาศงาน Field Day|ภาพถ่ายบรรยากาศงาน Field Day|รูปภาพ Field Day|t10Images):\s*(\[.+\])/,
    );
    if (
      t10ImagesMatch &&
      t10ImagesMatch[1] &&
      (!parsed.t10Images || parsed.t10Images.length === 0)
    ) {
      try {
        const json = JSON.parse(t10ImagesMatch[1]);
        if (Array.isArray(json)) {
          parsed.t10Images = json;
          parsed.images = json;
        }
      } catch (e) {
        console.error("Failed to parse t10Images JSON:", e);
      }
    }
  }

  return parsed;
}

/**
 * Pure mapper for Type 10 Plan Detail View Section items
 */
export function mapType10ToSectionItems(
  plan: any,
  objectiveLines: string[] = [],
): {
  typeIndex: number;
  title: string;
  badge: string;
  items: any[];
  rawSummary?: string;
} | null {
  const t10Line = objectiveLines.find(
    (l) => l.includes("[Field Day") || l.includes("Field Day"),
  );

  const isType10 =
    plan.workTypes?.some(
      (wt: any) =>
        wt.activityType?.code === "TYPE_10" ||
        wt.workTypeCode === "TYPE_10",
    ) || Boolean(t10Line);

  if (!isType10) {
    return null;
  }

  const extraFields: Array<{ label: string; value: string }> = [];
  if (plan.targetAttendeesCount) {
    extraFields.push({
      label: "ผู้เข้าร่วมเป้าหมาย",
      value: `${plan.targetAttendeesCount} คน`,
    });
  }
  if (plan.targetBookingSales) {
    extraFields.push({
      label: "เป้ายอดจอง",
      value: `${Number(plan.targetBookingSales).toLocaleString()} บาท`,
    });
  }

  return {
    typeIndex: 10,
    title: "จัดงาน Field Day",
    badge: "Field Day",
    items: [
      {
        title: plan.location || "งาน Field Day",
        extraFields: extraFields.length > 0 ? extraFields : undefined,
      },
    ],
    rawSummary: t10Line ? t10Line.replace(/^\[.*?\]\s*/, "") : undefined,
  };
}
