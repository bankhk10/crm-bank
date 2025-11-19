"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { DateRange } from "react-day-picker";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

type Company = {
  id: string;
  name: string;
  shortName?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  industry?: string;
  status?: string;
  createdAt?: string;
};

export default function CompaniesPage() {
  const { hasPermission, allowed, isLoading } = usePermission("menu.companies");
  const canCreate =
    hasPermission("company.create") ||
    hasPermission("company.manage") ||
    hasPermission("menu.companies");
  const canView = !isLoading && allowed;

  const [companies, setCompanies] = useState<Company[]>([]);
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
  const [deleteCandidate, setDeleteCandidate] = useState<Company | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleApplyFilters = useCallback(() => {
    setAppliedFilters({ ...filterDraft });
    setPage(1);
  }, [filterDraft]);

  // auto-apply filters (debounced) when user types or changes date range
  useEffect(() => {
    const id = setTimeout(() => {
      const next = {
        query: filterDraft.query,
        dateRange: filterDraft.dateRange,
      };
      setAppliedFilters(next);
      setPage(1);
    }, 400);
    return () => clearTimeout(id);
  }, [filterDraft.query, filterDraft.dateRange]);

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

  const columns = useMemo<DataTableColumn<Company>[]>(
    () => [
      {
        id: "company",
        header: "บริษัท",
        cell: (company) => (
          <div>
            <div className="font-medium text-slate-900">{company.name}</div>
            {company.shortName && (
              <div className="text-xs text-muted-foreground">
                {company.shortName}
              </div>
            )}
          </div>
        ),
      },
      {
        id: "industry",
        header: "อุตสาหกรรม",
        cell: (company) => company.industry ?? "-",
      },
      {
        id: "email",
        header: "อีเมล",
        cell: (company) => company.email ?? "-",
      },
      {
        id: "phone",
        header: "โทรศัพท์",
        cell: (company) => company.phone ?? "-",
      },
      {
        id: "status",
        header: "สถานะ",
        cell: (company) => company.status ?? "-",
      },
      {
        id: "createdAt",
        header: "สร้างเมื่อ",
        cell: (company) =>
          company.createdAt
            ? new Date(company.createdAt).toLocaleDateString("th-TH")
            : "-",
      },
      {
        id: "actions",
        header: <span className="sr-only">Actions</span>,
        align: "right",
        cell: (company) => (
          <div className="flex items-center justify-end gap-2">
            <Link href={`/companies/${company.id}`}>
              <Button variant="outline" size="sm">
                ดู
              </Button>
            </Link>
            <Link href={`/companies/${company.id}/edit`}>
              <Button size="sm">แก้ไข</Button>
            </Link>
            {hasPermission("company.delete") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteCandidate(company)}
              >
                ลบ
              </Button>
            )}
          </div>
        ),
      },
    ],
    [hasPermission]
  );

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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
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
          {/* Empty state handled by DataTable */}
          <DataTable<Company>
            title={
              <div className="text-2xl md:text-3xl font-semibold text-center my-8">
                รายการบริษัท
              </div>
            }
            description=""
            data={companies}
            columns={columns}
            loading={loading}
            toolbarActions={
              <div className="flex items-center gap-2">
                {canCreate ? (
                  <Link href="/companies/new">
                    <Button>สร้างบริษัท</Button>
                  </Link>
                ) : (
                  <Button variant="outline" disabled>
                    สร้างบริษัท
                  </Button>
                )}
              </div>
            }
            filters={{
              search: {
                value: filterDraft.query,
                onChange: (value) =>
                  setFilterDraft((prev) => ({ ...prev, query: value })),
                placeholder: "ค้นหาชื่อบริษัทหรือชื่อย่อ",
              },
              dateRange: {
                value: filterDraft.dateRange,
                onChange: (range) =>
                  setFilterDraft((prev) => ({
                    ...prev,
                    dateRange: range ?? undefined,
                  })),
                buttonLabel: "",
                placeholder: "เลือกช่วงวันที่",
              },
              onApply: handleApplyFilters,
              isApplying: loading,
              showApplyButton: false,
            }}
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
            emptyState={{
              title: "ยังไม่มีบริษัท",
              description: "ลองปรับเงื่อนไขการค้นหา หรือสร้างบริษัทใหม่",
              action: canCreate ? (
                <Link href="/companies/new">
                  <Button size="sm">สร้างบริษัทใหม่</Button>
                </Link>
              ) : undefined,
            }}
          />

          {/* Pagination is handled by DataTable */}
        </div>
      </div>
    </section>
  );
}
