import { useState } from "react";
import { format } from "date-fns";
import { isFieldDayItem, getWorkTypeCode } from "@/modules/activity-plans/constants";
import type {
  Type7DemoPlotItem,
  Type7DemoProductLine,
} from "../shared/types";
import { validateType7aFormItems } from "../create/validation";


export interface UseType7aFormOptions {
  initial?: any;
  initDetails?: any;
  initialTypes?: string[];
  customersList?: any[];
  productsList?: any[];
  productCategoriesList?: any[];
  selectedWorkTypes?: string[];
  parentStartDate?: string;
}

export interface UseType7aFormResult {
  type7aItems: Type7DemoPlotItem[];
  setType7aItems: React.Dispatch<React.SetStateAction<Type7DemoPlotItem[]>>;
  addType7aRow: () => void;
  updateType7aRow: (
    id: string,
    field: keyof Type7DemoPlotItem,
    val: any,
  ) => void;
  deleteType7aRow: (id: string) => void;
  validateType7a: () => { isValid: boolean; error?: string };
  mapType7aPayload: (
    customers: any[],
    products: any[],
  ) => {
    submittedDemoPlotData: any;
    planProducts: Array<{
      workTypeCode: string;
      productId: string;
      productName: string | null;
      targetQuantity: number;
      isPriceOverridden: boolean;
    }>;
  };
}

export function useType7aForm({
  initial = {},
  initDetails,
  initialTypes = [],
  customersList = [],
  productsList = [],
  productCategoriesList = [],
  selectedWorkTypes = [],
  parentStartDate,
}: UseType7aFormOptions): UseType7aFormResult {
  const [type7aItems, setType7aItems] = useState<Type7DemoPlotItem[]>(() => {
    const isInitialType7A =
      initialTypes.some((t) => getWorkTypeCode(t) === "TYPE_7A") ||
      (initial as any)?.workTypes?.some(
        (wt: any) =>
          getWorkTypeCode(wt) === "TYPE_7A" ||
          wt?.activityType?.code === "TYPE_7A" ||
          wt === "TYPE_7A",
      );

    if (isInitialType7A && ((initial as any)?.demoPlot || (initial as any)?.demoPlotId)) {
      const dp = (initial as any)?.demoPlot;
      const fallbackPlotId = dp?.id || (initial as any)?.demoPlotId || "";

      const type7aProds: Type7DemoProductLine[] = ((initial as any)?.products || [])
        .filter((p: any) => p.workTypeCode === "TYPE_7A")
        .map((p: any, idx: number) => ({
          id: p.id || String(idx + 1),
          productId: p.productId,
          productName: p.productName || p.product?.name || "",
          quantity: p.targetQuantity || 1,
          unit: p.product?.unit || "",
        }));

      const derivedCategoryId =
        ((initial as any)?.products || []).find(
          (p: any) => p.workTypeCode === "TYPE_7A",
        )?.product?.categoryId ||
        dp?.categoryId ||
        dp?.chemicalGroupId ||
        "";

      return [
        {
          id: fallbackPlotId || "1",
          plotActivityType: "CREATE",
          demoPlotId: fallbackPlotId,
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
          categoryId: derivedCategoryId,
          chemicalGroupId: derivedCategoryId,
          objective: dp?.objective || "",
          demoProducts:
            type7aProds.length > 0
              ? type7aProds
              : [
                  {
                    id: "1",
                    productId: "",
                    productName: "",
                    quantity: 1,
                    unit: "",
                  },
                ],
          startDate: format(
            new Date(dp?.startDate || new Date()),
            "yyyy-MM-dd",
          ),
          followUpDate: format(new Date(), "yyyy-MM-dd"),
          detail: dp?.objective || "",
        },
      ];
    }

    if (
      initDetails?.type7aItems &&
      Array.isArray(initDetails.type7aItems) &&
      initDetails.type7aItems.length > 0
    ) {
      return initDetails.type7aItems;
    }

    if (
      initDetails?.type7Items &&
      Array.isArray(initDetails.type7Items) &&
      initDetails.type7Items.length > 0
    ) {
      const items = initDetails.type7Items.filter(
        (item: any) => item.plotActivityType === "CREATE" || !item.existingPlotId,
      );
      if (items.length > 0) return items;
    }

    return [
      {
        id: "1",
        plotActivityType: "CREATE",
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
        demoProducts: [
          {
            id: "1",
            productId: "",
            productName: "",
            quantity: 1,
            unit: "",
          },
        ],
        plotsCount: "",
        detail: "",
      },
    ];
  });

  const addType7aRow = () => {
    setType7aItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        plotActivityType: "CREATE",
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
        demoProducts: [
          {
            id: Date.now().toString(),
            productId: "",
            productName: "",
            quantity: 1,
            unit: "",
          },
        ],
        plotsCount: "",
        detail: "",
      },
    ]);
  };

  const updateType7aRow = (
    id: string,
    field: keyof Type7DemoPlotItem,
    val: any,
  ) => {
    setType7aItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)),
    );
  };

  const deleteType7aRow = (id: string) => {
    setType7aItems((prev) => prev.filter((item) => item.id !== id));
  };

  const validateType7a = (): { isValid: boolean; error?: string } => {
    return validateType7aFormItems({
      items: type7aItems,
      customersList,
      productsList,
      selectedWorkTypes,
    });
  };


  const mapType7aPayload = (customers: any[], products: any[]) => {
    const hasType7APlan = selectedWorkTypes.some(
      (t) => getWorkTypeCode(t) === "TYPE_7A",
    );
    if (!hasType7APlan) {
      return { submittedDemoPlotData: null, planProducts: [] };
    }

    const item = type7aItems[0];
    if (!item) {
      return { submittedDemoPlotData: null, planProducts: [] };
    }

    const dealerId =
      item.storeId ||
      customers.find((c) => c.name === item.ownerName)?.id ||
      null;
    const dealerCust = customers.find((c) => c.id === dealerId);

    const submittedDemoPlotData = {
      id: item.demoPlotId || null,
      name: item.plotName || "",
      customerId: dealerId,
      ownerName: dealerCust?.name || item.ownerName || "",
      cropCategory: item.cropCategory,
      cropName: item.cropName,
      customCropName: item.customCropName || null,
      areaRai: item.areaRai ? Number(item.areaRai) : null,
      treeCount: item.treeCount ? Number(item.treeCount) : null,
      location:
        item.province && item.district
          ? `${item.district}, ${item.province}`
          : null,
      province: item.province || null,
      district: item.district || null,
      categoryId: item.categoryId || item.chemicalGroupId || null,
      objective: item.objective || null,
    };

    const planProducts: Array<{
      workTypeCode: string;
      productId: string;
      productName: string | null;
      targetQuantity: number;
      isPriceOverridden: boolean;
    }> = [];

    const prods = (item.demoProducts || []).filter(
      (p) => p.productId || p.productName,
    );
    prods.forEach((dp) => {
      const pId =
        dp.productId ||
        products.find((p) => p.name === dp.productName)?.id;
      if (pId) {
        const matchedProd = products.find((p) => p.id === pId);
        planProducts.push({
          workTypeCode: "TYPE_7A",
          productId: pId,
          productName: matchedProd?.name || dp.productName || null,
          targetQuantity: dp.quantity ? Number(dp.quantity) : 1,
          isPriceOverridden: false,
        });
      }
    });

    return { submittedDemoPlotData, planProducts };
  };

  return {
    type7aItems,
    setType7aItems,
    addType7aRow,
    updateType7aRow,
    deleteType7aRow,
    validateType7a,
    mapType7aPayload,
  };
}
