"use client";

import React from "react";
import { Store, Package, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ActualTargetCard } from "../actual-target-card";
import { ImageFile } from "../../types";

export interface Type9TargetProductItem {
  id?: string;
  productName: string;
  quantityCases?: number;
  pricePerCase?: number;
  totalAmount?: number;
}

interface ActualType9StoreProps {
  isVisible: boolean;
  target: {
    store: string;
    isSubDealer?: boolean;
    subDealerStore?: string;
    product?: string;
    targetSales: string;
    targetAttendees?: string;
    items?: Type9TargetProductItem[];
  };
  formats: string[];
  setFormats: (v: string[]) => void;
  actualSales: string;
  setActualSales: (v: string) => void;
  actualAttendees: string;
  setActualAttendees: (v: string) => void;
  images: ImageFile[];
  onUploadImages: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (id: string) => void;
}

export function ActualType9Store({
  isVisible,
  target,
  formats,
  setFormats,
  actualSales,
  setActualSales,
  actualAttendees,
  setActualAttendees,
  images,
  onUploadImages,
  onRemoveImage,
}: ActualType9StoreProps) {
  if (!isVisible) return null;

  const toggleFormat = (fmt: string) => {
    if (formats.includes(fmt)) {
      setFormats(formats.filter((f) => f !== fmt));
    } else {
      setFormats([...formats, fmt]);
    }
  };

  const targetCardItems = [
    {
      label: target.isSubDealer ? "ร้านค้าหลัก (Dealer):" : "ร้านค้าจัดกิจกรรม:",
      value: target.store || "-",
    },
    ...(target.isSubDealer && target.subDealerStore
      ? [
          {
            label: "ชื่อร้านค้า Sub Dealer:",
            value: target.subDealerStore,
            highlight: true,
          },
        ]
      : []),
    {
      label: "เป้ายอดขายหน้าร้าน:",
      value: target.targetSales || "-",
      highlight: true,
    },
    ...(target.targetAttendees
      ? [{ label: "เป้าหมายผู้เข้าร่วม:", value: target.targetAttendees }]
      : []),
  ];

  return (
    <div className="border-2 border-blue-600 rounded-2xl p-4 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-blue-100 pb-3">
        <div className="flex items-center gap-2.5">
          <h2 className="font-bold text-blue-900 text-base md:text-lg">
            จัดกิจกรรมส่งเสริมการขายหน้าร้าน
          </h2>
        </div>
      </div>

      <ActualTargetCard
        iconColorClass="text-blue-600"
        badgeColorClass="bg-blue-100 text-blue-800"
        gridColsClass={cn(
          "grid-cols-1 sm:grid-cols-2",
          targetCardItems.length >= 3 && "md:grid-cols-3",
          targetCardItems.length >= 4 && "lg:grid-cols-4",
        )}
        items={targetCardItems}
      />

      {/* Planned Products Table */}
      {target.items && target.items.length > 0 && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-blue-600" />
              รายการสินค้าที่เสนอขาย / โปรโมชันหน้าร้าน (ตามแผนงาน):
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {target.items.length} รายการ
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2 px-3 text-center w-10">ลำดับ</th>
                  <th className="py-2 px-3 min-w-[180px]">สินค้า</th>
                  <th className="py-2 px-3 w-28 text-center">จำนวน (ลัง)</th>
                  <th className="py-2 px-3 w-32 text-right">ราคา/ลัง (บาท)</th>
                  <th className="py-2 px-3 w-36 text-right">ยอดรวมเป้าหมาย</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {target.items.map((item, idx) => {
                  const lineTotal =
                    item.totalAmount != null
                      ? item.totalAmount
                      : (item.quantityCases || 0) * (item.pricePerCase || 0);
                  return (
                    <tr key={item.id || idx} className="hover:bg-slate-50/60">
                      <td className="py-2 px-3 text-center font-medium text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900">
                        {item.productName || "-"}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {item.quantityCases != null
                          ? `${item.quantityCases.toLocaleString()} ลัง`
                          : "-"}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {item.pricePerCase != null
                          ? `฿${Number(item.pricePerCase).toLocaleString()}`
                          : "-"}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-blue-700">
                        ฿{lineTotal.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-blue-50/50 border-t border-blue-100 font-semibold text-xs">
                <tr>
                  <td colSpan={4} className="py-2 px-3 text-right text-slate-700">
                    รวมเป้ายอดขายสินค้า:
                  </td>
                  <td className="py-2 px-3 text-right text-blue-800 font-bold">
                    ฿
                    {target.items
                      .reduce(
                        (sum, item) =>
                          sum +
                          (item.totalAmount != null
                            ? item.totalAmount
                            : (item.quantityCases || 0) *
                              (item.pricePerCase || 0)),
                        0,
                      )
                      .toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-800">
            ยอดขายที่เกิดขึ้นจริง (บาท) <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <Input
              type="number"
              min="0"
              value={actualSales}
              onChange={(e) => setActualSales(e.target.value)}
              placeholder="0.00"
              className="bg-white border-slate-300 pr-12"
            />
            <span className="absolute right-3 text-xs font-semibold text-slate-500">
              บาท
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-800">
            จำนวนลูกค้าที่เข้าร่วมจริง (คน){" "}
            <span className="text-rose-500">*</span>
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
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-800">
          รูปภาพบรรยากาศ <span className="text-rose-500">*</span>
        </label>
        <div className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/20 hover:bg-blue-50/40 rounded-2xl p-5 text-center transition-colors cursor-pointer relative group">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={onUploadImages}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-blue-900">
              คลิกเพื่ออัปโหลด รูปภาพบรรยากาศหน้าร้าน
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
