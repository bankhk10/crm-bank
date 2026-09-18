"use client";

import React, { useMemo } from "react";
import { Camera, BarChart2, Store, Package, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import GalleryUpload from "@/components/custom/gallery-upload";
import type { FileWithPreview } from "@/hooks/use-file-upload";
import { ImageFile, Type5SurveyRecord } from "@/modules/activity-plans/features/shared/actual-view/types";
import {
  convertToFileMetadata,
  filesWithPreviewToImageFiles,
  isImageFilesEqual,
} from "@/modules/activity-plans/features/shared/actual-view/utils";

export interface TargetSurveyItem {
  id?: string;
  store: string;
  product: string;
  detail: string;
}

interface ActualType5SurveyProps {
  isVisible: boolean;
  target: {
    store: string;
    product: string;
    detail: string;
    items?: Array<{
      id?: string;
      store?: string;
      product?: string;
      detail?: string;
    }>;
  };
  surveyDetails?: Type5SurveyRecord[];
  onUpdateSurveyItem?: (
    index: number,
    updated: Partial<Type5SurveyRecord>,
  ) => void;
  // Fallback single-item props
  competitorBrand?: string;
  setCompetitorBrand?: (v: string) => void;
  competitorProduct?: string;
  setCompetitorProduct?: (v: string) => void;
}

export function ActualType5Survey({
  isVisible,
  target,
  surveyDetails = [],
  onUpdateSurveyItem,
  competitorBrand = "",
  setCompetitorBrand,
  competitorProduct = "",
  setCompetitorProduct,
}: ActualType5SurveyProps) {
  // Normalized records to render: prefer surveyDetails if available, otherwise construct from target or fallback
  const recordsToRender: { record: Type5SurveyRecord; index: number }[] =
    useMemo(() => {
      if (surveyDetails && surveyDetails.length > 0) {
        return surveyDetails.map((rec, idx) => ({ record: rec, index: idx }));
      }
      if (target.items && target.items.length > 0) {
        return target.items.map((item, idx) => ({
          record: {
            id: item.id,
            store: item.store || target.store || "",
            product: item.product || target.product || "",
            detail: item.detail || target.detail || "",
            competitorBrand: idx === 0 ? competitorBrand : "",
            competitorProduct: idx === 0 ? competitorProduct : "",
            posPrice: "",
            dealerPrice: "",
            subdealerPrice: "",
            farmerPrice: "",
            sellingPoints: "",
            bottleImages: [],
            promotionalImages: [],
          },
          index: idx,
        }));
      }
      return [
        {
          record: {
            store: target.store || "",
            product: target.product || "",
            detail: target.detail || "",
            competitorBrand,
            competitorProduct,
            posPrice: "",
            dealerPrice: "",
            subdealerPrice: "",
            farmerPrice: "",
            sellingPoints: "",
            bottleImages: [],
            promotionalImages: [],
          },
          index: 0,
        },
      ];
    }, [surveyDetails, target, competitorBrand, competitorProduct]);

  // Group records by Store Name
  const groupedByStore = useMemo(() => {
    const map = new Map<
      string,
      {
        storeName: string;
        items: { record: Type5SurveyRecord; index: number }[];
      }
    >();

    recordsToRender.forEach(({ record, index }) => {
      const storeKey = record.store?.trim() || "ร้านค้าที่สำรวจ";
      if (!map.has(storeKey)) {
        map.set(storeKey, { storeName: storeKey, items: [] });
      }
      map.get(storeKey)!.items.push({ record, index });
    });

    return Array.from(map.values());
  }, [recordsToRender]);

  const handleFieldChange = (
    index: number,
    field: keyof Type5SurveyRecord,
    val: any,
  ) => {
    if (onUpdateSurveyItem) {
      onUpdateSurveyItem(index, { [field]: val });
    }
    // Fallback sync for index 0
    if (index === 0) {
      if (field === "competitorBrand" && setCompetitorBrand)
        setCompetitorBrand(val);
      if (field === "competitorProduct" && setCompetitorProduct)
        setCompetitorProduct(val);
    }
  };

  // Bottle photos change (Max 2)
  const handleBottleFilesChange = (index: number, files: FileWithPreview[]) => {
    // Strictly cap at 2 photos
    const capped = files.slice(0, 2);
    const converted = filesWithPreviewToImageFiles(capped);
    const current = recordsToRender[index]?.record.bottleImages || [];

    if (!isImageFilesEqual(current, converted) && onUpdateSurveyItem) {
      onUpdateSurveyItem(index, { bottleImages: converted });
    }
  };

  // Promotional media photos change (Max 3)
  const handlePromotionalFilesChange = (
    index: number,
    files: FileWithPreview[],
  ) => {
    // Strictly cap at 3 photos
    const capped = files.slice(0, 3);
    const converted = filesWithPreviewToImageFiles(capped);
    const current = recordsToRender[index]?.record.promotionalImages || [];

    if (!isImageFilesEqual(current, converted) && onUpdateSurveyItem) {
      onUpdateSurveyItem(index, { promotionalImages: converted });
    }
  };

  if (!isVisible) return null;

  return (
    <div className="border border-amber-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-amber-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-amber-900 text-base md:text-lg">
              สำรวจตลาดของคู่แข่ง
            </h2>
            <p className="text-xs text-amber-700/80">
              บันทึกผลการสำรวจแยกตามร้านค้าและสินค้าเปรียบเทียบตามแผนงาน
            </p>
          </div>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
          ทั้งหมด {recordsToRender.length} รายการสำรวจ
        </span>
      </div>

      {/* Grouped by Store List */}
      <div className="space-y-6">
        {groupedByStore.map((storeGroup, sIdx) => (
          <div
            key={storeGroup.storeName || sIdx}
            className="border border-slate-200 rounded-2xl p-4 sm:p-5 bg-slate-50/40 space-y-5 shadow-xs"
          >
            {/* Store Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>ร้านค้า: {storeGroup.storeName}</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    เป้าหมายสำรวจจำนวน {storeGroup.items.length} สินค้า
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                ร้านค้าลำดับที่ {sIdx + 1}
              </span>
            </div>

            {/* List of Products under this Store */}
            <div className="space-y-5">
              {storeGroup.items.map(({ record, index }, pIdx) => (
                <div
                  key={
                    record.id ||
                    `${storeGroup.storeName}-${record.product}-${index}`
                  }
                  className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4 transition-all hover:border-amber-300"
                >
                  {/* Product Header & Target Info */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold">
                        {pIdx + 1}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-amber-600" />
                        สินค้าเปรียบเทียบ:{" "}
                        <span className="text-amber-900 font-extrabold">
                          {record.product || "-"}
                        </span>
                      </span>
                    </div>

                    {record.detail && (
                      <span className="text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/80">
                        <span className="font-semibold text-slate-500">
                          รายละเอียดจากแผน:
                        </span>{" "}
                        {record.detail}
                      </span>
                    )}
                  </div>

                  {/* Brand & Product Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        แบรนด์คู่แข่งที่พบหน้างาน{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        value={record.competitorBrand || ""}
                        onChange={(e) =>
                          handleFieldChange(
                            index,
                            "competitorBrand",
                            e.target.value,
                          )
                        }
                        placeholder="เช่น ตราเกษตรทองคำ, เสือคู่"
                        className="bg-white border-slate-300 h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        สินค้าคู่แข่ง <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        value={record.competitorProduct || ""}
                        onChange={(e) =>
                          handleFieldChange(
                            index,
                            "competitorProduct",
                            e.target.value,
                          )
                        }
                        placeholder="เช่น ปุ๋ยสูตร 20-20-20"
                        className="bg-white border-slate-300 h-9 text-xs"
                      />
                    </div>
                  </div>

                  {/* Normalized 4-Tier Pricing */}
                  <div className="bg-amber-50/30 border border-amber-100 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        โครงสร้างราคา 4 ระดับ (บาท)
                      </span>
                      <span className="text-[11px] text-amber-700/70">
                        กรอกข้อมูลราคาที่สำรวจได้
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">
                          ราคา ณ จุดขาย (POS)
                        </label>
                        <Input
                          type="text"
                          value={
                            record.posPrice != null
                              ? String(record.posPrice)
                              : ""
                          }
                          onChange={(e) =>
                            handleFieldChange(index, "posPrice", e.target.value)
                          }
                          placeholder="เช่น 450"
                          className="bg-white border-slate-300 h-9 text-xs font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">
                          ราคา Dealer
                        </label>
                        <Input
                          type="text"
                          value={
                            record.dealerPrice != null
                              ? String(record.dealerPrice)
                              : ""
                          }
                          onChange={(e) =>
                            handleFieldChange(
                              index,
                              "dealerPrice",
                              e.target.value,
                            )
                          }
                          placeholder="เช่น 380"
                          className="bg-white border-slate-300 h-9 text-xs font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">
                          ราคา Subdealer
                        </label>
                        <Input
                          type="text"
                          value={
                            record.subdealerPrice != null
                              ? String(record.subdealerPrice)
                              : ""
                          }
                          onChange={(e) =>
                            handleFieldChange(
                              index,
                              "subdealerPrice",
                              e.target.value,
                            )
                          }
                          placeholder="เช่น 410"
                          className="bg-white border-slate-300 h-9 text-xs font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">
                          ราคา Farmers
                        </label>
                        <Input
                          type="text"
                          value={
                            record.farmerPrice != null
                              ? String(record.farmerPrice)
                              : ""
                          }
                          onChange={(e) =>
                            handleFieldChange(
                              index,
                              "farmerPrice",
                              e.target.value,
                            )
                          }
                          placeholder="เช่น 450"
                          className="bg-white border-slate-300 h-9 text-xs font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Product Selling Points / Highlights */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      จุดขาย / จุดเด่นของสินค้า
                    </label>
                    <Textarea
                      rows={2}
                      value={record.sellingPoints || ""}
                      onChange={(e) =>
                        handleFieldChange(
                          index,
                          "sellingPoints",
                          e.target.value,
                        )
                      }
                      placeholder="ระบุจุดขายหรือจุดเด่นของผลิตภัณฑ์คู่แข่ง เช่น ละลายน้ำไว ไม่ตกตะกอน บรรจุภัณฑ์จับถนัดมือ มีสารจับใบในตัว ฯลฯ"
                      className="bg-white border-slate-300 text-xs min-h-[64px]"
                    />
                  </div>

                  {/* 2 Separate Upload Sections: Bottle Photos (Max 2) and Promotional Materials (Max 3) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
                    {/* Bottle Photos */}
                    <div className="bg-amber-50/20 border border-amber-200/70 rounded-2xl p-4 sm:p-5 space-y-3">
                      <div className="flex items-center justify-between border-b border-amber-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200">
                            <Camera className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-amber-950">
                              รูปถ่ายขวดผลิตภัณฑ์
                            </h4>
                            <p className="text-[11px] text-amber-700/80">
                              รูปถ่ายขวดหรือบรรจุภัณฑ์ของสินค้าคู่แข่ง
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          {(record.bottleImages || []).length} / 2 รูป
                        </span>
                      </div>
                      <GalleryUpload
                        key={`bottle-${record.id || `${storeGroup.storeName}-${record.product}-${index}`}`}
                        maxFiles={2}
                        maxSize={20 * 1024 * 1024}
                        accept="image/*"
                        multiple={true}
                        initialFiles={convertToFileMetadata(
                          (record.bottleImages || []).slice(0, 2),
                        )}
                        onFilesChange={(files) =>
                          handleBottleFilesChange(index, files)
                        }
                      />
                    </div>

                    {/* Promotional Materials Photos */}
                    <div className="bg-blue-50/20 border border-blue-200/70 rounded-2xl p-4 sm:p-5 space-y-3">
                      <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center border border-blue-200">
                            <Camera className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-blue-950">
                              รูปภาพสื่อส่งเสริมการขาย
                            </h4>
                            <p className="text-[11px] text-blue-700/80">
                              ป้ายโฆษณา, แบนเนอร์, โบรชัวร์ หรือสื่อโปรโมท
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                          {(record.promotionalImages || []).length} / 3 รูป
                        </span>
                      </div>
                      <GalleryUpload
                        key={`promo-${record.id || `${storeGroup.storeName}-${record.product}-${index}`}`}
                        maxFiles={3}
                        maxSize={20 * 1024 * 1024}
                        accept="image/*"
                        multiple={true}
                        initialFiles={convertToFileMetadata(
                          (record.promotionalImages || []).slice(0, 3),
                        )}
                        onFilesChange={(files) =>
                          handlePromotionalFilesChange(index, files)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
