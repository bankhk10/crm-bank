"use client";

import React, { useMemo } from "react";
import { Camera, BarChart2, Store, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import GalleryUpload from "@/components/custom/gallery-upload";
import type { FileMetadata, FileWithPreview } from "@/hooks/use-file-upload";
import { ImageFile, Type5SurveyRecord } from "../../types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const COMPETITOR_PRODUCT_UNITS = [
  "ขวด",
  "แกลลอน",
  "ถัง",
  "กระสอบ",
  "ลัง",
  "กล่อง",
  "ถุง",
  "ซอง",
  "ลิตร",
  "กิโลกรัม",
  "ชุด",
  "ชิ้น",
];

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
    items?: TargetSurveyItem[];
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
  competitorPrice?: string;
  setCompetitorPrice?: (v: string) => void;
  competitorUnit?: string;
  setCompetitorUnit?: (v: string) => void;
  promotionDetail?: string;
  setPromotionDetail?: (v: string) => void;
  priceTagImages?: ImageFile[];
  onUploadImages?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage?: (id: string) => void;
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
  competitorPrice = "",
  setCompetitorPrice,
  competitorUnit = "ขวด",
  setCompetitorUnit,
  promotionDetail = "",
  setPromotionDetail,
  priceTagImages = [],
}: ActualType5SurveyProps) {
  // Convert ImageFile[] to FileMetadata[] for GalleryUpload
  const convertToFileMetadata = (images: ImageFile[] = []): FileMetadata[] => {
    return images.map((img) => ({
      id: img.id,
      name: img.name || `image-${img.id}`,
      size: (img as any).size || 0,
      type: (img as any).type || "image/jpeg",
      url: img.url,
    }));
  };

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
            competitorPrice: idx === 0 ? competitorPrice : "",
            competitorUnit: idx === 0 ? competitorUnit : "ขวด",
            promotionDetail: idx === 0 ? promotionDetail : "",
            priceTagImages: idx === 0 ? priceTagImages : [],
            shelfImages: [],
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
            competitorPrice,
            competitorUnit,
            promotionDetail,
            priceTagImages,
            shelfImages: [],
          },
          index: 0,
        },
      ];
    }, [
      surveyDetails,
      target,
      competitorBrand,
      competitorProduct,
      competitorPrice,
      competitorUnit,
      promotionDetail,
      priceTagImages,
    ]);

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
      if (field === "competitorPrice" && setCompetitorPrice)
        setCompetitorPrice(val);
      if (field === "competitorUnit" && setCompetitorUnit)
        setCompetitorUnit(val);
      if (field === "promotionDetail" && setPromotionDetail)
        setPromotionDetail(val);
    }
  };

  const handlePriceTagFilesChange = (
    index: number,
    files: FileWithPreview[],
  ) => {
    const converted: ImageFile[] = files.map((item) => {
      if (item.file instanceof File) {
        return {
          id: item.id,
          url:
            item.preview ||
            (typeof window !== "undefined"
              ? URL.createObjectURL(item.file)
              : ""),
          name: item.file.name,
        };
      }
      return {
        id: item.file.id,
        url: item.file.url,
        name: item.file.name,
      };
    });

    const current = recordsToRender[index]?.record.priceTagImages || [];
    const isSame =
      current.length === converted.length &&
      current.every((c, i) => c.id === converted[i]?.id && c.url === converted[i]?.url);

    if (!isSame && onUpdateSurveyItem) {
      onUpdateSurveyItem(index, { priceTagImages: converted });
    }
  };

  const handleShelfFilesChange = (index: number, files: FileWithPreview[]) => {
    const converted: ImageFile[] = files.map((item) => {
      if (item.file instanceof File) {
        return {
          id: item.id,
          url:
            item.preview ||
            (typeof window !== "undefined"
              ? URL.createObjectURL(item.file)
              : ""),
          name: item.file.name,
        };
      }
      return {
        id: item.file.id,
        url: item.file.url,
        name: item.file.name,
      };
    });

    const current = recordsToRender[index]?.record.shelfImages || [];
    const isSame =
      current.length === converted.length &&
      current.every((c, i) => c.id === converted[i]?.id && c.url === converted[i]?.url);

    if (!isSame && onUpdateSurveyItem) {
      onUpdateSurveyItem(index, { shelfImages: converted });
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

                  {/* Form Inputs Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
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

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        ราคาของคู่แข่ง (บาท){" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        type="text"
                        value={record.competitorPrice || ""}
                        onChange={(e) =>
                          handleFieldChange(
                            index,
                            "competitorPrice",
                            e.target.value,
                          )
                        }
                        placeholder="ระบุราคา เช่น 450"
                        className="bg-white border-slate-300 h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        หน่วยนับ <span className="text-rose-500">*</span>
                      </label>
                      <Select
                        value={record.competitorUnit || "ขวด"}
                        onValueChange={(val) =>
                          handleFieldChange(index, "competitorUnit", val)
                        }
                      >
                        <SelectTrigger className="bg-white border-slate-300 !h-9 data-[size=default]:h-9 text-xs w-full">
                          <SelectValue placeholder="เลือกหน่วยนับ" />
                        </SelectTrigger>
                        <SelectContent>
                          {COMPETITOR_PRODUCT_UNITS.map((unit) => (
                            <SelectItem
                              key={unit}
                              value={unit}
                              className="text-xs"
                            >
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Promotion Textarea */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      โปรโมชันของคู่แข่งในช่วงนี้
                    </label>
                    <Textarea
                      rows={2}
                      value={record.promotionDetail || ""}
                      onChange={(e) =>
                        handleFieldChange(
                          index,
                          "promotionDetail",
                          e.target.value,
                        )
                      }
                      placeholder="เช่น ซื้อ 10 แถม 1 หรือ มีของแถมพรีเมียมหน้าร้าน"
                      className="bg-white border-slate-300 text-xs min-h-[56px]"
                    />
                  </div>

                  {/* 2 Separate Upload Sections using GalleryUpload from product-form.tsx */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                    {/* Price Tag Images */}
                    <div className="bg-amber-50/20 border border-amber-200/70 rounded-2xl p-4 sm:p-5 space-y-3">
                      <div className="flex items-center gap-2 border-b border-amber-100 pb-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200">
                          <Camera className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-amber-950">
                            รูปภาพป้ายราคาคู่แข่ง
                          </h4>
                          <p className="text-[11px] text-amber-700/80">
                            รูปภาพป้ายราคาสำหรับ {record.product || "สินค้านี้"}
                          </p>
                        </div>
                      </div>
                      <GalleryUpload
                        key={`price-tag-${record.id || `${storeGroup.storeName}-${record.product}-${index}`}`}
                        maxFiles={10}
                        maxSize={20 * 1024 * 1024}
                        accept="image/*"
                        multiple={true}
                        initialFiles={convertToFileMetadata(
                          record.priceTagImages || [],
                        )}
                        onFilesChange={(files) =>
                          handlePriceTagFilesChange(index, files)
                        }
                      />
                    </div>

                    {/* Shelf Images */}
                    <div className="bg-indigo-50/20 border border-indigo-200/70 rounded-2xl p-4 sm:p-5 space-y-3">
                      <div className="flex items-center gap-2 border-b border-indigo-100 pb-2.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center border border-indigo-200">
                          <Camera className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-indigo-950">
                            รูปภาพชั้นวางสินค้า
                          </h4>
                          <p className="text-[11px] text-indigo-700/80">
                            รูปภาพชั้นวางสินค้าสำหรับ{" "}
                            {record.product || "สินค้านี้"}
                          </p>
                        </div>
                      </div>
                      <GalleryUpload
                        key={`shelf-${record.id || `${storeGroup.storeName}-${record.product}-${index}`}`}
                        maxFiles={10}
                        maxSize={20 * 1024 * 1024}
                        accept="image/*"
                        multiple={true}
                        initialFiles={convertToFileMetadata(
                          record.shelfImages || [],
                        )}
                        onFilesChange={(files) =>
                          handleShelfFilesChange(index, files)
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
