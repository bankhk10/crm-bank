import { useEffect, useState } from "react";
import { getCustomersAction } from "../../server/actions";
import { PAGINATION } from "@/lib/constants";
import type { CustomerRecord } from "../../types";

export function useCustomersList(canView: boolean) {
  const [data, setData] = useState<CustomerRecord[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState<number>(PAGINATION.DEFAULT_PAGE);
  const [perPage, setPerPage] = useState<number>(PAGINATION.DEFAULT_PER_PAGE);

  const [filterDraft, setFilterDraft] = useState<{
    query: string;
    customerType?: string;
    status?: string;
  }>({ query: "", customerType: "", status: "" });

  const [appliedFilters, setAppliedFilters] = useState<{
    query: string;
    customerType?: string;
    status?: string;
  }>({ query: "", customerType: "", status: "" });

  // Debounced filter application
  useEffect(() => {
    const isExtendingEmpty =
      total === 0 &&
      appliedFilters.query &&
      filterDraft.query.startsWith(appliedFilters.query) &&
      filterDraft.query.length > appliedFilters.query.length;

    if (isExtendingEmpty) return;

    const delay = 400;
    const next = {
      query: filterDraft.query,
      customerType: filterDraft.customerType,
      status: filterDraft.status,
    };

    if (
      next.query === appliedFilters.query &&
      next.customerType === appliedFilters.customerType &&
      next.status === appliedFilters.status
    ) {
      return;
    }

    const id = setTimeout(() => {
      setAppliedFilters(next);
      setPage(1);
    }, delay);
    return () => clearTimeout(id);
  }, [
    filterDraft.query,
    filterDraft.customerType,
    filterDraft.status,
    total,
    appliedFilters.query,
    appliedFilters.customerType,
    appliedFilters.status,
  ]);

  const handleSearchSubmit = () => {
    setAppliedFilters({
      query: filterDraft.query,
      customerType: filterDraft.customerType,
      status: filterDraft.status,
    });
    setPage(1);
  };

  useEffect(() => {
    if (!canView) return;
    
    let mounted = true;
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const params: any = {
          page: Number(page),
          perPage: Number(perPage),
        };

        if (appliedFilters.query.trim())
          params.q = appliedFilters.query.trim();
        if (appliedFilters.customerType)
          params.typeFilter = appliedFilters.customerType;
        if (appliedFilters.status)
          params.statusFilter = appliedFilters.status;

        const res = await getCustomersAction(params);

        if (mounted) {
          const parsedCustomers = (res.customers ?? []).map((c: any) => ({
            ...c,
            email: c.email === null ? undefined : c.email,
            phone: c.phone === null ? undefined : c.phone,
            status: c.status === null ? undefined : c.status,
          }));
          setData(parsedCustomers as CustomerRecord[]);
          setTotal(typeof res.total === "number" ? res.total : 0);
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
        setError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [page, perPage, appliedFilters, canView]);

  return {
    data,
    total,
    loading,
    error,
    page,
    perPage,
    filterDraft,
    setFilterDraft,
    setPage,
    setPerPage,
    appliedFilters,
    setAppliedFilters,
    handleSearchSubmit,
  };
}
