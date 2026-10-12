import type { Type7DemoPlotItem } from "@/modules/activity-plans/features/shared/form/types";

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

export type { Type7DemoPlotItem };
