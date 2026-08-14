"use client";

import React from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ActualTargetCard } from "../actual-target-card";
import { DEMO_PRODUCTS } from "../../../form/constants";

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
  detail: string;
  setDetail: (v: string) => void;
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
  detail,
  setDetail,
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
  if (!isVisible) return null;

  const productOptions =
    products && products.length > 0
      ? products.map((p) => p.name)
      : DEMO_PRODUCTS;

  const displayProducts = Array.from(
    new Set([
      ...productOptions,
      ...(productAdvice ? productAdvice.split(",").map((s) => s.trim()) : []),
    ]),
  ).filter(Boolean);

  const selectedProducts = productAdvice
    ? productAdvice
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

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
    <div className="border-2 border-teal-500 rounded-2xl p-4 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-teal-100 pb-3">
        <div className="flex items-center gap-2.5">
          <h2 className="font-bold text-teal-900 text-base md:text-lg">
            เข้าพบร้านค้า / Key Farmer
          </h2>
        </div>
      </div>

      <ActualTargetCard
        iconColorClass="text-teal-600"
        badgeColorClass="bg-teal-100 text-teal-800"
        gridColsClass="grid-cols-1 sm:grid-cols-2"
        items={[
          { label: "ลูกค้า/ร้านค้า:", value: target.customer },
          { label: "หัวข้อเป้าหมาย:", value: target.topic },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-sm font-semibold text-slate-800 flex items-center justify-between">
            <span>สินค้าที่ให้คำแนะนำ (เลือกได้มากกว่า 1 รายการ)</span>
            {selectedProducts.length > 0 && (
              <span className="text-xs font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                เลือกแล้ว {selectedProducts.length} รายการ
              </span>
            )}
          </label>

          {/* Selected Product Badges */}
          {selectedProducts.length > 0 && (
            <div className="flex flex-wrap gap-1.5 p-2.5 bg-teal-50/50 border border-teal-200/80 rounded-xl mb-1.5">
              {selectedProducts.map((prod) => (
                <span
                  key={prod}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-teal-900 border border-teal-300 shadow-2xs"
                >
                  {prod}
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(prod)}
                    className="hover:bg-teal-100 rounded-md p-0.5 transition-colors text-teal-600 hover:text-red-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Select dropdown to add product */}
          <Select
            value=""
            onValueChange={(val) => {
              if (val && !selectedProducts.includes(val)) {
                handleAddProduct(val);
              }
            }}
          >
            <SelectTrigger className="w-full bg-white border-slate-300">
              <SelectValue placeholder="+ เลือกสินค้าที่ให้คำแนะนำเพิ่ม (คลิกเลือกหลายรายการได้)" />
            </SelectTrigger>
            <SelectContent>
              {displayProducts.map((prod) => {
                const isSelected = selectedProducts.includes(prod);
                return (
                  <SelectItem
                    key={prod}
                    value={prod}
                    disabled={isSelected}
                    className={cn(isSelected && "opacity-50")}
                  >
                    {prod} {isSelected ? "(เลือกแล้ว)" : ""}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-800">
            ประเมินโอกาสการขาย <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {(["สูง", "ต่ำ"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setSalesOpportunity(opt)}
                className={cn(
                  "py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all",
                  salesOpportunity === opt
                    ? opt === "สูง"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20"
                      : "bg-red-100 border-red-400 text-red-800 ring-2 ring-red-400/20"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-800">
          ผลการพูดคุย <span className="text-rose-500">*</span>
        </label>
        <Textarea
          rows={2}
          value={discussionResult}
          onChange={(e) => setDiscussionResult(e.target.value)}
          placeholder="สรุปประเด็นสำคัญจากการพูดคุยกับลูกค้า"
          className="bg-white border-slate-300"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-800">
            สิ่งที่ต้องดำเนินการต่อ
          </label>
          <Textarea
            rows={2}
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            placeholder="เช่น ส่งใบเสนอราคา, นำตัวอย่างสินค้ามาให้ลอง"
            className="bg-white border-slate-300"
          />
        </div>

        <div className="space-y-1.5 ">
          <label className="text-sm font-semibold text-slate-800">
            วันที่นัดหมายครั้งถัดไป
          </label>
          <Input
            type="date"
            value={nextMeetingDate}
            onChange={(e) => setNextMeetingDate(e.target.value)}
            className="bg-white border-slate-300 mt-2"
          />
        </div>
      </div>
    </div>
  );
}
