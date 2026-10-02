import type {
  Type2ProductFollowupItem,
  Type2FollowupProductLine,
  CustomerOption,
  ProductOption,
} from "../shared/types";

export type { Type2FollowupProductLine };

export interface Type2FollowupProps {
  readonly?: boolean;
  type2Items: Type2ProductFollowupItem[];
  addType2Row: () => void;
  updateType2Row: (
    id: string,
    field: keyof Type2ProductFollowupItem,
    val: any,
  ) => void;
  deleteType2Row: (id: string) => void;
  customers?: CustomerOption[];
  products?: ProductOption[];
}
