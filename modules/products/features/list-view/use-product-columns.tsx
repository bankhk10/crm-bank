import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  Eye,
  Edit,
  Trash2,
  Settings,
  ChevronDownIcon,
  ChevronUpIcon,
} from "lucide-react";
import { ProductRecord } from "../../types";
import { ActionButton } from "@/components/custom/action-button";
import { ProductStatusBadge } from "../../ui/product-status-badge";
import { TruncatedCell } from "@/components/custom/truncated-cell";

// ──────────────────────────────────────────────────────────────────
// Stock indicator helpers
// ──────────────────────────────────────────────────────────────────
function StockBadge({
  value,
  colorClass,
}: {
  value: number;
  colorClass: string;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[3rem] rounded-full px-2.5 py-0.5 text-[13px] font-medium tabular-nums shadow-sm ${colorClass}`}
    >
      {value.toLocaleString()}
    </span>
  );
}

// ──────────────────────────────────────────────────────────────────
// Table Columns Hook
// ──────────────────────────────────────────────────────────────────
export function useProductColumns(
  onDeleteRequest: (product: ProductRecord) => void,
  canView: boolean,
  canUpdate: boolean,
  canDelete: boolean,
  canManage: boolean,
) {
  return React.useMemo<ColumnDef<ProductRecord>[]>(
    () => [
      // ── Expander ──────────────────────────────────────────
      {
        id: "expander",
        header: () => null,
        meta: {
          width: 40,
          align: "center",
        },
        cell: ({ row }) =>
          row.getCanExpand() ? (
            <button
              onClick={row.getToggleExpandedHandler()}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              aria-label={
                row.getIsExpanded() ? "ซ่อนสินค้าย่อย" : "แสดงสินค้าย่อย"
              }
            >
              {row.getIsExpanded() ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
            </button>
          ) : null,
      },

      // ── ชื่อสินค้า ──────────────────────────────────────
      {
        accessorKey: "name",
        header: "ชื่อสินค้า",
        meta: {
          headerAlign: "left",
          minWidth: 280,
          width: 280,
          maxWidth: 320,
          align: "left",
        },
        cell: ({ row }) => (
          <div className="flex flex-col py-0.5 gap-0.5">
            <TruncatedCell
              value={row.original.name ?? "-"}
              className="text-[15px] font-medium text-slate-900"
            />
            <span className="text-xs font-medium text-slate-500">
              {row.original.productCode ?? "-"}
            </span>
          </div>
        ),
      },

      // ── หน่วยนับ ─────────────────────────────────────────
      {
        accessorKey: "unit",
        header: "หน่วยนับ",
        enableSorting: false,
        meta: {
          headerAlign: "center",
          minWidth: 50,
          width: 50,
          maxWidth: 90,
          align: "center",
        },
        cell: ({ row }) => (
          <span className="inline-flex text-[13px] font-medium text-slate-600 bg-slate-100/80 px-2.5 py-0.5 rounded-md">
            {row.original.unit ?? "-"}
          </span>
        ),
      },

      // ── ราคาต่อหน่วย ─────────────────────────────────────
      {
        accessorKey: "price",
        header: "ราคาต่อหน่วย",
        meta: {
          headerAlign: "right",
          minWidth: 100,
          width: 100,
          maxWidth: 110,
          align: "right",
        },
        cell: ({ row }) => {
          const price = row.original.price;
          if (price == null)
            return <span className="text-sm text-slate-400">-</span>;
          return (
            <span className="text-[15px] font-medium text-emerald-700 tabular-nums whitespace-nowrap">
              ฿
              {Number(price).toLocaleString("th-TH", {
                minimumFractionDigits: 2,
              })}
            </span>
          );
        },
      },

      // ── สต็อกทั้งหมด ──────────────────────────────────────
      {
        accessorKey: "stockQuantity",
        header: "ทั้งหมด",
        meta: {
          headerAlign: "center",
          minWidth: 120,
          width: 120,
          maxWidth: 140,
          align: "center",
        },
        cell: ({ row }) => {
          const total = row.original.physicalQuantity ?? 0;
          return (
            <StockBadge
              value={total}
              colorClass="bg-blue-50 text-blue-700 ring-1 ring-blue-100"
            />
          );
        },
      },

      // ── จอง ──────────────────────────────────────────────
      {
        accessorKey: "reserved",
        header: "จอง",
        enableSorting: false,
        meta: {
          headerAlign: "center",
          minWidth: 90,
          width: 90,
          maxWidth: 110,
          align: "center",
        },
        cell: ({ row }) => {
          const reserved =
            row.original.reservedQuantity ?? row.original.reserved ?? 0;
          return (
            <StockBadge
              value={reserved}
              colorClass="bg-orange-50 text-orange-700 ring-1 ring-orange-100"
            />
          );
        },
      },

      // ── คงเหลือ ───────────────────────────────────────────
      {
        id: "availableStock",
        header: "คงเหลือ",
        accessorFn: (row) => row.availableQuantity ?? 0,
        meta: {
          headerAlign: "center",
          minWidth: 120,
          width: 120,
          maxWidth: 140,
          align: "center",
        },
        cell: ({ row }) => {
          const physical = row.original.physicalQuantity ?? 0;
          const reserved = row.original.reservedQuantity ?? 0;
          const remaining = physical - reserved;
          const isLow = remaining <= 0;
          return (
            <StockBadge
              value={remaining}
              colorClass={
                isLow
                  ? "bg-red-50 text-red-700 ring-1 ring-red-100"
                  : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
              }
            />
          );
        },
      },

      // ── สถานะ ─────────────────────────────────────────────
      {
        accessorKey: "status",
        header: "สถานะ",
        enableSorting: false,
        meta: {
          headerAlign: "center",
          minWidth: 105,
          width: 105,
          maxWidth: 120,
          align: "center",
        },
        cell: ({ row }) => {
          const status = row.original.status?.toUpperCase();
          return status ? (
            <ProductStatusBadge status={status} className="text-xs" />
          ) : (
            <span className="text-sm text-slate-400">-</span>
          );
        },
      },

      // ── จัดการ ────────────────────────────────────────────
      {
        id: "actions",
        header: "จัดการ",
        enableSorting: false,
        meta: {
          headerAlign: "center",
          minWidth: 140,
          width: 140,
          maxWidth: 160,
          align: "center",
        },
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div className="flex items-center justify-center gap-1.5">
              {canView && (
                <ActionButton
                  href={`/products/${product.id}`}
                  icon={Eye}
                  label="ดู"
                  colorClass="text-blue-600 border-blue-100 hover:bg-blue-50 rounded-md"
                />
              )}
              {canUpdate && (
                <ActionButton
                  href={`/products/${product.id}/edit`}
                  icon={Edit}
                  label="แก้ไข"
                  colorClass="text-violet-600 border-violet-100 hover:bg-violet-50 rounded-md"
                />
              )}
              {canManage && (
                <ActionButton
                  href={`/products/${product.id}/manage`}
                  icon={Settings}
                  label="จัดการ"
                  colorClass="text-green-600 border-green-100 hover:bg-green-50 rounded-md"
                />
              )}
              {canDelete && (
                <ActionButton
                  icon={Trash2}
                  label="ลบ"
                  colorClass="bg-red-50 text-red-600 hover:bg-red-100 rounded-md"
                  onClick={() => onDeleteRequest(product)}
                />
              )}
            </div>
          );
        },
      },
    ],
    [canView, canUpdate, canManage, canDelete, onDeleteRequest],
  );
}
