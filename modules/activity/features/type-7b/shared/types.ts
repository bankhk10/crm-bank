import type { ImageFile } from "@/modules/activity/domain/summary/types";
import type { Prisma } from "@prisma/client";

export type { ImageFile };
export type Type7bImageFile = ImageFile;

export interface Type7bWithdrawnProductLine {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit?: string | null;
  notes?: string | null;
}

export interface Type7bPlotInput {
  id?: string;
  demoPlotId?: string | null;
  plotName?: string | null;
  cropName?: string | null;
  farmerName?: string | null;
  ownerName?: string | null;
  province?: string | null;
  district?: string | null;
  areaRai?: number | null;
  treeCount?: number | null;
  dealerName?: string | null;
  dealerStoreName?: string | null;
  latitude?: string | number | Prisma.Decimal | null;
  longitude?: string | number | Prisma.Decimal | null;
  notes?: string | null;
}

export interface Type7bProductInput {
  id?: string;
  productId?: string | null;
  productName?: string | null;
  quantity?: number | null;
  quantityUsed?: number | null;
  unit?: string | null;
  notes?: string | null;
}

export interface Type7bDataInput {
  sourceActivityPlanId?: string | null;
  demoPlotId?: string | null;
  storeId?: string | null;
  dealerName?: string | null;
  farmerName?: string | null;
  farmerPhone?: string | null;
  province?: string | null;
  district?: string | null;
  cropCategory?: string | null;
  cropName?: string | null;
  areaRai?: number | null;
  treeCount?: number | null;
  sprayRound?: number | null;
  sprayDate?: Date | string | null;
  daysSinceStart?: number | null;
  cropAgeValue?: number | null;
  cropAgeUnit?: string | null;
  growthStage?: string | null;
  cropCondition?: string | null;
  sprayMethod?: string | null;
  sprayEquipment?: string | null;
  otherEquipment?: string | null;
  notes?: string | null;
  objective?: string | null;
  hasProducts?: boolean;
  plots?: Type7bPlotInput[];
  products?: Type7bProductInput[];
}

export interface Type7bDemoPlotOption {
  id: string;
  code?: string;
  name: string;
  location?: string;
  targetCrop?: string;
  showcase?: string;
  ownerName?: string;
  cropCategory?: string;
  cropName?: string;
  customCropName?: string;
  productId?: string;
  productName?: string;
  areaRai?: number;
  treeCount?: number;
  startDate?: string;
  status?: string;
  visitsCount?: number;
  totalCost?: number;
  daysSinceStart?: number;
  objective?: string;
  experimentDetail?: string;
  latitude?: string;
  longitude?: string;
  province?: string;
  district?: string;
  initialSprayDate?: string;
  nextSprayDate?: string;
  mainCropInfo?: string;
  sprayMethod?: string;
  hasExternalChemicals?: boolean;
  dealerId?: string;
  dealerName?: string;
  activityName?: string;
  activityCode?: string;
  activityType?: string;
  demoProducts?: any[];
  externalProducts?: any[];
  irrigations?: any[];
}

export interface Type7bFollowUpPlotItem {
  id: string; // demoPlotId
  code?: string; // e.g. "DP26090001"
  name: string; // ชื่อแปลง
  cropName: string; // ชนิดพืช
  cropCategory?: string;
  ownerName: string; // เจ้าของแปลง
  province: string;
  district: string;
  areaRai?: number;
  treeCount?: number;
  dealerName?: string;
  dealerId?: string;
}

export interface Type7bFollowUpPlanOption {
  planId: string;
  planCode?: string;
  planTitle: string;
  planDate?: string;
  plots: Type7bFollowUpPlotItem[];
}

export interface Type7bProductOption {
  id: string;
  name: string;
  productCode?: string | null;
  unit?: string | null;
  packageSizeUnit?: string | null;
  price?: number | null;
}
