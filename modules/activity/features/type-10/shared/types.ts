import type { ImageFile } from "@/modules/activity/application/media/image-uploader";
import type { FarmerFeedback } from "./constants";

export type { ImageFile as Type10ImageFile, FarmerFeedback };

export type Type10ProductRole = "SHOWCASE" | "TARGET" | "ADDITIONAL_SALE";

export interface Type10SoldProductItem {
  id?: string;
  targetId?: string;
  productId?: string | null;
  productName: string;
  productCode?: string | null;
  productRole?: Type10ProductRole | string;
  // Quantity fields
  quantity?: string | number;
  quantityCases?: string | number;
  actualQty?: string | number;
  actualQuantity?: string | number;
  // Price & amount fields
  unitPrice?: number;
  pricePerCase?: number;
  amount?: string | number;
  targetAmount?: string | number;
  actualSales?: string | number;
  actualTotal?: string | number;
  remarks?: string | null;
  actualNotes?: string | null;
  isCustomProduct?: boolean;
}

export interface Type10TargetEntity {
  id: string;
  activityPlanId: string;
  demoPlotId?: string | null;
  plotName?: string | null;
  farmerName?: string | null;
  cropCategory?: string | null;
  cropName?: string | null;
  location?: string | null;
  province?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  showcaseProductId?: string | null;
  showcaseProductName?: string | null;
  targetAttendeesCount?: number | null;
  targetBookingSales?: number | string | null;
  eventDate?: Date | string | null;
  notes?: string | null;
  products?: Type10ProductEntity[];
  result?: Type10ResultEntity | null;
  demoPlot?: any | null;
  showcaseProduct?: any | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Type10ProductEntity {
  id: string;
  activityPlanId: string;
  targetId: string;
  productId?: string | null;
  productName?: string | null;
  productRole: Type10ProductRole | string;
  targetQuantity?: number | string | null;
  targetUnitPrice?: number | string | null;
  targetAmount?: number | string | null;
  actualQuantity?: number | string | null;
  actualUnitPrice?: number | string | null;
  actualTotal?: number | string | null;
  actualNotes?: string | null;
  product?: any | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Type10ResultEntity {
  id: string;
  activityPlanId: string;
  targetId: string;
  actualAttendeesCount: number;
  actualTotalSales?: number | string | null;
  farmerFeedback?: FarmerFeedback | string | null;
  targetFarmersList?: string | null;
  summary?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Type10ProductOption {
  id: string;
  name: string;
  productCode?: string | null;
  price?: number | null;
  unit?: string | null;
}

export interface Type10DemoPlotOption {
  id: string;
  code?: string;
  name: string;
  location?: string;
  targetCrop?: string;
  showcase?: string;
  ownerName?: string;
  farmerName?: string;
  cropCategory?: string;
  cropName?: string;
  customCropName?: string;
  productId?: string;
  productName?: string;
  primaryProductName?: string;
  areaRai?: number;
  treeCount?: number;
  startDate?: string;
  status?: string;
  latitude?: string;
  longitude?: string;
  province?: string;
  district?: string;
  subdistrict?: string;
  dealerId?: string;
  dealerName?: string;
}
