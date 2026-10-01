export interface Type4CollectItem {
  id: string;
  collectType?: "BILLING" | "COLLECT";
  storeId?: string;
  customerName: string;
  collectAmount: number;
  detail: string;
}

export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  responsibleEmployeeId?: string | null;
}
