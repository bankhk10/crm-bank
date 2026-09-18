"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Target,
  ShoppingBag,
  CheckCircle2,
  Plus,
  Trash2,
  Package,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActualTargetCard } from "../actual-target-card";
import { FormCombobox } from "@/components/custom/FormCombobox";
import { listProductsAction } from "@/modules/products/server/actions";

export interface TargetProductItem {
  id?: string;
  productId?: string;
  productName: string;
  customer?: string;
  storeId?: string;
  isSubDealer?: boolean;
  subDealerStore?: string;
  dealerName?: string;
  qty: string;
  unitPrice?: string;
  detail?: string;
  notes?: string;
  unit?: string;
  price?: string;
  actualQty?: string;
  actualSales?: string;
  unclosedReason?: string;
  isAdditional?: boolean;
}

export interface Type3ProductSaleDetail {
  id?: string;
  productId?: string;
  productName: string;
  customer?: string;
  storeId?: string;
  qty?: string;
  unitPrice?: string;
  price?: string;
  actualQty?: string;
  actualSales?: string;
  unclosedReason?: string;
  isAdditional?: boolean;
}

function extractUnit(qtyStr?: string): string {
  if (!qtyStr) return "ชิ้น";
  const match = qtyStr.match(/([^\d\s]+)$/);
  return match ? match[1] : "ชิ้น";
}

function parseProductQty(
  actualQuantityText: string | undefined,
  productName: string,
): string {
  if (!actualQuantityText) return "";
  const escaped = productName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    `(?:^|,\\s*)${escaped}:\\s*(\\d+(?:\\.\\d+)?)[^,]*`,
    "i",
  );
  const match = actualQuantityText.match(regex);
  if (match && match[1]) {
    return match[1].trim();
  }
  if (!actualQuantityText.includes(":") && !actualQuantityText.includes(",")) {
    const numMatch = actualQuantityText.match(/\d+(?:\.\d+)?/);
    return numMatch ? numMatch[0] : "";
  }
  return "";
}

function parseProductReason(
  unclosedReasonText: string | undefined,
  productName: string,
): string {
  if (!unclosedReasonText) return "";
  const escaped = productName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(?:^|\\|\\s*)${escaped}:\\s*([^|]+)`, "i");
  const match = unclosedReasonText.match(regex);
  if (match && match[1]) {
    return match[1].trim();
  }
  if (!unclosedReasonText.includes(":") && !unclosedReasonText.includes("|")) {
    return unclosedReasonText.trim();
  }
  return "";
}

interface ActualType3SalesProps {
  isVisible: boolean;
  target: {
    product: string;
    customer: string;
    targetQty: string;
    targetSales: string;
    unitPrice?: string;
    detail?: string;
    isSubDealer?: boolean;
    subDealerStore?: string;
    dealerName?: string;
    items?: TargetProductItem[];
  };
  products?: Array<{ id: string; name: string; productCode?: string | null }>;
  soldProducts: string;
  setSoldProducts: (v: string) => void;
  actualSales: string;
  setActualSales: (v: string) => void;
  actualQuantity: string;
  setActualQuantity: (v: string) => void;
  unclosedReason: string;
  setUnclosedReason: (v: string) => void;
  productSalesDetails?: Type3ProductSaleDetail[];
  setProductSalesDetails?: (v: Type3ProductSaleDetail[]) => void;
}

export function ActualType3Sales({
  isVisible,
  target,
  products = [],
  setSoldProducts,
  actualSales,
  setActualSales,
  actualQuantity,
  setActualQuantity,
  unclosedReason,
  setUnclosedReason,
  productSalesDetails,
  setProductSalesDetails,
}: ActualType3SalesProps) {
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

  // 1. Initial Planned items from target
  const initialPlannedItems: TargetProductItem[] = useMemo(() => {
    if (target.items && target.items.length > 0) {
      return target.items.map((item, idx) => {
        const saved =
          productSalesDetails?.find(
            (d) =>
              !d.isAdditional &&
              ((item.id && d.id === item.id) ||
                (item.productId && d.productId === item.productId) ||
                d.productName === item.productName),
          ) ||
          productSalesDetails?.filter((d) => !d.isAdditional)?.[idx];

        const fallbackQty = parseProductQty(actualQuantity, item.productName);
        const fallbackReason = parseProductReason(
          unclosedReason,
          item.productName,
        );

        return {
          ...item,
          productId: item.productId,
          actualQty:
            saved?.actualQty ?? (fallbackQty || item.actualQty || ""),
          actualSales:
            saved?.actualSales ??
            (target.items!.length === 1 && actualSales
              ? actualSales
              : item.actualSales || ""),
          unclosedReason:
            saved?.unclosedReason ??
            (fallbackReason || item.unclosedReason || ""),
          isAdditional: false,
        };
      });
    }

    if (target.product) {
      const fallbackQty =
        parseProductQty(actualQuantity, target.product) || actualQuantity;
      const fallbackReason =
        parseProductReason(unclosedReason, target.product) || unclosedReason;
      const saved =
        productSalesDetails?.find(
          (d) => !d.isAdditional && d.productName === target.product,
        ) || productSalesDetails?.[0];

      return [
        {
          id: "planned-single",
          productName: target.product,
          customer: target.customer,
          qty: target.targetQty,
          unitPrice: target.unitPrice,
          detail: target.detail,
          actualQty: saved?.actualQty ?? (fallbackQty || ""),
          actualSales: saved?.actualSales ?? (actualSales || ""),
          unclosedReason: saved?.unclosedReason ?? (fallbackReason || ""),
          isAdditional: false,
        },
      ];
    }

    return [];
  }, [target]);

  // State: Planned items (สินค้าตามแผน)
  const [plannedItems, setPlannedItems] = useState<TargetProductItem[]>(() => {
    if (productSalesDetails && productSalesDetails.length > 0) {
      const fromSaved = productSalesDetails.filter((d) => !d.isAdditional);
      if (fromSaved.length > 0) {
        if (initialPlannedItems.length > 0) {
          return initialPlannedItems;
        }
        return fromSaved.map((item, idx) => ({
          ...item,
          id: item.id || `planned-${idx}`,
          qty: item.qty || "",
          actualQty: item.actualQty || "",
          actualSales: item.actualSales || "",
          unclosedReason: item.unclosedReason || "",
          isAdditional: false,
        }));
      }
    }
    return initialPlannedItems;
  });

  // State: Additional items (สินค้านอกแผน)
  const [additionalItems, setAdditionalItems] = useState<TargetProductItem[]>(
    () => {
      if (productSalesDetails && productSalesDetails.length > 0) {
        const fromSaved = productSalesDetails.filter((d) => d.isAdditional);
        return fromSaved.map((item) => ({
          ...item,
          id: item.id || crypto.randomUUID(),
          qty: "",
          unit: "ชิ้น",
          actualQty: item.actualQty || "",
          actualSales: item.actualSales || "",
          unclosedReason: item.unclosedReason || "",
          isAdditional: true,
        }));
      }
      return [];
    },
  );

  // Sync combined changes to parent form state
  const syncChanges = (
    currentPlanned: TargetProductItem[],
    currentAdditional: TargetProductItem[],
  ) => {
    const allDetails: Type3ProductSaleDetail[] = [
      ...currentPlanned.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        customer: item.customer,
        storeId: item.storeId,
        qty: item.qty,
        unitPrice: item.unitPrice,
        price: item.price,
        actualQty: item.actualQty,
        actualSales: item.actualSales,
        unclosedReason: item.unclosedReason,
        isAdditional: false,
      })),
      ...currentAdditional.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        customer: item.customer,
        storeId: item.storeId,
        qty: "",
        unitPrice: item.unitPrice,
        price: item.price,
        actualQty: item.actualQty,
        actualSales: item.actualSales,
        unclosedReason: item.unclosedReason,
        isAdditional: true,
      })),
    ];

    if (setProductSalesDetails) {
      setProductSalesDetails(allDetails);
    }

    const allItems = [...currentPlanned, ...currentAdditional];

    // Total actual sales
    const totalSalesSum = allItems.reduce(
      (sum, item) => sum + (Number(item.actualSales) || 0),
      0,
    );
    setActualSales(totalSalesSum > 0 ? String(totalSalesSum) : "");

    // Concatenated quantities
    const concatQty = allItems
      .filter((item) => item.productName)
      .map(
        (item) =>
          `${item.productName}: ${item.actualQty || "0"} ${
            item.unit || extractUnit(item.qty)
          }`,
      )
      .join(", ");
    setActualQuantity(concatQty);

    // Concatenated unclosed reasons
    const concatReasons = allItems
      .map((item) =>
        item.unclosedReason
          ? `${item.productName || "สินค้า"}: ${item.unclosedReason}`
          : "",
      )
      .filter(Boolean)
      .join(" | ");
    setUnclosedReason(concatReasons);

    // Concatenated sold products list
    const soldList = allItems
      .filter(
        (item) =>
          item.productName &&
          (Number(item.actualQty) > 0 || Number(item.actualSales) > 0),
      )
      .map(
        (item) =>
          `${item.productName} (${item.actualQty || "0"} ${
            item.unit || extractUnit(item.qty)
          })`,
      )
      .join(", ");
    setSoldProducts(soldList);
  };

  // Planned items handlers
  const handlePlannedChange = (
    index: number,
    field: "actualQty" | "unclosedReason",
    value: string,
  ) => {
    const updated = [...plannedItems];
    updated[index] = { ...updated[index], [field]: value };
    setPlannedItems(updated);
    syncChanges(updated, additionalItems);
  };

  // Additional items handlers
  const handleAddAdditionalItem = () => {
    const defaultStoreId = plannedItems[0]?.storeId;
    const defaultCustomer = plannedItems[0]?.customer || target.customer || "";

    const newItem: TargetProductItem = {
      id: crypto.randomUUID(),
      productId: "",
      productName: "",
      customer: defaultCustomer,
      storeId: defaultStoreId,
      qty: "",
      actualQty: "",
      actualSales: "",
      unclosedReason: "",
      unit: "ชิ้น",
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
    field:
      | "productId"
      | "productName"
      | "actualQty"
      | "unclosedReason",
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
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setAdditionalItems(updated);
    syncChanges(plannedItems, updated);
  };

  if (!isVisible) return null;

  const allItems = [...plannedItems, ...additionalItems];
  const totalActualSalesSum = allItems.reduce(
    (sum, item) => sum + (Number(item.actualSales) || 0),
    0,
  );
  const totalActualQtySum = allItems.reduce(
    (sum, item) => sum + (Number(item.actualQty) || 0),
    0,
  );

  return (
    <div className="border border-emerald-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-6 shadow-xs">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <h2 className="font-bold text-emerald-950 text-base md:text-lg">
              เสนอขายสินค้า
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              บันทึกผลการเสนอขายจริงตามแผน และเพิ่มรายการขายสินค้านอกแผน
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {plannedItems.length > 0 && (
            <span className="text-xs bg-emerald-50 text-emerald-800 font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
              ตามแผน {plannedItems.length} รายการ
            </span>
          )}
          {additionalItems.length > 0 && (
            <span className="text-xs bg-purple-50 text-purple-800 font-semibold px-2.5 py-1 rounded-full border border-purple-200">
              นอกแผน {additionalItems.length} รายการ
            </span>
          )}
        </div>
      </div>

      {/* TARGET SUMMARY CARD (PLAN OVERVIEW) */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-3">
        <div className="text-xs border-b border-slate-200/60 pb-2.5">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-slate-500">
              ชื่อร้านค้า / Key Farmer:
            </span>
            <div className="font-bold text-slate-900">
              {target.subDealerStore ? (
                <span>
                  <Badge
                    variant="outline"
                    className="mr-1 bg-amber-50 text-amber-800 border-amber-300 text-[10px] font-bold"
                  >
                    Subdealer
                  </Badge>
                  {target.subDealerStore}{" "}
                  <span className="text-slate-500 text-xs font-normal">
                    (Dealer: {target.dealerName || target.customer || "-"})
                  </span>
                </span>
              ) : (
                <span>
                  <Badge
                    variant="outline"
                    className="mr-1 bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-bold"
                  >
                    Dealer
                  </Badge>
                  {target.customer || "-"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Planned Product Target Cards */}
        {plannedItems.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-emerald-600" />
                รายการสินค้าในแผน ({plannedItems.length} รายการ):
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {plannedItems.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-100 pb-1.5">
                    <span className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span>{item.productName}</span>
                    </span>
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                    >
                      ตามแผน
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">เป้าจำนวน:</span>
                      <span className="font-bold text-slate-800">
                        {item.qty ? `${item.qty} หน่วย` : "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">รายละเอียด:</span>
                      <span className="font-medium text-slate-700 truncate block">
                        {item.detail || item.notes || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">ไม่มีรายการสินค้าตามแผนเดิม</p>
        )}
      </div>

      {/* SECTION 1: สินค้าตามแผน (RECORDING FORM) */}
      {plannedItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <span>ผลการขายสินค้าตามแผน ({plannedItems.length} รายการ)</span>
            </label>
            <span className="text-xs text-slate-500 font-medium">
              * ข้อมูลสินค้าและเป้าหมายจากแผนไม่สามารถแก้ไขหรือลบได้
            </span>
          </div>

          <div className="space-y-3">
            {plannedItems.map((prod, idx) => {
              const unitName = prod.unit || extractUnit(prod.qty);

              return (
                <div
                  key={prod.id || idx}
                  className="bg-emerald-50/20 border border-emerald-200/90 rounded-2xl p-4 space-y-3 shadow-2xs"
                >
                  {/* Title Header */}
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5">
                    <div className="flex items-center gap-2 font-bold text-sm text-emerald-950">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-xs">
                        {idx + 1}
                      </span>
                      <span>สินค้า: {prod.productName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-semibold"
                      >
                        เป้าหมาย: {prod.qty ? `${prod.qty} หน่วย` : "-"}
                      </Badge>
                    </div>
                  </div>

                  {/* Inputs */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800">
                      ปริมาณขายจริง (สินค้าที่ {idx + 1}){" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <Input
                        type="number"
                        min="0"
                        value={prod.actualQty || ""}
                        onChange={(e) =>
                          handlePlannedChange(
                            idx,
                            "actualQty",
                            e.target.value,
                          )
                        }
                        placeholder="0"
                        className="bg-white border-slate-300 pr-12 text-sm"
                      />
                      <span className="absolute right-3 text-xs font-semibold text-slate-500">
                        {unitName}
                      </span>
                    </div>
                  </div>

                  {/* Reason / Note */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800">
                      รายละเอียด / เหตุผล (กรณีปิดการขายไม่ได้ตามเป้า)
                    </label>
                    <Textarea
                      rows={2}
                      value={prod.unclosedReason || ""}
                      onChange={(e) =>
                        handlePlannedChange(
                          idx,
                          "unclosedReason",
                          e.target.value,
                        )
                      }
                      placeholder={`ระบุรายละเอียดสำหรับ ${prod.productName} เช่น ปิดการขายได้ตามเป้า หรือติดปัญหาเครดิตเทอม`}
                      className="bg-white border-slate-300 text-xs"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: สินค้านอกแผน (ADDITIONAL PRODUCTS) */}
      <div className="space-y-4 pt-2 border-t border-emerald-100">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
            <label className="text-sm font-bold text-slate-900">
              สินค้านอกแผน (เพิ่มเติมนอกเหนือจากแผน)
            </label>
            {additionalItems.length > 0 && (
              <Badge
                variant="outline"
                className="bg-purple-50 text-purple-700 border-purple-200 text-xs font-bold"
              >
                {additionalItems.length} รายการ
              </Badge>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddAdditionalItem}
            className="border-purple-300 text-purple-700 hover:bg-purple-50 hover:text-purple-800 font-bold text-xs h-8 flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            เพิ่มรายการขายสินค้า
          </Button>
        </div>

        {additionalItems.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-2xl p-6 text-center space-y-2 bg-slate-50/50">
            <div className="w-9 h-9 rounded-full bg-purple-50 text-purple-600 mx-auto flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-slate-700">
                ยังไม่มีการบันทึกสินค้านอกแผน
              </p>
              <p className="text-[11px] text-slate-500">
                หากมีการเสนอขายสินค้าอื่นๆ เพิ่มเติมจากแผนงานเดิม สามารถกดปุ่ม &quot;+ เพิ่มรายการขายสินค้า&quot; ได้
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddAdditionalItem}
              className="text-xs border-purple-200 text-purple-700 hover:bg-purple-50 font-medium mt-1"
            >
              <Plus className="w-3 h-3 mr-1" />
              เพิ่มรายการขายสินค้า
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {additionalItems.map((prod, idx) => (
              <div
                key={prod.id || idx}
                className="bg-purple-50/20 border border-purple-200/90 rounded-2xl p-4 space-y-3 shadow-2xs relative"
              >
                {/* Header of additional item */}
                <div className="flex items-center justify-between border-b border-purple-100 pb-2.5">
                  <div className="flex items-center gap-2 font-bold text-sm text-purple-950">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white text-xs">
                      +{idx + 1}
                    </span>
                    <span>สินค้านอกแผน #{idx + 1}</span>
                    <Badge
                      variant="outline"
                      className="bg-purple-50 text-purple-800 border-purple-300 text-[10px] font-bold"
                    >
                      + สินค้านอกแผน
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAdditionalItem(prod.id || idx)}
                    className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-7 px-2 text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ลบ</span>
                  </Button>
                </div>

                {/* Product Combobox Selection from Master */}
                <div className="space-y-1.5">
                  <FormCombobox
                    label="เลือกสินค้าจาก Product Master"
                    required
                    value={prod.productName}
                    onChange={(val: string) =>
                      handleAdditionalChange(idx, "productName", val)
                    }
                    options={productComboboxOptions}
                    placeholder="ค้นหาหรือเลือกสินค้าจากคลังสินค้า..."
                    searchPlaceholder="พิมพ์ชื่อสินค้า..."
                    emptyText="ไม่พบสินค้าในระบบ"
                    className="w-full bg-white text-sm"
                  />
                </div>

                {/* Inputs: actualQty */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    ปริมาณขายจริง <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Input
                      type="number"
                      min="0"
                      value={prod.actualQty || ""}
                      onChange={(e) =>
                        handleAdditionalChange(
                          idx,
                          "actualQty",
                          e.target.value,
                        )
                      }
                      placeholder="0"
                      className="bg-white border-slate-300 pr-12 text-sm"
                    />
                    <span className="absolute right-3 text-xs font-semibold text-slate-500">
                      ชิ้น
                    </span>
                  </div>
                </div>

                {/* Reason / Note */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    รายละเอียด / ข้อเสนอ / เหตุผล
                  </label>
                  <Textarea
                    rows={2}
                    value={prod.unclosedReason || ""}
                    onChange={(e) =>
                      handleAdditionalChange(
                        idx,
                        "unclosedReason",
                        e.target.value,
                      )
                    }
                    placeholder="ระบุรายละเอียดเพิ่มเติมเกี่ยวกับสินค้านอกแผนรายการนี้"
                    className="bg-white border-slate-300 text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TOTAL SUMMARY FOOTER FOR TYPE 3 */}
      <div className="bg-emerald-100/60 border border-emerald-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs md:text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            สรุปรวมผลการเสนอขายจริงทั้งหมด ({allItems.length} สินค้า):
          </span>
          {plannedItems.length > 0 && (
            <span className="text-[11px] font-normal text-slate-600 hidden sm:inline">
              (ตามแผน {plannedItems.length}, นอกแผน {additionalItems.length})
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <span className="bg-white text-slate-800 font-bold px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs">
            ปริมาณขายจริงรวม:{" "}
            <span className="text-emerald-700 font-extrabold text-sm">
              {totalActualQtySum.toLocaleString()} หน่วย
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
