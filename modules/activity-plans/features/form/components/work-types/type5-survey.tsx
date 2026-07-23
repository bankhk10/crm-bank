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

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
            <tr>
              <th className="py-2.5 px-3 text-center w-12">ลำดับ</th>
              <th className="py-2.5 px-3 min-w-[180px]">
                ตัวเลือกร้านค้า <span className="text-red-500">*</span>
              </th>
              <th className="py-2.5 px-3 min-w-[180px]">
                สินค้าที่นำไปเปรียบเทียบ <span className="text-red-500">*</span>
              </th>
              <th className="py-2.5 px-3 min-w-[180px]">รายละเอียดเพิ่มเติม</th>
              {!readonly && (
                <th className="py-2.5 px-3 text-center w-16">จัดการ</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {type5Items.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-4 text-center text-slate-400 italic"
                >
                  ยังไม่มีรายการสำรวจ กด "เพิ่มรายการ" เพื่อบันทึก
                </td>
              </tr>
            ) : (
              type5Items.map((item, index) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-2.5 px-3 text-center font-medium text-slate-500">
                    {index + 1}
                  </td>
                  <td className="py-2 px-3">
                    <select
                      value={item.storeName}
                      onChange={(e) =>
                        updateType5Row(
                          item.id,
                          "storeName",
                          e.target.value,
                        )
                      }
                      disabled={readonly}
                      className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                    >
                      <option value="">-- เลือกร้านค้า --</option>
                      {STORES_LIST.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-3">
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
                      className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                    >
                      {DEMO_PRODUCTS.map((prod) => (
                        <option key={prod} value={prod}>
                          {prod}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={item.detail}
                      onChange={(e) =>
                        updateType5Row(item.id, "detail", e.target.value)
                      }
                      disabled={readonly}
                      placeholder="ระบุรายละเอียด..."
                      className="w-full h-8 px-2.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </td>
                  {!readonly && (
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => deleteType5Row(item.id)}
                        className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
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
  );
}
