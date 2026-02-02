"use client";

import React, { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  CustomersTable,
  type CustomerRecord,
} from "@/features/customers";
import { UserCog } from "lucide-react";

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
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(12);
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
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("perPage", String(perPage));
        if (appliedFilters.query.trim())
          params.set("q", appliedFilters.query.trim());
        if (appliedFilters.customerType)
          params.set("type", appliedFilters.customerType);
        if (appliedFilters.status) params.set("status", appliedFilters.status);
        if (appliedFilters.dateRange?.from)
          params.set("from", appliedFilters.dateRange.from.toISOString());
        if (appliedFilters.dateRange?.to)
          params.set("to", appliedFilters.dateRange.to.toISOString());

        const res = await fetch(`/api/customers?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to load customers");
        const json = await res.json();
        if (mounted) {
          setCustomers(json.customers ?? []);
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
                    const res = await fetch(
                      `/api/customers/${deleteCandidate.id}`,
                      { method: "DELETE" }
                    );
                    if (!res.ok) throw new Error("Delete failed");
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
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-3">
              <UserCog className="w-9 h-9 text-blue-600" />

              <h1 className="text-3xl font-bold tracking-tight">
                ข้อมูลลูกค้า
              </h1>
            </div>
          </div>

          <CustomersTable
            data={customers}
            loading={loading}
            canCreate={canCreate}
            canCreateDealer={canCreateDealer}
            canCreateSubdealer={canCreateSubdealer}
            canCreateFarmer={canCreateFarmer}
            canCreateBroker={canCreateBroker}
            canDelete={hasPermission("customer.delete")}
            onDeleteRequest={setDeleteCandidate}
            searchValue={filterDraft.query}
            onSearchChange={(value) =>
              setFilterDraft((prev) => ({ ...prev, query: value }))
            }
            onSearchSubmit={handleSearchSubmit}
            customerTypeFilter={filterDraft.customerType}
            onCustomerTypeFilterChange={(type) =>
              setFilterDraft((prev) => ({ ...prev, customerType: type }))
            }
            statusFilter={filterDraft.status}
            onStatusFilterChange={(status) =>
              setFilterDraft((prev) => ({ ...prev, status }))
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
              perPageOptions: [6, 12, 24, 48],
            }}
          />
        </div>
      </div>
    </section>
  );
}
