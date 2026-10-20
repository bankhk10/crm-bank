import type { ImageFile } from "@/modules/activity/application/media/image-uploader";
import type { FarmerFeedback } from "./constants";

export type { ImageFile as Type10ImageFile, FarmerFeedback };

export interface Type10SoldProductItem {
  id?: string;
  productId?: string | null;
  productName: string;
  productCode?: string | null;
  quantity?: string | number;
  actualQty?: string | number;
  actualSales?: string | number;
  amount?: string | number;
  unitPrice?: number;
  remarks?: string | null;
  isCustomProduct?: boolean;
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
  dealerId?: string;
  dealerName?: string;
}
