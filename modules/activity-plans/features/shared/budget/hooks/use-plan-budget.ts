import { useState } from "react";
import {
  MARKETING_PRODUCT_CATEGORIES,
  DEMO_PRODUCTS,
} from "@/modules/activity-plans/constants";
import type {
  MarketingBudgetProductItem,
  SalesPromotionItem,
  RequisitionItem,
} from "../../form/types";

export interface UsePlanBudgetOptions {
  initial?: any;
  initDetails?: any;
}

export interface UsePlanBudgetResult {
  isPromotionalMediaSelected: boolean;
  setIsPromotionalMediaSelected: React.Dispatch<React.SetStateAction<boolean>>;
  marketingBudgetAmount: number;
  setMarketingBudgetAmount: React.Dispatch<React.SetStateAction<number>>;
  marketingProductItems: MarketingBudgetProductItem[];
  setMarketingProductItems: React.Dispatch<
    React.SetStateAction<MarketingBudgetProductItem[]>
  >;
  addMarketingProductItem: () => void;
  updateMarketingProductItem: (
    id: string,
    field: keyof MarketingBudgetProductItem,
    val: any,
  ) => void;
  deleteMarketingProductItem: (id: string) => void;

  isSalesPromotionSelected: boolean;
  setIsSalesPromotionSelected: React.Dispatch<React.SetStateAction<boolean>>;
  salesPromotionItems: SalesPromotionItem[];
  setSalesPromotionItems: React.Dispatch<
    React.SetStateAction<SalesPromotionItem[]>
  >;
  addSalesPromotionRow: () => void;
  updateSalesPromotionRow: (
    id: string,
    field: keyof SalesPromotionItem,
    val: any,
  ) => void;
  deleteSalesPromotionRow: (id: string) => void;

  extraExpenseAmount: number;
  setExtraExpenseAmount: React.Dispatch<React.SetStateAction<number>>;
  extraExpenseDetail: string;
  setExtraExpenseDetail: React.Dispatch<React.SetStateAction<string>>;

  requisitionItems: RequisitionItem[];
  setRequisitionItems: React.Dispatch<React.SetStateAction<RequisitionItem[]>>;
  addRequisitionRow: () => void;
  updateRequisitionRow: (
    id: string,
    field: keyof RequisitionItem,
    val: any,
  ) => void;
  deleteRequisitionRow: (id: string) => void;

  salesPromotionBudget: number | null;
  marketingBudget: number | null;

  validateBudget: () => { isValid: boolean; error?: string };
  buildBudgetPayload: () => {
    salesPromotionBudgetRequested: number | null;
    marketingBudgetRequested: number | null;
    marketingItems: Array<{
      category: string;
      materialName: string;
      unit?: string | null;
      unitPrice: number;
      quantity: number;
      totalAmount: number;
    }>;
    promotionItems: Array<{
      budgetType: string;
      detail: string;
      amount: number;
    }>;
  };
}

export function usePlanBudget({
  initial = {},
  initDetails,
}: UsePlanBudgetOptions): UsePlanBudgetResult {
  // Section 5: Promotional Media State
  const [isPromotionalMediaSelected, setIsPromotionalMediaSelected] =
    useState<boolean>(() => {
      if (initDetails?.isPromotionalMediaSelected !== undefined) {
        return initDetails.isPromotionalMediaSelected;
      }
      if (Array.isArray(initDetails) && initDetails.length > 0) {
        const hasMkt = initDetails.some(
          (item: any) =>
            item.visitTopic === "MARKETING_PRODUCT" ||
            item.itemType === "MARKETING_PRODUCT",
        );
        if (hasMkt) return true;
      }
      return (
        (initial.marketingBudgetRequested ??
          (initial as any).marketingBudget ??
          0) > 0
      );
    });

  const [marketingBudgetAmount, setMarketingBudgetAmount] = useState<number>(
    initDetails?.marketingBudgetAmount ??
      initial.marketingBudgetRequested ??
      (initial as any).marketingBudget ??
      10000,
  );

  const [marketingProductItems, setMarketingProductItems] = useState<
    MarketingBudgetProductItem[]
  >(() => {
    if (
      (initial as any)?.marketingItems &&
      Array.isArray((initial as any).marketingItems) &&
      (initial as any).marketingItems.length > 0
    ) {
      return (initial as any).marketingItems.map((m: any, idx: number) => ({
        id: m.id || String(idx + 1),
        category: m.category || MARKETING_PRODUCT_CATEGORIES[0],
        productName: m.materialName || "",
        quantityCases: m.quantity != null ? Number(m.quantity) : 1,
        unit: m.unit || "ชิ้น",
        pricePerCase: m.unitPrice != null ? Number(m.unitPrice) : 0,
      }));
    }
    if (
      initDetails?.marketingProductItems &&
      Array.isArray(initDetails.marketingProductItems) &&
      initDetails.marketingProductItems.length > 0
    ) {
      return initDetails.marketingProductItems;
    }
    if (Array.isArray(initDetails) && initDetails.length > 0) {
      const mktItems = initDetails.filter(
        (item: any) =>
          item.visitTopic === "MARKETING_PRODUCT" ||
          item.itemType === "MARKETING_PRODUCT",
      );
      if (mktItems.length > 0) {
        return mktItems.map((item: any, idx: number) => ({
          id: item.id || String(idx + 1),
          category:
            item.plotCropCategory ||
            item.category ||
            MARKETING_PRODUCT_CATEGORIES[0],
          productName: item.storeProductName || item.productName || "",
          quantityCases: item.storeQuantityCases ?? item.quantityCases ?? 1,
          unit: item.plotCropName || item.unit || "ชิ้น",
          pricePerCase: item.storePricePerCase
            ? Number(item.storePricePerCase)
            : (item.pricePerCase ?? 0),
        }));
      }
    }
    return [
      {
        id: "1",
        category: MARKETING_PRODUCT_CATEGORIES[0] || "Premium_item",
        productName: "สมุดฉีก",
        quantityCases: 1,
        unit: "เล่ม",
        pricePerCase: 25,
      },
    ];
  });

  const addMarketingProductItem = () => {
    const newItem: MarketingBudgetProductItem = {
      id: Date.now().toString(),
      category: "อื่นๆ",
      productName: "",
      quantityCases: 1,
      unit: "ชิ้น",
      pricePerCase: 0,
    };
    setMarketingProductItems((prev) => [...prev, newItem]);
  };

  const updateMarketingProductItem = (
    id: string,
    field: keyof MarketingBudgetProductItem,
    val: any,
  ) => {
    setMarketingProductItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)),
    );
  };

  const deleteMarketingProductItem = (id: string) => {
    setMarketingProductItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Section 5: Sales Promotion Items State & Helpers
  const [isSalesPromotionSelected, setIsSalesPromotionSelected] =
    useState<boolean>(() => {
      if (initDetails?.isSalesPromotionSelected !== undefined) {
        return initDetails.isSalesPromotionSelected;
      }
      if (Array.isArray(initDetails) && initDetails.length > 0) {
        const hasSp = initDetails.some(
          (item: any) =>
            item.visitTopic === "SALES_PROMOTION" ||
            item.itemType === "SALES_PROMOTION",
        );
        if (hasSp) return true;
      }
      return (
        (initial.salesPromotionBudgetRequested ??
          (initial as any).salesPromotionBudget ??
          0) > 0
      );
    });

  const [salesPromotionItems, setSalesPromotionItems] = useState<
    SalesPromotionItem[]
  >(() => {
    if (
      (initial as any)?.promotionItems &&
      Array.isArray((initial as any).promotionItems) &&
      (initial as any).promotionItems.length > 0
    ) {
      return (initial as any).promotionItems.map((p: any, idx: number) => ({
        id: p.id || String(idx + 1),
        budgetType: p.budgetType || "งบการตลาด",
        detail: p.detail || "",
        amount: p.amount != null ? Number(p.amount) : 0,
      }));
    }
    if (
      initDetails?.salesPromotionItems &&
      Array.isArray(initDetails.salesPromotionItems) &&
      initDetails.salesPromotionItems.length > 0
    ) {
      return initDetails.salesPromotionItems;
    }
    if (Array.isArray(initDetails) && initDetails.length > 0) {
      const spItems = initDetails.filter(
        (item: any) =>
          item.visitTopic === "SALES_PROMOTION" ||
          item.itemType === "SALES_PROMOTION",
      );
      if (spItems.length > 0) {
        return spItems.map((item: any, idx: number) => ({
          id: item.id || String(idx + 1),
          budgetType: item.plotCropCategory || item.budgetType || "งบการตลาด",
          detail: item.detail || "",
          amount: item.collectAmount
            ? Number(item.collectAmount)
            : (item.amount ?? 0),
        }));
      }
    }
    return [];
  });

  const addSalesPromotionRow = () => {
    const newItem: SalesPromotionItem = {
      id: Date.now().toString(),
      budgetType: "งบการตลาด",
      detail: "",
      amount: 0,
    };
    setSalesPromotionItems((prev) => [...prev, newItem]);
  };

  const updateSalesPromotionRow = (
    id: string,
    field: keyof SalesPromotionItem,
    val: any,
  ) => {
    setSalesPromotionItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)),
    );
  };

  const deleteSalesPromotionRow = (id: string) => {
    setSalesPromotionItems((prev) => prev.filter((item) => item.id !== id));
  };

  const [extraExpenseAmount, setExtraExpenseAmount] = useState<number>(
    initDetails?.extraExpenseAmount ?? 0,
  );
  const [extraExpenseDetail, setExtraExpenseDetail] = useState(
    initDetails?.extraExpenseDetail ?? "",
  );

  // Section 6: Material Requisition Items
  const [requisitionItems, setRequisitionItems] = useState<RequisitionItem[]>(
    [],
  );

  const addRequisitionRow = () => {
    const newItem: RequisitionItem = {
      id: Date.now().toString(),
      productName: DEMO_PRODUCTS[0],
      quantity: 1,
      unit: "ขวด",
      detail: "",
    };
    setRequisitionItems((prev) => [...prev, newItem]);
  };

  const updateRequisitionRow = (
    id: string,
    field: keyof RequisitionItem,
    val: any,
  ) => {
    setRequisitionItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)),
    );
  };

  const deleteRequisitionRow = (id: string) => {
    setRequisitionItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Calculations
  const salesPromotionBudget = isSalesPromotionSelected
    ? salesPromotionItems.reduce((sum, item) => sum + (item.amount || 0), 0)
    : null;

  const marketingBudget = isPromotionalMediaSelected
    ? marketingProductItems.reduce(
        (sum, item) =>
          sum + (item.quantityCases || 0) * (item.pricePerCase || 0),
        0,
      )
    : null;

  // Validation
  const validateBudget = () => {
    if (isPromotionalMediaSelected && marketingProductItems.length === 0) {
      return {
        isValid: false,
        error:
          "สื่อส่งเสริมการขาย (PVC, ไวนิล, ของแถมตราปืนใหญ่ ทุกชนิด) ต้องมีอย่างน้อย 1 ข้อมูล",
      };
    }
    return { isValid: true };
  };

  // Payload mapping helper
  const buildBudgetPayload = () => {
    const marketingItems: Array<{
      category: string;
      materialName: string;
      unit?: string | null;
      unitPrice: number;
      quantity: number;
      totalAmount: number;
    }> = [];

    if (isPromotionalMediaSelected && marketingProductItems.length > 0) {
      marketingProductItems.forEach((mItem) => {
        const qty = mItem.quantityCases || 1;
        const price = mItem.pricePerCase || 0;
        marketingItems.push({
          category: mItem.category || MARKETING_PRODUCT_CATEGORIES[0],
          materialName: mItem.productName || "สื่อส่งเสริมการขาย",
          unit: mItem.unit || "ชิ้น",
          unitPrice: price,
          quantity: qty,
          totalAmount: qty * price,
        });
      });
    }

    const promotionItems: Array<{
      budgetType: string;
      detail: string;
      amount: number;
    }> = [];

    if (isSalesPromotionSelected && salesPromotionItems.length > 0) {
      salesPromotionItems.forEach((spItem) => {
        promotionItems.push({
          budgetType: spItem.budgetType || "งบการตลาด",
          detail: spItem.detail || "",
          amount: spItem.amount || 0,
        });
      });
    }

    return {
      salesPromotionBudgetRequested: salesPromotionBudget,
      marketingBudgetRequested: marketingBudget,
      marketingItems,
      promotionItems,
    };
  };

  return {
    isPromotionalMediaSelected,
    setIsPromotionalMediaSelected,
    marketingBudgetAmount,
    setMarketingBudgetAmount,
    marketingProductItems,
    setMarketingProductItems,
    addMarketingProductItem,
    updateMarketingProductItem,
    deleteMarketingProductItem,

    isSalesPromotionSelected,
    setIsSalesPromotionSelected,
    salesPromotionItems,
    setSalesPromotionItems,
    addSalesPromotionRow,
    updateSalesPromotionRow,
    deleteSalesPromotionRow,

    extraExpenseAmount,
    setExtraExpenseAmount,
    extraExpenseDetail,
    setExtraExpenseDetail,

    requisitionItems,
    setRequisitionItems,
    addRequisitionRow,
    updateRequisitionRow,
    deleteRequisitionRow,

    salesPromotionBudget,
    marketingBudget,

    validateBudget,
    buildBudgetPayload,
  };
}
