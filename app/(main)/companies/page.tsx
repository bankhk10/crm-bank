"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Grid, Table as TableIcon, Columns } from "lucide-react";
import CompanyCard from "@/components/features/companies/company-card";
import CompaniesKanbanBoard from "@/components/features/companies/companies-kanban-board";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

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
  const canCreate = hasPermission("company.create") || hasPermission("company.manage") || hasPermission("menu.companies");
  const canView = !isLoading && allowed;

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(12);
  const [total, setTotal] = useState<number>(0);
  const [view, setView] = useState<"grid" | "table" | "kanban">("grid");
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [deleteCandidate, setDeleteCandidate] = useState<Company | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // reset to first page when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

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
        if (debouncedSearch.trim()) params.set("q", debouncedSearch.trim());

        const res = await fetch(`/api/companies?${params.toString()}`, { signal: controller.signal });
        if (!res.ok) throw new Error("Failed to load companies");
        const json = await res.json();
        if (mounted) {
          setCompanies(json.companies ?? []);
          setTotal(typeof json.total === "number" ? json.total : 0);
        }
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(String(e?.message ?? e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [page, perPage, debouncedSearch]);

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
        <div>
          <h1 className="text-2xl font-semibold">บริษัท</h1>
          <p className="text-sm text-muted-foreground">ภาพรวมของลูกค้า องค์กร และบัญชี</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm placeholder:text-slate-400"
              placeholder="ค้นหาบริษัท..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 rounded bg-slate-50 p-1">
            <button className={`p-2 rounded ${view === "grid" ? "bg-white shadow" : "hover:bg-white/50"}`} onClick={() => setView("grid")} title="Grid view">
              <Grid size={16} />
            </button>
            <button className={`p-2 rounded ${view === "table" ? "bg-white shadow" : "hover:bg-white/50"}`} onClick={() => setView("table")} title="Table view">
              <TableIcon size={16} />
            </button>
            <button className={`p-2 rounded ${view === "kanban" ? "bg-white shadow" : "hover:bg-white/50"}`} onClick={() => setView("kanban")} title="Kanban view">
              <Columns size={16} />
            </button>
          </div>

          {canCreate ? (
            <Link href="/companies/new">
              <Button>สร้างบริษัท</Button>
            </Link>
          ) : (
            <Button variant="outline" disabled>สร้างบริษัท</Button>
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
          <div className="bg-black/50 absolute inset-0" onClick={() => setDeleteCandidate(null)} />
          <div className="relative z-10 w-full max-w-md bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold">ยืนยันการลบ</h3>
            <p className="mt-2 text-sm text-slate-600">คุณต้องการลบบริษัท <strong>{deleteCandidate.name}</strong> ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteCandidate(null)}>ยกเลิก</Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!deleteCandidate) return;
                  setActionLoading(true);
                  try {
                    const res = await fetch(`/api/companies/${deleteCandidate.id}`, { method: "DELETE" });
                    if (!res.ok) throw new Error("Delete failed");
                    setCompanies((prev) => prev.filter((c) => c.id !== deleteCandidate.id));
                    setDeleteCandidate(null);
                  } catch (e: any) {
                    setError(String(e?.message ?? e));
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
          {!loading && companies.length === 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
              <h3 className="text-xl font-semibold">ยังไม่มีบริษัท</h3>
              <p className="mt-2 text-sm text-slate-600">ยังไม่มีรายการบริษัทในระบบ คุณสามารถสร้างบริษัทใหม่ได้</p>
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
                <div key={i} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm animate-pulse h-40" />
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
                  onDelete={hasPermission("company.delete") ? (id) => setDeleteCandidate(companies.find((x) => x.id === id) ?? null) : undefined}
                />
              ))}
            </div>
          ) : view === "table" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.shortName}</div>
                      </TableCell>
                      <TableCell>{c.industry}</TableCell>
                      <TableCell>{c.email}</TableCell>
                      <TableCell>{c.phone}</TableCell>
                      <TableCell>{c.status}</TableCell>
                      <TableCell>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 justify-end">
                          <Link href={`/companies/${c.id}`}>
                            <Button variant="outline" size="sm">View</Button>
                          </Link>
                          <Link href={`/companies/${c.id}`}>
                            <Button size="sm">Edit</Button>
                          </Link>
                          {hasPermission("company.delete") ? (
                            <Button variant="ghost" size="sm" onClick={() => setDeleteCandidate(c)}>Delete</Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ) : (
            <CompaniesKanbanBoard />
          )}

          {/* Pagination controls */}
          {!loading && total > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">{`แสดง ${Math.min((page - 1) * perPage + 1, total)} - ${Math.min(page * perPage, total)} จาก ${total} รายการ`}</div>
              <div className="flex items-center gap-2">
                <select
                  value={perPage}
                  onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                  className="rounded-md border px-2 py-1 text-sm"
                >
                  <option value={6}>6 / หน้า</option>
                  <option value={12}>12 / หน้า</option>
                  <option value={24}>24 / หน้า</option>
                </select>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>ก่อนหน้า</Button>
                  <div className="text-sm">หน้า {page} / {Math.max(1, Math.ceil(total / perPage))}</div>
                  <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(Math.max(1, Math.ceil(total / perPage)), p + 1))} disabled={page >= Math.max(1, Math.ceil(total / perPage))}>ถัดไป</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
