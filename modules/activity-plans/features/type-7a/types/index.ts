import type {
  ActualTargetsState,
  ImageFile,
  DemoPlotProductItem,
  DemoPlotExternalProductItem,
} from "@/modules/activity-plans/features/shared/actual-view/types";
import type { Type7DemoPlotItem } from "@/modules/activity-plans/features/shared/form/types";

/**
 * Type 7A (ทำแปลงสาธิตใหม่ - New Demo Plot Creation) - Domain Types
 * Single Source of Truth for Type 7A data structures.
 */

export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  customerType?: string | null;
  province?: string | null;
  district?: string | null;
  responsibleEmployeeId?: string | null;
  phone?: string | null;
  telephone?: string | null;
}

export interface ProductOption {
  id: string;
  name: string;
  productCode?: string | null;
  categoryId?: string | null;
  productGroupId?: string | null;
  price?: number | null;
  unit?: string | null;
  packageSizeUnit?: string | null;
}

export interface ProductCategoryOption {
  id: string;
  code: string;
  description: string;
  name?: string;
}

export interface ChemicalGroupOption {
  id: string;
  code: string;
  name: string;
  description?: string | null;
}

export interface Type7DemoProductLine {
  id: string;
  productId?: string;
  productName: string;
  quantity: number;
  unit?: string;
}

export interface Type7aDemoProductItem {
  id?: string;
  productId?: string;
  productName?: string;
  quantity?: number;
  targetQuantity?: number;
  unit?: string | null;
  applicationRate?: string | null;
  notes?: string | null;
  isAdditional?: boolean;
  plannedQuantity?: number | null;
  remainingQuantity?: number | null;
}

export interface Type7aPlanItem {
  id?: string;
  demoPlotId?: string | null;
  plotName?: string | null;
  name?: string | null;
  ownerName?: string | null;
  farmerName?: string | null;
  storeId?: string | null;
  province?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  cropCategory?: string | null;
  cropName?: string | null;
  customCropName?: string | null;
  areaRai?: number | null;
  treeCount?: number | null;
  objective?: string | null;
  notes?: string | null;
  categoryId?: string | null;
  chemicalGroupId?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  hasProducts?: boolean;
  demoProducts?: Type7aDemoProductItem[];
  products?: Type7aDemoProductItem[];
}

export interface Type7aTargetItem {
  id?: string;
  plotName?: string;
  owner?: string;
  ownerName?: string;
  farmerName?: string;
  storeId?: string;
  dealerName?: string;
  dealerCode?: string;
  location?: string;
  province?: string;
  district?: string;
  objective?: string;
  categoryName?: string;
  categoryCode?: string;
  chemicalGroupName?: string;
  cropCategory?: string;
  crop?: string;
  cropName?: string;
  areaRai?: number | string | null;
  treeCount?: number | string | null;
  plots?: string;
  demoProducts?: Array<{
    productId?: string;
    productName?: string;
    quantity?: number | string;
    targetQuantity?: number | string;
    unit?: string | null;
    [key: string]: any;
  }>;
  items?: any[];
  activityType?: string;
  product?: string;
  productId?: string;
  plannedProductId?: string;
  demoProductQuantity?: string | number | null;
  detail?: string;
  experimentDetail?: string;
  targetCondition?: string;
  [key: string]: any;
}

export interface Type7aActualRecord {
  t7FarmerProvince?: string;
  t7FarmerDistrict?: string;
  t7FarmerCustomerId?: string | null;
  t7FarmerName?: string;
  t7FarmerPhone?: string;
  t7IsUnregisteredFarmer?: boolean;
  t7DealerName?: string;
  t7DealerCode?: string;
  t7Latitude?: number;
  t7Longitude?: number;
  t7PlotName?: string;
  t7District?: string;
  t7CropCategory?: string;
  t7CropName?: string;
  t7CustomCropName?: string;
  t7AreaRai?: string | number;
  t7TreeCount?: string | number;
  t7PlotObjective?: string;
  t7ExperimentDetail?: string;
  t7MainCropInfo?: string;
  t7Irrigations?: string[];
  t7PlantingDate?: string;
  t7InitialSprayDate?: string;
  t7NextSprayDate?: string;
  t7NextFollowUpDate?: string;
  t7CropAgeValue?: string | number;
  t7CropAgeUnit?: string;
  t7GrowthStage?: string;
  t7CropCondition?: string;
  t7CropProblemDesc?: string;
  t7CropProblemDescription?: string;
  t7ProblemDescription?: string;
  t7ProductResponse?: string;
  t7DemoProducts?: any[];
  t7SprayMethod?: string;
  t7SprayEquipment?: string;
  t7OtherEquipment?: string;
  t7HasExternalChemicals?: boolean;
  t7ExternalProducts?: any[];
  t7InitialPhotos?: any[];
  t7PlotImages?: any[];
  t7CropImages?: any[];
  t7UsageMethod?: string;
  t7PlantingAreaCondition?: string;
  t7Notes?: string;
  t7DemoPlotId?: string | null;
  t7DemoResults?: any[];
  t7PlannedProductId?: string | null;
  t7ActualProductId?: string | null;
  t7DemoProductQuantity?: string | number | null;
  t7PlannedProductName?: string | null;
  t7ActualProductName?: string | null;
  t7ChangeReason?: string | null;
  t7PlotStatus?: string;
  t7FinalYieldKg?: string;
  t7ControlYieldKg?: string;
  t7YieldIncreasePercent?: string;
  t7FarmerSatisfaction?: number;
  t7CommercialPotential?: string;
  t7FinalSummaryNotes?: string;
  [key: string]: any;
}

// ============================================================================
// Plan Card Props & Target Types
// ============================================================================

export interface Type7aPlanTarget {
  plotName?: string;
  owner?: string;
  dealerName?: string;
  location?: string;
  province?: string;
  district?: string;
  objective?: string;
  categoryName?: string;
  categoryCode?: string;
  chemicalGroupName?: string;
  cropCategory?: string;
  crop?: string;
  cropName?: string;
  areaRai?: number | string | null;
  treeCount?: number | string | null;
  plots?: string;
  demoProducts?: Array<{
    productName?: string;
    quantity?: number | string;
    targetQuantity?: number | string;
    unit?: string | null;
    [key: string]: any;
  }>;
  items?: any[];
  [key: string]: any;
}

export interface Type7aPlanCardProps {
  target?: Type7aPlanTarget;
  planType?: string;
  className?: string;
}

// ============================================================================
// Component Props Interfaces
// ============================================================================

export interface Type7aPlanFormProps {
  item: Type7DemoPlotItem;
  updateType7Row: (
    id: string,
    field: keyof Type7DemoPlotItem,
    val: any,
  ) => void;
  customerOptions?: Array<{ value: string; label: string; subLabel?: string }>;
  productOptions?: Array<{ value: string; label: string; subLabel?: string }>;
  cropCategoryOptions: Array<{ value: string; label: string }>;
  customers?: CustomerOption[];
  products?: ProductOption[];
  productCategories?: ProductCategoryOption[];
  chemicalGroups?: ChemicalGroupOption[];
  readonly?: boolean;
}

export interface Type7aActualFormProps {
  isVisible?: boolean;
  planType?: "PLANNED" | "UNPLANNED" | string;
  target?: Type7aTargetItem;
  targets?: Type7aTargetItem[];
  customers?: CustomerOption[];
  products?: Array<{
    id: string;
    name: string;
    productCode?: string | null;
    unit?: string | null;
    categoryId?: string | null;
    productGroupId?: string | null;
    packageSizeUnit?: string | null;
  }>;
  planProvince?: string;

  // Form Fields
  farmerProvince?: string;
  setFarmerProvince?: (v: any) => void;
  farmerDistrict?: string;
  setFarmerDistrict?: (v: any) => void;
  farmerCustomerId?: string | null;
  setFarmerCustomerId?: (v: any) => void;
  farmerName?: string;
  setFarmerName?: (v: any) => void;
  farmerPhone?: string;
  setFarmerPhone?: (v: any) => void;
  isUnregisteredFarmer?: boolean;
  setIsUnregisteredFarmer?: (v: any) => void;
  dealerName?: string;
  setDealerName?: (v: any) => void;
  dealerCode?: string;
  setDealerCode?: (v: any) => void;
  latitude?: string;
  setLatitude?: (v: any) => void;
  longitude?: string;
  setLongitude?: (v: any) => void;
  district?: string;
  setDistrict?: (v: any) => void;
  cropCategory?: string;
  setCropCategory?: (v: any) => void;
  cropName?: string;
  setCropName?: (v: any) => void;
  customCropName?: string;
  setCustomCropName?: (v: any) => void;
  areaRai?: string | number;
  setAreaRai?: (v: any) => void;
  treeCount?: string | number;
  setTreeCount?: (v: any) => void;
  plotObjective?: string;
  setPlotObjective?: (v: any) => void;
  experimentDetail?: string;
  setExperimentDetail?: (v: any) => void;
  mainCropInfo?: string;
  setMainCropInfo?: (v: any) => void;
  irrigations?: string[];
  setIrrigations?: (v: any) => void;
  plantingDate?: string;
  setPlantingDate?: (v: any) => void;
  initialSprayDate?: string;
  setInitialSprayDate?: (v: any) => void;
  nextSprayDate?: string;
  setNextSprayDate?: (v: any) => void;
  cropAgeValue?: string | number;
  setCropAgeValue?: (v: any) => void;
  cropAgeUnit?: string;
  setCropAgeUnit?: (v: any) => void;
  growthStage?: string;
  setGrowthStage?: (v: any) => void;
  cropCondition?: string;
  setCropCondition?: (v: any) => void;
  productResponse?: string;
  setProductResponse?: (v: any) => void;
  demoProducts?: DemoPlotProductItem[];
  setDemoProducts?: (v: any) => void;
  sprayMethod?: "SINGLE" | "TANK_MIXED";
  setSprayMethod?: (v: any) => void;
  sprayEquipment?: string;
  setSprayEquipment?: (v: any) => void;
  otherEquipment?: string;
  setOtherEquipment?: (v: any) => void;
  hasExternalChemicals?: boolean;
  setHasExternalChemicals?: (v: any) => void;
  externalProducts?: DemoPlotExternalProductItem[];
  setExternalProducts?: (v: any) => void;
  initialPhotos?: ImageFile[];
  setInitialPhotos?: (v: any) => void;
  plotName?: string;
  setPlotName?: (v: any) => void;
  t7PlotName?: string;
  setT7PlotName?: (v: any) => void;
  nextFollowUpDate?: string;
  setNextFollowUpDate?: (v: any) => void;
  customPlotDetail?: string;
  setCustomPlotDetail?: (v: any) => void;
  usageMethod?: string;
  setUsageMethod?: (v: any) => void;
  notes?: string;
  setNotes?: (v: any) => void;
  plantingAreaCondition?: string;
  setPlantingAreaCondition?: (v: any) => void;
  cropImages?: any[];
  setCropImages?: (v: any) => void;
  plotImages?: any[];
  setPlotImages?: (v: any) => void;

  // Single-product legacy compatibility props
  plannedProductId?: string | null;
  setPlannedProductId?: (id: any) => void;
  actualProductId?: string | null;
  setActualProductId?: (id: any) => void;
  actualQuantity?: string | number | null;
  setActualQuantity?: (qty: any) => void;
  plannedProductName?: string | null;
  actualProductName?: string | null;
  changeReason?: string | null;
  setChangeReason?: (reason: any) => void;
  demoPlotId?: string | null;
  setDemoPlotId?: (id: any) => void;

  readonly?: boolean;
}

export interface DemoResultItemData {
  id?: string;
  plannedProductId?: string | null;
  actualProductId?: string | null;
  changeReason?: string | null;
  plotObjective?: string | null;
  plannedProduct?: {
    id: string;
    name: string;
    productCode?: string | null;
    unit?: string | null;
    packageSizeUnit?: string | null;
  } | null;
  actualProduct?: {
    id: string;
    name: string;
    productCode?: string | null;
    unit?: string | null;
    packageSizeUnit?: string | null;
  } | null;
  demoPlotId?: string | null;
}

export interface Type7aDetailViewProps {
  target: {
    activityType?: "CREATE" | "FOLLOW_UP" | string;
    owner?: string;
    product?: string;
    crop?: string;
    plots?: string;
    targetCondition?: string;
    demoProductQuantity?: string | number | null;
    objective?: string;
    experimentDetail?: string;
    detail?: string;
    items?: any[];
    [key: string]: any;
  };
  targets?: Type7aTargetItem[];
  demoPlotData?: any;
  demoPlotId?: string | null;
  farmerProvince?: string;
  farmerDistrict?: string;
  farmerName?: string;
  farmerPhone?: string;
  isUnregisteredFarmer?: boolean;
  dealerName?: string;
  dealerCode?: string;
  latitude?: string;
  longitude?: string;
  cropCategory?: string;
  cropName?: string;
  customCropName?: string;
  areaRai?: string | number;
  treeCount?: string | number;
  plotObjective?: string;
  experimentDetail?: string;
  mainCropInfo?: string;
  irrigations?: string[];
  plantingDate?: string;
  initialSprayDate?: string;
  nextSprayDate?: string;
  cropAgeValue?: string | number;
  cropAgeUnit?: string;
  growthStage?: string;
  cropCondition?: string;
  productResponse?: string;
  demoProducts?: DemoPlotProductItem[];
  sprayMethod?: "SINGLE" | "TANK_MIXED" | string;
  hasExternalChemicals?: boolean;
  externalProducts?: DemoPlotExternalProductItem[];
  initialPhotos?: ImageFile[];
  results?: DemoResultItemData[];

  demoResults?: any[];
  plannedProductId?: string | null;
  actualProductId?: string | null;
  actualQuantity?: string | number | null;
  plannedProductName?: string | null;
  actualProductName?: string | null;
  changeReason?: string | null;
  customPlotDetail?: string | null;
  plotName?: string | null;
  usageMethod?: string | null;
  notes?: string | null;
  plantingAreaCondition?: string | null;
  cropImages?: any[];
  plotImages?: any[];
}

export interface Type7aApprovalCardProps {
  isVisible: boolean;
  target: ActualTargetsState["t7"] | any;
  targets?: Type7aTargetItem[];
}

// ============================================================================
// Application Validation Types
// ============================================================================

export interface ValidateType7aOptions {
  items?: Type7DemoPlotItem[];
  customersList?: any[];
  productsList?: any[];
  selectedWorkTypes?: string[];
}

export interface Type7aValidationResult {
  isValid: boolean;
  error?: string;
}

export interface Type7aActualValidationInput {
  activityResultStatus?: string;
  t7FarmerProvince?: string;
  t7IsUnregisteredFarmer?: boolean;
  t7FarmerName?: string;
  t7FarmerPhone?: string;
  t7FarmerCustomerId?: string | null;
  t7Latitude?: string | number | null;
  t7Longitude?: string | number | null;
  t7PlotName?: string;
  t7CropCategory?: string;
  t7CropName?: string;
  t7InitialSprayDate?: string;
  t7DemoProducts?: Array<{
    productId: string;
    productName?: string;
    plannedQuantity?: number | string | null;
    quantity: number | string;
    remainingQuantity?: number | string | null;
    unit?: string | null;
    applicationRate: string;
  }>;
  t7SprayMethod?: "SINGLE" | "TANK_MIXED";
  t7HasExternalChemicals?: boolean;
  t7ExternalProducts?: Array<{
    company: string;
    productName: string;
    activeIngredient?: string;
    formula: string;
    customFormula?: string;
    applicationRate: string;
  }>;
  t7InitialPhotos?: ImageFile[];
}

// ============================================================================
// Backward-Compatible Aliases
// ============================================================================

export type Type7NewDemoProps = Type7aPlanFormProps;
export type ActualType7NewDemoProps = Type7aActualFormProps;
export type DetailType7NewDemoProps = Type7aDetailViewProps;
export type ApprovalType7aDemoProps = Type7aApprovalCardProps;
export type TargetDemoItem = Type7aTargetItem;
export type EditCustomerOption = CustomerOption;
export type EditProductOption = ProductOption;
export type EditProductCategoryOption = ProductCategoryOption;
export type EditChemicalGroupOption = ChemicalGroupOption;
export type EditType7aNewDemoProps = Type7aPlanFormProps;
export type { Type7DemoPlotItem };
