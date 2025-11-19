"use client";

import * as React from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import type { DateRange } from "react-day-picker";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
        cell: ({ row }) => {
          const company = row.original;
          return (
            <div>
              <div className="font-medium text-foreground">{company.name}</div>
              {company.shortName && (
                <div className="text-xs text-muted-foreground">
                  {company.shortName}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "industry",
        header: "อุตสาหกรรม",
        cell: ({ row }) => row.original.industry ?? "-",
      },
      {
        accessorKey: "email",
        header: "อีเมล",
        cell: ({ row }) => row.original.email ?? "-",
      },
      {
        accessorKey: "phone",
        header: "โทรศัพท์",
        cell: ({ row }) => row.original.phone ?? "-",
      },
      {
        accessorKey: "status",
        header: "สถานะ",
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
        cell: ({ row }) =>
          row.original.createdAt
            ? thaiDateFormatter.format(new Date(row.original.createdAt))
            : "-",
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const company = row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              <Link href={`/companies/${company.id}`}>
                <Button variant="outline" size="sm">
                  ดู
                </Button>
              </Link>
              <Link href={`/companies/${company.id}/edit`}>
                <Button size="sm">แก้ไข</Button>
              </Link>
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteRequest(company)}
                >
                  ลบ
                </Button>
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
    | "dateRange"
    | "onDateRangeChange"
  >
) {
  const {
    canCreate,
    searchValue,
    onSearchChange,
    dateRange,
    onDateRangeChange,
  } = props;

  return (
    <div className="flex flex-col gap-4 rounded-md border bg-background/60 p-4 lg:flex-row lg:items-end">
      <div className="flex-1 space-y-2">
        <label className="text-sm font-medium">ค้นหาบริษัท</label>
        <Input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="ค้นหาชื่อบริษัทหรือชื่อย่อ"
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <DateRangePicker
          value={dateRange}
          onChange={onDateRangeChange}
          placeholder="เลือกช่วงวันที่"
          className="w-full lg:w-[260px]"
        />
      </div>

      <div className="flex items-end">
        {canCreate ? (
          <Link href="/companies/new">
            <Button className="w-full lg:w-auto">สร้างบริษัท</Button>
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
