/**
 * Customer Types
 * Type definitions for customer domain
 */

import type {
  CustomerType,
  CustomerStatus,
} from "@/src/infrastructure/database";
import type { Address, ContactInfo, GeoLocation } from "@/src/shared/types";

/**
 * Customer summary for lists
 */
export interface CustomerSummary {
  id: string;
  customerCode: string;
  name: string;
  customerType: CustomerType;
  status: CustomerStatus;
  phone?: string;
  email?: string;
  responsibleEmployeeName?: string;
}

/**
 * Customer detail with all relations
 */
export interface CustomerDetail extends CustomerSummary {
  prefix?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: Date;
  taxId?: string;
  address: Address;
  billingAddress: Address;
  shippingAddress: Address;
  contact: ContactInfo;
  location: GeoLocation;
  notes?: string;
  relationshipScore?: number;
  parentDealerId?: string;
  responsibleEmployeeId?: string;
  creditLimits?: CustomerCreditInfo[];
}

/**
 * Customer credit info
 */
export interface CustomerCreditInfo {
  id: string;
  limitAmount: number;
  promoAmount?: number;
  usedAmount: number;
  availableAmount: number;
  status: string;
}

/**
 * Customer filter parameters
 */
export interface CustomerFilterParams {
  page?: number;
  perPage?: number;
  search?: string;
  customerType?: CustomerType;
  status?: CustomerStatus;
  responsibleEmployeeId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Create customer input
 */
export interface CreateCustomerInput {
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
  billingAddressLine?: string;
  billingProvince?: string;
  billingDistrict?: string;
  billingSubdistrict?: string;
  billingPostalCode?: string;
  shippingAddressLine?: string;
  shippingProvince?: string;
  shippingDistrict?: string;
  shippingSubdistrict?: string;
  shippingPostalCode?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  latitude?: string;
  longitude?: string;
  responsibleEmployeeId?: string;
  parentDealerId?: string;
  createdById?: string;
}
