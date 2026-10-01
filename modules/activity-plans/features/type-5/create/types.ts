import type {
  Type5SurveyItem,
  CustomerOption,
  ProductOption,
} from "../shared/types";

export interface Type5SurveyProps {
  readonly?: boolean;
  type5Items: Type5SurveyItem[];
  addType5Row: () => void;
  updateType5Row: (id: string, field: keyof Type5SurveyItem, val: any) => void;
  deleteType5Row: (id: string) => void;
  customers?: CustomerOption[];
  products?: ProductOption[];
}
