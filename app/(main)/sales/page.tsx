"use client";

import React, { useEffect, useState } from "react";
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
import {
  SalesTable,
  type SaleRecord,
} from "@/components/features/sales/sales-table";
import type { SaleStatus } from "@/types/sales";

export default function SalesPage() {
  const { hasPermission, allowed, isLoading } = usePermission("menu.sales");
  const canCreate = hasPermission("sale.create");
  const canEdit = hasPermission("sale.edit");
  const canDelete = hasPermission("sale.delete");
  const canApprove = hasPermission("sale.approve");
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

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: String(page),
          perPage: String(perPage),
        });
        if (appliedFilters.query) {
          params.set("search", appliedFilters.query);
        }
        if (dateRange?.from) {
          params.set("dateFrom", dateRange.from.toISOString());
        }
        if (dateRange?.to) {
          params.set("dateTo", dateRange.to.toISOString());
        }
        if (status) {
          params.set("status", status);
        }

        const res = await fetch(`/api/sales?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!mounted) return;

        if (!res.ok) {
          throw new Error("Failed to fetch sales");
        }

        const data = await res.json();
        setSales(data.sales || []);
        setTotal(data.total || 0);
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
  }, [page, perPage, appliedFilters, dateRange, status]);

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/sales/${deleteCandidate.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete sale");
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
    <div className="container mx-auto py-8 space-y-6">
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
        canEdit={canEdit}
        canDelete={canDelete}
        canApprove={canApprove}
        currentUserId={user?.id}
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
