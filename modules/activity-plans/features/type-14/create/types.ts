import type { Type14PlanInput, DealerCustomerOption } from "../shared/types";

export interface Type14CreateProps {
  value: Type14PlanInput;
  onChange: (val: Type14PlanInput) => void;
  dealerCustomers?: DealerCustomerOption[];
  planDate?: string;
  defaultProvince?: string;
  defaultDistrict?: string;
  readonly?: boolean;
}
