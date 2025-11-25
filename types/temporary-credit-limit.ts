import { TemporaryCreditStatus, User } from "@prisma/client";
import { Customer } from "./customers";

export type { TemporaryCreditStatus };

export interface TemporaryCreditLimit {
  id: string;
  customerId: string;
  requestedAmount: number;
  expiryDate: Date | string;
  notes?: string | null;
  status: TemporaryCreditStatus;
  rejectionReason?: string | null;
  requestedById?: string | null;
  requestedAt: Date | string;
  approvedById?: string | null;
  approvedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
}

export interface TemporaryCreditLimitWithRelations extends TemporaryCreditLimit {
  customer: Customer;
  requestedBy?: Partial<User> | null;
  approvedBy?: Partial<User> | null;
}

export interface TemporaryCreditLimitFormData {
  customerId: string;
  requestedAmount: number;
  expiryDate: Date;
  notes?: string;
}

export interface TemporaryCreditLimitApprovalData {
  approve: boolean;
  rejectionReason?: string;
}
