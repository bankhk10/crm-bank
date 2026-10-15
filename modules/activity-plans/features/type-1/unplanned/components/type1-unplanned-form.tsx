"use client";

import React, { useMemo } from "react";
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
import { cn } from "@/lib/utils";
import { VISIT_TOPICS } from "../../shared/types";
import type { Type1UnplannedFormProps } from "../types";

export function Type1UnplannedForm({
  readonly = false,
  items,
  customers = [],
  products = [],
  addItem,
  updateItem,
  deleteItem,
}: Type1UnplannedFormProps) {
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
            discussionResult: "",
            productAdvice: "",
            advisedProducts: [],
            salesOpportunity: "" as const,
            nextMeetingDate: "",
            farmerHomeAddress: "",
            plotLatitude: "",
            plotLongitude: "",
            plotImages: [],
          },
        ];

  const productComboboxOptions = useMemo(() => {
    return products.map((p) => ({
      value: p.name,
      label: p.name,
      subLabel: p.productCode || undefined,
    }));
  }, [products]);

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
            รายการเข้าพบร้านค้า / Key Farmer (นอกแผน)
          </h3>
          <p className="text-xs text-slate-500">
            บันทึกทั้งเป้าหมายการเข้าพบและผลการปฏิบัติงานจริงพร้อมกันในหน้าเดียว
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
            เพิ่มเป้าหมายนอกแผน
          </Button>
        )}
      </div>

      {/* Target & Actual unified cards */}
      <div className="space-y-4">
        {currentItems.map((item, index) => {
          const currentPurpose = item.visitPurpose || "FARMER";
          const isStore = currentPurpose === "STORE";
          const targetDisplayName =
            item.customerName ||
            item.unregisteredFarmerName ||
            (isStore ? "ร้านค้าเป้าหมาย" : "เกษตรกรเป้าหมาย");

          const isAdviceTopic = item.topic === "ให้คำแนะนำการใช้สินค้า";

          return (
            <div
              key={item.id}
              className="relative p-4 rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300 space-y-4"
            >
              {/* Card top banner: Index + Purpose Switcher + Delete button */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="h-6 px-2 text-xs font-semibold bg-emerald-50 text-emerald-800 border-emerald-200"
                  >
                    เป้าหมายที่ {index + 1}
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

              {/* 1. SECTION: Target Info (ร้านค้า / เกษตรกร) */}
              {!isStore ? (
                /* FARMER */
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                            if (cust?.addressLine && !item.farmerHomeAddress) {
                              updateItem(item.id, "farmerHomeAddress", cust.addressLine);
                            }
                            if (cust?.latitude && !item.plotLatitude) {
                              updateItem(item.id, "plotLatitude", String(cust.latitude));
                            }
                            if (cust?.longitude && !item.plotLongitude) {
                              updateItem(item.id, "plotLongitude", String(cust.longitude));
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
                /* STORE */
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

              {/* Topic & Detail */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <FormCombobox
                  id={`unplanned-topic-${item.id}`}
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
                    placeholder="ระบุรายละเอียดการเข้าพบ..."
                  />
                </div>
              </div>

              {/* 2. SECTION: Actual Results (ผลการปฏิบัติงานจริงในจอเดียว) */}
              <div className="mt-4 pt-4 border-t-2 border-dashed border-emerald-200 bg-emerald-50/40 -mx-4 -mb-4 p-4 rounded-b-xl space-y-4">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs sm:text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>ผลการปฏิบัติงานจริง - {targetDisplayName}</span>
                </div>

                {/* Farmer only: Address + GPS + Plot Photos */}
                {!isStore && (
                  <div className="space-y-3.5 border-b border-emerald-100 pb-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        ที่อยู่บ้านเกษตรกร
                      </label>
                      <Textarea
                        rows={2}
                        value={item.farmerHomeAddress || ""}
                        onChange={(e) =>
                          updateItem(item.id, "farmerHomeAddress", e.target.value)
                        }
                        disabled={readonly}
                        placeholder="ระบุที่อยู่บ้านเกษตรกร เช่น เลขที่ หมู่ที่ ตำบล อำเภอ..."
                        className="bg-white border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <ActivityGpsPicker
                      title={`พิกัดแปลง/จุดเข้าพบ - ${targetDisplayName}`}
                      latitude={item.plotLatitude || ""}
                      longitude={item.plotLongitude || ""}
                      onLatitudeChange={(lat) => updateItem(item.id, "plotLatitude", lat)}
                      onLongitudeChange={(lng) => updateItem(item.id, "plotLongitude", lng)}
                      accentColor="emerald"
                      disabled={readonly}
                    />

                    <ActivityPhotoUpload
                      title="รูปแปลงเกษตรกร (ไม่เกิน 5 รูป)"
                      description="บันทึกสภาพแปลง ปัญหาพืช หรือจุดทดลองจริง"
                      images={item.plotImages || []}
                      onImagesChange={(imgs) => updateItem(item.id, "plotImages", imgs)}
                      maxFiles={5}
                      accentColor="emerald"
                      disabled={readonly}
                    />
                  </div>
                )}

                {/* Discussion Result */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    ผลการพูดคุย / ข้อสรุปการเข้าพบ <span className="text-rose-500">*</span>
                  </label>
                  <Textarea
                    rows={3}
                    value={item.discussionResult || ""}
                    onChange={(e) =>
                      updateItem(item.id, "discussionResult", e.target.value)
                    }
                    disabled={readonly}
                    placeholder="สรุปผลการเจรจา สิ่งที่ได้พูดคุย ความต้องการของลูกค้า หรือข้อตกลง..."
                    className="bg-white border-slate-200 rounded-lg text-xs"
                    required
                  />
                </div>

                {/* Advised Products (Highlight if topic is advice) */}
                <div className="space-y-2 border-t border-emerald-100 pt-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      รายการสินค้าที่ให้คำแนะนำ / นำเสนอ
                    </label>
                    {isAdviceTopic && (
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                        ตรงกับประเด็นหลัก
                      </Badge>
                    )}
                  </div>

                  {!readonly && productComboboxOptions.length > 0 && (
                    <FormCombobox
                      id={`advise-prod-${item.id}`}
                      label=""
                      triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800"
                      value=""
                      onChange={(selectedName) => {
                        if (!selectedName) return;
                        const matched = products.find((p) => p.name === selectedName);
                        if (!matched) return;
                        const curList = item.advisedProducts || [];
                        if (!curList.some((p) => p.productId === matched.id)) {
                          const updated = [
                            ...curList,
                            {
                              productId: matched.id,
                              productName: matched.name,
                              productCode: matched.productCode || null,
                              targetId: item.id,
                            },
                          ];
                          updateItem(item.id, "advisedProducts", updated);
                          updateItem(
                            item.id,
                            "productAdvice",
                            updated.map((p) => p.productName).join(", "),
                          );
                        }
                      }}
                      options={productComboboxOptions}
                      placeholder="+ เลือกสินค้าแนะนำ..."
                      searchPlaceholder="ค้นหาสินค้า..."
                      emptyText="ไม่พบสินค้า"
                    />
                  )}

                  {/* Selected products tags */}
                  {item.advisedProducts && item.advisedProducts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.advisedProducts.map((p) => (
                        <span
                          key={p.productId}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-emerald-200 text-xs font-medium text-emerald-800 shadow-2xs"
                        >
                          <span>{p.productName}</span>
                          {!readonly && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (item.advisedProducts || []).filter(
                                  (prod) => prod.productId !== p.productId,
                                );
                                updateItem(item.id, "advisedProducts", updated);
                                updateItem(
                                  item.id,
                                  "productAdvice",
                                  updated.map((prod) => prod.productName).join(", "),
                                );
                              }}
                              className="text-slate-400 hover:text-rose-500 ml-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sales Opportunity & Next Meeting Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-emerald-100 pt-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      โอกาสการสั่งซื้อ / ต่อยอด
                    </label>
                    <div className="flex items-center gap-2">
                      {(["สูง", "ต่ำ", ""] as const).map((opt) => (
                        <button
                          key={opt || "none"}
                          type="button"
                          disabled={readonly}
                          onClick={() => updateItem(item.id, "salesOpportunity", opt)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                            item.salesOpportunity === opt
                              ? opt === "สูง"
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                                : opt === "ต่ำ"
                                  ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                                  : "bg-slate-700 text-white border-slate-700 shadow-2xs"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                          )}
                        >
                          {opt || "ไม่ระบุ"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      วันนัดหมายครั้งถัดไป
                    </label>
                    <DatePicker
                      value={item.nextMeetingDate || ""}
                      onChange={(val?: string) => {
                        updateItem(item.id, "nextMeetingDate", val || "");
                      }}
                      disabled={readonly}
                      placeholder="เลือกวันนัดหมาย..."
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
