import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Layers, Loader2, Search } from "lucide-react";

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
  const perPage = 6;

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return data;
    return data.filter(
      (row) =>
        row.label.toLowerCase().includes(search) ||
        row.tradeNameGroup.toLowerCase().includes(search),
    );
  }, [data, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handlePrev = () => setPage((current) => Math.max(1, current - 1));
  const handleNext = () =>
    setPage((current) => Math.min(totalPages, current + 1));

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  return (
    <Card className="overflow-hidden rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-lg">
      <CardHeader className="border-b border-slate-100">
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
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            กำลังโหลดข้อมูลคาดการณ์กลุ่มชื่อการค้า...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-slate-500">
            ไม่พบข้อมูลคาดการณ์กลุ่มชื่อการค้า
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginated.map((row) => (
                <div
                  key={row.tradeNameGroup}
                  className="rounded-xl border border-slate-100 bg-white/80 p-4 shadow-sm"
                >
                  <p className="text-sm text-slate-500">{row.tradeNameGroup}</p>
                  <p className="text-base font-semibold text-slate-800">
                    {row.label}
                  </p>
                  <p className="mt-3 text-lg font-semibold text-purple-700">
                    {formatCurrency(row.totalAmount)}
                  </p>
                  <p className="text-xs text-slate-400">
                    จำนวนสินค้า {row.totalQuantity.toLocaleString()} รายการ
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col items-center justify-between gap-3 text-sm text-slate-500 sm:flex-row">
              <span>
                แสดง {paginated.length} จาก {filtered.length} รายการ
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                  disabled={page <= 1}
                >
                  ก่อนหน้า
                </Button>
                <span>
                  หน้า {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={page >= totalPages}
                >
                  ถัดไป
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
