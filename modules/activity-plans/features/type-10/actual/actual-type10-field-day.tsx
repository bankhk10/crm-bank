"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Camera, ShoppingBag, Plus, Trash2, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { FormCombobox } from "@/components/custom/FormCombobox";
import { ActualTargetCard } from "@/modules/activity-plans/features/shared/actual-view/components/actual-target-card";
import { ImageFile } from "@/modules/activity-plans/features/shared/actual-view/types";
import { listProductsAction } from "@/modules/products/server/actions";
import GalleryUpload from "@/components/custom/gallery-upload";
import type { FileWithPreview } from "@/hooks/use-file-upload";
import {
  convertToFileMetadata,
  filesWithPreviewToImageFiles,
  isImageFilesEqual,
} from "@/modules/activity-plans/features/shared/actual-view/utils";

import { Type10PlanCard } from "../shared/type10-plan-card";
import {
  Type10SoldProductItem,
  SoldProductItem,
  ActualType10FieldDayProps,
} from "./types";

export type {
  Type10SoldProductItem,
  SoldProductItem,
  ActualType10FieldDayProps,
};

const CUSTOM_PRODUCT_VALUE = "__CUSTOM_PRODUCT__";
const EMPTY_PRODUCTS: Array<{ id: string; name: string; productCode?: string | null; price?: number } | string> = [];

export function ActualType10FieldDay({
  isVisible,
  planType,
  target,
  actualAttendees,
  setActualAttendees,
  actualSalesOrBooking,
  setActualSalesOrBooking,
  farmerFeedback,
  setFarmerFeedback,
  images = [],
  setImages,
  hasSales,
  setHasSales,
  products = EMPTY_PRODUCTS,
  soldProducts,
  setSoldProducts,
  soldProduct,
  setSoldProduct,
  soldQuantity,
  setSoldQuantity,
  soldDetails,
  setSoldDetails,
}: ActualType10FieldDayProps) {
  // Fetch active products from master DB if not passed via props (only once on mount)
  const [dbProducts, setDbProducts] = useState<
    Array<{ id: string; name: string; productCode?: string | null; price?: number }>
  >([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
  const hasFetchedProductsRef = useRef(false);

  useEffect(() => {
    // If master products are already supplied via props, do not fetch from DB
    if (products && products.length > 0) return;
    if (hasFetchedProductsRef.current) return;
    hasFetchedProductsRef.current = true;

    let isMounted = true;
    setLoadingProducts(true);
    listProductsAction({ status: "ACTIVE", perPage: 1000 })
      .then((res: any) => {
        if (isMounted && res?.products && Array.isArray(res.products) && res.products.length > 0) {
          setDbProducts(res.products);
        } else if (isMounted && res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setDbProducts(res.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load products in ActualType10FieldDay:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingProducts(false);
      });

    return () => {
      isMounted = false;
    };
  }, []); // Run on mount only to prevent re-render loops

  // Unified product list for combobox
  const masterProductList = useMemo(() => {
    if (products && products.length > 0) return products;
    return dbProducts;
  }, [products, dbProducts]);

  // Options for FormCombobox
  const productComboboxOptions = useMemo(() => {
    const options: Array<{ value: string; label: string; subLabel?: string }> = [];

    // If showcase product from target exists, prioritize it
    if (target?.showcase && target.showcase.trim() !== "") {
      const showcaseName = target.showcase.trim();
      options.push({
        value: showcaseName,
        label: `${showcaseName} (สินค้าเด่นประจำแปลงสาธิต)`,
      });
    }

    masterProductList.forEach((p) => {
      if (typeof p === "string") {
        if (!options.some((o) => o.value === p)) {
          options.push({ value: p, label: p });
        }
      } else if (p && p.name) {
        if (!options.some((o) => o.value === p.name)) {
          options.push({
            value: p.name,
            label: p.name,
            subLabel: p.productCode ? `รหัส: ${p.productCode}` : undefined,
          });
        }
      }
    });

    options.push({
      value: CUSTOM_PRODUCT_VALUE,
      label: "➕ ระบุสินค้าอื่นๆ / ไม่พบในระบบ",
    });

    return options;
  }, [masterProductList, target?.showcase]);

  const normalizeSoldProductItem = (p: any, idx: number): SoldProductItem => {
    const qty = String(p.quantity ?? p.actualQty ?? "");
    const sales = String(p.actualSales ?? "");
    const remarks = String(p.remarks || p.unclosedReason || p.notes || "");
    const isCustom = Boolean(
      p.isCustomProduct ||
      p.isCustom ||
      (!p.productId && p.productName && p.productName.trim() !== ""),
    );
    return {
      id: p.id || `item-${idx + 1}`,
      productId: isCustom ? undefined : p.productId,
      productName: p.productName || "",
      productCode: isCustom ? undefined : p.productCode,
      quantity: qty,
      actualQty: qty,
      actualSales: sales,
      remarks: remarks,
      isCustom,
      isCustomProduct: isCustom,
    };
  };

  // Internal state for sold products list
  const [localSoldProducts, setLocalSoldProducts] = useState<SoldProductItem[]>(() => {
    if (soldProducts && soldProducts.length > 0) {
      return soldProducts.map((p, idx) => normalizeSoldProductItem(p, idx));
    }
    if (soldProduct || soldQuantity || actualSalesOrBooking || soldDetails) {
      const q = soldQuantity || "";
      return [
        {
          id: "item-1",
          productName: soldProduct || target?.showcase || "",
          quantity: q,
          actualQty: q,
          actualSales: actualSalesOrBooking || "",
          remarks: soldDetails || "",
          isCustom: false,
          isCustomProduct: false,
        },
      ];
    }
    return [
      {
        id: "item-1",
        productName: target?.showcase || "",
        quantity: "",
        actualQty: "",
        actualSales: "",
        remarks: "",
        isCustom: false,
        isCustomProduct: false,
      },
    ];
  });

  // Sync external changes if soldProducts prop is passed
  const prevSoldProductsRef = useRef<SoldProductItem[] | undefined>(soldProducts);
  useEffect(() => {
    if (
      soldProducts &&
      soldProducts.length > 0 &&
      soldProducts !== prevSoldProductsRef.current
    ) {
      prevSoldProductsRef.current = soldProducts;
      setLocalSoldProducts(soldProducts.map((p, idx) => normalizeSoldProductItem(p, idx)));
    }
  }, [soldProducts]);

  // Detect whether there is existing sales data to auto-turn-on in edit mode
  const hasExistingSalesData = useMemo(() => {
    if (typeof hasSales === "boolean") return hasSales;
    if (
      soldProducts &&
      soldProducts.some(
        (p: any) =>
          (p.productName && p.productName.trim() !== "") ||
          (p.actualSales && p.actualSales.trim() !== "" && p.actualSales.trim() !== "0") ||
          (p.quantity && String(p.quantity).trim() !== "" && String(p.quantity).trim() !== "0") ||
          (p.actualQty && String(p.actualQty).trim() !== "" && String(p.actualQty).trim() !== "0"),
      )
    ) {
      return true;
    }
    if (soldProduct && soldProduct.trim() !== "") return true;
    if (
      actualSalesOrBooking &&
      actualSalesOrBooking.trim() !== "" &&
      actualSalesOrBooking.trim() !== "0"
    ) {
      const num = parseFloat(actualSalesOrBooking.replace(/,/g, ""));
      if (!isNaN(num) && num > 0) return true;
    }
    return false;
  }, [hasSales, soldProducts, soldProduct, actualSalesOrBooking]);

  const [localHasSales, setLocalHasSales] = useState<boolean>(hasExistingSalesData);

  // Sync if hasSales prop changes from parent or if soldProducts loads with data
  useEffect(() => {
    if (typeof hasSales === "boolean") {
      setLocalHasSales(hasSales);
      return;
    }
    if (
      soldProducts &&
      soldProducts.some(
        (p: any) =>
          (p.productName && p.productName.trim() !== "") ||
          (p.actualSales && p.actualSales.trim() !== "" && p.actualSales.trim() !== "0") ||
          (p.quantity && String(p.quantity).trim() !== "" && String(p.quantity).trim() !== "0") ||
          (p.actualQty && String(p.actualQty).trim() !== "" && String(p.actualQty).trim() !== "0"),
      )
    ) {
      setLocalHasSales(true);
    }
  }, [hasSales, soldProducts]);

  // Also auto-turn-on if total actualSalesOrBooking has an amount
  useEffect(() => {
    if (
      actualSalesOrBooking &&
      actualSalesOrBooking.trim() !== "" &&
      actualSalesOrBooking.trim() !== "0"
    ) {
      const num = parseFloat(actualSalesOrBooking.replace(/,/g, ""));
      if (!isNaN(num) && num > 0) {
        setLocalHasSales(true);
      }
    }
  }, [actualSalesOrBooking]);

  if (!isVisible) return null;

  // Handle files change for GalleryUpload
  const handleFilesChange = (files: FileWithPreview[]) => {
    const converted = filesWithPreviewToImageFiles(files);
    if (!isImageFilesEqual(images, converted) && setImages) {
      setImages(converted);
    }
  };

  // Handle Switch toggle for hasSales
  const handleToggleHasSales = (checked: boolean) => {
    setLocalHasSales(checked);
    if (setHasSales) setHasSales(checked);

    if (!checked) {
      // เมื่อปิดสวิตช์: รีเซ็ตยอดขายรวม (actualSalesOrBooking) ให้เป็น 0
      setActualSalesOrBooking("0");
    } else {
      // เมื่อเปิดสวิตช์: หากมีรายการสินค้าเดิมที่มีการคำนวณไว้ ให้คำนวณยอดขายรวมใหม่
      const totalActual = localSoldProducts.reduce((sum, item) => {
        const clean = parseFloat(String(item.actualSales ?? "").replace(/,/g, "").trim());
        return sum + (isNaN(clean) ? 0 : clean);
      }, 0);
      if (totalActual > 0) {
        setActualSalesOrBooking(totalActual.toLocaleString());
      } else if (actualSalesOrBooking === "0") {
        setActualSalesOrBooking("");
      }
    }
  };

  // Toggle custom product mode ("กรอกชื่อสินค้าเอง")
  const handleToggleCustomProduct = (index: number, isCustom: boolean) => {
    const updated = [...localSoldProducts];
    const current = { ...updated[index] };
    current.isCustom = isCustom;
    current.isCustomProduct = isCustom;

    if (isCustom) {
      // เมื่อติ๊กเลือก: รีเซ็ตค่า productId และ productCode เพื่อไม่ให้ผูกกับ Master Data
      current.productId = undefined;
      current.productCode = undefined;
    } else {
      // เมื่อสลับกลับเป็น Master Combobox: ตรวจหาว่าชื่อตรงกับ Master Product หรือไม่
      const matched = masterProductList.find(
        (p) => typeof p !== "string" && (p.name === current.productName || p.id === current.productName),
      );
      if (matched && typeof matched !== "string") {
        current.productId = matched.id;
        current.productCode = matched.productCode || undefined;
      } else {
        current.productId = undefined;
        current.productCode = undefined;
      }
    }

    updated[index] = current;
    setLocalSoldProducts(updated);
    if (setSoldProducts) setSoldProducts(updated);
    if (index === 0 && setSoldProduct) {
      setSoldProduct(current.productName || "");
    }
  };

  // Handle item change
  const handleItemChange = (
    index: number,
    field: keyof SoldProductItem,
    value: any,
  ) => {
    const updated = [...localSoldProducts];
    const current = { ...updated[index], [field]: value };
    if (field === "quantity") {
      current.actualQty = String(value);
    } else if (field === "actualQty") {
      current.quantity = String(value);
    }

    // Auto-resolve productId & unit price if selecting a product from master
    if (field === "productName") {
      if (value === CUSTOM_PRODUCT_VALUE) {
        current.isCustom = true;
        current.isCustomProduct = true;
        current.productName = "";
        current.productId = undefined;
        current.productCode = undefined;
      } else if (!current.isCustom && !current.isCustomProduct) {
        const matched = masterProductList.find(
          (p) => typeof p !== "string" && (p.name === value || p.id === value),
        );
        if (matched && typeof matched !== "string") {
          current.productId = matched.id;
          current.productCode = matched.productCode || undefined;
          // Auto calculate actual sales if qty already entered and actualSales is empty
          if (matched.price && current.quantity && !current.actualSales) {
            const qtyNum = parseFloat(String(current.quantity).replace(/,/g, ""));
            if (!isNaN(qtyNum) && qtyNum > 0) {
              current.actualSales = (qtyNum * matched.price).toLocaleString();
            }
          }
        }
      }
    }

    // Auto-calculate sales amount when quantity changes if price is available
    if (field === "quantity" && current.productId) {
      const matched = masterProductList.find(
        (p) => typeof p !== "string" && (p.id === current.productId || p.name === current.productName),
      );
      if (matched && typeof matched !== "string" && matched.price) {
        const qtyNum = parseFloat(String(value).replace(/,/g, ""));
        if (!isNaN(qtyNum) && qtyNum > 0 && !current.actualSales) {
          current.actualSales = (qtyNum * matched.price).toLocaleString();
        }
      }
    }

    updated[index] = current;
    setLocalSoldProducts(updated);

    // Sync to parent hooks/callbacks
    if (setSoldProducts) {
      setSoldProducts(updated);
    }
    if (index === 0) {
      if (setSoldProduct) setSoldProduct(current.productName || "");
      if (setSoldQuantity) setSoldQuantity(String(current.quantity ?? ""));
      if (setSoldDetails) setSoldDetails(current.remarks || "");
    }

    // Auto sum actual sales to setActualSalesOrBooking
    const totalActual = updated.reduce((sum, item) => {
      const clean = parseFloat(String(item.actualSales ?? "").replace(/,/g, "").trim());
      return sum + (isNaN(clean) ? 0 : clean);
    }, 0);

    if (totalActual > 0) {
      setActualSalesOrBooking(totalActual.toLocaleString());
    }
  };

  // Add another product row
  const handleAddProduct = () => {
    const updated = [
      ...localSoldProducts,
      {
        id: `item-${Date.now()}`,
        productName: "",
        quantity: "",
        actualSales: "",
        remarks: "",
        isCustom: false,
        isCustomProduct: false,
      },
    ];
    setLocalSoldProducts(updated);
    if (setSoldProducts) setSoldProducts(updated);
  };

  // Remove a product row
  const handleRemoveProduct = (index: number) => {
    if (localSoldProducts.length <= 1) {
      // Clear values of the single row instead of removing it
      const cleared = [
        {
          id: "item-1",
          productName: "",
          quantity: "",
          actualSales: "",
          remarks: "",
          isCustom: false,
          isCustomProduct: false,
        },
      ];
      setLocalSoldProducts(cleared);
      if (setSoldProducts) setSoldProducts(cleared);
      if (setSoldProduct) setSoldProduct("");
      if (setSoldQuantity) setSoldQuantity("");
      if (setSoldDetails) setSoldDetails("");
      setActualSalesOrBooking("0");
      return;
    }

    const updated = localSoldProducts.filter((_, idx) => idx !== index);
    setLocalSoldProducts(updated);
    if (setSoldProducts) setSoldProducts(updated);

    // Recalculate total sales
    const totalActual = updated.reduce((sum, item) => {
      const clean = parseFloat(String(item.actualSales ?? "").replace(/,/g, "").trim());
      return sum + (isNaN(clean) ? 0 : clean);
    }, 0);
    setActualSalesOrBooking(totalActual > 0 ? totalActual.toLocaleString() : "0");
  };

  // Compute total sales across all sold products
  const totalSoldAmount = localSoldProducts.reduce((sum, item) => {
    const clean = parseFloat(String(item.actualSales ?? "").replace(/,/g, "").trim());
    return sum + (isNaN(clean) ? 0 : clean);
  }, 0);

  return (
    <div className="border border-orange-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-orange-100 pb-3">
        <div className="flex items-center gap-2.5">
          <h2 className="font-bold text-orange-900 text-base md:text-lg">
            จัดงาน Field Day
          </h2>
        </div>
      </div>

      <Type10PlanCard target={target} planType={planType} />

      {/* Primary General Metrics: Attendees & Actual Sales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-800">
            จำนวนผู้เข้าร่วมจริง (คน) <span className="text-rose-500">*</span>
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

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-800 flex items-center justify-between">
            <span>
              ยอดขายหรือยอดจองที่เกิดขึ้นจริง (บาท){" "}
              <span className="text-rose-500">*</span>
            </span>
            {!localHasSales && (
              <span className="text-xs font-normal text-slate-500">
                (ไม่มียอดขายสินค้า)
              </span>
            )}
          </label>
          <div className="relative flex items-center">
            <Input
              type="text"
              value={actualSalesOrBooking}
              onChange={(e) => {
                const val = e.target.value;
                setActualSalesOrBooking(val);
                // Also sync with single sold item if only 1 item present and sales enabled
                if (localHasSales && localSoldProducts.length === 1) {
                  const updated = [...localSoldProducts];
                  updated[0].actualSales = val;
                  setLocalSoldProducts(updated);
                  if (setSoldProducts) setSoldProducts(updated);
                }
              }}
              placeholder="0.00"
              className="bg-white border-slate-300 pr-12 font-medium"
            />
            <span className="absolute right-3 text-xs font-semibold text-slate-500">
              บาท
            </span>
          </div>
        </div>
      </div>

      {/* SECTION: เลือกสินค้าที่ขายได้ (Sold Products Section with Switch) */}
      <div className="space-y-4 bg-orange-50/30 border border-orange-200/80 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-orange-200/70 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center border border-orange-200 shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-orange-950">
                  สินค้าที่ขายได้ในกิจกรรม
                </h3>
                {localHasSales && localSoldProducts.length > 0 && (
                  <Badge
                    variant="outline"
                    className="bg-orange-100 text-orange-800 border-orange-300 text-xs font-semibold"
                  >
                    {localSoldProducts.length} รายการ
                  </Badge>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-orange-800/80">
                {localHasSales
                  ? "บันทึกสินค้า ปริมาณ ยอดขาย และรายละเอียดการปิดการขายในงาน Field Day"
                  : "ปิดการบันทึกหากไม่มีการขายสินค้าในกิจกรรมนี้ (ยอดขายจะเป็น 0 บาท)"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Switch Toggle */}
            <div className="flex items-center gap-2.5 bg-white px-3 py-1.5 rounded-xl border border-orange-200/80 shadow-2xs">
              <label
                htmlFor="has-sales-switch"
                className="text-xs sm:text-sm font-semibold text-slate-700 cursor-pointer select-none"
              >
                {localHasSales ? "มียอดขายสินค้า" : "ไม่มียอดขายสินค้า"}
              </label>
              <Switch
                id="has-sales-switch"
                checked={localHasSales}
                onCheckedChange={handleToggleHasSales}
                className="data-[state=checked]:bg-orange-600 cursor-pointer"
              />
            </div>

            {/* Add product button (visible only when hasSales is active) */}
            {localHasSales && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddProduct}
                className="border-orange-300 text-orange-800 hover:bg-orange-100 hover:text-orange-950 font-bold text-xs h-8 flex items-center gap-1.5 shadow-2xs cursor-pointer bg-white"
              >
                <Plus className="w-3.5 h-3.5 text-orange-600" />
                <span className="hidden sm:inline">เพิ่มสินค้า</span>
              </Button>
            )}
          </div>
        </div>

        {/* Conditional Rendering based on Switch state */}
        {localHasSales ? (
          <div className="space-y-4 pt-1">
            {localSoldProducts.map((item, idx) => {
              const isCustomMode = Boolean(item.isCustomProduct || item.isCustom);
              const comboboxVal = item.productName || "";

              return (
                <div
                  key={item.id || idx}
                  className="bg-white border border-orange-200 rounded-xl p-3.5 sm:p-4 space-y-3 shadow-2xs relative"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <span className="text-xs font-bold text-orange-900 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-orange-600" />
                      รายการสินค้าที่ #{idx + 1}
                    </span>

                    <div className="flex items-center gap-2.5">
                      {/* Checkbox / Switch: กรอกชื่อสินค้าเอง */}
                      <div className="flex items-center gap-1.5 bg-orange-50/70 hover:bg-orange-100/70 transition-colors px-2.5 py-1 rounded-lg border border-orange-200/80">
                        <Checkbox
                          id={`custom-product-${item.id || idx}`}
                          checked={isCustomMode}
                          onCheckedChange={(checked) => {
                            handleToggleCustomProduct(idx, Boolean(checked));
                          }}
                          className="data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600 cursor-pointer"
                        />
                        <label
                          htmlFor={`custom-product-${item.id || idx}`}
                          className="text-[11px] sm:text-xs font-semibold text-orange-950 cursor-pointer select-none"
                        >
                          กรอกชื่อสินค้าเอง
                        </label>
                      </div>

                      {localSoldProducts.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveProduct(idx)}
                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-7 px-2 text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ลบ</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* 1. เลือกสินค้าที่ขายได้ หรือ พิมพ์ชื่อเอง */}
                  {isCustomMode ? (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800">
                        ชื่อสินค้า (กรอกชื่อเอง) <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        type="text"
                        value={item.productName === CUSTOM_PRODUCT_VALUE ? "" : item.productName || ""}
                        onChange={(e) =>
                          handleItemChange(idx, "productName", e.target.value)
                        }
                        placeholder="พิมพ์ระบุชื่อสินค้าที่ขายได้ เช่น ปุ๋ยอินทรีย์, ฮอร์โมนพืช, สินค้าอื่นๆ..."
                        className="bg-white border-orange-300 text-xs sm:text-sm font-medium"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <FormCombobox
                        label="เลือกสินค้าที่ขายได้"
                        required
                        value={comboboxVal}
                        onChange={(val: string) => {
                          if (val === CUSTOM_PRODUCT_VALUE) {
                            handleToggleCustomProduct(idx, true);
                          } else {
                            handleItemChange(idx, "productName", val);
                          }
                        }}
                        options={productComboboxOptions}
                        placeholder={
                          loadingProducts
                            ? "กำลังโหลดรายการสินค้า..."
                            : "ค้นหาหรือเลือกสินค้าที่ขายได้..."
                        }
                        searchPlaceholder="พิมพ์ชื่อสินค้าหรือรหัสสินค้า..."
                        emptyText="ไม่พบรายการสินค้าในระบบ"
                        className="w-full bg-white text-sm"
                      />
                    </div>
                  )}

                  {/* 2 & 3. จำนวนที่ขายได้ & ยอดขายจริง (บาท) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800">
                        จำนวนที่ขายได้ (Quantity) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <Input
                          type="number"
                          min="0"
                          value={item.quantity || item.actualQty || ""}
                          onChange={(e) =>
                            handleItemChange(idx, "quantity", e.target.value)
                          }
                          placeholder="ระบุจำนวน"
                          className="bg-white border-slate-300 pr-12 text-xs sm:text-sm"
                        />
                        <span className="absolute right-3 text-xs font-semibold text-slate-500">
                          หน่วย
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800">
                        ยอดขายจริง (บาท) (Actual Sales Amount) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <Input
                          type="text"
                          value={item.actualSales}
                          onChange={(e) =>
                            handleItemChange(idx, "actualSales", e.target.value)
                          }
                          placeholder="0.00"
                          className="bg-white border-slate-300 pr-12 text-xs sm:text-sm font-semibold text-orange-950"
                        />
                        <span className="absolute right-3 text-xs font-semibold text-slate-500">
                          บาท
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 4. รายละเอียด (Details / Remarks) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800">
                      รายละเอียด (Details / Remarks)
                    </label>
                    <Textarea
                      rows={2}
                      value={item.remarks ?? ""}
                      onChange={(e) =>
                        handleItemChange(idx, "remarks", e.target.value)
                      }
                      placeholder="ระบุรายละเอียดเพิ่มเติมเกี่ยวกับสินค้าที่ขายได้ เช่น โปรโมชั่น, ส่วนลด, เงื่อนไขการขาย หรือข้อมูลเกษตรกรที่ซื้อ..."
                      className="bg-white border-slate-300 text-xs sm:text-sm resize-none"
                    />
                  </div>
                </div>
              );
            })}

            {/* Footer summary for sold products */}
            {totalSoldAmount > 0 && (
              <div className="bg-orange-100/70 border border-orange-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-orange-900">
                  ยอดขายจริงรวม ({localSoldProducts.length} รายการ):
                </span>
                <span className="font-extrabold text-orange-950 text-sm sm:text-base">
                  ฿{totalSoldAmount.toLocaleString()} บาท
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="py-5 px-4 text-center border border-dashed border-orange-200/90 rounded-xl bg-white/70 space-y-1">
            <p className="text-xs sm:text-sm font-semibold text-slate-700">
              ไม่มีสินค้าที่ขายได้ในกิจกรรม Field Day นี้
            </p>
            <p className="text-[11px] text-slate-500">
              ยอดขายที่บันทึกสำหรับกิจกรรมนี้ถูกตั้งค่าเป็น 0 บาท หากมีสินค้าที่ขายได้ สามารถเปิดสวิตช์ &quot;มียอดขายสินค้า&quot; ด้านบนเพื่อกรอกข้อมูล
            </p>
          </div>
        )}
      </div>

      {/* Farmer Feedback */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-800">
          ผลตอบรับของเกษตรกร (ภาพรวม) <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3 max-w-sm">
          {(["สูง", "กลาง", "ต่ำ"] as const).map((fb) => (
            <button
              key={fb}
              type="button"
              onClick={() => setFarmerFeedback(fb)}
              className={cn(
                "py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all",
                farmerFeedback === fb
                  ? fb === "สูง"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20"
                    : fb === "กลาง"
                      ? "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20"
                      : "bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
              )}
            >
              {fb === "สูง" ? "🌟 สูงมาก" : fb === "กลาง" ? "👍 ปานกลาง" : "⚠️ ต่ำ"}
            </button>
          ))}
        </div>
      </div>

      {/* GalleryUpload Standard */}
      <div className="bg-orange-50/20 border border-orange-200/70 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 border-b border-orange-100 pb-2.5">
          <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center border border-orange-200">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-orange-950">
              รูปภาพบรรยากาศงาน Field Day
            </h4>
            <p className="text-[11px] text-orange-700/80">
              อัปโหลดรูปภาพบรรยากาศการจัดงานแปลงสาธิตและเกษตรกรเข้าร่วม (สูงสุด 10 รูป)
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
