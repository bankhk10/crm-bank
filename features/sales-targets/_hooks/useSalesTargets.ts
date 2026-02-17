"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { DetailedTarget } from "@/src/core/sales-targets/sales-target.types";

export function useSalesTargets() {
  const [loading, setLoading] = useState(true);

  // Data States
  const [monthlyTargets, setMonthlyTargets] = useState<
    Record<number | string, number>
  >({});
  const [detailedTargets, setDetailedTargets] = useState<DetailedTarget[]>([]);

  const fetchTargets = useCallback(
    async (filters: {
      year: number;
      month: number | "all";
      employeeId?: string;
      shopId?: string;
    }) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ year: filters.year.toString() });
        if (filters.month !== "all") {
          params.set("month", filters.month.toString());
        }
        if (filters.employeeId) {
          params.set("employeeId", filters.employeeId);
        }
        if (filters.shopId) {
          params.set("shopId", filters.shopId);
        }

        const response = await fetch(`/api/sales-targets?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch targets");

        const data = await response.json();

        // Process monthly targets (derived from detailed targets in backend typically, but here we just use what API returns)
        const monthlyMap: Record<number | string, number> = {};
        if (data.monthlyTargets) {
          data.monthlyTargets.forEach(
            (t: { month: number | null; targetAmount: string }) => {
              if (t.month !== null) {
                monthlyMap[t.month] = Number(t.targetAmount);
              }
            },
          );
        }
        setMonthlyTargets(monthlyMap);

        // Process detailed targets
        setDetailedTargets(data.detailedTargets || []);
      } catch (error) {
        console.error("Error fetching targets:", error);
        toast.error("ไม่สามารถโหลดข้อมูลเป้าหมายได้");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const deleteTarget = async (id: string) => {
    try {
      const res = await fetch(`/api/sales-targets?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");
      toast.success("ลบข้อมูลสำเร็จ");
      return true;
    } catch (error) {
      toast.error("ไม่สามารถลบข้อมูลได้");
      console.error(error);
      return false;
    }
  };

  return {
    loading,
    monthlyTargets,
    detailedTargets,
    fetchTargets,
    deleteTarget,
  };
}
