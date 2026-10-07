"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Users,
  ShoppingBag,
  Package,
  ClipboardCheck,
  Target,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageFile } from "@/modules/activity-plans/features/shared/actual-view/types";
import GalleryUpload from "@/components/custom/gallery-upload";
import type { FileWithPreview } from "@/hooks/use-file-upload";
import {
  convertToFileMetadata,
  filesWithPreviewToImageFiles,
  isImageFilesEqual,
} from "@/modules/activity-plans/features/shared/actual-view/utils";
import {
  ActivityProductSelect,
  type ActivityProductItem,
} from "@/components/activity/activity-product-select";
import { listProductsAction } from "@/modules/products/server/actions";

import { Type8PlanCard } from "../shared/type8-plan-card";
import {
  ProductSaleDetail,
  ActualType8MeetingProps,
} from "./types";

export type { ProductSaleDetail, ActualType8MeetingProps };

interface TargetSaleRow {
  productId?: string;
  productName: string;
  actualQty: string;
  notes: string;
}

interface AdditionalSaleRow {
  id: string;
  productId?: string;
  productName: string;
  actualQty: string;
  notes: string;
}

export function ActualType8Meeting({
  isVisible,
  planType,
  target,
  products = [],
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
  // Local fallback active products loaded from master DB if not passed via props
  const [dbProducts, setDbProducts] = useState<
    Array<{ id: string; name: string; productCode?: string | null }>
  >([]);

  useEffect(() => {
    let isMounted = true;
    if (!products || products.length === 0) {
      listProductsAction({ status: "ACTIVE", perPage: 1000 })
        .then((res: any) => {
          if (isMounted && res?.products && res.products.length > 0) {
            setDbProducts(res.products);
          } else if (isMounted && res?.data && res.data.length > 0) {
            setDbProducts(res.data);
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [products]);

  const activeProducts = useMemo(() => {
    return products && products.length > 0 ? products : dbProducts;
  }, [products, dbProducts]);

  // Read-only Promotional items from Plan
  const plannedPromoProducts = target?.promotionalProducts || [];

  // Resolve Target Products from Plan
  const plannedTargetProducts = useMemo(() => {
    if (target?.targetProductItems && target.targetProductItems.length > 0) {
      return target.targetProductItems.map((p) => ({
        productId: p.productId,
        productName: p.productName,
      }));
    }
    if (target?.targetProducts && target.targetProducts.length > 0) {
      return target.targetProducts.map((pName) => {
        const matched = activeProducts.find((p) => p.name === pName);
        return {
          productId: matched?.id,
          productName: pName,
        };
      });
    }
    if (target?.products) {
      return target.products
        .split(", ")
        .filter(Boolean)
        .map((pName) => {
          const matched = activeProducts.find((p) => p.name === pName);
          return {
            productId: matched?.id,
            productName: pName,
          };
        });
    }
    return [];
  }, [
    target?.targetProductItems,
    target?.targetProducts,
    target?.products,
    activeProducts,
  ]);

  // Target Products Actual Sales State
  const [targetSales, setTargetSales] = useState<TargetSaleRow[]>(() => {
    return plannedTargetProducts.map((p) => {
      const saved = productSalesDetails?.find(
        (d) =>
          !d.isAdditional &&
          ((p.productId && d.productId === p.productId) ||
            d.productName === p.productName),
      );
      return {
        productId: p.productId,
        productName: p.productName,
        actualQty: saved?.actualQty ?? "",
        notes: saved?.notes ?? "",
      };
    });
  });

  // Additional / Off-target Products Sales State
  const [additionalSales, setAdditionalSales] = useState<AdditionalSaleRow[]>(
    () => {
      const savedAdditional = productSalesDetails?.filter((d) => d.isAdditional);
      if (savedAdditional && savedAdditional.length > 0) {
        return savedAdditional.map((d, idx) => ({
          id: d.id || `add-${idx + 1}`,
          productId: d.productId,
          productName: d.productName,
          actualQty: d.actualQty ?? "",
          notes: d.notes ?? "",
        }));
      }
      return [];
    },
  );

  // Sync state whenever external productSalesDetails or plannedTargetProducts change (e.g. hydration)
  const isHydratedRef = useRef(false);
  useEffect(() => {
    if (plannedTargetProducts.length > 0) {
      setTargetSales((prev) =>
        plannedTargetProducts.map((p, idx) => {
          const saved = productSalesDetails?.find(
            (d) =>
              !d.isAdditional &&
              ((p.productId && d.productId === p.productId) ||
                d.productName === p.productName),
          );
          const existing = prev[idx];
          return {
            productId: p.productId || existing?.productId,
            productName: p.productName,
            actualQty: saved?.actualQty ?? existing?.actualQty ?? "",
            notes: saved?.notes ?? existing?.notes ?? "",
          };
        }),
      );
    }

    if (productSalesDetails && productSalesDetails.length > 0) {
      const savedAdditional = productSalesDetails.filter((d) => d.isAdditional);
      if (savedAdditional.length > 0 && !isHydratedRef.current) {
        isHydratedRef.current = true;
        setAdditionalSales(
          savedAdditional.map((d, idx) => ({
            id: d.id || `add-${idx + 1}`,
            productId: d.productId,
            productName: d.productName,
            actualQty: d.actualQty ?? "",
            notes: d.notes ?? "",
          })),
        );
      }
    }
  }, [productSalesDetails, plannedTargetProducts]);

  // Synchronize both datasets to parent Form State
  const syncToParent = (
    updatedTarget: TargetSaleRow[],
    updatedAdditional: AdditionalSaleRow[],
  ) => {
    if (!setProductSalesDetails) return;

    const combined: ProductSaleDetail[] = [
      ...updatedTarget.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        actualQty: String(item.actualQty ?? ""),
        notes: item.notes?.trim() || undefined,
        isAdditional: false,
      })),
      ...updatedAdditional.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        actualQty: String(item.actualQty ?? ""),
        notes: item.notes?.trim() || undefined,
        isAdditional: true,
      })),
    ];

    setProductSalesDetails(combined);
  };

  const handleTargetChange = (
    index: number,
    field: "actualQty" | "notes",
    value: string,
  ) => {
    const updated = [...targetSales];
    updated[index] = { ...updated[index], [field]: value };
    setTargetSales(updated);
    syncToParent(updated, additionalSales);
  };

  const handleAddAdditionalRow = () => {
    const newRow: AdditionalSaleRow = {
      id: `add-${Date.now()}`,
      productId: "",
      productName: "",
      actualQty: "",
      notes: "",
    };
    const updated = [...additionalSales, newRow];
    setAdditionalSales(updated);
    syncToParent(targetSales, updated);
  };

  const handleUpdateAdditionalRow = (
    index: number,
    field: "productId" | "productName" | "actualQty" | "notes",
    value: string,
  ) => {
    const updated = [...additionalSales];
    const row = { ...updated[index], [field]: value };

    if (field === "productName") {
      const found = activeProducts.find((p) => p.name === value);
      if (found) {
        row.productId = found.id;
      }
    }
    if (field === "productId") {
      const found = activeProducts.find((p) => p.id === value);
      if (found) {
        row.productName = found.name;
      }
    }

    updated[index] = row;
    setAdditionalSales(updated);
    syncToParent(targetSales, updated);
  };

  const handleDeleteAdditionalRow = (index: number) => {
    const updated = additionalSales.filter((_, idx) => idx !== index);
    setAdditionalSales(updated);
    syncToParent(targetSales, updated);
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

  if (!isVisible) return null;

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
      <Type8PlanCard target={target} planType={planType} hidePromotionsTable />

      {/* 1. READ-ONLY PROMOTION LIST SECTION */}
      <div className="space-y-2.5 pt-1 border-t border-purple-100/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <ShoppingBag className="w-4 h-4 text-purple-600" />
            <span>รายการโปรโมชันจากแผนงาน</span>
            {plannedPromoProducts.length > 0 && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                {plannedPromoProducts.length} รายการ
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400">
            ข้อมูลโปรโมชันตามแผนงาน (Read-only)
          </span>
        </div>

        {plannedPromoProducts.length > 0 ? (
          <div className="overflow-x-auto border border-purple-100 rounded-xl shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-50/60 text-purple-950 font-bold border-b border-purple-200/80">
                <tr>
                  <th className="py-2.5 px-3 text-center w-12">ลำดับ</th>
                  <th className="py-2.5 px-3">รายละเอียด (โปรโมชัน)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 bg-white">
                {plannedPromoProducts.map((item, idx) => (
                  <tr
                    key={item.id || idx}
                    className="hover:bg-purple-50/30 transition-colors"
                  >
                    <td className="py-2.5 px-3 text-center text-slate-500 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium whitespace-pre-wrap">
                      {item.notes || item.productName || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-purple-50/30 border border-dashed border-purple-200 text-center text-xs text-purple-600">
            ไม่มีรายการโปรโมชันที่ระบุไว้ในแผนงานนี้
          </div>
        )}
      </div>

      {/* 2. TARGET PRODUCTS ACTUAL SALES SECTION */}
      <div className="space-y-2.5 pt-1 border-t border-purple-100/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Target className="w-4 h-4 text-purple-600" />
            <span>ผลการขายสินค้าเป้าหมาย (ตามแผนงาน)</span>
            {targetSales.length > 0 && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                {targetSales.length} สินค้า
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400">
            กรอกจำนวนที่ขายได้จริงสำหรับสินค้าเป้าหมาย
          </span>
        </div>

        {targetSales.length > 0 ? (
          <div className="overflow-x-auto border border-purple-100 rounded-xl shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-50/60 text-purple-950 font-bold border-b border-purple-200/80">
                <tr>
                  <th className="py-2.5 px-3 text-center w-12">ลำดับ</th>
                  <th className="py-2.5 px-3 min-w-[180px]">ชื่อสินค้าเป้าหมาย</th>
                  <th className="py-2.5 px-3 text-center w-36 bg-purple-100/40">
                    จำนวนที่ขายได้ (ลัง)
                  </th>
                  <th className="py-2.5 px-3 min-w-[200px]">
                    รายละเอียดเพิ่มเติม
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 bg-white">
                {targetSales.map((item, idx) => (
                  <tr key={idx} className="hover:bg-purple-50/30">
                    <td className="py-2.5 px-3 text-center text-slate-500 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span>{item.productName}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center bg-purple-50/20">
                      <Input
                        type="number"
                        min="0"
                        value={item.actualQty ?? ""}
                        onChange={(e) =>
                          handleTargetChange(idx, "actualQty", e.target.value)
                        }
                        placeholder="0"
                        className="h-8 text-center bg-white border-purple-200 text-xs w-28 mx-auto font-medium focus-visible:ring-purple-400"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        type="text"
                        value={item.notes ?? ""}
                        onChange={(e) =>
                          handleTargetChange(idx, "notes", e.target.value)
                        }
                        placeholder="ระบุรายละเอียด เช่น เงื่อนไขที่ตกลง..."
                        className="h-8 bg-white border-slate-200 text-xs focus-visible:ring-purple-400"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-purple-50/30 border border-dashed border-purple-200 text-center text-xs text-purple-600">
            ไม่มีสินค้าเป้าหมายที่ระบุไว้ในแผนงาน
          </div>
        )}
      </div>

      {/* 3. OFF-TARGET / ADDITIONAL PRODUCTS SALES SECTION */}
      <div className="space-y-2.5 pt-1 border-t border-purple-100/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>สินค้าที่ขายได้นอกเหนือจากสินค้าเป้าหมาย</span>
            {additionalSales.length > 0 && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                {additionalSales.length} รายการ
              </span>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddAdditionalRow}
            className="h-8 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            เพิ่มสินค้านอกแผน
          </Button>
        </div>

        {additionalSales.length > 0 ? (
          <div className="overflow-x-auto border border-purple-100 rounded-xl shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-50/60 text-purple-950 font-bold border-b border-purple-200/80">
                <tr>
                  <th className="py-2.5 px-3 text-center w-12">ลำดับ</th>
                  <th className="py-2.5 px-3 min-w-[220px]">ชื่อสินค้า</th>
                  <th className="py-2.5 px-3 text-center w-36 bg-purple-100/40">
                    จำนวนที่ขายได้ (ลัง)
                  </th>
                  <th className="py-2.5 px-3 min-w-[200px]">
                    รายละเอียดเพิ่มเติม
                  </th>
                  <th className="py-2.5 px-3 text-center w-12">ลบ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 bg-white">
                {additionalSales.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-purple-50/30">
                    <td className="py-2.5 px-3 text-center text-slate-500 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3">
                      <ActivityProductSelect
                        value={item.productName}
                        products={activeProducts as ActivityProductItem[]}
                        placeholder="ค้นหาหรือเลือกสินค้า..."
                        onChange={(val, prod) => {
                          handleUpdateAdditionalRow(
                            idx,
                            "productName",
                            prod?.name || val,
                          );
                        }}
                      />
                    </td>
                    <td className="py-2 px-3 text-center bg-purple-50/20">
                      <Input
                        type="number"
                        min="0"
                        value={item.actualQty ?? ""}
                        onChange={(e) =>
                          handleUpdateAdditionalRow(
                            idx,
                            "actualQty",
                            e.target.value,
                          )
                        }
                        placeholder="0"
                        className="h-8 text-center bg-white border-purple-200 text-xs w-28 mx-auto font-medium focus-visible:ring-purple-400"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        type="text"
                        value={item.notes ?? ""}
                        onChange={(e) =>
                          handleUpdateAdditionalRow(
                            idx,
                            "notes",
                            e.target.value,
                          )
                        }
                        placeholder="ระบุรายละเอียดเพิ่มเติม..."
                        className="h-8 bg-white border-slate-200 text-xs focus-visible:ring-purple-400"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteAdditionalRow(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="ลบรายการ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
            ยังไม่มีรายการสินค้าที่ขายนอกเหนือจากเป้าหมาย (กด &quot;เพิ่มสินค้านอกแผน&quot; หากมีสินค้าที่ขายได้เพิ่มเติม)
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
                แนบรูปถ่ายใบลงทะเบียนผู้เข้าร่วมประชุม (จำเป็นต้องมีอย่างน้อย 1 รูป)
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
