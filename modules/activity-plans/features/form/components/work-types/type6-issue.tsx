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

      {/* List of Issue Cards */}
      <div className="space-y-3">
        {type6Items.length === 0 ? (
          <div className="py-6 text-center text-slate-400 italic bg-white rounded-xl border border-slate-200 text-xs">
            ยังไม่มีรายการร้องเรียน กด "+ เพิ่มรายการ" เพื่อบันทึก
          </div>
        ) : (
          type6Items.map((item, index) => (
            <div
              key={item.id}
              className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3 transition-all hover:border-rose-300"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-[11px] font-extrabold">
                    {index + 1}
                  </span>
                  รายการร้องเรียนที่ {index + 1}
                </span>
                {!readonly && (
                  <button
                    type="button"
                    onClick={() => deleteType6Row(item.id)}
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
                    รายชื่อลูกค้า / ร้านค้า <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={item.customerName}
                    onChange={(e) =>
                      updateType6Row(item.id, "customerName", e.target.value)
                    }
                    disabled={readonly}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium bg-white"
                  >
                    <option value="">-- เลือกร้านค้า / เกษตรกร --</option>
                    {DEMO_OWNERS.map((owner) => (
                      <option key={owner} value={owner}>
                        {owner}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ประเภทปัญหา <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={item.issueType}
                    onChange={(e) =>
                      updateType6Row(item.id, "issueType", e.target.value)
                    }
                    disabled={readonly}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium bg-white"
                  >
                    <option value="เคลมของ">เคลมของ</option>
                    <option value="ฉีดยาแล้วพืชเสียหาย">
                      ฉีดยาแล้วพืชเสียหาย
                    </option>
                    <option value="อื่นๆ">อื่นๆ</option>
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
                    updateType6Row(item.id, "detail", e.target.value)
                  }
                  disabled={readonly}
                  placeholder="ระบุรายละเอียดเพิ่มเติมของปัญหา..."
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
