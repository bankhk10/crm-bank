"use client";

import React from "react";
import { Layers, AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ActualTargetCard } from "@/modules/activity-plans/features/actual-view/components/actual-target-card";

export interface FollowupProductItem {
  productName: string;
  customer?: string;
  expectedResult?: string;
  usageResult?: "พืชตอบสนองดี" | "พบปัญหา" | "";
  problemDetail?: string;
  detail?: string;
  followupDetail?: string;
}

interface DetailType2FollowupProps {
  isVisible: boolean;
  target: {
    product: string;
    customer: string;
    storeName?: string;
    keyFarmer?: string;
    detail: string;
    expectedResult: string;
    items?: FollowupProductItem[];
  };
  customerName?: string;
  detail?: string;
  followupDetail?: string;
  usageResult?: "พืชตอบสนองดี" | "พบปัญหา" | "";
  problemDetail?: string;
}

// Helper to parse product-specific followup detail from combined string e.g. "Prod1: detail1 | Prod2: detail2"
const getParsedFollowupDetail = (
  text: string | undefined,
  productName: string,
  fallbackItemVal?: string,
): string => {
  if (fallbackItemVal) return fallbackItemVal;
  if (!text) return "";
  const escaped = productName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(?:^|\\|\\s*)${escaped}:\\s*([^|]+)`, "i");
  const match = text.match(regex);
  if (match && match[1]) {
    return match[1].trim();
  }
  if (!text.includes(":") && !text.includes("|")) {
    return text.trim();
  }
  return "";
};

const getParsedProblemDetail = (
  text: string | undefined,
  productName: string,
  fallbackItemVal?: string,
): string => {
  if (fallbackItemVal) return fallbackItemVal;
  if (!text) return "";
  const escaped = productName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(?:^|\\|\\s*)${escaped}:\\s*([^|]+)`, "i");
  const match = text.match(regex);
  if (match && match[1]) {
    return match[1].trim();
  }
  if (!text.includes(":") && !text.includes("|")) {
    return text.trim();
  }
  return "";
};

const getParsedUsageResult = (
  text: string | undefined,
  productName: string,
  fallback?: "พืชตอบสนองดี" | "พบปัญหา" | "",
): "พืชตอบสนองดี" | "พบปัญหา" | "" => {
  if (!text) return fallback || "";
  const escaped = productName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(?:^|\\|\\s*)${escaped}:\\s*([^|]+)`, "i");
  const match = text.match(regex);
  if (match && match[1]) {
    const val = match[1].trim();
    if (val === "พืชตอบสนองดี" || val === "พบปัญหา") return val;
  }
  if (text === "พืชตอบสนองดี" || text === "พบปัญหา") {
    return text;
  }
  return fallback || "";
};

export function DetailType2Followup({
  isVisible,
  target,
  customerName,
  followupDetail,
  usageResult,
  problemDetail,
}: DetailType2FollowupProps) {
  if (!isVisible) return null;

  const hasMultipleProducts = target.items && target.items.length > 0;

  return (
    <div className="border border-sky-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-sky-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100">
            <Layers className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-sky-900 text-base md:text-lg">
            ติดตามผลการใช้สินค้า
          </h2>
        </div>
        {hasMultipleProducts && (
          <span className="text-xs bg-sky-100 text-sky-800 font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
            เป้าหมาย {target.items!.length} รายการ
          </span>
        )}
      </div>

      {/* PLANNED TARGET CARD */}
      {hasMultipleProducts ? (
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-sky-600" />
              เป้าหมายที่ตั้งไว้ล่วงหน้าของแผน ({target.items!.length} รายการ)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {target.items!.map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5"
              >
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2 font-bold text-sky-950 text-xs sm:text-sm">
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center text-[10px] font-extrabold shrink-0">
                    {idx + 1}
                  </span>
                  <span>{item.productName}</span>
                </div>

                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      ชื่อร้านค้า:
                    </span>
                    <p className="font-bold text-slate-900">
                      {item.customer || target.customer || "-"}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      รายละเอียดเพิ่มเติม:
                    </span>
                    <p className="font-medium text-slate-800">
                      {item.detail || "-"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ActualTargetCard
          iconColorClass="text-sky-600"
          badgeColorClass="bg-sky-50 text-sky-700 border border-sky-200"
          gridColsClass="grid-cols-1 sm:grid-cols-3"
          items={[
            { label: "สินค้าที่ติดตาม:", value: target.product || "-" },
            { label: "ชื่อร้านค้า:", value: target.customer || "-" },
            {
              label: "รายละเอียดเพิ่มเติม:",
              value: target.detail || "-",
            },
          ]}
        />
      )}

      {/* READ-ONLY RESULT DISPLAY */}
      <div className="space-y-3 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mt-4">
          <span className="w-2 h-2 rounded-full bg-sky-500"></span>
          <span>ผลการปฏิบัติงานจริง</span>
        </div>

        {hasMultipleProducts ? (
          <div className="space-y-3">
            {target.items!.map((item, idx) => {
              const itemResult = getParsedUsageResult(
                usageResult,
                item.productName,
                item.usageResult,
              );
              const itemFollowup = getParsedFollowupDetail(
                followupDetail,
                item.productName,
                item.followupDetail,
              );
              const itemProblem = getParsedProblemDetail(
                problemDetail,
                item.productName,
                item.problemDetail,
              );

              return (
                <div
                  key={idx}
                  className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-900">
                      <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center text-[10px] font-extrabold">
                        {idx + 1}
                      </span>
                      <span>{item.productName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.customer && (
                        <span className="text-xs font-semibold text-slate-600 bg-white px-2.5 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                          ชื่อร้านค้า: {item.customer}
                        </span>
                      )}
                      {itemResult ? (
                        <Badge
                          variant="outline"
                          className={
                            itemResult === "พืชตอบสนองดี"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-xs"
                              : "bg-rose-50 text-rose-800 border-rose-300 font-bold text-xs"
                          }
                        >
                          {itemResult === "พืชตอบสนองดี" ? (
                            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                          ) : (
                            <AlertCircle className="w-3 h-3 mr-1 text-rose-600" />
                          )}
                          {itemResult}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">
                          -
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block mb-0.5 font-medium">
                        รายละเอียดการติดตามผล
                      </span>
                      <p className="text-slate-800 font-semibold block whitespace-pre-wrap">
                        {itemFollowup || "-"}
                      </p>
                    </div>

                    {itemResult === "พบปัญหา" && (
                      <div className="bg-rose-50/70 border border-rose-200 rounded-lg p-2.5 space-y-0.5">
                        <span className="text-rose-600 font-bold block flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          ปัญหาที่พบ
                        </span>
                        <p className="text-rose-900 font-semibold block whitespace-pre-wrap">
                          {itemProblem || "-"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
              <span className="text-xs text-slate-500 font-medium block">
                ชื่อร้านค้า
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
                {customerName || target.customer || "-"}
              </span>
            </div>

            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
              <span className="text-xs text-slate-500 font-medium block">
                ผลลัพธ์จากการใช้งาน
              </span>
              {usageResult ? (
                <Badge
                  variant="outline"
                  className={
                    usageResult === "พืชตอบสนองดี"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-xs px-3 py-1"
                      : "bg-rose-50 text-rose-800 border-rose-300 font-bold text-xs px-3 py-1"
                  }
                >
                  {usageResult === "พืชตอบสนองดี" ? (
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                  )}
                  {usageResult}
                </Badge>
              ) : (
                <span className="text-xs text-slate-700 font-semibold">-</span>
              )}
            </div>

            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1 md:col-span-2">
              <span className="text-xs text-slate-500 font-medium block">
                รายละเอียดการติดตามผล
              </span>
              <p className="text-xs sm:text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                {followupDetail || "-"}
              </p>
            </div>

            {usageResult === "พบปัญหา" && (
              <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3.5 space-y-1 md:col-span-2">
                <span className="text-xs text-rose-600 font-medium block flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  ปัญหาที่พบ
                </span>
                <p className="text-xs sm:text-sm text-rose-900 font-semibold whitespace-pre-wrap leading-relaxed">
                  {problemDetail || "-"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
