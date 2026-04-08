"use client";

import React, { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { CustomTable } from "@/components/custom/custom-table";
import { TableToolbar } from "@/components/custom/table-toolbar";
import { TrendingDown } from "lucide-react";

interface ProductRecord {
  id: string;
  code: string;
  name: string;
  productGroup: string | null;
  totalSales: number;
  totalQuantity: number;
  totalVolumeLiters: number;
  totalPackageSold: number;
  packageUnit: string;
  packageSizeUnit: string;
  orderCount: number;
}

interface SlowProductsTableProps {
  products: ProductRecord[];
  volumeUnit: string;
  formatTHB: (amount: number) => string;
  formatNumber: (num: number) => string;
  formatVolume: (v: number) => string;
  formatPackSize: (value: number, unit?: string) => string;
}

export function SlowProductsTable({
  products,
  formatTHB,
  formatNumber,
  formatPackSize,
}: SlowProductsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const lowerQuery = searchQuery.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.code.toLowerCase().includes(lowerQuery)
    );
  }, [products, searchQuery]);

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredProducts.slice(start, start + perPage);
  }, [filteredProducts, page, perPage]);

  const columns = useMemo<ColumnDef<ProductRecord>[]>(
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
                ? "bg-amber-100 text-amber-800 border-amber-300 font-bold"
                : "font-medium text-slate-600"
            }
          >
            {row.index + 1 + (page - 1) * perPage}
          </Badge>
        ),
      },
      {
        accessorKey: "name",
        header: "สินค้า",
        meta: {
          minWidth: 200,
          align: "left",
          headerAlign: "left",
        },
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 leading-tight">
              {row.original.name}
            </span>
            <span className="text-xs text-slate-500 font-mono mt-0.5">
              {row.original.code}
            </span>
          </div>
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
          <span className="font-bold text-amber-600">
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
        accessorKey: "totalPackageSold",
        header: "ขนาดบรรจุรวมที่ขายได้",
        meta: {
          width: 180,
          align: "left",
          headerAlign: "left",
        },
        cell: ({ row }) => (
          <span className="font-medium text-amber-700">
            {formatPackSize(
              row.original.totalPackageSold,
              row.original.packageUnit
            )}
          </span>
        ),
      },
      {
        accessorKey: "orderCount",
        header: "จำนวนออเดอร์",
        meta: {
          width: 150,
          align: "left",
          headerAlign: "left",
        },
        cell: ({ row }) => (
          <span className="font-medium text-slate-600">
            {row.original.orderCount}
          </span>
        ),
      },
    ],
    [searchQuery, formatTHB, formatNumber, formatPackSize, page, perPage]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <TrendingDown className="h-6 w-6 text-amber-500" />
          สินค้าขายช้า (ตามช่วงเวลาที่เลือก)
        </h2>
      </div>

      <TableToolbar
        searchPlaceholder="ค้นหารหัสสินค้า, ชื่อสินค้า..."
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
            total: filteredProducts.length,
            onPageChange: setPage,
            onPerPageChange: setPerPage,
            perPageOptions: [10, 20, 50],
          }}
        />
      </div>
    </div>
  );
}
