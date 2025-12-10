"use client";

import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Eye, Pencil, Trash2, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";

import type { SaleWithRelations } from "@/types/sales";
import { SaleStatusLabels, PaymentTermLabels, getSaleStatusColor } from "@/types/sales";
import { CustomTable } from "@/components/custom/custom-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type SaleRecord = SaleWithRelations;

interface SalesTableProps {
  sales: SaleRecord[];
  total: number;
  page: number;
  perPage: number;
  loading?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  isTyping?: boolean;
  onSearchSubmit?: () => void;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  onDelete?: (sale: SaleRecord) => void;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canApprove?: boolean;
}

export function SalesTable({
  sales,
  total,
  page,
  perPage,
  loading,
  searchValue,
  onSearchChange,
  isTyping,
  onSearchSubmit,
  onPageChange,
  onPerPageChange,
  onDelete,
  canCreate = false,
  canEdit = false,
  canDelete = false,
  canApprove = false,
}: SalesTableProps) {
  const columns: ColumnDef<SaleRecord>[] = [
    {
      accessorKey: "saleNumber",
      header: "เลขที่ใบขาย",
      cell: ({ row }) => (
        <Link
          href={`/sales/${row.original.id}`}
          className="font-medium text-blue-600 hover:underline"
        >
          {row.original.saleNumber}
        </Link>
      ),
    },
    {
      accessorKey: "customer",
      header: "ลูกค้า",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.customer.name}</div>
          <div className="text-xs text-gray-500">
            {row.original.customer.customerCode}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "employee",
      header: "พนักงานขาย",
      cell: ({ row }) => row.original.employee.name,
    },
    {
      accessorKey: "saleDate",
      header: "วันที่ขาย",
      cell: ({ row }) =>
        format(new Date(row.original.saleDate), "dd MMM yyyy", { locale: th }),
    },
    {
      accessorKey: "totalAmount",
      header: "ยอดรวม",
      cell: ({ row }) => (
        <div className=" font-medium">
          ฿{Number(row.original.totalAmount).toLocaleString("th-TH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      ),
    },
    {
      accessorKey: "paymentTerm",
      header: "เงื่อนไขชำระ",
      cell: ({ row }) => (
        <Badge variant="outline">
          {PaymentTermLabels[row.original.paymentTerm]}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "สถานะ",
      cell: ({ row }) => (
        <Badge className={getSaleStatusColor(row.original.status)}>
          {SaleStatusLabels[row.original.status]}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "จัดการ",
      cell: ({ row }) => {
        const sale = row.original;
        const canEditThis = canEdit && sale.status === "PENDING";
        const canApproveThis = canApprove && sale.status === "PENDING";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">เปิดเมนู</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>การจัดการ</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/sales/${sale.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  ดูรายละเอียด
                </Link>
              </DropdownMenuItem>
              {canEditThis && (
                <DropdownMenuItem asChild>
                  <Link href={`/sales/${sale.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    แก้ไข
                  </Link>
                </DropdownMenuItem>
              )}
              {canApproveThis && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href={`/sales/${sale.id}/approve`}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      อนุมัติ
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/sales/${sale.id}/approve`}>
                      <XCircle className="mr-2 h-4 w-4" />
                      ไม่อนุมัติ
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              {canDelete && sale.status === "PENDING" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete?.(sale)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    ลบ
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <CustomTable
      columns={columns}
      data={sales}
      loading={loading}
      canCreate={canCreate}
      createHref="/sales/new"
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      isTyping={isTyping}
      onSearchSubmit={onSearchSubmit}
      pagination={{
        page,
        perPage,
        total,
        onPageChange: onPageChange || (() => { }),
        onPerPageChange: onPerPageChange || (() => { }),
      }}
      emptyState={{
        title: "ไม่พบข้อมูลรายการขาย",
        description: "เริ่มต้นสร้างรายการขายใหม่ได้เลย",
      }}
    />
  );
}
