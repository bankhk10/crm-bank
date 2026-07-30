"use client";

import React from "react";
import { Camera, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ActualTargetCard } from "../actual-target-card";
import { ImageFile } from "../../types";

interface ActualType7DemoProps {
  isVisible: boolean;
  target: {
    owner: string;
    product: string;
    crop: string;
    plots: string;
    targetCondition: string;
  };
  plotName: string;
  setPlotName: (v: string) => void;
  usageMethod: string;
  setUsageMethod: (v: string) => void;
  cropAgeValue: string;
  setCropAgeValue: (v: string) => void;
  cropAgeUnit: string;
  setCropAgeUnit: (v: string) => void;
  growthStage: string;
  setGrowthStage: (v: string) => void;
  cropCondition: "สมบูรณ์" | "ปานกลาง" | "ทรุดโทรม" | "";
  setCropCondition: (v: "สมบูรณ์" | "ปานกลาง" | "ทรุดโทรม" | "") => void;
  productResponse: "พืชตอบสนองดี" | "ยังไม่เห็นผลชัดเจน" | "พบปัญหา" | "";
  setProductResponse: (
    v: "พืชตอบสนองดี" | "ยังไม่เห็นผลชัดเจน" | "พบปัญหา" | "",
  ) => void;
  problemDescription: string;
  setProblemDescription: (v: string) => void;
  plotImages: ImageFile[];
  onUploadImages: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (id: string) => void;
}

export function ActualType7Demo({
  isVisible,
  target,
  plotName,
  setPlotName,
  usageMethod,
  setUsageMethod,
  cropAgeValue,
  setCropAgeValue,
  cropAgeUnit,
  setCropAgeUnit,
  growthStage,
  setGrowthStage,
  cropCondition,
  setCropCondition,
  productResponse,
  setProductResponse,
  problemDescription,
  setProblemDescription,
  plotImages,
  onUploadImages,
  onRemoveImage,
}: ActualType7DemoProps) {
  if (!isVisible) return null;

  return (
    <div className="border-2 border-emerald-500 rounded-2xl p-4 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-sm shadow-2xs">
            7
          </span>
          <h2 className="font-bold text-emerald-800 text-base md:text-lg">
            ติดตามแปลงสาธิต / พืชเป้าหมาย
          </h2>
        </div>
      </div>

      <ActualTargetCard
        iconColorClass="text-emerald-600"
        badgeColorClass="bg-emerald-100 text-emerald-800"
        gridColsClass="grid-cols-1 sm:grid-cols-2 md:grid-cols-2"
        items={[
          { label: "เจ้าของแปลง:", value: target.owner },
          { label: "สินค้าที่สาธิต:", value: target.product },
          { label: "พืชเป้าหมาย:", value: target.crop },
          { label: "จำนวน:", value: target.plots },
        ]}
      />

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-800">
          วิธีการใช้ / อัตราการใช้ <span className="text-rose-500">*</span>
        </label>
        <Textarea
          rows={2}
          value={usageMethod}
          onChange={(e) => setUsageMethod(e.target.value)}
          placeholder="เช่น ฉีดพ่นทางใบ 50cc/น้ำ 20L"
          className="bg-white border-slate-300"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-800">
            อายุพืช <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              value={cropAgeValue}
              onChange={(e) => setCropAgeValue(e.target.value)}
              placeholder="ระบุจำนวน"
              className="bg-white border-slate-300"
            />
            <Select value={cropAgeUnit} onValueChange={setCropAgeUnit}>
              <SelectTrigger className="w-28 bg-white border-slate-300">
                <SelectValue placeholder="หน่วย" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="วัน">วัน</SelectItem>
                <SelectItem value="สัปดาห์">สัปดาห์</SelectItem>
                <SelectItem value="เดือน">เดือน</SelectItem>
                <SelectItem value="ปี">ปี</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-800">
            ระยะการเจริญเติบโต <span className="text-rose-500">*</span>
          </label>
          <Select value={growthStage} onValueChange={setGrowthStage}>
            <SelectTrigger className="w-full bg-white border-slate-300">
              <SelectValue placeholder="เลือกระยะการเจริญเติบโต" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ระยะกล้า/ตั้งตัว">ระยะกล้า/ตั้งตัว</SelectItem>
              <SelectItem value="ระยะเจริญเติบโตทางลำต้น/ใบ">
                ระยะเจริญเติบโตทางลำต้น/ใบ
              </SelectItem>
              <SelectItem value="ระยะออกดอก/ติดผล">ระยะออกดอก/ติดผล</SelectItem>
              <SelectItem value="ระยะเก็บเกี่ยว/พักต้น">
                ระยะเก็บเกี่ยว/พักต้น
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-800">
          สภาพพืช <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(["สมบูรณ์", "ไม่เปลี่ยนแปลง", "มีปัญหา"] as const).map((cond) => (
            <button
              key={cond}
              type="button"
              onClick={() => setCropCondition(cond)}
              className={cn(
                "py-2.5 px-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1",
                cropCondition === cond
                  ? cond === "สมบูรณ์"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20"
                    : cond === "ไม่เปลี่ยนแปลง"
                      ? "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20"
                      : "bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
              )}
            >
              <span>
                {cond === "สมบูรณ์"
                  ? "🌿"
                  : cond === "ไม่เปลี่ยนแปลง"
                    ? "🟡"
                    : "🔴"}
              </span>
              <span>{cond}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-800">
          ผลการใช้ผลิตภัณฑ์ <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(["พืชตอบสนองดี", "ยังไม่เห็นผลชัดเจน", "พบปัญหา"] as const).map(
            (res) => (
              <button
                key={res}
                type="button"
                onClick={() => setProductResponse(res)}
                className={cn(
                  "py-2.5 px-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1",
                  productResponse === res
                    ? res === "พืชตอบสนองดี"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20"
                      : res === "ยังไม่เห็นผลชัดเจน"
                        ? "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20"
                        : "bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
                )}
              >
                <span>
                  {res === "พืชตอบสนองดี"
                    ? "🟢"
                    : res === "ยังไม่เห็นผลชัดเจน"
                      ? "🕒"
                      : "⚠️"}
                </span>
                <span>{res}</span>
              </button>
            ),
          )}
        </div>
      </div>

      {productResponse === "พบปัญหา" && (
        <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3.5 space-y-1.5">
          <label className="text-xs font-bold text-rose-800">
            ระบุปัญหาที่พบ <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Textarea
              rows={2}
              maxLength={500}
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder="เช่น ใบไหม้, แมลงลง, รากเน่า ฯลฯ"
              className="bg-white border-rose-200 pb-6 text-slate-800"
            />
            <span className="absolute bottom-2 right-3 text-[10px] text-slate-400 font-mono">
              {problemDescription.length}/500
            </span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-800">
          รูปภาพสภาพแปลงล่าสุด <span className="text-rose-500">*</span>
        </label>
        <div className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/20 hover:bg-emerald-50/40 rounded-2xl p-5 text-center transition-colors cursor-pointer relative group">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={onUploadImages}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-emerald-800">
              คลิกเพื่ออัปโหลด รูปถ่ายสภาพแปลงล่าสุด
            </p>
          </div>
        </div>
        {plotImages.length > 0 && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
            {plotImages.map((img) => (
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
