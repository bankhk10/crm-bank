"use client";

import * as React from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, ChevronLeft, ChevronRight, PlusCircle } from "lucide-react";
import Tooltip from "@/components/ui/tooltip";
import CustomTable from "@/components/custom/custom-table";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export type CustomerRecord = {
  id: string;
  customerCode: string;
  customerType: "DEALER" | "SUBDEALER" | "FARMER" | "BROKER";
  name: string;
  email?: string;
  phone?: string;
  status?: string;
  createdAt?: string;
};

export type CustomersPagination = {
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  perPageOptions?: number[];
};

export interface CustomersTableProps {
  data: CustomerRecord[];
  loading?: boolean;
  canCreate: boolean;
  canDelete: boolean;
  onDeleteRequest: (customer: CustomerRecord) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  isTyping?: boolean;
  onSearchSubmit?: () => void;
  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange | undefined) => void;
  customerTypeFilter?: string;
  onCustomerTypeFilterChange?: (type: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  pagination: CustomersPagination;
}

const thaiDateFormatter = new Intl.DateTimeFormat("th-TH", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const customerTypeMap: Record<string, string> = {
  DEALER: "ตัวแทนจำหน่าย",
  SUBDEALER: "ตัวแทนจำหน่ายย่อย",
  FARMER: "เกษตรกร",
  BROKER: "นายหน้า",
};

function useCustomerColumns(
  onDeleteRequest: (customer: CustomerRecord) => void,
  canDelete: boolean
) {
  return React.useMemo<ColumnDef<CustomerRecord>[]>(
    () => [
      {
        accessorKey: "customerCode",
        header: "รหัสลูกค้า",
        meta: {
          headerAlign: "left",
          minWidth: 120,
          width: 150,
          maxWidth: 180,
          align: "left",
        },
        cell: ({ row }) => row.original.customerCode ?? "-",
      },
      {
        accessorKey: "name",
        header: "ชื่อลูกค้า",
        meta: {
          headerAlign: "left",
          minWidth: 180,
          width: 250,
          maxWidth: 400,
          align: "left",
        },
        cell: ({ row }) => row.original.name ?? "-",
      },
      {
        accessorKey: "customerType",
        header: "ประเภท",
        meta: {
          headerAlign: "center",
          minWidth: 140,
          width: 160,
          maxWidth: 200,
          align: "center",
        },
        cell: ({ row }) => {
          const type = row.original.customerType;
          return customerTypeMap[type] || type || "-";
        },
      },
      {
        accessorKey: "email",
        header: "อีเมล",
        meta: {
          headerAlign: "left",
          minWidth: 160,
          width: 220,
          maxWidth: 320,
          align: "left",
        },
        cell: ({ row }) => row.original.email ?? "-",
      },
      {
        accessorKey: "phone",
        header: "โทรศัพท์",
        meta: {
          headerAlign: "left",
          minWidth: 120,
          width: 140,
          maxWidth: 180,
          align: "left",
        },
        cell: ({ row }) => row.original.phone ?? "-",
      },
      {
        accessorKey: "status",
        header: "สถานะ",
        meta: {
          headerAlign: "center",
          minWidth: 120,
          width: 120,
          maxWidth: 120,
          align: "center",
        },
        cell: ({ row }) => {
          const s = (row.original.status || "").toString().toUpperCase();
          const map: Record<string, { label: string; className: string }> = {
            ACTIVE: {
              label: "ใช้งาน",
              className: "bg-emerald-100 text-emerald-800",
            },
            INACTIVE: {
              label: "ไม่ได้ใช้งาน",
              className: "bg-gray-100 text-gray-800",
            },
            SUSPENDED: {
              label: "ระงับ",
              className: "bg-orange-100 text-orange-800",
            },
          };
          const info = map[s] ?? {
            label: s || "-",
            className: "bg-gray-100 text-gray-800",
          };

          if (!s) return "-";

          return (
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${info.className}`}
            >
              {info.label}
            </span>
          );
        },
      },
      
      {
        id: "actions",
        header: "",
        meta: {
          headerAlign: "right",
          minWidth: 120,
          width: 140,
          maxWidth: 180,
          align: "right",
        },
        cell: ({ row }) => {
          const customer = row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              <Tooltip content={`ดู ${customer.name}`} side="top">
                <Button
                  asChild
                  size="icon-sm"
                  variant="outline"
                  className="text-blue-600 border-blue-100 hover:bg-blue-50 rounded-md"
                  aria-label={`ดู ${customer.name}`}
                >
                  <Link href={`/customers/${customer.id}`}>
                    <Eye className="size-4 text-blue-600" />
                  </Link>
                </Button>
              </Tooltip>

              <Tooltip content={`แก้ไข ${customer.name}`} side="top">
                <Button
                  asChild
                  size="icon-sm"
                  variant="outline"
                  className="text-purple-600 border-purple-100 hover:bg-purple-50 rounded-md"
                  aria-label={`แก้ไข ${customer.name}`}
                >
                  <Link href={`/customers/${customer.id}/edit`}>
                    <Edit className="size-4 text-purple-600" />
                  </Link>
                </Button>
              </Tooltip>

              {canDelete && (
                <Tooltip content={`ลบ ${customer.name}`} side="top">
                  <Button
                    variant="destructive"
                    size="icon-sm"
                    className="bg-red-50 text-red-600 hover:bg-red-100 rounded-md"
                    onClick={() => onDeleteRequest(customer)}
                    aria-label={`ลบ ${customer.name}`}
                  >
                    <Trash2 className="size-4 text-red-600" />
                  </Button>
                </Tooltip>
              )}
            </div>
          );
        },
      },
    ],
    [canDelete, onDeleteRequest]
  );
}

function CustomersToolbar(
  props: Pick<
    CustomersTableProps,
    | "canCreate"
    | "searchValue"
    | "onSearchChange"
    | "isTyping"
    | "onSearchSubmit"
    | "dateRange"
    | "onDateRangeChange"
    | "customerTypeFilter"
    | "onCustomerTypeFilterChange"
    | "statusFilter"
    | "onStatusFilterChange"
  >
) {
  const {
    canCreate,
    searchValue,
    onSearchChange,
    isTyping,
    onSearchSubmit,
    dateRange,
    onDateRangeChange,
    customerTypeFilter,
    onCustomerTypeFilterChange,
    statusFilter,
    onStatusFilterChange,
  } = props;

  return (
    <div className="rounded-md border bg-background/60 p-4 grid gap-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium mx-2">ค้นหาลูกค้า</label>
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSearchSubmit?.();
            }}
            placeholder="ค้นหารหัส, ชื่อ, อีเมล, โทรศัพท์"
            className="h-11 w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium mx-2">ประเภทลูกค้า</label>
          <select
            value={customerTypeFilter || ""}
            onChange={(e) => onCustomerTypeFilterChange?.(e.target.value)}
            className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">ทั้งหมด</option>
            <option value="DEALER">ตัวแทนจำหน่าย</option>
            <option value="SUBDEALER">ตัวแทนจำหน่ายย่อย</option>
            <option value="FARMER">เกษตรกร</option>
            <option value="BROKER">นายหน้า</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium mx-2">สถานะ</label>
          <select
            value={statusFilter || ""}
            onChange={(e) => onStatusFilterChange?.(e.target.value)}
            className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">ทั้งหมด</option>
            <option value="ACTIVE">ใช้งาน</option>
            <option value="INACTIVE">ไม่ได้ใช้งาน</option>
            <option value="SUSPENDED">ระงับ</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 lg:items-end">
        <div className="space-y-2 lg:col-span-2">
          <label className="text-sm font-medium mx-2">กรองตามวันที่</label>
          <DateRangePicker
            value={dateRange}
            onChange={onDateRangeChange}
            placeholder="เลือกช่วงวันที่"
            className="w-full lg:w-[300px] block"
          />
        </div>

        <div className="flex items-end lg:justify-end">
          {canCreate ? (
            <Link href="/customers/new">
              <Button className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700">
                <span className="inline-flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  สร้างลูกค้า
                </span>
              </Button>
            </Link>
          ) : (
            <Button className="w-full lg:w-auto" variant="outline" disabled>
              <span className="inline-flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                สร้างลูกค้า
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function CustomersPagination({

  
  pagination,
  loading,
}: {
  pagination: CustomersPagination;
  loading?: boolean;
}) {
  const totalPages = Math.max(
    1,
    Math.ceil(pagination.total / pagination.perPage)
  );
  const disableNav = loading || pagination.total === 0;

  return (
    <div className="flex flex-col gap-4 rounded-md border bg-background/60 px-4 mt-4 py-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
      <span>
        {pagination.total > 0
          ? `แสดง ${(pagination.page - 1) * pagination.perPage + 1}-${Math.min(
              pagination.page * pagination.perPage,
              pagination.total
            )} จาก ${pagination.total} รายการ`
          : "ไม่มีข้อมูลให้แสดง"}
      </span>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          ต่อหน้า
          <Select
            value={String(pagination.perPage)}
            onValueChange={(value) =>
              pagination.onPerPageChange(Number(value))
            }
          >
            <SelectTrigger size="sm" className="ml-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {(pagination.perPageOptions ?? [6, 12, 24, 48]).map(
                (option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </label>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              pagination.onPageChange(Math.max(1, pagination.page - 1))
            }
            disabled={disableNav || pagination.page <= 1}
            aria-label="ก่อนหน้า"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            หน้า {pagination.page} / {isFinite(totalPages) ? totalPages : 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              pagination.onPageChange(Math.min(totalPages, pagination.page + 1))
            }
            disabled={disableNav || pagination.page >= totalPages}
            aria-label="ถัดไป"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CustomersTable(props: CustomersTableProps) {
  const {
    data,
    loading,
    canCreate,
    canDelete,
    onDeleteRequest,
    searchValue,
    onSearchChange,
    dateRange,
    onDateRangeChange,
    customerTypeFilter,
    onCustomerTypeFilterChange,
    statusFilter,
    onStatusFilterChange,
    pagination,
  } = props;

  const columns = useCustomerColumns(onDeleteRequest, canDelete);
  return (
    <CustomTable
      columns={columns}
      data={data}
      loading={loading}
      toolbar={
        <CustomersToolbar
          canCreate={canCreate}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          dateRange={dateRange}
          onDateRangeChange={onDateRangeChange}
          customerTypeFilter={customerTypeFilter}
          onCustomerTypeFilterChange={onCustomerTypeFilterChange}
          statusFilter={statusFilter}
          onStatusFilterChange={onStatusFilterChange}
        />
      }
      footer={<CustomersPagination pagination={pagination} loading={loading} />}
      emptyState={{
        title: "ยังไม่มีลูกค้า",
        description: "ลองปรับเงื่อนไขการค้นหา หรือสร้างลูกค้าใหม่",
        action: canCreate ? (
          <Link href="/customers/new">
            <Button size="sm">สร้างลูกค้าใหม่</Button>
          </Link>
        ) : undefined,
      }}
      className="w-full"
    />
  );
}
