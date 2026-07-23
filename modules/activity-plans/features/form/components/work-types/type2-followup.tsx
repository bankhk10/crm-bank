import React from "react";
import { CheckSquare, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Type2ProductFollowupItem } from "../../types";
import { DEMO_PRODUCTS, DEMO_OWNERS } from "../../constants";

interface Props {
  readonly?: boolean;
  type2Items: Type2ProductFollowupItem[];
  addType2Row: () => void;
  updateType2Row: (
    id: string,
    field: keyof Type2ProductFollowupItem,
    val: any,
  ) => void;
  deleteType2Row: (id: string) => void;
}

export function Type2Followup({
  readonly = false,
  type2Items,
  addType2Row,
  updateType2Row,
  deleteType2Row,
}: Props) {
  return (
    <div className="bg-indigo-50/40 border border-indigo-200/80 rounded-xl p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-indigo-200/60 pb-2.5">
        <div className="flex items-center gap-2 text-indigo-800 font-bold text-sm">
          <CheckSquare className="h-4 w-4 text-indigo-600" />
          <span>ติดตามผลการใช้สินค้า</span>
        </div>

        {!readonly && (
          <Button
            type="button"
            size="sm"
            onClick={addType2Row}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            เพิ่มรายการ
          </Button>
        )}
      </div>

      {/* Dynamic Follow-up Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
            <tr>
              <th className="py-2.5 px-3 text-center w-12">ลำดับ</th>
              <th className="py-2.5 px-3 min-w-[180px]">
                สินค้าที่ต้องการติดตามผล <span className="text-red-500">*</span>
              </th>
              <th className="py-2.5 px-3 min-w-[200px]">
                ชื่อร้านค้า / เกษตรกร <span className="text-red-500">*</span>
              </th>
              <th className="py-2.5 px-3 min-w-[200px]">รายละเอียดเพิ่มเติม</th>
              {!readonly && (
                <th className="py-2.5 px-3 text-center w-16">จัดการ</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {type2Items.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-4 text-center text-slate-400 italic"
                >
                  ยังไม่มีรายการติดตามผล กด "เพิ่มรายการ" เพื่อบันทึก
                </td>
              </tr>
            ) : (
              type2Items.map((item, index) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-2.5 px-3 text-center font-medium text-slate-500">
                    {index + 1}
                  </td>
                  <td className="py-2 px-3">
                    <select
                      value={item.productName}
                      onChange={(e) =>
                        updateType2Row(item.id, "productName", e.target.value)
                      }
                      disabled={readonly}
                      className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      {DEMO_PRODUCTS.map((prod) => (
                        <option key={prod} value={prod}>
                          {prod}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-3">
                    <select
                      value={item.customerName}
                      onChange={(e) =>
                        updateType2Row(item.id, "customerName", e.target.value)
                      }
                      disabled={readonly}
                      className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      <option value="">-- เลือกร้านค้า / เจ้าของแปลง --</option>
                      {DEMO_OWNERS.map((owner) => (
                        <option key={owner} value={owner}>
                          {owner}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={item.detail}
                      onChange={(e) =>
                        updateType2Row(item.id, "detail", e.target.value)
                      }
                      disabled={readonly}
                      placeholder="ระบุรายละเอียดการติดตาม..."
                      className="w-full h-8 px-2.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </td>
                  {!readonly && (
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => deleteType2Row(item.id)}
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
