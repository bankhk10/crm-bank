"use client";

import React from "react";
import { Plus, Trash2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FormCombobox } from "@/components/custom/form-components";
import type { SalesPromotionItem } from "../types";

export interface SalesPromotionCardProps {
  readonly?: boolean;
  salesPromotionItems: SalesPromotionItem[];
  addSalesPromotionRow: () => void;
  updateSalesPromotionRow: (
    id: string,
    field: keyof SalesPromotionItem,
    val: any,
  ) => void;
  deleteSalesPromotionRow: (id: string) => void;
}

export function SalesPromotionCard({
  readonly = false,
  salesPromotionItems,
  addSalesPromotionRow,
  updateSalesPromotionRow,
  deleteSalesPromotionRow,
}: SalesPromotionCardProps) {
  return (
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
  );
}

