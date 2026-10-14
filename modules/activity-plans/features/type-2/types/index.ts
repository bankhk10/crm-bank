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
  unit?: string | null;
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

// Backward-compatible alias
export type ImageFile = Type2ImageFile;

/**
 * Plan Card types
 */
export interface Type2PlanCardTargetItem {
  id?: string;
  productId?: string;
  productName: string;
  customer?: string;
  storeId?: string;
  detail?: string;
  notes?: string;
  expectedResult?: string;
  isAdditional?: boolean;
  [key: string]: any;
}

export interface Type2PlanCardTarget {
  product?: string;
  customer?: string;
  storeName?: string;
  keyFarmer?: string;
  province?: string;
  visitPurpose?: "FARMER" | "STORE";
  isUnregisteredFarmer?: boolean;
  unregisteredFarmerName?: string;
  unregisteredFarmerPhone?: string;
  detail?: string;
  expectedResult?: string;
  items?: Type2PlanCardTargetItem[];
  [key: string]: any;
}

export interface Type2PlanCardProps {
  planType?: string;
  target?: Type2PlanCardTarget;
  className?: string;
}

/**
 * Props for Type 2 Plan Form
 */
export interface Type2PlanFormProps {
  readonly?: boolean;
  type2Items: Type2ProductFollowupItem[];
  addType2Row: () => void;
  updateType2Row: (
    id: string,
    field: keyof Type2ProductFollowupItem,
    val: any,
  ) => void;
  deleteType2Row: (id: string) => void;
  customers?: CustomerOption[];
  products?: ProductOption[];
}

// Backward-compatible alias
export type Type2FollowupProps = Type2PlanFormProps;

/**
 * Props for Type 2 Actual Form
 */
export interface Type2ActualFormProps {
  isVisible: boolean;
  target?: Type2TargetItem;
  targets?: Type2TargetItem[];
  planType?: "PLANNED" | "UNPLANNED" | string;
  products?: Array<{ id: string; name: string; productCode?: string | null }>;
  followupResults?: FollowupProductItem[];
  onUpdateFollowupResults?: (items: FollowupProductItem[]) => void;
  // Legacy / backward-compatible props
  customerName?: string;
  setCustomerName?: (v: string) => void;
  detail?: string;
  setDetail?: (v: string) => void;
  followupDetail?: string;
  setFollowupDetail?: (v: string) => void;
  usageResult?: "พืชตอบสนองดี" | "ลูกค้าพึงพอใจ" | "พบปัญหา" | "";
  setUsageResult?: (
    v: "พืชตอบสนองดี" | "ลูกค้าพึงพอใจ" | "พบปัญหา" | "",
  ) => void;
  problemDetail?: string;
  setProblemDetail?: (v: string) => void;
  images?: Type2ImageFile[];
  setImages?: (v: Type2ImageFile[]) => void;
}

// Backward-compatible alias
export type ActualType2FollowupProps = Type2ActualFormProps;

/**
 * Props for Type 2 Detail View
 */
export interface Type2DetailViewProps {
  isVisible: boolean;
  target?: Type2TargetItem;
  targets?: Type2TargetItem[];
  followupResults?: FollowupProductItem[];
  customerName?: string;
  detail?: string;
  followupDetail?: string;
  usageResult?: "พืชตอบสนองดี" | "ลูกค้าพึงพอใจ" | "พบปัญหา" | "";
  problemDetail?: string;
  images?: Type2ImageFile[];
}

// Backward-compatible alias
export type DetailType2FollowupProps = Type2DetailViewProps;

/**
 * Props for Type 2 Approval Card
 */
export interface Type2ApprovalCardProps {
  isVisible: boolean;
  target?: Type2TargetItem;
  targets?: Type2TargetItem[];
}

// Backward-compatible alias
export type ApprovalType2FollowupProps = Type2ApprovalCardProps;

/**
 * Validation Options and Result
 */
export interface ValidateType2Options {
  items?: Type2ProductFollowupItem[];
  customersList?: Array<{ id: string; name: string }>;
  selectedWorkTypes?: string[];
}

export interface Type2ValidationResult {
  isValid: boolean;
  error?: string;
}
