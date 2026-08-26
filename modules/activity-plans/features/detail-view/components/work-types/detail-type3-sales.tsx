"use client";

import React from "react";
import { ShoppingBag, AlertTriangle } from "lucide-react";
import { ActualTargetCard } from "@/modules/activity-plans/features/actual-view/components/actual-target-card";

export interface TargetProductItem {
  productName: string;
  customer?: string;
  qty: string;
  unitPrice?: string;
  detail?: string;
  unit?: string;
  price?: string;
  targetSales?: string;
  actualQty?: string;
  actualSales?: string;
  unclosedReason?: string;
}

interface DetailType3SalesProps {
  isVisible: boolean;
  target: {
    product: string;
    customer: string;
    targetQty: string;
    targetSales: string;
    unitPrice?: string;
    detail?: string;
    items?: TargetProductItem[];
  };
  soldProducts?: string;
  actualSales?: string;
  actualQuantity?: string;
  unclosedReason?: string;
}

export function DetailType3Sales({
  isVisible,
  target,
  soldProducts,
  actualSales,
  actualQuantity,
  unclosedReason,
}: DetailType3SalesProps) {
  if (!isVisible) return null;

  const hasMultipleProducts = target.items && target.items.length > 0;

  const totalTargetSalesSum = hasMultipleProducts
    ? target.items!.reduce((sum, i) => sum + (Number(i.targetSales?.replace(/,/g, "")) || 0), 0)
    : Number(target.targetSales?.replace(/,/g, "")) || 0;

  const totalActualSalesSum = hasMultipleProducts
    ? target.items!.reduce((sum, i) => sum + (Number(i.actualSales?.replace(/,/g, "")) || 0), 0)
    : Number(actualSales?.replace(/,/g, "")) || 0;

  return (
    <div className="border border-blue-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-blue-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-blue-900 text-base md:text-lg">
            เสนอขายสินค้า
          </h2>
        </div>
        {hasMultipleProducts && (
          <span className="text-xs bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
            เป้าหมาย {target.items!.length} รายการ
          </span>
        )}
      </div>

      {/* PLANNED TARGET CARD */}
      {!hasMultipleProducts && (
        <ActualTargetCard
          iconColorClass="text-blue-600"
          badgeColorClass="bg-blue-50 text-blue-700 border border-blue-200"
          gridColsClass="grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
          items={[
            { label: "สินค้าเป้าหมาย:", value: target.product || "-" },
            { label: "ลูกค้าเป้าหมาย:", value: target.customer || "-" },
            { label: "เป้าหมายจำนวน:", value: target.targetQty || "-" },
            {
              label: "เป้ายอดขาย:",
              value: target.targetSales ? `฿${target.targetSales}` : "-",
              highlight: true,
            },
          ]}
        />
      )}

      {/* MULTI PRODUCTS TABLE OR SINGLE READ-ONLY FORM */}
      {hasMultipleProducts ? (
        <div className="space-y-3">
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 text-center w-10">ลำดับ</th>
                  <th className="py-2.5 px-3">สินค้า</th>
                  <th className="py-2.5 px-3">ลูกค้าเป้าหมาย</th>
                  <th className="py-2.5 px-3 text-center">เป้าจำนวน</th>
                  <th className="py-2.5 px-3 text-right">เป้ายอดขาย</th>
                  <th className="py-2.5 px-3 text-center bg-blue-50/50">ขายได้จริง (จำนวน)</th>
                  <th className="py-2.5 px-3 text-right bg-blue-50/50">ยอดขายจริง (บาท)</th>
                  <th className="py-2.5 px-3">เหตุผลที่ไม่สามารถปิดการขาย</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {target.items!.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/40">
                    <td className="py-2.5 px-3 text-center text-slate-500 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {item.productName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {item.customer || target.customer || "-"}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-700 font-medium">
                      {item.qty || "-"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {item.targetSales ? `฿${item.targetSales}` : "-"}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-blue-700 bg-blue-50/30">
                      {item.actualQty || "-"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-blue-800 bg-blue-50/30">
                      {item.actualSales
                        ? `฿${Number(item.actualSales).toLocaleString()}`
                        : "-"}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 italic">
                      {item.unclosedReason || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50/80 border-t border-slate-200 text-xs font-bold">
                <tr>
                  <td colSpan={4} className="py-2.5 px-3 text-right text-slate-600">
                    รวมทั้งสิ้น:
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-900 font-bold">
                    ฿{totalTargetSalesSum.toLocaleString()}
                  </td>
                  <td></td>
                  <td className="py-2.5 px-3 text-right text-blue-800 font-black">
                    ฿{totalActualSalesSum.toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-3 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>ผลการปฏิบัติงานจริง</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
              <span className="text-xs text-slate-500 font-medium block">
                สินค้าที่ปิดการขายได้
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
                {soldProducts || target.product || "-"}
              </span>
            </div>

            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
              <span className="text-xs text-slate-500 font-medium block">
                จำนวนที่ขายได้จริง
              </span>
              <span className="text-xs sm:text-sm font-bold text-blue-700 block">
                {actualQuantity || "-"}
              </span>
            </div>

            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5 space-y-1">
              <span className="text-xs text-blue-600 font-medium block">
                ยอดขายที่ทำได้จริง (บาท)
              </span>
              <span className="text-sm sm:text-base font-extrabold text-blue-900 block">
                {actualSales ? `฿${Number(actualSales).toLocaleString()}` : "-"}
              </span>
            </div>

            {unclosedReason && (
              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-1 sm:col-span-2 md:col-span-3">
                <span className="text-xs text-amber-700 font-medium block flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  เหตุผลที่ไม่สามารถปิดการขายได้
                </span>
                <p className="text-xs sm:text-sm text-amber-900 font-semibold whitespace-pre-wrap leading-relaxed">
                  {unclosedReason}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
