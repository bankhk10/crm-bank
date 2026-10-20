"use client";

import React from "react";
import { Store, UserCheck, Plus, Trash2 } from "lucide-react";
import { ActivityInput } from "@/modules/activity/ui";
import { ActivityAddressSelect } from "@/modules/activity/ui";
import { ActivityCustomerSelect } from "@/modules/activity/ui";
import { FormCombobox } from "@/components/custom/form-components";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { VISIT_TOPICS } from "../../shared/types";
import type { Type1PlannedFormProps } from "../types";

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
            detail: "",
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
              {!isStore ? (
                /* FARMER FORM */
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* จังหวัด */}
                    <div>
                      <ActivityAddressSelect
                        levels="province"
                        value={item.province || ""}
                        onChange={(val: any) => {
                          const prov = typeof val === "string" ? val : val?.province || "";
                          updateItem(item.id, "province", prov);
                        }}
                        disabled={readonly}
                        required
                      />
                    </div>

                    {/* เลือกเกษตรกรในระบบ หรือ ระบุนอกระบบ */}
                    <div>
                      {!item.isUnregisteredFarmer ? (
                        <ActivityCustomerSelect
                          label="เกษตรกร (ในระบบ)"
                          type="FARMER"
                          value={item.storeId || ""}
                          province={item.province}
                          onChange={(val, cust) => {
                            if (cust?.province && !item.province) {
                              updateItem(item.id, "province", cust.province);
                            }
                            updateItem(item.id, "customerName", cust?.name || "");
                            updateItem(item.id, "storeId", val || undefined);
                          }}
                          customers={customers}
                          disabled={readonly}
                          required
                        />
                      ) : (
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            ชื่อ - สกุล เกษตรกร <span className="text-rose-500">*</span>
                          </label>
                          <ActivityInput
                            type="text"
                            value={item.unregisteredFarmerName || ""}
                            onChange={(e) => {
                              updateItem(item.id, "unregisteredFarmerName", e.target.value);
                              updateItem(item.id, "customerName", e.target.value);
                            }}
                            disabled={readonly}
                            placeholder="ระบุชื่อ-สกุล เกษตรกร"
                          />
                        </div>
                      )}

                      {!readonly && (
                        <div className="mt-1.5 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              const nextVal = !item.isUnregisteredFarmer;
                              updateItem(item.id, "isUnregisteredFarmer", nextVal);
                              updateItem(item.id, "storeId", undefined);
                              updateItem(item.id, "customerName", "");
                              updateItem(item.id, "unregisteredFarmerName", "");
                              updateItem(item.id, "unregisteredFarmerPhone", "");
                            }}
                            className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 underline"
                          >
                            {item.isUnregisteredFarmer
                              ? "← เลือกจากรายชื่อในระบบ"
                              : "+ ระบุเกษตรกรไม่มีในระบบ"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* เบอร์โทรศัพท์ถ้าเป็นนอกระบบ */}
                  {item.isUnregisteredFarmer && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          เบอร์โทรศัพท์เกษตรกร
                        </label>
                        <ActivityInput
                          type="tel"
                          value={item.unregisteredFarmerPhone || ""}
                          onChange={(e) =>
                            updateItem(item.id, "unregisteredFarmerPhone", e.target.value)
                          }
                          disabled={readonly}
                          placeholder="08X-XXX-XXXX"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* STORE FORM */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <ActivityCustomerSelect
                      label="ร้านค้า (ตัวแทนจำหน่าย / ร้านค้าย่อย)"
                      type="STORE"
                      value={item.storeId || ""}
                      onChange={(val, cust) => {
                        if (cust?.province) {
                          updateItem(item.id, "province", cust.province);
                        }
                        updateItem(item.id, "customerName", cust?.name || "");
                        updateItem(item.id, "storeId", val || undefined);
                      }}
                      customers={customers}
                      disabled={readonly}
                      required
                    />
                  </div>
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
                    value={item.detail}
                    onChange={(e) => updateItem(item.id, "detail", e.target.value)}
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
