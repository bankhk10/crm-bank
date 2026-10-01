import type { ProductOption } from "@/modules/activity-plans/features/type-7a/shared/types";
import type { UserDemoPlotOption } from "@/modules/activity-plans/constants";

export type { ProductOption, UserDemoPlotOption };

export interface Type7bWithdrawnProductLine {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit?: string;
  notes?: string;
}
