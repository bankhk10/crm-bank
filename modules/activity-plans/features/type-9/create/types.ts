import type {
  CustomerOption,
  ProductOption,
  Type9ProductItem,
} from "../shared/types";

export interface Type9StoreProps {
  readonly?: boolean;
  // Sub Dealer state & handlers
  subdealerId?: string;
  setSubdealerId?: (val: string) => void;
  subdealerName?: string;
  setSubdealerName?: (val: string) => void;
  isUnregisteredSubdealer?: boolean;
  setIsUnregisteredSubdealer?: (val: boolean) => void;
  subDealerStore?: string;
  setSubDealerStore?: (val: string) => void;
  province?: string;
  setProvince?: (val: string) => void;
  district?: string;
  setDistrict?: (val: string) => void;
  parentDealerId?: string;
  setParentDealerId?: (val: string) => void;
  parentDealerName?: string;
  setParentDealerName?: (val: string) => void;

  // Backward compatibility
  type9Store?: string;
  setType9Store?: (val: string) => void;
  isSubDealer?: boolean;
  setIsSubDealer?: (val: boolean) => void;

  // Sales & products
  type9Sales: number;
  setType9Sales: (val: number) => void;
  type9ProductItems: Type9ProductItem[];
  addType9ProductItem: () => void;
  updateType9ProductItem: (
    id: string,
    field: keyof Type9ProductItem,
    val: any,
  ) => void;
  deleteType9ProductItem: (id: string) => void;

  customers?: CustomerOption[];
  products?: ProductOption[];
}
