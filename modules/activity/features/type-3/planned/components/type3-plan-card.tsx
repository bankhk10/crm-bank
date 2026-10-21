"use client";

import React from "react";
import { ShoppingCart, Store, Package, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  Type3PlanCardProps,
  Type3PlanCardTarget,
  Type3PlanCardTargetItem,
} from "../types/planned.types";

export type {
  Type3PlanCardProps,
  Type3PlanCardTarget,
  Type3PlanCardTargetItem,
};

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

  const totalQty = productItems.reduce(
    (sum, p) =>
      sum +
      (Number(p.quantity ?? p.targetQuantity ?? p.qty ?? p.targetQty) || 0),
    0,
  );

  const totalAmount = productItems.reduce((sum, p) => {
    const q =
      Number(p.quantity ?? p.targetQuantity ?? p.qty ?? p.targetQty) || 0;
    const u = Number(p.unitPrice ?? p.price) || 0;
    const s = Number(p.targetSales ?? p.price);
    return sum + (!isNaN(s) && s > 0 ? s : q * u);
  }, 0);

  return (
    <div
      className={cn(
        "border border-emerald-200/90 rounded-2xl p-4 sm:p-5 bg-white space-y-4 shadow-2xs hover:shadow-xs transition-shadow",
        className,
      )}
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-sm sm:text-base">
                {isSubDealer && subDealerStoreName
                  ? subDealerStoreName
                  : dealerName}
              </span>
              {isSubDealer ? (
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-semibold px-2 py-0.5"
                >
                  Subdealer
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold px-2 py-0.5"
                >
                  Dealer
                </Badge>
              )}
            </div>
            {isSubDealer && dealerName && (
              <p className="text-xs text-slate-500 font-medium">
                Dealer ต้นสังกัด: {dealerName}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
            {productItems.length} รายการสินค้า
          </span>
        </div>
      </div>

      {/* Product List */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5 text-emerald-600" />
          สินค้าเป้าหมายที่เสนอขาย
        </label>

        {productItems.length === 0 ? (
          <div className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-lg">
            ไม่ได้ระบุรายการสินค้า
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {productItems.map((prod, idx) => {
              const pQty = Number(
                prod.quantity ??
                  prod.targetQuantity ??
                  prod.qty ??
                  prod.targetQty ??
                  0,
              );
              const pUnit = Number(prod.unitPrice ?? prod.price ?? 0);
              const pTotal = Number(prod.targetSales ?? prod.price);
              const lineSales =
                !isNaN(pTotal) && pTotal > 0 ? pTotal : pQty * pUnit;

              return (
                <div
                  key={prod.id || `type3-item-${idx}`}
                  className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span className="truncate">
                      {prod.productName || "สินค้า"}
                    </span>
                    <span className="text-emerald-700 font-bold shrink-0 ml-2">
                      {pQty.toLocaleString()} {prod.unit || "หน่วย"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span>
                      ราคา:{" "}
                      {pUnit > 0 ? `฿${pUnit.toLocaleString()}` : "ราคามาตรฐาน"}
                    </span>
                    <span className="font-semibold text-slate-700">
                      รวม: ฿
                      {lineSales.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {(prod.notes || prod.detail) && (
                    <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 truncate">
                      หมายเหตุ: {prod.notes || prod.detail}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notes if present at target level */}
      {target.detail && (
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70 text-xs">
          <span className="text-slate-400 font-medium block">
            เงื่อนไข / ข้อตกลงเพิ่มเติม:
          </span>
          <p className="text-slate-700 font-normal whitespace-pre-wrap">
            {target.detail}
          </p>
        </div>
      )}

      {/* Target Summary Footer */}
      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 text-xs sm:text-sm">
        <span className="text-slate-600">
          จำนวนเป้าหมายรวม:{" "}
          <strong className="text-slate-900 font-bold">
            {totalQty.toLocaleString()} หน่วย
          </strong>
        </span>
        <span className="text-emerald-900 font-extrabold flex items-center gap-1 text-sm sm:text-base">
          <DollarSign className="w-4 h-4 text-emerald-600" />
          เป้าหมายยอดเงิน: ฿
          {totalAmount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>
    </div>
  );
}
