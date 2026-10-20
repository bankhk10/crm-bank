import { useState, useEffect, useCallback } from "react";
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
  if (
    initial?.type13?.plots &&
    Array.isArray(initial.type13.plots) &&
    initial.type13.plots.length > 0
  ) {
    return initial.type13.plots.map((p: any, idx: number) => ({
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
      plannedPlotsCount: p.plannedPlotsCount != null ? p.plannedPlotsCount : "",
      latitude: p.latitude != null ? String(p.latitude) : "",
      longitude: p.longitude != null ? String(p.longitude) : "",
      products: [],
    }));
  }

  if (
    initial?.type13Plots &&
    Array.isArray(initial.type13Plots) &&
    initial.type13Plots.length > 0
  ) {
    return initial.type13Plots.map((p: any, idx: number) => ({
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
      plannedPlotsCount: p.plannedPlotsCount != null ? p.plannedPlotsCount : "",
      latitude: p.latitude != null ? String(p.latitude) : "",
      longitude: p.longitude != null ? String(p.longitude) : "",
      products: p.products || [],
    }));
  }

  if (
    initial?.demoPlotVisits &&
    Array.isArray(initial.demoPlotVisits) &&
    initial.demoPlotVisits.length > 0
  ) {
    const hattackVisits = initial.demoPlotVisits.filter(
      (v: any) =>
        v.demoPlot?.plotType === "HATTACK" || v.workTypeCode === "TYPE_13",
    );
    if (hattackVisits.length > 0) {
      return hattackVisits.map((v: any, idx: number) => ({
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
        plannedPlotsCount: "",
        latitude: v.demoPlot?.latitude ? String(v.demoPlot.latitude) : "",
        longitude: v.demoPlot?.longitude ? String(v.demoPlot.longitude) : "",
        products: [],
      }));
    }
  }

  return [];
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

  useEffect(() => {
    if (!initial) return;
    const resolved = resolveInitialType13Plots(initial);
    if (resolved.length > 0) {
      setType13Plots(resolved);
    }
  }, [initial]);

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
      if (hasProductWithdrawal && withdrawnProducts.length > 0) {
        withdrawnProducts.forEach((p) => {
          if (p.productId) {
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

      const type13Data = {
        hasProducts: hasProductWithdrawal,
        hasProductWithdrawal,
        plots: type13Plots.map((p, idx) => ({
          ...p,
          plotIndex: idx + 1,
        })),
        products: hasProductWithdrawal ? withdrawnProducts : [],
        withdrawnProducts: hasProductWithdrawal ? withdrawnProducts : [],
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
