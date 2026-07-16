import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PackageSearch, Search } from "lucide-react";
import CustomTable from "@/components/custom/custom-table";
import { TruncatedCell } from "@/components/custom/truncated-cell";

interface ProductForecastRow {
  productId: string;
  productCode: string;
  productName: string;
  tradeNameGroup: string | null;
  totalAmount: number;
  totalQuantity: number;
  totalVolume: number;
}

interface ProductForecastSectionProps {
  data: ProductForecastRow[];
  formatCurrency: (value: number) => string;
  loading: boolean;
  error: string | null;
}

export const ProductForecastSection = ({
  data,
  formatCurrency,
  loading,
  error,
}: ProductForecastSectionProps) => {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return data;
    return data.filter(
      (row) =>
        row.productName.toLowerCase().includes(search) ||
        row.productCode.toLowerCase().includes(search) ||
        row.tradeNameGroup?.toLowerCase().includes(search),
    );
  }, [data, query]);

  const totalItems = filtered.length;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page, perPage]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const paginationInfo = {
    page,
    perPage,
    total: totalItems,
    onPageChange: setPage,
    onPerPageChange: (n: number) => {
      setPerPage(n);
      setPage(1);
    },
    perPageOptions: [5, 10, 20, 50],
  };

  const columns = useMemo<ColumnDef<ProductForecastRow>[]>(
    () => [
      {
        accessorKey: "productCode",
        header: "รหัสสินค้า",
        meta: {
          headerAlign: "left",
          align: "left",
          minWidth: 100,
          width: 120,
        },
        cell: ({ row }) => (
          <span className="rounded bg-teal-100 px-2 py-0.5 text-xs font-mono text-teal-700">
            {row.original.productCode}
          </span>
        ),
      },
      {
        accessorKey: "tradeNameGroup",
        header: "กลุ่มชื่อการค้า",
        meta: {
          headerAlign: "left",
          align: "left",
          minWidth: 150,
          width: 180,
        },
        cell: ({ row }) =>
          row.original.tradeNameGroup ? (
            <TruncatedCell
              value={row.original.tradeNameGroup}
              className="font-medium text-slate-600"
            />
          ) : (
            <span className="text-slate-400">-</span>
          ),
      },
      {
        accessorKey: "productName",
        header: "ชื่อสินค้า",
        meta: {
          headerAlign: "left",
          align: "left",
          minWidth: 200,
          width: 300,
        },
        cell: ({ row }) => (
          <TruncatedCell
            value={row.original.productName}
            className="font-medium text-slate-900"
          />
        ),
      },
      {
        accessorKey: "totalAmount",
        header: "ยอดคาดการณ์",
        meta: {
          headerAlign: "right",
          align: "right",
          minWidth: 140,
          width: 160,
        },
        cell: ({ row }) => (
          <span className="font-semibold text-teal-700">
            {formatCurrency(row.original.totalAmount)}
          </span>
        ),
      },
      {
        accessorKey: "totalQuantity",
        header: "จำนวนสินค้า",
        meta: {
          headerAlign: "right",
          align: "right",
          minWidth: 120,
          width: 140,
        },
        cell: ({ row }) => (
          <span className="text-slate-600">
            {row.original.totalQuantity.toLocaleString()} รายการ
          </span>
        ),
      },
      {
        accessorKey: "totalVolume",
        header: "ปริมาณรวม",
        meta: {
          headerAlign: "right",
          align: "right",
          minWidth: 140,
          width: 160,
        },
        cell: ({ row }) =>
          row.original.totalVolume > 0 ? (
            <span className="text-slate-600">
              {row.original.totalVolume.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              ลิตร/กก.
            </span>
          ) : (
            <span className="text-slate-400">-</span>
          ),
      },
    ],
    [formatCurrency],
  );

  return (
    <Card className="overflow-hidden rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100">
              <PackageSearch className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <CardTitle>ยอดคาดการณ์รายสินค้า</CardTitle>
              <p className="text-sm text-slate-500">
                รายการยอดคาดการณ์ตามสินค้า
              </p>
            </div>
          </div>
          <div className="relative w-full sm:w-[260px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder="ค้นหาสินค้า..."
              className="h-10 rounded-xl pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
            {error}
          </div>
        ) : (
          <div className="w-full">
            <CustomTable
              columns={columns}
              data={paginatedData}
              loading={loading}
              pagination={paginationInfo}
              toolbar={<></>}
              emptyState={{
                title: "ไม่พบข้อมูลคาดการณ์รายสินค้า",
                description: "ลองปรับคำค้นหาใหม่",
              }}
              className="w-full"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
