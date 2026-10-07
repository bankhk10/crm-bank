import { useState, useEffect, useRef } from "react";
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

function parseInitialType7aItems(
  initial: any,
  initDetails: any,
  initialTypes: string[] = [],
  selectedWorkTypes: string[] = [],
  parentStartDate?: string,
): Type7DemoPlotItem[] {
  const isInitialType7A =
    initialTypes.some((t) => getWorkTypeCode(t) === "TYPE_7A") ||
    (initial as any)?.workTypes?.some(
      (wt: any) =>
        getWorkTypeCode(wt) === "TYPE_7A" ||
        wt?.activityType?.code === "TYPE_7A" ||
        wt === "TYPE_7A",
    ) ||
    selectedWorkTypes.some((t) => getWorkTypeCode(t) === "TYPE_7A");

  const dp =
    (initial as any)?.demoPlot ||
    (initial as any)?.demoPlotVisits?.[0]?.demoPlot ||
    (initial as any)?.demoPlotData;
  const fallbackPlotId =
    dp?.id ||
    (initial as any)?.demoPlotId ||
    (initial as any)?.demoPlotVisits?.[0]?.demoPlotId ||
    "";

  if (isInitialType7A && (dp || fallbackPlotId)) {
    const type7aProds: Type7DemoProductLine[] = ((initial as any)?.products || [])
      .filter(
        (p: any) =>
          p.workTypeCode === "TYPE_7A" || p.workTypeCode === "ทำแปลงสาธิต",
      )
      .map((p: any, idx: number) => ({
        id: p.id || String(idx + 1),
        productId: p.productId,
        productName: p.productName || p.product?.name || "",
        quantity: p.targetQuantity || 1,
        unit: p.product?.unit || "",
      }));

    const has7aWithdrawal = isInitialType7A && type7aProds.length > 0;

    const derivedCategoryId =
      ((initial as any)?.products || []).find(
        (p: any) =>
          p.workTypeCode === "TYPE_7A" || p.workTypeCode === "ทำแปลงสาธิต",
      )?.product?.categoryId ||
      dp?.categoryId ||
      dp?.chemicalGroupId ||
      "";

    const cropCategory =
      dp?.cropCategory && dp.cropCategory !== "พืชทั่วไป"
        ? dp.cropCategory
        : (initial as any)?.cropCategory ||
          (initial as any)?.demoPlotData?.cropCategory ||
          dp?.cropCategory ||
          "";

    const cropName =
      dp?.cropName && dp.cropName !== "พืชทั่วไป"
        ? dp.cropName
        : (initial as any)?.cropName ||
          (initial as any)?.demoPlotData?.cropName ||
          dp?.cropName ||
          "";

    const customCropName =
      dp?.customCropName ||
      (initial as any)?.customCropName ||
      (initial as any)?.demoPlotData?.customCropName ||
      "";

    const areaRai =
      dp?.areaRai != null
        ? Number(dp.areaRai)
        : (initial as any)?.areaRai != null
          ? Number((initial as any).areaRai)
          : (initial as any)?.demoPlotData?.areaRai != null
            ? Number((initial as any).demoPlotData.areaRai)
            : 0;

    const treeCount =
      dp?.treeCount != null
        ? Number(dp.treeCount)
        : (initial as any)?.treeCount != null
          ? Number((initial as any).treeCount)
          : (initial as any)?.demoPlotData?.treeCount != null
            ? Number((initial as any).demoPlotData.treeCount)
            : 0;

    return [
      {
        id: fallbackPlotId || "1",
        plotActivityType: "CREATE",
        demoPlotId: fallbackPlotId,
        hasProductWithdrawal: has7aWithdrawal,
        plotName: dp?.name || (initial as any)?.demoPlotData?.name || "",
        storeId: dp?.customerId || (initial as any)?.demoPlotData?.customerId || "",
        ownerName:
          dp?.customer?.name ||
          dp?.ownerName ||
          (initial as any)?.demoPlotData?.ownerName ||
          "",
        productId: type7aProds[0]?.productId || dp?.productId || "",
        productName: type7aProds[0]?.productName || dp?.productName || "",
        cropCategory,
        cropName,
        customCropName,
        areaRai,
        treeCount,
        province:
          dp?.province ||
          dp?.customer?.province ||
          (initial as any)?.province ||
          (initial as any)?.demoPlotData?.province ||
          "",
        district:
          dp?.district ||
          dp?.customer?.district ||
          (initial as any)?.district ||
          (initial as any)?.demoPlotData?.district ||
          "",
        categoryId: derivedCategoryId,
        chemicalGroupId: derivedCategoryId,
        objective:
          dp?.objective ||
          (initial as any)?.objective ||
          (initial as any)?.demoPlotData?.objective ||
          (initial as any)?.description ||
          "",
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
          new Date(dp?.startDate || (initial as any)?.startDate || new Date()),
          "yyyy-MM-dd",
        ),
        followUpDate: format(new Date(), "yyyy-MM-dd"),
        detail:
          dp?.objective ||
          (initial as any)?.objective ||
          (initial as any)?.demoPlotData?.objective ||
          (initial as any)?.description ||
          "",
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
      hasProductWithdrawal: false,
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
  const [type7aItems, setType7aItems] = useState<Type7DemoPlotItem[]>(() =>
    parseInitialType7aItems(
      initial,
      initDetails,
      initialTypes,
      selectedWorkTypes,
      parentStartDate,
    ),
  );

  const isUserEditedRef = useRef(false);
  const hydratedKeyRef = useRef<string>("");
  const currentPlanIdRef = useRef<string | undefined>((initial as any)?.id);

  if (currentPlanIdRef.current !== (initial as any)?.id) {
    currentPlanIdRef.current = (initial as any)?.id;
    isUserEditedRef.current = false;
    hydratedKeyRef.current = "";
  }

  useEffect(() => {
    if (isUserEditedRef.current) return;

    const dp =
      (initial as any)?.demoPlot ||
      (initial as any)?.demoPlotVisits?.[0]?.demoPlot ||
      (initial as any)?.demoPlotData;
    const fallbackPlotId =
      dp?.id ||
      (initial as any)?.demoPlotId ||
      (initial as any)?.demoPlotVisits?.[0]?.demoPlotId ||
      "";

    const isType7A =
      initialTypes.some((t) => getWorkTypeCode(t) === "TYPE_7A") ||
      (initial as any)?.workTypes?.some(
        (wt: any) =>
          getWorkTypeCode(wt) === "TYPE_7A" ||
          wt?.activityType?.code === "TYPE_7A" ||
          wt === "TYPE_7A",
      ) ||
      selectedWorkTypes.some((t) => getWorkTypeCode(t) === "TYPE_7A");

    if (!isType7A) return;
    if (
      !dp &&
      !fallbackPlotId &&
      !initDetails?.type7aItems &&
      !initDetails?.type7Items
    ) {
      return;
    }

    const hydrationKey = `${(initial as any)?.id || ""}_${fallbackPlotId}_${dp?.updatedAt || ""}_${dp?.cropName || ""}_${dp?.cropCategory || ""}_${dp?.areaRai ?? ""}_${dp?.treeCount ?? ""}`;
    if (hydrationKey === hydratedKeyRef.current) return;

    hydratedKeyRef.current = hydrationKey;
    const parsed = parseInitialType7aItems(
      initial,
      initDetails,
      initialTypes,
      selectedWorkTypes,
      parentStartDate,
    );
    if (parsed && parsed.length > 0) {
      setType7aItems(parsed);
    }
  }, [initial, initDetails, initialTypes, selectedWorkTypes, parentStartDate]);

  const addType7aRow = () => {
    isUserEditedRef.current = true;
    setType7aItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        plotActivityType: "CREATE",
        hasProductWithdrawal: false,
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
    isUserEditedRef.current = true;
    setType7aItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)),
    );
  };

  const deleteType7aRow = (id: string) => {
    isUserEditedRef.current = true;
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

    if (item.hasProductWithdrawal) {
      const prods = (item.demoProducts || []).filter(
        (p: any) => p.productId || p.productName,
      );
      prods.forEach((dp: any) => {
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
    }

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
