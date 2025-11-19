"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Loader2, ChevronUpIcon, ChevronDownIcon, ChevronsUpDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type DataTableEmptyState = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  toolbar?: React.ReactNode;
  footer?: React.ReactNode;
  emptyState?: DataTableEmptyState;
  className?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading,
  toolbar,
  footer,
  emptyState = {
    title: "ไม่พบข้อมูล",
    description: "ลองปรับเงื่อนไขหรือสร้างรายการใหม่",
  },
  className,
}: DataTableProps<TData, TValue>) {
  // TanStack's useReactTable manages internal refs and must be created per render.
  // Add local sorting state and sorted row model so headers can toggle sort.
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const skeletonRowCount = React.useMemo(() => Math.min(5, columns.length ? 5 : 0), [columns.length]);
  const showEmptyState = !loading && table.getRowModel().rows.length === 0;

  return (
    <div className={cn("space-y-4", className)}>
      {toolbar}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const headerTitle =
                    typeof header.column.columnDef.header === "string"
                      ? header.column.columnDef.header
                      : undefined;

                  return (
                    <TableHead
                      key={header.id}
                      className="whitespace-nowrap bg-slate-50 font-medium text-slate-700"
                    >
                      {header.isPlaceholder ? null : (
                        header.column.getCanSort() ? (
                                // apply column width from columnDef.meta?.width if provided
                                (() => {
                                  const colMeta: any = (header.column.columnDef as any).meta;
                                  const w = colMeta?.width;
                                  const style = w ? { minWidth: typeof w === "number" ? `${w}px` : w } : undefined;

                                  return (
                                    <button
                                      type="button"
                                      title={headerTitle}
                                      aria-label={headerTitle ? `Sort by ${headerTitle}` : undefined}
                                      onClick={header.column.getToggleSortingHandler()}
                                      className="flex w-full items-center justify-between gap-2 text-left min-w-0"
                                      style={style}
                                    >
                                      <span className="truncate" title={headerTitle}>
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                      </span>
                                      <span className="ml-2 text-xs text-slate-500 inline-flex items-center shrink-0">
                                        {header.column.getIsSorted() === "asc" ? (
                                          <ChevronUpIcon className="h-4 w-4" />
                                        ) : header.column.getIsSorted() === "desc" ? (
                                          <ChevronDownIcon className="h-4 w-4" />
                                        ) : (
                                          <ChevronsUpDownIcon className="h-4 w-4 opacity-60" />
                                        )}
                                      </span>
                                    </button>
                                  );
                                })()
                        ) : (
                                (() => {
                                  const colMeta: any = (header.column.columnDef as any).meta;
                                  const w = colMeta?.width;
                                  const style = w ? { minWidth: typeof w === "number" ? `${w}px` : w } : undefined;

                                  return (
                                    <div className="flex items-center min-w-0" style={style}>
                                      <span className="truncate" title={headerTitle}>
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                      </span>
                                    </div>
                                  );
                                })()
                        )
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: skeletonRowCount || 3 }).map((_, rowIndex) => (
                <TableRow key={`loading-${rowIndex}`}>
                  {columns.map((column, columnIndex) => (
                    <TableCell key={`${columnIndex}`}>
                      <div className="h-4 w-full animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && !showEmptyState &&
              table.getRowModel().rows.map((row: any) => (
                <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                  {row.getVisibleCells().map((cell: any) => {
                    const cellContent = flexRender(cell.column.columnDef.cell, cell.getContext());
                    const cellValue = cell.getValue();
                    const cellTitle =
                      typeof cellValue === "string" || typeof cellValue === "number"
                        ? String(cellValue)
                        : undefined;

                    const colMeta: any = (cell.column.columnDef as any).meta;
                    const w = colMeta?.width;
                    const style = w ? { minWidth: typeof w === "number" ? `${w}px` : w } : undefined;

                    return (
                      <TableCell key={cell.id} title={cellTitle} style={style}>
                        {cellContent}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}

            {showEmptyState && (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <span className="font-medium text-foreground">{emptyState.title}</span>
                    {emptyState.description && <span>{emptyState.description}</span>}
                    {emptyState.action}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {loading && (
          <div className="flex items-center justify-center gap-2 border-t px-4 py-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> โหลดข้อมูล...
          </div>
        )}
      </div>

      {footer}
    </div>
  );
}
