"use client";

import React, { useState, useEffect } from "react";
import { Camera } from "lucide-react";
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
import { getFarmerCustomersAction } from "@/modules/activity-plans/server/actions";
import GalleryUpload from "@/components/custom/gallery-upload";
import type { FileWithPreview } from "@/hooks/use-file-upload";
import {
  convertToFileMetadata,
  filesWithPreviewToImageFiles,
  isImageFilesEqual,
} from "../../utils";

const OTHER_OPTION = "ไม่พบข้อมูล / ระบุเพิ่มเติม";

interface ActualType10FieldDayProps {
  isVisible: boolean;
  target: {
    plot: string;
    location: string;
    showcase: string;
    targetAttendees: string;
    targetSales: string;
  };
  actualAttendees: string;
  setActualAttendees: (v: string) => void;
  actualSalesOrBooking: string;
  setActualSalesOrBooking: (v: string) => void;
  targetFarmersList: string;
  setTargetFarmersList: (v: string) => void;
  farmerFeedback: "สูง" | "กลาง" | "ต่ำ" | "";
  setFarmerFeedback: (v: "สูง" | "กลาง" | "ต่ำ" | "") => void;
  images: ImageFile[];
  setImages: (v: ImageFile[]) => void;
  onUploadImages?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage?: (id: string) => void;
}

export function ActualType10FieldDay({
  isVisible,
  target,
  actualAttendees,
  setActualAttendees,
  actualSalesOrBooking,
  setActualSalesOrBooking,
  targetFarmersList,
  setTargetFarmersList,
  farmerFeedback,
  setFarmerFeedback,
  images = [],
  setImages,
}: ActualType10FieldDayProps) {
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [farmerOptions, setFarmerOptions] = useState<string[]>([]);
  const [loadingFarmers, setLoadingFarmers] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function loadFarmers() {
      try {
        setLoadingFarmers(true);
        const res = await getFarmerCustomersAction();
        if (
          isMounted &&
          res?.success &&
          Array.isArray(res.farmers) &&
          res.farmers.length > 0
        ) {
          setFarmerOptions(res.farmers);
        }
      } catch (err) {
        console.error("Failed to load real farmer options:", err);
      } finally {
        if (isMounted) setLoadingFarmers(false);
      }
    }
    loadFarmers();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (farmerOptions.includes(targetFarmersList)) {
      setSelectedOption(targetFarmersList);
    } else if (targetFarmersList) {
      setSelectedOption(OTHER_OPTION);
    } else if (selectedOption !== OTHER_OPTION) {
      setSelectedOption("");
    }
  }, [targetFarmersList, farmerOptions]);

  if (!isVisible) return null;

  const handleFilesChange = (files: FileWithPreview[]) => {
    const converted = filesWithPreviewToImageFiles(files);
    if (!isImageFilesEqual(images, converted) && setImages) {
      setImages(converted);
    }
  };

  return (
    <div className="border border-orange-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-orange-100 pb-3">
        <div className="flex items-center gap-2.5">
          <h2 className="font-bold text-orange-900 text-base md:text-lg">
            จัดงาน Field Day
          </h2>
        </div>
      </div>

      <ActualTargetCard
        iconColorClass="text-orange-600"
        badgeColorClass="bg-orange-100 text-orange-800"
        gridColsClass="grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
        items={[
          { label: "แปลงสาธิตจัดงาน:", value: target.plot || "-" },
          { label: "สถานที่แปลง:", value: target.location || "-" },
          { label: "เป้าหมายผู้เข้าร่วม:", value: target.targetAttendees || "-" },
          {
            label: "เป้ายอดขาย/จอง:",
            value: target.targetSales || "-",
            highlight: true,
          },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-800">
            จำนวนผู้เข้าร่วมจริง (คน) <span className="text-rose-500">*</span>
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

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-800">
            ยอดขายหรือยอดจองที่เกิดขึ้นจริง (บาท){" "}
            <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <Input
              type="number"
              min="0"
              value={actualSalesOrBooking}
              onChange={(e) => setActualSalesOrBooking(e.target.value)}
              placeholder="0.00"
              className="bg-white border-slate-300 pr-12"
            />
            <span className="absolute right-3 text-xs font-semibold text-slate-500">
              บาท
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-800">
          รายชื่อเกษตรกรเป้าหมายที่สนใจ <span className="text-rose-500">*</span>
        </label>
        <Select
          value={selectedOption}
          onValueChange={(val) => {
            setSelectedOption(val);
            if (val === OTHER_OPTION) {
              if (farmerOptions.includes(targetFarmersList)) {
                setTargetFarmersList("");
              }
            } else {
              setTargetFarmersList(val);
            }
          }}
        >
          <SelectTrigger className="bg-white border-slate-300">
            <SelectValue
              placeholder={
                loadingFarmers
                  ? "กำลังโหลดรายชื่อเกษตรกร..."
                  : "เลือกรายชื่อเกษตรกรเป้าหมาย"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {farmerOptions.map((farmer) => (
              <SelectItem key={farmer} value={farmer}>
                {farmer}
              </SelectItem>
            ))}
            <SelectItem
              value={OTHER_OPTION}
              className="font-semibold text-amber-700"
            >
              ➕ {OTHER_OPTION}
            </SelectItem>
          </SelectContent>
        </Select>

        {selectedOption === OTHER_OPTION && (
          <div className="pt-2">
            <Textarea
              rows={2}
              value={targetFarmersList}
              onChange={(e) => setTargetFarmersList(e.target.value)}
              placeholder="พิมพ์รายชื่อกลุ่มเกษตรกรเป้าหมาย เช่น นายสมชาย, นายสมหมาย..."
              className="bg-white border-slate-300 text-xs"
            />
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-800">
          ผลตอบรับของเกษตรกร (ภาพรวม) <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3 max-w-sm">
          {(["สูง", "กลาง", "ต่ำ"] as const).map((fb) => (
            <button
              key={fb}
              type="button"
              onClick={() => setFarmerFeedback(fb)}
              className={cn(
                "py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all",
                farmerFeedback === fb
                  ? fb === "สูง"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20"
                    : fb === "กลาง"
                      ? "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20"
                      : "bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
              )}
            >
              {fb === "สูง" ? "🌟 สูงมาก" : fb === "กลาง" ? "👍 ปานกลาง" : "⚠️ ต่ำ"}
            </button>
          ))}
        </div>
      </div>

      {/* GalleryUpload Standard */}
      <div className="bg-orange-50/20 border border-orange-200/70 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 border-b border-orange-100 pb-2.5">
          <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center border border-orange-200">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-orange-950">
              รูปภาพบรรยากาศงาน Field Day
            </h4>
            <p className="text-[11px] text-orange-700/80">
              อัปโหลดรูปภาพบรรยากาศการจัดงานแปลงสาธิตและเกษตรกรเข้าร่วม (สูงสุด 10 รูป)
            </p>
          </div>
        </div>
        <GalleryUpload
          maxFiles={10}
          maxSize={20 * 1024 * 1024}
          accept="image/*"
          multiple={true}
          initialFiles={convertToFileMetadata(images || [])}
          onFilesChange={handleFilesChange}
        />
      </div>
    </div>
  );
}
