import type { Type13PlotItem } from "../shared/types";

export interface Type13DetailActualProduct {
  productId: string;
  productName?: string | null;
  actualRate: string;
  quantityUsed: any;
  unit?: string | null;
  detail?: string | null;
}

export interface Type13DetailExternalProduct {
  company: string;
  productName: string;
  activeIngredient?: string | null;
  formula: string;
  customFormula?: string | null;
  applicationRate: string;
}

export interface Type13DetailSprayRound {
  demoPlotId: string;
  roundNumber: number;
  sprayDate: any;
  sprayMethod: string;
  sprayEquipment: string;
  otherEquipment?: string | null;
  productResponse: string;
  problemDetail?: string | null;
  products: Type13DetailActualProduct[];
  externalProducts?: Type13DetailExternalProduct[];
  attachments?: Array<{
    fileUrl: string;
    fileName?: string;
  }>;
}

export interface Type13DetailData {
  type13PlotsActual?: Array<{ demoPlotId: string; latitude: any; longitude: any }>;
  sprayRounds?: Type13DetailSprayRound[];
  attachments?: Array<{
    demoPlotId?: string | null;
    sprayRoundId?: string | null;
    fileUrl: string;
    fileName?: string;
  }>;
}

export interface Type13DetailProps {
  plots: Type13PlotItem[];
  planSummary?: {
    province?: string | null;
    district?: string | null;
  };
  actualData?: Type13DetailData;
}
