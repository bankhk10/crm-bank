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
