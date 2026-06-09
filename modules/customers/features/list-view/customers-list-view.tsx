"use client";

import React, { useState } from "react";
import { UserCog } from "lucide-react";
import { usePermission } from "@/hooks/use-permission";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PageHeader } from "@/components/custom/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DeleteDialog } from "@/components/custom/delete-dialog";
import { CustomersTable } from "./customers-table";
import { useCustomersList } from "./use-customers-list";
import { deleteCustomerAction } from "../../server/actions";
import { toast } from "sonner";
import type { CustomerRecord } from "../../types";

export default function CustomersListView() {
  const {
    hasPermission,
    allowed,
    isLoading,
    canEdit: canEditScope,
    canDelete: canDeleteScope,
  } = usePermission("menu.customers");

  const canCreate = hasPermission("customer.create.dealer") ||
    hasPermission("customer.create.subdealer") ||
    hasPermission("customer.create.farmer") ||
    hasPermission("customer.create.broker");
  const canEditBase = hasPermission("customer.edit.dealer") ||
    hasPermission("customer.edit.subdealer") ||
    hasPermission("customer.edit.farmer") ||
    hasPermission("customer.edit.broker");
  const canDeleteBase = hasPermission("customer.delete.dealer") ||
    hasPermission("customer.delete.subdealer") ||
    hasPermission("customer.delete.farmer") ||
    hasPermission("customer.delete.broker");
  const canView = !isLoading && allowed;

  // Create callbacks for checking edit/delete permissions per item based on access scope
  const canEditItem = React.useCallback(
    (item: CustomerRecord): boolean => {
      // First check: if user doesn't have the base permission at all, deny
      if (!canEditBase) return false;

      // Check scope-based permission using the access level
      const scopeAllowed = canEditScope("customer", {
        resourceOwnerId: (item as any).createdById,
        resourceDepartmentId: (item as any).departmentId,
      });

      return scopeAllowed;
    },
    [canEditScope, canEditBase]
  );

  const canDeleteItem = React.useCallback(
    (item: CustomerRecord): boolean => {
      // First check: if user doesn't have the base permission at all, deny
      if (!canDeleteBase) return false;

      // Check scope-based permission using the access level
      const scopeAllowed = canDeleteScope("customer", {
        resourceOwnerId: (item as any).createdById,
        resourceDepartmentId: (item as any).departmentId,
      });

      return scopeAllowed;
    },
    [canDeleteScope, canDeleteBase]
  );

  const {
    data,
    total,
    loading,
    error,
    page,
    perPage,
    filterDraft,
    setFilterDraft,
    setPage,
    setPerPage,
    appliedFilters,
    setAppliedFilters,
    handleSearchSubmit,
  } = useCustomersList(canView);

  const [deleteTarget, setDeleteTarget] = useState<CustomerRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      const res = await deleteCustomerAction(deleteTarget.id);
      if (!res.success) throw new Error(res.error || "Delete failed");

      setDeleteTarget(null);
      toast.success("ลบข้อมูลลูกค้าสำเร็จ");
      setAppliedFilters({ ...appliedFilters });
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || String(error));
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-500">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>คุณไม่มีสิทธิ์เปิดดูข้อมูลลูกค้า</AlertDescription>
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
            icon={UserCog}
            iconClassName="text-blue-600"
            title="ข้อมูลลูกค้า"
          />

          <CustomersTable
            data={data}
            total={total}
            loading={loading}
            page={page}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
            filterDraft={filterDraft}
            setFilterDraft={setFilterDraft}
            onSearchSubmit={handleSearchSubmit}
            onRefresh={() => {
              setAppliedFilters({ ...appliedFilters });
            }}
            canCreate={canCreate}
            canEdit={canEditBase}
            canDelete={canDeleteBase}
            canEditItem={canEditItem}
            canDeleteItem={canDeleteItem}
            onDeleteRequest={(c) => setDeleteTarget(c)}
          />
        </div>
      </div>

      <DeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
        title="ยืนยันการลบ"
        description={
          <>
            คุณต้องการลบลูกค้า <b>{deleteTarget?.name}</b> ใช่หรือไม่? <br />
            การกระทำนี้ไม่สามารถย้อนกลับได้
          </>
        }
        isDeleting={actionLoading}
        confirmText={actionLoading ? "กำลังลบ..." : "ลบลูกค้า"}
      />
    </section>
  );
}
