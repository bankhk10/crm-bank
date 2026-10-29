"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Sprout, CheckCircle2, MapPin, Users } from "lucide-react";
import {
  getDemoPlotsAction,
  getFollowUpPlansAction,
} from "@/modules/activity/server/actions";
import {
  ActivityInput,
  ActivityCombobox,
} from "@/modules/activity/ui";
import type { Type10DemoPlotOption } from "../../shared/types";
import type { Type10PlannedFormProps } from "../types/planned.types";

export type { Type10PlannedFormProps };

interface Type10PlanOptionItem {
  planId: string;
  planCode?: string;
  planTitle: string;
  planDate?: string;
  plotId?: string;
  plotName?: string;
  ownerName?: string;
  cropName?: string;
  showcase?: string;
  location?: string;
  areaRai?: number;
  latitude?: string;
  longitude?: string;
}

function getCoordinatesDisplay(plan?: Type10PlanOptionItem | null): string {
  if (!plan) return "-";
  const lat = plan.latitude ? String(plan.latitude).trim() : "";
  const lng = plan.longitude ? String(plan.longitude).trim() : "";

  if (lat && lng) {
    return `${lat}, ${lng}`;
  }
  if (lat) return lat;
  if (lng) return lng;

  if (plan.location && plan.location.trim() !== "") {
    const coordMatch = plan.location.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
    if (coordMatch) {
      return `${coordMatch[1]}, ${coordMatch[2]}`;
    }
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
  followUpPlans = [],
}: Type10PlannedFormProps) {
  const [dbPlots, setDbPlots] = useState<Type10DemoPlotOption[]>([]);
  const [dbFollowUpPlans, setDbFollowUpPlans] = useState<any[]>([]);

  // Self-healing: Load follow-up plans (Type 7A Plans) if not provided by parent
  useEffect(() => {
    let isMounted = true;
    if (followUpPlans.length === 0) {
      getFollowUpPlansAction()
        .then((res: any) => {
          if (
            isMounted &&
            res?.success &&
            res.followUpPlans &&
            res.followUpPlans.length > 0
          ) {
            setDbFollowUpPlans(res.followUpPlans);
          }
        })
        .catch((err) => {
          console.error(
            "Failed to load follow-up plans in Type10PlannedForm:",
            err,
          );
        });
    }
    return () => {
      isMounted = false;
    };
  }, [followUpPlans.length]);

  // Self-healing: Load demo plots from DB if needed for enriched plot info
  useEffect(() => {
    let isMounted = true;
    if (demoPlots.length === 0) {
      getDemoPlotsAction()
        .then((res: any) => {
          if (
            isMounted &&
            res?.success &&
            res.demoPlots &&
            res.demoPlots.length > 0
          ) {
            setDbPlots(res.demoPlots as any);
          }
        })
        .catch((err) => {
          console.error(
            "Failed to load demo plots from DB in Type10PlannedForm:",
            err,
          );
        });
    }
    return () => {
      isMounted = false;
    };
  }, [demoPlots.length]);

  // Build unified list of PLANS (แผนงาน) ONLY - exclude raw farm plots ("แปลง")
  const planList = useMemo<Type10PlanOptionItem[]>(() => {
    const planMap = new Map<string, Type10PlanOptionItem>();

    // 1. Ingest from followUpPlans (Type 7A Activity Plans)
    const followUpSource =
      followUpPlans.length > 0 ? followUpPlans : dbFollowUpPlans;

    followUpSource.forEach((fp: any) => {
      if (!fp.planId) return;
      const firstPlot = fp.plots?.[0];
      planMap.set(fp.planId, {
        planId: fp.planId,
        planCode: fp.planCode,
        planTitle: fp.planTitle || fp.title || "แผนงานแปลงสาธิต",
        planDate: fp.planDate,
        plotId: firstPlot?.id,
        plotName: firstPlot?.name || firstPlot?.plotName,
        ownerName: firstPlot?.ownerName,
        cropName: firstPlot?.cropName || firstPlot?.cropCategory,
        showcase: (firstPlot as any)?.showcase || (firstPlot as any)?.productName || "",
        location: [firstPlot?.district, firstPlot?.province].filter(Boolean).join(", "),
        areaRai: firstPlot?.areaRai,
        latitude: firstPlot?.latitude,
        longitude: firstPlot?.longitude,
      });
    });

    // 2. Ingest / Enrich from master demo plots (Filter out farmer customer farm plots "farmplot-")
    const plotsSource = demoPlots.length > 0 ? demoPlots : dbPlots;
    plotsSource.forEach((p: any) => {
      // Exclude raw farm plots of customers ("แปลงที่ 1", "แปลงที่ 2")
      if (p.id && String(p.id).startsWith("farmplot-")) {
        return;
      }

      const planKey = p.activityPlanId || p.id;
      if (!planKey) return;

      const existing = planMap.get(planKey);
      if (existing) {
        // Enrich existing plan with more specific demo plot details
        if (!existing.plotId && p.id) existing.plotId = p.id;
        if (!existing.plotName && p.name) existing.plotName = p.name;
        if (!existing.ownerName && p.ownerName) existing.ownerName = p.ownerName;
        if (!existing.cropName && (p.cropName || p.targetCrop)) {
          existing.cropName = p.cropName || p.targetCrop;
        }
        if (!existing.showcase && (p.showcase || p.productName || p.primaryProductName)) {
          existing.showcase = p.showcase || p.productName || p.primaryProductName;
        }
        if (!existing.location && p.location) existing.location = p.location;
        if (existing.areaRai == null && p.areaRai != null) existing.areaRai = p.areaRai;
        if (!existing.latitude && p.latitude) existing.latitude = p.latitude;
        if (!existing.longitude && p.longitude) existing.longitude = p.longitude;
      } else {
        // Create new plan option from master demo plot
        planMap.set(planKey, {
          planId: planKey,
          planCode: p.activityCode || p.code,
          planTitle: p.activityName || p.name || "แผนงานแปลงสาธิต",
          planDate: p.startDate,
          plotId: p.id,
          plotName: p.name,
          ownerName: p.ownerName,
          cropName: p.cropName || p.targetCrop,
          showcase: p.showcase || p.productName || p.primaryProductName || "",
          location: p.location,
          areaRai: p.areaRai,
          latitude: p.latitude,
          longitude: p.longitude,
        });
      }
    });

    // 3. Fallback Resilience for Edit Mode:
    // If type10DemoPlot is saved but not in the plan list, synthesize it so the combobox never displays blank
    if (type10DemoPlot && type10DemoPlot.trim() !== "") {
      const exists = Array.from(planMap.values()).some(
        (item) =>
          item.planId === type10DemoPlot ||
          item.plotId === type10DemoPlot ||
          item.planCode === type10DemoPlot ||
          item.plotName === type10DemoPlot,
      );

      if (!exists) {
        planMap.set(type10DemoPlot, {
          planId: type10DemoPlot,
          planCode: undefined,
          planTitle: `แผนงานแปลงสาธิต (${type10DemoPlot})`,
          plotName: type10DemoPlot,
          cropName: type10TargetCrop,
          showcase: type10Showcase,
          location: type10Location,
        });
      }
    }

    return Array.from(planMap.values());
  }, [
    followUpPlans,
    dbFollowUpPlans,
    demoPlots,
    dbPlots,
    type10DemoPlot,
    type10TargetCrop,
    type10Showcase,
    type10Location,
  ]);

  // Find the selected plan from type10DemoPlot (matching planId, plotId, planCode, or plotName)
  const foundPlan = useMemo(() => {
    if (!type10DemoPlot) return undefined;
    return planList.find(
      (item) =>
        item.planId === type10DemoPlot ||
        item.plotId === type10DemoPlot ||
        item.planCode === type10DemoPlot ||
        item.planTitle === type10DemoPlot ||
        (item.plotName && item.plotName === type10DemoPlot),
    );
  }, [planList, type10DemoPlot]);

  // Auto-fill target details when plan is selected or hydrated
  useEffect(() => {
    if (foundPlan) {
      if (!type10TargetCrop && foundPlan.cropName) {
        setType10TargetCrop?.(foundPlan.cropName);
      }
      if (!type10Showcase && foundPlan.showcase) {
        setType10Showcase?.(foundPlan.showcase);
      }
      if (!type10Location && foundPlan.location) {
        setType10Location?.(foundPlan.location);
      }
    }
  }, [
    foundPlan,
    type10TargetCrop,
    type10Showcase,
    type10Location,
    setType10TargetCrop,
    setType10Showcase,
    setType10Location,
  ]);

  const handleSelectPlan = (val: string) => {
    setType10DemoPlot(val);
    const p = planList.find(
      (item) =>
        item.planId === val ||
        item.plotId === val ||
        item.planCode === val ||
        item.plotName === val,
    );
    if (p) {
      if (p.cropName) setType10TargetCrop?.(p.cropName);
      if (p.showcase) setType10Showcase?.(p.showcase);
      if (p.location) setType10Location?.(p.location);
    }
  };

  // Build Combobox options - Plan-based options ONLY
  const planOptions = useMemo(() => {
    return planList.map((plan) => {
      const codePrefix = plan.planCode ? `[${plan.planCode}] ` : "";
      const title = plan.planTitle || "แผนงานแปลงสาธิต";
      const infoParts: string[] = [];
      if (plan.ownerName && plan.ownerName !== "-") infoParts.push(plan.ownerName);
      if (plan.cropName && plan.cropName !== "-") infoParts.push(plan.cropName);
      if (plan.location && plan.location !== "-") infoParts.push(plan.location);

      const infoSuffix =
        infoParts.length > 0 ? ` (${infoParts.join(" • ")})` : "";

      return {
        value: plan.planId,
        label: `${codePrefix}${title}${infoSuffix}`,
        subLabel: plan.plotName
          ? `แปลง: ${plan.plotName}${plan.ownerName ? ` • ${plan.ownerName}` : ""}`
          : undefined,
      };
    });
  }, [planList]);

  // Selected value for Combobox (always matches option value)
  const selectedComboboxValue = foundPlan?.planId || type10DemoPlot || "";

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
        {/* Left: Demo Plot Plan Selection */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              เลือกแปลงสาธิตสำหรับจัดงาน <span className="text-red-500">*</span>
            </label>
            <ActivityCombobox
              options={planOptions}
              value={selectedComboboxValue}
              onChange={handleSelectPlan}
              placeholder="ค้นหาหรือเลือกแผนงานแปลงสาธิต..."
              searchPlaceholder="พิมพ์ชื่อแผนงาน รหัสแผนงาน หรือชื่อแปลง..."
              emptyText="ไม่พบแผนงานแปลงสาธิตในระบบ"
              disabled={readonly}
            />
          </div>

          {/* Plan & Demo Plot Details Card */}
          {foundPlan && (
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>ข้อมูลแผนงานแปลงสาธิตที่เลือก</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div className="col-span-2">
                  <span className="font-semibold text-slate-500">แผนงาน:</span>{" "}
                  {foundPlan.planCode ? `[${foundPlan.planCode}] ` : ""}
                  {foundPlan.planTitle}
                </div>
                {foundPlan.plotName && (
                  <div>
                    <span className="font-semibold text-slate-500">แปลงสาธิต:</span>{" "}
                    {foundPlan.plotName}
                  </div>
                )}
                <div>
                  <span className="font-semibold text-slate-500">เจ้าของแปลง:</span>{" "}
                  {foundPlan.ownerName || "-"}
                </div>
                <div>
                  <span className="font-semibold text-slate-500">พืช:</span>{" "}
                  {foundPlan.cropName || type10TargetCrop || "-"}
                </div>
                <div>
                  <span className="font-semibold text-slate-500">สินค้าตัวอย่าง:</span>{" "}
                  {foundPlan.showcase || type10Showcase || "-"}
                </div>
                <div>
                  <span className="font-semibold text-slate-500">ขนาดแปลง:</span>{" "}
                  {foundPlan.areaRai ? `${foundPlan.areaRai} ไร่` : "-"}
                </div>
                <div className="col-span-2 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    <span className="font-semibold text-slate-500">สถานที่:</span>{" "}
                    {foundPlan.location || type10Location || "-"}
                  </span>
                </div>
                <div className="col-span-2 text-slate-400 text-[11px]">
                  พิกัด: {getCoordinatesDisplay(foundPlan)}
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
