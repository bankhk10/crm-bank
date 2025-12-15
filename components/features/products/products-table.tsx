"use client";

import * as React from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import {
  Eye,
  Edit,
  Trash2,
  Settings,
  PlusCircle,
  Package,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import CustomTable from "@/components/custom/custom-table";
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
import type { Product } from "@/types/product";

export interface ProductRecord extends Product {
  _count?: {
    freeItems: number;
    promotionItems: number;
    stockLots: number;
  };
  stockQuantity?: number;
  reserved?: number;
}

export type ProductsPagination = {
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  perPageOptions?: number[];
};

export interface ProductsTableProps {
  data: ProductRecord[];
  loading?: boolean;
  canCreate: boolean;
  canView?: boolean;
  canUpdate?: boolean;
  canDelete: boolean;
  canManage?: boolean;
  onDeleteRequest: (product: ProductRecord) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: () => void;
  pagination: ProductsPagination;
}

// Constants
const statusStyle: Record<string, { label: string; className: string; dot: string }> = {
  ACTIVE: {
    label: "ใช้งาน",
    className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-50",
    dot: "bg-emerald-500",
  },
  INACTIVE: {
    label: "ไม่ได้ใช้งาน",
    className: "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900/40 dark:text-slate-100",
    dot: "bg-slate-400",
  },
};

// Badge Components
function ProductStatusBadge({ status, className }: { status?: string; className?: string }) {
  const key = (status || "").toUpperCase();
  const info = statusStyle[key] ?? {
    label: "ไม่ระบุ",
    className: "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900/40 dark:text-slate-100",
    dot: "bg-slate-400",
  };

  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium", info.className, className)}>
      <span className={cn("h-2 w-2 rounded-full", info.dot)} aria-hidden />
      {info.label}
    </span>
  );
}

// Helper Components
function TruncatedCell({ value }: { value: string }) {
  return (
    <div className="truncate" title={value}>
      {value}
    </div>
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

// Table Columns Hook
function useProductColumns(
  onDeleteRequest: (product: ProductRecord) => void,
  canView: boolean,
  canUpdate: boolean,
  canDelete: boolean,
  canManage: boolean
) {
  return React.useMemo<ColumnDef<ProductRecord>[]>(
    () => [
      {
        accessorKey: "productCode",
        header: "รหัสสินค้า",
        meta: { headerAlign: "left", minWidth: 100, width: 130, maxWidth: 130, align: "left" },
        cell: ({ row }) => <TruncatedCell value={row.original.productCode ?? "-"} />,
      },
      {
        accessorKey: "name",
        header: "ชื่อสินค้า",
        meta: { headerAlign: "left", minWidth: 180, width: 180, maxWidth: 180, align: "left" },
        cell: ({ row }) => <TruncatedCell value={row.original.name ?? "-"} />,
      },
      {
        accessorKey: "productGroup",
        header: "กลุ่มสินค้า",
        enableSorting: false,
        meta: { headerAlign: "left", minWidth: 100, width: 100, maxWidth: 100, align: "left" },
        cell: ({ row }) => <TruncatedCell value={row.original.productGroup ?? "-"} />,
      },
      {
        accessorKey: "price",
        header: "ราคา",
        meta: { headerAlign: "left", minWidth: 100, width: 100, maxWidth: 100, align: "left" },
        cell: ({ row }) => {
          const price = row.original.price;
          return (
            <div className="text-sm">
              {price == null ? (
                "-"
              ) : (
                <span>
                  ฿{Number(price).toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "stockQuantity",
        header: "ทั้งหมด",
        meta: { headerAlign: "left", minWidth: 110, width: 110, maxWidth: 110, align: "left" },
        cell: ({ row }) => {
          const totalStock =
            row.original.stockQuantity ??
            (row.original.stockLots
              ? row.original.stockLots.reduce(
                (s, lot) => s + (lot.quantity || 0),
                0
              )
              : 0);
          return <div className="text-sm">{totalStock.toLocaleString()}</div>;
        },
      },
      {
        accessorKey: "reserved",
        header: "จอง",
        enableSorting: false,
        meta: { headerAlign: "left", minWidth: 70, width: 70, maxWidth: 70, align: "left" },
        cell: ({ row }) => {
          const reserved = row.original.reserved ?? 0;
          return <div className="text-sm">{reserved.toLocaleString()}</div>;
        },
      },
      {
        id: "availableStock",
        header: "คงเหลือ",
        accessorFn: (row) => {
          const totalStock =
            row.stockQuantity ??
            (row.stockLots
              ? row.stockLots.reduce(
                (s, lot) => s + (lot.quantity || 0),
                0
              )
              : 0);
          const reserved = row.reserved ?? 0;
          return Math.max(0, totalStock - reserved);
        },
        meta: { headerAlign: "left", minWidth: 110, width: 110, maxWidth: 110, align: "left" },
        cell: ({ row }) => {
          const totalStock =
            row.original.stockQuantity ??
            (row.original.stockLots
              ? row.original.stockLots.reduce(
                (s, lot) => s + (lot.quantity || 0),
                0
              )
              : 0);
          const reserved = row.original.reserved ?? 0;
          const available = Math.max(0, totalStock - reserved);
          return <div className="text-sm">{available.toLocaleString()}</div>;
        },
      },
      {
        accessorKey: "status",
        header: "สถานะ",
        enableSorting: false,
        meta: { headerAlign: "left", minWidth: 120, width: 120, maxWidth: 120, align: "left" },
        cell: ({ row }) => {
          const status = row.original.status?.toUpperCase();
          return status ? <ProductStatusBadge status={status} className="text-sm" /> : "-";
        },
      },
      {
        id: "actions",
        header: "จัดการ",
        enableSorting: false,
        meta: { headerAlign: "center", minWidth: 150, width: 150, maxWidth: 150, align: "center" },
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div className="flex items-center justify-center gap-2">
              {canView && (
                <ActionButton
                  href={`/products/${product.id}`}
                  icon={Eye}
                  label={`ดู ${product.name}`}
                  colorClass="text-blue-600 border-blue-100 hover:bg-blue-50 rounded-md"
                />
              )}
              {canUpdate && (
                <ActionButton
                  href={`/products/${product.id}/edit`}
                  icon={Edit}
                  label={`แก้ไข ${product.name}`}
                  colorClass="text-purple-600 border-purple-100 hover:bg-purple-50 rounded-md"
                />
              )}
              {canManage && (
                <ActionButton
                  href={`/products/${product.id}/manage`}
                  icon={Settings}
                  label={`จัดการ ${product.name}`}
                  colorClass="text-green-600 border-green-100 hover:bg-green-50 rounded-md"
                />
              )}
              {canDelete && (
                <ActionButton
                  icon={Trash2}
                  label={`ลบ ${product.name}`}
                  colorClass="bg-red-50 text-red-600 hover:bg-red-100 rounded-md"
                  onClick={() => onDeleteRequest(product)}
                />
              )}
            </div>
          );
        },
      },
    ],
    [canView, canUpdate, canManage, canDelete, onDeleteRequest]
  );
}

// Toolbar Component
function ProductsToolbar({
  canCreate,
  searchValue,
  onSearchChange,
  onSearchSubmit,
}: Pick<
  ProductsTableProps,
  | "canCreate"
  | "searchValue"
  | "onSearchChange"
  | "onSearchSubmit"
>) {
  return (
    <div className="rounded-md border bg-background/60 p-4 grid gap-4">
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Search Input */}
        <div className="space-y-2 lg:col-span-2">
          <label className="text-base font-medium mx-2">ค้นหา</label>
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearchSubmit?.()}
            placeholder="รหัสสินค้า, ชื่อสินค้า"
            className="mt-2 w-full"
          />
        </div>

        {/* Create Button */}
        <div className="space-y-2 lg:flex lg:items-end">
          {canCreate ? (
            <Link href="/products/new" className="w-full">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <span className="inline-flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  สร้างสินค้าใหม่
                </span>
              </Button>
            </Link>
          ) : (
            <Button className="w-full" variant="outline" disabled>
              <span className="inline-flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                สร้างสินค้าใหม่
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Cards Component (Mobile View)
function ProductsCards({
  data,
  loading,
  canView,
  canUpdate,
  canManage,
  canDelete,
  onDeleteRequest,
  pagination,
}: Pick<ProductsTableProps, "data" | "loading" | "canView" | "canUpdate" | "canManage" | "canDelete" | "onDeleteRequest" | "pagination">) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={`loading-${idx}`} className="h-full border border-slate-200/80 shadow-sm">
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
        <div className="mb-2 text-base font-semibold text-slate-900">ยังไม่มีสินค้าในหน้านี้</div>
        <p className="text-sm text-slate-600">ลองปรับการค้นหาหรือเพิ่มสินค้าใหม่</p>
      </Card>
    );
  }

  const { page, perPage, total, onPageChange, onPerPageChange, perPageOptions } = pagination;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const startDisplay = (page - 1) * perPage + 1;
  const endDisplay = (page - 1) * perPage + data.length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.map((product) => {
          const totalStock =
            product.stockQuantity ??
            (product.stockLots
              ? product.stockLots.reduce((s, lot) => s + (lot.quantity || 0), 0)
              : 0);
          const reserved = product.reserved ?? 0;
          const available = Math.max(0, totalStock - reserved);

          return (
            <Card
              key={product.id}
              className="group relative overflow-hidden border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                      <Package className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="text-base font-semibold text-slate-900 line-clamp-1">{product.name || "-"}</div>
                      <div className="text-xs text-slate-500">{product.productCode || "-"}</div>
                    </div>
                  </div>
                  <ProductStatusBadge status={product.status} />
                </div>

                <div className="space-y-2 text-sm text-slate-700">
                  <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                    <Package className="h-4 w-4 text-slate-400" />
                    <span className="line-clamp-1">{product.productGroup || "-"}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                    <span className="text-slate-600">ราคา:</span>
                    <span className="font-medium">
                      {product.price == null
                        ? "-"
                        : `฿${Number(product.price).toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                        })}`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-blue-50 px-3 py-2 text-center">
                    <div className="text-xs text-blue-600">ทั้งหมด</div>
                    <div className="font-semibold text-blue-700">{totalStock.toLocaleString()}</div>
                  </div>
                  <div className="rounded-lg bg-orange-50 px-3 py-2 text-center">
                    <div className="text-xs text-orange-600">จอง</div>
                    <div className="font-semibold text-orange-700">{reserved.toLocaleString()}</div>
                  </div>
                  <div className="rounded-lg bg-emerald-50 px-3 py-2 text-center">
                    <div className="text-xs text-emerald-600">คงเหลือ</div>
                    <div className="font-semibold text-emerald-700">{available.toLocaleString()}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {canView && (
                    <Button asChild size="sm" variant="outline" className="border-blue-100 text-blue-700 hover:bg-blue-50">
                      <Link href={`/products/${product.id}`}>
                        <Eye className="mr-2 h-4 w-4" /> ดูรายละเอียด
                      </Link>
                    </Button>
                  )}
                  {canUpdate && (
                    <Button asChild size="sm" variant="outline" className="border-indigo-100 text-indigo-700 hover:bg-indigo-50">
                      <Link href={`/products/${product.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" /> แก้ไข
                      </Link>
                    </Button>
                  )}
                  {canManage && (
                    <Button asChild size="sm" variant="outline" className="border-green-100 text-green-700 hover:bg-green-50">
                      <Link href={`/products/${product.id}/manage`}>
                        <Settings className="mr-2 h-4 w-4" /> จัดการ
                      </Link>
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="bg-red-50 text-red-700 hover:bg-red-100"
                      onClick={() => onDeleteRequest(product)}
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

      {/* Pagination */}
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white/80 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs font-medium text-slate-600">
          แสดง {startDisplay}-{endDisplay} จาก {total}
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          {perPageOptions && perPageOptions.length > 0 && (
            <Select value={String(perPage)} onValueChange={(v) => onPerPageChange(Number(v))}>
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

// Main Table Component
export function ProductsTable(props: ProductsTableProps) {
  const {
    data,
    loading,
    canCreate,
    canView = true,
    canUpdate = false,
    canDelete,
    canManage = false,
    onDeleteRequest,
    searchValue,
    onSearchChange,
    onSearchSubmit,
    pagination,
  } = props;

  const columns = useProductColumns(onDeleteRequest, canView, canUpdate, canDelete, canManage);

  const toolbarProps = {
    canCreate,
    searchValue,
    onSearchChange,
    onSearchSubmit,
  };

  return (
    <div className="space-y-6">
      {/* Mobile & Tablet: card layout */}
      <div className="xl:hidden space-y-4">
        <ProductsToolbar {...toolbarProps} />
        <ProductsCards
          data={data}
          loading={loading}
          canView={canView}
          canUpdate={canUpdate}
          canManage={canManage}
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
          pagination={pagination}
          toolbar={<ProductsToolbar {...toolbarProps} />}
          emptyState={{
            title: "ยังไม่มีสินค้า",
            description: "ลองปรับเงื่อนไขการค้นหา หรือสร้างสินค้าใหม่",
          }}
          className="w-full"
        />
      </div>
    </div>
  );
}

export default ProductsTable;
