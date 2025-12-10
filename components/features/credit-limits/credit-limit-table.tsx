"use client";

import * as React from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { CustomTable } from "@/components/custom/custom-table";

export type CustomerRecord = {
  id: string;
  customerCode: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  creditLimits?: Array<{
    id: string;
    limitAmount: number;
    promoAmount?: number;
  }>;
  temporaryCreditLimits?: Array<{
    id: string;
    requestedAmount: number;
    status: string;
    expiryDate: Date | string;
  }>;
};

export interface CustomersCreditTableProps {
  data: CustomerRecord[];
  loading?: boolean;
  pagination?: {
    page: number;
    perPage: number;
    total: number;
    onPageChange: (p: number) => void;
    onPerPageChange: (n: number) => void;
    perPageOptions?: number[];
  };
  // search helpers
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  isTyping?: boolean;
  onSearchSubmit?: () => void;
  dateRange?: any;
  onDateRangeChange?: (range: any) => void;
}

function useColumns() {
  return React.useMemo<ColumnDef<CustomerRecord>[]>(() => {
    return [
      {
        accessorKey: "customerCode",
        header: "รหัสลูกค้า",
        cell: (info) => info.getValue() || "-",
        meta: { minWidth: 120, width: 140, align: "left" },
      },
      {
        accessorKey: "name",
        header: "ชื่อลูกค้า",
        cell: (info) => info.getValue() || "-",
        meta: { minWidth: 200, width: 200, align: "left" },
      },
      {
        id: "creditLimit",
        header: "วงเงินเครดิตคงเหลือ",
        cell: ({ row }) => {
          const r = row.original;
          const cl = r.creditLimits && r.creditLimits[0];

          if (!cl) return "-";

          let totalLimit = cl.limitAmount;

          // เพิ่มวงเงินชั่วคราวที่ APPROVED และยังไม่หมดอายุ
          const tempLimits = r.temporaryCreditLimits || [];
          const approvedLimits = tempLimits.filter(temp => temp.status === "APPROVED");

          if (approvedLimits.length > 0) {
            // เอารายการล่าสุด
            const latestTemp = approvedLimits.sort((a, b) => {
              const dateA = new Date(a.expiryDate).getTime();
              const dateB = new Date(b.expiryDate).getTime();
              return dateB - dateA;
            })[0];

            const expiryDate = new Date(latestTemp.expiryDate);
            const now = new Date();

            // ถ้ายังไม่หมดอายุ เพิ่มวงเงินชั่วคราว
            if (expiryDate >= now) {
              totalLimit = totalLimit + Number(latestTemp.requestedAmount);
            }
          }

          return new Intl.NumberFormat("th-TH", {
            style: "currency",
            currency: "THB",
          }).format(totalLimit);
        },
        meta: { minWidth: 170, width: 170, align: "center" },
      },
      {
        id: "promoAmount",
        header: "วงเงินส่งเสริมการขาย",
        cell: ({ row }) => {
          const r = row.original;
          const cl = r.creditLimits && r.creditLimits[0];
          if (!cl || cl.promoAmount === undefined || cl.promoAmount === null)
            return "-";
          const v = Number((cl as any).promoAmount);
          return Number.isFinite(v)
            ? new Intl.NumberFormat("th-TH", {
              style: "currency",
              currency: "THB",
            }).format(v)
            : "-";
        },
        meta: { minWidth: 180, width: 180, align: "center" },
      },
      {
        id: "temporaryCreditLimits",
        header: "วงเงินเครดิตชั่วคราว",
        cell: ({ row }) => {
          const r = row.original;
          const tempLimits = r.temporaryCreditLimits || [];

          // หารายการล่าสุดที่ APPROVED
          const approvedLimits = tempLimits
            .filter(temp => temp.status === "APPROVED")
            .sort((a, b) => {
              const dateA = new Date(a.expiryDate).getTime();
              const dateB = new Date(b.expiryDate).getTime();
              return dateB - dateA; // เรียงจากใหม่ไปเก่า
            });

          if (approvedLimits.length === 0) {
            return new Intl.NumberFormat("th-TH", {
              style: "currency",
              currency: "THB",
            }).format(0);
          }

          // เอารายการล่าสุด
          const latestTemp = approvedLimits[0];
          const expiryDate = new Date(latestTemp.expiryDate);
          const now = new Date();

          // ถ้าหมดอายุแล้ว แสดง 0
          if (expiryDate < now) {
            return (
              <div className="text-sm">
                <span className="font-medium text-gray-400">
                  {new Intl.NumberFormat("th-TH", {
                    style: "currency",
                    currency: "THB",
                  }).format(0)}
                </span>
                <span className="ml-2 text-xs text-red-600">(หมดอายุ)</span>
              </div>
            );
          }

          // ถ้ายังไม่หมดอายุ แสดงจำนวนเงิน
          return (
            <div className="text-sm">
              <span className="font-medium text-green-600">
                {new Intl.NumberFormat("th-TH", {
                  style: "currency",
                  currency: "THB",
                }).format(Number(latestTemp.requestedAmount))}
              </span>
              <div className="text-xs text-gray-500 mt-1">
                หมดอายุ: {expiryDate.toLocaleDateString("th-TH")}
              </div>
            </div>
          );
        },
        meta: { minWidth: 170, width: 170, align: "center" },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const r = row.original;
          const cl = r.creditLimits && r.creditLimits[0];
          const href = cl
            ? `/credit-limits/${cl.id}/edit`
            : `/credit-limits/new?customerId=${r.id}`;
          return (
            <div className="flex items-center justify-end gap-2">
              <Link href={href}>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <span className="inline-flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    แก้ไขวงเงิน
                  </span>
                </Button>
              </Link>
            </div>
          );
        },
        meta: { minWidth: 130, width: 130, align: "right" },
      },
    ];
  }, []);
}

export default function CustomersCreditTable(props: CustomersCreditTableProps) {
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
  } = props;
  const columns = useColumns();

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
      canCreate={false}
      createHref=""
    />
  );
}

export { useColumns as useCustomersCreditColumns };
