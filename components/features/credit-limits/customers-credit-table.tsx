"use client";

import * as React from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Eye, Edit } from "lucide-react";
import { CustomTable } from "@/components/custom/custom-table";

export type CustomerRecord = {
  id: string;
  customerCode: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  creditLimits?: Array<{ id: string; limitAmount: number }>; // latest included
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
        meta: { minWidth: 200, width: 260, align: "left" },
      },
      {
        accessorKey: "phone",
        header: "โทรศัพท์",
        cell: (info) => info.getValue() || "-",
        meta: { minWidth: 140, width: 160, align: "left" },
      },
      {
        id: "creditLimit",
        header: "วงเงินล่าสุด",
        cell: ({ row }) => {
          const r = row.original;
          const cl = r.creditLimits && r.creditLimits[0];
          return cl ? new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(cl.limitAmount) : "-";
        },
        meta: { minWidth: 140, width: 180, align: "right" },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const r = row.original;
          const cl = r.creditLimits && r.creditLimits[0];
          const href = cl ? `/credit-limits/${cl.id}/edit` : `/credit-limits/new?customerId=${r.id}`;
          return (
            <div className="flex items-center justify-end gap-2">
              <Link href={href}>
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                  <span className="inline-flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    แก้ไขวงเงิน
                  </span>
                </Button>
              </Link>
            </div>
          );
        },
        meta: { minWidth: 160, width: 200, align: "right" },
      },
    ];
  }, []);
}

export default function CustomersCreditTable(props: CustomersCreditTableProps) {
  const { data, loading, pagination } = props;
  const columns = useColumns();

  return (
    <CustomTable
      columns={columns}
      data={data}
      loading={loading}
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
