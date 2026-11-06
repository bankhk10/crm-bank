"use client";

import React from "react";
import { Store, UserCheck, Plus, Trash2 } from "lucide-react";
import {
  ActivityInput,
  ActivityAddressSelect,
  ActivityCustomerSelect,
} from "@/modules/activity/ui";
import { FormCombobox } from "@/components/custom/form-components";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { VISIT_TOPICS } from "../../shared/constants";
import type { Type1PlannedFormProps } from "../types/planned.types";

export function Type1PlannedForm({
  readonly = false,
  items,
  customers = [],
  addItem,
  updateItem,
  deleteItem,
}: Type1PlannedFormProps) {
  const currentItems =
    items && items.length > 0
      ? items
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
            notes: "",
          },
        ];

  const handlePurposeChange = (
    id: string,
    currentPurpose: "FARMER" | "STORE",
    newPurpose: "FARMER" | "STORE",
  ) => {
    if (newPurpose === currentPurpose) return;
    updateItem(id, "visitPurpose", newPurpose);
    updateItem(id, "storeId", undefined);
    updateItem(id, "customerName", "");
    updateItem(id, "province", "");
    updateItem(id, "isUnregisteredFarmer", false);
    updateItem(id, "unregisteredFarmerName", "");
    updateItem(id, "unregisteredFarmerPhone", "");
    updateItem(id, "isSubDealer", false);
    updateItem(id, "subdealerId", undefined);
    updateItem(id, "subdealerName", "");
    updateItem(id, "isUnregisteredSubdealer", false);
    updateItem(id, "subDealerStore", "");
    updateItem(id, "dealerName", "");
  };

  const handleProvinceChange = (id: string, val: any) => {
    const province = typeof val === "string" ? val : val?.province || "";
    updateItem(id, "province", province);
    updateItem(id, "storeId", undefined);
    updateItem(id, "customerName", "");
  };

  const handleToggleUnregistered = (id: string, checked: boolean) => {
    updateItem(id, "isUnregisteredFarmer", checked);
    if (checked) {
      updateItem(id, "storeId", undefined);
      updateItem(id, "customerName", "");
    } else {
      updateItem(id, "unregisteredFarmerName", "");
      updateItem(id, "unregisteredFarmerPhone", "");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            รายการเข้าพบร้านค้า / Key Farmer (ในแผน)
          </h3>
          <p className="text-xs text-slate-500">
            กำหนดรายชื่อร้านค้าหรือเกษตรกรที่วางแผนจะเข้าพบ
          </p>
        </div>
        {!readonly && addItem && (
          <Button
            type="button"
            size="sm"
            onClick={addItem}
            className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            เพิ่มเป้าหมายเข้าพบ
          </Button>
        )}
      </div>

      {/* Target Items List */}
      <div className="space-y-3.5">
        {currentItems.map((item, index) => {
          const currentPurpose = item.visitPurpose || "FARMER";
          const isStore = currentPurpose === "STORE";

          return (
            <div
              key={item.id}
              className="relative p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300 space-y-3"
            >
              {/* Card top banner: Index + Purpose Switcher + Delete button */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="h-6 px-2 text-xs font-semibold bg-slate-50 text-slate-600 border-slate-200"
                  >
                    ลำดับที่ {index + 1}
                  </Badge>

                  {/* Purpose Toggle: เกษตรกร vs ร้านค้า */}
                  {!readonly ? (
                    <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
                      <button
                        type="button"
                        onClick={() => handlePurposeChange(item.id, currentPurpose, "FARMER")}
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all",
                          !isStore
                            ? "bg-white text-emerald-700 shadow-sm font-semibold"
                            : "text-slate-600 hover:text-slate-900",
                        )}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>เกษตรกร</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePurposeChange(item.id, currentPurpose, "STORE")}
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all",
                          isStore
                            ? "bg-white text-emerald-700 shadow-sm font-semibold"
                            : "text-slate-600 hover:text-slate-900",
                        )}
                      >
                        <Store className="w-3.5 h-3.5" />
                        <span>ร้านค้า</span>
                      </button>
                    </div>
                  ) : (
                    <Badge
                      className={cn(
                        "text-xs font-medium",
                        isStore
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200",
                      )}
                    >
                      {isStore ? "เข้าพบร้านค้า" : "เข้าพบเกษตรกร"}
                    </Badge>
                  )}
                </div>

                {!readonly && deleteItem && currentItems.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteItem(item.id)}
                    className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                    title="ลบรายการนี้"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>

              {/* Form Inputs */}
              {currentPurpose === "FARMER" ? (
                /* FARMER FORM */
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                    <ActivityAddressSelect
                      id={`type1-province-combobox-${item.id}`}
                      levels="province"
                      triggerClassName="focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      value={item.province || ""}
                      onChange={(val: string) =>
                        handleProvinceChange(item.id, val)
                      }
                      disabled={readonly}
                      required
                    />

                    <ActivityCustomerSelect
                      id={`type1-farmer-combobox-${item.id}`}
                      type="FARMER"
                      province={item.province}
                      value={item.storeId || ""}
                      onChange={(val, cust) => {
                        updateItem(item.id, "storeId", val || undefined);
                        updateItem(
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
                      onUnregisteredNameChange={(val) => {
                        updateItem(item.id, "unregisteredFarmerName", val);
                        updateItem(item.id, "customerName", val);
                      }}
                      unregisteredPhone={item.unregisteredFarmerPhone || ""}
                      onUnregisteredPhoneChange={(val) =>
                        updateItem(
                          item.id,
                          "unregisteredFarmerPhone",
                          val,
                        )
                      }
                    />
                  </div>
                </div>
              ) : (
                /* STORE FORM */
                <div className="space-y-3">
                  {/* Customer Type Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      ประเภทลูกค้า / ร้านค้า{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-5">
                      <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                        <input
                          type="radio"
                          name={`type1-customer-type-${item.id}`}
                          checked={!item.isSubDealer}
                          onChange={() => {
                            updateItem(item.id, "isSubDealer", false);
                            updateItem(item.id, "subDealerStore", "");
                            updateItem(item.id, "subdealerId", undefined);
                            updateItem(item.id, "subdealerName", "");
                            updateItem(item.id, "isUnregisteredSubdealer", false);
                          }}
                          disabled={readonly}
                          className="text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                        />
                        <span>ตัวแทนจำหน่ายหลัก (Dealer)</span>
                      </label>

                      <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                        <input
                          type="radio"
                          name={`type1-customer-type-${item.id}`}
                          checked={Boolean(item.isSubDealer)}
                          onChange={() => {
                            updateItem(item.id, "isSubDealer", true);
                          }}
                          disabled={readonly}
                          className="text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                        />
                        <span>ร้านค้าย่อย (Subdealer)</span>
                      </label>
                    </div>
                  </div>

                  {/* Customer Selection Fields */}
                  {!item.isSubDealer ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <ActivityCustomerSelect
                          id={`customer-combobox-${item.id}`}
                          type="DEALER"
                          label="ชื่อร้านค้า (Dealer)"
                          labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                          triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                          value={item.storeId || ""}
                          onChange={(val, cust) => {
                            updateItem(item.id, "storeId", val || undefined);
                            updateItem(item.id, "customerName", cust?.name || "");
                            updateItem(item.id, "dealerName", cust?.name || "");
                            if (cust?.province) {
                              updateItem(item.id, "province", cust.province);
                            }
                          }}
                          customers={customers}
                          placeholder="เลือกร้านค้า Dealer..."
                          searchPlaceholder="ค้นหาร้านค้า Dealer..."
                          emptyText="ไม่พบร้านค้า Dealer ในระบบ"
                          disabled={readonly}
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 p-3 bg-amber-50/40 rounded-xl border border-amber-200/70">
                      {item.isUnregisteredSubdealer ? (
                        /* กรณี Subdealer ไม่มีในระบบ (ระบุเอง) */
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">
                                1. ชื่อร้าน Subdealer{" "}
                                <span className="text-rose-500">*</span>
                              </label>
                              <ActivityInput
                                type="text"
                                value={item.subDealerStore || ""}
                                onChange={(e) => {
                                  updateItem(item.id, "subDealerStore", e.target.value);
                                  updateItem(item.id, "customerName", e.target.value);
                                }}
                                disabled={readonly}
                                placeholder="ระบุชื่อร้านค้า Subdealer..."
                                required
                              />
                            </div>

                            <div>
                              <ActivityCustomerSelect
                                id={`parent-dealer-combobox-${item.id}`}
                                type="DEALER"
                                label="2. Dealer ต้นสังกัด"
                                labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                                triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                                value={item.storeId || ""}
                                onChange={(val, cust) => {
                                  updateItem(item.id, "storeId", val || undefined);
                                  updateItem(item.id, "dealerName", cust?.name || "");
                                  if (cust?.province) {
                                    updateItem(item.id, "province", cust.province);
                                  }
                                }}
                                customers={customers}
                                placeholder="เลือก Dealer ต้นสังกัด..."
                                searchPlaceholder="ค้นหา Dealer ต้นสังกัด..."
                                emptyText="ไม่พบ Dealer ในระบบ"
                                disabled={readonly}
                                required
                              />
                            </div>
                          </div>

                          {!readonly && (
                            <div className="flex items-center justify-start pt-1">
                              <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={Boolean(item.isUnregisteredSubdealer)}
                                  onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    updateItem(item.id, "isUnregisteredSubdealer", isChecked);
                                    if (!isChecked) {
                                      updateItem(item.id, "subDealerStore", "");
                                    } else {
                                      updateItem(item.id, "subdealerId", undefined);
                                      updateItem(item.id, "subdealerName", "");
                                    }
                                  }}
                                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                                />
                                <span className="text-amber-800 font-semibold">
                                  ร้านค้านี้ไม่มีในระบบ (ระบุเอง)
                                </span>
                              </label>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* กรณี Subdealer มีในระบบ */
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <ActivityCustomerSelect
                                id={`subdealer-combobox-${item.id}`}
                                type="SUBDEALER"
                                label="1. เลือกร้านค้า Subdealer จากระบบ"
                                labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                                triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                                value={item.subdealerId || ""}
                                onChange={(val, cust) => {
                                  updateItem(item.id, "subdealerId", val || undefined);
                                  updateItem(item.id, "subdealerName", cust?.name || "");
                                  updateItem(item.id, "customerName", cust?.name || "");
                                  if (cust?.province) {
                                    updateItem(item.id, "province", cust.province);
                                  }
                                  if (cust && (cust as any).parentDealerId) {
                                    const parent = customers.find(
                                      (c) => c.id === (cust as any).parentDealerId,
                                    );
                                    if (parent) {
                                      updateItem(item.id, "storeId", parent.id);
                                      updateItem(item.id, "dealerName", parent.name);
                                    }
                                  }
                                }}
                                customers={customers}
                                placeholder="เลือกร้านค้า Subdealer ในระบบ..."
                                searchPlaceholder="ค้นหาร้านค้า Subdealer..."
                                emptyText="ไม่พบร้านค้า Subdealer ในระบบ"
                                disabled={readonly}
                                required
                              />
                            </div>

                            <div>
                              <ActivityCustomerSelect
                                id={`parent-dealer-combobox-${item.id}`}
                                type="DEALER"
                                label="2. Dealer ต้นสังกัด"
                                labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                                triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                                value={item.storeId || ""}
                                onChange={(val, cust) => {
                                  updateItem(item.id, "storeId", val || undefined);
                                  updateItem(item.id, "dealerName", cust?.name || "");
                                }}
                                customers={customers}
                                placeholder="เลือก Dealer ต้นสังกัด..."
                                searchPlaceholder="ค้นหา Dealer ต้นสังกัด..."
                                emptyText="ไม่พบ Dealer ในระบบ"
                                disabled={readonly}
                                required
                              />
                            </div>
                          </div>

                          {!readonly && (
                            <div className="flex items-center justify-start pt-1">
                              <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={Boolean(item.isUnregisteredSubdealer)}
                                  onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    updateItem(item.id, "isUnregisteredSubdealer", isChecked);
                                    if (!isChecked) {
                                      updateItem(item.id, "subDealerStore", "");
                                    } else {
                                      updateItem(item.id, "subdealerId", undefined);
                                      updateItem(item.id, "subdealerName", "");
                                    }
                                  }}
                                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                                />
                                <span className="text-amber-800 font-semibold">
                                  ร้านค้านี้ไม่มีในระบบ (ระบุเอง)
                                </span>
                              </label>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Common: ประเด็นหลัก & รายละเอียดเพิ่มเติม */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <FormCombobox
                  id={`planned-topic-${item.id}`}
                  label="ประเด็นหลัก"
                  labelClassName="block text-xs font-semibold text-slate-700 mb-1"
                  triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium"
                  value={item.topic}
                  onChange={(val) => updateItem(item.id, "topic", val)}
                  options={VISIT_TOPICS.map((t) => ({ label: t, value: t }))}
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
                    value={item.notes || ""}
                    onChange={(e) => updateItem(item.id, "notes", e.target.value)}
                    disabled={readonly}
                    placeholder="ระบุรายละเอียดเพิ่มเติมการเข้าพบ..."
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
