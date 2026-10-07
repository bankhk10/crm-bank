"use client";

import React, { useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  Layers,
  PackageCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormCombobox } from "@/components/custom/FormCombobox";
import {
  ActivityCustomerSelect,
  type ActivityCustomerItem,
} from "@/components/activity/activity-customer-select";
import { ActivityAddressSelect } from "@/components/activity/activity-address-select";
import type {
  Type13PlotItem,
  Type13WithdrawnProductLine,
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
  hasProductWithdrawal,
  onToggleWithdrawal,
  withdrawnProducts,
  onWithdrawnProductsChange,
}: Type13CreateProps) {
  // Local state fallback if withdrawal props are unmanaged
  const [internalHasWithdrawal, setInternalHasWithdrawal] = useState(false);
  const [internalWithdrawnProducts, setInternalWithdrawnProducts] = useState<
    Type13WithdrawnProductLine[]
  >([]);

  const isWithdrawalActive =
    hasProductWithdrawal !== undefined
      ? hasProductWithdrawal
      : internalHasWithdrawal;
  const currentWithdrawnProducts =
    withdrawnProducts !== undefined
      ? withdrawnProducts
      : internalWithdrawnProducts;

  // Product withdrawal options
  const productOptions = useMemo(() => {
    return (products || []).map((p) => ({
      value: p.id,
      label: p.name,
      subLabel: p.productCode ? `รหัส: ${p.productCode}` : undefined,
    }));
  }, [products]);

  // Handler: Toggle withdrawal
  const handleToggleWithdrawal = (checked: boolean) => {
    if (onToggleWithdrawal) {
      onToggleWithdrawal(checked);
    } else {
      setInternalHasWithdrawal(checked);
    }

    if (
      checked &&
      (!currentWithdrawnProducts || currentWithdrawnProducts.length === 0)
    ) {
      const initialRow: Type13WithdrawnProductLine[] = [
        {
          id: Date.now().toString(),
          productId: "",
          productName: "",
          quantity: 1,
          unit: "ขวด",
        },
      ];
      if (onWithdrawnProductsChange) {
        onWithdrawnProductsChange(initialRow);
      } else {
        setInternalWithdrawnProducts(initialRow);
      }
    }
  };

  // Handler: Add withdrawn product row
  const addWithdrawnProductRow = () => {
    const newLine: Type13WithdrawnProductLine = {
      id: Date.now().toString(),
      productId: "",
      productName: "",
      quantity: 1,
      unit: "ขวด",
    };
    const updated = [...currentWithdrawnProducts, newLine];
    if (onWithdrawnProductsChange) {
      onWithdrawnProductsChange(updated);
    } else {
      setInternalWithdrawnProducts(updated);
    }
  };

  // Handler: Update withdrawn product row
  const updateWithdrawnProductRow = (
    rowId: string,
    field: keyof Type13WithdrawnProductLine,
    val: any,
  ) => {
    const updated = currentWithdrawnProducts.map((p) => {
      if (p.id !== rowId) return p;
      if (field === "productId") {
        const matched = products.find((prod) => prod.id === val);
        return {
          ...p,
          productId: val,
          productName: matched?.name || "",
          unit: matched?.unit || p.unit || "ขวด",
        };
      }
      return { ...p, [field]: val };
    });
    if (onWithdrawnProductsChange) {
      onWithdrawnProductsChange(updated);
    } else {
      setInternalWithdrawnProducts(updated);
    }
  };

  // Handler: Delete withdrawn product row
  const deleteWithdrawnProductRow = (rowId: string) => {
    if (currentWithdrawnProducts.length <= 1) {
      const reset: Type13WithdrawnProductLine[] = [
        {
          id: Date.now().toString(),
          productId: "",
          productName: "",
          quantity: 1,
          unit: "ขวด",
        },
      ];
      if (onWithdrawnProductsChange) {
        onWithdrawnProductsChange(reset);
      } else {
        setInternalWithdrawnProducts(reset);
      }
      return;
    }
    const updated = currentWithdrawnProducts.filter((p) => p.id !== rowId);
    if (onWithdrawnProductsChange) {
      onWithdrawnProductsChange(updated);
    } else {
      setInternalWithdrawnProducts(updated);
    }
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

      {/* การเบิกสินค้าสำหรับรอบฉีดแปลงแฮตแทค (TYPE_13 Product Withdrawal) */}
      <div className="bg-slate-50/70 p-3.5 sm:p-4 rounded-xl border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              id="type13-has-withdrawal"
              checked={!!isWithdrawalActive}
              onChange={(e) => handleToggleWithdrawal(e.target.checked)}
              disabled={readonly}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer"
            />
            <span className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <PackageCheck className="h-4 w-4 text-emerald-600" />
              มีการเบิกสินค้า
            </span>
          </label>
          {isWithdrawalActive && !readonly && (
            <Button
              type="button"
              size="sm"
              onClick={addWithdrawnProductRow}
              className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>เพิ่มสินค้าที่เบิก</span>
            </Button>
          )}
        </div>

        {isWithdrawalActive && (
          <div className="space-y-2 pt-2 border-t border-slate-200/60">
            <p className="text-[11px] text-slate-500">
              ระบุรายการสินค้าและจำนวนที่ต้องการขอเบิกสำหรับงานฉีดแปลงแฮตแทคครั้งนี้
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
                  {currentWithdrawnProducts.length === 0 ? (
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
                    currentWithdrawnProducts.map((pLine, idx) => (
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
                            id={`type13-withdrawn-prod-${pLine.id}`}
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
    </div>
  );
}

export default Type13Create;
