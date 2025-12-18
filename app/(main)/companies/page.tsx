"use client";

import React, { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  CompaniesTable,
  type CompanyRecord,
} from "@/components/features/companies/companies-table";
import CompanyCard from "@/components/features/companies/company-card";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import Link from "next/link";
import { Building2 } from "lucide-react";

export default function CompaniesPage() {
  const { hasPermission, allowed, isLoading } = usePermission("menu.companies");
  const canCreate =
    hasPermission("company.create") ||
    hasPermission("company.manage") ||
    hasPermission("menu.companies");
  const canView = !isLoading && allowed;

  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(12);
  const [total, setTotal] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [filterDraft, setFilterDraft] = useState<{
    query: string;
    dateRange?: DateRange;
  }>({ query: "", dateRange: undefined });
  const [appliedFilters, setAppliedFilters] = useState<{
    query: string;
    dateRange?: DateRange;
  }>({ query: "", dateRange: undefined });
  const [deleteCandidate, setDeleteCandidate] = useState<CompanyRecord | null>(
    null
  );
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const isExtendingEmpty =
      total === 0 &&
      appliedFilters.query &&
      filterDraft.query.startsWith(appliedFilters.query) &&
      filterDraft.query.length > appliedFilters.query.length;

    if (isExtendingEmpty) {
      return;
    }

    const delay = 400;
    const next = {
      query: filterDraft.query,
      dateRange: filterDraft.dateRange,
    };

    // If nothing changed compared to currently applied filters, don't
    // schedule a state update (prevents duplicate fetch cycles).
    const rangeKey = (r?: DateRange) =>
      r?.from?.toISOString() + "|" + r?.to?.toISOString();
    if (
      next.query === appliedFilters.query &&
      rangeKey(next.dateRange) === rangeKey(appliedFilters.dateRange)
    ) {
      return;
    }

    const id = setTimeout(() => {
      setAppliedFilters(next);
      setPage(1);
    }, delay);
    return () => clearTimeout(id);
  }, [filterDraft.query, filterDraft.dateRange, total, appliedFilters.query]);

  const mkRangeKey = (r?: DateRange) =>
    r?.from?.toISOString() + "|" + r?.to?.toISOString();

  const isTyping =
    filterDraft.query !== appliedFilters.query ||
    mkRangeKey(filterDraft.dateRange) !== mkRangeKey(appliedFilters.dateRange);

  const handleSearchSubmit = () => {
    setAppliedFilters({
      query: filterDraft.query,
      dateRange: filterDraft.dateRange,
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
        if (appliedFilters.dateRange?.from)
          params.set("from", appliedFilters.dateRange.from.toISOString());
        if (appliedFilters.dateRange?.to)
          params.set("to", appliedFilters.dateRange.to.toISOString());

        const res = await fetch(`/api/companies?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to load companies");
        const json = await res.json();
        if (mounted) {
          setCompanies(json.companies ?? []);
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
        <AlertDescription>คุณไม่มีสิทธิ์เปิดดูข้อมูลบริษัท</AlertDescription>
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

      {/* Delete confirm dialog */}
      {deleteCandidate && (
        <div className="fixed inset-0 min-h-screen z-50 flex items-center justify-center">
          <div
            className="bg-black/50 absolute inset-0"
            onClick={() => setDeleteCandidate(null)}
          />
          <div className="relative z-10 w-full max-w-md bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold">ยืนยันการลบ</h3>
            <p className="mt-2 text-sm text-slate-600">
              คุณต้องการลบบริษัท <strong>{deleteCandidate.name}</strong>{" "}
              ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteCandidate(null)}
              >
                ยกเลิก
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!deleteCandidate) return;
                  setActionLoading(true);
                  try {
                    const res = await fetch(
                      `/api/companies/${deleteCandidate.id}`,
                      { method: "DELETE" }
                    );
                    if (!res.ok) throw new Error("Delete failed");
                    setCompanies((prev) =>
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
                {actionLoading ? "กำลังลบ..." : "ลบบริษัท"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main card: match employee new page background */}
      <div className="bg-white shadow-sm sm:rounded-lg">
        <div className="p-6">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-3">
              <Building2 className="w-9 h-9 text-blue-600" />
              <h1 className="text-3xl font-bold tracking-tight">
                ข้อมูลบริษัท
              </h1>
            </div>
          </div>
          {/* Empty state handled by DataTable */}
          {/* Mobile toolbar */}
          <div className="block md:hidden mb-4">
            <div className="bg-white p-3 rounded-xl shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  value={filterDraft.query}
                  onChange={(e) =>
                    setFilterDraft((prev) => ({
                      ...prev,
                      query: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearchSubmit();
                  }}
                  placeholder="ค้นหาบริษัท หรือ ชื่อย่อ"
                  className="h-10 rounded-xl shadow-sm px-4"
                />
              </div>

              <DateRangePicker
                value={filterDraft.dateRange}
                onChange={(range) =>
                  setFilterDraft((prev) => ({
                    ...prev,
                    dateRange: range ?? undefined,
                  }))
                }
                placeholder="ช่วงวันที่"
                className="w-full rounded-lg"
              />

              <div className="flex gap-2">
                <Link href="/companies/new" className="flex-1">
                  <Button className="w-full">สร้างบริษัท</Button>
                </Link>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setFilterDraft({ query: "", dateRange: undefined });
                    handleSearchSubmit();
                  }}
                >
                  รีเซ็ต
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile: show cards */}
          <div className="md:hidden">
            <div className="grid grid-cols-1 gap-4">
              {companies.map((c) => (
                <CompanyCard
                  key={c.id}
                  id={c.id}
                  name={c.name}
                  shortName={c.shortName}
                  email={c.email}
                  phone={c.phone}
                  taxId={c.taxId}
                  status={c.status}
                  onDelete={(id) =>
                    setDeleteCandidate(
                      companies.find((x) => x.id === id) ?? null
                    )
                  }
                />
              ))}
            </div>
          </div>

          {/* Desktop / tablet: show table */}
          <div className="hidden md:block">
            <CompaniesTable
              data={companies}
              loading={loading}
              canCreate={canCreate}
              canDelete={hasPermission("company.delete")}
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

          {/* Pagination is handled by DataTable */}
        </div>
      </div>
    </section>
  );
}
