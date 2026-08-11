import React from "react";
import { Users, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormCombobox } from "@/components/custom/form-components";
import type { Type1VisitItem } from "../../types";
import { DEMO_OWNERS } from "../../constants";

export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  responsibleEmployeeId?: string | null;
}

interface Props {
  readonly?: boolean;
  type1Items: Type1VisitItem[];
  addType1Row: () => void;
  updateType1Row: (id: string, field: keyof Type1VisitItem, val: any) => void;
  deleteType1Row: (id: string) => void;
  customers?: CustomerOption[];
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

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4 relative">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <Users className="h-4 w-4 text-slate-600" />
          <span>เข้าพบร้านค้า / Key Farmer</span>
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

      {/* List of Visit Cards */}
      <div className="space-y-3">
        {type1Items.length === 0 ? (
          <div className="py-6 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
            ยังไม่มีรายการเข้าพบ
          </div>
        ) : (
          type1Items.map((item, index) => (
            <div
              key={item.id}
              className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3 transition-all hover:border-sky-300"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-sky-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[11px] font-extrabold">
                    {index + 1}
                  </span>
                  รายการเข้าพบที่ {index + 1}
                </span>
                {!readonly && (
                  <button
                    type="button"
                    onClick={() => deleteType1Row(item.id)}
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
                  label="รายชื่อร้านค้า / Key Farmer"
                  labelClassName="block text-xs font-medium text-slate-700 mb-1 mx-0"
                  triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-sky-500"
                  value={item.customerName}
                  onChange={(val) =>
                    updateType1Row(item.id, "customerName", val)
                  }
                  options={customerOptions}
                  placeholder="เลือกร้านค้า / Key Farmer"
                  searchPlaceholder="ค้นหาร้านค้า / Key Farmer..."
                  emptyText="ไม่พบลูกค้า"
                  disabled={readonly}
                  required
                />

                <FormCombobox
                  id={`topic-combobox-${item.id}`}
                  label="ประเด็นหลัก"
                  labelClassName="block text-xs font-medium text-slate-700 mb-1 mx-0"
                  triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-sky-500"
                  value={item.topic}
                  onChange={(val) => updateType1Row(item.id, "topic", val)}
                  options={VISIT_TOPICS.map((topic) => ({
                    label: topic,
                    value: topic,
                  }))}
                  placeholder="เลือกประเด็นหลัก"
                  searchPlaceholder="ค้นหาประเด็นหลัก..."
                  emptyText="ไม่พบประเด็นหลัก"
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
                    updateType1Row(item.id, "detail", e.target.value)
                  }
                  disabled={readonly}
                  placeholder="ระบุรายละเอียดเพิ่มเติมการเข้าพบ..."
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
