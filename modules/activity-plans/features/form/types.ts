export interface RequisitionItem {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
  detail: string;
}

export interface Type9ProductItem {
  id: string;
  productName: string;
  quantityCases: number;
  pricePerCase: number;
}

export interface Type1VisitItem {
  id: string;
  customerName: string;
  topic: string;
  detail: string;
}

export interface Type2ProductFollowupItem {
  id: string;
  productName: string;
  customerName: string;
  detail: string;
}

export interface Type3SalesItem {
  id: string;
  productName: string;
  customerName: string;
  quantity: number;
  unitPrice: number;
  price: number;
  detail: string;
}

export interface Type4CollectItem {
  id: string;
  customerName: string;
  collectAmount: number;
  detail: string;
}

export interface Type5SurveyItem {
  id: string;
  comparedProduct: string;
  storeName: string;
  detail: string;
}

export interface Type6IssueItem {
  id: string;
  customerName: string;
  issueType: string;
  detail: string;
}

export interface Type7DemoPlotItem {
  id: string;
  ownerName: string;
  productName: string;
  cropCategory: string;
  cropName: string;
  plotsCount: number;
  detail: string;
}

export interface Type8MeetingItem {
  id: string;
  topic: string;
  attendeesCount: number;
  detail: string;
}

export interface MarketingBudgetProductItem {
  id: string;
  productName: string;
  quantityCases: number;
  pricePerCase: number;
}

export interface SalesPromotionItem {
  id: string;
  budgetType: string;
  detail: string;
  amount: number;
}
