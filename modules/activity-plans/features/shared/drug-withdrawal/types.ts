import type {
  DrugWithdrawalInput,
  DrugWithdrawalItemInput,
} from "../../../application/validations";

export interface DrugWithdrawalPlotOption {
  id: string;
  name: string;
  subLabel?: string;
  plotIdentifier?: string;
  demoPlotId?: string | null;
}

export interface DrugWithdrawalProductOption {
  id: string;
  name: string;
  unit?: string | null;
  productCode?: string | null;
  price?: number | null;
  categoryId?: string | null;
}

export interface DrugWithdrawalItemRowState {
  key: string;
  id?: string;
  productId: string;
  productName?: string | null;
  quantity: number | string;
  unit?: string | null;
  sortOrder?: number;
}

export interface DrugWithdrawalPlotGroupState {
  key: string;
  plotIdentifier: string;
  demoPlotId?: string | null;
  items: DrugWithdrawalItemRowState[];
}

export interface DrugWithdrawalCardProps {
  value: DrugWithdrawalInput;
  onChange: (value: DrugWithdrawalInput) => void;
  availablePlots?: DrugWithdrawalPlotOption[];
  products: DrugWithdrawalProductOption[];
  workTypeCode?: string;
  editable?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  allowCustomPlot?: boolean;
  errors?: Array<{ path?: string; message: string }> | Record<string, string>;
  className?: string;
}
