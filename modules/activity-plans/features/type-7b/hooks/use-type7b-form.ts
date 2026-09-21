import { useState, useMemo } from "react";
import { format } from "date-fns";
import { getWorkTypeCode } from "@/modules/activity-plans/constants";
import type {
  Type7DemoPlotItem,
  Type7DemoProductLine,
} from "@/modules/activity-plans/features/shared/form/types";

export interface UseType7bFormOptions {
  initial?: any;
  initDetails?: any;
  initialTypes?: string[];
  fetchedFollowUpDemoPlots?: any[];
  demoPlotsList?: any[];
  productsList?: any[];
  selectedWorkTypes?: string[];
  parentStartDate?: string;
}

export interface UseType7bFormResult {
  type7bItems: Type7DemoPlotItem[];
  setType7bItems: React.Dispatch<React.SetStateAction<Type7DemoPlotItem[]>>;
  followUpPlotsForType7B: any[];
  addType7bRow: () => void;
  updateType7bRow: (
    id: string,
    field: keyof Type7DemoPlotItem,
    val: any,
  ) => void;
  deleteType7bRow: (id: string) => void;
  validateType7b: () => { isValid: boolean; error?: string };
  mapType7bPayload: (products: any[]) => {
    submittedDemoPlotId: string | null;
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

export function useType7bForm({
  initial = {},
  initDetails,
  initialTypes = [],
  fetchedFollowUpDemoPlots = [],
  demoPlotsList = [],
  productsList = [],
  selectedWorkTypes = [],
  parentStartDate,
}: UseType7bFormOptions): UseType7bFormResult {
  const [type7bItems, setType7bItems] = useState<Type7DemoPlotItem[]>(() => {
    const isInitialType7B =
      initialTypes.some((t) => getWorkTypeCode(t) === "TYPE_7B") ||
      (initial as any)?.workTypes?.some(
        (wt: any) =>
          getWorkTypeCode(wt) === "TYPE_7B" ||
          wt?.activityType?.code === "TYPE_7B" ||
          wt === "TYPE_7B",
      );

    if (isInitialType7B && ((initial as any)?.demoPlot || (initial as any)?.demoPlotId)) {
      const dp = (initial as any)?.demoPlot;
      const fallbackPlotId = dp?.id || (initial as any)?.demoPlotId || "";

      const type7bProds: Type7DemoProductLine[] = ((initial as any)?.products || [])
        .filter((p: any) => p.workTypeCode === "TYPE_7B")
        .map((p: any, idx: number) => ({
          id: p.id || String(idx + 1),
          productId: p.productId,
          productName: p.productName || p.product?.name || "",
          quantity: p.targetQuantity || 1,
          unit: p.product?.unit || "",
        }));

      const has7bWithdrawal = isInitialType7B && type7bProds.length > 0;

      return [
        {
          id: fallbackPlotId || "1",
          plotActivityType: "FOLLOW_UP",
          demoPlotId: fallbackPlotId,
          existingPlotId: fallbackPlotId,
          existingPlotName: dp?.name || "",
          hasProductWithdrawal: has7bWithdrawal,
          withdrawnProducts: has7bWithdrawal ? type7bProds : [],
          plotName: dp?.name || "",
          storeId: dp?.customerId || "",
          ownerName: dp?.customer?.name || dp?.ownerName || "",
          cropCategory: dp?.cropCategory || "",
          cropName: dp?.cropName || "",
          customCropName: dp?.customCropName || "",
          areaRai: dp?.areaRai ? Number(dp.areaRai) : 0,
          treeCount: dp?.treeCount ?? 0,
          province: dp?.province || "",
          district: dp?.district || "",
          categoryId: dp?.categoryId || dp?.chemicalGroupId || "",
          chemicalGroupId: dp?.categoryId || dp?.chemicalGroupId || "",
          objective: dp?.objective || "",
          productId: type7bProds[0]?.productId || "",
          productName:
            type7bProds[0]?.productName ||
            (type7bProds[0] as any)?.product?.name ||
            "",
          demoProducts: [],
          startDate: format(
            new Date(dp?.startDate || new Date()),
            "yyyy-MM-dd",
          ),
          followUpDate: format(new Date(), "yyyy-MM-dd"),
          detail: (initial as any)?.objective || (initial as any)?.notes || "",
        },
      ];
    }

    if (
      initDetails?.type7bItems &&
      Array.isArray(initDetails.type7bItems) &&
      initDetails.type7bItems.length > 0
    ) {
      return initDetails.type7bItems;
    }

    if (
      initDetails?.type7Items &&
      Array.isArray(initDetails.type7Items) &&
      initDetails.type7Items.length > 0
    ) {
      const items = initDetails.type7Items.filter(
        (item: any) => item.plotActivityType === "FOLLOW_UP" || Boolean(item.existingPlotId),
      );
      if (items.length > 0) return items;
    }

    return [
      {
        id: "1",
        plotActivityType: "FOLLOW_UP",
        plotName: "",
        storeId: "",
        ownerName: "",
        province: "",
        district: "",
        categoryId: "",
        chemicalGroupId: "",
        productName: "",
        cropCategory: "",
        cropName: "",
        customCropName: "",
        areaRai: 0,
        treeCount: 0,
        startDate: format(new Date(), "yyyy-MM-dd"),
        followUpDate: parentStartDate || format(new Date(), "yyyy-MM-dd"),
        objective: "",
        demoProducts: [],
        hasProductWithdrawal: false,
        withdrawnProducts: [],
        plotsCount: "",
        detail: "",
      },
    ];
  });

  const followUpPlotsForType7B = useMemo(() => {
    const list = [...fetchedFollowUpDemoPlots];
    type7bItems.forEach((item) => {
      const targetPlotId = item.existingPlotId || item.demoPlotId;
      const targetPlotName = item.existingPlotName || item.plotName;
      if (targetPlotId || targetPlotName) {
        const exists = list.some(
          (p) =>
            (targetPlotId && p.id === targetPlotId) ||
            (targetPlotName && p.name === targetPlotName),
        );
        if (!exists) {
          const original = demoPlotsList.find(
            (p) =>
              (targetPlotId && p.id === targetPlotId) ||
              (targetPlotName && p.name === targetPlotName),
          );
          if (original) {
            list.push(original);
          } else if (
            (initial as any)?.demoPlot &&
            ((initial as any).demoPlot.id === targetPlotId ||
              (initial as any).demoPlot.name === targetPlotName)
          ) {
            const dp = (initial as any).demoPlot;
            const matchedProd = ((initial as any)?.products || []).find(
              (p: any) => p.workTypeCode === "TYPE_7B",
            );
            list.push({
              id: dp.id,
              code: dp.code || "",
              name: dp.name || targetPlotName || "",
              location:
                dp.district && dp.province
                  ? `${dp.district}, ${dp.province}`
                  : dp.province || "",
              targetCrop: dp.cropName || item.cropName || "",
              showcase:
                matchedProd?.productName ||
                matchedProd?.product?.name ||
                item.productName ||
                "",
              productId: matchedProd?.productId || item.productId || "",
              productName:
                matchedProd?.productName ||
                matchedProd?.product?.name ||
                item.productName ||
                "",
              ownerName:
                dp.customer?.name || dp.ownerName || item.ownerName || "",
              cropCategory: dp.cropCategory || item.cropCategory || "",
              cropName: dp.cropName || item.cropName || "",
              customCropName: dp.customCropName || item.customCropName || "",
              areaRai: dp.areaRai ? Number(dp.areaRai) : item.areaRai || 0,
              treeCount: dp.treeCount ?? (item.treeCount || 0),
              startDate: dp.startDate
                ? format(new Date(dp.startDate), "yyyy-MM-dd")
                : item.startDate || "",
              status: dp.status || "IN_PROGRESS",
              objective: dp.objective || undefined,
              experimentDetail: dp.experimentDetail || undefined,
            });
          } else if (targetPlotName || targetPlotId) {
            list.push({
              id: targetPlotId || targetPlotName || "",
              code: "",
              name: targetPlotName || targetPlotId || "",
              location: "",
              targetCrop: item.cropName || "",
              showcase: item.productName || "",
              ownerName: item.ownerName || "",
              cropCategory: item.cropCategory || "",
              cropName: item.cropName || "",
              areaRai: item.areaRai || 0,
              treeCount: item.treeCount || 0,
              startDate: item.startDate || "",
              status: "IN_PROGRESS",
            });
          }
        }
      }
    });
    return list;
  }, [fetchedFollowUpDemoPlots, type7bItems, demoPlotsList, initial]);

  const addType7bRow = () => {
    setType7bItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        plotActivityType: "FOLLOW_UP",
        plotName: "",
        storeId: "",
        ownerName: "",
        province: "",
        district: "",
        categoryId: "",
        chemicalGroupId: "",
        productName: "",
        cropCategory: "",
        cropName: "",
        customCropName: "",
        areaRai: 0,
        treeCount: 0,
        startDate: parentStartDate || format(new Date(), "yyyy-MM-dd"),
        followUpDate: parentStartDate || format(new Date(), "yyyy-MM-dd"),
        objective: "",
        demoProducts: [],
        hasProductWithdrawal: false,
        withdrawnProducts: [],
        plotsCount: "",
        detail: "",
      },
    ]);
  };

  const updateType7bRow = (
    id: string,
    field: keyof Type7DemoPlotItem,
    val: any,
  ) => {
    setType7bItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)),
    );
  };

  const deleteType7bRow = (id: string) => {
    setType7bItems((prev) => prev.filter((item) => item.id !== id));
  };

  const validateType7b = (): { isValid: boolean; error?: string } => {
    const hasType7BSelected = selectedWorkTypes.some(
      (t) => getWorkTypeCode(t) === "TYPE_7B",
    );
    if (!hasType7BSelected) {
      return { isValid: true };
    }

    if (type7bItems.length === 0) {
      return {
        isValid: false,
        error: "กรุณาเพิ่มรายการติดตามแปลงสาธิตอย่างน้อย 1 รายการ",
      };
    }

    return { isValid: true };
  };

  const mapType7bPayload = (products: any[]) => {
    const hasType7BPlan = selectedWorkTypes.some(
      (t) => getWorkTypeCode(t) === "TYPE_7B",
    );
    if (!hasType7BPlan) {
      return { submittedDemoPlotId: null, t7bObjective: null, planProducts: [] };
    }

    let submittedDemoPlotId: string | null = null;
    const planProducts: Array<{
      workTypeCode: string;
      productId: string;
      productName: string | null;
      targetQuantity: number;
      isPriceOverridden: boolean;
    }> = [];

    type7bItems.forEach((item) => {
      if (
        item.hasProductWithdrawal &&
        item.withdrawnProducts &&
        item.withdrawnProducts.length > 0
      ) {
        item.withdrawnProducts.forEach((wp) => {
          const pId =
            wp.productId ||
            products.find((p) => p.name === wp.productName)?.id;
          if (pId) {
            const matchedP = products.find((p) => p.id === pId);
            planProducts.push({
              workTypeCode: "TYPE_7B",
              productId: pId,
              productName: wp.productName || matchedP?.name || null,
              targetQuantity: wp.quantity ? Number(wp.quantity) : 1,
              isPriceOverridden: false,
            });
          }
        });
      }
      if (item.existingPlotId || item.demoPlotId) {
        submittedDemoPlotId =
          item.existingPlotId || item.demoPlotId || null;
      }
    });

    const t7bDetail = type7bItems[0]?.detail?.trim() || null;

    return {
      submittedDemoPlotId,
      t7bObjective: t7bDetail,
      planProducts,
    };
  };

  return {
    type7bItems,
    setType7bItems,
    followUpPlotsForType7B,
    addType7bRow,
    updateType7bRow,
    deleteType7bRow,
    validateType7b,
    mapType7bPayload,
  };
}
