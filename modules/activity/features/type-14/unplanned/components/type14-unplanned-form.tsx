"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Layers,
  MapPin,
  Package,
  Plus,
  Trash2,
  Sprout,
  Clock,
  Activity,
  CheckCircle2,
  PackageCheck,
  Store,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ActivityCustomerSelect,
  ActivityAddressSelect,
  ActivityInput,
  ActivityGpsPicker,
  ActivityPhotoUpload,
  ActivityProductSelect,
  ActivitySelect,
  type ImageFile,
} from "@/modules/activity/ui";
import { getHattackFollowUpPlansAction } from "@/modules/activity/server/actions";
import {
  TRACKING_RESULT_OPTIONS,
  PRODUCT_RESPONSE_OPTIONS,
  HATTACK_PLOT_STATUS_OPTIONS,
  TYPE14_MAX_IMAGES_PER_VILLAGE,
} from "../../shared/constants";
import type {
  Type14PlotActualState,
  Type14ActualProductState,
  Type14WithdrawnProductLine,
  FollowUpPlanOption,
  DealerCustomerOption,
  ProductOption,
} from "../../shared/types";
import type {
  Type14UnplannedItem,
  Type14UnplannedFormProps,
} from "../types/unplanned.types";

export function Type14UnplannedForm({
  item,
  onChange,
  dealers = [],
  products = [],
  hattackFollowUpPlans = [],
  readonly = false,
  className = "",
}: Type14UnplannedFormProps) {
  const [dbPlans, setDbPlans] = useState<FollowUpPlanOption[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  // Self-healing fallback: Load active Type 13 plans if not provided by parent
  useEffect(() => {
    let isMounted = true;
    if (hattackFollowUpPlans.length === 0) {
      setIsLoadingPlans(true);
      getHattackFollowUpPlansAction()
        .then((res) => {
          if (
            isMounted &&
            res?.success &&
            res.hattackFollowUpPlans &&
            res.hattackFollowUpPlans.length > 0
          ) {
            setDbPlans(res.hattackFollowUpPlans);
          }
        })
        .catch((err) => {
          console.error("Failed to load hattack follow-up plans in Type14UnplannedForm:", err);
        })
        .finally(() => {
          if (isMounted) setIsLoadingPlans(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [hattackFollowUpPlans.length]);

  const activeFollowUpPlans =
    hattackFollowUpPlans.length > 0 ? hattackFollowUpPlans : dbPlans;

  const planOptions = useMemo(() => {
    return activeFollowUpPlans.map((plan) => ({
      value: plan.planId,
      label: `${plan.planCode ? `[${plan.planCode}] ` : ""}${plan.planTitle}${
        plan.planDate ? ` (${plan.planDate})` : ""
      } - จำนวน ${plan.plots?.length || 0} แปลง`,
    }));
  }, [activeFollowUpPlans]);

  const mode = item.mode || "EXISTING_PLOT";
  const plotsList: Type14PlotActualState[] =
    item.plots && item.plots.length > 0
      ? item.plots
      : [
          {
            id: item.id || `unplanned-plot-${Date.now()}`,
            name: item.name || item.plotName || "แปลงแฮตแทค 1",
            plotName: item.name || item.plotName || "แปลงแฮตแทค 1",
            storeId: item.storeId || "",
            dealerName: item.dealerName || null,
            ownerName: item.ownerName || null,
            cropCategory: item.cropCategory || null,
            cropName: item.cropName || null,
            areaRai: item.areaRai != null ? Number(item.areaRai) : null,
            treeCount: item.treeCount != null ? Number(item.treeCount) : null,
            province: item.province || "",
            district: item.district || "",
            subdistrict: item.subdistrict || null,
            village: item.village || null,
            latitude: item.latitude || null,
            longitude: item.longitude || null,
            plannedPlotsCount: Number(item.plannedPlotsCount) || 1,
            actualPlotsCount: Number(item.actualPlotsCount) || 1,
            actualVisitDate:
              item.actualVisitDate || new Date().toISOString().split("T")[0],
            daysAfterSpray: item.daysAfterSpray || "7",
            trackingResult: item.trackingResult || "ได้ผลตามเกณฑ์",
            productResponse: item.productResponse || "ปกติ",
            plotStatus: item.plotStatus || "IN_PROGRESS",
            closureNotes: item.closureNotes || null,
            additionalNotes: item.additionalNotes || null,
            products: item.products || [],
            afterSprayImages: item.afterSprayImages || item.images || [],
          },
        ];

  const hasProductWithdrawal = Boolean(item.hasProductWithdrawal);
  const withdrawnProducts = item.withdrawnProducts || [];

  // -------------------------------------------------------------
  // Mode Switch Handler
  // -------------------------------------------------------------
  const handleSwitchMode = (newMode: "EXISTING_PLOT" | "NEW_PLOT") => {
    if (readonly) return;
    if (newMode === mode) return;

    if (newMode === "EXISTING_PLOT") {
      onChange({
        ...item,
        mode: "EXISTING_PLOT",
      });
    } else {
      // Switch to NEW_PLOT
      const newPlot: Type14PlotActualState = {
        id: `unplanned-plot-${Date.now()}-1`,
        name: "แปลงแฮตแทค 1",
        plotName: "แปลงแฮตแทค 1",
        storeId: "",
        dealerName: null,
        ownerName: null,
        cropCategory: null,
        cropName: null,
        areaRai: null,
        treeCount: null,
        province: "",
        district: "",
        subdistrict: null,
        village: null,
        latitude: null,
        longitude: null,
        plannedPlotsCount: 1,
        actualPlotsCount: 1,
        actualVisitDate: new Date().toISOString().split("T")[0],
        daysAfterSpray: "7",
        trackingResult: "ได้ผลตามเกณฑ์",
        productResponse: "ปกติ",
        plotStatus: "IN_PROGRESS",
        closureNotes: null,
        additionalNotes: null,
        products: [],
        afterSprayImages: [],
      };
      onChange({
        ...item,
        mode: "NEW_PLOT",
        selectedPlanId: null,
        selectedPlotIds: [],
        type13TargetIds: [],
        plots: [newPlot],
        name: newPlot.name,
        plotName: newPlot.plotName,
        storeId: "",
        dealerName: "",
        ownerName: "",
        province: "",
        district: "",
        subdistrict: "",
        village: "",
        latitude: "",
        longitude: "",
      });
    }
  };

  // -------------------------------------------------------------
  // Existing Plan Selection Handler
  // -------------------------------------------------------------
  const handleSelectPlan = (planId: string) => {
    if (readonly) return;
    if (!planId) {
      onChange({
        ...item,
        selectedPlanId: null,
        selectedPlotIds: [],
        type13TargetIds: [],
        plots: [],
      });
      return;
    }

    const targetPlan = activeFollowUpPlans.find((p) => p.planId === planId);
    if (!targetPlan) return;

    const mappedPlots: Type14PlotActualState[] = (targetPlan.plots || []).map(
      (plot, idx) => ({
        id: plot.id,
        demoPlotId: plot.id,
        type13TargetId: plot.id,
        name: plot.name || `แปลงแฮตแทค ${idx + 1}`,
        plotName: plot.name || `แปลงแฮตแทค ${idx + 1}`,
        storeId: plot.dealerId || "",
        dealerName: plot.dealerName || null,
        ownerName: plot.ownerName || null,
        cropCategory: plot.cropCategory || null,
        cropName: plot.cropName || null,
        areaRai: plot.areaRai != null ? Number(plot.areaRai) : null,
        treeCount: plot.treeCount != null ? Number(plot.treeCount) : null,
        province: plot.province || "",
        district: plot.district || "",
        subdistrict: plot.subdistrict || null,
        village: plot.village || null,
        plannedPlotsCount: plot.plannedPlotsCount ?? 1,
        actualPlotsCount: plot.plannedPlotsCount ?? 1,
        actualVisitDate: new Date().toISOString().split("T")[0],
        daysAfterSpray: "7",
        trackingResult: "ได้ผลตามเกณฑ์",
        productResponse: "ปกติ",
        plotStatus: "IN_PROGRESS",
        closureNotes: null,
        additionalNotes: null,
        latitude: plot.latitude || null,
        longitude: plot.longitude || null,
        products: (withdrawnProducts || []).map((wp) => ({
          productId: wp.productId,
          productName: wp.productName,
          unit: wp.unit || "ขวด",
          withdrawnQuantity: wp.quantity,
          actualQuantity: wp.quantity,
          quantityUsed: wp.quantity,
          extraQuantity: "",
          extraUnit: "ซีซี",
          actualRate: "",
        })),
        afterSprayImages: [],
      }),
    );

    const primaryPlot = mappedPlots[0];
    const plotIds = mappedPlots.map((p) => p.id);

    onChange({
      ...item,
      mode: "EXISTING_PLOT",
      selectedPlanId: targetPlan.planId,
      selectedPlotIds: plotIds,
      type13TargetIds: plotIds,
      plots: mappedPlots,
      name: primaryPlot?.name || targetPlan.planTitle,
      plotName: primaryPlot?.plotName || targetPlan.planTitle,
      storeId: primaryPlot?.storeId || "",
      dealerName: primaryPlot?.dealerName || "",
      ownerName: primaryPlot?.ownerName || "",
      province: primaryPlot?.province || "",
      district: primaryPlot?.district || "",
      latitude: primaryPlot?.latitude || "",
      longitude: primaryPlot?.longitude || "",
    });
  };

  // -------------------------------------------------------------
  // Plot Updates
  // -------------------------------------------------------------
  const updatePlotField = (
    plotIdx: number,
    field: keyof Type14PlotActualState,
    value: any,
  ) => {
    if (readonly) return;
    const nextPlots = [...plotsList];
    if (nextPlots[plotIdx]) {
      nextPlots[plotIdx] = {
        ...nextPlots[plotIdx],
        [field]: value,
      };
      const isPrimary = plotIdx === 0;
      onChange({
        ...item,
        plots: nextPlots,
        ...(isPrimary
          ? {
              [field]: value,
              ...(field === "name" ? { plotName: value } : {}),
            }
          : {}),
      });
    }
  };

  // Add / Remove New Plot (for NEW_PLOT mode)
  const handleAddNewPlot = () => {
    if (readonly) return;
    const nextIdx = plotsList.length + 1;
    const first = plotsList[0];
    const newPlot: Type14PlotActualState = {
      id: `unplanned-plot-${Date.now()}-${nextIdx}`,
      name: `แปลงแฮตแทค ${nextIdx}`,
      plotName: `แปลงแฮตแทค ${nextIdx}`,
      storeId: first?.storeId || "",
      dealerName: first?.dealerName || null,
      ownerName: first?.ownerName || null,
      cropCategory: first?.cropCategory || null,
      cropName: first?.cropName || null,
      areaRai: null,
      treeCount: null,
      province: first?.province || "",
      district: first?.district || "",
      subdistrict: null,
      village: null,
      latitude: null,
      longitude: null,
      plannedPlotsCount: 1,
      actualPlotsCount: 1,
      actualVisitDate: new Date().toISOString().split("T")[0],
      daysAfterSpray: "7",
      trackingResult: "ได้ผลตามเกณฑ์",
      productResponse: "ปกติ",
      plotStatus: "IN_PROGRESS",
      closureNotes: null,
      additionalNotes: null,
      products: [],
      afterSprayImages: [],
    };
    onChange({
      ...item,
      plots: [...plotsList, newPlot],
    });
  };

  const handleRemovePlot = (plotIdx: number) => {
    if (readonly || plotsList.length <= 1) return;
    const nextPlots = plotsList.filter((_, idx) => idx !== plotIdx);
    onChange({
      ...item,
      plots: nextPlots,
    });
  };

  // -------------------------------------------------------------
  // Product Updates within a Plot
  // -------------------------------------------------------------
  const handleAddProductToPlot = (plotIdx: number) => {
    if (readonly) return;
    const nextPlots = [...plotsList];
    const targetPlot = nextPlots[plotIdx];
    if (!targetPlot) return;

    const newProd: Type14ActualProductState = {
      productId: "",
      productName: "",
      unit: "ขวด",
      actualQuantity: 1,
      quantityUsed: 1,
      extraQuantity: "",
      extraUnit: "ซีซี",
      actualRate: "",
    };

    targetPlot.products = [...(targetPlot.products || []), newProd];
    onChange({ ...item, plots: nextPlots });
  };

  const handleRemoveProductFromPlot = (plotIdx: number, prodIdx: number) => {
    if (readonly) return;
    const nextPlots = [...plotsList];
    const targetPlot = nextPlots[plotIdx];
    if (!targetPlot || !targetPlot.products) return;

    targetPlot.products = targetPlot.products.filter((_, i) => i !== prodIdx);
    onChange({ ...item, plots: nextPlots });
  };

  const handleUpdateProductInPlot = (
    plotIdx: number,
    prodIdx: number,
    field: keyof Type14ActualProductState,
    value: any,
    selectedProd?: any,
  ) => {
    if (readonly) return;
    const nextPlots = [...plotsList];
    const targetPlot = nextPlots[plotIdx];
    if (!targetPlot || !targetPlot.products) return;

    const prods = [...targetPlot.products];
    if (!prods[prodIdx]) return;

    if (field === "productId") {
      const matched =
        selectedProd || products.find((prod) => prod.id === value);
      prods[prodIdx] = {
        ...prods[prodIdx],
        productId: value,
        productName: matched?.name || prods[prodIdx].productName || "",
        unit: matched?.unit || prods[prodIdx].unit || "ขวด",
      };
    } else {
      prods[prodIdx] = {
        ...prods[prodIdx],
        [field]: value,
      };
      if (field === "actualQuantity") {
        prods[prodIdx].quantityUsed = value;
      }
    }

    targetPlot.products = prods;
    onChange({ ...item, plots: nextPlots });
  };

  // -------------------------------------------------------------
  // Product Withdrawal Helpers
  // -------------------------------------------------------------
  const handleToggleWithdrawal = (checked: boolean) => {
    if (checked && (!withdrawnProducts || withdrawnProducts.length === 0)) {
      onChange({
        ...item,
        hasProductWithdrawal: true,
        withdrawnProducts: [
          {
            id: `withdrawn-${Date.now()}`,
            productId: "",
            productName: "",
            quantity: 1,
            unit: "ขวด",
          },
        ],
      });
    } else {
      onChange({
        ...item,
        hasProductWithdrawal: checked,
      });
    }
  };

  const addWithdrawnRow = () => {
    const newLine: Type14WithdrawnProductLine = {
      id: `withdrawn-${Date.now()}-${withdrawnProducts.length + 1}`,
      productId: "",
      productName: "",
      quantity: 1,
      unit: "ขวด",
    };
    onChange({
      ...item,
      withdrawnProducts: [...withdrawnProducts, newLine],
    });
  };

  const removeWithdrawnRow = (index: number) => {
    const updated = withdrawnProducts.filter((_, idx) => idx !== index);
    onChange({
      ...item,
      withdrawnProducts: updated,
    });
  };

  const updateWithdrawnProductRow = (
    index: number,
    field: keyof Type14WithdrawnProductLine,
    value: any,
    selectedProd?: any,
  ) => {
    const updated = withdrawnProducts.map((p, idx) => {
      if (idx !== index) return p;
      if (field === "productId") {
        const matched =
          selectedProd || products.find((prod) => prod.id === value);
        return {
          ...p,
          productId: value,
          productName: matched?.name || p.productName || "",
          unit: matched?.unit || p.unit || "ขวด",
        };
      }
      return { ...p, [field]: value };
    });
    onChange({
      ...item,
      withdrawnProducts: updated,
    });
  };

  return (
    <div
      className={`bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 space-y-6 shadow-2xs ${className}`}
    >
      {/* ──────────────────────────────────────────────────────────── */}
      {/* Header & Mode Selector */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 font-bold shrink-0">
            14
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <span>กิจกรรมนอกแผน: ติดตามแปลงแฮตแทค (TYPE_14)</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                2-in-1 แผนงานและผลการปฏิบัติงานจริง
              </span>
            </h4>
            <p className="text-xs text-slate-500">
              กำหนดแปลงเป้าหมาย ขอเบิกสินค้าพ่นซ้ำ และรายงานผลตรวจติดตามจริงจบในฟอร์มเดียว
            </p>
          </div>
        </div>

        {/* Mode Switching Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200">
          <button
            type="button"
            disabled={readonly}
            onClick={() => handleSwitchMode("EXISTING_PLOT")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === "EXISTING_PLOT"
                ? "bg-white text-emerald-800 shadow-2xs border border-emerald-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            เลือกจากแผนเดิม (Type 13)
          </button>
          <button
            type="button"
            disabled={readonly}
            onClick={() => handleSwitchMode("NEW_PLOT")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === "NEW_PLOT"
                ? "bg-white text-emerald-800 shadow-2xs border border-emerald-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            ระบุแปลงใหม่โดยตรง
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 1. Setup Section: Existing Plan Selection OR New Plot Details */}
      {/* ──────────────────────────────────────────────────────────── */}
      {mode === "EXISTING_PLOT" ? (
        <div className="space-y-4 rounded-xl border border-emerald-200/80 bg-emerald-50/20 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>เลือกแผนงานฉีดแปลงแฮตแทคเดิม (Type 13)</span>
                <span className="text-rose-500">*</span>
              </label>
              <p className="text-xs text-slate-500 mt-0.5">
                เลือกแผนงานฉีดแปลงแฮตแทคเดิม เพื่อนำแปลงทั้งหมดในแผนงานมารายงานผลติดตาม
              </p>
            </div>
            {plotsList.length > 0 && item.selectedPlanId && (
              <span className="text-xs font-medium text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                แปลงในแผนงานนี้: {plotsList.length} แปลง
              </span>
            )}
          </div>

          {isLoadingPlans && activeFollowUpPlans.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 bg-white flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
              <span>กำลังโหลดรายการแผนงานฉีดแปลงแฮตแทคเดิม...</span>
            </div>
          ) : activeFollowUpPlans.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-xs sm:text-sm text-slate-500 bg-white">
              ยังไม่พบรายการแผนงานฉีดแปลงแฮตแทคเดิม (Type 13) ในระบบ
            </div>
          ) : (
            <div className="space-y-3">
              <ActivitySelect
                value={item.selectedPlanId || ""}
                onChange={(val) => handleSelectPlan(val)}
                options={planOptions}
                placeholder="-- กรุณาเลือกแผนงานฉีดแปลงแฮตแทคเดิม --"
                disabled={readonly}
                className="w-full bg-white"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 sm:p-5">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
            <h5 className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
              <Store className="w-4 h-4 text-emerald-600" />
              <span>1. ข้อมูลตัวแทนจำหน่ายและแปลงแฮตแทค</span>
            </h5>
            {!readonly && (
              <Button
                type="button"
                size="sm"
                onClick={handleAddNewPlot}
                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มแปลงใหม่ ({plotsList.length})</span>
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-start">
            {/* Dealer */}
            <div>
              <ActivityCustomerSelect
                id="type14-unplanned-dealer"
                type="STORE"
                label="ร้านค้า Dealer"
                value={plotsList[0]?.storeId || item.storeId || ""}
                onChange={(val, cust) => {
                  updatePlotField(0, "storeId", val);
                  updatePlotField(0, "dealerName", cust?.name || "");
                  if (cust?.province) updatePlotField(0, "province", cust.province);
                  if (cust?.district) updatePlotField(0, "district", cust.district);
                  if (cust?.subdistrict) updatePlotField(0, "subdistrict", cust.subdistrict);
                }}
                customers={dealers as any}
                placeholder="เลือกร้านค้า Dealer..."
                searchPlaceholder="ค้นหาร้านค้า..."
                emptyText="ไม่พบร้านค้า"
                disabled={readonly}
                required
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <ActivityAddressSelect
                id="type14-unplanned-address"
                levels="province-district-subdistrict"
                provinceLabel="จังหวัด"
                districtLabel="อำเภอ"
                subdistrictLabel="ตำบล"
                value={{
                  province: plotsList[0]?.province || item.province || "",
                  district: plotsList[0]?.district || item.district || "",
                  subdistrict: plotsList[0]?.subdistrict || item.subdistrict || "",
                }}
                onChange={(val) => {
                  updatePlotField(0, "province", val.province || "");
                  updatePlotField(0, "district", val.district || "");
                  updatePlotField(0, "subdistrict", val.subdistrict || "");
                }}
                disabled={readonly}
                required
              />
            </div>
          </div>

          {/* Plot Name, Farmer, Crop */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-slate-200/60">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                ชื่อแปลง <span className="text-rose-500">*</span>
              </label>
              <ActivityInput
                placeholder="เช่น แปลงลุงสมเกียรติ..."
                value={plotsList[0]?.name || item.name || ""}
                onChange={(e) => updatePlotField(0, "name", e.target.value)}
                disabled={readonly}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                ชื่อเจ้าของแปลง / เกษตรกร
              </label>
              <ActivityInput
                placeholder="ระบุชื่อเกษตรกรเจ้าของแปลง..."
                value={plotsList[0]?.ownerName || item.ownerName || ""}
                onChange={(e) => updatePlotField(0, "ownerName", e.target.value)}
                disabled={readonly}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                ชนิดพืช
              </label>
              <ActivityInput
                placeholder="เช่น ทุเรียน, ข้าว, ข้าวโพด..."
                value={plotsList[0]?.cropName || item.cropName || ""}
                onChange={(e) => updatePlotField(0, "cropName", e.target.value)}
                disabled={readonly}
              />
            </div>
          </div>

          {/* Area, Tree Count, Village, GPS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                หมู่บ้าน
              </label>
              <ActivityInput
                placeholder="ระบุชื่อหมู่บ้าน..."
                value={plotsList[0]?.village || item.village || ""}
                onChange={(e) => updatePlotField(0, "village", e.target.value)}
                disabled={readonly}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                พื้นที่ (ไร่)
              </label>
              <ActivityInput
                type="number"
                min={0}
                placeholder="เช่น 5"
                value={plotsList[0]?.areaRai != null ? String(plotsList[0].areaRai) : ""}
                onChange={(e) =>
                  updatePlotField(
                    0,
                    "areaRai",
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
                disabled={readonly}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                จำนวนต้น
              </label>
              <ActivityInput
                type="number"
                min={0}
                placeholder="เช่น 100"
                value={plotsList[0]?.treeCount != null ? String(plotsList[0].treeCount) : ""}
                onChange={(e) =>
                  updatePlotField(
                    0,
                    "treeCount",
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
                disabled={readonly}
              />
            </div>
          </div>

          {/* GPS Coordinates */}
          <div className="pt-2">
            <ActivityGpsPicker
              latitude={plotsList[0]?.latitude || item.latitude || ""}
              longitude={plotsList[0]?.longitude || item.longitude || ""}
              onLocationChange={(lat: string, lng: string) => {
                updatePlotField(0, "latitude", lat);
                updatePlotField(0, "longitude", lng);
              }}
              disabled={readonly}
              required
            />
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 2. Product Withdrawal Section (เบิกสินค้าเพิ่มเติมตามแผน) */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="bg-slate-50/70 p-3.5 sm:p-4 rounded-xl border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              id="type14-unplanned-withdrawal-toggle"
              checked={hasProductWithdrawal}
              onChange={(e) => handleToggleWithdrawal(e.target.checked)}
              disabled={readonly}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer"
            />
            <span className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <PackageCheck className="h-4 w-4 text-emerald-600" />
              มีการเบิกสินค้าเพิ่มเติมสำหรับการติดตามแปลง
            </span>
          </label>
          {hasProductWithdrawal && !readonly && (
            <Button
              type="button"
              size="sm"
              onClick={addWithdrawnRow}
              className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>เพิ่มสินค้าที่เบิก</span>
            </Button>
          )}
        </div>

        {hasProductWithdrawal && (
          <div className="space-y-2 pt-2 border-t border-slate-200/60">
            <p className="text-[11px] text-slate-500">
              ระบุรายการสินค้าและจำนวนที่ต้องการขอเบิกสำหรับการติดตามแปลง
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
                    <th className="py-2.5 px-3 w-36 font-semibold text-center">
                      จำนวน <span className="text-red-500">*</span>
                    </th>
                    <th className="py-2.5 px-3 w-28 font-semibold text-center">
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
                  {withdrawnProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={readonly ? 4 : 5}
                        className="py-4 text-center text-slate-400 italic"
                      >
                        ยังไม่มีรายการสินค้าที่ขอเบิก
                      </td>
                    </tr>
                  ) : (
                    withdrawnProducts.map((p, pIdx) => (
                      <tr key={p.id || pIdx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 text-center text-slate-500 font-medium">
                          {pIdx + 1}
                        </td>
                        <td className="py-2 px-3">
                          <ActivityProductSelect
                            products={products as any}
                            value={p.productId}
                            valueKey="id"
                            onChange={(val, prod) =>
                              updateWithdrawnProductRow(
                                pIdx,
                                "productId",
                                val,
                                prod,
                              )
                            }
                            placeholder="-- เลือกสินค้า --"
                            disabled={readonly}
                            className="h-8 text-xs bg-white"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <ActivityInput
                            type="number"
                            min="0.01"
                            step="any"
                            value={p.quantity != null ? String(p.quantity) : ""}
                            onChange={(e) =>
                              updateWithdrawnProductRow(
                                pIdx,
                                "quantity",
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value),
                              )
                            }
                            placeholder="จำนวน"
                            disabled={readonly}
                            className="h-8 text-xs text-center bg-white"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <ActivityInput
                            value={p.unit || "ขวด"}
                            onChange={(e) =>
                              updateWithdrawnProductRow(
                                pIdx,
                                "unit",
                                e.target.value,
                              )
                            }
                            placeholder="หน่วย"
                            disabled={readonly}
                            className="h-8 text-xs text-center bg-white"
                          />
                        </td>
                        {!readonly && (
                          <td className="py-2 px-3 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeWithdrawnRow(pIdx)}
                              className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
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

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 3. Actual Execution Breakdown: Stacked Cards รายแปลง */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="space-y-6 pt-2 border-t border-slate-200/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h4 className="font-bold text-slate-800 text-sm sm:text-base">
              รายงานผลการปฏิบัติงานจริง (Actual Outcome) รายแปลง
            </h4>
          </div>
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-semibold px-2.5 py-0.5"
          >
            ทั้งหมด {plotsList.length} แปลง
          </Badge>
        </div>

        {plotsList.map((plot: Type14PlotActualState, plotIdx: number) => {
          const locParts = [
            plot.subdistrict ? `ต.${plot.subdistrict}` : null,
            plot.district ? `อ.${plot.district}` : null,
            plot.province ? `จ.${plot.province}` : null,
          ].filter(Boolean);
          const locationText = locParts.length > 0 ? locParts.join(" ") : "-";

          const dealerDisplayName = plot.dealerName || "-";
          const ownerDisplayName = plot.ownerName || "-";
          const villageDisplayName = plot.village || "-";

          const plannedCount =
            plot.plannedPlotsCount != null && plot.plannedPlotsCount !== ""
              ? plot.plannedPlotsCount
              : 1;

          // Products for this plot: fallback to withdrawn products if empty
          const effectivePlotProducts: Type14ActualProductState[] =
            plot.products && plot.products.length > 0
              ? plot.products
              : (withdrawnProducts || []).map((wp) => ({
                  productId: wp.productId,
                  productName: wp.productName,
                  unit: wp.unit || "ขวด",
                  withdrawnQuantity: wp.quantity,
                  actualQuantity: wp.quantity,
                  quantityUsed: wp.quantity,
                  extraQuantity: "",
                  extraUnit: "ซีซี",
                  actualRate: "",
                }));

          return (
            <div
              key={plot.id || plotIdx}
              className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-5 shadow-2xs hover:border-emerald-200 transition-colors"
            >
              {/* Plot Header */}
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {plotIdx + 1}
                  </div>
                  <span className="font-bold text-slate-800 text-sm">
                    แปลงที่ {plotIdx + 1}:{" "}
                    {plot.plotName || plot.name || `แปลงแฮตแทค ${plotIdx + 1}`}
                  </span>
                  {dealerDisplayName !== "-" && (
                    <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                      (ตัวแทน: {dealerDisplayName})
                    </span>
                  )}
                </div>

                {!readonly && mode === "NEW_PLOT" && plotsList.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePlot(plotIdx)}
                    className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg px-2 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ลบแปลงนี้</span>
                  </Button>
                )}
              </div>

              {/* Display Information: ร้านค้า, เกษตรกร, หมู่บ้าน, จำนวนแปลงตามแผน */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="block text-[11px] text-slate-400 font-medium">
                    ร้านค้า Dealer
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 block mt-0.5 truncate">
                    {dealerDisplayName}
                  </span>
                  {locationText !== "-" && (
                    <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
                      {locationText}
                    </span>
                  )}
                </div>

                <div>
                  <span className="block text-[11px] text-slate-400 font-medium">
                    เจ้าของแปลง / เกษตรกร
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 block mt-0.5 truncate">
                    {ownerDisplayName}
                  </span>
                </div>

                <div>
                  <span className="block text-[11px] text-slate-400 font-medium">
                    หมู่บ้าน
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 block mt-0.5 truncate">
                    {villageDisplayName}
                  </span>
                </div>

                <div>
                  <span className="block text-[11px] text-slate-400 font-medium">
                    จำนวนแปลงตามแผน
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-emerald-800 block mt-0.5">
                    {plannedCount} แปลง
                  </span>
                </div>
              </div>

              {/* Input: จำนวนแปลงที่ติดตามจริง */}
              <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200">
                <div className="max-w-xs space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    จำนวนแปลงที่ติดตามจริง (แปลง){" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <ActivityInput
                    type="number"
                    min={1}
                    placeholder={
                      plannedCount
                        ? `ตามแผน: ${plannedCount} แปลง`
                        : "ระบุจำนวนแปลงที่ติดตามจริง..."
                    }
                    value={
                      plot.actualPlotsCount != null
                        ? String(plot.actualPlotsCount)
                        : ""
                    }
                    onChange={(e) =>
                      updatePlotField(
                        plotIdx,
                        "actualPlotsCount",
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    disabled={readonly}
                    required
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* 3.1 สินค้าที่ใช้จริง (Planned / Used Demo Products) */}
              <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <h5 className="text-xs sm:text-sm font-bold text-slate-800">
                      1.1 สินค้าที่ใช้จริงในการติดตามแปลง
                    </h5>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-semibold px-2 py-0.5"
                    >
                      {effectivePlotProducts.length} รายการ
                    </Badge>
                    {!readonly && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddProductToPlot(plotIdx)}
                        className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        เพิ่มสินค้า
                      </Button>
                    )}
                  </div>
                </div>

                {effectivePlotProducts.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-3 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    ไม่มีรายการสินค้าตัวอย่างสำหรับแปลงนี้ (กด &quot;เพิ่มสินค้า&quot; หากต้องการระบุ)
                  </p>
                ) : (
                  <div className="space-y-3">
                    {effectivePlotProducts.map((prod, prodIdx) => (
                      <div
                        key={prod.productId || prodIdx}
                        className="bg-emerald-50/40 border border-emerald-200/70 rounded-xl p-3.5 sm:p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-emerald-200 text-emerald-800 font-bold text-[11px] flex items-center justify-center">
                              {prodIdx + 1}
                            </span>
                            {prod.productId && prod.productName ? (
                              <span className="text-xs font-bold text-slate-900">
                                {prod.productName}
                              </span>
                            ) : (
                              <div className="w-64">
                                <ActivityProductSelect
                                  products={products as any}
                                  value={prod.productId}
                                  valueKey="id"
                                  onChange={(val, p) =>
                                    handleUpdateProductInPlot(
                                      plotIdx,
                                      prodIdx,
                                      "productId",
                                      val,
                                      p,
                                    )
                                  }
                                  placeholder="-- เลือกสินค้า --"
                                  disabled={readonly}
                                  className="h-8 text-xs bg-white"
                                />
                              </div>
                            )}
                          </div>

                          {!readonly && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleRemoveProductFromPlot(plotIdx, prodIdx)
                              }
                              className="h-6 w-6 text-rose-500 hover:bg-rose-50 rounded-md cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* จำนวนที่ใช้จริง (ขวด) */}
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">
                              จำนวนที่ใช้จริง ({prod.unit || "ขวด"}){" "}
                              <span className="text-rose-500">*</span>
                            </label>
                            <ActivityInput
                              type="number"
                              min="0"
                              value={
                                prod.actualQuantity != null
                                  ? String(prod.actualQuantity)
                                  : ""
                              }
                              onChange={(e) =>
                                handleUpdateProductInPlot(
                                  plotIdx,
                                  prodIdx,
                                  "actualQuantity",
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value),
                                )
                              }
                              disabled={readonly}
                              placeholder="เช่น 1"
                              required
                            />
                          </div>

                          {/* ปริมาณที่ใช้เพิ่ม */}
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">
                              ปริมาณที่ใช้เพิ่ม (กรณีใช้ไม่เต็มขวด)
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <ActivityInput
                                type="number"
                                min="0"
                                value={
                                  prod.extraQuantity != null
                                    ? String(prod.extraQuantity)
                                    : ""
                                }
                                onChange={(e) =>
                                  handleUpdateProductInPlot(
                                    plotIdx,
                                    prodIdx,
                                    "extraQuantity",
                                    e.target.value,
                                  )
                                }
                                disabled={readonly}
                                placeholder="เช่น 250"
                              />
                              <ActivitySelect
                                value={prod.extraUnit || "ซีซี"}
                                onChange={(val) =>
                                  handleUpdateProductInPlot(
                                    plotIdx,
                                    prodIdx,
                                    "extraUnit",
                                    val,
                                  )
                                }
                                options={[
                                  { value: "ซีซี", label: "ซีซี (ขวด)" },
                                  { value: "กรัม", label: "กรัม (ซอง)" },
                                ]}
                                disabled={readonly}
                              />
                            </div>
                          </div>

                          {/* อัตราการใช้ */}
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">
                              อัตราการใช้{" "}
                              <span className="text-rose-500">*</span>
                            </label>
                            <ActivityInput
                              value={
                                prod.actualRate || prod.applicationRate || ""
                              }
                              onChange={(e) =>
                                handleUpdateProductInPlot(
                                  plotIdx,
                                  prodIdx,
                                  "actualRate",
                                  e.target.value,
                                )
                              }
                              disabled={readonly}
                              placeholder="เช่น 20 ซีซี / น้ำ 20 ลิตร"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3.2 ผลการตรวจติดตามแปลง (Follow-up Observation) */}
              <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <h5 className="text-xs sm:text-sm font-bold text-slate-800">
                    1.2 ผลการตรวจติดตามแปลง
                  </h5>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {/* วันที่ติดตามผล */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      วันที่ติดตามผล <span className="text-rose-500">*</span>
                    </label>
                    <ActivityInput
                      type="date"
                      value={plot.actualVisitDate || ""}
                      onChange={(e) =>
                        updatePlotField(
                          plotIdx,
                          "actualVisitDate",
                          e.target.value,
                        )
                      }
                      disabled={readonly}
                      required
                      className="h-9 text-xs"
                    />
                  </div>

                  {/* ระยะเวลาหลังฉีดพ่น (วัน) */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      ระยะเวลาหลังฉีดพ่น (วัน)
                    </label>
                    <ActivityInput
                      type="number"
                      min="0"
                      placeholder="เช่น 7, 14, 21"
                      value={
                        plot.daysAfterSpray != null
                          ? String(plot.daysAfterSpray)
                          : ""
                      }
                      onChange={(e) =>
                        updatePlotField(
                          plotIdx,
                          "daysAfterSpray",
                          e.target.value,
                        )
                      }
                      disabled={readonly}
                      className="h-9 text-xs"
                    />
                  </div>

                  {/* ผลการติดตามแปลง */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      ผลการติดตามแปลง <span className="text-rose-500">*</span>
                    </label>
                    <ActivitySelect
                      value={plot.trackingResult || "ได้ผลตามเกณฑ์"}
                      onChange={(val) =>
                        updatePlotField(plotIdx, "trackingResult", val)
                      }
                      options={[...TRACKING_RESULT_OPTIONS]}
                      disabled={readonly}
                    />
                  </div>

                  {/* การตอบสนองของพืช */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      การตอบสนองของพืช
                    </label>
                    <ActivitySelect
                      value={plot.productResponse || "ปกติ"}
                      onChange={(val) =>
                        updatePlotField(plotIdx, "productResponse", val)
                      }
                      options={[...PRODUCT_RESPONSE_OPTIONS]}
                      disabled={readonly}
                    />
                  </div>
                </div>

                {/* บันทึกข้อสังเกตเพิ่มเติม / ปัญหาที่พบ */}
                <div className="space-y-1 pt-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    บันทึกข้อสังเกตเพิ่มเติม / ปัญหาที่พบ
                  </label>
                  <ActivityInput
                    placeholder="ระบุข้อสังเกต สภาพพืช อาการ หรือแนวทางแก้ไข..."
                    value={plot.additionalNotes || ""}
                    onChange={(e) =>
                      updatePlotField(
                        plotIdx,
                        "additionalNotes",
                        e.target.value,
                      )
                    }
                    disabled={readonly}
                    className="h-9 text-xs"
                  />
                </div>

                {/* สถานะของแปลงแฮตแทคหลังการติดตาม (Plot Status Toggle) */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      สถานะของแปลงแฮตแทคหลังการติดตามรอบนี้{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      {HATTACK_PLOT_STATUS_OPTIONS.map((opt) => {
                        const isSelected =
                          (plot.plotStatus || "IN_PROGRESS") === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            disabled={readonly}
                            onClick={() =>
                              updatePlotField(plotIdx, "plotStatus", opt.value)
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                              isSelected
                                ? opt.value === "COMPLETED"
                                  ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                                  : "bg-blue-600 text-white border-blue-600 shadow-2xs"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {opt.value === "COMPLETED"
                              ? "ปิดแปลงแล้ว (สิ้นสุดการทดลอง)"
                              : "ต้องติดตามต่อ"}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {plot.plotStatus === "COMPLETED" && (
                    <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/80 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          แปลงนี้จะถูกบันทึกเป็น &quot;ปิดแปลงแล้ว&quot; (ไม่แสดงในรายการสร้างแผนติดตามรอบใหม่)
                        </span>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-emerald-900">
                          สรุปผลการปิดแปลง / ความพึงพอใจของเกษตรกร
                        </label>
                        <ActivityInput
                          placeholder="เช่น ผลการควบคุมหนอนดีเยี่ยม เกษตรกรพึงพอใจมาก แปลงสมบูรณ์พร้อมเก็บเกี่ยว..."
                          value={plot.closureNotes || ""}
                          onChange={(e) =>
                            updatePlotField(
                              plotIdx,
                              "closureNotes",
                              e.target.value,
                            )
                          }
                          disabled={readonly}
                          className="h-9 text-xs bg-white border-emerald-200"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 3.3 รูปหลังติดตามแปลง (ต่อหมู่บ้าน) using ActivityPhotoUpload */}
              <ActivityPhotoUpload
                title="รูปหลังติดตามแปลง (ต่อหมู่บ้าน)"
                description={`รองรับไฟล์รูปภาพ PNG, JPG หรือ WEBP (สูงสุด ${TYPE14_MAX_IMAGES_PER_VILLAGE} รูปต่อหมู่บ้าน)`}
                images={(plot.afterSprayImages as any) || []}
                onImagesChange={(imgs: ImageFile[]) =>
                  updatePlotField(plotIdx, "afterSprayImages", imgs)
                }
                maxFiles={TYPE14_MAX_IMAGES_PER_VILLAGE}
                accentColor="emerald"
                readonly={readonly}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
