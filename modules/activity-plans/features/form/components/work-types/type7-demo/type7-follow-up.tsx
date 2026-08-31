"use client";

import React from "react";
import { Info } from "lucide-react";
import { FormCombobox } from "@/components/custom/form-components";
import type { Type7DemoPlotItem } from "@/modules/activity-plans/features/form/types";
import type { UserDemoPlotOption } from "@/modules/activity-plans/constants";

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
  readonly?: boolean;
}

export function Type7FollowUp({
  item,
  updateType7Row,
  existingPlotOptions,
  plotList,
  readonly = false,
}: Type7FollowUpProps) {
  // Find selected existing plot info for FOLLOW_UP read-only card
  const selectedPlot = plotList.find(
    (p) =>
      p.name === item.existingPlotName ||
      p.id === item.existingPlotId ||
      p.name === item.existingPlotId,
  );

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
            updateType7Row(item.id, "existingPlotName", match?.name || val);
            if (match) {
              if (match.ownerName)
                updateType7Row(item.id, "ownerName", match.ownerName);
              if (match.productName)
                updateType7Row(item.id, "productName", match.productName);
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
              <span className="font-semibold text-slate-500">เจ้าของแปลง: </span>
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
              <span className="font-semibold text-slate-500">สินค้าสาธิต: </span>
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

      {/* Details / Follow-up Notes */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          รายละเอียดเพิ่มเติม / สิ่งที่ตั้งใจจะไปติดตามรอบนี้
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
