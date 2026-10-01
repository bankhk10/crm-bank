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
  isVisible: boolean;
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
  }>;
  planProvince?: string;

  // Form Fields
  farmerProvince: string;
  setFarmerProvince: (v: string) => void;
  farmerDistrict: string;
  setFarmerDistrict: (v: string) => void;
  farmerCustomerId: string | null;
  setFarmerCustomerId: (v: string | null) => void;
  farmerName: string;
  setFarmerName: (v: string) => void;
  farmerPhone: string;
  setFarmerPhone: (v: string) => void;
  isUnregisteredFarmer: boolean;
  setIsUnregisteredFarmer: (v: boolean) => void;
  dealerName: string;
  setDealerName: (v: string) => void;
  dealerCode: string;
  setDealerCode: (v: string) => void;
  latitude: string;
  setLatitude: (v: string) => void;
  longitude: string;
  setLongitude: (v: string) => void;
  district: string;
  setDistrict: (v: string) => void;
  cropCategory: string;
  setCropCategory: (v: string) => void;
  cropName: string;
  setCropName: (v: string) => void;
  customCropName: string;
  setCustomCropName: (v: string) => void;
  areaRai: string;
  setAreaRai: (v: string) => void;
  treeCount: string;
  setTreeCount: (v: string) => void;
  plotObjective: string;
  setPlotObjective: (v: string) => void;
  experimentDetail: string;
  setExperimentDetail: (v: string) => void;
  mainCropInfo: string;
  setMainCropInfo: (v: string) => void;
  irrigations: string[];
  setIrrigations: (v: string[]) => void;
  plantingDate: string;
  setPlantingDate: (v: string) => void;
  initialSprayDate: string;
  setInitialSprayDate: (v: string) => void;
  nextSprayDate: string;
  setNextSprayDate: (v: string) => void;
  cropAgeValue: string;
  setCropAgeValue: (v: string) => void;
  cropAgeUnit: string;
  setCropAgeUnit: (v: string) => void;
  growthStage: string;
  setGrowthStage: (v: string) => void;
  cropCondition: "สมบูรณ์" | "มีปัญหา" | "ปานกลาง" | "ทรุดโทรม" | "";
  setCropCondition: (
    v: "สมบูรณ์" | "มีปัญหา" | "ปานกลาง" | "ทรุดโทรม" | "",
  ) => void;
  productResponse: "พืชตอบสนองดี" | "พบปัญหา" | "";
  setProductResponse: (v: "พืชตอบสนองดี" | "พบปัญหา" | "") => void;
  demoProducts: DemoPlotProductItem[];
  setDemoProducts: (v: DemoPlotProductItem[]) => void;
  sprayMethod: "SINGLE" | "TANK_MIXED";
  setSprayMethod: (v: "SINGLE" | "TANK_MIXED") => void;
  hasExternalChemicals: boolean;
  setHasExternalChemicals: (v: boolean) => void;
  externalProducts: DemoPlotExternalProductItem[];
  setExternalProducts: (v: DemoPlotExternalProductItem[]) => void;
  initialPhotos: ImageFile[];
  setInitialPhotos: (v: ImageFile[]) => void;
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
  cropCondition?: "สมบูรณ์" | "มีปัญหา" | "ปานกลาง" | "ทรุดโทรม" | "";
  productResponse?: "พืชตอบสนองดี" | "พบปัญหา" | "";
  demoProducts?: DemoPlotProductItem[];
  sprayMethod?: "SINGLE" | "TANK_MIXED";
  hasExternalChemicals?: boolean;
  externalProducts?: DemoPlotExternalProductItem[];
  initialPhotos?: ImageFile[];
  results?: DemoResultItemData[];
}

export interface ApprovalType7aDemoProps {
  isVisible: boolean;
  target: ActualTargetsState["t7"] | any;
}
