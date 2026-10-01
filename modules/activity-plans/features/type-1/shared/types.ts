export interface Type1VisitItem {
  id: string;
  visitPurpose?: "FARMER" | "STORE";
  province?: string;
  isUnregisteredFarmer?: boolean;
  storeId?: string;
  customerName?: string;
  unregisteredFarmerName?: string;
  unregisteredFarmerPhone?: string;
  topic: string;
  detail: string;
}

export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  customerType?: string;
  province?: string | null;
  district?: string | null;
  phone?: string | null;
  responsibleEmployeeId?: string | null;
}
