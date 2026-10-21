"use client";

import React, { useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  Layers,
  PackageCheck,
  CheckCircle2,
  Sparkles,
  MapPin,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ActivityInput,
  ActivityCustomerSelect,
  ActivityAddressSelect,
  ActivityProductSelect,
  type ActivityCustomerItem,
} from "@/modules/activity/ui";
import type {
  Type14PlotItem,
  Type14WithdrawnProductLine,
  FollowUpPlanOption,
  FollowUpPlotOption,
  DealerCustomerOption,
  ProductOption,
} from "../../shared/types";
import type {
  Type14PlanInput,
  Type14PlanFormProps,
} from "../types/planned.types";

export type { Type14PlanFormProps };

export function Type14PlannedForm(props: any) {
  // Support both (value, onChange) or (data, onChange) or (plots, onChange)
  const data: Type14PlanInput = props.value || props.data || {};
  const onChange = props.onChange || props.setData;
  const readonly = Boolean(props.readonly);
  const hattackFollowUpPlans: FollowUpPlanOption[] =
    props.hattackFollowUpPlans || [];
  const dealers: DealerCustomerOption[] =
    props.dealerCustomers || props.dealers || [];
  const products: ProductOption[] = props.products || [];

  const mode = data.mode || "EXISTING_PLOT";
  const hasProductWithdrawal = Boolean(data.hasProductWithdrawal);
  const withdrawnProducts = data.withdrawnProducts || [];

  const handleUpdate = (updates: Partial<Type14PlanInput>) => {
    if (readonly || !onChange) return;
    onChange({
      ...data,
      ...updates,
    });
  };

  const handleToggleMode = (newMode: "EXISTING_PLOT" | "NEW_PLOT") => {
    handleUpdate({ mode: newMode });
  };

  // Convert dealers to ActivityCustomerItem format
  const customerItems: ActivityCustomerItem[] = useMemo(() => {
    return dealers.map((d: any) => ({
      id: d.id,
      name: d.name,
      customerCode: d.customerCode,
      province: d.province,
      district: d.district,
    }));
  }, [dealers]);

  // Product withdrawal helpers
  const handleToggleWithdrawal = (checked: boolean) => {
    if (checked && (!withdrawnProducts || withdrawnProducts.length === 0)) {
      handleUpdate({
        hasProductWithdrawal: true,
        withdrawnProducts: [
          {
            id: `withdrawn-${Date.now()}`,
            productId: "",
            productName: "",
            quantity: 1,
            unit: "ขวด",
          },
        ],
      });
    } else {
      handleUpdate({ hasProductWithdrawal: checked });
    }
  };

  const addWithdrawnRow = () => {
    const newLine: Type14WithdrawnProductLine = {
      id: `withdrawn-${Date.now()}-${withdrawnProducts.length + 1}`,
      productId: "",
      productName: "",
      quantity: 1,
      unit: "ขวด",
    };
    handleUpdate({
      withdrawnProducts: [...withdrawnProducts, newLine],
    });
  };

  const removeWithdrawnRow = (index: number) => {
    const updated = withdrawnProducts.filter((_, idx) => idx !== index);
    handleUpdate({ withdrawnProducts: updated });
  };

  const updateWithdrawnRow = (
    index: number,
    field: keyof Type14WithdrawnProductLine,
    value: any,
  ) => {
    const updated = withdrawnProducts.map((p, idx) =>
      idx === index ? { ...p, [field]: value } : p,
    );
    handleUpdate({ withdrawnProducts: updated });
  };

  // Extract all plots across available hattackFollowUpPlans
  const allAvailablePlots = useMemo(() => {
    const list: Array<FollowUpPlotOption & { planTitle?: string }> = [];
    hattackFollowUpPlans.forEach((plan) => {
      (plan.plots || []).forEach((plot) => {
        list.push({
          ...plot,
          planTitle: plan.planTitle,
        });
      });
    });
    return list;
  }, [hattackFollowUpPlans]);

  const selectedPlotIds =
    data.selectedPlotIds || (data.demoPlotId ? [data.demoPlotId] : []);

  const handleSelectExistingPlot = (plot: FollowUpPlotOption) => {
    const isAlreadySelected = selectedPlotIds.includes(plot.id);
    let nextSelectedIds: string[];
    let nextPlots: Type14PlotItem[] = data.plots ? [...data.plots] : [];

    if (isAlreadySelected) {
      nextSelectedIds = selectedPlotIds.filter((id) => id !== plot.id);
      nextPlots = nextPlots.filter((p) => (p.demoPlotId || p.id) !== plot.id);
    } else {
      nextSelectedIds = [...selectedPlotIds, plot.id];
      const newPlotItem: Type14PlotItem = {
        id: plot.id,
        demoPlotId: plot.id,
        name: plot.name,
        plotName: plot.name,
        storeId: plot.dealerId || "",
        dealerName: plot.dealerName || null,
        ownerName: plot.ownerName || null,
        cropCategory: plot.cropCategory || null,
        cropName: plot.cropName || null,
        areaRai: plot.areaRai != null ? Number(plot.areaRai) : null,
        treeCount: plot.treeCount != null ? Number(plot.treeCount) : null,
        province: plot.province || "",
        district: plot.district || "",
        subdistrict: plot.subdistrict || null,
        village: plot.village || null,
        latitude: plot.latitude || null,
        longitude: plot.longitude || null,
      };
      nextPlots.push(newPlotItem);
    }

    const primaryPlot = nextPlots[0];

    handleUpdate({
      selectedPlotIds: nextSelectedIds,
      demoPlotId: primaryPlot?.demoPlotId || null,
      plots: nextPlots,
      name: primaryPlot?.name || data.name,
      storeId: primaryPlot?.storeId || data.storeId,
      dealerName: primaryPlot?.dealerName || data.dealerName,
      ownerName: primaryPlot?.ownerName || data.ownerName,
      cropCategory: primaryPlot?.cropCategory || data.cropCategory,
      cropName: primaryPlot?.cropName || data.cropName,
      province: primaryPlot?.province || data.province,
      district: primaryPlot?.district || data.district,
      latitude:
        primaryPlot?.latitude != null
          ? String(primaryPlot.latitude)
          : data.latitude,
      longitude:
        primaryPlot?.longitude != null
          ? String(primaryPlot.longitude)
          : data.longitude,
    });
  };

  return (
    <div className="space-y-6 rounded-xl border border-border/80 bg-card p-5 shadow-sm">
      {/* Header & Mode Switch */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <Layers className="h-4 w-4" />
            </span>
            ติดตามแปลงแฮตแทค (Type 14)
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            เลือกแปลงที่เคยฉีดพ่นแล้ว หรือระบุแปลงใหม่เพื่อบันทึกการติดตามผล
          </p>
        </div>

        {!readonly && (
          <div className="inline-flex rounded-lg border bg-muted/30 p-1 text-xs">
            <button
              type="button"
              onClick={() => handleToggleMode("EXISTING_PLOT")}
              className={`rounded-md px-3 py-1.5 font-medium transition-all ${
                mode === "EXISTING_PLOT"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              เลือกแปลงเดิมที่มีอยู่
            </button>
            <button
              type="button"
              onClick={() => handleToggleMode("NEW_PLOT")}
              className={`rounded-md px-3 py-1.5 font-medium transition-all ${
                mode === "NEW_PLOT"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ระบุแปลงใหม่
            </button>
          </div>
        )}
      </div>

      {/* Mode 1: Existing Plot Selection */}
      {mode === "EXISTING_PLOT" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              รายการแปลงแฮทแทคที่พร้อมติดตามผล
            </span>
            <span className="text-xs text-muted-foreground">
              เลือกแล้ว {selectedPlotIds.length} แปลง
            </span>
          </div>

          {allAvailablePlots.length === 0 ? (
            <div className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-center text-sm text-muted-foreground bg-muted/10">
              ยังไม่พบรายการแปลงแฮตแทคจากแผนงานเดิม
              {!readonly && (
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleMode("NEW_PLOT")}
                    className="text-xs"
                  >
                    สลับไประบุแปลงใหม่
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
              {allAvailablePlots.map((plot) => {
                const isSelected = selectedPlotIds.includes(plot.id);
                return (
                  <div
                    key={plot.id}
                    onClick={() => !readonly && handleSelectExistingPlot(plot)}
                    className={`cursor-pointer rounded-lg border p-3 text-left transition-all ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/60 shadow-sm dark:bg-emerald-950/30"
                        : "border-border/70 hover:border-emerald-400/60 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                          {plot.name}
                          {plot.planTitle && (
                            <span className="text-[11px] text-muted-foreground font-normal">
                              ({plot.planTitle})
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          เจ้าของ: {plot.ownerName || "-"} | ร้านค้า:{" "}
                          {plot.dealerName || "-"}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3 text-emerald-600" />
                          {[plot.district, plot.province]
                            .filter(Boolean)
                            .join(", ") || "-"}
                          {plot.cropName && ` • พืช: ${plot.cropName}`}
                        </div>
                      </div>
                      <div
                        className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-muted-foreground/40"
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Mode 2: New Plot Details */}
      {mode === "NEW_PLOT" && (
        <div className="space-y-4 rounded-lg border border-border/70 bg-muted/10 p-4">
          <div className="text-sm font-medium text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            ข้อมูลแปลงแฮตแทคใหม่
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                ชื่อแปลงแฮตแทค <span className="text-destructive">*</span>
              </label>
              <ActivityInput
                value={data.name || ""}
                onChange={(e) => handleUpdate({ name: e.target.value })}
                placeholder="ระบุชื่อแปลง"
                disabled={readonly}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                ชื่อเจ้าของแปลง / เกษตรกร
              </label>
              <ActivityInput
                value={data.ownerName || ""}
                onChange={(e) => handleUpdate({ ownerName: e.target.value })}
                placeholder="ระบุชื่อเจ้าของแปลง"
                disabled={readonly}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                ร้านค้า / Dealer ผู้รับผิดชอบ{" "}
                <span className="text-destructive">*</span>
              </label>
              <ActivityCustomerSelect
                customers={customerItems}
                value={data.storeId || ""}
                onChange={(val, cust) =>
                  handleUpdate({
                    storeId: val,
                    dealerName: cust?.name || "",
                    province: data.province || cust?.province || "",
                    district: data.district || cust?.district || "",
                  })
                }
                disabled={readonly}
                placeholder="ค้นหาหรือเลือกร้านค้า / ตัวแทนจำหน่าย"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                หมวดหมู่พืช
              </label>
              <ActivityInput
                value={data.cropCategory || ""}
                onChange={(e) => handleUpdate({ cropCategory: e.target.value })}
                placeholder="เช่น ไม้ผล, พืชไร่"
                disabled={readonly}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                ชื่อพืช
              </label>
              <ActivityInput
                value={data.cropName || ""}
                onChange={(e) => handleUpdate({ cropName: e.target.value })}
                placeholder="เช่น ทุเรียน, ข้าว, ข้าวโพด"
                disabled={readonly}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                พื้นที่ตั้งแปลง (จังหวัด / อำเภอ){" "}
                <span className="text-destructive">*</span>
              </label>
              <ActivityAddressSelect
                levels="province-district"
                value={{
                  province: data.province || "",
                  district: data.district || "",
                }}
                onChange={(val: any) =>
                  handleUpdate({
                    province: val?.province || "",
                    district: val?.district || "",
                  })
                }
                disabled={readonly}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                พิกัด ละติจูด (Latitude)
              </label>
              <ActivityInput
                value={data.latitude || ""}
                onChange={(e) => handleUpdate({ latitude: e.target.value })}
                placeholder="13.7563"
                disabled={readonly}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                พิกัด ลองจิจูด (Longitude)
              </label>
              <ActivityInput
                value={data.longitude || ""}
                onChange={(e) => handleUpdate({ longitude: e.target.value })}
                placeholder="100.5018"
                disabled={readonly}
              />
            </div>
          </div>
        </div>
      )}

      {/* Product Withdrawal Section */}
      <div className="space-y-3 rounded-lg border border-border/80 bg-muted/5 p-4">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={hasProductWithdrawal}
              onChange={(e) => handleToggleWithdrawal(e.target.checked)}
              disabled={readonly}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <PackageCheck className="h-4 w-4 text-emerald-600" />
            มีการเบิกสินค้าเพิ่มเติมสำหรับการติดตามแปลง
          </label>
        </div>

        {hasProductWithdrawal && (
          <div className="space-y-3 pt-2">
            {withdrawnProducts.map((p, idx) => (
              <div
                key={p.id || idx}
                className="grid grid-cols-12 gap-2 items-center bg-card p-3 rounded-lg border"
              >
                <div className="col-span-12 sm:col-span-6">
                  <ActivityProductSelect
                    products={products as any}
                    value={p.productId}
                    onChange={(val, prod) => {
                      updateWithdrawnRow(idx, "productId", val);
                      updateWithdrawnRow(idx, "productName", prod?.name || "");
                      if (prod?.unit) {
                        updateWithdrawnRow(idx, "unit", prod.unit);
                      }
                    }}
                    disabled={readonly}
                  />
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <ActivityInput
                    type="number"
                    min="1"
                    value={p.quantity}
                    onChange={(e) =>
                      updateWithdrawnRow(
                        idx,
                        "quantity",
                        Math.max(1, parseInt(e.target.value, 10) || 1),
                      )
                    }
                    placeholder="จำนวน"
                    disabled={readonly}
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <ActivityInput
                    value={p.unit || "ขวด"}
                    onChange={(e) =>
                      updateWithdrawnRow(idx, "unit", e.target.value)
                    }
                    placeholder="หน่วย"
                    disabled={readonly}
                  />
                </div>
                {!readonly && (
                  <div className="col-span-2 sm:col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeWithdrawnRow(idx)}
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {!readonly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addWithdrawnRow}
                className="text-xs flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                เพิ่มรายการสินค้าเบิก
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          หมายเหตุการวางแผนติดตามแปลง
        </label>
        <ActivityInput
          value={data.notes || ""}
          onChange={(e) => handleUpdate({ notes: e.target.value })}
          placeholder="ระบุข้อความหรือบันทึกเพิ่มเติม (ถ้ามี)"
          disabled={readonly}
        />
      </div>
    </div>
  );
}

export const Type14Create = Type14PlannedForm;
export const Type14Edit = Type14PlannedForm;
