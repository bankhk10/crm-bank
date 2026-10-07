import type {
  Type3SalesItem,
  CustomerOption,
  ProductOption,
} from "../shared/types";

export interface Type3SalesProps {
  readonly?: boolean;
  type3Items: Type3SalesItem[];
  addType3Row: () => void;
  updateType3Row: (id: string, field: keyof Type3SalesItem, val: any) => void;
  deleteType3Row: (id: string) => void;
  customers?: CustomerOption[];
  products?: ProductOption[];
}
