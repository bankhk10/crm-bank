import React from "react";
import { HelpCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Type6IssueItem } from "../../types";
import { DEMO_OWNERS } from "../../constants";

interface Props {
  readonly?: boolean;
  type6Items: Type6IssueItem[];
  addType6Row: () => void;
  updateType6Row: (id: string, field: keyof Type6IssueItem, val: any) => void;
  deleteType6Row: (id: string) => void;
}

export function Type6Issue({
  readonly = false,
  type6Items,
  addType6Row,
  updateType6Row,
  deleteType6Row,
}: Props) {
  return (
    <div className="bg-rose-50/40 border border-rose-200/80 rounded-xl p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-rose-200/60 pb-2.5">
        <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
          <HelpCircle className="h-4 w-4 text-rose-600" />
          <span>แก้ปัญหา / รับเรื่องร้องเรียน</span>
        </div>

        {!readonly && (
          <Button
            type="button"
            size="sm"
            onClick={addType6Row}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm"
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
              <th className="py-2.5 px-3 min-w-[160px]">
                ประเภทปัญหา <span className="text-red-500">*</span>
              </th>
              <th className="py-2.5 px-3 min-w-[200px]">รายละเอียดเพิ่มเติม</th>
              {!readonly && (
                <th className="py-2.5 px-3 text-center w-16">จัดการ</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {type6Items.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-4 text-center text-slate-400 italic"
                >
                  ยังไม่มีรายการร้องเรียน กด "เพิ่มรายการ" เพื่อบันทึก
                </td>
              </tr>
            ) : (
              type6Items.map((item, index) => (
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
                        updateType6Row(item.id, "customerName", e.target.value)
                      }
                      disabled={readonly}
                      className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
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
                      value={item.issueType}
                      onChange={(e) =>
                        updateType6Row(item.id, "issueType", e.target.value)
                      }
                      disabled={readonly}
                      className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                    >
                      <option value="เคลมของ">เคลมของ</option>
                      <option value="ฉีดยาแล้วพืชเสียหาย">
                        ฉีดยาแล้วพืชเสียหาย
                      </option>
                      <option value="อื่นๆ">อื่นๆ</option>
                    </select>
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={item.detail}
                      onChange={(e) =>
                        updateType6Row(item.id, "detail", e.target.value)
                      }
                      disabled={readonly}
                      placeholder="ระบุรายละเอียด..."
                      className="w-full h-8 px-2.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </td>
                  {!readonly && (
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => deleteType6Row(item.id)}
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
