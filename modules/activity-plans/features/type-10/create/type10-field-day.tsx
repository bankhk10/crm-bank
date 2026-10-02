import React, { useState, useEffect } from "react";
import { Sprout, CheckCircle2, MapPin } from "lucide-react";
import { FormCombobox } from "@/components/custom/form-components";
import { type UserDemoPlotOption } from "@/modules/activity-plans/constants";
import { getDemoPlotsAction } from "@/modules/activity-plans/server/actions";

import type { Type10FieldDayProps } from "./types";

export type { Type10FieldDayProps, Type10FieldDayProps as Props };

function getPlotCoordinates(plot?: UserDemoPlotOption | null): string {
  if (!plot) return "-";
  const lat = plot.latitude ? String(plot.latitude).trim() : "";
  const lng = plot.longitude ? String(plot.longitude).trim() : "";

  if (lat && lng) {
    return `${lat}, ${lng}`;
  }
  if (lat) return lat;
  if (lng) return lng;

  if (plot.location && plot.location.trim() !== "") {
    const coordMatch = plot.location.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
    if (coordMatch) {
      return `${coordMatch[1]}, ${coordMatch[2]}`;
    }
    return plot.location.trim();
  }

  return "-";
}

export function Type10FieldDay({
  readonly = false,
  isEdit = false,
  type10DemoPlot,
  setType10DemoPlot,
  type10Location = "",
  setType10Location,
  type10TargetCrop = "",
  setType10TargetCrop,
  type10Showcase = "",
  setType10Showcase,
  type10Attendees,
  setType10Attendees,
  type10BookingSales,
  setType10BookingSales,
  demoPlots = [],
}: Type10FieldDayProps) {
  const [dbPlots, setDbPlots] = useState<UserDemoPlotOption[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadPlotsFromDb() {
      try {
        const res = await getDemoPlotsAction();
        if (
          isMounted &&
          res?.success &&
          res.demoPlots &&
          res.demoPlots.length > 0
        ) {
          setDbPlots(res.demoPlots);
        }
      } catch (err) {
        console.error(
          "Failed to load demo plots from DB in Type10FieldDay:",
          err,
        );
      }
    }
    loadPlotsFromDb();
    return () => {
      isMounted = false;
    };
  }, []);

  // Merge plots fetched from DB and passed from parent props
  const combinedMap = new Map<string, UserDemoPlotOption>();
  demoPlots.forEach((p: any) => {
    if (p.id) combinedMap.set(p.id, p);
    else if (p.name) combinedMap.set(p.name, p);
  });
  dbPlots.forEach((p) => {
    if (p.id) combinedMap.set(p.id, p);
    else if (p.name) combinedMap.set(p.name, p);
  });

  const plotList = Array.from(combinedMap.values());

  const foundPlot = plotList.find(
    (p) => p.id === type10DemoPlot || p.name === type10DemoPlot,
  );

  useEffect(() => {
    if (foundPlot) {
      if (!type10TargetCrop && (foundPlot.targetCrop || foundPlot.cropName)) {
        setType10TargetCrop?.(foundPlot.targetCrop || foundPlot.cropName || "");
      }
      if (!type10Showcase && (foundPlot.showcase || foundPlot.productName)) {
        setType10Showcase?.(foundPlot.showcase || foundPlot.productName || "");
      }
    }
  }, [foundPlot?.id, foundPlot?.name]);

  const plotOptions = plotList.map((plot) => {
    const coords = getPlotCoordinates(plot);
    return {
      value: plot.id || plot.name,
      label: plot.name,
      subLabel: coords !== "-" ? `พิกัด/สถานที่: ${coords}` : undefined,
    };
  });

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <Sprout className="h-4 w-4 text-slate-600" />
          <span>จัดงาน Field Day</span>
        </div>
      </div>

      <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="space-y-3">
          <FormCombobox
            id="type10-demo-plot-combobox"
            label="เลือกแปลงสาธิตของคุณ"
            labelClassName="block text-xs font-medium text-slate-700 mb-1 mx-0"
            required
            triggerClassName="h-10 min-h-[40px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-amber-500"
            value={foundPlot ? (foundPlot.id || foundPlot.name) : type10DemoPlot}
            onChange={(selectedVal) => {
              const selected = plotList.find(
                (p) => p.id === selectedVal || p.name === selectedVal,
              );
              if (selected) {
                setType10DemoPlot?.(selected.id || selected.name);
                const loc = getPlotCoordinates(selected);
                setType10Location?.(loc === "-" ? "" : loc);
                setType10TargetCrop?.(
                  selected.targetCrop || selected.cropName || "",
                );
                setType10Showcase?.(
                  selected.showcase || selected.productName || "",
                );
              } else {
                setType10DemoPlot?.(selectedVal);
              }
            }}
            options={plotOptions}
            placeholder="-- เลือกแปลงสาธิตของคุณ --"
            searchPlaceholder="ค้นหาชื่อแปลงสาธิต, เจ้าของแปลง..."
            emptyText="ไม่พบข้อมูลแปลงสาธิต"
            disabled={readonly}
          />

          {foundPlot && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-xs space-y-2 animate-in fade-in duration-200 shadow-xs">
              <div className="flex items-center justify-between border-b border-amber-200/60 pb-2 font-bold text-amber-900">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  <span>รายละเอียดแปลงสาธิต: {foundPlot.name}</span>
                </div>
                {foundPlot.cropCategory && (
                  <span className="text-[11px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md font-semibold">
                    {foundPlot.cropCategory}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-slate-700 pt-1">
                <div>
                  <span className="text-slate-500 font-medium">
                    เจ้าของแปลง:
                  </span>{" "}
                  <span className="font-semibold text-slate-800">
                    {foundPlot.ownerName || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">
                    พืชเป้าหมาย:
                  </span>{" "}
                  <span className="font-semibold text-slate-800">
                    {foundPlot.targetCrop || foundPlot.cropName || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">
                    สินค้าทดลอง/โชว์:
                  </span>{" "}
                  <span className="font-semibold text-amber-800">
                    {foundPlot.showcase || foundPlot.productName || "-"}
                  </span>
                </div>
                <div className="sm:col-span-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-slate-500 font-medium">
                    สถานที่แปลง:
                  </span>{" "}
                  <span className="font-semibold text-slate-800">
                    {getPlotCoordinates(foundPlot)}
                  </span>
                  {foundPlot.latitude && foundPlot.longitude && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${foundPlot.latitude},${foundPlot.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 hover:underline ml-1 font-medium bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200"
                      title="เปิดใน Google Maps"
                    >
                      <MapPin className="w-3 h-3 text-blue-500" />
                      <span>เปิดแผนที่</span>
                    </a>
                  )}
                </div>
                {foundPlot.areaRai || foundPlot.treeCount ? (
                  <div>
                    <span className="text-slate-500 font-medium">
                      {foundPlot.cropCategory === "พืชสวน" ||
                      (!foundPlot.areaRai && foundPlot.treeCount)
                        ? "จำนวนต้น:"
                        : "ขนาดพื้นที่:"}
                    </span>{" "}
                    <span className="font-semibold text-slate-800">
                      {foundPlot.areaRai && foundPlot.treeCount
                        ? `${foundPlot.areaRai} ไร่ (${foundPlot.treeCount} ต้น)`
                        : foundPlot.areaRai
                          ? `${foundPlot.areaRai} ไร่`
                          : `${foundPlot.treeCount} ต้น`}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              เป้าหมายจำนวนผู้เข้าร่วม (คน){" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={type10Attendees}
              onChange={(e) =>
                setType10Attendees(parseInt(e.target.value) || 0)
              }
              disabled={readonly}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            />
          </div>
          <div className="max-w-md">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              เป้ายอดขายจองในงาน (ถ้ามี)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 text-xs font-semibold">
                ฿
              </span>
              <input
                type="number"
                value={type10BookingSales}
                onChange={(e) =>
                  setType10BookingSales(parseFloat(e.target.value) || 0)
                }
                disabled={readonly}
                className="w-full h-9 pl-7 pr-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
