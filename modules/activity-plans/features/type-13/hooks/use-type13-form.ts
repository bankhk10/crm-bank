import { useState } from "react";
import { getWorkTypeCode } from "@/modules/activity-plans/constants";
import type { Type13PlotItem as FormType13PlotItem } from "../shared/types";
import type { DrugWithdrawalInput, Type13PlotItem } from "@/modules/activity-plans/application/validations";
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
    drugWithdrawal?: DrugWithdrawalInput;
  };
}

export function useType13Form({
  initial = {},
  selectedWorkTypes = [],
}: UseType13FormOptions): UseType13FormResult {
  const [type13Plots, setType13Plots] = useState<FormType13PlotItem[]>(() => {
    const rawDw = (initial as any)?.drugWithdrawal;
    const existingDwItems: any[] = rawDw?.items && Array.isArray(rawDw.items) ? rawDw.items : [];

    // Helper to find withdrawal items for a given plot
    const findWithdrawalForPlot = (demoPlotId?: string | null, plotName?: string | null) => {
      const matched = existingDwItems.filter((item) => {
        if (demoPlotId && item.demoPlotId && item.demoPlotId === demoPlotId) {
          return true;
        }
        if (plotName && item.plotIdentifier && item.plotIdentifier.trim() === plotName.trim()) {
          return true;
        }
        return false;
      });
      return matched.map((item, idx) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName || item.product?.name || null,
        quantity: Number(item.quantity) || 1,
        unit: item.unit || item.product?.unit || null,
        sortOrder: item.sortOrder ?? idx,
      }));
    };

    if (
      (initial as any)?.type13Plots &&
      Array.isArray((initial as any).type13Plots)
    ) {
      return (initial as any).type13Plots.map((p: any, idx: number) => {
        const plotName = p.name || "";
        const plotId = p.demoPlotId || p.id || null;
        let withdrawalItems = p.withdrawalItems || [];
        let hasDrugWithdrawal = Boolean(p.hasDrugWithdrawal);

        // If not explicitly set in p, check if there are matching existing DW items
        if (!p.withdrawalItems && existingDwItems.length > 0) {
          const matched = findWithdrawalForPlot(plotId, plotName || `แปลงที่ ${idx + 1}`);
          if (matched.length > 0) {
            hasDrugWithdrawal = true;
            withdrawalItems = matched;
          }
        }

        return {
          id: p.id || `plot-${idx + 1}`,
          demoPlotId: p.demoPlotId || null,
          name: plotName,
          storeId: p.storeId || "",
          ownerName: p.ownerName || "",
          province: p.province || "",
          district: p.district || "",
          products: [],
          hasDrugWithdrawal,
          withdrawalItems,
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
        const plotId = plot?.id || null;
        const matched = findWithdrawalForPlot(plotId, plotName || `แปลงที่ ${idx + 1}`);

        return {
          id: plot?.id || `plot-${idx + 1}`,
          demoPlotId: plot?.id || null,
          name: plotName,
          storeId: plot?.customerId || "",
          ownerName: plot?.customer?.name || plot?.ownerName || "",
          province: plot?.province || "",
          district: plot?.district || "",
          products: [],
          hasDrugWithdrawal: matched.length > 0,
          withdrawalItems: matched,
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
        hasDrugWithdrawal: false,
        withdrawalItems: [],
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

    // Synthesize Drug Withdrawal payload from checked plots
    const checkedPlots = type13Plots.filter(
      (p) => p.hasDrugWithdrawal && p.withdrawalItems && p.withdrawalItems.length > 0,
    );

    let runningSortOrder = 0;
    const synthesizedDwItems = checkedPlots.flatMap((plot, cpIdx) => {
      const originalIdx = type13Plots.indexOf(plot);
      const plotIdentifier =
        plot.name?.trim() ||
        `แปลงที่ ${originalIdx >= 0 ? originalIdx + 1 : cpIdx + 1}`;
      return (plot.withdrawalItems || [])
        .filter((item) => item.productId && item.productId.trim() !== "")
        .map((item) => ({
          id: item.id,
          demoPlotId: plot.demoPlotId || null,
          plotIdentifier,
          productId: item.productId,
          productName: item.productName || null,
          quantity:
            typeof item.quantity === "number"
              ? item.quantity
              : parseFloat(String(item.quantity)) || 0,
          unit: item.unit || null,
          sortOrder: runningSortOrder++,
        }));
    });

    const drugWithdrawal: DrugWithdrawalInput = {
      hasDrugWithdrawal: synthesizedDwItems.length > 0,
      notes: (initial as any)?.drugWithdrawal?.notes || null,
      items: synthesizedDwItems,
    };

    const mappedType13Plots = type13Plots.map((plot) => ({
      id: plot.id,
      demoPlotId: plot.demoPlotId || null,
      name: plot.name || "",
      storeId: plot.storeId,
      ownerName: plot.ownerName || null,
      province: plot.province,
      district: plot.district,
      hasDrugWithdrawal: Boolean(plot.hasDrugWithdrawal),
      products: (plot.products || []).map((p) => ({
        id: p.id,
        productId: p.productId,
        productName: p.productName || null,
        quantity: typeof p.quantity === "number" ? p.quantity : Number(p.quantity) || 1,
        unit: p.unit || null,
      })),
      withdrawalItems: (plot.withdrawalItems || []).map((w, idx) => ({
        id: w.id,
        productId: w.productId,
        productName: w.productName || null,
        quantity: typeof w.quantity === "number" ? w.quantity : Number(w.quantity) || 0,
        unit: w.unit || null,
        sortOrder: w.sortOrder ?? idx,
      })),
    }));

    return {
      type13Plots: mappedType13Plots,
      planStores,
      drugWithdrawal,
    };
  };

  return {
    type13Plots,
    setType13Plots,
    validateType13,
    mapType13Payload,
  };
}
