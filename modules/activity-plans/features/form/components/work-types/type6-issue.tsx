import React from "react";
import { HelpCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormCombobox } from "@/components/custom/form-components";
import type { Type6IssueItem } from "../../types";
import { DEMO_OWNERS } from "../../constants";

export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  responsibleEmployeeId?: string | null;
}

const ISSUE_TYPES = ["เคลมของ", "ฉีดยาแล้วพืชเสียหาย", "อื่นๆ"];

interface Props {
  readonly?: boolean;
  type6Items: Type6IssueItem[];
  addType6Row: () => void;
  updateType6Row: (id: string, field: keyof Type6IssueItem, val: any) => void;
  deleteType6Row: (id: string) => void;
  customers?: CustomerOption[];
}

export function Type6Issue({
  readonly = false,
  type6Items,
  addType6Row,
  updateType6Row,
  deleteType6Row,
  customers = [],
}: Props) {
  const customerOptions = (
    customers && customers.length > 0
      ? customers
      : DEMO_OWNERS.map((owner) => ({
          id: owner,
          name: owner,
          customerCode: null,
        }))
  ).map((c) => ({
    value: c.name,
    label: c.name,
  }));

  const issueTypeOptions = ISSUE_TYPES.map((t) => ({
    value: t,
    label: t,
  }));

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <HelpCircle className="h-4 w-4 text-slate-600" />
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
          <div className="py-6 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
            ยังไม่มีรายการร้องเรียน
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
                <FormCombobox
                  id={`customer-combobox-${item.id}`}
                  label="รายชื่อลูกค้า / ร้านค้า"
                  labelClassName="block text-xs font-medium text-slate-700 mb-1 mx-0"
                  triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-rose-500"
                  value={item.customerName}
                  onChange={(val) =>
                    updateType6Row(item.id, "customerName", val)
                  }
                  options={customerOptions}
                  placeholder="เลือกร้านค้า / เกษตรกร..."
                  searchPlaceholder="ค้นหาร้านค้า / เกษตรกร..."
                  emptyText="ไม่พบลูกค้า"
                  disabled={readonly}
                  required
                />

                <FormCombobox
                  id={`issue-type-combobox-${item.id}`}
                  label="ประเภทปัญหา"
                  labelClassName="block text-xs font-medium text-slate-700 mb-1 mx-0"
                  triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-rose-500"
                  value={item.issueType}
                  onChange={(val) => updateType6Row(item.id, "issueType", val)}
                  options={issueTypeOptions}
                  placeholder="เลือกประเภทปัญหา..."
                  searchPlaceholder="ค้นหาประเภทปัญหา..."
                  emptyText="ไม่พบประเภทปัญหา"
                  disabled={readonly}
                  required
                />
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
