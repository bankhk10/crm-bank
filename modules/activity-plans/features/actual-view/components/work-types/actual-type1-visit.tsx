"use client";

import React, { useMemo } from "react";
import { X, Store } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormCombobox } from "@/components/custom/form-components";
import { cn } from "@/lib/utils";
import { ActualTargetCard } from "../actual-target-card";
import { DEMO_PRODUCTS } from "../../../../constants";
import DatePicker from "@/components/custom/DatePicker";

export interface ProductOption {
  id: string;
  name: string;
  productCode?: string | null;
}

interface ActualType1VisitProps {
  isVisible: boolean;
  target: {
    customer: string;
    topic: string;
    detail: string;
    opportunity: string;
    nextDate: string;
  };
  productAdvice: string;
  setProductAdvice: (v: string) => void;
  detail?: string;
  setDetail?: (v: string) => void;
  discussionResult: string;
  setDiscussionResult: (v: string) => void;
  salesOpportunity: "สูง" | "ต่ำ" | "";
  setSalesOpportunity: (v: "สูง" | "ต่ำ" | "") => void;
  nextAction: string;
  setNextAction: (v: string) => void;
  nextMeetingDate: string;
  setNextMeetingDate: (v: string) => void;
  products?: ProductOption[];
}

export function ActualType1Visit({
  isVisible,
  target,
  productAdvice,
  setProductAdvice,
  discussionResult,
  setDiscussionResult,
  salesOpportunity,
  setSalesOpportunity,
  nextAction,
  setNextAction,
  nextMeetingDate,
  setNextMeetingDate,
  products = [],
}: ActualType1VisitProps) {
  const isAdviceTopic = target?.topic?.trim() === "ให้คำแนะนำการใช้สินค้า";

  const selectedProducts = useMemo(
    () =>
      productAdvice
        ? productAdvice
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    [productAdvice],
  );

  const comboboxOptions = useMemo(() => {
    const list =
      products && products.length > 0
        ? products.map((p) => ({
            value: p.name,
            label: p.name,
            subLabel: p.productCode || undefined,
          }))
        : DEMO_PRODUCTS.map((name) => ({
            value: name,
            label: name,
            subLabel: undefined,
          }));

    const existingNames = new Set(list.map((o) => o.value));
    selectedProducts.forEach((prod) => {
      if (!existingNames.has(prod)) {
        list.push({
          value: prod,
          label: prod,
          subLabel: undefined,
        });
        existingNames.add(prod);
      }
    });

    return list;
  }, [products, selectedProducts]);

  if (!isVisible) return null;

  const handleAddProduct = (prod: string) => {
    if (!prod || selectedProducts.includes(prod)) return;
    const updated = [...selectedProducts, prod];
    setProductAdvice(updated.join(", "));
  };

  const handleRemoveProduct = (prod: string) => {
    const updated = selectedProducts.filter((p) => p !== prod);
    setProductAdvice(updated.join(", "));
  };

  return (
    <div className="border border-emerald-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex items-center gap-2 pb-1">
        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
          <Store className="w-4 h-4" />
        </div>
        <h2 className="font-bold text-emerald-800 text-base md:text-lg">
          เข้าพบร้านค้า / Key Farmer
        </h2>
      </div>

      <ActualTargetCard
        iconColorClass="text-emerald-600"
        badgeColorClass="bg-emerald-50 text-emerald-700 border border-emerald-200"
        gridColsClass="grid-cols-1 sm:grid-cols-3"
        items={[
          { label: "ลูกค้าร้านค้าเป้า:", value: target.customer || "-" },
          { label: "ประเด็นหลัก:", value: target.topic || "-" },
          { label: "รายละเอียดเพิ่มเติม:", value: target.detail || "-" },
        ]}
      />

      <div className="space-y-4 pt-1">
        {/* Conditional rendering for advice products & sales opportunity */}
        {isAdviceTopic && (
          <>
            {/* สินค้าที่ให้คำแนะนำ */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center justify-between">
                <span>สินค้าที่ให้คำแนะนำ (เลือกได้มากกว่า 1 รายการ)</span>
                {selectedProducts.length > 0 && (
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    เลือกแล้ว {selectedProducts.length} รายการ
                  </span>
                )}
              </label>

              {/* Selected Product Badges */}
              {selectedProducts.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2.5 bg-emerald-50/40 border border-emerald-200/60 rounded-xl mb-1.5">
                  {selectedProducts.map((prod) => (
                    <span
                      key={prod}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-emerald-900 border border-emerald-200 shadow-2xs"
                    >
                      {prod}
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(prod)}
                        className="hover:bg-emerald-100 rounded-md p-0.5 transition-colors text-emerald-600 hover:text-red-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* FormCombobox with Search */}
              <FormCombobox
                id="product-advice-combobox"
                label=""
                labelClassName="hidden"
                value=""
                onChange={(val) => {
                  if (val) {
                    handleAddProduct(val);
                  }
                }}
                options={comboboxOptions}
                placeholder="เลือกสินค้าที่ให้คำแนะนำเพิ่มเติม (คลิกเลือกหลายรายการได้)"
                searchPlaceholder="ค้นหาสินค้า..."
                emptyText="ไม่พบสินค้า"
                triggerClassName="w-full bg-white border-slate-200 text-xs sm:text-sm h-10 min-h-[40px] rounded-xl mt-0 font-normal hover:bg-slate-50 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* ประเมินโอกาสการขาย */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-slate-800">
                ประเมินโอกาสการขาย <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                {(["สูง", "ต่ำ"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSalesOpportunity(opt)}
                    className={cn(
                      "py-2.5 px-4 rounded-xl border text-xs sm:text-sm font-semibold cursor-pointer transition-all flex items-center justify-center",
                      salesOpportunity === opt
                        ? opt === "สูง"
                          ? "bg-emerald-50/90 border-emerald-500 text-emerald-950 ring-1 ring-emerald-500/50 shadow-2xs"
                          : "bg-rose-50/90 border-rose-400 text-rose-950 ring-1 ring-rose-400/50 shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ผลการพูดคุย */}
        <div className="space-y-1.5">
          <label className="text-xs sm:text-sm font-semibold text-slate-800">
            ผลการพูดคุย <span className="text-rose-500">*</span>
          </label>
          <Textarea
            rows={2}
            value={discussionResult}
            onChange={(e) => setDiscussionResult(e.target.value)}
            placeholder="สรุปประเด็นสำคัญจากการพูดคุยกับลูกค้า"
            className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm"
          />
        </div>

        {/* สิ่งที่ต้องดำเนินการต่อ & วันที่นัดหมายครั้งถัดไป */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-semibold text-slate-800">
              สิ่งที่ต้องดำเนินการต่อ
            </label>
            <Input
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              placeholder="เช่น ส่งใบเสนอราคา, นัดไดอะไซด์ปฐมนิเทศต่อ"
              className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm h-10"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-semibold text-slate-800">
              วันที่นัดหมายครั้งถัดไป
            </label>
            <DatePicker
              value={nextMeetingDate}
              onChange={(v) => setNextMeetingDate(v || "")}
              placeholder="เลือกวันที่นัดหมาย"
              className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm h-10"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
