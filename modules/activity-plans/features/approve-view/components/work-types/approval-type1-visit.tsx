"use client";

import React from "react";
import { UserCheck, Store, Phone, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ActualTargetsState } from "@/modules/activity-plans/features/actual-view/types";

interface ApprovalType1VisitProps {
  isVisible: boolean;
  target: ActualTargetsState["t1"];
}

export function ApprovalType1Visit({
  isVisible,
  target,
}: ApprovalType1VisitProps) {
  if (!isVisible) return null;

  const isStore = target?.visitPurpose === "STORE";
  const isUnregistered = Boolean(target?.isUnregisteredFarmer);
  const farmerDisplayName = isUnregistered
    ? target?.unregisteredFarmerName || target?.customer || "-"
    : target?.customer || "-";

  return (
    <div className="border border-emerald-200/80 rounded-2xl p-4 sm:p-5 bg-white space-y-3.5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
            {isStore ? <Store className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          </div>
          <h4 className="font-bold text-emerald-900 text-sm sm:text-base">
            {isStore ? "เข้าพบร้านค้า" : "เข้าพบเกษตรกร"}
          </h4>
        </div>
        <Badge
          variant="outline"
          className="text-[11px] font-bold bg-emerald-50 text-emerald-800 border-emerald-200"
        >
          TYPE_1
        </Badge>
      </div>

      {isStore ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {/* วัตถุประสงค์ของประเภทงาน */}
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              วัตถุประสงค์ของประเภทงาน
            </span>
            <span className="font-bold text-slate-800 block text-xs sm:text-sm">
              เข้าพบร้านค้า
            </span>
          </div>

          {/* ร้านค้า */}
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              ร้านค้า (Customer Master)
            </span>
            <span className="font-bold text-slate-800 block text-xs sm:text-sm truncate" title={target?.customer || "-"}>
              {target?.customer || "-"}
            </span>
          </div>

          {/* ประเภทลูกค้า */}
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
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
                    : (target?.customerType || "ร้านค้า")}
              </Badge>
            </div>
          </div>

          {/* ประเด็นหลัก */}
          <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-100/80">
            <span className="text-emerald-700 block text-[11px] font-bold mb-1">
              ประเด็นหลัก
            </span>
            <span className="font-bold text-slate-800 block text-xs sm:text-sm">
              {target?.topic || "แจ้งข่าวสาร"}
            </span>
          </div>

          {/* รายละเอียดเพิ่มเติม */}
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-2">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              รายละเอียดเพิ่มเติม
            </span>
            <p className="text-slate-700 block text-xs whitespace-pre-line font-normal">
              {target?.detail || "-"}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            {/* วัตถุประสงค์ของประเภทงาน */}
            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[11px] font-medium mb-1">
                วัตถุประสงค์
              </span>
              <span className="font-bold text-slate-800 block text-xs sm:text-sm">
                เข้าพบเกษตรกร
              </span>
            </div>

            {/* จังหวัด */}
            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[11px] font-medium mb-1">
                จังหวัด
              </span>
              <span className="font-bold text-slate-800 block text-xs sm:text-sm">
                {target?.province || "-"}
              </span>
            </div>

            {/* สถานะเกษตรกร */}
            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[11px] font-medium mb-1">
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

            {/* เกษตรกร / ชื่อ */}
            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[11px] font-medium mb-1">
                {isUnregistered ? "ชื่อ - สกุล เกษตรกร" : "เกษตรกร (Customer Master)"}
              </span>
              <span className="font-bold text-slate-800 block text-xs sm:text-sm truncate" title={farmerDisplayName}>
                {farmerDisplayName}
              </span>
            </div>

            {/* เบอร์โทร (กรณีไม่มีในระบบ) หรือ ประเด็นหลัก */}
            {isUnregistered ? (
              <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-500 block text-[11px] font-medium mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  เบอร์โทรศัพท์
                </span>
                <span className="font-bold text-slate-800 block text-xs sm:text-sm">
                  {target?.unregisteredFarmerPhone || "-"}
                </span>
              </div>
            ) : (
              <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-100/80">
                <span className="text-emerald-700 block text-[11px] font-bold mb-1">
                  ประเด็นหลัก
                </span>
                <span className="font-bold text-slate-800 block text-xs sm:text-sm">
                  {target?.topic || "แจ้งข่าวสาร"}
                </span>
              </div>
            )}
          </div>

          {/* Row 2: Topic (if unregistered) & Detail */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            {isUnregistered && (
              <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-100/80">
                <span className="text-emerald-700 block text-[11px] font-bold mb-1">
                  ประเด็นหลัก
                </span>
                <span className="font-bold text-slate-800 block text-xs sm:text-sm">
                  {target?.topic || "แจ้งข่าวสาร"}
                </span>
              </div>
            )}
            <div className={`bg-slate-50/80 p-3 rounded-xl border border-slate-100 ${!isUnregistered ? "sm:col-span-2" : ""}`}>
              <span className="text-slate-500 block text-[11px] font-medium mb-1">
                รายละเอียดเพิ่มเติม
              </span>
              <p className="text-slate-700 block text-xs whitespace-pre-line font-normal">
                {target?.detail || "-"}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
