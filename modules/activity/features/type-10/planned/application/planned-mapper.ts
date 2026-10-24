import type { Type10TargetItem } from "../types/planned.types";
import { decodeType10Notes } from "../../shared/notes";

/**
 * Extracts Type 10 (จัดงาน Field Day) Plan Targets from Activity Plan.
 * Checks dedicated relational storage (type10Targets) first,
 * with fallback to demoPlotVisits and legacy tags.
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

  const list: Type10TargetItem[] = [];

  // 1. Dedicated Relational Storage support (type10Targets)
  const dedicatedTargets: any[] =
    plan.type10Targets ||
    plan.type10Data?.targets ||
    [];

  if (Array.isArray(dedicatedTargets) && dedicatedTargets.length > 0) {
    for (const t of dedicatedTargets) {
      const plotTitle =
        t.plotName ||
        (t.demoPlot
          ? t.demoPlot.ownerName
            ? `${t.demoPlot.ownerName} (${t.demoPlot.name || "แปลงสาธิต"})`
            : t.demoPlot.name || "แปลงสาธิต"
          : "งาน Field Day");

      const showcaseStr =
        t.showcaseProductName ||
        t.showcaseProduct?.name ||
        t.showcase ||
        t.demoPlot?.primaryProductName ||
        t.demoPlot?.showcase ||
        "";

      const cropStr =
        t.cropName ||
        t.cropCategory ||
        t.crop ||
        t.demoPlot?.targetCrop ||
        t.demoPlot?.cropName ||
        "";

      const attendeesCount =
        t.targetAttendeesCount != null
          ? Number(t.targetAttendeesCount)
          : plan.targetAttendeesCount != null
            ? Number(plan.targetAttendeesCount)
            : 0;

      const bookingSalesNum =
        t.targetBookingSales != null
          ? Number(t.targetBookingSales)
          : plan.targetBookingSales != null
            ? Number(plan.targetBookingSales)
            : 0;

      list.push({
        id: t.id,
        targetId: t.id,
        demoPlotId: t.demoPlotId || null,
        plot: plotTitle,
        plotName: t.plotName || t.demoPlot?.name || "",
        farmerName: t.farmerName || t.demoPlot?.ownerName || "",
        location: t.location || t.demoPlot?.location || plan.location || "",
        province: t.province || t.demoPlot?.province || "",
        district: t.district || t.demoPlot?.district || "",
        subdistrict: t.subdistrict || "",
        latitude: t.latitude || "",
        longitude: t.longitude || "",
        showcase: showcaseStr,
        showcaseProductId: t.showcaseProductId || null,
        showcaseProductName: t.showcaseProductName || null,
        crop: cropStr,
        cropName: t.cropName || "",
        cropCategory: t.cropCategory || "",
        targetAttendees: attendeesCount ? `${attendeesCount} คน` : prevTarget?.targetAttendees || "",
        targetAttendeesCount: attendeesCount,
        targetSales: bookingSalesNum ? `฿${bookingSalesNum.toLocaleString()}` : prevTarget?.targetSales || "",
        targetBookingSales: bookingSalesNum,
        products: t.products || [],
        result: t.result || null,
      });
    }
  }

  // 2. Fallback to legacy demoPlotVisits / demoPlot
  if (list.length === 0) {
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
          targetId: v.id,
          demoPlotId: v.demoPlotId || plot?.id || null,
          plot: plotName || "งาน Field Day",
          plotName: plot?.name || "",
          farmerName: plot?.ownerName || "",
          location,
          showcase,
          crop,
          targetAttendees: targetAttendeesStr,
          targetAttendeesCount: plan.targetAttendeesCount || 0,
          targetSales: targetSalesStr,
          targetBookingSales: plan.targetBookingSales ? Number(plan.targetBookingSales) : 0,
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
        targetId: plot.id,
        demoPlotId: plot.id || null,
        plot: plotName || "งาน Field Day",
        plotName: plot.name || "",
        farmerName: plot.ownerName || "",
        location,
        showcase,
        crop,
        targetAttendees: targetAttendeesStr,
        targetAttendeesCount: plan.targetAttendeesCount || 0,
        targetSales: targetSalesStr,
        targetBookingSales: plan.targetBookingSales ? Number(plan.targetBookingSales) : 0,
      });
    }
  }

  const decoded = decodeType10Notes(plan.notes);

  const primary: Type10TargetItem =
    list[0] || {
      plot: prevTarget?.plot || (plan.title ? `งาน Field Day: ${plan.title}` : "จัดงาน Field Day"),
      location: plan.location || prevTarget?.location || "",
      showcase: decoded.showcase || prevTarget?.showcase || "",
      crop: decoded.targetCrop || prevTarget?.crop || "",
      targetAttendees: plan.targetAttendeesCount ? `${plan.targetAttendeesCount} คน` : prevTarget?.targetAttendees || "",
      targetAttendeesCount: plan.targetAttendeesCount || 0,
      targetSales: plan.targetBookingSales ? `฿${Number(plan.targetBookingSales).toLocaleString()}` : prevTarget?.targetSales || "",
      targetBookingSales: plan.targetBookingSales ? Number(plan.targetBookingSales) : 0,
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

  // 1. Check dedicated type10Targets
  const firstTarget =
    initialData.type10Targets?.[0] ||
    initialData.type10Data?.targets?.[0];

  if (firstTarget) {
    return {
      demoPlotId: firstTarget.demoPlotId || "",
      location: firstTarget.location || firstTarget.demoPlot?.location || "",
      targetCrop: firstTarget.cropName || firstTarget.cropCategory || firstTarget.demoPlot?.targetCrop || "",
      showcase: firstTarget.showcaseProductName || firstTarget.showcaseProduct?.name || firstTarget.demoPlot?.primaryProductName || "",
      attendees: firstTarget.targetAttendeesCount != null ? Number(firstTarget.targetAttendeesCount) : 0,
      bookingSales: firstTarget.targetBookingSales != null ? Number(firstTarget.targetBookingSales) : 0,
    };
  }

  // 2. Legacy fallback
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
