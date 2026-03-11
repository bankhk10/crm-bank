"use client";

import React, { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  CustomersTable,
  type CustomerRecord,
} from "@/modules/customers";
import { UserCog } from "lucide-react";
import { getCustomersAction, deleteCustomerAction } from "@/modules/customers/server/actions";
import { PAGINATION } from "@/lib/constants";
import { PageHeader } from "@/components/custom/page-header";

export default function CustomersPage() {
  const { hasPermission, allowed, isLoading } = usePermission("menu.customers");
  const canCreateDealer = hasPermission("customer.create.dealer");
  const canCreateSubdealer = hasPermission("customer.create.subdealer");
  const canCreateFarmer = hasPermission("customer.create.farmer");
  const canCreateBroker = hasPermission("customer.create.broker");
  const canCreate =
    canCreateDealer || canCreateSubdealer || canCreateFarmer || canCreateBroker;
  const canView = !isLoading && allowed;

  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<number>(PAGINATION.DEFAULT_PAGE);
  const [perPage, setPerPage] = useState<number>(PAGINATION.DEFAULT_PER_PAGE);
  const [total, setTotal] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [filterDraft, setFilterDraft] = useState<{
    query: string;
    dateRange?: DateRange;
    customerType?: string;
    status?: string;
  }>({ query: "", dateRange: undefined, customerType: "", status: "" });
  const [appliedFilters, setAppliedFilters] = useState<{
    query: string;
    dateRange?: DateRange;
    customerType?: string;
    status?: string;
  }>({ query: "", dateRange: undefined, customerType: "", status: "" });
  const [deleteCandidate, setDeleteCandidate] = useState<CustomerRecord | null>(
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
    const next = {
      query: filterDraft.query,
      dateRange: filterDraft.dateRange,
      customerType: filterDraft.customerType,
      status: filterDraft.status,
    };

    const rangeKey = (r?: DateRange) =>
      r?.from?.toISOString() + "|" + r?.to?.toISOString();
    if (
      next.query === appliedFilters.query &&
      rangeKey(next.dateRange) === rangeKey(appliedFilters.dateRange) &&
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
    filterDraft.dateRange,
    filterDraft.customerType,
    filterDraft.status,
    total,
    appliedFilters.query,
    appliedFilters.customerType,
    appliedFilters.dateRange,
    appliedFilters.status,
  ]);

  const handleSearchSubmit = () => {
    setAppliedFilters({
      query: filterDraft.query,
      dateRange: filterDraft.dateRange,
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
        const params: any = {};
        params.page = Number(page);
        params.perPage = Number(perPage);
        if (appliedFilters.query.trim())
          params.q = appliedFilters.query.trim();
        if (appliedFilters.customerType)
          params.typeFilter = appliedFilters.customerType;
        if (appliedFilters.status) params.statusFilter = appliedFilters.status;
        if (appliedFilters.dateRange?.from)
          params.from = appliedFilters.dateRange.from.toISOString();
        if (appliedFilters.dateRange?.to)
          params.to = appliedFilters.dateRange.to.toISOString();

        const res = await getCustomersAction(params);
        if (mounted) {
          const parsedCustomers = (res.customers ?? []).map((c: any) => ({
            ...c,
            email: c.email === null ? undefined : c.email,
            phone: c.phone === null ? undefined : c.phone,
            status: c.status === null ? undefined : c.status,
          }));
          setCustomers(parsedCustomers as any[]);
          setTotal(typeof res.total === "number" ? res.total : 0);
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

  if (!canView) {
    return (
      <Alert variant="destructive">
        <AlertDescription>คุณไม่มีสิทธิ์เปิดดูข้อมูลลูกค้า</AlertDescription>
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

      {deleteCandidate && (
        <div className="fixed inset-0 min-h-screen z-50 flex items-center justify-center">
          <div
            className="bg-black/50 absolute inset-0"
            onClick={() => setDeleteCandidate(null)}
          />
          <div className="relative z-10 w-full max-w-md bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold">ยืนยันการลบ</h3>
            <p className="mt-2 text-sm text-slate-600">
              คุณต้องการลบลูกค้า <strong>{deleteCandidate.name}</strong>{" "}
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
                    const res = await deleteCustomerAction(deleteCandidate.id);
                    if (!res.success) throw new Error(res.error || "Delete failed");
                    setCustomers((prev) =>
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
                {actionLoading ? "กำลังลบ..." : "ลบลูกค้า"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm sm:rounded-lg">
        <div className="p-6">
          <PageHeader
            icon={UserCog}
            iconClassName="text-blue-600"
            title="ข้อมูลลูกค้า"
          />

          <CustomersTable
            data={customers}
            loading={loading}
            canCreate={canCreate}
            canCreateDealer={canCreateDealer}
            canCreateSubdealer={canCreateSubdealer}
            canCreateFarmer={canCreateFarmer}
            canCreateBroker={canCreateBroker}
            canDelete={hasPermission("customer.delete.dealer") || hasPermission("customer.delete.subdealer") || hasPermission("customer.delete.farmer") || hasPermission("customer.delete.broker")}
            onDeleteRequest={setDeleteCandidate}
            searchValue={filterDraft.query}
            onSearchChange={(value: string) =>
              setFilterDraft((prev) => ({ ...prev, query: value }))
            }
            onSearchSubmit={handleSearchSubmit}
            customerTypeFilter={filterDraft.customerType}
            onCustomerTypeFilterChange={(type: string) =>
              setFilterDraft((prev) => ({ ...prev, customerType: type }))
            }
            statusFilter={filterDraft.status}
            onStatusFilterChange={(status: string) =>
              setFilterDraft((prev) => ({ ...prev, status }))
            }
            pagination={{
              page,
              perPage,
              total,
              onPageChange: (nextPage: number) => setPage(nextPage),
              onPerPageChange: (nextPerPage: number) => {
                setPerPage(nextPerPage);
                setPage(1);
              },
              perPageOptions: [...PAGINATION.PER_PAGE_OPTIONS],
            }}
          />
        </div>
      </div>
    </section>
  );
}
