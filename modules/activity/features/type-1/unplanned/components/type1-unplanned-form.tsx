"use client";

import React, { useState, useEffect } from "react";
import {
  Store,
  UserCheck,
  Plus,
  Trash2,
  CheckCircle2,
  MapPin,
  X,
} from "lucide-react";
import {
  ActivityInput,
  ActivityAddressSelect,
  ActivityCustomerSelect,
  ActivityPhotoUpload,
  ActivityGpsPicker,
  ActivityProductSelect,
} from "@/modules/activity/ui";
import { FormCombobox } from "@/components/custom/form-components";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import DatePicker from "@/components/custom/DatePicker";
import { listProductsAction } from "@/modules/products/server/actions";
import { cn } from "@/lib/utils";
import { VISIT_TOPICS } from "../../shared/constants";
import type { ProductOption } from "../../shared/types";
import type { Type1UnplannedFormProps } from "../types/unplanned.types";

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
            notes: "",
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

  // Self-healing fallback: Load products from master if not supplied by parent view
  const [internalProducts, setInternalProducts] = useState<ProductOption[]>([]);
  useEffect(() => {
    if (products && products.length > 0) {
      setInternalProducts(products);
      return;
    }
    listProductsAction({ status: "ACTIVE", perPage: 1000 })
      .then((res: any) => {
        const list = res?.products || res?.data || [];
        if (list.length > 0) {
          setInternalProducts(list);
        }
      })
      .catch(() => {});
  }, [products]);

  const effectiveProducts =
    products && products.length > 0 ? products : internalProducts;

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

  const handleProvinceChange = (id: string, province: string) => {
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
                        onClick={() =>
                          handlePurposeChange(item.id, currentPurpose, "FARMER")
                        }
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
                        onClick={() =>
                          handlePurposeChange(item.id, currentPurpose, "STORE")
                        }
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                    <ActivityAddressSelect
                      id={`type1-unplanned-province-combobox-${item.id}`}
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
                      id={`type1-unplanned-farmer-combobox-${item.id}`}
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
                        if (cust?.province && !item.province) {
                          updateItem(item.id, "province", cust.province);
                        }
                        if (cust?.addressLine && !item.farmerHomeAddress) {
                          updateItem(
                            item.id,
                            "farmerHomeAddress",
                            cust.addressLine,
                          );
                        }
                        if (cust?.latitude && !item.plotLatitude) {
                          updateItem(
                            item.id,
                            "plotLatitude",
                            String(cust.latitude),
                          );
                        }
                        if (cust?.longitude && !item.plotLongitude) {
                          updateItem(
                            item.id,
                            "plotLongitude",
                            String(cust.longitude),
                          );
                        }
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
                /* STORE */
                <div className="space-y-3">
                  {/* Dealer / Subdealer selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      ประเภทลูกค้า / ร้านค้า <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-6 text-xs text-slate-700">
                      <label className="inline-flex items-center gap-2 cursor-pointer font-medium">
                        <input
                          type="radio"
                          name={`type1-unplanned-customer-type-${item.id}`}
                          checked={!item.isSubDealer}
                          onChange={() => {
                            updateItem(item.id, "isSubDealer", false);
                            updateItem(item.id, "subdealerId", undefined);
                            updateItem(item.id, "subdealerName", "");
                            updateItem(item.id, "subDealerStore", "");
                            updateItem(item.id, "isUnregisteredSubdealer", false);
                          }}
                          disabled={readonly}
                          className="text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                        />
                        <span>ตัวแทนจำหน่ายหลัก (Dealer)</span>
                      </label>

                      <label className="inline-flex items-center gap-2 cursor-pointer font-medium">
                        <input
                          type="radio"
                          name={`type1-unplanned-customer-type-${item.id}`}
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
                          id={`unplanned-customer-combobox-${item.id}`}
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
                                id={`unplanned-parent-dealer-combobox-${item.id}`}
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
                                id={`unplanned-subdealer-combobox-${item.id}`}
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
                                id={`unplanned-parent-dealer-combobox-${item.id}`}
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
                                    if (isChecked) {
                                      updateItem(item.id, "subdealerId", undefined);
                                      updateItem(item.id, "subdealerName", "");
                                    } else {
                                      updateItem(item.id, "subDealerStore", "");
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
                    value={item.notes || ""}
                    onChange={(e) =>
                      updateItem(item.id, "notes", e.target.value)
                    }
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
                          updateItem(
                            item.id,
                            "farmerHomeAddress",
                            e.target.value,
                          )
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
                      onLatitudeChange={(lat) =>
                        updateItem(item.id, "plotLatitude", lat)
                      }
                      onLongitudeChange={(lng) =>
                        updateItem(item.id, "plotLongitude", lng)
                      }
                      accentColor="emerald"
                      disabled={readonly}
                    />

                    <ActivityPhotoUpload
                      title="รูปแปลงเกษตรกร (ไม่เกิน 5 รูป)"
                      description="บันทึกสภาพแปลง ปัญหาพืช หรือจุดทดลองจริง"
                      images={item.plotImages || []}
                      onImagesChange={(imgs) =>
                        updateItem(item.id, "plotImages", imgs)
                      }
                      maxFiles={5}
                      accentColor="emerald"
                      disabled={readonly}
                    />
                  </div>
                )}

                {/* Discussion Result */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    ผลการพูดคุย / ข้อสรุปการเข้าพบ{" "}
                    <span className="text-rose-500">*</span>
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
                      รายการสินค้าที่ให้คำแนะนำ
                    </label>
                    {isAdviceTopic && (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200"
                      >
                        ตรงกับประเด็นหลัก
                      </Badge>
                    )}
                  </div>

                  {!readonly && (
                    <ActivityProductSelect
                      id={`advise-prod-${item.id}`}
                      value=""
                      products={effectiveProducts}
                      excludeValues={(item.advisedProducts || []).map(
                        (p) => p.productName,
                      )}
                      unitFilter="box"
                      onChange={(selectedName, matchedProd) => {
                        if (!selectedName) return;
                        const matched =
                          matchedProd ||
                          effectiveProducts.find(
                            (p) => p.name === selectedName,
                          );
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
                      placeholder="+ เลือกสินค้าแนะนำ..."
                      searchPlaceholder="พิมพ์ชื่อ หรือรหัสสินค้าเพื่อค้นหา..."
                      emptyText="ไม่พบสินค้า"
                      triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800"
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
                                const updated = (
                                  item.advisedProducts || []
                                ).filter(
                                  (prod) => prod.productId !== p.productId,
                                );
                                updateItem(item.id, "advisedProducts", updated);
                                updateItem(
                                  item.id,
                                  "productAdvice",
                                  updated
                                    .map((prod) => prod.productName)
                                    .join(", "),
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
                <div className="grid grid-cols-1 sm:grid-cols-1 gap-3 border-t border-emerald-100 pt-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      โอกาสการสั่งซื้อ
                    </label>
                    <div className="flex items-center gap-2">
                      {(["สูง", "ต่ำ", ""] as const).map((opt) => (
                        <button
                          key={opt || "none"}
                          type="button"
                          disabled={readonly}
                          onClick={() =>
                            updateItem(item.id, "salesOpportunity", opt)
                          }
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
