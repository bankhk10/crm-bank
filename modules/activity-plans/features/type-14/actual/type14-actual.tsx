"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  MapPin,
  Store,
  Calendar,
  FileText,
  Camera,
  Plus,
  Trash2,
  Package,
  Clock,
  UploadCloud,
  Eye,
  History,
  Loader2,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/hooks/use-file-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import DatePicker from "@/components/custom/DatePicker";
import { FormCombobox } from "@/components/custom/FormCombobox";
import type { useType14ActualState } from "./use-type14-actual-state";

function formatThaiDate(d?: string | Date | null) {
  if (!d) return "-";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "-";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear() + 543;
  return `${day}/${month}/${year}`;
}

import type { Type14ActualProps } from "./types";

export type { Type14ActualProps };

export function Type14Actual({
  isVisible = true,
  actualState,
  products = [],
  readonly = false,
}: Type14ActualProps) {
  // Preview modal for images
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);

  // File input refs per round
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // Scoped Plot Options from the current ActivityPlan
  const plotOptions = useMemo(() => {
    return (actualState.availablePlots || []).map((plot) => ({
      value: plot.id,
      label: plot.name || `แปลงแฮตแทค #${plot.code || plot.id.slice(-4)}`,
      subLabel: `ร้าน: ${plot.dealerName || plot.customer?.name || "-"} | จ.${plot.province || "-"} อ.${plot.district || "-"}`,
    }));
  }, [actualState.availablePlots]);

  // Format Product Options for Product Comboboxes
  const productOptions = useMemo(() => {
    return products.map((p) => ({
      value: p.id,
      label: p.name,
      subLabel: p.productCode
        ? `รหัส: ${p.productCode} (${p.unit || "ขวด"})`
        : `(${p.unit || "ขวด"})`,
    }));
  }, [products]);

  // Selected Plot object
  const selectedPlotObj = useMemo(() => {
    return (actualState.availablePlots || []).find(
      (p) => p.id === actualState.demoPlotId,
    );
  }, [actualState.availablePlots, actualState.demoPlotId]);

  if (!isVisible) return null;

  const handleSelectPlotChange = (val: string) => {
    const selected = (actualState.availablePlots || []).find(
      (p) => p.id === val,
    );
    actualState.handleSelectPlot(val, selected);
  };

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. เลือกแปลง (Searchable from existing HATTACK plots)
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 shadow-xs">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
            14
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-base">
              เลือกแปลงติดตาม (แปลงแฮตแทคเดิม)
            </h4>
            <p className="text-xs text-slate-500">
              ค้นหาและเลือกแปลงแฮตแทคที่ต้องการบันทึกผลการติดตาม
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              แปลงแฮตแทค <span className="text-rose-500">*</span>
            </label>
            <FormCombobox
              options={plotOptions}
              value={actualState.demoPlotId}
              onChange={handleSelectPlotChange}
              placeholder={
                actualState.availablePlots.length === 0
                  ? "-- ไม่พบแปลงแฮตแทคในแผนงานนี้ --"
                  : "-- ค้นหาแปลงแฮตแทค --"
              }
              disabled={readonly || actualState.loadingPlotContext}
            />
          </div>

          {/* Read-only Plot Info Cards */}
          {(actualState.demoPlotId || actualState.dealerName) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-2xs font-semibold uppercase text-slate-400 block mb-1">
                  ร้านค้า / ดีลเลอร์
                </span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Store className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span className="truncate">
                    {actualState.dealerName ||
                      selectedPlotObj?.dealerName ||
                      "-"}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-2xs font-semibold uppercase text-slate-400 block mb-1">
                  จังหวัด
                </span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>
                    {actualState.province || selectedPlotObj?.province || "-"}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-2xs font-semibold uppercase text-slate-400 block mb-1">
                  อำเภอ
                </span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>
                    {actualState.district || selectedPlotObj?.district || "-"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1.5 ประวัติการฉีดพ่นจริง (Read-Only Reference)
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <span>ประวัติการฉีดพ่นจริง</span>
                <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Read-Only (ประวัติย้อนหลัง)
                </span>
              </h4>
              <p className="text-2xs text-slate-500">
                ข้อมูลผลการฉีดพ่นจริงจากกิจกรรมก่อนหน้าของแปลงนี้ (อ้างอิงเพื่อการติดตามผล)
              </p>
            </div>
          </div>

          {actualState.loadingPlotContext && (
            <div className="flex items-center gap-1.5 text-xs text-purple-600 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>กำลังโหลดประวัติการฉีดพ่น...</span>
            </div>
          )}
        </div>

        {!actualState.demoPlotId ? (
          <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-500 border border-slate-150">
            กรุณาเลือกแปลงแฮตแทคเพื่อดูประวัติการฉีดพ่นจริง
          </div>
        ) : actualState.sprayHistory.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-500 border border-slate-150">
            ไม่พบประวัติการฉีดพ่นจริงก่อนหน้านี้สำหรับแปลงนี้
          </div>
        ) : (
          <div className="space-y-4">
            {actualState.sprayHistory.map((hist, idx) => (
              <div
                key={hist.id || idx}
                className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50/70 to-amber-50/20 p-4 space-y-3"
              >
                {/* Header: ครั้งที่, วันที่, TP, ประเภท */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs">
                      ครั้งที่ {hist.roundNumber || idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      วันที่ฉีดพ่น:{" "}
                      <span className="font-bold text-slate-900">
                        {formatThaiDate(hist.sprayDate)}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-2xs text-slate-600">
                    <div>
                      <span className="text-slate-400">เลขที่ TP: </span>
                      <span className="font-semibold text-slate-800">
                        {hist.activityPlanCode || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">ประเภท: </span>
                      <span className="font-semibold text-slate-800">
                        {hist.activityTypeName || "ฉีดแปลงแฮตแทค"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* รายการสินค้าที่ใช้จริง */}
                {hist.products && hist.products.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-2xs font-bold text-slate-700 block uppercase tracking-wider">
                      รายการสินค้าที่ใช้จริง:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {hist.products.map((p: any, pIdx: number) => (
                        <div
                          key={p.id || pIdx}
                          className="bg-white rounded-lg border border-slate-200/80 p-2.5 text-xs flex flex-col justify-between shadow-2xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-800">
                              {p.productName}
                            </span>
                            <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-2xs border border-amber-200">
                              ใช้จริง {p.quantityUsed} {p.unit}
                            </span>
                          </div>
                          {(p.actualRate || p.detail) && (
                            <div className="mt-1 pt-1 border-t border-slate-100 text-2xs text-slate-500 space-y-0.5">
                              {p.actualRate && (
                                <div>
                                  <span className="text-slate-400">อัตรา: </span>
                                  {p.actualRate}
                                </div>
                              )}
                              {p.detail && (
                                <div>
                                  <span className="text-slate-400">รายละเอียด: </span>
                                  {p.detail}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. ผลการติดตามรายรอบ (Tracking Rounds)
      ───────────────────────────────────────────────────────────── */}
      <div className="space-y-6">
        {actualState.rounds.map((round, rIdx) => (
          <div
            key={round.id || rIdx}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-5 shadow-xs"
          >
            {/* Header ของรอบ */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                  {round.roundNumber}
                </div>
                <h4 className="font-bold text-slate-800 text-sm sm:text-base">
                  การตรวจติดตามครั้งที่ {round.roundNumber}
                </h4>
              </div>

              {!readonly && actualState.rounds.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => actualState.removeSprayRound(rIdx)}
                  className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg flex items-center gap-1 self-start sm:self-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบรอบนี้</span>
                </Button>
              )}
            </div>

            {/* 2.1 วันที่ติดตาม และ วันหลังฉีดพ่น */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  วันที่ติดตามจริง <span className="text-rose-500">*</span>
                </label>
                <DatePicker
                  value={round.actualVisitDate}
                  onChange={(val) =>
                    actualState.updateRoundField(
                      rIdx,
                      "actualVisitDate",
                      val || "",
                    )
                  }
                  disabled={readonly}
                  placeholder="เลือกวันที่ติดตามจริง"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  จำนวนวันหลังฉีดพ่น (วัน) <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  min={0}
                  placeholder="เช่น 7 หรือ 14"
                  value={round.daysAfterSpray}
                  onChange={(e) =>
                    actualState.updateRoundField(
                      rIdx,
                      "daysAfterSpray",
                      e.target.value,
                    )
                  }
                  disabled={readonly}
                  className="h-9 text-xs bg-white font-medium"
                />
              </div>
            </div>

            {/* 2.2 ยา/สารเคมีที่ใช้ในการติดตาม */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/40 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-600" />
                  <span className="font-bold text-slate-800 text-xs sm:text-sm">
                    ยา/สารเคมีที่ใช้ในการติดตาม (รอบที่ {round.roundNumber})
                  </span>
                </div>

                {!readonly && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => actualState.addRoundProduct(rIdx)}
                    className="h-7 text-xs text-purple-700 border-purple-300 hover:bg-purple-50"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    เพิ่มสินค้า
                  </Button>
                )}
              </div>

              {round.products.length === 0 ? (
                <div className="p-4 rounded-lg bg-white text-center text-xs text-slate-400 border border-dashed border-slate-200">
                  ไม่มีรายการยาที่ใช้ในรอบนี้ (คลิกปุ่ม &quot;+ เพิ่มสินค้า&quot; หากมีการใช้ยาเพิ่มเติม)
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="w-full text-xs text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="py-2.5 px-3 w-[35%]">
                          สินค้า <span className="text-red-500">*</span>
                        </th>
                        <th className="py-2.5 px-3 w-[20%]">
                          จำนวนที่ใช้จริง <span className="text-red-500">*</span>
                        </th>
                        <th className="py-2.5 px-3 w-[20%]">
                          อัตราการใช้ <span className="text-red-500">*</span>
                        </th>
                        <th className="py-2.5 px-3 w-[20%]">รายละเอียด</th>
                        {!readonly && (
                          <th className="py-2.5 px-3 w-[5%] text-center">จัดการ</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {round.products.map((prod, pIdx) => (
                        <tr key={pIdx} className="hover:bg-slate-50/50">
                          {/* สินค้า */}
                          <td className="py-2.5 px-3 align-top">
                            {readonly ? (
                              <span className="font-semibold text-slate-800">
                                {prod.productName || "สินค้าไม่ระบุชื่อ"}
                              </span>
                            ) : (
                              <FormCombobox
                                id={`product-t14-${rIdx}-${pIdx}`}
                                label=""
                                value={prod.productId || ""}
                                onChange={(val) => {
                                  const selected = products.find((p) => p.id === val);
                                  actualState.updateRoundProduct(rIdx, pIdx, "productId", val);
                                  if (selected) {
                                    actualState.updateRoundProduct(rIdx, pIdx, "productName", selected.name);
                                    if (selected.unit) {
                                      actualState.updateRoundProduct(rIdx, pIdx, "unit", selected.unit);
                                    }
                                  }
                                }}
                                options={productOptions}
                                placeholder="เลือกสินค้าจาก Product Master..."
                                searchPlaceholder="ค้นหาสินค้า..."
                                emptyText="ไม่พบสินค้า"
                                disabled={readonly}
                                triggerClassName="h-8 min-h-[32px] text-xs bg-white border-slate-200"
                              />
                            )}
                          </td>

                          {/* จำนวนที่ใช้จริง */}
                          <td className="py-2.5 px-3 align-top">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min={0}
                                step="any"
                                value={prod.quantityUsed ?? ""}
                                onChange={(e) =>
                                  actualState.updateRoundProduct(
                                    rIdx,
                                    pIdx,
                                    "quantityUsed",
                                    e.target.value === ""
                                      ? ""
                                      : parseFloat(e.target.value) || 0,
                                  )
                                }
                                disabled={readonly}
                                placeholder="ระบุจำนวนจริง"
                                className="w-full h-8 px-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white font-medium"
                              />
                              <span className="text-[11px] text-slate-500 whitespace-nowrap">
                                {prod.unit || "หน่วย"}
                              </span>
                            </div>
                          </td>

                          {/* อัตราการใช้ */}
                          <td className="py-2.5 px-3 align-top">
                            <input
                              type="text"
                              value={prod.actualRate || ""}
                              onChange={(e) =>
                                actualState.updateRoundProduct(
                                  rIdx,
                                  pIdx,
                                  "actualRate",
                                  e.target.value,
                                )
                              }
                              disabled={readonly}
                              placeholder="เช่น 20 ซีซี/น้ำ 20 ลิตร"
                              className="w-full h-8 px-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            />
                          </td>

                          {/* รายละเอียด */}
                          <td className="py-2.5 px-3 align-top">
                            <input
                              type="text"
                              value={prod.detail || ""}
                              onChange={(e) =>
                                actualState.updateRoundProduct(
                                  rIdx,
                                  pIdx,
                                  "detail",
                                  e.target.value,
                                )
                              }
                              disabled={readonly}
                              placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                              className="w-full h-8 px-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            />
                          </td>

                          {/* ปุ่มลบ */}
                          {!readonly && (
                            <td className="py-2.5 px-3 align-top text-center">
                              <button
                                type="button"
                                onClick={() => actualState.removeRoundProduct(rIdx, pIdx)}
                                className="text-slate-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                                title="ลบสินค้ารายการนี้"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 2.3 ผลการติดตาม */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <FileText className="w-4 h-4 text-purple-600" />
                <span className="font-bold text-slate-800 text-xs">
                  ผลการติดตาม (รอบที่ {round.roundNumber}){" "}
                  <span className="text-rose-500">*</span>
                </span>
              </div>

              <Textarea
                rows={3}
                placeholder={`บันทึกผลการติดตามในรอบที่ ${round.roundNumber} เช่น สภาพใบ การแตกยอด การควบคุมโรค/แมลง หรือการตอบสนองของพืช...`}
                value={round.trackingResult}
                onChange={(e) =>
                  actualState.updateRoundField(
                    rIdx,
                    "trackingResult",
                    e.target.value,
                  )
                }
                disabled={readonly}
                className="text-xs bg-white"
              />
            </div>

            {/* 2.4 รูปภาพหลังการฉีดพ่น (Upload สูงสุด 5 รูป per round) */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-purple-600" />
                  <span className="font-bold text-slate-800 text-xs">
                    รูปภาพหลังการฉีดพ่น (รอบที่ {round.roundNumber})
                  </span>
                  <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    {round.afterSprayImages.length}/5 รูป
                  </span>
                </div>

                {!readonly && (
                  <div>
                    {round.afterSprayImages.length < 5 ? (
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[rIdx]?.click()}
                        className="h-7 px-2.5 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-1.5 font-medium transition-colors shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>เพิ่มรูปภาพ</span>
                      </button>
                    ) : (
                      <span className="text-2xs text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        ครบ 5 รูปแล้ว
                      </span>
                    )}
                    <input
                      ref={(el) => {
                        fileInputRefs.current[rIdx] = el;
                      }}
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          actualState.addRoundAfterSprayImages(
                            rIdx,
                            Array.from(e.target.files),
                          );
                          e.target.value = "";
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Gallery Grid */}
              {round.afterSprayImages.length === 0 ? (
                <div
                  onClick={() =>
                    !readonly && fileInputRefs.current[rIdx]?.click()
                  }
                  className={cn(
                    "border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-slate-50",
                    readonly && "cursor-default hover:bg-slate-50/50",
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">
                    ยังไม่มีรูปภาพหลังการฉีดพ่นในรอบที่ {round.roundNumber}
                  </p>
                  <p className="text-2xs text-slate-400 mt-0.5">
                    คลิกเพื่อเลือกรูปภาพ (อัปโหลดได้สูงสุด 5 รูป)
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                  {round.afterSprayImages.map((img, imgIdx) => (
                    <div
                      key={img.id || imgIdx}
                      className="group relative rounded-xl border border-slate-200 bg-slate-50 overflow-hidden aspect-square flex items-center justify-center shadow-2xs"
                    >
                      <img
                        src={img.url}
                        alt={img.name || `photo-${imgIdx + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Overlay actions */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewModalUrl(img.url)}
                          className="p-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-lg shadow-sm transition-transform hover:scale-105"
                          title="ดูรูปภาพ"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {!readonly && (
                          <button
                            type="button"
                            onClick={() =>
                              actualState.removeRoundAfterSprayImage(
                                rIdx,
                                imgIdx,
                              )
                            }
                            className="p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg shadow-sm transition-transform hover:scale-105"
                            title="ลบรูปภาพ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {img.size && (
                        <div className="absolute bottom-0 inset-x-0 bg-slate-900/60 text-white text-3xs px-1.5 py-0.5 truncate text-center">
                          {formatBytes(img.size)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2.5 ข้อมูลเพิ่มเติม (Optional) */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">
                  ข้อมูลเพิ่มเติม (รอบที่ {round.roundNumber})
                </span>
                <span className="text-2xs font-normal text-slate-400">
                  (ไม่บังคับ)
                </span>
              </div>
              <Textarea
                rows={2}
                placeholder={`ข้อมูลหรือข้อสังเกตเพิ่มเติมในรอบที่ ${round.roundNumber}...`}
                value={round.additionalNotes}
                onChange={(e) =>
                  actualState.updateRoundField(
                    rIdx,
                    "additionalNotes",
                    e.target.value,
                  )
                }
                disabled={readonly}
                className="text-xs bg-white"
              />
            </div>
          </div>
        ))}

        {/* ── Button: + เพิ่มรอบการฉีดพ่น ── */}
        {!readonly && (
          <div className="flex justify-center pt-2">
            <Button
              type="button"
              onClick={actualState.addSprayRound}
              className="h-10 px-5 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-xl flex items-center gap-2 font-semibold shadow-sm transition-all hover:scale-[1.01]"
            >
              <Plus className="w-4 h-4" />
              <span>
                + เพิ่มรอบการฉีดพ่น (รอบที่ {actualState.rounds.length + 1})
              </span>
            </Button>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewModalUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewModalUrl(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl">
            <img
              src={previewModalUrl}
              alt="preview"
              className="max-w-full max-h-[85vh] object-contain"
            />
            <button
              type="button"
              onClick={() => setPreviewModalUrl(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Type14Actual;
