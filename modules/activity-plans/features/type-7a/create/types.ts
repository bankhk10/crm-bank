import type { Type7DemoPlotItem } from "@/modules/activity-plans/features/shared/form/types";
import type {
  CustomerOption,
  ProductOption,
  ProductCategoryOption,
  ChemicalGroupOption,
} from "../shared/types";

export interface Type7NewDemoProps {
  item: Type7DemoPlotItem;
  updateType7Row: (
    id: string,
    field: keyof Type7DemoPlotItem,
    val: any,
  ) => void;
  customerOptions?: Array<{ value: string; label: string; subLabel?: string }>;
  productOptions?: Array<{ value: string; label: string; subLabel?: string }>;
  cropCategoryOptions: Array<{ value: string; label: string }>;
  customers?: CustomerOption[];
  products?: ProductOption[];
  productCategories?: ProductCategoryOption[];
  chemicalGroups?: ChemicalGroupOption[];
  readonly?: boolean;
}
