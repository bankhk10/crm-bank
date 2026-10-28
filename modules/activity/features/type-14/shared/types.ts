import type { ImageFile } from "@/modules/activity/application/media/image-uploader";

export type { ImageFile as Type14ImageFile };

export interface FollowUpPlotOption {
  id: string;
  planId?: string;
  name: string;
  code?: string;
  ownerName?: string;
  dealerId?: string;
  dealerName?: string;
  province?: string;
  district?: string;
  subdistrict?: string;
  village?: string;
  latitude?: string;
  longitude?: string;
  cropCategory?: string;
  cropName?: string;
  areaRai?: number;
  treeCount?: number;
  plannedPlotsCount?: number;
}

export interface FollowUpPlanOption {
  planId: string;
  planTitle: string;
  planCode?: string;
  planDate?: string;
  plots: FollowUpPlotOption[];
}

export interface DealerCustomerOption {
  id: string;
  name: string;
  customerCode?: string;
  province?: string;
  district?: string;
}

export interface ProductOption {
  id: string;
  name: string;
  unit?: string | null;
  productCode?: string | null;
}

export interface Type14WithdrawnProductLine {
  id: string;
  productId: string;
  productName?: string;
  quantity: number;
  unit?: string;
}

export interface Type14PlotItem {
  id: string;
  type13TargetId?: string | null;
  demoPlotId?: string | null;
  name: string;
  plotName?: string;
  storeId?: string;
  dealerName?: string | null;
  ownerName?: string | null;
  cropCategory?: string | null;
  cropName?: string | null;
  areaRai?: number | null;
  treeCount?: number | null;
  province: string;
  district: string;
  subdistrict?: string | null;
  village?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  plannedPlotsCount?: number | string | null;
  actualPlotsCount?: number | string | null;
  notes?: string | null;
  products?: Array<{
    id?: string;
    productId: string;
    productName?: string | null;
    quantity?: number | string | null;
    unit?: string | null;
  }>;
}

export type Type14TargetItem = Type14PlotItem;

export interface Type14PlotActualState {
  id?: string;
  targetId?: string;
  demoPlotId?: string | null;
  type13TargetId?: string | null;
  clientPlotId?: string;
  name?: string;
  plotName?: string;
  storeId?: string;
  dealerName?: string | null;
  ownerName?: string | null;
  cropCategory?: string | null;
  cropName?: string | null;
  province?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  village?: string | null;
  plannedPlotsCount?: number | string | null;
  actualPlotsCount?: number | string | null;
  daysAfterSpray?: number | string | null;
  trackingResult?: string | null;
  productResponse?: string | null;
  additionalNotes?: string | null;
  notes?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  products?: Type14ActualProductState[];
  afterSprayImages?: ImageFile[];
}

export interface Type14ActualProductState {
  productId: string;
  productName?: string | null;
  unit?: string | null;
  withdrawnQuantity?: number | string | null;
  plannedQuantity?: number | string | null;
  actualQuantity?: number | string | null;
  extraQuantity?: number | string | null;
  extraUnit?: string | null;
  actualRate?: string | null;
  applicationRate?: string | null;
  quantityUsed?: number | string | null;
  detail?: string | null;
}

export interface Type14SprayRoundState {
  id?: string;
  roundNumber: number; // 1, 2, 3...
  actualVisitDate: string;
  daysAfterSpray: string;
  trackingResult: string;
  productResponse?: string;
  additionalNotes: string;
  afterSprayImages: ImageFile[];
  products: Type14ActualProductState[];
}
