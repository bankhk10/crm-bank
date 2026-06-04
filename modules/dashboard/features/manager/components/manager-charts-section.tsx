import { useMemo, useState, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Map, Tags, CheckCircle2 } from "lucide-react";
import { PeriodSwitcher } from "../../../ui/period-switcher";
import {
  RegionChart,
  ProductGroupChart,
  TradeNameGroupChart,
} from "../../../ui/dashboard-charts";
import type { DashboardPeriod, PeriodData } from "../../../types";

interface ManagerChartsSectionProps {
  periodData: Record<DashboardPeriod, PeriodData>;
  periodOptions: { value: DashboardPeriod; label: string }[];
}

export function ManagerChartsSection({
  periodData,
  periodOptions,
}: ManagerChartsSectionProps) {
  const [regionPeriod, setRegionPeriod] = useState<DashboardPeriod>("month");
  const [productGroupPeriod, setProductGroupPeriod] =
    useState<DashboardPeriod>("month");
  const [tradeNameGroupPeriod, setTradeNameGroupPeriod] =
    useState<DashboardPeriod>("month");

  const regionData = periodData[regionPeriod].regionData || [];
  const productGroupData =
    periodData[productGroupPeriod].productGroupData || [];
  const tradeNameGroupData =
    periodData[tradeNameGroupPeriod].tradeNameGroupData || [];

  // Product group filter
  const [visibleGroups, setVisibleGroups] = useState<Set<string>>(() => new Set(productGroupData.map((p) => p.group)));
  const [prevProductGroupData, setPrevProductGroupData] = useState(productGroupData);

  if (productGroupData !== prevProductGroupData) {
    setPrevProductGroupData(productGroupData);
    setVisibleGroups(new Set(productGroupData.map((p) => p.group)));
  }

  const toggleGroup = (group: string) => {
    setVisibleGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(group)) {
        newSet.delete(group);
      } else {
        newSet.add(group);
      }
      return newSet;
    });
  };

  const toggleAllGroups = () => {
    if (visibleGroups.size === productGroupData.length) {
      setVisibleGroups(new Set());
    } else {
      setVisibleGroups(new Set(productGroupData.map((p) => p.group)));
    }
  };

  const filteredProductGroupData = useMemo(
    () => productGroupData.filter((p) => visibleGroups.has(p.group)),
    [productGroupData, visibleGroups]
  );

  // Trade name group filter
  const [visibleTradeNameGroups, setVisibleTradeNameGroups] = useState<Set<string>>(() => new Set(tradeNameGroupData.map((p) => p.group)));
  const [prevTradeNameGroupData, setPrevTradeNameGroupData] = useState(tradeNameGroupData);

  if (tradeNameGroupData !== prevTradeNameGroupData) {
    setPrevTradeNameGroupData(tradeNameGroupData);
    setVisibleTradeNameGroups(new Set(tradeNameGroupData.map((p) => p.group)));
  }

  const toggleTradeNameGroup = (group: string) => {
    setVisibleTradeNameGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(group)) {
        newSet.delete(group);
      } else {
        newSet.add(group);
      }
      return newSet;
    });
  };

  const toggleAllTradeNameGroups = () => {
    if (visibleTradeNameGroups.size === tradeNameGroupData.length) {
      setVisibleTradeNameGroups(new Set());
    } else {
      setVisibleTradeNameGroups(new Set(tradeNameGroupData.map((p) => p.group)));
    }
  };

  const filteredTradeNameGroupData = useMemo(
    () => tradeNameGroupData.filter((p) => visibleTradeNameGroups.has(p.group)),
    [tradeNameGroupData, visibleTradeNameGroups]
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:gap-6">
      {/* Region Chart */}
      <Card className="rounded-2xl sm:rounded-3xl border-0 bg-white shadow-lg overflow-hidden">
        <CardHeader className="pb-3 sm:pb-4 border-b border-slate-100/80">
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 border border-orange-100 shadow-sm">
                <Map className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-sm sm:text-base md:text-lg font-bold text-slate-800">
                  ยอดขายรายภาค
                </CardTitle>
              </div>
            </div>
            <PeriodSwitcher
              value={regionPeriod}
              onChange={setRegionPeriod}
              options={periodOptions}
              variant="light"
            />
          </div>
        </CardHeader>
        <RegionChart regionData={regionData} />
      </Card>

      {/* Product Group Chart */}
      <Card className="rounded-2xl sm:rounded-3xl border-0 bg-white shadow-lg overflow-hidden">
        <CardHeader className="pb-3 sm:pb-4 border-b border-slate-100/80">
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-purple-100 to-violet-100 border border-purple-100 shadow-sm">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-sm sm:text-base md:text-lg font-bold text-slate-800">
                  ยอดขายตามประเภท (ABC Code)
                </CardTitle>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 font-medium">
                  แสดง {visibleGroups.size}/{productGroupData.length} ประเภท
                </p>
              </div>
            </div>
            <PeriodSwitcher
              value={productGroupPeriod}
              onChange={setProductGroupPeriod}
              options={periodOptions}
              variant="light"
            />
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-600">
                เลือกประเภทที่ต้องการแสดง:
              </span>
              <button
                onClick={toggleAllGroups}
                className="text-[10px] sm:text-xs text-purple-600 hover:text-purple-700 font-bold transition-colors hover:underline"
              >
                {visibleGroups.size === productGroupData.length
                  ? "ซ่อนทั้งหมด"
                  : "เลือกทั้งหมด"}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {productGroupData.map((group) => {
                const isVisible = visibleGroups.has(group.group);
                return (
                  <button
                    key={group.code}
                    onClick={() => toggleGroup(group.group)}
                    className={`
                      inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold
                      transition-all duration-200 border
                      ${
                        isVisible
                          ? "bg-gradient-to-r from-purple-500 to-violet-600 text-white border-transparent shadow-md shadow-purple-200"
                          : "bg-white text-slate-500 border-slate-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
                      }
                    `}
                  >
                    <span
                      className={`w-3.5 h-3.5 flex items-center justify-center rounded-full border-2 transition-colors ${
                        isVisible ? "bg-white border-white" : "border-slate-300"
                      }`}
                    >
                      {isVisible && (
                        <CheckCircle2 className="w-2.5 h-2.5 text-purple-600" />
                      )}
                    </span>
                    {group.group}
                  </button>
                );
              })}
            </div>
          </div>
        </CardHeader>
        <ProductGroupChart filteredProductGroupData={filteredProductGroupData} />
      </Card>

      {/* Trade Name Group Chart */}
      <Card className="rounded-2xl sm:rounded-3xl border-0 bg-white shadow-lg overflow-hidden">
        <CardHeader className="pb-3 sm:pb-4 border-b border-slate-100/80">
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 border border-indigo-100 shadow-sm">
                <Tags className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-sm sm:text-base md:text-lg font-bold text-slate-800">
                  ยอดขายรวมของกลุ่มชื่อการค้า
                </CardTitle>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 font-medium">
                  แสดง {visibleTradeNameGroups.size}/{tradeNameGroupData.length} กลุ่ม
                </p>
              </div>
            </div>
            <PeriodSwitcher
              value={tradeNameGroupPeriod}
              onChange={setTradeNameGroupPeriod}
              options={periodOptions}
              variant="light"
            />
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-600">
                เลือกกลุ่มที่ต้องการแสดง:
              </span>
              <button
                onClick={toggleAllTradeNameGroups}
                className="text-[10px] sm:text-xs text-indigo-600 hover:text-indigo-700 font-bold transition-colors hover:underline"
              >
                {visibleTradeNameGroups.size === tradeNameGroupData.length
                  ? "ซ่อนทั้งหมด"
                  : "เลือกทั้งหมด"}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {tradeNameGroupData.map((group) => {
                const isVisible = visibleTradeNameGroups.has(group.group);
                return (
                  <button
                    key={group.code}
                    onClick={() => toggleTradeNameGroup(group.group)}
                    className={`
                      inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold
                      transition-all duration-200 border
                      ${
                        isVisible
                          ? "bg-gradient-to-r from-indigo-500 to-blue-600 text-white border-transparent shadow-md shadow-indigo-200"
                          : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                      }
                    `}
                  >
                    <span
                      className={`w-3.5 h-3.5 flex items-center justify-center rounded-full border-2 transition-colors ${
                        isVisible ? "bg-white border-white" : "border-slate-300"
                      }`}
                    >
                      {isVisible && (
                        <CheckCircle2 className="w-2.5 h-2.5 text-indigo-600" />
                      )}
                    </span>
                    {group.group}
                  </button>
                );
              })}
            </div>
          </div>
        </CardHeader>
        <TradeNameGroupChart filteredTradeNameGroupData={filteredTradeNameGroupData} />
      </Card>
    </div>
  );
}
