import React from "react";
import { Users, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Type1VisitItem } from "../../types";
import { DEMO_OWNERS } from "../../constants";

interface Props {
  readonly?: boolean;
  type1Items: Type1VisitItem[];
  addType1Row: () => void;
  updateType1Row: (
    id: string,
    field: keyof Type1VisitItem,
    val: any,
  ) => void;
  deleteType1Row: (id: string) => void;
}

const VISIT_TOPICS = [
  "แจ้งข่าวสาร",
  "อัปเดตข้อมูลลูกค้า",
  "เลี้ยงรับรอง / สังสรรค์",
  "ให้คำแนะนำการใช้สินค้า",
  "อื่นๆ",
];

export function Type1Visit({
  readonly = false,
  type1Items,
  addType1Row,
  updateType1Row,
  deleteType1Row,
}: Props) {
  return (
    <div className="bg-sky-50/40 border border-sky-200/80 rounded-xl p-4 md:p-5 space-y-4 relative">
      <div className="flex items-center justify-between border-b border-sky-200/60 pb-2.5">
        <div className="flex items-center gap-2 text-sky-800 font-bold text-sm">
          <Users className="h-4 w-4 text-sky-600" />
          <span>เข้าพบร้านค้า / เกษตรกร</span>
        </div>

        {!readonly && (
          <Button
            type="button"
            size="sm"
            onClick={addType1Row}
            className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm"
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
              <th className="py-2.5 px-3 min-w-[180px]">
                ประเด็นหลัก <span className="text-red-500">*</span>
              </th>
              <th className="py-2.5 px-3 min-w-[200px]">รายละเอียดเพิ่มเติม</th>
              {!readonly && (
                <th className="py-2.5 px-3 text-center w-16">จัดการ</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {type1Items.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-4 text-center text-slate-400 italic"
                >
                  ยังไม่มีรายการเข้าพบ กด "เพิ่มรายการ" เพื่อบันทึก
                </td>
              </tr>
            ) : (
              type1Items.map((item, index) => (
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
                        updateType1Row(item.id, "customerName", e.target.value)
                      }
                      disabled={readonly}
                      className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                    >
                      <option value="">-- เลือกร้านค้า / เกษตรกร --</option>
                      {DEMO_OWNERS.map((owner) => (
                        <option key={owner} value={owner}>
                          {owner}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-3">
                    <select
                      value={item.topic}
                      onChange={(e) =>
                        updateType1Row(item.id, "topic", e.target.value)
                      }
                      disabled={readonly}
                      className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                    >
                      <option value="">-- เลือกประเด็นหลัก --</option>
                      {VISIT_TOPICS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={item.detail}
                      onChange={(e) =>
                        updateType1Row(item.id, "detail", e.target.value)
                      }
                      disabled={readonly}
                      placeholder="ระบุรายละเอียดเพิ่มเติม..."
                      className="w-full h-8 px-2.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </td>
                  {!readonly && (
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => deleteType1Row(item.id)}
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
