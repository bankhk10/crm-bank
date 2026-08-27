import React, { useState } from "react";
import { Store, Package, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormCombobox } from "@/components/custom/form-components";
import type { Type9ProductItem } from "../../types";
import { STORES_LIST } from "../../../../constants";

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
  unit?: string | null;
}

interface Props {
  readonly?: boolean;
  type9Store: string;
  setType9Store: (val: string) => void;
  isSubDealer?: boolean;
  setIsSubDealer?: (val: boolean) => void;
  subDealerStore?: string;
  setSubDealerStore?: (val: string) => void;
  type9Sales: number;
  setType9Sales: (val: number) => void;
  type9ProductItems: Type9ProductItem[];
  addType9ProductItem: () => void;
  updateType9ProductItem: (
    id: string,
    field: keyof Type9ProductItem,
    val: any,
  ) => void;
  deleteType9ProductItem: (id: string) => void;
  customers?: CustomerOption[];
  products?: ProductOption[];
}

export function Type9Store({
  readonly = false,
  type9Store,
  setType9Store,
  isSubDealer,
  setIsSubDealer,
  subDealerStore,
  setSubDealerStore,
  type9Sales,
  setType9Sales,
  type9ProductItems,
  addType9ProductItem,
  updateType9ProductItem,
  deleteType9ProductItem,
  customers = [],
  products = [],
}: Props) {
  const [internalIsSubDealer, setInternalIsSubDealer] = useState(false);
  const [internalSubDealerStore, setInternalSubDealerStore] = useState("");

  const activeIsSubDealer = isSubDealer ?? internalIsSubDealer;
  const activeSetIsSubDealer = setIsSubDealer ?? setInternalIsSubDealer;
  const activeSubDealerStore = subDealerStore ?? internalSubDealerStore;
  const activeSetSubDealerStore =
    setSubDealerStore ?? setInternalSubDealerStore;

  const customerOptions = (
    customers && customers.length > 0
      ? customers
      : STORES_LIST.map((store) => ({
          id: store,
          name: store,
          customerCode: null,
        }))
  ).map((c) => ({
    value: c.name,
    label: c.name,
  }));

  const boxProducts = products.filter(
    (p) => !p.unit || p.unit.trim() === "กล่อง",
  );

  const productOptions = (
    boxProducts.length > 0 ? boxProducts : products || []
  ).map((p) => ({
    value: p.name,
    label: p.name,
    subLabel: p.productCode || undefined,
  }));

  const calculatedSales = type9ProductItems.reduce(
    (sum, item) => sum + (item.quantityCases || 0) * (item.pricePerCase || 0),
    0,
  );

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <Store className="h-4 w-4 text-slate-600" />
          <span>จัดกิจกรรมส่งเสริมการขายหน้าร้าน</span>
        </div>
      </div>

      <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-bold text-teal-800 flex items-center gap-1.5">
            <Store className="h-4 w-4 text-teal-600" />
            ข้อมูลร้านค้าและเป้ายอดขาย
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <FormCombobox
              id="type9-store-combobox"
              label="ร้านค้าที่จะไปจัดงาน"
              labelClassName="block text-xs font-medium text-slate-700 mb-1 mx-0"
              triggerClassName="h-10 min-h-[40px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500"
              value={type9Store}
              onChange={setType9Store}
              options={customerOptions}
              placeholder="เลือกร้านค้าที่จะไปจัดงาน..."
              searchPlaceholder="ค้นหาร้านค้า..."
              emptyText="ไม่พบร้านค้า"
              disabled={readonly}
              required
            />

            <div className="flex items-center gap-2 pt-0.5">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                <Checkbox
                  id="type9-is-sub-dealer-checkbox"
                  checked={activeIsSubDealer}
                  onCheckedChange={(checked) => {
                    const isChecked = !!checked;
                    activeSetIsSubDealer(isChecked);
                    if (!isChecked) {
                      activeSetSubDealerStore("");
                    }
                  }}
                  disabled={readonly}
                  className="border-slate-300 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                />
                <span>จัดกิจกรรมให้ร้าน Sub Dealer</span>
              </label>
            </div>

            {activeIsSubDealer && (
              <div className="space-y-1.5 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="block text-xs font-medium text-slate-700">
                  ชื่อร้านค้า Sub Dealer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={activeSubDealerStore}
                  onChange={(e) => activeSetSubDealerStore(e.target.value)}
                  disabled={readonly}
                  placeholder="กรอกชื่อร้านค้า Sub Dealer..."
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              เป้ายอดขายรวมจากกิจกรรม (บาท){" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-semibold">
                ฿
              </span>
              <input
                type="number"
                value={
                  type9ProductItems.length > 0 ? calculatedSales : type9Sales
                }
                onChange={(e) => setType9Sales(parseFloat(e.target.value) || 0)}
                disabled={readonly || type9ProductItems.length > 0}
                className="w-full h-10 pl-7 pr-3 rounded-lg border border-slate-200 bg-white text-xs font-bold text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table / List of Products */}
      <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-bold text-teal-800 flex items-center gap-1.5">
            <Package className="h-4 w-4 text-teal-600" />
            รายการสินค้าที่เสนอขาย / โปรโมชันหน้าร้าน
          </span>

          {!readonly && (
            <Button
              type="button"
              size="sm"
              onClick={addType9ProductItem}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm"
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
                <th className="py-2 px-3 min-w-[180px]">
                  เลือกสินค้า <span className="text-red-500">*</span>
                </th>
                <th className="py-2 px-3 w-28 text-center">
                  จำนวน (ลัง) <span className="text-red-500">*</span>
                </th>
                <th className="py-2 px-3 w-32 text-center">
                  ราคา (บาท) <span className="text-red-500">*</span>
                </th>
                <th className="py-2 px-3 w-36 text-right">รวม</th>
                {!readonly && (
                  <th className="py-2 px-3 text-center w-14">ลบ</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {type9ProductItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-400">
                    ยังไม่มีรายการสินค้า
                  </td>
                </tr>
              ) : (
                type9ProductItems.map((item, index) => {
                  const totalItemPrice =
                    (item.quantityCases || 0) * (item.pricePerCase || 0);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-2 px-3 text-center font-medium text-slate-500">
                        {index + 1}
                      </td>
                      <td className="py-1.5 px-3 min-w-[200px]">
                        <FormCombobox
                          id={`type9-product-combobox-${item.id}`}
                          label=""
                          labelClassName="hidden"
                          triggerClassName="h-8 min-h-[32px] py-0.5 text-xs bg-white border-slate-200 rounded-md text-slate-800 focus:ring-2 focus:ring-teal-500"
                          value={item.productName}
                          onChange={(val) => {
                            updateType9ProductItem(item.id, "productName", val);
                            const found = products.find((p) => p.name === val);
                            if (found && found.price != null) {
                              updateType9ProductItem(
                                item.id,
                                "pricePerCase",
                                found.price,
                              );
                            } else {
                              updateType9ProductItem(
                                item.id,
                                "pricePerCase",
                                0,
                              );
                            }
                          }}
                          options={productOptions}
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
                          value={item.quantityCases}
                          onChange={(e) =>
                            updateType9ProductItem(
                              item.id,
                              "quantityCases",
                              parseInt(e.target.value) || 0,
                            )
                          }
                          disabled={readonly}
                          className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </td>
                      <td className="py-1.5 px-3">
                        <div className="relative">
                          <span className="absolute left-2 top-2 text-slate-400 text-[11px]">
                            ฿
                          </span>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={item.pricePerCase ?? 0}
                            onChange={(e) =>
                              updateType9ProductItem(
                                item.id,
                                "pricePerCase",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            disabled={readonly}
                            placeholder="0"
                            className={`w-full h-8 pl-5 pr-2 rounded-md border border-slate-200 text-xs text-right font-medium focus:outline-none ${
                              readonly
                                ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                                : "bg-white text-slate-800 focus:ring-2 focus:ring-teal-500"
                            }`}
                          />
                        </div>
                      </td>
                      <td className="py-1.5 px-3 text-right font-semibold text-teal-700">
                        ฿ {totalItemPrice.toLocaleString()}
                      </td>
                      {!readonly && (
                        <td className="py-1.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => deleteType9ProductItem(item.id)}
                            className="p-1 rounded-md text-red-500 hover:bg-red-50 transition-colors"
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
    </div>
  );
}
