"use client";

import React, { useState, useEffect } from "react";
import { Package, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LotOption {
  saleItemId: string;
  productId: string;
  productName: string;
  productCode: string;
  requiredQuantity: number;
  availableLots: { id: string; lotNumber: string; quantity: number }[];
}

export function SimpleStockView({ saleId }: { saleId: string }) {
  const [lotOptions, setLotOptions] = useState<LotOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLotOptions = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/sales/${saleId}/lot-options`);
        if (!res.ok) throw new Error("Failed to fetch stock data");
        const data = await res.json();
        setLotOptions(data.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    };
    fetchLotOptions();
  }, [saleId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
        <span className="ml-3 text-sm text-slate-500">กำลังโหลดข้อมูลสต็อก...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!lotOptions.length) {
    return (
      <div className="text-center py-4 text-sm text-gray-500">
        ไม่พบข้อมูลสต็อกสำหรับรายการนี้
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {lotOptions.map((item) => {
        const totalStock = item.availableLots.reduce((acc, lot) => acc + lot.quantity, 0);
        const isEnough = totalStock >= item.requiredQuantity;

        return (
          <div key={item.saleItemId} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                <Package className="h-4 w-4 text-gray-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{item.productName}</p>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{item.productCode}</p>
              </div>
            </div>
            <div className="flex w-full sm:w-auto items-center justify-center gap-6 text-sm bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
              <div className="text-center min-w-[60px]">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-0.5">ต้องใช้</p>
                <p className="font-bold text-gray-900">{item.requiredQuantity}</p>
              </div>
              <div className="w-[1px] h-8 bg-gray-100"></div>
              <div className="text-center min-w-[60px]">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-0.5">ในสต็อก</p>
                <p className={`font-bold ${isEnough ? "text-emerald-600" : "text-rose-600"}`}>
                  {totalStock}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
