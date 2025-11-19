"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Grid, Table as TableIcon, Columns, Search } from "lucide-react";
import type { DateRange } from "react-day-picker";
import CompanyCard from "@/components/features/companies/company-card";
import CompaniesKanbanBoard from "@/components/features/companies/companies-kanban-board";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { DateRangePicker } from "@/components/ui/date-range-picker";

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
  const [view, setView] = useState<"grid" | "table" | "kanban">("grid");
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
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {view !== "table" && (
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative">
                <input
                  className="h-10 rounded-full border border-slate-200 bg-white px-10 text-sm shadow-sm shadow-slate-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  placeholder="ค้นหาบริษัท..."
                  value={filterDraft.query}
                  onChange={(e) =>
                    setFilterDraft((prev) => ({
                      ...prev,
                      query: e.target.value,
                    }))
                  }
                />
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
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
                buttonLabel="ช่วงวันที่"
                placeholder="เลือกช่วงวันที่"
                className="w-full md:w-auto"
              />
              <Button
                className="rounded-full px-6"
                onClick={handleApplyFilters}
                disabled={loading}
              >
                {loading ? "กำลังค้นหา..." : "ค้นหา"}
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2 rounded bg-slate-50 p-1">
            <button
              className={`p-2 rounded ${
                view === "grid" ? "bg-white shadow" : "hover:bg-white/50"
              }`}
              onClick={() => setView("grid")}
              title="Grid view"
            >
              <Grid size={16} />
            </button>
            <button
              className={`p-2 rounded ${
                view === "table" ? "bg-white shadow" : "hover:bg-white/50"
              }`}
              onClick={() => setView("table")}
              title="Table view"
            >
              <TableIcon size={16} />
            </button>
            <button
              className={`p-2 rounded ${
                view === "kanban" ? "bg-white shadow" : "hover:bg-white/50"
              }`}
              onClick={() => setView("kanban")}
              title="Kanban view"
            >
              <Columns size={16} />
            </button>
          </div>

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
      </header>

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
          {/* Empty state */}
          {!loading && companies.length === 0 && view !== "table" && (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
              <h3 className="text-xl font-semibold">ยังไม่มีบริษัท</h3>
              <p className="mt-2 text-sm text-slate-600">
                ยังไม่มีรายการบริษัทในระบบ คุณสามารถสร้างบริษัทใหม่ได้
              </p>
              {canCreate && (
                <div className="mt-4">
                  <Link href="/companies/new">
                    <Button>สร้างบริษัทใหม่</Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Views */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm animate-pulse h-40"
                />
              ))}
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.map((c) => (
                <CompanyCard
                  key={c.id}
                  id={c.id}
                  name={c.name}
                  shortName={c.shortName}
                  email={c.email}
                  phone={c.phone}
                  taxId={c.taxId}
                  industry={c.industry}
                  status={c.status}
                  onDelete={
                    hasPermission("company.delete")
                      ? (id) =>
                          setDeleteCandidate(
                            companies.find((x) => x.id === id) ?? null
                          )
                      : undefined
                  }
                />
              ))}
            </div>
          ) : view === "table" ? (
            <DataTable<Company>
              title="รายการบริษัท"
              description="จัดการ ตรวจสอบ และอัปเดตข้อมูลบริษัททั้งหมดได้จากตารางเดียว"
              data={companies}
              columns={columns}
              loading={loading}
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
                  buttonLabel: "ช่วงวันที่",
                  placeholder: "เลือกช่วงวันที่",
                },
                onApply: handleApplyFilters,
                isApplying: loading,
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
          ) : (
            <CompaniesKanbanBoard />
          )}

          {/* Pagination controls */}
          {view !== "table" && !loading && total > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">{`แสดง ${Math.min(
                (page - 1) * perPage + 1,
                total
              )} - ${Math.min(
                page * perPage,
                total
              )} จาก ${total} รายการ`}</div>
              <div className="flex items-center gap-2">
                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  className="rounded-md border px-2 py-1 text-sm"
                >
                  <option value={6}>6 / หน้า</option>
                  <option value={12}>12 / หน้า</option>
                  <option value={24}>24 / หน้า</option>
                </select>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    ก่อนหน้า
                  </Button>
                  <div className="text-sm">
                    หน้า {page} / {Math.max(1, Math.ceil(total / perPage))}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setPage((p) =>
                        Math.min(Math.max(1, Math.ceil(total / perPage)), p + 1)
                      )
                    }
                    disabled={page >= Math.max(1, Math.ceil(total / perPage))}
                  >
                    ถัดไป
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
