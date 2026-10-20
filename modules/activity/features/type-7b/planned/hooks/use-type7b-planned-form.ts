import { useState } from "react";
import type {
  Type7bPlanItem,
  Type7bValidationResult,
} from "../types/planned.types";
import type {
  Type7bWithdrawnProductLine,
  Type7bFollowUpPlanOption,
  Type7bDemoPlotOption,
  Type7bProductOption,
} from "../../shared/types";
import { validateType7bFormItems } from "../application/planned-validation";

export interface UseType7bPlannedFormOptions {
  initial?: any;
  initialItems?: Type7bPlanItem[];
  plotList?: Type7bDemoPlotOption[];
  followUpPlans?: Type7bFollowUpPlanOption[];
  productsList?: Type7bProductOption[];
}

export interface UseType7bPlannedFormResult {
  type7bItems: Type7bPlanItem[];
  items: Type7bPlanItem[];
  setType7bItems: React.Dispatch<React.SetStateAction<Type7bPlanItem[]>>;
  addType7bRow: () => void;
  updateType7bRow: (
    id: string,
    field: keyof Type7bPlanItem | string,
    val: any,
  ) => void;
  deleteType7bRow: (id: string) => void;
  validateType7b: () => Type7bValidationResult;
  mapType7bPayload: (products?: any[]) => {
    type7bData: {
      sourceActivityPlanId?: string | null;
      demoPlotId?: string | null;
      notes?: string | null;
      objective?: string | null;
      plots?: Array<{
        demoPlotId?: string | null;
        plotName?: string | null;
        farmerName?: string | null;
        ownerName?: string | null;
        province?: string | null;
        district?: string | null;
        cropCategory?: string | null;
        cropName?: string | null;
        areaRai?: number | null;
        treeCount?: number | null;
      }>;
      products?: Array<{
        productId: string;
        productName?: string | null;
        quantity: number;
        unit?: string | null;
        notes?: string | null;
      }>;
    } | null;
    submittedDemoPlotId: string | null;
    submittedDemoPlotIds: string[];
    t7bObjective: string | null;
    planProducts: Array<{
      workTypeCode: string;
      productId: string;
      productName: string | null;
      targetQuantity: number;
      isPriceOverridden: boolean;
    }>;
  };
}

const defaultItem: Type7bPlanItem = {
  id: "1",
  plotActivityType: "FOLLOW_UP",
  selectedPlanId: "",
  selectedPlotIds: [],
  demoPlotId: "",
  existingPlotId: "",
  existingPlotName: "",
  hasProductWithdrawal: false,
  withdrawnProducts: [],
  plotName: "",
  storeId: "",
  ownerName: "",
  farmerName: "",
  cropCategory: "",
  cropName: "",
  customCropName: "",
  areaRai: null,
  treeCount: null,
  province: "",
  district: "",
  objective: "",
  detail: "",
  productId: "",
  productName: "",
  demoProducts: [],
};

export function useType7bPlannedForm({
  initial,
  initialItems,
}: UseType7bPlannedFormOptions = {}): UseType7bPlannedFormResult {
  const [type7bItems, setType7bItems] = useState<Type7bPlanItem[]>(() => {
    if (initialItems && initialItems.length > 0) {
      return initialItems;
    }
    if (initial?.type7bPlots && initial.type7bPlots.length > 0) {
      return initial.type7bPlots;
    }
    return [{ ...defaultItem, id: Date.now().toString() }];
  });

  const addType7bRow = () => {
    const newItem: Type7bPlanItem = {
      ...defaultItem,
      id: Date.now().toString(),
    };
    setType7bItems((prev) => [...prev, newItem]);
  };

  const updateType7bRow = (
    id: string,
    field: keyof Type7bPlanItem | string,
    val: any,
  ) => {
    setType7bItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)),
    );
  };

  const deleteType7bRow = (id: string) => {
    setType7bItems((prev) => {
      if (prev.length <= 1) {
        return [{ ...defaultItem, id: Date.now().toString() }];
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const validateType7b = (): Type7bValidationResult => {
    return validateType7bFormItems(type7bItems);
  };

  const mapType7bPayload = (allProducts: any[] = []) => {
    if (!type7bItems || type7bItems.length === 0) {
      return {
        type7bData: null,
        submittedDemoPlotId: null,
        submittedDemoPlotIds: [],
        t7bObjective: null,
        planProducts: [],
      };
    }

    const firstItem = type7bItems[0];
    const allSelectedPlotIds = type7bItems.flatMap(
      (item) => item.selectedPlotIds || (item.demoPlotId ? [item.demoPlotId] : []),
    );
    const submittedDemoPlotId =
      firstItem.demoPlotId || firstItem.existingPlotId || allSelectedPlotIds[0] || null;

    const plotsPayload = type7bItems.flatMap((item) => {
      if (item.selectedPlotIds && item.selectedPlotIds.length > 0) {
        return item.selectedPlotIds.map((pId) => ({
          demoPlotId: pId,
          plotName: item.plotName || item.existingPlotName || "แปลงสาธิตติดตาม",
          farmerName: item.ownerName || item.farmerName || null,
          ownerName: item.ownerName || item.farmerName || null,
          cropCategory: item.cropCategory || null,
          cropName: item.cropName || null,
          areaRai: item.areaRai != null ? Number(item.areaRai) : null,
          treeCount: item.treeCount != null ? Number(item.treeCount) : null,
          province: item.province || null,
          district: item.district || null,
        }));
      }
      return [
        {
          demoPlotId: item.demoPlotId || item.existingPlotId || null,
          plotName: item.plotName || item.existingPlotName || "แปลงสาธิตติดตาม",
          farmerName: item.ownerName || item.farmerName || null,
          ownerName: item.ownerName || item.farmerName || null,
          cropCategory: item.cropCategory || null,
          cropName: item.cropName || null,
          areaRai: item.areaRai != null ? Number(item.areaRai) : null,
          treeCount: item.treeCount != null ? Number(item.treeCount) : null,
          province: item.province || null,
          district: item.district || null,
        },
      ];
    });

    // Withdrawn products
    const withdrawnProds: Type7bWithdrawnProductLine[] = type7bItems.flatMap(
      (item) => (item.hasProductWithdrawal ? item.withdrawnProducts || [] : []),
    );

    const validWithdrawn = withdrawnProds.filter((p) => Boolean(p.productId));

    const planProducts = validWithdrawn.map((p) => {
      const match = allProducts.find((prod) => prod.id === p.productId);
      return {
        workTypeCode: "TYPE_7B",
        productId: p.productId,
        productName: p.productName || match?.name || null,
        targetQuantity: Number(p.quantity) || 1,
        isPriceOverridden: false,
      };
    });

    const objective = firstItem.detail || firstItem.objective || "";

    const type7bData = {
      sourceActivityPlanId: firstItem.selectedPlanId || null,
      demoPlotId: submittedDemoPlotId,
      notes: objective || null,
      objective: objective || null,
      plots: plotsPayload,
      products: validWithdrawn.map((p) => ({
        productId: p.productId,
        productName: p.productName || null,
        quantity: Number(p.quantity) || 1,
        unit: p.unit || null,
        notes: p.notes || null,
      })),
    };

    return {
      type7bData,
      submittedDemoPlotId,
      submittedDemoPlotIds: allSelectedPlotIds,
      t7bObjective: objective || null,
      planProducts,
    };
  };

  return {
    type7bItems,
    items: type7bItems,
    setType7bItems,
    addType7bRow,
    updateType7bRow,
    deleteType7bRow,
    validateType7b,
    mapType7bPayload,
  };
}

// Backward-compatible alias
export const useType7bForm = useType7bPlannedForm;
