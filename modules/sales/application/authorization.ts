import { SaleStatus, PaymentTerm } from "@/src/infrastructure/database";

export interface SalesQueryFilters {
  search?: string;
  status?: SaleStatus | SaleStatus[];
  customerId?: string;
  employeeId?: string;
  paymentTerm?: PaymentTerm;
  dateFrom?: Date;
  dateTo?: Date;
  createdById?: string;
  departmentId?: string;
}

/**
 * Apply data access filters based on user permissions and data access level
 */
export function applyDataAccessFilters(
  filters: SalesQueryFilters,
  options: {
    isAdmin: boolean;
    dataAccessLevel?: string;
    employeeId?: string;
    departmentId?: string;
    userId: string;
  },
): SalesQueryFilters {
  if (options.isAdmin) {
    return filters;
  }

  const result = { ...filters };

  switch (options.dataAccessLevel) {
    case "VIEW_OWN":
      if (options.employeeId) {
        result.employeeId = options.employeeId;
      } else {
        result.createdById = options.userId;
      }
      break;

    case "VIEW_DEPARTMENT":
      if (options.departmentId) {
        result.departmentId = options.departmentId;
      }
      break;

    case "VIEW_ALL":
      // No extra filters for viewing all
      break;

    default:
      // Default to VIEW_OWN behavior for safety
      if (options.employeeId) {
        result.employeeId = options.employeeId;
      } else {
        result.createdById = options.userId;
      }
  }

  return result;
}
