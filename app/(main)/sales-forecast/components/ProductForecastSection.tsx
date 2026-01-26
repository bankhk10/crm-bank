import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, PackageSearch, Search } from "lucide-react";

interface ProductForecastRow {
  productId: string;
  productCode: string;
  productName: string;
  productGroup: string | null;
  totalAmount: number;
  totalQuantity: number;
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
  const perPage = 6;

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return data;
    return data.filter(
      (row) =>
        row.productName.toLowerCase().includes(search) ||
        row.productCode.toLowerCase().includes(search) ||
        row.productGroup?.toLowerCase().includes(search),
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
            <div className="p-2 rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100">
              <PackageSearch className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <CardTitle>Product Forecast</CardTitle>
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
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            กำลังโหลดข้อมูลคาดการณ์รายสินค้า...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-slate-500">
            ไม่พบข้อมูลคาดการณ์รายสินค้า
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginated.map((row) => (
                <div
                  key={row.productId}
                  className="rounded-xl border border-slate-100 bg-white/80 p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-teal-100 px-2 py-0.5 text-xs font-mono text-teal-700">
                      {row.productCode}
                    </span>
                    {row.productGroup && (
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        {row.productGroup}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-base font-semibold text-slate-800">
                    {row.productName}
                  </p>
                  <p className="mt-3 text-lg font-semibold text-teal-700">
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
