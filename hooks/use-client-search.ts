import { useState, useMemo, useEffect, useCallback } from "react";
import type { TablePagination } from "@/components/custom/custom-table";

export interface UseClientSearchOptions {
  /** Items per page (default: 10) */
  initialPerPage?: number;
  /** Per-page dropdown options (default: [5, 10, 20, 50]) */
  perPageOptions?: number[];
}

/**
 * Hook for client-side search/filter + pagination.
 *
 * Standardizes the repeated pattern found in employee, sales-targets,
 * and products modules where data is filtered locally and paginated.
 *
 * @example
 * ```tsx
 * const { query, setQuery, paginatedData, pagination } = useClientSearch(
 *   employees,
 *   (emp, q) =>
 *     [emp.name, emp.email, emp.employeeCode]
 *       .filter(Boolean)
 *       .join(" ")
 *       .toLowerCase()
 *       .includes(q),
 * );
 * ```
 */
export function useClientSearch<T>(
  data: T[],
  matchFn: (item: T, queryLower: string) => boolean,
  options?: UseClientSearchOptions,
) {
  const initialPerPage = options?.initialPerPage ?? 10;
  const perPageOptions = options?.perPageOptions ?? [5, 10, 20, 50];

  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(initialPerPage);

  // Filter data based on query
  const filteredData = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((item) => matchFn(item, q));
  }, [data, query, matchFn]);

  // Paginate filtered data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredData.slice(start, start + perPage);
  }, [filteredData, currentPage, perPage]);

  // Reset page when query or data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [query, data]);

  const handlePerPageChange = useCallback((n: number) => {
    setPerPage(n);
    setCurrentPage(1);
  }, []);

  // Pagination object compatible with CustomTable's TablePagination type
  const pagination: TablePagination = {
    page: currentPage,
    perPage,
    total: filteredData.length,
    onPageChange: setCurrentPage,
    onPerPageChange: handlePerPageChange,
    perPageOptions,
  };

  return {
    /** Current search query */
    query,
    /** Set search query */
    setQuery,
    /** All data after filtering (before pagination) */
    filteredData,
    /** Data for the current page */
    paginatedData,
    /** Pagination config compatible with CustomTable */
    pagination,
    /** Manually set current page */
    setCurrentPage,
    /** Current per-page value */
    perPage,
  };
}
