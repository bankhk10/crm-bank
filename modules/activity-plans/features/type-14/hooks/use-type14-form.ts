import { useState } from "react";
import { format } from "date-fns";
import { getWorkTypeCode } from "@/modules/activity-plans/constants";
import type { Type14PlanInput } from "@/modules/activity-plans/application/validations";

export interface UseType14FormOptions {
  initial?: any;
  selectedWorkTypes?: string[];
  defaultProvince?: string;
  defaultDistrict?: string;
}

export interface UseType14FormResult {
  type14Data: Type14PlanInput;
  setType14Data: React.Dispatch<React.SetStateAction<Type14PlanInput>>;
  validateType14: () => { isValid: boolean; error?: string };
  mapType14Payload: (customers: any[]) => {
    type14Data: Type14PlanInput | undefined;
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

export function useType14Form({
  initial = {},
  selectedWorkTypes = [],
  defaultProvince = "",
  defaultDistrict = "",
}: UseType14FormOptions): UseType14FormResult {
  const [type14Data, setType14Data] = useState<Type14PlanInput>(() => {
    if ((initial as any)?.type14Data) {
      return (initial as any).type14Data;
    }
    const visits = (initial as any)?.demoPlotVisits || [];
    const t14Visits = visits.filter(
      (v: any) =>
        v.workTypeCode === "TYPE_14" || v.demoPlot?.plotType === "HATTACK",
    );
    if (t14Visits.length > 0) {
      const firstVisit = t14Visits[0];
      const plot = firstVisit.demoPlot;
      return {
        mode: (plot?.id ? "EXISTING_PLOT" : "NEW_PLOT") as
          | "EXISTING_PLOT"
          | "NEW_PLOT",
        demoPlotId: plot?.id || null,
        name: plot?.name || "แปลงแฮตแทค",
        storeId: plot?.customerId || "",
        ownerName: plot?.ownerName || plot?.farmerCustomer?.name || "",
        province: plot?.province || (initial as any)?.province || defaultProvince || "",
        district: plot?.district || (initial as any)?.district || defaultDistrict || "",
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
      };
    }
    return {
      mode: "EXISTING_PLOT",
      demoPlotId: null,
      name: "",
      storeId: "",
      ownerName: "",
      province: (initial as any)?.province || defaultProvince || "",
      district: (initial as any)?.district || defaultDistrict || "",
      latitude: "",
      longitude: "",
      trackings: [
        {
          visitDate: (initial as any)?.startDate
            ? format(new Date((initial as any).startDate), "yyyy-MM-dd")
            : format(new Date(), "yyyy-MM-dd"),
          daysSinceStart: 7,
          notes: "",
          attachments: [],
        },
      ],
    };
  });

  const validateType14 = (): { isValid: boolean; error?: string } => {
    const hasType14Selected = selectedWorkTypes.some(
      (t) => getWorkTypeCode(t) === "TYPE_14",
    );
    if (!hasType14Selected) {
      return { isValid: true };
    }

    if (!type14Data.name?.trim()) {
      return {
        isValid: false,
        error: "กรุณากรอกหรือเลือกชื่อแปลงแฮตแทค (TYPE_14)",
      };
    }
    if (!type14Data.storeId?.trim()) {
      return {
        isValid: false,
        error: "กรุณาเลือกร้านค้าตัวแทนจำหน่าย (Dealer) สำหรับแปลงแฮตแทค",
      };
    }
    if (!type14Data.province?.trim()) {
      return {
        isValid: false,
        error: "กรุณาระบุจังหวัดของแปลงแฮตแทค",
      };
    }
    if (!type14Data.district?.trim()) {
      return {
        isValid: false,
        error: "กรุณาระบุอำเภอของแปลงแฮตแทค",
      };
    }
    if (!type14Data.latitude?.trim() || !type14Data.longitude?.trim()) {
      return {
        isValid: false,
        error: "กรุณาระบุพิกัด GPS (Latitude และ Longitude) ของแปลงแฮตแทค",
      };
    }
    if (!type14Data.trackings || type14Data.trackings.length === 0) {
      return {
        isValid: false,
        error: "กรุณาระบุข้อมูลการติดตามแปลงอย่างน้อย 1 รายการ",
      };
    }
    for (let i = 0; i < type14Data.trackings.length; i++) {
      const tr = type14Data.trackings[i];
      if (!tr.visitDate) {
        return {
          isValid: false,
          error: `กรุณาระบุวันที่ตรวจติดตาม (การติดตามครั้งที่ ${i + 1})`,
        };
      }
    }

    return { isValid: true };
  };

  const mapType14Payload = (customers: any[]) => {
    const hasType14Selected = selectedWorkTypes.some(
      (t) => getWorkTypeCode(t) === "TYPE_14",
    );
    if (!hasType14Selected || !type14Data.storeId) {
      return { type14Data: undefined, planStores: [] };
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

    const dealer = customers.find((c) => c.id === type14Data.storeId);
    planStores.push({
      workTypeCode: "TYPE_14",
      visitPurpose: "STORE",
      storeId: type14Data.storeId,
      storeName: dealer?.name || type14Data.storeId,
      province: type14Data.province || null,
      remarks: type14Data.name,
      notes: `ติดตามแปลงแฮทแทค: ${type14Data.name}`,
    });

    return {
      type14Data,
      planStores,
    };
  };

  return {
    type14Data,
    setType14Data,
    validateType14,
    mapType14Payload,
  };
}
