import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Tag } from "lucide-react";

interface ABCForecastRow {
  abcCode: string;
  abcName: string;
  totalAmount: number;
  totalQuantity: number;
}

interface ABCForecastSectionProps {
  data: ABCForecastRow[];
  formatCurrency: (value: number) => string;
  loading: boolean;
  error: string | null;
}

const ABC_COLORS: Record<
  string,
  { bg: string; text: string; bar: string; badge: string }
> = {
  A: {
    bg: "bg-gradient-to-br from-emerald-50 to-emerald-100/60",
    text: "text-emerald-700",
    bar: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-700",
  },
  B: {
    bg: "bg-gradient-to-br from-blue-50 to-blue-100/60",
    text: "text-blue-700",
    bar: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700",
  },
  C: {
    bg: "bg-gradient-to-br from-amber-50 to-amber-100/60",
    text: "text-amber-700",
    bar: "bg-amber-400",
    badge: "bg-amber-100 text-amber-700",
  },
};

const DEFAULT_COLOR = {
  bg: "bg-gradient-to-br from-slate-50 to-slate-100/60",
  text: "text-slate-600",
  bar: "bg-slate-400",
  badge: "bg-slate-100 text-slate-600",
};

const getColor = (code: string) =>
  ABC_COLORS[code?.toUpperCase()] ?? DEFAULT_COLOR;

export const ABCForecastSection = ({
  data,
  formatCurrency,
  loading,
  error,
}: ABCForecastSectionProps) => {
  const grandTotal = useMemo(
    () => data.reduce((sum, row) => sum + row.totalAmount, 0),
    [data],
  );

  const sortedData = useMemo(() => {
    const order: Record<string, number> = { A: 1, B: 2, C: 3 };
    return [...data].sort((a, b) => {
      const codeA = a.abcCode?.toUpperCase() || "";
      const codeB = b.abcCode?.toUpperCase() || "";
      const valA = order[codeA] ?? 99;
      const valB = order[codeB] ?? 99;
      return valA - valB;
    });
  }, [data]);

  return (
    <Card className="overflow-hidden rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-lg">
      <CardHeader className="border-b border-slate-100 mt-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-orange-100 to-rose-100">
            <Tag className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <CardTitle>ยอดขายตามประเภท (ABC)</CardTitle>
            <p className="text-sm text-slate-500">
              ภาพรวมยอดคาดการณ์แยกตามประเภทสินค้า ABC
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            กำลังโหลดข้อมูลคาดการณ์ตามประเภท ABC...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
            {error}
          </div>
        ) : data.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-slate-500">
            ไม่พบข้อมูลคาดการณ์ตามประเภท ABC
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedData.map((row) => {
                const color = getColor(row.abcCode);
                const pct =
                  grandTotal > 0
                    ? ((row.totalAmount / grandTotal) * 100).toFixed(1)
                    : "0.0";
                const barWidth =
                  grandTotal > 0
                    ? Math.max(4, (row.totalAmount / grandTotal) * 100)
                    : 0;

                return (
                  <div
                    key={row.abcCode}
                    className={`rounded-xl border border-white/60 p-5 shadow-sm ${color.bg}`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span
                          className={`inline-block rounded-lg px-2.5 py-0.5 text-sm font-bold ${color.badge}`}
                        >
                          {row.abcCode === "unassigned"
                            ? "ไม่ระบุ"
                            : row.abcCode}
                        </span>
                      </div>
                      <span className="text-2xl font-black text-slate-300 select-none">
                        {row.abcCode === "unassigned"
                          ? "?"
                          : row.abcCode.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-3 h-2 w-full rounded-full bg-white/60">
                      <div
                        className={`h-2 rounded-full transition-all duration-700 ${color.bar}`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>

                    {/* Amounts */}
                    <p className={`text-xl font-bold ${color.text}`}>
                      {formatCurrency(row.totalAmount)}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                      <span>{row.totalQuantity.toLocaleString()} รายการ</span>
                      <span className="font-semibold">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Grand total row */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-600">
                รวมทั้งหมด
              </span>
              <span className="text-lg font-bold text-slate-800">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
