"use client";

import React, { useMemo } from "react";
import { Camera, BarChart2, Store, Package, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ActivityPhotoUpload, type ImageFile } from "@/modules/activity/ui";
import type { Type5SurveyRecord } from "@/modules/activity-plans/features/shared/actual-view/types";

import type {
  TargetSurveyItem,
  ActualType5SurveyProps,
  Type5TargetItem,
  Type5ActualFormProps,
} from "../types";

export type {
  TargetSurveyItem,
  ActualType5SurveyProps,
  Type5TargetItem,
  Type5ActualFormProps,
};

export function Type5ActualForm({
  isVisible,
  planType,
  target,
  targets,
  surveyDetails = [],
  onUpdateSurveyItem,
  competitorBrand = "",
  setCompetitorBrand,
  competitorProduct = "",
  setCompetitorProduct,
}: ActualType5SurveyProps) {
  const resolvedTarget: Type5TargetItem | undefined = useMemo(() => {
    if (target && target.items && target.items.length > 0) return target;
    if (targets && targets.length > 0) {
      const allItems: TargetSurveyItem[] = targets.flatMap((t, idx) =>
        t.items && t.items.length > 0
          ? t.items
          : [
              {
                id: t.id || `t5-item-${idx}`,
                storeId: t.storeId,
                store: t.store || t.storeName || "",
                storeName: t.store || t.storeName || "",
                productId: t.productId,
                product: t.product || t.productName || "",
                productName: t.product || t.productName || "",
                detail: t.detail || t.notes || "",
                notes: t.detail || t.notes || "",
              },
            ],
      );
      return {
        ...targets[0],
        store: targets.map((t) => t.store || t.storeName).filter(Boolean).join(", "),
        product: targets.map((t) => t.product || t.productName).filter(Boolean).join(", "),
        detail: targets.map((t) => t.detail || t.notes).filter(Boolean).join(" | "),
        items: allItems,
      };
    }
    return target;
  }, [target, targets]);

  // Normalized records to render: prefer surveyDetails if available, otherwise construct from target or fallback
  const recordsToRender: { record: Type5SurveyRecord; index: number }[] =
    useMemo(() => {
      if (surveyDetails && surveyDetails.length > 0) {
        return surveyDetails.map((rec, idx) => ({ record: rec, index: idx }));
      }
      if (resolvedTarget?.items && resolvedTarget.items.length > 0) {
        return resolvedTarget.items.map((item: TargetSurveyItem, idx: number) => ({
          record: {
            id: item.id,
            store: item.store || resolvedTarget?.store || "",
            product: item.product || resolvedTarget?.product || "",
            detail: item.detail || resolvedTarget?.detail || "",
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
            store: resolvedTarget?.store || "",
            product: resolvedTarget?.product || "",
            detail: resolvedTarget?.detail || "",
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
    }, [surveyDetails, resolvedTarget, competitorBrand, competitorProduct]);

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
  const handleBottleFilesChange = (index: number, images: ImageFile[]) => {
    if (onUpdateSurveyItem) {
      onUpdateSurveyItem(index, { bottleImages: images.slice(0, 2) });
    }
  };

  // Promotional media photos change (Max 3)
  const handlePromotionalFilesChange = (
    index: number,
    images: ImageFile[],
  ) => {
    if (onUpdateSurveyItem) {
      onUpdateSurveyItem(index, { promotionalImages: images.slice(0, 3) });
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

                    {planType !== "UNPLANNED" && record.detail && (
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
                        ราคาขายแต่ละระดับ (บาท)
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
                          type="number"
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
                          type="number"
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
                          type="number"
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
                          type="number"
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
                    <ActivityPhotoUpload
                      key={`bottle-${record.id || `${storeGroup.storeName}-${record.product}-${index}`}`}
                      title="รูปถ่ายขวดผลิตภัณฑ์"
                      description="รูปถ่ายขวดหรือบรรจุภัณฑ์ของสินค้าคู่แข่ง"
                      images={record.bottleImages || []}
                      onImagesChange={(imgs) => handleBottleFilesChange(index, imgs)}
                      maxFiles={2}
                      accentColor="amber"
                    />

                    {/* Promotional Materials Photos */}
                    <ActivityPhotoUpload
                      key={`promo-${record.id || `${storeGroup.storeName}-${record.product}-${index}`}`}
                      title="รูปภาพสื่อส่งเสริมการขาย"
                      description="ป้ายโฆษณา, แบนเนอร์, โบรชัวร์ หรือสื่อโปรโมท"
                      images={record.promotionalImages || []}
                      onImagesChange={(imgs) => handlePromotionalFilesChange(index, imgs)}
                      maxFiles={3}
                      accentColor="blue"
                    />
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

// Backward-compatible alias
export const ActualType5Survey = Type5ActualForm;
