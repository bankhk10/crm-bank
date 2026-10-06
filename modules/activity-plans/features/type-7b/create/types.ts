import type { Type7DemoPlotItem } from "@/modules/activity-plans/features/shared/form/types";
import type {
  UserDemoPlotOption,
  FollowUpPlanOption,
} from "@/modules/activity-plans/constants";
import type { ProductOption } from "@/modules/activity-plans/features/type-7a/shared/types";

export interface Type7FollowUpProps {
  item: Type7DemoPlotItem;
  updateType7Row: (
    id: string,
    field: keyof Type7DemoPlotItem,
    val: any,
  ) => void;
  existingPlotOptions: Array<{
    value: string;
    label: string;
    subLabel?: string;
  }>;
  plotList: UserDemoPlotOption[];
  followUpPlans?: FollowUpPlanOption[];
  products?: ProductOption[];
  readonly?: boolean;
}
