"use client";

import * as React from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, ChevronLeft, ChevronRight, PlusCircle } from "lucide-react";
import Tooltip from "@/components/ui/tooltip";
import { DataTable } from "@/components/ui/data-table";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";

export type CreditLimitRecord = {
  id: string;
  customerId: string;
  customer?: {
    name: string;
    customerCode: string;
  };
  limitAmount: number;
  promoAmount?: number;
  usedAmount: number;
  availableAmount: number;
  status: string;
  effectiveDate: string;
  expiryDate?: string;
  createdAt?: string;
};

export type CreditLimitsPagination = {
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  perPageOptions?: number[];
};

export interface CreditLimitsTableProps {
  data: CreditLimitRecord[];
  loading?: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onDeleteRequest: (creditLimit: CreditLimitRecord) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  isTyping?: boolean;
  onSearchSubmit?: () => void;
  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange | undefined) => void;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  pagination: CreditLimitsPagination;
}

const thaiDateFormatter = new Intl.DateTimeFormat("th-TH", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const currencyFormatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
});

function useCreditLimitColumns(
  onDeleteRequest: (creditLimit: CreditLimitRecord) => void,
  canEdit: boolean,
  canDelete: boolean
) {
  return React.useMemo<ColumnDef<CreditLimitRecord>[]>(
    () => [
      {
        accessorKey: "customer.customerCode",
        header: "รหัสลูกค้า",
        meta: {
          headerAlign: "left",
          minWidth: 120,
          width: 140,
          maxWidth: 160,
          align: "left",
        },
        cell: ({ row }) => row.original.customer?.customerCode ?? "-",
      },
      {
        accessorKey: "customer.name",
        header: "ชื่อลูกค้า",
        meta: {
          headerAlign: "left",
          minWidth: 180,
          width: 220,
          maxWidth: 300,
          align: "left",
        },
        cell: ({ row }) => row.original.customer?.name ?? "-",
      },
      {
        accessorKey: "limitAmount",
        header: "วงเงิน",
        meta: {
          headerAlign: "right",
          minWidth: 120,
          width: 150,
          maxWidth: 200,
          align: "right",
        },
        cell: ({ row }) => currencyFormatter.format(row.original.limitAmount),
      },
      {
        accessorKey: "promoAmount",
        header: "วงเงินส่งเสริมกิจกรรม",
        meta: {
          headerAlign: "right",
          minWidth: 140,
          width: 170,
          maxWidth: 200,
          align: "right",
        },
        cell: ({ row }) =>
          row.original.promoAmount !== undefined && row.original.promoAmount !== null
            ? currencyFormatter.format(Number(row.original.promoAmount))
            : "-",
      },
      {
        accessorKey: "usedAmount",
        header: "ใช้ไป",
        meta: {
          headerAlign: "right",
          minWidth: 120,
          width: 150,
          maxWidth: 200,
          align: "right",
        },
        cell: ({ row }) => currencyFormatter.format(row.original.usedAmount),
      },
      {
        accessorKey: "availableAmount",
        header: "คงเหลือ",
        meta: {
          headerAlign: "right",
          minWidth: 120,
          width: 150,
          maxWidth: 200,
          align: "right",
        },
        cell: ({ row }) => currencyFormatter.format(row.original.availableAmount),
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
            SUSPENDED: {
              label: "ระงับ",
              className: "bg-orange-100 text-orange-800",
            },
            EXPIRED: {
              label: "หมดอายุ",
              className: "bg-gray-100 text-gray-800",
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
        accessorKey: "effectiveDate",
        header: "วันที่เริ่ม",
        meta: {
          headerAlign: "center",
          minWidth: 120,
          width: 140,
          maxWidth: 180,
          align: "center",
        },
        cell: ({ row }) =>
          row.original.effectiveDate
            ? thaiDateFormatter.format(new Date(row.original.effectiveDate))
            : "-",
      },
      {
        accessorKey: "expiryDate",
        header: "วันหมดอายุ",
        meta: {
          headerAlign: "center",
          minWidth: 120,
          width: 140,
          maxWidth: 180,
          align: "center",
        },
        cell: ({ row }) =>
          row.original.expiryDate
            ? thaiDateFormatter.format(new Date(row.original.expiryDate))
            : "-",
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
          const creditLimit = row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              <Tooltip content="ดูรายละเอียด" side="top">
                <Button
                  asChild
                  size="icon-sm"
                  variant="outline"
                  className="text-blue-600 border-blue-100 hover:bg-blue-50 rounded-md"
                  aria-label="ดูรายละเอียด"
                >
                  <Link href={`/credit-limits/${creditLimit.id}`}>
                    <Eye className="size-4 text-blue-600" />
                  </Link>
                </Button>
              </Tooltip>

              {canEdit && (
                <Tooltip content="แก้ไข" side="top">
                  <Button
                    asChild
                    size="icon-sm"
                    variant="outline"
                    className="text-purple-600 border-purple-100 hover:bg-purple-50 rounded-md"
                    aria-label="แก้ไข"
                  >
                    <Link href={`/credit-limits/${creditLimit.id}/edit`}>
                      <Edit className="size-4 text-purple-600" />
                    </Link>
                  </Button>
                </Tooltip>
              )}

              {canDelete && (
                <Tooltip content="ลบ" side="top">
                  <Button
                    variant="destructive"
                    size="icon-sm"
                    className="bg-red-50 text-red-600 hover:bg-red-100 rounded-md"
                    onClick={() => onDeleteRequest(creditLimit)}
                    aria-label="ลบ"
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
    [canEdit, canDelete, onDeleteRequest]
  );
}

function CreditLimitsToolbar(
  props: Pick<
    CreditLimitsTableProps,
    | "canCreate"
    | "searchValue"
    | "onSearchChange"
    | "isTyping"
    | "onSearchSubmit"
    | "dateRange"
    | "onDateRangeChange"
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
    statusFilter,
    onStatusFilterChange,
  } = props;

  return (
    <div className="rounded-md border bg-background/60 p-4 grid gap-4 lg:grid-cols-3 lg:items-end">
      <div className="space-y-2 lg:col-span-1">
        <label className="text-sm font-medium mx-2">ค้นหา</label>
        <Input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onSearchSubmit?.();
          }}
          placeholder="ค้นหารหัสหรือชื่อลูกค้า"
          className="h-11 w-full lg:w-[95%]"
        />
      </div>

      <div className="space-y-2 lg:col-span-1">
        <label className="text-sm font-medium mx-2">สถานะ</label>
        <select
          value={statusFilter || ""}
          onChange={(e) => onStatusFilterChange?.(e.target.value)}
          className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">ทั้งหมด</option>
          <option value="ACTIVE">ใช้งาน</option>
          <option value="SUSPENDED">ระงับ</option>
          <option value="EXPIRED">หมดอายุ</option>
        </select>
      </div>

      <div className="flex items-end lg:justify-end lg:col-span-1">
        {canCreate ? (
          <Link href="/credit-limits/new">
            <Button className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700">
              <span className="inline-flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                สร้างวงเงิน
              </span>
            </Button>
          </Link>
        ) : (
          <Button className="w-full lg:w-auto" variant="outline" disabled>
            <span className="inline-flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              สร้างวงเงิน
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}

function CreditLimitsPagination({
  pagination,
  loading,
}: {
  pagination: CreditLimitsPagination;
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
          <select
            className="rounded-md border bg-background px-3 py-1 text-sm"
            value={pagination.perPage}
            onChange={(event) =>
              pagination.onPerPageChange(Number(event.target.value))
            }
          >
            {(pagination.perPageOptions ?? [6, 12, 24, 48]).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
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

export function CreditLimitsTable(props: CreditLimitsTableProps) {
  const {
    data,
    loading,
    canCreate,
    canEdit,
    canDelete,
    onDeleteRequest,
    searchValue,
    onSearchChange,
    dateRange,
    onDateRangeChange,
    statusFilter,
    onStatusFilterChange,
    pagination,
  } = props;

  const columns = useCreditLimitColumns(onDeleteRequest, canEdit, canDelete);
  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      toolbar={
        <CreditLimitsToolbar
          canCreate={canCreate}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          dateRange={dateRange}
          onDateRangeChange={onDateRangeChange}
          statusFilter={statusFilter}
          onStatusFilterChange={onStatusFilterChange}
        />
      }
      footer={<CreditLimitsPagination pagination={pagination} loading={loading} />}
      emptyState={{
        title: "ยังไม่มีวงเงิน",
        description: "ลองปรับเงื่อนไขการค้นหา หรือสร้างวงเงินใหม่",
        action: canCreate ? (
          <Link href="/credit-limits/new">
            <Button size="sm">สร้างวงเงินใหม่</Button>
          </Link>
        ) : undefined,
      }}
      className="w-full"
    />
  );
}
