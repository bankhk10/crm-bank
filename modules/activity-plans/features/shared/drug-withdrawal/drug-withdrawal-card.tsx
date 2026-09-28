"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Pill,
  Plus,
  Trash2,
  Package,
  Layers,
  AlertCircle,
  Info,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FormCombobox } from "@/components/custom/FormCombobox";
import { cn } from "@/lib/utils";
import type {
  DrugWithdrawalCardProps,
  DrugWithdrawalPlotGroupState,
  DrugWithdrawalItemRowState,
} from "./types";
import {
  groupItemsIntoPlots,
  flattenPlotsToItems,
  generateClientKey,
} from "./utils";
import { validateDrugWithdrawal } from "../../../application/validations";

export function DrugWithdrawalCard({
  value,
  onChange,
  availablePlots = [],
  products = [],
  workTypeCode,
  editable = true,
  disabled = false,
  allowCustomPlot = true,
  errors,
  className,
}: DrugWithdrawalCardProps) {
  const isReadOnly = !editable || disabled;

  // Local state for plot groups to maintain responsive editing (e.g. typing decimals)
  const [plotGroups, setPlotGroups] = useState<DrugWithdrawalPlotGroupState[]>(
    () => groupItemsIntoPlots(value?.items, availablePlots),
  );

  // Sync internal state when parent value.items changes externally
  useEffect(() => {
    if (value?.items) {
      setPlotGroups(groupItemsIntoPlots(value.items, availablePlots));
    }
  }, [value?.items, availablePlots]);

  // Product options formatted for FormCombobox
  const productOptions = useMemo(() => {
    return products.map((p) => ({
      value: p.id,
      label: p.name,
      subLabel: [
        p.productCode ? `รหัส: ${p.productCode}` : null,
        p.unit ? `หน่วย: ${p.unit}` : null,
      ]
        .filter(Boolean)
        .join(" | ") || undefined,
    }));
  }, [products]);

  // Plot options formatted for FormCombobox (if available)
  const plotComboboxOptions = useMemo(() => {
    return availablePlots.map((p) => ({
      value: p.id,
      label: p.name,
      subLabel: p.subLabel,
    }));
  }, [availablePlots]);

  // Handler: Emit updated state to parent
  const emitChange = useCallback(
    (newHasWithdrawal: boolean, newPlots: DrugWithdrawalPlotGroupState[]) => {
      const flatItems = flattenPlotsToItems(newPlots);
      onChange({
        ...value,
        hasDrugWithdrawal: newHasWithdrawal,
        items: newHasWithdrawal ? flatItems : [],
      });
    },
    [onChange, value],
  );

  // Handler: Toggle "มีการเบิกยา"
  const handleToggleWithdrawal = (checked: boolean) => {
    if (isReadOnly) return;
    if (checked && plotGroups.length === 0) {
      const initialGroups = groupItemsIntoPlots([], availablePlots);
      setPlotGroups(initialGroups);
      emitChange(true, initialGroups);
    } else {
      emitChange(checked, plotGroups);
    }
  };

  // Handler: Add new plot
  const handleAddPlot = () => {
    if (isReadOnly) return;
    const nextPlotIndex = plotGroups.length + 1;
    const defaultName = `แปลงที่ ${nextPlotIndex}`;
    const newPlot: DrugWithdrawalPlotGroupState = {
      key: generateClientKey("plot"),
      plotIdentifier: defaultName,
      demoPlotId: null,
      items: [
        {
          key: generateClientKey("item"),
          productId: "",
          productName: "",
          quantity: 1,
          unit: "",
          sortOrder: 0,
        },
      ],
    };

    const updated = [...plotGroups, newPlot];
    setPlotGroups(updated);
    emitChange(true, updated);
  };

  // Handler: Delete plot
  const handleDeletePlot = (plotIndex: number) => {
    if (isReadOnly) return;
    if (plotGroups.length <= 1) {
      // If deleting the only plot, reset it to an empty default
      const resetPlot: DrugWithdrawalPlotGroupState = {
        key: generateClientKey("plot"),
        plotIdentifier: "แปลงที่ 1",
        demoPlotId: null,
        items: [
          {
            key: generateClientKey("item"),
            productId: "",
            productName: "",
            quantity: 1,
            unit: "",
            sortOrder: 0,
          },
        ],
      };
      setPlotGroups([resetPlot]);
      emitChange(true, [resetPlot]);
      return;
    }

    const updated = plotGroups.filter((_, idx) => idx !== plotIndex);
    setPlotGroups(updated);
    emitChange(true, updated);
  };

  // Handler: Update plot selection / identifier
  const handleUpdatePlotIdentifier = (plotIndex: number, selectedIdOrName: string) => {
    if (isReadOnly) return;
    const updated = [...plotGroups];
    const matchedPlot = availablePlots.find(
      (p) =>
        p.id === selectedIdOrName ||
        p.name === selectedIdOrName ||
        p.plotIdentifier === selectedIdOrName,
    );

    if (matchedPlot) {
      updated[plotIndex] = {
        ...updated[plotIndex],
        plotIdentifier: matchedPlot.plotIdentifier || matchedPlot.name,
        demoPlotId: matchedPlot.demoPlotId ?? null,
      };
    } else {
      updated[plotIndex] = {
        ...updated[plotIndex],
        plotIdentifier: selectedIdOrName,
        demoPlotId: null,
      };
    }

    setPlotGroups(updated);
    emitChange(true, updated);
  };

  // Handler: Add product line to a specific plot
  const handleAddProduct = (plotIndex: number) => {
    if (isReadOnly) return;
    const updated = [...plotGroups];
    const currentItems = updated[plotIndex].items || [];
    const newItem: DrugWithdrawalItemRowState = {
      key: generateClientKey("item"),
      productId: "",
      productName: "",
      quantity: 1,
      unit: "",
      sortOrder: currentItems.length,
    };

    updated[plotIndex] = {
      ...updated[plotIndex],
      items: [...currentItems, newItem],
    };

    setPlotGroups(updated);
    emitChange(true, updated);
  };

  // Handler: Update product line in a plot
  const handleUpdateProduct = (
    plotIndex: number,
    itemIndex: number,
    field: "productId" | "quantity",
    newVal: any,
  ) => {
    if (isReadOnly) return;
    const updated = [...plotGroups];
    const currentItems = [...updated[plotIndex].items];
    const targetItem = { ...currentItems[itemIndex] };

    if (field === "productId") {
      targetItem.productId = newVal;
      const matched = products.find((p) => p.id === newVal);
      if (matched) {
        targetItem.productName = matched.name;
        targetItem.unit = matched.unit || "-";
      } else {
        targetItem.productName = "";
        targetItem.unit = "";
      }
    } else if (field === "quantity") {
      targetItem.quantity = newVal;
    }

    currentItems[itemIndex] = targetItem;
    updated[plotIndex] = {
      ...updated[plotIndex],
      items: currentItems,
    };

    setPlotGroups(updated);
    emitChange(true, updated);
  };

  // Handler: Delete product line from a plot
  const handleDeleteProduct = (plotIndex: number, itemIndex: number) => {
    if (isReadOnly) return;
    const updated = [...plotGroups];
    const currentItems = updated[plotIndex].items.filter((_, idx) => idx !== itemIndex);

    updated[plotIndex] = {
      ...updated[plotIndex],
      items:
        currentItems.length > 0
          ? currentItems
          : [
              {
                key: generateClientKey("item"),
                productId: "",
                productName: "",
                quantity: 1,
                unit: "",
                sortOrder: 0,
              },
            ],
    };

    setPlotGroups(updated);
    emitChange(true, updated);
  };

  // Compute total product items count
  const totalItemCount = useMemo(() => {
    return plotGroups.reduce((acc, plot) => acc + (plot.items?.length || 0), 0);
  }, [plotGroups]);

  // Evaluate inline validation messages
  const validationResult = useMemo(() => {
    if (!value?.hasDrugWithdrawal) return { isValid: true, errors: [] };
    return validateDrugWithdrawal(value, workTypeCode);
  }, [value, workTypeCode]);

  // Normalized error strings
  const errorMessages: string[] = useMemo(() => {
    if (Array.isArray(errors)) {
      return errors.map((e) => e.message);
    }
    if (errors && typeof errors === "object") {
      return Object.values(errors);
    }
    return !validationResult.isValid ? validationResult.errors : [];
  }, [errors, validationResult]);

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden transition-all",
        className,
      )}
    >
      {/* ── Section Header ────────────────────────────────────────── */}
      <div className="bg-slate-900 px-5 py-4 flex flex-wrap items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
            <Pill className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-bold tracking-wide">
              การเบิกยา (Drug Withdrawal)
            </h3>
            <p className="text-xs text-slate-400">
              บันทึกรายการตัวยาและเคมีภัณฑ์ที่ขอเบิกสำหรับแปลงสาธิต / แฮตแทค
            </p>
          </div>
        </div>

        {/* Checkbox Toggle */}
        <div className="flex items-center gap-2.5 bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-700">
          <Checkbox
            id="has-drug-withdrawal-toggle"
            checked={Boolean(value?.hasDrugWithdrawal)}
            onCheckedChange={(checked) => handleToggleWithdrawal(Boolean(checked))}
            disabled={isReadOnly}
            className="border-slate-400 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
          />
          <label
            htmlFor="has-drug-withdrawal-toggle"
            className={cn(
              "text-xs sm:text-sm font-semibold select-none cursor-pointer",
              value?.hasDrugWithdrawal ? "text-emerald-400" : "text-slate-300",
              isReadOnly && "cursor-not-allowed opacity-70",
            )}
          >
            มีการเบิกยา
          </label>
        </div>
      </div>

      {/* ── Collapsible Body ──────────────────────────────────────── */}
      {value?.hasDrugWithdrawal && (
        <div className="p-4 sm:p-6 space-y-6">
          {/* Information Notice */}
          <div className="flex items-start gap-2.5 p-3 sm:p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-emerald-900 text-xs sm:text-sm leading-relaxed">
            <Info className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold">ข้อกำหนดการเบิกยา:</span>{" "}
              ระบุรายการตัวยา/สารเคมีที่ต้องการขอเบิก โดยเลือกตามแปลงที่ใช้งาน
              สินค้าจะถูกดึงจาก Product Master และแสดงหน่วยนับอัตโนมัติ (อนุญาตระบุจำนวนทศนิยมได้)
            </div>
          </div>

          {/* Error Message Box */}
          {errorMessages.length > 0 && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs sm:text-sm space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-rose-900">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>กรุณาตรวจสอบข้อมูลการเบิกยา:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 pl-1 text-rose-700">
                {errorMessages.map((msg, idx) => (
                  <li key={idx}>{msg}</li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Plots List ─────────────────────────────────────────── */}
          <div className="space-y-5">
            {plotGroups.map((plot, plotIdx) => (
              <div
                key={plot.key}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-4 shadow-2xs"
              >
                {/* Plot Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <span className="p-1 bg-emerald-100 text-emerald-700 rounded-md">
                      <Layers className="w-4 h-4" />
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                      แปลงที่ {plotIdx + 1}
                    </h4>
                  </div>

                  {/* Remove Plot Button */}
                  {!isReadOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePlot(plotIdx)}
                      className="h-8 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ลบแปลง</span>
                    </Button>
                  )}
                </div>

                {/* Plot Selector / Input */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-3 text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <span>แปลง</span>
                    <span className="text-rose-500">*</span>
                  </div>

                  <div className="md:col-span-9">
                    {availablePlots.length > 0 ? (
                      <FormCombobox
                        id={`plot-select-${plotIdx}`}
                        label=""
                        value={plot.demoPlotId || plot.plotIdentifier}
                        onChange={(val) => handleUpdatePlotIdentifier(plotIdx, val)}
                        options={plotComboboxOptions}
                        placeholder="เลือกแปลงที่ต้องการเบิกยา..."
                        searchPlaceholder="ค้นหาแปลง..."
                        emptyText="ไม่พบแปลงในรายการ"
                        disabled={isReadOnly}
                        triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
                      />
                    ) : allowCustomPlot ? (
                      <input
                        type="text"
                        value={plot.plotIdentifier}
                        onChange={(e) => handleUpdatePlotIdentifier(plotIdx, e.target.value)}
                        placeholder="ระบุชื่อแปลงหรือหมายเลขแปลง (เช่น แปลง A, แปลงสาธิต 1)..."
                        disabled={isReadOnly}
                        className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    ) : (
                      <div className="text-xs text-slate-500 italic">
                        ยังไม่มีข้อมูลแปลงที่พร้อมเลือก
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Products Table / List ───────────────────────── */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-700">
                        รายการสินค้า / ตัวยาสำหรับแปลงนี้ <span className="text-rose-500">*</span>
                      </span>
                    </div>

                    {!isReadOnly && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleAddProduct(plotIdx)}
                        className="h-7 px-2.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg flex items-center gap-1 shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>เพิ่มสินค้า</span>
                      </Button>
                    )}
                  </div>

                  {/* Header Row for MD+ screens */}
                  <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-1.5 bg-slate-200/60 rounded-lg text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <div className="col-span-1 text-center">#</div>
                    <div className="col-span-6">สินค้า (Product Master)</div>
                    <div className="col-span-2 text-right">จำนวนที่เบิก</div>
                    <div className="col-span-2 text-center">หน่วย</div>
                    <div className="col-span-1 text-center">ลบ</div>
                  </div>

                  {/* Product Rows */}
                  <div className="space-y-2">
                    {plot.items.map((item, itemIdx) => (
                      <div
                        key={item.key}
                        className="grid grid-cols-1 md:grid-cols-12 gap-2.5 p-2.5 bg-white rounded-xl border border-slate-200/80 items-center shadow-2xs"
                      >
                        {/* Number */}
                        <div className="hidden md:block col-span-1 text-center font-bold text-xs text-slate-400">
                          {itemIdx + 1}
                        </div>

                        {/* Product Master Combobox */}
                        <div className="col-span-1 md:col-span-6">
                          <label className="block md:hidden text-[11px] font-semibold text-slate-600 mb-1">
                            สินค้า (Product Master) <span className="text-rose-500">*</span>
                          </label>
                          <FormCombobox
                            id={`prod-select-${plotIdx}-${itemIdx}`}
                            label=""
                            value={item.productId || ""}
                            onChange={(val) => handleUpdateProduct(plotIdx, itemIdx, "productId", val)}
                            options={productOptions}
                            placeholder="เลือกตัวยา/สินค้าจาก Master..."
                            searchPlaceholder="ค้นหาชื่อหรือรหัสสินค้า..."
                            emptyText="ไม่พบสินค้าในระบบ"
                            disabled={isReadOnly}
                            triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        {/* Quantity Input */}
                        <div className="col-span-1 md:col-span-2">
                          <label className="block md:hidden text-[11px] font-semibold text-slate-600 mb-1">
                            จำนวนที่เบิก <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0.01"
                            value={item.quantity ?? ""}
                            onChange={(e) =>
                              handleUpdateProduct(plotIdx, itemIdx, "quantity", e.target.value)
                            }
                            placeholder="ระบุจำนวน (เช่น 5.5)"
                            disabled={isReadOnly}
                            className="w-full h-9 px-3 text-xs md:text-right bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                          />
                        </div>

                        {/* Read-Only Unit Display */}
                        <div className="col-span-1 md:col-span-2">
                          <label className="block md:hidden text-[11px] font-semibold text-slate-600 mb-1">
                            หน่วย (จาก Master)
                          </label>
                          <div className="h-9 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center justify-center text-center">
                            {item.unit || "-"}
                          </div>
                        </div>

                        {/* Delete Row Button */}
                        <div className="col-span-1 md:col-span-1 flex items-center justify-end md:justify-center pt-1 md:pt-0">
                          {!isReadOnly && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteProduct(plotIdx, itemIdx)}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                              title="ลบรายการนี้"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Bottom Actions & Summary ───────────────────────────── */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
            {!isReadOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddPlot}
                className="h-9 px-3.5 text-xs font-semibold text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100/80 border-emerald-200 rounded-xl flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ เพิ่มแปลง</span>
              </Button>
            )}

            {/* Summary Indicator */}
            <div className="text-xs text-slate-500 font-medium ml-auto">
              สรุป: <span className="font-bold text-slate-800">{plotGroups.length}</span> แปลง, รวม{" "}
              <span className="font-bold text-slate-800">{totalItemCount}</span> รายการเบิกยา
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DrugWithdrawalCard;
