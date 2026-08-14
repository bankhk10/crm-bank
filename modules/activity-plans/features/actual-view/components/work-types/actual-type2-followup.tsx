"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Target, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { ActualTargetCard } from "../actual-target-card";

export interface FollowupProductItem {
  productName: string;
  customer?: string;
  expectedResult?: string;
  usageResult?: "พืชตอบสนองดี" | "พบปัญหา" | "";
  problemDetail?: string;
  detail?: string; // รายละเอียดเพิ่มเติมจากแผนงาน
  followupDetail?: string; // รายละเอียดการติดตามจากการปฏิบัติงานจริง
}

interface ActualType2FollowupProps {
  isVisible: boolean;
  target: {
    product: string;
    customer: string;
    detail: string; // รายละเอียดเพิ่มเติมจากแผนงาน
    expectedResult: string;
    items?: FollowupProductItem[];
  };
  customerName: string;
  setCustomerName: (v: string) => void;
  detail: string;
  setDetail: (v: string) => void;
  followupDetail?: string;
  setFollowupDetail?: (v: string) => void;
  usageResult: "พืชตอบสนองดี" | "พบปัญหา" | "";
  setUsageResult: (
    v: "พืชตอบสนองดี" | "พบปัญหา" | ""
  ) => void;
  problemDetail: string;
  setProblemDetail: (v: string) => void;
}

export function ActualType2Followup({
  isVisible,
  target,
  customerName,
  setCustomerName,
  detail,
  setDetail,
  followupDetail,
  setFollowupDetail,
  usageResult,
  setUsageResult,
  problemDetail,
  setProblemDetail,
}: ActualType2FollowupProps) {
  // Local state for multi-product follow up
  const [productItems, setProductItems] = useState<FollowupProductItem[]>(
    target.items || []
  );

  // Helper to parse product-specific followup detail from combined string e.g. "Prod1: detail1 | Prod2: detail2"
  const getParsedFollowupDetail = (
    text: string | undefined,
    productName: string,
    fallbackItemVal?: string
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
    fallbackItemVal?: string
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
    fallback?: "พืชตอบสนองดี" | "พบปัญหา" | ""
  ): "พืชตอบสนองดี" | "พบปัญหา" | "" => {
    if (!text) return fallback || "";
    // Check if combined format "Prod1: พืชตอบสนองดี | Prod2: พบปัญหา"
    const escaped = productName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?:^|\\|\\s*)${escaped}:\\s*([^|]+)`, "i");
    const match = text.match(regex);
    if (match && match[1]) {
      const val = match[1].trim();
      if (val === "พืชตอบสนองดี" || val === "พบปัญหา") return val;
    }
    // If single value "พืชตอบสนองดี" or "พบปัญหา"
    if (text === "พืชตอบสนองดี" || text === "พบปัญหา") {
      return text;
    }
    return fallback || "";
  };

  useEffect(() => {
    if (target.items && target.items.length > 0) {
      setProductItems((prev) =>
        target.items!.map((item, idx) => {
          const prevItem =
            prev && prev[idx]?.productName === item.productName
              ? prev[idx]
              : null;

          const parsedUsage = getParsedUsageResult(
            usageResult,
            item.productName,
            prevItem?.usageResult || item.usageResult
          );

          const activeUsage: "พืชตอบสนองดี" | "พบปัญหา" =
            parsedUsage === "พืชตอบสนองดี" || parsedUsage === "พบปัญหา"
              ? parsedUsage
              : prevItem?.usageResult ||
                item.usageResult ||
                (item.expectedResult === "พบปัญหา"
                  ? "พบปัญหา"
                  : "พืชตอบสนองดี");

          // Only parse problem if usage is "พบปัญหา"
          const parsedProblem =
            activeUsage === "พบปัญหา"
              ? prevItem?.problemDetail ||
                item.problemDetail ||
                getParsedProblemDetail(
                  problemDetail,
                  item.productName,
                  item.problemDetail
                )
              : "";

          const activeFollowup =
            prevItem?.followupDetail ||
            item.followupDetail ||
            getParsedFollowupDetail(
              followupDetail,
              item.productName,
              item.followupDetail
            );

          return {
            ...item,
            usageResult: activeUsage,
            problemDetail: parsedProblem,
            detail: item.detail || "", // รายละเอียดเพิ่มเติมจากแผนเดิม
            followupDetail: activeFollowup, // รายละเอียดการติดตามผลจริง
          };
        })
      );
    }
  }, [target.items, usageResult, problemDetail, followupDetail]);

  if (!isVisible) return null;

  const hasMultipleProducts = productItems && productItems.length > 0;

  const handleProductChange = (
    index: number,
    field: "usageResult" | "problemDetail" | "followupDetail",
    value: string
  ) => {
    const updated = [...productItems];
    if (field === "usageResult") {
      updated[index] = {
        ...updated[index],
        usageResult: value as any,
        // When switching to "พืชตอบสนองดี", clear problemDetail
        problemDetail:
          value === "พืชตอบสนองดี" ? "" : updated[index].problemDetail,
      };
    } else {
      updated[index] = { ...updated[index], [field]: value as any };
    }
    setProductItems(updated);

    // Sync to parent component single state if needed
    if (updated.length > 0) {
      const combinedUsageResult =
        updated.length === 1
          ? updated[0].usageResult || ""
          : updated
              .map((item) =>
                item.usageResult
                  ? `${item.productName}: ${item.usageResult}`
                  : ""
              )
              .filter(Boolean)
              .join(" | ");

      setUsageResult(combinedUsageResult as any);

      const combinedProblem = updated
        .map((item) =>
          item.usageResult === "พบปัญหา" && item.problemDetail
            ? `${item.productName}: ${item.problemDetail}`
            : ""
        )
        .filter(Boolean)
        .join(" | ");

      setProblemDetail(combinedProblem);

      const combinedFollowup = updated
        .map((item) =>
          item.followupDetail ? `${item.productName}: ${item.followupDetail}` : ""
        )
        .filter(Boolean)
        .join(" | ");

      if (setFollowupDetail) {
        setFollowupDetail(combinedFollowup);
      }
      setDetail(combinedFollowup);
    }
  };

  return (
    <div className="border-2 border-cyan-500 rounded-2xl p-4 md:p-6 bg-white space-y-5 shadow-xs">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-cyan-100 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-600 text-white font-bold text-sm shadow-2xs">
            2
          </span>
          <h2 className="font-bold text-cyan-900 text-base md:text-lg">
            ติดตามผลการใช้สินค้า
          </h2>
        </div>
        {hasMultipleProducts && (
          <span className="text-xs bg-cyan-100 text-cyan-800 font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            ติดตาม {productItems.length} สินค้า
          </span>
        )}
      </div>

      {/* TARGET CARD DISPLAY */}
      {hasMultipleProducts ? (
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border-b border-slate-200/60 pb-2">
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-slate-500">
                ชื่อร้านค้า / Key Farmer:
              </span>
              <p className="font-bold text-slate-900">{target.customer}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-slate-500">
                รายละเอียดเพิ่มเติม:
              </span>
              <p className="font-medium text-slate-800">
                {target.detail || "-"}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-cyan-600" />
              สินค้าที่ต้องการติดตามผล ({productItems.length} รายการ):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {productItems.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs flex items-center gap-2 font-bold text-slate-900"
                >
                  <span className="w-4 h-4 rounded-full bg-cyan-100 text-cyan-800 flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <span>{item.productName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <ActualTargetCard
          iconColorClass="text-cyan-600"
          badgeColorClass="bg-cyan-100 text-cyan-800"
          gridColsClass="grid-cols-1 sm:grid-cols-3"
          items={[
            { label: "สินค้าที่ต้องการติดตามผล:", value: target.product },
            { label: "ชื่อร้านค้า / Key Farmer:", value: target.customer },
            { label: "รายละเอียดเพิ่มเติม:", value: target.detail || "-" },
          ]}
        />
      )}

      {/* MULTI-PRODUCT RECORDING FORM */}
      {hasMultipleProducts ? (
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-600"></span>
              บันทึกผลการติดตามแยกตามสินค้า ({productItems.length} รายการ)
            </label>
            <span className="text-xs text-slate-500 font-medium">
              * กรอกผลลัพธ์แยกตามสินค้าแต่ละตัว
            </span>
          </div>

          <div className="space-y-4">
            {productItems.map((prod, idx) => (
              <div
                key={idx}
                className="bg-cyan-50/30 border border-cyan-200/80 rounded-2xl p-4 space-y-3 shadow-2xs"
              >
                {/* Header Badge */}
                <div className="flex items-center justify-between border-b border-cyan-100/80 pb-2.5">
                  <div className="flex items-center gap-2 font-bold text-sm text-cyan-950">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-600 text-white text-xs">
                      {idx + 1}
                    </span>
                    <span>สินค้าที่ต้องการติดตามผล: {prod.productName}</span>
                  </div>
                </div>

                {/* 1. ผลลัพธ์จากการใช้งาน */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    ผลลัพธ์จากการใช้งาน (สินค้าที่ {idx + 1}){" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["พืชตอบสนองดี", "พบปัญหา"] as const).map((resOpt) => (
                      <button
                        key={resOpt}
                        type="button"
                        onClick={() =>
                          handleProductChange(idx, "usageResult", resOpt)
                        }
                        className={cn(
                          "py-2 px-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1",
                          prod.usageResult === resOpt
                            ? resOpt === "พืชตอบสนองดี"
                              ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20"
                              : "bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        <span>{resOpt === "พืชตอบสนองดี" ? "🟢" : "⚠️"}</span>
                        <span>{resOpt}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. ระบุรายละเอียดปัญหาที่พบ (ถ้าเลือกพบปัญหา) */}
                {prod.usageResult === "พบปัญหา" && (
                  <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3 space-y-1.5 animate-in fade-in-50">
                    <label className="text-xs font-bold text-rose-800">
                      ระบุรายละเอียดปัญหาที่พบสำหรับ {prod.productName}{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <Textarea
                      rows={2}
                      value={prod.problemDetail || ""}
                      onChange={(e) =>
                        handleProductChange(
                          idx,
                          "problemDetail",
                          e.target.value
                        )
                      }
                      placeholder="เช่น ใบเหลือง, เกิดคราบไหม้, อัตราส่วนเข้มข้นเกินไป"
                      className="bg-white border-rose-200 text-xs"
                    />
                  </div>
                )}

                {/* 3. รายละเอียดการติดตาม */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    รายละเอียดการติดตาม (สินค้าที่ {idx + 1})
                  </label>
                  <Textarea
                    rows={2}
                    value={prod.followupDetail || ""}
                    onChange={(e) =>
                      handleProductChange(idx, "followupDetail", e.target.value)
                    }
                    placeholder={`ระบุข้อแนะนำ หรือรายละเอียดการติดตามสำหรับ ${prod.productName}`}
                    className="bg-white border-slate-300 text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* SINGLE PRODUCT FALLBACK FORM */
        <div className="space-y-4 pt-1">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800">
              ผลลัพธ์จากการใช้งาน <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["พืชตอบสนองดี", "พบปัญหา"] as const).map((resOpt) => (
                <button
                  key={resOpt}
                  type="button"
                  onClick={() => {
                    setUsageResult(resOpt);
                    if (resOpt === "พืชตอบสนองดี") {
                      setProblemDetail("");
                    }
                  }}
                  className={cn(
                    "py-2.5 px-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1",
                    usageResult === resOpt
                      ? resOpt === "พืชตอบสนองดี"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20"
                        : "bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <span>{resOpt === "พืชตอบสนองดี" ? "🟢" : "⚠️"}</span>
                  <span>{resOpt}</span>
                </button>
              ))}
            </div>
          </div>

          {usageResult === "พบปัญหา" && (
            <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3.5 space-y-1.5">
              <label className="text-xs font-bold text-rose-800">
                ระบุรายละเอียดปัญหาที่พบ <span className="text-rose-500">*</span>
              </label>
              <Textarea
                rows={2}
                value={problemDetail}
                onChange={(e) => setProblemDetail(e.target.value)}
                placeholder="เช่น ใบเหลือง, เกิดคราบไหม้, อัตราส่วนเข้มข้นเกินไป"
                className="bg-white border-rose-200"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-800">
              รายละเอียดการติดตาม
            </label>
            <Textarea
              rows={2}
              value={followupDetail !== undefined ? followupDetail : detail}
              onChange={(e) => {
                if (setFollowupDetail) setFollowupDetail(e.target.value);
                setDetail(e.target.value);
              }}
              placeholder="ระบุข้อแนะนำ หรือรายละเอียดการติดตามผลจริง (ถ้ามี)"
              className="bg-white border-slate-300"
            />
          </div>
        </div>
      )}
    </div>
  );
}
