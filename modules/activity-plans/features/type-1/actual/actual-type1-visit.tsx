"use client";

import React, { useMemo, useState } from "react";
import { X, UserCheck, Store, MapPin, Camera, Navigation, Phone, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormCombobox } from "@/components/custom/form-components";
import { cn } from "@/lib/utils";
import { DEMO_PRODUCTS } from "@/modules/activity-plans/constants";
import DatePicker from "@/components/custom/DatePicker";
import GalleryUpload from "@/components/custom/gallery-upload";
import type { FileWithPreview } from "@/hooks/use-file-upload";
import type { ImageFile, ActualTargetsState } from "@/modules/activity-plans/features/shared/actual-view/types";
import {
  convertToFileMetadata,
  filesWithPreviewToImageFiles,
  isImageFilesEqual,
} from "@/modules/activity-plans/features/shared/actual-view/utils";

export interface ProductOption {
  id: string;
  name: string;
  productCode?: string | null;
}

interface ActualType1VisitProps {
  isVisible: boolean;
  target: ActualTargetsState["t1"];
  productAdvice: string;
  setProductAdvice: (v: string) => void;
  detail?: string;
  setDetail?: (v: string) => void;
  discussionResult: string;
  setDiscussionResult: (v: string) => void;
  salesOpportunity: "สูง" | "ต่ำ" | "";
  setSalesOpportunity: (v: "สูง" | "ต่ำ" | "") => void;
  nextAction: string;
  setNextAction: (v: string) => void;
  nextMeetingDate: string;
  setNextMeetingDate: (v: string) => void;
  products?: ProductOption[];

  // Actual TYPE_1 fields
  farmerHomeAddress?: string;
  setFarmerHomeAddress?: (v: string) => void;
  plotLatitude?: string;
  setPlotLatitude?: (v: string) => void;
  plotLongitude?: string;
  setPlotLongitude?: (v: string) => void;
  plotImages?: ImageFile[];
  setPlotImages?: (v: ImageFile[]) => void;
}

export function ActualType1Visit({
  isVisible,
  target,
  productAdvice,
  setProductAdvice,
  discussionResult,
  setDiscussionResult,
  salesOpportunity,
  setSalesOpportunity,
  nextAction,
  setNextAction,
  nextMeetingDate,
  setNextMeetingDate,
  products = [],
  farmerHomeAddress = "",
  setFarmerHomeAddress,
  plotLatitude = "",
  setPlotLatitude,
  plotLongitude = "",
  setPlotLongitude,
  plotImages = [],
  setPlotImages,
}: ActualType1VisitProps) {
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const isAdviceTopic = target?.topic?.trim() === "ให้คำแนะนำการใช้สินค้า";

  const selectedProducts = useMemo(
    () =>
      productAdvice
        ? productAdvice
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    [productAdvice],
  );

  const comboboxOptions = useMemo(() => {
    const list =
      products && products.length > 0
        ? products.map((p) => ({
            value: p.name,
            label: p.name,
            subLabel: p.productCode || undefined,
          }))
        : DEMO_PRODUCTS.map((name) => ({
            value: name,
            label: name,
            subLabel: undefined,
          }));

    const existingNames = new Set(list.map((o) => o.value));
    selectedProducts.forEach((prod) => {
      if (!existingNames.has(prod)) {
        list.push({
          value: prod,
          label: prod,
          subLabel: undefined,
        });
        existingNames.add(prod);
      }
    });

    return list;
  }, [products, selectedProducts]);

  if (!isVisible) return null;

  const handleAddProduct = (prod: string) => {
    if (!prod || selectedProducts.includes(prod)) return;
    const updated = [...selectedProducts, prod];
    setProductAdvice(updated.join(", "));
  };

  const handleRemoveProduct = (prod: string) => {
    const updated = selectedProducts.filter((p) => p !== prod);
    setProductAdvice(updated.join(", "));
  };

  const handleFilesChange = (files: FileWithPreview[]) => {
    const converted = filesWithPreviewToImageFiles(files);
    if (!isImageFilesEqual(plotImages, converted) && setPlotImages) {
      setPlotImages(converted);
    }
  };

  const handleGetCurrentLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGeoError("เบราว์เซอร์ไม่รองรับการค้นหาตำแหน่งพิกัด");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        const lat = pos.coords.latitude.toFixed(7);
        const lng = pos.coords.longitude.toFixed(7);
        if (setPlotLatitude) setPlotLatitude(lat);
        if (setPlotLongitude) setPlotLongitude(lng);
      },
      (err) => {
        setGeoLoading(false);
        setGeoError(
          err.code === 1
            ? "การเข้าถึงพิกัดถูกปฏิเสธ (กรุณาอนุญาตตำแหน่งที่ตั้งหรือกรอกด้วยตนเอง)"
            : "ไม่สามารถดึงตำแหน่งปัจจุบันได้ กรุณากรอกด้วยตนเอง",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const isStore = target?.visitPurpose === "STORE";
  const isUnregistered = Boolean(target?.isUnregisteredFarmer);
  const farmerDisplayName = isUnregistered
    ? target?.unregisteredFarmerName || target?.customer || "-"
    : target?.customer || "-";

  return (
    <div className="border border-emerald-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-emerald-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
            {isStore ? <Store className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          </div>
          <div>
            <h2 className="font-bold text-emerald-900 text-base md:text-lg">
              เข้าพบร้านค้า / Key Farmer
            </h2>
            <p className="text-xs text-slate-500">
              รายละเอียดแผนงานและบันทึกผลการเข้าพบจริง
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="text-xs font-bold bg-emerald-50 text-emerald-800 border-emerald-200"
        >
          TYPE_1
        </Badge>
      </div>

      {/* PLAN DETAILS SECTION */}
      <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            ข้อมูลตามแผนงาน (PLAN)
          </span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
            {isStore ? "1 Plan : 1 Store" : "1 Plan : 1 Farmer"}
          </span>
        </div>

        {isStore ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {/* วัตถุประสงค์ของประเภทงาน */}
              <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                <span className="text-slate-400 font-medium block">วัตถุประสงค์ของประเภทงาน</span>
                <span className="font-bold text-slate-800 text-sm block">
                  เข้าพบร้านค้า
                </span>
              </div>

              {/* ร้านค้า */}
              <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                <span className="text-slate-400 font-medium block">ร้านค้า (Customer Master)</span>
                <span className="font-bold text-slate-800 text-sm block truncate" title={target?.customer || "-"}>
                  {target?.customer || "-"}
                </span>
              </div>

              {/* ประเภทลูกค้า */}
              <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                <span className="text-slate-400 font-medium block">ประเภทลูกค้า</span>
                <div>
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-xs"
                  >
                    {target?.customerType === "DEALER"
                      ? "ตัวแทนจำหน่าย"
                      : target?.customerType === "SUBDEALER"
                        ? "ร้านค้าย่อย"
                        : (target?.customerType || "ร้านค้า")}
                  </Badge>
                </div>
              </div>

              {/* วัตถุประสงค์ (ประเด็นหลัก) */}
              <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                <span className="text-slate-400 font-medium block">วัตถุประสงค์ (ประเด็นหลัก)</span>
                <span className="font-bold text-slate-800 text-sm block">
                  {target?.topic || "-"}
                </span>
              </div>
            </div>

            {/* รายละเอียดเพิ่มเติม */}
            <div className="text-xs">
              <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                <span className="text-slate-400 font-medium block">รายละเอียดเพิ่มเติม</span>
                <p className="font-normal text-slate-700 whitespace-pre-wrap">
                  {target?.detail || "-"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              {/* วัตถุประสงค์ของประเภทงาน */}
              <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                <span className="text-slate-400 font-medium block">วัตถุประสงค์ของประเภทงาน</span>
                <span className="font-bold text-slate-800 text-sm block">
                  เข้าพบเกษตรกร
                </span>
              </div>

              {/* จังหวัด */}
              <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                <span className="text-slate-400 font-medium block">จังหวัด</span>
                <span className="font-bold text-slate-800 text-sm block">
                  {target?.province || "-"}
                </span>
              </div>

              {/* สถานะเกษตรกร */}
              <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                <span className="text-slate-400 font-medium block">สถานะเกษตรกร</span>
                <div>
                  {isUnregistered ? (
                    <Badge
                      variant="outline"
                      className="bg-amber-50 text-amber-800 border-amber-300 font-bold text-xs"
                    >
                      เกษตรกรนอกระบบ
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-xs flex items-center gap-1 w-fit"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      เกษตรกรในระบบ
                    </Badge>
                  )}
                </div>
              </div>

              {/* เกษตรกร / ชื่อ */}
              <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                <span className="text-slate-400 font-medium block">
                  {isUnregistered ? "ชื่อ - สกุล เกษตรกร" : "เกษตรกร (Customer Master)"}
                </span>
                <span className="font-bold text-slate-800 text-sm block truncate" title={farmerDisplayName}>
                  {farmerDisplayName}
                </span>
              </div>

              {/* เบอร์โทร (กรณีไม่มีในระบบ) */}
              {isUnregistered ? (
                <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                  <span className="text-slate-400 font-medium block flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    เบอร์โทรศัพท์
                  </span>
                  <span className="font-bold text-slate-800 text-sm block">
                    {target?.unregisteredFarmerPhone || "-"}
                  </span>
                </div>
              ) : (
                <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                  <span className="text-slate-400 font-medium block">วัตถุประสงค์ (ประเด็นหลัก)</span>
                  <span className="font-bold text-slate-800 text-sm block">
                    {target?.topic || "-"}
                  </span>
                </div>
              )}
            </div>

            {/* Topic & Detail Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              {isUnregistered && (
                <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                  <span className="text-slate-400 font-medium block">วัตถุประสงค์ (ประเด็นหลัก)</span>
                  <span className="font-semibold text-slate-800 block">
                    {target?.topic || "-"}
                  </span>
                </div>
              )}
              <div className={cn("bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1", !isUnregistered && "sm:col-span-2")}>
                <span className="text-slate-400 font-medium block">รายละเอียดเพิ่มเติม</span>
                <p className="font-normal text-slate-700 whitespace-pre-wrap">
                  {target?.detail || "-"}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ACTUAL RESULTS FORM SECTION */}
      <div className="space-y-4 pt-1">
        <div className="flex items-center gap-2 pb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
          <h3 className="text-sm font-bold text-slate-800">
            บันทึกผลการเข้าพบจริง (ACTUAL)
          </h3>
        </div>

        {/* Farmer-Specific Actual Fields (Hidden in Store Mode) */}
        {!isStore && (
          <>
            {/* 1. ที่อยู่บ้านเกษตรกร */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                ที่อยู่บ้านเกษตรกร
              </label>
              <Textarea
                rows={2}
                value={farmerHomeAddress}
                onChange={(e) => setFarmerHomeAddress && setFarmerHomeAddress(e.target.value)}
                placeholder="ระบุที่อยู่บ้านเกษตรกร เช่น เลขที่ หมู่ที่ ตำบล อำเภอ"
                className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm"
              />
            </div>

            {/* 2. พิกัดแปลง (Plot Coordinates) */}
            <div className="space-y-2 bg-emerald-50/30 border border-emerald-100 rounded-xl p-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-semibold text-emerald-950 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-emerald-700" />
                  พิกัดแปลง (Plot Coordinates)
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGetCurrentLocation}
                  disabled={geoLoading}
                  className="h-8 text-xs font-semibold bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                >
                  <Navigation className={cn("w-3 h-3 mr-1 text-emerald-600", geoLoading && "animate-spin")} />
                  {geoLoading ? "กำลังดึงพิกัด..." : "ใช้ตำแหน่งปัจจุบัน"}
                </Button>
              </div>

              {geoError && (
                <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  ⚠️ {geoError}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-slate-600">
                    Latitude (-90 ถึง 90)
                  </span>
                  <Input
                    type="number"
                    step="any"
                    value={plotLatitude}
                    onChange={(e) => setPlotLatitude && setPlotLatitude(e.target.value)}
                    placeholder="เช่น 13.7563309"
                    className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm h-10"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-slate-600">
                    Longitude (-180 ถึง 180)
                  </span>
                  <Input
                    type="number"
                    step="any"
                    value={plotLongitude}
                    onChange={(e) => setPlotLongitude && setPlotLongitude(e.target.value)}
                    placeholder="เช่น 100.5017651"
                    className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm h-10"
                  />
                </div>
              </div>
            </div>

            {/* 3. รูปแปลง (Plot Photos - Max 5) */}
            <div className="bg-emerald-50/20 border border-emerald-200/70 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-emerald-100 pb-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-emerald-950">
                    รูปแปลงเกษตรกร (สูงสุด 5 รูป)
                  </h4>
                  <p className="text-[11px] text-emerald-700/80">
                    อัปโหลดรูปภาพแปลงเกษตรกร เช่น สภาพแปลง แปลงปลูก ต้นพืช
                  </p>
                </div>
              </div>
              <GalleryUpload
                maxFiles={5}
                maxSize={20 * 1024 * 1024}
                accept="image/*"
                multiple={true}
                initialFiles={convertToFileMetadata(plotImages || [])}
                onFilesChange={handleFilesChange}
              />
            </div>
          </>
        )}

        {/* 4. Conditional rendering for advice products & sales opportunity */}
        {isAdviceTopic && (
          <>
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center justify-between">
                <span>สินค้าที่ให้คำแนะนำ (เลือกได้มากกว่า 1 รายการ)</span>
                {selectedProducts.length > 0 && (
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    เลือกแล้ว {selectedProducts.length} รายการ
                  </span>
                )}
              </label>

              {selectedProducts.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2.5 bg-emerald-50/40 border border-emerald-200/60 rounded-xl mb-1.5">
                  {selectedProducts.map((prod) => (
                    <span
                      key={prod}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-emerald-900 border border-emerald-200 shadow-2xs"
                    >
                      {prod}
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(prod)}
                        className="hover:bg-emerald-100 rounded-md p-0.5 transition-colors text-emerald-600 hover:text-red-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <FormCombobox
                id="product-advice-combobox"
                label=""
                labelClassName="hidden"
                value=""
                onChange={(val) => {
                  if (val) {
                    handleAddProduct(val);
                  }
                }}
                options={comboboxOptions}
                placeholder="เลือกสินค้าที่ให้คำแนะนำเพิ่มเติม (คลิกเลือกหลายรายการได้)"
                searchPlaceholder="ค้นหาสินค้า..."
                emptyText="ไม่พบสินค้า"
                triggerClassName="w-full bg-white border-slate-200 text-xs sm:text-sm h-10 min-h-[40px] rounded-xl mt-0 font-normal hover:bg-slate-50 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-slate-800">
                ประเมินโอกาสการขาย <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                {(["สูง", "ต่ำ"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSalesOpportunity(opt)}
                    className={cn(
                      "py-2.5 px-4 rounded-xl border text-xs sm:text-sm font-semibold cursor-pointer transition-all flex items-center justify-center",
                      salesOpportunity === opt
                        ? opt === "สูง"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 5. ผลการพูดคุย */}
        <div className="space-y-1.5">
          <label className="text-xs sm:text-sm font-semibold text-slate-800">
            ผลการพูดคุย <span className="text-rose-500">*</span>
          </label>
          <Textarea
            rows={2}
            value={discussionResult}
            onChange={(e) => setDiscussionResult(e.target.value)}
            placeholder={isStore ? "สรุปประเด็นสำคัญจากการพูดคุยกับร้านค้า" : "สรุปประเด็นสำคัญจากการพูดคุยกับเกษตรกร"}
            className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm"
          />
        </div>

        {/* 6. สิ่งที่ต้องดำเนินการต่อ & วันที่นัดหมายครั้งถัดไป */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-semibold text-slate-800">
              สิ่งที่ต้องดำเนินการต่อ
            </label>
            <Input
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              placeholder="เช่น ส่งตัวอย่างสินค้า, นัดหมายตรวจแปลง"
              className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm h-10"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-semibold text-slate-800">
              วันที่นัดหมายครั้งถัดไป
            </label>
            <DatePicker
              value={nextMeetingDate}
              onChange={(v) => setNextMeetingDate(v || "")}
              placeholder="เลือกวันที่นัดหมาย"
              className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm h-10"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
