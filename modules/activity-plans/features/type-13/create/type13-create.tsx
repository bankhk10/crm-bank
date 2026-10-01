"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Plus, Trash2, MapPin, Package, Store, AlertCircle, Info, Layers, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormCombobox } from "@/components/custom/form-components";
import type { Type13PlotItem, Type13WithdrawalItem, DealerOption, ProductOption } from "../shared/types";
import type { Type13CreateProps } from "./types";

export type { Type13CreateProps };

export function Type13Create({
  plots,
  onChange,
  dealers,
  products,
  readonly = false,
}: Type13CreateProps) {
  // Load thai addresses (provinces & districts)
  const [provincesData, setProvincesData] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadAddresses() {
      try {
        const res = await fetch("/api/thai-addresses");
        if (!res.ok) return;
        const json = await res.json();
        if (isMounted && Array.isArray(json)) {
          const normalized = json.map((p: any) => ({
            id: p.id,
            name: p.name_th,
            districts: (p.districts || []).map((d: any) => ({
              id: d.id,
              name: d.name_th,
            })),
          }));
          setProvincesData(normalized);
        }
      } catch (err) {
        console.error("Failed to load thai addresses:", err);
      }
    }
    loadAddresses();
    return () => {
      isMounted = false;
    };
  }, []);

  const provinceOptions = useMemo(() => {
    return provincesData.map((p) => ({
      value: p.name,
      label: p.name,
    }));
  }, [provincesData]);

  const dealerOptions = useMemo(() => {
    return dealers
      .filter((d) => !d.customerType || d.customerType === "DEALER" || d.customerType === "SUBDEALER")
      .map((d) => ({
        value: d.id,
        label: d.name,
        subLabel: [d.district, d.province].filter(Boolean).join(", ") || undefined,
      }));
  }, [dealers]);

  const productOptions = useMemo(() => {
    return products.map((p) => ({
      value: p.id,
      label: p.name,
      subLabel: p.unit ? `หน่วย: ${p.unit}` : p.productCode ? `รหัส: ${p.productCode}` : undefined,
    }));
  }, [products]);

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
      hasDrugWithdrawal: false,
      withdrawalItems: [],
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
  const handleUpdatePlot = (index: number, field: keyof Type13PlotItem, value: any) => {
    if (readonly) return;
    const updated = [...plots];
    const target = { ...updated[index], [field]: value };

    // Auto-fill province & district if dealer selected and dealer has location info
    if (field === "storeId" && value) {
      const selectedDealer = dealers.find((d) => d.id === value);
      if (selectedDealer) {
        if (selectedDealer.province && !target.province) {
          target.province = selectedDealer.province;
        }
        if (selectedDealer.district && !target.district) {
          target.district = selectedDealer.district;
        }
      }
    }

    if (field === "province") {
      target.district = ""; // Reset district when province changes
    }

    updated[index] = target;
    onChange(updated);
  };

  // Handler: Toggle Drug Withdrawal for a plot
  const handleToggleWithdrawal = (plotIndex: number, checked: boolean) => {
    if (readonly) return;
    const updated = [...plots];
    const plot = updated[plotIndex];
    let items = plot.withdrawalItems || [];

    if (checked && items.length === 0) {
      items = [
        {
          id: `w-${Date.now()}-1`,
          productId: "",
          productName: "",
          quantity: 1,
          unit: "",
          sortOrder: 0,
        },
      ];
    }

    updated[plotIndex] = {
      ...plot,
      hasDrugWithdrawal: checked,
      withdrawalItems: items,
    };
    onChange(updated);
  };

  // Handler: Add withdrawal item row to a plot
  const handleAddWithdrawalItem = (plotIndex: number) => {
    if (readonly) return;
    const updated = [...plots];
    const currentItems = updated[plotIndex].withdrawalItems || [];
    const newItem: Type13WithdrawalItem = {
      id: `w-${Date.now()}-${currentItems.length + 1}`,
      productId: "",
      productName: "",
      quantity: 1,
      unit: "",
      sortOrder: currentItems.length,
    };
    updated[plotIndex] = {
      ...updated[plotIndex],
      withdrawalItems: [...currentItems, newItem],
    };
    onChange(updated);
  };

  // Handler: Update withdrawal item row
  const handleUpdateWithdrawalItem = (
    plotIndex: number,
    itemIndex: number,
    field: keyof Type13WithdrawalItem,
    value: any,
  ) => {
    if (readonly) return;
    const updated = [...plots];
    const items = [...(updated[plotIndex].withdrawalItems || [])];
    const targetItem = { ...items[itemIndex], [field]: value };

    if (field === "productId" && value) {
      const matched = products.find((p) => p.id === value);
      if (matched) {
        targetItem.productName = matched.name;
        targetItem.unit = matched.unit || "";
      }
    }

    items[itemIndex] = targetItem;
    updated[plotIndex] = { ...updated[plotIndex], withdrawalItems: items };
    onChange(updated);
  };

  // Handler: Remove withdrawal item row
  const handleRemoveWithdrawalItem = (plotIndex: number, itemIndex: number) => {
    if (readonly) return;
    const updated = [...plots];
    const items = (updated[plotIndex].withdrawalItems || []).filter((_, idx) => idx !== itemIndex);
    updated[plotIndex] = {
      ...updated[plotIndex],
      withdrawalItems: items.length > 0 ? items : [
        {
          id: `w-${Date.now()}-1`,
          productId: "",
          productName: "",
          quantity: 1,
          unit: "",
          sortOrder: 0,
        },
      ],
    };
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
            ระบุรายละเอียดแปลงแฮตแทค ร้านค้า Dealer และการเบิกยาแยกตามแต่ละแปลง (สูงสุด 10 แปลง)
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
          const matchedProvince = provincesData.find((p) => p.name === plot.province);
          const districtOptions = (matchedProvince?.districts || []).map((d: any) => ({
            value: d.name,
            label: d.name,
          }));

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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* ร้านค้า Dealer */}
                <div>
                  <FormCombobox
                    id={`type13-dealer-${plotIdx}`}
                    label="ร้านค้า Dealer"
                    labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                    triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
                    value={plot.storeId || ""}
                    onChange={(val) => handleUpdatePlot(plotIdx, "storeId", val)}
                    options={dealerOptions}
                    placeholder="เลือกร้านค้า Dealer..."
                    searchPlaceholder="ค้นหาร้านค้า Dealer..."
                    emptyText="ไม่พบร้านค้า Dealer"
                    disabled={readonly}
                    required
                  />
                </div>

                {/* จังหวัด */}
                <div>
                  <FormCombobox
                    id={`type13-prov-${plotIdx}`}
                    label="จังหวัด"
                    labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                    triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
                    value={plot.province || ""}
                    onChange={(val) => handleUpdatePlot(plotIdx, "province", val)}
                    options={provinceOptions}
                    placeholder="เลือกจังหวัด..."
                    searchPlaceholder="ค้นหาจังหวัด..."
                    emptyText="ไม่พบจังหวัด"
                    disabled={readonly}
                    required
                  />
                </div>

                {/* อำเภอ */}
                <div>
                  <FormCombobox
                    id={`type13-dist-${plotIdx}`}
                    label="อำเภอ"
                    labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                    triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
                    value={plot.district || ""}
                    onChange={(val) => handleUpdatePlot(plotIdx, "district", val)}
                    options={districtOptions}
                    placeholder={plot.province ? "เลือกอำเภอ..." : "กรุณาเลือกจังหวัดก่อน"}
                    searchPlaceholder="ค้นหาอำเภอ..."
                    emptyText="ไม่พบอำเภอ"
                    disabled={readonly || !plot.province}
                    required
                  />
                </div>
              </div>

              {/* ── Drug Withdrawal Section Inside Each Plot ───────────── */}
              <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <Checkbox
                      checked={Boolean(plot.hasDrugWithdrawal)}
                      onCheckedChange={(checked) =>
                        handleToggleWithdrawal(plotIdx, Boolean(checked))
                      }
                      disabled={readonly}
                      className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                    />
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Pill className="w-4 h-4 text-emerald-600" />
                      <span>มีการเบิกยาสำหรับแปลงนี้</span>
                    </span>
                  </label>

                  {plot.hasDrugWithdrawal && !readonly && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleAddWithdrawalItem(plotIdx)}
                      className="h-7 px-2.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่มตัวยา</span>
                    </Button>
                  )}
                </div>

                {plot.hasDrugWithdrawal && (
                  <div className="space-y-2 pt-1">
                    {/* Header Row for MD+ */}
                    <div className="hidden sm:grid grid-cols-12 gap-2 px-3 py-1.5 bg-slate-100/80 rounded-lg text-[11px] font-bold text-slate-600">
                      <div className="col-span-1 text-center">#</div>
                      <div className="col-span-6">สินค้า (Product Master) *</div>
                      <div className="col-span-2 text-right">จำนวนที่เบิก *</div>
                      <div className="col-span-2 text-center">หน่วย</div>
                      <div className="col-span-1 text-center">ลบ</div>
                    </div>

                    {(plot.withdrawalItems || []).map((item, itemIdx) => (
                      <div
                        key={item.id || `w-${plotIdx}-${itemIdx}`}
                        className="grid grid-cols-12 gap-2 p-2 bg-slate-50/70 rounded-xl border border-slate-200/60 items-center"
                      >
                        <div className="col-span-1 text-center font-bold text-xs text-slate-400">
                          {itemIdx + 1}
                        </div>

                        {/* Product Master Combobox */}
                        <div className="col-span-6 sm:col-span-6">
                          <FormCombobox
                            id={`dw-prod-${plotIdx}-${itemIdx}`}
                            label=""
                            triggerClassName="h-8 min-h-[32px] py-0.5 text-xs bg-white border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
                            value={item.productId || ""}
                            onChange={(val) =>
                              handleUpdateWithdrawalItem(plotIdx, itemIdx, "productId", val)
                            }
                            options={productOptions}
                            placeholder="เลือกตัวยา/สินค้าจาก Master..."
                            searchPlaceholder="ค้นหาสินค้า..."
                            emptyText="ไม่พบสินค้า"
                            disabled={readonly}
                          />
                        </div>

                        {/* Quantity (decimal allowed) */}
                        <div className="col-span-3 sm:col-span-2">
                          <input
                            type="number"
                            step="any"
                            min={0.01}
                            value={item.quantity ?? ""}
                            onChange={(e) => {
                              const val = e.target.value === "" ? "" : parseFloat(e.target.value);
                              handleUpdateWithdrawalItem(plotIdx, itemIdx, "quantity", val);
                            }}
                            disabled={readonly}
                            placeholder="จำนวน"
                            className="w-full h-8 px-2 rounded-lg border border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                          />
                        </div>

                        {/* Unit (read-only auto-filled from Master) */}
                        <div className="col-span-2 sm:col-span-2 text-center text-xs text-slate-600 font-medium">
                          {item.unit || "-"}
                        </div>

                        {/* Remove button */}
                        {!readonly && (plot.withdrawalItems || []).length > 1 && (
                          <div className="col-span-1 flex justify-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveWithdrawalItem(plotIdx, itemIdx)}
                              className="p-1 text-slate-400 hover:text-rose-500 hover:bg-white rounded-md transition-colors"
                              title="ลบตัวยานี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
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

export default Type13Create;
