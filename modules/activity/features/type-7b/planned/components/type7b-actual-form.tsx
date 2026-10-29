"use client";

import React, { useEffect, useMemo, useCallback } from "react";
import {
  Clock,
  RotateCw,
  Plus,
  Trash2,
  Package,
  PackagePlus,
  Wrench,
  TrendingUp,
  Droplets,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ActivityInput,
  ActivityTextarea,
  ActivityPhotoUpload,
  ActivitySelect,
  ActivityProductSelect,
  ActivityDatePicker,
} from "@/modules/activity/ui";
import {
  SPRAY_EQUIPMENT_OPTIONS,
  SPRAY_RESPONSE_OPTIONS,
  DEMO_PLOT_STATUS_OPTIONS,
  EXTERNAL_FORMULA_OPTIONS,
} from "../../shared/constants";
import type {
  Type7bActualFormProps,
  Type7bSprayRoundState,
  Type7bAdditionalProductItem,
  Type7bExternalChemicalItem,
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
  onAddExternalProduct,
  onUpdateExternalProduct,
  onRemoveExternalProduct,
}: Type7bActualFormProps) {
  if (!isVisible) return null;

  const resolvedTargets = targets.length > 0 ? targets : target ? [target] : [];

  // Extract planned demo products from targets
  const targetDemoProducts = useMemo(() => {
    const list: Array<{
      productId: string;
      productName: string;
      quantity: number | string;
      unit?: string;
    }> = [];
    const t = resolvedTargets[0];
    if (t) {
      const prods =
        t.demoProducts || t.withdrawnProducts || (t as any).products || [];
      prods.forEach((p: any) => {
        const pId = p.productId || p.product?.id || p.id;
        const pName =
          p.productName || p.product?.name || p.name || "สินค้าตามแผน";
        const qty = p.quantity ?? p.targetQuantity ?? p.withdrawnQuantity ?? 1;
        const unit = p.unit || p.product?.unit || "ขวด";
        if (pId) {
          list.push({
            productId: pId,
            productName: pName,
            quantity: qty,
            unit,
          });
        }
      });
    }
    return list;
  }, [resolvedTargets]);

  // Ensure spraying rounds exist
  const rounds: Type7bSprayRoundState[] = useMemo(() => {
    if (
      Array.isArray(actualState.t7SprayingRounds) &&
      actualState.t7SprayingRounds.length > 0
    ) {
      return actualState.t7SprayingRounds;
    }
    return [
      {
        id: "round-1",
        roundNumber: 1,
        sprayDate:
          actualState.t7VisitDate || new Date().toISOString().split("T")[0],
        sprayMethod: "SINGLE",
        sprayEquipment: "เป้สะพายหลัง",
        otherEquipment: "",
        productResponse: "พืชตอบสนองดี (เห็นผลตามเป้าหมาย)",
        problemDetail: "",
        baselineProducts: targetDemoProducts.map((p) => ({
          productId: p.productId,
          productName: p.productName,
          withdrawnQuantity: p.quantity,
          plannedQuantity: p.quantity,
          actualQuantity: p.quantity,
          extraQuantity: "",
          extraUnit: p.unit?.includes("ซอง") ? "กรัม" : "ซีซี",
          applicationRate: "",
          plannedRate: "",
          actualRate: "",
          unit: p.unit,
        })),
        additionalProducts: [],
        roundImages: [],
      },
    ];
  }, [
    actualState.t7SprayingRounds,
    actualState.t7VisitDate,
    targetDemoProducts,
  ]);

  // Sync baseline products into rounds if rounds had 0 baseline products
  useEffect(() => {
    if (
      targetDemoProducts.length > 0 &&
      Array.isArray(actualState.t7SprayingRounds)
    ) {
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
                withdrawnQuantity: p.quantity,
                plannedQuantity: p.quantity,
                actualQuantity: p.quantity,
                extraQuantity: "",
                extraUnit: p.unit?.includes("ซอง") ? "กรัม" : "ซีซี",
                applicationRate: "",
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
      sprayDate:
        actualState.t7VisitDate || new Date().toISOString().split("T")[0],
      sprayMethod: "SINGLE",
      sprayEquipment: "เป้สะพายหลัง",
      otherEquipment: "",
      productResponse: "พืชตอบสนองดี (เห็นผลตามเป้าหมาย)",
      problemDetail: "",
      baselineProducts: baseProducts.map((p) => ({
        ...p,
        actualRate: "",
        applicationRate: "",
        actualQuantity: p.withdrawnQuantity || p.plannedQuantity,
        extraQuantity: "",
      })),
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
      const reindexed = filtered.map((r, idx) => ({
        ...r,
        roundNumber: idx + 1,
      }));
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
          actualQuantity: 1,
          quantityUsed: 1,
          extraQuantity: "",
          extraUnit: "ซีซี",
          applicationRate: "",
          actualRate: "",
          unit: "ขวด",
        };
        updated[rIdx] = {
          ...updated[rIdx],
          additionalProducts: [
            ...(updated[rIdx].additionalProducts || []),
            newProd,
          ],
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
        // Sync aliases
        if (field === "actualQuantity") {
          prods[pIdx].quantityUsed = value;
        } else if (field === "quantityUsed") {
          prods[pIdx].actualQuantity = value;
        } else if (field === "applicationRate") {
          prods[pIdx].actualRate = value;
        } else if (field === "actualRate") {
          prods[pIdx].applicationRate = value;
        }
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
        const prods = (updated[rIdx].additionalProducts || []).filter(
          (_, idx) => idx !== pIdx,
        );
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
        // Sync aliases
        if (field === "actualQuantity") {
          prods[pIdx].plannedQuantity = value;
        } else if (field === "applicationRate") {
          prods[pIdx].actualRate = value;
        } else if (field === "actualRate") {
          prods[pIdx].applicationRate = value;
        }
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

  const handleAddExternalProduct = useCallback(
    (rIdx: number) => {
      if (onAddExternalProduct) {
        onAddExternalProduct(rIdx);
        return;
      }
      const updated = [...rounds];
      if (updated[rIdx]) {
        const newExt: Type7bExternalChemicalItem = {
          id: `ext-prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          company: "",
          productName: "",
          activeIngredient: "",
          formula: "SL",
          customFormula: "",
          applicationRate: "",
        };
        updated[rIdx] = {
          ...updated[rIdx],
          externalProducts: [...(updated[rIdx].externalProducts || []), newExt],
        };
        onUpdateField?.("t7SprayingRounds", updated);
      }
    },
    [onAddExternalProduct, rounds, onUpdateField],
  );

  const handleUpdateExternalProduct = useCallback(
    (rIdx: number, extIdx: number, field: string, value: any) => {
      if (onUpdateExternalProduct) {
        onUpdateExternalProduct(rIdx, extIdx, field, value);
        return;
      }
      const updated = [...rounds];
      if (updated[rIdx] && updated[rIdx].externalProducts?.[extIdx]) {
        const exts = [...(updated[rIdx].externalProducts || [])];
        exts[extIdx] = { ...exts[extIdx], [field]: value };
        updated[rIdx] = { ...updated[rIdx], externalProducts: exts };
        onUpdateField?.("t7SprayingRounds", updated);
      }
    },
    [onUpdateExternalProduct, rounds, onUpdateField],
  );

  const handleRemoveExternalProduct = useCallback(
    (rIdx: number, extIdx: number) => {
      if (onRemoveExternalProduct) {
        onRemoveExternalProduct(rIdx, extIdx);
        return;
      }
      const updated = [...rounds];
      if (updated[rIdx]) {
        const exts = (updated[rIdx].externalProducts || []).filter(
          (_, idx) => idx !== extIdx,
        );
        updated[rIdx] = { ...updated[rIdx], externalProducts: exts };
        onUpdateField?.("t7SprayingRounds", updated);
      }
    },
    [onRemoveExternalProduct, rounds, onUpdateField],
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
          <div>
            <ActivityDatePicker
              label="วันที่ติดตามจริง"
              value={actualState.t7VisitDate || ""}
              onChange={(val) => onUpdateField?.("t7VisitDate", val)}
              placeholder="เลือกวันที่ติดตามจริง..."
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

              {/* ================================================================= */}
              {/* 1.1 รายการสินค้าตามแผนงาน (Planned Baseline Products)              */}
              {/* รูปแบบตามหน้า Type 7A                                           */}
              {/* ================================================================= */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                      1.1 สินค้าที่เบิกตามแผน (Planned Demo Products)
                    </h4>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-semibold px-2 py-0.2"
                  >
                    {baselineProds.length} รายการ
                  </Badge>
                </div>

                {baselineProds.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2 text-center bg-slate-50 rounded-xl">
                    ไม่มีรายการสินค้าตัวอย่างที่ขอเบิกไว้ในแผนงาน
                  </p>
                ) : (
                  <div className="space-y-3">
                    {baselineProds.map((prod, idx) => (
                      <div
                        key={prod.productId || idx}
                        className="bg-emerald-50/40 border border-emerald-150 rounded-xl p-3.5 sm:p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {idx + 1}. {prod.productName || "สินค้าตัวอย่าง"}
                          </span>
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-md">
                            จำนวนที่เบิก:{" "}
                            {prod.withdrawnQuantity ||
                              prod.plannedQuantity ||
                              1}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">
                              จำนวนที่ใช้จริง (ขวด){" "}
                              <span className="text-rose-500">*</span>
                            </label>
                            <ActivityInput
                              type="number"
                              min="0"
                              value={
                                prod.actualQuantity != null
                                  ? String(prod.actualQuantity)
                                  : ""
                              }
                              onChange={(e) =>
                                handleUpdateBaselineProduct(
                                  rIdx,
                                  idx,
                                  "actualQuantity",
                                  e.target.value,
                                )
                              }
                              disabled={readonly}
                              placeholder="เช่น 1"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">
                              ปริมาณที่ใช้เพิ่ม (กรณีใช้ไปครึ่งขวด)
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <ActivityInput
                                type="number"
                                min="0"
                                value={
                                  prod.extraQuantity != null
                                    ? String(prod.extraQuantity)
                                    : ""
                                }
                                onChange={(e) =>
                                  handleUpdateBaselineProduct(
                                    rIdx,
                                    idx,
                                    "extraQuantity",
                                    e.target.value,
                                  )
                                }
                                disabled={readonly}
                                placeholder="เช่น 250"
                              />
                              <ActivitySelect
                                value={prod.extraUnit || "ซีซี"}
                                onChange={(val) =>
                                  handleUpdateBaselineProduct(
                                    rIdx,
                                    idx,
                                    "extraUnit",
                                    val,
                                  )
                                }
                                options={[
                                  { value: "ซีซี", label: "ซีซี (ขวด)" },
                                  { value: "กรัม", label: "กรัม (ซอง)" },
                                ]}
                                disabled={readonly}
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">
                              อัตราการใช้{" "}
                              <span className="text-rose-500">*</span>
                            </label>
                            <ActivityInput
                              value={
                                prod.applicationRate || prod.actualRate || ""
                              }
                              onChange={(e) =>
                                handleUpdateBaselineProduct(
                                  rIdx,
                                  idx,
                                  "applicationRate",
                                  e.target.value,
                                )
                              }
                              disabled={readonly}
                              placeholder="เช่น 20 ซีซี / น้ำ 20 ลิตร"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ================================================================= */}
              {/* 1.2 สินค้าเพิ่มเติมในการปฏิบัติงาน (Additional Products)            */}
              {/* รูปแบบตามหน้า Type 7A                                           */}
              {/* ================================================================= */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <PackagePlus className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                      1.2 สินค้าเพิ่มเติมในการปฏิบัติงาน
                      (กรณีไม่ได้ใช้ยาที่เบิกไป)
                    </h4>
                  </div>

                  {!readonly && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddAdditionalProduct(rIdx)}
                      className="h-8 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      เพิ่มสินค้า
                    </Button>
                  )}
                </div>

                {additionalProds.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2 text-center bg-slate-50 rounded-xl">
                    ยังไม่มีสินค้าเพิ่มเติมหน้างาน กดปุ่ม &quot;+
                    เพิ่มสินค้า&quot; หากมีการใช้ยาตัวอื่น
                  </p>
                ) : (
                  <div className="space-y-3">
                    {additionalProds.map((prod, idx) => (
                      <div
                        key={prod.id || idx}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">
                            สินค้าเพิ่มเติมลำดับที่ {idx + 1}
                          </span>
                          {!readonly && (
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveAdditionalProduct(rIdx, idx)
                              }
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                              title="ลบรายการ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="space-y-2">
                          <ActivityProductSelect
                            id={`round-${round.id || rIdx}-additional-prod-${idx}`}
                            label="เลือกสินค้าจากระบบ"
                            value={prod.productId}
                            valueKey="id"
                            products={products as any}
                            onChange={(val, selected) => {
                              const resolvedId = selected?.id || val;
                              const resolvedName =
                                selected?.name || prod.productName || "";
                              handleUpdateAdditionalProduct(
                                rIdx,
                                idx,
                                "productId",
                                resolvedId,
                              );
                              handleUpdateAdditionalProduct(
                                rIdx,
                                idx,
                                "productName",
                                resolvedName,
                              );
                              if (selected?.unit) {
                                const defaultExtra = selected.unit.includes(
                                  "ซอง",
                                )
                                  ? "กรัม"
                                  : "ซีซี";
                                handleUpdateAdditionalProduct(
                                  rIdx,
                                  idx,
                                  "extraUnit",
                                  defaultExtra,
                                );
                              }
                            }}
                            disabled={readonly}
                            placeholder="ค้นหาและเลือกสินค้า..."
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">
                              จำนวนที่ใช้จริง (ขวด){" "}
                              <span className="text-rose-500">*</span>
                            </label>
                            <ActivityInput
                              type="number"
                              min="0"
                              value={
                                prod.actualQuantity != null
                                  ? String(prod.actualQuantity)
                                  : prod.quantityUsed != null
                                    ? String(prod.quantityUsed)
                                    : ""
                              }
                              onChange={(e) => {
                                handleUpdateAdditionalProduct(
                                  rIdx,
                                  idx,
                                  "actualQuantity",
                                  e.target.value,
                                );
                                handleUpdateAdditionalProduct(
                                  rIdx,
                                  idx,
                                  "quantityUsed",
                                  e.target.value,
                                );
                              }}
                              disabled={readonly}
                              placeholder="เช่น 1"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">
                              ปริมาณที่ใช้เพิ่ม (กรณีใช้ไปครึ่งขวด)
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <ActivityInput
                                type="number"
                                min="0"
                                value={
                                  prod.extraQuantity != null
                                    ? String(prod.extraQuantity)
                                    : ""
                                }
                                onChange={(e) =>
                                  handleUpdateAdditionalProduct(
                                    rIdx,
                                    idx,
                                    "extraQuantity",
                                    e.target.value,
                                  )
                                }
                                disabled={readonly}
                                placeholder="เช่น 250"
                              />
                              <ActivitySelect
                                value={prod.extraUnit || "ซีซี"}
                                onChange={(val) =>
                                  handleUpdateAdditionalProduct(
                                    rIdx,
                                    idx,
                                    "extraUnit",
                                    val,
                                  )
                                }
                                options={[
                                  { value: "ซีซี", label: "ซีซี (ขวด)" },
                                  { value: "กรัม", label: "กรัม (ซอง)" },
                                ]}
                                disabled={readonly}
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">
                              อัตราการใช้{" "}
                              <span className="text-rose-500">*</span>
                            </label>
                            <ActivityInput
                              value={
                                prod.applicationRate || prod.actualRate || ""
                              }
                              onChange={(e) => {
                                handleUpdateAdditionalProduct(
                                  rIdx,
                                  idx,
                                  "applicationRate",
                                  e.target.value,
                                );
                                handleUpdateAdditionalProduct(
                                  rIdx,
                                  idx,
                                  "actualRate",
                                  e.target.value,
                                );
                              }}
                              disabled={readonly}
                              placeholder="เช่น 20 ซีซี / น้ำ 20 ลิตร"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ================================================================= */}
              {/* 2. วิธีการฉีดพ่น (Single vs Tank-mixed)                             */}
              {/* รูปแบบ 2-button toggle ตามหน้า Type 7A                            */}
              {/* ================================================================= */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">
                    วิธีการฉีดพ่น <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3 max-w-md">
                    <button
                      type="button"
                      disabled={readonly}
                      onClick={() =>
                        handleUpdateRoundField(rIdx, "sprayMethod", "SINGLE")
                      }
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        round.sprayMethod !== "TANK_MIXED"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      ฉีดเดี่ยว (Single)
                    </button>
                    <button
                      type="button"
                      disabled={readonly}
                      onClick={() =>
                        handleUpdateRoundField(
                          rIdx,
                          "sprayMethod",
                          "TANK_MIXED",
                        )
                      }
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        round.sprayMethod === "TANK_MIXED"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      ผสมถัง (Tank-mixed)
                    </button>
                  </div>
                </div>

                {/* Checkbox มียาใช้ภายนอก (แสดงเฉพาะเมื่อเลือก Tank-mixed ตามแบบ Type 7A) */}
                {round.sprayMethod === "TANK_MIXED" && (
                  <div className="pt-2 border-t border-slate-200/60 space-y-3">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={Boolean(round.hasExternalChemicals)}
                        onChange={(e) =>
                          handleUpdateRoundField(
                            rIdx,
                            "hasExternalChemicals",
                            e.target.checked,
                          )
                        }
                        disabled={readonly}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-medium text-slate-800">
                        มียาใช้ภายนอก (ไม่บังคับ)
                      </span>
                    </label>

                    {/* รายการยาภายนอกที่ใช้ร่วม */}
                    {round.hasExternalChemicals && (
                      <div className="space-y-3 bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Droplets className="w-3.5 h-3.5 text-emerald-600" />
                            รายการยาภายนอกที่ใช้ร่วม
                          </h5>
                          {!readonly && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddExternalProduct(rIdx)}
                              className="h-7 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              เพิ่มยาภายนอก
                            </Button>
                          )}
                        </div>

                        {!round.externalProducts ||
                        round.externalProducts.length === 0 ? (
                          <p className="text-xs text-slate-400 italic py-2 text-center bg-slate-50 rounded-lg">
                            ยังไม่มีรายการยาภายนอก กดปุ่ม &quot;+
                            เพิ่มยาภายนอก&quot; เพื่อระบุ
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {round.externalProducts.map((ext, extIdx) => (
                              <div
                                key={ext.id || extIdx}
                                className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-emerald-800">
                                    ยาภายนอกลำดับที่ {extIdx + 1}
                                  </span>
                                  {!readonly && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRemoveExternalProduct(
                                          rIdx,
                                          extIdx,
                                        )
                                      }
                                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                                      title="ลบรายการ"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                  <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-600">
                                      บริษัท
                                    </label>
                                    <ActivityInput
                                      value={ext.company || ""}
                                      onChange={(e) =>
                                        handleUpdateExternalProduct(
                                          rIdx,
                                          extIdx,
                                          "company",
                                          e.target.value,
                                        )
                                      }
                                      disabled={readonly}
                                      placeholder="ระบุบริษัท..."
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-600">
                                      ชื่อสินค้า{" "}
                                      <span className="text-rose-500">*</span>
                                    </label>
                                    <ActivityInput
                                      value={ext.productName || ""}
                                      onChange={(e) =>
                                        handleUpdateExternalProduct(
                                          rIdx,
                                          extIdx,
                                          "productName",
                                          e.target.value,
                                        )
                                      }
                                      disabled={readonly}
                                      placeholder="ระบุชื่อสินค้า..."
                                      required
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-600">
                                      สารออกฤทธิ์
                                    </label>
                                    <ActivityInput
                                      value={ext.activeIngredient || ""}
                                      onChange={(e) =>
                                        handleUpdateExternalProduct(
                                          rIdx,
                                          extIdx,
                                          "activeIngredient",
                                          e.target.value,
                                        )
                                      }
                                      disabled={readonly}
                                      placeholder="ระบุสารออกฤทธิ์..."
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <ActivitySelect
                                      label="สูตร"
                                      labelClassName="text-[11px] font-medium text-slate-600 mb-0"
                                      value={ext.formula || "SL"}
                                      onChange={(val) =>
                                        handleUpdateExternalProduct(
                                          rIdx,
                                          extIdx,
                                          "formula",
                                          val,
                                        )
                                      }
                                      options={EXTERNAL_FORMULA_OPTIONS}
                                      disabled={readonly}
                                    />
                                  </div>

                                  {ext.formula === "อื่นๆ" && (
                                    <div className="space-y-1">
                                      <label className="text-[11px] font-medium text-slate-600">
                                        ระบุสูตรเพิ่มเติม{" "}
                                        <span className="text-rose-500">*</span>
                                      </label>
                                      <ActivityInput
                                        value={ext.customFormula || ""}
                                        onChange={(e) =>
                                          handleUpdateExternalProduct(
                                            rIdx,
                                            extIdx,
                                            "customFormula",
                                            e.target.value,
                                          )
                                        }
                                        disabled={readonly}
                                        placeholder="ระบุสูตร..."
                                        required
                                      />
                                    </div>
                                  )}

                                  <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-600">
                                      อัตราการใช้{" "}
                                      <span className="text-rose-500">*</span>
                                    </label>
                                    <ActivityInput
                                      value={ext.applicationRate || ""}
                                      onChange={(e) =>
                                        handleUpdateExternalProduct(
                                          rIdx,
                                          extIdx,
                                          "applicationRate",
                                          e.target.value,
                                        )
                                      }
                                      disabled={readonly}
                                      placeholder="เช่น 20 ซีซี / น้ำ 20 ลิตร"
                                      required
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ================================================================= */}
              {/* 3. อุปกรณ์ที่ใช้ฉีดพ่น (Spray Equipment)                            */}
              {/* รูปแบบ ActivitySelect Dropdown ตามหน้า Type 7A                    */}
              {/* ================================================================= */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Wrench className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                    3. อุปกรณ์ที่ใช้ฉีดพ่น (Spray Equipment)
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <ActivitySelect
                    label="เลือกอุปกรณ์ที่ใช้ฉีดพ่น"
                    value={round.sprayEquipment || "เป้สะพายหลัง"}
                    onChange={(val) =>
                      handleUpdateRoundField(rIdx, "sprayEquipment", val)
                    }
                    options={SPRAY_EQUIPMENT_OPTIONS.map((equip) => ({
                      value: equip,
                      label: equip,
                    }))}
                    disabled={readonly}
                  />

                  {(round.sprayEquipment === "อื่นๆ (ระบุ)" ||
                    round.sprayEquipment === "อื่นๆ ระบุ...") && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        ระบุอุปกรณ์เพิ่มเติม{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <ActivityInput
                        value={round.otherEquipment || ""}
                        onChange={(e) =>
                          handleUpdateRoundField(
                            rIdx,
                            "otherEquipment",
                            e.target.value,
                          )
                        }
                        placeholder="พิมพ์ระบุอุปกรณ์ฉีดพ่น..."
                        disabled={readonly}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 4. ผลหลังการฉีดพ่นรอบนี้ */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="text-xs font-semibold text-slate-700">
                  4. ผลหลังการฉีดพ่นรอบนี้{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="max-w-md">
                  <ActivitySelect
                    value={
                      round.productResponse ||
                      "พืชตอบสนองดี (เห็นผลตามเป้าหมาย)"
                    }
                    onChange={(val) =>
                      handleUpdateRoundField(rIdx, "productResponse", val)
                    }
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
                        handleUpdateRoundField(
                          rIdx,
                          "problemDetail",
                          e.target.value,
                        )
                      }
                      placeholder="ระบุอาการผิดปกติหรือปัญหาที่พบ..."
                      rows={2}
                      disabled={readonly}
                    />
                  </div>
                )}
              </div>

              {/* 5. รูปถ่ายการฉีดพ่นรอบนี้ */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
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
          <div className="max-w-md">
            <ActivityDatePicker
              label="กำหนดฉีดพ่นครั้งถัดไป"
              value={actualState.t7NextSprayDate || ""}
              onChange={(val) => onUpdateField?.("t7NextSprayDate", val)}
              placeholder="เลือกกำหนดวันฉีดพ่นครั้งถัดไป..."
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
