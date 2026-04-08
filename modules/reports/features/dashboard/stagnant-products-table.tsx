"use client";

import React, { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { CustomTable } from "@/components/custom/custom-table";
import { TableToolbar } from "@/components/custom/table-toolbar";
import { Archive } from "lucide-react";

interface ProductRecord {
  id: string;
  code: string;
  name: string;
  stock: number;
  daysSinceLastSale: number;
  lastSoldDate?: string | null;
}

interface StagnantProductsTableProps {
  products: ProductRecord[];
  formatNumber: (num: number) => string;
}

export function StagnantProductsTable({
  products = [],
  formatNumber,
}: StagnantProductsTableProps) {
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
        accessorKey: "stock",
        header: "สต๊อกคงเหลือ",
        meta: {
          width: 140,
          align: "left",
          headerAlign: "left",
        },
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 border-purple-200"
          >
            {formatNumber(row.original.stock)}
          </Badge>
        ),
      },
      {
        accessorKey: "daysSinceLastSale",
        header: "จำนวนวัน",
        meta: {
          width: 150,
          align: "left",
          headerAlign: "left",
        },
        cell: ({ row }) => (
          <span className="text-rose-600 font-bold">
            {row.original.daysSinceLastSale === 999
              ? "ไม่เคยขาย"
              : `${row.original.daysSinceLastSale} วัน`}
          </span>
        ),
      },
      {
        accessorKey: "lastSoldDate",
        header: "ขายล่าสุด",
        meta: {
          width: 160,
          align: "left",
          headerAlign: "left",
        },
        cell: ({ row }) => (
          <span className="text-slate-500 font-medium">
            {row.original.lastSoldDate || "-"}
          </span>
        ),
      },
    ],
    [formatNumber]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Archive className="h-6 w-6 text-purple-500" />
          สินค้าค้างสต๊อก (ไม่มียอดขายใน 90 วัน)
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

