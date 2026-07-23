import React from "react";
import { Receipt, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Type4CollectItem } from "../../types";
import { DEMO_OWNERS } from "../../constants";

interface Props {
  readonly?: boolean;
  type4Items: Type4CollectItem[];
  addType4Row: () => void;
  updateType4Row: (id: string, field: keyof Type4CollectItem, val: any) => void;
  deleteType4Row: (id: string) => void;
}

export function Type4Collect({
  readonly = false,
  type4Items,
  addType4Row,
  updateType4Row,
  deleteType4Row,
}: Props) {
  return (
    <div className="bg-amber-50/40 border border-amber-200/80 rounded-xl p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
        <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
          <Receipt className="h-4 w-4 text-amber-600" />
          <span>วางบิล / เก็บเงิน</span>
        </div>

        {!readonly && (
          <Button
            type="button"
            size="sm"
            onClick={addType4Row}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm"
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
                รายชื่อลูกค้า / ร้านค้า <span className="text-red-500">*</span>
              </th>
              <th className="py-2.5 px-3 w-36 text-center">
                เป้ายอดเก็บเงิน (บาท) <span className="text-red-500">*</span>
              </th>
              <th className="py-2.5 px-3 min-w-[180px]">รายละเอียดเพิ่มเติม</th>
              {!readonly && (
                <th className="py-2.5 px-3 text-center w-16">จัดการ</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {type4Items.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-4 text-center text-slate-400 italic"
                >
                  ยังไม่มีรายการวางบิล กด "เพิ่มรายการ" เพื่อบันทึก
                </td>
              </tr>
            ) : (
              type4Items.map((item, index) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-2.5 px-3 text-center font-medium text-slate-500">
                    {index + 1}
                  </td>
                  <td className="py-2 px-3">
                    <select
                      value={item.customerName}
                      onChange={(e) =>
                        updateType4Row(item.id, "customerName", e.target.value)
                      }
                      disabled={readonly}
                      className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    >
                      <option value="">-- เลือกร้านค้า --</option>
                      {DEMO_OWNERS.map((owner) => (
                        <option key={owner} value={owner}>
                          {owner}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-3">
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-slate-400 text-[11px]">
                        ฿
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={item.collectAmount}
                        onChange={(e) =>
                          updateType4Row(
                            item.id,
                            "collectAmount",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        disabled={readonly}
                        placeholder="0"
                        className="w-full h-8 pl-6 pr-2 rounded-md border border-slate-200 text-xs text-slate-800 text-right font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={item.detail}
                      onChange={(e) =>
                        updateType4Row(item.id, "detail", e.target.value)
                      }
                      disabled={readonly}
                      placeholder="ระบุรายละเอียด..."
                      className="w-full h-8 px-2.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </td>
                  {!readonly && (
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => deleteType4Row(item.id)}
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
          {type4Items.length > 0 && (
            <tfoot className="bg-amber-50/80 border-t-2 border-amber-200 text-xs font-bold text-amber-900">
              <tr>
                <td colSpan={2} className="py-2.5 px-3 text-left">
                  รวมเป้ายอดเก็บเงินทั้งสิ้น:
                  <span className="ml-2">
                    {type4Items
                      .reduce((sum, item) => sum + (item.collectAmount || 0), 0)
                      .toLocaleString()}{" "}
                    ฿
                  </span>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
