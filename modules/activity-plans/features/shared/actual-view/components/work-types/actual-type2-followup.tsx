"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Target, Layers, Plus, Trash2, Sparkles, Package, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { ActualTargetCard } from "../actual-target-card";
import { FormCombobox } from "@/components/custom/FormCombobox";
import { listProductsAction } from "@/modules/products/server/actions";
import { Badge } from "@/components/ui/badge";
import GalleryUpload from "@/components/custom/gallery-upload";
import type { FileWithPreview } from "@/hooks/use-file-upload";
import { ImageFile } from "../../types";
import {
  convertToFileMetadata,
  filesWithPreviewToImageFiles,
  isImageFilesEqual,
} from "../../utils";

export interface FollowupProductItem {
  id?: string;
  productId?: string;
  productName: string;
  customer?: string;
  storeId?: string;
  expectedResult?: string;
  usageResult?: "พืชตอบสนองดี" | "ลูกค้าพึงพอใจ" | "พบปัญหา" | "";
  problemDetail?: string;
  detail?: string; // รายละเอียดเพิ่มเติมจากแผนงาน
  followupDetail?: string; // รายละเอียดการติดตามจากการปฏิบัติงานจริง
  isAdditional?: boolean; // false = สินค้าตามแผน, true = ติดตามผลเพิ่มเติม
}

export interface ActualType2FollowupProps {
  isVisible: boolean;
  target: {
    product: string;
    customer: string;
    storeName?: string;
    keyFarmer?: string;
    detail: string; // รายละเอียดเพิ่มเติมจากแผนงาน
    expectedResult: string;
    items?: FollowupProductItem[];
  };
  products?: Array<{ id: string; name: string; productCode?: string | null }>;
  followupResults?: FollowupProductItem[];
  onUpdateFollowupResults?: (items: FollowupProductItem[]) => void;
  // Legacy / backward-compatible props
  customerName?: string;
  setCustomerName?: (v: string) => void;
  detail?: string;
  setDetail?: (v: string) => void;
  followupDetail?: string;
  setFollowupDetail?: (v: string) => void;
  usageResult?: "พืชตอบสนองดี" | "ลูกค้าพึงพอใจ" | "พบปัญหา" | "";
  setUsageResult?: (v: "พืชตอบสนองดี" | "พบปัญหา" | "") => void;
  problemDetail?: string;
  setProblemDetail?: (v: string) => void;
  images?: ImageFile[];
  setImages?: (v: ImageFile[]) => void;
}

export function ActualType2Followup({
  isVisible,
  target,
  products = [],
  followupResults,
  onUpdateFollowupResults,
  detail = "",
  setDetail,
  setFollowupDetail,
  setUsageResult,
  problemDetail = "",
  usageResult = "",
  followupDetail = "",
  setProblemDetail,
  images = [],
  setImages,
}: ActualType2FollowupProps) {
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

  const masterProductList = useMemo(() => {
    if (products && products.length > 0) return products;
    return dbProducts;
  }, [products, dbProducts]);

  const productComboboxOptions = useMemo(() => {
    return masterProductList.map((p) => ({
      value: p.name,
      label: p.name,
      subLabel: p.productCode || undefined,
    }));
  }, [masterProductList]);

  // Helper to parse product-specific followup detail from combined string e.g. "Prod1: detail1 | Prod2: detail2"
  const getParsedFollowupDetail = (
    text: string | undefined,
    productName: string,
    fallbackItemVal?: string,
  ): string => {
    if (fallbackItemVal) return fallbackItemVal;
    if (!text) return "";
    const escaped = productName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?:^|\\|\\s*)${escaped}:\\s*([^|]+)`, "i");
    const match = text.match(regex);
    if (match && match[1]) {
      return match[1].trim();
    }
    if (!text.includes(":") && !text.includes("|")) {
      return text.trim();
    }
    return "";
  };

  const getParsedProblemDetail = (
    text: string | undefined,
    productName: string,
    fallbackItemVal?: string,
  ): string => {
    if (fallbackItemVal) return fallbackItemVal;
    if (!text) return "";
    const escaped = productName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?:^|\\|\\s*)${escaped}:\\s*([^|]+)`, "i");
    const match = text.match(regex);
    if (match && match[1]) {
      return match[1].trim();
    }
    if (!text.includes(":") && !text.includes("|")) {
      return text.trim();
    }
    return "";
  };

  const getParsedUsageResult = (
    text: string | undefined,
    productName: string,
    fallback?: "พืชตอบสนองดี" | "ลูกค้าพึงพอใจ" | "พบปัญหา" | "",
  ): "ลูกค้าพึงพอใจ" | "พบปัญหา" | "" => {
    if (!text) {
      if (fallback === "พืชตอบสนองดี" || fallback === "ลูกค้าพึงพอใจ") return "ลูกค้าพึงพอใจ";
      if (fallback === "พบปัญหา") return "พบปัญหา";
      return "";
    }
    const escaped = productName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?:^|\\|\\s*)${escaped}:\\s*([^|]+)`, "i");
    const match = text.match(regex);
    if (match && match[1]) {
      const val = match[1].trim();
      if (val === "พืชตอบสนองดี" || val === "ลูกค้าพึงพอใจ" || val === "พบปัญหา") {
        return val === "พบปัญหา" ? "พบปัญหา" : "ลูกค้าพึงพอใจ";
      }
    }
    if (text === "พืชตอบสนองดี" || text === "ลูกค้าพึงพอใจ" || text === "พบปัญหา") {
      return text === "พบปัญหา" ? "พบปัญหา" : "ลูกค้าพึงพอใจ";
    }
    if (fallback === "พืชตอบสนองดี" || fallback === "ลูกค้าพึงพอใจ") return "ลูกค้าพึงพอใจ";
    if (fallback === "พบปัญหา") return "พบปัญหา";
    return "";
  };

  // 1. Initial Planned items from target
  const initialPlannedItems: FollowupProductItem[] = useMemo(() => {
    if (target.items && target.items.length > 0) {
      return target.items.map((item, idx) => {
        const parsedUsage = getParsedUsageResult(
          usageResult,
          item.productName,
          item.usageResult,
        );
        const activeUsage: "ลูกค้าพึงพอใจ" | "พบปัญหา" =
          parsedUsage === "ลูกค้าพึงพอใจ" || parsedUsage === "พบปัญหา"
            ? parsedUsage
            : item.expectedResult === "พบปัญหา"
              ? "พบปัญหา"
              : "ลูกค้าพึงพอใจ";

        const parsedProblem =
          activeUsage === "พบปัญหา"
            ? item.problemDetail ||
              getParsedProblemDetail(
                problemDetail,
                item.productName,
                item.problemDetail,
              )
            : "";

        const activeFollowup =
          activeUsage === "พบปัญหา"
            ? ""
            : item.followupDetail ||
              getParsedFollowupDetail(
                followupDetail,
                item.productName,
                item.followupDetail,
              );

        return {
          id: item.id || `planned-${idx}`,
          productId: item.productId,
          productName: item.productName || target.product || "สินค้าตามแผน",
          customer: item.customer || target.customer || "",
          storeId: item.storeId,
          detail: item.detail || target.detail || "",
          expectedResult: item.expectedResult || "พืชตอบสนองดี",
          usageResult: activeUsage,
          problemDetail: parsedProblem,
          followupDetail: activeFollowup,
          isAdditional: false,
        };
      });
    }

    if (target.product || target.customer) {
      const activeUsage: "ลูกค้าพึงพอใจ" | "พบปัญหา" =
        usageResult === "พบปัญหา" ? "พบปัญหา" : "ลูกค้าพึงพอใจ";
      return [
        {
          id: "planned-single",
          productName: target.product || "สินค้าตามแผน",
          customer: target.customer || "",
          detail: target.detail || "",
          expectedResult: target.expectedResult || "พืชตอบสนองดี",
          usageResult: activeUsage,
          problemDetail: activeUsage === "พบปัญหา" ? problemDetail : "",
          followupDetail: activeUsage === "พบปัญหา" ? "" : (followupDetail || detail),
          isAdditional: false,
        },
      ];
    }

    return [];
  }, [target]);

  // State: Planned items
  const [plannedItems, setPlannedItems] = useState<FollowupProductItem[]>(() => {
    if (followupResults && followupResults.length > 0) {
      const fromSaved = followupResults.filter((f) => !f.isAdditional);
      if (fromSaved.length > 0) {
        return fromSaved.map((item, idx) => ({
          ...item,
          id: item.id || `planned-${idx}`,
          isAdditional: false,
          usageResult: item.usageResult === "พบปัญหา" ? "พบปัญหา" : "ลูกค้าพึงพอใจ",
          problemDetail: item.usageResult === "พบปัญหา" ? item.problemDetail || "" : "",
          followupDetail: item.usageResult !== "พบปัญหา" ? item.followupDetail || "" : "",
        }));
      }
    }
    return initialPlannedItems;
  });

  // State: Additional items (ติดตามผลการใช้สินค้านอกเหนือจากที่กรอกไว้ในแผน)
  const [additionalItems, setAdditionalItems] = useState<FollowupProductItem[]>(() => {
    if (followupResults && followupResults.length > 0) {
      const fromSaved = followupResults.filter((f) => f.isAdditional);
      return fromSaved.map((item) => ({
        ...item,
        id: item.id || crypto.randomUUID(),
        isAdditional: true,
        usageResult: item.usageResult === "พบปัญหา" ? "พบปัญหา" : "ลูกค้าพึงพอใจ",
        problemDetail: item.usageResult === "พบปัญหา" ? item.problemDetail || "" : "",
        followupDetail: item.usageResult !== "พบปัญหา" ? item.followupDetail || "" : "",
      }));
    }
    return [];
  });

  // Helper to sync combined items to parent callback and legacy props
  const syncChanges = (
    newPlanned: FollowupProductItem[],
    newAdditional: FollowupProductItem[],
  ) => {
    const allItems = [...newPlanned, ...newAdditional];

    if (onUpdateFollowupResults) {
      onUpdateFollowupResults(allItems);
    }

    // Sync legacy combined strings for backward compatibility
    if (allItems.length > 0) {
      if (setUsageResult) {
        const combinedUsage =
          allItems.length === 1
            ? allItems[0].usageResult === "พบปัญหา" ? "พบปัญหา" : "พืชตอบสนองดี"
            : allItems
                .map((item) =>
                  item.usageResult
                    ? `${item.productName}: ${item.usageResult === "ลูกค้าพึงพอใจ" ? "พืชตอบสนองดี" : item.usageResult}`
                    : "",
                )
                .filter(Boolean)
                .join(" | ");
        setUsageResult(combinedUsage as any);
      }

      if (setProblemDetail) {
        const combinedProblem =
          allItems.length === 1
            ? allItems[0].usageResult === "พบปัญหา"
              ? allItems[0].problemDetail || ""
              : ""
            : allItems
                .map((item) =>
                  item.usageResult === "พบปัญหา" && item.problemDetail
                    ? `${item.productName}: ${item.problemDetail}`
                    : "",
                )
                .filter(Boolean)
                .join(" | ");
        setProblemDetail(combinedProblem);
      }

      const combinedFollowup =
        allItems.length === 1
          ? allItems[0].usageResult !== "พบปัญหา"
            ? allItems[0].followupDetail || ""
            : ""
          : allItems
              .map((item) =>
                item.usageResult !== "พบปัญหา" && item.followupDetail
                  ? `${item.productName}: ${item.followupDetail}`
                  : "",
              )
              .filter(Boolean)
              .join(" | ");

      if (setFollowupDetail) {
        setFollowupDetail(combinedFollowup);
      }
      if (setDetail) {
        setDetail(combinedFollowup);
      }
    }
  };

  // Handlers for Planned Items
  const handlePlannedChange = (
    index: number,
    field: "usageResult" | "problemDetail" | "followupDetail",
    value: string,
  ) => {
    const updated = [...plannedItems];
    if (field === "usageResult") {
      const nextUsage = value as "ลูกค้าพึงพอใจ" | "พบปัญหา";
      updated[index] = {
        ...updated[index],
        usageResult: nextUsage,
        problemDetail: nextUsage === "ลูกค้าพึงพอใจ" ? "" : updated[index].problemDetail,
        followupDetail: nextUsage === "พบปัญหา" ? "" : updated[index].followupDetail,
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setPlannedItems(updated);
    syncChanges(updated, additionalItems);
  };

  // Handlers for Additional Items
  const handleAddAdditionalItem = () => {
    const planCustomer = target.customer || "";
    const newItem: FollowupProductItem = {
      id: crypto.randomUUID(),
      productId: "",
      productName: "",
      customer: planCustomer,
      usageResult: "ลูกค้าพึงพอใจ",
      followupDetail: "",
      problemDetail: "",
      isAdditional: true,
    };
    const updated = [...additionalItems, newItem];
    setAdditionalItems(updated);
    syncChanges(plannedItems, updated);
  };

  const handleRemoveAdditionalItem = (idOrIndex: string | number) => {
    const updated = additionalItems.filter((item, idx) =>
      typeof idOrIndex === "string" ? item.id !== idOrIndex : idx !== idOrIndex,
    );
    setAdditionalItems(updated);
    syncChanges(plannedItems, updated);
  };

  const handleAdditionalChange = (
    index: number,
    field: "productName" | "usageResult" | "problemDetail" | "followupDetail",
    value: string,
  ) => {
    const updated = [...additionalItems];
    if (field === "productName") {
      const foundProduct = masterProductList.find(
        (p) => p.name.trim().toLowerCase() === value.trim().toLowerCase(),
      );
      updated[index] = {
        ...updated[index],
        productName: value,
        productId: foundProduct?.id || updated[index].productId || "",
      };
    } else if (field === "usageResult") {
      const nextUsage = value as "ลูกค้าพึงพอใจ" | "พบปัญหา";
      updated[index] = {
        ...updated[index],
        usageResult: nextUsage,
        problemDetail: nextUsage === "ลูกค้าพึงพอใจ" ? "" : updated[index].problemDetail,
        followupDetail: nextUsage === "พบปัญหา" ? "" : updated[index].followupDetail,
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setAdditionalItems(updated);
    syncChanges(plannedItems, updated);
  };

  if (!isVisible) return null;

  return (
    <div className="border border-cyan-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-6 shadow-xs">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4 text-cyan-700" />
          </div>
          <div>
            <h2 className="font-bold text-cyan-950 text-base md:text-lg">
              ติดตามผลการใช้สินค้า
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              บันทึกผลการใช้สินค้าตามแผน และสินค้าติดตามผลเพิ่มเติม
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {plannedItems.length > 0 && (
            <span className="text-xs bg-cyan-50 text-cyan-800 font-semibold px-2.5 py-1 rounded-full border border-cyan-200">
              ตามแผน {plannedItems.length} รายการ
            </span>
          )}
          {additionalItems.length > 0 && (
            <span className="text-xs bg-amber-50 text-amber-800 font-semibold px-2.5 py-1 rounded-full border border-amber-200">
              เพิ่มเติม {additionalItems.length} รายการ
            </span>
          )}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION 1: ข้อมูลตามแผน (PLAN TARGET SUMMARY - READ ONLY) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-cyan-600" />
            เป้าหมายที่ตั้งไว้ในแผนงาน (ข้อมูลจากแผน)
          </label>
          <span className="text-[11px] text-slate-400 font-normal">
            * ข้อมูลแผนถูกล็อก ไม่สามารถแก้ไขได้
          </span>
        </div>

        {plannedItems.length > 1 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {plannedItems.map((item, idx) => (
              <div
                key={item.id || idx}
                className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-2 shadow-2xs"
              >
                <div className="flex items-center gap-2 border-b border-slate-200/70 pb-2 font-bold text-cyan-950">
                  <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-800 flex items-center justify-center text-[10px] font-extrabold shrink-0">
                    {idx + 1}
                  </span>
                  <span>{item.productName}</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 font-medium mr-1.5">ชื่อร้านค้า/ลูกค้า:</span>
                    <span className="font-semibold text-slate-800">{item.customer || target.customer || "-"}</span>
                  </div>
                  {item.detail && (
                    <div>
                      <span className="text-slate-400 font-medium mr-1.5">รายละเอียดเพิ่มเติม:</span>
                      <span className="text-slate-700">{item.detail}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ActualTargetCard
            iconColorClass="text-cyan-600"
            badgeColorClass="bg-cyan-100 text-cyan-800"
            gridColsClass="grid-cols-1 sm:grid-cols-3"
            items={[
              {
                label: "สินค้าที่ต้องการติดตามผล:",
                value: target.product || (plannedItems[0]?.productName ?? "-"),
              },
              {
                label: "ชื่อร้านค้า / ลูกค้า:",
                value: target.customer || (plannedItems[0]?.customer ?? "-"),
              },
              {
                label: "รายละเอียดเพิ่มเติมจากแผน:",
                value: target.detail || (plannedItems[0]?.detail ?? "-"),
              },
            ]}
          />
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION 2: บันทึกผลการติดตามสินค้าตามแผน (PLAN FOLLOW-UP RECORD) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="space-y-4 pt-1">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-600"></span>
            บันทึกผลการติดตามสินค้าตามแผน ({plannedItems.length} รายการ)
          </label>
          <span className="text-xs text-slate-500 font-medium">
            * กรอกผลลัพธ์แยกตามสินค้าในแผน
          </span>
        </div>

        <div className="space-y-4">
          {plannedItems.map((prod, idx) => {
            const isProblem = prod.usageResult === "พบปัญหา";

            return (
              <div
                key={prod.id || idx}
                className="bg-cyan-50/20 border border-cyan-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs transition-all"
              >
                {/* Product Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-100/80 pb-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-cyan-950">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-600 text-white text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span>สินค้าตามแผน: {prod.productName}</span>
                  </div>
                  {prod.customer && (
                    <span className="text-xs font-semibold text-cyan-800 bg-cyan-100/80 px-2.5 py-0.5 rounded-full">
                      ลูกค้า: {prod.customer}
                    </span>
                  )}
                </div>

                {prod.detail && (
                  <div className="bg-white/90 p-2.5 rounded-xl border border-cyan-100 text-xs text-slate-700">
                    <span className="font-semibold text-slate-500 mr-1.5">
                      รายละเอียดจากแผนงาน:
                    </span>
                    <span>{prod.detail}</span>
                  </div>
                )}

                {/* 1. ผลลัพธ์จากการใช้งาน */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    ผลการใช้สินค้า <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["ลูกค้าพึงพอใจ", "พบปัญหา"] as const).map((opt) => {
                      const isSelected = prod.usageResult === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handlePlannedChange(idx, "usageResult", opt)}
                          className={cn(
                            "py-2.5 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5",
                            isSelected
                              ? opt === "ลูกค้าพึงพอใจ"
                                ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20 shadow-xs"
                                : "bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20 shadow-xs"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300",
                          )}
                        >
                          <span>{opt === "ลูกค้าพึงพอใจ" ? "🟢" : "⚠️"}</span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. ถ้าลูกค้าพึงพอใจ -> แสดงรายละเอียดการติดตาม */}
                {!isProblem && (
                  <div className="space-y-1.5 animate-in fade-in-50 duration-150">
                    <label className="text-xs font-bold text-slate-800">
                      รายละเอียดการติดตาม
                    </label>
                    <Textarea
                      rows={2}
                      value={prod.followupDetail || ""}
                      onChange={(e) =>
                        handlePlannedChange(idx, "followupDetail", e.target.value)
                      }
                      placeholder={`ระบุข้อแนะนำ หรือรายละเอียดการติดตามสำหรับ ${prod.productName}`}
                      className="bg-white border-slate-300 text-xs rounded-xl focus:border-cyan-500 focus:ring-cyan-500"
                    />
                  </div>
                )}

                {/* 3. ถ้าพบปัญหา -> ซ่อนรายละเอียดการติดตาม และแสดงระบุรายละเอียดปัญหาที่พบ */}
                {isProblem && (
                  <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 space-y-2 animate-in fade-in-50 duration-150">
                    <label className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                      <span>ระบุรายละเอียดปัญหาที่พบสำหรับ {prod.productName}</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <Textarea
                      rows={2}
                      value={prod.problemDetail || ""}
                      onChange={(e) =>
                        handlePlannedChange(idx, "problemDetail", e.target.value)
                      }
                      placeholder="เช่น ใบเหลือง, เกิดคราบไหม้, อัตราส่วนเข้มข้นเกินไป, พืชไม่ตอบสนอง"
                      className="bg-white border-rose-200 text-xs rounded-xl focus:border-rose-400 focus:ring-rose-400 text-rose-950 placeholder:text-rose-300"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION 3: ติดตามผลการใช้สินค้าเพิ่มเติม (ADDITIONAL PRODUCTS) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="border-t border-dashed border-cyan-200/80 pt-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              ติดตามผลการใช้สินค้าเพิ่มเติม (นอกเหนือจากที่กรอกไว้ในแผน)
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              เพิ่มรายการติดตามผลสินค้าอื่นของลูกค้าที่พบหน้างานจริง
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddAdditionalItem}
            className="h-9 px-3.5 text-xs font-bold bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 hover:border-amber-400 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-700" />
            + เพิ่มรายการติดตามผล
          </Button>
        </div>

        {additionalItems.length === 0 ? (
          <div className="py-7 px-4 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
            <Package className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">
              ยังไม่มีรายการติดตามผลสินค้าเพิ่มเติม
            </p>
            <p className="text-[11px] text-slate-400">
              หากต้องการติดตามผลสินค้าอื่นนอกเหนือจากแผน สามารถกดปุ่ม{" "}
              <span className="font-bold text-amber-700">"+ เพิ่มรายการติดตามผล"</span> ด้านบน
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {additionalItems.map((item, idx) => {
              const isProblem = item.usageResult === "พบปัญหา";
              const planCustomer = item.customer || target.customer || "-";

              return (
                <div
                  key={item.id || idx}
                  className="bg-amber-50/30 border border-amber-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs relative group transition-all"
                >
                  {/* Card Header & Delete Button */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/70 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-sm text-slate-900">
                        รายการเพิ่มเติมที่ {idx + 1}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-bold bg-amber-100 text-amber-900 border-amber-300"
                      >
                        สินค้านอกแผน
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAdditionalItem(item.id || idx)}
                        className="h-8 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ลบรายการ</span>
                      </Button>
                    </div>
                  </div>

                  {/* Customer (Auto from Plan) & Product Combobox (from Master) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Customer from Plan */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">
                        ลูกค้า / ร้านค้า (ตามแผนเดิม)
                      </label>
                      <div className="h-10 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 flex items-center shadow-2xs">
                        {planCustomer}
                      </div>
                    </div>

                    {/* Product Master Combobox */}
                    <div className="space-y-1">
                      <FormCombobox
                        id={`additional-product-${idx}`}
                        label="เลือกสินค้าจาก Product Master"
                        required
                        labelClassName="block text-xs font-bold text-slate-700 mb-1 mx-0"
                        triggerClassName="h-10 min-h-[40px] py-1 text-xs bg-white border-amber-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 shadow-2xs"
                        value={item.productName || ""}
                        onChange={(val) =>
                          handleAdditionalChange(idx, "productName", val)
                        }
                        options={productComboboxOptions}
                        placeholder="-- ค้นหาและเลือกสินค้าที่ติดตามเพิ่มเติม --"
                        searchPlaceholder="พิมพ์ชื่อ หรือรหัสสินค้าเพื่อค้นหา..."
                        emptyText="ไม่พบสินค้าในระบบ"
                      />
                    </div>
                  </div>

                  {/* Usage Result Radio / Buttons */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800">
                      ผลการใช้สินค้า <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["ลูกค้าพึงพอใจ", "พบปัญหา"] as const).map((opt) => {
                        const isSelected = item.usageResult === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() =>
                              handleAdditionalChange(idx, "usageResult", opt)
                            }
                            className={cn(
                              "py-2.5 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5",
                              isSelected
                                ? opt === "ลูกค้าพึงพอใจ"
                                  ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20 shadow-xs"
                                  : "bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20 shadow-xs"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300",
                            )}
                          >
                            <span>{opt === "ลูกค้าพึงพอใจ" ? "🟢" : "⚠️"}</span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 1. ถ้าลูกค้าพึงพอใจ -> แสดงรายละเอียดการติดตาม */}
                  {!isProblem && (
                    <div className="space-y-1.5 animate-in fade-in-50 duration-150">
                      <label className="text-xs font-bold text-slate-800">
                        รายละเอียดการติดตาม
                      </label>
                      <Textarea
                        rows={2}
                        value={item.followupDetail || ""}
                        onChange={(e) =>
                          handleAdditionalChange(idx, "followupDetail", e.target.value)
                        }
                        placeholder={
                          item.productName
                            ? `ระบุข้อแนะนำ หรือรายละเอียดการติดตามสำหรับ ${item.productName}`
                            : "ระบุข้อแนะนำ หรือรายละเอียดการติดตามผลจริง"
                        }
                        className="bg-white border-slate-300 text-xs rounded-xl focus:border-amber-500 focus:ring-amber-500"
                      />
                    </div>
                  )}

                  {/* 2. ถ้าพบปัญหา -> ซ่อนรายละเอียดการติดตาม และแสดงระบุรายละเอียดปัญหาที่พบ */}
                  {isProblem && (
                    <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 space-y-2 animate-in fade-in-50 duration-150">
                      <label className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                        <span>
                          ระบุรายละเอียดปัญหาที่พบสำหรับ{" "}
                          {item.productName || "สินค้ารายการนี้"}
                        </span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <Textarea
                        rows={2}
                        value={item.problemDetail || ""}
                        onChange={(e) =>
                          handleAdditionalChange(idx, "problemDetail", e.target.value)
                        }
                        placeholder="เช่น ใบเหลือง, เกิดคราบไหม้, อัตราส่วนเข้มข้นเกินไป, พืชไม่ตอบสนอง"
                        className="bg-white border-rose-200 text-xs rounded-xl focus:border-rose-400 focus:ring-rose-400 text-rose-950 placeholder:text-rose-300"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. ส่วนรูปภาพการติดตามผล (GalleryUpload - สูงสุด 5 รูป) */}
      <div className="bg-emerald-50/20 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 border-b border-emerald-100 pb-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-emerald-950">
              รูปภาพการติดตามผล
            </h4>
            <p className="text-[11px] text-emerald-700/80">
              อัปโหลดรูปภาพสภาพพืช ผลผลิต หรือการติดตามผลการใช้สินค้า (สูงสุด 5 รูป)
            </p>
          </div>
        </div>
        <GalleryUpload
          maxFiles={5}
          maxSize={20 * 1024 * 1024}
          accept="image/*"
          multiple={true}
          initialFiles={convertToFileMetadata(images || [])}
          onFilesChange={(files: FileWithPreview[]) => {
            const converted = filesWithPreviewToImageFiles(files);
            if (!isImageFilesEqual(images, converted) && setImages) {
              setImages(converted);
            }
          }}
        />
      </div>
    </div>
  );
}
