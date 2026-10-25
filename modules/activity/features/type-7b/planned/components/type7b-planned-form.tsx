"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Info, PackageCheck, Plus, Trash2, Sprout, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ActivityInput,
  ActivityTextarea,
  ActivityCombobox,
  ActivityProductSelect,
} from "@/modules/activity/ui";
import { getFollowUpPlansAction } from "@/modules/activity/server/actions";
import { listProductsAction } from "@/modules/products/server/actions";
import type {
  Type7bWithdrawnProductLine,
  Type7bFollowUpPlanOption,
} from "../../shared/types";
import type {
  Type7bPlannedFormProps,
  Type7bPlanFormProps,
  Type7FollowUpProps,
} from "../types/planned.types";

export type { Type7bPlanFormProps, Type7FollowUpProps };

export function Type7bPlannedForm({
  item,
  updateType7Row,
  plotList = [],
  followUpPlans = [],
  products = [],
  readonly = false,
}: Type7bPlannedFormProps) {
  const [dbPlans, setDbPlans] = useState<Type7bFollowUpPlanOption[]>([]);

  // Self-healing fallback: Load open demo plots / follow-up plans if not provided by parent
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
          console.error("Failed to load follow-up plans in Type7bPlannedForm:", err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [followUpPlans.length]);

  const [dbProducts, setDbProducts] = useState<any[]>([]);

  // Self-healing fallback: Load active products from master catalog if not provided by parent
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
          console.error("Failed to load products in Type7bPlannedForm:", err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [products.length]);

  const effectiveProducts = useMemo(() => {
    const base = products.length > 0 ? products : dbProducts;
    const withdrawnList = item.withdrawnProducts || [];
    if (withdrawnList.length === 0) return base;
    const existingIds = new Set(base.map((p) => p.id));
    const extra: any[] = [];
    for (const wp of withdrawnList) {
      if (wp.productId && !existingIds.has(wp.productId)) {
        existingIds.add(wp.productId);
        extra.push({
          id: wp.productId,
          name: wp.productName || "สินค้าที่เบิก",
          unit: wp.unit || "ขวด",
        });
      }
    }
    return extra.length > 0 ? [...extra, ...base] : base;
  }, [products, dbProducts, item.withdrawnProducts]);

  // Combine followUpPlans, dbPlans, or synthesize from plotList if needed
  const effectiveFollowUpPlans = useMemo(() => {
    let plansSource = followUpPlans.length > 0 ? followUpPlans : dbPlans;
    if (plansSource.length === 0) {
      // Fallback: If no followUpPlans, build options from plotList
      plansSource = (plotList || [])
        .filter((p) => p.status !== "COMPLETED" && p.status !== "CANCELLED")
        .map((p) => ({
          planId: p.id,
          planCode: p.code || "แปลงสาธิต",
          planTitle: `${p.name} (${p.ownerName || "ไม่ระบุเจ้าของ"})`,
          planDate: p.startDate
            ? new Date(p.startDate).toLocaleDateString("th-TH")
            : undefined,
          plots: [
            {
              id: p.id,
              code: p.code,
              name: p.name,
              cropName: p.cropName || p.targetCrop || "-",
              cropCategory: p.cropCategory,
              ownerName: p.ownerName || "-",
              province: p.province || "",
              district: p.district || "",
              areaRai: p.areaRai ? Number(p.areaRai) : undefined,
              treeCount: p.treeCount ?? undefined,
              dealerName: p.dealerName,
              dealerId: p.dealerId,
            },
          ],
        }));
    }

    // Resilience: If item has a selectedPlanId or selectedPlotIds but it's not present in plansSource
    // (e.g. source plan was completed, closed, or not returned by getFollowUpPlansAction)
    const hasSelectedPlan = plansSource.some(
      (p) => p.planId === item.selectedPlanId,
    );
    if (
      !hasSelectedPlan &&
      (item.selectedPlanId ||
        item.existingPlotId ||
        item.demoPlotId ||
        (item.selectedPlotIds && item.selectedPlotIds.length > 0))
    ) {
      const targetPlotsSource = Array.isArray(item.plots) && item.plots.length > 0 ? item.plots : [];
      const syntheticPlots = (
        item.selectedPlotIds && item.selectedPlotIds.length > 0
          ? item.selectedPlotIds
          : [item.existingPlotId || item.demoPlotId].filter(Boolean)
      ).map((plotId, idx) => {
        const matchedTarget = targetPlotsSource.find(
          (tp: any) => tp.demoPlotId === plotId || tp.id === plotId,
        );
        const demoP = matchedTarget?.demoPlot || {};
        return {
          id: plotId as string,
          code: demoP.code || matchedTarget?.plotCode || "",
          name:
            matchedTarget?.plotName ||
            demoP.name ||
            item.plotName ||
            item.existingPlotName ||
            `แปลงสาธิต #${idx + 1}`,
          cropName:
            matchedTarget?.cropName ||
            demoP.cropName ||
            demoP.customCropName ||
            item.cropName ||
            "-",
          cropCategory:
            matchedTarget?.cropCategory ||
            demoP.cropCategory ||
            item.cropCategory,
          ownerName:
            matchedTarget?.ownerName ||
            matchedTarget?.farmerName ||
            demoP.ownerName ||
            item.ownerName ||
            item.farmerName ||
            "-",
          province:
            matchedTarget?.province ||
            demoP.province ||
            item.province ||
            "",
          district:
            matchedTarget?.district ||
            demoP.district ||
            item.district ||
            "",
          areaRai:
            matchedTarget?.areaRai != null
              ? Number(matchedTarget.areaRai)
              : demoP.areaRai != null
                ? Number(demoP.areaRai)
                : item.areaRai != null
                  ? Number(item.areaRai)
                  : undefined,
          treeCount:
            matchedTarget?.treeCount ??
            demoP.treeCount ??
            item.treeCount ??
            undefined,
          dealerName:
            matchedTarget?.dealerName ||
            demoP.customer?.name ||
            demoP.dealerName ||
            undefined,
        };
      });

      const syntheticPlan: Type7bFollowUpPlanOption = {
        planId: item.selectedPlanId || "existing-source-plan",
        planCode: item.sourcePlanCode || "แผนต้นทาง",
        planTitle:
          item.sourcePlanTitle ||
          item.plotName ||
          item.existingPlotName ||
          "แผนแปลงสาธิตที่เลือก",
        planDate: item.sourcePlanDate
          ? new Date(item.sourcePlanDate).toLocaleDateString("th-TH")
          : undefined,
        plots: syntheticPlots,
      };

      return [syntheticPlan, ...plansSource];
    }

    return plansSource;
  }, [
    followUpPlans,
    dbPlans,
    plotList,
    item.selectedPlanId,
    item.selectedPlotIds,
    item.existingPlotId,
    item.demoPlotId,
    item.plotName,
    item.existingPlotName,
    item.cropName,
    item.cropCategory,
    item.ownerName,
    item.farmerName,
    item.province,
    item.district,
    item.areaRai,
    item.treeCount,
    item.sourcePlanCode,
    item.sourcePlanTitle,
    item.sourcePlanDate,
    item.plots,
  ]);

  // 1. Resolve selected plan
  const selectedPlan = useMemo(() => {
    if (item.selectedPlanId) {
      return effectiveFollowUpPlans.find((p) => p.planId === item.selectedPlanId);
    }
    const targetPlotId =
      item.selectedPlotIds?.[0] || item.existingPlotId || item.demoPlotId;
    if (targetPlotId) {
      return effectiveFollowUpPlans.find((plan) =>
        plan.plots.some((pl) => pl.id === targetPlotId),
      );
    }
    return undefined;
  }, [
    item.selectedPlanId,
    item.selectedPlotIds,
    item.existingPlotId,
    item.demoPlotId,
    effectiveFollowUpPlans,
  ]);

  // Selected plot IDs
  const selectedPlotIds: string[] = useMemo(() => {
    if (Array.isArray(item.selectedPlotIds) && item.selectedPlotIds.length > 0) {
      return item.selectedPlotIds;
    }
    if (item.existingPlotId || item.demoPlotId) {
      const pid = item.existingPlotId || item.demoPlotId;
      return pid ? [pid] : [];
    }
    return [];
  }, [item.selectedPlotIds, item.existingPlotId, item.demoPlotId]);

  // Plan Combobox Options
  const planOptions = useMemo(() => {
    return effectiveFollowUpPlans.map((plan) => {
      const uniquePlots = plan.plots || [];
      return {
        value: plan.planId,
        label: `[${plan.planCode || "แปลงสาธิต"}] ${plan.planTitle}${plan.planDate ? ` (${plan.planDate})` : ""}`,
        subLabel: `${uniquePlots.length} แปลงสาธิต: ${uniquePlots.map((p) => p.name).join(", ")}`,
      };
    });
  }, [effectiveFollowUpPlans]);

  // Deduplicated plots from selectedPlan + selectedPlotIds resilience
  const planPlots = useMemo(() => {
    const list = [...(selectedPlan?.plots || [])];
    const seen = new Set<string>(list.map((p) => p.id));
    const targetPlotsSource = Array.isArray(item.plots) && item.plots.length > 0 ? item.plots : [];

    if (Array.isArray(item.selectedPlotIds)) {
      for (const plotId of item.selectedPlotIds) {
        if (!seen.has(plotId)) {
          seen.add(plotId);
          const matchedTarget = targetPlotsSource.find(
            (tp: any) => tp.demoPlotId === plotId || tp.id === plotId,
          );
          const demoP = matchedTarget?.demoPlot || {};
          list.push({
            id: plotId,
            code: demoP.code || matchedTarget?.plotCode || "",
            name:
              matchedTarget?.plotName ||
              demoP.name ||
              item.plotName ||
              item.existingPlotName ||
              "แปลงสาธิตที่เลือก",
            cropName:
              matchedTarget?.cropName ||
              demoP.cropName ||
              demoP.customCropName ||
              item.cropName ||
              "-",
            cropCategory:
              matchedTarget?.cropCategory ||
              demoP.cropCategory ||
              item.cropCategory,
            ownerName:
              matchedTarget?.ownerName ||
              matchedTarget?.farmerName ||
              demoP.ownerName ||
              item.ownerName ||
              item.farmerName ||
              "-",
            province:
              matchedTarget?.province ||
              demoP.province ||
              item.province ||
              "",
            district:
              matchedTarget?.district ||
              demoP.district ||
              item.district ||
              "",
            areaRai:
              matchedTarget?.areaRai != null
                ? Number(matchedTarget.areaRai)
                : demoP.areaRai != null
                  ? Number(demoP.areaRai)
                  : item.areaRai != null
                    ? Number(item.areaRai)
                    : undefined,
            treeCount:
              matchedTarget?.treeCount ??
              demoP.treeCount ??
              item.treeCount ??
              undefined,
            dealerName:
              matchedTarget?.dealerName ||
              demoP.customer?.name ||
              demoP.dealerName ||
              undefined,
          });
        }
      }
    }
    return list;
  }, [
    selectedPlan,
    item.selectedPlotIds,
    item.plots,
    item.plotName,
    item.existingPlotName,
    item.cropName,
    item.cropCategory,
    item.ownerName,
    item.farmerName,
    item.province,
    item.district,
    item.areaRai,
    item.treeCount,
  ]);

  // Sync plot details helper
  const syncPlotData = (firstPlotId: string, allPlotIds: string[]) => {
    updateType7Row(item.id, "selectedPlotIds", allPlotIds);
    updateType7Row(item.id, "demoPlotId", firstPlotId || "");
    updateType7Row(item.id, "existingPlotId", firstPlotId || "");

    const matchedPlot =
      planPlots.find((p) => p.id === firstPlotId) ||
      plotList.find((p) => p.id === firstPlotId);

    if (matchedPlot) {
      updateType7Row(item.id, "existingPlotName", matchedPlot.name);
      updateType7Row(item.id, "plotName", matchedPlot.name);
      if (matchedPlot.ownerName)
        updateType7Row(item.id, "ownerName", matchedPlot.ownerName);
      if (matchedPlot.cropCategory)
        updateType7Row(item.id, "cropCategory", matchedPlot.cropCategory);
      if (matchedPlot.cropName)
        updateType7Row(item.id, "cropName", matchedPlot.cropName);
      if (matchedPlot.province)
        updateType7Row(item.id, "province", matchedPlot.province);
      if (matchedPlot.district)
        updateType7Row(item.id, "district", matchedPlot.district);
      if (matchedPlot.areaRai !== undefined)
        updateType7Row(item.id, "areaRai", matchedPlot.areaRai);
      if (matchedPlot.treeCount !== undefined)
        updateType7Row(item.id, "treeCount", matchedPlot.treeCount);
    }
  };

  // Plan change handler
  const handlePlanChange = (planId: string) => {
    updateType7Row(item.id, "selectedPlanId", planId);
    const targetPlan = effectiveFollowUpPlans.find((p) => p.planId === planId);
    if (!targetPlan || !targetPlan.plots || targetPlan.plots.length === 0) {
      syncPlotData("", []);
      return;
    }

    const uniquePlots = targetPlan.plots;
    if (uniquePlots.length === 1) {
      const singlePlot = uniquePlots[0];
      syncPlotData(singlePlot.id, [singlePlot.id]);
    } else {
      syncPlotData("", []);
    }
  };

  // Toggle single plot checkbox
  const handleTogglePlot = (plotId: string) => {
    let updated: string[];
    if (selectedPlotIds.includes(plotId)) {
      updated = selectedPlotIds.filter((id) => id !== plotId);
    } else {
      updated = [...selectedPlotIds, plotId];
    }
    syncPlotData(updated[0] || "", updated);
  };

  // Select all plots in current plan
  const handleSelectAllPlots = () => {
    if (planPlots.length === 0) return;
    const allIds = planPlots.map((p) => p.id);
    syncPlotData(allIds[0] || "", allIds);
  };

  // Deselect all plots in current plan
  const handleDeselectAllPlots = () => {
    syncPlotData("", []);
  };

  const withdrawnProducts: Type7bWithdrawnProductLine[] =
    item.withdrawnProducts || [];

  const handleToggleWithdrawal = (checked: boolean) => {
    updateType7Row(item.id, "hasProductWithdrawal", checked);
    if (
      checked &&
      (!item.withdrawnProducts || item.withdrawnProducts.length === 0)
    ) {
      updateType7Row(item.id, "withdrawnProducts", [
        {
          id: Date.now().toString(),
          productId: "",
          productName: "",
          quantity: 1,
          unit: "ขวด",
        },
      ]);
    }
  };

  const addWithdrawnProductRow = () => {
    const newRow: Type7bWithdrawnProductLine = {
      id: Date.now().toString(),
      productId: "",
      productName: "",
      quantity: 1,
      unit: "ขวด",
    };
    updateType7Row(item.id, "withdrawnProducts", [
      ...withdrawnProducts,
      newRow,
    ]);
  };

  const updateWithdrawnProductRow = (
    rowId: string,
    field: keyof Type7bWithdrawnProductLine,
    value: any,
    selectedProduct?: any,
  ) => {
    const updated = withdrawnProducts.map((p) => {
      if (p.id !== rowId) return p;
      if (field === "productId") {
        const matched =
          selectedProduct ||
          effectiveProducts.find(
            (prod) => prod.id === value || prod.name === value,
          );
        return {
          ...p,
          productId: matched?.id || value,
          productName: matched?.name || p.productName || "",
          unit: matched?.unit || p.unit || "ขวด",
        };
      }
      return { ...p, [field]: value };
    });
    updateType7Row(item.id, "withdrawnProducts", updated);
  };

  const deleteWithdrawnProductRow = (rowId: string) => {
    if (withdrawnProducts.length <= 1) {
      updateType7Row(item.id, "withdrawnProducts", [
        {
          id: Date.now().toString(),
          productId: "",
          productName: "",
          quantity: 1,
          unit: "ขวด",
        },
      ]);
      return;
    }
    const updated = withdrawnProducts.filter((p) => p.id !== rowId);
    updateType7Row(item.id, "withdrawnProducts", updated);
  };

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <Search className="h-4 w-4 text-emerald-600" />
          <span>ติดตามแปลงสาธิต (ตามแผน)</span>
        </div>
      </div>

      {/* 1. ส่วนเลือกแผนกิจกรรมทำแปลงสาธิตต้นทาง */}
      <div className="space-y-3">
        <ActivityCombobox
          label="เลือกแผนกิจกรรมทำแปลงสาธิตต้นทาง (ที่ยังไม่ปิดแปลง)"
          labelClassName="block text-xs font-semibold text-slate-800 mb-1 mx-0"
          value={item.selectedPlanId || selectedPlan?.planId || ""}
          onChange={(val) => handlePlanChange(val)}
          options={planOptions}
          placeholder={
            planOptions.length > 0
              ? "เลือกแผนกิจกรรมทำแปลงสาธิตต้นทาง..."
              : "ไม่พบแผนกิจกรรมทำแปลงสาธิตที่ยังไม่ปิดแปลง"
          }
          searchPlaceholder="ค้นหาแผนกิจกรรมทำแปลง (รหัส, ชื่อแผน, หรือชื่อแปลง)..."
          emptyText="ไม่พบแผนกิจกรรมทำแปลงสาธิตที่แปลงยังเปิดอยู่ (ยังไม่ปิดแปลง)"
          disabled={readonly}
          required
        />

        {/* 2. รายการแปลงย่อยในแผน (Multi-Select Checkbox List) */}
        {selectedPlan && planPlots.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <Info className="h-3.5 w-3.5 text-emerald-600" />
                  เลือกแปลงสาธิตที่ต้องการติดตาม
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
                  เลือกแล้ว {selectedPlotIds.length} / {planPlots.length} แปลง
                </span>
              </div>

              {!readonly && planPlots.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllPlots}
                    className="h-6 px-2 text-[11px] text-emerald-700 hover:text-emerald-800 border-emerald-300 hover:bg-emerald-50 cursor-pointer"
                  >
                    เลือกทั้งหมด
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAllPlots}
                    className="h-6 px-2 text-[11px] text-slate-600 hover:text-slate-800 border-slate-300 hover:bg-slate-100 cursor-pointer"
                  >
                    ยกเลิกทั้งหมด
                  </Button>
                </div>
              )}
            </div>

            {/* Validation warning if no plots selected */}
            {selectedPlotIds.length === 0 && (
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-1.5">
                <span>⚠️ กรุณาติ๊กเลือกแปลงที่ต้องการติดตามอย่างน้อย 1 แปลง</span>
              </div>
            )}

            {/* Plots Checkbox Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {planPlots.map((plot) => {
                const isSelected = selectedPlotIds.includes(plot.id);
                return (
                  <label
                    key={plot.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                      isSelected
                        ? "bg-emerald-50/70 border-emerald-300 shadow-2xs"
                        : "bg-slate-50/50 border-slate-200/90 hover:border-slate-300 opacity-80"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleTogglePlot(plot.id)}
                      disabled={readonly}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-bold text-slate-900 truncate">
                          {plot.name}
                        </span>
                        {plot.code && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] shrink-0">
                            {plot.code}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] text-slate-600">
                        <div>
                          <span className="text-slate-400">พืช: </span>
                          <span className="font-semibold text-slate-800">
                            {plot.cropName || "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">เจ้าของ: </span>
                          <span className="font-medium text-slate-700 truncate">
                            {plot.ownerName || "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">พื้นที่: </span>
                          <span className="text-slate-700">
                            {plot.areaRai
                              ? `${plot.areaRai} ไร่`
                              : plot.treeCount
                                ? `${plot.treeCount} ต้น`
                                : "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">จังหวัด: </span>
                          <span className="text-slate-700">
                            {[plot.province, plot.district].filter(Boolean).join(" / ") || "-"}
                          </span>
                        </div>
                      </div>
                      {plot.dealerName && (
                        <div className="text-[10.5px] text-slate-500 pt-0.5 border-t border-slate-100">
                          ร้าน Dealer: <span className="font-medium text-slate-700">{plot.dealerName}</span>
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. การเบิกสินค้าสำหรับรอบติดตามนี้ */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              id={`has-withdrawal-${item.id}`}
              checked={!!item.hasProductWithdrawal}
              onChange={(e) => handleToggleWithdrawal(e.target.checked)}
              disabled={readonly}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <PackageCheck className="h-4 w-4 text-emerald-600" />
              มีการเบิกสินค้า
            </span>
          </label>
          {item.hasProductWithdrawal && !readonly && (
            <Button
              type="button"
              size="sm"
              onClick={addWithdrawnProductRow}
              className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>เพิ่มสินค้าที่เบิก</span>
            </Button>
          )}
        </div>

        {item.hasProductWithdrawal && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <p className="text-[11px] text-slate-500">
              ระบุรายการสินค้าสาธิตและจำนวนที่ต้องการขอเบิกสำหรับงานติดตามแปลงครั้งนี้
            </p>
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-2 px-3 w-12 text-center font-semibold">ลำดับ</th>
                    <th className="py-2 px-3 font-semibold">
                      รายการสินค้า <span className="text-rose-500">*</span>
                    </th>
                    <th className="py-2 px-3 w-44 font-semibold text-center">
                      จำนวน <span className="text-rose-500">*</span>
                    </th>
                    {!readonly && (
                      <th className="py-2 px-3 w-12 text-center font-semibold">จัดการ</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {withdrawnProducts.length === 0 ? (
                    <tr>
                      <td colSpan={readonly ? 3 : 4} className="py-6 text-center text-slate-400 text-xs">
                        ยังไม่มีรายการสินค้า กดปุ่ม "เพิ่มสินค้าที่เบิก" เพื่อเริ่มต้น
                      </td>
                    </tr>
                  ) : (
                    withdrawnProducts.map((pLine, idx) => (
                      <tr key={pLine.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2 px-3 text-center font-medium text-slate-500 align-middle">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 align-middle">
                          <ActivityProductSelect
                            id={`withdrawn-prod-${item.id}-${pLine.id}`}
                            value={pLine.productId || ""}
                            valueKey="id"
                            onChange={(val, selected) =>
                              updateWithdrawnProductRow(pLine.id, "productId", val, selected)
                            }
                            products={effectiveProducts as any}
                            placeholder="เลือกสินค้าที่ต้องการเบิก..."
                            searchPlaceholder="ค้นหาสินค้า..."
                            emptyText="ไม่พบสินค้า"
                            disabled={readonly}
                          />
                        </td>
                        <td className="py-2 px-3 align-middle">
                          <div className="flex items-center gap-1.5 justify-center">
                            <ActivityInput
                              type="number"
                              min={1}
                              value={pLine.quantity ?? ""}
                              onChange={(e) => {
                                const val = Math.max(1, parseInt(e.target.value) || 1);
                                updateWithdrawnProductRow(pLine.id, "quantity", val);
                              }}
                              disabled={readonly}
                              placeholder="จำนวน"
                              className="w-20 text-center font-medium"
                            />
                            <ActivityInput
                              type="text"
                              value={pLine.unit || ""}
                              disabled={true}
                              placeholder="หน่วย"
                              className="w-16 text-center bg-slate-50"
                            />
                          </div>
                        </td>
                        {!readonly && (
                          <td className="py-2 px-3 text-center align-middle">
                            <button
                              type="button"
                              onClick={() => deleteWithdrawnProductRow(pLine.id)}
                              className="p-1 text-slate-400 hover:text-rose-500 transition-colors inline-flex items-center justify-center rounded cursor-pointer"
                              title="ลบแถวสินค้านี้"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 3. รายละเอียด / สิ่งที่ตั้งใจจะไปติดตาม */}
      <div>
        <ActivityTextarea
          label="สิ่งที่ตั้งใจจะไปติดตามรอบนี้"
          rows={2}
          value={item.detail || item.objective || ""}
          onChange={(e) => {
            updateType7Row(item.id, "detail", e.target.value);
            updateType7Row(item.id, "objective", e.target.value);
          }}
          disabled={readonly}
          placeholder="ระบุรายละเอียดหรือวัตถุประสงค์ในการลงพื้นที่ติดตามครั้งนี้..."
        />
      </div>
    </div>
  );
}

// Backward-compatible alias
export const Type7bPlanForm = Type7bPlannedForm;
export const Type7FollowUp = Type7bPlannedForm;
