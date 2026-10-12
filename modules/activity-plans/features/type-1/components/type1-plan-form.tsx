"use client";

import React from "react";
import { Store, UserCheck, Plus, Trash2 } from "lucide-react";
import { ActivityInput } from "@/components/activity/activity-input";
import { ActivityAddressSelect } from "@/components/activity/activity-address-select";
import { ActivityCustomerSelect } from "@/components/activity/activity-customer-select";
import { FormCombobox } from "@/components/custom/form-components";
import { Button } from "@/components/ui/button";
import type {
  Type1VisitItem,
  CustomerOption,
  Type1PlanFormProps,
  Type1VisitProps,
} from "../types";

export type { CustomerOption, Type1PlanFormProps, Type1VisitProps };

const VISIT_TOPICS = [
  "แจ้งข่าวสาร",
  "อัปเดตข้อมูลลูกค้า",
  "เพิ่มข้อมูลเกษตรกร",
  "เลี้ยงรับรอง / สังสรรค์",
  "ให้คำแนะนำการใช้สินค้า",
  "อื่นๆ",
];

export function Type1PlanForm({
  readonly = false,
  type1Items,
  addType1Row,
  updateType1Row,
  deleteType1Row,
  customers = [],
}: Type1PlanFormProps) {
  const items =
    type1Items && type1Items.length > 0
      ? type1Items
      : [
          {
            id: "1",
            visitPurpose: "FARMER" as const,
            province: "",
            isUnregisteredFarmer: false,
            storeId: "",
            customerName: "",
            unregisteredFarmerName: "",
            unregisteredFarmerPhone: "",
            topic: "แจ้งข่าวสาร",
            detail: "",
          },
        ];

  const handlePurposeChange = (
    id: string,
    currentPurpose: "FARMER" | "STORE",
    newPurpose: "FARMER" | "STORE",
  ) => {
    if (newPurpose === currentPurpose) return;
    updateType1Row(id, "visitPurpose", newPurpose);
    if (newPurpose === "STORE") {
      // Clear all Farmer-specific state
      updateType1Row(id, "province", "");
      updateType1Row(id, "storeId", undefined);
      updateType1Row(id, "customerName", "");
      updateType1Row(id, "isUnregisteredFarmer", false);
      updateType1Row(id, "unregisteredFarmerName", "");
      updateType1Row(id, "unregisteredFarmerPhone", "");
    } else {
      // Clear Store-specific selection
      updateType1Row(id, "storeId", undefined);
      updateType1Row(id, "customerName", "");
    }
  };

  const handleProvinceChange = (id: string, newProvince: string) => {
    updateType1Row(id, "province", newProvince);
    updateType1Row(id, "storeId", undefined);
    updateType1Row(id, "customerName", "");
  };

  const handleToggleUnregistered = (id: string, checked: boolean) => {
    updateType1Row(id, "isUnregisteredFarmer", checked);
    if (checked) {
      updateType1Row(id, "storeId", undefined);
      updateType1Row(id, "customerName", "");
    } else {
      updateType1Row(id, "unregisteredFarmerName", "");
      updateType1Row(id, "unregisteredFarmerPhone", "");
    }
  };

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4 relative">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <Store className="h-4 w-4 text-emerald-600" />
          <span>เข้าพบร้านค้า / Key Farmer</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
            {items.length} เป้าหมาย
          </span>
        </div>
      </div>

      {/* Target Cards List */}
      <div className="space-y-4">
        {items.map((item, index) => {
          const currentPurpose: "FARMER" | "STORE" =
            item.visitPurpose === "STORE" ? "STORE" : "FARMER";

          return (
            <div
              key={item.id}
              className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3.5 relative transition-all"
            >
              {/* Card Title & Delete Button */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center border border-slate-200">
                    {index + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    เป้าหมายที่ {index + 1}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-600">
                    {currentPurpose === "STORE" ? "เข้าพบร้านค้า" : "เข้าพบเกษตรกร"}
                  </span>
                </div>

                {!readonly && deleteType1Row && items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => deleteType1Row(item.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors"
                    title={`ลบเป้าหมายที่ ${index + 1}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Row: วัตถุประสงค์ของประเภทงาน */}
              <div className="space-y-1.5 border-b border-slate-100 pb-3">
                <label className="block text-xs font-semibold text-slate-700">
                  วัตถุประสงค์ของประเภทงาน <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-6 items-center pt-0.5">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
                    <input
                      type="radio"
                      name={`visit-purpose-${item.id}`}
                      value="FARMER"
                      checked={currentPurpose === "FARMER"}
                      onChange={() =>
                        handlePurposeChange(item.id, currentPurpose, "FARMER")
                      }
                      disabled={readonly}
                      className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      เข้าพบเกษตรกร
                    </span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
                    <input
                      type="radio"
                      name={`visit-purpose-${item.id}`}
                      value="STORE"
                      checked={currentPurpose === "STORE"}
                      onChange={() =>
                        handlePurposeChange(item.id, currentPurpose, "STORE")
                      }
                      disabled={readonly}
                      className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <Store className="w-3.5 h-3.5 text-emerald-600" />
                      เข้าพบร้านค้า
                    </span>
                  </label>
                </div>
              </div>

              {/* CASE 1: เข้าพบเกษตรกร (FARMER) */}
              {currentPurpose === "FARMER" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                    <ActivityAddressSelect
                      id={`province-combobox-${item.id}`}
                      levels="province"
                      value={item.province || ""}
                      onChange={(p) => handleProvinceChange(item.id, p)}
                      disabled={readonly}
                      required
                    />

                    <ActivityCustomerSelect
                      id={`farmer-combobox-${item.id}`}
                      type="FARMER"
                      province={item.province}
                      value={item.storeId || ""}
                      onChange={(val, cust) => {
                        updateType1Row(item.id, "storeId", val || undefined);
                        updateType1Row(item.id, "customerName", cust?.name || "");
                      }}
                      customers={customers}
                      disabled={readonly}
                      required
                      allowUnregistered
                      isUnregistered={Boolean(item.isUnregisteredFarmer)}
                      onUnregisteredToggle={(chk) =>
                        handleToggleUnregistered(item.id, chk)
                      }
                      unregisteredName={item.unregisteredFarmerName || ""}
                      onUnregisteredNameChange={(val) =>
                        updateType1Row(item.id, "unregisteredFarmerName", val)
                      }
                      unregisteredPhone={item.unregisteredFarmerPhone || ""}
                      onUnregisteredPhoneChange={(val) =>
                        updateType1Row(item.id, "unregisteredFarmerPhone", val)
                      }
                    />
                  </div>
                </div>
              )}

              {/* CASE 2: เข้าพบร้านค้า (STORE) */}
              {currentPurpose === "STORE" && (
                <div className="space-y-3">
                  <div>
                    <ActivityCustomerSelect
                      id={`store-combobox-${item.id}`}
                      type="STORE"
                      value={item.storeId || ""}
                      onChange={(val, cust) => {
                        updateType1Row(item.id, "storeId", val || undefined);
                        updateType1Row(item.id, "customerName", cust?.name || "");
                      }}
                      customers={customers}
                      disabled={readonly}
                      required
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      อนุญาตเฉพาะลูกค้าประเภทตัวแทนจำหน่าย (DEALER) หรือร้านค้าย่อย (SUBDEALER) ในระบบเท่านั้น
                    </p>
                  </div>
                </div>
              )}

              {/* Common Row: ประเด็นหลัก & รายละเอียดเพิ่มเติม */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <FormCombobox
                  id={`topic-combobox-${item.id}`}
                  label="ประเด็นหลัก"
                  labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                  triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
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

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    รายละเอียดเพิ่มเติม
                  </label>
                  <ActivityInput
                    type="text"
                    value={item.detail}
                    onChange={(e) =>
                      updateType1Row(item.id, "detail", e.target.value)
                    }
                    disabled={readonly}
                    placeholder="ระบุรายละเอียดเพิ่มเติมการเข้าพบ..."
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Target Button */}
      {!readonly && addType1Row && (
        <div className="pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={addType1Row}
            className="w-full h-10 border-dashed border-2 border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/50 text-slate-600 hover:text-emerald-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มร้านค้า / เกษตรกร (เป้าหมายที่ {items.length + 1})</span>
          </Button>
        </div>
      )}
    </div>
  );
}

// Backward-compatible alias
export const Type1Visit = Type1PlanForm;
