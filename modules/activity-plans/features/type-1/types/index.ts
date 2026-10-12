/**
 * Image attachment definition for TYPE 1
 */
export interface Type1ImageFile {
  id: string;
  url: string;
  name: string;
  size?: number;
  type?: string;
  rawFile?: File;
}

// Backward-compatible alias
export type ImageFile = Type1ImageFile;

/**
 * Single Target item for TYPE 1 Plan / Detail / Actual
 */
export interface Type1TargetItem {
  id?: string;
  customer: string;
  topic: string;
  detail: string;
  opportunity?: string;
  nextDate?: string;
  visitPurpose?: "FARMER" | "STORE";
  customerType?: string;
  province?: string;
  isUnregisteredFarmer?: boolean;
  unregisteredFarmerName?: string;
  unregisteredFarmerPhone?: string;
  farmerHomeAddress?: string;
  plotLatitude?: string | number | null;
  plotLongitude?: string | number | null;
  plotImages?: Type1ImageFile[];
}

/**
 * UI Form representation of a TYPE 1 Visit item (Plan stage)
 */
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

/**
 * Customer lookup option for Farmer / Dealer selection
 */
export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  customerType?: string;
  province?: string | null;
  district?: string | null;
  phone?: string | null;
  responsibleEmployeeId?: string | null;
  addressLine?: string | null;
  subdistrict?: string | null;
  postalCode?: string | null;
}

/**
 * Product lookup option for TYPE 1 Actual
 */
export interface ProductOption {
  id: string;
  name: string;
  productCode?: string | null;
}

/**
 * Props for Type 1 Plan Form component (Create & Edit)
 */
export interface Type1PlanFormProps {
  readonly?: boolean;
  type1Items: Type1VisitItem[];
  addType1Row?: () => void;
  updateType1Row: (id: string, field: keyof Type1VisitItem, val: any) => void;
  deleteType1Row?: (id: string) => void;
  customers?: CustomerOption[];
}

// Backward-compatible alias
export type Type1VisitProps = Type1PlanFormProps;

/**
 * Props for Type 1 Actual Form component (Actual & Unplanned recording)
 */
export interface Type1ActualFormProps {
  isVisible: boolean;
  target?: Type1TargetItem;
  targets?: Type1TargetItem[];
  planType?: "PLANNED" | "UNPLANNED" | string;
  productAdvice: string;
  setProductAdvice: (v: string) => void;
  detail?: string;
  setDetail?: (v: string) => void;
  discussionResult: string;
  setDiscussionResult: (v: string) => void;
  salesOpportunity: "สูง" | "ต่ำ" | "";
  setSalesOpportunity: (v: "สูง" | "ต่ำ" | "") => void;
  nextAction: string;
  setNextAction: (v: string) => void;
  nextMeetingDate: string;
  setNextMeetingDate: (v: string) => void;
  products?: ProductOption[];

  // Actual TYPE_1 fields
  farmerHomeAddress?: string;
  setFarmerHomeAddress?: (v: string) => void;
  plotLatitude?: string;
  setPlotLatitude?: (v: string) => void;
  plotLongitude?: string;
  setPlotLongitude?: (v: string) => void;
  plotImages?: Type1ImageFile[];
  setPlotImages?: (v: Type1ImageFile[]) => void;
}

// Backward-compatible alias
export type ActualType1VisitProps = Type1ActualFormProps;

/**
 * Props for Type 1 Detail View component
 */
export interface Type1DetailViewProps {
  isVisible: boolean;
  target?: Type1TargetItem;
  targets?: Type1TargetItem[];
  productAdvice?: string;
  discussionResult?: string;
  salesOpportunity?: "สูง" | "ต่ำ" | "";
  nextAction?: string;
  nextMeetingDate?: string;
  farmerHomeAddress?: string;
  plotLatitude?: string | number | null;
  plotLongitude?: string | number | null;
  plotImages?: Type1ImageFile[];
}

// Backward-compatible alias
export type DetailType1VisitProps = Type1DetailViewProps;

/**
 * Props for Type 1 Approval View / Card component
 */
export interface Type1ApprovalCardProps {
  isVisible: boolean;
  target?: Type1TargetItem;
  targets?: Type1TargetItem[];
}

// Backward-compatible alias
export type ApprovalType1VisitProps = Type1ApprovalCardProps;

/**
 * Props for Type1PlanCard summary component
 */
export interface Type1PlanCardProps {
  planType?: string;
  target?: Type1TargetItem;
  targets?: Type1TargetItem[];
  className?: string;
}

/**
 * Normalized database record representation for TYPE 1 (activity_plan_stores)
 */
export interface Type1PlanStoreRecord {
  id?: string;
  activityPlanId: string;
  workTypeCode: "TYPE_1";
  visitPurpose: "FARMER" | "STORE";
  storeId?: string | null;
  storeName?: string | null;
  province?: string | null;
  isUnregisteredFarmer: boolean;
  unregisteredFarmerName?: string | null;
  unregisteredFarmerPhone?: string | null;
  remarks?: string | null; // Used for topic
  notes?: string | null; // Used for detail
}

/**
 * TYPE 1 Actual Result outcome data (activity_results + attachments)
 */
export interface Type1ActualData {
  productAdvice?: string | null;
  discussionResult?: string | null;
  salesOpportunity?: "สูง" | "ต่ำ" | "" | null;
  nextMeetingDate?: Date | string | null;
  farmerHomeAddress?: string | null;
  plotLatitude?: number | string | null;
  plotLongitude?: number | string | null;
  plotImages?: ImageFile[];
}

/**
 * Options for pure form validation
 */
export interface ValidateType1Options {
  item?: Type1VisitItem;
  customersList?: Array<{ id: string; name: string }>;
  selectedWorkTypes?: string[];
}

/**
 * Result of validation
 */
export interface Type1ValidationResult {
  isValid: boolean;
  error?: string;
}
