"use client";

import * as React from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import type { DateRange } from "react-day-picker";
import {
  Eye,
  Edit,
  Trash2,
  PlusCircle,
  Building2,
  Phone,
  Mail,
  CalendarDays,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import CustomTable from "@/components/custom/custom-table";

export type CompanyRecord = {
  id: string;
  name: string;
  shortName?: string;
  email?: string;
  phone?: string;
  taxId?: string;
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

// Helper for status badge
function CompanyStatusBadge({ status }: { status?: string }) {
  const s = (status || "").toUpperCase();
  const map: Record<string, { label: string; className: string }> = {
    ACTIVE: {
      label: "ใช้งาน",
      className: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
    },
    INACTIVE: {
      label: "ไม่ได้ใช้งาน",
      className: "bg-slate-100 text-slate-800 ring-1 ring-slate-200",
    },
  };
  const info = map[s] ?? {
    label: s || "-",
    className: "bg-slate-100 text-slate-800 ring-1 ring-slate-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        info.className
      )}
    >
      {info.label}
    </span>
  );
}

// Toolbar Component
function CompaniesToolbar({
  canCreate,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  dateRange,
  onDateRangeChange,
}: Pick<
  CompaniesTableProps,
  | "canCreate"
  | "searchValue"
  | "onSearchChange"
  | "onSearchSubmit"
  | "dateRange"
  | "onDateRangeChange"
>) {
  return (
    <div className="rounded-md border bg-background/60 p-4 grid gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Search Input */}
        <div className="space-y-2">
          <label className="text-base font-medium mx-2">ค้นหา</label>
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearchSubmit?.()}
            placeholder="ชื่อบริษัท"
            className="mt-2 w-full"
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center lg:justify-end mt-4">
          {canCreate ? (
            <Link href="/companies/new">
              <Button className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700">
                <span className="inline-flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  สร้างบริษัทใหม่
                </span>
              </Button>
            </Link>
          ) : (
            <Button className="w-full lg:w-auto" variant="outline" disabled>
              <span className="inline-flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                สร้างบริษัทใหม่
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Cards Component (Mobile View)
function CompaniesCards({
  data,
  loading,
  canDelete,
  onDeleteRequest,
  pagination,
}: Pick<
  CompaniesTableProps,
  "data" | "loading" | "canDelete" | "onDeleteRequest" | "pagination"
>) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card
            key={`loading-${idx}`}
            className="h-full border border-slate-200/80 shadow-sm"
          >
            <div className="h-1 w-full bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100" />
            <div className="space-y-3 p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="border-dashed border-slate-200 bg-slate-50/80 p-6 text-center">
        <div className="mb-2 text-base font-semibold text-slate-900">
          ยังไม่มีบริษัทในหน้านี้
        </div>
        <p className="text-sm text-slate-600">
          ลองปรับการค้นหาหรือเพิ่มบริษัทใหม่
        </p>
      </Card>
    );
  }

  const {
    page,
    perPage,
    total,
    onPageChange,
    onPerPageChange,
    perPageOptions,
  } = pagination;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const startDisplay = (page - 1) * perPage + 1;
  const endDisplay = Math.min((page - 1) * perPage + data.length, total);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.map((company) => (
          <Card
            key={company.id}
            className="group relative overflow-hidden border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
            <div className="p-4 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="text-base font-semibold text-slate-900 line-clamp-1">
                      {company.name || "-"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {company.createdAt
                        ? thaiDateFormatter.format(new Date(company.createdAt))
                        : "-"}
                    </div>
                  </div>
                </div>
                <CompanyStatusBadge status={company.status} />
              </div>

              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="line-clamp-1">{company.email || "-"}</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="line-clamp-1">{company.phone || "-"}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="border-blue-100 text-blue-700 hover:bg-blue-50"
                >
                  <Link href={`/companies/${company.id}`}>
                    <Eye className="mr-2 h-4 w-4" /> ดู
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="border-purple-100 text-purple-700 hover:bg-purple-50"
                >
                  <Link href={`/companies/${company.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" /> แก้ไข
                  </Link>
                </Button>
                {canDelete && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="bg-red-50 text-red-700 hover:bg-red-100"
                    onClick={() => onDeleteRequest(company)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> ลบ
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white/80 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs font-medium text-slate-600">
          แสดง {startDisplay}-{endDisplay} จาก {total}
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          {perPageOptions && perPageOptions.length > 0 && (
            <Select
              value={String(perPage)}
              onValueChange={(v) => onPerPageChange(Number(v))}
            >
              <SelectTrigger className="h-9 w-[70px] text-sm">
                <SelectValue placeholder="ต่อหน้า" />
              </SelectTrigger>
              <SelectContent align="end">
                {perPageOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="inline-flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-slate-700"
              disabled={page <= 1}
              onClick={() => onPageChange(Math.max(1, page - 1))}
            >
              ก่อนหน้า
            </Button>
            <span className="text-xs text-slate-500">
              หน้า {page} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="text-slate-700"
              disabled={page >= totalPages}
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            >
              ถัดไป
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
        cell: ({ row }) => (
          <div className="font-medium">{row.original.name ?? "-"}</div>
        ),
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
        cell: ({ row }) => {
          return <CompanyStatusBadge status={row.original.status} />;
        },
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    size="icon-sm"
                    variant="outline"
                    className="text-blue-600 border-blue-100 hover:bg-blue-50 rounded-md"
                    aria-label="ดู"
                  >
                    <Link href={`/companies/${company.id}`}>
                      <Eye className="size-4 text-blue-600" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">ดู</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    size="icon-sm"
                    variant="outline"
                    className="text-purple-600 border-purple-100 hover:bg-purple-50 rounded-md"
                    aria-label="แก้ไข"
                  >
                    <Link href={`/companies/${company.id}/edit`}>
                      <Edit className="size-4 text-purple-600" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">แก้ไข</TooltipContent>
              </Tooltip>

              {canDelete && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon-sm"
                      className="bg-red-50 text-red-600 hover:bg-red-100 rounded-md"
                      onClick={() => onDeleteRequest(company)}
                      aria-label="ลบ"
                    >
                      <Trash2 className="size-4 text-red-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">ลบ</TooltipContent>
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

export function CompaniesTable(props: CompaniesTableProps) {
  const {
    data,
    loading,
    canCreate,
    canDelete,
    onDeleteRequest,
    searchValue,
    onSearchChange,
    onSearchSubmit,
    dateRange,
    onDateRangeChange,
    pagination,
  } = props;

  const columns = useCompanyColumns(onDeleteRequest, canDelete);

  const toolbarProps = {
    canCreate,
    searchValue,
    onSearchChange,
    onSearchSubmit,
    dateRange,
    onDateRangeChange,
  };

  return (
    <div className="space-y-6">
      {/* Mobile & Tablet: card layout */}
      <div className="xl:hidden space-y-4">
        <CompaniesToolbar {...toolbarProps} />
        <CompaniesCards
          data={data}
          loading={loading}
          canDelete={canDelete}
          onDeleteRequest={onDeleteRequest}
          pagination={pagination}
        />
      </div>

      {/* Desktop & up: table layout */}
      <div className="hidden xl:block">
        <CustomTable
          columns={columns}
          data={data}
          loading={loading}
          canCreate={canCreate}
          createHref="/companies/new"
          toolbar={<CompaniesToolbar {...toolbarProps} />}
          pagination={pagination}
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
      </div>
    </div>
  );
}
