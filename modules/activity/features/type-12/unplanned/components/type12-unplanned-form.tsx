"use client";

import React from "react";
import { Plane, Building2, Globe2, Camera } from "lucide-react";
import {
  ActivityCustomerSelect,
  ActivityInput,
  ActivityTextarea,
  ActivityPhotoUpload,
} from "@/modules/activity/ui";
import { cn } from "@/lib/utils";
import type { Type12UnplannedFormProps } from "../types/unplanned.types";

export function Type12UnplannedForm({
  item,
  onChange,
  customers = [],
  readonly = false,
  className = "",
}: Type12UnplannedFormProps) {
  const isStore = item.tourType === "STORE";

  const handleTourTypeChange = (newType: "CENTRAL" | "STORE") => {
    onChange({
      ...item,
      tourType: newType,
      tourSize: newType === "CENTRAL" ? item.tourSize || "SMALL" : null,
      country: newType === "CENTRAL" ? item.country : null,
      storeId: newType === "STORE" ? item.storeId : null,
      storeName: newType === "STORE" ? item.storeName : null,
      destination: newType === "STORE" ? item.destination : null,
    });
  };

  return (
    <div
      className={`bg-white border border-sky-200/80 rounded-2xl p-4 sm:p-5 space-y-5 shadow-xs ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-sky-100 pb-3">
        <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100">
          <Plane className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-bold text-slate-900 text-sm sm:text-base">
            พาลูกค้าศึกษาดูงาน (Tour) — บันทึกนอกแผน
          </h4>
          <p className="text-xs text-slate-500">
            ระบุรายละเอียดทัวร์ ผลการเดินทาง และรูปภาพกิจกรรมในขั้นตอนเดียว
          </p>
        </div>
      </div>

      {/* 1. ประเภททัวร์ */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-700">
          ประเภททัวร์ <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <button
            type="button"
            disabled={readonly}
            onClick={() => handleTourTypeChange("CENTRAL")}
            className={cn(
              "py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2",
              !isStore
                ? "bg-sky-50 border-sky-500 text-sky-800 ring-2 ring-sky-500/20 shadow-2xs"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
              readonly && "opacity-75 cursor-not-allowed",
            )}
          >
            <Globe2 className="h-3.5 w-3.5" />
            <span>ทัวร์กลาง</span>
          </button>
          <button
            type="button"
            disabled={readonly}
            onClick={() => handleTourTypeChange("STORE")}
            className={cn(
              "py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2",
              isStore
                ? "bg-sky-50 border-sky-500 text-sky-800 ring-2 ring-sky-500/20 shadow-2xs"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
              readonly && "opacity-75 cursor-not-allowed",
            )}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>ทัวร์ร้านค้า</span>
          </button>
        </div>
      </div>

      {/* Conditional: ทัวร์กลาง */}
      {!isStore && (
        <div className="space-y-4 pt-2 border-t border-slate-100 animate-in fade-in-50 duration-200">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              ขนาดทัวร์ <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              {(["SMALL", "LARGE"] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  disabled={readonly}
                  onClick={() => onChange({ ...item, tourSize: sz })}
                  className={cn(
                    "py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                    item.tourSize === sz
                      ? "bg-sky-50 border-sky-500 text-sky-800 ring-2 ring-sky-500/20 shadow-2xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                    readonly && "opacity-75 cursor-not-allowed",
                  )}
                >
                  <span>{sz === "LARGE" ? "ทัวร์ใหญ่" : "ทัวร์เล็ก"}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 max-w-md">
            <label className="block text-xs font-semibold text-slate-700">
              ประเทศปลายทาง <span className="text-rose-500">*</span>
            </label>
            <ActivityInput
              required
              disabled={readonly}
              value={item.country || ""}
              onChange={(e) => onChange({ ...item, country: e.target.value })}
              placeholder="เช่น ญี่ปุ่น, เวียดนาม, จีน"
            />
          </div>
        </div>
      )}

      {/* Conditional: ทัวร์ร้านค้า */}
      {isStore && (
        <div className="space-y-4 pt-2 border-t border-slate-100 animate-in fade-in-50 duration-200">
          <ActivityCustomerSelect
            id="type12-unplanned-store-combobox"
            type="STORE"
            label="ร้านค้าเป้าหมาย"
            required
            disabled={readonly}
            value={item.storeId || item.storeName || ""}
            valueKey={item.storeId ? "id" : "name"}
            onChange={(val, cust) => {
              onChange({
                ...item,
                storeId: cust?.id || (val !== cust?.name ? val : null),
                storeName: cust?.name || val,
              });
            }}
            customers={customers as any}
            placeholder="เลือกร้านค้า..."
            searchPlaceholder="ค้นหาร้านค้า / รหัสลูกค้า..."
            emptyText="ไม่พบร้านค้า"
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              สถานที่หรือประเทศที่จะไป <span className="text-rose-500">*</span>
            </label>
            <ActivityInput
              required
              disabled={readonly}
              value={item.destination || ""}
              onChange={(e) => onChange({ ...item, destination: e.target.value })}
              placeholder="ระบุสถานที่หรือประเทศที่จะไป เช่น ประเทศจีน หรือ ศูนย์วิจัย"
            />
          </div>
        </div>
      )}

      {/* 2. Execution Results */}
      <div className="space-y-4 pt-3 border-t border-slate-200/60">
        <h5 className="font-bold text-xs text-slate-800">
          ผลการศึกษาดูงานและการเดินทาง
        </h5>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              จำนวนผู้ร่วมเดินทางจริง (คน)
            </label>
            <ActivityInput
              type="number"
              min={0}
              disabled={readonly}
              value={item.actualAttendees !== undefined ? String(item.actualAttendees) : ""}
              onChange={(e) =>
                onChange({
                  ...item,
                  actualAttendees: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="เช่น 12"
            />
          </div>
        </div>

        <ActivityTextarea
          label="สรุปไฮไลท์ / ประโยชน์ที่ได้รับจากการศึกษาดูงาน"
          disabled={readonly}
          value={item.tourHighlights || ""}
          onChange={(e) => onChange({ ...item, tourHighlights: e.target.value })}
          placeholder="ระบุสถานที่สำคัญที่เข้าชม ความรู้ นวัตกรรม หรือข้อตกลงทางธุรกิจ..."
          rows={3}
        />

        <ActivityTextarea
          label="ข้อคิดเห็นจากลูกค้า / ปัญหาและอุปสรรคระหว่างเดินทาง"
          disabled={readonly}
          value={item.feedbackIssues || ""}
          onChange={(e) => onChange({ ...item, feedbackIssues: e.target.value })}
          placeholder="เช่น สภาพอากาศ ความพึงพอใจของลูกค้า หรือข้อเสนอแนะสำหรับการจัดทัวร์ครั้งต่อไป..."
          rows={3}
        />

        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-sky-600" />
            รูปภาพกิจกรรมการศึกษาดูงาน / บรรยากาศทัวร์
          </label>
          <ActivityPhotoUpload
            images={(item.images || []) as any}
            onImagesChange={(imgs) => onChange({ ...item, images: imgs as any })}
            maxFiles={10}
            readonly={readonly}
          />
        </div>
      </div>
    </div>
  );
}
