import type { ProductOption, Type7DemoProductLine } from "@/modules/activity-plans/features/type-7a/shared/types";
import type { UserDemoPlotOption } from "@/modules/activity-plans/constants";
import type { Type7DemoPlotItem } from "@/modules/activity-plans/features/shared/form/types";

export type { ProductOption, UserDemoPlotOption, Type7DemoProductLine, Type7DemoPlotItem };

export interface Type7bWithdrawnProductLine {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit?: string;
  notes?: string;
}
