"use client";

import React from "react";
import { Sprout, Plus, Trash2, PlusCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Type7DemoPlotItem } from "@/modules/activity-plans/features/form/types";
import {
  CROP_CATEGORIES,
  type UserDemoPlotOption,
} from "@/modules/activity-plans/constants";
import {
  Type7NewDemo,
  CustomerOption,
  ProductOption,
  ProductCategoryOption,
  ChemicalGroupOption,
} from "./type7-new-demo";
import { Type7FollowUp } from "./type7-follow-up";

export type {
  CustomerOption,
  ProductOption,
  ProductCategoryOption,
  ChemicalGroupOption,
};

interface Props {
  mode?: "TYPE_7A" | "TYPE_7B";
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
  productCategories?: ProductCategoryOption[];
  chemicalGroups?: ChemicalGroupOption[];
  demoPlots?: UserDemoPlotOption[];
  parentStartDate?: string;
}

export function Type7Demo({
  mode,
  readonly = false,
  type7Items,
  addType7Row,
  updateType7Row,
  deleteType7Row,
  customers = [],
  products = [],
  productCategories = [],
  chemicalGroups = [],
  demoPlots = [],
}: Props) {
  const plotList = (demoPlots || []).filter(
    (plot) => plot.status !== "CANCELLED",
  );

  const customerOptions = (customers || []).map((c) => ({
    value: c.name,
    label: c.name,
  }));

  const productOptions = (products || []).map((p) => ({
    value: p.name,
    label: p.name,
    subLabel: p.productCode || undefined,
  }));

  const cropCategoryOptions = CROP_CATEGORIES.map((cat: string) => ({
    value: cat,
    label: cat,
  }));

  const existingPlotOptions = plotList.map((plot) => ({
    value: plot.name,
    label: plot.name,
    subLabel:
      plot.productName || plot.showcase
        ? `สินค้า: ${plot.productName || plot.showcase}`
        : undefined,
  }));

  const isModeA = mode === "TYPE_7A";
  const isModeB = mode === "TYPE_7B";

  const cardTitle = isModeA
    ? "ทำแปลงสาธิต"
    : isModeB
      ? "ติดตามแปลงสาธิต"
      : "ติดตามแปลงสาธิต / ทำแปลง";

  const emptyText = isModeA
    ? "ยังไม่มีรายการทำแปลงสาธิต"
    : isModeB
      ? "ยังไม่มีรายการติดตามแปลงสาธิต"
      : "ยังไม่มีรายการแปลงสาธิต";

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          {isModeB ? (
            <Search className="h-4 w-4 text-blue-600" />
          ) : (
            <Sprout className="h-4 w-4 text-emerald-600" />
          )}
          <span>{cardTitle}</span>
        </div>

        {!readonly && (
          <Button
            type="button"
            size="sm"
            onClick={addType7Row}
            className={cn(
              "text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm",
              isModeB
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-emerald-600 hover:bg-emerald-700",
            )}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            เพิ่มรายการ
          </Button>
        )}
      </div>

      {/* List of Demo Plot Cards */}
      <div className="space-y-4">
        {type7Items.length === 0 ? (
          <div className="py-6 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
            {emptyText}
          </div>
        ) : (
          type7Items.map((item, index) => {
            const itemMode = isModeA
              ? "CREATE"
              : isModeB
                ? "FOLLOW_UP"
                : item.plotActivityType || "CREATE";
            const isFollowUp = itemMode === "FOLLOW_UP";

            const itemLabel = isModeA
              ? `รายการทำแปลงสาธิตที่ ${index + 1}`
              : isModeB
                ? `รายการติดตามแปลงสาธิตที่ ${index + 1}`
                : `รายการแปลงสาธิตที่ ${index + 1}`;

            return (
              <div
                key={item.id}
                className={cn(
                  "p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4 transition-all",
                  isModeB
                    ? "hover:border-blue-300"
                    : "hover:border-emerald-300",
                )}
              >
                {/* Header bar */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span
                    className={cn(
                      "text-xs font-bold flex items-center gap-1.5",
                      isModeB ? "text-blue-800" : "text-emerald-800",
                    )}
                  >
                    <span
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-extrabold",
                        isModeB
                          ? "bg-blue-100 text-blue-700"
                          : "bg-emerald-100 text-emerald-700",
                      )}
                    >
                      {index + 1}
                    </span>
                    {itemLabel}
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

                {/* 1. Toggle Segmented Control (only if mode is not specified) */}
                {!mode && (
                  <div className="space-y-1.5 pt-0.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      ประเภทงาน <span className="text-red-500">*</span>
                    </label>
                    <div className="inline-flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 gap-1 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() =>
                          updateType7Row(item.id, "plotActivityType", "CREATE")
                        }
                        disabled={readonly}
                        className={cn(
                          "flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
                          !isFollowUp
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60",
                        )}
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span>ทำแปลงสาธิต</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateType7Row(
                            item.id,
                            "plotActivityType",
                            "FOLLOW_UP",
                          )
                        }
                        disabled={readonly}
                        className={cn(
                          "flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
                          isFollowUp
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60",
                        )}
                      >
                        <Search className="h-3.5 w-3.5" />
                        <span>ติดตามแปลงสาธิต</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. DELEGATE TO SUB-COMPONENTS */}
                {isFollowUp ? (
                  <Type7FollowUp
                    item={item}
                    updateType7Row={updateType7Row}
                    existingPlotOptions={existingPlotOptions}
                    plotList={plotList}
                    readonly={readonly}
                  />
                ) : (
                  <Type7NewDemo
                    item={item}
                    updateType7Row={updateType7Row}
                    customerOptions={customerOptions}
                    productOptions={productOptions}
                    cropCategoryOptions={cropCategoryOptions}
                    customers={customers}
                    products={products}
                    productCategories={productCategories}
                    chemicalGroups={chemicalGroups}
                    readonly={readonly}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
