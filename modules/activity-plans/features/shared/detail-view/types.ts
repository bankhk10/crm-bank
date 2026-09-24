export interface ParsedWorkTypeSection {
  typeIndex: number;
  title: string;
  badge: string;
  items: Array<{
    title: string;
    subtitle?: string;
    badge?: string;
    details?: string;
    amount?: string;
    extraFields?: Array<{ label: string; value: string }>;
  }>;
  rawSummary?: string;
  // Target info derived from plan items for each work type
  targetCards?: Array<{ label: string; value: string; highlight?: boolean }>;
}

export interface MarketingProductDetail {
  category: string;
  productName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalAmount: number;
}

export interface SalesPromotionDetail {
  budgetType: string;
  detail: string;
  amount: number;
}

export interface RequisitionDetail {
  productName: string;
  quantity: number;
  unit: string;
  detail: string;
}
