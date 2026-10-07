import { useState, useEffect } from "react";
import { getWorkTypeCode } from "@/modules/activity-plans/constants";
import type {
  Type13PlotItem as FormType13PlotItem,
  Type13WithdrawnProductLine,
} from "../shared/types";
import type { Type13PlotItem } from "@/modules/activity-plans/application/validations";
import { validateType13FormValues } from "../create/validation";

export interface UseType13FormOptions {
  initial?: any;
  selectedWorkTypes?: string[];
}

export interface UseType13FormResult {
  type13Plots: FormType13PlotItem[];
  setType13Plots: React.Dispatch<React.SetStateAction<FormType13PlotItem[]>>;
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

function resolveInitialType13Plots(initial: any = {}): FormType13PlotItem[] {
  if (
    (initial as any)?.type13?.plots &&
    Array.isArray((initial as any).type13.plots) &&
    (initial as any).type13.plots.length > 0
  ) {
    return (initial as any).type13.plots.map((p: any, idx: number) => ({
      id: p.id || `plot-${idx + 1}`,
      demoPlotId: p.demoPlotId || p.demoPlot?.id || null,
      name: p.plotName || p.name || "",
      storeId: p.storeId || p.store?.id || "",
      dealerName: p.dealerName || p.store?.name || null,
      ownerName: p.ownerName || "",
      province: p.province || p.store?.province || "",
      district: p.district || p.store?.district || "",
      latitude: p.latitude != null ? String(p.latitude) : "",
      longitude: p.longitude != null ? String(p.longitude) : "",
      products: [],
    }));
  }

  if (
    (initial as any)?.type13Plots &&
    Array.isArray((initial as any).type13Plots) &&
    (initial as any).type13Plots.length > 0
  ) {
    return (initial as any).type13Plots.map((p: any, idx: number) => ({
      id: p.id || `plot-${idx + 1}`,
      demoPlotId: p.demoPlotId || null,
      name: p.plotName || p.name || "",
      storeId: p.storeId || "",
      dealerName: p.dealerName || null,
      ownerName: p.ownerName || "",
      province: p.province || "",
      district: p.district || "",
      latitude: p.latitude != null ? String(p.latitude) : "",
      longitude: p.longitude != null ? String(p.longitude) : "",
      products: [],
    }));
  }

  const visits = (initial as any)?.demoPlotVisits || [];
  const hattackPlots = visits.filter(
    (v: any) =>
      v.demoPlot?.plotType === "HATTACK" || v.workTypeCode === "TYPE_13",
  );

  if (hattackPlots.length > 0) {
    const seenPlotIds = new Set<string>();
    const uniquePlots = hattackPlots.filter((v: any) => {
      const pid = v.demoPlot?.id || v.demoPlotId;
      if (!pid) return true;
      if (seenPlotIds.has(pid)) return false;
      seenPlotIds.add(pid);
      return true;
    });

    return uniquePlots.map((v: any, idx: number) => {
      const plot = v.demoPlot;
      const plotName = plot?.name || "";

      return {
        id: plot?.id || `plot-${idx + 1}`,
        demoPlotId: plot?.id || v.demoPlotId || null,
        name: plotName,
        storeId: plot?.customerId || "",
        dealerName: plot?.customer?.name || plot?.dealerName || null,
        ownerName: plot?.ownerName || plot?.customer?.name || "",
        province: plot?.province || plot?.customer?.province || "",
        district: plot?.district || plot?.customer?.district || "",
        latitude: plot?.latitude != null ? String(plot.latitude) : "",
        longitude: plot?.longitude != null ? String(plot.longitude) : "",
        products: [],
      };
    });
  }

  return [
    {
      id: `plot-${Date.now()}-1`,
      demoPlotId: null,
      name: "",
      storeId: "",
      ownerName: "",
      province: "",
      district: "",
      products: [],
    },
  ];
}

export function useType13Form({
  initial = {},
  selectedWorkTypes = [],
}: UseType13FormOptions): UseType13FormResult {
  // Hydrate withdrawn products for TYPE_13
  const t13Products: Type13WithdrawnProductLine[] = (
    (initial as any)?.type13?.products || []
  ).map((p: any, idx: number) => ({
    id: p.id || String(idx + 1),
    productId: p.productId,
    productName: p.productName || p.product?.name || "",
    quantity: Number(p.quantity) || 1,
    unit: p.unit || p.product?.unit || "ขวด",
  }));

  const fallbackProducts: Type13WithdrawnProductLine[] = (
    (initial as any)?.products || []
  )
    .filter((p: any) => p.workTypeCode === "TYPE_13")
    .map((p: any, idx: number) => ({
      id: p.id || String(idx + 1),
      productId: p.productId,
      productName: p.productName || p.product?.name || "",
      quantity: p.targetQuantity || 1,
      unit: p.product?.unit || "ขวด",
    }));

  const resolvedProducts = t13Products.length > 0 ? t13Products : fallbackProducts;
  const hasT13Withdrawal = Boolean((initial as any)?.type13?.hasProducts || resolvedProducts.length > 0);

  const [hasProductWithdrawal, setHasProductWithdrawal] = useState<boolean>(
    () => hasT13Withdrawal,
  );
  const [withdrawnProducts, setWithdrawnProducts] = useState<
    Type13WithdrawnProductLine[]
  >(() => (hasT13Withdrawal ? resolvedProducts : []));

  const [type13Plots, setType13Plots] = useState<FormType13PlotItem[]>(() =>
    resolveInitialType13Plots(initial),
  );

  useEffect(() => {
    if (initial && Object.keys(initial).length > 0) {
      if ((initial as any)?.type13?.products && (initial as any).type13.products.length > 0) {
        const prods = (initial as any).type13.products.map((p: any, idx: number) => ({
          id: p.id || String(idx + 1),
          productId: p.productId,
          productName: p.productName || p.product?.name || "",
          quantity: Number(p.quantity) || 1,
          unit: p.unit || p.product?.unit || "ขวด",
        }));
        setHasProductWithdrawal(true);
        setWithdrawnProducts(prods);
      } else {
        const prods = ((initial as any)?.products || [])
          .filter((p: any) => p.workTypeCode === "TYPE_13")
          .map((p: any, idx: number) => ({
            id: p.id || String(idx + 1),
            productId: p.productId,
            productName: p.productName || p.product?.name || "",
            quantity: p.targetQuantity || 1,
            unit: p.product?.unit || "ขวด",
          }));
        if (prods.length > 0) {
          setHasProductWithdrawal(true);
          setWithdrawnProducts(prods);
        }
      }

      const plots = resolveInitialType13Plots(initial);
      const hasAnyRealPlot = plots.some(
        (p) => Boolean(p.demoPlotId || p.name || p.storeId),
      );
      if (hasAnyRealPlot) {
        setType13Plots(plots);
      }
    }
  }, [initial]);

  const validateType13 = (): { isValid: boolean; error?: string } => {
    return validateType13FormValues({
      selectedWorkTypes,
      type13Plots,
      hasProductWithdrawal,
      withdrawnProducts,
    });
  };

  const mapType13Payload = (customers: any[], products: any[] = []) => {
    const hasType13Selected = selectedWorkTypes.some(
      (t) => getWorkTypeCode(t) === "TYPE_13",
    );
    if (!hasType13Selected || !type13Plots || type13Plots.length === 0) {
      return { type13Plots: undefined, planStores: [], planProducts: [] };
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
      hasProductWithdrawal &&
      withdrawnProducts &&
      withdrawnProducts.length > 0
    ) {
      withdrawnProducts.forEach((wp) => {
        const pId =
          wp.productId || products.find((p) => p.name === wp.productName)?.id;
        if (pId) {
          const matchedP = products.find((p) => p.id === pId);
          planProducts.push({
            workTypeCode: "TYPE_13",
            productId: pId,
            productName: wp.productName || matchedP?.name || null,
            targetQuantity: wp.quantity ? Number(wp.quantity) : 1,
            isPriceOverridden: false,
            storeId: type13Plots[0]?.storeId || null,
          });
        }
      });
    }

    type13Plots.forEach((plot, pIdx) => {
      if (plot.storeId) {
        const dealer = customers.find((c) => c.id === plot.storeId);
        const plotLabel = `แปลงที่ ${pIdx + 1}`;
        planStores.push({
          workTypeCode: "TYPE_13",
          visitPurpose: "STORE",
          storeId: plot.storeId,
          storeName: dealer?.name || plot.storeId,
          province: plot.province || null,
          remarks: plot.name || plotLabel,
          notes: `แปลงแฮตแทค: ${plot.name || plotLabel}`,
        });
      }
    });

    const mappedType13Plots = type13Plots.map((plot) => ({
      id: plot.id,
      demoPlotId: plot.demoPlotId || null,
      name: plot.name || "",
      storeId: plot.storeId,
      ownerName: plot.ownerName || null,
      province: plot.province,
      district: plot.district,
      products: (plot.products || []).map((p) => ({
        id: p.id,
        productId: p.productId,
        productName: p.productName || null,
        quantity: typeof p.quantity === "number" ? p.quantity : Number(p.quantity) || 1,
        unit: p.unit || null,
      })),
    }));

    const mappedType13Data = {
      hasProducts: hasProductWithdrawal,
      hasProductWithdrawal,
      withdrawnProducts: hasProductWithdrawal ? withdrawnProducts : [],
      products: hasProductWithdrawal
        ? withdrawnProducts.map((p) => ({
            productId: p.productId,
            productName: p.productName || null,
            quantity: typeof p.quantity === "number" ? p.quantity : Number(p.quantity) || 1,
            unit: p.unit || null,
          }))
        : [],
      plots: mappedType13Plots.map((p, idx) => ({
        ...p,
        plotIndex: idx + 1,
      })),
    };

    return {
      type13Data: mappedType13Data,
      type13Plots: mappedType13Plots,
      planStores,
      planProducts,
    };
  };

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


