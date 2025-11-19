"use client";

import * as React from "react";
import { Loader2, Search } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateRangePicker, DateRangePreset } from "@/components/ui/date-range-picker";

export type DataTableColumn<T> = {
  id: string;
  header: React.ReactNode;
  cell: (row: T, index: number) => React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
};

export type DataTableEmptyState = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export type DataTableFilters = {
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
  };
  dateRange?: {
    value?: DateRange | null;
    onChange: (range: DateRange | undefined) => void;
    placeholder?: string;
    buttonLabel?: string;
    presets?: DateRangePreset[];
  };
  onApply?: () => void;
  isApplying?: boolean;
  /**
   * When false the form-level apply/search button will be hidden.
   * Useful when the page applies filters automatically (e.g. debounced search).
   */
  showApplyButton?: boolean;
};

export type DataTablePagination = {
  page: number;
  perPage: number;
  total: number;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  perPageOptions?: number[];
};

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  title?: React.ReactNode;
  description?: React.ReactNode;
  filters?: DataTableFilters;
  toolbarActions?: React.ReactNode;
  loading?: boolean;
  emptyState?: DataTableEmptyState;
  pagination?: DataTablePagination;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  title,
  description,
  filters,
  toolbarActions,
  loading,
  emptyState = {
    title: "ไม่พบข้อมูล",
    description: "ลองปรับเงื่อนไขหรือสร้างรายการใหม่",
  },
  pagination,
  className,
}: DataTableProps<T>) {
  const colSpan = Math.max(1, columns.length);
  const formId = React.useId();
  const skeletonRowCount = 5;
  const isFiltering = Boolean(filters?.isApplying || loading);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    filters?.onApply?.();
  };

  const start = pagination ? Math.min((pagination.page - 1) * pagination.perPage + 1, pagination.total) : 0;
  const end = pagination ? Math.min(pagination.page * pagination.perPage, pagination.total) : 0;
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.perPage)) : 1;

  return (
    <div className={cn("relative overflow-hidden rounded-3xl border border-slate-100/80 bg-white/95 shadow-xl shadow-slate-200/70 ring-1 ring-slate-100/70 backdrop-blur", className)}>
      {(title || description || filters || toolbarActions) && (
        <div className="space-y-4 border-b border-slate-100/80 bg-linear-to-br from-white via-white to-slate-50/70 p-6">
          {(title || description) && (
            <div>
              {title && <h2 className="text-lg font-semibold text-slate-900">{title}</h2>}
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
          )}

          {(filters || toolbarActions) && (
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-100/80 bg-white/70 p-4 shadow-sm backdrop-blur lg:flex-row lg:items-center lg:justify-between">
              {filters && (
                <form id={formId} className="flex w-full flex-col gap-3 lg:flex-row lg:items-center" onSubmit={handleSubmit}>
                  {filters.search && (
                    <div className="flex w-full flex-col gap-1 lg:max-w-md">
                      <div className="relative group">
                        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-slate-600" />
                        <Input
                          value={filters.search.value}
                          onChange={(event) => filters.search?.onChange(event.target.value)}
                          placeholder={filters.search.placeholder ?? "ค้นหา..."}
                          className="h-12 w-full rounded-2xl border-slate-200/80 bg-white/80 pl-11 pr-12 text-sm text-slate-700 shadow-inner transition-all focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-slate-200"
                        />
                        {isFiltering && <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" aria-hidden />}
                      </div>
                      {(filters.search.label || isFiltering) && (
                        <span className="px-1 text-xs text-muted-foreground" aria-live="polite">
                          {isFiltering ? "กำลังค้นหา..." : filters.search.label}
                        </span>
                      )}
                    </div>
                  )}

                  {filters.dateRange && (
                    <DateRangePicker
                      value={filters.dateRange.value}
                      onChange={filters.dateRange.onChange}
                      placeholder={filters.dateRange.placeholder}
                      buttonLabel={filters.dateRange.buttonLabel}
                      presets={filters.dateRange.presets}
                      className="w-full lg:w-[260px]"
                    />
                  )}

                  {filters.showApplyButton !== false && (
                    <div className="flex items-center gap-2">
                      <Button type="submit" className="h-11 rounded-xl px-6 text-sm font-semibold" disabled={filters.isApplying}>
                        {filters.isApplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        ค้นหา
                      </Button>
                    </div>
                  )}
                </form>
              )}

              {toolbarActions && <div className="flex items-center gap-2">{toolbarActions}</div>}
            </div>
          )}
        </div>
      )}

      <div className="relative p-6">
        <div className="overflow-x-auto rounded-2xl border border-slate-100/80 bg-white/80 shadow-inner">
          <Table className="min-w-full text-sm">
            <TableHeader>
              <TableRow className="border-b border-slate-100/80 bg-linear-to-r from-white via-slate-50 to-white/80">
                {columns.map((column) => (
                  <TableHead
                    key={column.id}
                    className={cn(
                      "whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500",
                      column.align === "right" && "text-right",
                      column.align === "center" && "text-center",
                      column.className,
                    )}
                  >
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading &&
                Array.from({ length: skeletonRowCount }).map((_, rowIndex) => (
                  <TableRow key={`skeleton-${rowIndex}`}>
                    {columns.map((column) => (
                      <TableCell key={`${column.id}-skeleton-${rowIndex}`} className={cn("h-14 px-6 py-4", column.className)}>
                        <div className="h-4 w-full animate-pulse rounded-xl bg-slate-200/80" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!loading &&
                data.map((row, rowIndex) => (
                  <TableRow
                    key={rowIndex}
                    className={cn(
                      "group border-b border-slate-100/70 transition-colors duration-200",
                      rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/50",
                      "hover:bg-slate-100/80",
                    )}
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        className={cn(
                          "px-6 py-4 text-sm text-slate-600",
                          column.align === "right" && "text-right",
                          column.align === "center" && "text-center",
                          column.className,
                        )}
                      >
                        {column.cell(row, rowIndex)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!loading && data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={colSpan} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <p className="text-base font-medium text-slate-900">{emptyState.title}</p>
                      {emptyState.description && <p>{emptyState.description}</p>}
                      {emptyState.action}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {pagination && pagination.total > 0 && (
        <div className="flex flex-col gap-4 border-t border-slate-100/80 bg-white/70 px-6 py-5 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <span>
            แสดง {start}-{end} จาก {pagination.total} รายการ
          </span>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            {pagination.onPerPageChange && (
              <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
                ต่อหน้า
                <select
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm shadow-inner"
                  value={pagination.perPage}
                  onChange={(event) => pagination.onPerPageChange?.(Number(event.target.value))}
                >
                  {(pagination.perPageOptions ?? [6, 12, 24, 50]).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full border-slate-200/80 text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
                onClick={() => pagination.onPageChange?.(Math.max(1, pagination.page - 1))}
                disabled={pagination.page <= 1}
              >
                ก่อนหน้า
              </Button>
              <span className="text-xs font-semibold">
                หน้า {pagination.page} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full border-slate-200/80 text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
                onClick={() => pagination.onPageChange?.(Math.min(totalPages, pagination.page + 1))}
                disabled={pagination.page >= totalPages}
              >
                ถัดไป
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
