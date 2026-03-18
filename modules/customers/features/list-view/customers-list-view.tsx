"use client";

import React, { useEffect, useState, useCallback } from "react";
import { UserCog } from "lucide-react";
import { usePermission } from "@/hooks/use-permission";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PageHeader } from "@/components/custom/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CustomersTable } from "./customers-table";
import { getCustomersAction } from "../../server/actions";
import { PAGINATION } from "@/lib/constants";
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
  const user = useCurrentUser();

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

  const [data, setData] = useState<CustomerRecord[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState<number>(PAGINATION.DEFAULT_PAGE);
  const [perPage, setPerPage] = useState<number>(PAGINATION.DEFAULT_PER_PAGE);

  const [filterDraft, setFilterDraft] = useState<{
    query: string;
    customerType?: string;
    status?: string;
  }>({ query: "", customerType: "", status: "" });

  const [appliedFilters, setAppliedFilters] = useState<{
    query: string;
    customerType?: string;
    status?: string;
  }>({ query: "", customerType: "", status: "" });

  // Debounced filter application
  useEffect(() => {
    const isExtendingEmpty =
      total === 0 &&
      appliedFilters.query &&
      filterDraft.query.startsWith(appliedFilters.query) &&
      filterDraft.query.length > appliedFilters.query.length;

    if (isExtendingEmpty) return;

    const delay = 400;
    const next = {
      query: filterDraft.query,
      customerType: filterDraft.customerType,
      status: filterDraft.status,
    };

    if (
      next.query === appliedFilters.query &&
      next.customerType === appliedFilters.customerType &&
      next.status === appliedFilters.status
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
    filterDraft.customerType,
    filterDraft.status,
    total,
    appliedFilters.query,
    appliedFilters.customerType,
    appliedFilters.status,
  ]);

  const handleSearchSubmit = () => {
    setAppliedFilters({
      query: filterDraft.query,
      customerType: filterDraft.customerType,
      status: filterDraft.status,
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
        const params: any = {
          page: Number(page),
          perPage: Number(perPage),
        };

        if (appliedFilters.query.trim())
          params.q = appliedFilters.query.trim();
        if (appliedFilters.customerType)
          params.typeFilter = appliedFilters.customerType;
        if (appliedFilters.status)
          params.statusFilter = appliedFilters.status;

        const res = await getCustomersAction(params);

        if (mounted) {
          const parsedCustomers = (res.customers ?? []).map((c: any) => ({
            ...c,
            email: c.email === null ? undefined : c.email,
            phone: c.phone === null ? undefined : c.phone,
            status: c.status === null ? undefined : c.status,
          }));
          setData(parsedCustomers as CustomerRecord[]);
          setTotal(typeof res.total === "number" ? res.total : 0);
        }
      } catch (err: any) {
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
    <section className="space-y-6">
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
            currentUserId={user?.id}
          />
        </div>
      </div>
    </section>
  );
}
