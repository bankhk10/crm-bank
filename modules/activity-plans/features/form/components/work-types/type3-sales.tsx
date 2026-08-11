import React from "react";
import { ShoppingCart, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormCombobox } from "@/components/custom/form-components";
import { cn } from "@/lib/utils";
import type { Type3SalesItem, Type3SalesProductLine } from "../../types";
import {
  DEMO_PRODUCTS,
  DEMO_OWNERS,
  DEMO_PRODUCT_PRICES,
} from "../../constants";

export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  responsibleEmployeeId?: string | null;
}

export interface ProductOption {
  id: string;
  name: string;
  productCode?: string | null;
  price?: number | null;
}

interface Props {
  readonly?: boolean;
  type3Items: Type3SalesItem[];
  addType3Row: () => void;
  updateType3Row: (id: string, field: keyof Type3SalesItem, val: any) => void;
  deleteType3Row: (id: string) => void;
  customers?: CustomerOption[];
  products?: ProductOption[];
}

export function Type3Sales({
  readonly = false,
  type3Items,
  addType3Row,
  updateType3Row,
  deleteType3Row,
  customers = [],
  products = [],
}: Props) {
  const customerOptions = (
    customers && customers.length > 0
      ? customers
      : DEMO_OWNERS.map((owner) => ({
          id: owner,
          name: owner,
          customerCode: null,
        }))
  ).map((c) => ({
    value: c.name,
    label: c.name,
  }));

  const productOptions = (
    products && products.length > 0
      ? products
      : DEMO_PRODUCTS.map((prod) => ({
          id: prod,
          name: prod,
          productCode: null,
          price: DEMO_PRODUCT_PRICES[prod] ?? 500,
        }))
  ).map((p) => ({
    value: p.name,
    label: p.name,
    subLabel: p.productCode || undefined,
  }));

  // Add a new product line to a specific proposal item
  const addProductLine = (itemId: string) => {
    const currentItem = type3Items.find((i) => i.id === itemId);
    if (!currentItem) return;

    const currentProducts =
      currentItem.products && currentItem.products.length > 0
        ? currentItem.products
        : [
            {
              id: "p-1",
              productName: currentItem.productName || "",
              quantity: currentItem.quantity || 1,
              unitPrice: currentItem.unitPrice || 0,
              price: (currentItem.quantity || 1) * (currentItem.unitPrice || 0),
            },
          ];

    const defaultProd =
      products && products[0] ? products[0].name : DEMO_PRODUCTS[0] || "";
    const defaultPrice =
      products && products[0] && products[0].price != null
        ? Number(products[0].price)
        : (DEMO_PRODUCT_PRICES[defaultProd] ?? 500);

    const newProdLine: Type3SalesProductLine = {
      id: Date.now().toString(),
      productName: defaultProd,
      quantity: 1,
      unitPrice: defaultPrice,
      price: defaultPrice,
    };

    const updatedProducts = [...currentProducts, newProdLine];
    updateType3Row(itemId, "products", updatedProducts);
  };

  // Update a field inside a specific product line
  const updateProductLine = (
    itemId: string,
    prodId: string,
    field: keyof Type3SalesProductLine,
    val: any,
  ) => {
    const currentItem = type3Items.find((i) => i.id === itemId);
    if (!currentItem) return;

    const currentProducts =
      currentItem.products && currentItem.products.length > 0
        ? currentItem.products
        : [
            {
              id: "p-1",
              productName: currentItem.productName || "",
              quantity: currentItem.quantity || 1,
              unitPrice: currentItem.unitPrice || 0,
              price: (currentItem.quantity || 1) * (currentItem.unitPrice || 0),
            },
          ];

    const updatedProducts = currentProducts.map((p) => {
      if (p.id !== prodId) return p;
      const updated = { ...p, [field]: val };
      if (field === "productName") {
        const foundProd = (products || []).find((prod) => prod.name === val);
        if (foundProd && foundProd.price != null) {
          updated.unitPrice = Number(foundProd.price);
        } else if (DEMO_PRODUCT_PRICES[val] !== undefined) {
          updated.unitPrice = DEMO_PRODUCT_PRICES[val];
        }
      }
      const qty =
        typeof updated.quantity === "number"
          ? updated.quantity
          : parseInt(updated.quantity) || 0;
      const uPrice =
        typeof updated.unitPrice === "number"
          ? updated.unitPrice
          : parseFloat(updated.unitPrice) || 0;
      updated.price = qty * uPrice;
      return updated;
    });

    updateType3Row(itemId, "products", updatedProducts);
  };

  // Delete a specific product line from a proposal item
  const deleteProductLine = (itemId: string, prodId: string) => {
    const currentItem = type3Items.find((i) => i.id === itemId);
    if (!currentItem) return;

    const currentProducts =
      currentItem.products && currentItem.products.length > 0
        ? currentItem.products
        : [];

    const updatedProducts = currentProducts.filter((p) => p.id !== prodId);
    updateType3Row(itemId, "products", updatedProducts);
  };

  const totalAllSales = type3Items.reduce((sum, item) => {
    if (item.products && item.products.length > 0) {
      return (
        sum +
        item.products.reduce(
          (pSum, p) => pSum + (p.quantity || 0) * (p.unitPrice || 0),
          0,
        )
      );
    }
    return sum + (item.quantity || 0) * (item.unitPrice || 0);
  }, 0);

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <ShoppingCart className="h-4 w-4 text-slate-600" />
          <span>เสนอขายสินค้า</span>
        </div>

        {!readonly && (
          <Button
            type="button"
            size="sm"
            onClick={addType3Row}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            เพิ่มรายการ
          </Button>
        )}
      </div>

      {/* List of Sales Proposal Cards */}
      <div className="space-y-3">
        {type3Items.length === 0 ? (
          <div className="py-6 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
            ยังไม่มีรายการเสนอขาย
          </div>
        ) : (
          type3Items.map((item, index) => {
            const prodListLines: Type3SalesProductLine[] =
              item.products && item.products.length > 0
                ? item.products
                : [
                    {
                      id: "p-1",
                      productName: item.productName || "",
                      quantity: item.quantity || 1,
                      unitPrice: item.unitPrice || 0,
                      price: (item.quantity || 1) * (item.unitPrice || 0),
                    },
                  ];

            const cardTotal = prodListLines.reduce(
              (sum, p) => sum + (p.quantity || 0) * (p.unitPrice || 0),
              0,
            );

            return (
              <div
                key={item.id}
                className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3 transition-all hover:border-emerald-300"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[11px] font-extrabold">
                      {index + 1}
                    </span>
                    รายการเสนอขายที่ {index + 1}
                  </span>
                  {!readonly && (
                    <button
                      type="button"
                      onClick={() => deleteType3Row(item.id)}
                      className="p-1 rounded-md text-red-500 hover:bg-red-50 text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>ลบรายการ</span>
                    </button>
                  )}
                </div>

                {/* Customer Combobox */}
                <div>
                  <FormCombobox
                    id={`customer-combobox-${item.id}`}
                    label="ชื่อร้านค้า / เกษตรกร"
                    labelClassName="block text-xs font-medium text-slate-700 mb-1 mx-0"
                    triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                    value={item.customerName}
                    onChange={(val) =>
                      updateType3Row(item.id, "customerName", val)
                    }
                    options={customerOptions}
                    placeholder="เลือกร้านค้า / เกษตรกร..."
                    searchPlaceholder="ค้นหาร้านค้า / เกษตรกร..."
                    emptyText="ไม่พบลูกค้า"
                    disabled={readonly}
                    required
                  />
                </div>

                {/* Product Lines Section */}
                <div className="space-y-2.5 bg-slate-50/60 p-3 rounded-lg border border-slate-200/70">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      รายการสินค้าที่จะเสนอขาย{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    {!readonly && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => addProductLine(item.id)}
                        className="h-7 text-xs px-2.5 border-emerald-300 text-emerald-700 bg-white hover:bg-emerald-50 shadow-sm"
                      >
                        <Plus className="h-3 w-3 mr-1 text-emerald-600" />
                        เพิ่มสินค้า
                      </Button>
                    )}
                  </div>

                  {prodListLines.map((prodLine, pIdx) => {
                    const lineTotal =
                      (prodLine.quantity || 0) * (prodLine.unitPrice || 0);
                    return (
                      <div
                        key={prodLine.id}
                        className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs"
                      >
                        {/* Product Combobox */}
                        <div className="md:col-span-6">
                          <FormCombobox
                            id={`product-combobox-${item.id}-${prodLine.id}`}
                            label={pIdx === 0 ? "สินค้า" : "สินค้า"}
                            labelClassName="block text-[11px] font-medium text-slate-600 mb-1 mx-0"
                            triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                            value={prodLine.productName}
                            onChange={(val) =>
                              updateProductLine(
                                item.id,
                                prodLine.id,
                                "productName",
                                val,
                              )
                            }
                            options={productOptions}
                            placeholder="เลือกสินค้า..."
                            searchPlaceholder="ค้นหาสินค้า..."
                            emptyText="ไม่พบสินค้า"
                            disabled={readonly}
                            required
                          />
                        </div>

                        {/* Quantity */}
                        <div className="md:col-span-2">
                          {pIdx === 0 && (
                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                              จำนวน <span className="text-red-500">*</span>
                            </label>
                          )}
                          <input
                            type="number"
                            min={1}
                            value={prodLine.quantity}
                            onChange={(e) =>
                              updateProductLine(
                                item.id,
                                prodLine.id,
                                "quantity",
                                parseInt(e.target.value) || 0,
                              )
                            }
                            disabled={readonly}
                            className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
                          />
                        </div>

                        {/* Unit Price */}
                        <div className="md:col-span-3">
                          {pIdx === 0 && (
                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                              ราคา (บาท) <span className="text-red-500">*</span>
                            </label>
                          )}
                          <div className="relative">
                            <span className="absolute left-2.5 top-2 text-slate-400 text-xs font-semibold">
                              ฿
                            </span>
                            <input
                              type="number"
                              min={0}
                              value={prodLine.unitPrice}
                              disabled={true}
                              placeholder="0"
                              className="w-full h-9 pl-6 pr-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-500 text-xs text-right font-medium focus:outline-none cursor-not-allowed"
                            />
                          </div>
                        </div>

                        {/* Delete Product Line Button */}
                        {!readonly && (
                          <div className="md:col-span-1 flex items-center justify-end md:justify-center">
                            <button
                              type="button"
                              onClick={() =>
                                deleteProductLine(item.id, prodLine.id)
                              }
                              disabled={prodListLines.length <= 1}
                              title={
                                prodListLines.length <= 1
                                  ? "ต้องมีสินค้าอย่างน้อย 1 รายการ"
                                  : "ลบรายการสินค้า"
                              }
                              className={cn(
                                "h-9 w-9 rounded-lg flex items-center justify-center transition-colors",
                                prodListLines.length <= 1
                                  ? "text-slate-300 cursor-not-allowed"
                                  : "text-red-500 hover:bg-red-50 hover:text-red-600",
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

                {/* Card Summary & Detail */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-1 gap-2 border-t border-slate-100">
                  <div className="text-xs text-slate-600 font-medium">
                    รวมเป็นเงิน:{" "}
                    <span className="text-sm font-bold text-emerald-700 ml-1">
                      ฿ {cardTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    รายละเอียดเพิ่มเติม
                  </label>
                  <input
                    type="text"
                    value={item.detail}
                    onChange={(e) =>
                      updateType3Row(item.id, "detail", e.target.value)
                    }
                    disabled={readonly}
                    placeholder="ระบุรายละเอียดเพิ่มเติม..."
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {type3Items.length > 0 && (
        <div className="flex justify-end p-3 rounded-xl bg-emerald-100/70 border border-emerald-200 text-xs font-bold text-emerald-900">
          <span>
            รวมราคาเสนอขายทั้งสิ้น:{" "}
            <span className="text-sm font-extrabold text-emerald-700 ml-1.5">
              ฿ {totalAllSales.toLocaleString()}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
