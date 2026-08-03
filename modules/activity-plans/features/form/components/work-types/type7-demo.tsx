import React from "react";
import { Sprout, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormCombobox } from "@/components/custom/form-components";
import type { Type7DemoPlotItem } from "../../types";
import {
  DEMO_PRODUCTS,
  DEMO_OWNERS,
  CROP_CATEGORIES,
  CROPS_BY_CATEGORY,
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
  type7Items: Type7DemoPlotItem[];
  addType7Row: () => void;
  updateType7Row: (
    id: string,
    field: keyof Type7DemoPlotItem,
    val: any,
  ) => void;
  deleteType7Row: (id: string) => void;
  customers?: CustomerOption[];
  products?: ProductOption[];
}

export function Type7Demo({
  readonly = false,
  type7Items,
  addType7Row,
  updateType7Row,
  deleteType7Row,
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
    label: `${c.customerCode ? `${c.customerCode} - ` : ""}${c.name}`,
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

  const cropCategoryOptions = CROP_CATEGORIES.map((cat) => ({
    value: cat,
    label: cat,
  }));

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <Sprout className="h-4 w-4 text-slate-600" />
          <span>ติดตามแปลงสาธิต / พืชเป้าหมาย</span>
        </div>

        {!readonly && (
          <Button
            type="button"
            size="sm"
            onClick={addType7Row}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            เพิ่มรายการ
          </Button>
        )}
      </div>

      {/* List of Demo Plot Cards */}
      <div className="space-y-3">
        {type7Items.length === 0 ? (
          <div className="py-6 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
            ยังไม่มีรายการแปลงสาธิต
          </div>
        ) : (
          type7Items.map((item, index) => {
            const availableCropOptions = (
              CROPS_BY_CATEGORY[item.cropCategory] || []
            ).map((crop) => ({
              value: crop,
              label: crop,
            }));

            const isRaiUnit = ["พืชไร่", "ผักและพืชล้มลุก"].includes(
              item.cropCategory,
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
                    รายการแปลงสาธิตที่ {index + 1}
                  </span>
                  {!readonly && (
                    <button
                      type="button"
                      onClick={() => deleteType7Row(item.id)}
                      className="p-1 rounded-md text-red-500 hover:bg-red-50 text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>ลบรายการ</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {/* แถวบน: เจ้าของแปลง + สินค้าที่จะสาธิต */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <FormCombobox
                      id={`owner-combobox-${item.id}`}
                      label="เจ้าของแปลง"
                      labelClassName="block text-xs font-medium text-slate-700 mb-1 mx-0"
                      triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                      value={item.ownerName}
                      onChange={(val) =>
                        updateType7Row(item.id, "ownerName", val)
                      }
                      options={customerOptions}
                      placeholder="เลือกเจ้าของแปลง..."
                      searchPlaceholder="ค้นหาเจ้าของแปลง / ลูกค้า..."
                      emptyText="ไม่พบเจ้าของแปลง"
                      disabled={readonly}
                      required
                    />

                    <FormCombobox
                      id={`product-combobox-${item.id}`}
                      label="สินค้าที่จะสาธิต"
                      labelClassName="block text-xs font-medium text-slate-700 mb-1 mx-0"
                      triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                      value={item.productName}
                      onChange={(val) =>
                        updateType7Row(item.id, "productName", val)
                      }
                      options={productOptions}
                      placeholder="เลือกสินค้า..."
                      searchPlaceholder="ค้นหาสินค้า..."
                      emptyText="ไม่พบสินค้า"
                      disabled={readonly}
                      required
                    />
                  </div>

                  {/* แถวล่าง: หมวดพืช + ชื่อพืช + จำนวน */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                    <div className="lg:col-span-5">
                      <FormCombobox
                        id={`crop-category-combobox-${item.id}`}
                        label="หมวดพืช"
                        labelClassName="block text-xs font-medium text-slate-700 mb-1 mx-0"
                        triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                        value={item.cropCategory}
                        onChange={(newCat) => {
                          updateType7Row(item.id, "cropCategory", newCat);
                          const nextCrops = CROPS_BY_CATEGORY[newCat] || [];
                          if (
                            nextCrops.length > 0 &&
                            !nextCrops.includes(item.cropName)
                          ) {
                            updateType7Row(item.id, "cropName", nextCrops[0]);
                          }
                        }}
                        options={cropCategoryOptions}
                        placeholder="เลือกหมวด..."
                        searchPlaceholder="ค้นหาหมวดพืช..."
                        emptyText="ไม่พบหมวดพืช"
                        disabled={readonly}
                      />
                    </div>

                    <div className="lg:col-span-5">
                      <FormCombobox
                        id={`crop-name-combobox-${item.id}`}
                        label="ชื่อพืช"
                        labelClassName="block text-xs font-medium text-slate-700 mb-1 mx-0"
                        triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                        value={item.cropName}
                        onChange={(val) =>
                          updateType7Row(item.id, "cropName", val)
                        }
                        options={availableCropOptions}
                        placeholder="เลือกชื่อพืช..."
                        searchPlaceholder="ค้นหาชื่อพืช..."
                        emptyText="ไม่พบชื่อพืช"
                        disabled={readonly || !item.cropCategory}
                      />
                    </div>

                    <div className="lg:col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        จำนวน <span className="text-red-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          min={1}
                          value={item.plotsCount}
                          onChange={(e) =>
                            updateType7Row(
                              item.id,
                              "plotsCount",
                              parseInt(e.target.value) || 0,
                            )
                          }
                          disabled={readonly}
                          className="w-full h-9 pl-3 pr-8 rounded-lg border border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
                        />
                        <span className="absolute right-3 text-[11px] font-semibold text-slate-500 pointer-events-none">
                          {isRaiUnit ? "ไร่" : "ต้น"}
                        </span>
                      </div>
                    </div>
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
                      updateType7Row(item.id, "detail", e.target.value)
                    }
                    disabled={readonly}
                    placeholder="ระบุรายละเอียดเพิ่มเติมของแปลงสาธิต..."
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
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
