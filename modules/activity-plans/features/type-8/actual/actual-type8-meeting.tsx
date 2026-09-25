"use client";

import React, { useState, useEffect } from "react";
import { Users, ShoppingBag, Package, ClipboardCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ActualTargetCard } from "@/modules/activity-plans/features/shared/actual-view/components/actual-target-card";
import { ImageFile } from "@/modules/activity-plans/features/shared/actual-view/types";
import GalleryUpload from "@/components/custom/gallery-upload";
import type { FileWithPreview } from "@/hooks/use-file-upload";
import {
  convertToFileMetadata,
  filesWithPreviewToImageFiles,
  isImageFilesEqual,
} from "@/modules/activity-plans/features/shared/actual-view/utils";

export interface Type8PromotionProductItem {
  id?: string;
  productId: string;
  productName: string;
  quantity?: number;
  unitPrice?: number;
  totalAmount?: number;
  notes?: string;
  storeId?: string | null;
  actualQty?: string;
  actualSales?: string;
}

export interface ProductSaleDetail {
  id?: string;
  productId?: string;
  productName: string;
  actualQty: string;
  actualSales: string;
  unitPrice?: number;
}

interface ActualType8MeetingProps {
  isVisible: boolean;
  target: {
    topic: string;
    products: string;
    targetAttendees: string;
    customer?: string;
    dealerName?: string;
    subDealerStore?: string;
    detail?: string;
    targetProducts?: string[];
    promotionalProducts?: Array<{
      id?: string;
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      totalAmount: number;
      notes?: string;
      storeId?: string | null;
    }>;
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
  registrationImages?: ImageFile[];
  setRegistrationImages?: (v: ImageFile[]) => void;
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
  registrationImages = [],
  setRegistrationImages,
}: ActualType8MeetingProps) {
  const plannedPromoProducts = target.promotionalProducts || [];

  const [localPromoItems, setLocalPromoItems] = useState<
    Type8PromotionProductItem[]
  >(() => {
    if (plannedPromoProducts.length > 0) {
      return plannedPromoProducts.map((item, idx) => {
        // Match with previously saved actual results by productId as primary key
        const saved =
          productSalesDetails?.find(
            (d) =>
              (item.productId && d.productId === item.productId) ||
              (item.id && d.id === item.id) ||
              d.productName === item.productName,
          ) || productSalesDetails?.[idx];

        return {
          ...item,
          actualQty: saved?.actualQty ?? "",
          actualSales: saved?.actualSales ?? "",
        };
      });
    }
    return [];
  });

  // Keep local items synchronized on asynchronous hydration
  useEffect(() => {
    if (
      plannedPromoProducts.length > 0 &&
      productSalesDetails &&
      productSalesDetails.length > 0
    ) {
      setLocalPromoItems((prev) =>
        plannedPromoProducts.map((item, idx) => {
          const saved =
            productSalesDetails.find(
              (d) =>
                (item.productId && d.productId === item.productId) ||
                (item.id && d.id === item.id) ||
                d.productName === item.productName,
            ) || productSalesDetails[idx];

          const existing = prev[idx];
          return {
            ...item,
            actualQty:
              saved?.actualQty ?? existing?.actualQty ?? "",
            actualSales:
              saved?.actualSales ?? existing?.actualSales ?? "",
          };
        }),
      );
    }
  }, [productSalesDetails, target.promotionalProducts]);

  if (!isVisible) return null;

  const handlePromoItemChange = (
    index: number,
    field: "actualQty" | "actualSales",
    value: string,
  ) => {
    const updated = [...localPromoItems];
    const currentItem = { ...updated[index], [field]: value };

    // Auto-calculate actualSales when actualQty changes and unitPrice exists
    if (field === "actualQty") {
      const sanitized = value.replace(/,/g, "").trim();
      const qtyNum = parseFloat(sanitized);
      const price = currentItem.unitPrice || 0;
      if (value === "") {
        currentItem.actualSales = "";
      } else if (price > 0 && !isNaN(qtyNum)) {
        currentItem.actualSales = (qtyNum * price).toLocaleString();
      }
    }

    updated[index] = currentItem;
    setLocalPromoItems(updated);

    if (setProductSalesDetails) {
      setProductSalesDetails(
        updated.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          actualQty: String(item.actualQty ?? ""),
          actualSales: String(item.actualSales ?? ""),
          unitPrice: item.unitPrice,
        })),
      );
    }
  };

  const handleAtmosphereFilesChange = (files: FileWithPreview[]) => {
    const converted = filesWithPreviewToImageFiles(files);
    if (!isImageFilesEqual(images, converted) && setImages) {
      setImages(converted);
    }
  };

  const handleRegistrationFilesChange = (files: FileWithPreview[]) => {
    const converted = filesWithPreviewToImageFiles(files);
    if (
      !isImageFilesEqual(registrationImages, converted) &&
      setRegistrationImages
    ) {
      setRegistrationImages(converted);
    }
  };

  // Calculate totals for table footer
  const totalPlannedQty = localPromoItems.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0,
  );
  const totalPlannedSales = localPromoItems.reduce(
    (sum, item) => sum + (item.totalAmount || 0),
    0,
  );
  const totalActualQty = localPromoItems.reduce((sum, item) => {
    const q = parseFloat(String(item.actualQty || "").replace(/,/g, ""));
    return sum + (isNaN(q) ? 0 : q);
  }, 0);
  const totalActualSales = localPromoItems.reduce((sum, item) => {
    const s = parseFloat(String(item.actualSales || "").replace(/,/g, ""));
    return sum + (isNaN(s) ? 0 : s);
  }, 0);

  return (
    <div className="border border-purple-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-purple-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center border border-purple-200">
            <Users className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-purple-900 text-base md:text-lg">
            บันทึกผลการปฏิบัติงาน — จัดประชุม (TYPE_8)
          </h2>
        </div>
      </div>

      {/* Target Plan Information Card */}
      <ActualTargetCard
        iconColorClass="text-purple-600"
        badgeColorClass="bg-purple-100 text-purple-800"
        gridColsClass="grid-cols-1 sm:grid-cols-3"
        items={[
          { label: "หัวข้อการประชุม:", value: target.topic || "-" },
          { label: "สินค้าแนะนำ:", value: target.products || "-" },
          {
            label: "เป้าหมายผู้เข้าร่วม:",
            value: target.targetAttendees
              ? `${target.targetAttendees} คน`
              : "-",
          },
        ]}
      />

      {/* Promotional Products Section */}
      <div className="space-y-2.5 pt-1 border-t border-purple-100/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <ShoppingBag className="w-4 h-4 text-purple-600" />
            <span>รายการสินค้าโปรโมชัน</span>
            {localPromoItems.length > 0 && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                {localPromoItems.length} รายการ
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400">
            ข้อมูลจากแผนงานเป็น Read-Only / บันทึกผลขายจริงในช่องสีม่วงอ่อน
          </span>
        </div>

        {localPromoItems.length > 0 ? (
          <div className="overflow-x-auto border border-purple-100 rounded-xl shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-50/60 text-purple-950 font-bold border-b border-purple-200/80">
                <tr>
                  <th className="py-2.5 px-3 text-center w-10">ลำดับ</th>
                  <th className="py-2.5 px-3 min-w-[160px]">ชื่อสินค้า</th>
                  <th className="py-2.5 px-3 text-center w-24">
                    เป้าจำนวน (ลัง)
                  </th>
                  <th className="py-2.5 px-3 text-right w-28">
                    เป้ายอดขาย (บาท)
                  </th>
                  <th className="py-2.5 px-3 min-w-[140px]">
                    รายละเอียด / เงื่อนไข
                  </th>
                  <th className="py-2.5 px-3 text-center w-32 bg-purple-100/40">
                    ขายได้จริง (ลัง)
                  </th>
                  <th className="py-2.5 px-3 text-center w-36 bg-purple-100/40">
                    ยอดขายจริง (บาท)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 bg-white">
                {localPromoItems.map((item, idx) => (
                  <tr key={item.id || item.productId || idx} className="hover:bg-purple-50/30">
                    <td className="py-2.5 px-3 text-center text-slate-500 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span>{item.productName}</span>
                      </div>
                      {item.unitPrice ? (
                        <span className="text-[10px] text-slate-400 font-normal block pl-5">
                          ฿{item.unitPrice.toLocaleString()} / ลัง
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-600 font-medium">
                      {item.quantity != null ? `${item.quantity} ลัง` : "-"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600 font-semibold">
                      {item.totalAmount != null
                        ? `฿${item.totalAmount.toLocaleString()}`
                        : "-"}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                      {item.notes || "-"}
                    </td>
                    <td className="py-2 px-3 text-center bg-purple-50/20">
                      <Input
                        type="number"
                        min="0"
                        value={item.actualQty ?? ""}
                        onChange={(e) =>
                          handlePromoItemChange(idx, "actualQty", e.target.value)
                        }
                        placeholder="0"
                        className="h-8 text-center bg-white border-purple-200 text-xs w-24 mx-auto font-medium focus-visible:ring-purple-400"
                      />
                    </td>
                    <td className="py-2 px-3 text-center bg-purple-50/20">
                      <Input
                        type="text"
                        value={item.actualSales ?? ""}
                        onChange={(e) =>
                          handlePromoItemChange(idx, "actualSales", e.target.value)
                        }
                        placeholder="0.00"
                        className="h-8 text-right bg-white border-purple-200 text-xs w-28 mx-auto font-bold text-purple-950 focus-visible:ring-purple-400"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-purple-50/80 font-bold text-purple-950 border-t border-purple-200 text-xs">
                <tr>
                  <td colSpan={2} className="py-2.5 px-3 text-right">
                    รวมทั้งสิ้น
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {totalPlannedQty > 0 ? `${totalPlannedQty.toLocaleString()} ลัง` : "-"}
                  </td>
                  <td className="py-2.5 px-3 text-right text-purple-900">
                    {totalPlannedSales > 0 ? `฿${totalPlannedSales.toLocaleString()}` : "-"}
                  </td>
                  <td></td>
                  <td className="py-2.5 px-3 text-center text-purple-900 bg-purple-100/50">
                    {totalActualQty > 0 ? `${totalActualQty.toLocaleString()} ลัง` : "-"}
                  </td>
                  <td className="py-2.5 px-3 text-right text-purple-900 font-extrabold bg-purple-100/50">
                    {totalActualSales > 0 ? `฿${totalActualSales.toLocaleString()}` : "-"}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-purple-50/30 border border-dashed border-purple-200 text-center text-xs text-purple-600">
            ไม่มีรายการสินค้าโปรโมชันที่วางแผนไว้สำหรับแผนงานนี้
          </div>
        )}
      </div>

      {/* Actual Attendees Count */}
      <div className="space-y-1.5 pt-1">
        <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
          <span>จำนวนผู้เข้าร่วมประชุมจริง (คน)</span>
          <span className="text-rose-500">*</span>
        </label>
        <Input
          type="number"
          min="0"
          value={actualAttendees}
          onChange={(e) => setActualAttendees(e.target.value)}
          placeholder="ระบุจำนวนผู้เข้าร่วมจริง เช่น 25"
          className="bg-white border-slate-300 max-w-xs h-9"
        />
      </div>

      {/* Feedback & QnA */}
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

      {/* SECTION 1: Participant Registration Photos (Required: 1-5 Photos) */}
      <div className="bg-purple-50/20 border border-purple-200/90 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-purple-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center border border-purple-200">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs sm:text-sm font-bold text-purple-950">
                  รูปใบลงทะเบียนผู้เข้าร่วมงาน
                </h4>
                <span className="text-rose-500 font-bold">*</span>
              </div>
              <p className="text-[11px] text-purple-700/80">
                แนบรูปถ่ายใบลงทะเบียนผู้เข้าร่วมประชุม (จำเป็นต้องมี 1–5 รูป)
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
            {registrationImages.length}/5 รูป
          </span>
        </div>
        <GalleryUpload
          maxFiles={5}
          maxSize={20 * 1024 * 1024}
          accept="image/*"
          multiple={true}
          initialFiles={convertToFileMetadata(registrationImages || [])}
          onFilesChange={handleRegistrationFilesChange}
        />
      </div>

      {/* SECTION 2: Meeting Atmosphere Photos (Optional: max 10 photos) */}
      <div className="bg-purple-50/20 border border-purple-200/70 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-purple-100 pb-2.5">
          <div className="flex items-center gap-2">
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
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
            {images.length}/10 รูป
          </span>
        </div>
        <GalleryUpload
          maxFiles={10}
          maxSize={20 * 1024 * 1024}
          accept="image/*"
          multiple={true}
          initialFiles={convertToFileMetadata(images || [])}
          onFilesChange={handleAtmosphereFilesChange}
        />
      </div>
    </div>
  );
}
