"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const OTHER_OPTION = "ไม่พบข้อมูล / ระบุเพิ่มเติม";

export interface StockCheckItem {
  id?: string;
  productName: string;
  remainingQty: string;
  remarks: string;
  isCustom?: boolean;
}

interface ActualType11StockProps {
  isVisible: boolean;
  target: {
    store: string;
    detail: string;
    targetOpportunity: string;
  };
  productList?: string;
  setProductList?: (v: string) => void;
  remainingQty?: string;
  setRemainingQty?: (v: string) => void;
  remarks?: string;
  setRemarks?: (v: string) => void;
  stockItems?: StockCheckItem[];
  setStockItems?: (items: StockCheckItem[]) => void;
  stockStatus: "ใกล้หมด" | "ขาดสต็อก" | "";
  setStockStatus: (v: "ใกล้หมด" | "ขาดสต็อก" | "") => void;
  reorderOpportunity: "สูง" | "ยังไม่แน่ใจ" | "ต่ำ" | "";
  setReorderOpportunity: (v: "สูง" | "ยังไม่แน่ใจ" | "ต่ำ" | "") => void;
  nextAction: string;
  setNextAction: (v: string) => void;
}

export function ActualType11Stock({
  isVisible,
  target,
  productList = "",
  setProductList,
  remainingQty = "",
  setRemainingQty,
  remarks = "",
  setRemarks,
  stockItems,
  setStockItems,
  stockStatus,
  setStockStatus,
  reorderOpportunity,
  setReorderOpportunity,
  nextAction,
  setNextAction,
}: ActualType11StockProps) {
  // Local state for stock items
  const [items, setItems] = useState<StockCheckItem[]>(() => {
    if (stockItems && stockItems.length > 0) return stockItems;
    return [
      {
        productName: productList || "",
        remainingQty: remainingQty || "",
        remarks: remarks || "",
        isCustom:
          productList && !DEMO_PRODUCTS.includes(productList) ? true : false,
      },
    ];
  });

  // Sync from props if stockItems changes
  useEffect(() => {
    if (stockItems && stockItems.length > 0) {
      setItems(stockItems);
    }
  }, [stockItems]);

  // Sync internal items back to parent props
  const updateItems = (newItems: StockCheckItem[]) => {
    setItems(newItems);
    if (setStockItems) {
      setStockItems(newItems);
    }
    if (setProductList) {
      setProductList(
        newItems
          .map((i) => i.productName)
          .filter(Boolean)
          .join(", "),
      );
    }
    if (setRemainingQty) {
      setRemainingQty(
        newItems
          .map((i) => i.remainingQty)
          .filter(Boolean)
          .join(", "),
      );
    }
    if (setRemarks) {
      setRemarks(
        newItems
          .map((i) => i.remarks)
          .filter(Boolean)
          .join(", "),
      );
    }
  };

  const handleAddItem = () => {
    const newItems = [
      ...items,
      { productName: "", remainingQty: "", remarks: "", isCustom: false },
    ];
    updateItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    const newItems = items.filter((_, idx) => idx !== index);
    updateItems(newItems);
  };

  const handleItemChange = (
    index: number,
    field: keyof StockCheckItem,
    value: any,
  ) => {
    const newItems = items.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    updateItems(newItems);
  };

  if (!isVisible) return null;

  return (
    <div className="border-2 border-slate-600 rounded-2xl p-4 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2.5">
          <h2 className="font-bold text-slate-900 text-base md:text-lg">
            ตรวจเช็กสต็อกหน้าร้าน
          </h2>
        </div>
      </div>

      <ActualTargetCard
        iconColorClass="text-slate-600"
        badgeColorClass="bg-slate-200 text-slate-800"
        gridColsClass="grid-cols-1 sm:grid-cols-1"
        items={[{ label: "ร้านค้าตรวจเช็ก:", value: target.store }]}
      />

      {/* ITEMS LIST SECTION */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-slate-600" />
            รายการสินค้าที่ตรวจเช็ก ({items.length} รายการ){" "}
            <span className="text-rose-500">*</span>
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddItem}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 border-slate-300 hover:bg-slate-100 flex items-center gap-1 rounded-xl h-8 px-3 transition-all cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>เพิ่มสินค้า</span>
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => {
            const selectValue = DEMO_PRODUCTS.includes(item.productName)
              ? item.productName
              : item.isCustom ||
                  (item.productName !== "" &&
                    !DEMO_PRODUCTS.includes(item.productName))
                ? OTHER_OPTION
                : "";

            return (
              <div
                key={idx}
                className="p-3.5 md:p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative group transition-all hover:border-slate-300"
              >
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-white font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    สินค้าที่ {idx + 1}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                      title="ลบรายการนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Select Product */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      รายการสินค้า <span className="text-rose-500">*</span>
                    </label>
                    <Select
                      value={selectValue}
                      onValueChange={(val) => {
                        if (val === OTHER_OPTION) {
                          handleItemChange(idx, "isCustom", true);
                          if (DEMO_PRODUCTS.includes(item.productName)) {
                            handleItemChange(idx, "productName", "");
                          }
                        } else {
                          handleItemChange(idx, "isCustom", false);
                          handleItemChange(idx, "productName", val);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full bg-white border-slate-300 text-xs h-9">
                        <SelectValue placeholder="เลือกรายการสินค้า" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEMO_PRODUCTS.map((prod) => (
                          <SelectItem
                            key={prod}
                            value={prod}
                            className="text-xs"
                          >
                            {prod}
                          </SelectItem>
                        ))}
                        <SelectItem value={OTHER_OPTION} className="text-xs">
                          {OTHER_OPTION}
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {(item.isCustom || selectValue === OTHER_OPTION) && (
                      <div className="pt-1 animate-in fade-in-50 duration-200">
                        <Input
                          value={item.productName}
                          onChange={(e) =>
                            handleItemChange(idx, "productName", e.target.value)
                          }
                          placeholder="ระบุชื่อสินค้า เช่น ปุ๋ยสูตร 15-15-15"
                          className="bg-white border-slate-300 text-xs h-9"
                        />
                      </div>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      จำนวนคงเหลือ
                    </label>

                    <div className="relative">
                      <Input
                        value={item.remainingQty}
                        onChange={(e) =>
                          handleItemChange(idx, "remainingQty", e.target.value)
                        }
                        placeholder="ระบุจำนวนคงเหลือ"
                        className="bg-white border-slate-300 text-xs h-9 pr-12"
                      />

                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">
                        ลัง
                      </span>
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    หมายเหตุ
                  </label>
                  <Input
                    value={item.remarks}
                    onChange={(e) =>
                      handleItemChange(idx, "remarks", e.target.value)
                    }
                    placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)"
                    className="bg-white border-slate-300 text-xs h-9"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stock Status & Reorder Opportunity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-800">
            โอกาสการสั่งซื้อรอบใหม่ <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["สูง", "ยังไม่แน่ใจ", "ต่ำ"] as const).map((opp) => (
              <button
                key={opp}
                type="button"
                onClick={() => setReorderOpportunity(opp)}
                className={cn(
                  "py-2.5 px-1 rounded-xl border text-xs font-semibold cursor-pointer transition-all",
                  reorderOpportunity === opp
                    ? opp === "สูง"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20"
                      : opp === "ยังไม่แน่ใจ"
                        ? "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20"
                        : "bg-slate-100 border-slate-400 text-slate-800"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                )}
              >
                {opp}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-800">
          สิ่งที่ต้องดำเนินการต่อ <span className="text-rose-500">*</span>
        </label>
        <Textarea
          rows={2}
          value={nextAction}
          onChange={(e) => setNextAction(e.target.value)}
          placeholder="เช่น ออกใบเสนอราคาสินค้าเพิ่มสต็อก หรือประสานงานฝ่ายจัดส่ง"
          className="bg-white border-slate-300"
        />
      </div>
    </div>
  );
}
