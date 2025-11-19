"use client";

import * as React from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import type { DateRange } from "react-day-picker";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2 } from "lucide-react";
import Tooltip from "@/components/ui/tooltip";
import { DataTable } from "@/components/ui/data-table";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";

export type CompanyRecord = {
  id: string;
  name: string;
  shortName?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  industry?: string;
  status?: string;
  createdAt?: string;
};

export type CompaniesPagination = {
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  perPageOptions?: number[];
};

export interface CompaniesTableProps {
  data: CompanyRecord[];
  loading?: boolean;
  canCreate: boolean;
  canDelete: boolean;
  onDeleteRequest: (company: CompanyRecord) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  isTyping?: boolean;
  onSearchSubmit?: () => void;
  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange | undefined) => void;
  pagination: CompaniesPagination;
}

const thaiDateFormatter = new Intl.DateTimeFormat("th-TH", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function useCompanyColumns(
  onDeleteRequest: (company: CompanyRecord) => void,
  canDelete: boolean
) {
  return React.useMemo<ColumnDef<CompanyRecord>[]>(
    () => [
      {
        accessorKey: "name",
        header: "บริษัท",
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
          minWidth: 140,
          width: 140,
          maxWidth: 140,
          align: "center",
        },
        cell: ({ row }) =>
          row.original.status ? (
            <Badge variant="secondary" className="capitalize">
              {row.original.status}
            </Badge>
          ) : (
            "-"
          ),
      },
      {
        accessorKey: "createdAt",
        header: "สร้างเมื่อ",
        meta: {
          headerAlign: "center",
          minWidth: 120,
          width: 160,
          maxWidth: 220,
          align: "center",
        },
        cell: ({ row }) =>
          row.original.createdAt
            ? thaiDateFormatter.format(new Date(row.original.createdAt))
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
          const company = row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              <Tooltip content={`ดู ${company.name}`} side="top">
                <Button
                  asChild
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`ดู ${company.name}`}
                >
                  <Link href={`/companies/${company.id}`}>
                    <Eye className="size-4" />
                  </Link>
                </Button>
              </Tooltip>

              <Tooltip content={`แก้ไข ${company.name}`} side="top">
                <Button
                  asChild
                  size="icon-sm"
                  variant="outline"
                  aria-label={`แก้ไข ${company.name}`}
                >
                  <Link href={`/companies/${company.id}/edit`}>
                    <Edit className="size-4" />
                  </Link>
                </Button>
              </Tooltip>

              {canDelete && (
                <Tooltip content={`ลบ ${company.name}`} side="top">
                  <Button
                    variant="destructive"
                    size="icon-sm"
                    onClick={() => onDeleteRequest(company)}
                    aria-label={`ลบ ${company.name}`}
                  >
                    <Trash2 className="size-4" />
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

function CompaniesToolbar(
  props: Pick<
    CompaniesTableProps,
    | "canCreate"
    | "searchValue"
    | "onSearchChange"
    | "isTyping"
    | "onSearchSubmit"
    | "dateRange"
    | "onDateRangeChange"
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
  } = props;

  return (
    <div className="rounded-md border bg-background/60 p-4 grid gap-4 lg:grid-cols-3 lg:items-end">
      <div className="space-y-2 lg:col-span-1">
        <label className="text-sm font-medium mx-2">ค้นหาบริษัท</label>
        <Input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onSearchSubmit?.();
          }}
          placeholder="ค้นหาชื่อบริษัทหรือชื่อย่อ"
          className="h-11 w-full lg:w-[95%]"
        />
      </div>

      <div className="space-y-2 lg:col-span-1">
        <label className="text-sm font-medium mx-2">กรองตามวันที่</label>
        <DateRangePicker
          value={dateRange}
          onChange={onDateRangeChange}
          placeholder="เลือกช่วงวันที่"
          className="w-full lg:w-[80%]"
        />
      </div>

      <div className="flex items-end lg:justify-end lg:col-span-1 ">
        {canCreate ? (
          <Link href="/companies/new">
            <Button className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700">
              สร้างบริษัท
            </Button>
          </Link>
        ) : (
          <Button className="w-full lg:w-auto" variant="outline" disabled>
            สร้างบริษัท
          </Button>
        )}
      </div>
    </div>
  );
}

function CompaniesPagination({
  pagination,
  loading,
}: {
  pagination: CompaniesPagination;
  loading?: boolean;
}) {
  const totalPages = Math.max(
    1,
    Math.ceil(pagination.total / pagination.perPage)
  );
  const disableNav = loading || pagination.total === 0;

  return (
    <div className="flex flex-col gap-4 rounded-md border bg-background/60 px-4 py-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
      <span>
        {pagination.total > 0
          ? `แสดง ${(pagination.page - 1) * pagination.perPage + 1}-${Math.min(
              pagination.page * pagination.perPage,
              pagination.total
            )} จาก ${pagination.total} รายการ`
          : "ไม่มีข้อมูลให้แสดง"}
      </span>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        <label className="flex items-center gap-2 text-xs font-medium text-foreground">
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
          >
            ก่อนหน้า
          </Button>
          <span className="text-xs font-semibold text-foreground">
            หน้า {pagination.page} / {isFinite(totalPages) ? totalPages : 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              pagination.onPageChange(Math.min(totalPages, pagination.page + 1))
            }
            disabled={disableNav || pagination.page >= totalPages}
          >
            ถัดไป
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CompaniesTable(props: CompaniesTableProps) {
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
    pagination,
  } = props;

  const columns = useCompanyColumns(onDeleteRequest, canDelete);
  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      toolbar={
        <CompaniesToolbar
          canCreate={canCreate}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          dateRange={dateRange}
          onDateRangeChange={onDateRangeChange}
        />
      }
      footer={<CompaniesPagination pagination={pagination} loading={loading} />}
      emptyState={{
        title: "ยังไม่มีบริษัท",
        description: "ลองปรับเงื่อนไขการค้นหา หรือสร้างบริษัทใหม่",
        action: canCreate ? (
          <Link href="/companies/new">
            <Button size="sm">สร้างบริษัทใหม่</Button>
          </Link>
        ) : undefined,
      }}
      className="w-full"
    />
  );
}
