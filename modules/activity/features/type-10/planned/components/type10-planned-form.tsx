"use client";

import React, { useState, useEffect } from "react";
import { Sprout, CheckCircle2, MapPin, Users, Target } from "lucide-react";
import { getDemoPlotsAction } from "@/modules/activity/server/actions";
import {
  ActivityInput,
  ActivityCombobox,
} from "@/modules/activity/ui";
import type { Type10DemoPlotOption } from "../../shared/types";
import type { Type10PlannedFormProps } from "../types/planned.types";

export type { Type10PlannedFormProps };

function getPlotCoordinates(plot?: Type10DemoPlotOption | null): string {
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

export function Type10PlannedForm({
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
}: Type10PlannedFormProps) {
  const [dbPlots, setDbPlots] = useState<Type10DemoPlotOption[]>([]);

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
          setDbPlots(res.demoPlots as any);
        }
      } catch (err) {
        console.error(
          "Failed to load demo plots from DB in Type10PlannedForm:",
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
  const combinedMap = new Map<string, Type10DemoPlotOption>();
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
      if (!type10Location && foundPlot.location) {
        setType10Location?.(foundPlot.location);
      }
    }
  }, [foundPlot, type10TargetCrop, type10Showcase, type10Location, setType10TargetCrop, setType10Showcase, setType10Location]);

  const handleSelectPlot = (val: string) => {
    setType10DemoPlot(val);
    const p = plotList.find((plot) => plot.id === val || plot.name === val);
    if (p) {
      setType10TargetCrop?.(p.targetCrop || p.cropName || "");
      setType10Showcase?.(p.showcase || p.productName || p.primaryProductName || "");
      setType10Location?.(p.location || "");
    }
  };

  const plotOptions = plotList.map((plot) => ({
    value: plot.id || plot.name,
    label: `${plot.ownerName ? `${plot.ownerName} - ` : ""}${plot.name || "ไม่มีชื่อแปลง"}${
      plot.location ? ` (${plot.location})` : ""
    }`,
  }));

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center gap-2 text-slate-800 font-bold text-sm sm:text-base border-b border-slate-200 pb-3">
        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
          <Sprout className="h-4 w-4" />
        </div>
        <span>จัดงาน Field Day (ตามแผน / Type 10)</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Demo Plot Selection */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              เลือกแปลงสาธิตสำหรับจัดงาน <span className="text-red-500">*</span>
            </label>
            <ActivityCombobox
              options={plotOptions}
              value={type10DemoPlot}
              onChange={handleSelectPlot}
              placeholder="ค้นหาหรือเลือกแปลงสาธิต..."
              searchPlaceholder="พิมพ์ชื่อแปลงหรือสถานที่..."
              emptyText="ไม่พบแปลงสาธิตในระบบ"
              disabled={readonly}
            />
          </div>

          {/* Plot Details Card */}
          {foundPlot && (
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>ข้อมูลแปลงสาธิตที่เลือก</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="font-semibold text-slate-500">เจ้าของแปลง:</span>{" "}
                  {foundPlot.ownerName || foundPlot.farmerName || "-"}
                </div>
                <div>
                  <span className="font-semibold text-slate-500">พืช:</span>{" "}
                  {foundPlot.cropName || foundPlot.targetCrop || "-"}
                </div>
                <div>
                  <span className="font-semibold text-slate-500">สินค้าตัวอย่าง:</span>{" "}
                  {foundPlot.showcase || foundPlot.productName || foundPlot.primaryProductName || "-"}
                </div>
                <div>
                  <span className="font-semibold text-slate-500">ขนาดแปลง:</span>{" "}
                  {foundPlot.areaRai ? `${foundPlot.areaRai} ไร่` : "-"}
                </div>
                <div className="col-span-2 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    <span className="font-semibold text-slate-500">สถานที่:</span>{" "}
                    {foundPlot.location || "-"}
                  </span>
                </div>
                <div className="col-span-2 text-slate-400 text-[11px]">
                  พิกัด: {getPlotCoordinates(foundPlot)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Goals (Attendees & Sales) */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              เป้าหมายจำนวนผู้เข้าร่วมงาน (คน) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">
                <Users className="w-4 h-4" />
              </span>
              <ActivityInput
                type="number"
                min={0}
                placeholder="ระบุจำนวนผู้เข้าร่วมงานที่คาดหวัง..."
                value={type10Attendees || ""}
                onChange={(e) =>
                  setType10Attendees(e.target.value === "" ? 0 : Number(e.target.value))
                }
                disabled={readonly}
                className="h-10 pl-9 text-xs font-bold text-slate-800 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              เป้าหมายยอดสั่งจอง / สั่งซื้อ (บาท)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-semibold">
                ฿
              </span>
              <ActivityInput
                type="number"
                min={0}
                placeholder="0.00"
                value={type10BookingSales || ""}
                onChange={(e) =>
                  setType10BookingSales(
                    e.target.value === "" ? 0 : Number(e.target.value),
                  )
                }
                disabled={readonly}
                className="h-10 pl-7 text-xs font-bold text-emerald-800 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Aliases
export const Type10PlanForm = Type10PlannedForm;
export const Type10FieldDay = Type10PlannedForm;
