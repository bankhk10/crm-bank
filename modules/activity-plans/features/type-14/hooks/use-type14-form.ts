import { useState } from "react";
import { format } from "date-fns";
import { getWorkTypeCode } from "@/modules/activity-plans/constants";
import type { Type14PlanInput as FormType14PlanInput } from "../shared/types";
import type { Type14PlanInput } from "@/modules/activity-plans/application/validations";
import { validateType14FormValues } from "../create/validation";

export interface UseType14FormOptions {
  initial?: any;
  selectedWorkTypes?: string[];
  defaultProvince?: string;
  defaultDistrict?: string;
}

export interface UseType14FormResult {
  type14Data: FormType14PlanInput;
  setType14Data: React.Dispatch<React.SetStateAction<FormType14PlanInput>>;
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
  const [type14Data, setType14Data] = useState<FormType14PlanInput>(() => {
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
      trackings: [],
    };
  });

  const validateType14 = (): { isValid: boolean; error?: string } => {
    return validateType14FormValues({
      selectedWorkTypes,
      type14Data,
    });
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
      remarks: type14Data.name || "ติดตามแปลงแฮทแทค",
      notes: `ติดตามแปลงแฮทแทค: ${type14Data.name || ""}`,
    });

    return {
      type14Data: {
        mode: "EXISTING_PLOT" as const,
        demoPlotId: type14Data.demoPlotId || null,
        name: type14Data.name || "",
        storeId: type14Data.storeId || "",
        ownerName: type14Data.ownerName || null,
        province: type14Data.province || "",
        district: type14Data.district || "",
        latitude: type14Data.latitude || "",
        longitude: type14Data.longitude || "",
        trackings: [],
      },
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
