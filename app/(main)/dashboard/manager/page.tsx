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
  { group: "A", target: 500000, salesNote: 320000, invoice: 150000 },
  { group: "B", target: 600000, salesNote: 380000, invoice: 220000 },
  { group: "C", target: 400000, salesNote: 120000, invoice: 60000 },
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

/* ================= Page ================= */
export default function DashboardPage() {
  const percent = Math.round((target.current / target.target) * 100);
  const remaining = target.target - target.current;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 md:p-10 space-y-10">
      {/* ================= Header ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Dashboard Overview
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            ภาพรวมยอดขายและสถานะงานประจำเดือน
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 bg-white/70 backdrop-blur px-4 py-2 rounded-full shadow border">
          <Clock className="w-4 h-4" />
          <span>
            อัปเดตล่าสุด{" "}
            {new Date().toLocaleString("th-TH", {
              dateStyle: "long",
              timeStyle: "short",
            })}
          </span>
        </div>
      </div>

      {/* ================= Top KPI ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Monthly Sales */}
        <Card className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur shadow-sm hover:shadow-xl transition">
          <div className="absolute right-4 top-4 opacity-10">
            <DollarSign className="w-24 h-24 text-blue-600" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-500">
              ยอดขายเดือนปัจจุบัน
            </CardTitle>
            <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-2">
              {formatCurrency(monthlySales.total)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/60">
                <p className="text-xs font-semibold text-blue-600">
                  Sales Note
                </p>
                <p className="text-lg font-bold text-slate-800">
                  {formatNumber(monthlySales.salesNote)}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/60">
                <p className="text-xs font-semibold text-indigo-600">Invoice</p>
                <p className="text-lg font-bold text-slate-800">
                  {formatNumber(monthlySales.invoice)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Target */}
        <Card className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl hover:scale-[1.01] transition">
          <div className="absolute right-4 top-4 opacity-10">
            <Target className="w-32 h-32" />
          </div>
          <CardHeader className="pb-2 flex justify-between items-center">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-300">
              เป้ายอดขาย
            </CardTitle>
            <Target className="w-5 h-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end mb-3">
              <div className="text-4xl font-black">{percent}%</div>
              <div className="text-xs text-slate-400">
                เป้า {formatNumber(target.target)}
              </div>
            </div>

            <Progress
              value={percent}
              className="h-3 rounded-full bg-slate-700/70 [&>div]:bg-gradient-to-r [&>div]:from-emerald-400 [&>div]:to-lime-400"
            />

            <div className="flex justify-between mt-4 text-sm">
              <div>
                <p className="text-xs text-slate-400">ยอดปัจจุบัน</p>
                <p className="font-semibold">
                  {formatNumber(target.current)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">ส่วนต่าง</p>
                <p className="font-semibold text-emerald-400">
                  -{formatNumber(remaining)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* YTD */}
        <Card className="rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur shadow-sm hover:shadow-xl transition">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-500">
              ยอดขายสะสม (YTD)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-full bg-amber-100">
                <TrendingUp className="w-8 h-8 text-amber-600" />
              </div>
              <div>
                <div className="text-4xl font-black text-slate-900">
                  4,850,000
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">
                  บาท
                </div>
              </div>
            </div>

            <div className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-3 py-1.5 rounded-full">
              <TrendingUp className="w-3 h-3" />
              +12.5% จากปีที่แล้ว
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ================= Charts ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Group */}
        <Card className="rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-100">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
              <CardTitle className="text-lg font-semibold">
                ยอดขายตามกลุ่มสินค้า
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productGroupData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="group" />
                <YAxis tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 14,
                    border: "1px solid #e2e8f0",
                  }}
                />
                <Bar dataKey="target" fill="#e2e8f0" />
                <Bar dataKey="salesNote" fill="#818cf8" stackId="a" />
                <Bar dataKey="invoice" fill="#4f46e5" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Region */}
        <Card className="rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-100">
                <Map className="w-5 h-5 text-orange-600" />
              </div>
              <CardTitle className="text-lg font-semibold">
                ยอดขายรายภาค
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="region" />
                <YAxis tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip />
                <Bar dataKey="target" fill="#e2e8f0" />
                <Bar dataKey="salesNote" fill="#fb923c" />
                <Bar dataKey="invoice" fill="#ea580c" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ================= Job Status ================= */}
      <Card className="rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-100">
              <Briefcase className="w-5 h-5 text-slate-600" />
            </div>
            <CardTitle className="text-lg font-semibold">
              ติดตามสถานะงานในเดือนนี้
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex flex-col justify-center items-center rounded-3xl p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl">
            <div className="text-6xl font-black">{jobStatus.total}</div>
            <div className="text-slate-300 mt-1">งานทั้งหมด</div>
          </div>

          <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-5">
            {[
              {
                label: "สำเร็จ",
                value: jobStatus.success,
                color: "emerald",
                icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
              },
              {
                label: "กำลังดำเนินการ",
                value: jobStatus.progress,
                color: "blue",
                icon: <Briefcase className="w-5 h-5 text-blue-500" />,
              },
              {
                label: "ไม่สำเร็จ/ยกเลิก",
                value: jobStatus.fail,
                color: "rose",
                icon: <AlertCircle className="w-5 h-5 text-rose-500" />,
              },
            ].map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <span className="font-bold">
                    {item.value} (
                    {Math.round((item.value / jobStatus.total) * 100)}%)
                  </span>
                </div>
                <Progress
                  value={(item.value / jobStatus.total) * 100}
                  className={`h-2.5 bg-slate-200 [&>div]:bg-${item.color}-500`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
