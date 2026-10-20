import type {
  Type13SprayingRound,
  Type13ImageFile,
  Type13PlotItem,
  ProductOption,
} from "../../shared/types";

export interface Type13ActualProductState {
  productId: string;
  productName?: string | null;
  actualRate: string;
  quantityUsed: number | string;
  unit?: string | null;
  detail?: string | null;
}

export interface Type13PlotActualState {
  clientPlotId?: string;
  demoPlotId?: string | null;
  plotName: string;
  storeId?: string;
  dealerName?: string;
  province?: string;
  district?: string;
  subdistrict?: string;
  village?: string;
  plannedPlotsCount?: number | string;
  actualPlotsCount?: number | string;
  applicationRate?: string;
  latitude: string;
  longitude: string;
  isNew?: boolean;
  afterSprayImages?: Type13ImageFile[];
  sprayRounds: Array<
    Omit<Type13SprayingRound, "products" | "demoPlotId"> & {
      demoPlotId?: string | null;
      clientPlotId?: string | null;
      products: Type13ActualProductState[];
    }
  >;
}

export interface Type13ActualProps {
  isVisible?: boolean;
  actualState: any;
  products: ProductOption[];
  dealers?: any[];
  readonly?: boolean;
  className?: string;
  [key: string]: any;
}

export type Type13ActualFormProps = Type13ActualProps;

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
  isVisible?: boolean;
  plots?: Type13PlotItem[];
  planSummary?: {
    province?: string | null;
    district?: string | null;
  };
  actualData?: Type13DetailData;
  className?: string;
  [key: string]: any;
}

export type DetailType13AttackProps = Type13DetailProps;
export type Type13DetailViewProps = Type13DetailProps;

export interface Type13ApprovalProps {
  isVisible?: boolean;
  plots?: Type13PlotItem[];
  planSummary?: {
    province?: string | null;
    district?: string | null;
  };
  className?: string;
  [key: string]: any;
}

export type Type13ApprovalCardProps = Type13ApprovalProps;
