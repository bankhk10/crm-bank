"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Camera,
  HelpCircle,
  Store,
  Globe,
  Package,
  Barcode,
  AlertCircle,
  FileText,
} from "lucide-react";
import { FormCombobox } from "@/components/custom/form-components";
import {
  ActivityProductSelect,
  type ActivityProductItem,
} from "@/components/activity/activity-product-select";
import {
  ActivityCustomerSelect,
  type ActivityCustomerItem,
} from "@/components/activity/activity-customer-select";
import { cn } from "@/lib/utils";
import { ActualTargetCard } from "@/modules/activity-plans/features/shared/actual-view/components/actual-target-card";
import { ActivityPhotoUpload, type ImageFile } from "@/components/activity";
import { Type6PlanCard } from "./type6-plan-card";
import { listProductsAction } from "@/modules/products/server/actions";
import { getCustomersAction } from "@/modules/customers/server/actions";
import type {
  TargetIssueItem,
  ActualType6IssueProps,
  Type6ActualFormProps,
} from "../types";

export type { TargetIssueItem, ActualType6IssueProps, Type6ActualFormProps };


const ISSUE_TYPE_OPTIONS = [
  {
    value: "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
    label: "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
  },
  {
    value: "เกิดความเสียหายหลังการใช้สินค้า",
    label: "เกิดความเสียหายหลังการใช้สินค้า",
  },
  {
    value: "อื่นๆ ระบุ",
    label: "อื่นๆ ระบุ",
  },
];

export function Type6ActualForm({
  isVisible,
  planType,
  target,
  targets,
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
  const resolvedTarget = useMemo(() => {
    if (target && target.items && target.items.length > 0) return target;
    if (targets && targets.length > 0) {
      const allItems: TargetIssueItem[] = targets.flatMap((t, idx) =>
        t.items && t.items.length > 0
          ? t.items
          : [
              {
                customer: t.customer || t.customerName || "ลูกค้าทั่วไป",
                issueType: t.issueType || "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
                detail: t.detail || "",
              },
            ],
      );
      return {
        ...targets[0],
        customer: targets.map((t) => t.customer || t.customerName).filter(Boolean).join(", "),
        customerName: targets.map((t) => t.customer || t.customerName).filter(Boolean).join(", "),
        detail: targets.map((t) => t.detail).filter(Boolean).join(" | "),
        items: allItems,
      };
    }
    return target;
  }, [target, targets]);

  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [dbCustomers, setDbCustomers] = useState<any[]>([]);

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
          console.error("Failed to load products in ActualType6Issue:", err),
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
          console.error("Failed to load customers in ActualType6Issue:", err),
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

  if (!isVisible) return null;

  const hasMultipleItems = Boolean(target?.items && target.items.length > 1);

  const handleChannelChange = (ch: "ร้านค้าตัวแทนจำหน่าย" | "ออนไลน์") => {
    if (setPurchaseChannel) {
      setPurchaseChannel(ch);
    }
    if (ch === "ออนไลน์") {
      if (setStoreId) setStoreId(null);
      if (setStoreName) setStoreName(null);
    }
  };

  return (
    <div className="border border-rose-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-rose-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
            <AlertCircle className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-rose-900 text-base md:text-lg">
            ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา
          </h2>
        </div>
      </div>

      {/* Target Card from Plan */}
      <Type6PlanCard planType={planType} target={resolvedTarget} />

      {/* Actual Form Fields */}
      <div className="space-y-4 pt-1">
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
              const isSelected = purchaseChannel === ch.id;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => handleChannelChange(ch.id)}
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

        {/* Row 2: เลือกร้านค้า (เฉพาะเมื่อเลือก ร้านค้าตัวแทนจำหน่าย) */}
        {purchaseChannel === "ร้านค้าตัวแทนจำหน่าย" && (
          <div className="bg-rose-50/30 border border-rose-100 rounded-xl p-3.5 space-y-1.5">
            <ActivityCustomerSelect
              id="type6-store-combobox"
              type="STORE"
              label="เลือกร้านค้าตัวแทนจำหน่าย"
              labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
              triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-rose-500"
              value={storeId || ""}
              valueKey="id"
              customers={activeCustomers}
              onChange={(val: string, customer?: ActivityCustomerItem) => {
                if (setStoreId) setStoreId(val || null);
                if (setStoreName) setStoreName(customer?.name || "");
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
              id="type6-product-combobox"
              label="ชื่อสินค้า"
              labelClassName="block text-xs font-semibold text-slate-800 mb-1 mx-0"
              triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-rose-500"
              value={productId || ""}
              valueKey="id"
              products={activeProducts}
              onChange={(val: string, product?: ActivityProductItem) => {
                if (setProductId) setProductId(val || null);
                if (setProductName) setProductName(product?.name || "");
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
            <input
              type="text"
              value={lotNumber}
              onChange={(e) => setLotNumber && setLotNumber(e.target.value)}
              disabled={readonly}
              placeholder="ระบุเลข Lot บนบรรจุภัณฑ์ (เช่น L680123)..."
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              required
            />
          </div>
        </div>

        {/* Row 4: ประเภทปัญหา */}
        <div className="space-y-1.5">
          <FormCombobox
            id="type6-issue-type-combobox"
            label="ประเภทปัญหา"
            labelClassName="block text-xs font-semibold text-slate-800 mb-1 mx-0"
            triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-rose-500"
            value={issueType}
            onChange={(val) => setIssueType && setIssueType(val)}
            options={ISSUE_TYPE_OPTIONS}
            placeholder="เลือกประเภทปัญหา..."
            searchPlaceholder="ค้นหาประเภทปัญหา..."
            emptyText="ไม่พบประเภทปัญหา"
            disabled={readonly}
            required
          />
        </div>

        {/* Row 5: รายละเอียด (แสดงเฉพาะเมื่อเลือก "3. อื่นๆ ระบุ") */}
        {issueType === "อื่นๆ ระบุ" && (
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-rose-600" />
              รายละเอียด <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={detail}
              onChange={(e) => setDetail && setDetail(e.target.value)}
              disabled={readonly}
              placeholder="ระบุรายละเอียดของปัญหาหรือข้อร้องเรียนอย่างชัดเจน..."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white resize-y"
              required
            />
          </div>
        )}

        {/* Row 6: สถานะการดำเนินการ ( Display Label ปรับใหม่ แต่ value เดิม ) */}
        <div className="space-y-1.5 pt-1">
          <label className="text-xs sm:text-sm font-semibold text-slate-800">
            สถานะการดำเนินการ <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3 max-w-sm">
            {(["เสร็จสิ้น", "รอติดตาม"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatus(st)}
                disabled={readonly}
                className={cn(
                  "py-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all",
                  status === st
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
          title="รูปภาพประกอบการตรวจสอบเรื่องร้องเรียน / แก้ปัญหา"
          description="อัปโหลดรูปภาพสินค้ามีปัญหา หรือรูปถ่ายหน้างาน (สูงสุด 5 รูป)"
          images={images}
          onImagesChange={setImages}
          maxFiles={5}
          accentColor="slate"
        />
      </div>
    </div>
  );
}

// Backward-compatible alias
export const ActualType6Issue = Type6ActualForm;
