import type {
  Type4CollectItem,
  CustomerOption,
} from "../shared/types";

export interface Type4CollectProps {
  readonly?: boolean;
  type4Items: Type4CollectItem[];
  addType4Row: () => void;
  updateType4Row: (id: string, field: keyof Type4CollectItem, val: any) => void;
  deleteType4Row: (id: string) => void;
  customers?: CustomerOption[];
}
