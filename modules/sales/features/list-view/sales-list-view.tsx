"use client";

import React, { useCallback, useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import { usePermission } from "@/hooks/use-permission";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SalesTable } from "@/modules/sales/features/list-view/sales-table";
import type { SaleRecord } from "@/modules/sales/types";
import { listSalesAction, deleteSaleAction } from "@/modules/sales/server/actions";
import type { SaleStatus } from "@/modules/sales/types";

export default function SalesListView() {
  const {
    hasPermission,
    allowed,
    isLoading,
    canEdit: canEditScope,
    canDelete: canDeleteScope,
  } = usePermission("menu.sales");

  const canCreate = hasPermission("sale.create");
  const canEditBase = hasPermission("sale.edit");
  const canDeleteBase = hasPermission("sale.delete");
  const canApprove = hasPermission("sale.approve");
  const canView = !isLoading && allowed;
  const user = useCurrentUser();

  // Create callbacks for checking edit/delete permissions per item based on access scope
  const canEditItem = useCallback(
    (item: SaleRecord): boolean => {
      // First check: if user doesn't have the base permission at all, deny
      if (!canEditBase) return false;

      // Check scope-based permission using the access level
      const scopeAllowed = canEditScope("sale", {
        resourceOwnerId: item.createdById,
      });

      return scopeAllowed;
    },
    [canEditScope, canEditBase]
  );

  const canDeleteItem = useCallback(
    (item: SaleRecord): boolean => {
      // First check: if user doesn't have the base permission at all, deny
      if (!canDeleteBase) return false;

      // Check scope-based permission using the access level
      const scopeAllowed = canDeleteScope("sale", {
        resourceOwnerId: item.createdById,
      });

      return scopeAllowed;
    },
    [canDeleteScope, canDeleteBase]
  );

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
  const [status, setStatus] = useState<SaleStatus | undefined>(undefined);
  const [deleteCandidate, setDeleteCandidate] = useState<SaleRecord | null>(
    null
  );
  const [actionLoading, setActionLoading] = useState(false);

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

  const fetchSales = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await listSalesAction({
        page,
        perPage,
        search: appliedFilters.query || undefined,
        dateFrom: dateRange?.from?.toISOString(),
        dateTo: dateRange?.to?.toISOString(),
        status: status || undefined,
      });

      if (!res.success) {
        throw new Error((res as any).error || "Failed to fetch sales");
      }

      setSales((res as any).sales || []);
      setTotal((res as any).total || 0);
    } catch (err: any) {
      console.error("Error loading sales:", err);
      setError(err.message || "Failed to load sales");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, appliedFilters, dateRange, status]);

  useEffect(() => {
    if (canView) {
      fetchSales();
    }
  }, [canView, fetchSales]);

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    setActionLoading(true);

    try {
      const res = await deleteSaleAction(deleteCandidate.id);

      if (!res.success) {
        throw new Error(res.error || "Failed to delete sale");
      }

      setSales((prev) => prev.filter((s) => s.id !== deleteCandidate.id));
      setTotal((prev) => Math.max(0, prev - 1));
      setDeleteCandidate(null);
    } catch (err: any) {
      console.error("Error deleting sale:", err);
      setError(err.message || "Failed to delete sale");
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
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
    <div className="container mx-auto space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <SalesTable
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
        statusFilter={status}
        onStatusFilterChange={setStatus}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
        onDelete={setDeleteCandidate}
        canCreate={canCreate}
        canEdit={canEditBase}
        canDelete={canDeleteBase}
        canApprove={canApprove}
        currentUserId={user?.id}
        userDepartmentId={user?.departmentId}
        canEditItem={canEditItem}
        canDeleteItem={canDeleteItem}
      />

      <Dialog
        open={!!deleteCandidate}
        onOpenChange={() => setDeleteCandidate(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบรายการขาย</DialogTitle>
            <DialogDescription>
              คุณต้องการลบรายการขาย {deleteCandidate?.saleNumber} ใช่หรือไม่?
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteCandidate(null)}
              disabled={actionLoading}
            >
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              {actionLoading ? "กำลังลบ..." : "ลบรายการ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
