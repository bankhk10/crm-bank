import type {
  Type14PlotItem,
  Type14TargetItem,
  FollowUpPlanOption,
} from "../../shared/types";
import type { Type14PlanInput } from "../types/planned.types";

/**
 * Extracts Type 14 plan targets (ติดตามแปลงแฮตแทค) from activity plan relations.
 */
export function extractType14PlanTargets(
  plan: any,
  prevTarget?: Type14PlotItem,
): { primary: Type14PlotItem; list: Type14PlotItem[] } {
  const plots: any[] =
    plan?.type14Targets ||
    plan?.type14?.plots ||
    plan?.type14Plots ||
    (plan?.demoPlotVisits || [])
      .filter(
        (v: any) =>
          v.workTypeCode === "TYPE_14" || v.demoPlot?.plotType === "HATTACK",
      )
      .map((v: any) => v.demoPlot)
      .filter(Boolean);

  const mappedList: Type14PlotItem[] = plots.map((p, idx) => ({
    id: p.id || `plot-${idx + 1}`,
    type13TargetId: p.type13TargetId || p.type13Target?.id || p.demoPlotId || p.id || null,
    demoPlotId: p.demoPlotId || p.type13TargetId || p.id || null,
    name: p.plotName || p.name || p.type13Target?.plotName || `แปลงที่ ${idx + 1}`,
    plotName: p.plotName || p.name || p.type13Target?.plotName || `แปลงที่ ${idx + 1}`,
    storeId: p.storeId || p.customerId || p.type13Target?.storeId || "",
    dealerName: p.dealerName || p.store?.name || p.type13Target?.dealerName || p.customer?.name || null,
    ownerName: p.ownerName || p.type13Target?.ownerName || p.customer?.name || null,
    cropCategory: p.cropCategory || null,
    cropName: p.cropName || null,
    areaRai: p.areaRai != null ? Number(p.areaRai) : null,
    treeCount: p.treeCount != null ? Number(p.treeCount) : null,
    province: p.province || p.store?.province || p.type13Target?.province || "",
    district: p.district || p.store?.district || p.type13Target?.district || "",
    subdistrict: p.subdistrict || p.store?.subdistrict || p.type13Target?.subdistrict || null,
    village: p.village || p.type13Target?.village || null,
    plannedPlotsCount: p.plannedPlotsCount ?? p.type13Target?.plannedPlotsCount ?? 1,
    actualPlotsCount: p.actualPlotsCount ?? null,
    latitude: p.latitude != null ? String(p.latitude) : null,
    longitude: p.longitude != null ? String(p.longitude) : null,
    products: p.products || [],
  }));

  if (mappedList.length === 0) {
    const singlePlot: Type14PlotItem = {
      id: prevTarget?.id || plan?.id || "type14-default",
      demoPlotId: prevTarget?.demoPlotId || null,
      name: prevTarget?.name || "ติดตามแปลงแฮตแทค",
      plotName: prevTarget?.plotName || "ติดตามแปลงแฮตแทค",
      storeId: prevTarget?.storeId || "",
      dealerName: prevTarget?.dealerName || null,
      ownerName: prevTarget?.ownerName || null,
      province: prevTarget?.province || plan?.province || "",
      district: prevTarget?.district || plan?.district || "",
      latitude: prevTarget?.latitude || null,
      longitude: prevTarget?.longitude || null,
      products: [],
    };
    return {
      primary: singlePlot,
      list: [singlePlot],
    };
  }

  return {
    primary: mappedList[0],
    list: mappedList,
  };
}

/**
 * Hydrates initial Type 14 planned data
 */
export function hydrateType14PlannedData(
  initial: any = {},
  defaultProvince = "",
  defaultDistrict = "",
  fetchedHattackPlansWithPlots: FollowUpPlanOption[] = [],
): Type14PlanInput {
  const resolvedT14 =
    initial?.type14 ||
    (initial?.type14Targets && initial.type14Targets.length > 0
      ? {
          plots: initial.type14Targets,
          products: initial.type14Products || [],
          mode: initial.type14Targets[0]?.mode,
          sourceActivityPlanId: initial.type14Targets[0]?.sourceActivityPlanId,
          hasProducts: (initial.type14Products || []).length > 0,
        }
      : null);

  if (resolvedT14) {
    const t14 = resolvedT14;
    const plots = t14.plots || [];
    const primaryPlot = plots[0] || {};
    const prods = (t14.products || []).map((p: any, idx: number) => ({
      id: p.id || String(idx + 1),
      productId: p.productId,
      productName: p.productName || p.product?.name || "",
      quantity: Number(p.quantity) || 1,
      unit: p.unit || p.product?.unit || "ขวด",
    }));

    const plotIds = plots
      .map((p: any) => p.type13TargetId || p.demoPlotId || p.id)
      .filter(Boolean);

    const resolvedPlanId =
      t14.sourceActivityPlanId ||
      t14.selectedPlanId ||
      primaryPlot.sourceActivityPlanId ||
      primaryPlot.sourceActivityPlan?.id ||
      primaryPlot.type13Target?.activityPlanId ||
      fetchedHattackPlansWithPlots.find((fp) =>
        fp.plots.some((pl) => plotIds.includes(pl.id)),
      )?.planId ||
      null;

    return {
      mode: (t14.mode as "EXISTING_PLOT" | "NEW_PLOT") || "EXISTING_PLOT",
      selectedPlanId: resolvedPlanId,
      demoPlotId: primaryPlot.demoPlotId || primaryPlot.type13TargetId || null,
      type13TargetId: primaryPlot.type13TargetId || null,
      selectedPlotIds: plotIds,
      demoPlotIds: plotIds,
      type13TargetIds: plotIds,
      plots: plots.map((p: any) => ({
        id: p.id,
        demoPlotId: p.demoPlotId || p.type13TargetId || p.id,
        type13TargetId: p.type13TargetId || p.demoPlotId || p.id,
        name: p.plotName || p.name || p.type13Target?.plotName || "แปลงแฮตแทค",
        plotName: p.plotName || p.name || p.type13Target?.plotName || "แปลงแฮตแทค",
        storeId: p.storeId || p.type13Target?.storeId || primaryPlot.storeId || "",
        dealerName:
          p.dealerName ||
          p.type13Target?.dealerName ||
          p.store?.name ||
          primaryPlot.dealerName ||
          null,
        ownerName:
          p.ownerName ||
          p.type13Target?.ownerName ||
          primaryPlot.ownerName ||
          null,
        cropCategory: p.cropCategory || null,
        cropName: p.cropName || null,
        province:
          p.province ||
          p.type13Target?.province ||
          primaryPlot.province ||
          "",
        district:
          p.district ||
          p.type13Target?.district ||
          primaryPlot.district ||
          "",
        subdistrict: p.subdistrict || p.type13Target?.subdistrict || null,
        village: p.village || p.type13Target?.village || null,
        plannedPlotsCount:
          p.plannedPlotsCount ?? p.type13Target?.plannedPlotsCount ?? 1,
        actualPlotsCount: p.actualPlotsCount ?? null,
        latitude: p.latitude ? String(p.latitude) : "",
        longitude: p.longitude ? String(p.longitude) : "",
      })),
      name: primaryPlot.plotName || primaryPlot.demoPlot?.name || "แปลงแฮตแทค",
      storeId: primaryPlot.demoPlot?.customerId || "",
      dealerName:
        primaryPlot.dealerName || primaryPlot.demoPlot?.customer?.name || "",
      ownerName: primaryPlot.ownerName || primaryPlot.demoPlot?.ownerName || "",
      cropCategory:
        primaryPlot.cropCategory || primaryPlot.demoPlot?.cropCategory || null,
      cropName: primaryPlot.cropName || primaryPlot.demoPlot?.cropName || null,
      province:
        primaryPlot.province ||
        primaryPlot.demoPlot?.province ||
        initial?.province ||
        defaultProvince ||
        "",
      district:
        primaryPlot.district ||
        primaryPlot.demoPlot?.district ||
        initial?.district ||
        defaultDistrict ||
        "",
      latitude: primaryPlot.latitude
        ? String(primaryPlot.latitude)
        : primaryPlot.demoPlot?.latitude
          ? String(primaryPlot.demoPlot.latitude)
          : "",
      longitude: primaryPlot.longitude
        ? String(primaryPlot.longitude)
        : primaryPlot.demoPlot?.longitude
          ? String(primaryPlot.demoPlot.longitude)
          : "",
      hasProductWithdrawal: Boolean(
        t14.hasProductWithdrawal ||
          t14.hasProducts ||
          prods.length > 0 ||
          initial?.hasProductWithdrawal,
      ),
      withdrawnProducts: prods,
    };
  }

  if (initial?.type14Data) {
    return initial.type14Data;
  }

  const visits = initial?.demoPlotVisits || [];
  const t14Visits = visits.filter(
    (v: any) =>
      v.workTypeCode === "TYPE_14" || v.demoPlot?.plotType === "HATTACK",
  );
  const plot = t14Visits[0]?.demoPlot || initial?.demoPlot || null;
  const resolvedPlotId = t14Visits[0]?.demoPlotId || plot?.id || null;

  return {
    mode: plot?.id ? "EXISTING_PLOT" : "NEW_PLOT",
    selectedPlanId: null,
    demoPlotId: resolvedPlotId,
    selectedPlotIds: resolvedPlotId ? [resolvedPlotId] : [],
    demoPlotIds: resolvedPlotId ? [resolvedPlotId] : [],
    name: plot?.name || "แปลงแฮตแทค",
    storeId: plot?.customerId || initial?.stores?.[0]?.storeId || "",
    dealerName: plot?.customer?.name || initial?.stores?.[0]?.storeName || "",
    ownerName: plot?.ownerName || plot?.farmerCustomer?.name || "",
    cropCategory: plot?.cropCategory || null,
    cropName: plot?.cropName || null,
    province: plot?.province || initial?.province || defaultProvince || "",
    district: plot?.district || initial?.district || defaultDistrict || "",
    latitude: plot?.latitude ? String(plot.latitude) : "",
    longitude: plot?.longitude ? String(plot.longitude) : "",
    hasProductWithdrawal: false,
    withdrawnProducts: [],
  };
}
