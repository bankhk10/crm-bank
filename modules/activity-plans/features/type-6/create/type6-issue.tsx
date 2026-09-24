import React from "react";
import { HelpCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormCombobox } from "@/components/custom/form-components";
import type { Type6IssueItem } from "@/modules/activity-plans/features/shared/form/types";
export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  responsibleEmployeeId?: string | null;
}

const ISSUE_TYPES = [
  "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
  "เกิดความเสียหายหลังการใช้สินค้า",
  "อื่นๆ ระบุ",
];

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
  const customerOptions = (customers || []).map((c) => ({
    value: c.name,
    label: c.name,
  }));

  const issueTypeOptions = ISSUE_TYPES.map((t) => ({
    value: t,
    label: t,
  }));

  const handleToggleManual = (id: string, checked: boolean) => {
    updateType6Row(id, "isManualCustomer", checked);
    if (checked) {
      // Switching to Manual: clear Customer Master selection
      updateType6Row(id, "storeId", null);
      updateType6Row(id, "customerName", "");
    } else {
      // Switching to Customer Master: clear Manual details
      updateType6Row(id, "manualCustomerName", "");
    }
  };

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <HelpCircle className="h-4 w-4 text-slate-600" />
          <span>ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา</span>
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
              className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3.5 transition-all hover:border-rose-300"
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

              {/* Customer Master Section (เมื่อไม่เลือกกรอกเอง แบบเดียวกับ TYPE_1) */}
              {!item.isManualCustomer && (
                <div>
                  <FormCombobox
                    id={`customer-combobox-${item.id}`}
                    label="รายชื่อลูกค้า / ร้านค้า"
                    labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                    triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-rose-500 disabled:bg-slate-100 disabled:text-slate-400"
                    value={item.customerName}
                    onChange={(val) => {
                      const cust = customers.find(
                        (c) => c.name === val || c.id === val,
                      );
                      updateType6Row(
                        item.id,
                        "customerName",
                        cust?.name || val,
                      );
                      updateType6Row(item.id, "storeId", cust?.id || null);
                    }}
                    options={customerOptions}
                    placeholder="เลือกร้านค้า / Key Farmer (Customer Master)"
                    searchPlaceholder="ค้นหาร้านค้า / Key Farmer..."
                    emptyText="ไม่พบลูกค้า"
                    disabled={readonly}
                    required
                  />
                </div>
              )}

              {/* Toggle: กรอกข้อมูลลูกค้า / ร้านเอง (Pattern แบบเดียวกับ TYPE_1) */}
              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="checkbox"
                  id={`manual-customer-toggle-${item.id}`}
                  checked={Boolean(item.isManualCustomer)}
                  onChange={(e) =>
                    handleToggleManual(item.id, e.target.checked)
                  }
                  disabled={readonly}
                  className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer disabled:cursor-not-allowed"
                />
                <label
                  htmlFor={`manual-customer-toggle-${item.id}`}
                  className="text-xs font-medium text-slate-700 cursor-pointer select-none"
                >
                  กรอกข้อมูลลูกค้า / ร้านเอง{" "}
                  <span className="text-[11px] text-slate-500">
                    (กรอกชื่อร้านค้า / ลูกค้าโดยไม่สร้าง Master Data)
                  </span>
                </label>
              </div>

              {/* Form fields for Manual Customer (Pattern กล่อง Amber แบบเดียวกับ TYPE_1) */}
              {item.isManualCustomer && (
                <div className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-lg">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ชื่อลูกค้า / ร้านค้า{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={item.manualCustomerName || ""}
                      onChange={(e) =>
                        updateType6Row(
                          item.id,
                          "manualCustomerName",
                          e.target.value,
                        )
                      }
                      disabled={readonly}
                      placeholder="ระบุชื่อลูกค้า / ร้านค้า..."
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Common Row: ประเภทปัญหา & รายละเอียด (สำหรับ อื่นๆ ระบุ) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <FormCombobox
                  id={`issue-type-combobox-${item.id}`}
                  label="ประเภทปัญหา"
                  labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
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

                {item.issueType === "อื่นๆ ระบุ" ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      รายละเอียด <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={item.detail || ""}
                      onChange={(e) =>
                        updateType6Row(item.id, "detail", e.target.value)
                      }
                      disabled={readonly}
                      placeholder="ระบุรายละเอียด..."
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                      required
                    />
                  </div>
                ) : (
                  <div className="hidden md:block" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
