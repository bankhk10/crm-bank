"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  Row,
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
  /**
   * Optional: render a sub-component when a row is expanded.
   * If provided, expansion support will be enabled.
   */
  renderSubComponent?: (props: { row: Row<TData> }) => React.ReactNode;
  /**
   * Optional: function to determine if a row can be expanded.
   * If provided, expansion support will be enabled.
   */
  getRowCanExpand?: (row: Row<TData>) => boolean;
  emptyState?: DataTableEmptyState;
  className?: string;
  /** Optional function to get row unique ID */
  getRowId?: (row: TData, index: number) => string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading,
  toolbar,
  footer,
  renderSubComponent,
  getRowCanExpand,
  emptyState = {
    title: "ไม่พบข้อมูล",
    description: "ลองปรับเงื่อนไขหรือสร้างรายการใหม่",
  },
  className,
  getRowId,
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
    manualPagination: true,
    getRowId: getRowId || ((row: any, index: number) => row.id ?? row.uuid ?? String(index)),
    ...(renderSubComponent || getRowCanExpand ? { getExpandedRowModel: getExpandedRowModel() } : {}),
    ...(getRowCanExpand ? { getRowCanExpand } : {}),
  });

  const skeletonRowCount = React.useMemo(() => Math.min(5, columns.length ? 5 : 0), [columns.length]);
  const rowCount = table.getRowModel().rows.length;
  const showEmptyState = !loading && rowCount === 0;
  const showSkeletons = loading && rowCount === 0;
  const contentOpacityClass = loading && rowCount > 0 ? "opacity-80" : "opacity-100";

  return (
    <div className={cn("space-y-4", className)}>
      {toolbar}

      <div className="relative rounded-md border overflow-x-auto">
        <div className={`transition-opacity duration-200 ${contentOpacityClass}`}>
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
                      (() => {
                        const colMeta: any = (header.column.columnDef as any).meta || {};
                        const w = colMeta?.width;
                        const minW = colMeta?.minWidth;
                        const maxW = colMeta?.maxWidth;
                        const headerAlign: string | undefined = colMeta?.headerAlign ?? colMeta?.align;
                        const align: string | undefined = colMeta?.align;

                        const style: React.CSSProperties | undefined = (() => {
                          const s: React.CSSProperties = {};
                          if (minW !== undefined) s.minWidth = typeof minW === "number" ? `${minW}px` : minW;
                          if (w !== undefined) s.width = typeof w === "number" ? `${w}px` : w;
                          if (maxW !== undefined) s.maxWidth = typeof maxW === "number" ? `${maxW}px` : maxW;
                          return Object.keys(s).length ? s : undefined;
                        })();

                        const headerAlignClass = headerAlign === "center" ? "text-center" : headerAlign === "right" ? "text-right" : "text-left";

                        return (
                          <TableHead
                            key={header.id}
                            style={style}
                            className={cn("whitespace-nowrap bg-slate-50 text-base font-semibold text-slate-700 h-14 border-r border-slate-200 last:border-r-0", headerAlignClass)}
                          >
                            {header.isPlaceholder ? null : (
                              header.column.getCanSort() ? (
                                (() => {
                                  // If header should be centered, center the title and position the sort icon to the right
                                  if (headerAlign === "center") {
                                    return (
                                      <button
                                        type="button"
                                        title={headerTitle}
                                        aria-label={headerTitle ? `Sort by ${headerTitle}` : undefined}
                                        onClick={header.column.getToggleSortingHandler()}
                                        className="relative w-full flex items-center justify-center min-w-0"
                                      >
                                        <span className="truncate" title={headerTitle}>
                                          {flexRender(header.column.columnDef.header, header.getContext())}
                                        </span>
                                        <span className="absolute right-2 text-xs text-slate-500 inline-flex items-center shrink-0">
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
                                  }

                                  // For right-aligned headers, align items to the end; otherwise keep default (left)
                                  const justifyClass = headerAlign === "right" ? "justify-end" : "justify-between";

                                  return (
                                    <button
                                      type="button"
                                      title={headerTitle}
                                      aria-label={headerTitle ? `Sort by ${headerTitle}` : undefined}
                                      onClick={header.column.getToggleSortingHandler()}
                                      className={`flex w-full items-center ${justifyClass} gap-2 min-w-0`}
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
                                  if (headerAlign === "center") {
                                    return (
                                      <div className="flex items-center justify-center min-w-0">
                                        <span className="truncate" title={headerTitle}>
                                          {flexRender(header.column.columnDef.header, header.getContext())}
                                        </span>
                                      </div>
                                    );
                                  }

                                  const justifyClass = headerAlign === "right" ? "justify-end" : "justify-start";

                                  return (
                                    <div className={`flex items-center ${justifyClass} min-w-0`}>
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
                      })()
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {showSkeletons &&
                Array.from({ length: skeletonRowCount || 3 }).map((_, rowIndex) => (
                  <TableRow key={`loading-${rowIndex}`}>
                    {columns.map((column, columnIndex) => {
                      const colMeta: any = (column as any).meta || {};
                      const w = colMeta?.width;
                      const minW = colMeta?.minWidth;
                      const maxW = colMeta?.maxWidth;
                      const align: string | undefined = colMeta?.align;

                      const style: React.CSSProperties | undefined = (() => {
                        const s: React.CSSProperties = {};
                        if (minW !== undefined) s.minWidth = typeof minW === "number" ? `${minW}px` : minW;
                        if (w !== undefined) s.width = typeof w === "number" ? `${w}px` : w;
                        if (maxW !== undefined) s.maxWidth = typeof maxW === "number" ? `${maxW}px` : maxW;
                        if (colMeta?.sticky === "right") {
                          s.position = "sticky";
                          s.right = 0;
                          s.zIndex = 10;
                          s.backgroundColor = "white";
                        }
                        return Object.keys(s).length ? s : undefined;
                      })();

                      const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
                      const stickyClass = colMeta?.sticky === "right" ? "shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.1)]" : "";

                      return (
                        <TableCell key={`${columnIndex}`} style={style} className={alignClass}>
                          <div className="h-4 w-full animate-pulse rounded bg-muted" />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}

              {(!loading || rowCount > 0) && !showEmptyState &&
                table.getRowModel().rows.map((row: any) => (
                  <React.Fragment key={row.id}>
                    <TableRow data-state={row.getIsSelected() ? "selected" : undefined}>
                      {row.getVisibleCells().map((cell: any) => {
                        const cellContent = flexRender(cell.column.columnDef.cell, cell.getContext());
                        const cellValue = cell.getValue();
                        const cellTitle =
                          typeof cellValue === "string" || typeof cellValue === "number"
                            ? String(cellValue)
                            : undefined;

                        const colMeta: any = (cell.column.columnDef as any).meta || {};
                        const w = colMeta?.width;
                        const minW = colMeta?.minWidth;
                        const maxW = colMeta?.maxWidth;
                        const align: string | undefined = colMeta?.align;

                        const style: React.CSSProperties | undefined = (() => {
                          const s: React.CSSProperties = {};
                          if (minW !== undefined) s.minWidth = typeof minW === "number" ? `${minW}px` : minW;
                          if (w !== undefined) s.width = typeof w === "number" ? `${w}px` : w;
                          if (maxW !== undefined) s.maxWidth = typeof maxW === "number" ? `${maxW}px` : maxW;
                          if (colMeta?.sticky === "right") {
                            s.position = "sticky";
                            s.right = 0;
                            s.zIndex = 10;
                            s.backgroundColor = "white";
                          }
                          return Object.keys(s).length ? s : undefined;
                        })();

                        const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
                        const stickyClass = colMeta?.sticky === "right" ? "shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.1)]" : "";

                        return (
                          <TableCell key={cell.id} title={cellTitle} style={style} className={cn(alignClass, stickyClass, "border-r border-slate-100 last:border-r-0")}>
                            {cellContent}
                          </TableCell>
                        );
                      })}
                    </TableRow>

                    {renderSubComponent && row.getIsExpanded() && (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="p-0">
                          {renderSubComponent({ row })}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
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
        </div>

        {/* Overlay spinner: always present but fades in/out for smoothness */}
        <div
          className={`pointer-events-none absolute right-3 top-3 flex items-center gap-2 rounded bg-white/80 px-3 py-1 text-sm text-muted-foreground shadow transition-opacity duration-200 ${loading && rowCount > 0 ? "opacity-100" : "opacity-0"
            }`}
        >
          <Loader2 className="h-4 w-4 animate-spin" /> กำลังอัพเดต...
        </div>

        {loading && rowCount === 0 && (
          <div className="flex items-center justify-center gap-2 border-t px-4 py-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> โหลดข้อมูล...
          </div>
        )}

        {footer}
      </div>
    </div>
  );
}
