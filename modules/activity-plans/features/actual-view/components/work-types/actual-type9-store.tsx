"use client";

import React from "react";
import { Store, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ActualTargetCard } from "../actual-target-card";
import { ImageFile } from "../../types";

interface ActualType9StoreProps {
  isVisible: boolean;
  target: {
    store: string;
    product: string;
    targetSales: string;
    targetAttendees: string;
  };
  formats: string[];
  setFormats: (v: string[]) => void;
  actualSales: string;
  setActualSales: (v: string) => void;
  actualAttendees: string;
  setActualAttendees: (v: string) => void;
  images: ImageFile[];
  onUploadImages: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (id: string) => void;
}

export function ActualType9Store({
  isVisible,
  target,
  formats,
  setFormats,
  actualSales,
  setActualSales,
  actualAttendees,
  setActualAttendees,
  images,
  onUploadImages,
  onRemoveImage,
}: ActualType9StoreProps) {
  if (!isVisible) return null;

  const toggleFormat = (fmt: string) => {
    if (formats.includes(fmt)) {
      setFormats(formats.filter((f) => f !== fmt));
    } else {
      setFormats([...formats, fmt]);
    }
  };

  return (
    <div className="border-2 border-blue-600 rounded-2xl p-4 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-blue-100 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-sm shadow-2xs">
            9
          </span>
          <h2 className="font-bold text-blue-900 text-base md:text-lg">
            จัดกิจกรรมส่งเสริมการขายหน้าร้าน
          </h2>
        </div>
      </div>

      <ActualTargetCard
        iconColorClass="text-blue-600"
        badgeColorClass="bg-blue-100 text-blue-800"
        gridColsClass="grid-cols-1 sm:grid-cols-3"
        items={[
          { label: "ร้านค้าจัดกิจกรรม:", value: target.store },
          {
            label: "เป้ายอดขายหน้าร้าน:",
            value: target.targetSales,
            highlight: true,
          },
          { label: "เป้าหมายผู้เข้าร่วม:", value: target.targetAttendees },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-800">
            ยอดขายที่เกิดขึ้นจริง (บาท) <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <Input
              type="number"
              min="0"
              value={actualSales}
              onChange={(e) => setActualSales(e.target.value)}
              placeholder="0.00"
              className="bg-white border-slate-300 pr-12"
            />
            <span className="absolute right-3 text-xs font-semibold text-slate-500">
              บาท
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-800">
            จำนวนลูกค้าที่เข้าร่วมจริง (คน){" "}
            <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <Input
              type="number"
              min="0"
              value={actualAttendees}
              onChange={(e) => setActualAttendees(e.target.value)}
              placeholder="ระบุจำนวน"
              className="bg-white border-slate-300 pr-12"
            />
            <span className="absolute right-3 text-xs font-semibold text-slate-500">
              คน
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-800">
          รูปภาพบรรยากาศ <span className="text-rose-500">*</span>
        </label>
        <div className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/20 hover:bg-blue-50/40 rounded-2xl p-5 text-center transition-colors cursor-pointer relative group">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={onUploadImages}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-blue-900">
              คลิกเพื่ออัปโหลด รูปภาพบรรยากาศหน้าร้าน
            </p>
          </div>
        </div>
        {images.length > 0 && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
            {images.map((img) => (
              <div
                key={img.id}
                className="relative aspect-square rounded-lg overflow-hidden border border-slate-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.name}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => onRemoveImage(img.id)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
