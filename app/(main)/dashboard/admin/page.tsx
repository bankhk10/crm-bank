"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowUpRight,
  DollarSign,
  Target,
  Trophy,
  Users,
  AlertOctagon,
  Clock,
  UserX,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Mock Data
const kpiData = {
  totalRevenue: 12500000,
  revenueGrowth: 15.2,
  targetVsActual: 92,
  totalCustomers: 1250,
  newCustomers: 45,
  newCustomersGrowth: 8.5,
  winRate: 68,
  winRateGrowth: 2.3,
};

const revenueHistory = [
  { month: "ก.ค.", revenue: 1800000 },
  { month: "ส.ค.", revenue: 2100000 },
  { month: "ก.ย.", revenue: 1950000 },
  { month: "ต.ค.", revenue: 2400000 },
  { month: "พ.ย.", revenue: 2200000 },
  { month: "ธ.ค.", revenue: 2800000 },
];

const targetVsActualData = [
  { name: "ไตรมาส 1", target: 5000000, actual: 4800000 },
  { name: "ไตรมาส 2", target: 5500000, actual: 5900000 },
  { name: "ไตรมาส 3", target: 6000000, actual: 5800000 },
  { name: "ไตรมาส 4", target: 7000000, actual: 7200000 },
];

const pipelineData = [
  { stage: "ลูกค้ามุ่งหวัง", value: 50, color: "#94a3b8" },
  { stage: "ผ่านเกณฑ์", value: 35, color: "#60a5fa" },
  { stage: "ยื่นข้อเสนอ", value: 25, color: "#818cf8" },
  { stage: "ต่อรอง", value: 15, color: "#a78bfa" },
  { stage: "ปิดการขาย", value: 10, color: "#34d399" },
];

const topCustomers = [
  { id: 1, name: "TechVision Corp", value: 2500000, industry: "เทคโนโลยี" },
  { id: 2, name: "Global Logistics", value: 1800000, industry: "โลจิสติกส์" },
  { id: 3, name: "Future Finance", value: 1500000, industry: "การเงิน" },
  { id: 4, name: "EcoEnergy Systems", value: 1200000, industry: "พลังงาน" },
  { id: 5, name: "Retail Giants", value: 950000, industry: "ค้าปลีก" },
];

const criticalAlerts = [
  {
    id: 1,
    type: "expiry",
    message: "สัญญาของ Alpha Corp จะหมดอายุใน 5 วัน",
    severity: "สูง",
  },
  {
    id: 2,
    type: "inactive",
    message: "ลูกค้าหลัก 'MegaWare' ไม่เคลื่อนไหวมา 60 วัน",
    severity: "ปานกลาง",
  },
  {
    id: 3,
    type: "expiry",
    message: "ข้อเสนอสำหรับ StartUp Inc จะสิ้นสุดพรุ่งนี้",
    severity: "สูง",
  },
];

export default function AdminDashboardPage() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="flex flex-col gap-6 p-8 min-h-screen bg-slate-50/50 dark:bg-slate-950/50">
      {/* KPI Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              รายได้รวม (Total Revenue)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(kpiData.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <span className="text-green-600 flex items-center mr-1 font-medium">
                <ArrowUpRight className="h-3 w-3 mr-0.5" />
                {kpiData.revenueGrowth}%
              </span>
              เทียบกับเดือนก่อน
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              เป้าหมาย vs ผลจริง
            </CardTitle>
            <Target className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {kpiData.targetVsActual}%
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{ width: `${kpiData.targetVsActual}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-violet-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ลูกค้าทั้งหมด (Active)
            </CardTitle>
            <Users className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {kpiData.totalCustomers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <span className="text-green-600 flex items-center mr-1 font-medium">
                <ArrowUpRight className="h-3 w-3 mr-0.5" />
                {kpiData.newCustomers}
              </span>
              รายใหม่เดือนนี้
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Win Rate
            </CardTitle>
            <Trophy className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {kpiData.winRate}%
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <span className="text-green-600 flex items-center mr-1 font-medium">
                <ArrowUpRight className="h-3 w-3 mr-0.5" />
                {kpiData.winRateGrowth}%
              </span>
              เพิ่มขึ้น
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Revenue Trend Chart */}
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>แนวโน้มรายได้</CardTitle>
            <CardDescription>รายได้ย้อนหลัง 6 เดือน</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenueHistory}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) =>
                      `฿${(value / 1000000).toFixed(1)}M`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                    }}
                    formatter={(value: number) => [
                      formatCurrency(value),
                      "รายได้",
                    ]}
                  />
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted/30"
                    horizontal={true}
                    vertical={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sales Pipeline Funnel/Progress */}
        <Card className="col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>ภาพรวมไปป์ไลน์</CardTitle>
            <CardDescription>สถานะดีลในแต่ละขั้นตอน (จำนวน)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] flex flex-col justify-center space-y-6 px-4">
              {pipelineData.map((item) => (
                <div key={item.stage} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.stage}</span>
                    <span className="text-muted-foreground">
                      {item.value} รายการ
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${(item.value / 60) * 100}%`, // Assuming 60 is max for scale
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Target vs Actual Chart */}
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>เปรียบเทียบยอดขาย vs เป้าหมาย</CardTitle>
            <CardDescription>
              เปรียบเทียบยอดขายจริงกับเป้าหมาย (รายไตรมาส)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={targetVsActualData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    className="stroke-muted/30"
                  />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) =>
                      `฿${(value / 1000000).toFixed(1)}M`
                    }
                  />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  <Bar
                    dataKey="target"
                    name="เป้าหมาย"
                    fill="#94a3b8"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                  <Bar
                    dataKey="actual"
                    name="ยอดขายจริง"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Top Customers Combined Column */}
        <div className="col-span-3 flex flex-col gap-4">
          {/* Critical Alerts */}
          <Card className="shadow-sm border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <AlertOctagon className="h-4 w-4 text-red-500 mr-2" />
                แจ้งเตือนด่วน
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {criticalAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start space-x-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg"
                >
                  {alert.type === "expiry" ? (
                    <Clock className="h-5 w-5 text-red-500 mt-0.5" />
                  ) : (
                    <UserX className="h-5 w-5 text-amber-500 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {alert.message}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                      ความสำคัญระดับ{alert.severity}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Top 5 Customers */}
          <Card className="flex-1 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">5 อันดับลูกค้าสูงสุด</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCustomers.map((customer, index) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          index === 0
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">
                          {customer.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {customer.industry}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm font-bold">
                      {formatCurrency(customer.value)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
