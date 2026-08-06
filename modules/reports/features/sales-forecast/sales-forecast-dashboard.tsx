"use client";

import { useState, useMemo, Fragment, useEffect, useCallback } from "react";
import { Target, Users, Calendar, Clock, CheckCheck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { DetailHero } from "@/components/custom/detail-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSalesForecastDashboardData } from "../../application/get-sales-forecast-dashboard-data";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

const chartConfig = {
  forecast: {
    label: "Forecast",
    color: "#3b82f6",
  },
  invoice: {
    label: "Invoice",
    color: "#10b981",
  },
  lastYearInvoice: {
    label: "Invoice (ปีที่แล้ว)",
    color: "#f59e0b",
  },
} satisfies ChartConfig;

export function SalesForecastDashboard() {
  const [salespersons, setSalespersons] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedSalespersons, setSelectedSalespersons] = useState<string[]>(
    [],
  );
  const [viewMode, setViewMode] = useState<"month" | "quarter">("month");
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [mockData, setMockData] = useState<
    Record<
      string,
      {
        month: number;
        forecast: number;
        invoice: number;
        lastYearInvoice: number;
      }[]
    >
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [visibleLines, setVisibleLines] = useState<Record<string, boolean>>({
    forecast: true,
    invoice: true,
    lastYearInvoice: true,
  });

  const toggleLine = useCallback((dataKey: string) => {
    setVisibleLines((prev) => ({ ...prev, [dataKey]: !prev[dataKey] }));
  }, []);

  useEffect(() => {
    let isMounted = true;
    getSalesForecastDashboardData(parseInt(selectedYear, 10)).then((res) => {
      if (isMounted) {
        setSalespersons(res.employees);
        setMockData(res.data);
        setSelectedSalespersons(res.employees.map((sp) => sp.id));
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [selectedYear]);

  const timeLabels = viewMode === "month" ? MONTHS : QUARTERS;

  const aggregatedData = useMemo(() => {
    return timeLabels.map((period, index) => {
      let totalForecast = 0;
      let totalInvoice = 0;
      let totalLastYearInvoice = 0;

      selectedSalespersons.forEach((spId) => {
        const spData = mockData[spId];
        if (!spData) return;

        if (viewMode === "month") {
          totalForecast += spData[index].forecast;
          totalInvoice += spData[index].invoice;
          totalLastYearInvoice += spData[index].lastYearInvoice || 0;
        } else {
          const startIdx = index * 3;
          for (let i = startIdx; i < startIdx + 3; i++) {
            totalForecast += spData[i].forecast;
            totalInvoice += spData[i].invoice;
            totalLastYearInvoice += spData[i].lastYearInvoice || 0;
          }
        }
      });

      return {
        month: period,
        forecast: totalForecast,
        invoice: totalInvoice,
        lastYearInvoice: totalLastYearInvoice,
      };
    });
  }, [selectedSalespersons, viewMode, timeLabels, mockData]);

  const getPersonTableData = useCallback(
    (spId: string) => {
      const rawData = mockData[spId];
      if (!rawData) return null;

      const periodsData = timeLabels.map((period, index) => {
        let f = 0;
        let i = 0;
        if (viewMode === "month") {
          f = rawData[index].forecast;
          i = rawData[index].invoice;
        } else {
          const startIdx = index * 3;
          for (let j = startIdx; j < startIdx + 3; j++) {
            f += rawData[j].forecast;
            i += rawData[j].invoice;
          }
        }
        return { forecast: f, invoice: i };
      });

      const totalForecast = periodsData.reduce((sum, d) => sum + d.forecast, 0);
      const totalInvoice = periodsData.reduce((sum, d) => sum + d.invoice, 0);

      return { periodsData, totalForecast, totalInvoice };
    },
    [mockData, timeLabels, viewMode],
  );

  const sortedSelectedSalespersons = useMemo(() => {
    return [...selectedSalespersons].sort((a, b) => {
      const pDataA = getPersonTableData(a);
      const pDataB = getPersonTableData(b);

      const hasDataA =
        pDataA && (pDataA.totalForecast > 0 || pDataA.totalInvoice > 0);
      const hasDataB =
        pDataB && (pDataB.totalForecast > 0 || pDataB.totalInvoice > 0);

      if (hasDataA && !hasDataB) return -1;
      if (!hasDataA && hasDataB) return 1;

      const totalA = (pDataA?.totalForecast || 0) + (pDataA?.totalInvoice || 0);
      const totalB = (pDataB?.totalForecast || 0) + (pDataB?.totalInvoice || 0);
      return totalB - totalA;
    });
  }, [selectedSalespersons, getPersonTableData]);

  const sortedYtdSalespersons = useMemo(() => {
    const currentMonthIndex = new Date().getMonth();
    return [...selectedSalespersons].sort((a, b) => {
      const spDataA = mockData[a] || [];
      const spDataB = mockData[b] || [];

      const ytdForecastA = spDataA
        .slice(0, currentMonthIndex + 1)
        .reduce((sum, d) => sum + d.forecast, 0);
      const ytdInvoiceA = spDataA
        .slice(0, currentMonthIndex + 1)
        .reduce((sum, d) => sum + d.invoice, 0);

      const ytdForecastB = spDataB
        .slice(0, currentMonthIndex + 1)
        .reduce((sum, d) => sum + d.forecast, 0);
      const ytdInvoiceB = spDataB
        .slice(0, currentMonthIndex + 1)
        .reduce((sum, d) => sum + d.invoice, 0);

      const hasDataA = ytdForecastA > 0 || ytdInvoiceA > 0;
      const hasDataB = ytdForecastB > 0 || ytdInvoiceB > 0;

      if (hasDataA && !hasDataB) return -1;
      if (!hasDataA && hasDataB) return 1;

      const totalA = ytdForecastA + ytdInvoiceA;
      const totalB = ytdForecastB + ytdInvoiceB;
      return totalB - totalA;
    });
  }, [selectedSalespersons, mockData]);

  const grandTotalOfTotals = useMemo(() => {
    return aggregatedData.reduce(
      (acc, curr) => {
        acc.forecast += curr.forecast;
        acc.invoice += curr.invoice;
        return acc;
      },
      { forecast: 0, invoice: 0 },
    );
  }, [aggregatedData]);

  const formatDiff = (diff: number) => {
    if (diff < 0) {
      return (
        <span className="text-rose-600">
          - {new Intl.NumberFormat("th-TH").format(Math.abs(diff))}
        </span>
      );
    }
    return (
      <span className="text-emerald-500">
        {new Intl.NumberFormat("th-TH").format(diff)}
      </span>
    );
  };

  const formatPercent = (percent: number | null) => {
    if (percent === null) {
      return (
        <div className="text-slate-400 w-full h-full py-3 px-4 flex items-center justify-end">
          -
        </div>
      );
    }
    const val = Math.round(percent * 100);
    if (val < 0) {
      return (
        <div className="bg-rose-200 text-rose-700 w-full h-full py-3 px-4 flex items-center justify-end">
          {val}%
        </div>
      );
    }
    return (
      <div className="text-emerald-500 w-full h-full py-3 px-4 flex items-center justify-end">
        {val}%
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <DetailHero
          backUrl="/reports"
          backLabel="หน้ารายงาน"
          title="รายงานการขายเทียบกับคาดการณ์ยอดขาย"
          icon={<Target className="h-8 w-8 text-white" />}
          backgroundColor="#1e293b"
          accentColor="#8b5cf6"
        />
      </div>

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Filter Section */}
        <Card className="rounded-2xl border-0 shadow-lg shadow-slate-200/60 overflow-hidden bg-white">
          {/* Gradient header strip */}
          <div className="h-1.5 bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500" />
          <CardContent className="pt-5 pb-6 px-6">
            <div className="flex flex-col gap-6">
              {/* Salespersons Section */}
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-100">
                      <Users className="h-4 w-4 text-violet-600" />
                    </div>
                    <label className="text-sm font-semibold text-slate-800">
                      พนักงานขาย
                    </label>
                  </div>
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-violet-100 text-violet-700 border-0 text-xs font-medium px-2.5 py-0.5"
                  >
                    {selectedSalespersons.length}/{salespersons.length} คน
                  </Badge>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-100">
                      <CheckCheck className="h-4 w-4 text-violet-600" />
                    </div>
                    <label className="text-sm font-semibold text-slate-800">
                      ตัวเลือก
                    </label>
                  </div>
                  {/* <div className="flex items-center gap-1 ml-auto"> */}
                  <button
                    onClick={() =>
                      setSelectedSalespersons(salespersons.map((sp) => sp.id))
                    }
                    className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-md transition-all duration-200"
                  >
                    <CheckCheck className="h-3 w-3" />
                    เลือกทั้งหมด
                  </button>
                  <button
                    onClick={() => setSelectedSalespersons([])}
                    className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-md transition-all duration-200"
                  >
                    <X className="h-3 w-3" />
                    ล้าง
                  </button>
                  {/* </div> */}
                </div>
                <ToggleGroup
                  type="multiple"
                  value={selectedSalespersons}
                  onValueChange={(val) => {
                    setSelectedSalespersons(val);
                  }}
                  className="flex flex-wrap justify-start gap-2"
                >
                  {salespersons.map((sp) => (
                    <ToggleGroupItem
                      key={sp.id}
                      value={sp.id}
                      className="rounded-full px-4 py-1.5 text-sm border border-slate-200 bg-white text-slate-600 shadow-sm hover:shadow-md hover:border-violet-300 hover:bg-violet-50 data-[state=on]:bg-gradient-to-r data-[state=on]:from-violet-600 data-[state=on]:to-indigo-600 data-[state=on]:text-white data-[state=on]:border-transparent data-[state=on]:shadow-md data-[state=on]:shadow-violet-200/50 transition-all duration-200"
                    >
                      {sp.name}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100" />

              {/* Year & View Mode Row */}
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-10">
                {/* Year Selector */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <label className="text-sm font-semibold text-slate-800">
                      ปี
                    </label>
                  </div>
                  <ToggleGroup
                    type="single"
                    value={selectedYear}
                    onValueChange={(val) => {
                      if (val && val !== selectedYear) {
                        setIsLoading(true);
                        setSelectedYear(val);
                      }
                    }}
                    className="justify-start bg-slate-100/80 p-1 rounded-xl gap-0.5"
                  >
                    <ToggleGroupItem
                      value="2024"
                      className="rounded-lg px-5 py-1.5 text-sm font-medium text-slate-500 border-transparent data-[state=on]:bg-white data-[state=on]:text-slate-900 data-[state=on]:shadow-md data-[state=on]:shadow-slate-200/50 data-[state=on]:border-slate-200/80 transition-all duration-200"
                    >
                      2024
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="2025"
                      className="rounded-lg px-5 py-1.5 text-sm font-medium text-slate-500 border-transparent data-[state=on]:bg-white data-[state=on]:text-slate-900 data-[state=on]:shadow-md data-[state=on]:shadow-slate-200/50 data-[state=on]:border-slate-200/80 transition-all duration-200"
                    >
                      2025
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="2026"
                      className="rounded-lg px-5 py-1.5 text-sm font-medium text-slate-500 border-transparent data-[state=on]:bg-white data-[state=on]:text-slate-900 data-[state=on]:shadow-md data-[state=on]:shadow-slate-200/50 data-[state=on]:border-slate-200/80 transition-all duration-200"
                    >
                      2026
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>

                {/* Vertical Divider (desktop) */}
                <div className="hidden sm:block w-px bg-slate-200 self-stretch" />

                {/* Time View Selector */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100">
                      <Clock className="h-4 w-4 text-emerald-600" />
                    </div>
                    <label className="text-sm font-semibold text-slate-800">
                      มุมมองเวลา
                    </label>
                  </div>
                  <ToggleGroup
                    type="single"
                    value={viewMode}
                    onValueChange={(val) => {
                      if (val) setViewMode(val as "month" | "quarter");
                    }}
                    className="justify-start bg-slate-100/80 p-1 rounded-xl gap-0.5"
                  >
                    <ToggleGroupItem
                      value="month"
                      className="rounded-lg px-5 py-1.5 text-sm font-medium text-slate-500 border-transparent data-[state=on]:bg-white data-[state=on]:text-slate-900 data-[state=on]:shadow-md data-[state=on]:shadow-slate-200/50 data-[state=on]:border-slate-200/80 transition-all duration-200"
                    >
                      รายเดือน
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="quarter"
                      className="rounded-lg px-5 py-1.5 text-sm font-medium text-slate-500 border-transparent data-[state=on]:bg-white data-[state=on]:text-slate-900 data-[state=on]:shadow-md data-[state=on]:shadow-slate-200/50 data-[state=on]:border-slate-200/80 transition-all duration-200"
                    >
                      รายไตรมาส
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart Section */}
        <Card className="rounded-2xl border-0 shadow-lg shadow-slate-200/60 overflow-hidden bg-white">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 py-5">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-200/50">
                <Target className="h-4 w-4 text-white" />
              </div>
              <span>กราฟเปรียบเทียบยอดขายและคาดการณ์</span>
              <Badge
                variant="secondary"
                className="rounded-full bg-indigo-100 text-indigo-700 border-0 text-xs font-semibold px-2.5 py-0.5"
              >
                ปี {selectedYear}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 pb-2 pl-0">
            {/* Interactive Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 px-6 pb-4">
              {(Object.keys(chartConfig) as (keyof typeof chartConfig)[]).map(
                (key) => (
                  <button
                    key={key}
                    onClick={() => toggleLine(key)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all duration-200 ${
                      visibleLines[key]
                        ? "border-slate-200 bg-white shadow-sm hover:shadow-md"
                        : "border-slate-100 bg-slate-50 opacity-40 hover:opacity-60"
                    }`}
                  >
                    <span
                      className="w-4 h-3 rounded-sm inline-block border"
                      style={{
                        backgroundColor: visibleLines[key]
                          ? chartConfig[key].color
                          : "transparent",
                        borderColor: chartConfig[key].color,
                      }}
                    />
                    <span className="text-slate-700">
                      {chartConfig[key].label}
                    </span>
                  </button>
                ),
              )}
            </div>
            <ChartContainer config={chartConfig} className="h-[450px] w-full">
              <ComposedChart
                data={aggregatedData}
                margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="fillForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-forecast)"
                      stopOpacity={0.15}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-forecast)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                  <linearGradient id="fillInvoice" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-invoice)"
                      stopOpacity={0.15}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-invoice)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                  <linearGradient
                    id="fillLastYearInvoice"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--color-lastYearInvoice)"
                      stopOpacity={0.12}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-lastYearInvoice)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  tickFormatter={(value) =>
                    new Intl.NumberFormat("th-TH").format(value)
                  }
                  width={100}
                />
                <ChartTooltip
                  cursor={{
                    stroke: "#94a3b8",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                {/* Subtle area fills */}
                {visibleLines.lastYearInvoice && (
                  <Area
                    type="monotone"
                    dataKey="lastYearInvoice"
                    fill="url(#fillLastYearInvoice)"
                    stroke="none"
                    tooltipType="none"
                    isAnimationActive={true}
                  />
                )}
                {visibleLines.forecast && (
                  <Area
                    type="monotone"
                    dataKey="forecast"
                    fill="url(#fillForecast)"
                    stroke="none"
                    tooltipType="none"
                    isAnimationActive={true}
                  />
                )}
                {visibleLines.invoice && (
                  <Area
                    type="monotone"
                    dataKey="invoice"
                    fill="url(#fillInvoice)"
                    stroke="none"
                    tooltipType="none"
                    isAnimationActive={true}
                  />
                )}
                {/* Lines on top */}
                {visibleLines.lastYearInvoice && (
                  <Line
                    type="monotone"
                    dataKey="lastYearInvoice"
                    name="Invoice (ปีที่แล้ว)"
                    stroke="var(--color-lastYearInvoice)"
                    strokeWidth={2}
                    dot={{
                      r: 4,
                      fill: "var(--color-lastYearInvoice)",
                      fillOpacity: 1,
                      stroke: "white",
                      strokeWidth: 1.5,
                    }}
                    activeDot={{
                      r: 6,
                      fill: "var(--color-lastYearInvoice)",
                      fillOpacity: 1,
                      stroke: "white",
                      strokeWidth: 2.5,
                    }}
                  />
                )}
                {visibleLines.forecast && (
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    name="Forecast"
                    stroke="var(--color-forecast)"
                    strokeWidth={2}
                    dot={{
                      r: 4,
                      fill: "var(--color-forecast)",
                      fillOpacity: 1,
                      stroke: "white",
                      strokeWidth: 1.5,
                    }}
                    activeDot={{
                      r: 7,
                      fill: "var(--color-forecast)",
                      fillOpacity: 1,
                      stroke: "white",
                      strokeWidth: 2.5,
                    }}
                  />
                )}
                {visibleLines.invoice && (
                  <Line
                    type="monotone"
                    dataKey="invoice"
                    name="Invoice"
                    stroke="var(--color-invoice)"
                    strokeWidth={2.5}
                    dot={{
                      r: 4,
                      fill: "var(--color-invoice)",
                      fillOpacity: 1,
                      stroke: "white",
                      strokeWidth: 1.5,
                    }}
                    activeDot={{
                      r: 7,
                      fill: "var(--color-invoice)",
                      fillOpacity: 1,
                      stroke: "white",
                      strokeWidth: 2.5,
                    }}
                  />
                )}
              </ComposedChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Table Section */}
        <Card className="rounded-2xl border-0 shadow-lg shadow-slate-200/60 overflow-hidden bg-white">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 py-5">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-md shadow-blue-200/50">
                <Target className="h-4 w-4 text-white" />
              </div>
              <span>ข้อมูลตารางยอดขายและคาดการณ์</span>
              <Badge
                variant="secondary"
                className="rounded-full bg-blue-100 text-blue-700 border-0 text-xs font-semibold px-2.5 py-0.5"
              >
                {viewMode === "month" ? "รายเดือน" : "รายไตรมาส"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto w-full max-h-[550px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              <Table className="min-w-max border-collapse relative">
                <TableHeader className="sticky top-0 z-20 shadow-[0_1px_0_0_#e2e8f0]">
                  <TableRow>
                    <TableHead
                      className="font-bold text-slate-700 min-w-[100px] bg-gradient-to-b from-slate-100 to-slate-50 sticky left-0 z-30 shadow-[1px_0_0_0_#e2e8f0]"
                      rowSpan={2}
                    >
                      ชื่อ
                    </TableHead>
                    {timeLabels.map((label) => (
                      <TableHead
                        key={label}
                        colSpan={2}
                        className="text-center font-bold text-slate-700 bg-gradient-to-b from-slate-100 to-slate-50 border-x border-slate-200/60"
                      >
                        {label}
                      </TableHead>
                    ))}
                    <TableHead
                      colSpan={2}
                      className="text-center font-bold text-white bg-gradient-to-b from-indigo-500 to-indigo-600 border-x border-indigo-400/30"
                    >
                      ยอดรวมทั้งปี
                    </TableHead>
                  </TableRow>
                  <TableRow>
                    {timeLabels.map((label) => (
                      <Fragment key={label + "-sub"}>
                        <TableHead className="text-right text-xs font-semibold text-blue-600 bg-gradient-to-b from-blue-50 to-slate-50 border-l border-slate-200/50 min-w-[110px]">
                          Forecast
                        </TableHead>
                        <TableHead className="text-right text-xs font-semibold text-emerald-600 bg-gradient-to-b from-emerald-50 to-slate-50 border-r border-slate-200/50 min-w-[110px]">
                          Invoice
                        </TableHead>
                      </Fragment>
                    ))}
                    <TableHead className="text-right text-xs font-semibold text-blue-600 bg-blue-50/80 border-l border-indigo-400/30 min-w-[110px]">
                      Forecast
                    </TableHead>
                    <TableHead className="text-right text-xs font-semibold text-emerald-600 bg-emerald-50/80 border-r border-indigo-400/30 min-w-[110px]">
                      Invoice
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSelectedSalespersons.map((spId, rowIdx) => {
                    const sp = salespersons.find((s) => s.id === spId);
                    const pData = getPersonTableData(spId);
                    if (!sp || !pData) return null;

                    return (
                      <TableRow
                        key={sp.id}
                        className={`hover:bg-blue-50/30 transition-colors ${rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}
                      >
                        <TableCell
                          className={`font-medium text-slate-700 sticky left-0 z-10 border-r border-slate-200/50 shadow-[1px_0_0_0_#f1f5f9] ${rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}
                        >
                          {sp.name}
                        </TableCell>
                        {pData.periodsData.map((mData, idx) => {
                          return (
                            <Fragment key={idx}>
                              <TableCell className="text-right text-slate-600 border-l border-slate-100/50">
                                {mData.forecast > 0
                                  ? new Intl.NumberFormat("th-TH").format(
                                      mData.forecast,
                                    )
                                  : "-"}
                              </TableCell>
                              <TableCell className="text-right text-emerald-600 border-r border-slate-100/50">
                                {mData.invoice > 0
                                  ? new Intl.NumberFormat("th-TH").format(
                                      mData.invoice,
                                    )
                                  : "-"}
                              </TableCell>
                            </Fragment>
                          );
                        })}
                        <TableCell className="text-right font-semibold text-slate-700 bg-indigo-50/40 border-l border-indigo-200/50">
                          {pData.totalForecast > 0
                            ? new Intl.NumberFormat("th-TH").format(
                                pData.totalForecast,
                              )
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-emerald-600 bg-indigo-50/40 border-r border-indigo-200/50">
                          {pData.totalInvoice > 0
                            ? new Intl.NumberFormat("th-TH").format(
                                pData.totalInvoice,
                              )
                            : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {selectedSalespersons.length > 0 && (
                    <TableRow className="sticky bottom-0 z-20 shadow-[0_-1px_0_0_#e2e8f0]">
                      <TableCell className="font-bold text-white sticky left-0 z-30 bg-gradient-to-r from-slate-700 to-slate-600 border-r border-slate-500/50 shadow-[1px_0_0_0_#475569]">
                        ยอดรวม
                      </TableCell>
                      {aggregatedData.map((mData) => (
                        <Fragment key={mData.month + "-total"}>
                          <TableCell className="text-right font-bold text-white bg-gradient-to-r from-slate-700 to-slate-600 border-l border-slate-500/30">
                            {mData.forecast > 0
                              ? new Intl.NumberFormat("th-TH").format(
                                  mData.forecast,
                                )
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right font-bold text-emerald-300 bg-gradient-to-r from-slate-700 to-slate-600 border-r border-slate-500/30">
                            {mData.invoice > 0
                              ? new Intl.NumberFormat("th-TH").format(
                                  mData.invoice,
                                )
                              : "-"}
                          </TableCell>
                        </Fragment>
                      ))}
                      <TableCell className="text-right font-bold text-white bg-gradient-to-r from-indigo-700 to-indigo-600 border-l border-indigo-500/50">
                        {grandTotalOfTotals.forecast > 0
                          ? new Intl.NumberFormat("th-TH").format(
                              grandTotalOfTotals.forecast,
                            )
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-300 bg-gradient-to-r from-indigo-700 to-indigo-600 border-r border-indigo-500/50">
                        {grandTotalOfTotals.invoice > 0
                          ? new Intl.NumberFormat("th-TH").format(
                              grandTotalOfTotals.invoice,
                            )
                          : "-"}
                      </TableCell>
                    </TableRow>
                  )}
                  {selectedSalespersons.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={27}
                        className="text-center py-16 text-slate-400"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Users className="h-8 w-8 text-slate-300" />
                          <span>กรุณาเลือกพนักงานขายอย่างน้อย 1 คน</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        {/* YTD Summary Section */}
        <Card className="rounded-2xl border-0 shadow-lg shadow-slate-200/60 overflow-hidden bg-white">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 py-5">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-200/50">
                <Target className="h-4 w-4 text-white" />
              </div>
              <span>สรุปยอดขาย YTD</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              <Table className="min-w-max border-collapse relative">
                <TableHeader className="sticky top-0 z-20 shadow-[0_1px_0_0_#e2e8f0]">
                  <TableRow>
                    <TableHead
                      className="font-bold text-slate-700 min-w-[50px] bg-gradient-to-b from-slate-100 to-slate-50 sticky left-0 z-30 shadow-[1px_0_0_0_#e2e8f0]"
                      rowSpan={2}
                    >
                      ชื่อ
                    </TableHead>
                    <TableHead
                      colSpan={4}
                      className="text-center font-bold text-white bg-gradient-to-r from-amber-400 to-orange-500 border-x border-amber-300/50"
                      rowSpan={1}
                    >
                      YTD
                    </TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead className="text-right text-xs font-bold text-blue-600 bg-gradient-to-b from-blue-50 to-slate-50 border-l border-slate-200/50 min-w-[120px]">
                      Forecast
                    </TableHead>
                    <TableHead className="text-right text-xs font-bold text-emerald-600 bg-gradient-to-b from-emerald-50 to-slate-50 border-x border-slate-200/50 min-w-[120px]">
                      Invoice
                    </TableHead>
                    <TableHead className="text-right text-xs font-bold text-rose-600 bg-gradient-to-b from-rose-50 to-slate-50 border-r border-slate-200/50 min-w-[120px]">
                      Variance
                    </TableHead>
                    <TableHead className="text-right text-xs font-bold text-slate-700 bg-gradient-to-b from-slate-100 to-slate-50 border-r border-slate-200/50 min-w-[80px]">
                      Variance %
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedYtdSalespersons.map((spId, rowIdx) => {
                    const sp = salespersons.find((s) => s.id === spId);
                    const spData = mockData[spId];
                    if (!sp || !spData) return null;

                    const currentMonthIndex = new Date().getMonth();

                    const ytdForecast = spData
                      .slice(0, currentMonthIndex + 1)
                      .reduce((sum, d) => sum + d.forecast, 0);

                    const ytdInvoice = spData
                      .slice(0, currentMonthIndex + 1)
                      .reduce((sum, d) => sum + d.invoice, 0);

                    const diff = ytdInvoice - ytdForecast;
                    const percent =
                      ytdForecast === 0 ? null : diff / ytdForecast;

                    return (
                      <TableRow
                        key={sp.id}
                        className={`hover:bg-amber-50/30 transition-colors ${rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}
                      >
                        <TableCell
                          className={`font-medium text-slate-700 sticky left-0 z-10 border-r border-slate-200/50 shadow-[1px_0_0_0_#f1f5f9] ${rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}
                        >
                          {sp.name}
                        </TableCell>
                        <TableCell className="text-right text-slate-600 border-l border-slate-200/30">
                          {ytdForecast > 0
                            ? new Intl.NumberFormat("th-TH").format(ytdForecast)
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right text-emerald-600 border-x border-slate-200/30">
                          {ytdInvoice > 0
                            ? new Intl.NumberFormat("th-TH").format(ytdInvoice)
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right border-r border-slate-200/30">
                          {formatDiff(diff)}
                        </TableCell>
                        <TableCell className="text-right border-r border-slate-200/30 p-0 align-middle">
                          {formatPercent(percent)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {selectedSalespersons.length > 0 &&
                    (() => {
                      const currentMonthIndex = new Date().getMonth();
                      let gtYtdForecast = 0;
                      let gtYtdInvoice = 0;

                      selectedSalespersons.forEach((spId) => {
                        const spData = mockData[spId];
                        if (spData) {
                          gtYtdForecast += spData
                            .slice(0, currentMonthIndex + 1)
                            .reduce((sum, d) => sum + d.forecast, 0);
                          gtYtdInvoice += spData
                            .slice(0, currentMonthIndex + 1)
                            .reduce((sum, d) => sum + d.invoice, 0);
                        }
                      });

                      const gtDiff = gtYtdInvoice - gtYtdForecast;
                      const gtPercent =
                        gtYtdForecast === 0 ? null : gtDiff / gtYtdForecast;
                      return (
                        <TableRow className="sticky bottom-0 z-20 shadow-[0_-1px_0_0_#e2e8f0]">
                          <TableCell className="font-bold sticky left-0 z-30">
                            ยอดรวม
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {gtYtdForecast > 0
                              ? new Intl.NumberFormat("th-TH").format(
                                  gtYtdForecast,
                                )
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right font-bold text-emerald-600">
                            {gtYtdInvoice > 0
                              ? new Intl.NumberFormat("th-TH").format(
                                  gtYtdInvoice,
                                )
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {formatDiff(gtDiff)}
                          </TableCell>
                          <TableCell className="text-right font-bold bg-gradient-to-r from-slate-700 to-slate-600 border-r border-slate-500/30 p-0 align-middle">
                            {formatPercent(gtPercent)}
                          </TableCell>
                        </TableRow>
                      );
                    })()}
                  {selectedSalespersons.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-16 text-slate-400"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Users className="h-8 w-8 text-slate-300" />
                          <span>กรุณาเลือกพนักงานขายอย่างน้อย 1 คน</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
