"use client";

import React, { useMemo } from "react";
import {
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  Package,
  Sparkles,
  Layers,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Type3PlanCard } from "./type3-plan-card";
import { SALE_STATUS_CONFIG, type SaleStatus } from "../../shared/constants";
import type {
  Type3DetailViewProps,
  Type3ProductSaleDetail,
} from "../types/actual.types";
import type {
  Type3TargetItem,
  TargetProductItem,
} from "../types/planned.types";

export type { Type3DetailViewProps };

export function Type3DetailView({
  isVisible,
  target,
  targets,
  soldProducts,
  actualSales,
  actualQuantity,
  unclosedReason,
  productSalesDetails = [],
}: Type3DetailViewProps) {
  if (!isVisible) return null;

  const effectiveTargets = useMemo(() => {
    return targets && targets.length > 0 ? targets : target ? [target] : [];
  }, [targets, target]);

  const primaryTarget: Type3TargetItem = effectiveTargets[0] || {
    customer: "",
    detail: "",
    items: [],
  };

  // Planned items from plan target (or single target fallback)
  const plannedItems: TargetProductItem[] = useMemo(() => {
    return effectiveTargets.flatMap((t) =>
      t.items && t.items.length > 0
        ? t.items
        : t.product
          ? [
              {
                id: t.id || "planned-single",
                productName: t.product,
                customer: t.customer,
                isSubDealer: t.isSubDealer,
                subDealerStore: t.subDealerStore,
                dealerName: t.dealerName,
                qty: t.targetQty,
                unitPrice: t.unitPrice,
                detail: t.detail,
                isAdditional: false,
              },
            ]
          : [],
    );
  }, [effectiveTargets]);

  // Combine planned items and actual outcome
  const allOutcomeItems = useMemo(() => {
    if (productSalesDetails && productSalesDetails.length > 0) {
      return productSalesDetails;
    }

    // Fallback if details not available but planned items exist
    return plannedItems.map((p) => ({
      id: p.id,
      productId: p.productId,
      productName: p.productName,
      customer: p.customer,
      storeId: p.storeId,
      qty: p.qty,
      unitPrice: p.unitPrice,
      actualQty: p.actualQty || actualQuantity || 0,
      actualSales: p.actualSales || actualSales || 0,
      unclosedReason: p.unclosedReason || unclosedReason || "",
      isAdditional: false,
    }));
  }, [productSalesDetails, plannedItems, actualQuantity, actualSales, unclosedReason]);

  const totalActualQty = allOutcomeItems.reduce(
    (sum, item) => sum + (Number(item.actualQty) || 0),
    0,
  );
  const totalActualSales = allOutcomeItems.reduce(
    (sum, item) => sum + (Number(item.actualSales) || 0),
    0,
  );

  return (
    <div className="border border-emerald-200/80 rounded-2xl p-4 sm:p-5 bg-white space-y-4 shadow-2xs">
      {/* 1. Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-emerald-950 text-sm sm:text-base">
              เสนอขายสินค้า (Product Sales Proposal)
            </h4>
            <p className="text-xs text-slate-500">
              รายละเอียดเป้าหมายและผลการปฏิบัติงานจริงของการเสนอขายสินค้า
            </p>
          </div>
        </div>

        {effectiveTargets.length > 1 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Layers className="w-3.5 h-3.5" />
            ทั้งหมด {effectiveTargets.length} ร้านค้า
          </span>
        )}
      </div>

      {/* 2. Target Plan Cards */}
      <div className="space-y-3">
        {effectiveTargets.map((t, idx) => (
          <Type3PlanCard
            key={t.id || `type3-detail-target-${idx}`}
            target={t}
          />
        ))}
      </div>

      {/* 3. Actual Sales Outcome Section */}
      {allOutcomeItems.length > 0 && (
        <div className="border border-emerald-200/90 rounded-xl p-3.5 sm:p-4 bg-emerald-50/20 space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-200/70 pb-2">
            <span className="text-xs sm:text-sm font-bold text-emerald-950 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-emerald-600" />
              ผลการเสนอขายสินค้าจริง (Actual Outcome)
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              {allOutcomeItems.length} รายการ
            </span>
          </div>

          <div className="space-y-3">
            {allOutcomeItems.map((item, idx) => {
              const targetQty = Number(item.qty || 0);
              const actualQty = Number(item.actualQty ?? 0);
              const actualTotal = Number(item.actualSales ?? 0);

              let status: SaleStatus = "ปิดการขายได้ทั้งหมด";
              if (actualQty === 0) {
                status = "ปิดการขายไม่ได้";
              } else if (targetQty > 0 && actualQty < targetQty) {
                status = "ปิดการขายได้บางส่วน";
              }

              const config = SALE_STATUS_CONFIG[status];

              return (
                <div
                  key={item.id || idx}
                  className="bg-white p-3.5 sm:p-4 rounded-xl border border-emerald-200/70 shadow-2xs space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-800 text-xs sm:text-sm">
                        {item.productName}
                      </span>
                      {item.customer && (
                        <span className="text-xs text-slate-500">
                          ({item.customer})
                        </span>
                      )}
                      {item.isAdditional && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1 px-1.5 py-0.5"
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          เพิ่มเติม
                        </Badge>
                      )}
                    </div>

                    <Badge
                      variant="outline"
                      className={`text-xs font-bold px-2.5 py-1 ${config.badgeClass}`}
                    >
                      {status === "ปิดการขายได้ทั้งหมด" ? (
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 mr-1" />
                      )}
                      {config.label}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {targetQty > 0 && (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70 space-y-0.5">
                        <span className="text-slate-400 font-medium block">
                          เป้าหมายตามแผน
                        </span>
                        <strong className="text-slate-700 text-sm">
                          {targetQty.toLocaleString()} หน่วย
                        </strong>
                      </div>
                    )}

                    <div className="bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-200/70 space-y-0.5">
                      <span className="text-emerald-700 font-medium block">
                        จำนวนที่ขายได้จริง
                      </span>
                      <strong className="text-emerald-950 text-sm font-extrabold">
                        {actualQty.toLocaleString()} หน่วย
                      </strong>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70 space-y-0.5">
                      <span className="text-slate-400 font-medium block">
                        ราคาต่อหน่วย
                      </span>
                      <strong className="text-slate-700 text-sm">
                        {Number(item.unitPrice) > 0
                          ? `฿${Number(item.unitPrice).toLocaleString()}`
                          : "ราคามาตรฐาน"}
                      </strong>
                    </div>

                    <div className="bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-200/70 space-y-0.5">
                      <span className="text-emerald-700 font-medium block">
                        ยอดขายจริงที่ปิดได้
                      </span>
                      <strong className="text-emerald-900 text-sm font-extrabold">
                        ฿{actualTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>

                  {item.unclosedReason && (
                    <div className="bg-rose-50/70 border border-rose-200 rounded-lg p-2.5 space-y-0.5">
                      <span className="text-rose-600 font-bold flex items-center gap-1 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        เหตุผลที่ไม่สามารถปิดการขายได้ / ปิดได้ไม่ครบตามเป้า
                      </span>
                      <p className="text-rose-900 font-medium text-xs block whitespace-pre-wrap">
                        {item.unclosedReason}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Outcome Summary Footer */}
          <div className="bg-white border border-emerald-200/80 rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm shadow-2xs">
            <span className="text-slate-600 font-medium flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              รวมผลการขายได้จริง: <strong className="text-slate-900 font-bold ml-1">{totalActualQty.toLocaleString()} หน่วย</strong>
            </span>
            <span className="text-emerald-900 font-extrabold flex items-center gap-1 text-sm sm:text-base">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              ยอดเงินขายได้จริงรวม: ฿{totalActualSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export const DetailType3Sales = Type3DetailView;
