"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  Search,
  Plus,
  Trash2,
  PackageCheck,
  Droplets,
  Camera,
  Star,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ActivityInput,
  ActivityTextarea,
  ActivityCombobox,
  ActivityProductSelect,
  ActivityPhotoUpload,
} from "@/modules/activity/ui";
import { getFollowUpPlansAction } from "@/modules/activity/server/actions";
import { listProductsAction } from "@/modules/products/server/actions";
import {
  CROP_CONDITIONS,
  PRODUCT_RESPONSES,
  SPRAY_METHODS,
  SPRAY_EQUIPMENTS,
  COMMERCIAL_POTENTIALS,
  SATISFACTION_SCORES,
  DEMO_PLOT_STATUS_OPTIONS,
} from "../../shared/constants";
import type { Type7bUnplannedFormProps } from "../types/unplanned.types";

export function Type7bUnplannedForm({
  readonly = false,
  items = [],
  plotList = [],
  followUpPlans = [],
  products = [],
  addItem,
  updateItem,
  deleteItem,
  addWithdrawnProduct,
  updateWithdrawnProduct,
  deleteWithdrawnProduct,
}: Type7bUnplannedFormProps) {
  const [dbPlans, setDbPlans] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    if (followUpPlans.length === 0 && plotList.length === 0) {
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
          console.error("Failed to load follow-up plans in Type7bUnplannedForm:", err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [followUpPlans.length, plotList.length]);

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
  const cropConditionOptions = CROP_CONDITIONS.map((c) => ({ value: c, label: c }));
  const responseOptions = PRODUCT_RESPONSES.map((r) => ({ value: r, label: r }));
  const sprayMethodOptions = SPRAY_METHODS.map((m) => ({ value: m, label: m }));
  const sprayEquipOptions = SPRAY_EQUIPMENTS.map((e) => ({ value: e, label: e }));
  const commercialOptions = COMMERCIAL_POTENTIALS.map((c) => ({ value: c, label: c }));

  const satisfactionOptions = SATISFACTION_SCORES.map((s) => ({
    value: String(s.value),
    label: s.label,
  }));

  const statusOptions = DEMO_PLOT_STATUS_OPTIONS.map((s) => ({
    value: s.value,
    label: s.label,
  }));

  // Demo plot options from plotList or followUpPlans
  const existingPlotOptions = useMemo(() => {
    const list: Array<{ value: string; label: string; subLabel?: string; plot: any }> = [];
    const seen = new Set<string>();

    for (const p of plotList) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        list.push({
          value: p.id,
          label: `${p.name} (${p.code || "DP"})`,
          subLabel: `เกษตรกร: ${p.ownerName || "-"} | พืช: ${p.cropName || p.cropCategory || "-"}`,
          plot: p,
        });
      }
    }

    for (const plan of effectivePlans) {
      for (const p of plan.plots || []) {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          list.push({
            value: p.id,
            label: `${p.name} (${p.code || "DP"})`,
            subLabel: `เกษตรกร: ${p.ownerName || "-"} | พืช: ${p.cropName || "-"}`,
            plot: p,
          });
        }
      }
    }

    return list;
  }, [plotList, effectivePlans]);

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <Search className="h-4 w-4 text-emerald-600" />
          <span>ติดตามแปลงสาธิต (นอกแผน)</span>
        </div>

        {!readonly && addItem && (
          <Button
            type="button"
            size="sm"
            onClick={addItem}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            เพิ่มแปลงติดตาม
          </Button>
        )}
      </div>

      {/* Items List */}
      <div className="space-y-5">
        {items.map((item, index) => {
          const isFinalRound = item.plotStatus === "COMPLETED";
          const withdrawnProds = item.withdrawnProducts || [];

          return (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs space-y-4"
            >
              {/* Plot Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[11px] font-bold">
                    {index + 1}
                  </span>
                  <span>แปลงสาธิตที่ติดตาม</span>
                </span>

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

              {/* 1. Plot Selection / Information */}
              <div className="space-y-3">
                {existingPlotOptions.length > 0 && (
                  <ActivityCombobox
                    label="เลือกแปลงสาธิตที่มีอยู่ในระบบ"
                    labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                    value={item.demoPlotId || ""}
                    onChange={(val) => {
                      updateItem(item.id, "demoPlotId", val);
                      const matched = existingPlotOptions.find((opt) => opt.value === val);
                      if (matched && matched.plot) {
                        const pl = matched.plot;
                        updateItem(item.id, "plotName", pl.name || "");
                        updateItem(item.id, "farmerName", pl.ownerName || "");
                        updateItem(item.id, "cropName", pl.cropName || "");
                        updateItem(item.id, "cropCategory", pl.cropCategory || "");
                        updateItem(item.id, "province", pl.province || "");
                        updateItem(item.id, "district", pl.district || "");
                        updateItem(item.id, "areaRai", pl.areaRai || null);
                      }
                    }}
                    options={existingPlotOptions}
                    placeholder="เลือกแปลงสาธิตที่มีอยู่ หรือระบุข้อมูลด้านล่าง..."
                    searchPlaceholder="ค้นหาแปลงสาธิต..."
                    emptyText="ไม่พบแปลงสาธิต"
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
                      onChange={(e) => updateItem(item.id, "plotName", e.target.value)}
                      disabled={readonly}
                      placeholder="ระบุชื่อแปลงสาธิต..."
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      ชื่อเจ้าของแปลง (เกษตรกร) <span className="text-rose-500">*</span>
                    </label>
                    <ActivityInput
                      value={item.farmerName || ""}
                      onChange={(e) => updateItem(item.id, "farmerName", e.target.value)}
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
                      onChange={(e) => updateItem(item.id, "cropName", e.target.value)}
                      disabled={readonly}
                      placeholder="เช่น ข้าว, ทุเรียน..."
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">พื้นที่ (ไร่)</label>
                    <ActivityInput
                      type="number"
                      value={item.areaRai ?? ""}
                      onChange={(e) => updateItem(item.id, "areaRai", Number(e.target.value) || null)}
                      disabled={readonly}
                      placeholder="ระบุขนาดไร่..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">จังหวัด / อำเภอ</label>
                    <ActivityInput
                      value={[item.province, item.district].filter(Boolean).join(" / ")}
                      onChange={(e) => updateItem(item.id, "province", e.target.value)}
                      disabled={readonly}
                      placeholder="ระบุจังหวัด/อำเภอ..."
                    />
                  </div>
                </div>
              </div>

              {/* 2. On-the-spot Evaluation */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 border-l-2 border-emerald-500 pl-2">
                  สภาพแปลงและการตอบสนองต่อผลิตภัณฑ์
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <ActivityCombobox
                    label="สภาพแปลง / สภาพพืช"
                    labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                    value={item.cropCondition || "สมบูรณ์"}
                    onChange={(val) => updateItem(item.id, "cropCondition", val)}
                    options={cropConditionOptions}
                    disabled={readonly}
                    required
                  />

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      ระยะการเจริญเติบโต (Growth Stage) <span className="text-rose-500">*</span>
                    </label>
                    <ActivityInput
                      value={item.growthStage || ""}
                      onChange={(e) => updateItem(item.id, "growthStage", e.target.value)}
                      disabled={readonly}
                      placeholder="เช่น แตกใบอ่อน, ติดผลอ่อน..."
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <ActivityCombobox
                    label="การตอบสนองต่อผลิตภัณฑ์"
                    labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                    value={item.productResponse || "พืชตอบสนองดี"}
                    onChange={(val) => updateItem(item.id, "productResponse", val)}
                    options={responseOptions}
                    disabled={readonly}
                  />

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">กำหนดติดตาม / พ่นครั้งถัดไป</label>
                    <ActivityInput
                      type="date"
                      value={item.nextSprayDate || ""}
                      onChange={(e) => updateItem(item.id, "nextSprayDate", e.target.value)}
                      disabled={readonly}
                    />
                  </div>
                </div>

                <ActivityTextarea
                  label="อาการผิดปกติ / ข้อสังเกตจากการติดตาม"
                  labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                  rows={2}
                  value={item.cropProblemDescription || ""}
                  onChange={(e) => updateItem(item.id, "cropProblemDescription", e.target.value)}
                  disabled={readonly}
                  placeholder="ระบุอาการผิดปกติ ปัญหาโรคแมลง หรือรายละเอียดการเจริญเติบโต..."
                />
              </div>

              {/* 3. Photos */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 border-l-2 border-emerald-500 pl-2">
                  <Camera className="w-3.5 h-3.5 text-emerald-600" />
                  รูปถ่ายติดตามแปลงสาธิต
                </span>

                <ActivityPhotoUpload
                  title="รูปถ่ายหน้างานจริง"
                  description="แนบรูปถ่ายสภาพแปลง, พืช หรือกิจกรรมการฉีดพ่น"
                  images={(item.photos as any) || []}
                  onImagesChange={(imgs) => updateItem(item.id, "photos", imgs)}
                  disabled={readonly}
                  maxFiles={6}
                />
              </div>

              {/* 4. Products Withdrawn (Optional) */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!item.hasProductWithdrawal}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        updateItem(item.id, "hasProductWithdrawal", checked);
                        if (checked && (!item.withdrawnProducts || item.withdrawnProducts.length === 0)) {
                          addWithdrawnProduct?.(item.id);
                        }
                      }}
                      disabled={readonly}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <PackageCheck className="h-4 w-4 text-emerald-600" />
                      มีการเบิก/ใช้สินค้าในการติดตามครั้งนี้
                    </span>
                  </label>

                  {item.hasProductWithdrawal && !readonly && addWithdrawnProduct && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addWithdrawnProduct(item.id)}
                      className="h-6 px-2 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-md cursor-pointer"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      เพิ่มสินค้า
                    </Button>
                  )}
                </div>

                {item.hasProductWithdrawal && (
                  <div className="space-y-2">
                    {withdrawnProds.map((prod) => (
                      <div key={prod.id} className="flex items-center gap-2">
                        <div className="flex-1">
                          <ActivityProductSelect
                            id={`unplanned-prod-${prod.id}`}
                            value={prod.productId || ""}
                            valueKey="id"
                            onChange={(val, selected) =>
                              updateWithdrawnProduct?.(item.id, prod.id, "productId", val, selected)
                            }
                            products={effectiveProducts as any}
                            placeholder="เลือกสินค้า..."
                            disabled={readonly}
                          />
                        </div>
                        <ActivityInput
                          type="number"
                          min={1}
                          value={prod.quantity ?? 1}
                          onChange={(e) =>
                            updateWithdrawnProduct?.(
                              item.id,
                              prod.id,
                              "quantity",
                              Math.max(1, parseInt(e.target.value) || 1),
                            )
                          }
                          disabled={readonly}
                          placeholder="จำนวน"
                          className="w-20 text-center"
                        />
                        {!readonly && deleteWithdrawnProduct && (
                          <button
                            type="button"
                            onClick={() => deleteWithdrawnProduct(item.id, prod.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. Final Evaluation */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 border-l-2 border-emerald-500 pl-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  สถานะแปลงและการประเมินผล
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <ActivityCombobox
                    label="สถานะแปลงสาธิต"
                    labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                    value={item.plotStatus || "IN_PROGRESS"}
                    onChange={(val) => updateItem(item.id, "plotStatus", val)}
                    options={statusOptions}
                    disabled={readonly}
                  />

                  <ActivityCombobox
                    label="โอกาสขยายผลเชิงพาณิชย์"
                    labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                    value={item.commercialPotential || "สูง (เกษตรกรสนใจมาก)"}
                    onChange={(val) => updateItem(item.id, "commercialPotential", val)}
                    options={commercialOptions}
                    disabled={readonly}
                  />
                </div>

                {isFinalRound && (
                  <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">ผลผลิตแปลงสาธิต (กก.)</label>
                        <ActivityInput
                          type="number"
                          value={item.finalYieldKg || ""}
                          onChange={(e) => updateItem(item.id, "finalYieldKg", e.target.value)}
                          disabled={readonly}
                          placeholder="เช่น 1500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">ผลผลิตเปรียบเทียบ (กก.)</label>
                        <ActivityInput
                          type="number"
                          value={item.controlYieldKg || ""}
                          onChange={(e) => updateItem(item.id, "controlYieldKg", e.target.value)}
                          disabled={readonly}
                          placeholder="เช่น 1200"
                        />
                      </div>
                      <ActivityCombobox
                        label="ความพึงพอใจเกษตรกร"
                        labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                        value={String(item.farmerSatisfaction || "5")}
                        onChange={(val) => updateItem(item.id, "farmerSatisfaction", parseInt(val, 10))}
                        options={satisfactionOptions}
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
