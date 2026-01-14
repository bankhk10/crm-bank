import {
  Customer,
  CustomerType,
  CustomerStatus,
  CreditLimit,
  CreditLimitStatus,
} from "@/src/infrastructure/database";

export type {
  Customer,
  CustomerType,
  CustomerStatus,
  CreditLimit,
  CreditLimitStatus,
};

export interface CustomerWithCreditLimits extends Customer {
  creditLimits: CreditLimit[];
}

export interface CustomerFormData {
  customerCode: string;
  customerType: CustomerType;
  name: string;
  prefix?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  addressLine?: string;
  province?: string;
  district?: string;
  subdistrict?: string;
  postalCode?: string;
  status: CustomerStatus;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
}

export interface CreditLimitFormData {
  customerId: string;
  limitAmount: number;
  effectiveDate: Date;
  expiryDate?: Date;
  notes?: string;
}

export interface CreditLimitWithCustomer extends CreditLimit {
  customer: Customer;
}
