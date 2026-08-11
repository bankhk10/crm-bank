import React from "react";
import { Sprout, Plus, Trash2, PlusCircle, Search, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormCombobox } from "@/components/custom/form-components";
import { cn } from "@/lib/utils";
import type { Type7DemoPlotItem } from "../../types";
import {
  DEMO_PRODUCTS,
  DEMO_OWNERS,
  CROP_CATEGORIES,
  CROPS_BY_CATEGORY,
  DEMO_PRODUCT_PRICES,
  USER_DEMO_PLOTS,
  type UserDemoPlotOption,
} from "../../constants";

export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  responsibleEmployeeId?: string | null;
}

export interface ProductOption {
  id: string;
  name: string;
  productCode?: string | null;
  price?: number | null;
}

interface Props {
  readonly?: boolean;
  type7Items: Type7DemoPlotItem[];
  addType7Row: () => void;
  updateType7Row: (
    id: string,
    field: keyof Type7DemoPlotItem,
    val: any,
  ) => void;
  deleteType7Row: (id: string) => void;
  customers?: CustomerOption[];
  products?: ProductOption[];
  demoPlots?: UserDemoPlotOption[];
  parentStartDate?: string;
}

export function Type7Demo({
  readonly = false,
  type7Items,
  addType7Row,
  updateType7Row,
  deleteType7Row,
  customers = [],
  products = [],
  demoPlots = [],
  parentStartDate = "",
}: Props) {
  // Collect plots created in the current form state (CREATE mode items)
  const currentFormCreatedPlots: UserDemoPlotOption[] = type7Items
    .filter(
      (i) =>
        (i.plotActivityType || "CREATE") === "CREATE" &&
        (i.ownerName || i.cropName),
    )
    .map((i) => {
      const cropDisplay = i.customCropName || i.cropName || "";
      const ownerDisplay = i.ownerName || "เกษตรกร";
      const name = cropDisplay
        ? `${ownerDisplay} - ${cropDisplay}`
        : ownerDisplay;
      return {
        id: `form-created-${i.id}`,
        name,
        location: `แปลงสาธิต ${ownerDisplay}`,
        targetCrop: cropDisplay,
        showcase: i.productName || "สินค้าสาธิต",
        ownerName: ownerDisplay,
        cropCategory: i.cropCategory || "พืชสวน",
        cropName: i.cropName || "พืชสวน",
        productName: i.productName || "",
        areaRai: i.areaRai || 0,
        treeCount: i.treeCount || 0,
        startDate: i.startDate || "",
      };
    });

  const basePlotList = demoPlots || [];

  const combinedPlotsMap = new Map<string, UserDemoPlotOption>();
  currentFormCreatedPlots.forEach((p) => combinedPlotsMap.set(p.name, p));
  basePlotList.forEach((p) => {
    if (!combinedPlotsMap.has(p.name)) {
      combinedPlotsMap.set(p.name, p);
    }
  });

  const plotList = Array.from(combinedPlotsMap.values());

  const customerOptions = (
    customers && customers.length > 0
      ? customers
      : DEMO_OWNERS.map((owner) => ({
          id: owner,
          name: owner,
          customerCode: null,
        }))
  ).map((c) => ({
    value: c.name,
    label: c.name,
  }));

  const productOptions = (
    products && products.length > 0
      ? products
      : DEMO_PRODUCTS.map((prod) => ({
          id: prod,
          name: prod,
          productCode: null,
          price: DEMO_PRODUCT_PRICES[prod] ?? 500,
        }))
  ).map((p) => ({
    value: p.name,
    label: p.name,
    subLabel: p.productCode || undefined,
  }));

  const cropCategoryOptions = CROP_CATEGORIES.map((cat) => ({
    value: cat,
    label: cat,
  }));

  const existingPlotOptions = plotList.map((plot) => ({
    value: plot.name,
    label: plot.name,
    subLabel:
      plot.productName || plot.showcase
        ? `สินค้า: ${plot.productName || plot.showcase}`
        : undefined,
  }));

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <Sprout className="h-4 w-4 text-slate-600" />
          <span>ติดตามแปลงสาธิต / ทำแปลง</span>
        </div>

        {!readonly && (
          <Button
            type="button"
            size="sm"
            onClick={addType7Row}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            เพิ่มรายการ
          </Button>
        )}
      </div>

      {/* List of Demo Plot Cards */}
      <div className="space-y-4">
        {type7Items.length === 0 ? (
          <div className="py-6 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
            ยังไม่มีรายการแปลงสาธิต
          </div>
        ) : (
          type7Items.map((item, index) => {
            const mode = item.plotActivityType || "CREATE";
            const availableCropOptions = (
              CROPS_BY_CATEGORY[item.cropCategory] || []
            ).map((crop) => ({
              value: crop,
              label: crop,
            }));

            const isRaiUnit = ["พืชไร่", "ผักและพืชล้มลุก"].includes(
              item.cropCategory,
            );

            const isCustomCropName = [
              "ผักและพืชล้มลุกอื่นๆ",
              "พืชไร่อื่นๆ",
              "พืชสวนอื่นๆ",
            ].includes(item.cropName);

            // Find selected existing plot info for FOLLOW_UP read-only card
            const selectedPlot = plotList.find(
              (p) =>
                p.name === item.existingPlotName ||
                p.id === item.existingPlotId ||
                p.name === item.existingPlotId,
            );

            return (
              <div
                key={item.id}
                className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4 transition-all hover:border-emerald-300"
              >
                {/* Header bar */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[11px] font-extrabold">
                      {index + 1}
                    </span>
                    รายการแปลงสาธิตที่ {index + 1}
                  </span>
                  {!readonly && (
                    <button
                      type="button"
                      onClick={() => deleteType7Row(item.id)}
                      className="p-1 rounded-md text-red-500 hover:bg-red-50 text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>ลบรายการ</span>
                    </button>
                  )}
                </div>

                {/* 1. Toggle Segmented Control */}
                <div className="space-y-1.5 pt-0.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    ประเภทงาน <span className="text-red-500">*</span>
                  </label>
                  <div className="inline-flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 gap-1 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() =>
                        updateType7Row(item.id, "plotActivityType", "CREATE")
                      }
                      disabled={readonly}
                      className={cn(
                        "flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
                        mode === "CREATE"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60",
                      )}
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      <span>ทำแปลงสาธิต</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateType7Row(item.id, "plotActivityType", "FOLLOW_UP")
                      }
                      disabled={readonly}
                      className={cn(
                        "flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
                        mode === "FOLLOW_UP"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60",
                      )}
                    >
                      <Search className="h-3.5 w-3.5" />
                      <span>ติดตามแปลงสาธิต</span>
                    </button>
                  </div>
                </div>

                {/* 2. MODE: ทำแปลงสาธิต (CREATE) */}
                {mode === "CREATE" && (
                  <div className="space-y-3.5 pt-1">
                    {/* Row 1: เจ้าของแปลง + สินค้าที่จะสาธิต */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormCombobox
                        id={`owner-combobox-${item.id}`}
                        label="เจ้าของแปลง"
                        labelClassName="block text-xs font-medium text-slate-700 mb-1 mx-0"
                        triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                        value={item.ownerName}
                        onChange={(val) =>
                          updateType7Row(item.id, "ownerName", val)
                        }
                        options={customerOptions}
                        placeholder="เลือกเจ้าของแปลง..."
                        searchPlaceholder="ค้นหาเจ้าของแปลง / ลูกค้า..."
                        emptyText="ไม่พบเจ้าของแปลง"
                        disabled={readonly}
                        required
                      />

                      <FormCombobox
                        id={`product-combobox-${item.id}`}
                        label="สินค้าที่จะสาธิต"
                        labelClassName="block text-xs font-medium text-slate-700 mb-1 mx-0"
                        triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                        value={item.productName}
                        onChange={(val) =>
                          updateType7Row(item.id, "productName", val)
                        }
                        options={productOptions}
                        placeholder="เลือกสินค้า..."
                        searchPlaceholder="ค้นหาสินค้า..."
                        emptyText="ไม่พบสินค้า"
                        disabled={readonly}
                        required
                      />
                    </div>

                    {/* Row 2: หมวดพืช + ชื่อพืช + (ระบุชื่อพืชเพิ่มเติม) + พื้นที่แปลง + จำนวนต้น */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div
                        className={
                          isCustomCropName ? "md:col-span-3" : "md:col-span-5"
                        }
                      >
                        <FormCombobox
                          id={`crop-category-combobox-${item.id}`}
                          label="หมวดพืช"
                          labelClassName="block text-xs font-medium text-slate-700 mb-1 mx-0"
                          triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                          value={item.cropCategory}
                          onChange={(newCat) => {
                            updateType7Row(item.id, "cropCategory", newCat);
                            const nextCrops = CROPS_BY_CATEGORY[newCat] || [];
                            if (
                              nextCrops.length > 0 &&
                              !nextCrops.includes(item.cropName)
                            ) {
                              updateType7Row(item.id, "cropName", nextCrops[0]);
                            }
                          }}
                          options={cropCategoryOptions}
                          placeholder="เลือกหมวด..."
                          searchPlaceholder="ค้นหาหมวดพืช..."
                          emptyText="ไม่พบหมวดพืช"
                          disabled={readonly}
                        />
                      </div>

                      <div
                        className={
                          isCustomCropName ? "md:col-span-4" : "md:col-span-5"
                        }
                      >
                        <FormCombobox
                          id={`crop-name-combobox-${item.id}`}
                          label="ชื่อพืช"
                          labelClassName="block text-xs font-medium text-slate-700 mb-1 mx-0"
                          triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                          value={item.cropName}
                          onChange={(val) => {
                            updateType7Row(item.id, "cropName", val);
                            if (
                              ![
                                "ผักและพืชล้มลุกอื่นๆ",
                                "พืชไร่อื่นๆ",
                                "พืชสวนอื่นๆ",
                              ].includes(val)
                            ) {
                              updateType7Row(item.id, "customCropName", "");
                            }
                          }}
                          options={availableCropOptions}
                          placeholder="เลือกชื่อพืช..."
                          searchPlaceholder="ค้นหาชื่อพืช..."
                          emptyText="ไม่พบชื่อพืช"
                          disabled={readonly || !item.cropCategory}
                        />
                      </div>

                      {isCustomCropName && (
                        <div className="md:col-span-3">
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            ระบุชื่อพืชเพิ่มเติม{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={item.customCropName || ""}
                            onChange={(e) =>
                              updateType7Row(
                                item.id,
                                "customCropName",
                                e.target.value,
                              )
                            }
                            disabled={readonly}
                            placeholder="ระบุชื่อพืช..."
                            className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                          />
                        </div>
                      )}

                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          {!item.cropCategory ? (
                            <>
                              จำนวน <span className="text-red-500">*</span>
                            </>
                          ) : isRaiUnit ? (
                            <>
                              พื้นที่ (ไร่){" "}
                              <span className="text-red-500">*</span>
                            </>
                          ) : (
                            <>
                              จำนวนต้น <span className="text-red-500">*</span>
                            </>
                          )}
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            min={1}
                            value={
                              isRaiUnit
                                ? (item.areaRai ?? item.plotsCount ?? "")
                                : (item.treeCount ?? item.plotsCount ?? "")
                            }
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              updateType7Row(item.id, "plotsCount", val);
                              if (isRaiUnit) {
                                updateType7Row(item.id, "areaRai", val);
                              } else {
                                updateType7Row(item.id, "treeCount", val);
                              }
                            }}
                            disabled={readonly || !item.cropCategory}
                            placeholder="0"
                            className="w-full h-9 pl-3 pr-8 rounded-lg border border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white disabled:bg-slate-50"
                          />
                          <span className="absolute right-3 text-[11px] font-semibold text-slate-500 pointer-events-none">
                            {!item.cropCategory
                              ? "-"
                              : isRaiUnit
                                ? "ไร่"
                                : "ต้น"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Row 3: วันที่เริ่มทำแปลง + วัตถุประสงค์ของแปลง */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-4">
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          วันที่เริ่มทำแปลง{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={item.startDate || ""}
                          onChange={(e) =>
                            updateType7Row(item.id, "startDate", e.target.value)
                          }
                          disabled={readonly}
                          className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
                        />
                      </div>

                      <div className="md:col-span-8">
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          วัตถุประสงค์ของแปลง
                        </label>
                        <input
                          type="text"
                          value={item.objective || ""}
                          onChange={(e) =>
                            updateType7Row(item.id, "objective", e.target.value)
                          }
                          disabled={readonly}
                          placeholder="ระบุวัตถุประสงค์ของแปลง..."
                          className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        />
                      </div>
                    </div>

                    {/* Row 4: รายละเอียด / วิธีการทดลอง */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        รายละเอียด / วิธีการทดลอง
                      </label>
                      <textarea
                        rows={2}
                        value={item.detail || ""}
                        onChange={(e) =>
                          updateType7Row(item.id, "detail", e.target.value)
                        }
                        disabled={readonly}
                        placeholder="ระบุรายละเอียดขั้นตอน สภาพแปลง หรือวิธีการทดลอง..."
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* 3. MODE: ติดตามแปลงสาธิต (FOLLOW_UP) */}
                {mode === "FOLLOW_UP" && (
                  <div className="space-y-3.5 pt-1">
                    {/* Select Existing Plot + Follow-up Date */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-8">
                        <FormCombobox
                          id={`existing-plot-combobox-${item.id}`}
                          label="แปลงสาธิต"
                          labelClassName="block text-xs font-medium text-slate-700 mb-1 mx-0"
                          triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                          value={
                            item.existingPlotName || item.existingPlotId || ""
                          }
                          onChange={(val) => {
                            const match = plotList.find(
                              (p) => p.name === val || p.id === val,
                            );
                            updateType7Row(
                              item.id,
                              "existingPlotId",
                              match?.id || val,
                            );
                            updateType7Row(
                              item.id,
                              "existingPlotName",
                              match?.name || val,
                            );
                            if (match) {
                              if (match.ownerName)
                                updateType7Row(
                                  item.id,
                                  "ownerName",
                                  match.ownerName,
                                );
                              if (match.productName)
                                updateType7Row(
                                  item.id,
                                  "productName",
                                  match.productName,
                                );
                              if (match.cropCategory)
                                updateType7Row(
                                  item.id,
                                  "cropCategory",
                                  match.cropCategory,
                                );
                              if (match.cropName)
                                updateType7Row(
                                  item.id,
                                  "cropName",
                                  match.targetCrop || match.cropName,
                                );
                              if (match.areaRai !== undefined)
                                updateType7Row(
                                  item.id,
                                  "areaRai",
                                  match.areaRai,
                                );
                              if (match.treeCount !== undefined)
                                updateType7Row(
                                  item.id,
                                  "treeCount",
                                  match.treeCount,
                                );
                            }
                          }}
                          options={existingPlotOptions}
                          placeholder="เลือกแปลงสาธิตที่มีอยู่แล้ว..."
                          searchPlaceholder="ค้นหาแปลงสาธิตเดิม..."
                          emptyText="ไม่พบแปลงสาธิตเดิม"
                          disabled={readonly}
                          required
                        />
                      </div>

                      <div className="md:col-span-4 mt-1">
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          วันที่ติดตาม <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={item.followUpDate || parentStartDate || ""}
                          onChange={(e) =>
                            updateType7Row(
                              item.id,
                              "followUpDate",
                              e.target.value,
                            )
                          }
                          disabled={readonly}
                          className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
                        />
                      </div>
                    </div>

                    {/* Read-Only Summary Card for Selected Plot */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Info className="h-3.5 w-3.5 text-emerald-600" />
                          ข้อมูลแปลงสาธิตเดิม (Read-only)
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
                          แปลงเดิมในระบบ
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-slate-700">
                        <div>
                          <span className="font-semibold text-slate-500">
                            เจ้าของแปลง:{" "}
                          </span>
                          <span className="font-bold">
                            {selectedPlot?.ownerName || "-"}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-500">
                            พืช:{" "}
                          </span>
                          <span className="font-bold">
                            {selectedPlot?.targetCrop ||
                              selectedPlot?.cropName ||
                              "-"}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-500">
                            สินค้าสาธิต:{" "}
                          </span>
                          <span className="font-bold">
                            {selectedPlot?.showcase ||
                              selectedPlot?.productName ||
                              "-"}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-500">
                            พื้นที่/จำนวน:{" "}
                          </span>
                          <span className="font-bold">
                            {(() => {
                              if (!selectedPlot) return "-";
                              const cat = selectedPlot.cropCategory || "";
                              const isRai = [
                                "พืชไร่",
                                "ผักและพืชล้มลุก",
                              ].includes(cat);
                              if (isRai) {
                                return selectedPlot.areaRai
                                  ? `${selectedPlot.areaRai} ไร่`
                                  : "-";
                              }
                              return selectedPlot.treeCount
                                ? `${selectedPlot.treeCount} ต้น`
                                : "-";
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Details / Follow-up Notes */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        รายละเอียดเพิ่มเติม
                      </label>
                      <textarea
                        rows={2}
                        value={item.detail || ""}
                        onChange={(e) =>
                          updateType7Row(item.id, "detail", e.target.value)
                        }
                        disabled={readonly}
                        placeholder="ระบุรายละเอียดเพิ่มเติมครั้งนี้..."
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
