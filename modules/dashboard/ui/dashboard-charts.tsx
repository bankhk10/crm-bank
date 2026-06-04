"use client";

import { useEffect, useState } from "react";
import { CardContent } from "@/components/ui/card";
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
import { Map, Package, Tags } from "lucide-react";
import { formatCompact, formatNumber } from "./format-utils";

/* ================= Hook ================= */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

/* ================= Chart Config ================= */
const CHART_BARS = [
  { dataKey: "lastYearInvoice", name: "ยอดขาย (ปีที่แล้ว)", fill: "#a855f7" },
  { dataKey: "target", name: "Target", fill: "#3b82f6" },
  { dataKey: "salesNote", name: "Sales Note", fill: "#f97316" },
  { dataKey: "invoice", name: "Invoice", fill: "#22c55e" },
] as const;

const tooltipStyle = {
  borderRadius: 12,
  border: "none",
  boxShadow: "0 20px 60px -10px rgba(0,0,0,0.25)",
  fontSize: 12,
  background: "rgba(255,255,255,0.95)",
  backdropFilter: "blur(12px)",
};

/* ================= Shared Chart Components ================= */

export function RegionChart({
  regionData,
}: {
  regionData: {
    region: string;
    lastYearInvoice: number;
    target: number;
    salesNote: number;
    invoice: number;
  }[];
}) {
  const isMobile = useIsMobile();

  if (regionData.length === 0) {
    return (
      <CardContent className="h-[240px] sm:h-[280px] md:h-[320px] lg:h-[350px] pt-2 sm:pt-4 px-1 sm:px-4">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
              <Map className="w-8 h-8 text-orange-400" />
            </div>
            <p className="text-sm text-slate-400 font-medium">
              ไม่มีข้อมูลยอดขายรายภาค
            </p>
          </div>
        </div>
      </CardContent>
    );
  }

  const chartHeight = isMobile ? Math.max(280, regionData.length * 80) : 320;

  if (isMobile) {
    return (
      <CardContent className="pt-2 px-1" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={regionData}
            layout="vertical"
            margin={{ left: 4, right: 16, top: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
            <XAxis
              type="number"
              tickFormatter={(v) => formatCompact(v)}
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="region"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              width={72}
              tick={({
                x,
                y,
                payload,
              }: {
                x: number;
                y: number;
                payload: { value: string };
              }) => {
                const MAX_CHARS = 10;
                const raw: string = payload.value.replace(/^ภาค/, "");
                const label = raw.length > MAX_CHARS ? raw.slice(0, MAX_CHARS) + "…" : raw;
                return (
                  <text x={68} y={y} dy="0.35em" textAnchor="end" fontSize={10} fill="#64748b">
                    {label}
                  </text>
                );
              }}
            />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
              contentStyle={tooltipStyle}
              formatter={(value: number) => formatNumber(value)}
            />
            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} iconSize={8} />
            {CHART_BARS.map((b) => (
              <Bar key={b.dataKey} dataKey={b.dataKey} name={b.name} fill={b.fill} radius={[0, 4, 4, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    );
  }

  return (
    <CardContent className="h-[280px] md:h-[320px] lg:h-[350px] pt-4 px-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={regionData} margin={{ left: 0, right: 5, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis dataKey="region" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
          <YAxis
            tickFormatter={(v) => `${v / 1000}k`}
            fontSize={10}
            tickLine={false}
            axisLine={false}
            width={50}
            tick={{ fill: "#94a3b8" }}
          />
          <Tooltip
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
            contentStyle={tooltipStyle}
            formatter={(value: number) => formatNumber(value)}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} iconSize={10} />
          {CHART_BARS.map((b) => (
            <Bar key={b.dataKey} dataKey={b.dataKey} name={b.name} fill={b.fill} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  );
}

export function ProductGroupChart({
  filteredProductGroupData,
}: {
  filteredProductGroupData: {
    group: string;
    lastYearInvoice: number;
    target: number;
    salesNote: number;
    invoice: number;
  }[];
}) {
  const isMobile = useIsMobile();

  if (filteredProductGroupData.length === 0) {
    return (
      <CardContent className="h-[240px] sm:h-[280px] md:h-[320px] lg:h-[350px] pt-2 sm:pt-4 px-1 sm:px-4">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center">
              <Package className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-sm text-slate-400 font-medium">
              กรุณาเลือกประเภท (ABC Code) ที่ต้องการแสดง
            </p>
          </div>
        </div>
      </CardContent>
    );
  }

  const chartHeight = isMobile ? Math.max(280, filteredProductGroupData.length * 80) : 320;

  if (isMobile) {
    return (
      <CardContent className="pt-2 px-1" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={filteredProductGroupData}
            layout="vertical"
            margin={{ left: 4, right: 16, top: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
            <XAxis
              type="number"
              tickFormatter={(v) => formatCompact(v)}
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis type="category" dataKey="group" fontSize={10} tickLine={false} axisLine={false} width={80} />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
              contentStyle={tooltipStyle}
              formatter={(value: number) => formatNumber(value)}
            />
            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} iconSize={8} />
            {CHART_BARS.map((b) => (
              <Bar key={b.dataKey} dataKey={b.dataKey} name={b.name} fill={b.fill} radius={[0, 4, 4, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    );
  }

  return (
    <CardContent className="h-[280px] md:h-[320px] lg:h-[350px] pt-4 px-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={filteredProductGroupData} margin={{ left: 0, right: 5, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis dataKey="group" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
          <YAxis
            tickFormatter={(v) => `${v / 1000}k`}
            fontSize={10}
            tickLine={false}
            axisLine={false}
            width={50}
            tick={{ fill: "#94a3b8" }}
          />
          <Tooltip
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
            contentStyle={tooltipStyle}
            formatter={(value: number) => formatNumber(value)}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} iconSize={10} />
          {CHART_BARS.map((b) => (
            <Bar key={b.dataKey} dataKey={b.dataKey} name={b.name} fill={b.fill} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  );
}

export function TradeNameGroupChart({
  filteredTradeNameGroupData,
}: {
  filteredTradeNameGroupData: {
    group: string;
    lastYearInvoice: number;
    target: number;
    salesNote: number;
    invoice: number;
  }[];
}) {
  const isMobile = useIsMobile();

  if (filteredTradeNameGroupData.length === 0) {
    return (
      <CardContent className="h-[240px] sm:h-[280px] md:h-[320px] lg:h-[350px] pt-2 sm:pt-4 px-1 sm:px-4">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center">
              <Tags className="w-8 h-8 text-indigo-400" />
            </div>
            <p className="text-sm text-slate-400 font-medium">
              กรุณาเลือกกลุ่มชื่อการค้าที่ต้องการแสดง
            </p>
          </div>
        </div>
      </CardContent>
    );
  }

  const chartHeight = isMobile ? Math.max(280, filteredTradeNameGroupData.length * 80) : 320;

  if (isMobile) {
    return (
      <CardContent className="pt-2 px-1" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={filteredTradeNameGroupData}
            layout="vertical"
            margin={{ left: 4, right: 16, top: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
            <XAxis
              type="number"
              tickFormatter={(v) => formatCompact(v)}
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis type="category" dataKey="group" fontSize={10} tickLine={false} axisLine={false} width={80} />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
              contentStyle={tooltipStyle}
              formatter={(value: number) => formatNumber(value)}
            />
            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} iconSize={8} />
            {CHART_BARS.map((b) => (
              <Bar key={b.dataKey} dataKey={b.dataKey} name={b.name} fill={b.fill} radius={[0, 4, 4, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    );
  }

  return (
    <CardContent className="h-[280px] md:h-[320px] lg:h-[350px] pt-4 px-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={filteredTradeNameGroupData} margin={{ left: 0, right: 5, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis dataKey="group" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
          <YAxis
            tickFormatter={(v) => `${v / 1000}k`}
            fontSize={10}
            tickLine={false}
            axisLine={false}
            width={50}
            tick={{ fill: "#94a3b8" }}
          />
          <Tooltip
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
            contentStyle={tooltipStyle}
            formatter={(value: number) => formatNumber(value)}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} iconSize={10} />
          {CHART_BARS.map((b) => (
            <Bar key={b.dataKey} dataKey={b.dataKey} name={b.name} fill={b.fill} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  );
}
