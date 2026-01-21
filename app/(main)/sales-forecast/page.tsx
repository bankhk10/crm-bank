"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  Calendar,
  Package,
  Target,
  ArrowUp,
  ArrowDown,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

interface SalesData {
  month: string;
  monthNumber: number;
  actual: number;
  forecast: number;
  target: number;
}

interface ProductGroupForecast {
  productGroup: string;
  label: string;
  currentMonthSales: number;
  lastMonthSales: number;
  forecastNextMonth: number;
  trend: "up" | "down" | "stable";
}

interface ProductForecast {
  productId: string;
  productCode: string;
  productName: string;
  productGroup: string | null;
  currentMonthTarget: number;
  yearlyTarget: number;
  currentMonthActual: number;
  lastMonthActual: number;
  forecastNextMonth: number;
  trend: "up" | "down" | "stable";
}

const MONTHS = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

export default function SalesForecastPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [productGroupForecasts, setProductGroupForecasts] = useState<
    ProductGroupForecast[]
  >([]);
  const [productForecasts, setProductForecasts] = useState<ProductForecast[]>(
    [],
  );
  const [activeTab, setActiveTab] = useState("overview");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch actual sales
      const salesResponse = await fetch(
        `/api/sales/summary?year=${year}&groupBy=month`,
      );

      // Fetch targets
      const targetsResponse = await fetch(`/api/sales-targets?year=${year}`);

      const actualSalesMap: Record<number, number> = {};
      const targetMap: Record<number, number> = {};

      if (salesResponse.ok) {
        const salesResult = await salesResponse.json();
        if (salesResult.data) {
          salesResult.data.forEach(
            (item: { month: number; totalAmount: number }) => {
              actualSalesMap[item.month] = item.totalAmount || 0;
            },
          );
        }
      }

      // Parse targets response once and reuse
      let targetsResult: {
        monthlyTargets?: Array<{ month: number | null; targetAmount: string }>;
        productTargets?: Array<{
          productId: string;
          month: number | null;
          targetAmount: string;
          product: {
            id: string;
            productCode: string;
            name: string;
            productGroup: string | null;
          };
        }>;
        detailedTargets?: Array<{
          month: number;
          items: Array<{
            productId: string;
            amount: number;
            product: {
              id: string;
              productCode: string;
              name: string;
              productGroup: string | null;
            };
          }>;
        }>;
      } | null = null;

      const productDataMap: Record<
        string,
        {
          product: {
            id: string;
            productCode: string;
            name: string;
            productGroup: string | null;
          };
          targets: Record<number, number>;
        }
      > = {};

      if (targetsResponse.ok) {
        targetsResult = await targetsResponse.json();

        // 1. Process Legacy Monthly Targets
        if (targetsResult?.monthlyTargets) {
          targetsResult.monthlyTargets.forEach(
            (t: { month: number | null; targetAmount: string }) => {
              if (t.month !== null) {
                targetMap[t.month] =
                  (targetMap[t.month] || 0) + Number(t.targetAmount);
              }
            },
          );
        }

        // 2. Process Legacy Product Targets
        if (targetsResult?.productTargets) {
          targetsResult.productTargets.forEach((t) => {
            if (!productDataMap[t.productId]) {
              productDataMap[t.productId] = {
                product: t.product,
                targets: {},
              };
            }
            if (t.month !== null) {
              productDataMap[t.productId].targets[t.month] =
                (productDataMap[t.productId].targets[t.month] || 0) +
                Number(t.targetAmount);
            }
          });
        }

        // 3. Process New Detailed Targets (Aggregating items)
        if (targetsResult?.detailedTargets) {
          targetsResult.detailedTargets.forEach((target) => {
            const month = target.month;
            if (target.items) {
              target.items.forEach((item) => {
                // Add to total monthly target
                targetMap[month] = (targetMap[month] || 0) + item.amount;

                // Add to product specific target
                if (!productDataMap[item.productId]) {
                  productDataMap[item.productId] = {
                    product: item.product,
                    targets: {},
                  };
                }
                const pt = productDataMap[item.productId];
                pt.targets[month] = (pt.targets[month] || 0) + item.amount;
              });
            }
          });
        }
      }

      // Fetch product groups
      const groupsResponse = await fetch("/api/products/groups?perPage=100");
      let pgOptions: { value: string; label: string }[] = [];
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        pgOptions = groupsData.groups.map(
          (g: { code: string; description: string }) => ({
            value: g.code,
            label: g.description,
          }),
        );
      }

      // Generate forecast using simple moving average
      const currentMonth = new Date().getMonth() + 1;
      const data: SalesData[] = MONTHS.map((month, index) => {
        const monthNumber = index + 1;
        const actual = actualSalesMap[monthNumber] || 0;
        const target = targetMap[monthNumber] || 0;

        // Simple forecast: if future month, use average of past months or last month * growth factor
        let forecast = actual;
        if (monthNumber > currentMonth) {
          // Use average of last 3 months for forecast
          const pastMonths = [
            actualSalesMap[monthNumber - 1] || 0,
            actualSalesMap[monthNumber - 2] || 0,
            actualSalesMap[monthNumber - 3] || 0,
          ].filter((v) => v > 0);

          if (pastMonths.length > 0) {
            const avg =
              pastMonths.reduce((a, b) => a + b, 0) / pastMonths.length;
            // Add a small growth factor (2%)
            forecast = avg * 1.02;
          } else {
            forecast = target || 0;
          }
        }

        return {
          month,
          monthNumber,
          actual,
          forecast: Math.round(forecast),
          target,
        };
      });

      setSalesData(data);

      // Generate product group forecasts
      const pgForecasts: ProductGroupForecast[] = pgOptions.map((pg) => {
        // Mock data for now - in production, fetch from API
        const currentMonthSales = Math.random() * 1000000 + 500000;
        const lastMonthSales = Math.random() * 1000000 + 500000;
        const growthRate =
          lastMonthSales > 0
            ? (currentMonthSales - lastMonthSales) / lastMonthSales
            : 0;
        const forecastNextMonth = currentMonthSales * (1 + growthRate * 0.5);

        return {
          productGroup: pg.value,
          label: pg.label,
          currentMonthSales: Math.round(currentMonthSales),
          lastMonthSales: Math.round(lastMonthSales),
          forecastNextMonth: Math.round(forecastNextMonth),
          trend:
            growthRate > 0.05 ? "up" : growthRate < -0.05 ? "down" : "stable",
        };
      });

      setProductGroupForecasts(pgForecasts);

      // Generate product forecasts from product targets (Aggregated Map)
      const currentMonthVal = new Date().getMonth() + 1;
      const lastMonthVal = currentMonthVal === 1 ? 12 : currentMonthVal - 1;

      const pForecasts: ProductForecast[] = Object.values(productDataMap).map(
        (data) => {
          const currentMonthTarget = data.targets[currentMonthVal] || 0;
          const lastMonthTarget = data.targets[lastMonthVal] || 0;
          const yearlyTarget = Object.values(data.targets).reduce(
            (sum, val) => sum + val,
            0,
          );

          // For actual sales, we would fetch from sales summary - using target as placeholder
          // Note: Logic simplified for demonstration as per original code
          const currentMonthActual =
            currentMonthTarget * (0.7 + Math.random() * 0.4);
          const lastMonthActual = lastMonthTarget * (0.7 + Math.random() * 0.4);

          const growthRate =
            lastMonthActual > 0
              ? (currentMonthActual - lastMonthActual) / lastMonthActual
              : 0;
          const forecastNextMonth = currentMonthActual * (1 + growthRate * 0.5);

          return {
            productId: data.product.id,
            productCode: data.product.productCode,
            productName: data.product.name,
            productGroup: data.product.productGroup,
            currentMonthTarget,
            yearlyTarget,
            currentMonthActual: Math.round(currentMonthActual),
            lastMonthActual: Math.round(lastMonthActual),
            forecastNextMonth: Math.round(forecastNextMonth),
            trend:
              growthRate > 0.05
                ? "up"
                : growthRate < -0.05
                  ? "down"
                  : ("stable" as const),
          };
        },
      );

      setProductForecasts(pForecasts);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `฿${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `฿${(value / 1000).toFixed(0)}K`;
    }
    return `฿${value.toFixed(0)}`;
  };

  const formatFullCurrency = (value: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate summary stats
  const currentMonth = new Date().getMonth() + 1;
  const totalActual = salesData
    .filter((d) => d.monthNumber <= currentMonth)
    .reduce((sum, d) => sum + d.actual, 0);
  const totalForecast = salesData.reduce((sum, d) => sum + d.forecast, 0);
  const totalTarget = salesData.reduce((sum, d) => sum + d.target, 0);
  const forecastVsTarget =
    totalTarget > 0 ? ((totalForecast / totalTarget) * 100).toFixed(1) : "0";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                การคาดการณ์ยอดขาย
              </h1>
              <p className="text-slate-500 text-sm">
                วิเคราะห์และคาดการณ์ยอดขายตามข้อมูลย้อนหลัง
              </p>
            </div>
          </div>
        </div>

        {/* Year Selector & Refresh */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 shadow-sm border border-slate-200/60">
            <button
              onClick={() => setYear((y) => y - 1)}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-2 px-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-slate-800 text-lg">{year}</span>
            </div>
            <button
              onClick={() => setYear((y) => y + 1)}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          <Button
            onClick={fetchData}
            variant="outline"
            size="icon"
            className="rounded-xl"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">ยอดขายจริง (YTD)</p>
                <p className="text-2xl font-bold mt-1">
                  {formatFullCurrency(totalActual)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/20">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm">คาดการณ์ทั้งปี</p>
                <p className="text-2xl font-bold mt-1">
                  {formatFullCurrency(totalForecast)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/20">
                <Target className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">เป้าหมายทั้งปี</p>
                <p className="text-2xl font-bold mt-1">
                  {formatFullCurrency(totalTarget)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/20">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">คาดการณ์ vs เป้าหมาย</p>
                <p className="text-2xl font-bold mt-1">{forecastVsTarget}%</p>
              </div>
              <div className="p-3 rounded-xl bg-white/20">
                {Number(forecastVsTarget) >= 100 ? (
                  <ArrowUp className="w-6 h-6" />
                ) : (
                  <ArrowDown className="w-6 h-6" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3 h-14 p-1 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60">
          <TabsTrigger
            value="overview"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-xl transition-all"
          >
            <TrendingUp className="w-4 h-4" />
            <span>ภาพรวมคาดการณ์</span>
          </TabsTrigger>
          <TabsTrigger
            value="productGroup"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-600 data-[state=active]:text-white rounded-xl transition-all"
          >
            <Package className="w-4 h-4" />
            <span>คาดการณ์ตามกลุ่มสินค้า</span>
          </TabsTrigger>
          <TabsTrigger
            value="product"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white rounded-xl transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>คาดการณ์ตามสินค้า</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Line Chart */}
          <Card className="overflow-hidden rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <CardTitle>แนวโน้มยอดขายและคาดการณ์</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                    <YAxis
                      stroke="#64748b"
                      fontSize={12}
                      tickFormatter={formatCurrency}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "none",
                        borderRadius: "12px",
                        color: "#fff",
                      }}
                      formatter={(value: number) => [
                        formatFullCurrency(value),
                        "",
                      ]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      name="ยอดขายจริง"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: "#3b82f6", strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="forecast"
                      name="คาดการณ์"
                      stroke="#10b981"
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={{ fill: "#10b981", strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      name="เป้าหมาย"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ fill: "#f59e0b", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Comparison */}
          <Card className="overflow-hidden rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                </div>
                <CardTitle>เปรียบเทียบรายเดือน</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                    <YAxis
                      stroke="#64748b"
                      fontSize={12}
                      tickFormatter={formatCurrency}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "none",
                        borderRadius: "12px",
                        color: "#fff",
                      }}
                      formatter={(value: number) => [
                        formatFullCurrency(value),
                        "",
                      ]}
                    />
                    <Legend />
                    <Bar
                      dataKey="actual"
                      name="ยอดขายจริง"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="forecast"
                      name="คาดการณ์"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="target"
                      name="เป้าหมาย"
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Group Tab */}
        <TabsContent value="productGroup" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productGroupForecasts.map((pg) => (
              <Card
                key={pg.productGroup}
                className="overflow-hidden rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{pg.label}</CardTitle>
                    <div
                      className={`p-2 rounded-lg ${
                        pg.trend === "up"
                          ? "bg-emerald-100 text-emerald-600"
                          : pg.trend === "down"
                            ? "bg-red-100 text-red-600"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {pg.trend === "up" ? (
                        <ArrowUp className="w-4 h-4" />
                      ) : pg.trend === "down" ? (
                        <ArrowDown className="w-4 h-4" />
                      ) : (
                        <TrendingUp className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">
                        เดือนปัจจุบัน
                      </span>
                      <span className="font-semibold text-slate-800">
                        {formatFullCurrency(pg.currentMonthSales)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">เดือนก่อน</span>
                      <span className="font-medium text-slate-600">
                        {formatFullCurrency(pg.lastMonthSales)}
                      </span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-blue-600">
                          คาดการณ์เดือนหน้า
                        </span>
                        <span className="font-bold text-blue-600">
                          {formatFullCurrency(pg.forecastNextMonth)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Product Tab */}
        <TabsContent value="product" className="space-y-6">
          {productForecasts.length === 0 ? (
            <Card className="overflow-hidden rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-lg">
              <CardContent className="p-12 text-center">
                <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  ยังไม่มีข้อมูลเป้าหมายรายสินค้า
                </h3>
                <p className="text-slate-500">
                  กรุณาตั้งเป้าหมายรายสินค้าในหน้า
                  &quot;ตั้งเป้าหมายยอดขาย&quot;
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {productForecasts.map((pf) => (
                <Card
                  key={pf.productId}
                  className="overflow-hidden rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono bg-teal-100 text-teal-700 px-2 py-0.5 rounded">
                            {pf.productCode}
                          </span>
                          {pf.productGroup && (
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                              {pf.productGroup}
                            </span>
                          )}
                        </div>
                        <CardTitle
                          className="text-base truncate"
                          title={pf.productName}
                        >
                          {pf.productName}
                        </CardTitle>
                      </div>
                      <div
                        className={`p-2 rounded-lg ${
                          pf.trend === "up"
                            ? "bg-emerald-100 text-emerald-600"
                            : pf.trend === "down"
                              ? "bg-red-100 text-red-600"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {pf.trend === "up" ? (
                          <ArrowUp className="w-4 h-4" />
                        ) : pf.trend === "down" ? (
                          <ArrowDown className="w-4 h-4" />
                        ) : (
                          <TrendingUp className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">
                          เป้าหมายเดือนนี้
                        </span>
                        <span className="font-semibold text-teal-600">
                          {formatFullCurrency(pf.currentMonthTarget)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">
                          ยอดขายเดือนนี้
                        </span>
                        <span className="font-semibold text-slate-800">
                          {formatFullCurrency(pf.currentMonthActual)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">
                          เดือนก่อน
                        </span>
                        <span className="font-medium text-slate-600">
                          {formatFullCurrency(pf.lastMonthActual)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">
                          เป้าหมายทั้งปี
                        </span>
                        <span className="font-medium text-purple-600">
                          {formatFullCurrency(pf.yearlyTarget)}
                        </span>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-blue-600">
                            คาดการณ์เดือนหน้า
                          </span>
                          <span className="font-bold text-blue-600">
                            {formatFullCurrency(pf.forecastNextMonth)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
