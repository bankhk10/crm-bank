"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  ProductGroupTarget,
  RegionTarget,
  ProductTarget,
  ProductInfo,
  DetailedTarget,
} from "@/src/core/sales-targets/sales-target.types";

export function useSalesTargets() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Data States
  const [monthlyTargets, setMonthlyTargets] = useState<
    Record<number | string, number>
  >({});
  const [productGroupTargets, setProductGroupTargets] = useState<
    Record<string, Record<number, number>>
  >({});
  const [regionTargets, setRegionTargets] = useState<
    Record<string, Record<number, number>>
  >({});
  const [productTargets, setProductTargets] = useState<
    Record<string, Record<number, number>>
  >({});
  const [detailedTargets, setDetailedTargets] = useState<DetailedTarget[]>([]);
  const [products, setProducts] = useState<ProductInfo[]>([]);

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

        // Process monthly targets
        const monthlyMap: Record<number | string, number> = {};
        data.monthlyTargets?.forEach(
          (t: { month: number | null; targetAmount: string }) => {
            if (t.month !== null) {
              monthlyMap[t.month] = Number(t.targetAmount);
            }
          },
        );
        setMonthlyTargets(monthlyMap);

        // Process product group targets
        const pgMap: Record<string, Record<number, number>> = {};
        data.productGroupTargets?.forEach(
          (t: {
            productGroup: string;
            month: number | null;
            targetAmount: string;
          }) => {
            if (!pgMap[t.productGroup]) pgMap[t.productGroup] = {};
            if (t.month !== null) {
              pgMap[t.productGroup][t.month] = Number(t.targetAmount);
            }
          },
        );
        setProductGroupTargets(pgMap);

        // Process region targets
        const regionMap: Record<string, Record<number, number>> = {};
        data.regionTargets?.forEach(
          (t: {
            region: string;
            month: number | null;
            targetAmount: string;
          }) => {
            if (!regionMap[t.region]) regionMap[t.region] = {};
            if (t.month !== null) {
              regionMap[t.region][t.month] = Number(t.targetAmount);
            }
          },
        );
        setRegionTargets(regionMap);

        // Process product targets
        const productMap: Record<string, Record<number, number>> = {};
        const productList: ProductInfo[] = [];
        const seenProducts = new Set<string>();
        data.productTargets?.forEach(
          (t: {
            productId: string;
            month: number | null;
            targetAmount: string;
            product: ProductInfo;
          }) => {
            if (!productMap[t.productId]) productMap[t.productId] = {};
            if (t.month !== null) {
              productMap[t.productId][t.month] = Number(t.targetAmount);
            }
            if (!seenProducts.has(t.productId)) {
              seenProducts.add(t.productId);
              productList.push(t.product);
            }
          },
        );
        setProductTargets(productMap);

        // Merge with existing products only if needed, or replace?
        // Logic in page.tsx was merging.
        if (productList.length > 0) {
          setProducts((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newProducts = productList.filter(
              (p) => !existingIds.has(p.id),
            );
            return [...prev, ...newProducts];
          });
        }

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

  const saveProductGroupTargets = async (
    targets: ProductGroupTarget[],
    year: number,
  ) => {
    setSaving(true);
    try {
      const response = await fetch("/api/sales-targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "productGroup",
          targets: targets.map((t) => ({ ...t, year })),
        }),
      });

      if (!response.ok) throw new Error("Failed to save");
      return true;
    } catch (error) {
      console.error("Error saving product group targets:", error);
      toast.error("ไม่สามารถบันทึกเป้าหมายได้");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveRegionTargets = async (targets: RegionTarget[], year: number) => {
    setSaving(true);
    try {
      const response = await fetch("/api/sales-targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "region",
          targets: targets.map((t) => ({ ...t, year })),
        }),
      });

      if (!response.ok) throw new Error("Failed to save");
      return true;
    } catch (error) {
      console.error("Error saving region targets:", error);
      toast.error("ไม่สามารถบันทึกเป้าหมายได้");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveProductTargets = async (targets: ProductTarget[], year: number) => {
    setSaving(true);
    try {
      const response = await fetch("/api/sales-targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "product",
          targets: targets.map((t) => ({ ...t, year })),
        }),
      });

      if (!response.ok) throw new Error("Failed to save");
      return true;
    } catch (error) {
      console.error("Error saving product targets:", error);
      toast.error("ไม่สามารถบันทึกเป้าหมายได้");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteTarget = async (id: string) => {
    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  };

  const searchProducts = async (search: string) => {
    try {
      const params = new URLSearchParams({
        search,
        limit: "20",
        status: "ACTIVE",
      });
      const response = await fetch(`/api/products?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      return data.products || [];
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  };

  return {
    loading,
    saving,
    monthlyTargets,
    productGroupTargets,
    regionTargets,
    productTargets,
    detailedTargets,
    products,
    setProductGroupTargets,
    setRegionTargets,
    setProductTargets,
    setProducts,
    fetchTargets,
    saveProductGroupTargets,
    saveRegionTargets,
    saveProductTargets,
    deleteTarget,
    searchProducts,
  };
}
