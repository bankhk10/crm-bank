"use client";

import React, { useEffect, useState, useCallback } from "react";
import type { DateRange } from "react-day-picker";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CreditLimitTable,
} from "@/modules/credit-limits";
import { CreditCard, Upload } from "lucide-react";
import { PageHeader } from "@/components/custom/page-header";
import { getCustomersAction } from "@/modules/customers/server/actions";
import { PAGINATION } from "@/lib/constants";
import type { CustomerRecord } from "@/modules/credit-limits/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CreditLimitsListView() {
  const { hasPermission, allowed, isLoading } = usePermission("menu.credit_limits");
  const canView = !isLoading && allowed;

  const [data, setData] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<number>(PAGINATION.DEFAULT_PAGE);
  const [perPage, setPerPage] = useState<number>(PAGINATION.DEFAULT_PER_PAGE);
  const [total, setTotal] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const [filterDraft, setFilterDraft] = useState<{
    query: string;
    dateRange?: DateRange;
    status?: string;
  }>({ query: "", dateRange: undefined, status: "" });

  const [appliedFilters, setAppliedFilters] = useState<{
    query: string;
    dateRange?: DateRange;
    status: string;
  }>({
    query: "",
    dateRange: undefined,
    status: "",
  });

  const mkRangeKey = (r?: DateRange) =>
    (r?.from?.toISOString() ?? "") + "|" + (r?.to?.toISOString() ?? "");

  const isTyping =
    filterDraft.query !== appliedFilters.query ||
    mkRangeKey(filterDraft.dateRange) !== mkRangeKey(appliedFilters.dateRange) ||
    filterDraft.status !== appliedFilters.status;

  const handleSearchSubmit = useCallback(() => {
    setAppliedFilters({
      query: filterDraft.query,
      dateRange: filterDraft.dateRange,
      status: filterDraft.status ?? "",
    });
    setPage(1);
  }, [filterDraft]);

  // Debounce filter application
  useEffect(() => {
    if (!isTyping) return;

    const delay = 400;
    const id = setTimeout(() => {
      handleSearchSubmit();
    }, delay);
    return () => clearTimeout(id);
  }, [filterDraft, isTyping, handleSearchSubmit]);

  useEffect(() => {
    if (!canView) return;

    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const params: any = {
          page,
          perPage,
          typeFilter: "DEALER",
        };

        if (appliedFilters.query.trim()) params.q = appliedFilters.query.trim();
        if (appliedFilters.status) params.statusFilter = appliedFilters.status;
        if (appliedFilters.dateRange?.from) params.from = appliedFilters.dateRange.from.toISOString();
        if (appliedFilters.dateRange?.to) params.to = appliedFilters.dateRange.to.toISOString();

        const res = await getCustomersAction(params);
        if (mounted) {
          setData(
            (res.customers ?? []).map((c: any) => ({
              id: c.id,
              customerCode: c.customerCode,
              name: c.name,
              phone: c.phone,
              email: c.email,
              creditLimits: (c.creditLimits || []).map((cl: any) => ({
                id: cl.id,
                limitAmount: cl.limitAmount,
                usedAmount: cl.usedAmount,
                availableAmount: cl.availableAmount,
                promoAmount: cl.promoAmount,
                temporaryCreditAmount: cl.temporaryCreditAmount,
                temporaryCreditExpiryDate: cl.temporaryCreditExpiryDate,
              })),
            }))
          );
          setTotal(typeof res.total === "number" ? res.total : 0);
        }
      } catch (err: any) {
        if (mounted) setError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [page, perPage, appliedFilters, canView]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="animate-pulse h-10 w-48 bg-gray-200 rounded" />
        <div className="animate-pulse h-64 bg-gray-200 rounded" />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>คุณไม่มีสิทธิ์เปิดดูข้อมูลวงเงิน</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <section className="space-y-6 pb-24 md:pb-8">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="bg-white shadow-sm sm:rounded-lg">
        <div className="p-6">
          <PageHeader
            icon={CreditCard}
            iconClassName="text-blue-600"
            title="จัดการวงเงินลูกค้า"
          // actions={
          //   <Link href="/credit-limits/import">
          //     <Button className="bg-green-700 hover:bg-green-800 text-white rounded-3xl h-10 px-6 font-semibold shadow-md shadow-green-700/20">
          //       <Upload className="w-4 h-4 mr-2" />
          //       นำเข้าข้อมูล
          //     </Button>
          //   </Link>
          // }
          />

          <CreditLimitTable
            data={data}
            loading={loading}
            searchValue={filterDraft.query}
            onSearchChange={(value) =>
              setFilterDraft((prev) => ({ ...prev, query: value }))
            }
            isTyping={isTyping}
            onSearchSubmit={handleSearchSubmit}
            dateRange={filterDraft.dateRange}
            onDateRangeChange={(range) =>
              setFilterDraft((prev) => ({
                ...prev,
                dateRange: range ?? undefined,
              }))
            }
            pagination={{
              page,
              perPage,
              total,
              onPageChange: setPage,
              onPerPageChange: (nextPerPage) => {
                setPerPage(nextPerPage);
                setPage(1);
              },
              perPageOptions: [10, 20, 30],
            }}
          />
        </div>
      </div>
    </section>
  );
}
