"use client";

import { ShoppingCart, Plus, Trash2, Package, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ActivityInput,
  ActivityCustomerSelect,
  ActivityProductSelect,
  type ActivityProductItem,
} from "@/modules/activity/ui";
import { cn } from "@/lib/utils";
import type {
  Type3SalesProductLine,
  Type3PlannedFormProps,
  Type3PlanFormProps,
} from "../types/planned.types";

export type { Type3PlannedFormProps, Type3PlanFormProps };

export function Type3PlannedForm({
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
}: Type3PlannedFormProps) {
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
      updateProductInRow(rowId, prodId, field, val, productItem);
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
            if ((found as any).price != null) {
              updated.unitPrice = Number((found as any).price);
              updated.masterPrice = Number((found as any).price);
              updated.isPriceOverridden = false;
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
            ยังไม่มีรายการเสนอขายสินค้า กดปุ่ม &quot;เพิ่มร้านค้าเป้าหมาย&quot;
            ด้านบนเพื่อเริ่มต้น
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
                        {item.isUnregisteredSubdealer
                          ? "Subdealer (ระบุเอง)"
                          : "Subdealer"}
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
                    ประเภทลูกค้า / ร้านค้า{" "}
                    <span className="text-rose-500">*</span>
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
                          updateType3Row(item.id, "subdealerId", "");
                          updateType3Row(item.id, "subdealerName", "");
                          updateType3Row(
                            item.id,
                            "isUnregisteredSubdealer",
                            false,
                          );
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
                        updateType3Row(
                          item.id,
                          "customerName",
                          cust?.name || "",
                        );
                        updateType3Row(
                          item.id,
                          "dealerName",
                          cust?.name || "",
                        );
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
                  <div className="space-y-3 p-3 bg-amber-50/40 rounded-xl border border-amber-200/70">
                    {item.isUnregisteredSubdealer ? (
                      /* กรณี Subdealer ไม่มีในระบบ (ระบุเอง) */
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              1. ชื่อร้าน Subdealer{" "}
                              <span className="text-rose-500">*</span>
                            </label>
                            <ActivityInput
                              type="text"
                              value={item.subDealerStore || ""}
                              onChange={(e) =>
                                updateType3Row(
                                  item.id,
                                  "subDealerStore",
                                  e.target.value,
                                )
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
                              label="2. Dealer ต้นสังกัด"
                              labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                              triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                              value={item.storeId || ""}
                              onChange={(val, cust) => {
                                updateType3Row(
                                  item.id,
                                  "storeId",
                                  val || undefined,
                                );
                                updateType3Row(
                                  item.id,
                                  "customerName",
                                  cust?.name || "",
                                );
                                updateType3Row(
                                  item.id,
                                  "dealerName",
                                  cust?.name || "",
                                );
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

                        {!readonly && (
                          <div className="flex items-center justify-start pt-1">
                            <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={Boolean(item.isUnregisteredSubdealer)}
                                onChange={(e) => {
                                  const isChecked = e.target.checked;
                                  updateType3Row(
                                    item.id,
                                    "isUnregisteredSubdealer",
                                    isChecked,
                                  );
                                  if (!isChecked) {
                                    updateType3Row(
                                      item.id,
                                      "subDealerStore",
                                      "",
                                    );
                                  } else {
                                    updateType3Row(item.id, "subdealerId", "");
                                    updateType3Row(
                                      item.id,
                                      "subdealerName",
                                      "",
                                    );
                                  }
                                }}
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                              />
                              <span className="text-amber-800 font-semibold">
                                ร้านค้านี้ไม่มีในระบบ (ระบุเอง)
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* กรณี Subdealer มีในระบบ */
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <ActivityCustomerSelect
                              id={`subdealer-combobox-${item.id}`}
                              type="SUBDEALER"
                              label="เลือกร้านค้า Subdealer จากระบบ"
                              labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                              triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                              value={item.subdealerId || ""}
                              onChange={(val, cust) => {
                                updateType3Row(
                                  item.id,
                                  "subdealerId",
                                  val || undefined,
                                );
                                updateType3Row(
                                  item.id,
                                  "subdealerName",
                                  cust?.name || "",
                                );
                                if (cust) {
                                  // Auto fill Dealer ต้นสังกัด if subdealer has parentDealerId
                                  if (cust.parentDealerId) {
                                    const parent = customers.find(
                                      (c) => c.id === cust.parentDealerId,
                                    );
                                    if (parent) {
                                      updateType3Row(
                                        item.id,
                                        "storeId",
                                        parent.id,
                                      );
                                      updateType3Row(
                                        item.id,
                                        "customerName",
                                        parent.name,
                                      );
                                      updateType3Row(
                                        item.id,
                                        "dealerName",
                                        parent.name,
                                      );
                                    }
                                  }
                                } else {
                                  updateType3Row(item.id, "subdealerName", "");
                                }
                              }}
                              customers={customers}
                              placeholder="เลือกร้านค้า Subdealer ในระบบ..."
                              searchPlaceholder="ค้นหาร้านค้า Subdealer..."
                              emptyText="ไม่พบร้านค้า Subdealer ในระบบ"
                              disabled={readonly}
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
                                updateType3Row(
                                  item.id,
                                  "storeId",
                                  val || undefined,
                                );
                                updateType3Row(
                                  item.id,
                                  "customerName",
                                  cust?.name || "",
                                );
                                updateType3Row(
                                  item.id,
                                  "dealerName",
                                  cust?.name || "",
                                );
                              }}
                              customers={customers}
                              placeholder="เลือก Dealer ต้นสังกัด..."
                              searchPlaceholder="ค้นหา Dealer ต้นสังกัด..."
                              emptyText="ไม่พบ Dealer ในระบบ"
                              disabled={readonly}
                            />
                          </div>
                        </div>

                        {!readonly && (
                          <div className="flex items-center justify-start pt-1">
                            <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={Boolean(item.isUnregisteredSubdealer)}
                                onChange={(e) => {
                                  const isChecked = e.target.checked;
                                  updateType3Row(
                                    item.id,
                                    "isUnregisteredSubdealer",
                                    isChecked,
                                  );
                                  if (isChecked) {
                                    updateType3Row(item.id, "subdealerId", "");
                                    updateType3Row(
                                      item.id,
                                      "subdealerName",
                                      "",
                                    );
                                  } else {
                                    updateType3Row(
                                      item.id,
                                      "subDealerStore",
                                      "",
                                    );
                                  }
                                }}
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                              />
                              <span>ร้านค้านี้ไม่มีในระบบ (ระบุเอง)</span>
                            </label>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Product Lines Section */}
                <div className="space-y-3 bg-slate-50/60 p-3 sm:p-3.5 rounded-xl border border-slate-200/70">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-emerald-600" />
                      รายการสินค้าที่ต้องการเสนอขาย{" "}
                      <span className="text-rose-500">*</span>
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
                          {/* 1. ขยายช่องสินค้าเป็น col-span-5 (หรือ col-span-6 หากเป็น readonly) */}
                          <div
                            className={
                              readonly ? "md:col-span-6" : "md:col-span-5"
                            }
                          >
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

                          {/* 2. จำนวนเป้าหมาย (คงเดิม 2) */}
                          <div className="md:col-span-2">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              จำนวนเป้าหมาย (ลัง){" "}
                              <span className="text-rose-500">*</span>
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

                          {/* 3. ราคา/ลัง (คงเดิม 2) */}
                          <div className="md:col-span-2">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              ราคา/ลัง (บาท)
                            </label>
                            <ActivityInput
                              type="number"
                              min={0}
                              value={
                                prodLine.unitPrice === 0
                                  ? ""
                                  : (prodLine.unitPrice ?? "")
                              }
                              onChange={(e) =>
                                handleUpdateProduct(
                                  item.id,
                                  prodLine.id,
                                  "unitPrice",
                                  e.target.value === ""
                                    ? 0
                                    : parseFloat(e.target.value) || 0,
                                )
                              }
                              disabled={readonly}
                              className="text-right font-medium"
                              placeholder="0"
                            />
                          </div>

                          {/* 4. ยอดเงินเป้าหมาย ปรับลดเหลือ md:col-span-2 */}
                          <div className="md:col-span-2">
                            <label
                              className="block text-[11px] font-semibold text-slate-600 mb-1 truncate"
                              title="ยอดเงินเป้าหมาย"
                            >
                              ยอดเงินเป้าหมาย
                            </label>
                            <div className="h-9 px-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-bold text-emerald-800">
                              <span className="text-[11px] text-slate-400">
                                ฿
                              </span>
                              <span className="truncate">
                                {lineAmount.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                          </div>

                          {/* 5. ปุ่มลบ (คงเดิม 1) */}
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
                      {cardTotalQty.toLocaleString()} ลัง
                    </strong>
                  </span>
                  <span className="text-slate-600">
                    ยอดเงินเสนอขายร้านนี้:{" "}
                    <strong className="text-emerald-700 text-sm ml-1">
                      ฿
                      {cardTotalAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
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
              จำนวนรวม:{" "}
              <strong className="text-slate-900">
                {totalAllQuantity.toLocaleString()} ลัง
              </strong>
            </span>
            <span className="text-emerald-900 font-extrabold text-sm sm:text-base">
              ยอดเงินรวม: ฿
              {totalAllAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export const Type3PlanForm = Type3PlannedForm;
export const Type3Sales = Type3PlannedForm;
