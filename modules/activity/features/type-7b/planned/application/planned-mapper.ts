import type {
  Type7bPlanItem,
  Type7bTargetItem,
} from "../types/planned.types";
import type { Type7bWithdrawnProductLine } from "../../shared/types";

/**
 * Extract Type 7B Plan Targets from raw plan object
 */
export function extractType7bPlanTargets(
  plan: any,
  prevTarget?: Type7bTargetItem,
): {
  primary: Type7bTargetItem;
  list: Type7bTargetItem[];
} {
  const fallbackItem: Type7bTargetItem = {
    plotName: "",
    owner: "",
    farmerName: "",
    ownerName: "",
    dealerName: "",
    crop: "",
    cropName: "",
    areaRai: null,
    treeCount: null,
    plots: "",
    objective: "",
    followUpObjective: "",
    t7bObjective: "",
    detail: "",
    demoProducts: [],
    withdrawnProducts: [],
    items: [],
    ...prevTarget,
  };

  if (!plan) return { primary: fallbackItem, list: [] };

  const t7bRecord: any =
    plan.type7bTargets && plan.type7bTargets.length > 0
      ? {
          plots: plan.type7bTargets,
          products: plan.type7bProducts || [],
          objective: plan.type7bTargets[0]?.objective || plan.type7bTargets[0]?.notes || "",
          notes: plan.type7bTargets[0]?.notes || "",
        }
      : plan.type7b || plan.type7bData;
  const rawPlots: any[] = t7bRecord?.plots || plan.type7bPlots || [];

  if (t7bRecord && Array.isArray(rawPlots) && rawPlots.length > 0) {
    const t7bProducts: Type7bWithdrawnProductLine[] = (t7bRecord.products || []).map(
      (p: any, idx: number) => {
        const prod = p.product || {};
        const pName = p.productName || prod.name || "";
        const qty =
          p.quantity != null
            ? Number(p.quantity)
            : p.targetQuantity != null
              ? Number(p.targetQuantity)
              : 1;
        const unit = p.unit || prod.unit || null;
        return {
          id: p.id || `t7b-prod-${idx}`,
          productId: p.productId || prod.id,
          productName: pName,
          quantity: qty,
          unit,
          notes: p.notes || "",
        };
      },
    );

    const list: Type7bTargetItem[] = rawPlots.map((plot: any, idx: number) => {
      const demoPlot = plot.type7aTarget || plot.demoPlot || {};
      const plotName =
        plot.plotName ||
        demoPlot.plotName ||
        demoPlot.name ||
        `แปลงสาธิตติดตาม #${idx + 1}`;
      const ownerName =
        plot.ownerName ||
        plot.farmerName ||
        demoPlot.results?.[0]?.farmerName ||
        demoPlot.ownerName ||
        demoPlot.store?.name ||
        "";
      const dealerName =
        plot.dealerName ||
        demoPlot.store?.name ||
        demoPlot.customer?.name ||
        demoPlot.dealerName ||
        "";
      const dealerCode =
        demoPlot.store?.customerCode ||
        demoPlot.customer?.customerCode ||
        demoPlot.dealerCode ||
        "";
      const province =
        plot.province ||
        demoPlot.province ||
        demoPlot.store?.province ||
        plan.province ||
        "";
      const district =
        plot.district ||
        demoPlot.district ||
        plan.district ||
        "";
      const cropCategory =
        demoPlot.cropCategory ||
        "";
      const cropName =
        plot.cropName ||
        demoPlot.customCropName ||
        demoPlot.cropName ||
        "";
      const areaRai =
        plot.areaRai != null
          ? Number(plot.areaRai)
          : demoPlot.areaRai != null
            ? Number(demoPlot.areaRai)
            : null;
      const treeCount = plot.treeCount ?? demoPlot.treeCount ?? null;

      return {
        id: plot.id || plot.demoPlotId || `plot-${idx}`,
        demoPlotId: plot.demoPlotId || demoPlot.id || plot.id,
        plotName,
        plotCode: demoPlot.code || "",
        owner: ownerName,
        ownerName,
        farmerName: ownerName,
        dealerName,
        dealerCode,
        province,
        district,
        cropCategory,
        crop: cropName,
        cropName,
        areaRai,
        treeCount,
        plots: plotName,
        objective: t7bRecord.objective || t7bRecord.notes || "",
        followUpObjective: t7bRecord.objective || t7bRecord.notes || "",
        t7bObjective: t7bRecord.objective || t7bRecord.notes || "",
        detail: t7bRecord.objective || t7bRecord.notes || "",
        demoProducts: t7bProducts,
        withdrawnProducts: t7bProducts,
        items: t7bProducts,
      };
    });

    return {
      primary: list[0] || fallbackItem,
      list,
    };
  }

  // Fallback to demoPlotVisits
  if (Array.isArray(plan.demoPlotVisits) && plan.demoPlotVisits.length > 0) {
    const list: Type7bTargetItem[] = plan.demoPlotVisits.map((v: any, idx: number) => {
      const dp = v.demoPlot || {};
      const plotName = dp.name || `แปลงสาธิต #${idx + 1}`;
      const ownerName = dp.ownerName || "";
      return {
        id: dp.id || v.id || `visit-${idx}`,
        plotName,
        plotCode: dp.code || "",
        owner: ownerName,
        ownerName,
        farmerName: ownerName,
        dealerName: dp.customer?.name || "",
        province: dp.province || plan.province || "",
        district: dp.district || plan.district || "",
        crop: dp.customCropName || dp.cropName || "",
        cropName: dp.customCropName || dp.cropName || "",
        areaRai: dp.areaRai != null ? Number(dp.areaRai) : null,
        treeCount: dp.treeCount ?? null,
        objective: v.notes || dp.objective || "",
        detail: v.notes || dp.objective || "",
        demoProducts: [],
        withdrawnProducts: [],
        items: [],
      };
    });

    return {
      primary: list[0] || fallbackItem,
      list,
    };
  }

  return { primary: fallbackItem, list: [] };
}

/**
 * Hydrate Type 7B Planned Form Items from raw activity plan data
 */
export function hydrateType7bPlannedData(initialData: any): Type7bPlanItem[] {
  if (!initialData) return [];

  // 1. Resolve raw targets/plots from all possible relations/sources
  const rawTargets: any[] =
    (Array.isArray(initialData.type7bTargets) && initialData.type7bTargets.length > 0
      ? initialData.type7bTargets
      : null) ||
    (Array.isArray(initialData.type7b?.plots) && initialData.type7b.plots.length > 0
      ? initialData.type7b.plots
      : null) ||
    (Array.isArray(initialData.type7bData?.plots) && initialData.type7bData.plots.length > 0
      ? initialData.type7bData.plots
      : null) ||
    (Array.isArray(initialData.type7bPlots) && initialData.type7bPlots.length > 0
      ? initialData.type7bPlots
      : null) ||
    (Array.isArray(initialData.plots) && initialData.plots.length > 0
      ? initialData.plots
      : null) ||
    [];

  // 2. Fallback to demoPlotVisits if no direct targets
  const rawVisits: any[] =
    rawTargets.length === 0 && Array.isArray(initialData.demoPlotVisits) && initialData.demoPlotVisits.length > 0
      ? initialData.demoPlotVisits
      : [];

  const t7bRecord: any =
    initialData.type7b ||
    initialData.type7bData ||
    null;

  // If no targets, no visits, and no t7b record or demoPlotId, return empty
  if (
    rawTargets.length === 0 &&
    rawVisits.length === 0 &&
    !t7bRecord &&
    !initialData.demoPlotId &&
    !initialData.existingPlotId
  ) {
    return [];
  }

  // 3. Resolve raw products from all possible relations
  const rawProducts: any[] =
    (Array.isArray(initialData.type7bProducts) && initialData.type7bProducts.length > 0
      ? initialData.type7bProducts
      : null) ||
    (Array.isArray(t7bRecord?.products) && t7bRecord.products.length > 0
      ? t7bRecord.products
      : null) ||
    (rawTargets.length > 0 && Array.isArray(rawTargets[0]?.products) && rawTargets[0].products.length > 0
      ? rawTargets[0].products
      : null) ||
    (Array.isArray(initialData.products) && initialData.products.length > 0
      ? initialData.products.filter((p: any) => p.workTypeCode === "TYPE_7B" || !p.workTypeCode)
      : null) ||
    [];

  const type7bProds: Type7bWithdrawnProductLine[] = rawProducts.map(
    (p: any, idx: number) => {
      const prod = p.product || {};
      const pName = p.productName || prod.name || "";
      const pId = p.productId || prod.id || "";
      const qty =
        p.quantity != null
          ? Number(p.quantity)
          : p.targetQuantity != null
            ? Number(p.targetQuantity)
            : 1;
      const unit = p.unit || prod.unit || "";
      return {
        id: p.id || String(idx + 1),
        productId: pId,
        productName: pName,
        quantity: qty,
        unit,
        notes: p.notes || "",
      };
    },
  );

  const has7bWithdrawal = Boolean(
    type7bProds.length > 0 ||
    t7bRecord?.hasProducts ||
    initialData.hasProductWithdrawal,
  );

  const firstTarget = rawTargets[0];
  const firstVisit = rawVisits[0];
  const demoPlot = firstTarget?.type7aTarget || firstTarget?.demoPlot || firstVisit?.demoPlot || initialData.demoPlot || {};

  const initialPlotIds: string[] =
    rawTargets.length > 0
      ? rawTargets.map((p: any) => p.type7aTargetId || p.demoPlotId || p.demoPlot?.id || p.id).filter(Boolean)
      : rawVisits.length > 0
        ? rawVisits.map((v: any) => v.demoPlotId || v.demoPlot?.id || v.id).filter(Boolean)
        : [initialData.type7aTargetId || initialData.demoPlotId || initialData.existingPlotId].filter(Boolean);

  const fallbackPlotId =
    firstTarget?.type7aTargetId ||
    firstTarget?.demoPlotId ||
    demoPlot.id ||
    firstVisit?.demoPlotId ||
    t7bRecord?.type7aTargetId ||
    t7bRecord?.demoPlotId ||
    initialData.type7aTargetId ||
    initialData.demoPlotId ||
    initialData.existingPlotId ||
    initialPlotIds[0] ||
    "";

  const sourcePlan = firstTarget?.sourceActivityPlan || t7bRecord?.sourceActivityPlan || null;

  const selectedPlanId =
    firstTarget?.sourceActivityPlanId ||
    sourcePlan?.id ||
    t7bRecord?.sourceActivityPlanId ||
    demoPlot.activityPlanId ||
    initialData.sourceActivityPlanId ||
    "";

  const plotName =
    firstTarget?.plotName ||
    demoPlot.plotName ||
    demoPlot.name ||
    firstVisit?.plotName ||
    t7bRecord?.plotName ||
    initialData.plotName ||
    initialData.existingPlotName ||
    "";

  const ownerName =
    firstTarget?.ownerName ||
    firstTarget?.farmerName ||
    demoPlot.ownerName ||
    firstVisit?.ownerName ||
    t7bRecord?.ownerName ||
    initialData.ownerName ||
    initialData.farmerName ||
    "";

  const cropName =
    firstTarget?.cropName ||
    demoPlot.cropName ||
    demoPlot.customCropName ||
    firstVisit?.cropName ||
    t7bRecord?.cropName ||
    initialData.cropName ||
    "";

  const cropCategory =
    firstTarget?.cropCategory ||
    demoPlot.cropCategory ||
    t7bRecord?.cropCategory ||
    initialData.cropCategory ||
    "";

  const province =
    firstTarget?.province ||
    demoPlot.province ||
    t7bRecord?.province ||
    initialData.province ||
    "";

  const district =
    firstTarget?.district ||
    demoPlot.district ||
    t7bRecord?.district ||
    initialData.district ||
    "";

  const areaRai =
    firstTarget?.areaRai != null
      ? Number(firstTarget.areaRai)
      : demoPlot.areaRai != null
        ? Number(demoPlot.areaRai)
        : initialData.areaRai != null
          ? Number(initialData.areaRai)
          : null;

  const treeCount =
    firstTarget?.treeCount ??
    demoPlot.treeCount ??
    initialData.treeCount ??
    null;

  const objective =
    firstTarget?.objective ||
    firstTarget?.notes ||
    t7bRecord?.objective ||
    t7bRecord?.notes ||
    firstVisit?.notes ||
    initialData.objective ||
    initialData.notes ||
    "";

  const sourcePlanCode = sourcePlan?.code || t7bRecord?.sourcePlanCode || initialData.sourcePlanCode || "";
  const sourcePlanTitle = sourcePlan?.title || t7bRecord?.sourcePlanTitle || initialData.sourcePlanTitle || "";
  const sourcePlanDate = sourcePlan?.startDate || t7bRecord?.sourcePlanDate || initialData.sourcePlanDate || undefined;

  return [
    {
      id: firstTarget?.id || t7bRecord?.id || fallbackPlotId || "1",
      plotActivityType: "FOLLOW_UP",
      selectedPlanId,
      selectedPlotIds: initialPlotIds,
      demoPlotId: fallbackPlotId,
      existingPlotId: fallbackPlotId,
      existingPlotName: plotName,
      hasProductWithdrawal: has7bWithdrawal,
      withdrawnProducts: has7bWithdrawal ? type7bProds : [],
      plotName,
      storeId: "",
      ownerName,
      farmerName: ownerName,
      cropCategory,
      cropName,
      areaRai,
      treeCount,
      province,
      district,
      objective,
      detail: objective,
      productId: type7bProds[0]?.productId || "",
      productName: type7bProds[0]?.productName || "",
      demoProducts: [],
      sourcePlanCode,
      sourcePlanTitle,
      sourcePlanDate,
      plots: rawTargets.length > 0 ? rawTargets : rawVisits,
    },
  ];
}

/**
 * Format Type 7B Follow-Up Plots for detail view section display
 */
export function mapType7bToSectionItems(
  type7b: any,
  demoVisits?: any[],
): Array<{
  title: string;
  subtitle?: string;
  details?: string;
  extraFields?: Array<{ label: string; value: string }>;
}> {
  if (!type7b && (!demoVisits || demoVisits.length === 0)) return [];

  const plots = type7b?.plots || [];
  if (plots.length > 0) {
    return plots.map((p: any, idx: number) => {
      const demoPlot = p.demoPlot || {};
      const title =
        p.plotName ||
        demoPlot.name ||
        `แปลงสาธิตติดตาม #${idx + 1}`;
      const ownerName =
        p.ownerName ||
        p.farmerName ||
        demoPlot.ownerName;
      const cropName =
        p.cropName ||
        demoPlot.customCropName ||
        demoPlot.cropName;
      const areaRai =
        p.areaRai != null
          ? Number(p.areaRai)
          : demoPlot.areaRai != null
            ? Number(demoPlot.areaRai)
            : null;
      const treeCount = p.treeCount ?? demoPlot.treeCount ?? null;

      const extraFields: Array<{ label: string; value: string }> = [];
      if (cropName) {
        extraFields.push({ label: "พืชเป้าหมาย", value: cropName });
      }
      if (areaRai) {
        extraFields.push({ label: "ขนาดแปลง", value: `${areaRai} ไร่` });
      } else if (treeCount) {
        extraFields.push({ label: "จำนวนต้น", value: `${treeCount} ต้น` });
      }

      const dealerName = p.dealerName || demoPlot.customer?.name;
      if (dealerName) {
        extraFields.push({ label: "ร้านค้าตัวแทน", value: dealerName });
      }

      const products = type7b?.products || demoPlot.demoProducts || [];
      if (products.length > 0) {
        const prodNames = products
          .map((pr: any) => pr.productName || pr.product?.name)
          .filter(Boolean)
          .join(", ");
        if (prodNames) {
          extraFields.push({ label: "สินค้าสาธิตที่เบิก/ใช้", value: prodNames });
        }
      }

      return {
        title,
        subtitle: ownerName ? `เจ้าของ: ${ownerName}` : undefined,
        details: type7b?.objective || type7b?.notes || demoPlot.objective || undefined,
        extraFields: extraFields.length > 0 ? extraFields : undefined,
      };
    });
  }

  // Fallback to demoVisits
  if (demoVisits && demoVisits.length > 0) {
    return demoVisits.map((v: any, idx: number) => {
      const dp = v.demoPlot || {};
      const title = dp.name || `แปลงสาธิตติดตาม #${idx + 1}`;
      const ownerName = dp.ownerName;
      const cropName = dp.customCropName || dp.cropName;
      const areaRai = dp.areaRai != null ? Number(dp.areaRai) : null;

      const extraFields: Array<{ label: string; value: string }> = [];
      if (cropName) {
        extraFields.push({ label: "พืชเป้าหมาย", value: cropName });
      }
      if (areaRai) {
        extraFields.push({ label: "ขนาดแปลง", value: `${areaRai} ไร่` });
      }
      if (dp.customer?.name) {
        extraFields.push({ label: "ร้านค้าตัวแทน", value: dp.customer.name });
      }

      return {
        title,
        subtitle: ownerName ? `เจ้าของ: ${ownerName}` : undefined,
        details: v.notes || dp.objective || undefined,
        extraFields: extraFields.length > 0 ? extraFields : undefined,
      };
    });
  }

  return [];
}
