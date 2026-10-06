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

  // Current selected plot IDs (multi-select)
  const selectedPlotIds: string[] = useMemo(() => {
    if (value.selectedPlotIds && value.selectedPlotIds.length > 0) {
      return value.selectedPlotIds;
    }
    if (value.demoPlotIds && value.demoPlotIds.length > 0) {
      return value.demoPlotIds;
    }
    return value.demoPlotId ? [value.demoPlotId] : [];
  }, [value.selectedPlotIds, value.demoPlotIds, value.demoPlotId]);

  // Auto-hydrate selectedPlanId if demoPlotId or selectedPlotIds are provided from saved data
  useEffect(() => {
    if (!availablePlans || availablePlans.length === 0) return;
    if (value.selectedPlanId) return;

    const targetPlotId = selectedPlotIds[0] || value.demoPlotId;
    if (targetPlotId) {
      const parentPlan = availablePlans.find((plan) =>
        plan.plots.some((p) => p.id === targetPlotId),
      );
      if (parentPlan) {
        const matchedPlot = parentPlan.plots.find(
          (p) => p.id === targetPlotId,
        );
        onChange({
          ...value,
          selectedPlanId: parentPlan.planId,
          selectedPlotIds: selectedPlotIds.length > 0 ? selectedPlotIds : [targetPlotId],
          demoPlotIds: selectedPlotIds.length > 0 ? selectedPlotIds : [targetPlotId],
          cropCategory: value.cropCategory || matchedPlot?.cropCategory || null,
          cropName: value.cropName || matchedPlot?.cropName || null,
          areaRai: value.areaRai ?? (matchedPlot?.areaRai ?? null),
          treeCount: value.treeCount ?? (matchedPlot?.treeCount ?? null),
          dealerName: value.dealerName || matchedPlot?.dealerName || null,
          ownerName: value.ownerName || matchedPlot?.ownerName || null,
        });
      }
    }
  }, [availablePlans, selectedPlotIds, value, onChange]);

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

  // Sync plot details helper
  const syncPlotData = (firstPlotId: string, allPlotIds: string[]) => {
    const matchedPlot = selectedPlan?.plots.find((p) => p.id === firstPlotId);
    const planFallbackPlot = selectedPlan?.plots.find((p) => p.dealerId);
    const resolvedDealerId =
      matchedPlot?.dealerId ||
      planFallbackPlot?.dealerId ||
      value.storeId ||
      "";
    const resolvedDealerName =
      matchedPlot?.dealerName ||
      planFallbackPlot?.dealerName ||
      value.dealerName ||
      "";

    if (matchedPlot) {
      onChange({
        ...value,
        mode: "EXISTING_PLOT",
        demoPlotId: firstPlotId || null,
        demoPlotIds: allPlotIds,
        selectedPlotIds: allPlotIds,
        name: matchedPlot.name || "แปลงแฮตแทค",
        storeId: resolvedDealerId,
        dealerName: resolvedDealerName,
        ownerName: matchedPlot.ownerName || "",
        cropCategory: matchedPlot.cropCategory || null,
        cropName: matchedPlot.cropName || null,
        areaRai: matchedPlot.areaRai ?? null,
        treeCount: matchedPlot.treeCount ?? null,
        province: matchedPlot.province || defaultProvince || "",
        district: matchedPlot.district || defaultDistrict || "",
        latitude: "",
        longitude: "",
      });
    } else {
      onChange({
        ...value,
        demoPlotId: null,
        demoPlotIds: allPlotIds,
        selectedPlotIds: allPlotIds,
        name: allPlotIds.length > 0 ? "แปลงแฮตแทค" : "",
        storeId: allPlotIds.length > 0 ? resolvedDealerId : "",
        dealerName: allPlotIds.length > 0 ? resolvedDealerName : "",
        ownerName: "",
        cropCategory: null,
        cropName: null,
        areaRai: null,
        treeCount: null,
        province: allPlotIds.length > 0 ? value.province : "",
        district: allPlotIds.length > 0 ? value.district : "",
        latitude: "",
        longitude: "",
      });
    }
  };

  // Handle source plan change
  const handlePlanChange = (planId: string) => {
    const plan = availablePlans.find((p) => p.planId === planId);
    if (!plan || plan.plots.length === 0) {
      onChange({
        ...value,
        selectedPlanId: planId || null,
        demoPlotId: null,
        demoPlotIds: [],
        selectedPlotIds: [],
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

    const defaultDealerPlot = plan.plots.find((p) => p.dealerId);
    const defaultDealerId = defaultDealerPlot?.dealerId || "";
    const defaultDealerName = defaultDealerPlot?.dealerName || "";

    // Auto-select single plot
    if (plan.plots.length === 1) {
      const singlePlot = plan.plots[0];
      onChange({
        ...value,
        mode: "EXISTING_PLOT",
        selectedPlanId: plan.planId,
        demoPlotId: singlePlot.id,
        demoPlotIds: [singlePlot.id],
        selectedPlotIds: [singlePlot.id],
        name: singlePlot.name,
        storeId: singlePlot.dealerId || defaultDealerId,
        dealerName: singlePlot.dealerName || defaultDealerName,
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

    // Multiple plots: reset plot selection for user to choose, but preserve default dealer
    onChange({
      ...value,
      mode: "EXISTING_PLOT",
      selectedPlanId: plan.planId,
      demoPlotId: null,
      demoPlotIds: [],
      selectedPlotIds: [],
      name: "",
      storeId: defaultDealerId,
      dealerName: defaultDealerName,
      ownerName: "",
      cropCategory: null,
      cropName: null,
      areaRai: null,
      treeCount: null,
      province: plan.plots[0]?.province || defaultProvince || "",
      district: plan.plots[0]?.district || defaultDistrict || "",
      latitude: "",
      longitude: "",
      trackings: [],
    });
  };

  // Toggle single plot checkbox
  const handleTogglePlot = (plotId: string) => {
    let updated: string[];
    if (selectedPlotIds.includes(plotId)) {
      updated = selectedPlotIds.filter((id) => id !== plotId);
    } else {
      updated = [...selectedPlotIds, plotId];
    }
    syncPlotData(updated[0] || "", updated);
  };

  // Select all plots in current plan
  const handleSelectAllPlots = () => {
    if (!selectedPlan) return;
    const allIds = selectedPlan.plots.map((p) => p.id);
    syncPlotData(allIds[0] || "", allIds);
  };

  // Deselect all plots in current plan
  const handleDeselectAllPlots = () => {
    syncPlotData("", []);
  };

  // Selected plot objects for summary
  const selectedPlotItems = useMemo(() => {
    if (!selectedPlan || selectedPlotIds.length === 0) return [];
    return selectedPlan.plots.filter((p) => selectedPlotIds.includes(p.id));
  }, [selectedPlan, selectedPlotIds]);

  // Display name for dealer customer
  const dealerDisplayName = useMemo(() => {
    if (value.dealerName) return value.dealerName;
    if (selectedPlotItems.length > 0 && selectedPlotItems[0].dealerName) {
      return selectedPlotItems[0].dealerName;
    }
    if (value.storeId) {
      const match = dealerCustomers.find((d) => d.id === value.storeId);
      if (match) return match.name;
    }
    return value.storeId || "-";
  }, [value.dealerName, selectedPlotItems, value.storeId, dealerCustomers]);

  // Dealer options for manual override/selection
  const dealerOptions = useMemo(() => {
    const list = (dealerCustomers || []).map((d) => ({
      value: d.id,
      label: d.name,
      subLabel: d.customerCode ? `รหัส: ${d.customerCode}` : undefined,
    }));
    if (value.storeId && !list.some((o) => o.value === value.storeId)) {
      list.unshift({
        value: value.storeId,
        label: value.dealerName || value.storeId,
        subLabel: undefined,
      });
    }
    return list;
  }, [dealerCustomers, value.storeId, value.dealerName]);

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

      {/* Dependent Selector: 1. แผนกิจกรรมต้นทาง -> 2. รายการแปลงแฮตแทค (Multi-Select) */}
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

        {/* 2. รายการแปลงแฮตแทคในแผน (Multi-Select Checkbox Cards - Matching Type 7B) */}
        {selectedPlan && selectedPlan.plots.length > 0 && (
          <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-3.5 space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <Info className="h-3.5 w-3.5 text-purple-600" />
                  เลือกแปลงแฮตแทคที่ต้องการติดตาม
                </span>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold text-[11px]">
                  เลือกแล้ว {selectedPlotIds.length} / {selectedPlan.plots.length} แปลง
                </span>
              </div>

              {!readonly && selectedPlan.plots.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllPlots}
                    className="h-6 px-2 text-[11px] text-purple-700 hover:text-purple-800 border-purple-300 hover:bg-purple-50"
                  >
                    เลือกทั้งหมด
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAllPlots}
                    className="h-6 px-2 text-[11px] text-slate-600 hover:text-slate-800 border-slate-300 hover:bg-slate-100"
                  >
                    ยกเลิกทั้งหมด
                  </Button>
                </div>
              )}
            </div>

            {/* Validation warning if no plots selected */}
            {selectedPlotIds.length === 0 && (
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-1.5">
                <span>
                  ⚠️ กรุณาติ๊กเลือกแปลงที่ต้องการติดตามอย่างน้อย 1 แปลง
                </span>
              </div>
            )}

            {/* Plots Checkbox Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {selectedPlan.plots.map((plot) => {
                const isSelected = selectedPlotIds.includes(plot.id);
                return (
                  <label
                    key={plot.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                      isSelected
                        ? "bg-purple-50/70 border-purple-300 shadow-2xs"
                        : "bg-white border-slate-200/90 hover:border-slate-300 opacity-80"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleTogglePlot(plot.id)}
                      disabled={readonly}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-bold text-slate-900 truncate">
                          {plot.name}
                        </span>
                        {plot.code && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] shrink-0">
                            {plot.code}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] text-slate-600">
                        <div>
                          <span className="text-slate-400">พืช: </span>
                          <span className="font-semibold text-slate-800">
                            {plot.cropName || "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">เจ้าของ: </span>
                          <span className="font-medium text-slate-700 truncate">
                            {plot.ownerName || "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">พื้นที่: </span>
                          <span className="text-slate-700">
                            {plot.areaRai
                              ? `${plot.areaRai} ไร่`
                              : plot.treeCount
                                ? `${plot.treeCount} ต้น`
                                : "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">จังหวัด: </span>
                          <span className="text-slate-700">
                            {[plot.province, plot.district]
                              .filter(Boolean)
                              .join(" / ") || "-"}
                          </span>
                        </div>
                      </div>
                      {plot.dealerName && (
                        <div className="text-[10.5px] text-slate-500 pt-0.5 border-t border-slate-200/50">
                          ร้าน Dealer:{" "}
                          <span className="font-medium text-slate-700">
                            {plot.dealerName}
                          </span>
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Plots Summary Card */}
        {selectedPlotItems.length > 0 && (
          <div className="bg-purple-50/50 rounded-xl border border-purple-200/80 p-3.5 sm:p-4 space-y-3 transition-all animate-fadeIn">
            <div className="flex items-center justify-between border-b border-purple-100 pb-2 text-xs font-bold text-purple-900">
              <div className="flex items-center gap-1.5">
                <Info className="w-4 h-4 text-purple-600" />
                <span>สรุปรายละเอียดแปลงแฮตแทคที่เลือกติดตาม ({selectedPlotItems.length} แปลง)</span>
              </div>
            </div>

            {selectedPlotItems.length === 1 ? (
              // Single plot detailed view
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-white/80 p-2.5 rounded-lg border border-purple-100/80 space-y-0.5">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-purple-600" />
                    เกษตรกรเจ้าของแปลง
                  </span>
                  <p className="font-semibold text-slate-800 truncate">
                    {selectedPlotItems[0].ownerName || "-"}
                  </p>
                </div>

                <div className="bg-white/80 p-2.5 rounded-lg border border-purple-100/80 space-y-1">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Store className="w-3.5 h-3.5 text-purple-600" />
                    ร้านค้าตัวแทนจำหน่าย (Dealer)
                  </span>
                  {readonly ? (
                    <p className="font-semibold text-slate-800 truncate text-xs">
                      {dealerDisplayName}
                    </p>
                  ) : (
                    <FormCombobox
                      id="type14-dealer-select-single"
                      value={value.storeId || ""}
                      onChange={(val) => {
                        const matchedDealer = dealerCustomers.find((d) => d.id === val);
                        onChange({
                          ...value,
                          storeId: val,
                          dealerName: matchedDealer?.name || "",
                        });
                      }}
                      options={dealerOptions}
                      placeholder={dealerDisplayName !== "-" ? dealerDisplayName : "เลือกร้านค้าตัวแทนจำหน่าย..."}
                      searchPlaceholder="ค้นหาร้านค้า Dealer..."
                      emptyText="ไม่พบร้านค้าตัวแทนจำหน่าย"
                      labelClassName="hidden"
                      triggerClassName="h-7 min-h-[28px] py-0 text-xs bg-white border-purple-200/80 rounded-md text-slate-800 font-medium"
                    />
                  )}
                </div>

                <div className="bg-white/80 p-2.5 rounded-lg border border-purple-100/80 space-y-0.5">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Sprout className="w-3.5 h-3.5 text-purple-600" />
                    ชนิดพืช / หมวดพืช
                  </span>
                  <p className="font-semibold text-slate-800 truncate">
                    {[selectedPlotItems[0].cropName, selectedPlotItems[0].cropCategory]
                      .filter(Boolean)
                      .join(" • ") || "-"}
                  </p>
                </div>

                <div className="bg-white/80 p-2.5 rounded-lg border border-purple-100/80 space-y-0.5">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-purple-600" />
                    ขนาดแปลง / จำนวนต้น
                  </span>
                  <p className="font-semibold text-slate-800">
                    {selectedPlotItems[0].areaRai
                      ? `${selectedPlotItems[0].areaRai} ไร่`
                      : selectedPlotItems[0].treeCount
                        ? `${selectedPlotItems[0].treeCount} ต้น`
                        : "-"}
                  </p>
                </div>

                <div className="bg-white/80 p-2.5 rounded-lg border border-purple-100/80 space-y-0.5 sm:col-span-2">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-purple-600" />
                    ที่ตั้งแปลง (อำเภอ / จังหวัด)
                  </span>
                  <p className="font-semibold text-slate-800 truncate">
                    {[selectedPlotItems[0].district, selectedPlotItems[0].province]
                      .filter(Boolean)
                      .join(" / ") || "-"}
                  </p>
                </div>
              </div>
            ) : (
              // Multi-plot compact summary chips & list
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {selectedPlotItems.map((p, idx) => (
                    <div
                      key={p.id}
                      className="bg-white/90 border border-purple-200 rounded-lg px-2.5 py-1.5 flex items-center gap-2 text-xs"
                    >
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-slate-800">{p.name}</span>
                        <span className="text-slate-500 ml-1 text-[11px]">
                          ({p.cropName || "พืช"} • {p.ownerName || "เกษตรกร"})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-purple-100 items-center">
                  <div className="flex flex-col gap-1 text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>ร้านค้าตัวแทนจำหน่าย (Dealer):</span>
                    </div>
                    {readonly ? (
                      <strong className="text-slate-800">{dealerDisplayName}</strong>
                    ) : (
                      <FormCombobox
                        id="type14-dealer-select-multi"
                        value={value.storeId || ""}
                        onChange={(val) => {
                          const matchedDealer = dealerCustomers.find((d) => d.id === val);
                          onChange({
                            ...value,
                            storeId: val,
                            dealerName: matchedDealer?.name || "",
                          });
                        }}
                        options={dealerOptions}
                        placeholder={dealerDisplayName !== "-" ? dealerDisplayName : "เลือกร้านค้าตัวแทนจำหน่าย..."}
                        searchPlaceholder="ค้นหาร้านค้า Dealer..."
                        emptyText="ไม่พบร้านค้าตัวแทนจำหน่าย"
                        labelClassName="hidden"
                        triggerClassName="h-7 min-h-[28px] py-0 text-xs bg-white border-purple-200/80 rounded-md text-slate-800 font-medium"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>พื้นที่: <strong className="text-slate-800">
                      {[value.district, value.province].filter(Boolean).join(" / ") || selectedPlotItems[0]?.province || "-"}
                    </strong></span>
                  </div>
                </div>
              </div>
            )}
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
