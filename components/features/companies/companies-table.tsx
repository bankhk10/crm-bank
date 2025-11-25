"use client";

import * as React from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2 } from "lucide-react";
import Tooltip from "@/components/ui/tooltip";
import CustomTable from "@/components/custom/custom-table";

export type CompanyRecord = {
  id: string;
  name: string;
  shortName?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  status?: string;
  createdAt?: string;
};

export type CompaniesPagination = {
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  perPageOptions?: number[];
};

export interface CompaniesTableProps {
  data: CompanyRecord[];
  loading?: boolean;
  canCreate: boolean;
  canDelete: boolean;
  onDeleteRequest: (company: CompanyRecord) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  isTyping?: boolean;
  onSearchSubmit?: () => void;
  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange | undefined) => void;
  pagination: CompaniesPagination;
}

const thaiDateFormatter = new Intl.DateTimeFormat("th-TH", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function useCompanyColumns(
  onDeleteRequest: (company: CompanyRecord) => void,
  canDelete: boolean
) {
  return React.useMemo<ColumnDef<CompanyRecord>[]>(
    () => [
      {
        accessorKey: "name",
        header: "บริษัท",
        meta: {
          headerAlign: "left",
          minWidth: 180,
          width: 250,
          maxWidth: 400,
          align: "left",
        },
        cell: ({ row }) => row.original.name ?? "-",
      },
      {
        accessorKey: "email",
        header: "อีเมล",
        meta: {
          headerAlign: "left",
          minWidth: 160,
          width: 220,
          maxWidth: 320,
          align: "left",
        },
        cell: ({ row }) => row.original.email ?? "-",
      },
      {
        accessorKey: "phone",
        header: "โทรศัพท์",
        meta: {
          headerAlign: "left",
          minWidth: 120,
          width: 140,
          maxWidth: 180,
          align: "left",
        },
        cell: ({ row }) => row.original.phone ?? "-",
      },
      {
        accessorKey: "status",
        header: "สถานะ",
        meta: {
          headerAlign: "center",
          minWidth: 140,
          width: 140,
          maxWidth: 140,
          align: "center",
        },
        cell: ({ row }) => {
          const s = (row.original.status || "").toString().toUpperCase();
          const map: Record<string, { label: string; className: string }> = {
            ACTIVE: {
              label: "ใช้งาน",
              className: "bg-emerald-100 text-emerald-800",
            },
            INACTIVE: {
              label: "ไม่ได้ใช้งาน",
              className: "bg-gray-100 text-gray-800",
            },
          };
          const info = map[s] ?? {
            label: s || "-",
            className: "bg-gray-100 text-gray-800",
          };

          if (!s) return "-";

          return (
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${info.className}`}
            >
              {info.label}
            </span>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "สร้างเมื่อ",
        meta: {
          headerAlign: "center",
          minWidth: 120,
          width: 160,
          maxWidth: 220,
          align: "center",
        },
        cell: ({ row }) =>
          row.original.createdAt
            ? thaiDateFormatter.format(new Date(row.original.createdAt))
            : "-",
      },
      {
        id: "actions",
        header: "",
        meta: {
          headerAlign: "right",
          minWidth: 120,
          width: 140,
          maxWidth: 180,
          align: "right",
        },
        cell: ({ row }) => {
          const company = row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              <Tooltip content={`ดู ${company.name}`} side="top">
                <Button
                  asChild
                  size="icon-sm"
                  variant="outline"
                  className="text-blue-600 border-blue-100 hover:bg-blue-50 rounded-md"
                  aria-label={`ดู ${company.name}`}
                >
                  <Link href={`/companies/${company.id}`}>
                    <Eye className="size-4 text-blue-600" />
                  </Link>
                </Button>
              </Tooltip>

              <Tooltip content={`แก้ไข ${company.name}`} side="top">
                <Button
                  asChild
                  size="icon-sm"
                  variant="outline"
                  className="text-purple-600 border-purple-100 hover:bg-purple-50 rounded-md"
                  aria-label={`แก้ไข ${company.name}`}
                >
                  <Link href={`/companies/${company.id}/edit`}>
                    <Edit className="size-4 text-purple-600" />
                  </Link>
                </Button>
              </Tooltip>

              {canDelete && (
                <Tooltip content={`ลบ ${company.name}`} side="top">
                  <Button
                    variant="destructive"
                    size="icon-sm"
                    className="bg-red-50 text-red-600 hover:bg-red-100 rounded-md"
                    onClick={() => onDeleteRequest(company)}
                    aria-label={`ลบ ${company.name}`}
                  >
                    <Trash2 className="size-4 text-red-600" />
                  </Button>
                </Tooltip>
              )}
            </div>
          );
        },
      },
    ],
    [canDelete, onDeleteRequest]
  );
}



export function CompaniesTable(props: CompaniesTableProps) {
  const {
    data,
    loading,
    canCreate,
    canDelete,
    onDeleteRequest,
    searchValue,
    onSearchChange,
    dateRange,
    onDateRangeChange,
    pagination,
  } = props;

  const columns = useCompanyColumns(onDeleteRequest, canDelete);
  return (
    <CustomTable
      columns={columns}
      data={data}
      loading={loading}
      canCreate={canCreate}
      createHref="/companies/new"
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      isTyping={false}
      onSearchSubmit={undefined}
      dateRange={dateRange}
      onDateRangeChange={onDateRangeChange}
      pagination={pagination}
      emptyState={{
        title: "ยังไม่มีบริษัท",
        description: "ลองปรับเงื่อนไขการค้นหา หรือสร้างบริษัทใหม่",
        action: canCreate ? (
          <Link href="/companies/new">
            <Button size="sm">สร้างบริษัทใหม่</Button>
          </Link>
        ) : undefined,
      }}
      className="w-full"
    />
  );
}
