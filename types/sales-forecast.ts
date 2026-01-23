import type { Prisma } from "@prisma/client";

// Use Prisma.Decimal type directly or create compatible alias
type Decimal = Prisma.Decimal;

export enum SalesForecastStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface SalesForecastMonthlyDetail {
  id: string;
  forecastId: string;
  month: number;
  productId: string;
  customerId: string;
  quantity: number;
  unitPrice: Decimal | number;
  totalAmount: Decimal | number;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  product?: {
    id: string;
    productCode: string;
    name: string;
    unit?: string | null;
  };
  customer?: {
    id: string;
    customerCode: string;
    name: string;
    customerType: string;
  };
}

export interface SalesForecast {
  id: string;
  year: number;
  employeeId: string;
  status: SalesForecastStatus;
  totalAmount: Decimal | number;
  notes?: string | null;
  submittedAt?: Date | null;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  rejectionReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  employee?: {
    id: string;
    name: string;
    email: string;
    employeeCode?: string | null;
  };
  monthlyDetails?: SalesForecastMonthlyDetail[];
}

export interface CreateSalesForecastInput {
  year: number;
  employeeId: string;
  notes?: string;
  monthlyDetails: CreateMonthlyDetailInput[];
}

export interface CreateMonthlyDetailInput {
  month: number;
  productId: string;
  customerId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface UpdateSalesForecastInput {
  year?: number;
  notes?: string;
  status?: SalesForecastStatus;
  monthlyDetails?: UpdateMonthlyDetailInput[];
}

export interface UpdateMonthlyDetailInput {
  id?: string;
  month: number;
  productId: string;
  customerId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface SalesForecastFilters {
  year?: number;
  employeeId?: string;
  status?: SalesForecastStatus;
  search?: string;
}

export interface MonthlySummary {
  month: number;
  totalAmount: number;
  itemCount: number;
}

export interface ProductSummary {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalAmount: number;
}

export interface CustomerSummary {
  customerId: string;
  customerName: string;
  totalAmount: number;
  itemCount: number;
}
