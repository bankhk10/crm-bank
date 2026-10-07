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
  AlertCircle,
  Package,
  CheckCircle2,
  Clock3,
  XCircle,
  Send,
  Check,
  X,
  UploadCloud,
  Eye,
  Info,
  Beaker,
  History,
  Loader2,
  Droplets,
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
  // Supplemental Drug Modal/Form State
  const [showAddSupplemental, setShowAddSupplemental] = useState(false);
  const [newSuppProductId, setNewSuppProductId] = useState("");
  const [newSuppQty, setNewSuppQty] = useState("");
  const [newSuppNotes, setNewSuppNotes] = useState("");
  const [suppFormError, setSuppFormError] = useState<string | null>(null);

  // Return modal state
  const [returnTargetId, setReturnTargetId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState("");

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

  // Handle select plot
  const handleSelectPlotChange = (val: string) => {
    const selected = (actualState.availablePlots || []).find(
      (p) => p.id === val,
    );
    actualState.handleSelectPlot(val, selected);
  };

  // Handle adding new supplemental withdrawal
  const handleSaveSupplemental = async (autoSubmit: boolean) => {
    setSuppFormError(null);
    if (!newSuppProductId) {
      setSuppFormError("กรุณาเลือกตัวยาที่ต้องการเบิก");
      return;
    }
    const qtyNum = Number(newSuppQty);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setSuppFormError("กรุณาระบุจำนวนที่ต้องการเบิก (มากกว่า 0)");
      return;
    }

    const prod = products.find((p) => p.id === newSuppProductId);
    const res = await actualState.createSupplementalWithdrawal(
      [
        {
          productId: newSuppProductId,
          productName: prod?.name || "",
          quantity: qtyNum,
          unit: prod?.unit || "ขวด",
        },
      ],
      autoSubmit,
      newSuppNotes || undefined,
    );

    if (res.success) {
      setShowAddSupplemental(false);
      setNewSuppProductId("");
      setNewSuppQty("");
      setNewSuppNotes("");
    } else {
      setSuppFormError(res.error || "เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  // Handle Return submit
  const handleConfirmReturn = async () => {
    if (!returnTargetId) return;
    if (!returnReason.trim()) {
      alert("กรุณาระบุเหตุผลการส่งคืน/ไม่อนุมัติ");
      return;
    }
    const res = await actualState.returnSupplementalWithdrawal(
      returnTargetId,
      returnReason.trim(),
    );
    if (res.success) {
      setReturnTargetId(null);
      setReturnReason("");
    }
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
          1.5 ประวัติการฉีดพ่นจริง (Read-Only)
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
                ข้อมูลผลการฉีดพ่นจริงจากกิจกรรมก่อนหน้าของแปลงนี้
                (อ้างอิงเพื่อการติดตามผล)
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
                <div className="space-y-1.5">
                  <span className="text-2xs font-bold text-slate-700 block uppercase tracking-wider">
                    รายการสินค้าที่ใช้จริง:
                  </span>
                  {hist.products && hist.products.length > 0 ? (
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
                                  <span className="text-slate-400">
                                    อัตรา:{" "}
                                  </span>
                                  <span>{p.actualRate}</span>
                                </div>
                              )}
                              {p.detail && (
                                <div>
                                  <span className="text-slate-400">
                                    รายละเอียด:{" "}
                                  </span>
                                  <span>{p.detail}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      ไม่มีรายการสินค้าที่บันทึก
                    </p>
                  )}
                </div>

                {/* ผลการฉีดพ่น */}
                {hist.productResponse && (
                  <div className="pt-2 border-t border-slate-200/60 text-xs">
                    <span className="text-2xs font-bold text-slate-700 block mb-0.5 uppercase tracking-wider">
                      ผลการฉีดพ่น:
                    </span>
                    <p className="text-slate-700 bg-white/80 p-2.5 rounded-lg border border-slate-200/60 whitespace-pre-line text-xs">
                      {hist.productResponse}
                    </p>
                  </div>
                )}

                {/* หมายเหตุเพิ่มเติม */}
                {hist.notes && (
                  <div className="text-xs">
                    <span className="text-2xs font-bold text-slate-700 block mb-0.5 uppercase tracking-wider">
                      หมายเหตุ:
                    </span>
                    <p className="text-slate-600 bg-white/80 p-2 rounded-lg border border-slate-200/60 text-2xs">
                      {hist.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. รอบการติดตามและฉีดพ่น (Multiple Spray Rounds)
      ───────────────────────────────────────────────────────────── */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-200/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span>รอบการติดตามและฉีดพ่น</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  {actualState.rounds.length} รอบ
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                บันทึกผลการติดตาม วันที่ และการใช้ยาแยกตามแต่ละรอบการฉีดพ่น
              </p>
            </div>
          </div>

          {!readonly && (
            <Button
              type="button"
              size="sm"
              onClick={actualState.addSprayRound}
              className="h-8 gap-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-xs font-semibold self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ เพิ่มรอบการฉีดพ่น</span>
            </Button>
          )}
        </div>

        {/* ── Spray Rounds List ── */}
        <div className="space-y-6">
          {actualState.rounds.map((round, rIdx) => (
            <div
              key={round.id || rIdx}
              className="bg-white rounded-2xl border-2 border-purple-200/70 p-5 sm:p-6 space-y-6 shadow-sm relative"
            >
              {/* Round Header */}
              <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {round.roundNumber}
                  </span>
                  <div>
                    <h4 className="text-base font-bold text-purple-950">
                      รอบการฉีดพ่นที่ {round.roundNumber}
                    </h4>
                    <span className="text-2xs text-purple-600/80 font-medium">
                      ข้อมูลอิสระเฉพาะรอบที่ {round.roundNumber}
                    </span>
                  </div>
                </div>

                {!readonly && actualState.rounds.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => actualState.removeSprayRound(rIdx)}
                    className="h-8 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2.5 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    ลบรอบนี้
                  </Button>
                )}
              </div>

              {/* 2.1 วันที่ติดตามจริง & จำนวนวันหลังฉีด */}
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/70 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-bold text-slate-800">
                    ข้อมูลวันและระยะเวลาติดตาม (รอบที่ {round.roundNumber})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* วันที่ติดตามจริง */}
                  <div className="space-y-1.5">
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
                      placeholder="เลือกวันที่ติดตามจริง"
                      disabled={readonly}
                    />
                  </div>

                  {/* จำนวนวันหลังฉีด */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">
                      จำนวนวันหลังฉีด (วัน){" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="ระบุจำนวนวัน เช่น 7, 14, 21"
                      value={round.daysAfterSpray}
                      onChange={(e) =>
                        actualState.updateRoundField(
                          rIdx,
                          "daysAfterSpray",
                          e.target.value,
                        )
                      }
                      disabled={readonly}
                      className="h-10 text-sm bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 2.2 ยาที่ใช้ในการติดตามรอบนี้ (3 กลุ่มอย่างชัดเจน) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Beaker className="w-4 h-4 text-purple-600" />
                  <h4 className="font-bold text-slate-800 text-sm">
                    ยาที่ใช้ในการติดตาม (รอบที่ {round.roundNumber})
                  </h4>
                </div>

                {/* ── 2.2.A ยาจากรายการเบิกเดิม ── */}
                <div className="rounded-xl border border-blue-200/80 bg-blue-50/20 p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-blue-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-2xs font-bold">
                        A
                      </span>
                      <span className="font-bold text-slate-800 text-xs">
                        ยาจากรายการเบิกเดิม
                      </span>
                    </div>
                    <span className="text-2xs text-slate-500">
                      ดึงจากรายการเบิกยาของแผนงานนี้ (Read-only
                      สินค้าและจำนวนเบิก)
                    </span>
                  </div>

                  {round.originalProducts.length === 0 ? (
                    <div className="p-3 rounded-lg bg-white/80 text-center text-xs text-slate-500 border border-slate-150">
                      {!actualState.demoPlotId
                        ? "กรุณาเลือกแปลงแฮตแทคเพื่อดูรายการยาจากรายการเบิกเดิม"
                        : "ไม่พบรายการเบิกยาเดิมสำหรับแปลงนี้"}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Desktop / Tablet Table View */}
                      <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200 bg-white">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold">
                            <tr>
                              <th className="py-2.5 px-3 text-left w-1/4">
                                สินค้า
                              </th>
                              <th className="py-2.5 px-3 text-center w-28">
                                จำนวนที่เบิก
                              </th>
                              <th className="py-2.5 px-3 text-center w-32">
                                ใช้จริงในรอบนี้
                              </th>
                              <th className="py-2.5 px-3 text-left w-1/4">
                                อัตรา
                              </th>
                              <th className="py-2.5 px-3 text-left">
                                รายละเอียด
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {round.originalProducts.map((item, pIdx) => (
                              <tr
                                key={item.drugWithdrawalItemId || item.productId || pIdx}
                                className="hover:bg-slate-50/50 transition-colors"
                              >
                                {/* สินค้า (Read-only) */}
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-blue-600 shrink-0" />
                                    <span className="font-bold text-slate-800">
                                      {item.productName}
                                    </span>
                                  </div>
                                </td>

                                {/* จำนวนที่เบิก (Read-only) */}
                                <td className="py-2.5 px-3 text-center">
                                  <Badge
                                    variant="outline"
                                    className="font-bold text-blue-700 bg-blue-50 border-blue-200 text-2xs"
                                  >
                                    {item.withdrawnQuantity} {item.unit}
                                  </Badge>
                                </td>

                                {/* ใช้จริงในรอบนี้ (Editable) */}
                                <td className="py-2.5 px-3">
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      min={0}
                                      step="any"
                                      placeholder="0"
                                      value={item.quantityUsed}
                                      onChange={(e) =>
                                        actualState.updateRoundOriginalProduct(
                                          rIdx,
                                          pIdx,
                                          "quantityUsed",
                                          e.target.value,
                                        )
                                      }
                                      disabled={readonly}
                                      className="h-8 text-xs bg-white text-right pr-9"
                                    />
                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-2xs text-slate-400 pointer-events-none">
                                      {item.unit}
                                    </span>
                                  </div>
                                </td>

                                {/* อัตรา (Editable) */}
                                <td className="py-2.5 px-3">
                                  <Input
                                    placeholder="เช่น 20 ซีซี / น้ำ 20 ลิตร"
                                    value={item.actualRate}
                                    onChange={(e) =>
                                      actualState.updateRoundOriginalProduct(
                                        rIdx,
                                        pIdx,
                                        "actualRate",
                                        e.target.value,
                                      )
                                    }
                                    disabled={readonly}
                                    className="h-8 text-xs bg-white"
                                  />
                                </td>

                                {/* รายละเอียด (Editable) */}
                                <td className="py-2.5 px-3">
                                  <Input
                                    placeholder="หมายเหตุหรือรายละเอียด"
                                    value={item.detail}
                                    onChange={(e) =>
                                      actualState.updateRoundOriginalProduct(
                                        rIdx,
                                        pIdx,
                                        "detail",
                                        e.target.value,
                                      )
                                    }
                                    disabled={readonly}
                                    className="h-8 text-xs bg-white"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card View */}
                      <div className="md:hidden space-y-3">
                        {round.originalProducts.map((item, pIdx) => (
                          <div
                            key={item.drugWithdrawalItemId || item.productId || pIdx}
                            className="p-3 rounded-lg border border-slate-200/80 bg-white space-y-2.5"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-blue-600 shrink-0" />
                                <span className="font-bold text-xs text-slate-800">
                                  {item.productName}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className="text-slate-500">เบิก:</span>
                                <Badge
                                  variant="outline"
                                  className="font-bold text-blue-700 bg-blue-50 border-blue-200 text-2xs"
                                >
                                  {item.withdrawnQuantity} {item.unit}
                                </Badge>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                              <div>
                                <label className="text-2xs font-semibold text-slate-600 block mb-1">
                                  ใช้จริง ({item.unit})
                                </label>
                                <Input
                                  type="number"
                                  min={0}
                                  step="any"
                                  placeholder="0"
                                  value={item.quantityUsed}
                                  onChange={(e) =>
                                    actualState.updateRoundOriginalProduct(
                                      rIdx,
                                      pIdx,
                                      "quantityUsed",
                                      e.target.value,
                                    )
                                  }
                                  disabled={readonly}
                                  className="h-8 text-xs bg-white"
                                />
                              </div>

                              <div>
                                <label className="text-2xs font-semibold text-slate-600 block mb-1">
                                  อัตรา
                                </label>
                                <Input
                                  placeholder="เช่น 20 ซีซี / น้ำ 20 ลิตร"
                                  value={item.actualRate}
                                  onChange={(e) =>
                                    actualState.updateRoundOriginalProduct(
                                      rIdx,
                                      pIdx,
                                      "actualRate",
                                      e.target.value,
                                    )
                                  }
                                  disabled={readonly}
                                  className="h-8 text-xs bg-white"
                                />
                              </div>

                              <div>
                                <label className="text-2xs font-semibold text-slate-600 block mb-1">
                                  รายละเอียด
                                </label>
                                <Input
                                  placeholder="หมายเหตุหรือรายละเอียด"
                                  value={item.detail}
                                  onChange={(e) =>
                                    actualState.updateRoundOriginalProduct(
                                      rIdx,
                                      pIdx,
                                      "detail",
                                      e.target.value,
                                    )
                                  }
                                  disabled={readonly}
                                  className="h-8 text-xs bg-white"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── 2.2.B ยานอกแผนที่ใช้จริง (Actual-only) ── */}
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/20 p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center text-2xs font-bold">
                        B
                      </span>
                      <div>
                        <span className="font-bold text-slate-800 text-xs">
                          ยานอกแผนที่ใช้จริง (Actual-only)
                        </span>
                        <p className="text-2xs text-slate-500">
                          เลือกจาก Product Master ไม่มีการเบิกยาผ่านระบบ
                          บันทึกเฉพาะปริมาณที่ใช้จริง
                        </p>
                      </div>
                    </div>

                    {!readonly && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          actualState.addRoundActualOnlyProduct(rIdx)
                        }
                        className="h-7 text-xs text-amber-700 border-amber-300 hover:bg-amber-50 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        เพิ่มยานอกแผน
                      </Button>
                    )}
                  </div>

                  {round.actualOnlyProducts.length === 0 ? (
                    <div className="p-3 rounded-lg bg-white/80 text-center text-xs text-slate-500 border border-slate-150">
                      ไม่มีการใช้ยานอกแผนในรอบนี้ หากมี ให้กดปุ่ม
                      &quot;เพิ่มยานอกแผน&quot;
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {round.actualOnlyProducts.map((item, pIdx) => (
                        <div
                          key={pIdx}
                          className="p-3 rounded-lg border border-amber-200/80 bg-white space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-900">
                              ยานอกแผน #{pIdx + 1}
                            </span>
                            {!readonly && (
                              <button
                                type="button"
                                onClick={() =>
                                  actualState.removeRoundActualOnlyProduct(
                                    rIdx,
                                    pIdx,
                                  )
                                }
                                className="text-rose-500 hover:text-rose-700 p-1"
                                title="ลบรายการ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                            <div className="sm:col-span-2">
                              <label className="text-2xs font-semibold text-slate-600 block mb-1">
                                สินค้าจาก Master{" "}
                                <span className="text-rose-500">*</span>
                              </label>
                              <FormCombobox
                                options={productOptions}
                                value={item.productId}
                                onChange={(val) => {
                                  const p = products.find(
                                    (prod) => prod.id === val,
                                  );
                                  actualState.updateRoundActualOnlyProduct(
                                    rIdx,
                                    pIdx,
                                    "productId",
                                    val,
                                  );
                                  if (p) {
                                    actualState.updateRoundActualOnlyProduct(
                                      rIdx,
                                      pIdx,
                                      "productName",
                                      p.name,
                                    );
                                    actualState.updateRoundActualOnlyProduct(
                                      rIdx,
                                      pIdx,
                                      "unit",
                                      p.unit || "ขวด",
                                    );
                                  }
                                }}
                                placeholder="-- เลือกสินค้า Master --"
                                disabled={readonly}
                              />
                            </div>

                            <div>
                              <label className="text-2xs font-semibold text-slate-600 block mb-1">
                                จำนวนที่ใช้จริง ({item.unit || "หน่วย"}){" "}
                                <span className="text-rose-500">*</span>
                              </label>
                              <Input
                                type="number"
                                min={0}
                                placeholder="0"
                                value={item.quantityUsed}
                                onChange={(e) =>
                                  actualState.updateRoundActualOnlyProduct(
                                    rIdx,
                                    pIdx,
                                    "quantityUsed",
                                    e.target.value,
                                  )
                                }
                                disabled={readonly}
                                className="h-8 text-xs bg-white"
                              />
                            </div>

                            <div>
                              <label className="text-2xs font-semibold text-slate-600 block mb-1">
                                อัตราการใช้
                              </label>
                              <Input
                                placeholder="เช่น 20 ซีซี / น้ำ 20 ลิตร"
                                value={item.actualRate}
                                onChange={(e) =>
                                  actualState.updateRoundActualOnlyProduct(
                                    rIdx,
                                    pIdx,
                                    "actualRate",
                                    e.target.value,
                                  )
                                }
                                disabled={readonly}
                                className="h-8 text-xs bg-white"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-2xs font-semibold text-slate-600 block mb-1">
                              รายละเอียดเพิ่มเติม
                            </label>
                            <Input
                              placeholder="หมายเหตุหรือเหตุผลการใช้ยานอกแผน"
                              value={item.detail}
                              onChange={(e) =>
                                actualState.updateRoundActualOnlyProduct(
                                  rIdx,
                                  pIdx,
                                  "detail",
                                  e.target.value,
                                )
                              }
                              disabled={readonly}
                              className="h-8 text-xs bg-white"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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

                        {/* File info footer */}
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
        </div>

        {/* ── Button: + เพิ่มรอบการฉีดพ่น (Below last round) ── */}
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

      {/* ─────────────────────────────────────────────────────────────
          Modal: เพิ่มรายการขอเบิกยาเพิ่มเติมใหม่ (Supplemental)
      ───────────────────────────────────────────────────────────── */}
      {showAddSupplemental && !readonly && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-xl border border-emerald-100">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  +
                </div>
                <h5 className="font-bold text-slate-800 text-sm">
                  ขอเบิกยาเพิ่มเติมใหม่ (Supplemental Drug Withdrawal)
                </h5>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSupplemental(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {suppFormError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{suppFormError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-2xs font-semibold text-slate-700 block mb-1">
                  เลือกตัวยาจาก Master <span className="text-rose-500">*</span>
                </label>
                <FormCombobox
                  options={productOptions}
                  value={newSuppProductId}
                  onChange={(val) => setNewSuppProductId(val)}
                  placeholder="-- เลือกสินค้าที่ต้องการเบิก --"
                />
              </div>

              <div>
                <label className="text-2xs font-semibold text-slate-700 block mb-1">
                  จำนวนที่ขอเบิก <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  min={0.01}
                  step="any"
                  placeholder="จำนวน"
                  value={newSuppQty}
                  onChange={(e) => setNewSuppQty(e.target.value)}
                  className="h-9 text-xs bg-white"
                />
              </div>

              <div>
                <label className="text-2xs font-semibold text-slate-700 block mb-1">
                  หมายเหตุ / วัตถุประสงค์การขอเบิกเพิ่ม
                </label>
                <Input
                  placeholder="ระบุเหตุผลที่ต้องเบิกเพิ่มในการติดตามรอบนี้"
                  value={newSuppNotes}
                  onChange={(e) => setNewSuppNotes(e.target.value)}
                  className="h-8 text-xs bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAddSupplemental(false)}
                className="h-8 text-xs"
              >
                ยกเลิก
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={actualState.isProcessingSupplemental}
                onClick={() => handleSaveSupplemental(false)}
                className="h-8 text-xs border-slate-300"
              >
                บันทึกแบบร่าง (Draft)
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={actualState.isProcessingSupplemental}
                onClick={() => handleSaveSupplemental(true)}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                ส่งขออนุมัติทันที
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Return / Reject Modal */}
      {returnTargetId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-500" />
              <span>ระบุเหตุผลการส่งคืน / ไม่อนุมัติ</span>
            </h5>
            <Textarea
              rows={3}
              placeholder="ระบุเหตุผล เช่น สินค้ามีในสต็อกเดิมเพียงพอแล้ว, ปริมาณขอเบิกมากเกินไป..."
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              className="text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setReturnTargetId(null)}
              >
                ยกเลิก
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white"
                onClick={handleConfirmReturn}
              >
                ยืนยันส่งคืน
              </Button>
            </div>
          </div>
        </div>
      )}

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
