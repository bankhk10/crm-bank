"use client";

import React, { useState, useEffect } from "react";
import {
  Sprout,
  Calendar,
  AlertTriangle,
  PlusCircle,
  Package,
  RotateCcw,
  ImageIcon,
  Info,
  MapPin,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormCombobox } from "@/components/custom/form-components";
import DatePicker from "@/components/custom/DatePicker";
import { ImageFile } from "@/modules/activity-plans/features/actual-view/types";
import { ActualTargetCard } from "@/modules/activity-plans/features/actual-view/components/actual-target-card";
import { getDemoPlotsAction } from "@/modules/activity-plans/server/actions";
import type { UserDemoPlotOption } from "@/modules/activity-plans/constants";
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
  plotName?: string;
  setPlotName?: (v: string) => void;
  usageMethod: string;
  setUsageMethod: (v: string) => void;
  plantingDate?: string;
  setPlantingDate?: (v: string) => void;
  plantingAreaCondition?: string;
  setPlantingAreaCondition?: (v: string) => void;
  nextFollowUpDate?: string;
  setNextFollowUpDate?: (v: string) => void;
  cropImages?: ImageFile[];
  setCropImages?: (imgs: ImageFile[]) => void;
  plotImages?: ImageFile[];
  setPlotImages?: (imgs: ImageFile[]) => void;
  demoPlots?: UserDemoPlotOption[];
}

export function ActualType7NewDemo({
  target,
  products = [],
  plannedProductId,
  actualProductId,
  setActualProductId,
  changeReason = "",
  setChangeReason,
  plotName = "",
  setPlotName,
  usageMethod,
  setUsageMethod,
  plantingDate = "",
  setPlantingDate,
  plantingAreaCondition = "",
  setPlantingAreaCondition,
  nextFollowUpDate = "",
  setNextFollowUpDate,
  cropImages = [],
  setCropImages,
  plotImages = [],
  setPlotImages,
  demoPlots: externalDemoPlots = [],
}: ActualType7NewDemoProps) {
  const [isChangingProduct, setIsChangingProduct] = useState(false);
  const [internalDemoPlots, setInternalDemoPlots] = useState<
    UserDemoPlotOption[]
  >([]);
  const [selectedFarmPlotId, setSelectedFarmPlotId] = useState<string>("");

  // Load demo plots / farm plots list once on mount
  useEffect(() => {
    let isMounted = true;
    getDemoPlotsAction()
      .then((res: any) => {
        if (isMounted && res?.success && res.demoPlots) {
          setInternalDemoPlots(res.demoPlots);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const demoPlotList =
    externalDemoPlots.length > 0 ? externalDemoPlots : internalDemoPlots;

  // Filter plots belonging strictly to the selected farmer/owner
  const ownerNameClean = (target.owner || "").trim().toLowerCase();
  const farmerPlots = (demoPlotList || []).filter((p) => {
    if (p.status === "CANCELLED") return false;
    if (!ownerNameClean) return false;
    const pOwner = (p.ownerName || "").trim().toLowerCase();
    return (
      pOwner === ownerNameClean ||
      pOwner.includes(ownerNameClean) ||
      ownerNameClean.includes(pOwner)
    );
  });

  const handleSelectFarmPlot = (plotId: string) => {
    setSelectedFarmPlotId(plotId);
    const found = farmerPlots.find((p) => p.id === plotId);
    if (found && setPlotName) {
      setPlotName(found.name || `แปลงสาธิต ${found.ownerName}`);
      if (
        found.location &&
        !plantingAreaCondition &&
        setPlantingAreaCondition
      ) {
        setPlantingAreaCondition(found.location);
      }
    }
  };

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

  // Construct target items strictly adhering to Business Rules:
  // "ห้ามแสดง Field สภาพแปลงเป้าหมาย ในส่วนเป้าหมายที่ตั้งไว้ล่วงหน้าของแผน (Planned Target)"
  const plannedTargetItems = [
    { label: "ประเภทงาน:", value: "ทำแปลงสาธิต (เริ่มทำแปลงใหม่)" },
    { label: "เกษตรกร / เจ้าของแปลง:", value: target.owner || "-" },
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
    { label: "จำนวนแปลง / พื้นที่:", value: target.plots || "-" },
    ...(target.demoProductQuantity
      ? [
          {
            label: "จำนวนสินค้าที่ใช้:",
            value: `${target.demoProductQuantity} ชิ้น/ขวด`,
          },
        ]
      : []),
    ...(target.experimentDetail || target.detail
      ? [
          {
            label: "รายละเอียดการทดลอง:",
            value: target.experimentDetail || target.detail,
          },
        ]
      : []),
  ];

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
              บันทึกข้อมูลการเริ่มต้นทำแปลงสาธิตใหม่ สินค้าที่ใช้จริง
              และภาพถ่ายสภาพแปลงเริ่มต้น
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs bg-emerald-100 text-emerald-800 border border-emerald-300">
          <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>ประเภท: ทำแปลงสาธิต (เริ่มทำแปลงใหม่)</span>
        </span>
      </div>

      {/* SECTION 1: PLANNED TARGET CARD (No Target Condition field) */}
      <ActualTargetCard
        iconColorClass="text-emerald-700"
        badgeColorClass="bg-emerald-50 text-emerald-800 border border-emerald-200"
        gridColsClass="grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
        items={plannedTargetItems}
      />

      {/* SECTION 2: FARM PLOT SELECTION & LINKING */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
          <MapPin className="w-4 h-4 text-emerald-700" />
          <h3 className="text-sm font-bold text-slate-800">
            ข้อมูลแปลงเกษตรและชื่อแปลงสาธิต
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-semibold text-slate-800">
              เกษตรกร / เจ้าของแปลง
            </label>
            <div className="h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-100/90 flex items-center font-bold text-slate-800 text-xs sm:text-sm">
              {target.owner || "ไม่ระบุเกษตรกร"}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-semibold text-slate-800">
              แปลงเกษตรของเกษตรกร (ถ้ามีในระบบ)
            </label>
            {farmerPlots.length > 0 ? (
              <Select
                value={selectedFarmPlotId}
                onValueChange={handleSelectFarmPlot}
              >
                <SelectTrigger className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm h-10">
                  <SelectValue placeholder="เลือกแปลงเกษตรของเกษตรกร..." />
                </SelectTrigger>
                <SelectContent>
                  {farmerPlots.map((plot) => (
                    <SelectItem key={plot.id} value={plot.id}>
                      {plot.name ||
                        `แปลง ${plot.targetCrop || plot.cropName || ""}`}
                      {plot.areaRai ? ` (${plot.areaRai} ไร่)` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center text-xs text-slate-500 gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>ยังไม่มีข้อมูลแปลงเกษตร</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs sm:text-sm font-semibold text-slate-800">
              ชื่อแปลงสาธิต <span className="text-red-500">*</span>
            </label>
            <Input
              value={plotName}
              onChange={(e) => setPlotName?.(e.target.value)}
              placeholder="ระบุชื่อแปลงสาธิต เช่น แปลงสาธิตทุเรียนหมอนทอง นายสมชาย"
              className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm h-10"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: PRODUCT & CHANGE MANAGEMENT */}
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
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-slate-200/80">
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
              className="h-8 text-xs text-emerald-800 border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100 rounded-xl"
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
                  className="h-8 text-xs text-slate-700 border-slate-300 hover:bg-white rounded-xl"
                >
                  แก้ไข
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRevertToPlanned}
                  className="h-8 text-xs text-amber-800 border-amber-300 bg-amber-50 hover:bg-amber-100 gap-1 rounded-xl"
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
                  triggerClassName="h-10 text-xs sm:text-sm bg-white border-amber-300 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-amber-500"
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
                  เหตุผลที่เปลี่ยนหน้างาน{" "}
                  <span className="text-red-500">*</span>
                </label>
                <Input
                  value={changeReason}
                  onChange={(e) => setChangeReason?.(e.target.value)}
                  placeholder="เช่น แมลงลงหนัก เกษตรกรขอทดสอบสินค้าตัวนี้ก่อน..."
                  className="h-10 text-xs sm:text-sm bg-white border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: INITIAL PLANTING & FIELD CONDITION */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
          <Calendar className="w-4 h-4 text-emerald-700" />
          <h3 className="text-sm font-bold text-slate-800">
            ข้อมูลการเริ่มปลูกและสภาพแปลงเริ่มต้น
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-1">
              วันที่เริ่มปลูกจริง <span className="text-red-500">*</span>
            </label>
            <DatePicker
              value={plantingDate}
              onChange={(v) => setPlantingDate?.(v || "")}
              placeholder="เลือกวันที่เริ่มปลูกจริง"
              className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm h-10"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-semibold text-slate-800">
              วันที่นัดหมายครั้งถัดไป
            </label>
            <DatePicker
              value={nextFollowUpDate}
              onChange={(v) => setNextFollowUpDate?.(v || "")}
              placeholder="เลือกวันที่นัดหมายครั้งถัดไป"
              className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm h-10"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs sm:text-sm font-semibold text-slate-800">
              สภาพพื้นที่ปลูกตอนเริ่มต้น
            </label>
            <Input
              value={plantingAreaCondition}
              onChange={(e) => setPlantingAreaCondition?.(e.target.value)}
              placeholder="เช่น ดินร่วนปนทราย มีระบบน้ำหยด แดดส่องถึงทั้งวัน..."
              className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm h-10"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs sm:text-sm font-semibold text-slate-800">
              วิธีการใช้สาร / สูตรยาตอนเริ่มต้น{" "}
              <span className="text-red-500">*</span>
            </label>
            <Textarea
              rows={3}
              value={usageMethod}
              onChange={(e) => setUsageMethod(e.target.value)}
              placeholder="ระบุอัตราการใช้ วิธีการผสม และเวลาที่พ่น..."
              className="text-xs sm:text-sm bg-white border-slate-200 rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* SECTION 5: INITIAL PHOTOS */}
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
