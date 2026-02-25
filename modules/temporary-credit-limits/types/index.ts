import { TemporaryCreditStatus, User, Customer } from "@/lib/db";
import type { DateRange } from "react-day-picker";

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

export interface TemporaryCreditLimitTableProps {
  data: TemporaryCreditLimitWithRelations[];
  loading?: boolean;
  pagination?: {
    page: number;
    perPage: number;
    total: number;
    onPageChange: (p: number) => void;
    onPerPageChange: (n: number) => void;
    perPageOptions?: number[];
  };
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  isTyping?: boolean;
  onSearchSubmit?: () => void;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;

  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canApprove?: boolean;
  onDelete?: (item: TemporaryCreditLimitWithRelations) => void;
}
