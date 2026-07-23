import React from "react";
import { Sprout, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Type7DemoPlotItem } from "../../types";
import {
  DEMO_PRODUCTS,
  DEMO_OWNERS,
  CROP_CATEGORIES,
  CROPS_BY_CATEGORY,
} from "../../constants";

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
}

export function Type7Demo({
  readonly = false,
  type7Items,
  addType7Row,
  updateType7Row,
  deleteType7Row,
}: Props) {
  return (
    <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-xl p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2.5">
        <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
          <Sprout className="h-4 w-4 text-emerald-600" />
          <span>ติดตามแปลงสาธิต / พืชเป้าหมาย</span>
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
      <div className="space-y-3">
        {type7Items.length === 0 ? (
          <div className="py-6 text-center text-slate-400 italic bg-white rounded-xl border border-slate-200 text-xs">
            ยังไม่มีรายการแปลงสาธิต กด "+ เพิ่มรายการ" เพื่อบันทึก
          </div>
        ) : (
          type7Items.map((item, index) => {
            const availableCrops = CROPS_BY_CATEGORY[item.cropCategory] || [];
            const isRaiUnit = ["พืชไร่", "ผักและพืชล้มลุก"].includes(
              item.cropCategory,
            );

            return (
              <div
                key={item.id}
                className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3 transition-all hover:border-emerald-300"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      เจ้าของแปลง <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={item.ownerName}
                      onChange={(e) =>
                        updateType7Row(item.id, "ownerName", e.target.value)
                      }
                      disabled={readonly}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
                    >
                      <option value="">-- เลือกเจ้าของแปลง --</option>
                      {DEMO_OWNERS.map((owner) => (
                        <option key={owner} value={owner}>
                          {owner}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      สินค้าที่จะสาธิต <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={item.productName}
                      onChange={(e) =>
                        updateType7Row(item.id, "productName", e.target.value)
                      }
                      disabled={readonly}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
                    >
                      <option value="">-- เลือกสินค้า --</option>
                      {DEMO_PRODUCTS.map((prod) => (
                        <option key={prod} value={prod}>
                          {prod}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      หมวดพืช
                    </label>
                    <select
                      value={item.cropCategory}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        updateType7Row(item.id, "cropCategory", newCat);
                        const nextCrops = CROPS_BY_CATEGORY[newCat] || [];
                        if (
                          nextCrops.length > 0 &&
                          !nextCrops.includes(item.cropName)
                        ) {
                          updateType7Row(item.id, "cropName", nextCrops[0]);
                        }
                      }}
                      disabled={readonly}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
                    >
                      <option value="">-- เลือกหมวด --</option>
                      {CROP_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      ชื่อพืช
                    </label>
                    <select
                      value={item.cropName}
                      onChange={(e) =>
                        updateType7Row(item.id, "cropName", e.target.value)
                      }
                      disabled={readonly || !item.cropCategory}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">-- เลือกชื่อพืช --</option>
                      {availableCrops.map((crop) => (
                        <option key={crop} value={crop}>
                          {crop}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      จำนวน <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        min={1}
                        value={item.plotsCount}
                        onChange={(e) =>
                          updateType7Row(
                            item.id,
                            "plotsCount",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        disabled={readonly}
                        className="w-full h-9 pl-3 pr-8 rounded-lg border border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
                      />
                      <span className="absolute right-3 text-[11px] font-semibold text-slate-500 pointer-events-none">
                        {isRaiUnit ? "ไร่" : "ต้น"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    รายละเอียดเพิ่มเติม
                  </label>
                  <input
                    type="text"
                    value={item.detail}
                    onChange={(e) =>
                      updateType7Row(item.id, "detail", e.target.value)
                    }
                    disabled={readonly}
                    placeholder="ระบุรายละเอียดเพิ่มเติมของแปลงสาธิต..."
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
