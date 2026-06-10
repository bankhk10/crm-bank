"use client";

import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  BadgeDollarSign,
  User,
  Calendar,
  CreditCard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PaymentTermLabels } from "@/modules/sales/types";
import type { SaleStatus } from "@/modules/sales/types";
import { SaleStatusBadge } from "../../ui/sale-status-badge";
import type { SaleRecord } from "../../types";

interface SaleCardListProps {
  sales: SaleRecord[];
  loading?: boolean;
  currentUserId?: string;
  canEdit?: boolean;
  canDelete?: boolean;
  canApprove?: boolean;
  canEditItem?: (item: SaleRecord) => boolean;
  canDeleteItem?: (item: SaleRecord) => boolean;
  onDelete?: (sale: SaleRecord) => void;
  // Pagination
  page: number;
  perPage: number;
  total: number;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
}

const paymentTermStyles: Record<string, string> = {
  CREDIT_90: "bg-blue-100 text-blue-800 border-blue-200",
  CASH_7: "bg-emerald-100 text-emerald-800 border-emerald-200",
  PREPAID: "bg-purple-100 text-purple-800 border-purple-200",
  CREDIT_OVER_90: "bg-orange-100 text-orange-800 border-orange-200",
};

function SaleCard({
  sale,
  currentUserId,
  canEdit = false,
  canDelete = false,
  canApprove = false,
  canEditItem,
  canDeleteItem,
  onDelete,
}: {
  sale: SaleRecord;
  currentUserId?: string;
  canEdit?: boolean;
  canDelete?: boolean;
  canApprove?: boolean;
  canEditItem?: (item: SaleRecord) => boolean;
  canDeleteItem?: (item: SaleRecord) => boolean;
  onDelete?: (sale: SaleRecord) => void;
}) {
  const isPending = sale.status === "PENDING";
  const isPendingApproval = sale.status === "PENDING_APPROVAL";
  const isRejected = sale.status === "REJECTED";
  const isWaitingForCorrection = sale.status === "WAITING_FOR_CORRECTION";
  const isCreator = currentUserId && sale.createdById === currentUserId;

  const canEditThis = canEditItem
    ? canEditItem(sale) &&
      (isPending || isPendingApproval || isRejected || isWaitingForCorrection)
    : (canEdit || isCreator) &&
      (isPending || isPendingApproval || isRejected || isWaitingForCorrection);

  const canDeleteThis = canDeleteItem
    ? canDeleteItem(sale) && (isPending || isPendingApproval)
    : (canDelete || isCreator) && (isPending || isPendingApproval);

  const saleDate = sale.saleDate
    ? (() => {
        const date =
          typeof sale.saleDate === "string"
            ? new Date(sale.saleDate)
            : sale.saleDate;
        const year = date.getFullYear() + 543;
        return format(date, `dd MMM ${year}`, { locale: th });
      })()
    : "-";

  const paymentTermLabel =
    PaymentTermLabels[sale.paymentTerm as keyof typeof PaymentTermLabels] ||
    sale.paymentTerm ||
    "-";
  const paymentTermStyle =
    paymentTermStyles[sale.paymentTerm] ||
    "bg-gray-100 text-gray-800 border-gray-200";

  const totalAmountFormatted = new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(sale.totalAmount ?? 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* Card Header */}
      <div className="flex items-start justify-between p-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <BadgeDollarSign className="h-5 w-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">
              {sale.saleNumber || "-"}
            </p>
            {sale.saleOrderRef && (
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {sale.saleOrderRef}
              </p>
            )}
          </div>
        </div>
        <SaleStatusBadge status={sale.status as SaleStatus} />
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-2.5">
        {/* Customer */}
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-700 truncate">
            {sale.customer?.name || "-"}
          </span>
        </div>

        {/* Employee */}
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-300 flex-shrink-0" />
          <span className="text-xs text-gray-500 truncate">
            พนักงานขาย: {sale.employee?.name || "-"}
          </span>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-600">{saleDate}</span>
        </div>

        {/* Payment Term */}
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <Badge
            variant="outline"
            className={cn("text-xs max-w-[200px]", paymentTermStyle)}
          >
            <span className="truncate" title={paymentTermLabel}>
              {paymentTermLabel}
            </span>
          </Badge>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">ยอดรวม</p>
          <p className="font-bold text-base text-gray-900">
            {totalAmountFormatted}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <Link href={`/sales/${sale.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 text-blue-600 border-blue-100 hover:bg-blue-50"
              title="ดูรายละเอียด"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </Link>

          {canEditThis && (
            <Link href={`/sales/${sale.id}/edit`}>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 text-purple-600 border-purple-100 hover:bg-purple-50"
                title="แก้ไข"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
          )}

          {canApprove && (isPending || isPendingApproval) && (
            <Link href={`/sales/${sale.id}/approve`}>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 text-green-600 border-green-100 hover:bg-green-50"
                title="อนุมัติ"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            </Link>
          )}

          {canDeleteThis && onDelete && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 text-red-600 border-red-100 hover:bg-red-50"
              title="ลบ"
              onClick={() => onDelete(sale)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-pulse">
      <div className="flex items-start justify-between p-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-gray-200" />
          <div className="space-y-1.5">
            <div className="h-4 w-28 bg-gray-200 rounded" />
            <div className="h-3 w-20 bg-gray-100 rounded" />
          </div>
        </div>
        <div className="h-6 w-20 bg-gray-200 rounded-full" />
      </div>
      <div className="p-4 space-y-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-4 w-4 bg-gray-200 rounded flex-shrink-0" />
            <div className="h-3.5 bg-gray-100 rounded w-full" />
          </div>
        ))}
      </div>
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-3 w-10 bg-gray-200 rounded" />
          <div className="h-5 w-24 bg-gray-200 rounded" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-8 w-8 bg-gray-200 rounded" />
          <div className="h-8 w-8 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export function SaleCardList({
  sales,
  loading,
  currentUserId,
  canEdit,
  canDelete,
  canApprove,
  canEditItem,
  canDeleteItem,
  onDelete,
  page,
  perPage,
  total,
  onPageChange,
  onPerPageChange,
}: SaleCardListProps) {
  const totalPages = Math.ceil(total / perPage);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!sales || sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <BadgeDollarSign className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-600 font-medium">ยังไม่มีรายการขาย</p>
        <p className="text-gray-400 text-sm mt-1">
          ลองปรับเงื่อนไขการค้นหา หรือสร้างรายการขายใหม่
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sales.map((sale) => (
          <SaleCard
            key={sale.id}
            sale={sale}
            currentUserId={currentUserId}
            canEdit={canEdit}
            canDelete={canDelete}
            canApprove={canApprove}
            canEditItem={canEditItem}
            canDeleteItem={canDeleteItem}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-sm text-gray-500">
            แสดง {(page - 1) * perPage + 1}–
            {Math.min(page * perPage, total)} จาก {total} รายการ
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              className="h-9 px-3"
            >
              ก่อนหน้า
            </Button>
            <span className="text-sm text-gray-700 px-2">
              หน้า {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              className="h-9 px-3"
            >
              ถัดไป
            </Button>
          </div>
        </div>
      )}

      {/* Per Page Selector */}
      {total > 10 && (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <span>แสดง</span>
          {[10, 20, 30].map((n) => (
            <button
              key={n}
              onClick={() => {
                onPerPageChange?.(n);
                onPageChange?.(1);
              }}
              className={cn(
                "px-2.5 py-1 rounded-md border text-sm transition-colors",
                perPage === n
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
              )}
            >
              {n}
            </button>
          ))}
          <span>รายการ/หน้า</span>
        </div>
      )}
    </div>
  );
}
