"use client";

import React, { useEffect, useMemo, useCallback } from "react";
import {
  Clock,
  RotateCw,
  Plus,
  Trash2,
  PackagePlus,
  PackageCheck,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ActivityInput,
  ActivityTextarea,
  ActivityPhotoUpload,
  ActivitySelect,
  ActivityProductSelect,
} from "@/modules/activity/ui";
import {
  SPRAY_METHOD_RADIO_OPTIONS,
  SPRAY_EQUIPMENT_RADIO_OPTIONS,
  SPRAY_RESPONSE_OPTIONS,
  DEMO_PLOT_STATUS_OPTIONS,
} from "../../shared/constants";
import type {
  Type7bActualFormProps,
  Type7bSprayRoundState,
  Type7bAdditionalProductItem,
} from "../types/actual.types";
import { Type7bPlanCard } from "./type7b-plan-card";

export function Type7bActualForm({
  isVisible = true,
  planType,
  target,
  targets = [],
  products = [],
  actualState = {},
  onUpdateField,
  readonly = false,
  onAddRound,
  onRemoveRound,
  onUpdateRoundField,
  onAddAdditionalProduct,
  onUpdateAdditionalProduct,
  onRemoveAdditionalProduct,
  onUpdateBaselineProduct,
  onUpdateRoundImages,
}: Type7bActualFormProps) {
  if (!isVisible) return null;

  const resolvedTargets = targets.length > 0 ? targets : target ? [target] : [];

  // Extract planned demo products from targets
  const targetDemoProducts = useMemo(() => {
    const list: Array<{ productId: string; productName: string; quantity: number | string; unit?: string }> = [];
    const t = resolvedTargets[0];
    if (t) {
      const prods = t.demoProducts || t.withdrawnProducts || (t as any).products || [];
      prods.forEach((p: any) => {
        const pId = p.productId || p.product?.id || p.id;
        const pName = p.productName || p.product?.name || p.name || "สินค้าตามแผน";
        const qty = p.quantity ?? p.targetQuantity ?? 1;
        const unit = p.unit || p.product?.unit || "หน่วย";
        if (pId) {
          list.push({ productId: pId, productName: pName, quantity: qty, unit });
        }
      });
    }
    return list;
  }, [resolvedTargets]);

  // Ensure spraying rounds exist
  const rounds: Type7bSprayRoundState[] = useMemo(() => {
    if (Array.isArray(actualState.t7SprayingRounds) && actualState.t7SprayingRounds.length > 0) {
      return actualState.t7SprayingRounds;
    }
    return [
      {
        id: "round-1",
        roundNumber: 1,
        sprayDate: actualState.t7VisitDate || new Date().toISOString().split("T")[0],
        sprayMethod: "SINGLE",
        sprayEquipment: "เป้สะพายหลัง",
        otherEquipment: "",
        productResponse: "พืชตอบสนองดี (เห็นผลตามเป้าหมาย)",
        problemDetail: "",
        baselineProducts: targetDemoProducts.map((p) => ({
          productId: p.productId,
          productName: p.productName,
          plannedQuantity: p.quantity,
          actualQuantity: p.quantity,
          plannedRate: "",
          actualRate: "",
          unit: p.unit,
        })),
        additionalProducts: [],
        roundImages: [],
      },
    ];
  }, [actualState.t7SprayingRounds, actualState.t7VisitDate, targetDemoProducts]);

  // Sync baseline products into rounds if rounds had 0 baseline products
  useEffect(() => {
    if (targetDemoProducts.length > 0 && Array.isArray(actualState.t7SprayingRounds)) {
      const needsInit = actualState.t7SprayingRounds.some(
        (r) => !r.baselineProducts || r.baselineProducts.length === 0,
      );
      if (needsInit) {
        const updated = actualState.t7SprayingRounds.map((r) => {
          if (!r.baselineProducts || r.baselineProducts.length === 0) {
            return {
              ...r,
              baselineProducts: targetDemoProducts.map((p) => ({
                productId: p.productId,
                productName: p.productName,
                plannedQuantity: p.quantity,
                actualQuantity: p.quantity,
                plannedRate: "",
                actualRate: "",
                unit: p.unit,
              })),
            };
          }
          return r;
        });
        onUpdateField?.("t7SprayingRounds", updated);
      }
    }
  }, [targetDemoProducts, actualState.t7SprayingRounds, onUpdateField]);

  // Handlers fallback to onUpdateField if dedicated callbacks not passed
  const handleAddRound = useCallback(() => {
    if (onAddRound) {
      onAddRound();
      return;
    }
    const currentRounds = rounds;
    const newRoundNumber = currentRounds.length + 1;
    const baseProducts = currentRounds[0]?.baselineProducts || [];
    const newRound: Type7bSprayRoundState = {
      id: `round-${Date.now()}-${newRoundNumber}`,
      roundNumber: newRoundNumber,
      sprayDate: actualState.t7VisitDate || new Date().toISOString().split("T")[0],
      sprayMethod: "SINGLE",
      sprayEquipment: "เป้สะพายหลัง",
      otherEquipment: "",
      productResponse: "พืชตอบสนองดี (เห็นผลตามเป้าหมาย)",
      problemDetail: "",
      baselineProducts: baseProducts.map((p) => ({ ...p, actualRate: "", actualQuantity: p.plannedQuantity })),
      additionalProducts: [],
      roundImages: [],
    };
    onUpdateField?.("t7SprayingRounds", [...currentRounds, newRound]);
  }, [onAddRound, rounds, actualState.t7VisitDate, onUpdateField]);

  const handleRemoveRound = useCallback(
    (rIdx: number) => {
      if (onRemoveRound) {
        onRemoveRound(rIdx);
        return;
      }
      if (rounds.length <= 1) return;
      const filtered = rounds.filter((_, idx) => idx !== rIdx);
      const reindexed = filtered.map((r, idx) => ({ ...r, roundNumber: idx + 1 }));
      onUpdateField?.("t7SprayingRounds", reindexed);
    },
    [onRemoveRound, rounds, onUpdateField],
  );

  const handleUpdateRoundField = useCallback(
    (rIdx: number, field: string, value: any) => {
      if (onUpdateRoundField) {
        onUpdateRoundField(rIdx, field, value);
        return;
      }
      const updated = [...rounds];
      if (updated[rIdx]) {
        updated[rIdx] = { ...updated[rIdx], [field]: value };
        onUpdateField?.("t7SprayingRounds", updated);
      }
    },
    [onUpdateRoundField, rounds, onUpdateField],
  );

  const handleAddAdditionalProduct = useCallback(
    (rIdx: number) => {
      if (onAddAdditionalProduct) {
        onAddAdditionalProduct(rIdx);
        return;
      }
      const updated = [...rounds];
      if (updated[rIdx]) {
        const newProd: Type7bAdditionalProductItem = {
          id: `add-prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          productId: "",
          productName: "",
          actualRate: "",
          quantityUsed: 1,
          unit: "ขวด",
        };
        updated[rIdx] = {
          ...updated[rIdx],
          additionalProducts: [...(updated[rIdx].additionalProducts || []), newProd],
        };
        onUpdateField?.("t7SprayingRounds", updated);
      }
    },
    [onAddAdditionalProduct, rounds, onUpdateField],
  );

  const handleUpdateAdditionalProduct = useCallback(
    (rIdx: number, pIdx: number, field: string, value: any) => {
      if (onUpdateAdditionalProduct) {
        onUpdateAdditionalProduct(rIdx, pIdx, field, value);
        return;
      }
      const updated = [...rounds];
      if (updated[rIdx] && updated[rIdx].additionalProducts?.[pIdx]) {
        const prods = [...updated[rIdx].additionalProducts];
        prods[pIdx] = { ...prods[pIdx], [field]: value };
        updated[rIdx] = { ...updated[rIdx], additionalProducts: prods };
        onUpdateField?.("t7SprayingRounds", updated);
      }
    },
    [onUpdateAdditionalProduct, rounds, onUpdateField],
  );

  const handleRemoveAdditionalProduct = useCallback(
    (rIdx: number, pIdx: number) => {
      if (onRemoveAdditionalProduct) {
        onRemoveAdditionalProduct(rIdx, pIdx);
        return;
      }
      const updated = [...rounds];
      if (updated[rIdx]) {
        const prods = (updated[rIdx].additionalProducts || []).filter((_, idx) => idx !== pIdx);
        updated[rIdx] = { ...updated[rIdx], additionalProducts: prods };
        onUpdateField?.("t7SprayingRounds", updated);
      }
    },
    [onRemoveAdditionalProduct, rounds, onUpdateField],
  );

  const handleUpdateBaselineProduct = useCallback(
    (rIdx: number, pIdx: number, field: string, value: any) => {
      if (onUpdateBaselineProduct) {
        onUpdateBaselineProduct(rIdx, pIdx, field, value);
        return;
      }
      const updated = [...rounds];
      if (updated[rIdx] && updated[rIdx].baselineProducts?.[pIdx]) {
        const prods = [...updated[rIdx].baselineProducts];
        prods[pIdx] = { ...prods[pIdx], [field]: value };
        updated[rIdx] = { ...updated[rIdx], baselineProducts: prods };
        onUpdateField?.("t7SprayingRounds", updated);
      }
    },
    [onUpdateBaselineProduct, rounds, onUpdateField],
  );

  const handleUpdateRoundImages = useCallback(
    (rIdx: number, images: any[]) => {
      if (onUpdateRoundImages) {
        onUpdateRoundImages(rIdx, images);
        return;
      }
      const updated = [...rounds];
      if (updated[rIdx]) {
        updated[rIdx] = { ...updated[rIdx], roundImages: images };
        onUpdateField?.("t7SprayingRounds", updated);
      }
    },
    [onUpdateRoundImages, rounds, onUpdateField],
  );

  return (
    <div className="space-y-6">
      {/* Plan Reference Summary Card */}
      {planType !== "UNPLANNED" && resolvedTargets.length > 0 && (
        <Type7bPlanCard targets={resolvedTargets as any} />
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: ข้อมูลการติดตามแปลง (Tracking Details)                        */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              ส่วนที่ 1: ข้อมูลการติดตามแปลง (Tracking Details)
            </h3>
            <p className="text-xs text-slate-500">
              บันทึกวันที่เข้าติดตาม คำนวณวันหลังฉีดพ่น และภาพถ่ายสภาพพืชรอบนี้
            </p>
          </div>
        </div>

        {/* Row 1: วันที่ติดตามจริง & จำนวนวันหลังฉีดพ่น */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              วันที่ติดตามจริง <span className="text-rose-500">*</span>
            </label>
            <ActivityInput
              type="date"
              value={actualState.t7VisitDate || ""}
              onChange={(e) => onUpdateField?.("t7VisitDate", e.target.value)}
              disabled={readonly}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              จำนวนวันหลังฉีดพ่น (วัน) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <ActivityInput
                type="number"
                min={0}
                value={actualState.t7DaysAfterSpray ?? 0}
                onChange={(e) =>
                  onUpdateField?.(
                    "t7DaysAfterSpray",
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                disabled={readonly}
                className="pr-10"
                placeholder="0"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium pointer-events-none">
                วัน
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: รูปภาพสภาพพืชในการติดตามรอบนี้ */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">
              รูปภาพสภาพพืชในการติดตามรอบนี้
            </label>
            <span className="text-xs text-slate-400">
              อัปโหลดได้สูงสุด 5 รูป ({actualState.t7CropImages?.length || 0}/5)
            </span>
          </div>
          <ActivityPhotoUpload
            title="อัปโหลดรูปภาพ (สูงสุด 5 รูป)"
            description="รองรับไฟล์ jpg, jpeg, png, webp, heic, heif"
            images={(actualState.t7CropImages as any) || []}
            onImagesChange={(imgs) => onUpdateField?.("t7CropImages", imgs)}
            disabled={readonly}
            maxFiles={5}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: ข้อมูลการฉีดพ่นรอบต่างๆ (Multiple Spraying Rounds)           */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {/* Section 2 Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <RotateCw className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                ส่วนที่ 2: ข้อมูลการฉีดพ่นรอบต่างๆ (Multiple Spraying Rounds)
              </h3>
              <p className="text-xs text-slate-500">
                บันทึกผลการฉีดพ่นยา อัตราการใช้จริง วิธีและอุปกรณ์ทำการฉีดพ่น
              </p>
            </div>
          </div>
          {!readonly && (
            <Button
              type="button"
              size="sm"
              onClick={handleAddRound}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium px-3 py-1.5 flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มรอบการฉีดพ่น</span>
            </Button>
          )}
        </div>

        {/* Dynamic Round Cards */}
        {rounds.map((round, rIdx) => {
          const baselineProds = round.baselineProducts || [];
          const additionalProds = round.additionalProducts || [];
          const roundNum = round.roundNumber || rIdx + 1;

          return (
            <div
              key={round.id || rIdx}
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-5"
            >
              {/* Round Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {roundNum}
                  </span>
                  <span className="font-bold text-slate-900 text-sm sm:text-base">
                    รอบการฉีดพ่นที่ {roundNum}
                  </span>
                </div>
                {!readonly && rounds.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRound(rIdx)}
                    className="text-rose-500 hover:text-rose-700 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ลบรอบนี้</span>
                  </button>
                )}
              </div>

              {/* 1.1 รายการสินค้าตามแผนงาน (Planned Baseline Products) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    1.1 รายการสินค้าตามแผนงาน (Planned Baseline Products)
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-semibold px-2 py-0.2"
                  >
                    {baselineProds.length} รายการ
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 -mt-1.5">
                  รายการสินค้าที่เบิกตามแผนและอัตราที่ใช้พ่นในรอบนี้
                </p>

                {baselineProds.length > 0 ? (
                  <div className="space-y-2">
                    {baselineProds.map((bp, bpIdx) => (
                      <div
                        key={bp.productId || bpIdx}
                        className="bg-slate-50/80 border border-slate-200 rounded-xl p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <PackageCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{bp.productName}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            เบิกตามแผน: {bp.plannedQuantity || 1} {bp.unit || "หน่วย"}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600">
                            อัตราที่ใช้จริงรอบนี้
                          </label>
                          <ActivityInput
                            value={bp.actualRate || ""}
                            onChange={(e) =>
                              handleUpdateBaselineProduct(rIdx, bpIdx, "actualRate", e.target.value)
                            }
                            disabled={readonly}
                            placeholder="เช่น 20 ซีซี/น้ำ 20 ลิตร"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600">
                            ปริมาณที่ใช้จริง ({bp.unit || "หน่วย"})
                          </label>
                          <ActivityInput
                            type="number"
                            min={0}
                            step="any"
                            value={bp.actualQuantity ?? bp.plannedQuantity ?? 1}
                            onChange={(e) =>
                              handleUpdateBaselineProduct(
                                rIdx,
                                bpIdx,
                                "actualQuantity",
                                e.target.value,
                              )
                            }
                            disabled={readonly}
                            placeholder="1"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* 1.2 สินค้าเพิ่มเติมในการปฏิบัติงาน (Additional Products) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <PackagePlus className="w-4 h-4 text-purple-600" />
                      <span>1.2 สินค้าเพิ่มเติมในการปฏิบัติงาน (Additional Products)</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      รายการสินค้าที่ใช้จริงเพิ่มเติมรอบนี้ (ไม่อยู่ในแผนตอนเบิก)
                    </p>
                  </div>
                  {!readonly && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleAddAdditionalProduct(rIdx)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium px-2.5 py-1 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่มสินค้าจริง</span>
                    </Button>
                  )}
                </div>

                {additionalProds.length === 0 ? (
                  <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-xl p-5 text-center text-xs text-slate-400 space-y-1">
                    <p className="font-medium text-slate-600">ยังไม่มีรายการสินค้าเพิ่มเติมในรอบนี้</p>
                    <p className="text-[11px] text-slate-400">
                      หากมีการใช้สินค้าอื่นหรือยาเสริมเพิ่มเติมรอบนี้ สามารถกดปุ่ม &quot;+ เพิ่มสินค้าจริง&quot; ได้
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {additionalProds.map((ap, apIdx) => (
                      <div
                        key={ap.id || apIdx}
                        className="bg-slate-50/80 border border-slate-200 rounded-xl p-3 sm:p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                          <span className="text-xs font-bold text-slate-700">
                            สินค้าเพิ่มเติม #{apIdx + 1}
                          </span>
                          {!readonly && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAdditionalProduct(rIdx, apIdx)}
                              className="text-rose-500 hover:text-rose-700 text-xs flex items-center gap-1 font-medium transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>ลบ</span>
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-600">
                              เลือกสินค้า <span className="text-rose-500">*</span>
                            </label>
                            <ActivityProductSelect
                              products={products as any}
                              value={ap.productId}
                              onChange={(val, prod) => {
                                handleUpdateAdditionalProduct(rIdx, apIdx, "productId", val);
                                if (prod) {
                                  handleUpdateAdditionalProduct(rIdx, apIdx, "productName", prod.name);
                                  if (prod.unit) {
                                    handleUpdateAdditionalProduct(rIdx, apIdx, "unit", prod.unit);
                                  }
                                }
                              }}
                              disabled={readonly}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-600">
                              ปริมาณที่ใช้ <span className="text-rose-500">*</span>
                            </label>
                            <div className="flex gap-2">
                              <ActivityInput
                                type="number"
                                min={0}
                                step="any"
                                value={ap.quantityUsed ?? 1}
                                onChange={(e) =>
                                  handleUpdateAdditionalProduct(
                                    rIdx,
                                    apIdx,
                                    "quantityUsed",
                                    e.target.value,
                                  )
                                }
                                disabled={readonly}
                                placeholder="1"
                              />
                              <ActivityInput
                                value={ap.unit || "ขวด"}
                                onChange={(e) =>
                                  handleUpdateAdditionalProduct(rIdx, apIdx, "unit", e.target.value)
                                }
                                disabled={readonly}
                                className="w-24 shrink-0"
                                placeholder="หน่วย"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-600">
                              อัตราที่ใช้จริง
                            </label>
                            <ActivityInput
                              value={ap.actualRate || ""}
                              onChange={(e) =>
                                handleUpdateAdditionalProduct(
                                  rIdx,
                                  apIdx,
                                  "actualRate",
                                  e.target.value,
                                )
                              }
                              disabled={readonly}
                              placeholder="เช่น 20 ซีซี/น้ำ 20 ลิตร"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. วิธีการฉีดพ่น */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-semibold text-slate-700">
                  2. วิธีการฉีดพ่น <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap items-center gap-6 pt-0.5">
                  {SPRAY_METHOD_RADIO_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800"
                    >
                      <input
                        type="radio"
                        name={`spray-method-${round.id || rIdx}`}
                        value={opt.value}
                        checked={round.sprayMethod === opt.value}
                        disabled={readonly}
                        onChange={() => handleUpdateRoundField(rIdx, "sprayMethod", opt.value)}
                        className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500 accent-emerald-600"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 3. อุปกรณ์ที่ใช้ฉีดพ่น */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-slate-700">
                  3. อุปกรณ์ที่ใช้ฉีดพ่น <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-0.5">
                  {SPRAY_EQUIPMENT_RADIO_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800"
                    >
                      <input
                        type="radio"
                        name={`spray-equip-${round.id || rIdx}`}
                        value={opt.value}
                        checked={round.sprayEquipment === opt.value}
                        disabled={readonly}
                        onChange={() => handleUpdateRoundField(rIdx, "sprayEquipment", opt.value)}
                        className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500 accent-emerald-600"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>

                {round.sprayEquipment === "อื่นๆ ระบุ..." && (
                  <div className="pt-1 max-w-md">
                    <ActivityInput
                      value={round.otherEquipment || ""}
                      onChange={(e) =>
                        handleUpdateRoundField(rIdx, "otherEquipment", e.target.value)
                      }
                      placeholder="ระบุอุปกรณ์ฉีดพ่น..."
                      disabled={readonly}
                    />
                  </div>
                )}
              </div>

              {/* 4. ผลหลังการฉีดพ่นรอบนี้ */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-slate-700">
                  4. ผลหลังการฉีดพ่นรอบนี้ <span className="text-rose-500">*</span>
                </label>
                <div className="max-w-md">
                  <ActivitySelect
                    value={round.productResponse || "พืชตอบสนองดี (เห็นผลตามเป้าหมาย)"}
                    onChange={(val) => handleUpdateRoundField(rIdx, "productResponse", val)}
                    options={SPRAY_RESPONSE_OPTIONS.map((r) => ({
                      value: r.value,
                      label: r.label,
                    }))}
                    disabled={readonly}
                  />
                </div>

                {round.productResponse === "พบปัญหา / พืชมีอาการผิดปกติ" && (
                  <div className="pt-1">
                    <ActivityTextarea
                      value={round.problemDetail || ""}
                      onChange={(e) =>
                        handleUpdateRoundField(rIdx, "problemDetail", e.target.value)
                      }
                      placeholder="ระบุอาการผิดปกติหรือปัญหาที่พบ..."
                      rows={2}
                      disabled={readonly}
                    />
                  </div>
                )}
              </div>

              {/* 5. รูปถ่ายการฉีดพ่นรอบนี้ */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    5. รูปถ่ายการฉีดพ่นรอบนี้ (รูปการผสม / ขณะปฏิบัติงาน)
                  </label>
                  <span className="text-xs text-slate-400">
                    อัปโหลดได้สูงสุด 5 รูป ({round.roundImages?.length || 0}/5)
                  </span>
                </div>
                <ActivityPhotoUpload
                  title="อัปโหลดรูปภาพ (สูงสุด 5 รูป)"
                  description="รองรับไฟล์ jpg, jpeg, png, webp, heic, heif"
                  images={(round.roundImages as any) || []}
                  onImagesChange={(imgs) => handleUpdateRoundImages(rIdx, imgs)}
                  disabled={readonly}
                  maxFiles={5}
                />
              </div>
            </div>
          );
        })}

        {/* Fields below rounds: กำหนดฉีดพ่นครั้งถัดไป & ข้อสังเกตเพิ่มเติม */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="space-y-1 max-w-md">
            <label className="text-xs font-semibold text-slate-700">
              กำหนดฉีดพ่นครั้งถัดไป
            </label>
            <ActivityInput
              type="date"
              value={actualState.t7NextSprayDate || ""}
              onChange={(e) => onUpdateField?.("t7NextSprayDate", e.target.value)}
              placeholder="เลือกกำหนดวันฉีดพ่นครั้งถัดไป"
              disabled={readonly}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              ข้อสังเกตหรือข้อมูลเพิ่มเติม
            </label>
            <ActivityTextarea
              value={actualState.t7Notes || ""}
              onChange={(e) => onUpdateField?.("t7Notes", e.target.value)}
              placeholder="บันทึกข้อสังเกตเพิ่มเติม สภาพอากาศ หรือหมายเหตุอื่นๆ..."
              rows={3}
              disabled={readonly}
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: สถานะแปลงสาธิต                                                 */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            สถานะแปลงสาธิต
          </h3>
        </div>

        <div className="space-y-1.5 max-w-md">
          <label className="text-xs font-semibold text-slate-700">
            สถานะแปลงสาธิตการตรวจรอบนี้ <span className="text-rose-500">*</span>
          </label>
          <ActivitySelect
            value={actualState.t7PlotStatus || "IN_PROGRESS"}
            onChange={(val) => onUpdateField?.("t7PlotStatus", val)}
            options={DEMO_PLOT_STATUS_OPTIONS.map((s) => ({
              value: s.value,
              label: s.label,
            }))}
            disabled={readonly}
          />
        </div>
      </div>
    </div>
  );
}

// Backward-compatible alias
export const ActualType7FollowUp = Type7bActualForm;
