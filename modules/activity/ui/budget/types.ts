export interface MarketingBudgetProductItem {
  id: string;
  category?: string;
  customCategory?: string;
  productName: string;
  quantityCases: number;
  unit?: string;
  pricePerCase: number;
}

export interface SalesPromotionItem {
  id: string;
  budgetType: string;
  detail: string;
  amount: number;
}

export interface RequisitionItem {
  id: string;
  productId?: string;
  productName: string;
  quantity: number;
  unit: string;
  detail: string;
}

export interface PromotionalProductOption {
  name: string;
  price: number;
  unit?: string;
  category?: string;
  sku?: string;
}

export interface PlanBudgetSectionProps {
  selectedWorkTypes?: string[];
  readonly?: boolean;
  isPromotionalMediaSelected: boolean;
  setIsPromotionalMediaSelected: (val: boolean) => void;
  isSalesPromotionSelected: boolean;
  setIsSalesPromotionSelected: (val: boolean) => void;
  marketingProductItems: MarketingBudgetProductItem[];
  marketingBudgetAmount: number;
  setMarketingBudgetAmount?: (val: number) => void;
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
  targetSales?: number;
  promotionalMaterialsByCategory?: Record<string, PromotionalProductOption[]>;
}
