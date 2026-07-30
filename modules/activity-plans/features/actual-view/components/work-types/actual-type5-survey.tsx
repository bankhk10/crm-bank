"use client";

import React from "react";
import { Camera, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ActualTargetCard } from "../actual-target-card";
import { ImageFile } from "../../types";

interface ActualType5SurveyProps {
  isVisible: boolean;
  target: {
    store: string;
    product: string;
    detail: string;
  };
  competitorBrand: string;
  setCompetitorBrand: (v: string) => void;
  competitorProduct: string;
  setCompetitorProduct: (v: string) => void;
  competitorPrice: string;
  setCompetitorPrice: (v: string) => void;
  promotionDetail: string;
  setPromotionDetail: (v: string) => void;
  priceTagImages: ImageFile[];
  onUploadImages: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (id: string) => void;
}

export function ActualType5Survey({
  isVisible,
  target,
  competitorBrand,
  setCompetitorBrand,
  competitorProduct,
  setCompetitorProduct,
  competitorPrice,
  setCompetitorPrice,
  promotionDetail,
  setPromotionDetail,
  priceTagImages,
  onUploadImages,
  onRemoveImage,
}: ActualType5SurveyProps) {
  if (!isVisible) return null;

  return (
    <div className="border-2 border-amber-500 rounded-2xl p-4 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-amber-100 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-600 text-white font-bold text-sm shadow-2xs">
            5
          </span>
          <h2 className="font-bold text-amber-900 text-base md:text-lg">
            สำรวจตลาดของคู่แข่ง
          </h2>
        </div>
      </div>

      <ActualTargetCard
        iconColorClass="text-amber-600"
        badgeColorClass="bg-amber-100 text-amber-800"
        gridColsClass="grid-cols-1 sm:grid-cols-2"
        items={[
          { label: "ร้านค้าที่สำรวจ:", value: target.store },
          { label: "สินค้าเปรียบเทียบ:", value: target.product },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-800">
            แบรนด์คู่แข่งที่พบหน้างาน <span className="text-rose-500">*</span>
          </label>
          <Input
            value={competitorBrand}
            onChange={(e) => setCompetitorBrand(e.target.value)}
            placeholder="เช่น ตราเกษตรทองคำ, เสือคู่"
            className="bg-white border-slate-300"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-800">
            สินค้าคู่แข่ง <span className="text-rose-500">*</span>
          </label>
          <Input
            value={competitorProduct}
            onChange={(e) => setCompetitorProduct(e.target.value)}
            placeholder="เช่น ปุ๋ยสูตร 20-20-20 (1 ลิตร)"
            className="bg-white border-slate-300"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-800">
            ราคาของคู่แข่ง <span className="text-rose-500">*</span>
          </label>
          <Input
            value={competitorPrice}
            onChange={(e) => setCompetitorPrice(e.target.value)}
            placeholder=""
            className="bg-white border-slate-300"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-800">
          โปรโมชันของคู่แข่งในช่วงนี้
        </label>
        <Textarea
          rows={2}
          value={promotionDetail}
          onChange={(e) => setPromotionDetail(e.target.value)}
          placeholder="เช่น ซื้อ 10 แถม 1 หรือ มีของแถมพรีเมียมหน้าร้าน"
          className="bg-white border-slate-300"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-800">
          รูปภาพป้ายราคา / ชั้นวางสินค้า
        </label>
        <div className="border-2 border-dashed border-amber-200 hover:border-amber-400 bg-amber-50/20 hover:bg-amber-50/40 rounded-2xl p-5 text-center transition-colors cursor-pointer relative group">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={onUploadImages}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-amber-900">
              คลิกเพื่ออัปโหลด รูปชั้นวางสินค้า หรือ ป้ายราคาคู่แข่ง
            </p>
          </div>
        </div>
        {priceTagImages.length > 0 && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
            {priceTagImages.map((img) => (
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
