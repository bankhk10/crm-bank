"use client";

import React, { useMemo, useEffect } from "react";
import {
  Store,
  UserCheck,
  Plus,
  Trash2,
  CheckCircle2,
  MapPin,
  X,
} from "lucide-react";
import { ActivityInput } from "@/components/activity/activity-input";
import { ActivityAddressSelect } from "@/components/activity/activity-address-select";
import { ActivityCustomerSelect } from "@/components/activity/activity-customer-select";
import { ActivityPhotoUpload, ActivityGpsPicker } from "@/components/activity";
import { FormCombobox } from "@/components/custom/form-components";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import DatePicker from "@/components/custom/DatePicker";
import { DEMO_PRODUCTS } from "@/modules/activity-plans/constants";
import { cn } from "@/lib/utils";
import type {
  Type1VisitItem,
  CustomerOption,
  ProductOption,
  Type1PlanFormProps,
  Type1VisitProps,
  Type1AdviceProductItem,
} from "../types";

export type { CustomerOption, ProductOption, Type1PlanFormProps, Type1VisitProps };

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
  products = [],
  isUnplanned = false,
  onSyncActual,
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

  // Sync actual data to parent orchestrator when items change (Unplanned mode)
  useEffect(() => {
    if (isUnplanned && onSyncActual) {
      onSyncActual(items);
    }
  }, [isUnplanned, items, onSyncActual]);

  const comboboxOptions = useMemo(() => {
    if (products && products.length > 0) {
      return products.map((p) => ({
        value: p.name,
        label: p.name,
        subLabel: p.productCode || undefined,
      }));
    }
    return DEMO_PRODUCTS.map((name) => ({
      value: name,
      label: name,
      subLabel: undefined,
    }));
  }, [products]);

  const handlePurposeChange = (
    id: string,
    currentPurpose: "FARMER" | "STORE",
    newPurpose: "FARMER" | "STORE",
  ) => {
    if (newPurpose === currentPurpose) return;
    updateType1Row(id, "visitPurpose", newPurpose);
    if (newPurpose === "STORE") {
      updateType1Row(id, "province", "");
      updateType1Row(id, "storeId", undefined);
      updateType1Row(id, "customerName", "");
      updateType1Row(id, "isUnregisteredFarmer", false);
      updateType1Row(id, "unregisteredFarmerName", "");
      updateType1Row(id, "unregisteredFarmerPhone", "");
      updateType1Row(id, "farmerHomeAddress", "");
    } else {
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

  const handleAddProduct = (id: string, prod: string) => {
    if (!prod) return;
    const item = items.find((it) => it.id === id);
    if (!item) return;

    const currentProds = item.productAdvice
      ? item.productAdvice
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    if (currentProds.includes(prod)) return;

    const matched = products.find((p) => p.name === prod);
    const newAdvised: Type1AdviceProductItem = {
      productId: matched?.id || prod,
      productName: prod,
      productCode: matched?.productCode || null,
      targetId: id,
    };

    const updatedAdvised = [...(item.advisedProducts || []), newAdvised];
    const updatedNames = [...currentProds, prod].join(", ");

    updateType1Row(id, "productAdvice", updatedNames);
    updateType1Row(id, "advisedProducts", updatedAdvised);
  };

  const handleRemoveProduct = (id: string, prod: string) => {
    const item = items.find((it) => it.id === id);
    if (!item) return;

    const currentProds = item.productAdvice
      ? item.productAdvice
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const updatedNames = currentProds.filter((p) => p !== prod).join(", ");
    const updatedAdvised = (item.advisedProducts || []).filter(
      (p) => p.productName !== prod,
    );

    updateType1Row(id, "productAdvice", updatedNames);
    updateType1Row(id, "advisedProducts", updatedAdvised);
  };

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4 relative">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <Store className="h-4 w-4 text-emerald-600" />
          <span>เข้าพบร้านค้า / Key Farmer {isUnplanned && "(พร้อมบันทึกผลจริง)"}</span>
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

          const targetSelectedProducts = item.productAdvice
            ? item.productAdvice
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [];

          const targetDisplayName = item.isUnregisteredFarmer
            ? item.unregisteredFarmerName || item.customerName || `เป้าหมายที่ ${index + 1}`
            : item.customerName || `เป้าหมายที่ ${index + 1}`;

          return (
            <div
              key={item.id}
              className="p-3.5 sm:p-4 md:p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4 relative transition-all"
            >
              {/* Card Title & Delete Button */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center border border-slate-200">
                    {index + 1}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                    เป้าหมายที่ {index + 1}: {targetDisplayName}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded",
                      currentPurpose === "STORE"
                        ? "bg-sky-50 text-sky-800 border-sky-200"
                        : "bg-emerald-50 text-emerald-800 border-emerald-200",
                    )}
                  >
                    {currentPurpose === "STORE" ? "เข้าพบร้านค้า" : "เข้าพบเกษตรกร"}
                  </Badge>
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

              {/* SECTION: วัตถุประสงค์และการเลือกเป้าหมาย */}
              <div className="space-y-3">
                {/* Row: วัตถุประสงค์ของประเภทงาน */}
                <div className="space-y-1.5 border-b border-slate-100 pb-3">
                  <label className="block text-xs font-semibold text-slate-700">
                    ประเภทผู้รับการเข้าพบ <span className="text-rose-500">*</span>
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

              {/* UNPLANNED MODE: EMBEDDED ACTUAL RESULTS CARD */}
              {isUnplanned && (
                <div className="mt-4 pt-4 border-t-2 border-dashed border-emerald-200/90 bg-emerald-50/30 -mx-3.5 sm:-mx-4 md:-mx-5 -mb-3.5 sm:-mb-4 md:-mb-5 p-3.5 sm:p-4 md:p-5 rounded-b-xl space-y-4">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs sm:text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>ผลการปฏิบัติงานจริง (Actual Results) - {targetDisplayName}</span>
                  </div>

                  {/* Farmer Home Address & Plot GPS & Photos (Farmer only) */}
                  {currentPurpose === "FARMER" && (
                    <div className="space-y-3.5 border-b border-emerald-100 pb-4">
                      {/* ที่อยู่บ้านเกษตรกร */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          ที่อยู่บ้านเกษตรกร
                        </label>
                        <Textarea
                          rows={2}
                          value={item.farmerHomeAddress || ""}
                          onChange={(e) =>
                            updateType1Row(item.id, "farmerHomeAddress", e.target.value)
                          }
                          disabled={readonly}
                          placeholder="ระบุที่อยู่บ้านเกษตรกร เช่น เลขที่ หมู่ที่ ตำบล อำเภอ"
                          className="bg-white border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      {/* พิกัดแปลง (Plot Coordinates) */}
                      <ActivityGpsPicker
                        title={`พิกัดแปลง/จุดเข้าพบ - ${targetDisplayName}`}
                        latitude={item.plotLatitude || ""}
                        longitude={item.plotLongitude || ""}
                        onLatitudeChange={(lat) =>
                          updateType1Row(item.id, "plotLatitude", lat)
                        }
                        onLongitudeChange={(lng) =>
                          updateType1Row(item.id, "plotLongitude", lng)
                        }
                        accentColor="emerald"
                        disabled={readonly}
                      />

                      {/* รูปแปลงเกษตรกร (Plot Photos - Max 5) */}
                      <ActivityPhotoUpload
                        title={`รูปภาพการปฏิบัติงาน - ${targetDisplayName} (สูงสุด 5 รูป)`}
                        description="อัปโหลดรูปภาพ เช่น สภาพแปลง แปลงปลูก หรือการพูดคุย"
                        images={item.plotImages || []}
                        onImagesChange={(imgs) =>
                          updateType1Row(item.id, "plotImages", imgs)
                        }
                        maxFiles={5}
                        accentColor="emerald"
                        disabled={readonly}
                      />
                    </div>
                  )}

                  {/* ผลการพูดคุยเจรจา */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      ผลการพูดคุยเจรจา <span className="text-rose-500">*</span>
                    </label>
                    <Textarea
                      rows={2}
                      value={item.discussionResult || ""}
                      onChange={(e) =>
                        updateType1Row(item.id, "discussionResult", e.target.value)
                      }
                      disabled={readonly}
                      placeholder={
                        currentPurpose === "STORE"
                          ? "ระบุผลการพูดคุยเจรจากับร้านค้า เช่น การสต็อกสินค้า ยอดขาย ปัญหาที่พบ หรือข้อตกลง..."
                          : "ระบุผลการพูดคุยเจรจากับเกษตรกร เช่น สภาพพืช การใช้ยา ความพึงพอใจ หรือคำแนะนำ..."
                      }
                      className="bg-white border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  {/* สินค้าที่ให้คำแนะนำ */}
                  <div className="space-y-2 border-b border-emerald-100 pb-3.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700">
                        สินค้าที่ให้คำแนะนำ
                      </label>
                      {targetSelectedProducts.length > 0 && (
                        <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          เลือกแล้ว {targetSelectedProducts.length} รายการ
                        </span>
                      )}
                    </div>

                    {targetSelectedProducts.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 p-2 bg-emerald-50/50 border border-emerald-200/60 rounded-lg">
                        {targetSelectedProducts.map((prod) => (
                          <span
                            key={prod}
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-white text-emerald-900 border border-emerald-200 shadow-2xs"
                          >
                            {prod}
                            {!readonly && (
                              <button
                                type="button"
                                onClick={() => handleRemoveProduct(item.id, prod)}
                                className="hover:bg-emerald-100 rounded p-0.5 transition-colors text-emerald-600 hover:text-red-600 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    )}

                    {!readonly && (
                      <FormCombobox
                        id={`unplanned-product-advice-${item.id}`}
                        label=""
                        labelClassName="hidden"
                        value=""
                        onChange={(val) => {
                          if (val) handleAddProduct(item.id, val);
                        }}
                        options={comboboxOptions}
                        placeholder="เลือกสินค้าที่ให้คำแนะนำ (คลิกเลือกหลายรายการได้)"
                        searchPlaceholder="ค้นหาสินค้า..."
                        emptyText="ไม่พบสินค้า"
                        triggerClassName="w-full bg-white border-slate-200 text-xs h-9 min-h-[36px] rounded-lg mt-0 font-normal hover:bg-slate-50 focus:ring-2 focus:ring-emerald-500"
                      />
                    )}
                  </div>

                  {/* ประเมินโอกาสการขาย & วันที่นัดหมาย & สิ่งที่ต้องทำต่อ */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                    {/* ประเมินโอกาสการขาย */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        ประเมินโอกาสการขาย
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(["สูง", "ต่ำ"] as const).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            disabled={readonly}
                            onClick={() =>
                              updateType1Row(item.id, "salesOpportunity", opt)
                            }
                            className={cn(
                              "py-1.5 px-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all flex items-center justify-center",
                              item.salesOpportunity === opt
                                ? opt === "สูง"
                                  ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                                  : "bg-amber-500 border-amber-500 text-white shadow-xs"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                            )}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* สิ่งที่ต้องดำเนินการต่อ */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        สิ่งที่ต้องดำเนินการต่อ
                      </label>
                      <ActivityInput
                        type="text"
                        value={item.nextAction || ""}
                        onChange={(e) =>
                          updateType1Row(item.id, "nextAction", e.target.value)
                        }
                        disabled={readonly}
                        placeholder="เช่น โทรติดตามผล, ส่งตัวอย่าง..."
                      />
                    </div>

                    {/* วันที่นัดหมายครั้งถัดไป */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        วันที่นัดหมายครั้งถัดไป
                      </label>
                      <DatePicker
                        value={item.nextMeetingDate || ""}
                        onChange={(v?: string) => {
                          updateType1Row(item.id, "nextMeetingDate", v || "");
                        }}
                        placeholder="เลือกวันที่นัดหมาย"
                        disabled={readonly}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
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
