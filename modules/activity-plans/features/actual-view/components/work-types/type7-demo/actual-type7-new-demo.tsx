"use client";

import React, { useState } from "react";
import {
  Sprout,
  Calendar,
  AlertTriangle,
  PlusCircle,
  Package,
  RotateCcw,
  ImageIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormCombobox } from "@/components/custom/form-components";
import { ImageFile } from "@/modules/activity-plans/features/actual-view/types";
import { ActualTargetCard } from "@/modules/activity-plans/features/actual-view/components/actual-target-card";
import GalleryUpload from "@/components/custom/gallery-upload";
import type { FileWithPreview } from "@/hooks/use-file-upload";
import {
  convertToFileMetadata,
  filesWithPreviewToImageFiles,
  isImageFilesEqual,
} from "@/modules/activity-plans/features/actual-view/utils";

export interface TargetDemoItem {
  activityType?: "CREATE" | "FOLLOW_UP" | string;
  owner: string;
  product: string;
  crop: string;
  plots: string;
  demoProductQuantity?: string | number | null;
  objective?: string;
  experimentDetail?: string;
  detail?: string;
}

export interface ActualType7NewDemoProps {
  target: {
    activityType?: string;
    owner: string;
    product: string;
    productId?: string;
    plannedProductId?: string;
    crop: string;
    plots: string;
    targetCondition?: string;
    demoProductQuantity?: string | number | null;
    objective?: string;
    experimentDetail?: string;
    detail?: string;
    items?: TargetDemoItem[];
  };
  products?: Array<{ id: string; name: string; productCode?: string | null }>;
  plannedProductId?: string | null;
  actualProductId?: string | null;
  setActualProductId?: (id: string | null) => void;
  changeReason?: string;
  setChangeReason?: (reason: string) => void;
  startDate?: string;
  usageMethod: string;
  setUsageMethod: (v: string) => void;
  plantingDate?: string;
  setPlantingDate?: (v: string) => void;
  plantingAreaCondition?: string;
  setPlantingAreaCondition?: (v: string) => void;
  cropImages?: ImageFile[];
  setCropImages?: (imgs: ImageFile[]) => void;
  plotImages?: ImageFile[];
  setPlotImages?: (imgs: ImageFile[]) => void;
}

export function ActualType7NewDemo({
  target,
  products = [],
  plannedProductId,
  actualProductId,
  setActualProductId,
  changeReason = "",
  setChangeReason,
  startDate = "",
  usageMethod,
  setUsageMethod,
  plantingDate = "",
  setPlantingDate,
  plantingAreaCondition = "",
  setPlantingAreaCondition,
  cropImages = [],
  setCropImages,
  plotImages = [],
  setPlotImages,
}: ActualType7NewDemoProps) {
  const [isChangingProduct, setIsChangingProduct] = useState(false);

  const productOptions = (products || []).map((p) => ({
    value: p.id,
    label: p.productCode ? `${p.name} (${p.productCode})` : p.name,
  }));

  const plannedProd = (products || []).find(
    (p) => p.id === plannedProductId || p.name === target.product,
  );
  const effectivePlannedProductId = plannedProductId || plannedProd?.id || null;
  const plannedProductName = plannedProd?.name || target.product || "";

  const actualProd = (products || []).find(
    (p) => p.id === (actualProductId || effectivePlannedProductId),
  );
  const currentActualProductName =
    actualProd?.name ||
    (actualProductId === effectivePlannedProductId ? plannedProductName : "");

  const isProductChanged = Boolean(
    actualProductId &&
      effectivePlannedProductId &&
      actualProductId !== effectivePlannedProductId,
  );

  const handleSelectProduct = (newProdId: string) => {
    setActualProductId?.(newProdId);
    if (newProdId === effectivePlannedProductId) {
      setChangeReason?.("");
    }
  };

  const handleRevertToPlanned = () => {
    setActualProductId?.(effectivePlannedProductId);
    setChangeReason?.("");
    setIsChangingProduct(false);
  };

  const handleCropFilesChange = (files: FileWithPreview[]) => {
    if (!setCropImages) return;
    const newImageFiles = filesWithPreviewToImageFiles(files);
    if (!isImageFilesEqual(cropImages, newImageFiles)) {
      setCropImages(newImageFiles);
    }
  };

  const handlePlotFilesChange = (files: FileWithPreview[]) => {
    if (!setPlotImages) return;
    const newImageFiles = filesWithPreviewToImageFiles(files);
    if (!isImageFilesEqual(plotImages, newImageFiles)) {
      setPlotImages(newImageFiles);
    }
  };

  return (
    <div className="border border-emerald-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-emerald-100 pb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-emerald-900 text-base md:text-lg">
              ทำแปลงสาธิต (เริ่มทำแปลงใหม่)
            </h2>
            <p className="text-xs text-slate-500">
              บันทึกข้อมูลการเริ่มต้นทำแปลงสาธิตใหม่ สินค้าที่ใช้จริง และภาพถ่ายสภาพแปลงเริ่มต้น
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs bg-emerald-100 text-emerald-800 border border-emerald-300">
          <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>ประเภท: ทำแปลงสาธิต (เริ่มทำแปลงใหม่)</span>
        </span>
      </div>

      {/* SECTION 1: PLANNED TARGET CARD */}
      <ActualTargetCard
        iconColorClass="text-emerald-700"
        badgeColorClass="bg-emerald-50 text-emerald-800 border border-emerald-200"
        gridColsClass="grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
        items={[
          { label: "ประเภทงาน:", value: "ทำแปลงสาธิต (เริ่มทำแปลงใหม่)" },
          { label: "เกษตรกร/เจ้าของแปลง:", value: target.owner || "-" },
          { label: "พืชที่ทดสอบ:", value: target.crop || "-" },
          {
            label: "สินค้าที่วางแผน:",
            value: isProductChanged ? (
              <span className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-emerald-950">
                  {currentActualProductName || target.product}
                </span>
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] font-bold"
                >
                  ⚠️ เปลี่ยนหน้างาน
                </Badge>
              </span>
            ) : (
              target.product || "-"
            ),
          },
          { label: "จำนวนแปลง/พื้นที่:", value: target.plots || "-" },
          {
            label: "จำนวนสินค้าที่ใช้:",
            value: target.demoProductQuantity
              ? `${target.demoProductQuantity} ชิ้น/ขวด`
              : "-",
          },
          {
            label: "สภาพแปลงเป้าหมาย:",
            value: target.targetCondition || target.objective || "-",
          },
          {
            label: "รายละเอียดการทดลอง:",
            value: target.experimentDetail || target.detail || "-",
          },
        ]}
      />

      {/* SECTION 2: PRODUCT & CHANGE MANAGEMENT */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-800">
              สินค้าที่ใช้สาธิตจริง (Actual Demonstration Product)
            </h3>
          </div>
          {isProductChanged && (
            <Badge
              variant="outline"
              className="bg-amber-100 text-amber-900 border-amber-300 font-bold gap-1 text-xs"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              ⚠️ มีการเปลี่ยนสินค้าหน้างาน
            </Badge>
          )}
        </div>

        {/* Normal Mode vs Edit Mode for Product */}
        {!isChangingProduct && !isProductChanged ? (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200/80">
            <div className="space-y-0.5">
              <span className="text-xs text-slate-500 font-medium block">
                สินค้าที่ใช้ตามแผน
              </span>
              <span className="text-sm font-bold text-slate-800 block">
                {plannedProductName || "ไม่ได้ระบุสินค้าตามแผน"}
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsChangingProduct(true)}
              className="h-8 text-xs text-emerald-800 border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100"
            >
              เปลี่ยนสินค้าหน้างาน
            </Button>
          </div>
        ) : !isChangingProduct && isProductChanged ? (
          <div className="space-y-3 p-3.5 bg-amber-50/40 rounded-xl border border-amber-200/80">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5">
                <span className="text-xs text-slate-500 font-medium block">
                  สินค้าที่ใช้จริงหน้างาน
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    {currentActualProductName}
                  </span>
                  <span className="text-xs text-slate-400">
                    (สินค้าตามแผน:{" "}
                    <span className="line-through">{plannedProductName}</span>)
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsChangingProduct(true)}
                  className="h-7 text-xs text-slate-700 border-slate-300 hover:bg-white"
                >
                  แก้ไข
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRevertToPlanned}
                  className="h-7 text-xs text-amber-800 border-amber-300 bg-amber-50 hover:bg-amber-100 gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  ใช้สินค้าตามแผน
                </Button>
              </div>
            </div>

            <div className="pt-2 border-t border-amber-200/60 text-xs text-amber-950">
              <span className="font-bold text-amber-900">
                เหตุผลที่เปลี่ยนหน้างาน:{" "}
              </span>
              <span>{changeReason || "-"}</span>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-amber-50/60 border border-amber-300/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-amber-200 pb-2">
              <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                เลือกสินค้าใหม่ที่ใช้จริงหน้างาน
              </span>
              <button
                type="button"
                onClick={() => setIsChangingProduct(false)}
                className="text-xs text-slate-500 hover:text-slate-700 underline"
              >
                ยกเลิก
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <FormCombobox
                  id="actual-product-combobox"
                  label="เลือกสินค้าที่ใช้จริง *"
                  labelClassName="block text-xs font-bold text-slate-700 mb-1"
                  triggerClassName="h-9 text-xs bg-white border-amber-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-amber-500"
                  value={actualProductId || effectivePlannedProductId || ""}
                  onChange={handleSelectProduct}
                  options={productOptions}
                  placeholder="ค้นหาและเลือกสินค้าที่ใช้จริง..."
                  searchPlaceholder="พิมพ์ชื่อสินค้าหรือรหัส..."
                  emptyText="ไม่พบสินค้า"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  เหตุผลที่เปลี่ยนหน้างาน <span className="text-red-500">*</span>
                </label>
                <Input
                  value={changeReason}
                  onChange={(e) => setChangeReason?.(e.target.value)}
                  placeholder="เช่น แมลงลงหนัก เกษตรกรขอทดสอบสินค้าตัวนี้ก่อน..."
                  className="h-9 text-xs bg-white border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: INITIAL PLANTING & FIELD CONDITION */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
          <Calendar className="w-4 h-4 text-emerald-700" />
          <h3 className="text-sm font-bold text-slate-800">
            ข้อมูลการเริ่มปลูกและสภาพแปลงเริ่มต้น
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              วันที่เริ่มปลูกจริง <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={plantingDate || startDate}
              onChange={(e) => setPlantingDate?.(e.target.value)}
              className="h-9 text-xs bg-white border-slate-200 rounded-lg font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              สภาพพื้นที่ปลูกตอนเริ่มต้น
            </label>
            <Input
              value={plantingAreaCondition}
              onChange={(e) => setPlantingAreaCondition?.(e.target.value)}
              placeholder="เช่น ดินร่วนปนทราย มีระบบน้ำหยด แดดส่องถึงทั้งวัน..."
              className="h-9 text-xs bg-white border-slate-200 rounded-lg"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            วิธีการใช้สาร / สูตรยาตอนเริ่มต้น <span className="text-red-500">*</span>
          </label>
          <Textarea
            rows={2}
            value={usageMethod}
            onChange={(e) => setUsageMethod(e.target.value)}
            placeholder="ระบุอัตราการใช้ วิธีการผสม และเวลาที่พ่น..."
            className="text-xs bg-white border-slate-200 rounded-lg"
          />
        </div>
      </div>

      {/* SECTION 4: INITIAL PHOTOS */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
          <ImageIcon className="w-4 h-4 text-emerald-700" />
          <h3 className="text-sm font-bold text-slate-800">
            ภาพถ่ายสภาพแปลงเริ่มต้น (Initial Demonstration Photos)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-xs font-bold text-slate-800 block">
              1. ภาพถ่ายสภาพพืชเริ่มต้น
            </span>
            <GalleryUpload
              initialFiles={convertToFileMetadata(cropImages)}
              onFilesChange={handleCropFilesChange}
              maxFiles={5}
            />
          </div>

          <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-xs font-bold text-slate-800 block">
              2. ภาพถ่ายสภาพแปลงเริ่มต้น
            </span>
            <GalleryUpload
              initialFiles={convertToFileMetadata(plotImages)}
              onFilesChange={handlePlotFilesChange}
              maxFiles={5}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
