"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Cell,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Briefcase,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  Activity,
} from "lucide-react";

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

/* ================= Mock Data ================= */
const timePeriodData: Record<string, any[]> = {
  day: [
    { name: "01/03", sales: 12000, target: 10000, growth: 20 },
    { name: "02/03", sales: 19000, target: 12000, growth: 58 },
    { name: "03/03", sales: 15000, target: 12000, growth: 25 },
    { name: "04/03", sales: 22000, target: 15000, growth: 46 },
    { name: "05/03", sales: 18000, target: 15000, growth: 20 },
    { name: "06/03", sales: 25000, target: 18000, growth: 38 },
    { name: "07/03", sales: 30000, target: 20000, growth: 50 },
  ],
  month: [
    { name: "ม.ค.", sales: 450000, target: 400000, growth: 12 },
    { name: "ก.พ.", sales: 520000, target: 450000, growth: 15 },
    { name: "มี.ค.", sales: 480000, target: 500000, growth: -4 },
    { name: "เม.ย.", sales: 610000, target: 500000, growth: 22 },
    { name: "พ.ค.", sales: 590000, target: 550000, growth: 7 },
    { name: "มิ.ย.", sales: 750000, target: 600000, growth: 25 },
  ],
  quarter: [
    { name: "Q1", sales: 1450000, target: 1350000, growth: 7 },
    { name: "Q2", sales: 1950000, target: 1650000, growth: 18 },
    { name: "Q3", sales: 2100000, target: 1900000, growth: 10 },
    { name: "Q4", sales: 2500000, target: 2200000, growth: 13 },
  ],
  year: [
    { name: "2023", sales: 6500000, target: 6000000, growth: 8 },
    { name: "2024", sales: 8000000, target: 7100000, growth: 12 },
    { name: "2025", sales: 9500000, target: 8500000, growth: 17 },
  ],
};

const topCustomers = [
  { name: "บจก. เอเซียสยาม", sales: 1250000 },
  { name: "ก้าวหน้า อินดัสทรี", sales: 950000 },
  { name: "เทพไทย คอร์ปอเรชั่น", sales: 820000 },
  { name: "บางกอก ซัพพลาย", sales: 680000 },
  { name: "ธนาวัฒน์ โกบอล", sales: 540000 },
];

const topEmployees = [
  { name: "สมชาย แสนดี", sales: 2100000 },
  { name: "มาลี ศรีสุข", sales: 1850000 },
  { name: "วิชัย รุ่งเรือง", sales: 1620000 },
  { name: "อรอนงค์ ปัญญา", sales: 1450000 },
  { name: "เดชา ชาติไทย", sales: 1200000 },
];

const OVERALL_KPI = {
  totalSales: 8000000,
  orderCount: 1245,
  growthPercent: 15.4,
  salesPrevMonth: 6932408,
  salesPrevYear: 6200500,
};

/* ================= Component ================= */
export default function AdvancedSalesClient() {
  const [timeAgg, setTimeAgg] = useState<"day" | "month" | "quarter" | "year">("month");
  
  // Mock Filters
  const [dateRange, setDateRange] = useState("this-month");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");

  const currentChartData = timePeriodData[timeAgg];
  
  const customTooltipStyle = {
    borderRadius: "12px",
    border: "1px solid #E2E8F0",
    boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)",
    fontSize: "12px",
    padding: "12px",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(4px)"
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* ================= Header Title & Export ================= */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">รายงานวิเคราะห์การขาย</h1>
            <p className="text-slate-500 text-sm mt-1">เจาะลึกข้อมูลยอดขาย การเติบโต และประสิทธิภาพทีมงาน</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" className="bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-slate-50 text-slate-700">
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">ส่งออก PDF</span>
          </Button>
          <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md">
            <Filter className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">กรองข้อมูลขั้นสูง</span>
          </Button>
        </div>
      </div>

      {/* ================= Modern Filter Bar (Mockup) ================= */}
      <div className="bg-white/70 backdrop-blur-md border border-slate-200/60 rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-indigo-500" /> ช่วงเวลา
          </label>
          <select 
            className="w-full text-sm rounded-xl border-slate-200 bg-white/50 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="today">วันนี้</option>
            <option value="this-week">สัปดาห์นี้</option>
            <option value="this-month">เดือนนี้</option>
            <option value="this-year">ปีนี้</option>
            <option value="custom">กำหนดเอง (1 ม.ค. - 30 มี.ค.)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-500" /> ลูกค้า
          </label>
          <select 
            className="w-full text-sm rounded-xl border-slate-200 bg-white/50 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-700"
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
          >
            <option value="all">ลูกค้าทั้งหมด</option>
            <option value="top10">Top 10 ลูกค้า</option>
            <option value="vip">ลูกค้า VIP</option>
            <option value="new">ลูกค้าใหม่</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-orange-500" /> พนักงานขาย
          </label>
          <select 
            className="w-full text-sm rounded-xl border-slate-200 bg-white/50 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-700"
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
          >
            <option value="all">ทีมขายทั้งหมด</option>
            <option value="team-a">Team A (ภาคกลาง)</option>
            <option value="team-b">Team B (ภาคเหนือ)</option>
          </select>
        </div>

        <div className="pt-2">
          <Button variant="outline" className="w-full border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 rounded-xl">
            ค้นหาข้อมูล
          </Button>
        </div>
      </div>

      {/* ================= Top KPIs ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 : Total Sales */}
        <Card className="rounded-2xl border-0 bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <CardHeader className="pb-2 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-sm font-medium text-slate-500">ยอดขายรวม</CardTitle>
                <div className="text-3xl font-bold text-slate-900 mt-1">{formatCompact(OVERALL_KPI.totalSales)}</div>
              </div>
              <div className="p-2 bg-indigo-100 rounded-xl">
                <DollarSign className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-center text-sm">
              <span className="flex items-center text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md font-medium">
                <ArrowUpRight className="w-4 h-4 mr-0.5" />
                {OVERALL_KPI.growthPercent}%
              </span>
              <span className="text-slate-500 ml-2">เทียบกับปีที่แล้ว</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2 : Orders */}
        <Card className="rounded-2xl border-0 bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <CardHeader className="pb-2 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-sm font-medium text-slate-500">จำนวนออเดอร์</CardTitle>
                <div className="text-3xl font-bold text-slate-900 mt-1">{formatNumber(OVERALL_KPI.orderCount)}</div>
              </div>
              <div className="p-2 bg-emerald-100 rounded-xl">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-center text-sm">
              <span className="flex items-center text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md font-medium">
                <ArrowUpRight className="w-4 h-4 mr-0.5" />
                8.2%
              </span>
              <span className="text-slate-500 ml-2">เทียบกับเดือนที่แล้ว</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3 : Vs Prev Month */}
        <Card className="rounded-2xl border-0 bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <CardHeader className="pb-2 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-sm font-medium text-slate-500">ยอดขายเทียบเดือนก่อน</CardTitle>
                <div className="text-3xl font-bold text-slate-900 mt-1">{formatCompact(OVERALL_KPI.salesPrevMonth)}</div>
              </div>
              <div className="p-2 bg-amber-100 rounded-xl">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-xs text-slate-500 mt-1 flex flex-col gap-1">
              <span>ยอดขายปัจจุบันมากกว่าเดือนที่แล้ว</span>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full w-[85%]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4 : Vs Prev Year */}
        <Card className="rounded-2xl border-0 bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <CardHeader className="pb-2 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-sm font-medium text-slate-500">ยอดขายเทียบปีที่แล้ว</CardTitle>
                <div className="text-3xl font-bold text-slate-900 mt-1">{formatCompact(OVERALL_KPI.salesPrevYear)}</div>
              </div>
              <div className="p-2 bg-rose-100 rounded-xl">
                <CalendarDays className="w-5 h-5 text-rose-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-xs text-slate-500 mt-1 flex flex-col gap-1">
               <span>ฐานยอดขายจากช่วงเวลาเดียวกันของปีก่อน</span>
               <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-rose-400 h-full rounded-full w-[110%]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ================= Charts Section ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Timeline Chart */}
        <Card className="rounded-2xl border-0 bg-white/90 shadow-sm lg:col-span-3 xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100 mb-4">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold text-slate-800">ช่วงเวลาการเติบโต (Sales Over Time)</CardTitle>
              <div className="text-sm text-slate-500">แนวโน้มยอดขายและเป้าหมาย</div>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {(['day', 'month', 'quarter', 'year'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTimeAgg(t)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    timeAgg === t 
                      ? "bg-white text-indigo-700 shadow-sm" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {t === 'day' ? 'รายวัน' : t === 'month' ? 'รายเดือน' : t === 'quarter' ? 'รายไตรมาส' : 'รายปี'}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => formatCompact(val)} />
                <Tooltip 
                  contentStyle={customTooltipStyle}
                  formatter={(value: number, name: string) => [formatCurrency(value), name === 'sales' ? 'ยอดขายจริง' : 'เป้าหมาย']}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 20 }} />
                <Line type="monotone" dataKey="sales" name="ยอดขายจริง" stroke="#6366f1" strokeWidth={3} dot={{r: 4, fill: "#6366f1", strokeWidth: 2, stroke: "#fff"}} activeDot={{r: 6}} />
                <Line type="monotone" dataKey="target" name="เป้าหมาย" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Growth Stats Info Box */}
        <Card className="rounded-2xl border-0 bg-gradient-to-br from-indigo-900 to-purple-900 shadow-sm text-white lg:col-span-3 xl:col-span-1">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
               บทวิเคราะห์เบื้องต้น <TrendingUp className="w-5 h-5 text-indigo-300" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="space-y-2">
              <p className="text-indigo-200 text-sm font-medium uppercase tracking-wider">เปอร์เซ็นต์การเติบโต (% Growth)</p>
              <div className="flex items-end gap-3">
                <span className="text-4xl font-black text-white">+15.4%</span>
                <span className="text-sm text-emerald-400 pb-1 font-medium bg-emerald-500/20 px-2 py-0.5 rounded-full inline-flex md:mb-1">
                  ดีกว่าคาดการณ์ <Activity className="w-3 h-3 ml-1" />
                </span>
              </div>
              <p className="text-sm text-indigo-100/80">เทียบอัตราเติบโตกับช่วงเวลาเดียวกันในปีที่ผ่านมา ธุรกิจมีแนวโน้มขยายตัวในทิศทางบวกอย่างต่อเนื่อง</p>
            </div>
            
            <div className="h-[1px] bg-white/20 w-full rounded-full" />
            
            <div className="space-y-3">
              <p className="text-indigo-200 text-sm font-medium uppercase tracking-wider">ประสิทธิภาพเมื่อเทียบกับเดือน/ปีก่อน</p>
              
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/5">
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="text-slate-200 font-medium">% เทียบเดือนก่อน</span>
                  <span className="text-white font-bold">+8.2%</span>
                </div>
                <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div className="bg-gradient-to-r from-emerald-400 to-emerald-300 h-full rounded-full w-[108%]" />
                </div>
              </div>

              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/5">
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="text-slate-200 font-medium">% เทียบปีที่แล้ว</span>
                  <span className="text-white font-bold">+15.4%</span>
                </div>
                <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div className="bg-gradient-to-r from-blue-400 to-blue-300 h-full rounded-full w-[115%]" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Sales By Customer */}
        <Card className="rounded-2xl border-0 bg-white shadow-sm lg:col-span-1 lg:max-xl:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-bold text-slate-800 flex items-center gap-2">
               <Users className="w-4 h-4 text-emerald-500" /> ยอดขายตามลูกค้า (Top 5)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={topCustomers} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 11}} width={100} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={customTooltipStyle}
                  formatter={(value: number) => [formatCurrency(value), 'ยอดขาย']}
                />
                <Bar dataKey="sales" name="ยอดขาย" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales By Employee */}
        <Card className="rounded-2xl border-0 bg-white shadow-sm lg:col-span-2 lg:max-xl:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-bold text-slate-800 flex items-center gap-2">
               <Briefcase className="w-4 h-4 text-orange-500" /> ยอดขายตามพนักงาน (Top 5)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topEmployees} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 11}} dy={10} />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={customTooltipStyle}
                  formatter={(value: number) => [formatCurrency(value), 'ยอดขาย']}
                />
                <Bar dataKey="sales" name="ยอดขาย" fill="#f97316" radius={[4, 4, 0, 0]} barSize={32}>
                  {topEmployees.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#f97316' : '#fb923c'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
