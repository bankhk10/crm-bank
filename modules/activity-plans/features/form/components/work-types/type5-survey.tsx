import React from "react";
import { BarChart2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Type5SurveyItem } from "../../types";
import { DEMO_PRODUCTS, STORES_LIST } from "../../constants";

interface Props {
  readonly?: boolean;
  type5Items: Type5SurveyItem[];
  addType5Row: () => void;
  updateType5Row: (id: string, field: keyof Type5SurveyItem, val: any) => void;
  deleteType5Row: (id: string) => void;
}

export function Type5Survey({
  readonly = false,
  type5Items,
  addType5Row,
  updateType5Row,
  deleteType5Row,
}: Props) {
  return (
    <div className="bg-purple-50/40 border border-purple-200/80 rounded-xl p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-purple-200/60 pb-2.5">
        <div className="flex items-center gap-2 text-purple-800 font-bold text-sm">
          <BarChart2 className="h-4 w-4 text-purple-600" />
          <span>สำรวจตลาดของคู่แข่ง</span>
        </div>

        {!readonly && (
          <Button
            type="button"
            size="sm"
            onClick={addType5Row}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            เพิ่มรายการ
          </Button>
        )}
      </div>

      {/* List of Survey Cards */}
      <div className="space-y-3">
        {type5Items.length === 0 ? (
          <div className="py-6 text-center text-slate-400 italic bg-white rounded-xl border border-slate-200 text-xs">
            ยังไม่มีรายการสำรวจ กด "+ เพิ่มรายการ" เพื่อบันทึก
          </div>
        ) : (
          type5Items.map((item, index) => (
            <div
              key={item.id}
              className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3 transition-all hover:border-purple-300"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-purple-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[11px] font-extrabold">
                    {index + 1}
                  </span>
                  รายการสำรวจที่ {index + 1}
                </span>
                {!readonly && (
                  <button
                    type="button"
                    onClick={() => deleteType5Row(item.id)}
                    className="p-1 rounded-md text-red-500 hover:bg-red-50 text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>ลบรายการ</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ตัวเลือกร้านค้า <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={item.storeName}
                    onChange={(e) =>
                      updateType5Row(item.id, "storeName", e.target.value)
                    }
                    disabled={readonly}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium bg-white"
                  >
                    <option value="">-- เลือกร้านค้า --</option>
                    {STORES_LIST.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    สินค้าที่นำไปเปรียบเทียบ <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={item.comparedProduct}
                    onChange={(e) =>
                      updateType5Row(
                        item.id,
                        "comparedProduct",
                        e.target.value,
                      )
                    }
                    disabled={readonly}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium bg-white"
                  >
                    {DEMO_PRODUCTS.map((prod) => (
                      <option key={prod} value={prod}>
                        {prod}
                      </option>
                    ))}
                  </select>
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
                    updateType5Row(item.id, "detail", e.target.value)
                  }
                  disabled={readonly}
                  placeholder="ระบุรายละเอียดเพิ่มเติมการสำรวจ..."
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
