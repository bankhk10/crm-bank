"use client";

import * as React from "react";
import Link from "next/link";
import { Eye, Edit, PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import CustomTable from "@/components/custom/custom-table";
import { TableToolbar } from "@/components/custom/table-toolbar";
import { ResponsiveDataView } from "@/components/custom/responsive-data-view";
import { useCustomerColumns } from "./use-customer-columns";
import type { CustomersTableProps, CustomerRecord } from "../../types";
import { CustomersCards } from "./customers-cards";
import { CustomerTypeBadge } from "../../ui/customer-type-badge";
import { CustomerStatusBadge } from "../../ui/customer-status-badge";
import { ActionButton } from "@/components/custom/action-button";
import {
  ALL_FILTER_VALUE,
  ALL_STATUS_VALUE,
  CUSTOMER_TYPE_STYLE,
  STATUS_STYLE,
} from "../../constants";
import { usePermission } from "@/hooks/use-permission";
import { getCustomersAction, deleteCustomerAction } from "../../server/actions";
import { PAGINATION } from "@/lib/constants";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CustomersTable({
  initialData,
  initialTotal,
}: CustomersTableProps) {
  const { hasPermission, allowed, isLoading } = usePermission("menu.customers");
  const canCreateDealer = hasPermission("customer.create.dealer");
  const canCreateSubdealer = hasPermission("customer.create.subdealer");
  const canCreateFarmer = hasPermission("customer.create.farmer");
  const canCreateBroker = hasPermission("customer.create.broker");
  const canCreate = !isLoading && (
    canCreateDealer || canCreateSubdealer || canCreateFarmer || canCreateBroker
  );
  
  const canDelete = hasPermission("customer.delete.dealer") || 
                    hasPermission("customer.delete.subdealer") || 
                    hasPermission("customer.delete.farmer") || 
                    hasPermission("customer.delete.broker");
  
  const [data, setData] = React.useState<CustomerRecord[]>(initialData || []);
  const [total, setTotal] = React.useState<number>(initialTotal || 0);
  const [fetchLoading, setFetchLoading] = React.useState(false);
  const [page, setPage] = React.useState<number>(PAGINATION.DEFAULT_PAGE);
  const [perPage, setPerPage] = React.useState<number>(PAGINATION.DEFAULT_PER_PAGE);
  const [error, setError] = React.useState<string | null>(null);

  const [filterDraft, setFilterDraft] = React.useState<{
    query: string;
    customerType?: string;
    status?: string;
  }>({ query: "", customerType: "", status: "" });
  
  const [appliedFilters, setAppliedFilters] = React.useState<{
    query: string;
    customerType?: string;
    status?: string;
  }>({ query: "", customerType: "", status: "" });

  const [deleteTarget, setDeleteTarget] = React.useState<CustomerRecord | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);

  React.useEffect(() => {
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

  const initialRender = React.useRef(true);

  React.useEffect(() => {
    // skip initial fetch if we already have initialData and it is the first render
    if (initialRender.current) {
        initialRender.current = false;
        if (initialData && data.length > 0) return;
    }

    let mounted = true;
    const controller = new AbortController();
    (async () => {
      setFetchLoading(true);
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

        const res = await getCustomersAction(params);
        if (mounted) {
          const parsedCustomers = (res.customers ?? []).map((c: any) => ({
            ...c,
            email: c.email === null ? undefined : c.email,
            phone: c.phone === null ? undefined : c.phone,
            status: c.status === null ? undefined : c.status,
          }));
          setData(parsedCustomers as any[]);
          setTotal(typeof res.total === "number" ? res.total : 0);
        }
      } catch (error) {
        const err = error as Error;
        if (err.name === "AbortError") return;
        setError(err.message || String(err));
      } finally {
        if (mounted) setFetchLoading(false);
      }
    })();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [page, perPage, appliedFilters, initialData, data.length]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      const res = await deleteCustomerAction(deleteTarget.id);
      if (!res.success) throw new Error(res.error || "Delete failed");
      
      setData((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setTotal(prev => prev > 0 ? prev - 1 : 0);
      setDeleteTarget(null);
    } catch (err) {
      const error = err as Error;
      setError(error.message || String(error));
    } finally {
      setActionLoading(false);
    }
  };

  const columns = useCustomerColumns((emp) => setDeleteTarget(emp as CustomerRecord), canDelete, data);

  const customerTypes = Object.keys(CUSTOMER_TYPE_STYLE) as Array<
    keyof typeof CUSTOMER_TYPE_STYLE
  >;

  const typePermissions: Record<string, boolean> = {
    DEALER: canCreateDealer ?? false,
    SUBDEALER: canCreateSubdealer ?? false,
    FARMER: canCreateFarmer ?? false,
    BROKER: canCreateBroker ?? false,
  };

  const allowedTypes = customerTypes.filter((type) => typePermissions[type]);

  const paginationInfo = {
    page,
    perPage,
    total,
    onPageChange: (nextPage: number) => setPage(nextPage),
    onPerPageChange: (nextPerPage: number) => {
      setPerPage(nextPerPage);
      setPage(1);
    },
    perPageOptions: [...PAGINATION.PER_PAGE_OPTIONS],
  };

  if (isLoading) {
      return <div className="p-8 text-center text-slate-500">กรุณารอสักครู่...</div>;
  }

  if (!allowed) {
      return (
          <div className="p-8 text-center">
              <div className="text-red-600 font-semibold text-lg">
                  คุณไม่มีสิทธิ์เข้าถึงหน้านี้
              </div>
          </div>
      );
  }

  const toolbar = (
    <div className="space-y-4 mb-6">
      <TableToolbar
        searchPlaceholder="รหัสลูกค้า, ชื่อ, อีเมล, โทรศัพท์"
        searchValue={filterDraft.query}
        onSearchChange={(val) => setFilterDraft(prev => ({ ...prev, query: val }))}
        onSearchSubmit={handleSearchSubmit}
        actionPosition="bottom"
        filters={
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <label className="text-base font-medium leading-none mx-1">ประเภท</label>
              <div className="mt-1">
                <Select
                  value={filterDraft.customerType || ALL_FILTER_VALUE}
                  onValueChange={(v) =>
                    setFilterDraft((prev) => ({ ...prev, customerType: v === ALL_FILTER_VALUE ? "" : v }))
                  }
                >
                  <SelectTrigger className="text-base w-full bg-white">
                    <SelectValue placeholder="ประเภท" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_FILTER_VALUE}>ทุกประเภท</SelectItem>
                    {customerTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                         {CUSTOMER_TYPE_STYLE[type]?.label || type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-base font-medium leading-none mx-1">สถานะ</label>
              <div className="mt-1">
                <Select
                  value={filterDraft.status || ALL_STATUS_VALUE}
                  onValueChange={(v) =>
                    setFilterDraft((prev) => ({ ...prev, status: v === ALL_STATUS_VALUE ? "" : v }))
                  }
                >
                  <SelectTrigger className="text-base w-full bg-white">
                    <SelectValue placeholder="สถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_STATUS_VALUE}>ทุกสถานะ</SelectItem>
                    {Object.entries(STATUS_STYLE).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        }
      />
      <div className="flex flex-wrap gap-2 items-center justify-end w-full">
        {canCreate && allowedTypes.length > 0 ? (
          <>
            {allowedTypes.map((type) => (
              <Link key={type} href={`/customers/new?type=${type}`} className="w-full sm:w-auto">
                <Button className={`${CUSTOMER_TYPE_STYLE[type]?.buttonColor || ""} w-full sm:w-auto`}>
                  <span className="inline-flex items-center gap-2 font-medium">
                    <PlusCircle className="h-5 w-5" />
                    เพิ่ม{CUSTOMER_TYPE_STYLE[type]?.label || type}
                  </span>
                </Button>
              </Link>
            ))}
          </>
        ) : (
          <Button className="w-full sm:w-auto" variant="outline" disabled>
            <span className="inline-flex items-center gap-2 font-medium">
              <PlusCircle className="h-5 w-5" />
              สร้างลูกค้า
            </span>
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <ResponsiveDataView
        breakpoint="lg"
        toolbar={toolbar}
        cards={
          <div className="space-y-4">
            <CustomersCards
              data={data}
              loading={fetchLoading}
              canDelete={canDelete}
              onDeleteRequest={(c) => setDeleteTarget(c as CustomerRecord)}
            />
            {!fetchLoading && paginationInfo.total > 0 && (
              <div className="mt-4 flex justify-center">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => paginationInfo.onPageChange(paginationInfo.page - 1)}
                    disabled={paginationInfo.page <= 1}
                  >
                    ก่อนหน้า
                  </Button>
                  <span className="text-sm">
                    หน้า {paginationInfo.page} /{" "}
                    {Math.max(1, Math.ceil(paginationInfo.total / paginationInfo.perPage))}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => paginationInfo.onPageChange(paginationInfo.page + 1)}
                    disabled={
                      paginationInfo.page >=
                      Math.ceil(paginationInfo.total / paginationInfo.perPage)
                    }
                  >
                    ถัดไป
                  </Button>
                </div>
              </div>
            )}
          </div>
        }
        table={
          <div className="relative rounded-lg border shadow-sm bg-white overflow-hidden">
            <CustomTable
              columns={columns}
              data={data}
              loading={fetchLoading}
              pagination={paginationInfo}
              toolbar={<></>}
              renderSubComponent={({ row }) => {
                const customer = row.original;
                const subDealers = (customer as any).subDealers || [];

                if (!subDealers || subDealers.length === 0) {
                  return (
                    <div className="px-8 py-4 text-sm text-gray-500 bg-gray-50/50 border-t italic">
                      — ไม่มีข้อมูลร้านค้าลูกภายใต้ร้านนี้ —
                    </div>
                  );
                }

                return (
                  <div className="bg-gray-50/50 border-t">
                    <div className="px-8 py-2 bg-gray-100/80 border-b flex items-center text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      <div className="flex-1 px-2">ชื่อร้านค้า</div>
                      <div className="w-32 px-2 text-center">รหัสลูกค้า</div>
                      <div className="w-40 px-2 text-center">เบอร์โทรศัพท์</div>
                      <div className="w-32 px-2 text-center">ประเภท</div>
                      <div className="w-32 px-2 text-center">สถานะ</div>
                      <div className="w-24 px-2 text-right">จัดการ</div>
                    </div>

                    <div className="divide-y divide-gray-200">
                      {subDealers.map((subDealer: any) => (
                        <div
                          key={subDealer.id}
                          className="px-8 py-3 flex items-center hover:bg-white transition-colors group"
                        >
                          <div className="flex-1 px-2 flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 group-hover:scale-125 transition-transform" />
                            <div className="text-sm font-semibold text-gray-900 truncate">
                              {subDealer.name}
                            </div>
                          </div>

                          <div className="w-32 px-2 text-center">
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 border border-gray-200">
                              {subDealer.customerCode}
                            </span>
                          </div>

                          <div className="w-40 px-2 text-center text-sm text-gray-600">
                            {subDealer.phone || "-"}
                          </div>

                          <div className="w-32 px-2 flex justify-center">
                            <CustomerTypeBadge type={subDealer.customerType} />
                          </div>

                          <div className="w-32 px-2 flex justify-center">
                            <CustomerStatusBadge
                              status={subDealer.status}
                              className="text-[11px] px-2 py-0.5"
                            />
                          </div>

                          <div className="w-24 px-2 flex justify-end items-center gap-1">
                            <ActionButton
                              href={`/customers/${subDealer.id}`}
                              icon={Eye}
                              label="ดู"
                              colorClass="text-gray-400 text-blue-600 bg-blue-50 border-transparent shadow-none p-1.5"
                            />
                            <ActionButton
                              href={`/customers/${subDealer.id}/edit`}
                              icon={Edit}
                              label="แก้ไข"
                              colorClass="text-gray-400 text-purple-600 bg-purple-50 border-transparent shadow-none p-1.5"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }}
              getRowCanExpand={(row) => {
                const customer = row.original;
                const hasChildren =
                  data && data.some((d) => d.parentDealerId === customer.id);
                return hasChildren && customer.customerType === "DEALER";
              }}
            />
          </div>
        }
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-[420px] rounded-lg border-0 shadow-2xl">
          <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
            <Trash2 className="h-5 w-5" /> ยืนยันการลบ
          </DialogTitle>
          <DialogDescription className="text-base text-slate-600 mt-2">
            คุณต้องการลบลูกค้า <b>{deleteTarget?.name}</b> ใช่หรือไม่? <br />
            การกระทำนี้ไม่สามารถย้อนกลับได้
          </DialogDescription>
          <DialogFooter className="mt-6 gap-2 sm:gap-0 flex justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="rounded-full"
            >
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading}
              className="rounded-full bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? "กำลังลบ..." : "ลบลูกค้า"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { ParentDealerInfo } from "../detail-view/parent-dealer-info";
