"use client";

import React from "react";
import { ShoppingBag, Package, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface Type3PlanCardTargetItem {
  id?: string;
  productId?: string;
  productName: string;
  quantity?: number | string;
  targetQuantity?: number | string;
  qty?: number | string;
  unitPrice?: number | string;
  price?: number | string;
  targetSales?: number | string;
  masterPrice?: number | null;
  customer?: string;
  storeId?: string;
  detail?: string;
  notes?: string;
  unit?: string;
  isSubDealer?: boolean;
  subDealerStore?: string;
  dealerName?: string;
  isAdditional?: boolean;
}

export interface Type3PlanCardTarget {
  product?: string;
  customer?: string;
  targetQty?: number | string;
  quantity?: number | string;
  unitPrice?: number | string;
  targetSales?: number | string;
  detail?: string;
  isSubDealer?: boolean;
  subDealerStore?: string;
  dealerName?: string;
  items?: Type3PlanCardTargetItem[];
}

export interface Type3PlanCardProps {
  planType?: string;
  target?: Type3PlanCardTarget | null;
  className?: string;
}

export function Type3PlanCard({
  planType,
  target,
  className,
}: Type3PlanCardProps) {
  if (planType === "UNPLANNED" || !target) return null;

  // Normalize product items (supports multi-product or fallback to single legacy product)
  const productItems: Type3PlanCardTargetItem[] =
    target.items && target.items.length > 0
      ? target.items
      : target.product
        ? [
            {
              id: "p-0",
              productName: target.product,
              qty: target.targetQty ?? target.quantity,
              unitPrice: target.unitPrice,
              targetSales: target.targetSales,
              detail: target.detail,
              customer: target.customer,
              isSubDealer: target.isSubDealer,
              subDealerStore: target.subDealerStore,
              dealerName: target.dealerName,
            },
          ]
        : [];

  const isSubDealer = Boolean(
    target.isSubDealer ||
      target.subDealerStore ||
      productItems[0]?.isSubDealer ||
      productItems[0]?.subDealerStore,
  );

  const subDealerStoreName =
    target.subDealerStore || productItems[0]?.subDealerStore || "";
  const dealerName =
    target.dealerName ||
    target.customer ||
    productItems[0]?.dealerName ||
    productItems[0]?.customer ||
    "-";

  // Check if detail is duplicate with single item notes
  const isDetailDuplicate =
    productItems.length === 1 &&
    Boolean(target.detail) &&
    (productItems[0].detail === target.detail ||
      productItems[0].notes === target.detail);

  // Total target qty sum if calculable
  const totalTargetQty = productItems.reduce((sum, item) => {
    const rawVal = item.qty ?? item.quantity ?? item.targetQuantity ?? "";
    const num = Number(String(rawVal).replace(/[^0-9.-]+/g, ""));
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  return (
    <div
      className={cn(
        "bg-white border border-indigo-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs",
        className,
      )}
    >
      {/* ───────────────────────────────────────────────────────────── */}
      {/* HEADER: Item Title & Plan Badge */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-extrabold shrink-0">
            1
          </span>
          <h4 className="font-bold text-indigo-950 text-sm sm:text-base">
            รายการเสนอขายสินค้า
          </h4>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            ข้อมูลตามแผนงาน (PLAN)
          </span>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION: วัตถุประสงค์ & ข้อมูลลูกค้า / ร้านค้า */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
          {/* วัตถุประสงค์ของประเภทงาน */}
          <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/70 space-y-1">
            <span className="text-slate-400 font-medium block text-[11px]">
              วัตถุประสงค์ของประเภทงาน
            </span>
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs sm:text-sm">
              <ShoppingBag className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>เสนอขายสินค้า</span>
            </div>
          </div>

          {/* ประเภทลูกค้า & ร้านค้า */}
          {isSubDealer ? (
            <>
              {/* ร้านค้าย่อย (Subdealer) */}
              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/70 space-y-1">
                <span className="text-slate-400 font-medium block text-[11px]">
                  ร้านค้าย่อย (Subdealer)
                </span>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] font-bold shrink-0"
                  >
                    Subdealer
                  </Badge>
                  <span
                    className="font-bold text-slate-800 text-xs sm:text-sm truncate"
                    title={subDealerStoreName}
                  >
                    {subDealerStoreName || "-"}
                  </span>
                </div>
              </div>

              {/* ตัวแทนจำหน่ายหลัก (Dealer) */}
              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/70 space-y-1">
                <span className="text-slate-400 font-medium block text-[11px]">
                  ตัวแทนจำหน่ายหลัก (Dealer)
                </span>
                <span
                  className="font-bold text-slate-800 text-xs sm:text-sm block truncate"
                  title={dealerName}
                >
                  {dealerName}
                </span>
              </div>
            </>
          ) : (
            <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/70 space-y-1">
              <span className="text-slate-400 font-medium block text-[11px]">
                ตัวแทนจำหน่าย / ร้านค้า (Dealer)
              </span>
              <div className="flex items-center gap-1.5">
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-800 border-blue-300 text-[10px] font-bold shrink-0"
                >
                  Dealer
                </Badge>
                <span
                  className="font-bold text-slate-800 text-xs sm:text-sm truncate"
                  title={dealerName}
                >
                  {dealerName}
                </span>
              </div>
            </div>
          )}

          {/* เป้ายอดขายรวม (ถ้ามี) */}
          {target.targetSales ? (
            <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/70 space-y-1">
              <span className="text-slate-400 font-medium block text-[11px]">
                เป้ายอดขายรวม
              </span>
              <div className="flex items-center gap-1.5 font-bold text-indigo-900 text-xs sm:text-sm">
                <DollarSign className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>
                  {typeof target.targetSales === "number"
                    ? `${target.targetSales.toLocaleString()} บาท`
                    : target.targetSales.includes("บาท") || target.targetSales.includes("฿")
                      ? target.targetSales
                      : `${target.targetSales} บาท`}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION: รายการสินค้าที่จะเสนอขาย */}
      {/* ───────────────────────────────────────────────────────────── */}
      {productItems.length > 0 && (
        <div className="border border-slate-200/90 rounded-xl p-3.5 sm:p-4 bg-slate-50/40 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-indigo-600" />
              รายการสินค้าที่จะเสนอขาย
            </span>
            <div className="flex items-center gap-2">
              {totalTargetQty > 0 && (
                <span className="text-[11px] font-medium text-slate-600">
                  รวม {totalTargetQty.toLocaleString()} หน่วย
                </span>
              )}
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md">
                {productItems.length} รายการ
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {productItems.map((item, idx) => {
              const itemQty =
                item.qty ?? item.quantity ?? item.targetQuantity ?? item.targetQty;
              const itemNotes = item.detail || item.notes;
              const formattedQty =
                itemQty !== undefined && itemQty !== ""
                  ? String(itemQty).includes("หน่วย") ||
                    String(itemQty).includes("ขวด") ||
                    String(itemQty).includes("กล่อง") ||
                    String(itemQty).includes("ถุง") ||
                    String(itemQty).includes("ลัง")
                    ? String(itemQty)
                    : `${itemQty} ${item.unit || "หน่วย"}`
                  : "-";

              return (
                <div
                  key={item.id || idx}
                  className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-2"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 text-xs">
                    {/* ชื่อสินค้า */}
                    <div className="space-y-1 sm:col-span-1 md:col-span-1 lg:col-span-1">
                      <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {idx + 1}
                        </span>
                        สินค้า
                      </span>
                      <div
                        className="bg-slate-50/80 px-3 py-2 rounded-lg border border-slate-200/70 text-xs font-bold text-slate-800 truncate"
                        title={item.productName}
                      >
                        {item.productName || "ไม่ระบุสินค้า"}
                      </div>
                    </div>

                    {/* เป้าจำนวน */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-medium text-slate-400 block">
                        เป้าหมายจำนวน
                      </span>
                      <div className="bg-slate-50/80 px-3 py-2 rounded-lg border border-slate-200/70 text-xs font-bold text-indigo-950 flex items-center">
                        {formattedQty}
                      </div>
                    </div>

                    {/* ราคา/หน่วย หรือ ยอดเป้าหมาย (ถ้ามี) */}
                    {(item.unitPrice || item.price || item.targetSales) && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-medium text-slate-400 block">
                          {item.unitPrice ? "ราคา / หน่วย" : "เป้ายอดขาย"}
                        </span>
                        <div className="bg-slate-50/80 px-3 py-2 rounded-lg border border-slate-200/70 text-xs font-semibold text-slate-700 flex items-center">
                          {item.unitPrice || item.price || item.targetSales}
                        </div>
                      </div>
                    )}

                    {/* รายละเอียดของสินค้า */}
                    <div
                      className={cn(
                        "space-y-1",
                        !(item.unitPrice || item.price || item.targetSales) &&
                          "sm:col-span-2 md:col-span-1 lg:col-span-2",
                      )}
                    >
                      <span className="text-[11px] font-medium text-slate-400 block">
                        รายละเอียด / ข้อเสนอ
                      </span>
                      <div className="bg-slate-50/80 px-3 py-2 rounded-lg border border-slate-200/70 text-xs text-slate-700 min-h-[36px] flex items-center whitespace-pre-wrap">
                        {itemNotes || "-"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION: รายละเอียดเพิ่มเติม (ภาพรวมแผนงาน) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {target.detail && !isDetailDuplicate && (
        <div className="space-y-1.5 text-xs">
          <span className="text-slate-500 font-semibold block text-[11px]">
            รายละเอียดเพิ่มเติม (ภาพรวมแผนงาน)
          </span>
          <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 text-slate-700 whitespace-pre-wrap">
            {target.detail}
          </div>
        </div>
      )}
    </div>
  );
}
