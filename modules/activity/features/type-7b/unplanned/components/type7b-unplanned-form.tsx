"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Trash2,
  Clock,
  RotateCw,
  Package,
  Droplets,
  Wrench,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ActivityInput,
  ActivityTextarea,
  ActivityCombobox,
  ActivitySelect,
  ActivityProductSelect,
  ActivityPhotoUpload,
  ActivityDatePicker,
} from "@/modules/activity/ui";
import { getFollowUpPlansAction } from "@/modules/activity/server/actions";
import { listProductsAction } from "@/modules/products/server/actions";
import {
  SPRAY_EQUIPMENT_OPTIONS,
  SPRAY_RESPONSE_OPTIONS,
  DEMO_PLOT_STATUS_OPTIONS,
  EXTERNAL_FORMULA_OPTIONS,
  COMMERCIAL_POTENTIALS,
  SATISFACTION_SCORES,
} from "../../shared/constants";
import type {
  Type7bUnplannedFormProps,
  Type7bSprayRoundState,
  Type7bAdditionalProductItem,
  Type7bExternalChemicalItem,
} from "../types/unplanned.types";

export function Type7bUnplannedForm({
  readonly = false,
  items = [],
  plotList = [],
  followUpPlans = [],
  products = [],
  addItem,
  updateItem,
  deleteItem,
  onAddRound,
  onRemoveRound,
  onUpdateRoundField,
  onAddProduct,
  onUpdateProduct,
  onRemoveProduct,
  onAddAdditionalProduct,
  onUpdateAdditionalProduct,
  onRemoveAdditionalProduct,
  onAddExternalProduct,
  onUpdateExternalProduct,
  onRemoveExternalProduct,
  onUpdateRoundImages,
}: Type7bUnplannedFormProps) {
  // Load Follow-up plans if not supplied
  const [dbPlans, setDbPlans] = useState<any[]>([]);
  useEffect(() => {
    let isMounted = true;
    if (followUpPlans.length === 0) {
      getFollowUpPlansAction()
        .then((res) => {
          if (
            isMounted &&
            res?.success &&
            res.followUpPlans &&
            res.followUpPlans.length > 0
          ) {
            setDbPlans(res.followUpPlans);
          }
        })
        .catch((err) => {
          console.error(
            "Failed to load follow-up plans in Type7bUnplannedForm:",
            err,
          );
        });
    }
    return () => {
      isMounted = false;
    };
  }, [followUpPlans.length]);

  // Load products catalog if not supplied
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  useEffect(() => {
    let isMounted = true;
    if (products.length === 0) {
      listProductsAction({ status: "ACTIVE", perPage: 1000 })
        .then((res) => {
          if (isMounted && res?.products && res.products.length > 0) {
            setDbProducts(res.products);
          }
        })
        .catch((err) => {
          console.error("Failed to load products in Type7bUnplannedForm:", err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [products.length]);

  const effectiveProducts = useMemo(() => {
    return products.length > 0 ? products : dbProducts;
  }, [products, dbProducts]);

  const effectivePlans = followUpPlans.length > 0 ? followUpPlans : dbPlans;

  // Plan options from followUpPlans or dbPlans (Only plans, no demo plot items)
  const existingPlanOptions = useMemo(() => {
    const list: Array<{
      value: string;
      label: string;
      subLabel?: string;
      plan: any;
    }> = [];
    const seen = new Set<string>();

    for (const plan of effectivePlans) {
      if (plan.planId && !seen.has(plan.planId)) {
        seen.add(plan.planId);
        const uniquePlots = plan.plots || [];
        const plotsSummary = uniquePlots
          .map(
            (p: any) =>
              `${p.name || "แปลงสาธิต"}${p.ownerName ? ` (${p.ownerName})` : ""}`,
          )
          .join(", ");
        list.push({
          value: plan.planId,
          label: `${plan.planCode ? `[${plan.planCode}] ` : ""}${plan.planTitle || "แผนงาน"}${plan.planDate ? ` (${plan.planDate})` : ""}`,
          subLabel:
            uniquePlots.length > 0
              ? `${uniquePlots.length} แปลงสาธิต: ${plotsSummary}`
              : undefined,
          plan,
        });
      }
    }

    return list;
  }, [effectivePlans]);

  // =========================================================================
  // Round Action Handlers (fallback to updateItem if prop callbacks not provided)
  // =========================================================================

  const handleAddRound = useCallback(
    (itemId: string) => {
      if (onAddRound) {
        onAddRound(itemId);
        return;
      }
      const item = items.find((i) => i.id === itemId);
      if (!item) return;
      const currentRounds = item.sprayingRounds || [];
      const newRoundNumber = currentRounds.length + 1;
      const newRound: Type7bSprayRoundState = {
        id: `round-${Date.now()}-${newRoundNumber}`,
        roundNumber: newRoundNumber,
        sprayDate: item.visitDate || new Date().toISOString().split("T")[0],
        sprayMethod: "SINGLE",
        sprayEquipment: "เป้สะพายหลัง",
        otherEquipment: "",
        productResponse: "พืชตอบสนองดี (เห็นผลตามเป้าหมาย)",
        problemDetail: "",
        baselineProducts: [],
        additionalProducts: [],
        roundImages: [],
      };
      updateItem(itemId, "sprayingRounds", [...currentRounds, newRound]);
    },
    [onAddRound, items, updateItem],
  );

  const handleRemoveRound = useCallback(
    (itemId: string, rIdx: number) => {
      if (onRemoveRound) {
        onRemoveRound(itemId, rIdx);
        return;
      }
      const item = items.find((i) => i.id === itemId);
      if (!item) return;
      const currentRounds = item.sprayingRounds || [];
      if (currentRounds.length <= 1) return;
      const filtered = currentRounds.filter((_, idx) => idx !== rIdx);
      const reindexed = filtered.map((r, idx) => ({
        ...r,
        roundNumber: idx + 1,
      }));
      updateItem(itemId, "sprayingRounds", reindexed);
    },
    [onRemoveRound, items, updateItem],
  );

  const handleUpdateRoundField = useCallback(
    (itemId: string, rIdx: number, field: string, value: any) => {
      if (onUpdateRoundField) {
        onUpdateRoundField(itemId, rIdx, field, value);
        return;
      }
      const item = items.find((i) => i.id === itemId);
      if (!item) return;
      const rounds = [...(item.sprayingRounds || [])];
      if (rounds[rIdx]) {
        rounds[rIdx] = { ...rounds[rIdx], [field]: value };
        updateItem(itemId, "sprayingRounds", rounds);
      }
    },
    [onUpdateRoundField, items, updateItem],
  );

  // Products used in round
  const handleAddProduct = useCallback(
    (itemId: string, rIdx: number) => {
      const handler = onAddProduct || onAddAdditionalProduct;
      if (handler) {
        handler(itemId, rIdx);
        return;
      }
      const item = items.find((i) => i.id === itemId);
      if (!item) return;
      const rounds = [...(item.sprayingRounds || [])];
      if (rounds[rIdx]) {
        const newProd: Type7bAdditionalProductItem = {
          id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
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
        rounds[rIdx] = {
          ...rounds[rIdx],
          additionalProducts: [
            ...(rounds[rIdx].additionalProducts || []),
            newProd,
          ],
        };
        updateItem(itemId, "sprayingRounds", rounds);
      }
    },
    [onAddProduct, onAddAdditionalProduct, items, updateItem],
  );

  const handleUpdateProduct = useCallback(
    (itemId: string, rIdx: number, pIdx: number, field: string, value: any) => {
      const handler = onUpdateProduct || onUpdateAdditionalProduct;
      if (handler) {
        handler(itemId, rIdx, pIdx, field, value);
        return;
      }
      const item = items.find((i) => i.id === itemId);
      if (!item) return;
      const rounds = [...(item.sprayingRounds || [])];
      if (rounds[rIdx]?.additionalProducts?.[pIdx]) {
        const prods = [...rounds[rIdx].additionalProducts];
        prods[pIdx] = { ...prods[pIdx], [field]: value };
        if (field === "actualQuantity") {
          prods[pIdx].quantityUsed = value;
        } else if (field === "quantityUsed") {
          prods[pIdx].actualQuantity = value;
        } else if (field === "applicationRate") {
          prods[pIdx].actualRate = value;
        } else if (field === "actualRate") {
          prods[pIdx].applicationRate = value;
        }
        rounds[rIdx] = { ...rounds[rIdx], additionalProducts: prods };
        updateItem(itemId, "sprayingRounds", rounds);
      }
    },
    [onUpdateProduct, onUpdateAdditionalProduct, items, updateItem],
  );

  const handleRemoveProduct = useCallback(
    (itemId: string, rIdx: number, pIdx: number) => {
      const handler = onRemoveProduct || onRemoveAdditionalProduct;
      if (handler) {
        handler(itemId, rIdx, pIdx);
        return;
      }
      const item = items.find((i) => i.id === itemId);
      if (!item) return;
      const rounds = [...(item.sprayingRounds || [])];
      if (rounds[rIdx]) {
        const prods = (rounds[rIdx].additionalProducts || []).filter(
          (_, idx) => idx !== pIdx,
        );
        rounds[rIdx] = { ...rounds[rIdx], additionalProducts: prods };
        updateItem(itemId, "sprayingRounds", rounds);
      }
    },
    [onRemoveProduct, onRemoveAdditionalProduct, items, updateItem],
  );

  const handleAddExternalProduct = useCallback(
    (itemId: string, rIdx: number) => {
      if (onAddExternalProduct) {
        onAddExternalProduct(itemId, rIdx);
        return;
      }
      const item = items.find((i) => i.id === itemId);
      if (!item) return;
      const rounds = [...(item.sprayingRounds || [])];
      if (rounds[rIdx]) {
        const newExt: Type7bExternalChemicalItem = {
          id: `ext-prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          company: "",
          productName: "",
          activeIngredient: "",
          formula: "SL",
          customFormula: "",
          applicationRate: "",
        };
        rounds[rIdx] = {
          ...rounds[rIdx],
          externalProducts: [...(rounds[rIdx].externalProducts || []), newExt],
        };
        updateItem(itemId, "sprayingRounds", rounds);
      }
    },
    [onAddExternalProduct, items, updateItem],
  );

  const handleUpdateExternalProduct = useCallback(
    (
      itemId: string,
      rIdx: number,
      extIdx: number,
      field: string,
      value: any,
    ) => {
      if (onUpdateExternalProduct) {
        onUpdateExternalProduct(itemId, rIdx, extIdx, field, value);
        return;
      }
      const item = items.find((i) => i.id === itemId);
      if (!item) return;
      const rounds = [...(item.sprayingRounds || [])];
      if (rounds[rIdx]?.externalProducts?.[extIdx]) {
        const exts = [...(rounds[rIdx].externalProducts || [])];
        exts[extIdx] = { ...exts[extIdx], [field]: value };
        rounds[rIdx] = { ...rounds[rIdx], externalProducts: exts };
        updateItem(itemId, "sprayingRounds", rounds);
      }
    },
    [onUpdateExternalProduct, items, updateItem],
  );

  const handleRemoveExternalProduct = useCallback(
    (itemId: string, rIdx: number, extIdx: number) => {
      if (onRemoveExternalProduct) {
        onRemoveExternalProduct(itemId, rIdx, extIdx);
        return;
      }
      const item = items.find((i) => i.id === itemId);
      if (!item) return;
      const rounds = [...(item.sprayingRounds || [])];
      if (rounds[rIdx]) {
        const exts = (rounds[rIdx].externalProducts || []).filter(
          (_, idx) => idx !== extIdx,
        );
        rounds[rIdx] = { ...rounds[rIdx], externalProducts: exts };
        updateItem(itemId, "sprayingRounds", rounds);
      }
    },
    [onRemoveExternalProduct, items, updateItem],
  );

  const handleUpdateRoundImages = useCallback(
    (itemId: string, rIdx: number, images: any[]) => {
      if (onUpdateRoundImages) {
        onUpdateRoundImages(itemId, rIdx, images);
        return;
      }
      const item = items.find((i) => i.id === itemId);
      if (!item) return;
      const rounds = [...(item.sprayingRounds || [])];
      if (rounds[rIdx]) {
        rounds[rIdx] = { ...rounds[rIdx], roundImages: images };
        updateItem(itemId, "sprayingRounds", rounds);
      }
    },
    [onUpdateRoundImages, items, updateItem],
  );

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 md:p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <Search className="h-4 w-4 text-emerald-600" />
          <span>ติดตามแปลงสาธิต (นอกแผน)</span>
        </div>

        {/* ปิดไว้ก่อนเดียวมาเปิดเอง */}
        {/* {!readonly && addItem && (
          <Button
            type="button"
            size="sm"
            onClick={addItem}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            เพิ่มแปลงติดตาม
          </Button>
        )} */}
      </div>

      {/* Items List */}
      <div className="space-y-6">
        {items.map((item, index) => {
          const isClosing =
            item.plotStatus === "COMPLETED" ||
            item.plotStatus === "CANCELLED" ||
            item.plotStatus === "FAILED";

          const rounds: Type7bSprayRoundState[] =
            Array.isArray(item.sprayingRounds) && item.sprayingRounds.length > 0
              ? item.sprayingRounds
              : [
                  {
                    id: "round-1",
                    roundNumber: 1,
                    sprayDate:
                      item.visitDate || new Date().toISOString().split("T")[0],
                    sprayMethod: "SINGLE",
                    sprayEquipment: "เป้สะพายหลัง",
                    otherEquipment: "",
                    productResponse: "พืชตอบสนองดี (เห็นผลตามเป้าหมาย)",
                    problemDetail: "",
                    baselineProducts: [],
                    additionalProducts: [],
                    roundImages: [],
                  },
                ];

          const selectedPlanId =
            item.sourceActivityPlanId ||
            (item.demoPlotId
              ? effectivePlans.find((p) =>
                  (p.plots || []).some((pl: any) => pl.id === item.demoPlotId),
                )?.planId
              : "") ||
            "";

          const itemPlanOptions =
            selectedPlanId &&
            !existingPlanOptions.some((opt) => opt.value === selectedPlanId)
              ? [
                  {
                    value: selectedPlanId,
                    label: `แผนงานต้นทาง (${item.plotName || selectedPlanId})`,
                    subLabel: item.farmerName
                      ? `เกษตรกร: ${item.farmerName}`
                      : undefined,
                    plan: {
                      planId: selectedPlanId,
                      planTitle: item.plotName || "แผนงานต้นทาง",
                      plots: item.demoPlotId
                        ? [
                            {
                              id: item.demoPlotId,
                              name: item.plotName,
                              cropName: item.cropName,
                              cropCategory: item.cropCategory,
                              ownerName: item.farmerName,
                              province: item.province,
                              district: item.district,
                              areaRai: item.areaRai,
                              treeCount: item.treeCount,
                              dealerName: item.dealerName,
                            },
                          ]
                        : [],
                    },
                  },
                  ...existingPlanOptions,
                ]
              : existingPlanOptions;

          return (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-6"
            >
              {/* Plot Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-sm sm:text-base font-bold text-slate-900">
                    แปลงสาธิตที่ติดตาม (
                    {item.plotName || `แปลงที่ ${index + 1}`})
                  </span>
                </div>

                {!readonly && items.length > 1 && deleteItem && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteItem(item.id)}
                    className="h-7 px-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 text-xs cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    ลบแปลง
                  </Button>
                )}
              </div>

              {/* ------------------------------------------------------------- */}
              {/* Plot Selection / Information                                  */}
              {/* ------------------------------------------------------------- */}
              <div className="space-y-3.5 bg-slate-50/70 p-3.5 sm:p-4 rounded-xl border border-slate-200/80">
                {(itemPlanOptions.length > 0 || !readonly) && (
                  <ActivityCombobox
                    label="เลือกแปลงสาธิตที่มีอยู่ในระบบ"
                    labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                    value={selectedPlanId}
                    onChange={(val) => {
                      updateItem(item.id, "sourceActivityPlanId", val || null);
                      if (!val) {
                        updateItem(item.id, "demoPlotId", null);
                        return;
                      }
                      const matched = itemPlanOptions.find(
                        (opt) => opt.value === val,
                      );
                      if (matched && matched.plan) {
                        const pl = matched.plan.plots?.[0];
                        if (pl) {
                          updateItem(item.id, "demoPlotId", pl.id);
                          updateItem(item.id, "plotName", pl.name || "");
                          updateItem(item.id, "farmerName", pl.ownerName || "");
                          updateItem(item.id, "cropName", pl.cropName || "");
                          updateItem(
                            item.id,
                            "cropCategory",
                            pl.cropCategory || "",
                          );
                          updateItem(item.id, "province", pl.province || "");
                          updateItem(item.id, "district", pl.district || "");
                          if (pl.areaRai != null) {
                            updateItem(item.id, "areaRai", pl.areaRai);
                          }
                          if (pl.treeCount != null) {
                            updateItem(item.id, "treeCount", pl.treeCount);
                          }
                          if (pl.dealerName) {
                            updateItem(item.id, "dealerName", pl.dealerName);
                          }
                        } else if (!item.plotName) {
                          updateItem(
                            item.id,
                            "plotName",
                            matched.plan.planTitle || "",
                          );
                        }
                      }
                    }}
                    options={itemPlanOptions}
                    placeholder="เลือกแผนงานแปลงสาธิต หรือระบุข้อมูลด้านล่าง..."
                    searchPlaceholder="ค้นหาแผนงาน..."
                    emptyText="ไม่พบแผนงานแปลงสาธิต"
                    disabled={readonly}
                  />
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      ชื่อแปลงสาธิต <span className="text-rose-500">*</span>
                    </label>
                    <ActivityInput
                      value={item.plotName || ""}
                      onChange={(e) =>
                        updateItem(item.id, "plotName", e.target.value)
                      }
                      disabled={readonly}
                      placeholder="ระบุชื่อแปลงสาธิต..."
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      ชื่อเจ้าของแปลง (เกษตรกร){" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <ActivityInput
                      value={item.farmerName || ""}
                      onChange={(e) =>
                        updateItem(item.id, "farmerName", e.target.value)
                      }
                      disabled={readonly}
                      placeholder="ระบุชื่อเกษตรกร..."
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      พืชเป้าหมาย <span className="text-rose-500">*</span>
                    </label>
                    <ActivityInput
                      value={item.cropName || ""}
                      onChange={(e) =>
                        updateItem(item.id, "cropName", e.target.value)
                      }
                      disabled={readonly}
                      placeholder="เช่น ข้าว, ทุเรียน..."
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      พื้นที่ (ไร่)
                    </label>
                    <ActivityInput
                      type="number"
                      value={item.areaRai != null ? String(item.areaRai) : ""}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          "areaRai",
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                      disabled={readonly}
                      placeholder="ระบุขนาดไร่..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      จังหวัด / อำเภอ
                    </label>
                    <ActivityInput
                      value={[item.province, item.district]
                        .filter(Boolean)
                        .join(" / ")}
                      onChange={(e) =>
                        updateItem(item.id, "province", e.target.value)
                      }
                      disabled={readonly}
                      placeholder="ระบุจังหวัด/อำเภอ..."
                    />
                  </div>
                </div>
              </div>

              {/* ============================================================= */}
              {/* SECTION 1: ข้อมูลการติดตามแปลง (Tracking Details)              */}
              {/* ============================================================= */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      ส่วนที่ 1: ข้อมูลการติดตามแปลง (Tracking Details)
                    </h3>
                    <p className="text-xs text-slate-500">
                      บันทึกวันที่เข้าติดตาม คำนวณวันหลังฉีดพ่น
                      และภาพถ่ายสภาพพืชรอบนี้
                    </p>
                  </div>
                </div>

                {/* Row 1: วันที่ติดตามจริง & จำนวนวันหลังฉีดพ่น */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ActivityDatePicker
                    label="วันที่ติดตามจริง"
                    value={item.visitDate || ""}
                    onChange={(dateStr) =>
                      updateItem(item.id, "visitDate", dateStr)
                    }
                    disabled={readonly}
                    required
                    placeholder="เลือกวันที่ติดตามจริง..."
                  />

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      จำนวนวันหลังฉีดพ่น (วัน){" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <ActivityInput
                        type="number"
                        min={0}
                        value={item.daysAfterSpray ?? 0}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            "daysAfterSpray",
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
                      อัปโหลดได้สูงสุด 5 รูป (
                      {(item.cropImages || item.photos || []).length}/5)
                    </span>
                  </div>
                  <ActivityPhotoUpload
                    title="อัปโหลดรูปภาพ (สูงสุด 5 รูป)"
                    description="รองรับไฟล์ jpg, jpeg, png, webp, heic, heif"
                    images={
                      ((item.cropImages || item.photos || []) as any) || []
                    }
                    onImagesChange={(imgs) => {
                      updateItem(item.id, "cropImages", imgs);
                      updateItem(item.id, "photos", imgs);
                    }}
                    disabled={readonly}
                    maxFiles={5}
                  />
                </div>
              </div>

              {/* ============================================================= */}
              {/* SECTION 2: ข้อมูลการฉีดพ่นรอบต่างๆ (Multiple Spraying Rounds) */}
              {/* ============================================================= */}
              <div className="space-y-4">
                {/* Section 2 Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                      <RotateCw className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">
                        ส่วนที่ 2: ข้อมูลการฉีดพ่นรอบต่างๆ (Multiple Spraying
                        Rounds)
                      </h3>
                      <p className="text-xs text-slate-500">
                        บันทึกผลการฉีดพ่นยา อัตราการใช้จริง
                        วิธีและอุปกรณ์ทำการฉีดพ่น
                      </p>
                    </div>
                  </div>
                  {!readonly && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleAddRound(item.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium px-3 py-1.5 flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่มรอบการฉีดพ่น</span>
                    </Button>
                  )}
                </div>

                {/* Dynamic Round Cards */}
                {rounds.map((round, rIdx) => {
                  const prods = round.additionalProducts || [];
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
                            onClick={() => handleRemoveRound(item.id, rIdx)}
                            className="text-rose-500 hover:text-rose-700 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>ลบรอบนี้</span>
                          </button>
                        )}
                      </div>

                      {/* ===================================================== */}
                      {/* 1. รายการสินค้าที่ใช้ในการปฏิบัติงาน (Products Used)    */}
                      {/* ในกิจกรรมนอกแผนจะไม่มีการเบิกสินค้าล่วงหน้า จึงระบุสินค้าที่ใช้หน้างานโดยตรง */}
                      {/* ===================================================== */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-emerald-600" />
                            <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                              1. รายการสินค้าที่ใช้ในการปฏิบัติงาน (Products
                              Used)
                            </h4>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-semibold px-2 py-0.5"
                            >
                              {prods.length} รายการ
                            </Badge>
                            {!readonly && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddProduct(item.id, rIdx)}
                                className="h-8 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 gap-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                เพิ่มสินค้า
                              </Button>
                            )}
                          </div>
                        </div>

                        {prods.length === 0 ? (
                          <p className="text-xs text-slate-400 italic py-3 text-center bg-slate-50 rounded-xl">
                            ยังไม่มีรายการสินค้าที่ใช้ในการฉีดพ่นรอบนี้ กดปุ่ม
                            &quot;+ เพิ่มสินค้า&quot; เพื่อเลือกสินค้าจากระบบ
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {prods.map((prod, pIdx) => (
                              <div
                                key={prod.id || pIdx}
                                className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 space-y-3"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-800">
                                    สินค้าลำดับที่ {pIdx + 1}
                                  </span>
                                  {!readonly && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRemoveProduct(item.id, rIdx, pIdx)
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
                                    id={`item-${item.id}-round-${rIdx}-prod-${pIdx}`}
                                    label="เลือกสินค้าจากระบบ"
                                    value={prod.productId}
                                    valueKey="id"
                                    products={effectiveProducts as any}
                                    onChange={(val, selected) => {
                                      const resolvedId = selected?.id || val;
                                      const resolvedName =
                                        selected?.name ||
                                        prod.productName ||
                                        "";
                                      handleUpdateProduct(
                                        item.id,
                                        rIdx,
                                        pIdx,
                                        "productId",
                                        resolvedId,
                                      );
                                      handleUpdateProduct(
                                        item.id,
                                        rIdx,
                                        pIdx,
                                        "productName",
                                        resolvedName,
                                      );
                                      if (selected?.unit) {
                                        const defaultExtra =
                                          selected.unit.includes("ซอง")
                                            ? "กรัม"
                                            : "ซีซี";
                                        handleUpdateProduct(
                                          item.id,
                                          rIdx,
                                          pIdx,
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
                                        handleUpdateProduct(
                                          item.id,
                                          rIdx,
                                          pIdx,
                                          "actualQuantity",
                                          e.target.value,
                                        );
                                        handleUpdateProduct(
                                          item.id,
                                          rIdx,
                                          pIdx,
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
                                          handleUpdateProduct(
                                            item.id,
                                            rIdx,
                                            pIdx,
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
                                          handleUpdateProduct(
                                            item.id,
                                            rIdx,
                                            pIdx,
                                            "extraUnit",
                                            val,
                                          )
                                        }
                                        options={[
                                          {
                                            value: "ซีซี",
                                            label: "ซีซี (ขวด)",
                                          },
                                          {
                                            value: "กรัม",
                                            label: "กรัม (ซอง)",
                                          },
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
                                        prod.applicationRate ||
                                        prod.actualRate ||
                                        ""
                                      }
                                      onChange={(e) => {
                                        handleUpdateProduct(
                                          item.id,
                                          rIdx,
                                          pIdx,
                                          "applicationRate",
                                          e.target.value,
                                        );
                                        handleUpdateProduct(
                                          item.id,
                                          rIdx,
                                          pIdx,
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

                      {/* ===================================================== */}
                      {/* 2. วิธีการฉีดพ่น (Single vs Tank-mixed)               */}
                      {/* ===================================================== */}
                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-700">
                            วิธีการฉีดพ่น{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <div className="grid grid-cols-2 gap-3 max-w-md">
                            <button
                              type="button"
                              disabled={readonly}
                              onClick={() =>
                                handleUpdateRoundField(
                                  item.id,
                                  rIdx,
                                  "sprayMethod",
                                  "SINGLE",
                                )
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
                                  item.id,
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

                        {/* Checkbox มียาใช้ภายนอก (เมื่อเลือก Tank-mixed) */}
                        {round.sprayMethod === "TANK_MIXED" && (
                          <div className="pt-2 border-t border-slate-200/60 space-y-3">
                            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={Boolean(round.hasExternalChemicals)}
                                onChange={(e) =>
                                  handleUpdateRoundField(
                                    item.id,
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
                                      onClick={() =>
                                        handleAddExternalProduct(item.id, rIdx)
                                      }
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
                                    {round.externalProducts.map(
                                      (ext, extIdx) => (
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
                                                    item.id,
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
                                                    item.id,
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
                                                <span className="text-rose-500">
                                                  *
                                                </span>
                                              </label>
                                              <ActivityInput
                                                value={ext.productName || ""}
                                                onChange={(e) =>
                                                  handleUpdateExternalProduct(
                                                    item.id,
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
                                                value={
                                                  ext.activeIngredient || ""
                                                }
                                                onChange={(e) =>
                                                  handleUpdateExternalProduct(
                                                    item.id,
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
                                                    item.id,
                                                    rIdx,
                                                    extIdx,
                                                    "formula",
                                                    val,
                                                  )
                                                }
                                                options={
                                                  EXTERNAL_FORMULA_OPTIONS
                                                }
                                                disabled={readonly}
                                              />
                                            </div>

                                            {ext.formula === "อื่นๆ" && (
                                              <div className="space-y-1">
                                                <label className="text-[11px] font-medium text-slate-600">
                                                  ระบุสูตรเพิ่มเติม{" "}
                                                  <span className="text-rose-500">
                                                    *
                                                  </span>
                                                </label>
                                                <ActivityInput
                                                  value={
                                                    ext.customFormula || ""
                                                  }
                                                  onChange={(e) =>
                                                    handleUpdateExternalProduct(
                                                      item.id,
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
                                                <span className="text-rose-500">
                                                  *
                                                </span>
                                              </label>
                                              <ActivityInput
                                                value={
                                                  ext.applicationRate || ""
                                                }
                                                onChange={(e) =>
                                                  handleUpdateExternalProduct(
                                                    item.id,
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
                                      ),
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* ===================================================== */}
                      {/* 3. อุปกรณ์ที่ใช้ฉีดพ่น (Spray Equipment)               */}
                      {/* ===================================================== */}
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
                              handleUpdateRoundField(
                                item.id,
                                rIdx,
                                "sprayEquipment",
                                val,
                              )
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
                                    item.id,
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
                              handleUpdateRoundField(
                                item.id,
                                rIdx,
                                "productResponse",
                                val,
                              )
                            }
                            options={SPRAY_RESPONSE_OPTIONS.map((r) => ({
                              value: r.value,
                              label: r.label,
                            }))}
                            disabled={readonly}
                          />
                        </div>

                        {round.productResponse ===
                          "พบปัญหา / พืชมีอาการผิดปกติ" && (
                          <div className="pt-1">
                            <ActivityTextarea
                              value={round.problemDetail || ""}
                              onChange={(e) =>
                                handleUpdateRoundField(
                                  item.id,
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
                            5. รูปถ่ายการฉีดพ่นรอบนี้ (รูปการผสม /
                            ขณะปฏิบัติงาน)
                          </label>
                          <span className="text-xs text-slate-400">
                            อัปโหลดได้สูงสุด 5 รูป (
                            {round.roundImages?.length || 0}/5)
                          </span>
                        </div>
                        <ActivityPhotoUpload
                          title="อัปโหลดรูปภาพ (สูงสุด 5 รูป)"
                          description="รองรับไฟล์ jpg, jpeg, png, webp, heic, heif"
                          images={(round.roundImages as any) || []}
                          onImagesChange={(imgs) =>
                            handleUpdateRoundImages(item.id, rIdx, imgs)
                          }
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
                      value={item.nextSprayDate || ""}
                      onChange={(dateStr) =>
                        updateItem(item.id, "nextSprayDate", dateStr)
                      }
                      placeholder="เลือกกำหนดวันฉีดพ่นครั้งถัดไป..."
                      disabled={readonly}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      ข้อสังเกตหรือข้อมูลเพิ่มเติม
                    </label>
                    <ActivityTextarea
                      value={item.notes || ""}
                      onChange={(e) =>
                        updateItem(item.id, "notes", e.target.value)
                      }
                      placeholder="บันทึกข้อสังเกตเพิ่มเติม สภาพอากาศ หรือหมายเหตุอื่นๆ..."
                      rows={3}
                      disabled={readonly}
                    />
                  </div>
                </div>
              </div>

              {/* ============================================================= */}
              {/* SECTION 3: สถานะแปลงสาธิตและการปิดแปลง                       */}
              {/* ============================================================= */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      สถานะแปลงสาธิตและการปิดแปลง
                    </h3>
                    <p className="text-xs text-slate-500">
                      ระบุสถานะแปลงปัจจุบัน หรือบันทึกผลการเก็บเกี่ยวและปิดแปลง
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 max-w-md">
                  <label className="text-xs font-semibold text-slate-700">
                    สถานะแปลงสาธิตการตรวจรอบนี้{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <ActivitySelect
                    value={item.plotStatus || "IN_PROGRESS"}
                    onChange={(val) => updateItem(item.id, "plotStatus", val)}
                    options={DEMO_PLOT_STATUS_OPTIONS.map((s) => ({
                      value: s.value,
                      label: s.label,
                    }))}
                    disabled={readonly}
                  />
                </div>

                {isClosing && (
                  <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-4 space-y-4 mt-3">
                    <div className="border-b border-emerald-200/60 pb-2">
                      <h4 className="text-xs sm:text-sm font-bold text-emerald-950">
                        การประเมินผลการเก็บเกี่ยวและการปิดแปลง (Harvest
                        Evaluation)
                      </h4>
                      <p className="text-[11px] text-emerald-800">
                        บันทึกผลผลิต ความพึงพอใจของเกษตรกร
                        และโอกาสต่อยอดเชิงพาณิชย์
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">
                          ผลผลิตแปลงสาธิต (กก.)
                        </label>
                        <ActivityInput
                          type="number"
                          value={item.finalYieldKg || ""}
                          onChange={(e) =>
                            updateItem(item.id, "finalYieldKg", e.target.value)
                          }
                          disabled={readonly}
                          placeholder="เช่น 1500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">
                          ผลผลิตเปรียบเทียบ (กก.)
                        </label>
                        <ActivityInput
                          type="number"
                          value={item.controlYieldKg || ""}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "controlYieldKg",
                              e.target.value,
                            )
                          }
                          disabled={readonly}
                          placeholder="เช่น 1200"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">
                          ความพึงพอใจเกษตรกร
                        </label>
                        <ActivitySelect
                          value={String(item.farmerSatisfaction || "5")}
                          onChange={(val) =>
                            updateItem(
                              item.id,
                              "farmerSatisfaction",
                              parseInt(val, 10),
                            )
                          }
                          options={SATISFACTION_SCORES.map((s) => ({
                            value: String(s.value),
                            label: s.label,
                          }))}
                          disabled={readonly}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">
                          โอกาสขยายผลเชิงพาณิชย์
                        </label>
                        <ActivitySelect
                          value={
                            item.commercialPotential || "สูง (เกษตรกรสนใจมาก)"
                          }
                          onChange={(val) =>
                            updateItem(item.id, "commercialPotential", val)
                          }
                          options={COMMERCIAL_POTENTIALS.map((c) => ({
                            value: c,
                            label: c,
                          }))}
                          disabled={readonly}
                        />
                      </div>

                      <div className="space-y-1">
                        <ActivityDatePicker
                          label="วันปิดแปลง / วันเก็บเกี่ยว"
                          value={item.finalHarvestDate || ""}
                          onChange={(dateStr) =>
                            updateItem(
                              item.id,
                              "finalHarvestDate",
                              dateStr,
                            )
                          }
                          placeholder="เลือกวันปิดแปลง / วันเก็บเกี่ยว..."
                          disabled={readonly}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        สรุปผลภาพรวมหลังการเก็บเกี่ยว
                      </label>
                      <ActivityTextarea
                        value={item.finalSummaryNotes || ""}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            "finalSummaryNotes",
                            e.target.value,
                          )
                        }
                        placeholder="บันทึกความคิดเห็น ข้อสังเกต หรือแนวทางการขยายผลต่อไป..."
                        rows={3}
                        disabled={readonly}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
