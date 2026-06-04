import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  DollarSign,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  CalendarDays,
  FileText,
  CheckSquare,
  XCircle,
  Loader2,
} from "lucide-react";
import {
  formatCurrency,
  formatNumber,
  formatTHBWithCompact,
} from "../../../ui/format-utils";
import type { DashboardPeriod, SalesDashboardPeriodData } from "../../../types";

interface SalesKpiCardsProps {
  overviewPeriod: DashboardPeriod;
  periodLabels: Record<DashboardPeriod, string>;
  monthlySales: SalesDashboardPeriodData["monthlySales"];
  target: SalesDashboardPeriodData["target"];
  ytd: {
    total: number;
    target: number;
    growthPercent: number;
  };
  jobStatus: SalesDashboardPeriodData["jobStatus"];
}

export function SalesKpiCards({
  overviewPeriod,
  periodLabels,
  monthlySales,
  target,
  ytd,
  jobStatus,
}: SalesKpiCardsProps) {
  const percent =
    target.target > 0 ? Math.round((target.current / target.target) * 100) : 0;
  const remaining = target.target - target.current;
  const ytdPercent =
    ytd.target > 0
      ? Math.min(Math.round((ytd.total / ytd.target) * 100), 100)
      : 0;

  const jobTotal = jobStatus.total || 1;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
      {/* Monthly Sales Card */}
      <Card className="relative overflow-hidden rounded-2xl sm:rounded-3xl border-0 bg-white shadow-lg shadow-slate-200/60 hover:shadow-xl hover:shadow-teal-200/50 hover:-translate-y-0.5 transition-all duration-300 group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500" />
        <div className="absolute -right-4 -bottom-4 opacity-[0.04] group-hover:opacity-[0.07] transition-opacity duration-300">
          <DollarSign className="w-36 h-36 text-teal-600" />
        </div>

        <CardHeader className="pb-1 sm:pb-2 pt-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-100 border border-teal-100">
                <DollarSign className="w-4 h-4 text-teal-600" />
              </div>
              <CardTitle className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 font-bold">
                ยอดขาย {periodLabels[overviewPeriod]}
              </CardTitle>
            </div>
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] sm:text-xs font-bold ${
                monthlySales.growthPercent >= 0
                  ? "text-emerald-700 bg-emerald-50 border border-emerald-100"
                  : "text-rose-700 bg-rose-50 border border-rose-100"
              }`}
            >
              {monthlySales.growthPercent >= 0 ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {monthlySales.growthPercent >= 0 ? "+" : ""}
              {monthlySales.growthPercent}%
            </div>
          </div>
          <div className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mt-2 truncate">
            {formatCurrency(monthlySales.total)}
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-5">
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-2">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100">
              <p className="text-[10px] sm:text-xs font-bold text-orange-600 uppercase tracking-wide mb-1">
                Sales Note
              </p>
              <p className="text-base sm:text-lg font-black text-slate-800">
                {formatCurrency(monthlySales.salesNote)}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100">
              <p className="text-[10px] sm:text-xs font-bold text-emerald-600 uppercase tracking-wide mb-1">
                Invoice
              </p>
              <p className="text-base sm:text-lg font-black text-slate-800">
                {formatCurrency(monthlySales.invoice)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Target Card — dark */}
      <Card className="relative overflow-hidden rounded-2xl sm:rounded-3xl border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl shadow-slate-900/30 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-transparent to-emerald-500/10" />
        <div className="absolute -right-6 -top-6 opacity-[0.06]">
          <Target className="w-36 h-36" />
        </div>

        <CardHeader className="pb-1 sm:pb-2 pt-5 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                <Target className="w-4 h-4 text-emerald-400" />
              </div>
              <CardTitle className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-300 font-bold">
                เป้ายอดขาย {periodLabels[overviewPeriod]}
              </CardTitle>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl md:text-4xl font-black text-white mt-2 truncate">
            {formatCurrency(target.target)}
          </div>
        </CardHeader>

        <CardContent className="pb-5 relative">
          <div className="mb-4">
            <div className="flex justify-between text-[10px] sm:text-xs text-slate-400 mb-1.5">
              <span>ความคืบหน้า</span>
              <span className="font-bold text-white">{percent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  remaining <= 0
                    ? "bg-gradient-to-r from-emerald-400 to-green-500"
                    : "bg-gradient-to-r from-teal-400 to-emerald-500"
                }`}
                style={{ width: `${Math.min(percent, 100)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="p-2.5 sm:p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-center">
              <p className="text-[10px] sm:text-xs text-slate-400 mb-1">
                ส่วนต่าง
              </p>
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] sm:text-xs font-bold ${
                  remaining <= 0
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                }`}
              >
                {remaining <= 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {remaining <= 0 ? "+" : "-"}
                {formatTHBWithCompact(Math.abs(remaining))}
              </span>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-center">
              <p className="text-[10px] sm:text-xs text-slate-400 mb-1">
                เปอร์เซ็นต์
              </p>
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] sm:text-xs font-bold ${
                  remaining <= 0
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                }`}
              >
                {remaining <= 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {remaining <= 0 ? "+" : "-"}
                {Math.abs(percent - 100)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* YTD Card */}
      <Card className="relative overflow-hidden rounded-2xl sm:rounded-3xl border-0 bg-white shadow-lg shadow-slate-200/60 hover:shadow-xl hover:shadow-amber-200/50 hover:-translate-y-0.5 transition-all duration-300 group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" />
        <div className="absolute -right-4 -bottom-4 opacity-[0.04] group-hover:opacity-[0.07] transition-opacity duration-300">
          <Sparkles className="w-36 h-36 text-amber-500" />
        </div>

        <CardHeader className="pb-1 sm:pb-2 pt-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-100">
              <CalendarDays className="w-4 h-4 text-amber-600" />
            </div>
            <CardTitle className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 font-bold">
              ยอดขายสะสมทั้งปี (YTD)
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="pb-5">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 shadow-inner flex-shrink-0">
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" />
            </div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 truncate">
              {formatCurrency(ytd.total)}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-[10px] sm:text-xs text-slate-500 mb-1.5 font-medium">
              <span className="font-bold text-amber-600">{ytdPercent}%</span>
              <span>เป้า: {formatCurrency(ytd.target)}</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-amber-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700"
                style={{ width: `${ytdPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div
              className={`inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold px-2.5 py-1.5 rounded-full border ${
                ytd.growthPercent >= 0
                  ? "text-emerald-700 bg-emerald-50 border-emerald-100"
                  : "text-rose-700 bg-rose-50 border-rose-100"
              }`}
            >
              {ytd.growthPercent >= 0 ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {ytd.growthPercent >= 0 ? "+" : ""}
              {ytd.growthPercent}%
              <span className="text-slate-400 font-normal ml-0.5">
                จากปีที่แล้ว
              </span>
            </div>
            <div className="text-right">
              <p className="text-[10px] sm:text-xs text-slate-400">คงเหลือ</p>
              <p
                className={`text-xs sm:text-sm font-black ${
                  ytd.total >= ytd.target ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {ytd.total >= ytd.target ? "+" : "-"}
                {formatCurrency(Math.abs(ytd.target - ytd.total))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Status Card */}
      <Card className="relative overflow-hidden rounded-2xl sm:rounded-3xl border-0 bg-white shadow-lg shadow-slate-200/60 hover:shadow-xl hover:shadow-indigo-200/50 hover:-translate-y-0.5 transition-all duration-300 group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
        <div className="absolute -right-4 -bottom-4 opacity-[0.04] group-hover:opacity-[0.07] transition-opacity duration-300">
          <FileText className="w-36 h-36 text-indigo-600" />
        </div>

        <CardHeader className="pb-1 sm:pb-2 pt-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-100 border border-indigo-100">
              <FileText className="w-4 h-4 text-indigo-600" />
            </div>
            <CardTitle className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 font-bold">
              สถานะใบขาย {periodLabels[overviewPeriod]}
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="pb-5">
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mb-4">
            {formatNumber(jobStatus.total)}{" "}
            <span className="text-sm font-medium text-slate-400">ใบ</span>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs text-slate-600">สำเร็จ</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${(jobStatus.success / jobTotal) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-700 w-8 text-right">
                  {jobStatus.success}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs text-slate-600">กำลังดำเนินการ</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${(jobStatus.progress / jobTotal) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-700 w-8 text-right">
                  {jobStatus.progress}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-xs text-slate-600">ยกเลิก/ไม่ผ่าน</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-rose-500"
                    style={{ width: `${(jobStatus.fail / jobTotal) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-700 w-8 text-right">
                  {jobStatus.fail}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
