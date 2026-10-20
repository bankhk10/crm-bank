"use client";

import React, { useMemo } from "react";
import { Store, Plus, Trash2, Package, ShoppingBag, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ActivityCustomerSelect,
  ActivityProductSelect,
  ActivityAddressSelect,
  ActivityInput,
  ActivityPhotoUpload,
} from "@/modules/activity/ui";
import type { Type9UnplannedFormProps, Type9UnplannedItem } from "../types/unplanned.types";
import type { Type9ProductItem } from "../../shared/types";

export type { Type9UnplannedFormProps };

export function Type9UnplannedForm({
  readonly = false,
  items = [],
  customers = [],
  products = [],
  addItem,
  updateItem,
  deleteItem,
  addProductItem,
  updateProductItem,
  deleteProductItem,
}: Type9UnplannedFormProps) {
  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm sm:text-base">
          <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-200">
            <Store className="h-4 w-4" />
          </div>
          <span>จัดกิจกรรมส่งเสริมการขายหน้าร้าน (นอกแผน / Type 9)</span>
        </div>

        {!readonly && addItem && (
          <Button
            type="button"
            size="sm"
            onClick={addItem}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg h-8 px-3 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            เพิ่มจุดจัดกิจกรรม
          </Button>
        )}
      </div>

      {/* Item List */}
      <div className="space-y-4">
        {items.map((item, index) => {
          const selectedSubdealer = (customers || []).find(
            (c) =>
              c.id === item.subdealerId ||
              (c.name === item.subdealerName &&
                (c.customerType === "SUBDEALER" || c.customerType === "Subdealer")),
          );

          const resolvedParentDealerName =
            item.parentDealerName ||
            selectedSubdealer?.parentDealer?.name ||
            "";

          const productItems = item.products || [];
          const calculatedSales = productItems.reduce(
            (sum, p) => sum + (p.quantityCases || 0) * (p.pricePerCase || 0),
            0,
          );

          return (
            <div
              key={item.id}
              className="p-4 sm:p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4"
            >
              {/* Item Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-xs font-bold text-teal-900">
                    ข้อมูลจุดจัดกิจกรรมหน้าร้าน
                  </span>
                </div>

                {!readonly && deleteItem && items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => deleteItem(item.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    title="ลบจุดจัดกิจกรรมนี้"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Sub Dealer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {item.isUnregisteredSubdealer
                        ? "ชื่อร้านค้า Sub Dealer"
                        : "ร้านค้า Sub Dealer (จาก Customer Master)"}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                  </div>

                  {!item.isUnregisteredSubdealer ? (
                    <div className="space-y-2.5">
                      <ActivityCustomerSelect
                        id={`type9-unplanned-subdealer-${item.id}`}
                        type="SUBDEALER"
                        label=""
                        labelClassName="hidden"
                        triggerClassName="h-10 min-h-[40px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500"
                        value={item.subdealerId || ""}
                        onChange={(val, cust) => {
                          if (cust) {
                            updateItem(item.id, "subdealerId", cust.id);
                            updateItem(item.id, "subdealerName", cust.name);
                            updateItem(item.id, "province", cust.province || "");
                            updateItem(item.id, "district", cust.district || "");
                            if (cust.parentDealerId) {
                              updateItem(item.id, "parentDealerId", cust.parentDealerId);
                              const pDealer = customers.find(
                                (c) => c.id === cust.parentDealerId,
                              );
                              updateItem(
                                item.id,
                                "parentDealerName",
                                pDealer?.name || "",
                              );
                            } else {
                              updateItem(item.id, "parentDealerId", "");
                              updateItem(item.id, "parentDealerName", "");
                            }
                          } else {
                            updateItem(item.id, "subdealerId", "");
                            updateItem(item.id, "subdealerName", val);
                          }
                        }}
                        customers={customers}
                        placeholder="เลือกร้านค้า Sub Dealer..."
                        searchPlaceholder="ค้นหาร้านค้า Sub Dealer..."
                        emptyText="ไม่พบร้านค้า Sub Dealer"
                        disabled={readonly}
                        required
                      />

                      {!readonly && (
                        <div className="flex items-center justify-start">
                          <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-700 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={Boolean(item.isUnregisteredSubdealer)}
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                updateItem(
                                  item.id,
                                  "isUnregisteredSubdealer",
                                  isChecked,
                                );
                                if (isChecked) {
                                  updateItem(item.id, "subdealerId", "");
                                  updateItem(item.id, "subdealerName", "");
                                } else {
                                  updateItem(item.id, "subDealerStore", "");
                                }
                              }}
                              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
                            />
                            <span>ร้านค้านี้ไม่มีในระบบ (ระบุเอง)</span>
                          </label>
                        </div>
                      )}

                      {selectedSubdealer && (
                        <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100/80 text-xs space-y-1.5 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between text-teal-900 font-semibold">
                            <span className="truncate">{selectedSubdealer.name}</span>
                            {selectedSubdealer.customerCode && (
                              <span className="text-[11px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-md font-mono">
                                {selectedSubdealer.customerCode}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px] pt-1 border-t border-teal-100/60">
                            <div>
                              <span className="text-slate-400">จังหวัด:</span>{" "}
                              <span className="font-medium text-slate-700">
                                {selectedSubdealer.province || "-"}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">อำเภอ:</span>{" "}
                              <span className="font-medium text-slate-700">
                                {selectedSubdealer.district || "-"}
                              </span>
                            </div>
                            {resolvedParentDealerName && (
                              <div className="col-span-2">
                                <span className="text-slate-400">Dealer ต้นสังกัด:</span>{" "}
                                <span className="font-medium text-slate-700">
                                  {resolvedParentDealerName}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 animate-in fade-in duration-200">
                      <div>
                        <ActivityInput
                          id={`type9-unplanned-unreg-store-${item.id}`}
                          value={item.subDealerStore || ""}
                          onChange={(e) =>
                            updateItem(item.id, "subDealerStore", e.target.value)
                          }
                          disabled={readonly}
                          placeholder="กรอกชื่อร้านค้า Sub Dealer..."
                          className="h-10 text-xs font-medium focus:ring-teal-500"
                          required
                        />
                        {!readonly && (
                          <div className="mt-2 flex items-center justify-start">
                            <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-700 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={Boolean(item.isUnregisteredSubdealer)}
                                onChange={(e) => {
                                  const isChecked = e.target.checked;
                                  updateItem(
                                    item.id,
                                    "isUnregisteredSubdealer",
                                    isChecked,
                                  );
                                  if (isChecked) {
                                    updateItem(item.id, "subdealerId", "");
                                    updateItem(item.id, "subdealerName", "");
                                  } else {
                                    updateItem(item.id, "subDealerStore", "");
                                  }
                                }}
                                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
                              />
                              <span>ร้านค้านี้ไม่มีในระบบ (ระบุเอง)</span>
                            </label>
                          </div>
                        )}
                      </div>

                      <div>
                        <ActivityAddressSelect
                          id={`type9-unplanned-address-${item.id}`}
                          levels="province-district"
                          triggerClassName="focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          value={{
                            province: item.province || "",
                            district: item.district || "",
                          }}
                          onChange={(val) => {
                            updateItem(item.id, "province", val.province || "");
                            updateItem(item.id, "district", val.district || "");
                          }}
                          disabled={readonly}
                          required
                        />
                      </div>

                      <div>
                        <ActivityCustomerSelect
                          id={`type9-unplanned-dealer-${item.id}`}
                          type="DEALER"
                          label="ร้านค้า Dealer ต้นสังกัด (ถ้ามี)"
                          labelClassName="block text-xs font-medium text-slate-600 mb-1"
                          triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500"
                          value={item.parentDealerId || ""}
                          onChange={(val, cust) => {
                            updateItem(item.id, "parentDealerId", cust?.id || "");
                            updateItem(
                              item.id,
                              "parentDealerName",
                              cust?.name || val,
                            );
                          }}
                          customers={customers}
                          placeholder="เลือกร้านค้า Dealer ต้นสังกัด (ถ้ามี)..."
                          searchPlaceholder="ค้นหาร้านค้า Dealer..."
                          emptyText="ไม่พบร้านค้า Dealer ในระบบ"
                          disabled={readonly}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Actual Results */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ยอดขายหน้าร้านจริงรวม (บาท){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-semibold">
                        ฿
                      </span>
                      <ActivityInput
                        id={`type9-unplanned-sales-${item.id}`}
                        type="text"
                        placeholder="ระบุยอดขายหน้าร้านจริง..."
                        value={
                          item.actualSales != null
                            ? String(item.actualSales)
                            : calculatedSales > 0
                              ? String(calculatedSales)
                              : ""
                        }
                        onChange={(e) => updateItem(item.id, "actualSales", e.target.value)}
                        disabled={readonly}
                        className="h-10 pl-7 text-xs font-bold text-teal-800 focus:ring-teal-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ผู้เข้าร่วมกิจกรรมจริง (คน)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400">
                        <Users className="w-4 h-4" />
                      </span>
                      <ActivityInput
                        id={`type9-unplanned-attendees-${item.id}`}
                        type="number"
                        placeholder="ระบุจำนวนผู้เข้าร่วม..."
                        value={item.actualAttendees || ""}
                        onChange={(e) =>
                          updateItem(item.id, "actualAttendees", e.target.value)
                        }
                        disabled={readonly}
                        className="h-10 pl-9 text-xs font-bold text-slate-800 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Products Table */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-800 flex items-center gap-1.5">
                    <Package className="h-4 w-4 text-teal-600" />
                    รายการสินค้าที่เสนอขาย / โปรโมชันหน้าร้าน
                  </span>

                  {!readonly && addProductItem && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addProductItem(item.id)}
                      className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-xs"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      เพิ่มสินค้า
                    </Button>
                  )}
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-2 px-3 text-center w-10">ลำดับ</th>
                        <th className="py-2 px-3 min-w-[180px]">เลือกสินค้า</th>
                        <th className="py-2 px-3 w-28 text-center">จำนวน (ลัง)</th>
                        <th className="py-2 px-3 w-32 text-center">ราคา (บาท)</th>
                        <th className="py-2 px-3 w-36 text-right">รวม</th>
                        {!readonly && (
                          <th className="py-2 px-3 text-center w-14">ลบ</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {productItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-slate-400">
                            ยังไม่มีรายการสินค้า
                          </td>
                        </tr>
                      ) : (
                        productItems.map((prod, prodIdx) => {
                          const itemTotal =
                            (prod.quantityCases || 0) * (prod.pricePerCase || 0);

                          return (
                            <tr
                              key={prod.id}
                              className="hover:bg-slate-50/60 transition-colors"
                            >
                              <td className="py-2 px-3 text-center font-medium text-slate-500">
                                {prodIdx + 1}
                              </td>
                              <td className="py-1.5 px-3 min-w-[200px]">
                                <ActivityProductSelect
                                  id={`t9-unplanned-prod-${prod.id}`}
                                  triggerClassName="h-8 min-h-[32px] py-0.5 text-xs bg-white border-slate-200 rounded-md text-slate-800 focus:ring-2 focus:ring-teal-500"
                                  value={prod.productName}
                                  valueKey="name"
                                  unitFilter="box"
                                  onChange={(val, pFound) => {
                                    const match =
                                      pFound ||
                                      products.find(
                                        (p) => p.name === val || p.id === val,
                                      );
                                    if (updateProductItem) {
                                      updateProductItem(
                                        item.id,
                                        prod.id,
                                        "productName",
                                        match?.name || val,
                                      );
                                      if (match?.id) {
                                        updateProductItem(
                                          item.id,
                                          prod.id,
                                          "productId",
                                          match.id,
                                        );
                                      }
                                    }
                                  }}
                                  products={products}
                                  placeholder="เลือกสินค้า..."
                                  searchPlaceholder="ค้นหาสินค้า..."
                                  emptyText="ไม่พบสินค้า"
                                  disabled={readonly}
                                />
                              </td>
                              <td className="py-1.5 px-3">
                                <input
                                  type="number"
                                  min={0}
                                  value={prod.quantityCases}
                                  onChange={(e) =>
                                    updateProductItem &&
                                    updateProductItem(
                                      item.id,
                                      prod.id,
                                      "quantityCases",
                                      parseInt(e.target.value) || 0,
                                    )
                                  }
                                  disabled={readonly}
                                  className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                              </td>
                              <td className="py-1.5 px-3">
                                <input
                                  type="number"
                                  min={0}
                                  value={prod.pricePerCase}
                                  onChange={(e) =>
                                    updateProductItem &&
                                    updateProductItem(
                                      item.id,
                                      prod.id,
                                      "pricePerCase",
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                  disabled={readonly}
                                  className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                              </td>
                              <td className="py-1.5 px-3 text-right font-semibold text-slate-700">
                                {itemTotal.toLocaleString()} ฿
                              </td>
                              {!readonly && deleteProductItem && (
                                <td className="py-1.5 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      deleteProductItem(item.id, prod.id)
                                    }
                                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Photo Upload: Store Event Atmosphere */}
              <div className="pt-2 border-t border-slate-100">
                <ActivityPhotoUpload
                  title="ภาพถ่ายบรรยากาศการจัดกิจกรรมหน้าร้าน"
                  images={(item.images || []) as any}
                  onImagesChange={(imgs) => updateItem(item.id, "images", imgs as any)}
                  maxFiles={10}
                  accentColor="emerald"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
