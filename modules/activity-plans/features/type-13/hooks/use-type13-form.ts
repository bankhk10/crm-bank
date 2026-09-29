import { useState } from "react";
import { getWorkTypeCode } from "@/modules/activity-plans/constants";
import type {
  Type13PlotItem,
  DrugWithdrawalInput,
} from "@/modules/activity-plans/application/validations";

export interface UseType13FormOptions {
  initial?: any;
  selectedWorkTypes?: string[];
}

export interface UseType13FormResult {
  type13Plots: Type13PlotItem[];
  setType13Plots: React.Dispatch<React.SetStateAction<Type13PlotItem[]>>;
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
  const [type13Plots, setType13Plots] = useState<Type13PlotItem[]>(() => {
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
        const plotName = p.name || `แปลงแฮตแทค ${idx + 1}`;
        const plotId = p.demoPlotId || p.id || null;
        let withdrawalItems = p.withdrawalItems || [];
        let hasDrugWithdrawal = Boolean(p.hasDrugWithdrawal);

        // If not explicitly set in p, check if there are matching existing DW items
        if (!p.withdrawalItems && existingDwItems.length > 0) {
          const matched = findWithdrawalForPlot(plotId, plotName);
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
        const plotName = plot?.name || `แปลงแฮตแทค ${idx + 1}`;
        const plotId = plot?.id || null;
        const matched = findWithdrawalForPlot(plotId, plotName);

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
        name: "แปลงแฮตแทค 1",
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
    const hasType13Selected = selectedWorkTypes.some(
      (t) => getWorkTypeCode(t) === "TYPE_13",
    );
    if (!hasType13Selected) {
      return { isValid: true };
    }

    if (!type13Plots || type13Plots.length === 0) {
      return {
        isValid: false,
        error: "กรุณาเพิ่มข้อมูลแปลงแฮตแทคอย่างน้อย 1 แปลง",
      };
    }
    if (type13Plots.length > 10) {
      return {
        isValid: false,
        error: "เพิ่มแปลงแฮตแทคได้สูงสุดไม่เกิน 10 แปลง",
      };
    }
    for (let i = 0; i < type13Plots.length; i++) {
      const plot = type13Plots[i];
      const plotNum = i + 1;
      const plotLabel = plot.name?.trim() || `แปลงที่ ${plotNum}`;

      if (!plot.name?.trim()) {
        return {
          isValid: false,
          error: `กรุณากรอกชื่อแปลง (แปลงที่ ${plotNum})`,
        };
      }
      if (!plot.storeId?.trim()) {
        return {
          isValid: false,
          error: `กรุณาเลือกร้านค้า Dealer สำหรับ ${plotLabel}`,
        };
      }
      if (!plot.province?.trim()) {
        return {
          isValid: false,
          error: `กรุณาเลือกจังหวัดสำหรับ ${plotLabel}`,
        };
      }
      if (!plot.district?.trim()) {
        return {
          isValid: false,
          error: `กรุณาเลือกอำเภอสำหรับ ${plotLabel}`,
        };
      }

      // If plot has drug withdrawal enabled, validate withdrawal items
      if (plot.hasDrugWithdrawal) {
        const validWithdrawalItems = (plot.withdrawalItems || []).filter(
          (item) => item.productId && item.productId.trim() !== "",
        );

        if (validWithdrawalItems.length === 0) {
          return {
            isValid: false,
            error: `กรุณาระบุรายการยาที่ต้องการเบิกอย่างน้อย 1 รายการสำหรับ ${plotLabel}`,
          };
        }

        for (let j = 0; j < validWithdrawalItems.length; j++) {
          const item = validWithdrawalItems[j];
          const qty = Number(item.quantity);
          if (isNaN(qty) || qty <= 0) {
            return {
              isValid: false,
              error: `จำนวนยาที่ต้องการเบิกต้องมากกว่า 0 สำหรับ ${plotLabel}`,
            };
          }
        }
      }
    }

    return { isValid: true };
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

    type13Plots.forEach((plot) => {
      if (plot.storeId) {
        const dealer = customers.find((c) => c.id === plot.storeId);
        planStores.push({
          workTypeCode: "TYPE_13",
          visitPurpose: "STORE",
          storeId: plot.storeId,
          storeName: dealer?.name || plot.storeId,
          province: plot.province || null,
          remarks: plot.name,
          notes: `แปลงแฮตแทค: ${plot.name}`,
        });
      }
    });

    // Synthesize Drug Withdrawal payload from checked plots
    const checkedPlots = type13Plots.filter(
      (p) => p.hasDrugWithdrawal && p.withdrawalItems && p.withdrawalItems.length > 0,
    );

    let runningSortOrder = 0;
    const synthesizedDwItems = checkedPlots.flatMap((plot) =>
      (plot.withdrawalItems || [])
        .filter((item) => item.productId && item.productId.trim() !== "")
        .map((item) => ({
          id: item.id,
          demoPlotId: plot.demoPlotId || null,
          plotIdentifier: plot.name.trim(),
          productId: item.productId,
          productName: item.productName || null,
          quantity:
            typeof item.quantity === "number"
              ? item.quantity
              : parseFloat(String(item.quantity)) || 0,
          unit: item.unit || null,
          sortOrder: runningSortOrder++,
        })),
    );

    const drugWithdrawal: DrugWithdrawalInput = {
      hasDrugWithdrawal: synthesizedDwItems.length > 0,
      notes: (initial as any)?.drugWithdrawal?.notes || null,
      items: synthesizedDwItems,
    };

    return {
      type13Plots,
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
