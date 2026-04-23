"use client";

import React, { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import { ClipboardCheck } from "lucide-react";
import { usePermission } from "@/hooks/use-permission";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/custom/page-header";
import { getFulfillmentsAction } from "../../server/actions";
import { FulfillmentTable } from "./fulfillment-table";
import type { SaleRecord } from "../../types/types";

const FULFILLMENT_STATUSES = [
  "APPROVED",
  "AWAITING_PAYMENT",
  "PAID",
  "AWAITING_DELIVERY",
  "PARTIALLY_DELIVERED",
  "DELIVERED",
  "DELIVERY_COMPLETED",
];

export default function FulfillmentPage() {
  const { allowed, isLoading } = usePermission("menu.fulfillment");
  const canView = !isLoading && allowed;
  const user = useCurrentUser();

  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [filterDraft, setFilterDraft] = useState<{ query: string }>({
    query: "",
  });
  const [appliedFilters, setAppliedFilters] = useState<{ query: string }>({
    query: "",
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>("APPROVED");

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
    setStatusFilter("APPROVED");
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
          statusFilter === "ALL" ? FULFILLMENT_STATUSES : [statusFilter];

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</AlertDescription>
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
            icon={ClipboardCheck}
            iconClassName="text-blue-600"
            title="จัดการคำสั่งขาย"
          />

          <FulfillmentTable
            sales={sales}
            total={total}
            page={page}
            perPage={perPage}
            loading={loading}
            searchValue={filterDraft.query}
            onSearchChange={(value) => setFilterDraft({ query: value })}
            isTyping={isTyping}
            onSearchSubmit={handleSearchSubmit}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
            onClear={handleClear}
            currentUserId={user?.id}
            statusFilter={statusFilter}
            onStatusFilterChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
          />
        </div>
      </div>
    </section>
  );
}
