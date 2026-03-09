import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, UserRound, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useState, useMemo } from "react";
import Link from "next/link";

interface PersonalForecastRow {
  employeeId: string;
  employeeName: string;
  totalAmount: number;
  totalQuantity: number;
  details: any[];
}

interface MonthOption {
  value: string;
  label: string;
}

interface PersonalForecastSectionProps {
  data: PersonalForecastRow[];
  monthOptions: MonthOption[];
  selectedMonth: string;
  onMonthChange: (value: string) => void;
  formatCurrency: (value: number) => string;
  loading: boolean;
  error: string | null;
  year: number;
}

export const PersonalForecastSection = ({
  data,
  monthOptions,
  selectedMonth,
  onMonthChange,
  formatCurrency,
  loading,
  error,
  year,
}: PersonalForecastSectionProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage]);

  const totalPages = Math.ceil(data.length / itemsPerPage);

  const [prevMonth, setPrevMonth] = useState(selectedMonth);

  if (selectedMonth !== prevMonth) {
    setPrevMonth(selectedMonth);
    setCurrentPage(1);
  }
  return (
    <Card className="overflow-hidden rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100">
              <UserRound className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>ยอดคาดการณ์รายบุคคล</CardTitle>
              <p className="text-sm text-slate-500">
                สรุปยอดคาดการณ์รายบุคคลจากเป้าหมายที่บันทึกไว้
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            กำลังโหลดข้อมูลคาดการณ์รายบุคคล...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
            {error}
          </div>
        ) : data.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-slate-500">
            ยังไม่มีข้อมูลคาดการณ์รายบุคคลสำหรับช่วงเวลานี้
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedData.map((row) => (
                <div
                  key={row.employeeId}
                  className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white/80 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm text-slate-500">พนักงาน</p>
                    <p className="text-base font-semibold text-slate-800">
                      {row.employeeName}
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-1 text-right sm:items-end">
                    <p className="text-sm text-slate-500">ยอดคาดการณ์</p>
                    <div className="flex items-center justify-end gap-3 mt-1 w-full">
                      <Link href={`/sales-forecast/${row.employeeId}?year=${year}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">ดูหน้ารายละเอียด</span>
                        </Button>
                      </Link>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-blue-700 leading-none">
                          {formatCurrency(row.totalAmount)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1.5">
                          จำนวนสินค้า {row.totalQuantity.toLocaleString()} รายการ
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-500">
                  แสดง {paginatedData.length} จาก {data.length} รายการ
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-slate-600">
                    หน้า {currentPage} จาก {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
