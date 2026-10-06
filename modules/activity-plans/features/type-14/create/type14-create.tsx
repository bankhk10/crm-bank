"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Layers,
  Loader2,
  Store,
  MapPin,
  PackageCheck,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormCombobox } from "@/components/custom/FormCombobox";
import type {
  Type14PlanInput,
  DealerCustomerOption,
  ProductOption,
  Type14WithdrawnProductLine,
} from "../shared/types";
import { getHattackFollowUpDemoPlotsAction } from "../../../server/actions";
import type { Type14CreateProps } from "./types";

export type { Type14CreateProps };

export function Type14Create({
  value,
  onChange,
  dealerCustomers = [],
  products = [],
  defaultProvince = "",
  defaultDistrict = "",
  readonly = false,
}: Type14CreateProps) {
  const [existingPlots, setExistingPlots] = useState<any[]>([]);
  const [loadingPlots, setLoadingPlots] = useState(false);

  // Load existing Hattack demo plots strictly for TYPE_14
  useEffect(() => {
    let isMounted = true;
    async function loadHattackPlots() {
      setLoadingPlots(true);
      try {
        const res = await getHattackFollowUpDemoPlotsAction();
        if (isMounted) {
          if (res?.success && Array.isArray(res.demoPlots)) {
            setExistingPlots(res.demoPlots);
          } else {
            setExistingPlots([]);
          }
        }
      } catch (err) {
        console.error("Failed to load Hattack demo plots:", err);
        if (isMounted) {
          setExistingPlots([]);
        }
      } finally {
        if (isMounted) setLoadingPlots(false);
      }
    }
    loadHattackPlots();
    return () => {
      isMounted = false;
    };
  }, []);

  // FormCombobox options for selecting existing Hattack activity
  const plotComboboxOptions = useMemo(() => {
    const opts = existingPlots.map((plot) => ({
      value: plot.id,
      label: `ชื่อกิจกรรม: ${plot.activityName || plot.name}`,
      subLabel: "ฉีดแปลงแฮตแทค",
    }));
    if (value.demoPlotId && !opts.some((o) => o.value === value.demoPlotId)) {
      opts.unshift({
        value: value.demoPlotId,
        label: `ชื่อกิจกรรม: ${value.name || "แปลงแฮตแทค"}`,
        subLabel: "ฉีดแปลงแฮตแทค",
      });
    }
    return opts;
  }, [existingPlots, value.demoPlotId, value.name]);

  // Selected plot object for lookup
  const selectedPlot = useMemo(() => {
    return existingPlots.find((p) => p.id === value.demoPlotId);
  }, [existingPlots, value.demoPlotId]);

  // Display name for the Dealer customer
  const dealerDisplayName = useMemo(() => {
    if (!value.storeId && !selectedPlot) return "";
    const fromDealerList = dealerCustomers.find((d) => d.id === value.storeId);
    if (fromDealerList) return fromDealerList.name;
    return (
      selectedPlot?.dealerName ||
      selectedPlot?.customer?.name ||
      value.storeId ||
      ""
    );
  }, [dealerCustomers, value.storeId, selectedPlot]);

  // Select existing plot handler
  const handleSelectExistingPlot = (plotId: string) => {
    const selected = existingPlots.find((p) => p.id === plotId);
    if (!selected) {
      onChange({
        ...value,
        mode: "EXISTING_PLOT",
        demoPlotId: null,
        name: "",
        storeId: "",
        ownerName: "",
        province: "",
        district: "",
        latitude: "",
        longitude: "",
        trackings: [],
      });
      return;
    }

    onChange({
      ...value,
      mode: "EXISTING_PLOT",
      demoPlotId: selected.id,
      name: selected.name || selected.activityName || "แปลงแฮตแทค",
      storeId:
        selected.dealerId || selected.customerId || selected.customer?.id || "",
      ownerName: selected.ownerName || selected.farmerName || "",
      province: selected.province || defaultProvince || "",
      district: selected.district || defaultDistrict || "",
      latitude: "",
      longitude: "",
      trackings: [],
    });
  };

  // Product withdrawal options & state
  const productOptions = useMemo(() => {
    return (products || []).map((p) => ({
      value: p.id,
      label: p.name,
      subLabel: p.productCode ? `รหัส: ${p.productCode}` : undefined,
    }));
  }, [products]);

  const withdrawnProducts: Type14WithdrawnProductLine[] = useMemo(() => {
    return value.withdrawnProducts || [];
  }, [value.withdrawnProducts]);

  const handleToggleWithdrawal = (checked: boolean) => {
    const updated = {
      ...value,
      hasProductWithdrawal: checked,
    };
    if (
      checked &&
      (!value.withdrawnProducts || value.withdrawnProducts.length === 0)
    ) {
      updated.withdrawnProducts = [
        {
          id: Date.now().toString(),
          productId: "",
          productName: "",
          quantity: 1,
          unit: "ขวด",
        },
      ];
    }
    onChange(updated);
  };

  const addWithdrawnProductRow = () => {
    const newRow: Type14WithdrawnProductLine = {
      id: Date.now().toString(),
      productId: "",
      productName: "",
      quantity: 1,
      unit: "ขวด",
    };
    onChange({
      ...value,
      withdrawnProducts: [...withdrawnProducts, newRow],
    });
  };

  const updateWithdrawnProductRow = (
    rowId: string,
    field: keyof Type14WithdrawnProductLine,
    val: any,
  ) => {
    const updated = withdrawnProducts.map((p) => {
      if (p.id !== rowId) return p;
      if (field === "productId") {
        const matched = products?.find((prod) => prod.id === val);
        return {
          ...p,
          productId: val,
          productName: matched?.name || "",
          unit: matched?.unit || p.unit || "ขวด",
        };
      }
      return { ...p, [field]: val };
    });
    onChange({
      ...value,
      withdrawnProducts: updated,
    });
  };

  const deleteWithdrawnProductRow = (rowId: string) => {
    if (withdrawnProducts.length <= 1) {
      onChange({
        ...value,
        withdrawnProducts: [
          {
            id: Date.now().toString(),
            productId: "",
            productName: "",
            quantity: 1,
            unit: "ขวด",
          },
        ],
      });
      return;
    }
    const updated = withdrawnProducts.filter((p) => p.id !== rowId);
    onChange({
      ...value,
      withdrawnProducts: updated,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 space-y-6 shadow-xs">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
        <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
          14
        </div>
        <div>
          <h4 className="font-bold text-slate-800 text-sm sm:text-base">
            ติดตามแปลงแฮทแทค (TYPE_14)
          </h4>
          <p className="text-xs text-slate-500">
            เลือกกิจกรรมฉีดแปลงแฮตแทคต้นทางสำหรับติดตามผล
          </p>
        </div>
      </div>

      {/* Combobox: เลือกแปลงแฮตแทคเดิม */}
      <div className="space-y-4">
        <div>
          {loadingPlots ? (
            <div className="flex items-center gap-2 text-xs text-slate-500 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              <span>กำลังโหลดแปลงแฮตแทค...</span>
            </div>
          ) : (
            <FormCombobox
              id="type14-plot-combobox"
              label="เลือกแปลงแฮตแทคเดิม"
              required
              value={value.demoPlotId || ""}
              onChange={handleSelectExistingPlot}
              options={plotComboboxOptions}
              placeholder="เลือกแปลงแฮตแทคเดิม..."
              searchPlaceholder="ค้นหาแปลงแฮตแทคเดิม..."
              emptyText="ไม่พบแปลงแฮตแทคในรายการ"
              disabled={readonly}
              showSubLabelInTrigger={true}
              labelClassName="text-xs font-semibold text-slate-700 mb-1 mx-0"
              triggerClassName="h-auto min-h-[44px] py-1.5 text-xs bg-white border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-purple-500"
            />
          )}
        </div>

        {/* Read-Only Details: Dealer, Province, District */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Dealer Customer */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Store className="w-3.5 h-3.5 text-purple-600" />
              <span>ร้านค้าตัวแทนจำหน่าย (Dealer)</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              readOnly
              disabled
              value={dealerDisplayName}
              placeholder="แสดงตามข้อมูลกิจกรรมต้นทาง"
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-700 bg-slate-100/90 cursor-not-allowed font-medium"
            />
          </div>

          {/* Province */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-purple-600" />
              <span>จังหวัด</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              readOnly
              disabled
              value={value.province || ""}
              placeholder="แสดงตามข้อมูลกิจกรรมต้นทาง"
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-700 bg-slate-100/90 cursor-not-allowed font-medium"
            />
          </div>

          {/* District */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-purple-600" />
              <span>อำเภอ</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              readOnly
              disabled
              value={value.district || ""}
              placeholder="แสดงตามข้อมูลกิจกรรมต้นทาง"
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-700 bg-slate-100/90 cursor-not-allowed font-medium"
            />
          </div>
        </div>
      </div>

      {/* การเบิกสินค้าสำหรับรอบติดตามแปลงแฮทแทค (TYPE_14 Product Withdrawal) */}
      <div className="bg-slate-50/70 p-3.5 sm:p-4 rounded-xl border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              id="type14-has-withdrawal"
              checked={!!value.hasProductWithdrawal}
              onChange={(e) => handleToggleWithdrawal(e.target.checked)}
              disabled={readonly}
              className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 transition-all cursor-pointer"
            />
            <span className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <PackageCheck className="h-4 w-4 text-purple-600" />
              มีการเบิกสินค้า
            </span>
          </label>
          {value.hasProductWithdrawal && !readonly && (
            <Button
              type="button"
              size="sm"
              onClick={addWithdrawnProductRow}
              className="h-7 px-2.5 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-1 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>เพิ่มสินค้าที่เบิก</span>
            </Button>
          )}
        </div>

        {value.hasProductWithdrawal && (
          <div className="space-y-2 pt-2 border-t border-slate-200/60">
            <p className="text-[11px] text-slate-500">
              ระบุรายการสินค้าและจำนวนที่ต้องการขอเบิกสำหรับงานติดตามแปลงแฮทแทคครั้งนี้
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
                        ยังไม่มีรายการสินค้า กดปุ่ม &quot;เพิ่มสินค้าที่เบิก&quot; เพื่อเริ่มต้น
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
                            id={`type14-withdrawn-prod-${pLine.id}`}
                            label=""
                            triggerClassName="h-8 min-h-[32px] py-0.5 text-xs bg-white border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-purple-500 w-full"
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
                              className="w-20 h-8 px-2 rounded-lg border border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white font-medium"
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
                              onClick={() => deleteWithdrawnProductRow(pLine.id)}
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

export default Type14Create;
