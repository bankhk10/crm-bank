import type { CustomerOption, ProductOption, Type7aImageFile } from "../../shared/types";
import type { Type7aTargetItem } from "./planned.types";

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
  t7AreaRai?: string | number | null;
  t7TreeCount?: string | number | null;
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
  t7InitialPhotos?: Type7aImageFile[];
  t7PlotImages?: Type7aImageFile[];
  t7CropImages?: Type7aImageFile[];
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
}

export interface Type7aActualFormProps {
  isVisible?: boolean;
  planType?: string;
  target?: Type7aTargetItem;
  targets?: Type7aTargetItem[];
  customers?: CustomerOption[];
  products?: ProductOption[];
  actualState?: Type7aActualRecord;
  onUpdateField?: (field: keyof Type7aActualRecord, value: any) => void;
  readonly?: boolean;
}

export type ActualType7NewDemoProps = Type7aActualFormProps;

export interface Type7aDetailViewProps {
  isVisible?: boolean;
  target?: Type7aTargetItem;
  targets?: Type7aTargetItem[];
  actualResult?: any;
  attachments?: any[];
}

export type DetailType7NewDemoProps = Type7aDetailViewProps;

export interface Type7aApprovalCardProps {
  isVisible?: boolean;
  plan?: any;
  target?: Type7aTargetItem;
  targets?: Type7aTargetItem[];
}

export type ApprovalType7aDemoProps = Type7aApprovalCardProps;
