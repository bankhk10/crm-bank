"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Users, ShoppingBag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ActualTargetCard } from "../actual-target-card";
import { ImageFile } from "../../types";
import GalleryUpload from "@/components/custom/gallery-upload";
import type { FileWithPreview } from "@/hooks/use-file-upload";
import {
  convertToFileMetadata,
  filesWithPreviewToImageFiles,
  isImageFilesEqual,
} from "../../utils";

export interface ProductSaleDetail {
  productName: string;
  actualQty: string;
  actualSales: string;
}

interface ActualType8MeetingProps {
  isVisible: boolean;
  target: {
    topic: string;
    products: string;
    targetAttendees: string;
    items?: { productName: string; targetQty?: string }[];
  };
  actualAttendees: string;
  setActualAttendees: (v: string) => void;
  feedbackQnA: string;
  setFeedbackQnA: (v: string) => void;
  productSalesDetails?: ProductSaleDetail[];
  setProductSalesDetails?: (v: ProductSaleDetail[]) => void;
  images: ImageFile[];
  setImages: (v: ImageFile[]) => void;
  onUploadImages?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage?: (id: string) => void;
}

export function ActualType8Meeting({
  isVisible,
  target,
  actualAttendees,
  setActualAttendees,
  feedbackQnA,
  setFeedbackQnA,
  productSalesDetails,
  setProductSalesDetails,
  images = [],
  setImages,
}: ActualType8MeetingProps) {
  const productList = useMemo(() => {
    if (target.items && target.items.length > 0) {
      return target.items.map((i) => i.productName);
    }
    if (target.products) {
      return target.products
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
    }
    return [];
  }, [target.products, target.items]);

  const [localProductSales, setLocalProductSales] = useState<
    ProductSaleDetail[]
  >(() => {
    if (productSalesDetails && productSalesDetails.length > 0) {
      const merged = [...productSalesDetails];
      productList.forEach((pName) => {
        if (!merged.some((m) => m.productName === pName)) {
          merged.push({ productName: pName, actualQty: "", actualSales: "" });
        }
      });
      return merged;
    }
    return productList.map((pName) => ({
      productName: pName,
      actualQty: "",
      actualSales: "",
    }));
  });

  if (!isVisible) return null;

  const currentSalesList =
    localProductSales.length > 0
      ? localProductSales
      : productSalesDetails && productSalesDetails.length > 0
        ? productSalesDetails
        : productList.map((p) => ({
            productName: p,
            actualQty: "",
            actualSales: "",
          }));

  const handleProductSaleChange = (
    index: number,
    field: "actualQty" | "actualSales",
    val: string,
  ) => {
    const updated = [...currentSalesList];
    updated[index] = {
      ...updated[index],
      [field]: val,
    };
    setLocalProductSales(updated);
    if (setProductSalesDetails) {
      setProductSalesDetails(updated);
    }
  };

  const handleFilesChange = (files: FileWithPreview[]) => {
    const converted = filesWithPreviewToImageFiles(files);
    if (!isImageFilesEqual(images, converted) && setImages) {
      setImages(converted);
    }
  };

  return (
    <div className="border border-purple-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-purple-100 pb-3">
        <div className="flex items-center gap-2.5">
          <h2 className="font-bold text-purple-900 text-base md:text-lg">
            จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์
          </h2>
        </div>
      </div>

      <ActualTargetCard
        iconColorClass="text-purple-600"
        badgeColorClass="bg-purple-100 text-purple-800"
        gridColsClass="grid-cols-1 sm:grid-cols-3"
        items={[
          { label: "หัวข้อการประชุม:", value: target.topic || "-" },
          { label: "สินค้าแนะนำ:", value: target.products || "-" },
          {
            label: "เป้าหมายผู้เข้าร่วม:",
            value: target.targetAttendees ? `${target.targetAttendees} คน` : "-",
          },
        ]}
      />

      <div className="space-y-1.5 pt-1">
        <label className="text-sm font-semibold text-slate-800">
          จำนวนผู้เข้าร่วมประชุมจริง (คน) <span className="text-rose-500">*</span>
        </label>
        <Input
          type="number"
          min="0"
          value={actualAttendees}
          onChange={(e) => setActualAttendees(e.target.value)}
          placeholder="ระบุจำนวนผู้เข้าร่วมจริง เช่น 25"
          className="bg-white border-slate-300 max-w-xs"
        />
      </div>

      {/* Product Sales Details Breakdown Table */}
      {currentSalesList.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-purple-100/60">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <ShoppingBag className="w-4 h-4 text-purple-600" />
            <span>ยอดขายสินค้าที่เกิดขึ้นในการประชุม (ถ้ามี)</span>
          </div>
          <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 text-center w-12">ลำดับ</th>
                  <th className="py-2.5 px-3">ชื่อสินค้า</th>
                  <th className="py-2.5 px-3 text-center w-36">
                    จำนวนที่ขายได้ (ชิ้น/ขวด)
                  </th>
                  <th className="py-2.5 px-3 text-center w-40">
                    ยอดขายจริง (บาท)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {currentSalesList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 text-center text-slate-500 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-800">
                      {item.productName}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <Input
                        type="number"
                        min="0"
                        value={item.actualQty}
                        onChange={(e) =>
                          handleProductSaleChange(
                            idx,
                            "actualQty",
                            e.target.value,
                          )
                        }
                        placeholder="0"
                        className="h-8 text-center bg-slate-50/50 border-slate-200 text-xs w-28 mx-auto"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <Input
                        type="text"
                        value={item.actualSales}
                        onChange={(e) =>
                          handleProductSaleChange(
                            idx,
                            "actualSales",
                            e.target.value,
                          )
                        }
                        placeholder="0.00"
                        className="h-8 text-right bg-slate-50/50 border-slate-200 text-xs w-32 mx-auto font-bold text-purple-950"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-800">
          ข้อเสนอแนะ / ประเด็นคำถาม-คำตอบ (Q&A)
        </label>
        <Textarea
          rows={3}
          value={feedbackQnA}
          onChange={(e) => setFeedbackQnA(e.target.value)}
          placeholder="สรุปข้อซักถาม ข้อเสนอแนะ หรือความต้องการเพิ่มเติมจากผู้เข้าประชุม"
          className="bg-white border-slate-300"
        />
      </div>

      {/* GalleryUpload Standard */}
      <div className="bg-purple-50/20 border border-purple-200/70 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 border-b border-purple-100 pb-2.5">
          <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center border border-purple-200">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-purple-950">
              รูปภาพบรรยากาศการประชุม
            </h4>
            <p className="text-[11px] text-purple-700/80">
              อัปโหลดรูปภาพบรรยากาศการจัดประชุม หรือกิจกรรมที่เกิดขึ้น (สูงสุด 10 รูป)
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
