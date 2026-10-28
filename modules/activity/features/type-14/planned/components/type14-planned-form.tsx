"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Layers,
  PackageCheck,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ActivityInput,
  ActivityProductSelect,
} from "@/modules/activity/ui";
import { getHattackFollowUpPlansAction } from "@/modules/activity/server/actions";
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

  const [dbPlans, setDbPlans] = useState<FollowUpPlanOption[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  // Self-healing fallback: Load hattack follow-up plans if not provided by parent
  useEffect(() => {
    let isMounted = true;
    if (hattackFollowUpPlans.length === 0) {
      setIsLoadingPlans(true);
      getHattackFollowUpPlansAction()
        .then((res) => {
          if (
            isMounted &&
            res?.success &&
            res.hattackFollowUpPlans &&
            res.hattackFollowUpPlans.length > 0
          ) {
            setDbPlans(res.hattackFollowUpPlans);
          }
        })
        .catch((err) => {
          console.error("Failed to load hattack follow-up plans in Type14PlannedForm:", err);
        })
        .finally(() => {
          if (isMounted) setIsLoadingPlans(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [hattackFollowUpPlans.length]);

  const activeFollowUpPlans =
    hattackFollowUpPlans.length > 0 ? hattackFollowUpPlans : dbPlans;

  const hasProductWithdrawal = Boolean(data.hasProductWithdrawal);
  const withdrawnProducts = data.withdrawnProducts || [];

  const handleUpdate = (updates: Partial<Type14PlanInput>) => {
    if (readonly || !onChange) return;
    onChange({
      ...data,
      mode: "EXISTING_PLOT",
      ...updates,
    });
  };

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

  const handleSelectPlan = (planId: string) => {
    if (!planId) {
      handleUpdate({
        selectedPlanId: null,
        selectedPlotIds: [],
        type13TargetIds: [],
        plots: [],
      });
      return;
    }

    const targetPlan = activeFollowUpPlans.find((p) => p.planId === planId);
    if (!targetPlan) return;

    const mappedPlots: Type14PlotItem[] = (targetPlan.plots || []).map(
      (plot, idx) => ({
        id: plot.id,
        demoPlotId: plot.id,
        type13TargetId: plot.id,
        name: plot.name || `แปลงแฮตแทค ${idx + 1}`,
        plotName: plot.name || `แปลงแฮตแทค ${idx + 1}`,
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
        plannedPlotsCount: plot.plannedPlotsCount ?? 1,
        latitude: plot.latitude || null,
        longitude: plot.longitude || null,
      }),
    );

    const primaryPlot = mappedPlots[0];
    const plotIds = mappedPlots.map((p) => p.id);

    handleUpdate({
      selectedPlanId: targetPlan.planId,
      selectedPlotIds: plotIds,
      type13TargetIds: plotIds,
      demoPlotId: primaryPlot?.id || null,
      type13TargetId: primaryPlot?.id || null,
      plots: mappedPlots,
      name: primaryPlot?.name || targetPlan.planTitle,
      storeId: primaryPlot?.storeId || "",
      dealerName: primaryPlot?.dealerName || "",
      ownerName: primaryPlot?.ownerName || "",
      province: primaryPlot?.province || "",
      district: primaryPlot?.district || "",
      latitude: primaryPlot?.latitude != null ? String(primaryPlot.latitude) : "",
      longitude: primaryPlot?.longitude != null ? String(primaryPlot.longitude) : "",
    });
  };

  // Self-healing synchronization for edit mode & async plans loading
  useEffect(() => {
    if (activeFollowUpPlans.length === 0) return;

    // Case A: selectedPlanId is missing, but we have plots/plotIds from initial data
    if (!data.selectedPlanId) {
      const currentPlotIds =
        data.selectedPlotIds ||
        data.type13TargetIds ||
        (data.plots || [])
          .map((p) => p.type13TargetId || p.demoPlotId || p.id)
          .filter(Boolean);

      if (currentPlotIds.length > 0) {
        const matchedPlan = activeFollowUpPlans.find((plan) =>
          plan.plots.some((pl) => currentPlotIds.includes(pl.id)),
        );
        if (matchedPlan) {
          handleSelectPlan(matchedPlan.planId);
        }
      }
    } else {
      // Case B: selectedPlanId is set, but plots are empty
      if (!data.plots || data.plots.length === 0) {
        const matchedPlan = activeFollowUpPlans.find(
          (p) => p.planId === data.selectedPlanId,
        );
        if (matchedPlan && matchedPlan.plots.length > 0) {
          handleSelectPlan(matchedPlan.planId);
        }
      }
    }
  }, [activeFollowUpPlans.length, data.selectedPlanId, data.plots?.length]);

  return (
    <div className="space-y-6 rounded-xl border border-border/80 bg-card p-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <Layers className="h-4 w-4" />
            </span>
            ติดตามแปลงแฮตแทค (Type 14)
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            เลือกแผนงานฉีดแปลงแฮตแทคเดิม (Type 13) เพื่อบันทึกการติดตามผล
          </p>
        </div>
      </div>

      {/* Existing Plan Selection */}
      <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
                <span>เลือกแผนงานฉีดแปลงแฮตแทคเดิม (Type 13)</span>
                <span className="text-rose-500">*</span>
              </label>
              <p className="text-xs text-muted-foreground mt-0.5">
                เลือกแผนงานฉีดแปลงแฮตแทคเดิม เพื่อนำแปลงทั้งหมดในแผนงานมาบันทึกติดตามผล
              </p>
            </div>
            {data.plots && data.plots.length > 0 && (
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                แปลงในแผนงานนี้: {data.plots.length} แปลง
              </span>
            )}
          </div>

          {isLoadingPlans && activeFollowUpPlans.length === 0 ? (
            <div className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-center text-sm text-muted-foreground bg-muted/10 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
              <span>กำลังโหลดรายการแผนงานฉีดแปลงแฮตแทคเดิม...</span>
            </div>
          ) : activeFollowUpPlans.length === 0 ? (
            <div className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-center text-sm text-muted-foreground bg-muted/10">
              ยังไม่พบรายการแผนงานฉีดแปลงแฮตแทคเดิม (Type 13) ในระบบ
            </div>
          ) : (
            <div className="space-y-4">
              {/* Plan Select Dropdown */}
              <div className="relative">
                <select
                  value={data.selectedPlanId || ""}
                  onChange={(e) => handleSelectPlan(e.target.value)}
                  disabled={readonly}
                  className="w-full h-11 px-3 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-slate-800 font-medium"
                >
                  <option value="">-- กรุณาเลือกแผนงานฉีดแปลงแฮตแทคเดิม --</option>
                  {activeFollowUpPlans.map((plan) => (
                    <option key={plan.planId} value={plan.planId}>
                      {plan.planCode ? `[${plan.planCode}] ` : ""}
                      {plan.planTitle}
                      {plan.planDate ? ` (${plan.planDate})` : ""} - จำนวน{" "}
                      {plan.plots?.length || 0} แปลง
                    </option>
                  ))}
                </select>
              </div>

              {/* Display plots in selected plan */}
              {data.plots && data.plots.length > 0 ? (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>รายการแปลงทั้งหมดที่จะติดตามผล ({data.plots.length} แปลง)</span>
                    <span className="text-[11px] text-slate-400">ดึงข้อมูลอัตโนมัติจากแผนงาน</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                    {data.plots.map((plot, idx) => {
                      const locParts = [
                        plot.subdistrict ? `ต.${plot.subdistrict}` : null,
                        plot.district ? `อ.${plot.district}` : null,
                        plot.province ? `จ.${plot.province}` : null,
                      ].filter(Boolean);
                      const locText = locParts.length > 0 ? locParts.join(" ") : "-";

                      return (
                        <div
                          key={plot.id || idx}
                          className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-3.5 space-y-2 text-left"
                        >
                          <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="font-bold text-xs sm:text-sm text-slate-800">
                                {plot.name || plot.plotName || `แปลงที่ ${idx + 1}`}
                              </span>
                            </div>
                            {plot.plannedPlotsCount != null && (
                              <span className="text-[11px] font-semibold text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                                {plot.plannedPlotsCount} แปลง
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-[11px] text-slate-400 block">ร้านค้า Dealer</span>
                              <span className="font-medium text-slate-800 block truncate">
                                {plot.dealerName || "-"}
                              </span>
                            </div>
                            <div>
                              <span className="text-[11px] text-slate-400 block">เกษตรกร / เจ้าของ</span>
                              <span className="font-medium text-slate-800 block truncate">
                                {plot.ownerName || "-"}
                              </span>
                            </div>
                            <div>
                              <span className="text-[11px] text-slate-400 block">หมู่บ้าน</span>
                              <span className="font-medium text-slate-700 block truncate">
                                {plot.village || "-"}
                              </span>
                            </div>
                            <div>
                              <span className="text-[11px] text-slate-400 block">สถานที่</span>
                              <span className="font-medium text-slate-700 block truncate">
                                {locText}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center text-xs sm:text-sm text-slate-500">
                  กรุณาเลือกแผนงานฉีดแปลงแฮตแทคเดิม (Type 13) จากตัวเลือกด้านบน เพื่อนำแปลงทั้งหมดมาติดตามผล
                </div>
              )}
            </div>
          )}
        </div>

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
