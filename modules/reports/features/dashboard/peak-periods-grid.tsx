"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface PeakPeriodsGridProps {
  peakPeriods: {
    productId: string;
    productName: string;
    peakMonth: string;
    peakSales: number;
  }[];
  formatTHB: (amount: number) => string;
}

export function PeakPeriodsGrid({
  peakPeriods,
  formatTHB,
}: PeakPeriodsGridProps) {
  return (
    <Card className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-500" />
          ช่วงเวลาขายดีที่สุดของสินค้า
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {peakPeriods?.map((item, idx) => (
            <Card
              key={item.productId}
              className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Badge
                    className={`mt-1 ${
                      idx === 0
                        ? "bg-amber-500"
                        : idx === 1
                        ? "bg-slate-400"
                        : idx === 2
                        ? "bg-amber-700"
                        : "bg-slate-500"
                    }`}
                  >
                    {idx + 1}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.productName}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {item.peakMonth}
                      </Badge>
                      <span className="text-sm font-semibold text-red-600">
                        {formatTHB(item.peakSales)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
