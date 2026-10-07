"use client";

import React from "react";
import {
  Plus,
  Trash2,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ActivityCustomerSelect,
  type ActivityCustomerItem,
} from "@/components/activity/activity-customer-select";
import { ActivityAddressSelect } from "@/components/activity/activity-address-select";
import type {
  Type13PlotItem,
  DealerOption,
  ProductOption,
} from "../shared/types";
import type { Type13CreateProps } from "./types";

export type { Type13CreateProps };

export function Type13Create({
  plots,
  onChange,
  dealers,
  products,
  readonly = false,
}: Type13CreateProps) {
  // Handler: Add new plot (max 10)
  const handleAddPlot = () => {
    if (plots.length >= 10 || readonly) return;
    const nextPlotNumber = plots.length + 1;
    const newPlot: Type13PlotItem = {
      id: `temp-${Date.now()}-${nextPlotNumber}`,
      name: "",
      storeId: "",
      ownerName: "",
      province: "",
      district: "",
      products: [],
    };
    onChange([...plots, newPlot]);
  };

  // Handler: Delete plot (must have at least 1)
  const handleDeletePlot = (index: number) => {
    if (plots.length <= 1 || readonly) return;
    const updated = plots.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  // Handler: Update plot field
  const handleUpdatePlot = (
    index: number,
    field: keyof Type13PlotItem,
    value: any,
    customerItem?: ActivityCustomerItem,
  ) => {
    if (readonly) return;
    const updated = [...plots];
    const target = { ...updated[index], [field]: value };

    // Auto-fill ownerName, province & district if dealer selected and dealer has location info
    if (field === "storeId") {
      if (value) {
        const selectedDealer =
          customerItem || (dealers || []).find((d) => d.id === value);
        if (selectedDealer) {
          target.ownerName = selectedDealer.name || "";
          target.province = selectedDealer.province || "";
          target.district = selectedDealer.district || "";
        }
      } else {
        target.ownerName = "";
        target.province = "";
        target.district = "";
      }
    }

    if (field === "province") {
      target.district = ""; // Reset district when province changes
    }

    updated[index] = target;
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl border border-emerald-500/20">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            <h4 className="font-bold text-slate-800 text-sm sm:text-base">
              ข้อมูลแปลงแฮตแทค (TYPE_13)
            </h4>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              {plots.length}/10 แปลง
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ระบุรายละเอียดแปลงแฮตแทค และร้านค้า Dealer (สูงสุด 10 แปลง)
          </p>
        </div>

        {!readonly && (
          <Button
            type="button"
            size="sm"
            onClick={handleAddPlot}
            disabled={plots.length >= 10}
            className="h-9 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มแปลง ({plots.length}/10)</span>
          </Button>
        )}
      </div>

      {/* Plots List */}
      <div className="space-y-4">
        {plots.map((plot, plotIdx) => {
          return (
            <div
              key={plot.id || `plot-${plotIdx}`}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4 hover:border-emerald-200 transition-colors"
            >
              {/* Plot Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                    {plotIdx + 1}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 text-sm">
                      แปลงที่ {plotIdx + 1}
                    </h5>
                  </div>
                </div>

                {!readonly && plots.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePlot(plotIdx)}
                    className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">ลบแปลงนี้</span>
                  </Button>
                )}
              </div>

              {/* Form Grid: ร้านค้า Dealer, จังหวัด, อำเภอ */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-start">
                {/* ร้านค้า Dealer */}
                <div>
                  <ActivityCustomerSelect
                    id={`type13-dealer-${plotIdx}`}
                    type="STORE"
                    label="ร้านค้า Dealer"
                    labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                    triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
                    value={plot.storeId || ""}
                    onChange={(val, cust) =>
                      handleUpdatePlot(plotIdx, "storeId", val, cust)
                    }
                    customers={dealers}
                    placeholder="เลือกร้านค้า Dealer..."
                    searchPlaceholder="ค้นหาร้านค้า Dealer..."
                    emptyText="ไม่พบร้านค้า Dealer"
                    disabled={readonly}
                    required
                  />
                </div>

                {/* ที่อยู่แปลง: จังหวัด และ อำเภอ */}
                <div className="md:col-span-2">
                  <ActivityAddressSelect
                    id={`type13-address-${plotIdx}`}
                    levels="province-district"
                    districtLabel="อำเภอ"
                    labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                    triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
                    value={{
                      province: plot.province || "",
                      district: plot.district || "",
                    }}
                    onChange={(val) => {
                      if (readonly) return;
                      const updated = [...plots];
                      updated[plotIdx] = {
                        ...updated[plotIdx],
                        province: val.province || "",
                        district: val.district || "",
                      };
                      onChange(updated);
                    }}
                    disabled={readonly}
                    required
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Type13Create;
