import React from "react";
import { BudgetSection as BaseBudgetSection } from "../form/components/budget-section";
import type {
  MarketingBudgetProductItem,
  SalesPromotionItem,
} from "../form/types";

export interface PlanBudgetSectionProps {
  selectedWorkTypes: string[];
  readonly?: boolean;
  isPromotionalMediaSelected: boolean;
  setIsPromotionalMediaSelected: (val: boolean) => void;
  isSalesPromotionSelected: boolean;
  setIsSalesPromotionSelected: (val: boolean) => void;
  marketingProductItems: MarketingBudgetProductItem[];
  marketingBudgetAmount: number;
  setMarketingBudgetAmount: (val: number) => void;
  addMarketingProductItem: () => void;
  updateMarketingProductItem: (
    id: string,
    field: keyof MarketingBudgetProductItem,
    val: any,
  ) => void;
  deleteMarketingProductItem: (id: string) => void;
  salesPromotionItems: SalesPromotionItem[];
  addSalesPromotionRow: () => void;
  updateSalesPromotionRow: (
    id: string,
    field: keyof SalesPromotionItem,
    val: any,
  ) => void;
  deleteSalesPromotionRow: (id: string) => void;
  promotionalMaterialsByCategory?: Record<
    string,
    Array<{ name: string; price: number; unit?: string }>
  >;
  targetSales?: number;
}

export function PlanBudgetSection({
  targetSales = 0,
  ...rest
}: PlanBudgetSectionProps) {
  return <BaseBudgetSection targetSales={targetSales} {...rest} />;
}
