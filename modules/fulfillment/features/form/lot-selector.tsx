"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Package, AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { th } from "date-fns/locale";

import type {
  LotSelectorProps,
  SaleItemLotOption,
  LotAllocation
} from "../../types/types";
export function LotSelector({
  saleId,
  onAllocationsChange,
  disabled = false,
}: LotSelectorProps) {
  const [lotOptions, setLotOptions] = useState<SaleItemLotOption[]>([]);
  const [allocations, setAllocations] = useState<
    Map<string, Map<string, number>>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasExistingAllocations, setHasExistingAllocations] = useState(false);

  // Fetch LOT options for this sale
  useEffect(() => {
    const fetchLotOptions = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/sales/${saleId}/lot-options`);
        if (!res.ok) {
          throw new Error("Failed to fetch lot options");
        }
        const data = await res.json();
        setLotOptions(data.items || []);
        setHasExistingAllocations(data.hasExistingAllocations || false);

        // Initialize allocations from suggestedAllocations (auto-filled from API)
        const initialAllocations = new Map<string, Map<string, number>>();
        for (const item of data.items || []) {
          const itemAllocs = new Map<string, number>();
          // Use suggestedAllocations which already includes existing or auto-calculated
          const source =
            item.suggestedAllocations || item.existingAllocations || [];
          for (const alloc of source) {
            itemAllocs.set(alloc.lotId, alloc.quantity);
          }
          initialAllocations.set(item.saleItemId, itemAllocs);
        }
        setAllocations(initialAllocations);
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    };

    fetchLotOptions();
  }, [saleId]);

  // Calculate validity and notify parent
  useEffect(() => {
    const flatAllocations: LotAllocation[] = [];
    let isValid = true;

    for (const item of lotOptions) {
      const itemAllocs = allocations.get(item.saleItemId) || new Map();
      let totalAllocated = 0;

      for (const [lotId, qty] of itemAllocs.entries()) {
        if (qty > 0) {
          flatAllocations.push({
            saleItemId: item.saleItemId,
            lotId,
            quantity: qty,
          });
          totalAllocated += qty;
        }
      }

      // Check if allocated quantity matches required
      if (totalAllocated !== item.requiredQuantity) {
        isValid = false;
      }
    }

    onAllocationsChange(flatAllocations, isValid);
  }, [allocations, lotOptions, onAllocationsChange]);

  const handleAllocationChange = (
    saleItemId: string,
    lotId: string,
    quantity: number,
  ) => {
    setAllocations((prev) => {
      const newAllocations = new Map(prev);
      const itemAllocs = new Map(newAllocations.get(saleItemId) || new Map());

      if (quantity > 0) {
        itemAllocs.set(lotId, quantity);
      } else {
        itemAllocs.delete(lotId);
      }

      newAllocations.set(saleItemId, itemAllocs);
      return newAllocations;
    });
  };

  const getTotalAllocated = (saleItemId: string): number => {
    const itemAllocs = allocations.get(saleItemId);
    if (!itemAllocs) return 0;
    let total = 0;
    for (const qty of itemAllocs.values()) {
      total += qty;
    }
    return total;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
        <span className="ml-3 text-slate-600">กำลังโหลดข้อมูล LOT...</span>
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

  if (lotOptions.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>ไม่พบข้อมูลสินค้าในรายการขาย</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
        <AlertCircle className="h-4 w-4" />
        <span>ระบบได้ทำการเลือก LOT สินค้าให้อัตโนมัติตามลำดับวันที่สร้าง LOT จากเก่าไปใหม่ (FIFO)</span>
      </div>
      {lotOptions.map((item) => {
        const totalAllocated = getTotalAllocated(item.saleItemId);
        const isComplete = totalAllocated === item.requiredQuantity;
        const isOverAllocated = totalAllocated > item.requiredQuantity;

        return (
          <Card
            key={item.saleItemId}
            className={cn(
              "border-2 transition-all",
              isComplete
                ? "border-green-300 bg-green-50/30"
                : isOverAllocated
                  ? "border-red-300 bg-red-50/30"
                  : "border-slate-200",
            )}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Package className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <span className="text-base font-semibold text-slate-800">
                      {item.productName}
                    </span>
                    <span className="ml-2 text-sm text-slate-500">
                      ({item.productCode})
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-sm font-bold",
                      isComplete
                        ? "bg-green-100 text-green-700 border-green-300"
                        : isOverAllocated
                          ? "bg-red-100 text-red-700 border-red-300"
                          : "bg-amber-100 text-amber-700 border-amber-300",
                    )}
                  >
                    {totalAllocated} / {item.requiredQuantity} ชิ้น
                  </Badge>
                  {isComplete && <Check className="h-5 w-5 text-green-600" />}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {item.availableLots.length === 0 ? (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    ไม่มี LOT ที่มีสินค้าเพียงพอ
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  <div className="grid gap-3">
                    {item.availableLots.map((lot) => {
                      const currentAlloc =
                        allocations.get(item.saleItemId)?.get(lot.id) || 0;

                      let otherAllocations = 0;
                      allocations.forEach((itemAllocs, otherSaleItemId) => {
                        if (otherSaleItemId !== item.saleItemId) {
                          otherAllocations += itemAllocs.get(lot.id) || 0;
                        }
                      });
                      const remainingLotQty = Math.max(0, lot.quantity - otherAllocations);

                      return (
                        <div
                          key={lot.id}
                          className={cn(
                            "flex items-center gap-4 p-3 rounded-lg border transition-all",
                            currentAlloc > 0
                              ? "bg-blue-50 border-blue-200"
                              : "bg-slate-50 border-slate-200 hover:border-slate-300",
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-normal text-slate-800">
                                เลขที่ LOT: {lot.lotNumber}
                              </span>
                              {/* <Badge variant="secondary" className="text-base">
                                คงเหลือ: {remainingLotQty}
                              </Badge> */}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                              {lot.expiryDate && (
                                <span>
                                  หมดอายุ:{" "}
                                  {format(
                                    new Date(lot.expiryDate),
                                    "dd MMM yyyy",
                                    { locale: th },
                                  )}
                                </span>
                              )}
                              {lot.storageLocation && (
                                <span>ที่เก็บ: {lot.storageLocation}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600">
                              จำนวน:
                            </span>
                            <Input
                              type="number"
                              min={0}
                              max={remainingLotQty + currentAlloc}
                              value={currentAlloc || ""}
                              readOnly
                              className="w-20 h-9 text-center bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200"
                              disabled={true}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default LotSelector;
