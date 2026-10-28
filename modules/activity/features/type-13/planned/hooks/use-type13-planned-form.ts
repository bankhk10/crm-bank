import { useState, useCallback } from "react";
import type {
  Type13PlotItem,
  Type13WithdrawnProductLine,
} from "../../shared/types";
import { validateType13FormValues } from "../application/planned-validation";

export interface UseType13FormOptions {
  initial?: any;
  selectedWorkTypes?: string[];
}

export interface UseType13PlannedFormResult {
  type13Plots: Type13PlotItem[];
  setType13Plots: React.Dispatch<React.SetStateAction<Type13PlotItem[]>>;
  hasProductWithdrawal: boolean;
  setHasProductWithdrawal: React.Dispatch<React.SetStateAction<boolean>>;
  withdrawnProducts: Type13WithdrawnProductLine[];
  setWithdrawnProducts: React.Dispatch<
    React.SetStateAction<Type13WithdrawnProductLine[]>
  >;
  validateType13: () => { isValid: boolean; error?: string };
  mapType13Payload: (
    customers: any[],
    products?: any[],
  ) => {
    type13Data?: {
      hasProducts?: boolean;
      hasProductWithdrawal?: boolean;
      notes?: string | null;
      plots?: any[];
      products?: any[];
      withdrawnProducts?: any[];
    };
    type13Plots: Type13PlotItem[] | undefined;
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

export type UseType13FormResult = UseType13PlannedFormResult;

function resolveInitialType13Plots(initial: any = {}): Type13PlotItem[] {
  let plots: Type13PlotItem[] = [];

  if (
    initial?.type13?.plots &&
    Array.isArray(initial.type13.plots) &&
    initial.type13.plots.length > 0
  ) {
    plots = initial.type13.plots.map((p: any, idx: number) => {
      const plotProducts = p.products || [];
      const hasWithdrawal =
        p.hasProductWithdrawal !== undefined
          ? Boolean(p.hasProductWithdrawal)
          : plotProducts.length > 0;
      const withdrawnList: Type13WithdrawnProductLine[] = (
        p.withdrawnProducts || plotProducts
      ).map((prod: any, prodIdx: number) => ({
        id: prod.id || `withdrawn-${idx}-${prodIdx}`,
        productId: prod.productId || "",
        productName: prod.productName || prod.product?.name || "",
        quantity: prod.quantity != null ? Number(prod.quantity) : 1,
        unit: prod.unit || prod.product?.unit || "ขวด",
      }));

      return {
        id: p.id || `plot-${idx + 1}`,
        demoPlotId: p.demoPlotId || p.demoPlot?.id || null,
        name: p.plotName || p.name || "",
        storeId: p.storeId || p.store?.id || "",
        dealerName: p.dealerName || p.store?.name || null,
        ownerName: p.ownerName || "",
        province: p.province || p.store?.province || "",
        district: p.district || p.store?.district || "",
        subdistrict: p.subdistrict || p.store?.subdistrict || "",
        village: p.village || "",
        objective: p.objective || "",
        plannedPlotsCount: p.plannedPlotsCount != null ? p.plannedPlotsCount : "",
        actualPlotsCount:
          p.actualPlotsCount != null
            ? p.actualPlotsCount
            : p.result?.actualPlotsCount != null
              ? p.result.actualPlotsCount
              : Array.isArray(p.results) && p.results[0]?.actualPlotsCount != null
                ? p.results[0].actualPlotsCount
                : "",
        latitude: p.latitude != null ? String(p.latitude) : "",
        longitude: p.longitude != null ? String(p.longitude) : "",
        hasProductWithdrawal: hasWithdrawal,
        withdrawnProducts: withdrawnList,
        products: plotProducts,
        result: p.result || (Array.isArray(p.results) ? p.results[0] : null) || null,
        results: p.results || (p.result ? [p.result] : []),
      };
    });
  } else if (
    initial?.type13Plots &&
    Array.isArray(initial.type13Plots) &&
    initial.type13Plots.length > 0
  ) {
    plots = initial.type13Plots.map((p: any, idx: number) => {
      const plotProducts = p.products || [];
      const hasWithdrawal =
        p.hasProductWithdrawal !== undefined
          ? Boolean(p.hasProductWithdrawal)
          : plotProducts.length > 0;
      const withdrawnList: Type13WithdrawnProductLine[] = (
        p.withdrawnProducts || plotProducts
      ).map((prod: any, prodIdx: number) => ({
        id: prod.id || `withdrawn-${idx}-${prodIdx}`,
        productId: prod.productId || "",
        productName: prod.productName || prod.product?.name || "",
        quantity: prod.quantity != null ? Number(prod.quantity) : 1,
        unit: prod.unit || prod.product?.unit || "ขวด",
      }));

      return {
        id: p.id || `plot-${idx + 1}`,
        demoPlotId: p.demoPlotId || null,
        name: p.plotName || p.name || "",
        storeId: p.storeId || "",
        dealerName: p.dealerName || null,
        ownerName: p.ownerName || "",
        province: p.province || "",
        district: p.district || "",
        subdistrict: p.subdistrict || "",
        village: p.village || "",
        objective: p.objective || "",
        plannedPlotsCount: p.plannedPlotsCount != null ? p.plannedPlotsCount : "",
        actualPlotsCount:
          p.actualPlotsCount != null
            ? p.actualPlotsCount
            : p.result?.actualPlotsCount != null
              ? p.result.actualPlotsCount
              : Array.isArray(p.results) && p.results[0]?.actualPlotsCount != null
                ? p.results[0].actualPlotsCount
                : "",
        latitude: p.latitude != null ? String(p.latitude) : "",
        longitude: p.longitude != null ? String(p.longitude) : "",
        hasProductWithdrawal: hasWithdrawal,
        withdrawnProducts: withdrawnList,
        products: plotProducts,
        result: p.result || (Array.isArray(p.results) ? p.results[0] : null) || null,
        results: p.results || (p.result ? [p.result] : []),
      };
    });
  } else if (
    initial?.type13Targets &&
    Array.isArray(initial.type13Targets) &&
    initial.type13Targets.length > 0
  ) {
    plots = initial.type13Targets.map((t: any, idx: number) => {
      const plotProducts = t.products || [];
      const targetResult =
        (t.results && t.results[0]) ||
        (Array.isArray(initial.type13Results) &&
          initial.type13Results.find((r: any) => r.targetId === t.id)) ||
        (Array.isArray(initial.type13Results) && initial.type13Results[idx]);
      const hasWithdrawal =
        t.hasProductWithdrawal !== undefined
          ? Boolean(t.hasProductWithdrawal)
          : plotProducts.length > 0;
      const withdrawnList: Type13WithdrawnProductLine[] = (
        t.withdrawnProducts || plotProducts
      ).map((prod: any, prodIdx: number) => ({
        id: prod.id || `withdrawn-${idx}-${prodIdx}`,
        productId: prod.productId || "",
        productName: prod.productName || prod.product?.name || "",
        quantity: prod.quantity != null ? Number(prod.quantity) : 1,
        unit: prod.unit || prod.product?.unit || "ขวด",
      }));

      return {
        id: t.id || `plot-${idx + 1}`,
        demoPlotId: t.demoPlotId || t.id || null,
        plotIndex: t.plotIndex || idx + 1,
        name: t.plotName || t.name || `แปลงที่ ${idx + 1}`,
        plotName: t.plotName || t.name || `แปลงที่ ${idx + 1}`,
        storeId: t.storeId || t.store?.id || "",
        dealerName: t.dealerName || t.store?.name || null,
        ownerName: t.ownerName || "",
        province: t.province || t.store?.province || "",
        district: t.district || t.store?.district || "",
        subdistrict: t.subdistrict || t.store?.subdistrict || "",
        village: t.village || targetResult?.notes || "",
        objective: t.objective || "",
        plannedPlotsCount:
          t.plannedPlotsCount != null ? t.plannedPlotsCount : "",
        actualPlotsCount:
          targetResult?.actualPlotsCount != null
            ? targetResult.actualPlotsCount
            : "",
        latitude:
          t.latitude != null && String(t.latitude).trim() !== ""
            ? String(t.latitude)
            : targetResult?.actualLatitude != null
              ? String(targetResult.actualLatitude)
              : "",
        longitude:
          t.longitude != null && String(t.longitude).trim() !== ""
            ? String(t.longitude)
            : targetResult?.actualLongitude != null
              ? String(targetResult.actualLongitude)
              : "",
        hasProductWithdrawal: hasWithdrawal,
        withdrawnProducts: withdrawnList,
        products: plotProducts,
        result: targetResult || null,
        results: t.results || (targetResult ? [targetResult] : []),
      };
    });
  } else if (
    initial?.demoPlotVisits &&
    Array.isArray(initial.demoPlotVisits) &&
    initial.demoPlotVisits.length > 0
  ) {
    const hattackVisits = initial.demoPlotVisits.filter(
      (v: any) =>
        v.demoPlot?.plotType === "HATTACK" || v.workTypeCode === "TYPE_13",
    );
    if (hattackVisits.length > 0) {
      plots = hattackVisits.map((v: any, idx: number) => ({
        id: v.demoPlot?.id || `plot-${idx + 1}`,
        demoPlotId: v.demoPlot?.id || null,
        name: v.demoPlot?.name || "",
        storeId: v.demoPlot?.customerId || "",
        dealerName: v.demoPlot?.customer?.name || null,
        ownerName: v.demoPlot?.ownerName || "",
        province: v.demoPlot?.province || "",
        district: v.demoPlot?.district || "",
        subdistrict: "",
        village: "",
        objective: v.demoPlot?.objective || "",
        plannedPlotsCount: "",
        latitude: v.demoPlot?.latitude ? String(v.demoPlot.latitude) : "",
        longitude: v.demoPlot?.longitude ? String(v.demoPlot.longitude) : "",
        hasProductWithdrawal: false,
        withdrawnProducts: [],
        products: [],
      }));
    }
  }

  // Fallback for global products from legacy plan payload
  const globalWithdrawn = (
    initial?.type13?.products ||
    initial?.type13Products ||
    initial?.withdrawnProducts ||
    []
  ).map((p: any, idx: number) => ({
    id: p.id || `withdrawn-${idx}`,
    productId: p.productId || "",
    productName: p.productName || p.product?.name || "",
    quantity: p.quantity != null ? Number(p.quantity) : 1,
    unit: p.unit || p.product?.unit || "ขวด",
  }));

  if (
    plots.length > 0 &&
    globalWithdrawn.length > 0 &&
    !plots.some((p) => p.hasProductWithdrawal)
  ) {
    plots[0] = {
      ...plots[0],
      hasProductWithdrawal: true,
      withdrawnProducts: globalWithdrawn,
      products: globalWithdrawn,
    };
  }

  return plots;
}

export function useType13PlannedForm({
  initial = {},
  selectedWorkTypes = [],
}: UseType13FormOptions = {}): UseType13PlannedFormResult {
  const [type13Plots, setType13Plots] = useState<Type13PlotItem[]>(() =>
    resolveInitialType13Plots(initial),
  );

  const [hasProductWithdrawal, setHasProductWithdrawal] = useState<boolean>(() => {
    if (initial?.type13?.hasProducts !== undefined) {
      return Boolean(initial.type13.hasProducts);
    }
    return Boolean(
      initial?.type13Products?.length ||
        initial?.products?.some((p: any) => p.workTypeCode === "TYPE_13"),
    );
  });

  const [withdrawnProducts, setWithdrawnProducts] = useState<
    Type13WithdrawnProductLine[]
  >(() => {
    if (initial?.type13?.products && Array.isArray(initial.type13.products)) {
      return initial.type13.products.map((p: any, idx: number) => ({
        id: p.id || `withdrawn-${idx}`,
        productId: p.productId || "",
        productName: p.productName || p.product?.name || "",
        quantity: p.quantity != null ? Number(p.quantity) : 1,
        unit: p.unit || p.product?.unit || "ขวด",
      }));
    }
    return [];
  });

  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    const resolved = resolveInitialType13Plots(initial);
    if (resolved.length > 0) {
      setType13Plots(resolved);
    }
  }

  const validateType13 = useCallback(() => {
    return validateType13FormValues({
      selectedWorkTypes,
      type13Plots,
      hasProductWithdrawal,
      withdrawnProducts,
    });
  }, [selectedWorkTypes, type13Plots, hasProductWithdrawal, withdrawnProducts]);

  const mapType13Payload = useCallback(
    (customers: any[] = [], products: any[] = []) => {
      const isType13Active = selectedWorkTypes.some(
        (t) => t === "TYPE_13" || t === "ฉีดแปลงแฮตแทค" || t.includes("ฉีดแปลงแฮตแทค"),
      );

      if (!isType13Active || type13Plots.length === 0) {
        return {
          type13Data: undefined,
          type13Plots: undefined,
          planStores: [],
          planProducts: [],
        };
      }

      const planStores: any[] = [];
      const seenStores = new Set<string>();

      type13Plots.forEach((plot, idx) => {
        if (plot.storeId && !seenStores.has(plot.storeId)) {
          seenStores.add(plot.storeId);
          const matchedCust = customers.find((c) => c.id === plot.storeId);
          planStores.push({
            workTypeCode: "TYPE_13",
            visitPurpose: "STORE",
            storeId: plot.storeId,
            storeName: plot.dealerName || matchedCust?.name || `Dealer แปลงที่ ${idx + 1}`,
            province: plot.province || matchedCust?.province || null,
            remarks: `Dealer ฉีดแปลงแฮตแทค (${plot.name || `แปลงที่ ${idx + 1}`})`,
            notes: `แปลงแฮตแทค: ${plot.name || `แปลงที่ ${idx + 1}`}`,
          });
        }
      });

      const planProducts: any[] = [];
      const allWithdrawnProducts: Type13WithdrawnProductLine[] = [];
      const anyPlotWithdrawal = type13Plots.some((p) => p.hasProductWithdrawal);

      type13Plots.forEach((plot) => {
        if (plot.hasProductWithdrawal && plot.withdrawnProducts?.length) {
          plot.withdrawnProducts.forEach((p) => {
            if (p.productId) {
              allWithdrawnProducts.push(p);
              const matchedProd = products.find((prod) => prod.id === p.productId);
              planProducts.push({
                workTypeCode: "TYPE_13",
                productId: p.productId,
                productName: p.productName || matchedProd?.name || null,
                targetQuantity: p.quantity != null ? Number(p.quantity) : 1,
                isPriceOverridden: false,
                storeId: plot.storeId || null,
              });
            }
          });
        }
      });

      // Legacy fallback if no plot has per-plot withdrawal but global withdrawal is active
      if (!anyPlotWithdrawal && hasProductWithdrawal && withdrawnProducts.length > 0) {
        withdrawnProducts.forEach((p) => {
          if (p.productId) {
            allWithdrawnProducts.push(p);
            const matchedProd = products.find((prod) => prod.id === p.productId);
            planProducts.push({
              workTypeCode: "TYPE_13",
              productId: p.productId,
              productName: p.productName || matchedProd?.name || null,
              targetQuantity: p.quantity != null ? Number(p.quantity) : 1,
              isPriceOverridden: false,
              storeId: type13Plots[0]?.storeId || null,
            });
          }
        });
      }

      const isWithdrawalActive = anyPlotWithdrawal || hasProductWithdrawal;

      const type13Data = {
        hasProducts: isWithdrawalActive,
        hasProductWithdrawal: isWithdrawalActive,
        plots: type13Plots.map((p, idx) => ({
          ...p,
          plotIndex: idx + 1,
          objective: p.objective || null,
          hasProductWithdrawal: Boolean(p.hasProductWithdrawal),
          withdrawnProducts: p.hasProductWithdrawal ? (p.withdrawnProducts || []) : [],
          products: p.hasProductWithdrawal ? (p.withdrawnProducts || []) : [],
        })),
        products: allWithdrawnProducts,
        withdrawnProducts: allWithdrawnProducts,
      };

      return {
        type13Data,
        type13Plots,
        planStores,
        planProducts,
      };
    },
    [selectedWorkTypes, type13Plots, hasProductWithdrawal, withdrawnProducts],
  );

  return {
    type13Plots,
    setType13Plots,
    hasProductWithdrawal,
    setHasProductWithdrawal,
    withdrawnProducts,
    setWithdrawnProducts,
    validateType13,
    mapType13Payload,
  };
}

export const useType13Form = useType13PlannedForm;
