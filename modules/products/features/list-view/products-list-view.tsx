"use client";

import React, { useEffect, useState, useTransition, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  ProductsTable,
  listProductsAction,
  deleteProductAction,
  getProductFormOptionsAction,
  type ProductRecord,
} from "@/modules/products";
import { Package } from "lucide-react";
import { PageHeader } from "@/components/custom/page-header";
import { PAGINATION } from "@/lib/constants";
import { toast } from "sonner";
import { Upload } from "lucide-react";

export default function ProductsListView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { hasPermission, allowed, isLoading: checkingPermission } = usePermission("menu.products");
  const canCreate = hasPermission("product.create");
  const canView = (!checkingPermission && allowed) || hasPermission("product.view");
  const canUpdate = hasPermission("product.edit");
  const canDelete = hasPermission("product.delete");
  const canManage = hasPermission("product.manage");

  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // URL State
  const page = Number(searchParams.get("page")) || PAGINATION.DEFAULT_PAGE;
  const perPage = Number(searchParams.get("perPage")) || PAGINATION.DEFAULT_PER_PAGE;
  const query = searchParams.get("q") || "";
  const status = searchParams.get("status") || "";
  const unit = searchParams.get("unit") || "";

  // Draft filters for UI input
  const [filterDraft, setFilterDraft] = useState({ query, status, unit });
  const [unitOptions, setUnitOptions] = useState<{ value: string; label: string }[]>([]);

  // Sync draft with URL if it changes from outside
  useEffect(() => {
    setFilterDraft({ query, status, unit });
  }, [query, status, unit]);

  // Fetch unit options
  useEffect(() => {
    getProductFormOptionsAction().then((options) => {
      if (options?.units) {
        setUnitOptions(options.units);
      }
    });
  }, []);

  const [deleteCandidate, setDeleteCandidate] = useState<ProductRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleApplyFilters = useCallback((newParams: { q?: string; status?: string; unit?: string; page?: number; perPage?: number }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newParams.q !== undefined) {
      if (newParams.q) params.set("q", newParams.q.trim());
      else params.delete("q");
    }

    if (newParams.status !== undefined) {
      if (newParams.status) params.set("status", newParams.status);
      else params.delete("status");
    }

    if (newParams.unit !== undefined) {
      if (newParams.unit) params.set("unit", newParams.unit);
      else params.delete("unit");
    }

    if (newParams.page !== undefined) params.set("page", String(newParams.page));
    if (newParams.perPage !== undefined) params.set("perPage", String(newParams.perPage));

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }, [pathname, router, searchParams]);

  const handleSearchSubmit = useCallback(() => {
    handleApplyFilters({
      q: filterDraft.query,
      status: filterDraft.status,
      unit: filterDraft.unit,
      page: 1,
    });
  }, [filterDraft, handleApplyFilters]);

  // Debounced search
  useEffect(() => {
    const isTyping = filterDraft.query !== query || filterDraft.status !== status || filterDraft.unit !== unit;
    if (!isTyping) return;

    const delay = 400;
    const id = setTimeout(() => {
      handleSearchSubmit();
    }, delay);
    return () => clearTimeout(id);
  }, [filterDraft, query, status, handleSearchSubmit]);

  const fetchProducts = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    try {
      const result = await listProductsAction({
        page,
        perPage,
        q: query.trim() || undefined,
        status: status.trim() || undefined,
        unit: unit.trim() || undefined,
      });
      setProducts((result.products ?? []) as ProductRecord[]);
      setTotal(typeof result.total === "number" ? result.total : 0);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }, [page, perPage, query, status, unit, canView]);

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    setActionLoading(true);
    try {
      const result = await deleteProductAction(deleteCandidate.id);
      if (!result.success) throw new Error(result.error || "Delete failed");
      toast.success("ลบสินค้าเรียบร้อยแล้ว");
      setDeleteCandidate(null);
      // Wait for the server to update then refetch
      await fetchProducts();
      router.refresh(); // Still keep this for any server components listening
    } catch (err: any) {
      setError(err.message || String(err));
      toast.error(err.message || "Failed to delete");
    } finally {
      setActionLoading(false);
    }
  };

  if (checkingPermission) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

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
                onClick={handleDelete}
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
          <PageHeader
            icon={Package}
            iconClassName="text-blue-600"
            title="ข้อมูลสินค้า"
            actions={
              canManage && (
                <Button
                  variant="outline"
                  className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                  onClick={() => router.push("/products/import-stock")}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  นำเข้าสต็อก (Excel)
                </Button>
              )
            }
          />

          <ProductsTable
            data={products}
            loading={loading || isPending}
            canCreate={canCreate}
            canView={canView}
            canUpdate={canUpdate}
            canDelete={canDelete}
            canManage={canManage}
            onDeleteRequest={setDeleteCandidate}
            searchValue={filterDraft.query}
            onSearchChange={(value) => setFilterDraft(prev => ({ ...prev, query: value }))}
            onSearchSubmit={handleSearchSubmit}
            onStatusFilterChange={(value) => setFilterDraft(prev => ({ ...prev, status: value }))}
            unitFilter={filterDraft.unit}
            onUnitFilterChange={(value) => setFilterDraft(prev => ({ ...prev, unit: value }))}
            units={unitOptions}
            pagination={{
              page,
              perPage,
              total,
              onPageChange: (nextPage) => handleApplyFilters({ page: nextPage }),
              onPerPageChange: (nextPerPage) => handleApplyFilters({ perPage: nextPerPage, page: 1 }),
              perPageOptions: [...PAGINATION.PER_PAGE_OPTIONS],
            }}
          />
        </div>
      </div>
    </section>
  );
}
