import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { DateRange } from "react-day-picker";
import { listSalesAction, deleteSaleAction } from "@/modules/sales/server/actions";
import type { SaleRecord, SaleStatus } from "@/modules/sales/types";

export const SALES_LIST_SEARCH_STORAGE_KEY = "sales_list_search_params";

export function getSalesListReturnUrl(): string {
  if (typeof window === "undefined") return "/sales";
  const saved = sessionStorage.getItem(SALES_LIST_SEARCH_STORAGE_KEY);
  return saved ? `/sales?${saved}` : "/sales";
}

export function useSalesBackUrl(): string {
  const [backUrl, setBackUrl] = useState("/sales");

  useEffect(() => {
    setBackUrl(getSalesListReturnUrl());
  }, []);

  return backUrl;
}

function getInitialSearchParams(searchParams: ReadonlyURLSearchParams): URLSearchParams {
  const currentStr = searchParams.toString();
  if (currentStr) {
    return new URLSearchParams(currentStr);
  }
  if (typeof window !== "undefined") {
    const saved = sessionStorage.getItem(SALES_LIST_SEARCH_STORAGE_KEY);
    if (saved) {
      return new URLSearchParams(saved);
    }
  }
  return new URLSearchParams();
}

function parseDateParam(val: string | null): Date | undefined {
  if (!val) return undefined;
  const parsed = parseISO(val);
  return isNaN(parsed.getTime()) ? undefined : parsed;
}

interface UseSalesListProps {
  canView: boolean;
}

export function useSalesList({ canView }: UseSalesListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [initialParams] = useState(() => getInitialSearchParams(searchParams));

  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<number>(() => {
    const p = initialParams.get("page");
    return p ? Math.max(1, parseInt(p, 10) || 1) : 1;
  });
  const [perPage, setPerPage] = useState<number>(() => {
    const pp = initialParams.get("perPage");
    return pp ? Math.max(1, parseInt(pp, 10) || 10) : 10;
  });
  const [total, setTotal] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const [filterDraft, setFilterDraft] = useState<{ query: string }>(() => ({
    query: initialParams.get("q") || "",
  }));
  const [appliedFilters, setAppliedFilters] = useState<{ query: string }>(() => ({
    query: initialParams.get("q") || "",
  }));
  const [dateRange, setDateRangeState] = useState<DateRange | undefined>(() => {
    const from = parseDateParam(initialParams.get("from"));
    const to = parseDateParam(initialParams.get("to"));
    return from || to ? { from, to } : undefined;
  });
  const [status, setStatusState] = useState<SaleStatus | undefined>(() => {
    const s = initialParams.get("status");
    return (s as SaleStatus) || undefined;
  });

  const [deleteCandidate, setDeleteCandidate] = useState<SaleRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [filterCustomers, setFilterCustomers] = useState<any[]>([]);
  const [customerId, setCustomerIdState] = useState<string[]>(() => {
    const c = initialParams.get("customerId");
    return c ? c.split(",").filter(Boolean) : [];
  });

  const setDateRange = useCallback((nextRange: DateRange | undefined) => {
    setDateRangeState(nextRange);
    setPage(1);
  }, []);

  const setStatus = useCallback((nextStatus: SaleStatus | undefined) => {
    setStatusState(nextStatus);
    setPage(1);
  }, []);

  const setCustomerId = useCallback((nextCustomerId: string[]) => {
    setCustomerIdState(nextCustomerId);
    setPage(1);
  }, []);

  // Sync applied filter states to URL query parameters and sessionStorage
  useEffect(() => {
    const params = new URLSearchParams();

    if (appliedFilters.query) {
      params.set("q", appliedFilters.query);
    }
    if (status) {
      params.set("status", status);
    }
    if (customerId.length > 0) {
      params.set("customerId", customerId.join(","));
    }
    if (dateRange?.from) {
      params.set("from", format(dateRange.from, "yyyy-MM-dd"));
    }
    if (dateRange?.to) {
      params.set("to", format(dateRange.to, "yyyy-MM-dd"));
    }
    if (page > 1) {
      params.set("page", String(page));
    }
    if (perPage !== 10) {
      params.set("perPage", String(perPage));
    }

    const queryString = params.toString();

    if (typeof window !== "undefined") {
      if (queryString) {
        sessionStorage.setItem(SALES_LIST_SEARCH_STORAGE_KEY, queryString);
      } else {
        sessionStorage.removeItem(SALES_LIST_SEARCH_STORAGE_KEY);
      }

      const currentQuery = window.location.search.replace(/^\?/, "");
      if (queryString !== currentQuery) {
        const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;
        router.replace(nextUrl, { scroll: false });
      }
    }
  }, [appliedFilters.query, status, customerId, dateRange, page, perPage, pathname, router]);

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

    if (
      next.query === "" &&
      !status &&
      !dateRange?.from &&
      !dateRange?.to &&
      customerId.length === 0
    ) {
      setAppliedFilters(next);
      setPage(1);
      return;
    }

    const id = setTimeout(() => {
      setAppliedFilters(next);
      setPage(1);
    }, delay);
    return () => clearTimeout(id);
  }, [filterDraft.query, total, appliedFilters.query, status, dateRange, customerId]);

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
        customerId: customerId.length > 0 ? customerId : undefined,
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
