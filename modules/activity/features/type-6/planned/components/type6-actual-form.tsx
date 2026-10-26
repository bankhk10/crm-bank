"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Store,
  Globe,
  Barcode,
  AlertCircle,
  FileText,
} from "lucide-react";
import {
  ActivityProductSelect,
  type ActivityProductItem,
  ActivityCustomerSelect,
  type ActivityCustomerItem,
  ActivityPhotoUpload,
  ActivityInput,
  ActivityTextarea,
  ActivityCombobox,
} from "@/modules/activity/ui";
import { cn } from "@/lib/utils";
import type { ImageFile } from "@/modules/activity/domain/summary/types";
import { listProductsAction } from "@/modules/products/server/actions";
import { getCustomersAction } from "@/modules/customers/server/actions";
import { ISSUE_TYPE_OPTIONS } from "../../shared/constants";
import type { TargetIssueItem, Type6IssueRecord, Type6TargetItem } from "../../shared/types";
import type {
  ActualType6IssueProps,
  Type6ActualFormProps,
} from "../types/actual.types";

export type { TargetIssueItem, ActualType6IssueProps, Type6ActualFormProps };

export function Type6ActualForm({
  isVisible,
  planType: _planType,
  target,
  targets,
  issueDetails = [],
  onUpdateIssueItem,
  products = [],
  customers = [],
  productId = null,
  setProductId,
  productName = "",
  setProductName,
  lotNumber = "",
  setLotNumber,
  purchaseChannel = "ร้านค้าตัวแทนจำหน่าย",
  setPurchaseChannel,
  storeId = null,
  setStoreId,
  storeName = "",
  setStoreName,
  issueType = "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
  setIssueType,
  detail = "",
  setDetail,
  status = "เสร็จสิ้น",
  setStatus,
  images = [],
  setImages,
  readonly = false,
}: ActualType6IssueProps) {
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [dbCustomers, setDbCustomers] = useState<any[]>([]);
  const [localIssueDetails, setLocalIssueDetails] = useState<
    Type6IssueRecord[]
  >([]);

  // Fallback load products from master if not passed via props
  useEffect(() => {
    let isMounted = true;
    if (!products || products.length === 0) {
      listProductsAction({ perPage: 1000, status: "ACTIVE" as any })
        .then((res: any) => {
          if (isMounted && res?.products && res.products.length > 0) {
            setDbProducts(res.products);
          }
        })
        .catch((err) =>
          console.error("Failed to load products in Type6ActualForm:", err),
        );
    }
    return () => {
      isMounted = false;
    };
  }, [products]);

  // Fallback load customers from master if not passed via props
  useEffect(() => {
    let isMounted = true;
    if (!customers || customers.length === 0) {
      getCustomersAction({ perPage: 1000 })
        .then((res: any) => {
          if (isMounted && res?.customers && res.customers.length > 0) {
            setDbCustomers(res.customers);
          }
        })
        .catch((err) =>
          console.error("Failed to load customers in Type6ActualForm:", err),
        );
    }
    return () => {
      isMounted = false;
    };
  }, [customers]);

  const activeProducts = useMemo(() => {
    if (products && products.length > 0) return products;
    return dbProducts;
  }, [products, dbProducts]);

  const activeCustomers = useMemo(() => {
    if (customers && customers.length > 0) return customers;
    return dbCustomers;
  }, [customers, dbCustomers]);

  // Normalize planned targets
  const effectiveTargets: Type6TargetItem[] = useMemo(() => {
    if (targets && targets.length > 0) return targets;
    if (target) return [target];
    return [];
  }, [targets, target]);

  // Multi-item synchronization: ensure one entry per target
  const itemsToRender = useMemo(() => {
    const count = Math.max(
      effectiveTargets.length,
      issueDetails?.length || 0,
      localIssueDetails.length,
      1,
    );
    const list: Array<{
      item: Type6IssueRecord;
      target?: Type6TargetItem;
      index: number;
    }> = [];

    for (let i = 0; i < count; i++) {
      const tgt = effectiveTargets[i];
      const fromParent = issueDetails?.[i];
      const fromLocal = localIssueDetails[i];
      // Merge local updates with parent details
      const fromDetails: Type6IssueRecord | undefined = fromParent
        ? { ...fromLocal, ...fromParent }
        : fromLocal;

      const effectiveChannel: "ร้านค้าตัวแทนจำหน่าย" | "ออนไลน์" =
        fromDetails?.purchaseChannel ||
        (i === 0 && purchaseChannel ? (purchaseChannel as any) : null) ||
        "ร้านค้าตัวแทนจำหน่าย";

      const isChannelOnline = effectiveChannel === "ออนไลน์";

      const fallbackStoreId = isChannelOnline
        ? null
        : (i === 0 ? storeId : null) ??
          (tgt?.isManualCustomer ? null : tgt?.storeId || null);

      const fallbackStoreName = isChannelOnline
        ? null
        : (i === 0 ? storeName : null) ??
          (tgt?.isManualCustomer
            ? null
            : tgt?.customerName || tgt?.customer || null);

      const resolvedStoreId = isChannelOnline
        ? null
        : fromDetails?.storeId !== undefined
          ? fromDetails.storeId
          : fallbackStoreId;

      const resolvedStoreName = isChannelOnline
        ? null
        : fromDetails?.storeName !== undefined
          ? fromDetails.storeName
          : fallbackStoreName;

      const item: Type6IssueRecord = {
        id:
          fromDetails?.id ||
          (tgt?.id ? `issue-${tgt.id}` : `issue-${i + 1}`),
        targetId: fromDetails?.targetId || tgt?.id,
        storeId: resolvedStoreId,
        storeName: resolvedStoreName,
        customerName:
          fromDetails?.customerName ||
          tgt?.customerName ||
          tgt?.customer ||
          null,
        isManualCustomer: Boolean(
          fromDetails?.isManualCustomer !== undefined
            ? fromDetails.isManualCustomer
            : tgt?.isManualCustomer,
        ),
        purchaseChannel: effectiveChannel,
        productId:
          fromDetails?.productId !== undefined
            ? fromDetails.productId
            : i === 0
              ? productId
              : null,
        productName:
          fromDetails?.productName !== undefined
            ? fromDetails.productName
            : i === 0
              ? productName
              : "",
        lotNumber:
          fromDetails?.lotNumber !== undefined
            ? fromDetails.lotNumber
            : i === 0
              ? lotNumber
              : "",
        issueType:
          fromDetails?.issueType ||
          (i === 0 ? issueType : null) ||
          tgt?.issueType ||
          "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
        detail:
          fromDetails?.detail !== undefined
            ? fromDetails.detail
            : (i === 0 ? detail : null) || tgt?.detail || "",
        status:
          fromDetails?.status ||
          (i === 0 ? status : null) ||
          "เสร็จสิ้น",
        images:
          fromDetails?.images !== undefined
            ? fromDetails.images
            : (i === 0 ? images : null) || [],
      };

      list.push({ item, target: tgt, index: i });
    }

    return list;
  }, [
    effectiveTargets,
    issueDetails,
    localIssueDetails,
    productId,
    productName,
    lotNumber,
    purchaseChannel,
    storeId,
    storeName,
    issueType,
    detail,
    status,
    images,
  ]);

  if (!isVisible) return null;

  const handleItemUpdates = (
    index: number,
    updates: Partial<Type6IssueRecord>,
  ) => {
    // 1. Update internal state for instant UI responsiveness
    setLocalIssueDetails((prev) => {
      const next = [...prev];
      while (next.length <= index) {
        next.push({
          id: `issue-${next.length + 1}`,
          purchaseChannel: "ร้านค้าตัวแทนจำหน่าย",
          issueType: "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
          status: "เสร็จสิ้น",
          images: [],
        });
      }
      next[index] = { ...next[index], ...updates };
      return next;
    });

    // 2. Notify parent handler with partial updates
    if (onUpdateIssueItem) {
      onUpdateIssueItem(index, updates);
    }

    // 3. Sync item 0 to scalar props for backward compatibility
    if (index === 0) {
      if ("productId" in updates && setProductId) {
        setProductId(updates.productId ?? null);
      }
      if ("productName" in updates && setProductName) {
        setProductName(updates.productName ?? null);
      }
      if ("lotNumber" in updates && setLotNumber) {
        setLotNumber(updates.lotNumber || "");
      }
      if ("purchaseChannel" in updates && setPurchaseChannel) {
        setPurchaseChannel(updates.purchaseChannel as any);
      }
      if ("storeId" in updates && setStoreId) {
        setStoreId(updates.storeId ?? null);
      }
      if ("storeName" in updates && setStoreName) {
        setStoreName(updates.storeName ?? null);
      }
      if ("issueType" in updates && setIssueType) {
        setIssueType(updates.issueType || "");
      }
      if ("detail" in updates && setDetail) {
        setDetail(updates.detail || "");
      }
      if ("status" in updates && setStatus) {
        setStatus(updates.status as any);
      }
      if ("images" in updates && setImages) {
        setImages(updates.images || []);
      }
    }
  };

  const handleItemFieldChange = (
    index: number,
    field: keyof Type6IssueRecord,
    val: any,
  ) => {
    handleItemUpdates(index, { [field]: val });
  };

  const handleItemChannelChange = (
    index: number,
    ch: "ร้านค้าตัวแทนจำหน่าย" | "ออนไลน์",
  ) => {
    if (ch === "ออนไลน์") {
      handleItemUpdates(index, {
        purchaseChannel: "ออนไลน์",
        storeId: null,
        storeName: null,
      });
    } else {
      handleItemUpdates(index, {
        purchaseChannel: "ร้านค้าตัวแทนจำหน่าย",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-rose-950 text-base md:text-lg">
              ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา
            </h2>
            <p className="text-xs text-slate-500">
              บันทึกผลการเข้าตรวจสอบข้อร้องเรียนตามเป้าหมายแผนงาน ({itemsToRender.length} รายการ)
            </p>
          </div>
        </div>
      </div>

      {/* Render each item */}
      {itemsToRender.map(({ item, target: itemTarget, index }) => {
        const itemCustomer =
          item.customerName ||
          itemTarget?.customerName ||
          itemTarget?.customer ||
          "ลูกค้าทั่วไป";
        const isManual = Boolean(
          item.isManualCustomer || itemTarget?.isManualCustomer,
        );
        const itemPlanIssueType =
          itemTarget?.issueType || item.issueType || "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย";
        const itemPlanDetail = itemTarget?.detail || "-";

        return (
          <div
            key={item.targetId || item.id || index}
            className="border border-rose-200/90 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-5 shadow-xs"
          >
            {/* Target Card & Item Header */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 sm:p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 pb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm sm:text-base truncate">
                        {itemCustomer}
                      </span>
                      <span
                        className={cn(
                          "text-[11px] font-semibold px-2 py-0.5 rounded-md border",
                          isManual
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-blue-50 text-blue-700 border-blue-200",
                        )}
                      >
                        {isManual ? "ลูกค้านอกระบบ" : "ร้านค้าตัวแทนจำหน่าย"}
                      </span>
                    </div>
                  </div>
                </div>

                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center gap-1.5 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  เป้าหมายตามแผนงาน
                </span>
              </div>

              {/* Plan context details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-medium text-[11px] block">
                    ประเภทปัญหาตามแผน:
                  </span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{itemPlanIssueType}</span>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-medium text-[11px] block">
                    รายละเอียดตามแผน:
                  </span>
                  <p className="text-slate-700 font-medium whitespace-pre-wrap break-words">
                    {itemPlanDetail}
                  </p>
                </div>
              </div>
            </div>

            {/* Actual Form Fields */}
            <div className="space-y-4 pt-1">
              <div className="flex items-center gap-2 pb-1 border-b border-rose-100">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span className="text-xs sm:text-sm font-bold text-rose-900">
                  บันทึกผลการตรวจสอบจริง (รายการที่ {index + 1})
                </span>
              </div>

              {/* Row 1: ช่องทางการซื้อสินค้า */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-rose-600" />
                  ช่องทางการซื้อสินค้า <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  {(
                    [
                      {
                        id: "ร้านค้าตัวแทนจำหน่าย",
                        label: "ร้านค้าตัวแทนจำหน่าย",
                        icon: Store,
                      },
                      { id: "ออนไลน์", label: "ออนไลน์", icon: Globe },
                    ] as const
                  ).map((ch) => {
                    const Icon = ch.icon;
                    const isSelected = item.purchaseChannel === ch.id;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => handleItemChannelChange(index, ch.id)}
                        disabled={readonly}
                        className={cn(
                          "py-2.5 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-2",
                          isSelected
                            ? "bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20 shadow-xs"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                          readonly && "cursor-not-allowed opacity-75",
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-4 h-4",
                            isSelected ? "text-rose-600" : "text-slate-400",
                          )}
                        />
                        <span>{ch.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 2: เลือกร้านค้าตัวแทนจำหน่าย */}
              {item.purchaseChannel === "ร้านค้าตัวแทนจำหน่าย" && (
                <div className="bg-rose-50/30 border border-rose-100 rounded-xl p-3.5 space-y-1.5">
                  <ActivityCustomerSelect
                    id={`type6-store-combobox-${index}`}
                    type="STORE"
                    label="เลือกร้านค้าตัวแทนจำหน่าย"
                    labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                    triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-rose-500"
                    value={item.storeId || item.storeName || ""}
                    valueKey="id"
                    customers={activeCustomers}
                    onChange={(val: string, customer?: ActivityCustomerItem) => {
                      handleItemUpdates(index, {
                        storeId: val || null,
                        storeName: customer?.name || "",
                      });
                    }}
                    placeholder="ค้นหาร้านค้าตัวแทนจำหน่ายจาก Customer Master..."
                    searchPlaceholder="พิมพ์ชื่อหรือรหัสร้านค้า..."
                    emptyText="ไม่พบร้านค้า"
                    disabled={readonly}
                    required
                  />
                </div>
              )}

              {/* Row 3: ข้อมูลสินค้า: ชื่อสินค้า & เลข Lot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <ActivityProductSelect
                    id={`type6-product-combobox-${index}`}
                    label="ชื่อสินค้า"
                    labelClassName="block text-xs font-semibold text-slate-800 mb-1 mx-0"
                    triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-rose-500"
                    value={item.productId || item.productName || ""}
                    valueKey="id"
                    products={activeProducts}
                    onChange={(val: string, product?: ActivityProductItem) => {
                      handleItemUpdates(index, {
                        productId: val || null,
                        productName: product?.name || "",
                      });
                    }}
                    placeholder="เลือกสินค้าจาก Product Master..."
                    searchPlaceholder="พิมพ์ชื่อหรือรหัสสินค้า..."
                    emptyText="ไม่พบสินค้า"
                    subLabelType="code"
                    disabled={readonly}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <Barcode className="w-4 h-4 text-rose-600" />
                    เลข Lot <span className="text-rose-500">*</span>
                  </label>
                  <ActivityInput
                    type="text"
                    value={item.lotNumber || ""}
                    onChange={(e) =>
                      handleItemFieldChange(index, "lotNumber", e.target.value)
                    }
                    disabled={readonly}
                    placeholder="ระบุเลข Lot บนบรรจุภัณฑ์ (เช่น L680123)..."
                    className="bg-white border-slate-200 focus-visible:ring-rose-500 focus-visible:border-rose-500"
                    required
                  />
                </div>
              </div>

              {/* Row 4: ประเภทปัญหาจริง */}
              <div className="space-y-1.5">
                <ActivityCombobox
                  id={`type6-issue-type-combobox-${index}`}
                  label="ประเภทปัญหาจริง"
                  labelClassName="block text-xs font-semibold text-slate-800 mb-1 mx-0"
                  triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-rose-500"
                  value={item.issueType || "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย"}
                  onChange={(val) => handleItemFieldChange(index, "issueType", val)}
                  options={ISSUE_TYPE_OPTIONS}
                  placeholder="เลือกประเภทปัญหา..."
                  searchPlaceholder="ค้นหาประเภทปัญหา..."
                  emptyText="ไม่พบประเภทปัญหา"
                  disabled={readonly}
                  required
                />
              </div>

              {/* Row 5: รายละเอียดปัญหา */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-rose-600" />
                  รายละเอียดปัญหา / ผลตรวจจริง{" "}
                  {item.issueType === "อื่นๆ ระบุ" && (
                    <span className="text-rose-500">*</span>
                  )}
                </label>
                <ActivityTextarea
                  rows={3}
                  value={item.detail || ""}
                  onChange={(e) =>
                    handleItemFieldChange(index, "detail", e.target.value)
                  }
                  disabled={readonly}
                  placeholder="ระบุรายละเอียดของปัญหาหรือข้อร้องเรียนอย่างชัดเจน..."
                  className="bg-white border-slate-200 text-xs focus-visible:ring-rose-500 focus-visible:border-rose-500"
                  required={item.issueType === "อื่นๆ ระบุ"}
                />
              </div>

              {/* Row 6: สถานะการดำเนินการ */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs sm:text-sm font-semibold text-slate-800">
                  สถานะการดำเนินการ <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  {(["เสร็จสิ้น", "รอติดตาม"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleItemFieldChange(index, "status", st)}
                      disabled={readonly}
                      className={cn(
                        "py-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all",
                        item.status === st
                          ? st === "เสร็จสิ้น"
                            ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20 shadow-xs"
                            : "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20 shadow-xs"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                        readonly && "cursor-not-allowed opacity-75",
                      )}
                    >
                      {st === "เสร็จสิ้น"
                        ? "✅ แก้ไขปัญหาเสร็จสิ้น"
                        : "⏳ รอติดตามผล"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 7: ActivityPhotoUpload (สูงสุด 5 รูป) */}
              <ActivityPhotoUpload
                title={
                  itemsToRender.length > 1
                    ? `รูปภาพประกอบรายการที่ ${index + 1} (${itemCustomer})`
                    : "รูปภาพประกอบการตรวจสอบเรื่องร้องเรียน / แก้ปัญหา"
                }
                description="อัปโหลดรูปภาพสินค้ามีปัญหา หรือรูปถ่ายหน้างาน (สูงสุด 5 รูป)"
                images={item.images || []}
                onImagesChange={(imgs) => handleItemFieldChange(index, "images", imgs)}
                maxFiles={5}
                accentColor="slate"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Backward-compatible alias
export const ActualType6Issue = Type6ActualForm;
