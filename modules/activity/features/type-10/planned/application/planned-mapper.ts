import type { Type10TargetItem } from "../types/planned.types";
import { decodeType10Notes } from "../../shared/notes";

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
  if (!plan) {
    const fallback: Type10TargetItem = {
      plot: prevTarget?.plot || "",
      location: prevTarget?.location || "",
      showcase: prevTarget?.showcase || "",
      crop: prevTarget?.crop || "",
      targetAttendees: prevTarget?.targetAttendees || "",
      targetSales: prevTarget?.targetSales || "",
    };
    return { primary: fallback, list: [fallback] };
  }

  const visits = (plan.demoPlotVisits || []).filter(
    (v: any) => v.workTypeCode === "TYPE_10" || !v.workTypeCode,
  );

  const products = (plan.products || plan.planProducts || []).filter(
    (pr: any) => pr.workTypeCode === "TYPE_10" || !pr.workTypeCode,
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
      id: plot.id,
      demoPlotId: plot.id || null,
      plot: plotName,
      location,
      showcase,
      crop,
      targetAttendees: targetAttendeesStr,
      targetSales: targetSalesStr,
    });
  } else if (plan.type10Targets && Array.isArray(plan.type10Targets) && plan.type10Targets.length > 0) {
    list.push(...plan.type10Targets);
  }

  const decoded = decodeType10Notes(plan.notes);

  const primary: Type10TargetItem =
    list[0] || {
      plot: prevTarget?.plot || (plan.title ? `งาน Field Day: ${plan.title}` : "จัดงาน Field Day"),
      location: plan.location || prevTarget?.location || "",
      showcase: decoded.showcase || defaultShowcase || prevTarget?.showcase || "",
      crop: decoded.targetCrop || prevTarget?.crop || "",
      targetAttendees: targetAttendeesStr,
      targetSales: targetSalesStr,
      demoPlotId: plan.demoPlotId || null,
    };

  return {
    primary,
    list: list.length > 0 ? list : [primary],
  };
}

/**
 * Hydrates Type 10 Planned form fields from initial data
 */
export function hydrateType10PlannedData(initialData: any): {
  demoPlotId: string;
  location: string;
  targetCrop: string;
  showcase: string;
  attendees: number;
  bookingSales: number;
} {
  if (!initialData) {
    return {
      demoPlotId: "",
      location: "",
      targetCrop: "",
      showcase: "",
      attendees: 0,
      bookingSales: 0,
    };
  }

  const visits = initialData.demoPlotVisits || [];
  const matchedVisit = visits.find((v: any) => v.workTypeCode === "TYPE_10");
  const demoPlot = matchedVisit?.demoPlot || initialData.demoPlot;

  const decoded = decodeType10Notes(initialData.notes);

  return {
    demoPlotId:
      initialData.submittedDemoPlotId ||
      matchedVisit?.demoPlotId ||
      initialData.type10DemoPlot ||
      demoPlot?.id ||
      "",
    location:
      initialData.type10Location ||
      demoPlot?.location ||
      initialData.location ||
      "",
    targetCrop:
      initialData.type10TargetCrop ||
      decoded.targetCrop ||
      demoPlot?.targetCrop ||
      demoPlot?.cropName ||
      "",
    showcase:
      initialData.type10Showcase ||
      decoded.showcase ||
      demoPlot?.primaryProductName ||
      demoPlot?.showcase ||
      "",
    attendees:
      initialData.type10Attendees != null
        ? Number(initialData.type10Attendees)
        : initialData.targetAttendeesCount != null
          ? Number(initialData.targetAttendeesCount)
          : 0,
    bookingSales:
      initialData.type10BookingSales != null
        ? Number(initialData.type10BookingSales)
        : initialData.targetBookingSales != null
          ? Number(initialData.targetBookingSales)
          : 0,
  };
}

/**
 * Maps Type 10 planned targets into unified section items for display
 */
export function mapType10ToSectionItems(targets: Type10TargetItem[]) {
  if (!targets || targets.length === 0) return [];
  return targets.map((t) => ({
    title: t.plot || "งาน Field Day",
    subtitle: t.location || undefined,
    detail: [
      t.showcase ? `สินค้าจัดแสดง: ${t.showcase}` : null,
      t.crop ? `พืชเป้าหมาย: ${t.crop}` : null,
      t.targetAttendees ? `เป้าหมายผู้เข้าร่วม: ${t.targetAttendees}` : null,
      t.targetSales ? `เป้าหมายยอดสั่งจอง: ${t.targetSales}` : null,
    ]
      .filter(Boolean)
      .join(" • "),
  }));
}
