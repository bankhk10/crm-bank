import type { Type1VisitItem, CustomerOption } from "../shared/types";

export interface Type1VisitProps {
  readonly?: boolean;
  type1Items: Type1VisitItem[];
  addType1Row?: () => void;
  updateType1Row: (id: string, field: keyof Type1VisitItem, val: any) => void;
  deleteType1Row?: (id: string) => void;
  customers?: CustomerOption[];
}
