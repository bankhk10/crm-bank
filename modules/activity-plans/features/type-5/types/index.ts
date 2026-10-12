/**
 * Type 5 (สำรวจตลาดของคู่แข่ง - Competitor Market Survey) - Domain Types
 * Single Source of Truth for Type 5 data structures.
 */

export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  responsibleEmployeeId?: string | null;
}

export interface ProductOption {
  id: string;
  name: string;
  productCode?: string | null;
  price?: number | null;
  unit?: string | null;
}

export interface Type5SurveyItem {
  id: string;
  storeId?: string;
  storeName: string;
  productId?: string;
  comparedProduct: string;
  detail: string;
}

export interface Type5ImageFile {
  id: string;
  url: string;
  name: string;
  size?: number;
  type?: string;
  category?: string;
  surveyItemId?: string;
  [key: string]: any;
}

export interface TargetSurveyItem {
  id?: string;
  storeId?: string;
  store?: string;
  storeName?: string;
  productId?: string;
  product?: string;
  productName?: string;
  detail?: string;
  notes?: string;
  [key: string]: any;
}

export interface Type5SurveyRecord {
  id?: string;
  storeId?: string;
  store: string;
  productId?: string;
  product: string;
  detail?: string;
  competitorBrand: string;
  competitorProduct: string;
  posPrice?: string | number | null;
  dealerPrice?: string | number | null;
  subdealerPrice?: string | number | null;
  farmerPrice?: string | number | null;
  sellingPoints?: string;
  bottleImages?: Type5ImageFile[];
  promotionalImages?: Type5ImageFile[];
  competitorPrice?: string;
  competitorUnit?: string;
  promotionDetail?: string;
  [key: string]: any;
}

/**
 * Type 5 Plan Target Representation (Multi-Target compliant)
 */
export interface Type5TargetItem {
  id?: string;
  storeId?: string;
  store: string;
  storeName?: string;
  productId?: string;
  product: string;
  productName?: string;
  detail?: string;
  notes?: string;
  items?: TargetSurveyItem[];
  [key: string]: any;
}

// ============================================================================
// Plan Card Props & Target Types
// ============================================================================

export interface Type5PlanCardTargetItem {
  id?: string;
  storeId?: string;
  store?: string;
  storeName?: string;
  productId?: string;
  product?: string;
  productName?: string;
  detail?: string;
  notes?: string;
  [key: string]: any;
}

export interface Type5PlanCardTarget {
  store?: string;
  storeId?: string;
  product?: string;
  productId?: string;
  detail?: string;
  notes?: string;
  items?: Type5PlanCardTargetItem[];
  [key: string]: any;
}

export interface Type5PlanCardProps {
  planType?: string;
  target?: Type5PlanCardTarget | null;
  className?: string;
}

// ============================================================================
// Form & View Component Props
// ============================================================================

export interface Type5PlanFormProps {
  readonly?: boolean;
  type5Items: Type5SurveyItem[];
  addType5Row: () => void;
  updateType5Row: (id: string, field: keyof Type5SurveyItem, val: any) => void;
  deleteType5Row: (id: string) => void;
  customers?: CustomerOption[];
  products?: ProductOption[];
}

export interface Type5ActualFormProps {
  isVisible: boolean;
  planType?: "PLANNED" | "UNPLANNED" | string;
  target?: Type5TargetItem;
  targets?: Type5TargetItem[];
  surveyDetails?: Type5SurveyRecord[];
  onUpdateSurveyItem?: (
    index: number,
    updated: Partial<Type5SurveyRecord>,
  ) => void;
  // Fallback single-item props
  competitorBrand?: string;
  setCompetitorBrand?: (v: string) => void;
  competitorProduct?: string;
  setCompetitorProduct?: (v: string) => void;
}

export interface Type5DetailViewProps {
  isVisible: boolean;
  target?: Type5TargetItem;
  targets?: Type5TargetItem[];
  surveyDetails?: Type5SurveyRecord[];
  competitorBrand?: string;
  competitorProduct?: string;
}

export interface Type5ApprovalCardProps {
  isVisible: boolean;
  target?: any; // Matches ActualTargetsState["t5"]
  targets?: Type5TargetItem[];
  surveyDetails?: Type5SurveyRecord[];
  competitorBrand?: string;
  competitorProduct?: string;
}

// ============================================================================
// Application Validation Types
// ============================================================================

export interface ValidateType5Options {
  items?: Type5SurveyItem[];
  customersList?: Array<{ id: string; name: string }>;
  productsList?: Array<{ id: string; name: string }>;
  selectedWorkTypes?: string[];
}

export interface Type5ValidationResult {
  isValid: boolean;
  error?: string;
}

// ============================================================================
// Backward-Compatible Aliases
// ============================================================================

export type Type5SurveyProps = Type5PlanFormProps;
export type ActualType5SurveyProps = Type5ActualFormProps;
export type DetailType5SurveyProps = Type5DetailViewProps;
export type ApprovalType5SurveyProps = Type5ApprovalCardProps;
export type EditType5SurveyProps = Type5PlanFormProps;
export type EditCustomerOption = CustomerOption;
export type EditProductOption = ProductOption;
