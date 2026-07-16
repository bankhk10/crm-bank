import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Layers, Search } from "lucide-react";
import CustomTable from "@/components/custom/custom-table";
import { TruncatedCell } from "@/components/custom/truncated-cell";

interface TradeNameForecastRow {
  tradeNameGroup: string;
  label: string;
  totalAmount: number;
  totalQuantity: number;
}

interface TradeNameForecastSectionProps {
  data: TradeNameForecastRow[];
  formatCurrency: (value: number) => string;
  loading: boolean;
  error: string | null;
}

export const TradeNameForecastSection = ({
  data,
  formatCurrency,
  loading,
  error,
}: TradeNameForecastSectionProps) => {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return data;
    return data.filter(
      (row) =>
        row.label.toLowerCase().includes(search) ||
        row.tradeNameGroup.toLowerCase().includes(search),
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

  const columns = useMemo<ColumnDef<TradeNameForecastRow>[]>(
    () => [
      {
        accessorKey: "label",
        header: "กลุ่มชื่อการค้า",
        meta: {
          headerAlign: "left",
          align: "left",
          minWidth: 200,
          width: 300,
        },
        cell: ({ row }) => (
          <TruncatedCell
            value={row.original.label}
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
          minWidth: 150,
          width: 200,
        },
        cell: ({ row }) => (
          <span className="font-semibold text-purple-700">
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
          width: 150,
        },
        cell: ({ row }) => (
          <span className="text-slate-600">
            {row.original.totalQuantity.toLocaleString()} รายการ
          </span>
        ),
      },
    ],
    [formatCurrency],
  );

  return (
    <Card className="overflow-hidden rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-lg">
      <CardHeader className="border-b border-slate-100 mt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-100 to-violet-100">
              <Layers className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <CardTitle>ยอดคาดการณ์ตามกลุ่มชื่อการค้า</CardTitle>
              <p className="text-sm text-slate-500">
                ภาพรวมยอดคาดการณ์ตามกลุ่มชื่อการค้า
              </p>
            </div>
          </div>
          <div className="relative w-full sm:w-[260px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder="ค้นหากลุ่มชื่อการค้า..."
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
                title: "ไม่พบข้อมูลคาดการณ์กลุ่มชื่อการค้า",
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
