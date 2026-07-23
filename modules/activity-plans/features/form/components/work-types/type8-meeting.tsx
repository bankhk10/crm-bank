import React from "react";
import { Users, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Type8MeetingItem } from "../../types";

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

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
            <tr>
              <th className="py-2.5 px-3 text-center w-12">ลำดับ</th>
              <th className="py-2.5 px-3 min-w-[200px]">
                หัวข้อที่จะประชุม <span className="text-red-500">*</span>
              </th>
              <th className="py-2.5 px-3 w-36 text-center">
                เป้าหมายผู้เข้าร่วม (คน) <span className="text-red-500">*</span>
              </th>
              <th className="py-2.5 px-3 min-w-[180px]">รายละเอียดเพิ่มเติม</th>
              {!readonly && (
                <th className="py-2.5 px-3 text-center w-16">จัดการ</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {type8Items.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-4 text-center text-slate-400 italic"
                >
                  ยังไม่มีรายการประชุม กด "เพิ่มรายการ" เพื่อบันทึก
                </td>
              </tr>
            ) : (
              type8Items.map((item, index) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-2.5 px-3 text-center font-medium text-slate-500">
                    {index + 1}
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={item.topic}
                      onChange={(e) =>
                        updateType8Row(item.id, "topic", e.target.value)
                      }
                      disabled={readonly}
                      placeholder="เช่น ประชุมวางแผนฤดูกาลเพาะปลูก"
                      className="w-full h-8 px-2.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2 px-3">
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
                      className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={item.detail}
                      onChange={(e) =>
                        updateType8Row(item.id, "detail", e.target.value)
                      }
                      disabled={readonly}
                      placeholder="ระบุรายละเอียด..."
                      className="w-full h-8 px-2.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  {!readonly && (
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => deleteType8Row(item.id)}
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
          {type8Items.length > 0 && (
            <tfoot className="bg-blue-50/80 border-t-2 border-blue-200 text-xs font-bold text-blue-900">
              <tr>
                <td colSpan={2} className="py-2.5 px-3 text-right">
                  รวมเป้าหมายผู้เข้าร่วมทั้งสิ้น:
                </td>
                <td className="py-2.5 px-3 text-center text-blue-700 font-extrabold">
                  {type8Items
                    .reduce(
                      (sum, item) => sum + (item.attendeesCount || 0),
                      0,
                    )
                    .toLocaleString()}{" "}
                  คน
                </td>
                <td colSpan={readonly ? 2 : 1}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
