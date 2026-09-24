"use client";

import React from "react";
import { Package, ChevronRight, Tag, Boxes } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MarketingProductDetail, RequisitionDetail } from "../types";

interface MaterialsSectionProps {
  marketingProducts: MarketingProductDetail[];
  requisitions: RequisitionDetail[];
}

export function MaterialsSection({
  marketingProducts,
  requisitions,
}: MaterialsSectionProps) {
  if (marketingProducts.length === 0 && requisitions.length === 0) return null;

  return (
    <details className="bg-white rounded-xl border border-slate-200/80 overflow-hidden group">
      <summary className="px-4 py-3 cursor-pointer flex items-center justify-between hover:bg-slate-50/50 transition-colors">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5 text-teal-500" />
          สื่อส่งเสริมการขาย / ขอเบิกสินค้า
        </h3>
        <ChevronRight className="h-4 w-4 text-slate-400 group-open:rotate-90 transition-transform" />
      </summary>
      <div className="border-t border-slate-100 p-4 space-y-4">
        {/* Marketing Products */}
        {marketingProducts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 uppercase tracking-wider">
              <Tag className="h-3 w-3 text-teal-500" />
              สื่อส่งเสริมการขาย ({marketingProducts.length} รายการ)
            </h4>
            <div className="divide-y border rounded-lg overflow-hidden text-xs">
              {marketingProducts.map((m, idx) => (
                <div
                  key={idx}
                  className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <span>
                        {idx + 1}. {m.productName}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[9px] bg-teal-50 text-teal-700 border-teal-200"
                      >
                        {m.category}
                      </Badge>
                    </div>
                    <div className="text-slate-500 pl-4">
                      {m.quantity} {m.unit}
                      {m.pricePerUnit > 0 &&
                        ` @ ฿${m.pricePerUnit.toLocaleString()}/${m.unit}`}
                    </div>
                  </div>
                  {m.totalAmount > 0 && (
                    <div className="text-sm font-bold text-teal-700 sm:text-right shrink-0">
                      ฿{m.totalAmount.toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Requisitions */}
        {requisitions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 uppercase tracking-wider">
              <Boxes className="h-3 w-3 text-blue-500" />
              ขอเบิกสินค้า/อุปกรณ์ ({requisitions.length} รายการ)
            </h4>
            <div className="divide-y border rounded-lg overflow-hidden text-xs">
              {requisitions.map((r, idx) => (
                <div
                  key={idx}
                  className="p-2.5 flex items-center justify-between"
                >
                  <span className="font-medium text-slate-800">
                    {idx + 1}. {r.productName}
                  </span>
                  {r.quantity > 0 && (
                    <span className="text-slate-500">
                      {r.quantity} {r.unit}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </details>
  );
}
