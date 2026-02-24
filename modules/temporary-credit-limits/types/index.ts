import type { TemporaryCreditLimitWithRelations } from "@/types/temporary-credit-limit";
import type { DateRange } from "react-day-picker";

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
