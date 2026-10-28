import type { ImageFile } from "@/modules/activity/application/media/image-uploader";
import type { ExternalChemicalFormula } from "./constants";

export type { ImageFile as Type13ImageFile, ExternalChemicalFormula };

export interface Type13PlotProduct {
  id?: string;
  productId: string;
  productName?: string | null;
  quantity?: number | string | null;
  unit?: string | null;
}

export interface Type13WithdrawnProductLine {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
}

export interface Type13PlotItem {
  id: string;
  demoPlotId?: string | null;
  name: string;
  storeId: string;
  dealerName?: string | null;
  ownerName?: string | null;
  province: string;
  district: string;
  subdistrict?: string | null;
  village?: string | null;
  objective?: string | null;
  plannedPlotsCount?: number | string | null;
  actualPlotsCount?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  actualLatitude?: number | string | null;
  actualLongitude?: number | string | null;
  hasProductWithdrawal?: boolean;
  withdrawnProducts?: Type13WithdrawnProductLine[];
  products?: Type13PlotProduct[];
  result?: any;
  results?: any[];
}

export type Type13TargetItem = Type13PlotItem;

export interface Type13ExternalProduct {
  company: string;
  productName: string;
  activeIngredient?: string | null;
  formula: string;
  customFormula?: string | null;
  applicationRate: string;
}

export interface Type13SprayingProduct {
  productId: string;
  productName?: string | null;
  actualRate: string;
  quantityUsed: number | string;
  unit?: string | null;
  detail?: string | null;
  actualQuantity?: number | string;
  extraQuantity?: number | string;
  extraUnit?: string;
}

export interface Type13SprayingRoundAttachment {
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface Type13SprayingRound {
  id?: string;
  demoPlotId?: string | null;
  clientPlotId?: string | null;
  roundNumber: number;
  sprayDate: string;
  sprayMethod: "SINGLE" | "TANK_MIXED";
  sprayEquipment: string;
  otherEquipment?: string | null;
  productResponse: string;
  problemDetail?: string | null;
  workTypeCode?: string;
  products: Type13SprayingProduct[];
  externalProducts?: Type13ExternalProduct[];
  attachments?: Type13SprayingRoundAttachment[];
}

export interface DealerOption {
  id: string;
  name: string;
  customerType?: string;
  province?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  responsibleEmployeeId?: string | null;
}

export interface ProductOption {
  id: string;
  name: string;
  unit?: string | null;
  productCode?: string | null;
  price?: number | null;
  categoryId?: string | null;
}
