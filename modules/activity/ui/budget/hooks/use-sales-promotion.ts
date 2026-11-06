"use client";

import { useState } from "react";
import type { SalesPromotionItem } from "../types";

export interface UseSalesPromotionOptions {
  initial?: any;
  initDetails?: any;
}

export interface UseSalesPromotionResult {
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
  salesPromotionBudget: number | null;
}

export function useSalesPromotion({
  initial = {},
  initDetails,
}: UseSalesPromotionOptions = {}): UseSalesPromotionResult {
  const [isSalesPromotionSelected, setIsSalesPromotionSelected] =
    useState<boolean>(() => {
      if (initDetails?.isSalesPromotionSelected !== undefined) {
        return initDetails.isSalesPromotionSelected;
      }
      if (
        (initial as any)?.promotionItems &&
        Array.isArray((initial as any).promotionItems) &&
        (initial as any).promotionItems.length > 0
      ) {
        return true;
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

  const salesPromotionBudget = isSalesPromotionSelected
    ? salesPromotionItems.reduce((sum, item) => sum + (item.amount || 0), 0)
    : null;

  return {
    isSalesPromotionSelected,
    setIsSalesPromotionSelected,
    salesPromotionItems,
    setSalesPromotionItems,
    addSalesPromotionRow,
    updateSalesPromotionRow,
    deleteSalesPromotionRow,
    salesPromotionBudget,
  };
}

