import React from "react";
import { Receipt, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormCombobox } from "@/components/custom/form-components";
import type { Type4CollectItem } from "../../types";
import { DEMO_OWNERS } from "../../constants";

export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  responsibleEmployeeId?: string | null;
}

interface Props {
  readonly?: boolean;
  type4Items: Type4CollectItem[];
  addType4Row: () => void;
  updateType4Row: (id: string, field: keyof Type4CollectItem, val: any) => void;
  deleteType4Row: (id: string) => void;
  customers?: CustomerOption[];
}

export function Type4Collect({
  readonly = false,
  type4Items,
  addType4Row,
  updateType4Row,
  deleteType4Row,
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
    label: `${c.customerCode ? `${c.customerCode} - ` : ""}${c.name}`,
  }));

  const totalAllCollect = type4Items.reduce(
    (sum, item) => sum + (item.collectAmount || 0),
    0,
  );

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

      {/* List of Collect Cards */}
      <div className="space-y-3">
        {type4Items.length === 0 ? (
          <div className="py-6 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
            ยังไม่มีรายการวางบิล
          </div>
        ) : (
          type4Items.map((item, index) => (
            <div
              key={item.id}
              className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3 transition-all hover:border-amber-300"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[11px] font-extrabold">
                    {index + 1}
                  </span>
                  รายการวางบิลที่ {index + 1}
                </span>
                {!readonly && (
                  <button
                    type="button"
                    onClick={() => deleteType4Row(item.id)}
                    className="p-1 rounded-md text-red-500 hover:bg-red-50 text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>ลบรายการ</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-10 gap-3">
                <FormCombobox
                  id={`customer-combobox-${item.id}`}
                  label="รายชื่อลูกค้า / ร้านค้า"
                  containerClassName="md:col-span-8"
                  labelClassName="block text-xs font-medium text-slate-700 mb-1 mx-0"
                  triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-amber-500"
                  value={item.customerName}
                  onChange={(val) =>
                    updateType4Row(item.id, "customerName", val)
                  }
                  options={customerOptions}
                  placeholder="เลือกร้านค้า / ลูกค้า..."
                  searchPlaceholder="ค้นหาร้านค้า / ลูกค้า..."
                  emptyText="ไม่พบลูกค้า"
                  disabled={readonly}
                  required
                />

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    เป้ายอดเก็บเงิน (บาท){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-2">
                    <span className="absolute left-3 top-2 text-slate-400 text-xs font-semibold">
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
                      className="w-full h-9 pl-7 pr-3 rounded-lg border border-slate-200 text-xs text-slate-800 text-right font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </div>
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
                    updateType4Row(item.id, "detail", e.target.value)
                  }
                  disabled={readonly}
                  placeholder="ระบุรายละเอียดเพิ่มเติม..."
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>
            </div>
          ))
        )}
      </div>

      {type4Items.length > 0 && (
        <div className="flex justify-end p-3 rounded-xl bg-amber-100/70 border border-amber-200 text-xs font-bold text-amber-900">
          <span>
            รวมเป้ายอดเก็บเงินทั้งสิ้น:{" "}
            <span className="text-sm font-extrabold text-amber-700 ml-1.5">
              ฿ {totalAllCollect.toLocaleString()}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
