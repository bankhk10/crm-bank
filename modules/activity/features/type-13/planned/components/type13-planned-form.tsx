"use client";

import React, { useEffect } from "react";
import {
  Plus,
  Trash2,
  Layers,
  PackageCheck,
  MapPin,
  ExternalLink,
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
  Type13PlotItem,
  Type13WithdrawnProductLine,
} from "../../shared/types";
import type {
  Type13CreateProps,
  Type13PlanFormProps,
} from "../types/planned.types";

export type { Type13CreateProps, Type13PlanFormProps };

export function Type13PlannedForm({
  plots,
  onChange,
  dealers = [],
  products = [],
  readonly = false,
  hasProductWithdrawal,
  onToggleWithdrawal,
  withdrawnProducts,
  onWithdrawnProductsChange,
}: Type13PlanFormProps) {
  // Sync legacy global products into plot 0 if plots don't have per-plot withdrawal yet
  useEffect(() => {
    if (
      plots.length > 0 &&
      hasProductWithdrawal &&
      withdrawnProducts &&
      withdrawnProducts.length > 0 &&
      !plots.some((p) => p.hasProductWithdrawal)
    ) {
      const updated = [...plots];
      updated[0] = {
        ...updated[0],
        hasProductWithdrawal: true,
        withdrawnProducts: withdrawnProducts,
        products: withdrawnProducts,
      };
      onChange(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper to sync combined withdrawal to parent if parent props are provided
  const syncParentWithdrawal = (updatedPlots: Type13PlotItem[]) => {
    const anyWithdrawal = updatedPlots.some((p) => p.hasProductWithdrawal);
    const allWithdrawn = updatedPlots.flatMap((p) =>
      p.hasProductWithdrawal ? p.withdrawnProducts || [] : [],
    );
    if (onToggleWithdrawal) {
      onToggleWithdrawal(anyWithdrawal);
    }
    if (onWithdrawnProductsChange) {
      onWithdrawnProductsChange(allWithdrawn);
    }
  };

  // Handler: Toggle withdrawal per plot
  const handleTogglePlotWithdrawal = (plotIdx: number, checked: boolean) => {
    if (readonly) return;
    const updated = [...plots];
    const plot = updated[plotIdx];
    const currentList: Type13WithdrawnProductLine[] =
      plot.withdrawnProducts ||
      (plot.products || []).map((p, pIdx) => ({
        id: p.id || `withdrawn-${plotIdx}-${pIdx}`,
        productId: p.productId,
        productName: p.productName || "",
        quantity: Number(p.quantity) || 1,
        unit: p.unit || "ขวด",
      }));

    let newList = currentList;
    if (checked && currentList.length === 0) {
      newList = [
        {
          id: Date.now().toString(),
          productId: "",
          productName: "",
          quantity: 1,
          unit: "ขวด",
        },
      ];
    }

    updated[plotIdx] = {
      ...plot,
      hasProductWithdrawal: checked,
      withdrawnProducts: newList,
      products: newList,
    };

    onChange(updated);
    syncParentWithdrawal(updated);
  };

  // Handler: Add withdrawn product row to a specific plot
  const addPlotWithdrawnProductRow = (plotIdx: number) => {
    if (readonly) return;
    const updated = [...plots];
    const plot = updated[plotIdx];
    const currentList = plot.withdrawnProducts || [];

    const newLine: Type13WithdrawnProductLine = {
      id: Date.now().toString(),
      productId: "",
      productName: "",
      quantity: 1,
      unit: "ขวด",
    };

    const updatedList = [...currentList, newLine];
    updated[plotIdx] = {
      ...plot,
      withdrawnProducts: updatedList,
      products: updatedList,
    };

    onChange(updated);
    syncParentWithdrawal(updated);
  };

  // Handler: Update withdrawn product row for a specific plot
  const updatePlotWithdrawnProductRow = (
    plotIdx: number,
    rowId: string,
    field: keyof Type13WithdrawnProductLine,
    val: any,
    selectedProd?: any,
  ) => {
    if (readonly) return;
    const updated = [...plots];
    const plot = updated[plotIdx];
    const currentList = plot.withdrawnProducts || [];

    const updatedList = currentList.map((p) => {
      if (p.id !== rowId) return p;
      if (field === "productId") {
        const matched =
          selectedProd || products.find((prod) => prod.id === val);
        return {
          ...p,
          productId: val,
          productName: matched?.name || "",
          unit: matched?.unit || p.unit || "ขวด",
        };
      }
      return { ...p, [field]: val };
    });

    updated[plotIdx] = {
      ...plot,
      withdrawnProducts: updatedList,
      products: updatedList,
    };

    onChange(updated);
    syncParentWithdrawal(updated);
  };

  // Handler: Delete withdrawn product row from a specific plot
  const deletePlotWithdrawnProductRow = (plotIdx: number, rowId: string) => {
    if (readonly) return;
    const updated = [...plots];
    const plot = updated[plotIdx];
    const currentList = plot.withdrawnProducts || [];

    if (currentList.length <= 1) {
      const reset: Type13WithdrawnProductLine[] = [
        {
          id: Date.now().toString(),
          productId: "",
          productName: "",
          quantity: 1,
          unit: "ขวด",
        },
      ];
      updated[plotIdx] = {
        ...plot,
        withdrawnProducts: reset,
        products: reset,
      };
      onChange(updated);
      syncParentWithdrawal(updated);
      return;
    }

    const updatedList = currentList.filter((p) => p.id !== rowId);
    updated[plotIdx] = {
      ...plot,
      withdrawnProducts: updatedList,
      products: updatedList,
    };

    onChange(updated);
    syncParentWithdrawal(updated);
  };

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
      objective: "",
      hasProductWithdrawal: false,
      withdrawnProducts: [],
      products: [],
    };
    onChange([...plots, newPlot]);
  };

  // Handler: Delete plot (must have at least 1)
  const handleDeletePlot = (index: number) => {
    if (plots.length <= 1 || readonly) return;
    const updated = plots.filter((_, idx) => idx !== index);
    onChange(updated);
    syncParentWithdrawal(updated);
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
            ระบุรายละเอียดแปลงแฮตแทค ร้านค้า Dealer และการเบิกสินค้าในแต่ละแปลง
            (สูงสุด 10 แปลง)
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

              {/* Form Grid: ร้านค้า Dealer, ที่อยู่แปลง (จังหวัด, อำเภอ, ตำบล) */}
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-start">
                  {/* ร้านค้า Dealer */}
                  <div>
                    <ActivityCustomerSelect
                      id={`type13-dealer-${plotIdx}`}
                      type="STORE"
                      label="ร้านค้า Dealer"
                      value={plot.storeId || ""}
                      onChange={(val, cust) =>
                        handleUpdatePlot(plotIdx, "storeId", val, cust)
                      }
                      customers={dealers as any}
                      placeholder="เลือกร้านค้า Dealer..."
                      searchPlaceholder="ค้นหาร้านค้า Dealer..."
                      emptyText="ไม่พบร้านค้า Dealer"
                      disabled={readonly}
                      required
                    />
                  </div>

                  {/* ที่อยู่แปลง: จังหวัด, อำเภอ, ตำบล */}
                  <div className="md:col-span-2">
                    <ActivityAddressSelect
                      id={`type13-address-${plotIdx}`}
                      levels="province-district-subdistrict"
                      provinceLabel="จังหวัด"
                      districtLabel="อำเภอ"
                      subdistrictLabel="ตำบล"
                      value={{
                        province: plot.province || "",
                        district: plot.district || "",
                        subdistrict: plot.subdistrict || "",
                      }}
                      onChange={(val) => {
                        if (readonly) return;
                        const updated = [...plots];
                        updated[plotIdx] = {
                          ...updated[plotIdx],
                          province: val.province || "",
                          district: val.district || "",
                          subdistrict: val.subdistrict || "",
                        };
                        onChange(updated);
                      }}
                      disabled={readonly}
                      required
                    />
                  </div>
                </div>

                {/* แถวข้อมูลเพิ่มเติม: ช่องกรอก หมู่บ้าน & จำนวนแปลงที่ฉีด */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1 border-t border-slate-100">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      หมู่บ้าน
                    </label>
                    <ActivityInput
                      type="text"
                      placeholder="ระบุหมู่บ้าน เช่น บ้านหนองบัว หมู่ 3"
                      value={plot.village || ""}
                      onChange={(e) => {
                        if (readonly) return;
                        const updated = [...plots];
                        updated[plotIdx] = {
                          ...updated[plotIdx],
                          village: e.target.value,
                        };
                        onChange(updated);
                      }}
                      disabled={readonly}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      จำนวนแปลงที่ฉีดในหมู่บ้านนั้น (แปลง)
                      {plot.actualPlotsCount != null &&
                        plot.actualPlotsCount !== "" && (
                          <span className="ml-2 text-emerald-600 font-bold">
                            (ฉีดจริง: {plot.actualPlotsCount} แปลง)
                          </span>
                        )}
                    </label>
                    <ActivityInput
                      type="number"
                      min={1}
                      placeholder="เช่น 5"
                      value={plot.plannedPlotsCount ?? ""}
                      onChange={(e) => {
                        if (readonly) return;
                        const updated = [...plots];
                        const val =
                          e.target.value === "" ? "" : Number(e.target.value);
                        updated[plotIdx] = {
                          ...updated[plotIdx],
                          plannedPlotsCount: val,
                        };
                        onChange(updated);
                      }}
                      disabled={readonly}
                    />
                  </div>
                </div>

                {/* วัตถุประสงค์ (ไม่บังคับกรอก) */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    วัตถุประสงค์
                  </label>
                  <ActivityInput
                    type="text"
                    placeholder="ระบุวัตถุประสงค์ เช่น เพื่อทดสอบประสิทธิภาพสารกำจัดวัชพืช..."
                    value={plot.objective || ""}
                    onChange={(e) => {
                      if (readonly) return;
                      const updated = [...plots];
                      updated[plotIdx] = {
                        ...updated[plotIdx],
                        objective: e.target.value,
                      };
                      onChange(updated);
                    }}
                    disabled={readonly}
                  />
                </div>

                {/* พิกัดแปลงจริง (GPS Coordinates) ถ้ามี */}
                {(plot.latitude || plot.longitude) && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      พิกัดแปลง (GPS): {String(plot.latitude)},{" "}
                      {String(plot.longitude)}
                    </span>
                    <a
                      href={`https://maps.google.com/?q=${plot.latitude},${plot.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-600 hover:text-emerald-700 underline font-semibold ml-1 inline-flex items-center gap-0.5"
                    >
                      เปิดดูในแผนที่ <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* การเบิกสินค้าสำหรับแปลงนี้ (Product Withdrawal per Plot) */}
                <div className="bg-slate-50/70 p-3.5 sm:p-4 rounded-xl border border-slate-200/80 space-y-3 mt-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        id={`type13-plot-withdrawal-${plotIdx}`}
                        checked={!!plot.hasProductWithdrawal}
                        onChange={(e) =>
                          handleTogglePlotWithdrawal(plotIdx, e.target.checked)
                        }
                        disabled={readonly}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer"
                      />
                      <span className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <PackageCheck className="h-4 w-4 text-emerald-600" />
                        มีการเบิกสินค้า (แปลงที่ {plotIdx + 1})
                      </span>
                    </label>
                    {plot.hasProductWithdrawal && !readonly && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => addPlotWithdrawnProductRow(plotIdx)}
                        className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 transition-all"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>เพิ่มสินค้าที่เบิก</span>
                      </Button>
                    )}
                  </div>

                  {plot.hasProductWithdrawal && (
                    <div className="space-y-2 pt-2 border-t border-slate-200/60">
                      <p className="text-[11px] text-slate-500">
                        ระบุรายการสินค้าและจำนวนที่ต้องการขอเบิกสำหรับแปลงที่{" "}
                        {plotIdx + 1}
                      </p>
                      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                            <tr>
                              <th className="py-2.5 px-3 w-12 text-center font-semibold">
                                ลำดับ
                              </th>
                              <th className="py-2.5 px-3 font-semibold">
                                รายการสินค้า{" "}
                                <span className="text-red-500">*</span>
                              </th>
                              <th className="py-2.5 px-3 w-40 sm:w-48 font-semibold text-center">
                                จำนวน <span className="text-red-500">*</span>
                              </th>
                              <th className="py-2.5 px-3 w-40 sm:w-48 font-semibold text-center">
                                หน่วย <span className="text-red-500">*</span>
                              </th>
                              {!readonly && (
                                <th className="py-2.5 px-3 w-12 text-center font-semibold">
                                  จัดการ
                                </th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {!plot.withdrawnProducts ||
                            plot.withdrawnProducts.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={readonly ? 3 : 4}
                                  className="py-6 text-center text-slate-400 text-xs"
                                >
                                  ยังไม่มีรายการสินค้า กดปุ่ม
                                  &quot;เพิ่มสินค้าที่เบิก&quot; เพื่อเริ่มต้น
                                </td>
                              </tr>
                            ) : (
                              plot.withdrawnProducts.map((pLine, pIdx) => (
                                <tr
                                  key={pLine.id || pIdx}
                                  className="hover:bg-slate-50/50 transition-colors"
                                >
                                  {/* ลำดับ */}
                                  <td className="py-2 px-3 text-center font-medium text-slate-500 align-middle">
                                    {pIdx + 1}
                                  </td>

                                  {/* เลือกสินค้า */}
                                  <td className="py-2 px-3 align-middle">
                                    <ActivityProductSelect
                                      id={`type13-withdrawn-prod-${plotIdx}-${pLine.id}`}
                                      value={pLine.productId || ""}
                                      valueKey="id"
                                      onChange={(val, selectedProd) =>
                                        updatePlotWithdrawnProductRow(
                                          plotIdx,
                                          pLine.id,
                                          "productId",
                                          val,
                                          selectedProd,
                                        )
                                      }
                                      // กรองสินค้าที่ไม่ใช่ "กล่อง" ออกตรงนี้
                                      products={(products as any)?.filter(
                                        (p: any) => p.unit?.trim() !== "กล่อง",
                                      )}
                                      placeholder="เลือกสินค้าที่ต้องการเบิก..."
                                      searchPlaceholder="ค้นหาสินค้า..."
                                      emptyText="ไม่พบสินค้า"
                                      disabled={readonly}
                                    />
                                  </td>
                                  {/* จำนวน */}
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
                                          updatePlotWithdrawnProductRow(
                                            plotIdx,
                                            pLine.id,
                                            "quantity",
                                            val,
                                          );
                                        }}
                                        disabled={readonly}
                                        placeholder="จำนวน"
                                        className="w-30 h-8 px-2 rounded-lg border border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                                      />
                                    </div>
                                  </td>
                                  {/* หน่วย */}
                                  <td className="py-2 px-3 align-middle">
                                    <div className="flex items-center gap-1.5 justify-center">
                                      {" "}
                                      <input
                                        type="text"
                                        value={pLine.unit || ""}
                                        readOnly
                                        disabled={true}
                                        placeholder="หน่วย"
                                        className="w-16 h-8 px-2 rounded-lg border border-slate-200 text-xs text-slate-700 text-center bg-slate-50 cursor-not-allowed"
                                      />
                                    </div>
                                  </td>

                                  {/* จัดการ */}
                                  {!readonly && (
                                    <td className="py-2 px-3 text-center align-middle">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          deletePlotWithdrawnProductRow(
                                            plotIdx,
                                            pLine.id,
                                          )
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export {
  Type13PlannedForm as Type13PlanForm,
  Type13PlannedForm as Type13Create,
  Type13PlannedForm as Type13Edit,
};
