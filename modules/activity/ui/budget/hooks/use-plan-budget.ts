"use client";

import { useState } from "react";
import { MARKETING_PRODUCT_CATEGORIES } from "@/modules/activity/constants";
import type {
  MarketingBudgetProductItem,
  SalesPromotionItem,
  RequisitionItem,
} from "../types";
import { usePromotionalMedia } from "./use-promotional-media";
import { useSalesPromotion } from "./use-sales-promotion";

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
}: UsePlanBudgetOptions = {}): UsePlanBudgetResult {
  // 1. Promotional Media Sub-hook
  const promotionalMedia = usePromotionalMedia({ initial, initDetails });

  // 2. Sales Promotion Sub-hook
  const salesPromotion = useSalesPromotion({ initial, initDetails });

  // 3. Extra Expense & Requisition Items State
  const [extraExpenseAmount, setExtraExpenseAmount] = useState<number>(
    initDetails?.extraExpenseAmount ?? 0,
  );
  const [extraExpenseDetail, setExtraExpenseDetail] = useState<string>(
    initDetails?.extraExpenseDetail ?? "",
  );

  const [requisitionItems, setRequisitionItems] = useState<RequisitionItem[]>([]);

  const addRequisitionRow = () => {
    const newItem: RequisitionItem = {
      id: Date.now().toString(),
      productName: "",
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

  // 4. Validation
  const validateBudget = () => {
    if (
      promotionalMedia.isPromotionalMediaSelected &&
      promotionalMedia.marketingProductItems.length === 0
    ) {
      return {
        isValid: false,
        error:
          "สื่อส่งเสริมการขาย (PVC, ไวนิล, ของแถมตราปืนใหญ่ ทุกชนิด) ต้องมีอย่างน้อย 1 ข้อมูล",
      };
    }
    return { isValid: true };
  };

  // 5. Payload mapping helper
  const buildBudgetPayload = () => {
    const marketingItems: Array<{
      category: string;
      materialName: string;
      unit?: string | null;
      unitPrice: number;
      quantity: number;
      totalAmount: number;
    }> = [];

    if (
      promotionalMedia.isPromotionalMediaSelected &&
      promotionalMedia.marketingProductItems.length > 0
    ) {
      promotionalMedia.marketingProductItems.forEach((mItem) => {
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

    if (
      salesPromotion.isSalesPromotionSelected &&
      salesPromotion.salesPromotionItems.length > 0
    ) {
      salesPromotion.salesPromotionItems.forEach((spItem) => {
        promotionItems.push({
          budgetType: spItem.budgetType || "งบการตลาด",
          detail: spItem.detail || "",
          amount: spItem.amount || 0,
        });
      });
    }

    return {
      salesPromotionBudgetRequested: salesPromotion.salesPromotionBudget,
      marketingBudgetRequested: promotionalMedia.marketingBudget,
      marketingItems,
      promotionItems,
    };
  };

  return {
    ...promotionalMedia,
    ...salesPromotion,

    extraExpenseAmount,
    setExtraExpenseAmount,
    extraExpenseDetail,
    setExtraExpenseDetail,

    requisitionItems,
    setRequisitionItems,
    addRequisitionRow,
    updateRequisitionRow,
    deleteRequisitionRow,

    validateBudget,
    buildBudgetPayload,
  };
}
