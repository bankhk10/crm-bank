"use client";

import React from "react";
import { DollarSign, ShieldCheck, Gift, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ActivityPlanWithRelations } from "../../../types";
import type { SalesPromotionDetail } from "../types";

interface BudgetSummaryProps {
  plan: ActivityPlanWithRelations;
  salesPromotions: SalesPromotionDetail[];
}

export function BudgetSummary({ plan, salesPromotions }: BudgetSummaryProps) {
  const salesPromoVal = plan.salesPromotionBudgetRequested
    ? Number(plan.salesPromotionBudgetRequested)
    : 0;
  const marketingVal = plan.marketingBudgetRequested
    ? Number(plan.marketingBudgetRequested)
    : 0;
  const budgetTotal = salesPromoVal + marketingVal;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
          งบประมาณ
        </h3>
        <span className="text-sm font-extrabold text-slate-900">
          {budgetTotal > 0 ? `${budgetTotal.toLocaleString()} ฿` : "ไม่มีงบ"}
        </span>
      </div>

      {budgetTotal === 0 ? (
        <p className="text-xs text-slate-400 italic p-4">
          ไม่มีความจำเป็นต้องใช้วงเงินงบประมาณในกิจกรรมนี้
        </p>
      ) : (
        <div className="p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Sales Promo */}
            <div
              className={cn(
                "p-3 rounded-lg border flex justify-between items-center",
                salesPromoVal > 0
                  ? "bg-blue-50/30 border-blue-100"
                  : "bg-slate-50/30 border-slate-100",
              )}
            >
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">
                  Sales Promotion
                </span>
                <span className="text-sm font-extrabold text-slate-900 block">
                  {salesPromoVal.toLocaleString()} ฿
                </span>
              </div>
              {salesPromoVal > 0 && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-semibold",
                    plan.salesPromotionApproved
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200",
                  )}
                >
                  {plan.salesPromotionApproved ? "อนุมัติ" : "รออนุมัติ"}
                </Badge>
              )}
            </div>

            {/* Marketing */}
            <div
              className={cn(
                "p-3 rounded-lg border flex justify-between items-center",
                marketingVal > 0
                  ? "bg-purple-50/30 border-purple-100"
                  : "bg-slate-50/30 border-slate-100",
              )}
            >
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">
                  Marketing
                </span>
                <span className="text-sm font-extrabold text-purple-900 block">
                  {marketingVal.toLocaleString()} ฿
                </span>
              </div>
              {marketingVal > 0 && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-semibold",
                    plan.marketingApproved
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200",
                  )}
                >
                  {plan.marketingApproved ? "อนุมัติ" : "รออนุมัติ"}
                </Badge>
              )}
            </div>

            {/* Budget overall status */}
            {plan.status === "PENDING_BUDGET_APPROVAL" && (
              <div className="sm:col-span-2 bg-blue-50/60 p-2.5 rounded-lg border border-blue-100 flex items-center gap-2 text-xs text-blue-800">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                <span>
                  {plan.salesManagerApproved
                    ? "ผ่านการอนุมัติงบภาพรวมจากฝ่ายขายแล้ว"
                    : "รอผู้จัดการฝ่ายขายอนุมัติงบประมาณภาพรวม"}
                </span>
              </div>
            )}
          </div>

          {/* Sales Promotion Items */}
          {salesPromotions.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-xs font-bold text-slate-600 flex items-center gap-1.5 py-1 hover:text-slate-900">
                <Gift className="h-3 w-3 text-blue-500" />
                รายการงบ SP ({salesPromotions.length} รายการ)
                <ChevronRight className="h-3 w-3 text-slate-400 group-open:rotate-90 transition-transform" />
              </summary>
              <div className="divide-y border rounded-lg overflow-hidden mt-2 text-xs">
                {salesPromotions.map((sp, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 flex items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <span className="font-semibold text-slate-800 block truncate">
                        {idx + 1}. {sp.detail}
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        {sp.budgetType}
                      </span>
                    </div>
                    {sp.amount > 0 && (
                      <span className="font-bold text-blue-700 shrink-0">
                        ฿{sp.amount.toLocaleString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
