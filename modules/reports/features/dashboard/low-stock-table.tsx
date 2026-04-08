"use client";

import React, { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { CustomTable } from "@/components/custom/custom-table";
import { TableToolbar } from "@/components/custom/table-toolbar";
import { AlertTriangle } from "lucide-react";

interface ProductRecord {
  id: string;
  code: string;
  name: string;
  physicalBalance: number;
  reservedQuantity: number;
  availableQuantity: number;
}

interface LowStockTableProps {
  products: ProductRecord[];
  formatNumber: (num: number) => string;
}

export function LowStockTable({
  products = [],
  formatNumber,
}: LowStockTableProps) {
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
        accessorKey: "physicalBalance",
        header: "คงเหลือจริง",
        meta: {
          width: 140,
          align: "left",
          headerAlign: "left",
        },
        cell: ({ row }) => (
          <span className="font-medium text-slate-700">
            {formatNumber(row.original.physicalBalance)}
          </span>
        ),
      },
      {
        accessorKey: "reservedQuantity",
        header: "จอง",
        meta: {
          width: 120,
          align: "left",
          headerAlign: "left",
        },
        cell: ({ row }) => (
          <span className="font-medium text-amber-600">
            {formatNumber(row.original.reservedQuantity)}
          </span>
        ),
      },
      {
        accessorKey: "availableQuantity",
        header: "พร้อมขาย",
        meta: {
          width: 140,
          align: "left",
          headerAlign: "left",
        },
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={
              row.original.availableQuantity <= 10
                ? "bg-red-100 text-red-800 border-red-300 font-bold"
                : row.original.availableQuantity <= 30
                ? "bg-amber-100 text-amber-800 border-amber-300 font-bold"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }
          >
            {formatNumber(row.original.availableQuantity)}
          </Badge>
        ),
      },
    ],
    [formatNumber]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-red-500" />
          สินค้าใกล้หมด (คงเหลือ &lt; 50)
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

