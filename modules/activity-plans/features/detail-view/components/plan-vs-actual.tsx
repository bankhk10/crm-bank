"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ActivityPlanWithRelations } from "../../../types";

interface PlanVsActualProps {
  plan: ActivityPlanWithRelations;
}

export function PlanVsActual({ plan }: PlanVsActualProps) {
  const router = useRouter();
  const result = plan.result;

  if (!result) return null;

  const salesPromoVal = plan.salesPromotionBudgetRequested
    ? Number(plan.salesPromotionBudgetRequested)
    : 0;
  const marketingVal = plan.marketingBudgetRequested
    ? Number(plan.marketingBudgetRequested)
    : 0;
  const budgetTotal = salesPromoVal + marketingVal;

  const actualTotal = result.actualTotalSpent
    ? Number(result.actualTotalSpent)
    : 0;
  const plannedSales =
    (plan.items as any[])?.reduce(
      (s: number, i: any) => s + Number(i.saleTotalPrice || 0),
      0,
    ) || 0;
  const actualSales = result.salesResultAmount
    ? Number(result.salesResultAmount)
    : 0;
  const plannedCollect =
    (plan.items as any[])?.reduce(
      (s: number, i: any) => s + Number(i.collectAmount || 0),
      0,
    ) || 0;
  const actualCollect = result.collectResultAmount
    ? Number(result.collectResultAmount)
    : 0;

  const metrics = [
    {
      label: "งบประมาณ",
      plan: budgetTotal,
      actual: actualTotal,
      unit: "฿",
      inverse: true,
    },
    ...(plannedSales > 0 || actualSales > 0
      ? [
          {
            label: "ยอดขาย",
            plan: plannedSales,
            actual: actualSales,
            unit: "฿",
            inverse: false,
          },
        ]
      : []),
    ...(plannedCollect > 0 || actualCollect > 0
      ? [
          {
            label: "เก็บเงิน",
            plan: plannedCollect,
            actual: actualCollect,
            unit: "฿",
            inverse: false,
          },
        ]
      : []),
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
      {/* Banner */}
      <div className="px-5 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-bold text-emerald-800">
            บันทึกผลสำเร็จแล้ว
          </span>
          {result.resultStatus && (
            <Badge
              variant="outline"
              className={cn(
                "text-[11px] font-semibold",
                result.resultStatus === "COMPLETED" &&
                  "bg-green-100 text-green-800 border-green-200",
                result.resultStatus === "PARTIAL" &&
                  "bg-amber-100 text-amber-800 border-amber-200",
                result.resultStatus === "POSTPONED" &&
                  "bg-blue-100 text-blue-800 border-blue-200",
                result.resultStatus === "CANCELLED" &&
                  "bg-red-100 text-red-800 border-red-200",
              )}
            >
              {result.resultStatus === "COMPLETED"
                ? "สำเร็จ"
                : result.resultStatus === "PARTIAL"
                  ? "สำเร็จบางส่วน"
                  : result.resultStatus === "POSTPONED"
                    ? "เลื่อนกิจกรรม"
                    : "ยกเลิกกิจกรรม"}
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push(`/activity-plans/${plan.id}/actual`)}
          className="bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-300 text-xs font-bold shrink-0 h-8"
        >
          ดูรายละเอียดผลจริง
          <ChevronRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>

      {/* Comparison Table */}
      {metrics.length > 0 && (
        <div className="p-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 text-slate-500 font-semibold">
                  Metric
                </th>
                <th className="text-right py-2 text-slate-500 font-semibold">
                  Plan
                </th>
                <th className="text-right py-2 text-slate-500 font-semibold">
                  Actual
                </th>
                <th className="text-right py-2 text-slate-500 font-semibold">
                  Variance
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => {
                const variance = m.actual - m.plan;
                const isGood = m.inverse ? variance <= 0 : variance >= 0;
                return (
                  <tr
                    key={m.label}
                    className="border-b border-slate-50 last:border-0"
                  >
                    <td className="py-2.5 font-semibold text-slate-800">
                      {m.label}
                    </td>
                    <td className="py-2.5 text-right text-slate-600">
                      {m.plan > 0 ? `${m.unit}${m.plan.toLocaleString()}` : "-"}
                    </td>
                    <td className="py-2.5 text-right font-bold text-slate-900">
                      {m.actual > 0
                        ? `${m.unit}${m.actual.toLocaleString()}`
                        : "-"}
                    </td>
                    <td
                      className={cn(
                        "py-2.5 text-right font-bold",
                        m.plan === 0 && m.actual === 0
                          ? "text-slate-400"
                          : isGood
                            ? "text-emerald-600"
                            : "text-red-600",
                      )}
                    >
                      {m.plan === 0 && m.actual === 0 ? (
                        "-"
                      ) : (
                        <>
                          {variance > 0 ? "+" : ""}
                          {m.unit}
                          {variance.toLocaleString()}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
