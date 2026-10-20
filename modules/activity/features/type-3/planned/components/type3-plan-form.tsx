"use client";

import React from "react";
import { ShoppingCart, Plus, Trash2, Store, Package, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityInput } from "@/components/activity/activity-input";
import { ActivityCustomerSelect } from "@/components/activity/activity-customer-select";
import {
  ActivityProductSelect,
  type ActivityProductItem,
} from "@/components/activity/activity-product-select";
import { cn } from "@/lib/utils";
import type {
  Type3SalesItem,
  Type3SalesProductLine,
  Type3PlanFormProps,
} from "../types/planned.types";
import type { StoreOption, ProductOption } from "../../shared/types";

export type { Type3PlanFormProps };

export function Type3PlanForm({
  readonly = false,
  type3Items,
  addType3Row,
  updateType3Row,
  deleteType3Row,
  addProductToRow,
  updateProductInRow,
  deleteProductFromRow,
  customers = [],
  products = [],
}: Type3PlanFormProps) {
  // Local fallback handlers if not provided by parent hook
  const handleAddProduct = (rowId: string) => {
    if (addProductToRow) {
      addProductToRow(rowId);
    } else {
      const item = type3Items.find((i) => i.id === rowId);
      if (!item) return;
      const currentProds = item.products || [];
      const newProd: Type3SalesProductLine = {
        id: `p-${rowId}-${Date.now()}`,
        productName: "",
        quantity: 1,
        unitPrice: 0,
        price: 0,
        notes: "",
      };
      updateType3Row(rowId, "products", [...currentProds, newProd]);
    }
  };

  const handleUpdateProduct = (
    rowId: string,
    prodId: string,
    field: keyof Type3SalesProductLine,
    val: any,
    productItem?: ActivityProductItem,
  ) => {
    if (updateProductInRow) {
      updateProductInRow(rowId, prodId, field, val);
    } else {
      const item = type3Items.find((i) => i.id === rowId);
      if (!item) return;
      const currentProds = item.products || [];
      const updatedProds = currentProds.map((p) => {
        if (p.id !== prodId) return p;
        const updated = { ...p, [field]: val };
        if (field === "productName" && val) {
          const found =
            productItem ||
            products.find((prod) => prod.name === val || prod.id === val);
          if (found) {
            updated.productId = found.id;
            updated.productName = found.name;
            if (found.price != null && !updated.isPriceOverridden) {
              updated.unitPrice = Number(found.price);
              updated.masterPrice = Number(found.price);
            }
          }
        }
        if (field === "unitPrice") {
          updated.isPriceOverridden = true;
        }
        const q = Number(updated.quantity) || 0;
        const u = Number(updated.unitPrice) || 0;
        updated.price = q * u;
        return updated;
      });
      updateType3Row(rowId, "products", updatedProds);
    }
  };

  const handleDeleteProduct = (rowId: string, prodId: string) => {
    if (deleteProductFromRow) {
      deleteProductFromRow(rowId, prodId);
    } else {
      const item = type3Items.find((i) => i.id === rowId);
      if (!item) return;
      const currentProds = item.products || [];
      const updatedProds = currentProds.filter((p) => p.id !== prodId);
      updateType3Row(
        rowId,
        "products",
        updatedProds.length > 0
          ? updatedProds
          : [
              {
                id: `p-${rowId}-${Date.now()}`,
                productName: "",
                quantity: 1,
                unitPrice: 0,
                price: 0,
              },
            ],
      );
    }
  };

  const totalAllQuantity = type3Items.reduce((sum, item) => {
    if (item.products && item.products.length > 0) {
      return (
        sum +
        item.products.reduce((pSum, p) => pSum + (Number(p.quantity) || 0), 0)
      );
    }
    return sum + (Number(item.quantity) || 0);
  }, 0);

  const totalAllAmount = type3Items.reduce((sum, item) => {
    if (item.products && item.products.length > 0) {
      return (
        sum +
        item.products.reduce(
          (pSum, p) =>
            pSum +
            (Number(p.price) ||
              (Number(p.quantity) || 0) * (Number(p.unitPrice) || 0)),
          0,
        )
      );
    }
    return sum + (Number(item.price) || 0);
  }, 0);

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm sm:text-base">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <ShoppingCart className="h-4 w-4" />
          </div>
          <div>
            <span>เสนอขายสินค้า (Product Sales Proposal)</span>
            <p className="text-xs text-slate-500 font-normal">
              ระบุร้านค้าเป้าหมายและรายการสินค้าที่ต้องการนำเสนอขาย
            </p>
          </div>
        </div>

        {!readonly && (
          <Button
            type="button"
            size="sm"
            onClick={addType3Row}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg h-8 px-3 shadow-sm cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            เพิ่มร้านค้าเป้าหมาย
          </Button>
        )}
      </div>

      {/* Target Stores List */}
      <div className="space-y-4">
        {type3Items.length === 0 ? (
          <div className="py-8 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200 text-xs">
            ยังไม่มีรายการเสนอขายสินค้า กดปุ่ม &quot;เพิ่มร้านค้าเป้าหมาย&quot; ด้านบนเพื่อเริ่มต้น
          </div>
        ) : (
          type3Items.map((item, index) => {
            const isSubDealer = Boolean(item.isSubDealer);
            const prodListLines: Type3SalesProductLine[] =
              item.products && item.products.length > 0
                ? item.products
                : [
                    {
                      id: `p-${item.id}-0`,
                      productName: item.productName || "",
                      quantity: item.quantity != null ? item.quantity : 1,
                      unitPrice: item.unitPrice || 0,
                      price: item.price || 0,
                      notes: item.notes || "",
                    },
                  ];

            const cardTotalQty = prodListLines.reduce(
              (sum, p) => sum + (Number(p.quantity) || 0),
              0,
            );
            const cardTotalAmount = prodListLines.reduce(
              (sum, p) =>
                sum +
                (Number(p.price) ||
                  (Number(p.quantity) || 0) * (Number(p.unitPrice) || 0)),
              0,
            );

            return (
              <div
                key={item.id}
                className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4 transition-all hover:border-emerald-300"
              >
                {/* Store Card Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800">
                      เป้าหมายเสนอขายที่ {index + 1}
                    </span>
                    {isSubDealer && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        Subdealer
                      </span>
                    )}
                  </div>

                  {!readonly && (
                    <button
                      type="button"
                      onClick={() => deleteType3Row(item.id)}
                      className="p-1 rounded-md text-rose-500 hover:bg-rose-50 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>ลบเป้าหมายนี้</span>
                    </button>
                  )}
                </div>

                {/* Customer Type Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    ประเภทลูกค้า / ร้านค้า <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-5">
                    <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                      <input
                        type="radio"
                        name={`customer-type-${item.id}`}
                        checked={!isSubDealer}
                        onChange={() => {
                          updateType3Row(item.id, "isSubDealer", false);
                          updateType3Row(item.id, "subDealerStore", "");
                        }}
                        disabled={readonly}
                        className="text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                      />
                      <span>ตัวแทนจำหน่ายหลัก (Dealer)</span>
                    </label>

                    <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                      <input
                        type="radio"
                        name={`customer-type-${item.id}`}
                        checked={isSubDealer}
                        onChange={() => {
                          updateType3Row(item.id, "isSubDealer", true);
                        }}
                        disabled={readonly}
                        className="text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                      />
                      <span>ร้านค้าย่อย (Subdealer)</span>
                    </label>
                  </div>
                </div>

                {/* Customer Selection Fields */}
                {!isSubDealer ? (
                  <div>
                    <ActivityCustomerSelect
                      id={`customer-combobox-${item.id}`}
                      type="DEALER"
                      label="ชื่อร้านค้า (Dealer)"
                      labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                      triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                      value={item.storeId || ""}
                      onChange={(val, cust) => {
                        updateType3Row(item.id, "storeId", val || undefined);
                        updateType3Row(item.id, "customerName", cust?.name || "");
                      }}
                      customers={customers}
                      placeholder="เลือกร้านค้า Dealer..."
                      searchPlaceholder="ค้นหาร้านค้า Dealer..."
                      emptyText="ไม่พบร้านค้า Dealer ในระบบ"
                      disabled={readonly}
                      required
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-amber-50/40 rounded-xl border border-amber-200/70">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        ชื่อร้าน Subdealer <span className="text-rose-500">*</span>
                      </label>
                      <ActivityInput
                        type="text"
                        value={item.subDealerStore || ""}
                        onChange={(e) =>
                          updateType3Row(item.id, "subDealerStore", e.target.value)
                        }
                        disabled={readonly}
                        placeholder="ระบุชื่อร้านค้า Subdealer..."
                        required
                      />
                    </div>

                    <div>
                      <ActivityCustomerSelect
                        id={`parent-dealer-combobox-${item.id}`}
                        type="DEALER"
                        label="Dealer ต้นสังกัด"
                        labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                        triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                        value={item.storeId || ""}
                        onChange={(val, cust) => {
                          updateType3Row(item.id, "storeId", val || undefined);
                          updateType3Row(item.id, "customerName", cust?.name || "");
                        }}
                        customers={customers}
                        placeholder="เลือก Dealer ต้นสังกัด..."
                        searchPlaceholder="ค้นหา Dealer ต้นสังกัด..."
                        emptyText="ไม่พบ Dealer ในระบบ"
                        disabled={readonly}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Product Lines Section */}
                <div className="space-y-3 bg-slate-50/60 p-3 sm:p-3.5 rounded-xl border border-slate-200/70">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-emerald-600" />
                      รายการสินค้าที่ต้องการเสนอขาย <span className="text-rose-500">*</span>
                    </span>
                    {!readonly && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddProduct(item.id)}
                        className="h-7 text-xs px-2.5 border-emerald-300 text-emerald-700 bg-white hover:bg-emerald-50 shadow-2xs cursor-pointer"
                      >
                        <Plus className="h-3 w-3 mr-1 text-emerald-600" />
                        เพิ่มสินค้า
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {prodListLines.map((prodLine, pIdx) => {
                      const lineAmount =
                        (Number(prodLine.quantity) || 0) *
                        (Number(prodLine.unitPrice) || 0);

                      return (
                        <div
                          key={prodLine.id}
                          className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs"
                        >
                          {/* Product Combobox */}
                          <div className="md:col-span-4">
                            <ActivityProductSelect
                              id={`product-combobox-${item.id}-${prodLine.id}`}
                              label={`สินค้าที่ ${pIdx + 1}`}
                              labelClassName="block text-[11px] font-semibold text-slate-600 mb-1 mx-0"
                              triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                              value={prodLine.productName}
                              valueKey="name"
                              unitFilter="box"
                              onChange={(val, prod) =>
                                handleUpdateProduct(
                                  item.id,
                                  prodLine.id,
                                  "productName",
                                  val,
                                  prod,
                                )
                              }
                              products={products}
                              placeholder="เลือกสินค้า..."
                              searchPlaceholder="ค้นหาสินค้า..."
                              emptyText="ไม่พบสินค้า"
                              disabled={readonly}
                              required
                            />
                          </div>

                          {/* Target Quantity */}
                          <div className="md:col-span-2">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              จำนวนเป้าหมาย <span className="text-rose-500">*</span>
                            </label>
                            <ActivityInput
                              type="number"
                              min={1}
                              value={prodLine.quantity}
                              onChange={(e) =>
                                handleUpdateProduct(
                                  item.id,
                                  prodLine.id,
                                  "quantity",
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              disabled={readonly}
                              className="text-center font-medium"
                              required
                            />
                          </div>

                          {/* Unit Price */}
                          <div className="md:col-span-2">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              ราคา/หน่วย (บาท)
                            </label>
                            <ActivityInput
                              type="number"
                              min={0}
                              value={prodLine.unitPrice ?? 0}
                              onChange={(e) =>
                                handleUpdateProduct(
                                  item.id,
                                  prodLine.id,
                                  "unitPrice",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              disabled={readonly}
                              className="text-right font-medium"
                            />
                          </div>

                          {/* Total Amount (Calculated) */}
                          <div className="md:col-span-3">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              ยอดเงินเป้าหมาย
                            </label>
                            <div className="h-9 px-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-bold text-emerald-800">
                              <span>฿</span>
                              <span>{lineAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          </div>

                          {/* Delete Product Line */}
                          {!readonly && (
                            <div className="md:col-span-1 flex items-center justify-end md:justify-center">
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteProduct(item.id, prodLine.id)
                                }
                                disabled={prodListLines.length <= 1}
                                title={
                                  prodListLines.length <= 1
                                    ? "ต้องมีสินค้าอย่างน้อย 1 รายการ"
                                    : "ลบสินค้า"
                                }
                                className={cn(
                                  "h-9 w-9 rounded-lg flex items-center justify-center transition-colors",
                                  prodListLines.length <= 1
                                    ? "text-slate-300 cursor-not-allowed"
                                    : "text-rose-500 hover:bg-rose-50 hover:text-rose-600 cursor-pointer",
                                )}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Detail & Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ข้อเสนอหรือหมายเหตุเพิ่มเติม
                  </label>
                  <ActivityInput
                    type="text"
                    value={item.detail || item.notes || ""}
                    onChange={(e) => {
                      updateType3Row(item.id, "detail", e.target.value);
                      updateType3Row(item.id, "notes", e.target.value);
                    }}
                    disabled={readonly}
                    placeholder="เช่น เงื่อนไขการชำระเงิน, ข้อตกลงโปรโมชั่นพิเศษ..."
                  />
                </div>

                {/* Target Store Subtotal */}
                <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">
                    รวมรายการสินค้าร้านนี้:{" "}
                    <strong className="text-slate-800">
                      {cardTotalQty.toLocaleString()} หน่วย
                    </strong>
                  </span>
                  <span className="text-slate-600">
                    ยอดเงินเสนอขายร้านนี้:{" "}
                    <strong className="text-emerald-700 text-sm ml-1">
                      ฿{cardTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Global Type 3 Summary Footer */}
      {type3Items.length > 0 && (
        <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-emerald-900 font-bold">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>สรุปเป้าหมายการเสนอขายทั้งหมด</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
              {type3Items.length} ร้านค้า
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-600">
              จำนวนรวม: <strong className="text-slate-900">{totalAllQuantity.toLocaleString()} หน่วย</strong>
            </span>
            <span className="text-emerald-900 font-extrabold text-sm sm:text-base">
              ยอดเงินรวม: ฿{totalAllAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export const Type3Sales = Type3PlanForm;
