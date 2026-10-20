"use client";

import React, { useState } from "react";
import {
  Users,
  Plus,
  Trash2,
  ShoppingBag,
  Target,
  Sparkles,
  ClipboardCheck,
  Calendar,
  Clock,
  MapPin,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ActivityCustomerSelect,
  ActivityProductSelect,
  ActivityInput,
  ActivityTextarea,
  ActivityPhotoUpload,
  type ActivityProductItem,
} from "@/modules/activity/ui";
import {
  MEETING_TARGET_OPTIONS,
  FARMER_CHANNEL_OPTIONS,
  VENUE_TYPE_OPTIONS,
} from "../../shared/constants";
import type {
  Type8UnplannedFormProps,
  Type8UnplannedItem,
} from "../types/unplanned.types";
import type {
  Type8MeetingTarget,
  Type8FarmerChannel,
  Type8VenueType,
  ProductSaleDetail,
} from "../../shared/types";

export function Type8UnplannedForm({
  readonly = false,
  items = [],
  customers = [],
  products = [],
  addItem,
  updateItem,
  deleteItem,
  addPromotion,
  updatePromotion,
  deletePromotion,
}: Type8UnplannedFormProps) {
  // Local state for product sales details per item
  const handleAddSaleDetail = (itemId: string, isAdditional: boolean = true) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const newSale: ProductSaleDetail = {
      id: `sale-${Date.now()}`,
      productId: "",
      productName: "",
      actualQty: "",
      notes: "",
      isAdditional,
    };

    updateItem(itemId, "productSalesDetails", [
      ...(item.productSalesDetails || []),
      newSale,
    ]);
  };

  const handleUpdateSaleDetail = (
    itemId: string,
    saleId: string,
    field: keyof ProductSaleDetail,
    val: any,
  ) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const updated = (item.productSalesDetails || []).map((s) => {
      if ((s.id || s.productId) === saleId) {
        return { ...s, [field]: val };
      }
      return s;
    });

    updateItem(itemId, "productSalesDetails", updated);
  };

  const handleDeleteSaleDetail = (itemId: string, saleId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const updated = (item.productSalesDetails || []).filter(
      (s) => (s.id || s.productId) !== saleId,
    );

    updateItem(itemId, "productSalesDetails", updated);
  };

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 md:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm sm:text-base">
          <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center border border-purple-200">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <span>จัดประชุมนอกแผน (Type 8 — Dual Mode)</span>
            <span className="block text-[11px] font-normal text-slate-500">
              บันทึกข้อมูลการจัดประชุมและผลลัพธ์การประชุม 2-in-1 ในขั้นตอนเดียว
            </span>
          </div>
        </div>

        {!readonly && addItem && (
          <Button
            type="button"
            size="sm"
            onClick={addItem}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl h-8 px-3 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            เพิ่มการประชุม
          </Button>
        )}
      </div>

      {/* Items List */}
      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="py-8 text-center text-slate-400 italic bg-white rounded-xl border border-slate-200 text-xs">
            ยังไม่มีรายการประชุมนอกแผน
          </div>
        ) : (
          items.map((item, index) => {
            const meetingTarget: Type8MeetingTarget =
              item.meetingTarget || "FARMER";
            const farmerChannel: Type8FarmerChannel =
              item.farmerChannel || "DEALER";
            const promoItems = item.promotions || [];
            const salesDetails = item.productSalesDetails || [];

            return (
              <div
                key={item.id}
                className="p-4 sm:p-5 bg-white rounded-2xl border border-purple-200/80 shadow-xs space-y-5 transition-all hover:border-purple-300"
              >
                {/* Header per card */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-bold text-purple-950 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[11px] font-extrabold">
                      {index + 1}
                    </span>
                    รายการจัดประชุมที่ {index + 1}
                  </span>
                  {!readonly && deleteItem && items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => deleteItem(item.id)}
                      className="p-1 rounded-md text-rose-500 hover:bg-rose-50 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>ลบรายการ</span>
                    </button>
                  )}
                </div>

                {/* 1. Target Audience */}
                <div className="bg-purple-50/30 p-3.5 rounded-xl border border-purple-100 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      จัดประชุมให้ใคร <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-5">
                      {MEETING_TARGET_OPTIONS.map((opt) => (
                        <label
                          key={opt.value}
                          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={`unplanned-meeting-target-${item.id}`}
                            value={opt.value}
                            checked={meetingTarget === opt.value}
                            onChange={() =>
                              updateItem(item.id, "meetingTarget", opt.value)
                            }
                            disabled={readonly}
                            className="text-purple-600 focus:ring-purple-500 h-4 w-4"
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Channel selection for FARMER */}
                  {meetingTarget === "FARMER" && (
                    <div className="pt-2 border-t border-purple-100/60">
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        ช่องทางประสานงานผ่าน <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex flex-wrap items-center gap-5">
                        {FARMER_CHANNEL_OPTIONS.map((opt) => (
                          <label
                            key={opt.value}
                            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer"
                          >
                            <input
                              type="radio"
                              name={`unplanned-farmer-channel-${item.id}`}
                              value={opt.value}
                              checked={farmerChannel === opt.value}
                              onChange={() =>
                                updateItem(item.id, "farmerChannel", opt.value)
                              }
                              disabled={readonly}
                              className="text-purple-600 focus:ring-purple-500 h-4 w-4"
                            />
                            <span>{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dealer Selection */}
                  {(meetingTarget === "DEALER" ||
                    (meetingTarget === "FARMER" &&
                      farmerChannel === "DEALER")) && (
                    <div className="pt-2 border-t border-purple-100/60 space-y-1">
                      <label className="block text-xs font-bold text-slate-800">
                        เลือกร้านค้าผู้แทนจำหน่าย (Dealer){" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <ActivityCustomerSelect
                        customers={customers as any}
                        value={item.customerId || ""}
                        onChange={(val, c) => {
                          updateItem(item.id, "customerId", val || null);
                          updateItem(item.id, "customerName", c?.name || null);
                        }}
                        disabled={readonly}
                      />
                    </div>
                  )}

                  {/* Subdealer Selection */}
                  {(meetingTarget === "SUBDEALER" ||
                    (meetingTarget === "FARMER" &&
                      farmerChannel === "SUBDEALER")) && (
                    <div className="pt-2 border-t border-purple-100/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-800">
                          ร้านค้ารายย่อย (Subdealer){" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <label className="inline-flex items-center gap-1.5 text-xs text-purple-700 cursor-pointer font-medium">
                          <input
                            type="checkbox"
                            checked={Boolean(item.isNewSubdealer)}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "isNewSubdealer",
                                e.target.checked,
                              )
                            }
                            disabled={readonly}
                            className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span>ยังไม่มีในระบบ (กรอกชื่อเอง)</span>
                        </label>
                      </div>

                      {item.isNewSubdealer ? (
                        <ActivityInput
                          type="text"
                          value={item.subdealerName || ""}
                          onChange={(e) =>
                            updateItem(item.id, "subdealerName", e.target.value)
                          }
                          placeholder="พิมพ์ชื่อร้านค้ารายย่อย..."
                          disabled={readonly}
                          className="bg-white"
                        />
                      ) : (
                        <ActivityCustomerSelect
                          customers={customers as any}
                          value={item.subdealerId || ""}
                          onChange={(val, c) => {
                            updateItem(item.id, "subdealerId", val || null);
                            updateItem(
                              item.id,
                              "subdealerName",
                              c?.name || null,
                            );
                          }}
                          disabled={readonly}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Topic & Venue */}
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <span>หัวข้อการประชุม</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <ActivityInput
                      type="text"
                      value={item.topic}
                      onChange={(e) =>
                        updateItem(item.id, "topic", e.target.value)
                      }
                      placeholder="ระบุหัวข้อประชุม เช่น แนะนำผลิตภัณฑ์ใหม่, อบรมเทคนิคการใช้..."
                      disabled={readonly}
                      className="bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Venue Type */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-800">
                        ประเภทสถานที่จัดประชุม
                      </label>
                      <div className="flex items-center gap-3 h-9">
                        {VENUE_TYPE_OPTIONS.map((v) => (
                          <label
                            key={v.value}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer"
                          >
                            <input
                              type="radio"
                              name={`unplanned-venue-${item.id}`}
                              value={v.value}
                              checked={(item.venueType || "OTHER") === v.value}
                              onChange={() =>
                                updateItem(item.id, "venueType", v.value)
                              }
                              disabled={readonly}
                              className="text-purple-600 focus:ring-purple-500 h-3.5 w-3.5"
                            />
                            <span>{v.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Location Detail */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>สถานที่จัดประชุม / ที่อยู่</span>
                      </label>
                      <ActivityInput
                        type="text"
                        value={item.location || ""}
                        onChange={(e) =>
                          updateItem(item.id, "location", e.target.value)
                        }
                        placeholder="เช่น ศาลาประชาคมหมู่ 4, ร้านค้าสาขาหลัก..."
                        disabled={readonly}
                        className="bg-white"
                      />
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>วันที่จัดประชุม</span>
                      </label>
                      <ActivityInput
                        type="date"
                        value={item.meetingDate || ""}
                        onChange={(e) =>
                          updateItem(item.id, "meetingDate", e.target.value)
                        }
                        disabled={readonly}
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>เวลาจัดประชุม</span>
                      </label>
                      <ActivityInput
                        type="time"
                        value={item.meetingTime || ""}
                        onChange={(e) =>
                          updateItem(item.id, "meetingTime", e.target.value)
                        }
                        disabled={readonly}
                        className="bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Actual Attendees & Expectations */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <span>จำนวนผู้เข้าร่วมประชุมจริง (คน)</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <ActivityInput
                      type="number"
                      min="0"
                      value={item.actualAttendees ?? ""}
                      onChange={(e) =>
                        updateItem(item.id, "actualAttendees", e.target.value)
                      }
                      placeholder="เช่น 35"
                      disabled={readonly}
                      className="bg-white font-semibold text-purple-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800">
                      จำนวนผู้เข้าร่วมคาดการณ์ (คน)
                    </label>
                    <ActivityInput
                      type="number"
                      min="0"
                      value={item.expectedAttendees ?? ""}
                      onChange={(e) =>
                        updateItem(item.id, "expectedAttendees", e.target.value)
                      }
                      placeholder="เช่น 30"
                      disabled={readonly}
                      className="bg-white"
                    />
                  </div>
                </div>

                {/* 4. Promotions Section */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <ShoppingBag className="w-4 h-4 text-purple-600" />
                      <span>รายการโปรโมชันในงานประชุม</span>
                      {promoItems.length > 0 && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                          {promoItems.length} รายการ
                        </span>
                      )}
                    </div>
                    {!readonly && addPromotion && (
                      <button
                        type="button"
                        onClick={() => addPromotion(item.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>เพิ่มโปรโมชัน</span>
                      </button>
                    )}
                  </div>

                  {promoItems.length > 0 ? (
                    <div className="space-y-2">
                      {promoItems.map((promo, pIdx) => (
                        <div
                          key={promo.id || pIdx}
                          className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200"
                        >
                          <span className="w-6 text-center text-xs text-slate-500 font-semibold">
                            {pIdx + 1}
                          </span>
                          <div className="flex-1">
                            <ActivityInput
                              type="text"
                              value={promo.notes || promo.productName || ""}
                              onChange={(e) =>
                                updatePromotion?.(
                                  item.id,
                                  promo.id || "",
                                  "notes",
                                  e.target.value,
                                )
                              }
                              placeholder="ระบุเงื่อนไขโปรโมชัน เช่น ซื้อ 10 ลัง แถม 1 ลัง..."
                              disabled={readonly}
                              className="h-8 text-xs bg-white"
                            />
                          </div>
                          {!readonly && deletePromotion && (
                            <button
                              type="button"
                              onClick={() =>
                                deletePromotion(item.id, promo.id || "")
                              }
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="ลบโปรโมชัน"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                      ไม่มีรายการโปรโมชัน
                    </div>
                  )}
                </div>

                {/* 5. Product Sales Details */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span>ยอดขายสินค้าที่เกิดขึ้นในการประชุม</span>
                      {salesDetails.length > 0 && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                          {salesDetails.length} รายการ
                        </span>
                      )}
                    </div>
                    {!readonly && (
                      <button
                        type="button"
                        onClick={() => handleAddSaleDetail(item.id, true)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>เพิ่มรายการขาย</span>
                      </button>
                    )}
                  </div>

                  {salesDetails.length > 0 ? (
                    <div className="space-y-2">
                      {salesDetails.map((sale, sIdx) => {
                        const saleKey = sale.id || sale.productId || String(sIdx);
                        return (
                          <div
                            key={saleKey}
                            className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 items-center"
                          >
                            <div className="sm:col-span-5">
                              <ActivityProductSelect
                                value={sale.productName}
                                products={products as ActivityProductItem[]}
                                placeholder="เลือกสินค้า..."
                                onChange={(val, prod) => {
                                  handleUpdateSaleDetail(
                                    item.id,
                                    saleKey,
                                    "productName",
                                    prod?.name || val,
                                  );
                                  if (prod?.id) {
                                    handleUpdateSaleDetail(
                                      item.id,
                                      saleKey,
                                      "productId",
                                      prod.id,
                                    );
                                  }
                                }}
                                disabled={readonly}
                              />
                            </div>
                            <div className="sm:col-span-3">
                              <ActivityInput
                                type="number"
                                min="0"
                                value={sale.actualQty ?? ""}
                                onChange={(e) =>
                                  handleUpdateSaleDetail(
                                    item.id,
                                    saleKey,
                                    "actualQty",
                                    e.target.value,
                                  )
                                }
                                placeholder="จำนวนที่ขายได้ (ลัง)"
                                disabled={readonly}
                                className="h-8 text-xs bg-white text-center font-medium"
                              />
                            </div>
                            <div className="sm:col-span-3">
                              <ActivityInput
                                type="text"
                                value={sale.notes || ""}
                                onChange={(e) =>
                                  handleUpdateSaleDetail(
                                    item.id,
                                    saleKey,
                                    "notes",
                                    e.target.value,
                                  )
                                }
                                placeholder="หมายเหตุ / เงื่อนไข..."
                                disabled={readonly}
                                className="h-8 text-xs bg-white"
                              />
                            </div>
                            {!readonly && (
                              <div className="sm:col-span-1 flex justify-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteSaleDetail(item.id, saleKey)
                                  }
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="ลบรายการขาย"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                      ยังไม่มีรายการบันทึกยอดขายสินค้าในการประชุมนี้
                    </div>
                  )}
                </div>

                {/* 6. Feedback & QnA */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-800">
                    ข้อเสนอแนะ / ประเด็นคำถาม-คำตอบ (Q&A)
                  </label>
                  <ActivityTextarea
                    rows={3}
                    value={item.feedbackQnA || ""}
                    onChange={(e) =>
                      updateItem(item.id, "feedbackQnA", e.target.value)
                    }
                    placeholder="สรุปข้อซักถาม ข้อเสนอแนะ หรือความต้องการเพิ่มเติมจากผู้เข้าประชุม..."
                    disabled={readonly}
                    className="bg-white"
                  />
                </div>

                {/* 7. Registration Photos (Mandatory: min 1) */}
                <ActivityPhotoUpload
                  title="รูปถ่ายใบลงทะเบียนผู้เข้าร่วมงาน"
                  description="แนบรูปถ่ายใบลงทะเบียนผู้เข้าร่วมประชุม (จำเป็นต้องมีอย่างน้อย 1 รูป)"
                  images={item.registrationImages || []}
                  onImagesChange={(imgs) =>
                    updateItem(item.id, "registrationImages", imgs)
                  }
                  maxFiles={5}
                  accentColor="purple"
                  required={true}
                  disabled={readonly}
                  icon={<ClipboardCheck className="w-4 h-4" />}
                />

                {/* 8. Atmosphere Photos (Optional: max 10) */}
                <ActivityPhotoUpload
                  title="ภาพถ่ายบรรยากาศการประชุม"
                  description="อัปโหลดรูปภาพบรรยากาศการจัดประชุม หรือกิจกรรมที่เกิดขึ้น (สูงสุด 10 รูป)"
                  images={item.images || []}
                  onImagesChange={(imgs) =>
                    updateItem(item.id, "images", imgs)
                  }
                  maxFiles={10}
                  accentColor="purple"
                  disabled={readonly}
                  icon={<Users className="w-4 h-4" />}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
