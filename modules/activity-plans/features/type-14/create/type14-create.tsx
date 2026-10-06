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
  User,
  Sprout,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormCombobox } from "@/components/custom/FormCombobox";
import type {
  Type14PlanInput,
  Type14WithdrawnProductLine,
} from "../shared/types";
import { getHattackFollowUpPlansWithPlotsAction } from "../../../server/actions";
import type { Type14CreateProps } from "./types";
import type { FollowUpPlanOption } from "@/modules/activity-plans/constants";

export type { Type14CreateProps };

export function Type14Create({
  value,
  onChange,
  hattackFollowUpPlans = [],
  dealerCustomers = [],
  products = [],
  defaultProvince = "",
  defaultDistrict = "",
  readonly = false,
}: Type14CreateProps) {
  const [internalPlans, setInternalPlans] = useState<FollowUpPlanOption[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  // Load Hattack follow-up plans if not supplied by parent
  useEffect(() => {
    if (hattackFollowUpPlans && hattackFollowUpPlans.length > 0) {
      return;
    }

    let isMounted = true;
    async function loadPlans() {
      setLoadingPlans(true);
      try {
        const res = await getHattackFollowUpPlansWithPlotsAction();
        if (isMounted) {
          if (res?.success && Array.isArray(res.plans)) {
            setInternalPlans(res.plans);
          } else {
            setInternalPlans([]);
          }
        }
      } catch (err) {
        console.error("Failed to load Hattack follow-up plans:", err);
        if (isMounted) {
          setInternalPlans([]);
        }
      } finally {
        if (isMounted) setLoadingPlans(false);
      }
    }
    loadPlans();
    return () => {
      isMounted = false;
    };
  }, [hattackFollowUpPlans]);

  // Combined source plans
  const availablePlans: FollowUpPlanOption[] = useMemo(() => {
    if (hattackFollowUpPlans && hattackFollowUpPlans.length > 0) {
      return hattackFollowUpPlans;
    }
    return internalPlans;
  }, [hattackFollowUpPlans, internalPlans]);

  // Auto-hydrate selectedPlanId if demoPlotId is provided from saved data
  useEffect(() => {
    if (!availablePlans || availablePlans.length === 0) return;
    if (value.selectedPlanId) return;

    if (value.demoPlotId) {
      const parentPlan = availablePlans.find((plan) =>
        plan.plots.some((p) => p.id === value.demoPlotId),
      );
      if (parentPlan) {
        const matchedPlot = parentPlan.plots.find(
          (p) => p.id === value.demoPlotId,
        );
        onChange({
          ...value,
          selectedPlanId: parentPlan.planId,
          cropCategory: value.cropCategory || matchedPlot?.cropCategory || null,
          cropName: value.cropName || matchedPlot?.cropName || null,
          areaRai: value.areaRai ?? (matchedPlot?.areaRai ?? null),
          treeCount: value.treeCount ?? (matchedPlot?.treeCount ?? null),
          dealerName: value.dealerName || matchedPlot?.dealerName || null,
          ownerName: value.ownerName || matchedPlot?.ownerName || null,
        });
      }
    }
  }, [availablePlans, value, onChange]);

  // Combobox options: Source Plans (Approved & Completed)
  const planComboboxOptions = useMemo(() => {
    return availablePlans.map((plan) => {
      const plotCount = plan.plots.length;
      const firstPlotCrop = plan.plots[0]?.cropName
        ? ` - ${plan.plots[0].cropName}`
        : "";
      return {
        value: plan.planId,
        label: `[${plan.planCode || "แผนงาน"}] ${plan.planTitle || "แผนฉีดแปลงแฮตแทค"}${firstPlotCrop}`,
        subLabel: `${plan.planDate ? `วันที่: ${plan.planDate} • ` : ""}${plotCount} แปลง`,
      };
    });
  }, [availablePlans]);

  // Current selected plan
  const selectedPlan = useMemo(() => {
    if (!value.selectedPlanId) return undefined;
    return availablePlans.find((p) => p.planId === value.selectedPlanId);
  }, [availablePlans, value.selectedPlanId]);

  // Plots in selected plan
  const availablePlotsInPlan = useMemo(() => {
    return selectedPlan ? selectedPlan.plots : [];
  }, [selectedPlan]);

  // Combobox options: Plots in selected plan
  const plotComboboxOptions = useMemo(() => {
    if (!selectedPlan) return [];
    return selectedPlan.plots.map((plot) => {
      const cropInfo = [plot.cropCategory, plot.cropName]
        .filter(Boolean)
        .join(" - ");
      const locationInfo = [plot.district, plot.province]
        .filter(Boolean)
        .join(", ");
      return {
        value: plot.id,
        label: `${plot.name}${plot.code ? ` (${plot.code})` : ""}`,
        subLabel: [
          plot.ownerName ? `เกษตรกร: ${plot.ownerName}` : null,
          cropInfo,
          locationInfo,
        ]
          .filter(Boolean)
          .join(" • "),
      };
    });
  }, [selectedPlan]);

  // Currently selected plot item
  const selectedPlotItem = useMemo(() => {
    if (!value.demoPlotId) return undefined;
    return availablePlotsInPlan.find((p) => p.id === value.demoPlotId);
  }, [availablePlotsInPlan, value.demoPlotId]);

  // Display name for dealer customer
  const dealerDisplayName = useMemo(() => {
    if (value.dealerName) return value.dealerName;
    if (selectedPlotItem?.dealerName) return selectedPlotItem.dealerName;
    if (value.storeId) {
      const match = dealerCustomers.find((d) => d.id === value.storeId);
      if (match) return match.name;
    }
    return value.storeId || "-";
  }, [value.dealerName, selectedPlotItem, value.storeId, dealerCustomers]);

  // Handle source plan change
  const handlePlanChange = (planId: string) => {
    const plan = availablePlans.find((p) => p.planId === planId);
    if (!plan) {
      onChange({
        ...value,
        selectedPlanId: null,
        demoPlotId: null,
        name: "",
        storeId: "",
        dealerName: "",
        ownerName: "",
        cropCategory: null,
        cropName: null,
        areaRai: null,
        treeCount: null,
        province: "",
        district: "",
        latitude: "",
        longitude: "",
        trackings: [],
      });
      return;
    }

    // Auto-select immediately if the plan has exactly 1 plot
    if (plan.plots.length === 1) {
      const singlePlot = plan.plots[0];
      onChange({
        ...value,
        mode: "EXISTING_PLOT",
        selectedPlanId: plan.planId,
        demoPlotId: singlePlot.id,
        name: singlePlot.name,
        storeId: singlePlot.dealerId || "",
        dealerName: singlePlot.dealerName || "",
        ownerName: singlePlot.ownerName || "",
        cropCategory: singlePlot.cropCategory || null,
        cropName: singlePlot.cropName || null,
        areaRai: singlePlot.areaRai ?? null,
        treeCount: singlePlot.treeCount ?? null,
        province: singlePlot.province || defaultProvince || "",
        district: singlePlot.district || defaultDistrict || "",
        latitude: "",
        longitude: "",
        trackings: [],
      });
      return;
    }

    // Multiple plots: reset plot selection for user to choose
    onChange({
      ...value,
      mode: "EXISTING_PLOT",
      selectedPlanId: plan.planId,
      demoPlotId: null,
      name: "",
      storeId: "",
      dealerName: "",
      ownerName: "",
      cropCategory: null,
      cropName: null,
      areaRai: null,
      treeCount: null,
      province: "",
      district: "",
      latitude: "",
      longitude: "",
      trackings: [],
    });
  };

  // Handle plot change
  const handlePlotChange = (plotId: string) => {
    const plot = availablePlotsInPlan.find((p) => p.id === plotId);
    if (!plot) {
      onChange({
        ...value,
        demoPlotId: null,
        name: "",
        storeId: "",
        dealerName: "",
        ownerName: "",
        cropCategory: null,
        cropName: null,
        areaRai: null,
        treeCount: null,
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
      demoPlotId: plot.id,
      name: plot.name,
      storeId: plot.dealerId || "",
      dealerName: plot.dealerName || "",
      ownerName: plot.ownerName || "",
      cropCategory: plot.cropCategory || null,
      cropName: plot.cropName || null,
      areaRai: plot.areaRai ?? null,
      treeCount: plot.treeCount ?? null,
      province: plot.province || defaultProvince || "",
      district: plot.district || defaultDistrict || "",
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
    const newLine: Type14WithdrawnProductLine = {
      id: Date.now().toString(),
      productId: "",
      productName: "",
      quantity: 1,
      unit: "ขวด",
    };
    onChange({
      ...value,
      withdrawnProducts: [...withdrawnProducts, newLine],
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
            เลือกแผนกิจกรรมฉีดแปลงแฮตแทคต้นทาง (Approved &amp; Completed) และเลือกแปลงที่ต้องการติดตามผล
          </p>
        </div>
      </div>

      {/* Dependent Selector: 1. แผนกิจกรรมต้นทาง -> 2. แปลงแฮตแทค */}
      <div className="space-y-4">
        {/* Combobox 1: เลือกแผนกิจกรรมฉีดแปลงแฮตแทคต้นทาง */}
        <div>
          {loadingPlans ? (
            <div className="flex items-center gap-2 text-xs text-slate-500 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              <span>กำลังโหลดแผนกิจกรรมต้นทาง...</span>
            </div>
          ) : (
            <FormCombobox
              id="type14-source-plan-combobox"
              label="เลือกแผนกิจกรรมฉีดแปลงแฮตแทคต้นทาง (Approved & Completed)"
              required
              value={value.selectedPlanId || ""}
              onChange={handlePlanChange}
              options={planComboboxOptions}
              placeholder={
                planComboboxOptions.length > 0
                  ? "เลือกแผนกิจกรรมฉีดแปลงแฮตแทคต้นทาง..."
                  : "ไม่พบแผนกิจกรรมฉีดแปลงแฮตแทคที่ปฏิบัติงานแล้วเสร็จ"
              }
              searchPlaceholder="ค้นหาแผนกิจกรรมฉีดแปลงแฮตแทค (รหัส หรือ ชื่อแผน)..."
              emptyText="ไม่พบแผนกิจกรรมฉีดแปลงแฮตแทคที่ตรงกับเงื่อนไข"
              disabled={readonly}
              showSubLabelInTrigger={true}
              labelClassName="text-xs font-semibold text-slate-700 mb-1 mx-0"
              triggerClassName="h-auto min-h-[44px] py-1.5 text-xs bg-white border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-purple-500"
            />
          )}
        </div>

        {/* Combobox 2: เลือกแปลงแฮตแทคที่ต้องการติดตาม */}
        <div>
          <FormCombobox
            id="type14-plot-combobox"
            label="เลือกแปลงแฮตแทคที่ต้องการติดตาม"
            required
            value={value.demoPlotId || ""}
            onChange={handlePlotChange}
            options={plotComboboxOptions}
            placeholder={
              !value.selectedPlanId
                ? "กรุณาเลือกแผนกิจกรรมต้นทางก่อน..."
                : plotComboboxOptions.length > 0
                  ? "เลือกแปลงแฮตแทคที่ต้องการติดตาม..."
                  : "ไม่พบแปลงแฮตแทคในแผนนี้"
            }
            searchPlaceholder="ค้นหาแปลงแฮตแทค..."
            emptyText="ไม่พบแปลงแฮตแทคในรายการ"
            disabled={readonly || !value.selectedPlanId}
            showSubLabelInTrigger={true}
            labelClassName="text-xs font-semibold text-slate-700 mb-1 mx-0"
            triggerClassName="h-auto min-h-[44px] py-1.5 text-xs bg-white border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-purple-500 disabled:bg-slate-50 disabled:text-slate-400"
          />
        </div>

        {/* Rich Plot Details Card: เกษตรกร, ร้านค้า, พืช/หมวดพืช, พื้นที่, อำเภอ/จังหวัด */}
        {value.demoPlotId && (
          <div className="bg-purple-50/50 rounded-xl border border-purple-200/80 p-3.5 sm:p-4 space-y-3 transition-all animate-fadeIn">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 border-b border-purple-100 pb-2">
              <Info className="w-4 h-4 text-purple-600" />
              <span>รายละเอียดแปลงแฮตแทคที่เลือก</span>
              {value.name && (
                <span className="text-purple-700 font-medium ml-1">
                  ({value.name})
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {/* เกษตรกรเจ้าของแปลง */}
              <div className="bg-white/80 p-2.5 rounded-lg border border-purple-100/80 space-y-0.5">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-purple-600" />
                  เกษตรกรเจ้าของแปลง
                </span>
                <p className="font-semibold text-slate-800 truncate">
                  {value.ownerName || selectedPlotItem?.ownerName || "-"}
                </p>
              </div>

              {/* ร้านค้าตัวแทนจำหน่าย (Dealer) */}
              <div className="bg-white/80 p-2.5 rounded-lg border border-purple-100/80 space-y-0.5">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Store className="w-3.5 h-3.5 text-purple-600" />
                  ร้านค้าตัวแทนจำหน่าย (Dealer)
                </span>
                <p className="font-semibold text-slate-800 truncate">
                  {dealerDisplayName}
                </p>
              </div>

              {/* พืชและหมวดพืช */}
              <div className="bg-white/80 p-2.5 rounded-lg border border-purple-100/80 space-y-0.5">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Sprout className="w-3.5 h-3.5 text-purple-600" />
                  ชนิดพืช / หมวดพืช
                </span>
                <p className="font-semibold text-slate-800 truncate">
                  {[
                    value.cropName || selectedPlotItem?.cropName,
                    value.cropCategory || selectedPlotItem?.cropCategory,
                  ]
                    .filter(Boolean)
                    .join(" • ") || "-"}
                </p>
              </div>

              {/* ขนาดแปลง / จำนวนต้น */}
              <div className="bg-white/80 p-2.5 rounded-lg border border-purple-100/80 space-y-0.5">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-purple-600" />
                  ขนาดแปลง / จำนวนต้น
                </span>
                <p className="font-semibold text-slate-800">
                  {value.areaRai ?? selectedPlotItem?.areaRai
                    ? `${value.areaRai ?? selectedPlotItem?.areaRai} ไร่`
                    : value.treeCount ?? selectedPlotItem?.treeCount
                      ? `${value.treeCount ?? selectedPlotItem?.treeCount} ต้น`
                      : "-"}
                </p>
              </div>

              {/* ที่ตั้งแปลง (อำเภอ / จังหวัด) */}
              <div className="bg-white/80 p-2.5 rounded-lg border border-purple-100/80 space-y-0.5 sm:col-span-2">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-purple-600" />
                  ที่ตั้งแปลง (อำเภอ / จังหวัด)
                </span>
                <p className="font-semibold text-slate-800 truncate">
                  {[
                    value.district || selectedPlotItem?.district,
                    value.province || selectedPlotItem?.province,
                  ]
                    .filter(Boolean)
                    .join(" / ") || "-"}
                </p>
              </div>
            </div>
          </div>
        )}
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
