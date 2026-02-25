/**
 * Common API Types
 * Shared types for API requests and responses
 */

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  perPage?: number;
}

/**
 * Sort parameters
 */
export interface SortParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Date range filter
 */
export interface DateRangeFilter {
  startDate?: Date | string;
  endDate?: Date | string;
}

/**
 * Common list query parameters
 */
export interface ListQueryParams extends PaginationParams, SortParams {
  search?: string;
  status?: string;
}

/**
 * API error response
 */
export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, string[]>;
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Batch operation result
 */
export interface BatchOperationResult {
  success: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}
