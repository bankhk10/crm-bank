"use client";

import React, { useEffect, useState, useRef } from "react";
import { UserCog } from "lucide-react";
import { usePermission } from "@/hooks/use-permission";
import { PageHeader } from "@/components/custom/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CustomersTable } from "./customers-table";
import { getCustomersAction } from "../../server/actions";
import { PAGINATION } from "@/lib/constants";
import type { CustomerRecord } from "../../types";

export default function CustomersListView() {
  const { hasPermission, isLoading } = usePermission();
  const allowed = !isLoading && (hasPermission("menu.customers") || hasPermission("customer.view"));
  
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
  }, [page, perPage, appliedFilters]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-slate-500">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>คุณไม่มีสิทธิ์เปิดดูข้อมูลลูกค้า</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="bg-white shadow-sm sm:rounded-lg">
        <div className="p-6">
          <PageHeader
            icon={UserCog}
            iconClassName="text-blue-600"
            title="ข้อมูลลูกค้า"
          />

          <CustomersTable
            data={data}
            total={total}
            loading={loading}
            page={page}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
            filterDraft={filterDraft}
            setFilterDraft={setFilterDraft}
            onSearchSubmit={handleSearchSubmit}
            onRefresh={() => {
              // Trigger a re-fetch by bumping a hidden counter if needed, 
              // or just re-run the effect if we can. 
              // For now, re-applying filters works.
              setAppliedFilters({...appliedFilters});
            }}
          />
        </div>
      </div>
    </section>
  );
}
