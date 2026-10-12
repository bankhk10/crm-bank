/**
 * Type 2 (ติดตามผลการใช้สินค้า / Product Follow-up) - Domain Types
 * Single Source of Truth for Type 2 data structures.
 */

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

export interface FollowupProductItem {
  id?: string;
  productId?: string;
  productName: string;
  customer?: string;
  storeId?: string;
  expectedResult?: string;
  usageResult?: "พืชตอบสนองดี" | "ลูกค้าพึงพอใจ" | "พบปัญหา" | "";
  problemDetail?: string;
  detail?: string; // รายละเอียดเพิ่มเติมจากแผนงาน
  followupDetail?: string; // รายละเอียดการติดตามจากการปฏิบัติงานจริง
  isAdditional?: boolean; // false = สินค้าตามแผน, true = ติดตามผลเพิ่มเติม
}

/**
 * Type 2 Plan Target Representation (Single Target or Item in Multi-Target List)
 */
export interface Type2TargetItem {
  id?: string;
  product?: string;
  customer: string;
  storeName?: string;
  storeId?: string;
  keyFarmer?: string;
  province?: string;
  visitPurpose?: "FARMER" | "STORE";
  isUnregisteredFarmer?: boolean;
  unregisteredFarmerName?: string;
  unregisteredFarmerPhone?: string;
  detail: string;
  expectedResult: string;
  items?: FollowupProductItem[];
  [key: string]: any;
}

export interface Type2ImageFile {
  id: string;
  url: string;
  name: string;
  size?: number;
  type?: string;
  rawFile?: File;
  file?: File;
  previewUrl?: string;
  workTypeCode?: string;
  storeId?: string;
  targetId?: string;
  description?: string;
  isUploaded?: boolean;
  [key: string]: any;
}
