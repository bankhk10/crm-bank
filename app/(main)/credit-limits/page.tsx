"use client";

import React, { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  CreditLimitsTable,
  type CreditLimitRecord,
} from "@/components/features/credit-limits/credit-limits-table";

export default function CreditLimitsPage() {
  const { hasPermission, allowed, isLoading } = usePermission("menu.credit_limits");
  const canCreate = hasPermission("creditlimit.create");
  const canEdit = hasPermission("creditlimit.edit");
  const canDelete = hasPermission("creditlimit.delete");
  const canView = !isLoading && allowed;

  const [creditLimits, setCreditLimits] = useState<CreditLimitRecord[]>([]);
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
  const [deleteCandidate, setDeleteCandidate] = useState<CreditLimitRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

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

        const res = await fetch(`/api/credit-limits?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to load credit limits");
        const json = await res.json();
        if (mounted) {
          setCreditLimits(json.creditLimits ?? []);
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

  if (!canView) {
    return (
      <Alert variant="destructive">
        <AlertDescription>คุณไม่มีสิทธิ์เปิดดูข้อมูลวงเงิน</AlertDescription>
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

      {deleteCandidate && (
        <div className="fixed inset-0 min-h-screen z-50 flex items-center justify-center">
          <div
            className="bg-black/50 absolute inset-0"
            onClick={() => setDeleteCandidate(null)}
          />
          <div className="relative z-10 w-full max-w-md bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold">ยืนยันการลบ</h3>
            <p className="mt-2 text-sm text-slate-600">
              คุณต้องการลบวงเงินนี้ ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteCandidate(null)}>
                ยกเลิก
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!deleteCandidate) return;
                  setActionLoading(true);
                  try {
                    const res = await fetch(
                      `/api/credit-limits/${deleteCandidate.id}`,
                      { method: "DELETE" }
                    );
                    if (!res.ok) throw new Error("Delete failed");
                    setCreditLimits((prev) =>
                      prev.filter((c) => c.id !== deleteCandidate.id)
                    );
                    setDeleteCandidate(null);
                  } catch (error) {
                    const err = error as Error;
                    setError(err.message || String(err));
                  } finally {
                    setActionLoading(false);
                  }
                }}
                disabled={actionLoading}
              >
                {actionLoading ? "กำลังลบ..." : "ลบวงเงิน"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm sm:rounded-lg">
        <div className="p-6">
          <CreditLimitsTable
            data={creditLimits}
            loading={loading}
            canCreate={canCreate}
            canEdit={canEdit}
            canDelete={canDelete}
            onDeleteRequest={setDeleteCandidate}
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
            statusFilter={filterDraft.status}
            onStatusFilterChange={(status) =>
              setFilterDraft((prev) => ({ ...prev, status }))
            }
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
