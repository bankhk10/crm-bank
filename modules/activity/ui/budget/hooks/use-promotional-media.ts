"use client";

import { useState } from "react";
import { MARKETING_PRODUCT_CATEGORIES } from "@/modules/activity/constants";
import type { MarketingBudgetProductItem } from "../types";

export interface UsePromotionalMediaOptions {
  initial?: any;
  initDetails?: any;
}

export interface UsePromotionalMediaResult {
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
  marketingBudget: number | null;
}

export function usePromotionalMedia({
  initial = {},
  initDetails,
}: UsePromotionalMediaOptions = {}): UsePromotionalMediaResult {
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

  const marketingBudget = isPromotionalMediaSelected
    ? marketingProductItems.reduce(
        (sum, item) =>
          sum + (item.quantityCases || 0) * (item.pricePerCase || 0),
        0,
      )
    : null;

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
    marketingBudget,
  };
}

