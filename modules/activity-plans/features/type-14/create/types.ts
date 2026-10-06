import type {
  Type14PlanInput,
  DealerCustomerOption,
  ProductOption,
} from "../shared/types";
import type { FollowUpPlanOption } from "@/modules/activity-plans/constants";

export interface Type14CreateProps {
  value: Type14PlanInput;
  onChange: (val: Type14PlanInput) => void;
  hattackFollowUpPlans?: FollowUpPlanOption[];
  dealerCustomers?: DealerCustomerOption[];
  products?: ProductOption[];
  planDate?: string;
  defaultProvince?: string;
  defaultDistrict?: string;
  readonly?: boolean;
}
