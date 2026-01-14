import { CreditLimit, CreditLimitStatus } from "@/src/infrastructure/database";
import { Customer } from "./customers";

export type { CreditLimit, CreditLimitStatus };

export interface CreditLimitWithCustomer extends CreditLimit {
  customer: Customer;
}

export interface CreditLimitFormData {
  customerId: string;
  limitAmount: number;
  effectiveDate: Date;
  expiryDate?: Date;
  notes?: string;
}
