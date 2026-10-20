"use client";

import React from "react";
import { HelpCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityInput, ActivityCustomerSelect } from "@/modules/activity/ui";
import { FormCombobox } from "@/components/custom/form-components";
import type {
  Type6IssueItem,
  CustomerOption,
} from "../../shared/types";
import type { Type6PlanFormProps } from "../types/planned.types";
import { ISSUE_TYPES } from "../../shared/constants";

export type { CustomerOption };
export type Type6IssueProps = Type6PlanFormProps;

export function Type6PlannedForm({
  readonly = false,
  type6Items,
  addType6Row,
  updateType6Row,
  deleteType6Row,
  customers = [],
}: Type6PlanFormProps) {
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
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm cursor-pointer"
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
            ยังไม่มีรายการตรวจสอบเรื่องร้องเรียน / แก้ปัญหา
          </div>
        ) : (
          type6Items.map((item, index) => (
            <div
              key={item.id}
              className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3 transition-all hover:border-red-300"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-[11px] font-extrabold">
                    {index + 1}
                  </span>
                  รายการที่ {index + 1}
                </span>
                {!readonly && (
                  <button
                    type="button"
                    onClick={() => deleteType6Row(item.id)}
                    className="p-1 rounded-md text-red-500 hover:bg-red-50 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>ลบรายการ</span>
                  </button>
                )}
              </div>

              {/* Toggle ระหว่าง เลือกลูกค้าในระบบ กับ กรอกชื่อเอง */}
              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                <span className="text-xs font-medium text-slate-600">
                  รูปแบบการระบุลูกค้า / ร้านค้า
                </span>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={item.isManualCustomer || false}
                    onChange={(e) =>
                      handleToggleManual(item.id, e.target.checked)
                    }
                    disabled={readonly}
                    className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <span>กรอกชื่อลูกค้าเอง (ไม่ได้อยู่ในระบบ)</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {item.isManualCustomer ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ชื่อลูกค้า / ร้านค้า (กรอกเอง){" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <ActivityInput
                      type="text"
                      value={item.manualCustomerName || ""}
                      onChange={(e) => {
                        updateType6Row(
                          item.id,
                          "manualCustomerName",
                          e.target.value,
                        );
                        updateType6Row(
                          item.id,
                          "customerName",
                          e.target.value,
                        );
                      }}
                      disabled={readonly}
                      placeholder="ระบุชื่อลูกค้า หรือ ร้านค้าที่พบปัญหา..."
                      required
                    />
                  </div>
                ) : (
                  <ActivityCustomerSelect
                    id={`customer-combobox-${item.id}`}
                    label="ร้านค้า / Key Farmer"
                    labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                    triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-red-500"
                    value={item.storeId || item.customerName || ""}
                    onChange={(val, cust) => {
                      updateType6Row(
                        item.id,
                        "customerName",
                        cust?.name || val,
                      );
                      if (cust?.id) {
                        updateType6Row(item.id, "storeId", cust.id);
                      }
                    }}
                    customers={customers as any}
                    placeholder="เลือกร้านค้า / เกษตรกร..."
                    searchPlaceholder="ค้นหาร้านค้า / เกษตรกร..."
                    emptyText="ไม่พบรายชื่อ"
                    disabled={readonly}
                    required
                  />
                )}

                <FormCombobox
                  label="ประเภทปัญหา"
                  labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                  triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-red-500"
                  options={issueTypeOptions}
                  value={item.issueType}
                  onChange={(val) => updateType6Row(item.id, "issueType", val)}
                  placeholder="เลือกประเภทปัญหา..."
                  searchPlaceholder="ค้นหาประเภทปัญหา..."
                  disabled={readonly}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รายละเอียดปัญหา{" "}
                  {item.issueType === "อื่นๆ ระบุ" && (
                    <span className="text-rose-500">*</span>
                  )}
                </label>
                <ActivityInput
                  type="text"
                  value={item.detail}
                  onChange={(e) =>
                    updateType6Row(item.id, "detail", e.target.value)
                  }
                  disabled={readonly}
                  placeholder={
                    item.issueType === "อื่นๆ ระบุ"
                      ? "กรุณาระบุรายละเอียดปัญหาที่พบ..."
                      : "ระบุรายละเอียดปัญหา เช่น อาการที่พบ, ปริมาณความเสียหาย..."
                  }
                  required={item.issueType === "อื่นๆ ระบุ"}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Backward-compatible aliases
export const Type6PlanForm = Type6PlannedForm;
export const Type6Issue = Type6PlannedForm;
export const EditType6Issue = Type6PlannedForm;
