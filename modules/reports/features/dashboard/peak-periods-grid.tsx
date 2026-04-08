"use client";

import React, { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { CustomTable } from "@/components/custom/custom-table";
import { TableToolbar } from "@/components/custom/table-toolbar";
import { Clock } from "lucide-react";

interface PeakPeriodRecord {
  productId: string;
  productName: string;
  peakMonth: string;
  peakSales: number;
}

interface PeakPeriodsGridProps {
  peakPeriods: PeakPeriodRecord[];
  formatTHB: (amount: number) => string;
}

export function PeakPeriodsGrid({
  peakPeriods = [],
  formatTHB,
}: PeakPeriodsGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const filteredPeriods = useMemo(() => {
    if (!searchQuery.trim()) return peakPeriods;
    const lowerQuery = searchQuery.toLowerCase().trim();
    return peakPeriods.filter((p) =>
      p.productName.toLowerCase().includes(lowerQuery)
    );
  }, [peakPeriods, searchQuery]);

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredPeriods.slice(start, start + perPage);
  }, [filteredPeriods, page, perPage]);

  const columns = useMemo<ColumnDef<PeakPeriodRecord>[]>(
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
                ? "bg-blue-100 text-blue-800 border-blue-300 font-bold"
                : "font-medium text-slate-600"
            }
          >
            {row.index + 1 + (page - 1) * perPage}
          </Badge>
        ),
      },
      {
        accessorKey: "productName",
        header: "ชื่อสินค้า",
        meta: {
          minWidth: 200,
          align: "left",
          headerAlign: "left",
        },
        cell: ({ row }) => (
          <span className="font-semibold text-slate-900">
            {row.original.productName}
          </span>
        ),
      },
      {
        accessorKey: "peakMonth",
        header: "ช่วงเวลาที่ขายดีที่สุด",
        meta: {
          width: 200,
          align: "left",
          headerAlign: "left",
        },
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            {row.original.peakMonth}
          </Badge>
        ),
      },
      {
        accessorKey: "peakSales",
        header: "ยอดขายสูงสุด",
        meta: {
          width: 180,
          align: "left",
          headerAlign: "left",
        },
        cell: ({ row }) => (
          <span className="font-bold text-rose-600 transition-colors">
            {formatTHB(row.original.peakSales)}
          </span>
        ),
      },
    ],
    [searchQuery, formatTHB, page, perPage]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Clock className="h-6 w-6 text-blue-500" />
          ช่วงเวลาขายดีที่สุดของสินค้า (ตามช่วงเวลาที่เลือก)
        </h2>
      </div>

      <TableToolbar
        searchPlaceholder="ค้นหาชื่อสินค้า..."
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
            total: filteredPeriods.length,
            onPageChange: setPage,
            onPerPageChange: setPerPage,
            perPageOptions: [10, 20, 50],
          }}
        />
      </div>
    </div>
  );
}

