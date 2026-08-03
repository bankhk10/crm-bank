import React from "react";
import { Users, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Type8MeetingItem } from "../../types";
import { DEMO_PRODUCTS } from "../../constants";

interface Props {
  readonly?: boolean;
  type8Items: Type8MeetingItem[];
  addType8Row: () => void;
  updateType8Row: (id: string, field: keyof Type8MeetingItem, val: any) => void;
  deleteType8Row: (id: string) => void;
}

export function Type8Meeting({
  readonly = false,
  type8Items,
  addType8Row,
  updateType8Row,
  deleteType8Row,
}: Props) {
  return (
    <div className="bg-blue-50/40 border border-blue-200/80 rounded-xl p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-blue-200/60 pb-2.5">
        <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
          <Users className="h-4 w-4 text-blue-600" />
          <span>จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์</span>
        </div>

        {!readonly && (
          <Button
            type="button"
            size="sm"
            onClick={addType8Row}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            เพิ่มรายการ
          </Button>
        )}
      </div>

      {/* List of Meeting Cards */}
      <div className="space-y-3">
        {type8Items.length === 0 ? (
          <div className="py-6 text-center text-slate-400 italic bg-white rounded-xl border border-slate-200 text-xs">
            ยังไม่มีรายการประชุม
          </div>
        ) : (
          type8Items.map((item, index) => {
            const selectedProducts = item.targetProducts || [];
            return (
              <div
                key={item.id}
                className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3 transition-all hover:border-blue-300"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-extrabold">
                      {index + 1}
                    </span>
                    รายการประชุมที่ {index + 1}
                  </span>
                  {!readonly && (
                    <button
                      type="button"
                      onClick={() => deleteType8Row(item.id)}
                      className="p-1 rounded-md text-red-500 hover:bg-red-50 text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>ลบรายการ</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      หัวข้อที่จะประชุม <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={item.topic}
                      onChange={(e) =>
                        updateType8Row(item.id, "topic", e.target.value)
                      }
                      disabled={readonly}
                      placeholder="เช่น ประชุมวางแผนฤดูกาลเพาะปลูก..."
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      สินค้าเป้าหมาย (สูงสุด 3 รายการ)
                    </label>
                    <div className="space-y-1.5">
                      {selectedProducts.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {selectedProducts.map((prod) => (
                            <span
                              key={prod}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[11px] font-medium border border-blue-200"
                            >
                              {prod}
                              {!readonly && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = selectedProducts.filter(
                                      (p) => p !== prod,
                                    );
                                    updateType8Row(
                                      item.id,
                                      "targetProducts",
                                      updated,
                                    );
                                  }}
                                  className="text-blue-500 hover:text-blue-700 font-bold"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      )}

                      {!readonly && selectedProducts.length < 3 && (
                        <select
                          value=""
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) return;
                            if (
                              selectedProducts.length < 3 &&
                              !selectedProducts.includes(val)
                            ) {
                              updateType8Row(item.id, "targetProducts", [
                                ...selectedProducts,
                                val,
                              ]);
                            }
                          }}
                          className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-700 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        >
                          <option value="">
                            + เพิ่มสินค้าเป้าหมาย ({selectedProducts.length}
                            /3)
                          </option>
                          {DEMO_PRODUCTS.filter(
                            (p) => !selectedProducts.includes(p),
                          ).map((prod) => (
                            <option key={prod} value={prod}>
                              {prod}
                            </option>
                          ))}
                        </select>
                      )}

                      {selectedProducts.length === 3 && (
                        <span className="text-[10px] text-amber-600 font-medium block">
                          เลือกครบ 3 รายการแล้ว
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      เป้าหมายผู้เข้าร่วม (คน){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={item.attendeesCount}
                      onChange={(e) =>
                        updateType8Row(
                          item.id,
                          "attendeesCount",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      disabled={readonly}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-white"
                    />
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
                      updateType8Row(item.id, "detail", e.target.value)
                    }
                    disabled={readonly}
                    placeholder="ระบุรายละเอียดเพิ่มเติมการจัดประชุม..."
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
