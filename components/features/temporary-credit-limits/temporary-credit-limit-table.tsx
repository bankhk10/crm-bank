"use client";

import * as React from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, CheckCircle, XCircle } from "lucide-react";
import { CustomTable } from "@/components/custom/custom-table";
import type { TemporaryCreditLimitWithRelations, TemporaryCreditStatus } from "@/types/temporary-credit-limit";
import { format } from "date-fns";
import { th } from "date-fns/locale";

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
  dateRange?: any;
  onDateRangeChange?: (range: any) => void;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canApprove?: boolean;
  onDelete?: (id: string) => void;
}

const getStatusBadge = (status: TemporaryCreditStatus) => {
  switch (status) {
    case "PENDING":
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">รออนุมัติ</Badge>;
    case "APPROVED":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">อนุมัติแล้ว</Badge>;
    case "REJECTED":
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">ไม่อนุมัติ</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

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
        cell: (info) => info.getValue() || "-",
        meta: { minWidth: 120, width: 140, align: "left" },
      },
      {
        accessorKey: "customer.name",
        header: "ชื่อลูกค้า",
        cell: (info) => info.getValue() || "-",
        meta: { minWidth: 200, width: 240, align: "left" },
      },
      {
        accessorKey: "requestedAmount",
        header: "จำนวนเงินที่ขอ",
        cell: (info) => {
          const value = info.getValue() as number;
          return new Intl.NumberFormat("th-TH", {
            style: "currency",
            currency: "THB",
          }).format(value);
        },
        meta: { minWidth: 140, width: 160, align: "right" },
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
        meta: { minWidth: 120, width: 140, align: "center" },
      },
      {
        accessorKey: "status",
        header: "สถานะ",
        cell: (info) => {
          const status = info.getValue() as TemporaryCreditStatus;
          return getStatusBadge(status);
        },
        meta: { minWidth: 120, width: 140, align: "center" },
      },
      {
        accessorKey: "requestedBy.name",
        header: "ผู้ขอ",
        cell: (info) => info.getValue() || "-",
        meta: { minWidth: 140, width: 160, align: "left" },
      },
      {
        accessorKey: "requestedAt",
        header: "วันที่ขอ",
        cell: (info) => {
          const value = info.getValue() as Date | string;
          if (!value) return "-";
          const date = typeof value === "string" ? new Date(value) : value;
          return format(date, "dd MMM yyyy HH:mm", { locale: th });
        },
        meta: { minWidth: 140, width: 160, align: "center" },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const item = row.original;
          const isApproved = item.status === "APPROVED";
          const isPending = item.status === "PENDING";

          return (
            <div className="flex items-center justify-end gap-2">
              <Link href={`/temporary-credit-limits/${item.id}`}>
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
              
              {canApprove && isPending && (
                <Link href={`/temporary-credit-limits/${item.id}/approve`}>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                </Link>
              )}

              {canEdit && !isApproved && (
                <Link href={`/temporary-credit-limits/${item.id}/edit`}>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
              )}

              {canDelete && !isApproved && onDelete && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDelete(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        },
        meta: { minWidth: 180, width: 220, align: "right" },
      },
    ];
  }, [canEdit, canDelete, canApprove, onDelete]);
}

export default function TemporaryCreditLimitTable(props: TemporaryCreditLimitTableProps) {
  const {
    data,
    loading,
    pagination,
    searchValue,
    onSearchChange,
    isTyping,
    onSearchSubmit,
    dateRange,
    onDateRangeChange,
    canCreate = false,
    canEdit = false,
    canDelete = false,
    canApprove = false,
    onDelete,
  } = props;

  const columns = useColumns(canEdit, canDelete, canApprove, onDelete);

  return (
    <CustomTable
      columns={columns}
      data={data}
      loading={loading}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      isTyping={isTyping}
      onSearchSubmit={onSearchSubmit}
      dateRange={dateRange}
      onDateRangeChange={onDateRangeChange}
      pagination={
        pagination
          ? {
              page: pagination.page,
              perPage: pagination.perPage,
              total: pagination.total,
              onPageChange: pagination.onPageChange,
              onPerPageChange: pagination.onPerPageChange,
              perPageOptions: pagination.perPageOptions,
            }
          : undefined
      }
      canCreate={canCreate}
      createHref="/temporary-credit-limits/new"
    />
  );
}
