"use client";

import React from "react";
import { Phone, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Type1PlanCardProps } from "../types/planned.types";

export function Type1PlanCard({
  planType,
  target,
  targets,
  className,
}: Type1PlanCardProps) {
  if (planType === "UNPLANNED") return null;

  const items =
    targets && targets.length > 0
      ? targets
      : target
        ? [target]
        : [];

  if (items.length === 0) return null;

  const isMultiple = items.length > 1;

  return (
    <div
      className={cn(
        "bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-3.5",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          ข้อมูลตามแผนงาน (PLAN)
        </span>
        <div className="flex items-center gap-2">
          {isMultiple ? (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              {items.length} เป้าหมาย
            </span>
          ) : (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
              {items[0].visitPurpose === "STORE" ? "เข้าพบร้านค้า" : "เข้าพบเกษตรกร"}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => {
          const isStore = item?.visitPurpose === "STORE";
          const isUnregistered = Boolean(item?.isUnregisteredFarmer);
          const farmerDisplayName = isUnregistered
            ? item?.unregisteredFarmerName || item?.customer || "-"
            : item?.customer || "-";

          return (
            <div
              key={item.id || index}
              className={cn(
                "space-y-3",
                isMultiple && "p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs",
              )}
            >
              {isMultiple && (
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center justify-center border border-emerald-200">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      เป้าหมายที่ {index + 1}: {isStore ? item.customer || "-" : farmerDisplayName}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-semibold bg-slate-50 border-slate-200 text-slate-600"
                  >
                    {isStore ? "เข้าพบร้านค้า" : "เข้าพบเกษตรกร"}
                  </Badge>
                </div>
              )}

              {isStore ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    {/* ร้านค้า */}
                    <div className="bg-slate-50/60 sm:bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                      <span className="text-slate-400 font-medium block">
                        {item?.isSubDealer ? "ร้านค้า (Subdealer)" : "ร้านค้า (Dealer)"}
                      </span>
                      <span
                        className="font-bold text-slate-800 text-sm block truncate"
                        title={
                          item?.isSubDealer
                            ? (item?.isUnregisteredSubdealer ? `${item?.subDealerStore} (ระบุเอง)` : item?.subdealerName || item?.customer)
                            : item?.customer || "-"
                        }
                      >
                        {item?.isSubDealer
                          ? (item?.isUnregisteredSubdealer ? `${item?.subDealerStore} (ระบุเอง)` : item?.subdealerName || item?.customer || "-")
                          : item?.customer || "-"}
                      </span>
                    </div>

                    {/* Dealer ต้นสังกัด (กรณี Subdealer) หรือ วัตถุประสงค์ของประเภทงาน */}
                    {item?.isSubDealer ? (
                      <div className="bg-slate-50/60 sm:bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                        <span className="text-slate-400 font-medium block">
                          Dealer ต้นสังกัด
                        </span>
                        <span
                          className="font-bold text-slate-800 text-sm block truncate"
                          title={item?.dealerName || "-"}
                        >
                          {item?.dealerName || "-"}
                        </span>
                      </div>
                    ) : (
                      <div className="bg-slate-50/60 sm:bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                        <span className="text-slate-400 font-medium block">
                          วัตถุประสงค์ของประเภทงาน
                        </span>
                        <span className="font-bold text-slate-800 text-sm block">
                          เข้าพบร้านค้า
                        </span>
                      </div>
                    )}

                    {/* ประเภทลูกค้า */}
                    <div className="bg-slate-50/60 sm:bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                      <span className="text-slate-400 font-medium block">
                        ประเภทลูกค้า
                      </span>
                      <div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-bold text-xs",
                            item?.isSubDealer
                              ? "bg-amber-50 text-amber-800 border-amber-300"
                              : "bg-emerald-50 text-emerald-800 border-emerald-300",
                          )}
                        >
                          {item?.isSubDealer
                            ? (item?.isUnregisteredSubdealer ? "ร้านค้าย่อย (ระบุเอง)" : "ร้านค้าย่อย (Subdealer)")
                            : "ตัวแทนจำหน่ายหลัก (Dealer)"}
                        </Badge>
                      </div>
                    </div>

                    {/* วัตถุประสงค์ (ประเด็นหลัก) */}
                    <div className="bg-slate-50/60 sm:bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                      <span className="text-slate-400 font-medium block">
                        วัตถุประสงค์ (ประเด็นหลัก)
                      </span>
                      <span className="font-bold text-slate-800 text-sm block">
                        {item?.topic || "-"}
                      </span>
                    </div>
                  </div>

                  {/* รายละเอียดเพิ่มเติม */}
                  <div className="text-xs">
                    <div className="bg-slate-50/60 sm:bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                      <span className="text-slate-400 font-medium block">
                        รายละเอียดเพิ่มเติม
                      </span>
                      <p className="font-normal text-slate-700 whitespace-pre-wrap">
                        {item?.notes || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    {/* เกษตรกร / ชื่อ */}
                    <div className="bg-slate-50/60 sm:bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
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
                    <div className="bg-slate-50/60 sm:bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                      <span className="text-slate-400 font-medium block">จังหวัด</span>
                      <span className="font-bold text-slate-800 text-sm block">
                        {item?.province || "-"}
                      </span>
                    </div>

                    {/* สถานะเกษตรกร */}
                    <div className="bg-slate-50/60 sm:bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
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
                      <div className="bg-slate-50/60 sm:bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                        <span className="text-slate-400 font-medium block flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          เบอร์โทรศัพท์
                        </span>
                        <span className="font-bold text-slate-800 text-sm block">
                          {item?.unregisteredFarmerPhone || "-"}
                        </span>
                      </div>
                    ) : (
                      <div className="bg-slate-50/60 sm:bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                        <span className="text-slate-400 font-medium block">
                          วัตถุประสงค์ (ประเด็นหลัก)
                        </span>
                        <span className="font-bold text-slate-800 text-sm block">
                          {item?.topic || "-"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Topic & Detail Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    {isUnregistered && (
                      <div className="bg-slate-50/60 sm:bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                        <span className="text-slate-400 font-medium block">
                          วัตถุประสงค์ (ประเด็นหลัก)
                        </span>
                        <span className="font-semibold text-slate-800 block">
                          {item?.topic || "-"}
                        </span>
                      </div>
                    )}
                    <div
                      className={cn(
                        "bg-slate-50/60 sm:bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1",
                        !isUnregistered && "sm:col-span-2",
                      )}
                    >
                      <span className="text-slate-400 font-medium block">
                        รายละเอียดเพิ่มเติม
                      </span>
                      <span className="font-semibold text-slate-800 block">
                        {item?.notes || "-"}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
