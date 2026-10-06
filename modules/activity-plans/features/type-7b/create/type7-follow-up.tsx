"use client";

import React, { useMemo } from "react";
import { Info, PackageCheck, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormCombobox } from "@/components/custom/form-components";
import type {
  Type7DemoPlotItem,
  Type7bWithdrawnProductLine,
} from "@/modules/activity-plans/features/shared/form/types";
import type { UserDemoPlotOption } from "@/modules/activity-plans/constants";
import { ActivityInput } from "@/components/activity/activity-input";
import type { ProductOption } from "../shared/types";
import type { Type7FollowUpProps } from "./types";

export type { ProductOption, Type7FollowUpProps };


export function Type7FollowUp({
  item,
  updateType7Row,
  existingPlotOptions,
  plotList,
  followUpPlans = [],
  products = [],
  readonly = false,
}: Type7FollowUpProps) {
  // 1. Resolve selected plan
  const selectedPlan = useMemo(() => {
    if (item.selectedPlanId) {
      return followUpPlans.find((p) => p.planId === item.selectedPlanId);
    }
    // Fallback resolution from selectedPlotIds or existingPlotId
    const targetPlotId =
      item.selectedPlotIds?.[0] || item.existingPlotId || item.demoPlotId;
    if (targetPlotId) {
      return followUpPlans.find((plan) =>
        plan.plots.some((pl) => pl.id === targetPlotId),
      );
    }
    return undefined;
  }, [item.selectedPlanId, item.selectedPlotIds, item.existingPlotId, item.demoPlotId, followUpPlans]);

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
    return followUpPlans.map((plan) => ({
      value: plan.planId,
      label: `[${plan.planCode || "แผน"}] ${plan.planTitle}${plan.planDate ? ` (${plan.planDate})` : ""}`,
      subLabel: `${plan.plots.length} แปลงสาธิต: ${plan.plots.map((p) => p.name).join(", ")}`,
    }));
  }, [followUpPlans]);

  // Sync plot details helper
  const syncPlotData = (firstPlotId: string, allPlotIds: string[]) => {
    updateType7Row(item.id, "selectedPlotIds", allPlotIds);
    updateType7Row(item.id, "demoPlotId", firstPlotId || "");
    updateType7Row(item.id, "existingPlotId", firstPlotId || "");

    const matchedPlot =
      selectedPlan?.plots.find((p) => p.id === firstPlotId) ||
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
    const targetPlan = followUpPlans.find((p) => p.planId === planId);
    if (!targetPlan || targetPlan.plots.length === 0) {
      syncPlotData("", []);
      return;
    }

    if (targetPlan.plots.length === 1) {
      // Auto-select single plot
      const singlePlot = targetPlan.plots[0];
      syncPlotData(singlePlot.id, [singlePlot.id]);
    } else {
      // Multiple plots: reset selection or let user select
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
    if (!selectedPlan) return;
    const allIds = selectedPlan.plots.map((p) => p.id);
    syncPlotData(allIds[0] || "", allIds);
  };

  // Deselect all plots in current plan
  const handleDeselectAllPlots = () => {
    syncPlotData("", []);
  };

  const productOptions = (products || []).map((p) => ({
    value: p.id,
    label: p.name,
    subLabel: p.productCode ? `รหัส: ${p.productCode}` : undefined,
  }));

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
  ) => {
    const updated = withdrawnProducts.map((p) => {
      if (p.id !== rowId) return p;
      if (field === "productId") {
        const matched = products?.find((prod) => prod.id === value);
        return {
          ...p,
          productId: value,
          productName: matched?.name || "",
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
    <div className="space-y-3.5 pt-1">
      {/* 1. ส่วนเลือกแผนกิจกรรมทำแปลงสาธิตต้นทาง */}
      <div className="space-y-3">
        <div>
          <FormCombobox
            id={`source-plan-combobox-${item.id}`}
            label="เลือกแผนกิจกรรมทำแปลงสาธิตต้นทาง (Approved & Completed)"
            labelClassName="block text-xs font-semibold text-slate-800 mb-1 mx-0"
            triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
            value={item.selectedPlanId || selectedPlan?.planId || ""}
            onChange={(val) => handlePlanChange(val)}
            options={planOptions}
            placeholder={
              planOptions.length > 0
                ? "เลือกแผนกิจกรรมทำแปลงสาธิตต้นทาง..."
                : "ไม่พบแผนกิจกรรมทำแปลงสาธิตที่ปฏิบัติงานแล้วเสร็จ"
            }
            searchPlaceholder="ค้นหาแผนกิจกรรมทำแปลง (รหัส หรือ ชื่อแผน)..."
            emptyText="ไม่พบแผนกิจกรรมทำแปลงสาธิตที่ตรงกับเงื่อนไข"
            disabled={readonly}
            required
          />
        </div>

        {/* 2. รายการแปลงย่อยในแผน (Multi-Select Checkbox List) */}
        {selectedPlan && selectedPlan.plots.length > 0 && (
          <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-3.5 space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <Info className="h-3.5 w-3.5 text-emerald-600" />
                  เลือกแปลงสาธิตที่ต้องการติดตาม
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
                  เลือกแล้ว {selectedPlotIds.length} / {selectedPlan.plots.length} แปลง
                </span>
              </div>

              {!readonly && selectedPlan.plots.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllPlots}
                    className="h-6 px-2 text-[11px] text-emerald-700 hover:text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                  >
                    เลือกทั้งหมด
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAllPlots}
                    className="h-6 px-2 text-[11px] text-slate-600 hover:text-slate-800 border-slate-300 hover:bg-slate-100"
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
              {selectedPlan.plots.map((plot) => {
                const isSelected = selectedPlotIds.includes(plot.id);
                return (
                  <label
                    key={plot.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                      isSelected
                        ? "bg-emerald-50/70 border-emerald-300 shadow-2xs"
                        : "bg-white border-slate-200/90 hover:border-slate-300 opacity-80"
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
                        <div className="text-[10.5px] text-slate-500 pt-0.5 border-t border-slate-200/50">
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

        {/* Fallback direct plot selection if no plan matches or legacy mode */}
        {!selectedPlan && existingPlotOptions.length > 0 && (
          <div className="pt-1">
            <FormCombobox
              id={`legacy-plot-combobox-${item.id}`}
              label="หรือเลือกจากรายชื่อแปลงสาธิตโดยตรง"
              labelClassName="block text-[11px] font-medium text-slate-600 mb-1 mx-0"
              triggerClassName="h-8 min-h-[32px] py-0.5 text-xs bg-white border-slate-200 rounded-lg text-slate-700"
              value={item.existingPlotName || item.existingPlotId || ""}
              onChange={(val) => {
                const match = plotList.find((p) => p.name === val || p.id === val);
                const pid = match?.id || val;
                syncPlotData(pid, pid ? [pid] : []);
              }}
              options={existingPlotOptions}
              placeholder="เลือกแปลงสาธิตโดยตรง..."
              searchPlaceholder="ค้นหาแปลงสาธิต..."
              emptyText="ไม่พบแปลงสาธิต"
              disabled={readonly}
            />
          </div>
        )}
      </div>

      {/* 2. การเบิกสินค้าสำหรับรอบติดตามนี้ (TYPE_7B Product Withdrawal) */}
      <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 space-y-2.5">
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
              className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>เพิ่มสินค้าที่เบิก</span>
            </Button>
          )}
        </div>

        {item.hasProductWithdrawal && (
          <div className="space-y-2 pt-2 border-t border-slate-200/60">
            <p className="text-[11px] text-slate-500">
              ระบุรายการสินค้าสาธิตและจำนวนที่ต้องการขอเบิกสำหรับงานติดตามแปลงครั้งนี้
            </p>
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center font-semibold">
                      ลำดับ
                    </th>
                    <th className="py-2.5 px-3 font-semibold">
                      รายการสินค้า <span className="text-red-500">*</span>
                    </th>
                    <th className="py-2.5 px-3 w-40 sm:w-48 font-semibold text-center">
                      จำนวน <span className="text-red-500">*</span>
                    </th>
                    {!readonly && (
                      <th className="py-2.5 px-3 w-12 text-center font-semibold">
                        จัดการ
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {withdrawnProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={readonly ? 3 : 4}
                        className="py-6 text-center text-slate-400 text-xs"
                      >
                        ยังไม่มีรายการสินค้า กดปุ่ม "เพิ่มสินค้าที่เบิก"
                        เพื่อเริ่มต้น
                      </td>
                    </tr>
                  ) : (
                    withdrawnProducts.map((pLine, idx) => (
                      <tr
                        key={pLine.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        {/* ลำดับ */}
                        <td className="py-2 px-3 text-center font-medium text-slate-500 align-middle">
                          {idx + 1}
                        </td>

                        {/* เลือกสินค้า */}
                        <td className="py-2 px-3 align-middle">
                          <FormCombobox
                            id={`withdrawn-prod-${item.id}-${pLine.id}`}
                            label=""
                            triggerClassName="h-8 min-h-[32px] py-0.5 text-xs bg-white border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500 w-full"
                            value={pLine.productId || ""}
                            onChange={(val) =>
                              updateWithdrawnProductRow(
                                pLine.id,
                                "productId",
                                val,
                              )
                            }
                            options={productOptions}
                            placeholder="เลือกสินค้าที่ต้องการเบิก..."
                            searchPlaceholder="ค้นหาสินค้า..."
                            emptyText="ไม่พบสินค้า"
                            disabled={readonly}
                          />
                        </td>

                        {/* จำนวนและหน่วย */}
                        <td className="py-2 px-3 align-middle">
                          <div className="flex items-center gap-1.5 justify-center">
                            <input
                              type="number"
                              min={1}
                              value={pLine.quantity ?? ""}
                              onChange={(e) => {
                                const val = Math.max(
                                  1,
                                  parseInt(e.target.value) || 1,
                                );
                                updateWithdrawnProductRow(
                                  pLine.id,
                                  "quantity",
                                  val,
                                );
                              }}
                              disabled={readonly}
                              placeholder="จำนวน"
                              className="w-20 h-8 px-2 rounded-lg border border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                            />
                            <input
                              type="text"
                              value={pLine.unit || ""}
                              onChange={(e) =>
                                updateWithdrawnProductRow(
                                  pLine.id,
                                  "unit",
                                  e.target.value,
                                )
                              }
                              disabled={true}
                              placeholder="หน่วย"
                              className="w-16 h-8 px-2 rounded-lg border border-slate-200 text-xs text-slate-700 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                            />
                          </div>
                        </td>

                        {/* จัดการ */}
                        {!readonly && (
                          <td className="py-2 px-3 text-center align-middle">
                            <button
                              type="button"
                              onClick={() =>
                                deleteWithdrawnProductRow(pLine.id)
                              }
                              className="p-1 text-slate-400 hover:text-red-500 transition-colors inline-flex items-center justify-center rounded"
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

      {/* Details / Follow-up Notes */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          สิ่งที่ตั้งใจจะไปติดตามรอบนี้
        </label>
        <textarea
          rows={2}
          value={item.detail || ""}
          onChange={(e) => updateType7Row(item.id, "detail", e.target.value)}
          disabled={readonly}
          placeholder="ระบุรายละเอียดหรือวัตถุประสงค์ในการลงพื้นที่ติดตามครั้งนี้..."
          className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
        />
      </div>
    </div>
  );
}
