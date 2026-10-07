export interface Type2FollowupProductLine {
  id: string;
  productId?: string;
  productName: string;
  notes?: string;
}

export interface Type2ProductFollowupItem {
  id: string;
  visitPurpose?: "FARMER" | "STORE";
  province?: string;
  isUnregisteredFarmer?: boolean;
  storeId?: string;
  customerName: string;
  unregisteredFarmerName?: string;
  unregisteredFarmerPhone?: string;
  products?: Type2FollowupProductLine[];
  productId?: string;
  productName?: string;
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

export interface ProductOption {
  id: string;
  name: string;
  productCode?: string | null;
}
