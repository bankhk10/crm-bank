"use client";

import React from "react";
import { Info, PackageCheck, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormCombobox } from "@/components/custom/form-components";
import type {
  Type7DemoPlotItem,
  Type7bWithdrawnProductLine,
} from "@/modules/activity-plans/features/form/types";
import type { UserDemoPlotOption } from "@/modules/activity-plans/constants";
import type { ProductOption } from "@/modules/activity-plans/features/type-7a/create/type7-new-demo";
export type { ProductOption };

interface Type7FollowUpProps {
  item: Type7DemoPlotItem;
  updateType7Row: (
    id: string,
    field: keyof Type7DemoPlotItem,
    val: any,
  ) => void;
  existingPlotOptions: Array<{
    value: string;
    label: string;
    subLabel?: string;
  }>;
  plotList: UserDemoPlotOption[];
  products?: ProductOption[];
  readonly?: boolean;
}

export function Type7FollowUp({
  item,
  updateType7Row,
  existingPlotOptions,
  plotList,
  products = [],
  readonly = false,
}: Type7FollowUpProps) {
  // Find selected existing plot info for FOLLOW_UP read-only card
  const selectedPlot = plotList.find(
    (p) =>
      p.name === item.existingPlotName ||
      p.id === item.existingPlotId ||
      p.name === item.existingPlotId,
  );

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
      {/* Select Existing Plot */}
      <div>
        <FormCombobox
          id={`existing-plot-combobox-${item.id}`}
          label="แปลงสาธิตเดิมที่จะไปติดตาม"
          labelClassName="block text-xs font-medium text-slate-700 mb-1 mx-0"
          triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
          value={item.existingPlotName || item.existingPlotId || ""}
          onChange={(val) => {
            const match = plotList.find((p) => p.name === val || p.id === val);
            updateType7Row(item.id, "existingPlotId", match?.id || val);
            updateType7Row(item.id, "demoPlotId", match?.id || val);
            updateType7Row(item.id, "existingPlotName", match?.name || val);
            if (match) {
              if (match.ownerName)
                updateType7Row(item.id, "ownerName", match.ownerName);
              if (match.productName)
                updateType7Row(item.id, "productName", match.productName);
              if (match.productId)
                updateType7Row(item.id, "productId", match.productId);
              if (match.cropCategory)
                updateType7Row(item.id, "cropCategory", match.cropCategory);
              if (match.cropName)
                updateType7Row(
                  item.id,
                  "cropName",
                  match.targetCrop || match.cropName,
                );
              if (match.areaRai !== undefined)
                updateType7Row(item.id, "areaRai", match.areaRai);
              if (match.treeCount !== undefined)
                updateType7Row(item.id, "treeCount", match.treeCount);
            }
          }}
          options={existingPlotOptions}
          placeholder="เลือกแปลงสาธิตที่มีอยู่แล้ว..."
          searchPlaceholder="ค้นหาแปลงสาธิตเดิม..."
          emptyText="ยังไม่มีแปลงสาธิตเดิม"
          disabled={readonly}
          required
        />
      </div>

      {/* Read-Only Summary Card for Selected Plot */}
      {selectedPlot && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2.5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-emerald-600" />
              ข้อมูลแปลงสาธิตเดิม (Read-only)
            </span>
            <div className="flex items-center gap-1.5">
              {selectedPlot.code && (
                <span className="font-mono text-[10px] text-slate-500 font-semibold">
                  {selectedPlot.code}
                </span>
              )}
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
                {selectedPlot.status === "COMPLETED"
                  ? "ปิดแปลงแล้ว"
                  : selectedPlot.status === "FAILED"
                    ? "ยุติการทดลอง"
                    : "กำลังทดลอง"}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-slate-700">
            <div>
              <span className="font-semibold text-slate-500">
                เจ้าของแปลง:{" "}
              </span>
              <span className="font-bold text-slate-800">
                {selectedPlot.ownerName || "-"}
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-500">พืช: </span>
              <span className="font-bold text-slate-800">
                {selectedPlot.targetCrop || selectedPlot.cropName || "-"}
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-500">
                สินค้าสาธิต:{" "}
              </span>
              <span className="font-bold text-emerald-800">
                {selectedPlot.showcase || selectedPlot.productName || "-"}
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-500">
                พื้นที่ / จำนวน:{" "}
              </span>
              <span className="font-bold text-slate-800">
                {(() => {
                  const cat = selectedPlot.cropCategory || "";
                  const isRai = ["พืชไร่", "ผักและพืชล้มลุก"].includes(cat);
                  if (isRai) {
                    return selectedPlot.areaRai
                      ? `${selectedPlot.areaRai} ไร่`
                      : "-";
                  }
                  return selectedPlot.treeCount
                    ? `${selectedPlot.treeCount} ต้น`
                    : "-";
                })()}
              </span>
            </div>
          </div>

          {(selectedPlot.objective || selectedPlot.experimentDetail) && (
            <div className="pt-1.5 border-t border-slate-200/50 space-y-1 text-[11px] text-slate-600">
              {selectedPlot.objective && (
                <div>
                  <span className="font-semibold text-slate-500">
                    วัตถุประสงค์:{" "}
                  </span>
                  <span>{selectedPlot.objective}</span>
                </div>
              )}
              {selectedPlot.experimentDetail && (
                <div>
                  <span className="font-semibold text-slate-500">
                    วิธีการทดลอง:{" "}
                  </span>
                  <span>{selectedPlot.experimentDetail}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
            <div className="space-y-1.5">
              {withdrawnProducts.map((pLine, idx) => (
                <div
                  key={pLine.id}
                  className="grid grid-cols-12 gap-2 p-2 bg-white rounded-lg border border-slate-200 items-center shadow-2xs"
                >
                  <div className="col-span-1 text-center font-bold text-xs text-slate-500">
                    {idx + 1}
                  </div>

                  <div className="col-span-6 sm:col-span-6">
                    <FormCombobox
                      id={`withdrawn-prod-${item.id}-${pLine.id}`}
                      label=""
                      triggerClassName="h-8 min-h-[32px] py-0.5 text-xs bg-white border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
                      value={pLine.productId || ""}
                      onChange={(val) =>
                        updateWithdrawnProductRow(pLine.id, "productId", val)
                      }
                      options={productOptions}
                      placeholder="เลือกสินค้าที่ต้องการเบิก..."
                      searchPlaceholder="ค้นหาสินค้า..."
                      emptyText="ไม่พบสินค้า"
                      disabled={readonly}
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-4 flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      value={pLine.quantity ?? ""}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        updateWithdrawnProductRow(pLine.id, "quantity", val);
                      }}
                      disabled={readonly}
                      placeholder="จำนวน"
                      className="w-full h-8 px-2 rounded-lg border border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
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
                      disabled={readonly}
                      placeholder="หน่วย"
                      className="w-16 h-8 px-2 rounded-lg border border-slate-200 text-xs text-slate-700 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>

                  <div className="col-span-1 text-right">
                    {!readonly && (
                      <button
                        type="button"
                        onClick={() => deleteWithdrawnProductRow(pLine.id)}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        title="ลบแถวสินค้านี้"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
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
