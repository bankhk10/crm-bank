"use client";

import React, { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { CustomTable } from "@/components/custom/custom-table";
import { TableToolbar } from "@/components/custom/table-toolbar";
import { Layers } from "lucide-react";

interface GroupRecord {
  group: string;
  totalSales: number;
  totalQuantity: number;
  totalVolumeLiters: number;
  orderCount: number;
  productCount: number;
  avgSalesPerProduct: number;
}

interface GroupPerformanceTableProps {
  groups: GroupRecord[];
  volumeUnit: string;
  formatTHB: (amount: number) => string;
  formatNumber: (num: number) => string;
  formatVolume: (v: number) => string;
}

export function GroupPerformanceTable({
  groups = [],
  volumeUnit,
  formatTHB,
  formatNumber,
  formatVolume,
}: GroupPerformanceTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const lowerQuery = searchQuery.toLowerCase().trim();
    return groups.filter((g) => g.group.toLowerCase().includes(lowerQuery));
  }, [groups, searchQuery]);

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredGroups.slice(start, start + perPage);
  }, [filteredGroups, page, perPage]);

  const columns = useMemo<ColumnDef<GroupRecord>[]>(
    () => [
      {
        id: "index",
        header: "ลำดับ",
        meta: {
          width: 70,
          align: "center",
          headerAlign: "center",
        },
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={
              row.index + (page - 1) * perPage < 3 && !searchQuery
                ? "bg-indigo-100 text-indigo-800 border-indigo-300 font-bold"
                : "font-medium text-slate-600"
            }
          >
            {row.index + 1 + (page - 1) * perPage}
          </Badge>
        ),
      },
      {
        accessorKey: "group",
        header: "กลุ่มสินค้า",
        meta: {
          minWidth: 200,
          align: "left",
          headerAlign: "left",
        },
        cell: ({ row }) => (
          <span className="font-semibold text-slate-900 leading-tight">
            {row.original.group}
          </span>
        ),
      },
      {
        accessorKey: "totalSales",
        header: "ยอดขาย",
        meta: {
          width: 150,
          align: "left",
          headerAlign: "left",
        },
        cell: ({ row }) => (
          <span className="font-bold text-rose-600">
            {formatTHB(row.original.totalSales)}
          </span>
        ),
      },
      {
        accessorKey: "totalQuantity",
        header: "จำนวนที่ขาย",
        meta: {
          width: 130,
          align: "left",
          headerAlign: "left",
        },
        cell: ({ row }) => (
          <span className="font-medium text-slate-700">
            {formatNumber(row.original.totalQuantity)}
          </span>
        ),
      },
      {
        accessorKey: "orderCount",
        header: "จำนวนออเดอร์",
        meta: {
          width: 130,
          align: "left",
          headerAlign: "left",
        },
        cell: ({ row }) => (
          <span className="font-medium text-slate-600">
            {formatNumber(row.original.orderCount)}
          </span>
        ),
      },
      {
        accessorKey: "totalVolumeLiters",
        header: `ขนาดบรรจุรวมที่ขายได้ (${volumeUnit})`,
        meta: {
          width: 200,
          align: "left",
          headerAlign: "left",
        },
        cell: ({ row }) => (
          <span className="font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
            {formatVolume(row.original.totalVolumeLiters)} {volumeUnit}
          </span>
        ),
      },
    ],
    [searchQuery, formatTHB, formatNumber, formatVolume, volumeUnit, page, perPage]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Layers className="h-6 w-6 text-indigo-500" />
          ข้อมูลการขายแยกตามกลุ่มสินค้า (ตามช่วงเวลาที่เลือก)
        </h2>
      </div>

      <TableToolbar
        searchPlaceholder="ค้นหากลุ่มสินค้า..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        className="bg-white/80 backdrop-blur-sm border-slate-200"
      />

      <div className="relative rounded-xl border border-slate-200 shadow-sm bg-white overflow-hidden">
        <CustomTable
          columns={columns}
          data={paginatedData}
          loading={false}
          className="border-none"
          pagination={{
            page,
            perPage,
            total: filteredGroups.length,
            onPageChange: setPage,
            onPerPageChange: setPerPage,
            perPageOptions: [10, 20, 50],
          }}
        />
      </div>
    </div>
  );
}

