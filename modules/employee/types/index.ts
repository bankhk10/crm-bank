/**
 * Employee Feature - Types
 */

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  companyId: string;
  employeeCode?: string;
  nickname?: string | null;
  status?: string;
  position?: {
    id: string;
    name: string;
  };
  positionId?: string;
  company?: {
    id: string;
    name: string;
  };
  user?: {
    lastLoginAt?: Date | string | null;
  };
}

/**
 * Extended Employee type used for the detail view page.
 * Matches Prisma Employee model fields + relations.
 */
export type EmployeeDetail = {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  phone?: string | null;
  company?: { id: string; name?: string | null } | null;
  manager?: { id: string; name?: string | null } | null;

  // Extended fields
  employeeCode?: string | null;
  nickname?: string | null;
  birthDate?: string | null;
  addressLine?: string | null;
  province?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  postalCode?: string | null;
  responsibilityArea?: string | null;
  status?: string | null;
  positionTitle?: string | null;
  departmentName?: string | null;
  department?: { id: string; name?: string | null } | null;
  roleTitle?: string | null;
  signature?: string | null;
  createdAt?: string | null;
  responsibleCustomers?: {
    id: string;
    customerCode: string;
    name: string;
    province?: string | null;
    region?: string | null;
    status: string;
  }[];
};
