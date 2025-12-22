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
  BadgeDollarSign,
  Mail,
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

import type { SaleWithRelations, SaleStatus } from "@/types/sales";
import { SaleStatusLabels, PaymentTermLabels } from "@/types/sales";

export type SaleRecord = SaleWithRelations;

export interface SalesTableProps {
  sales: SaleRecord[];
  total: number;
  page: number;
  perPage: number;
  loading?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  isTyping?: boolean;
  onSearchSubmit?: () => void;
  statusFilter?: SaleStatus;
  onStatusFilterChange?: (status: SaleStatus | undefined) => void;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  onDelete?: (sale: SaleRecord) => void;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canApprove?: boolean;
  currentUserId?: string;
}

// --- Constants & Styles ---

const statusStyle: Record<
  SaleStatus,
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
  AWAITING_PAYMENT: {
    label: "รอชำระเงิน",
    className:
      "bg-blue-50 text-blue-700 ring-1 ring-blue-100 dark:bg-blue-900/30 dark:text-blue-50",
    dot: "bg-blue-500",
  },
  PAID: {
    label: "ชำระเงินแล้ว",
    className:
      "bg-teal-50 text-teal-700 ring-1 ring-teal-100 dark:bg-teal-900/30 dark:text-teal-50",
    dot: "bg-teal-500",
  },
  AWAITING_DELIVERY: {
    label: "รอจัดส่ง",
    className:
      "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-50",
    dot: "bg-indigo-500",
  },
  DELIVERED: {
    label: "จัดส่งแล้ว",
    className:
      "bg-purple-50 text-purple-700 ring-1 ring-purple-100 dark:bg-purple-900/30 dark:text-purple-50",
    dot: "bg-purple-500",
  },
  EXPIRED: {
    label: "หมดอายุ",
    className:
      "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900/40 dark:text-slate-100",
    dot: "bg-slate-400",
  },
  COMPLETED: {
    label: "เสร็จสิ้น",
    className:
      "bg-green-50 text-green-700 ring-1 ring-green-100 dark:bg-green-900/30 dark:text-green-50",
    dot: "bg-green-500",
  },
  CANCELLED: {
    label: "ยกเลิก",
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

function TruncatedCell({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("truncate", className)} title={value}>
      {value}
    </div>
  );
}

function StatusBadge({
  status,
  className,
}: {
  status?: string;
  className?: string;
}) {
  const key = (status || "").toUpperCase() as SaleStatus;
  const info = statusStyle[key] ?? {
    ...DEFAULT_BADGE_STYLE,
    label: SaleStatusLabels[key] || key || "ไม่ระบุ",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
        info.className,
        className
      )}
    >
      <span
        className={cn("h-2 w-2 rounded-full", info.dot)}
        aria-hidden="true"
      />
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

function SalesToolbar({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  statusFilter,
  onStatusFilterChange,
  dateRange,
  onDateRangeChange,
  canCreate,
}: Pick<
  SalesTableProps,
  | "searchValue"
  | "onSearchChange"
  | "onSearchSubmit"
  | "statusFilter"
  | "onStatusFilterChange"
  | "dateRange"
  | "onDateRangeChange"
  | "canCreate"
>) {
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

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
              placeholder="เลขที่ใบขาย, ชื่อลูกค้า"
              className="pl-9 w-full bg-white"
            />
          </div>
        </div>

        {/* Date Range Picker */}
        <div className="space-y-2">
          <label className="text-base font-medium mx-2">ช่วงวันที่</label>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
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
              <div className="p-3 border-t border-border flex items-center justify-center gap-2 bg-slate-50/50">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => {
                    onDateRangeChange?.(undefined);
                  }}
                >
                  ล้าง
                </Button>
                <Button
                  size="sm"
                  className="h-8"
                  onClick={() => setIsCalendarOpen(false)}
                >
                  ตกลง
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <label className="text-base font-medium mx-2">สถานะ</label>
          <Select
            value={statusFilter || "ALL"}
            onValueChange={(value) =>
              onStatusFilterChange?.(
                value === "ALL" ? undefined : (value as SaleStatus)
              )
            }
          >
            <SelectTrigger className="w-full bg-white mt-1 h-11">
              <SelectValue placeholder="ทุกสถานะ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">ทุกสถานะ</SelectItem>
              {Object.entries(SaleStatusLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Create Button */}
      <div className="grid gap-4 lg:items-end mt-4">
        <div className="flex flex-wrap gap-2 items-center lg:justify-end">
          {canCreate ? (
            <Link href="/sales/new">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <span className="inline-flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  สร้างรายการขายใหม่
                </span>
              </Button>
            </Link>
          ) : (
            <Button className="w-full lg:w-auto" variant="outline" disabled>
              <span className="inline-flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                สร้างรายการขายใหม่
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Cards (Mobile View) ---

function SalesCards({
  data,
  loading,
  canApprove,
  canEdit,
  canDelete,
  onDelete,
  currentUserId,
  pagination,
}: Pick<
  SalesTableProps,
  | "loading"
  | "canApprove"
  | "canEdit"
  | "canDelete"
  | "onDelete"
  | "currentUserId"
> & {
  data: SaleRecord[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    onPageChange: (p: number) => void;
    onPerPageChange: (n: number) => void;
    perPageOptions?: number[];
  };
}) {
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
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
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
          ไม่พบข้อมูล
        </div>
        <p className="text-sm text-slate-600">
          ลองปรับการค้นหาหรือสร้างรายการขายใหม่
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
        {data.map((item) => {
          const isPending = item.status === "PENDING";
          const isApproved = item.status === "APPROVED";
          const isRejected = item.status === "REJECTED";

          const amount = new Intl.NumberFormat("th-TH", {
            style: "currency",
            currency: "THB",
          }).format(Number(item.totalAmount));

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
                    : isRejected
                    ? "bg-red-500"
                    : "bg-gray-400"
                )}
              />
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                      <BadgeDollarSign className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-base font-semibold text-slate-900 truncate"
                        title={item.customer?.name}
                      >
                        {item.customer?.name || "-"}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {item.saleNumber || "-"}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                <div className="flex items-baseline justify-between py-1 border-t border-dashed pt-2">
                  <div className="text-xs text-slate-500">ยอดรวมสุทธิ</div>
                  <div className="text-lg font-bold text-slate-800">
                    {amount}
                  </div>
                </div>

                <div className="space-y-1 text-sm text-slate-700 bg-slate-50 rounded-lg p-2">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-slate-500 text-xs">
                      <CalendarIcon className="h-3.5 w-3.5" /> วันที่
                    </span>
                    <span className="font-medium">
                      {item.saleDate
                        ? format(new Date(item.saleDate), "dd MMM yyyy", {
                            locale: th,
                          })
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="flex items-center gap-1.5 text-slate-500 text-xs">
                      <Mail className="h-3.5 w-3.5" /> พนักงาน
                    </span>
                    <span className="truncate max-w-[150px]">
                      {item.employee?.name || "-"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1 mt-2">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="border-blue-100 text-blue-700 hover:bg-blue-50"
                  >
                    <Link href={`/sales/${item.id}`}>
                      <Eye className="mr-2 h-4 w-4" /> ดู
                    </Link>
                  </Button>

                  {canApprove && isPending && (
                    <Button
                      asChild
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Link href={`/sales/${item.id}/approve`}>
                        <CheckCircle className="mr-2 h-4 w-4" /> อนุมัติ
                      </Link>
                    </Button>
                  )}

                  {(canEdit ||
                    (currentUserId && item.createdById === currentUserId)) &&
                    isPending && (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="border-purple-100 text-purple-700 hover:bg-purple-50"
                      >
                        <Link href={`/sales/${item.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" /> แก้ไข
                        </Link>
                      </Button>
                    )}
                  {(canDelete ||
                    (currentUserId && item.createdById === currentUserId)) &&
                    isPending &&
                    onDelete && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="bg-red-50 text-red-700 hover:bg-red-100"
                        onClick={() => onDelete(item)}
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
  currentUserId: string | undefined,
  onDelete?: (sale: SaleRecord) => void
) {
  return React.useMemo<ColumnDef<SaleRecord>[]>(() => {
    return [
      {
        accessorKey: "saleNumber",
        header: "เลขที่ใบขาย",
        cell: (info) => <TruncatedCell value={info.getValue() as string} />,
        meta: { minWidth: 120, width: 140, maxWidth: 200, align: "left" },
      },

      {
        accessorKey: "customer.name",
        header: "ชื่อลูกค้า",
        cell: (info) => <TruncatedCell value={info.getValue() as string} />,
        meta: { minWidth: 200, width: 200, maxWidth: 200, align: "left" },
      },
      {
        accessorKey: "employee.name",
        header: "พนักงานขาย",
        cell: (info) => <TruncatedCell value={info.getValue() as string} />,
        meta: { minWidth: 120, width: 140, maxWidth: 200, align: "left" },
      },
      {
        accessorKey: "saleDate",
        header: "วันที่ขาย",
        cell: (info) => {
          const value = info.getValue() as Date | string;
          if (!value) return "-";
          const date = typeof value === "string" ? new Date(value) : value;
          return format(date, "dd MMM yyyy", { locale: th });
        },
        meta: { minWidth: 120, width: 120, align: "left" },
      },
      {
        accessorKey: "totalAmount",
        header: "ยอดรวม",
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
        accessorKey: "paymentTerm",
        header: "เงื่อนไขชำระ",
        cell: (info) => {
          const value = info.getValue() as string;
          return (
            <Badge
              variant="outline"
              className="text-xs bg-blue-100 text-blue-800"
            >
              {PaymentTermLabels[value as keyof typeof PaymentTermLabels] ||
                value}
            </Badge>
          );
        },
        meta: { minWidth: 100, width: 120, align: "center" },
      },
      {
        accessorKey: "status",
        header: "สถานะ",
        cell: (info) => {
          const status = info.getValue() as SaleStatus;
          return <StatusBadge status={status} />;
        },
        meta: { minWidth: 100, width: 120, align: "left" },
      },
      {
        id: "actions",
        header: "จัดการ",
        cell: ({ row }) => {
          const item = row.original;
          const isPending = item.status === "PENDING";

          return (
            <div className="flex items-center justify-center gap-2">
              <ActionButton
                href={`/sales/${item.id}`}
                icon={Eye}
                label="ดูรายละเอียด"
                colorClass="text-blue-600 border-blue-100 hover:bg-blue-50 rounded-md"
              />

              {canApprove && isPending && (
                <>
                  <ActionButton
                    href={`/sales/${item.id}/approve`}
                    icon={CheckCircle}
                    label="อนุมัติ"
                    colorClass="text-green-600 border-green-100 hover:bg-green-50 rounded-md"
                  />
                </>
              )}

              {(canEdit ||
                (currentUserId && item.createdById === currentUserId)) &&
                isPending && (
                  <ActionButton
                    href={`/sales/${item.id}/edit`}
                    icon={Edit}
                    label="แก้ไข"
                    colorClass="text-purple-600 border-purple-100 hover:bg-purple-50 rounded-md"
                  />
                )}

              {(canDelete ||
                (currentUserId && item.createdById === currentUserId)) &&
                isPending &&
                onDelete && (
                  <ActionButton
                    icon={Trash2}
                    label="ลบ"
                    colorClass="bg-red-50 text-red-600 hover:bg-red-100 rounded-md"
                    onClick={() => onDelete(item)}
                  />
                )}
            </div>
          );
        },
        meta: { minWidth: 180, width: 200, align: "center" },
      },
    ];
  }, [canEdit, canDelete, canApprove, currentUserId, onDelete]);
}

// --- Main Component ---

export function SalesTable(props: SalesTableProps) {
  const {
    sales,
    total,
    page,
    perPage,
    loading,
    searchValue,
    onSearchChange,
    onSearchSubmit,
    dateRange,
    onDateRangeChange,
    onPageChange,
    onPerPageChange,
    onDelete,
    canCreate = false,
    canEdit = false,
    canDelete = false,
    canApprove = false,
    currentUserId,
  } = props;

  const columns = useColumns(
    canEdit,
    canDelete,
    canApprove,
    currentUserId,
    onDelete
  );

  const toolbarProps = {
    searchValue,
    onSearchChange,
    onSearchSubmit,
    dateRange,
    onDateRangeChange,
    canCreate,
  };

  const pagination = {
    page,
    perPage,
    total,
    onPageChange: onPageChange || (() => {}),
    onPerPageChange: onPerPageChange || (() => {}),
    perPageOptions: [10, 20, 30, 50],
  };

  return (
    <div className="bg-white shadow-sm sm:rounded-lg">
      <div className="p-6">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-3">
            <BadgeDollarSign className="w-9 h-9 text-blue-600" />
            <h1 className="text-3xl font-bold tracking-tight">ข้อมูลการขาย</h1>
          </div>
        </div>

        <div className="space-y-6">
          {/* Mobile & Tablet: card layout */}
          <div className="xl:hidden space-y-4">
            <SalesToolbar {...toolbarProps} />
            <SalesCards
              data={sales}
              loading={loading}
              canApprove={canApprove}
              canEdit={canEdit}
              canDelete={canDelete}
              currentUserId={currentUserId}
              onDelete={onDelete}
              pagination={pagination}
            />
          </div>

          {/* Desktop & up: table layout */}
          <div className="hidden xl:block">
            <CustomTable
              columns={columns}
              data={sales}
              loading={loading}
              pagination={pagination}
              toolbar={<SalesToolbar {...toolbarProps} />}
              emptyState={{
                title: "ยังไม่มีรายการขาย",
                description: "ลองปรับเงื่อนไขการค้นหา หรือสร้างรายการขายใหม่",
              }}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
