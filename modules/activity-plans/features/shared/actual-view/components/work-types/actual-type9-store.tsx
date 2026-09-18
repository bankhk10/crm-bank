"use client";

import React, { useState } from "react";
import { Store, Package, ShoppingBag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ActualTargetCard } from "../actual-target-card";
import { ImageFile } from "../../types";
import GalleryUpload from "@/components/custom/gallery-upload";
import type { FileWithPreview } from "@/hooks/use-file-upload";
import {
  convertToFileMetadata,
  filesWithPreviewToImageFiles,
  isImageFilesEqual,
} from "../../utils";

export interface Type9TargetProductItem {
  id?: string;
  productName: string;
  quantityCases?: number;
  pricePerCase?: number;
  totalAmount?: number;
  actualQuantityCases?: number | string;
  actualSales?: number | string;
}

export interface Type9ProductSaleDetail {
  id?: string;
  productName: string;
  actualQuantityCases?: string;
  actualSales?: string;
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
  formats?: string[];
  setFormats?: (v: string[]) => void;
  actualSales: string;
  setActualSales: (v: string) => void;
  productSalesDetails?: Type9ProductSaleDetail[];
  setProductSalesDetails?: (v: Type9ProductSaleDetail[]) => void;
  actualAttendees?: string;
  setActualAttendees?: (v: string) => void;
  images: ImageFile[];
  setImages: (v: ImageFile[]) => void;
  onUploadImages?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage?: (id: string) => void;
}

export function ActualType9Store({
  isVisible,
  target,
  actualSales,
  setActualSales,
  productSalesDetails,
  setProductSalesDetails,
  images = [],
  setImages,
}: ActualType9StoreProps) {
  const [localItems, setLocalItems] = useState<Type9TargetProductItem[]>(
    () => {
      if (target.items && target.items.length > 0) {
        return target.items.map((item, idx) => {
          const saved =
            productSalesDetails?.find(
              (d) =>
                (item.id && d.id === item.id) ||
                d.productName === item.productName,
            ) || productSalesDetails?.[idx];

          return {
            ...item,
            actualQuantityCases:
              saved?.actualQuantityCases ?? item.actualQuantityCases ?? "",
            actualSales: saved?.actualSales ?? item.actualSales ?? "",
          };
        });
      }
      return [];
    },
  );

  if (!isVisible) return null;

  const hasMultipleProducts = localItems && localItems.length > 0;

  const handleItemChange = (
    index: number,
    field: "actualQuantityCases" | "actualSales",
    value: string,
  ) => {
    const updated = [...localItems];
    const currentItem = { ...updated[index], [field]: value };

    // Auto-calculate actualSales when actualQuantityCases changes and pricePerCase exists
    if (field === "actualQuantityCases") {
      const sanitized = value.replace(/,/g, "").trim();
      const qtyNum = parseFloat(sanitized);
      const price = currentItem.pricePerCase || 0;
      if (value === "") {
        currentItem.actualSales = "";
      } else if (price > 0 && !isNaN(qtyNum)) {
        currentItem.actualSales = (qtyNum * price).toLocaleString();
      }
    }

    updated[index] = currentItem;
    setLocalItems(updated);

    // Sync to parent
    if (setProductSalesDetails) {
      setProductSalesDetails(
        updated.map((item) => ({
          id: item.id,
          productName: item.productName,
          actualQuantityCases: String(item.actualQuantityCases ?? ""),
          actualSales: String(item.actualSales ?? ""),
        })),
      );
    }

    // Auto-sum total actual sales across all products
    let hasAnySales = false;
    const totalActual = updated.reduce((sum, item) => {
      const valStr = String(item.actualSales ?? "").trim();
      if (valStr !== "") {
        hasAnySales = true;
        const val = parseFloat(valStr.replace(/,/g, "")) || 0;
        return sum + val;
      }
      return sum;
    }, 0);

    if (hasAnySales) {
      setActualSales(totalActual > 0 ? totalActual.toLocaleString() : "0");
    } else {
      setActualSales("");
    }
  };

  const handleFilesChange = (files: FileWithPreview[]) => {
    const converted = filesWithPreviewToImageFiles(files);
    if (!isImageFilesEqual(images, converted) && setImages) {
      setImages(converted);
    }
  };

  return (
    <div className="border border-blue-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-4 shadow-xs">
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
        gridColsClass="grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
        items={[
          { label: "ร้านค้าเป้าหมาย:", value: target.store || "-" },
          ...(target.subDealerStore
            ? [{ label: "ร้านค้าซับดีลเลอร์:", value: target.subDealerStore }]
            : []),
          { label: "สินค้าเป้าหมาย:", value: target.product || "-" },
          {
            label: "เป้ายอดขาย:",
            value: target.targetSales ? `฿${target.targetSales}` : "-",
          },
          ...(target.targetAttendees
            ? [
                {
                  label: "เป้าหมายผู้เข้าร่วม:",
                  value: `${target.targetAttendees} คน`,
                },
              ]
            : []),
        ]}
      />

      {/* MULTI-PRODUCT ACTUAL SALES TABLE (FROM TARGET ITEMS) */}
      {hasMultipleProducts ? (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              บันทึกยอดขายจริงตามรายการสินค้า ({localItems.length} รายการ)
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              จากแผนงาน
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 text-center w-10">ลำดับ</th>
                  <th className="py-2.5 px-3">ชื่อสินค้า</th>
                  <th className="py-2.5 px-3 text-center w-28">
                    เป้าจำนวน (ลัง)
                  </th>
                  <th className="py-2.5 px-3 text-center w-32">
                    เป้ายอดขาย (บาท)
                  </th>
                  <th className="py-2.5 px-3 text-center w-36 bg-blue-50/50">
                    ขายได้จริง (ลัง) <span className="text-rose-500">*</span>
                  </th>
                  <th className="py-2.5 px-3 text-center w-40 bg-blue-50/50">
                    ยอดขายจริง (บาท) <span className="text-rose-500">*</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {localItems.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-center text-slate-500 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>{item.productName}</span>
                      </div>
                      {item.pricePerCase ? (
                        <span className="text-[10px] text-slate-400 font-normal block pl-5">
                          ฿{item.pricePerCase.toLocaleString()} / ลัง
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-600 font-medium">
                      {item.quantityCases ? `${item.quantityCases} ลัง` : "-"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600 font-semibold">
                      {item.totalAmount
                        ? `฿${item.totalAmount.toLocaleString()}`
                        : "-"}
                    </td>
                    <td className="py-2 px-3 text-center bg-blue-50/30">
                      <Input
                        type="number"
                        min="0"
                        value={item.actualQuantityCases ?? ""}
                        onChange={(e) =>
                          handleItemChange(
                            idx,
                            "actualQuantityCases",
                            e.target.value,
                          )
                        }
                        placeholder="0"
                        className="h-8 text-center bg-white border-blue-200 text-xs w-28 mx-auto font-medium"
                      />
                    </td>
                    <td className="py-2 px-3 text-center bg-blue-50/30">
                      <Input
                        type="text"
                        value={item.actualSales ?? ""}
                        onChange={(e) =>
                          handleItemChange(idx, "actualSales", e.target.value)
                        }
                        placeholder="0.00"
                        className="h-8 text-right bg-white border-blue-200 text-xs w-32 mx-auto font-bold text-blue-900"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200 text-xs font-bold">
                <tr>
                  <td colSpan={4} className="py-2.5 px-3 text-right text-slate-700">
                    ยอดขายจริงรวมทั้งหมด:
                  </td>
                  <td
                    colSpan={2}
                    className="py-2.5 px-3 text-right font-extrabold text-blue-900 text-sm"
                  >
                    ฿{actualSales || "0.00"} บาท
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        /* SINGLE PRODUCT / FALLBACK ACTUAL SALES INPUT */
        <div className="space-y-1.5 pt-1">
          <label className="text-sm font-semibold text-slate-800">
            ยอดขายจริงที่ทำได้ (บาท) <span className="text-rose-500">*</span>
          </label>
          <div className="relative max-w-xs">
            <Input
              type="text"
              value={actualSales}
              onChange={(e) => setActualSales(e.target.value)}
              placeholder="0.00"
              className="bg-white border-slate-300 pr-12 font-bold text-blue-800"
            />
            <span className="absolute right-3 top-2.5 text-xs font-semibold text-slate-500">
              บาท
            </span>
          </div>
        </div>
      )}

      {/* GalleryUpload Standard */}
      <div className="bg-blue-50/20 border border-blue-200/70 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 border-b border-blue-100 pb-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center border border-blue-200">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-blue-950">
              รูปภาพบรรยากาศหน้าร้าน
            </h4>
            <p className="text-[11px] text-blue-700/80">
              อัปโหลดรูปภาพบรรยากาศการจัดกิจกรรมส่งเสริมการขายหน้าร้าน (สูงสุด 10 รูป)
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
