"use client";

import * as React from "react";
import { ColumnDef, Row } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { DataTable, DataTableEmptyState } from "@/components/ui/data-table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type TablePagination = {
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  perPageOptions?: number[];
};

export interface CustomTableProps<TData, TValue = any> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;

  /** Optional toolbar ReactNode rendered above the table */
  toolbar?: React.ReactNode;

  pagination?: TablePagination;
  emptyState?: DataTableEmptyState;
  className?: string;
  /** Optional sub-component renderer for expanded rows */
  renderSubComponent?: (props: { row: Row<TData> }) => React.ReactNode;
  /** Optional function to decide whether a row can expand */
  getRowCanExpand?: (row: Row<TData>) => boolean;
}

function DefaultPagination({
  pagination,
  loading,
}: {
  pagination: TablePagination;
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
          <Select
            value={String(pagination.perPage)}
            onValueChange={(value) => pagination.onPerPageChange(Number(value))}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {(pagination.perPageOptions ?? [6, 12, 24]).map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
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

export function CustomTable<TData, TValue = any>(
  props: CustomTableProps<TData, TValue>
) {
  const {
    columns,
    data,
    loading,
    toolbar,
    pagination,
    emptyState,
    className,
    renderSubComponent,
    getRowCanExpand,
  } = props;

  const builtFooter = pagination ? (
    <DefaultPagination pagination={pagination} loading={loading} />
  ) : undefined;

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      toolbar={toolbar}
      footer={builtFooter}
      renderSubComponent={renderSubComponent as any}
      getRowCanExpand={getRowCanExpand as any}
      emptyState={emptyState}
      className={className}
    />
  );
}

export default CustomTable;
