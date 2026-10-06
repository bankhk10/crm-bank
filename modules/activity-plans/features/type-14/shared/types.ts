export interface Type14TrackingAttachment {
  id?: string;
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface Type14TrackingItem {
  id?: string;
  visitDate: string;
  daysSinceStart?: number;
  notes?: string;
  attachments?: Type14TrackingAttachment[];
}

export interface Type14WithdrawnProductLine {
  id: string;
  productId: string;
  productName?: string;
  quantity: number;
  unit?: string;
}

export interface Type14PlanInput {
  mode: "EXISTING_PLOT" | "NEW_PLOT";
  selectedPlanId?: string | null;
  demoPlotId?: string | null;
  name?: string;
  storeId?: string;
  dealerName?: string | null;
  ownerName?: string | null;
  cropCategory?: string | null;
  cropName?: string | null;
  areaRai?: number | null;
  treeCount?: number | null;
  province?: string;
  district?: string;
  latitude?: string | null;
  longitude?: string | null;
  trackings?: Type14TrackingItem[];
  hasProductWithdrawal?: boolean;
  withdrawnProducts?: Type14WithdrawnProductLine[];
}

export interface DealerCustomerOption {
  id: string;
  name: string;
  customerCode?: string;
  province?: string;
}

export interface ProductOption {
  id: string;
  name: string;
  unit?: string | null;
  productCode?: string | null;
}

export interface Type14PlanStorePayload {
  workTypeCode: string;
  visitPurpose?: "FARMER" | "STORE" | null;
  storeId: string;
  storeName: string;
  province: string | null;
  remarks: string;
  notes: string;
}
