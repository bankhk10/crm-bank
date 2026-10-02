"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Users, Store, UserCheck } from "lucide-react";
import { ActivityInput } from "@/components/activity/activity-input";
import { ActivityAddressSelect } from "@/components/activity/activity-address-select";
import { ActivityCustomerSelect } from "@/components/activity/activity-customer-select";
import { FormCombobox } from "@/components/custom/form-components";
import type { Type1VisitItem, CustomerOption } from "../shared/types";
import type { Type1VisitProps } from "./types";

export type { CustomerOption };

const VISIT_TOPICS = [
  "แจ้งข่าวสาร",
  "อัปเดตข้อมูลลูกค้า",
  "เพิ่มข้อมูลเกษตรกร",
  "เลี้ยงรับรอง / สังสรรค์",
  "ให้คำแนะนำการใช้สินค้า",
  "อื่นๆ",
];

export function Type1Visit({
  readonly = false,
  type1Items,
  updateType1Row,
  customers = [],
}: Type1VisitProps) {
  // 1 Plan : 1 Target rule for TYPE_1
  const item = type1Items[0] || {
    id: "1",
    visitPurpose: "FARMER",
    province: "",
    isUnregisteredFarmer: false,
    storeId: "",
    customerName: "",
    unregisteredFarmerName: "",
    unregisteredFarmerPhone: "",
    topic: "แจ้งข่าวสาร",
    detail: "",
  };

  const currentPurpose: "FARMER" | "STORE" =
    item.visitPurpose === "STORE" ? "STORE" : "FARMER";
  const handleProvinceChange = (newProvince: string) => {
    updateType1Row(item.id, "province", newProvince);
    // When province changes, clear selected farmer to prevent mismatched data
    updateType1Row(item.id, "storeId", undefined);
    updateType1Row(item.id, "customerName", "");
  };

  const handleToggleUnregistered = (checked: boolean) => {
    updateType1Row(item.id, "isUnregisteredFarmer", checked);
    if (checked) {
      // Switching to Unregistered: clear registered farmer
      updateType1Row(item.id, "storeId", undefined);
      updateType1Row(item.id, "customerName", "");
    } else {
      // Switching to Registered: clear unregistered details
      updateType1Row(item.id, "unregisteredFarmerName", "");
      updateType1Row(item.id, "unregisteredFarmerPhone", "");
    }
  };

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4 relative">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <Store className="h-4 w-4 text-emerald-600" />
          <span>เข้าพบร้านค้า / Key Farmer</span>
        </div>
        <span className="text-[11px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
          {currentPurpose === "STORE"
            ? "1 แผน : 1 ร้านค้า"
            : "1 แผน : 1 เกษตรกร"}
        </span>
      </div>

      {/* Single Visit Card */}
      <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3.5">
        {/* Row 0: วัตถุประสงค์ของประเภทงาน */}
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
                onChange={() => handlePurposeChange("FARMER")}
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
                onChange={() => handlePurposeChange("STORE")}
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
            {/* จังหวัด Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
              <ActivityAddressSelect
                id={`province-combobox-${item.id}`}
                levels="province"
                value={item.province || ""}
                onChange={handleProvinceChange}
                disabled={readonly}
                required
              />

              {/* เกษตรกร Selector with Unregistered support */}
              <ActivityCustomerSelect
                id={`farmer-combobox-${item.id}`}
                type="FARMER"
                province={item.province}
                value={item.storeId || ""}
                onChange={(val, cust) => {
                  updateType1Row(item.id, "storeId", val || undefined);
                  updateType1Row(
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
                onUnregisteredToggle={handleToggleUnregistered}
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
                  updateType1Row(
                    item.id,
                    "customerName",
                    cust?.name || "",
                  );
                }}
                customers={customers}
                disabled={readonly}
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                อนุญาตเฉพาะลูกค้าประเภทตัวแทนจำหน่าย (DEALER) หรือร้านค้าย่อย
                (SUBDEALER) ในระบบเท่านั้น
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
    </div>
  );
}
