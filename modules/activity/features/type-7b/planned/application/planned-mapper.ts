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

  const t7bRecord: any = plan.type7b || plan.type7bData;
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
      const demoPlot = plot.demoPlot || {};
      const plotName =
        plot.plotName ||
        demoPlot.name ||
        `แปลงสาธิตติดตาม #${idx + 1}`;
      const ownerName =
        plot.ownerName ||
        plot.farmerName ||
        demoPlot.ownerName ||
        "";
      const dealerName =
        plot.dealerName ||
        demoPlot.customer?.name ||
        demoPlot.dealerName ||
        "";
      const dealerCode =
        demoPlot.customer?.customerCode ||
        demoPlot.dealerCode ||
        "";
      const province =
        plot.province ||
        demoPlot.province ||
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

  const t7b =
    initialData.type7b ||
    initialData.type7bData ||
    (initialData.type7bPlots && initialData.type7bPlots.length > 0
      ? {
          id: initialData.id,
          sourceActivityPlanId: initialData.sourceActivityPlanId,
          demoPlotId: initialData.demoPlotId,
          objective: initialData.objective || initialData.notes,
          notes: initialData.notes || initialData.objective,
          plots: initialData.type7bPlots,
          products: initialData.products || initialData.type7bProducts,
          hasProducts: initialData.hasProductWithdrawal,
        }
      : null);

  if (!t7b) return [];

  const rawProducts = t7b.products || initialData.type7bProducts || [];
  const type7bProds: Type7bWithdrawnProductLine[] = rawProducts.map(
    (p: any, idx: number) => ({
      id: p.id || String(idx + 1),
      productId: p.productId || p.product?.id || "",
      productName: p.product?.name || p.productName || "",
      quantity:
        p.quantity != null
          ? Number(p.quantity)
          : p.targetQuantity != null
            ? Number(p.targetQuantity)
            : 1,
      unit: p.unit || p.product?.unit || "",
      notes: p.notes || "",
    }),
  );

  const has7bWithdrawal = Boolean(
    t7b.hasProducts ||
    initialData.hasProductWithdrawal ||
    type7bProds.length > 0,
  );

  const rawPlots = t7b.plots || [];
  const initialPlotIds: string[] = rawPlots
    .map((p: any) => p.demoPlotId || p.id)
    .filter(Boolean);

  const firstPlot = rawPlots[0];
  const demoPlot = firstPlot?.demoPlot || {};
  const fallbackPlotId =
    t7b.demoPlotId ||
    firstPlot?.demoPlotId ||
    firstPlot?.id ||
    demoPlot.id ||
    initialPlotIds[0] ||
    "";

  const selectedPlanId =
    t7b.sourceActivityPlanId ||
    t7b.sourceActivityPlan?.id ||
    demoPlot.activityPlanId ||
    "";

  const plotName =
    firstPlot?.plotName ||
    demoPlot.name ||
    "";

  const ownerName =
    firstPlot?.ownerName ||
    firstPlot?.farmerName ||
    demoPlot.ownerName ||
    "";

  const cropName =
    firstPlot?.cropName ||
    demoPlot.cropName ||
    demoPlot.customCropName ||
    "";

  const cropCategory =
    firstPlot?.cropCategory ||
    demoPlot.cropCategory ||
    "";

  const province =
    firstPlot?.province ||
    demoPlot.province ||
    initialData.province ||
    "";

  const district =
    firstPlot?.district ||
    demoPlot.district ||
    initialData.district ||
    "";

  const areaRai =
    firstPlot?.areaRai != null
      ? Number(firstPlot.areaRai)
      : demoPlot.areaRai != null
        ? Number(demoPlot.areaRai)
        : null;

  const treeCount =
    firstPlot?.treeCount ??
    demoPlot.treeCount ??
    null;

  const objective =
    t7b.objective ||
    t7b.notes ||
    initialData.objective ||
    initialData.notes ||
    "";

  return [
    {
      id: t7b.id || fallbackPlotId || "1",
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
