import { useState, useEffect } from "react";
import { format } from "date-fns";
import { getWorkTypeCode, type FollowUpPlanOption } from "@/modules/activity-plans/constants";
import type {
  Type14PlanInput as FormType14PlanInput,
  Type14WithdrawnProductLine,
} from "../shared/types";
import type { Type14PlanInput } from "@/modules/activity-plans/application/validations";
import { validateType14FormValues } from "../create/validation";

export interface UseType14FormOptions {
  initial?: any;
  selectedWorkTypes?: string[];
  defaultProvince?: string;
  defaultDistrict?: string;
  fetchedHattackPlansWithPlots?: FollowUpPlanOption[];
}

export interface UseType14FormResult {
  type14Data: FormType14PlanInput;
  setType14Data: React.Dispatch<React.SetStateAction<FormType14PlanInput>>;
  validateType14: () => { isValid: boolean; error?: string };
  mapType14Payload: (
    customers: any[],
    products?: any[],
  ) => {
    type14Data: Type14PlanInput | undefined;
    submittedDemoPlotId?: string | null;
    submittedDemoPlotIds?: string[];
    planStores: Array<{
      workTypeCode: string;
      visitPurpose?: "FARMER" | "STORE" | null;
      storeId: string;
      storeName: string;
      province: string | null;
      remarks: string;
      notes: string;
    }>;
    planProducts: Array<{
      workTypeCode: string;
      productId: string;
      productName: string | null;
      targetQuantity: number;
      isPriceOverridden: boolean;
      storeId?: string | null;
    }>;
  };
}

function resolveInitialType14Data(
  initial: any = {},
  defaultProvince = "",
  defaultDistrict = "",
  fetchedHattackPlansWithPlots: FollowUpPlanOption[] = [],
): FormType14PlanInput {
  if (initial?.type14Data) {
    return initial.type14Data;
  }

  // Hydrate withdrawn products for TYPE_14
  const t14Products: Type14WithdrawnProductLine[] = (
    (initial as any)?.products || []
  )
    .filter((p: any) => p.workTypeCode === "TYPE_14")
    .map((p: any, idx: number) => ({
      id: p.id || String(idx + 1),
      productId: p.productId,
      productName: p.productName || p.product?.name || "",
      quantity: p.targetQuantity || 1,
      unit: p.product?.unit || "ขวด",
    }));

  const hasT14Withdrawal = t14Products.length > 0;

  const visits = initial?.demoPlotVisits || [];
  const t14Visits = visits.filter(
    (v: any) =>
      v.workTypeCode === "TYPE_14" || v.demoPlot?.plotType === "HATTACK",
  );
  const plot =
    t14Visits[0]?.demoPlot ||
    initial?.demoPlot ||
    null;
  const resolvedPlotId =
    t14Visits[0]?.demoPlotId ||
    plot?.id ||
    initial?.demoPlotId ||
    null;

  const initialPlotIds: string[] = t14Visits.length > 0
    ? t14Visits.map((v: any) => v.demoPlotId).filter(Boolean)
    : [resolvedPlotId].filter(Boolean);

  const matchedPlan = (fetchedHattackPlansWithPlots || []).find((plan) =>
    plan.plots.some(
      (p) => initialPlotIds.includes(p.id) || p.id === resolvedPlotId || (plot?.id && p.id === plot.id),
    ),
  );

  if (resolvedPlotId || plot || initialPlotIds.length > 0) {
    const primaryPlotId = resolvedPlotId || initialPlotIds[0] || plot?.id || null;
    const matchedPlotItem = matchedPlan?.plots.find(
      (p) => p.id === primaryPlotId || (plot?.id && p.id === plot.id),
    );

    return {
      mode: (plot?.id ? "EXISTING_PLOT" : "NEW_PLOT") as
        | "EXISTING_PLOT"
        | "NEW_PLOT",
      selectedPlanId:
        initial?.type14Data?.selectedPlanId || matchedPlan?.planId || null,
      demoPlotId: primaryPlotId,
      selectedPlotIds: initial?.type14Data?.selectedPlotIds || initialPlotIds,
      demoPlotIds: initial?.type14Data?.demoPlotIds || initialPlotIds,
      name: plot?.name || matchedPlotItem?.name || "แปลงแฮตแทค",
      storeId:
        plot?.customerId ||
        matchedPlotItem?.dealerId ||
        initial?.stores?.[0]?.storeId ||
        "",
      dealerName:
        plot?.customer?.name ||
        matchedPlotItem?.dealerName ||
        initial?.stores?.[0]?.storeName ||
        "",
      ownerName:
        plot?.ownerName ||
        plot?.farmerCustomer?.name ||
        matchedPlotItem?.ownerName ||
        "",
      cropCategory:
        plot?.cropCategory || matchedPlotItem?.cropCategory || null,
      cropName:
        plot?.customCropName ||
        plot?.cropName ||
        matchedPlotItem?.cropName ||
        null,
      areaRai: plot?.areaRai
        ? Number(plot.areaRai)
        : matchedPlotItem?.areaRai ?? null,
      treeCount: plot?.treeCount ?? (matchedPlotItem?.treeCount ?? null),
      province:
        plot?.province ||
        matchedPlotItem?.province ||
        initial?.province ||
        defaultProvince ||
        "",
      district:
        plot?.district ||
        matchedPlotItem?.district ||
        initial?.district ||
        defaultDistrict ||
        "",
      latitude: plot?.latitude ? String(plot.latitude) : "",
      longitude: plot?.longitude ? String(plot.longitude) : "",
      trackings: t14Visits.map((v: any) => ({
        id: v.id,
        visitDate: v.visitDate
          ? new Date(v.visitDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        daysSinceStart: v.daysSinceStart ?? 0,
        notes: v.notes || "",
        attachments: (v.attachments || []).map((att: any) => ({
          fileUrl: att.fileUrl,
          fileName: att.fileName,
          fileSize: att.fileSize,
          mimeType: att.mimeType,
        })),
      })),
      hasProductWithdrawal: hasT14Withdrawal,
      withdrawnProducts: hasT14Withdrawal ? t14Products : [],
    };
  }

  return {
    mode: "EXISTING_PLOT",
    selectedPlanId: null,
    demoPlotId: null,
    name: "",
    storeId: "",
    dealerName: "",
    ownerName: "",
    cropCategory: null,
    cropName: null,
    areaRai: null,
    treeCount: null,
    province: initial?.province || defaultProvince || "",
    district: initial?.district || defaultDistrict || "",
    trackings: [],
    hasProductWithdrawal: hasT14Withdrawal,
    withdrawnProducts: hasT14Withdrawal ? t14Products : [],
  };
}

export function useType14Form({
  initial = {},
  selectedWorkTypes = [],
  defaultProvince = "",
  defaultDistrict = "",
  fetchedHattackPlansWithPlots = [],
}: UseType14FormOptions): UseType14FormResult {
  const [type14Data, setType14Data] = useState<FormType14PlanInput>(() =>
    resolveInitialType14Data(
      initial,
      defaultProvince,
      defaultDistrict,
      fetchedHattackPlansWithPlots,
    ),
  );

  useEffect(() => {
    if (initial && Object.keys(initial).length > 0) {
      const resolved = resolveInitialType14Data(
        initial,
        defaultProvince,
        defaultDistrict,
        fetchedHattackPlansWithPlots,
      );
      if (
        resolved.demoPlotId ||
        (resolved.withdrawnProducts && resolved.withdrawnProducts.length > 0)
      ) {
        setType14Data(resolved);
      }
    }
  }, [initial, defaultProvince, defaultDistrict]);

  // Sync selectedPlanId once fetchedHattackPlansWithPlots are loaded if not yet resolved
  useEffect(() => {
    if (!fetchedHattackPlansWithPlots || fetchedHattackPlansWithPlots.length === 0) return;
    setType14Data((prev) => {
      if (prev.selectedPlanId) return prev;
      if (!prev.demoPlotId && !prev.name) return prev;
      const matched = fetchedHattackPlansWithPlots.find((plan) =>
        plan.plots.some(
          (p) =>
            (prev.demoPlotId && p.id === prev.demoPlotId) ||
            (prev.name && p.name === prev.name),
        ),
      );
      if (matched) {
        const plotMatch = matched.plots.find(
          (p) =>
            (prev.demoPlotId && p.id === prev.demoPlotId) ||
            (prev.name && p.name === prev.name),
        );
        const fallbackPlot = matched.plots.find((p) => p.dealerId);
        const fallbackProvincePlot = matched.plots.find((p) => p.province);
        const fallbackDistrictPlot = matched.plots.find((p) => p.district);
        return {
          ...prev,
          selectedPlanId: matched.planId,
          cropCategory: prev.cropCategory || plotMatch?.cropCategory || null,
          cropName: prev.cropName || plotMatch?.cropName || null,
          areaRai: prev.areaRai ?? (plotMatch?.areaRai ?? null),
          treeCount: prev.treeCount ?? (plotMatch?.treeCount ?? null),
          storeId: prev.storeId || plotMatch?.dealerId || fallbackPlot?.dealerId || "",
          dealerName: prev.dealerName || plotMatch?.dealerName || fallbackPlot?.dealerName || null,
          ownerName: prev.ownerName || plotMatch?.ownerName || null,
          province: prev.province || plotMatch?.province || fallbackProvincePlot?.province || "",
          district: prev.district || plotMatch?.district || fallbackDistrictPlot?.district || "",
        };
      }
      return prev;
    });
  }, [fetchedHattackPlansWithPlots]);

  const validateType14 = (): { isValid: boolean; error?: string } => {
    return validateType14FormValues({
      selectedWorkTypes,
      type14Data,
    });
  };

  const mapType14Payload = (customers: any[], products: any[] = []) => {
    const hasType14Selected = selectedWorkTypes.some(
      (t) => getWorkTypeCode(t) === "TYPE_14",
    );
    if (!hasType14Selected) {
      return { type14Data: undefined, planStores: [], planProducts: [] };
    }

    const planStores: Array<{
      workTypeCode: string;
      visitPurpose?: "FARMER" | "STORE" | null;
      storeId: string;
      storeName: string;
      province: string | null;
      remarks: string;
      notes: string;
    }> = [];

    const planProducts: Array<{
      workTypeCode: string;
      productId: string;
      productName: string | null;
      targetQuantity: number;
      isPriceOverridden: boolean;
      storeId?: string | null;
    }> = [];

    if (
      type14Data.hasProductWithdrawal &&
      type14Data.withdrawnProducts &&
      type14Data.withdrawnProducts.length > 0
    ) {
      type14Data.withdrawnProducts.forEach((wp) => {
        const pId =
          wp.productId || products.find((p) => p.name === wp.productName)?.id;
        if (pId) {
          const matchedP = products.find((p) => p.id === pId);
          planProducts.push({
            workTypeCode: "TYPE_14",
            productId: pId,
            productName: wp.productName || matchedP?.name || null,
            targetQuantity: wp.quantity ? Number(wp.quantity) : 1,
            isPriceOverridden: false,
            storeId: type14Data.storeId || null,
          });
        }
      });
    }

    if (type14Data.storeId?.trim()) {
      const dealer = customers.find((c) => c.id === type14Data.storeId);
      planStores.push({
        workTypeCode: "TYPE_14",
        visitPurpose: "STORE",
        storeId: type14Data.storeId,
        storeName: dealer?.name || type14Data.storeId,
        province: type14Data.province || null,
        remarks: type14Data.name || "ติดตามแปลงแฮทแทค",
        notes: `ติดตามแปลงแฮทแทค: ${type14Data.name || ""}`,
      });
    }

    const resolvedPlotIds: string[] = [];
    if (type14Data.selectedPlotIds && type14Data.selectedPlotIds.length > 0) {
      type14Data.selectedPlotIds.forEach((pid) => {
        if (!resolvedPlotIds.includes(pid)) resolvedPlotIds.push(pid);
      });
    } else if (type14Data.demoPlotId) {
      resolvedPlotIds.push(type14Data.demoPlotId);
    }

    const firstPlotId = resolvedPlotIds[0] || null;

    return {
      type14Data: {
        mode: "EXISTING_PLOT" as const,
        selectedPlanId: type14Data.selectedPlanId || null,
        demoPlotId: firstPlotId,
        demoPlotIds: resolvedPlotIds,
        selectedPlotIds: resolvedPlotIds,
        name: type14Data.name || "",
        storeId: type14Data.storeId || "",
        ownerName: type14Data.ownerName || null,
        province: type14Data.province || "",
        district: type14Data.district || "",
        latitude: type14Data.latitude || "",
        longitude: type14Data.longitude || "",
        trackings: [],
      },
      submittedDemoPlotId: firstPlotId,
      submittedDemoPlotIds: resolvedPlotIds,
      planStores,
      planProducts,
    };
  };

  return {
    type14Data,
    setType14Data,
    validateType14,
    mapType14Payload,
  };
}
