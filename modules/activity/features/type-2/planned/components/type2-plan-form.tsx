"use client";

import React, { useMemo } from "react";
import { CheckSquare, Plus, Trash2, Store, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityInput } from "@/components/activity/activity-input";
import { ActivityAddressSelect } from "@/components/activity/activity-address-select";
import { ActivityCustomerSelect } from "@/components/activity/activity-customer-select";
import {
  ActivityProductSelect,
  type ActivityProductItem,
} from "@/components/activity/activity-product-select";
import type {
  Type2FollowupProductLine,
  Type2PlanFormProps,
  Type2FollowupProps,
} from "../types/planned.types";
import type { CustomerOption, ProductOption } from "../../shared/types";

export type {
  CustomerOption,
  ProductOption,
  Type2FollowupProductLine,
  Type2PlanFormProps,
  Type2FollowupProps,
};

export function Type2PlanForm({
  readonly = false,
  type2Items,
  addType2Row,
  updateType2Row,
  deleteType2Row,
  customers = [],
  products = [],
}: Type2PlanFormProps) {
  const nonBoxProducts = useMemo(() => {
    return (products || []).filter((p) => (p.unit || "").trim() !== "กล่อง");
  }, [products]);

  const addProductLine = (itemId: string) => {
    const currentItem = type2Items.find((i) => i.id === itemId);
    if (!currentItem) return;

    const currentProducts: Type2FollowupProductLine[] =
      currentItem.products && currentItem.products.length > 0
        ? currentItem.products
        : [
            {
              id: "p-1",
              productId: currentItem.productId,
              productName: currentItem.productName || "",
              notes: "",
            },
          ];

    const newProdLine: Type2FollowupProductLine = {
      id: Date.now().toString(),
      productName: "",
      notes: "",
    };

    const updatedProducts = [...currentProducts, newProdLine];
    updateType2Row(itemId, "products", updatedProducts);
    if (updatedProducts[0]) {
      updateType2Row(
        itemId,
        "productName",
        updatedProducts[0].productName || "",
      );
      updateType2Row(itemId, "productId", updatedProducts[0].productId);
    }
  };

  const updateProductLine = (
    itemId: string,
    prodId: string,
    field: keyof Type2FollowupProductLine,
    val: any,
    productItem?: ActivityProductItem,
  ) => {
    const currentItem = type2Items.find((i) => i.id === itemId);
    if (!currentItem) return;

    const currentProducts: Type2FollowupProductLine[] =
      currentItem.products && currentItem.products.length > 0
        ? currentItem.products
        : [
            {
              id: "p-1",
              productId: currentItem.productId,
              productName: currentItem.productName || "",
              notes: "",
            },
          ];

    const updatedProducts = currentProducts.map((p) => {
      if (p.id !== prodId) return p;
      const updated = { ...p, [field]: val };
      if (field === "productName") {
        if (!val) {
          updated.productId = undefined;
          updated.productName = "";
        } else {
          const foundProd =
            productItem ||
            (products || []).find(
              (prod) => prod.name === val || prod.id === val,
            );
          if (foundProd) {
            updated.productId = foundProd.id;
            updated.productName = foundProd.name;
          } else {
            updated.productName = val;
          }
        }
      }
      return updated;
    });

    updateType2Row(itemId, "products", updatedProducts);
    if (updatedProducts[0]) {
      updateType2Row(
        itemId,
        "productName",
        updatedProducts[0].productName || "",
      );
      updateType2Row(itemId, "productId", updatedProducts[0].productId);
    }
  };

  const deleteProductLine = (itemId: string, prodId: string) => {
    const currentItem = type2Items.find((i) => i.id === itemId);
    if (!currentItem) return;

    const currentProducts: Type2FollowupProductLine[] =
      currentItem.products && currentItem.products.length > 0
        ? currentItem.products
        : [];

    const updatedProducts = currentProducts.filter((p) => p.id !== prodId);
    updateType2Row(itemId, "products", updatedProducts);
    if (updatedProducts.length > 0) {
      updateType2Row(
        itemId,
        "productName",
        updatedProducts[0].productName || "",
      );
      updateType2Row(itemId, "productId", updatedProducts[0].productId);
    } else {
      updateType2Row(itemId, "productName", "");
      updateType2Row(itemId, "productId", undefined);
    }
  };

  const handlePurposeChange = (
    id: string,
    newPurpose: "FARMER" | "STORE",
    currentPurpose: "FARMER" | "STORE",
  ) => {
    if (newPurpose === currentPurpose) return;
    updateType2Row(id, "visitPurpose", newPurpose);
    if (newPurpose === "STORE") {
      updateType2Row(id, "province", "");
      updateType2Row(id, "storeId", undefined);
      updateType2Row(id, "customerName", "");
      updateType2Row(id, "isUnregisteredFarmer", false);
      updateType2Row(id, "unregisteredFarmerName", "");
      updateType2Row(id, "unregisteredFarmerPhone", "");
    } else {
      updateType2Row(id, "storeId", undefined);
      updateType2Row(id, "customerName", "");
    }
  };

  const handleProvinceChange = (id: string, newProvince: string) => {
    updateType2Row(id, "province", newProvince);
    updateType2Row(id, "storeId", undefined);
    updateType2Row(id, "customerName", "");
  };

  const handleToggleUnregistered = (id: string, checked: boolean) => {
    updateType2Row(id, "isUnregisteredFarmer", checked);
    if (checked) {
      updateType2Row(id, "storeId", undefined);
      updateType2Row(id, "customerName", "");
    } else {
      updateType2Row(id, "unregisteredFarmerName", "");
      updateType2Row(id, "unregisteredFarmerPhone", "");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <CheckSquare className="h-4 w-4 text-indigo-600" />
          <span>ติดตามผลการใช้สินค้า</span>
        </div>

        {!readonly && (
          <Button
            type="button"
            size="sm"
            onClick={addType2Row}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            เพิ่มรายการ
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {type2Items.length === 0 ? (
          <div className="py-6 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
            ยังไม่มีรายการติดตามผล
          </div>
        ) : (
          type2Items.map((item, index) => {
            const currentPurpose: "FARMER" | "STORE" =
              item.visitPurpose === "STORE" ? "STORE" : "FARMER";

            const prodListLines: Type2FollowupProductLine[] =
              item.products && item.products.length > 0
                ? item.products
                : [
                    {
                      id: `p-${index}-0`,
                      productId: item.productId,
                      productName: item.productName || "",
                      notes: "",
                    },
                  ];

            return (
              <div
                key={item.id}
                className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3.5 transition-all hover:border-indigo-300"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-indigo-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-extrabold">
                      {index + 1}
                    </span>
                    รายการติดตามผลที่ {index + 1}
                  </span>
                  {!readonly && (
                    <button
                      type="button"
                      onClick={() => deleteType2Row(item.id)}
                      className="p-1 rounded-md text-red-500 hover:bg-red-50 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>ลบรายการ</span>
                    </button>
                  )}
                </div>

                {/* Purpose */}
                <div className="space-y-1.5 border-b border-slate-100 pb-3">
                  <label className="block text-xs font-semibold text-slate-700">
                    วัตถุประสงค์ของประเภทงาน{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-6 items-center pt-2">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
                      <input
                        type="radio"
                        name={`type2-visit-purpose-${item.id}`}
                        value="FARMER"
                        checked={currentPurpose === "FARMER"}
                        onChange={() =>
                          handlePurposeChange(item.id, "FARMER", currentPurpose)
                        }
                        disabled={readonly}
                        className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                        ติดตามจากเกษตรกร
                      </span>
                    </label>

                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
                      <input
                        type="radio"
                        name={`type2-visit-purpose-${item.id}`}
                        value="STORE"
                        checked={currentPurpose === "STORE"}
                        onChange={() =>
                          handlePurposeChange(item.id, "STORE", currentPurpose)
                        }
                        disabled={readonly}
                        className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <Store className="w-3.5 h-3.5 text-indigo-600" />
                        ติดตามจากร้านค้า
                      </span>
                    </label>
                  </div>
                </div>

                {/* FARMER */}
                {currentPurpose === "FARMER" && (
                  <div className="space-y-3 border-b border-slate-100 pb-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                      <ActivityAddressSelect
                        id={`type2-province-combobox-${item.id}`}
                        levels="province"
                        triggerClassName="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={item.province || ""}
                        onChange={(val: string) =>
                          handleProvinceChange(item.id, val)
                        }
                        disabled={readonly}
                        required
                      />

                      <ActivityCustomerSelect
                        id={`type2-farmer-combobox-${item.id}`}
                        type="FARMER"
                        province={item.province}
                        value={item.storeId || ""}
                        onChange={(val, cust) => {
                          updateType2Row(item.id, "storeId", val || undefined);
                          updateType2Row(
                            item.id,
                            "customerName",
                            cust?.name || "",
                          );
                        }}
                        customers={customers}
                        disabled={readonly}
                        required
                        allowUnregistered
                        isUnregistered={Boolean(item.isUnregisteredFarmer)}
                        onUnregisteredToggle={(chk) =>
                          handleToggleUnregistered(item.id, chk)
                        }
                        unregisteredName={item.unregisteredFarmerName || ""}
                        onUnregisteredNameChange={(val) =>
                          updateType2Row(item.id, "unregisteredFarmerName", val)
                        }
                        unregisteredPhone={item.unregisteredFarmerPhone || ""}
                        onUnregisteredPhoneChange={(val) =>
                          updateType2Row(
                            item.id,
                            "unregisteredFarmerPhone",
                            val,
                          )
                        }
                      />
                    </div>
                  </div>
                )}

                {/* STORE */}
                {currentPurpose === "STORE" && (
                  <div className="space-y-2 border-b border-slate-100 pb-3">
                    <ActivityCustomerSelect
                      id={`type2-store-combobox-${item.id}`}
                      type="STORE"
                      value={item.storeId || ""}
                      onChange={(val, cust) => {
                        updateType2Row(item.id, "storeId", val || undefined);
                        updateType2Row(
                          item.id,
                          "customerName",
                          cust?.name || "",
                        );
                      }}
                      customers={customers}
                      disabled={readonly}
                      required
                    />
                  </div>
                )}

                {/* Products Section */}
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    รายการสินค้าที่จะติดตามผล{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  {!readonly && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => addProductLine(item.id)}
                      className="h-7 text-xs px-2.5 border-indigo-300 text-indigo-700 bg-white hover:bg-indigo-50 shadow-sm cursor-pointer"
                    >
                      <Plus className="h-3 w-3 mr-1 text-indigo-600" />
                      เพิ่มสินค้า
                    </Button>
                  )}
                </div>

                {prodListLines.map((prodLine) => {
                  return (
                    <div
                      key={prodLine.id}
                      className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs"
                    >
                      <div
                        className={
                          prodListLines.length > 1 && !readonly
                            ? "md:col-span-6"
                            : "md:col-span-6"
                        }
                      >
                        <ActivityProductSelect
                          id={`type2-product-combobox-${item.id}-${prodLine.id}`}
                          label="สินค้า"
                          labelClassName="block text-[11px] font-semibold text-slate-600 mb-1 mx-0"
                          triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
                          value={prodLine.productName}
                          valueKey="name"
                          onChange={(val, prod) =>
                            updateProductLine(
                              item.id,
                              prodLine.id,
                              "productName",
                              val,
                              prod,
                            )
                          }
                          products={nonBoxProducts}
                          placeholder="เลือกสินค้า..."
                          searchPlaceholder="ค้นหาสินค้า..."
                          emptyText="ไม่พบสินค้า"
                          disabled={readonly}
                          required
                        />
                      </div>

                      <div
                        className={
                          prodListLines.length > 1 && !readonly
                            ? "md:col-span-5"
                            : "md:col-span-6"
                        }
                      >
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          รายละเอียดสินค้าเพิ่มเติม
                        </label>
                        <ActivityInput
                          type="text"
                          value={prodLine.notes || ""}
                          onChange={(e) =>
                            updateProductLine(
                              item.id,
                              prodLine.id,
                              "notes",
                              e.target.value,
                            )
                          }
                          disabled={readonly}
                          placeholder="ระบุข้อสังเกต หรือผลที่คาดหวัง..."
                        />
                      </div>

                      {prodListLines.length > 1 && !readonly && (
                        <div className="md:col-span-1 flex justify-center pb-1">
                          <button
                            type="button"
                            onClick={() =>
                              deleteProductLine(item.id, prodLine.id)
                            }
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="ลบสินค้านี้"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="pt-0.5">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    รายละเอียดเพิ่มเติม
                  </label>
                  <ActivityInput
                    type="text"
                    value={item.detail || ""}
                    onChange={(e) =>
                      updateType2Row(item.id, "detail", e.target.value)
                    }
                    disabled={readonly}
                    placeholder="ระบุรายละเอียดภาพรวมการติดตาม..."
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export const Type2Followup = Type2PlanForm;
