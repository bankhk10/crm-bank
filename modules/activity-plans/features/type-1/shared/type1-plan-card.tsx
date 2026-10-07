"use client";

import React from "react";
import { Phone, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ActualTargetsState } from "@/modules/activity-plans/features/shared/actual-view/types";

export interface Type1PlanCardProps {
  planType?: string;
  target?: ActualTargetsState["t1"];
  className?: string;
}

export function Type1PlanCard({
  planType,
  target,
  className,
}: Type1PlanCardProps) {
  if (planType === "UNPLANNED") return null;

  const isStore = target?.visitPurpose === "STORE";
  const isUnregistered = Boolean(target?.isUnregisteredFarmer);
  const farmerDisplayName = isUnregistered
    ? target?.unregisteredFarmerName || target?.customer || "-"
    : target?.customer || "-";

  return (
    <div
      className={cn(
        "bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-3",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          ข้อมูลตามแผนงาน (PLAN)
        </span>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
          {isStore ? "1 Plan : 1 Store" : "1 Plan : 1 Farmer"}
        </span>
      </div>

      {isStore ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* วัตถุประสงค์ของประเภทงาน */}
            <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
              <span className="text-slate-400 font-medium block">
                วัตถุประสงค์ของประเภทงาน
              </span>
              <span className="font-bold text-slate-800 text-sm block">
                เข้าพบร้านค้า
              </span>
            </div>

            {/* ร้านค้า */}
            <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
              <span className="text-slate-400 font-medium block">
                ร้านค้า (Customer Master)
              </span>
              <span
                className="font-bold text-slate-800 text-sm block truncate"
                title={target?.customer || "-"}
              >
                {target?.customer || "-"}
              </span>
            </div>

            {/* ประเภทลูกค้า */}
            <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
              <span className="text-slate-400 font-medium block">
                ประเภทลูกค้า
              </span>
              <div>
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-xs"
                >
                  {target?.customerType === "DEALER"
                    ? "ตัวแทนจำหน่าย"
                    : target?.customerType === "SUBDEALER"
                      ? "ร้านค้าย่อย"
                      : target?.customerType || "ร้านค้า"}
                </Badge>
              </div>
            </div>

            {/* วัตถุประสงค์ (ประเด็นหลัก) */}
            <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
              <span className="text-slate-400 font-medium block">
                วัตถุประสงค์ (ประเด็นหลัก)
              </span>
              <span className="font-bold text-slate-800 text-sm block">
                {target?.topic || "-"}
              </span>
            </div>
          </div>

          {/* รายละเอียดเพิ่มเติม */}
          <div className="text-xs">
            <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
              <span className="text-slate-400 font-medium block">
                รายละเอียดเพิ่มเติม
              </span>
              <p className="font-normal text-slate-700 whitespace-pre-wrap">
                {target?.detail || "-"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* เกษตรกร / ชื่อ */}
            <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
              <span className="text-slate-400 font-medium block">
                {isUnregistered ? "ชื่อ - สกุล เกษตรกร" : "เกษตรกร"}
              </span>
              <span
                className="font-bold text-slate-800 text-sm block truncate"
                title={farmerDisplayName}
              >
                {farmerDisplayName}
              </span>
            </div>

            {/* จังหวัด */}
            <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
              <span className="text-slate-400 font-medium block">จังหวัด</span>
              <span className="font-bold text-slate-800 text-sm block">
                {target?.province || "-"}
              </span>
            </div>

            {/* สถานะเกษตรกร */}
            <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
              <span className="text-slate-400 font-medium block">
                สถานะเกษตรกร
              </span>
              <div>
                {isUnregistered ? (
                  <Badge
                    variant="outline"
                    className="bg-amber-50 text-amber-800 border-amber-300 font-bold text-xs"
                  >
                    เกษตรกรนอกระบบ
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-xs flex items-center gap-1 w-fit"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    เกษตรกรในระบบ
                  </Badge>
                )}
              </div>
            </div>

            {/* เบอร์โทร (กรณีไม่มีในระบบ) */}
            {isUnregistered ? (
              <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                <span className="text-slate-400 font-medium block flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  เบอร์โทรศัพท์
                </span>
                <span className="font-bold text-slate-800 text-sm block">
                  {target?.unregisteredFarmerPhone || "-"}
                </span>
              </div>
            ) : (
              <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                <span className="text-slate-400 font-medium block">
                  วัตถุประสงค์ (ประเด็นหลัก)
                </span>
                <span className="font-bold text-slate-800 text-sm block">
                  {target?.topic || "-"}
                </span>
              </div>
            )}
          </div>

          {/* Topic & Detail Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            {isUnregistered && (
              <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                <span className="text-slate-400 font-medium block">
                  วัตถุประสงค์ (ประเด็นหลัก)
                </span>
                <span className="font-semibold text-slate-800 block">
                  {target?.topic || "-"}
                </span>
              </div>
            )}
            <div
              className={cn(
                "bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1",
                !isUnregistered && "sm:col-span-2",
              )}
            >
              <span className="text-slate-400 font-medium block">
                รายละเอียดเพิ่มเติม
              </span>
              <span className="font-semibold text-slate-800 block">
                {target?.detail || "-"}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
