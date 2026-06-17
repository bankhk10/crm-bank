"use client";

import { useState, useMemo, Fragment } from "react";
import { Target, Filter } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
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

const MOCK_SALESPERSONS = [
  { id: "sp1", name: "เจน" },
  { id: "sp2", name: "ตุ้ม" },
  { id: "sp3", name: "ท็อป" },
  { id: "sp4", name: "นุ่ม" },
  { id: "sp5", name: "ปลั๊กไฟ" },
  { id: "sp6", name: "ป๊อป" },
  { id: "sp7", name: "ออฟฟิศ" },
  { id: "sp8", name: "อ้อม" },
  { id: "sp9", name: "แอ๋ว" },
  { id: "sp10", name: "โอม" },
];

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

// Mock data generator for a specific salesperson
const generateMockDataForPerson = (seed: number) => {
  return MONTHS.map((month, index) => {
    // Generate some somewhat realistic curves
    // e.g. forecast starts high and drops or fluctuates
    const baseForecast = 1000000 + Math.sin(seed + index) * 500000;
    const baseInvoice = baseForecast * (0.6 + (Math.random() * 0.4)); // some variance

    // As seen in the picture, invoice might drop to zero after May
    const invoice = index < 5 ? Math.max(0, baseInvoice) : 0;

    return {
      month,
      forecast: Math.round(baseForecast),
      invoice: Math.round(invoice),
    };
  });
};

const MOCK_DATA = MOCK_SALESPERSONS.reduce(
  (acc, sp, index) => {
    acc[sp.id] = generateMockDataForPerson(index);
    return acc;
  },
  {} as Record<string, { month: string; forecast: number; invoice: number }[]>
);

export function SalesForecastDashboard() {
  const [selectedSalespersons, setSelectedSalespersons] = useState<string[]>([
    "sp2", // Default to "ตุ้ม"
  ]);
  const [viewMode, setViewMode] = useState<"month" | "quarter">("month");

  const timeLabels = viewMode === "month" ? MONTHS : QUARTERS;

  const aggregatedData = useMemo(() => {
    return timeLabels.map((period, index) => {
      let totalForecast = 0;
      let totalInvoice = 0;

      selectedSalespersons.forEach((spId) => {
        const spData = MOCK_DATA[spId];
        if (!spData) return;

        if (viewMode === "month") {
          totalForecast += spData[index].forecast;
          totalInvoice += spData[index].invoice;
        } else {
          const startIdx = index * 3;
          for (let i = startIdx; i < startIdx + 3; i++) {
            totalForecast += spData[i].forecast;
            totalInvoice += spData[i].invoice;
          }
        }
      });

      return {
        month: period,
        forecast: totalForecast,
        invoice: totalInvoice,
      };
    });
  }, [selectedSalespersons, viewMode, timeLabels]);

  const getPersonTableData = (spId: string) => {
    const rawData = MOCK_DATA[spId];
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
  };

  const grandTotalOfTotals = useMemo(() => {
    return aggregatedData.reduce(
      (acc, curr) => {
        acc.forecast += curr.forecast;
        acc.invoice += curr.invoice;
        return acc;
      },
      { forecast: 0, invoice: 0 }
    );
  }, [aggregatedData]);

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
        <Card className="rounded-xl border border-slate-100 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-500" />
              ตัวกรองข้อมูล
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-8">
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 mb-3 block">
                  พนักงานขาย (สามารถเลือกได้หลายคน)
                </label>
                <ToggleGroup
                  type="multiple"
                  value={selectedSalespersons}
                  onValueChange={(val) => {
                    if (val.length) setSelectedSalespersons(val);
                  }}
                  className="flex flex-wrap justify-start gap-2"
                >
                  {MOCK_SALESPERSONS.map((sp) => (
                    <ToggleGroupItem
                      key={sp.id}
                      value={sp.id}
                      className="rounded-full px-4 border border-slate-200 data-[state=on]:bg-violet-600 data-[state=on]:text-white data-[state=on]:border-violet-600 transition-all hover:bg-slate-100"
                    >
                      {sp.name}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-3 block">
                  มุมมองเวลา
                </label>
                <ToggleGroup
                  type="single"
                  value={viewMode}
                  onValueChange={(val) => {
                    if (val) setViewMode(val as "month" | "quarter");
                  }}
                  className="justify-start bg-slate-100 p-1 rounded-lg"
                >
                  <ToggleGroupItem value="month" className="rounded-md px-4 data-[state=on]:bg-white data-[state=on]:shadow-sm border-transparent data-[state=on]:border-slate-200">
                    รายเดือน
                  </ToggleGroupItem>
                  <ToggleGroupItem value="quarter" className="rounded-md px-4 data-[state=on]:bg-white data-[state=on]:shadow-sm border-transparent data-[state=on]:border-slate-200">
                    รายไตรมาส
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart Section */}
        <Card className="rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center justify-between">
              <span>กราฟเปรียบเทียบยอดขายและคาดการณ์ (ปี 2024)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 pb-2 pl-0">
            <div className="h-[450px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={aggregatedData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
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
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      new Intl.NumberFormat("th-TH").format(value),
                      name,
                    ]}
                    labelStyle={{ color: "#334155", fontWeight: "bold", marginBottom: "4px" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow:
                        "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: "20px" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    name="Forecast"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 4, strokeWidth: 2, fill: "white" }}
                    activeDot={{ r: 6, fill: "#3b82f6" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="invoice"
                    name="Invoice"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 4, strokeWidth: 2, fill: "white" }}
                    activeDot={{ r: 6, fill: "#ef4444" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* Custom axis label for Y axis to match "Sum of SALES VALUE(Baht)" */}
            <div className="text-xs text-slate-500 absolute top-24 left-6">
              Sum of SALES VALUE(Baht)
            </div>
          </CardContent>
        </Card>

        {/* Table Section */}
        <Card className="rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center justify-between">
              <span>ข้อมูลตารางยอดขายและคาดการณ์</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto w-full max-h-[500px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              <Table className="min-w-max border-collapse relative">
                <TableHeader className="bg-slate-50 sticky top-0 z-20 shadow-[0_1px_0_0_#e2e8f0]">
                  <TableRow>
                    <TableHead className="font-bold text-slate-700 min-w-[150px] bg-slate-50 sticky left-0 z-30 shadow-[1px_0_0_0_#e2e8f0]" rowSpan={2}>
                      Row Labels
                    </TableHead>
                    {timeLabels.map((label) => (
                      <TableHead key={label} colSpan={2} className="text-center font-bold text-slate-700 bg-slate-50 border-x border-slate-200/50">
                        {label}
                      </TableHead>
                    ))}
                    <TableHead colSpan={2} className="text-center font-bold text-slate-800 bg-slate-100 border-x border-slate-300/50" rowSpan={1}>
                      Grand Total
                    </TableHead>
                  </TableRow>
                  <TableRow>
                    {timeLabels.map((label) => (
                      <Fragment key={label + "-sub"}>
                        <TableHead className="text-right text-xs font-semibold text-slate-600 bg-slate-50 border-l border-slate-200/50 min-w-[110px]">
                          Forecast
                        </TableHead>
                        <TableHead className="text-right text-xs font-semibold text-emerald-600 bg-slate-50 border-r border-slate-200/50 min-w-[110px]">
                          Invoice
                        </TableHead>
                      </Fragment>
                    ))}
                    <Fragment key="gt-sub">
                      <TableHead className="text-right text-xs font-bold text-slate-700 bg-slate-100 border-l border-slate-300/50 min-w-[120px]">
                        Forecast
                      </TableHead>
                      <TableHead className="text-right text-xs font-bold text-emerald-700 bg-slate-100 border-r border-slate-300/50 min-w-[120px]">
                        Invoice
                      </TableHead>
                    </Fragment>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedSalespersons.map((spId) => {
                    const sp = MOCK_SALESPERSONS.find((s) => s.id === spId);
                    const pData = getPersonTableData(spId);
                    if (!sp || !pData) return null;

                    return (
                      <TableRow key={sp.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-medium text-slate-700 bg-white sticky left-0 z-10 border-r border-slate-200/50 shadow-[1px_0_0_0_#f1f5f9]">
                          {sp.name}
                        </TableCell>
                        {pData.periodsData.map((mData, idx) => {
                          return (
                            <Fragment key={idx}>
                              <TableCell className="text-right text-slate-600 border-l border-slate-100/50">
                                {mData.forecast > 0 ? new Intl.NumberFormat("th-TH").format(mData.forecast) : "-"}
                              </TableCell>
                              <TableCell className="text-right text-emerald-600 border-r border-slate-100/50">
                                {mData.invoice > 0 ? new Intl.NumberFormat("th-TH").format(mData.invoice) : "-"}
                              </TableCell>
                            </Fragment>
                          );
                        })}
                        <TableCell className="text-right font-bold text-slate-700 bg-slate-50 border-l border-slate-300/30">
                          {pData.totalForecast > 0 ? new Intl.NumberFormat("th-TH").format(pData.totalForecast) : "-"}
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-700 bg-slate-50 border-r border-slate-300/30">
                          {pData.totalInvoice > 0 ? new Intl.NumberFormat("th-TH").format(pData.totalInvoice) : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {selectedSalespersons.length > 0 && (
                    <TableRow className="bg-slate-50 hover:bg-slate-50 sticky bottom-0 z-20 shadow-[0_-1px_0_0_#e2e8f0]">
                      <TableCell className="font-bold text-slate-900 sticky left-0 z-30 bg-slate-50 border-r border-slate-200/50 shadow-[1px_0_0_0_#e2e8f0]">
                        Grand Total
                      </TableCell>
                      {aggregatedData.map((mData) => (
                        <Fragment key={mData.month + "-total"}>
                          <TableCell className="text-right font-bold text-slate-900 border-l border-slate-200/50">
                            {mData.forecast > 0 ? new Intl.NumberFormat("th-TH").format(mData.forecast) : "-"}
                          </TableCell>
                          <TableCell className="text-right font-bold text-emerald-700 border-r border-slate-200/50">
                            {mData.invoice > 0 ? new Intl.NumberFormat("th-TH").format(mData.invoice) : "-"}
                          </TableCell>
                        </Fragment>
                      ))}
                      <TableCell className="text-right font-bold text-slate-900 bg-slate-100 border-l border-slate-300/50">
                        {grandTotalOfTotals.forecast > 0 ? new Intl.NumberFormat("th-TH").format(grandTotalOfTotals.forecast) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-800 bg-slate-100 border-r border-slate-300/50">
                        {grandTotalOfTotals.invoice > 0 ? new Intl.NumberFormat("th-TH").format(grandTotalOfTotals.invoice) : "-"}
                      </TableCell>
                    </TableRow>
                  )}
                  {selectedSalespersons.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={25} className="text-center py-10 text-slate-500">
                        กรุณาเลือกพนักงานขายอย่างน้อย 1 คน
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
