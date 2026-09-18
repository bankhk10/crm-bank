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
import { cn } from "@/lib/utils";
import { ActualTargetCard } from "../actual-target-card";
import { ImageFile } from "../../types";
import GalleryUpload from "@/components/custom/gallery-upload";
import type { FileWithPreview } from "@/hooks/use-file-upload";
import {
  convertToFileMetadata,
  filesWithPreviewToImageFiles,
  isImageFilesEqual,
} from "../../utils";
import { listProductsAction } from "@/modules/products/server/actions";
import { getCustomersAction } from "@/modules/customers/server/actions";

export interface TargetIssueItem {
  customer: string;
  issueType: string;
  detail: string;
}

export interface ActualType6IssueProps {
  isVisible: boolean;
  target: {
    customer: string;
    issueType: string;
    detail: string;
    targetStatus?: string;
    items?: TargetIssueItem[];
  };
  // Products & Customers options
  products?: Array<{ id: string; name: string; productCode?: string | null }>;
  customers?: Array<{ id: string; name: string; customerCode?: string | null }>;

  // Form Fields
  productId?: string | null;
  setProductId?: (v: string | null) => void;
  productName?: string | null;
  setProductName?: (v: string | null) => void;
  lotNumber?: string;
  setLotNumber?: (v: string) => void;
  purchaseChannel?: "ร้านค้าตัวแทนจำหน่าย" | "ออนไลน์" | string;
  setPurchaseChannel?: (v: "ร้านค้าตัวแทนจำหน่าย" | "ออนไลน์" | string) => void;
  storeId?: string | null;
  setStoreId?: (v: string | null) => void;
  storeName?: string | null;
  setStoreName?: (v: string | null) => void;
  issueType?: string;
  setIssueType?: (v: string) => void;
  detail?: string;
  setDetail?: (v: string) => void;
  status: "เสร็จสิ้น" | "รอติดตาม" | "";
  setStatus: (v: "เสร็จสิ้น" | "รอติดตาม" | "") => void;
  images: ImageFile[];
  setImages: (v: ImageFile[]) => void;
  readonly?: boolean;

  // Legacy fallback props (for backward compatibility)
  problemDetail?: string;
  setProblemDetail?: (v: string) => void;
  initialSolution?: string;
  setInitialSolution?: (v: string) => void;
  onUploadImages?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage?: (id: string) => void;
}

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

export function ActualType6Issue({
  isVisible,
  target,
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

  const productOptions = useMemo(() => {
    return activeProducts.map((p) => ({
      value: p.id,
      label: p.productCode ? `[${p.productCode}] ${p.name}` : p.name,
    }));
  }, [activeProducts]);

  const activeCustomers = useMemo(() => {
    if (customers && customers.length > 0) return customers;
    return dbCustomers;
  }, [customers, dbCustomers]);

  const customerOptions = useMemo(() => {
    return activeCustomers.map((c) => ({
      value: c.id,
      label: c.customerCode ? `[${c.customerCode}] ${c.name}` : c.name,
    }));
  }, [activeCustomers]);

  if (!isVisible) return null;

  const hasMultipleItems = target.items && target.items.length > 1;

  const handleFilesChange = (files: FileWithPreview[]) => {
    const converted = filesWithPreviewToImageFiles(files);
    if (!isImageFilesEqual(images, converted) && setImages) {
      setImages(converted);
    }
  };

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
      {hasMultipleItems ? (
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-rose-600" />
              รายการเป้าหมายตรวจสอบเรื่องร้องเรียน / แก้ปัญหา (
              {target.items?.length} รายการ):
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
              จากฟอร์มสร้างแผน
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {target.items?.map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5"
              >
                <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-100 pb-1.5">
                  <span className="flex items-center gap-1.5 text-xs text-rose-900">
                    <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center text-[10px] font-extrabold">
                      {idx + 1}
                    </span>
                    ลูกค้า: {item.customer || "-"}
                  </span>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      ประเภทปัญหา:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {item.issueType || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      รายละเอียดเพิ่มเติม:
                    </span>
                    <span className="font-medium text-slate-700 block break-words whitespace-pre-wrap">
                      {item.detail || "-"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ActualTargetCard
          iconColorClass="text-rose-600"
          badgeColorClass="bg-rose-100 text-rose-800"
          gridColsClass="grid-cols-1 sm:grid-cols-3"
          items={[
            { label: "ลูกค้า/ร้านค้า:", value: target.customer || "-" },
            { label: "ประเภทปัญหา:", value: target.issueType || "-" },
            {
              label: "รายละเอียดเพิ่มเติม:",
              value: target.detail || "-",
            },
          ]}
        />
      )}

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
            <FormCombobox
              id="type6-store-combobox"
              label="เลือกร้านค้าตัวแทนจำหน่าย"
              labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
              triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-rose-500"
              value={storeId || ""}
              onChange={(val) => {
                const found = activeCustomers.find((c) => c.id === val);
                if (setStoreId) setStoreId(val || null);
                if (setStoreName) setStoreName(found?.name || "");
              }}
              options={customerOptions}
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
            <FormCombobox
              id="type6-product-combobox"
              label="ชื่อสินค้า"
              labelClassName="block text-xs font-semibold text-slate-800 mb-1 mx-0"
              triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-rose-500"
              value={productId || ""}
              onChange={(val) => {
                const found = activeProducts.find((p) => p.id === val);
                if (setProductId) setProductId(val || null);
                if (setProductName) setProductName(found?.name || "");
              }}
              options={productOptions}
              placeholder="เลือกสินค้าจาก Product Master..."
              searchPlaceholder="พิมพ์ชื่อหรือรหัสสินค้า..."
              emptyText="ไม่พบสินค้า"
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

        {/* Row 7: GalleryUpload (สูงสุด 5 รูป) */}
        <div className="bg-rose-50/20 border border-rose-200/70 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-rose-100 pb-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center border border-rose-200">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-rose-950">
                รูปภาพประกอบการตรวจสอบเรื่องร้องเรียน / แก้ปัญหา
              </h4>
              <p className="text-[11px] text-rose-700/80">
                อัปโหลดรูปภาพสินค้ามีปัญหา หรือรูปถ่ายหน้างาน (สูงสุด 5 รูป)
              </p>
            </div>
          </div>
          <GalleryUpload
            maxFiles={5}
            maxSize={20 * 1024 * 1024}
            accept="image/*"
            multiple={true}
            initialFiles={convertToFileMetadata(images || [])}
            onFilesChange={handleFilesChange}
          />
        </div>
      </div>
    </div>
  );
}
