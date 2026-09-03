import React, { useMemo } from "react";
import {
  Plus,
  Trash2,
  Check,
  Package,
  Receipt,
  Coins,
  Target,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FormCombobox } from "@/components/custom/form-components";
import { SectionHeader } from "@/components/custom/section-header";
import type { MarketingBudgetProductItem, SalesPromotionItem } from "../types";
import { MARKETING_UNITS } from "../../../constants";

export interface PromotionalProductOption {
  name: string;
  price: number;
  unit?: string;
  category?: string;
  sku?: string;
}

function getCategoryForProduct(
  productName: string,
  materialsByCategory?: Record<string, PromotionalProductOption[]>,
  fallbackCategory = "Premium_item",
): string {
  if (materialsByCategory) {
    for (const [cat, items] of Object.entries(materialsByCategory)) {
      if (items.some((i) => i.name === productName)) {
        return cat;
      }
    }
  }
  return fallbackCategory;
}

interface Props {
  selectedWorkTypes: string[];
  readonly?: boolean;
  isPromotionalMediaSelected: boolean;
  setIsPromotionalMediaSelected: (val: boolean) => void;
  isSalesPromotionSelected: boolean;
  setIsSalesPromotionSelected: (val: boolean) => void;
  marketingProductItems: MarketingBudgetProductItem[];
  marketingBudgetAmount: number;
  setMarketingBudgetAmount: (val: number) => void;
  addMarketingProductItem: () => void;
  updateMarketingProductItem: (
    id: string,
    field: keyof MarketingBudgetProductItem,
    val: any,
  ) => void;
  deleteMarketingProductItem: (id: string) => void;
  salesPromotionItems: SalesPromotionItem[];
  addSalesPromotionRow: () => void;
  updateSalesPromotionRow: (
    id: string,
    field: keyof SalesPromotionItem,
    val: any,
  ) => void;
  deleteSalesPromotionRow: (id: string) => void;
  targetSales: number;
  promotionalMaterialsByCategory?: Record<string, PromotionalProductOption[]>;
}

export function BudgetSection({
  readonly = false,
  isPromotionalMediaSelected,
  setIsPromotionalMediaSelected,
  isSalesPromotionSelected,
  setIsSalesPromotionSelected,
  marketingProductItems,
  marketingBudgetAmount,
  addMarketingProductItem,
  updateMarketingProductItem,
  deleteMarketingProductItem,
  salesPromotionItems,
  addSalesPromotionRow,
  updateSalesPromotionRow,
  deleteSalesPromotionRow,
  targetSales = 0,
  promotionalMaterialsByCategory,
}: Props) {
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    if (promotionalMaterialsByCategory) {
      Object.keys(promotionalMaterialsByCategory).forEach((c) => set.add(c));
    }
    if (set.size === 0) {
      set.add("Premium_item");
      set.add("PP_Board");
      set.add("Banner");
      set.add("Leaflet");
      set.add("อุปกรณ์จัดงาน");
    }
    set.add("อื่นๆ");
    return Array.from(set);
  }, [promotionalMaterialsByCategory]);

  return (
    <div className="space-y-4">
      <SectionHeader
        title="งบประมาณและค่าใช้จ่าย"
        className="rounded-xl"
        accentColor="#808080"
      />

      {/* Checkbox Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Checkbox 1: สื่อส่งเสริมการขาย */}
        <button
          type="button"
          onClick={() => {
            if (!readonly) {
              const nextVal = !isPromotionalMediaSelected;
              setIsPromotionalMediaSelected(nextVal);
              if (nextVal && marketingProductItems.length === 0) {
                addMarketingProductItem();
              }
            }
          }}
          className={cn(
            "flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-all text-left",
            isPromotionalMediaSelected
              ? "bg-emerald-50/60 border-emerald-500 text-emerald-800 shadow-sm"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
          )}
        >
          <div
            className={cn(
              "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors",
              isPromotionalMediaSelected
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-slate-300 bg-white",
            )}
          >
            {isPromotionalMediaSelected && (
              <Check className="h-3 w-3 stroke-[3]" />
            )}
          </div>
          <span>สื่อส่งเสริมการขาย</span>
        </button>

        {/* Checkbox 2: รายการส่งเสริมการขาย */}
        <button
          type="button"
          onClick={() =>
            !readonly && setIsSalesPromotionSelected(!isSalesPromotionSelected)
          }
          className={cn(
            "flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-all text-left",
            isSalesPromotionSelected
              ? "bg-blue-50/60 border-blue-500 text-blue-800 shadow-sm"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
          )}
        >
          <div
            className={cn(
              "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors",
              isSalesPromotionSelected
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-300 bg-white",
            )}
          >
            {isSalesPromotionSelected && (
              <Check className="h-3 w-3 stroke-[3]" />
            )}
          </div>
          <span>รายการส่งเสริมการขาย</span>
        </button>
      </div>

      {/* Details Card 1: รายละเอียดงบการตลาด & สัดส่วนต่อยอดขาย */}
      {isPromotionalMediaSelected && (
        <div className="bg-emerald-50/40 border border-emerald-200/70 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
              <Package className="h-4 w-4 text-emerald-600" />
              รายละเอียดงบการตลาด & สัดส่วนต่อยอดขาย
            </span>
          </div>

          {/* Summary Stat Cards */}
          {(() => {
            const calculatedBudgetSum =
              marketingProductItems.length > 0
                ? marketingProductItems.reduce(
                    (sum, item) =>
                      sum +
                      (item.quantityCases || 0) * (item.pricePerCase || 0),
                    0,
                  )
                : marketingBudgetAmount;

            const salesRatio =
              targetSales > 0 ? (calculatedBudgetSum / targetSales) * 100 : 0;

            return (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Card 1: งบการตลาด */}
                <div className="bg-white/90 border border-emerald-200/90 rounded-xl p-3.5 shadow-2xs flex items-center justify-between transition-all hover:shadow-xs">
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                      <Coins className="h-3.5 w-3.5 text-emerald-600" />
                      งบการตลาด (บาท) <span className="text-red-500">*</span>
                    </span>
                    <div className="text-base sm:text-lg font-extrabold text-emerald-700 tracking-tight">
                      ฿ {calculatedBudgetSum.toLocaleString("th-TH")}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                    <Coins className="h-5 w-5" />
                  </div>
                </div>

                {/* Card 2: เป้ายอดขายรวมจากกิจกรรม */}
                <div className="bg-white/90 border border-blue-200/70 rounded-xl p-3.5 shadow-2xs flex items-center justify-between transition-all hover:shadow-xs">
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 text-blue-600" />
                      เป้ายอดขายรวมจากกิจกรรม
                    </span>
                    <div className="text-base sm:text-lg font-extrabold text-slate-800 tracking-tight">
                      ฿ {(targetSales || 0).toLocaleString("th-TH")}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center flex-shrink-0">
                    <Target className="h-5 w-5" />
                  </div>
                </div>

                {/* Card 3: สัดส่วนต่อยอดขาย (%) */}
                <div className="bg-white/90 border border-amber-200/70 rounded-xl p-3.5 shadow-2xs flex items-center justify-between transition-all hover:shadow-xs">
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                      <Percent className="h-3.5 w-3.5 text-amber-600" />
                      สัดส่วนต่อยอดขาย
                    </span>
                    <div className="text-base sm:text-lg font-extrabold text-amber-700 tracking-tight">
                      {salesRatio.toFixed(2)} %
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center flex-shrink-0">
                    <Percent className="h-4 w-4 stroke-[2.5]" />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Marketing Product Table */}
          <div className="space-y-2 pt-2 border-t border-emerald-200/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 leading-snug">
                สื่อส่งเสริมการขาย (PVC, ไวนิล, ของแถมตราปืนใหญ่ ทุกชนิด){" "}
                <span className="text-red-500">
                  * (ต้องมีอย่างน้อย 1 ข้อมูล)
                </span>
              </span>

              {!readonly && (
                <Button
                  type="button"
                  size="sm"
                  onClick={addMarketingProductItem}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  เพิ่มรายการ
                </Button>
              )}
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2 px-3 text-center w-10">ลำดับ</th>
                    <th className="py-2 px-3 min-w-[100px]">
                      หมวดหมู่ <span className="text-red-500">*</span>
                    </th>
                    <th className="py-2 px-3 min-w-[180px]">
                      รายการ <span className="text-red-500">*</span>
                    </th>

                    <th className="py-2 px-3 w-20 text-center">หน่วย</th>
                    <th className="py-2 px-3 w-28 text-center">
                      ราคา <span className="text-red-500">*</span>
                    </th>
                    <th className="py-2 px-3 w-28 text-center">
                      จำนวน <span className="text-red-500">*</span>
                    </th>
                    <th className="py-2 px-3 w-32 text-right">รวมเงิน</th>
                    {!readonly && (
                      <th className="py-2 px-3 text-center w-14">จัดการ</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {marketingProductItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-4 text-center text-slate-400"
                      >
                        ยังไม่มีรายการสินค้า
                      </td>
                    </tr>
                  ) : (
                    marketingProductItems.map((item, index) => {
                      const totalItemPrice =
                        (item.quantityCases || 0) * (item.pricePerCase || 0);
                      const currentCat =
                        item.category ||
                        getCategoryForProduct(
                          item.productName,
                          promotionalMaterialsByCategory,
                          availableCategories[0],
                        );
                      const availableProds =
                        promotionalMaterialsByCategory?.[currentCat] || [];
                      const currentProdObj = availableProds.find(
                        (p) => p.name === item.productName,
                      );
                      const currentUnit =
                        item.unit ||
                        currentProdObj?.unit ||
                        (currentCat === "PP_Board"
                          ? "แผ่น"
                          : currentCat === "Banner"
                            ? "ผืน"
                            : currentCat === "Leaflet"
                              ? "ใบ"
                              : "ชิ้น");

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/60 transition-colors"
                        >
                          <td className="py-2 px-3 text-center font-medium text-slate-500">
                            {index + 1}
                          </td>
                          {/* หมวดหมู่ (Category) */}
                          <td className="py-1.5 px-3">
                            <FormCombobox
                              id={`category-combobox-${item.id}`}
                              label=""
                              triggerClassName="h-8 min-h-[32px] py-1 text-xs bg-white border-slate-200 rounded-md text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                              value={currentCat}
                              onChange={(newCat) => {
                                const prods =
                                  promotionalMaterialsByCategory?.[newCat] ||
                                  [];
                                const firstProdObj = prods[0];
                                const firstProd = firstProdObj
                                  ? firstProdObj.name
                                  : "";
                                const firstPrice = firstProdObj
                                  ? firstProdObj.price
                                  : 0;
                                const firstUnit =
                                  firstProdObj?.unit ||
                                  (newCat === "PP_Board"
                                    ? "แผ่น"
                                    : newCat === "Banner"
                                      ? "ผืน"
                                      : newCat === "Leaflet"
                                        ? "ใบ"
                                        : "ชิ้น");

                                updateMarketingProductItem(
                                  item.id,
                                  "category",
                                  newCat,
                                );
                                updateMarketingProductItem(
                                  item.id,
                                  "productName",
                                  firstProd,
                                );
                                updateMarketingProductItem(
                                  item.id,
                                  "pricePerCase",
                                  firstPrice,
                                );
                                updateMarketingProductItem(
                                  item.id,
                                  "unit",
                                  firstUnit,
                                );
                              }}
                              options={availableCategories.map((cat) => ({
                                value: cat,
                                label: cat,
                              }))}
                              placeholder="เลือกหมวดหมู่..."
                              searchPlaceholder="ค้นหาหมวดหมู่..."
                              emptyText="ไม่พบหมวดหมู่"
                              disabled={readonly}
                            />
                          </td>
                          {/* รายการ (Product) */}
                          <td className="py-1.5 px-3">
                            {currentCat === "อื่นๆ" ? (
                              <input
                                type="text"
                                value={item.productName || ""}
                                onChange={(e) =>
                                  updateMarketingProductItem(
                                    item.id,
                                    "productName",
                                    e.target.value,
                                  )
                                }
                                placeholder="ระบุชื่อรายการ..."
                                disabled={readonly}
                                className="w-full h-8 px-2.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
                              />
                            ) : (
                              <FormCombobox
                                id={`product-combobox-${item.id}`}
                                label=""
                                triggerClassName="h-8 min-h-[32px] py-1 text-xs bg-white border-slate-200 rounded-md text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                                value={item.productName}
                                onChange={(val) => {
                                  const prodObj = availableProds.find(
                                    (p) => p.name === val,
                                  );
                                  const price = prodObj ? prodObj.price : 0;
                                  const unit =
                                    prodObj?.unit ||
                                    (currentCat === "PP_Board"
                                      ? "แผ่น"
                                      : currentCat === "Banner"
                                        ? "ผืน"
                                        : currentCat === "Leaflet"
                                          ? "ใบ"
                                          : "ชิ้น");

                                  updateMarketingProductItem(
                                    item.id,
                                    "productName",
                                    val,
                                  );
                                  updateMarketingProductItem(
                                    item.id,
                                    "pricePerCase",
                                    price,
                                  );
                                  updateMarketingProductItem(
                                    item.id,
                                    "unit",
                                    unit,
                                  );
                                }}
                                options={availableProds.map((prod) => ({
                                  value: prod.name,
                                  label: prod.name,
                                }))}
                                placeholder="เลือกสินค้า..."
                                searchPlaceholder="ค้นหาสินค้า..."
                                emptyText="ไม่พบสินค้า"
                                disabled={readonly}
                              />
                            )}
                          </td>

                          {/* หน่วย */}
                          <td className="py-1.5 px-3 text-center whitespace-nowrap">
                            {currentCat === "อื่นๆ" ? (
                              <select
                                value={item.unit || "ชิ้น"}
                                onChange={(e) =>
                                  updateMarketingProductItem(
                                    item.id,
                                    "unit",
                                    e.target.value,
                                  )
                                }
                                disabled={readonly}
                                className="h-8 px-2 text-center rounded-md border border-slate-200 text-xs font-bold text-emerald-800 bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                              >
                                {MARKETING_UNITS.map((u) => (
                                  <option key={u} value={u}>
                                    {u}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 shadow-2xs">
                                {currentUnit}
                              </span>
                            )}
                          </td>
                          <td className="py-1.5 px-3">
                            <div className="relative">
                              <span className="absolute left-2 top-2 text-slate-400 text-[11px] font-semibold">
                                ฿
                              </span>
                              <input
                                type="number"
                                min={0}
                                value={item.pricePerCase ?? 0}
                                onChange={(e) =>
                                  updateMarketingProductItem(
                                    item.id,
                                    "pricePerCase",
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                disabled={currentCat !== "อื่นๆ" || readonly}
                                readOnly={currentCat !== "อื่นๆ" || readonly}
                                className={cn(
                                  "w-full h-8 pl-5 pr-2 rounded-md border border-slate-200 text-xs text-right font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500",
                                  currentCat === "อื่นๆ" && !readonly
                                    ? "bg-white text-slate-800"
                                    : "bg-slate-100/70 text-slate-500 cursor-not-allowed",
                                )}
                              />
                            </div>
                          </td>
                          <td className="py-1.5 px-3">
                            <input
                              type="number"
                              min={1}
                              value={item.quantityCases ?? 1}
                              onChange={(e) =>
                                updateMarketingProductItem(
                                  item.id,
                                  "quantityCases",
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              disabled={readonly}
                              className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                            />
                          </td>
                          <td className="py-1.5 px-3 text-right font-semibold text-emerald-700">
                            ฿ {totalItemPrice.toLocaleString()}
                          </td>
                          {!readonly && (
                            <td className="py-1.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  deleteMarketingProductItem(item.id)
                                }
                                disabled={marketingProductItems.length <= 1}
                                title={
                                  marketingProductItems.length <= 1
                                    ? "สื่อส่งเสริมการขายต้องมีอย่างน้อย 1 ข้อมูล"
                                    : "ลบรายการ"
                                }
                                className={cn(
                                  "p-1 rounded-md transition-colors",
                                  marketingProductItems.length <= 1
                                    ? "text-slate-300 cursor-not-allowed"
                                    : "text-red-500 hover:bg-red-50",
                                )}
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
      )}

      {/* Details Card 2: รายการส่งเสริมการขาย */}
      {isSalesPromotionSelected && (
        <div className="bg-blue-50/40 border border-blue-200/70 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
            <span className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
              <Receipt className="h-4 w-4 text-blue-600" />
              รายการส่งเสริมการขาย
            </span>

            {!readonly && (
              <Button
                type="button"
                size="sm"
                onClick={addSalesPromotionRow}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                เพิ่มรายการ
              </Button>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3 text-center w-12">ลำดับ</th>

                  <th className="py-2.5 px-3 min-w-[200px]">
                    รายละเอียด <span className="text-red-500">*</span>
                  </th>
                  <th className="py-2.5 px-3 w-36 text-center">
                    จำนวนเงิน (บาท) <span className="text-red-500">*</span>
                  </th>
                  <th className="py-2.5 px-3 min-w-[130px]">
                    การใช้งบ <span className="text-red-500">*</span>
                  </th>
                  {!readonly && (
                    <th className="py-2.5 px-3 text-center w-16">จัดการ</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {salesPromotionItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-slate-400">
                      ยังไม่มีรายการส่งเสริมการขาย
                    </td>
                  </tr>
                ) : (
                  salesPromotionItems.map((item, index) => {
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-2.5 px-3 text-center font-medium text-slate-500">
                          {index + 1}
                        </td>

                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.detail}
                            onChange={(e) =>
                              updateSalesPromotionRow(
                                item.id,
                                "detail",
                                e.target.value,
                              )
                            }
                            disabled={readonly}
                            placeholder="ระบุรายละเอียดรายการ..."
                            className="w-full h-8 px-2.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <div className="relative">
                            <span className="absolute left-2.5 top-2 text-slate-400 text-[11px]">
                              ฿
                            </span>
                            <input
                              type="number"
                              min={0}
                              value={item.amount}
                              onChange={(e) =>
                                updateSalesPromotionRow(
                                  item.id,
                                  "amount",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              disabled={readonly}
                              placeholder="0"
                              className="w-full h-8 pl-6 pr-2 rounded-md border border-slate-200 text-xs text-slate-800 text-right font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <FormCombobox
                            id={`budget-type-combobox-${item.id}`}
                            label=""
                            triggerClassName={cn(
                              "h-8 min-h-[32px] py-1 text-xs rounded-lg font-bold border transition-all shadow-2xs",
                            )}
                            value={item.budgetType || "งบการตลาด"}
                            onChange={(val) =>
                              updateSalesPromotionRow(
                                item.id,
                                "budgetType",
                                val,
                              )
                            }
                            options={[
                              { value: "งบการตลาด", label: "งบการตลาด" },
                              { value: "งบขาย", label: "งบขาย" },
                            ]}
                            placeholder="เลือกการใช้งบ..."
                            searchPlaceholder="ค้นหา..."
                            emptyText="ไม่พบรายการ"
                            disabled={readonly}
                          />
                        </td>
                        {!readonly && (
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => deleteSalesPromotionRow(item.id)}
                              className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors"
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
              {salesPromotionItems.length > 0 &&
                (() => {
                  const marketingTotal = salesPromotionItems
                    .filter(
                      (item) =>
                        (item.budgetType || "งบการตลาด") === "งบการตลาด",
                    )
                    .reduce((sum, item) => sum + (item.amount || 0), 0);
                  const salesTotal = salesPromotionItems
                    .filter((item) => item.budgetType === "งบขาย")
                    .reduce((sum, item) => sum + (item.amount || 0), 0);
                  const grandTotal = marketingTotal + salesTotal;

                  return (
                    <tfoot className="bg-slate-50/90 border-t-2 border-slate-200 text-xs text-slate-700">
                      <tr>
                        <td colSpan={readonly ? 4 : 5} className="py-3 px-3">
                          <div className="flex flex-wrap items-center justify-between gap-2.5">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-medium shadow-2xs">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                รวมงบการตลาด:{" "}
                                <strong className="font-bold text-emerald-700">
                                  ฿ {marketingTotal.toLocaleString()}
                                </strong>
                              </span>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200/80 text-blue-800 text-xs font-medium shadow-2xs">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                รวมงบขาย:{" "}
                                <strong className="font-bold text-blue-700">
                                  ฿ {salesTotal.toLocaleString()}
                                </strong>
                              </span>
                            </div>
                            <div className="text-xs font-bold text-slate-800 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
                              ผลรวมใช้งบทั้งสิ้น:{" "}
                              <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                                ฿ {grandTotal.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  );
                })()}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
