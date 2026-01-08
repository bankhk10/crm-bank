"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Briefcase,
  Map,
  Package,
  DollarSign,
  Target,
  ArrowUpRight,
  Sparkles,
  BarChart3,
} from "lucide-react";

/* ================= Mock Data ================= */
const monthlySales = {
  total: 1250000,
  salesNote: 820000,
  invoice: 430000,
};

const target = {
  target: 1500000,
  current: 1250000,
};

const productGroupData = [
  { group: "กลุ่ม A", target: 500000, salesNote: 320000, invoice: 150000 },
  { group: "กลุ่ม B", target: 600000, salesNote: 380000, invoice: 220000 },
  { group: "กลุ่ม C", target: 400000, salesNote: 120000, invoice: 60000 },
];

const regionData = [
  { region: "เหนือ", target: 300000, salesNote: 180000, invoice: 90000 },
  { region: "กลาง", target: 500000, salesNote: 320000, invoice: 180000 },
  { region: "อีสาน", target: 400000, salesNote: 250000, invoice: 120000 },
  { region: "ใต้", target: 300000, salesNote: 150000, invoice: 80000 },
];

const jobStatus = {
  total: 120,
  success: 70,
  fail: 20,
  progress: 30,
};

/* ================= Utils ================= */
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);

const formatNumber = (value: number) =>
  new Intl.NumberFormat("th-TH").format(value);

const formatCompact = (value: number) =>
  new Intl.NumberFormat("th-TH", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

/* ================= Page ================= */
export default function DashboardPage() {
  const percent = Math.round((target.current / target.target) * 100);
  const remaining = target.target - target.current;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 px-3 py-4 sm:p-6 md:p-8 lg:p-10 space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      {/* ================= Header - Mobile First ================= */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Title */}
        <div className="text-center sm:text-left">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-blue-600 uppercase tracking-wider">
              Dashboard
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
            ภาพรวมแดชบอร์ด
          </h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">
            ภาพรวมยอดขายและสถานะงานประจำเดือน
          </p>
        </div>

        {/* Last Updated Badge */}
        <div className="flex justify-center sm:justify-end">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-600 bg-white/80 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-sm border border-slate-200/60">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse" />
            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">อัปเดตล่าสุด </span>
            <span className="font-medium">
              {new Date().toLocaleString("th-TH", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* ================= Top KPI Cards - Responsive Grid ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {/* Monthly Sales Card */}
        <Card className="relative overflow-hidden rounded-2xl sm:rounded-3xl border-0 bg-white/70 backdrop-blur-sm shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-blue-200/50 transition-all duration-300 group sm:col-span-2 xl:col-span-1">
          <div className="absolute -right-6 -top-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign className="w-32 h-32 sm:w-40 sm:h-40 text-blue-600" />
          </div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

          <CardHeader className="pb-2 sm:pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 font-semibold">
                ยอดขายเดือนปัจจุบัน
              </CardTitle>
              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                <ArrowUpRight className="w-3 h-3" />
                <span className="text-[10px] sm:text-xs font-bold">+8.5%</span>
              </div>
            </div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-1 sm:mt-2 truncate">
              {formatCurrency(monthlySales.total)}
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 mt-2 sm:mt-4">
              <div className="p-2.5 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/60 border border-blue-100">
                <p className="text-[10px] sm:text-xs font-semibold text-blue-600 uppercase tracking-wide">
                  Sales Note
                </p>
                <p className="text-base sm:text-lg font-bold text-slate-800 mt-0.5">
                  {formatCompact(monthlySales.salesNote)}
                </p>
              </div>
              <div className="p-2.5 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/60 border border-indigo-100">
                <p className="text-[10px] sm:text-xs font-semibold text-indigo-600 uppercase tracking-wide">
                  Invoice
                </p>
                <p className="text-base sm:text-lg font-bold text-slate-800 mt-0.5">
                  {formatCompact(monthlySales.invoice)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Target Card - Dark Theme */}
        <Card className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl shadow-slate-900/25 hover:shadow-2xl hover:scale-[1.01] transition-all duration-300">
          <div className="absolute -right-4 -top-4 opacity-5">
            <Target className="w-28 h-28 sm:w-36 sm:h-36" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />

          <CardHeader className="pb-2 sm:pb-3 relative">
            <div className="flex justify-between items-center">
              <CardTitle className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-400 font-semibold">
                เป้ายอดขาย
              </CardTitle>
              <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-500/20 backdrop-blur-sm">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative">
            <div className="flex justify-between items-end mb-2 sm:mb-3">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl md:text-5xl font-black">
                  {percent}
                </span>
                <span className="text-lg sm:text-xl font-bold text-slate-400">
                  %
                </span>
              </div>
              <div className="text-right">
                <p className="text-[10px] sm:text-xs text-slate-500">
                  เป้าหมาย
                </p>
                <p className="text-xs sm:text-sm font-semibold text-slate-300">
                  {formatCompact(target.target)}
                </p>
              </div>
            </div>

            <div className="relative">
              <Progress
                value={percent}
                className="h-2 sm:h-3 rounded-full bg-slate-700/70 [&>div]:bg-gradient-to-r [&>div]:from-emerald-400 [&>div]:to-lime-400 [&>div]:rounded-full"
              />
              <div className="absolute -top-1 left-0 w-full h-4 sm:h-5 overflow-hidden">
                <div
                  className="absolute top-0 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
                  style={{ width: "50%", animation: "shimmer 2s infinite" }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-3 sm:mt-4">
              <div className="p-2 sm:p-3 rounded-xl bg-slate-800/50 backdrop-blur-sm">
                <p className="text-[10px] sm:text-xs text-slate-500">
                  ยอดปัจจุบัน
                </p>
                <p className="text-sm sm:text-base font-bold text-white">
                  {formatCompact(target.current)}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-slate-800/50 backdrop-blur-sm text-right">
                <p className="text-[10px] sm:text-xs text-slate-500">
                  ส่วนต่าง
                </p>
                <p className="text-sm sm:text-base font-bold text-emerald-400">
                  -{formatCompact(remaining)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* YTD Card */}
        <Card className="relative overflow-hidden rounded-2xl sm:rounded-3xl border-0 bg-white/70 backdrop-blur-sm shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-amber-200/50 transition-all duration-300 group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500" />
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Sparkles className="w-28 h-28 sm:w-36 sm:h-36 text-amber-500" />
          </div>

          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 font-semibold">
              ยอดขายสะสม (YTD)
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 shadow-inner">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900">
                  4.85M
                </div>
                <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-medium">
                  บาท
                </div>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                <ArrowUpRight className="w-3 h-3" />
                +12.5%
              </div>
              <span className="text-[10px] sm:text-xs text-slate-500">
                จากปีที่แล้ว
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ================= Charts - Responsive ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
        {/* Product Group Chart */}
        <Card className="rounded-2xl sm:rounded-3xl border-0 bg-white/70 backdrop-blur-sm shadow-lg overflow-hidden">
          <CardHeader className="pb-2 sm:pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-100 to-violet-100">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-sm sm:text-base md:text-lg font-semibold text-slate-800">
                  ยอดขายตามกลุ่มสินค้า
                </CardTitle>
                <p className="text-[10px] sm:text-xs text-slate-500">
                  เปรียบเทียบเป้าหมายและยอดขายจริง
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[240px] sm:h-[280px] md:h-[320px] lg:h-[350px] pt-2 sm:pt-4 px-1 sm:px-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={productGroupData}
                margin={{ left: -15, right: 5, top: 5, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis
                  dataKey="group"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `${v / 1000}k`}
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "none",
                    boxShadow: "0 10px 40px -10px rgba(0,0,0,0.2)",
                    fontSize: 12,
                  }}
                  formatter={(value: number) => formatNumber(value)}
                />
                <Legend
                  wrapperStyle={{ fontSize: 10, paddingTop: 10 }}
                  iconSize={8}
                />
                <Bar
                  dataKey="target"
                  name="เป้าหมาย"
                  fill="#E2E8F0"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="salesNote"
                  name="Sales Note"
                  fill="#818cf8"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="invoice"
                  name="Invoice"
                  fill="#4f46e5"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Region Chart */}
        <Card className="rounded-2xl sm:rounded-3xl border-0 bg-white/70 backdrop-blur-sm shadow-lg overflow-hidden">
          <CardHeader className="pb-2 sm:pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-100 to-amber-100">
                <Map className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-sm sm:text-base md:text-lg font-semibold text-slate-800">
                  ยอดขายรายภาค
                </CardTitle>
                <p className="text-[10px] sm:text-xs text-slate-500">
                  แยกตามภูมิภาคทั่วประเทศ
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[240px] sm:h-[280px] md:h-[320px] lg:h-[350px] pt-2 sm:pt-4 px-1 sm:px-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={regionData}
                margin={{ left: -15, right: 5, top: 5, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis
                  dataKey="region"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `${v / 1000}k`}
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "none",
                    boxShadow: "0 10px 40px -10px rgba(0,0,0,0.2)",
                    fontSize: 12,
                  }}
                  formatter={(value: number) => formatNumber(value)}
                />
                <Legend
                  wrapperStyle={{ fontSize: 10, paddingTop: 10 }}
                  iconSize={8}
                />
                <Bar
                  dataKey="target"
                  name="เป้าหมาย"
                  fill="#E2E8F0"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="salesNote"
                  name="Sales Note"
                  fill="#fb923c"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="invoice"
                  name="Invoice"
                  fill="#ea580c"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ================= Job Status - Mobile First ================= */}
      <Card className="rounded-2xl sm:rounded-3xl border-0 bg-white/70 backdrop-blur-sm shadow-lg overflow-hidden">
        <CardHeader className="pb-2 sm:pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-slate-100 to-slate-200">
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base md:text-lg font-semibold text-slate-800">
                ติดตามสถานะงานในเดือนนี้
              </CardTitle>
              <p className="text-[10px] sm:text-xs text-slate-500">
                สรุปภาพรวมการดำเนินงาน
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 sm:p-4 md:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {/* Total Jobs - Featured Card */}
            <div className="col-span-2 sm:col-span-1 flex flex-col justify-center items-center rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent" />
              <div className="text-4xl sm:text-5xl md:text-6xl font-black relative">
                {jobStatus.total}
              </div>
              <div className="text-slate-400 mt-1 text-xs sm:text-sm font-medium relative">
                งานทั้งหมด
              </div>
            </div>

            {/* Status Cards - Grid */}
            <div className="col-span-2 sm:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
              {[
                {
                  label: "สำเร็จ",
                  value: jobStatus.success,
                  bgColor: "bg-gradient-to-br from-emerald-50 to-green-100",
                  barColor: "bg-emerald-500",
                  textColor: "text-emerald-700",
                  icon: (
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                  ),
                },
                {
                  label: "กำลังดำเนินการ",
                  value: jobStatus.progress,
                  bgColor: "bg-gradient-to-br from-blue-50 to-indigo-100",
                  barColor: "bg-blue-500",
                  textColor: "text-blue-700",
                  icon: (
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                  ),
                },
                {
                  label: "ไม่สำเร็จ",
                  value: jobStatus.fail,
                  bgColor: "bg-gradient-to-br from-rose-50 to-red-100",
                  barColor: "bg-rose-500",
                  textColor: "text-rose-700",
                  icon: (
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
                  ),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`${item.bgColor} rounded-xl sm:rounded-2xl p-3 sm:p-4 space-y-2 sm:space-y-3 hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {item.icon}
                      <span className="text-xs sm:text-sm font-medium text-slate-700">
                        {item.label}
                      </span>
                    </div>
                    <span
                      className={`text-lg sm:text-xl md:text-2xl font-black ${item.textColor}`}
                    >
                      {item.value}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="h-1.5 sm:h-2 bg-white/60 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.barColor} rounded-full transition-all duration-500`}
                        style={{
                          width: `${(item.value / jobStatus.total) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-[10px] sm:text-xs text-slate-500 text-right font-medium">
                      {Math.round((item.value / jobStatus.total) * 100)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shimmer Animation Style */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(300%);
          }
        }
      `}</style>
    </div>
  );
}
