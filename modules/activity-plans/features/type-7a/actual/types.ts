import type {
  ActualTargetsState,
  ImageFile,
  DemoPlotProductItem,
  DemoPlotExternalProductItem,
} from "@/modules/activity-plans/features/shared/actual-view/types";
import type { CustomerOption } from "../shared/types";

export interface TargetDemoItem {
  plotName?: string;
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
    productName: string;
    quantity: number;
    unit?: string;
  }>;
  [key: string]: any;
}

export interface ActualType7NewDemoProps {
  isVisible?: boolean;
  planType?: "PLANNED" | "UNPLANNED" | string;
  target?: TargetDemoItem;
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
  cropProblemDesc?: string;
  setCropProblemDesc?: (v: any) => void;
  cropProblemDescription?: string;
  setCropProblemDescription?: (v: any) => void;
  problemDescription?: string;
  setProblemDescription?: (v: any) => void;
  productResponse?: string;
  setProductResponse?: (v: any) => void;
  demoProducts?: DemoPlotProductItem[];
  setDemoProducts?: (v: any) => void;
  sprayMethod?: "SINGLE" | "TANK_MIXED" | string;
  setSprayMethod?: (v: any) => void;
  hasExternalChemicals?: boolean;
  setHasExternalChemicals?: (v: any) => void;
  externalProducts?: DemoPlotExternalProductItem[];
  setExternalProducts?: (v: any) => void;
  initialPhotos?: ImageFile[];
  setInitialPhotos?: (v: any) => void;

  plotName?: string;
  t7PlotName?: string;
  setPlotName?: (v: any) => void;
  setT7PlotName?: (v: any) => void;
  usageMethod?: string;
  setUsageMethod?: (v: any) => void;
  customPlotDetail?: string;
  setCustomPlotDetail?: (v: any) => void;
  plantingAreaCondition?: string;
  setPlantingAreaCondition?: (v: any) => void;
  nextFollowUpDate?: string;
  setNextFollowUpDate?: (v: any) => void;
  plotImages?: any[];
  setPlotImages?: (v: any[]) => void;
  cropImages?: any[];
  setCropImages?: (v: any[]) => void;
  plotStatus?: any;
  setPlotStatus?: (v: any) => void;

  plannedProductId?: string | null;
  setPlannedProductId?: (id: string | null) => void;
  actualProductId?: string | null;
  setActualProductId?: (id: string | null) => void;
  actualQuantity?: string | number | null;
  setActualQuantity?: (qty: any) => void;
  plannedProductName?: string | null;
  actualProductName?: string | null;
  changeReason?: string | null;
  setChangeReason?: (reason: any) => void;
  notes?: string | null;
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

export interface DetailType7NewDemoProps {
  target: {
    activityType?: "CREATE" | "FOLLOW_UP" | string;
    owner: string;
    product: string;
    crop: string;
    plots: string;
    targetCondition?: string;
    demoProductQuantity?: string | number | null;
    objective?: string;
    experimentDetail?: string;
    detail?: string;
    items?: any[];
  };
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

export interface ApprovalType7aDemoProps {
  isVisible: boolean;
  target: ActualTargetsState["t7"] | any;
}
