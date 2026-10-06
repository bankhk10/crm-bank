export interface Type13WithdrawalItem {
  id?: string;
  productId: string;
  productName?: string | null;
  quantity: number | string;
  unit?: string | null;
  sortOrder?: number;
}

export interface Type13PlotProduct {
  id?: string;
  productId: string;
  productName?: string | null;
  quantity?: number | string | null;
  unit?: string | null;
}

export interface Type13PlotItem {
  id: string;
  demoPlotId?: string | null;
  name: string;
  storeId: string;
  ownerName?: string | null;
  province: string;
  district: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  products?: Type13PlotProduct[];
  hasDrugWithdrawal?: boolean;
  withdrawalItems?: Type13WithdrawalItem[];
}

export interface Type13ExternalProduct {
  company: string;
  productName: string;
  activeIngredient?: string | null;
  formula: string;
  customFormula?: string | null;
  applicationRate: string;
}

export interface Type13SprayingProduct {
  productId: string;
  productName?: string | null;
  actualRate: string;
  quantityUsed: number | string;
  unit?: string | null;
  drugWithdrawalItemId?: string | null;
  detail?: string | null;
}

export interface Type13SprayingRoundAttachment {
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface Type13SprayingRound {
  id?: string;
  demoPlotId?: string | null;
  clientPlotId?: string | null;
  roundNumber: number;
  sprayDate: string;
  sprayMethod: "SINGLE" | "TANK_MIXED";
  sprayEquipment: string;
  otherEquipment?: string | null;
  productResponse: string;
  problemDetail?: string | null;
  workTypeCode?: string;
  products: Type13SprayingProduct[];
  externalProducts?: Type13ExternalProduct[];
  attachments?: Type13SprayingRoundAttachment[];
}

export interface DealerOption {
  id: string;
  name: string;
  customerType?: string;
  province?: string | null;
  district?: string | null;
}

export interface ProductOption {
  id: string;
  name: string;
  unit?: string | null;
  productCode?: string | null;
  price?: number | null;
  categoryId?: string | null;
}

export interface Type13PlanStorePayload {
  workTypeCode: string;
  visitPurpose?: "FARMER" | "STORE" | null;
  storeId: string;
  storeName: string;
  province: string | null;
  remarks: string;
  notes: string;
}
