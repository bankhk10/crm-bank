import { useState } from "react";
import { getWorkTypeCode } from "@/modules/activity-plans/constants";
import type { Type13PlotItem } from "@/modules/activity-plans/application/validations";

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
  };
}

export function useType13Form({
  initial = {},
  selectedWorkTypes = [],
}: UseType13FormOptions): UseType13FormResult {
  const [type13Plots, setType13Plots] = useState<Type13PlotItem[]>(() => {
    if (
      (initial as any)?.type13Plots &&
      Array.isArray((initial as any).type13Plots)
    ) {
      return (initial as any).type13Plots;
    }
    const visits = (initial as any)?.demoPlotVisits || [];
    const hattackPlots = visits.filter(
      (v: any) =>
        v.demoPlot?.plotType === "HATTACK" || v.workTypeCode === "TYPE_13",
    );
    if (hattackPlots.length > 0) {
      return hattackPlots.map((v: any, idx: number) => {
        const plot = v.demoPlot;
        return {
          id: plot?.id || `plot-${idx + 1}`,
          demoPlotId: plot?.id,
          name: plot?.name || `แปลงแฮตแทค ${idx + 1}`,
          storeId: plot?.customerId || "",
          ownerName: plot?.customer?.name || plot?.ownerName || "",
          province: plot?.province || "",
          district: plot?.district || "",
          products: (plot?.demoProducts || []).map((dp: any, pIdx: number) => ({
            id: dp.id || `p-${idx}-${pIdx}`,
            productId: dp.productId,
            productName: dp.product?.name || dp.productName || "",
            quantity: dp.quantity ? Number(dp.quantity) : 1,
            unit: dp.unit || dp.product?.unit || "",
          })),
        };
      });
    }
    return [
      {
        id: `plot-${Date.now()}-1`,
        name: "แปลงแฮตแทค 1",
        storeId: "",
        province: "",
        district: "",
        products: [
          {
            id: `p-${Date.now()}-1`,
            productId: "",
            productName: "",
            quantity: 1,
            unit: "",
          },
        ],
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
      if (!plot.name?.trim()) {
        return {
          isValid: false,
          error: `กรุณากรอกชื่อแปลง (แปลงที่ ${plotNum})`,
        };
      }
      if (!plot.storeId?.trim()) {
        return {
          isValid: false,
          error: `กรุณาเลือกร้านค้า Dealer สำหรับแปลงที่ ${plotNum}`,
        };
      }
      if (!plot.province?.trim()) {
        return {
          isValid: false,
          error: `กรุณาเลือกจังหวัดสำหรับแปลงที่ ${plotNum}`,
        };
      }
      if (!plot.district?.trim()) {
        return {
          isValid: false,
          error: `กรุณาเลือกอำเภอสำหรับแปลงที่ ${plotNum}`,
        };
      }
      const validProds = (plot.products || []).filter(
        (p) => p.productId && p.productId.trim() !== "",
      );
      if (validProds.length === 0) {
        return {
          isValid: false,
          error: `กรุณาเลือกตัวยา/สินค้าอย่างน้อย 1 รายการสำหรับแปลงที่ ${plotNum}`,
        };
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

    return {
      type13Plots,
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
