"use client";

import React, { useState, useEffect } from "react";
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
import { getFarmerCustomersAction } from "@/modules/activity-plans/server/actions";

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
  onUploadImages: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (id: string) => void;
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
  images,
  onUploadImages,
  onRemoveImage,
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
          <SelectTrigger className="w-full bg-white border-slate-300">
            <SelectValue
              placeholder={
                loadingFarmers
                  ? "กำลังโหลดรายชื่อเกษตรกร..."
                  : "เลือกรายชื่อเกษตรกรเป้าหมายที่สนใจ"
              }
            />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {farmerOptions.map((farmer) => (
              <SelectItem key={farmer} value={farmer}>
                {farmer}
              </SelectItem>
            ))}
            <SelectItem value={OTHER_OPTION}>{OTHER_OPTION}</SelectItem>
          </SelectContent>
        </Select>

        {selectedOption === OTHER_OPTION && (
          <div className="space-y-1.5 pt-1 animate-in fade-in-50 duration-200">
            <label className="text-xs font-semibold text-slate-700">
              ระบุรายชื่อเกษตรกรเพิ่มเติม{" "}
              <span className="text-rose-500">*</span>
            </label>
            <Textarea
              rows={2}
              value={targetFarmersList}
              onChange={(e) => setTargetFarmersList(e.target.value)}
              placeholder="ระบุรายชื่อเกษตรกร เช่น นายประเสริฐ (100 ไร่), นายวิชัย (50 ไร่)"
              className="bg-white border-slate-300"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-800">
          รูปภาพบรรยากาศการจัดงานจัดเต็ม{" "}
          <span className="text-rose-500">*</span>
        </label>
        <div className="border-2 border-dashed border-orange-200 hover:border-orange-400 bg-orange-50/20 hover:bg-orange-50/40 rounded-2xl p-5 text-center transition-colors cursor-pointer relative group">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={onUploadImages}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-orange-900">
              คลิกเพื่ออัปโหลด รูปบรรยากาศงาน Field Day
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
