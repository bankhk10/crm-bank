"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { ColumnDef } from "@tanstack/react-table";
import {
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  PlusCircle,
  Calendar as CalendarIcon,
  Search,
} from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CustomTable from "@/components/custom/custom-table";

import type {
  TemporaryCreditLimitWithRelations,
  TemporaryCreditStatus,
} from "@/types/temporary-credit-limit";

export interface TemporaryCreditLimitTableProps {
  data: TemporaryCreditLimitWithRelations[];
  loading?: boolean;
  pagination?: {
    page: number;
    perPage: number;
    total: number;
    onPageChange: (p: number) => void;
    onPerPageChange: (n: number) => void;
    perPageOptions?: number[];
  };
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  isTyping?: boolean;
  onSearchSubmit?: () => void;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canApprove?: boolean;
  onDelete?: (id: string) => void;
}

// --- Constants & Styles ---

const statusStyle: Record<
  TemporaryCreditStatus,
  { label: string; className: string; dot: string }
> = {
  PENDING: {
    label: "รออนุมัติ",
    className:
      "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-50",
    dot: "bg-yellow-500",
  },
  APPROVED: {
    label: "อนุมัติแล้ว",
    className:
      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-50",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    label: "ไม่อนุมัติ",
    className:
      "bg-red-50 text-red-700 ring-1 ring-red-100 dark:bg-red-900/30 dark:text-red-50",
    dot: "bg-red-500",
  },
  EXPIRED: {
    label: "หมดอายุ",
    className:
      "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900/40 dark:text-slate-100",
    dot: "bg-slate-400",
  },
};

const DEFAULT_BADGE_STYLE = {
  label: "ไม่ระบุ",
  className:
    "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900/40 dark:text-slate-100",
  dot: "bg-slate-400",
};

// --- Helper Components ---

function StatusBadge({ status, className }: { status?: string; className?: string }) {
  const key = (status || "").toUpperCase() as TemporaryCreditStatus;
  const info = statusStyle[key] ?? {
    ...DEFAULT_BADGE_STYLE,
    label: key || "ไม่ระบุ",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
        info.className,
        className
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", info.dot)} aria-hidden="true" />
      {info.label}
    </span>
  );
}

function ActionButton({
  href,
  icon: Icon,
  label,
  colorClass,
  onClick,
}: {
  href?: string;
  icon: React.ElementType;
  label: string;
  colorClass: string;
  onClick?: () => void;
}) {
  const button = (
    <Button
      asChild={!!href}
      size="icon-sm"
      variant={onClick ? "destructive" : "outline"}
      className={colorClass}
      onClick={onClick}
      aria-label={label}
    >
      {href ? (
        <Link href={href}>
          <Icon className="size-4" />
        </Link>
      ) : (
        <Icon className="size-4" />
      )}
    </Button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

// --- Toolbar ---

function TemporaryCreditLimitToolbar({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  dateRange,
  onDateRangeChange,
  canCreate,
}: Pick<
  TemporaryCreditLimitTableProps,
  | "searchValue"
  | "onSearchChange"
  | "onSearchSubmit"
  | "dateRange"
  | "onDateRangeChange"
  | "canCreate"
>) {
  return (
    <div className="rounded-md border bg-background/60 p-4 grid gap-4">
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Search */}
        <div className="space-y-2">
          <label className="text-base font-medium mx-2">ค้นหา</label>
          <div className="relative mt-1">
            <Search className="absolute left-2.5 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchValue ?? ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearchSubmit?.()}
              placeholder="รหัสลูกค้า, ชื่อลูกค้า"
              className="pl-9 w-full bg-white"
            />
          </div>
        </div>

        {/* Date Range Picker */}
        <div className="space-y-2">
          <label className="text-base font-medium mx-2">ช่วงวันที่</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal bg-white mt-1 h-11",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yyyy", { locale: th })} -{" "}
                      {format(dateRange.to, "dd/MM/yyyy", { locale: th })}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yyyy", { locale: th })
                  )
                ) : (
                  <span>เลือกช่วงวันที่</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={onDateRangeChange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Create Button */}
      <div className="grid gap-4 lg:items-end mt-4">
        <div className="flex flex-wrap gap-2 items-center lg:justify-end">
          {canCreate ? (
            <Link href="/temporary-credit-limits/new">
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <span className="inline-flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  สร้างคำขอใหม่
                </span>
              </Button>
            </Link>
          ) : (
            <Button className="w-full lg:w-auto" variant="outline" disabled>
              <span className="inline-flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                สร้างคำขอใหม่
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Cards (Mobile View) ---

function TemporaryCreditLimitCards({
  data,
  loading,
  canApprove,
  canEdit,
  canDelete,
  onDelete,
  pagination,
}: Pick<
  TemporaryCreditLimitTableProps,
  "data" | "loading" | "canApprove" | "canEdit" | "canDelete" | "onDelete" | "pagination"
>) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={`loading-${idx}`} className="h-full border border-slate-200/80 shadow-sm">
            <div className="h-1 w-full bg-slate-100" />
            <div className="space-y-3 p-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="border-dashed border-slate-200 bg-slate-50/80 p-6 text-center">
        <div className="mb-2 text-base font-semibold text-slate-900">ไม่พบข้อมูล</div>
        <p className="text-sm text-slate-600">ลองปรับการค้นหาหรือสร้างคำขอใหม่</p>
      </Card>
    );
  }

  const { page, perPage, total, onPageChange, onPerPageChange, perPageOptions } =
    pagination || {
      page: 1,
      perPage: 10,
      total: 0,
      onPageChange: () => { },
      onPerPageChange: () => { },
      perPageOptions: [10, 20, 50],
    };

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const startDisplay = (page - 1) * perPage + 1;
  const endDisplay = Math.min((page - 1) * perPage + data.length, total);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.map((item) => {
          const isPending = item.status === "PENDING";
          const isApproved = item.status === "APPROVED";
          const amount = new Intl.NumberFormat("th-TH", {
            style: "currency",
            currency: "THB",
          }).format(Number(item.requestedAmount));

          return (
            <Card
              key={item.id}
              className="group relative overflow-hidden border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div
                className={cn(
                  "absolute inset-x-0 top-0 h-1",
                  isPending
                    ? "bg-yellow-400"
                    : isApproved
                      ? "bg-emerald-500"
                      : "bg-red-500"
                )}
              />
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col">
                    <div className="text-base font-semibold text-slate-900">
                      {item.customer?.name || "-"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {item.customer?.customerCode || "-"}
                    </div>
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                <div className="flex items-baseline justify-between py-1">
                  <span className="text-sm text-slate-600">จำนวนเงิน</span>
                  <span className="text-lg font-bold text-slate-800">{amount}</span>
                </div>

                <div className="space-y-1 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span>วันหมดอายุ:</span>
                    <span className="font-medium">
                      {item.expiryDate
                        ? format(new Date(item.expiryDate), "dd MMM yyyy", { locale: th })
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>ผู้ขอ:</span>
                    <span>{item.requestedBy?.name || "-"}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t mt-2">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="border-blue-100 text-blue-700 hover:bg-blue-50"
                  >
                    <Link href={`/temporary-credit-limits/${item.id}`}>
                      <Eye className="mr-2 h-4 w-4" /> ดูรายละเอียด
                    </Link>
                  </Button>

                  {canApprove && isPending && (
                    <Button
                      asChild
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Link href={`/temporary-credit-limits/${item.id}/approve`}>
                        <CheckCircle className="mr-2 h-4 w-4" /> อนุมัติ
                      </Link>
                    </Button>
                  )}

                  {canEdit && !isApproved && (
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="border-purple-100 text-purple-700 hover:bg-purple-50"
                    >
                      <Link href={`/temporary-credit-limits/${item.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" /> แก้ไข
                      </Link>
                    </Button>
                  )}
                  {canDelete && !isApproved && onDelete && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="bg-red-50 text-red-700 hover:bg-red-100"
                      onClick={() => onDelete(item.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> ลบ
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Pagination (Mobile) */}
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

// --- Columns Hook for Table ---

function useColumns(
  canEdit: boolean,
  canDelete: boolean,
  canApprove: boolean,
  onDelete?: (id: string) => void
) {
  return React.useMemo<ColumnDef<TemporaryCreditLimitWithRelations>[]>(() => {
    return [
      {
        accessorKey: "customer.customerCode",
        header: "รหัสลูกค้า",
        cell: (info) => (
          <div className="truncate" title={info.getValue() as string}>
            {(info.getValue() as string) || "-"}
          </div>
        ),
        meta: { minWidth: 100, width: 120, align: "left" },
      },
      {
        accessorKey: "customer.name",
        header: "ชื่อลูกค้า",
        cell: (info) => (
          <div className="truncate" title={info.getValue() as string}>
            {(info.getValue() as string) || "-"}
          </div>
        ),
        meta: { minWidth: 180, width: 220, align: "left" },
      },
      {
        accessorKey: "requestedAmount",
        header: "จำนวนเงิน",
        cell: (info) => {
          const value = info.getValue() as number;
          return new Intl.NumberFormat("th-TH", {
            style: "currency",
            currency: "THB",
          }).format(value);
        },
        meta: { minWidth: 120, width: 140, align: "left" },
      },
      {
        accessorKey: "expiryDate",
        header: "วันหมดอายุ",
        cell: (info) => {
          const value = info.getValue() as Date | string;
          if (!value) return "-";
          const date = typeof value === "string" ? new Date(value) : value;
          return format(date, "dd MMM yyyy", { locale: th });
        },
        meta: { minWidth: 120, width: 120, align: "left" },
      },
      {
        accessorKey: "status",
        header: "สถานะ",
        cell: (info) => {
          const status = info.getValue() as TemporaryCreditStatus;
          return <StatusBadge status={status} />;
        },
        meta: { minWidth: 100, width: 120, align: "center" },
      },
      {
        accessorKey: "requestedBy.name",
        header: "ผู้ขอ",
        cell: (info) => (
          <div className="truncate" title={info.getValue() as string}>
            {(info.getValue() as string) || "-"}
          </div>
        ),
        meta: { minWidth: 120, width: 140, align: "center" },
      },
      {
        id: "actions",
        header: "จัดการ",
        cell: ({ row }) => {
          const item = row.original;
          const isApproved = item.status === "APPROVED";
          const isPending = item.status === "PENDING";

          return (
            <div className="flex items-center justify-center gap-2">
              <ActionButton
                href={`/temporary-credit-limits/${item.id}`}
                icon={Eye}
                label="ดูรายละเอียด"
                colorClass="text-blue-600 border-blue-100 hover:bg-blue-50 rounded-md"
              />

              {canApprove && isPending && (
                <ActionButton
                  href={`/temporary-credit-limits/${item.id}/approve`}
                  icon={CheckCircle}
                  label="อนุมัติ"
                  colorClass="text-green-600 border-green-100 hover:bg-green-50 rounded-md"
                />
              )}

              {canEdit && !isApproved && (
                <ActionButton
                  href={`/temporary-credit-limits/${item.id}/edit`}
                  icon={Edit}
                  label="แก้ไข"
                  colorClass="text-purple-600 border-purple-100 hover:bg-purple-50 rounded-md"
                />
              )}

              {canDelete && !isApproved && onDelete && (
                <ActionButton
                  icon={Trash2}
                  label="ลบ"
                  colorClass="bg-red-50 text-red-600 hover:bg-red-100 rounded-md"
                  onClick={() => onDelete(item.id)}
                />
              )}
            </div>
          );
        },
        meta: { minWidth: 140, width: 160, align: "center" },
      },
    ];
  }, [canEdit, canDelete, canApprove, onDelete]);
}

// --- Main Component ---

export default function TemporaryCreditLimitTable(props: TemporaryCreditLimitTableProps) {
  const {
    data,
    loading,
    pagination,
    searchValue,
    onSearchChange,
    onSearchSubmit,
    dateRange,
    onDateRangeChange,
    canCreate,
    canEdit = false,
    canDelete = false,
    canApprove = false,
    onDelete,
  } = props;

  const columns = useColumns(canEdit, canDelete, canApprove, onDelete);

  const toolbarProps = {
    searchValue,
    onSearchChange,
    onSearchSubmit,
    dateRange,
    onDateRangeChange,
    canCreate,
  };

  return (
    <div className="space-y-6">
      {/* Mobile & Tablet: card layout */}
      <div className="xl:hidden space-y-4">
        <TemporaryCreditLimitToolbar {...toolbarProps} />
        <TemporaryCreditLimitCards
          data={data}
          loading={loading}
          canApprove={canApprove}
          canEdit={canEdit}
          canDelete={canDelete}
          onDelete={onDelete}
          pagination={pagination}
        />
      </div>

      {/* Desktop & up: table layout */}
      <div className="hidden xl:block">
        <CustomTable
          columns={columns}
          data={data}
          loading={loading}
          pagination={pagination}
          toolbar={<TemporaryCreditLimitToolbar {...toolbarProps} />}
          emptyState={{
            title: "ไม่พบข้อมูลรายการคำขอ",
            description: "ลองปรับเงื่อนไขการค้นหา หรือสร้างคำขอใหม่",
          }}
          className="w-full"
        />
      </div>
    </div>
  );
}
