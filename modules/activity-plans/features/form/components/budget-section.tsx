import React from "react";
import { Plus, Trash2, Check, Package, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/modules/sales/features/form/forms/section-header";
import type { MarketingBudgetProductItem, SalesPromotionItem } from "../types";
import { DEMO_PRODUCTS, DEMO_PRODUCT_PRICES } from "../constants";

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
}

export function BudgetSection({
  selectedWorkTypes,
  readonly = false,
  isPromotionalMediaSelected,
  setIsPromotionalMediaSelected,
  isSalesPromotionSelected,
  setIsSalesPromotionSelected,
  marketingProductItems,
  marketingBudgetAmount,
  setMarketingBudgetAmount,
  addMarketingProductItem,
  updateMarketingProductItem,
  deleteMarketingProductItem,
  salesPromotionItems,
  addSalesPromotionRow,
  updateSalesPromotionRow,
  deleteSalesPromotionRow,
  targetSales,
}: Props) {
  return (
    <div className="space-y-4">
      <SectionHeader title="งบประมาณและค่าใช้จ่าย" color="gray" />

      {/* Checkbox Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Checkbox 1: สื่อส่งเสริมการขาย */}
        <button
          type="button"
          onClick={() =>
            !readonly &&
            setIsPromotionalMediaSelected(!isPromotionalMediaSelected)
          }
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
            !readonly &&
            setIsSalesPromotionSelected(!isSalesPromotionSelected)
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

          {/* Summary & Ratio Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                งบการตลาด (บาท) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-semibold">
                  ฿
                </span>
                <input
                  type="number"
                  min={0}
                  value={
                    marketingProductItems.length > 0
                      ? marketingProductItems.reduce(
                          (sum, item) =>
                            sum +
                            (item.quantityCases || 0) *
                              (item.pricePerCase || 0),
                          0,
                        )
                      : marketingBudgetAmount
                  }
                  onChange={(e) =>
                    setMarketingBudgetAmount(parseFloat(e.target.value) || 0)
                  }
                  disabled={readonly || marketingProductItems.length > 0}
                  className="w-full h-10 pl-7 pr-3 rounded-lg border border-slate-200 bg-white text-xs font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                เป้ายอดขายรวมจากกิจกรรม (บาท)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-semibold">
                  ฿
                </span>
                <input
                  type="number"
                  readOnly
                  value={targetSales}
                  className="w-full h-10 pl-7 pr-3 rounded-lg border border-slate-200 bg-slate-100/70 text-xs font-semibold text-slate-700 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                สัดส่วนต่อยอดขาย (%)
              </label>
              <div className="h-10 px-3 rounded-lg border border-emerald-300 bg-emerald-100/60 flex items-center justify-between text-xs font-bold text-emerald-900 shadow-sm">
                <span className="text-sm text-emerald-700 font-extrabold">
                  {(() => {
                    const budgetSum =
                      marketingProductItems.length > 0
                        ? marketingProductItems.reduce(
                            (sum, item) =>
                              sum +
                              (item.quantityCases || 0) *
                                (item.pricePerCase || 0),
                            0,
                          )
                        : marketingBudgetAmount;
                    return targetSales > 0
                      ? `${((budgetSum / targetSales) * 100).toFixed(2)} %`
                      : "0.00 %";
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* Marketing Product Table */}
          <div className="space-y-2 pt-2 border-t border-emerald-200/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                สื่อส่งเสริมการขาย (PVC, ไวนิล, ของแถมตราปืนใหญ่ ทุกชนิด)
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
                    <th className="py-2 px-3 min-w-[180px]">
                      รายการ <span className="text-red-500">*</span>
                    </th>
                    <th className="py-2 px-3 w-28 text-center">
                      จำนวน <span className="text-red-500">*</span>
                    </th>
                    <th className="py-2 px-3 w-32 text-center">
                      ราคา <span className="text-red-500">*</span>
                    </th>
                    <th className="py-2 px-3 w-36 text-right">
                      รวมเป็นเงินทั้งหมด
                    </th>
                    {!readonly && (
                      <th className="py-2 px-3 text-center w-14">จัดการ</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {marketingProductItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-4 text-center text-slate-400 italic"
                      >
                        ยังไม่มีรายการสินค้า กดเพิ่มสินค้า เพื่อบันทึก
                      </td>
                    </tr>
                  ) : (
                    marketingProductItems.map((item, index) => {
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
                          <td className="py-1.5 px-3">
                            <select
                              value={item.productName}
                              onChange={(e) => {
                                const selectedProd = e.target.value;
                                updateMarketingProductItem(
                                  item.id,
                                  "productName",
                                  selectedProd,
                                );
                                const defaultPrice =
                                  DEMO_PRODUCT_PRICES[selectedProd] ?? 500;
                                updateMarketingProductItem(
                                  item.id,
                                  "pricePerCase",
                                  defaultPrice,
                                );
                              }}
                              disabled={readonly}
                              className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                            >
                              {DEMO_PRODUCTS.map((prod) => (
                                <option key={prod} value={prod}>
                                  {prod} (฿
                                  {(
                                    DEMO_PRODUCT_PRICES[prod] ?? 500
                                  ).toLocaleString()}
                                  )
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-1.5 px-3">
                            <input
                              type="number"
                              min={1}
                              value={item.quantityCases}
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
                          <td className="py-1.5 px-3">
                            <div className="relative">
                              <span className="absolute left-2 top-2 text-slate-400 text-[11px] font-semibold">
                                ฿
                              </span>
                              <input
                                type="number"
                                value={item.pricePerCase}
                                readOnly
                                disabled
                                className="w-full h-8 pl-5 pr-2 rounded-md border border-slate-200 text-xs text-slate-700 text-right font-bold bg-slate-100/80 cursor-not-allowed"
                              />
                            </div>
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
                    <td
                      colSpan={6}
                      className="py-4 text-center text-slate-400 italic"
                    >
                      ยังไม่มีรายการส่งเสริมการขาย กด "เพิ่มรายการ"
                      เพื่อบันทึก
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
                          <select
                            value={item.budgetType || "งบการตลาด"}
                            onChange={(e) =>
                              updateSalesPromotionRow(
                                item.id,
                                "budgetType",
                                e.target.value,
                              )
                            }
                            disabled={readonly}
                            className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                          >
                            <option value="งบการตลาด">งบการตลาด</option>
                            <option value="งบขาย">งบขาย</option>
                          </select>
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
              {salesPromotionItems.length > 0 && (
                <tfoot className="bg-slate-50/80 border-t-2 border-slate-200 text-xs font-bold text-slate-800">
                  <tr>
                    <td colSpan={2} className="py-3 px-3 text-left">
                      ผลรวมใช้งบทั้งสิ้น:{" "}
                      {salesPromotionItems
                        .reduce((sum, item) => sum + (item.amount || 0), 0)
                        .toLocaleString()}{" "}
                      ฿
                    </td>
                    {!readonly && <td></td>}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
