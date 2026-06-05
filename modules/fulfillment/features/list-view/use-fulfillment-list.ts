import { useState, useEffect } from "react";
import { DateRange } from "react-day-picker";
import { getFulfillmentsAction } from "../../server/actions";
import type { SaleRecord } from "../../types/types";

const FULFILLMENT_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "AWAITING_PAYMENT",
  "PAID",
  "AWAITING_DELIVERY",
  "DELIVERED",
  "DELIVERY_COMPLETED",
  "PARTIALLY_DELIVERED",
  "EXPIRED",
  "OVERDUE",
  "WAITING_FOR_CORRECTION",
  "CANCELLED",
  "COMPLETED",
];

export function useFulfillmentList() {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  
  const [filterDraft, setFilterDraft] = useState<{ query: string }>({ query: "" });
  const [appliedFilters, setAppliedFilters] = useState<{ query: string }>({ query: "" });
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string[]>(["APPROVED"]);

  useEffect(() => {
    const isExtendingEmpty =
      total === 0 &&
      appliedFilters.query &&
      filterDraft.query.startsWith(appliedFilters.query) &&
      filterDraft.query.length > appliedFilters.query.length;

    if (isExtendingEmpty) return;

    const delay = 400;
    const next = { query: filterDraft.query };

    if (next.query === appliedFilters.query) {
      return;
    }

    const id = setTimeout(() => {
      setAppliedFilters(next);
      setPage(1);
    }, delay);
    return () => clearTimeout(id);
  }, [filterDraft.query, total, appliedFilters.query]);

  const isTyping = filterDraft.query !== appliedFilters.query;

  const handleSearchSubmit = () => {
    setAppliedFilters({ query: filterDraft.query });
    setPage(1);
  };

  const handleClear = () => {
    setFilterDraft({ query: "" });
    setAppliedFilters({ query: "" });
    setDateRange(undefined);
    setStatusFilter([]);
    setPage(1);
  };

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const statusesToQuery =
          !statusFilter || statusFilter.length === 0 || statusFilter.includes("ALL")
            ? FULFILLMENT_STATUSES
            : statusFilter;

        const result = await getFulfillmentsAction({
          page,
          perPage,
          status: statusesToQuery,
          search: appliedFilters.query || undefined,
          dateFrom: dateRange?.from?.toISOString(),
          dateTo: dateRange?.to?.toISOString(),
        });

        if (!mounted) return;

        if (!result.success) {
          throw new Error("Failed to fetch sales");
        }

        setSales((result.sales || []) as unknown as SaleRecord[]);
        setTotal(result.total || 0);
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error("Error loading sales:", err);
        setError(err.message || "Failed to load sales");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [page, perPage, appliedFilters, dateRange, statusFilter]);

  return {
    sales,
    loading,
    page,
    setPage,
    perPage,
    setPerPage,
    total,
    error,
    filterDraft,
    setFilterDraft,
    isTyping,
    handleSearchSubmit,
    dateRange,
    setDateRange,
    statusFilter,
    setStatusFilter,
    handleClear,
  };
}
