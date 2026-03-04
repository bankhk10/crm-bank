"use client";

import React, { useEffect, useState, useCallback } from "react";
import type { DateRange } from "react-day-picker";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  ProductsTable,
  type ProductRecord,
  listProductsAction,
  deleteProductAction,
} from "@/modules/products";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import Link from "next/link";
import { Package } from "lucide-react";
import { PAGINATION } from "@/lib/constants";

export default function ProductsPage() {
  const { hasPermission, allowed, isLoading } = usePermission("menu.products");
  const canCreate = hasPermission("product.create");
  const canView = !isLoading && allowed;
  const canUpdate = hasPermission("product.edit");
  const canDelete = hasPermission("product.delete");
  const canManage = hasPermission("product.manage");

  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<number>(PAGINATION.DEFAULT_PAGE);
  const [perPage, setPerPage] = useState<number>(PAGINATION.DEFAULT_PER_PAGE);
  const [total, setTotal] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [filterDraft, setFilterDraft] = useState<{
    query: string;
    status: string;
    dateRange?: DateRange;
  }>({ query: "", status: "", dateRange: undefined });
  const [appliedFilters, setAppliedFilters] = useState<{
    query: string;
    status: string;
    dateRange?: DateRange;
  }>({ query: "", status: "", dateRange: undefined });
  const [deleteCandidate, setDeleteCandidate] = useState<ProductRecord | null>(
    null
  );
  const [actionLoading, setActionLoading] = useState(false);

  // auto-apply filters (debounced)
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
      status: filterDraft.status,
      dateRange: filterDraft.dateRange,
    };

    const rangeKey = (r?: DateRange) =>
      r?.from?.toISOString() + "|" + r?.to?.toISOString();
    if (
      next.query === appliedFilters.query &&
      next.status === appliedFilters.status &&
      rangeKey(next.dateRange) === rangeKey(appliedFilters.dateRange)
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
    filterDraft.status,
    filterDraft.dateRange,
    total,
    appliedFilters.query,
    appliedFilters.status,
    appliedFilters.dateRange,
  ]);

  const mkRangeKey = (r?: DateRange) =>
    r?.from?.toISOString() + "|" + r?.to?.toISOString();

  const isTyping =
    filterDraft.query !== appliedFilters.query ||
    filterDraft.status !== appliedFilters.status ||
    mkRangeKey(filterDraft.dateRange) !== mkRangeKey(appliedFilters.dateRange);

  const handleSearchSubmit = () => {
    setAppliedFilters({
      query: filterDraft.query,
      status: filterDraft.status,
      dateRange: filterDraft.dateRange,
    });
    setPage(1);
  };

  // Fetch products using server action
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listProductsAction({
        page,
        perPage,
        q: appliedFilters.query.trim() || undefined,
        status: appliedFilters.status.trim() || undefined,
        from: appliedFilters.dateRange?.from || undefined,
        to: appliedFilters.dateRange?.to || undefined,
      });
      setProducts((result.products ?? []) as ProductRecord[]);
      setTotal(typeof result.total === "number" ? result.total : 0);
    } catch (error) {
      const err = error as Error;
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }, [page, perPage, appliedFilters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  if (!canView) {
    return (
      <Alert variant="destructive">
        <AlertDescription>คุณไม่มีสิทธิ์เปิดดูข้อมูลสินค้า</AlertDescription>
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
              คุณต้องการลบสินค้า <strong>{deleteCandidate.name}</strong>{" "}
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
                    const result = await deleteProductAction(deleteCandidate.id);
                    if (!result.success) throw new Error(result.error || "Delete failed");
                    setProducts((prev) =>
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
                {actionLoading ? "กำลังลบ..." : "ลบสินค้า"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm sm:rounded-lg">
        <div className="p-6">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-3">
              <Package className="w-9 h-9 text-blue-600" />

              <h1 className="text-3xl font-bold tracking-tight">
                ข้อมูลสินค้า
              </h1>
            </div>
          </div>

          {/* Mobile toolbar - hidden since ProductsTable has its own responsive toolbar */}
          <div className="hidden">
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
                  placeholder="ค้นหาสินค้า"
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

              {canCreate && (
                <div className="flex gap-2">
                  <Link href="/products/new" className="flex-1">
                    <Button className="w-full">สร้างสินค้า</Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setFilterDraft({
                        query: "",
                        status: "",
                        dateRange: undefined,
                      });
                      handleSearchSubmit();
                    }}
                  >
                    รีเซ็ต
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* ProductsTable - responsive for all screen sizes */}
          <div>
            <ProductsTable
              data={products}
              loading={loading}
              canCreate={canCreate}
              canView={canView}
              canUpdate={canUpdate}
              canDelete={canDelete}
              canManage={canManage}
              onDeleteRequest={setDeleteCandidate}
              searchValue={filterDraft.query}
              onSearchChange={(value) =>
                setFilterDraft((prev) => ({ ...prev, query: value }))
              }
              onSearchSubmit={handleSearchSubmit}
              statusFilter={filterDraft.status}
              onStatusFilterChange={(value) =>
                setFilterDraft((prev) => ({ ...prev, status: value }))
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
                perPageOptions: [...PAGINATION.PER_PAGE_OPTIONS],
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
