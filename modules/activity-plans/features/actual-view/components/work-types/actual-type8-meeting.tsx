"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Users, ShoppingBag, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ActualTargetCard } from "../actual-target-card";
import { ImageFile } from "../../types";

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
  onUploadImages: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (id: string) => void;
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
  images,
  onUploadImages,
  onRemoveImage,
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
  >([]);

  useEffect(() => {
    if (productSalesDetails && productSalesDetails.length > 0) {
      setLocalProductSales(productSalesDetails);
    } else if (productList.length > 0) {
      setLocalProductSales(
        productList.map((pName) => ({
          productName: pName,
          actualQty: "",
          actualSales: "",
        })),
      );
    }
  }, [productList, productSalesDetails]);

  if (!isVisible) return null;

  const currentSalesList =
    localProductSales.length > 0
      ? localProductSales
      : productList.map((p) => ({
          productName: p,
          actualQty: "",
          actualSales: "",
        }));

  const handleProductSaleChange = (
    index: number,
    field: "actualQty" | "actualSales",
    value: string,
  ) => {
    const updated = [...currentSalesList];
    updated[index] = { ...updated[index], [field]: value };
    setLocalProductSales(updated);
    if (setProductSalesDetails) {
      setProductSalesDetails(updated);
    }
  };

  const totalSalesSum = currentSalesList.reduce(
    (sum, item) => sum + (Number(item.actualSales) || 0),
    0,
  );

  return (
    <div className="border-2 border-violet-500 rounded-2xl p-4 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-violet-100 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-white font-bold text-sm shadow-2xs">
            8
          </span>
          <h2 className="font-bold text-violet-900 text-base md:text-lg">
            จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์
          </h2>
        </div>
      </div>

      <ActualTargetCard
        iconColorClass="text-violet-600"
        badgeColorClass="bg-violet-100 text-violet-800"
        gridColsClass="grid-cols-1 sm:grid-cols-3"
        items={[
          { label: "หัวข้อประชุม:", value: target.topic },
          { label: "สินค้าเป้าหมาย:", value: target.products },
          {
            label: "เป้าหมายผู้เข้าร่วม:",
            value: target.targetAttendees,
            highlight: true,
          },
        ]}
      />

      {/* Target Products Sales Detail Section */}
      {productList.length > 0 && (
        <div className="space-y-3 bg-violet-50/50 border border-violet-100 rounded-2xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-sm font-bold text-violet-900 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-violet-600" />
              จำนวนและยอดขายที่ทำได้จริง (แยกตามสินค้าเป้าหมาย)
            </label>
            {totalSalesSum > 0 && (
              <span className="text-xs font-extrabold text-violet-700 bg-violet-100 px-2.5 py-0.5 rounded-full">
                ยอดขายรวม {totalSalesSum.toLocaleString()} บาท
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentSalesList.map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-3.5 rounded-xl border border-violet-200/80 shadow-2xs space-y-2.5"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    {item.productName}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">
                      จำนวนที่ขายได้ / จอง
                    </label>
                    <Input
                      type="text"
                      value={item.actualQty}
                      onChange={(e) =>
                        handleProductSaleChange(
                          idx,
                          "actualQty",
                          e.target.value,
                        )
                      }
                      placeholder="เช่น 10 ลัง"
                      className="bg-white border-slate-300 text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">
                      ยอดขายรวม (บาท)
                    </label>
                    <div className="relative flex items-center">
                      <Input
                        type="number"
                        min="0"
                        value={item.actualSales}
                        onChange={(e) =>
                          handleProductSaleChange(
                            idx,
                            "actualSales",
                            e.target.value,
                          )
                        }
                        placeholder="ระบุยอดขาย"
                        className="bg-white border-slate-300 text-xs h-9 pr-8"
                      />
                      <span className="absolute right-2.5 text-[10px] font-medium text-slate-400">
                        บาท
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1.5 max-w-xs pt-1">
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
          ประเด็นคำถามหรือข้อเสนอแนะที่ได้รับ{" "}
          <span className="text-rose-500">*</span>
        </label>
        <Textarea
          rows={3}
          value={feedbackQnA}
          onChange={(e) => setFeedbackQnA(e.target.value)}
          placeholder="สรุปข้อซักถาม ข้อเสนอแนะ หรือความต้องการเพิ่มเติมจากผู้เข้าประชุม"
          className="bg-white border-slate-300"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-800">
          รูปภาพบรรยากาศการประชุม <span className="text-rose-500">*</span>
        </label>
        <div className="border-2 border-dashed border-violet-200 hover:border-violet-400 bg-violet-50/20 hover:bg-violet-50/40 rounded-2xl p-5 text-center transition-colors cursor-pointer relative group">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={onUploadImages}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-violet-900">
              คลิกเพื่ออัปโหลด รูปบรรยากาศการจัดประชุม
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
