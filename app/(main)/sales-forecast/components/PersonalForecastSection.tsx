import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, UserRound } from "lucide-react";

interface PersonalForecastRow {
  employeeId: string;
  employeeName: string;
  totalAmount: number;
  totalQuantity: number;
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
}

export const PersonalForecastSection = ({
  data,
  monthOptions,
  selectedMonth,
  onMonthChange,
  formatCurrency,
  loading,
  error,
}: PersonalForecastSectionProps) => {
  return (
    <Card className="overflow-hidden rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100">
              <UserRound className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>Personal Forecast</CardTitle>
              <p className="text-sm text-slate-500">
                สรุปยอดคาดการณ์รายบุคคลจากเป้าหมายที่บันทึกไว้
              </p>
            </div>
          </div>
          <div className="w-full sm:w-[220px]">
            <Select value={selectedMonth} onValueChange={onMonthChange}>
              <SelectTrigger className="h-10 rounded-xl bg-white">
                <SelectValue placeholder="เลือกเดือน" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <div className="space-y-3">
            {data.map((row) => (
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
                  <p className="text-lg font-semibold text-blue-700">
                    {formatCurrency(row.totalAmount)}
                  </p>
                  <p className="text-xs text-slate-400">
                    จำนวนสินค้า {row.totalQuantity.toLocaleString()} รายการ
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
