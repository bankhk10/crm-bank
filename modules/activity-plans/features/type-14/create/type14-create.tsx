"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Layers, Loader2, Store, MapPin } from "lucide-react";
import { FormCombobox } from "@/components/custom/FormCombobox";
import type { Type14PlanInput, DealerCustomerOption } from "../shared/types";
import { getHattackFollowUpDemoPlotsAction } from "../../../server/actions";
import type { Type14CreateProps } from "./types";

export type { Type14CreateProps };

export function Type14Create({
  value,
  onChange,
  dealerCustomers = [],
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
    return existingPlots.map((plot) => ({
      value: plot.id,
      label: "ฉีดแปลงแฮตแทค",
      subLabel: `ชื่อกิจกรรม: ${plot.activityName || plot.name}`,
    }));
  }, [existingPlots]);

  // Selected plot object for lookup
  const selectedPlot = useMemo(() => {
    return existingPlots.find((p) => p.id === value.demoPlotId);
  }, [existingPlots, value.demoPlotId]);

  // Display name for the Dealer customer
  const dealerDisplayName = useMemo(() => {
    if (!value.storeId && !selectedPlot) return "";
    const fromDealerList = dealerCustomers.find((d) => d.id === value.storeId);
    if (fromDealerList) return fromDealerList.name;
    return selectedPlot?.dealerName || selectedPlot?.customer?.name || value.storeId || "";
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
      storeId: selected.dealerId || selected.customerId || selected.customer?.id || "",
      ownerName: selected.ownerName || selected.farmerName || "",
      province: selected.province || defaultProvince || "",
      district: selected.district || defaultDistrict || "",
      latitude: "",
      longitude: "",
      trackings: [],
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
    </div>
  );
}

export default Type14Create;
