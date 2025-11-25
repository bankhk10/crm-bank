"use client";

import React, { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import TemporaryCreditLimitTable from "@/components/features/temporary-credit-limits/temporary-credit-limit-table";
import type { TemporaryCreditLimitWithRelations } from "@/types/temporary-credit-limit";

export default function TemporaryCreditLimitsPage() {
  const { hasPermission, allowed, isLoading } = usePermission("menu.temporary_credit_limits");
  const canCreate = hasPermission("temporary_creditlimit.create");
  const canEdit = hasPermission("temporary_creditlimit.edit");
  const canDelete = hasPermission("temporary_creditlimit.delete");
  const canApprove = hasPermission("temporary_creditlimit.approve");
  const canView = !isLoading && allowed;

  const [temporaryCreditLimits, setTemporaryCreditLimits] = useState<TemporaryCreditLimitWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(12);
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
    status?: string;
  }>({ query: "", dateRange: undefined, status: "" });

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
      dateRange: filterDraft.dateRange,
      status: filterDraft.status,
    };

    const rangeKey = (r?: DateRange) =>
      r?.from?.toISOString() + "|" + r?.to?.toISOString();
    if (
      next.query === appliedFilters.query &&
      rangeKey(next.dateRange) === rangeKey(appliedFilters.dateRange) &&
      next.status === appliedFilters.status
    ) {
      return;
    }

    const id = setTimeout(() => {
      setAppliedFilters(next);
      setPage(1);
    }, delay);
    return () => clearTimeout(id);
  }, [filterDraft.query, filterDraft.dateRange, filterDraft.status, total, appliedFilters.query]);

  const mkRangeKey = (r?: DateRange) =>
    r?.from?.toISOString() + "|" + r?.to?.toISOString();

  const isTyping =
    filterDraft.query !== appliedFilters.query ||
    mkRangeKey(filterDraft.dateRange) !== mkRangeKey(appliedFilters.dateRange) ||
    filterDraft.status !== appliedFilters.status;

  const handleSearchSubmit = () => {
    setAppliedFilters({
      query: filterDraft.query,
      dateRange: filterDraft.dateRange,
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
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("perPage", String(perPage));
        if (appliedFilters.query.trim())
          params.set("q", appliedFilters.query.trim());
        if (appliedFilters.status)
          params.set("status", appliedFilters.status);
        if (appliedFilters.dateRange?.from)
          params.set("from", appliedFilters.dateRange.from.toISOString());
        if (appliedFilters.dateRange?.to)
          params.set("to", appliedFilters.dateRange.to.toISOString());

        const res = await fetch(`/api/temporary-credit-limits?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to load temporary credit limits");
        const json = await res.json();
        if (mounted) {
          setTemporaryCreditLimits(json.temporaryCreditLimits ?? []);
          setTotal(typeof json.total === "number" ? json.total : 0);
        }
      } catch (error) {
        const err = error as Error;
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

  const handleDelete = async (id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบวงเงินเครดิตชั่วคราวนี้?")) return;

    try {
      const res = await fetch(`/api/temporary-credit-limits/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to delete");
      }

      setTemporaryCreditLimits(prev => prev.filter(item => item.id !== id));
      setTotal(prev => prev - 1);
    } catch (error) {
      const err = error as Error;
      alert(err.message || String(err));
    }
  };

  if (!canView) {
    return (
      <Alert variant="destructive">
        <AlertDescription>คุณไม่มีสิทธิ์เปิดดูข้อมูลวงเงินเครดิตชั่วคราว</AlertDescription>
      </Alert>
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
          <TemporaryCreditLimitTable
            data={temporaryCreditLimits}
            loading={loading}
            searchValue={filterDraft.query}
            onSearchChange={(value) => setFilterDraft((prev) => ({ ...prev, query: value }))}
            isTyping={isTyping}
            onSearchSubmit={handleSearchSubmit}
            dateRange={filterDraft.dateRange}
            onDateRangeChange={(range) => setFilterDraft((prev) => ({ ...prev, dateRange: range ?? undefined }))}
            canCreate={canCreate}
            canEdit={canEdit}
            canDelete={canDelete}
            canApprove={canApprove}
            onDelete={handleDelete}
            pagination={{
              page,
              perPage,
              total,
              onPageChange: (nextPage) => setPage(nextPage),
              onPerPageChange: (nextPerPage) => {
                setPerPage(nextPerPage);
                setPage(1);
              },
              perPageOptions: [6, 12, 24, 48],
            }}
          />
        </div>
      </div>
    </section>
  );
}
