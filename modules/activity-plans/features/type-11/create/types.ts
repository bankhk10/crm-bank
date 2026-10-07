import type { Type11StoreItem, CustomerOption } from "../shared/types";

export interface Type11StockProps {
  readonly?: boolean;
  type11Stores: Type11StoreItem[] | string;
  setType11Stores: (val: Type11StoreItem[]) => void;
  customers?: CustomerOption[];
}
