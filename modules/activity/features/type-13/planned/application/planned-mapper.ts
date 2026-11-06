import type { Type13PlotItem, Type13TargetItem } from "../../shared/types";

/**
 * Extracts Type 13 plan targets (ฉีดแปลงแฮตแทค) from activity plan relations.
 */
export function extractType13PlanTargets(
  plan: any,
  prevTarget?: Type13PlotItem,
): { primary: Type13PlotItem; list: Type13PlotItem[] } {
  const plots: any[] =
    plan?.type13Targets ||
    plan?.type13?.plots ||
    plan?.type13Plots ||
    (plan?.demoPlotVisits || [])
      .filter((v: any) => v.demoPlot?.plotType === "HATTACK" || v.workTypeCode === "TYPE_13")
      .map((v: any) => v.demoPlot)
      .filter(Boolean);

  const t13Results: any[] = plan?.type13Results || [];

  const mappedList: Type13PlotItem[] = plots.map((p, idx) => {
    const plotProducts = p.products || [];
    const targetResult =
      (p.results && p.results[0]) ||
      t13Results.find((r: any) => r.targetId === p.id) ||
      t13Results[idx] ||
      p.result;
    const hasWithdrawal =
      p.hasProductWithdrawal !== undefined
        ? Boolean(p.hasProductWithdrawal)
        : plotProducts.length > 0;
    const withdrawnList = (p.withdrawnProducts || plotProducts).map(
      (prod: any, prodIdx: number) => ({
        id: prod.id || `withdrawn-${idx}-${prodIdx}`,
        productId: prod.productId || "",
        productName: prod.productName || prod.product?.name || "",
        quantity: prod.quantity != null ? Number(prod.quantity) : 1,
        unit: prod.unit || prod.product?.unit || "ขวด",
      }),
    );

    return {
      id: p.id || `plot-${idx + 1}`,
      demoPlotId: p.demoPlotId || p.id || null,
      name: p.plotName || p.name || `แปลงที่ ${idx + 1}`,
      storeId: p.storeId || p.customerId || "",
      dealerName: p.dealerName || p.store?.name || p.customer?.name || null,
      ownerName: p.ownerName || p.customer?.name || null,
      province: p.province || p.store?.province || "",
      district: p.district || p.store?.district || "",
      subdistrict: p.subdistrict || p.store?.subdistrict || null,
      village: p.village || targetResult?.notes || null,
      objective: p.objective || null,
      plannedPlotsCount: p.plannedPlotsCount != null ? p.plannedPlotsCount : null,
      actualPlotsCount:
        targetResult?.actualPlotsCount != null
          ? targetResult.actualPlotsCount
          : p.actualPlotsCount != null
            ? p.actualPlotsCount
            : null,
      latitude:
        p.latitude != null && String(p.latitude).trim() !== ""
          ? String(p.latitude)
          : targetResult?.actualLatitude != null
            ? String(targetResult.actualLatitude)
            : null,
      longitude:
        p.longitude != null && String(p.longitude).trim() !== ""
          ? String(p.longitude)
          : targetResult?.actualLongitude != null
            ? String(targetResult.actualLongitude)
            : null,
      hasProductWithdrawal: hasWithdrawal,
      withdrawnProducts: withdrawnList,
      products: plotProducts,
      status: p.status || "IN_PROGRESS",
      closedAt: p.closedAt || null,
      closureNotes: p.closureNotes || null,
    };
  });

  const primary: Type13PlotItem = mappedList[0] || {
    id: prevTarget?.id || "plot-1",
    demoPlotId: prevTarget?.demoPlotId || null,
    name: prevTarget?.name || "แปลงที่ 1",
    storeId: prevTarget?.storeId || "",
    dealerName: prevTarget?.dealerName || null,
    ownerName: prevTarget?.ownerName || null,
    province: prevTarget?.province || "",
    district: prevTarget?.district || "",
    subdistrict: prevTarget?.subdistrict || null,
    village: prevTarget?.village || null,
    objective: prevTarget?.objective || null,
    plannedPlotsCount: prevTarget?.plannedPlotsCount || null,
    products: prevTarget?.products || [],
  };

  return {
    primary,
    list: mappedList,
  };
}

/**
 * Hydrates Type 13 planned data from plan payload
 */
export function hydrateType13PlannedData(plan: any): Type13PlotItem[] {
  if (!plan) return [];
  const targets = extractType13PlanTargets(plan);
  return targets.list;
}

/**
 * Pure mapper for Type 13 Plan Detail View Section items
 */
export function mapType13ToSectionItems(
  type13: any,
  objectiveLines: string[] = [],
): {
  typeIndex: number;
  title: string;
  badge: string;
  items: any[];
  rawSummary?: string;
} | null {
  const t13Line = objectiveLines.find(
    (l) => l.includes("[ฉีดแปลงแฮตแทค") || l.includes("แฮตแทค") || l.includes("TYPE_13"),
  );

  const plots = type13?.plots || (Array.isArray(type13) ? type13 : []);

  if (!type13 && !t13Line && plots.length === 0) {
    return null;
  }

  const items = plots.map((p: any, idx: number) => {
    const extraFields: Array<{ label: string; value: string }> = [];

    if (p.dealerName || p.store?.name) {
      extraFields.push({
        label: "ร้านค้า Dealer",
        value: p.dealerName || p.store?.name,
      });
    }

    const locParts = [
      p.subdistrict ? `ต.${p.subdistrict}` : null,
      p.district ? `อ.${p.district}` : null,
      p.province ? `จ.${p.province}` : null,
    ].filter(Boolean);

    if (locParts.length > 0) {
      extraFields.push({
        label: "พื้นที่",
        value: locParts.join(" "),
      });
    }

    if (p.village) {
      extraFields.push({
        label: "หมู่บ้าน",
        value: p.village,
      });
    }

    if (p.objective) {
      extraFields.push({
        label: "วัตถุประสงค์",
        value: p.objective,
      });
    }

    if (p.plannedPlotsCount != null) {
      extraFields.push({
        label: "จำนวนแปลงตามแผน",
        value: `${p.plannedPlotsCount} แปลง`,
      });
    }

    return {
      title: p.plotName || p.name || `แปลงแฮตแทคที่ ${idx + 1}`,
      extraFields: extraFields.length > 0 ? extraFields : undefined,
    };
  });

  return {
    typeIndex: 13,
    title: "ฉีดแปลงแฮตแทค",
    badge: "ฉีดแปลง",
    items: items.length > 0 ? items : [{ title: "แปลงแฮตแทค" }],
    rawSummary: t13Line ? t13Line.replace(/^\[.*?\]\s*/, "") : undefined,
  };
}
