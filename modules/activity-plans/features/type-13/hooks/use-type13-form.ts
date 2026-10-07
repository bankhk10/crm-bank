import { useState } from "react";
import { getWorkTypeCode } from "@/modules/activity-plans/constants";
import type { Type13PlotItem as FormType13PlotItem } from "../shared/types";
import type { Type13PlotItem } from "@/modules/activity-plans/application/validations";
import { validateType13FormValues } from "../create/validation";

export interface UseType13FormOptions {
  initial?: any;
  selectedWorkTypes?: string[];
}

export interface UseType13FormResult {
  type13Plots: FormType13PlotItem[];
  setType13Plots: React.Dispatch<React.SetStateAction<FormType13PlotItem[]>>;
  validateType13: () => { isValid: boolean; error?: string };
  mapType13Payload: (customers: any[]) => {
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
  };
}

export function useType13Form({
  initial = {},
  selectedWorkTypes = [],
}: UseType13FormOptions): UseType13FormResult {
  const [type13Plots, setType13Plots] = useState<FormType13PlotItem[]>(() => {
    if (
      (initial as any)?.type13Plots &&
      Array.isArray((initial as any).type13Plots)
    ) {
      return (initial as any).type13Plots.map((p: any, idx: number) => {
        const plotName = p.name || "";

        return {
          id: p.id || `plot-${idx + 1}`,
          demoPlotId: p.demoPlotId || null,
          name: plotName,
          storeId: p.storeId || "",
          ownerName: p.ownerName || "",
          province: p.province || "",
          district: p.district || "",
          products: [],
        };
      });
    }

    const visits = (initial as any)?.demoPlotVisits || [];
    const hattackPlots = visits.filter(
      (v: any) =>
        v.demoPlot?.plotType === "HATTACK" || v.workTypeCode === "TYPE_13",
    );

    if (hattackPlots.length > 0) {
      return hattackPlots.map((v: any, idx: number) => {
        const plot = v.demoPlot;
        const plotName = plot?.name || "";

        return {
          id: plot?.id || `plot-${idx + 1}`,
          demoPlotId: plot?.id || null,
          name: plotName,
          storeId: plot?.customerId || "",
          ownerName: plot?.ownerName || "",
          province: plot?.province || "",
          district: plot?.district || "",
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
  });

  const validateType13 = (): { isValid: boolean; error?: string } => {
    return validateType13FormValues({
      selectedWorkTypes,
      type13Plots,
    });
  };

  const mapType13Payload = (customers: any[]) => {
    const hasType13Selected = selectedWorkTypes.some(
      (t) => getWorkTypeCode(t) === "TYPE_13",
    );
    if (!hasType13Selected || !type13Plots || type13Plots.length === 0) {
      return { type13Plots: undefined, planStores: [] };
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

    return {
      type13Plots: mappedType13Plots,
      planStores,
    };
  };

  return {
    type13Plots,
    setType13Plots,
    validateType13,
    mapType13Payload,
  };
}

