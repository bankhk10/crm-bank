"use client";

import React from "react";
import { HelpCircle, Plus, Trash2, Store, Globe, Barcode, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ActivityCustomerSelect,
  ActivityProductSelect,
  ActivityCombobox,
  ActivityInput,
  ActivityTextarea,
  ActivityPhotoUpload,
} from "@/modules/activity/ui";
import { cn } from "@/lib/utils";
import { ISSUE_TYPE_OPTIONS } from "../../shared/constants";
import type { Type6UnplannedFormProps } from "../types/unplanned.types";

const PURCHASE_CHANNELS = [
  { id: "ร้านค้าตัวแทนจำหน่าย", label: "ร้านค้าตัวแทนจำหน่าย", icon: Store },
  { id: "ช่องทางออนไลน์", label: "ช่องทางออนไลน์", icon: Globe },
] as const;

export function Type6UnplannedForm({
  readonly = false,
  items,
  customers = [],
  products = [],
  addItem,
  updateItem,
  deleteItem,
}: Type6UnplannedFormProps) {
  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <HelpCircle className="h-4 w-4 text-rose-600" />
          <span>ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา (นอกแผน)</span>
        </div>

        {!readonly && addItem && (
          <Button
            type="button"
            size="sm"
            onClick={addItem}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            เพิ่มรายการร้องเรียน
          </Button>
        )}
      </div>

      {/* Items List */}
      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-4"
          >
            {/* Header of Item */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                รายการที่ {index + 1}
              </span>

              {!readonly && deleteItem && items.length > 1 && (
                <button
                  type="button"
                  onClick={() => deleteItem(item.id)}
                  className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>ลบรายการ</span>
                </button>
              )}
            </div>

            {/* Customer Type Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`toggle-manual-${item.id}`}
                checked={Boolean(item.isManualCustomer)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  updateItem(item.id, "isManualCustomer", checked);
                  if (checked) {
                    updateItem(item.id, "storeId", null);
                    updateItem(item.id, "customerName", "");
                  } else {
                    updateItem(item.id, "manualCustomerName", "");
                  }
                }}
                disabled={readonly}
                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-3.5 h-3.5 cursor-pointer"
              />
              <label
                htmlFor={`toggle-manual-${item.id}`}
                className="text-xs font-medium text-slate-700 cursor-pointer select-none"
              >
                เกษตรกร / ร้านค้าทั่วไป (ไม่มีในฐานข้อมูล Customer Master)
              </label>
            </div>

            {/* Customer Selection / Manual Input */}
            {item.isManualCustomer ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-amber-50/40 p-3 rounded-lg border border-amber-200/60">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อลูกค้า / เกษตรกร <span className="text-rose-500">*</span>
                  </label>
                  <ActivityInput
                    value={item.manualCustomerName || ""}
                    onChange={(e) => updateItem(item.id, "manualCustomerName", e.target.value)}
                    disabled={readonly}
                    placeholder="เช่น คุณสมชาย หมายมั่น"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ที่อยู่ / สถานที่
                  </label>
                  <ActivityInput
                    value={item.manualCustomerAddress || ""}
                    onChange={(e) => updateItem(item.id, "manualCustomerAddress", e.target.value)}
                    disabled={readonly}
                    placeholder="เช่น ม.3 ต.หนองบัว อ.เมือง"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                  <ActivityInput
                    value={item.manualCustomerPhone || ""}
                    onChange={(e) => updateItem(item.id, "manualCustomerPhone", e.target.value)}
                    disabled={readonly}
                    placeholder="เช่น 081-234-5678"
                  />
                </div>
              </div>
            ) : (
              <ActivityCustomerSelect
                id={`customer-combobox-${item.id}`}
                label="ร้านค้า / Key Farmer"
                labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-rose-500"
                value={item.storeId || item.customerName || ""}
                onChange={(val, cust) => {
                  updateItem(item.id, "customerName", cust?.name || val);
                  if (cust?.id) {
                    updateItem(item.id, "storeId", cust.id);
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

            {/* Purchase Channel */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                ช่องทางการซื้อสินค้า <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                {PURCHASE_CHANNELS.map((ch) => {
                  const Icon = ch.icon;
                  const isSelected = (item.purchaseChannel || "ร้านค้าตัวแทนจำหน่าย") === ch.id;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => updateItem(item.id, "purchaseChannel", ch.id)}
                      disabled={readonly}
                      className={cn(
                        "py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-2",
                        isSelected
                          ? "bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20 shadow-xs"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                        readonly && "cursor-not-allowed opacity-75",
                      )}
                    >
                      <Icon className={cn("w-3.5 h-3.5", isSelected ? "text-rose-600" : "text-slate-400")} />
                      <span>{ch.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Product selection & Lot Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ActivityProductSelect
                id={`product-combobox-${item.id}`}
                label="ชื่อสินค้า"
                labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-rose-500"
                value={item.productId || ""}
                valueKey="id"
                products={products as any}
                onChange={(val, prod) => {
                  updateItem(item.id, "productId", val || null);
                  updateItem(item.id, "productName", prod?.name || "");
                }}
                placeholder="เลือกสินค้าจาก Product Master..."
                searchPlaceholder="พิมพ์ชื่อหรือรหัสสินค้า..."
                emptyText="ไม่พบสินค้า"
                subLabelType="code"
                disabled={readonly}
                required
              />

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Barcode className="w-3.5 h-3.5 text-rose-600" />
                  เลข Lot <span className="text-rose-500">*</span>
                </label>
                <ActivityInput
                  value={item.lotNumber || ""}
                  onChange={(e) => updateItem(item.id, "lotNumber", e.target.value)}
                  disabled={readonly}
                  placeholder="ระบุเลข Lot บนบรรจุภัณฑ์ (เช่น L680123)..."
                  className="bg-white border-slate-200 focus-visible:ring-rose-500 focus-visible:border-rose-500"
                  required
                />
              </div>
            </div>

            {/* Issue Type & Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ActivityCombobox
                id={`issue-type-${item.id}`}
                label="ประเภทปัญหา"
                labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-rose-500"
                options={ISSUE_TYPE_OPTIONS}
                value={item.issueType}
                onChange={(val) => updateItem(item.id, "issueType", val)}
                placeholder="เลือกประเภทปัญหา..."
                searchPlaceholder="ค้นหาประเภทปัญหา..."
                disabled={readonly}
                required
              />

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-rose-600" />
                  รายละเอียดปัญหา {item.issueType === "อื่นๆ ระบุ" && <span className="text-rose-500">*</span>}
                </label>
                <ActivityTextarea
                  rows={2}
                  value={item.detail || ""}
                  onChange={(e) => updateItem(item.id, "detail", e.target.value)}
                  disabled={readonly}
                  placeholder="ระบุรายละเอียดของปัญหาหรือข้อร้องเรียนอย่างชัดเจน..."
                  className="bg-white border-slate-200 text-xs focus-visible:ring-rose-500 focus-visible:border-rose-500"
                  required={item.issueType === "อื่นๆ ระบุ"}
                />
              </div>
            </div>

            {/* Resolution Status */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-slate-700">
                สถานะการดำเนินการ <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-xs">
                {(["เสร็จสิ้น", "รอติดตาม"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => updateItem(item.id, "status", st)}
                    disabled={readonly}
                    className={cn(
                      "py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all",
                      item.status === st
                        ? st === "เสร็จสิ้น"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20 shadow-xs"
                          : "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20 shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                      readonly && "cursor-not-allowed opacity-75",
                    )}
                  >
                    {st === "เสร็จสิ้น" ? "✓ ดำเนินการเสร็จสิ้น" : "⏳ รอติดตามผล"}
                  </button>
                ))}
              </div>
            </div>

            {/* Evidence Photos */}
            <div className="pt-1">
              <ActivityPhotoUpload
                key={`unplanned-issue-${item.id}`}
                title="รูปถ่ายหลักฐานปัญหา / ข้อร้องเรียน"
                description="ภาพถ่ายสินค้า, บรรจุภัณฑ์, เลข Lot หรือความเสียหายที่พบ"
                images={item.images || []}
                onImagesChange={(imgs) => updateItem(item.id, "images", imgs)}
                maxFiles={5}
                accentColor="rose"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
