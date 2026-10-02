"use client";

import React from "react";
import { CheckSquare, Plus, Trash2, Store, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityInput } from "@/components/activity/activity-input";
import { ActivityAddressSelect } from "@/components/activity/activity-address-select";
import { ActivityCustomerSelect } from "@/components/activity/activity-customer-select";
import { ActivityProductSelect } from "@/components/activity/activity-product-select";
import type {
  Type2ProductFollowupItem,
  CustomerOption,
  ProductOption,
} from "../shared/types";
import type { Type2FollowupProps } from "./types";

export type { CustomerOption, ProductOption };

export function Type2Followup({
  readonly = false,
  type2Items,
  addType2Row,
  updateType2Row,
  deleteType2Row,
  customers = [],
  products = [],
}: Type2FollowupProps) {

  // Switching purpose with state cleanup
  const handlePurposeChange = (
    id: string,
    newPurpose: "FARMER" | "STORE",
    currentPurpose: "FARMER" | "STORE",
  ) => {
    if (newPurpose === currentPurpose) return;
    updateType2Row(id, "visitPurpose", newPurpose);
    if (newPurpose === "STORE") {
      // Clear all Farmer-specific state
      updateType2Row(id, "province", "");
      updateType2Row(id, "storeId", undefined);
      updateType2Row(id, "customerName", "");
      updateType2Row(id, "isUnregisteredFarmer", false);
      updateType2Row(id, "unregisteredFarmerName", "");
      updateType2Row(id, "unregisteredFarmerPhone", "");
    } else {
      // newPurpose === "FARMER"
      // Clear Store-specific selection
      updateType2Row(id, "storeId", undefined);
      updateType2Row(id, "customerName", "");
    }
  };

  const handleProvinceChange = (id: string, newProvince: string) => {
    updateType2Row(id, "province", newProvince);
    // When province changes, clear selected farmer to prevent mismatched data
    updateType2Row(id, "storeId", undefined);
    updateType2Row(id, "customerName", "");
  };

  const handleToggleUnregistered = (id: string, checked: boolean) => {
    updateType2Row(id, "isUnregisteredFarmer", checked);
    if (checked) {
      // Switching to Unregistered: clear registered farmer
      updateType2Row(id, "storeId", undefined);
      updateType2Row(id, "customerName", "");
    } else {
      // Switching to Registered: clear unregistered details
      updateType2Row(id, "unregisteredFarmerName", "");
      updateType2Row(id, "unregisteredFarmerPhone", "");
    }
  };

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <CheckSquare className="h-4 w-4 text-indigo-600" />
          <span>ติดตามผลการใช้สินค้า</span>
        </div>

        {!readonly && (
          <Button
            type="button"
            size="sm"
            onClick={addType2Row}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            เพิ่มรายการ
          </Button>
        )}
      </div>

      {/* List of Follow-up Cards */}
      <div className="space-y-3">
        {type2Items.length === 0 ? (
          <div className="py-6 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
            ยังไม่มีรายการติดตามผล
          </div>
        ) : (
          type2Items.map((item, index) => {
            const currentPurpose: "FARMER" | "STORE" =
              item.visitPurpose === "STORE" ? "STORE" : "FARMER";

            return (
              <div
                key={item.id}
                className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3.5 transition-all hover:border-indigo-300"
              >
                {/* Header of Item */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-indigo-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-extrabold">
                      {index + 1}
                    </span>
                    รายการติดตามผลที่ {index + 1}
                  </span>
                  {!readonly && (
                    <button
                      type="button"
                      onClick={() => deleteType2Row(item.id)}
                      className="p-1 rounded-md text-red-500 hover:bg-red-50 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>ลบรายการ</span>
                    </button>
                  )}
                </div>

                {/* Row 1: วัตถุประสงค์ของประเภทงาน */}
                <div className="space-y-1.5 border-b border-slate-100 pb-3">
                  <label className="block text-xs font-semibold text-slate-700">
                    วัตถุประสงค์ของประเภทงาน{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-6 items-center pt-0.5">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
                      <input
                        type="radio"
                        name={`type2-visit-purpose-${item.id}`}
                        value="FARMER"
                        checked={currentPurpose === "FARMER"}
                        onChange={() =>
                          handlePurposeChange(item.id, "FARMER", currentPurpose)
                        }
                        disabled={readonly}
                        className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                        ติดตามจากเกษตรกร
                      </span>
                    </label>

                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
                      <input
                        type="radio"
                        name={`type2-visit-purpose-${item.id}`}
                        value="STORE"
                        checked={currentPurpose === "STORE"}
                        onChange={() =>
                          handlePurposeChange(item.id, "STORE", currentPurpose)
                        }
                        disabled={readonly}
                        className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <Store className="w-3.5 h-3.5 text-indigo-600" />
                        ติดตามจากร้านค้า
                      </span>
                    </label>
                  </div>
                </div>

                {/* CASE 1: เข้าพบเกษตรกร (FARMER) */}
                {currentPurpose === "FARMER" && (
                  <div className="space-y-3 border-b border-slate-100 pb-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                      {/* จังหวัด Selector */}
                      <ActivityAddressSelect
                        id={`type2-province-combobox-${item.id}`}
                        levels="province"
                        triggerClassName="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={item.province || ""}
                        onChange={(val: string) =>
                          handleProvinceChange(item.id, val)
                        }
                        disabled={readonly}
                        required
                      />

                      {/* รายชื่อเกษตรกร (พร้อม Unregistered) */}
                      <ActivityCustomerSelect
                        id={`type2-farmer-combobox-${item.id}`}
                        type="FARMER"
                        province={item.province}
                        value={item.storeId || ""}
                        onChange={(val, cust) => {
                          updateType2Row(item.id, "storeId", val || undefined);
                          updateType2Row(
                            item.id,
                            "customerName",
                            cust?.name || "",
                          );
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
                          updateType2Row(item.id, "unregisteredFarmerName", val)
                        }
                        unregisteredPhone={item.unregisteredFarmerPhone || ""}
                        onUnregisteredPhoneChange={(val) =>
                          updateType2Row(
                            item.id,
                            "unregisteredFarmerPhone",
                            val,
                          )
                        }
                      />
                    </div>
                  </div>
                )}

                {/* CASE 2: เข้าพบร้านค้า (STORE) */}
                {currentPurpose === "STORE" && (
                  <div className="space-y-2 border-b border-slate-100 pb-3">
                    <ActivityCustomerSelect
                      id={`type2-store-combobox-${item.id}`}
                      type="STORE"
                      value={item.storeId || ""}
                      onChange={(val, cust) => {
                        updateType2Row(item.id, "storeId", val || undefined);
                        updateType2Row(
                          item.id,
                          "customerName",
                          cust?.name || "",
                        );
                      }}
                      customers={customers}
                      disabled={readonly}
                      required
                    />
                    <p className="text-[11px] text-slate-500">
                      อนุญาตเฉพาะลูกค้าประเภทตัวแทนจำหน่าย (DEALER)
                      หรือร้านค้าย่อย (SUBDEALER) ในระบบเท่านั้น
                    </p>
                  </div>
                )}

                {/* Common Section: สินค้าที่ต้องการติดตามผล & รายละเอียดเพิ่มเติม */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-0.5">
                  <ActivityProductSelect
                    id={`type2-product-combobox-${item.id}`}
                    label="สินค้าที่ต้องการติดตามผล"
                    value={item.productName || ""}
                    valueKey="name"
                    products={products}
                    onChange={(val, prod) => {
                      updateType2Row(item.id, "productName", prod?.name || val);
                      if (prod?.id) {
                        updateType2Row(item.id, "productId", prod.id);
                      }
                    }}
                    triggerClassName="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                        updateType2Row(item.id, "detail", e.target.value)
                      }
                      disabled={readonly}
                      placeholder="ระบุรายละเอียดการติดตาม..."
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
