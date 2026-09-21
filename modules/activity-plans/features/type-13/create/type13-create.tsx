"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Plus, Trash2, MapPin, Package, Store, AlertCircle, Info, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormCombobox } from "@/components/custom/form-components";
import type { Type13PlotItem, Type13ProductLine } from "../../../application/validations";

export interface Type13CreateProps {
  plots: Type13PlotItem[];
  onChange: (plots: Type13PlotItem[]) => void;
  dealers: Array<{ id: string; name: string; customerType?: string; province?: string | null; district?: string | null }>;
  products: Array<{ id: string; name: string; unit?: string | null; productCode?: string | null; price?: number | null; categoryId?: string | null }>;
  readonly?: boolean;
}

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
      name: `แปลงแฮตแทค ${nextPlotNumber}`,
      storeId: "",
      province: "",
      district: "",
      products: [
        {
          id: `p-${Date.now()}-1`,
          productId: "",
          productName: "",
          quantity: 1,
          unit: "",
        },
      ],
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

  // Handler: Add product line to plot
  const handleAddProductLine = (plotIndex: number) => {
    if (readonly) return;
    const updated = [...plots];
    const currentProducts = updated[plotIndex].products || [];
    const newLine: Type13ProductLine = {
      id: `p-${Date.now()}-${currentProducts.length + 1}`,
      productId: "",
      productName: "",
      quantity: 1,
      unit: "",
    };
    updated[plotIndex] = {
      ...updated[plotIndex],
      products: [...currentProducts, newLine],
    };
    onChange(updated);
  };

  // Handler: Update product line
  const handleUpdateProductLine = (
    plotIndex: number,
    prodIndex: number,
    field: keyof Type13ProductLine,
    value: any,
  ) => {
    if (readonly) return;
    const updated = [...plots];
    const prods = [...(updated[plotIndex].products || [])];
    const targetProd = { ...prods[prodIndex], [field]: value };

    if (field === "productId" && value) {
      const matched = products.find((p) => p.id === value);
      if (matched) {
        targetProd.productName = matched.name;
        targetProd.unit = matched.unit || "";
      }
    }

    prods[prodIndex] = targetProd;
    updated[plotIndex] = { ...updated[plotIndex], products: prods };
    onChange(updated);
  };

  // Handler: Remove product line
  const handleRemoveProductLine = (plotIndex: number, prodIndex: number) => {
    if (readonly) return;
    const updated = [...plots];
    const prods = (updated[plotIndex].products || []).filter((_, idx) => idx !== prodIndex);
    updated[plotIndex] = {
      ...updated[plotIndex],
      products: prods.length > 0 ? prods : [
        {
          id: `p-${Date.now()}-1`,
          productId: "",
          productName: "",
          quantity: 1,
          unit: "",
        },
      ],
    };
    onChange(updated);
  };

  // Computed Roll-up across all plots (Architecture Rule 3)
  const rollUpSummary = useMemo(() => {
    const map = new Map<string, { productId: string; productName: string; quantity: number; unit?: string }>();

    plots.forEach((plot) => {
      (plot.products || []).forEach((prod) => {
        if (!prod.productId && !prod.productName) return;
        const key = prod.productId || prod.productName || "unknown";
        const existing = map.get(key);
        const qty = Number(prod.quantity) || 0;
        if (existing) {
          existing.quantity += qty;
        } else {
          map.set(key, {
            productId: prod.productId,
            productName: prod.productName || "สินค้าไม่ระบุชื่อ",
            quantity: qty,
            unit: prod.unit || undefined,
          });
        }
      });
    });

    return Array.from(map.values());
  }, [plots]);

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
            ระบุรายละเอียดแปลงแฮตแทค ร้านค้า Dealer และรายการตัวยา/สินค้าที่ใช้ในแต่ละแปลง (สูงสุด 10 แปลง)
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
                      {plot.name || `แปลงที่ ${plotIdx + 1}`}
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

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                {/* ชื่อแปลง */}
                <div className="md:col-span-6">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อแปลง <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={plot.name}
                    onChange={(e) => handleUpdatePlot(plotIdx, "name", e.target.value)}
                    disabled={readonly}
                    placeholder="เช่น แปลงนายสมชาย หรือ แปลงทุเรียนโซน A"
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                {/* ร้านค้า Dealer */}
                <div className="md:col-span-6">
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
                <div className="md:col-span-6">
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
                <div className="md:col-span-6">
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

              {/* Products Table */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <h6 className="text-xs font-bold text-slate-800">
                      รายการตัวยา/สินค้าสำหรับแปลงนี้ <span className="text-red-500">*</span>
                    </h6>
                  </div>

                  {!readonly && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleAddProductLine(plotIdx)}
                      className="h-7 px-2 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่มตัวยา</span>
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  {(plot.products || []).map((prod, pIdx) => (
                    <div
                      key={prod.id || `p-${plotIdx}-${pIdx}`}
                      className="grid grid-cols-12 gap-2 p-2 bg-slate-50/70 rounded-xl border border-slate-200/60 items-center"
                    >
                      <div className="col-span-1 text-center font-bold text-xs text-slate-400">
                        {pIdx + 1}
                      </div>

                      <div className="col-span-6 sm:col-span-7">
                        <FormCombobox
                          id={`prod-combo-${plotIdx}-${pIdx}`}
                          label=""
                          triggerClassName="h-8 min-h-[32px] py-0.5 text-xs bg-white border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
                          value={prod.productId || ""}
                          onChange={(val) => handleUpdateProductLine(plotIdx, pIdx, "productId", val)}
                          options={productOptions}
                          placeholder="เลือกตัวยา/สินค้า..."
                          searchPlaceholder="ค้นหาสินค้า..."
                          emptyText="ไม่พบสินค้า"
                          disabled={readonly}
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-3 flex items-center gap-1.5">
                        <input
                          type="number"
                          min={1}
                          value={prod.quantity ?? ""}
                          onChange={(e) => {
                            const val = Math.max(1, parseInt(e.target.value) || 1);
                            handleUpdateProductLine(plotIdx, pIdx, "quantity", val);
                          }}
                          disabled={readonly}
                          placeholder="จำนวน"
                          className="w-full h-8 px-2 rounded-lg border border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                        />
                        {prod.unit && (
                          <span className="text-[11px] text-slate-500 whitespace-nowrap">
                            {prod.unit}
                          </span>
                        )}
                      </div>

                      {!readonly && (plot.products || []).length > 1 && (
                        <div className="col-span-1 flex justify-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveProductLine(plotIdx, pIdx)}
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
              </div>
            </div>
          );
        })}
      </div>

      {/* Roll-up Summary Card (Architecture Rule 3) */}
      <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-600" />
            <h5 className="font-bold text-slate-800 text-xs sm:text-sm">
              สรุปรายการสินค้ารวมทุกแปลง (Computed Roll-up)
            </h5>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            รวม {plots.length} แปลง
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>
            รายการสินค้านี้คำนวณอัตโนมัติจากทุกแปลง (Source of Truth คือสินค้าในแต่ละแปลง) ผู้ใช้ไม่สามารถแก้ไขตารางสรุปนี้โดยตรง
          </span>
        </div>

        {rollUpSummary.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-2">
            ยังไม่มีรายการสินค้าที่เลือก
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-medium">
                  <th className="py-2 px-3 w-12 text-center">ลำดับ</th>
                  <th className="py-2 px-3">ชื่อสินค้า/ตัวยา</th>
                  <th className="py-2 px-3 text-right">จำนวนรวม</th>
                  <th className="py-2 px-3 w-20">หน่วย</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rollUpSummary.map((item, idx) => (
                  <tr key={item.productId || idx} className="hover:bg-white/60">
                    <td className="py-2 px-3 text-center text-slate-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-700">
                      {item.productName}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-600">
                      {item.quantity.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-slate-500">
                      {item.unit || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Type13Create;
