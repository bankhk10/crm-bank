"use client";

import React, { useCallback } from "react";
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
import { BadgeDollarSign } from "lucide-react";
import { SalesTable } from "@/modules/sales/features/list-view/sales-table";
import { PageHeader } from "@/components/custom/page-header";
import type { SaleRecord } from "@/modules/sales/types";
import { useSalesList } from "./use-sales-list";

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
        resourceEmployeeId: item.employeeId,
        resourceDepartmentId: (item.employee as any)?.departmentId,
      });

      return scopeAllowed;
    },
    [canEditScope, canEditBase],
  );

  const canDeleteItem = useCallback(
    (item: SaleRecord): boolean => {
      // First check: if user doesn't have the base permission at all, deny
      if (!canDeleteBase) return false;

      // Check scope-based permission using the access level
      const scopeAllowed = canDeleteScope("sale", {
        resourceOwnerId: item.createdById,
        resourceEmployeeId: item.employeeId,
        resourceDepartmentId: (item.employee as any)?.departmentId,
      });

      return scopeAllowed;
    },
    [canDeleteScope, canDeleteBase],
  );

  const {
    sales,
    loading,
    page,
    setPage,
    perPage,
    setPerPage,
    total,
    error,
    filterDraft,
    setFilterDraft,
    isTyping,
    handleSearchSubmit,
    dateRange,
    setDateRange,
    status,
    setStatus,
    deleteCandidate,
    setDeleteCandidate,
    actionLoading,
    handleDelete,
    filterCustomers,
    customerId,
    setCustomerId,
  } = useSalesList({ canView });

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
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <section className="space-y-6 pb-24 md:pb-8">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="bg-white shadow-sm sm:rounded-lg">
        <div className="p-6">
          <PageHeader
            icon={BadgeDollarSign}
            iconClassName="text-blue-600"
            title="ข้อมูลการขาย"
          />

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
            customerId={customerId}
            onCustomerIdChange={(val) => {
              setCustomerId(Array.isArray(val) ? val : val ? [val] : []);
              setPage(1);
            }}
            customers={filterCustomers}
          />
        </div>
      </div>

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
    </section>
  );
}
