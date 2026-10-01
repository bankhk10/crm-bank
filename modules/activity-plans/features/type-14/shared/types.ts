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

export interface Type14PlanInput {
  mode: "EXISTING_PLOT" | "NEW_PLOT";
  demoPlotId?: string | null;
  name?: string;
  storeId?: string;
  ownerName?: string;
  province?: string;
  district?: string;
  latitude?: string;
  longitude?: string;
  trackings?: Type14TrackingItem[];
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
