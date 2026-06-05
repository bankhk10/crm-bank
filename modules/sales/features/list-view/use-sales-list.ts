import { useState, useEffect, useCallback } from "react";
import { DateRange } from "react-day-picker";
import { listSalesAction, deleteSaleAction } from "@/modules/sales/server/actions";
import type { SaleRecord, SaleStatus } from "@/modules/sales/types";

interface UseSalesListProps {
  canView: boolean;
}

export function useSalesList({ canView }: UseSalesListProps) {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  
  const [filterDraft, setFilterDraft] = useState<{ query: string }>({ query: "" });
  const [appliedFilters, setAppliedFilters] = useState<{ query: string }>({ query: "" });
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [status, setStatus] = useState<SaleStatus | undefined>(undefined);
  
  const [deleteCandidate, setDeleteCandidate] = useState<SaleRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [filterCustomers, setFilterCustomers] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState<string>("");

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const custRes = await fetch("/api/customers?perPage=1000");
        if (custRes.ok) {
          const data = await custRes.json();
          setFilterCustomers(data.customers || data);
        }
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    };
    if (canView) {
      fetchOptions();
    }
  }, [canView]);

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

  const fetchSales = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await listSalesAction({
        page,
        perPage,
        search: appliedFilters.query || undefined,
        dateFrom: dateRange?.from?.toISOString(),
        dateTo: dateRange?.to?.toISOString(),
        status: status || undefined,
        customerId: customerId || undefined,
      });

      if (!res.success) {
        throw new Error((res as any).error || "Failed to fetch sales");
      }

      setSales((res as any).sales || []);
      setTotal((res as any).total || 0);
    } catch (err: any) {
      console.error("Error loading sales:", err);
      setError(err.message || "Failed to load sales");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, appliedFilters, dateRange, status, customerId]);

  useEffect(() => {
    if (canView) {
      fetchSales();
    }
  }, [canView, fetchSales]);

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    setActionLoading(true);

    try {
      const res = await deleteSaleAction(deleteCandidate.id);

      if (!res.success) {
        throw new Error(res.error || "Failed to delete sale");
      }

      setSales((prev) => prev.filter((s) => s.id !== deleteCandidate.id));
      setTotal((prev) => Math.max(0, prev - 1));
      setDeleteCandidate(null);
    } catch (err: any) {
      console.error("Error deleting sale:", err);
      setError(err.message || "Failed to delete sale");
    } finally {
      setActionLoading(false);
    }
  };

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
    status,
    setStatus,
    deleteCandidate,
    setDeleteCandidate,
    actionLoading,
    handleDelete,
    filterCustomers,
    customerId,
    setCustomerId,
  };
}
