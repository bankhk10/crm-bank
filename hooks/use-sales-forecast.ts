"use client";

import { useCallback, useEffect, useState } from "react";

export interface PersonalForecastEntry {
  employeeId: string;
  employeeName: string;
  month: number;
  totalAmount: number;
  totalQuantity: number;
}

export interface GroupForecastEntry {
  productGroup: string;
  month: number;
  totalAmount: number;
  totalQuantity: number;
}

export interface ProductForecastEntry {
  productId: string;
  productCode: string;
  productName: string;
  productGroup: string | null;
  month: number;
  totalAmount: number;
  totalQuantity: number;
}

export interface SalesForecastResponse {
  personal: PersonalForecastEntry[];
  group: GroupForecastEntry[];
  product: ProductForecastEntry[];
}

interface ProductGroupResponse {
  groups: Array<{ code: string; description: string }>;
}

export const useSalesForecast = (year: number) => {
  const [data, setData] = useState<SalesForecastResponse | null>(null);
  const [groupLabels, setGroupLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [forecastResponse, groupResponse] = await Promise.all([
        fetch(`/api/sales-forecast?year=${year}`),
        fetch("/api/products/groups?perPage=200"),
      ]);

      if (!forecastResponse.ok) {
        throw new Error("Failed to fetch forecast data");
      }

      const forecastData: SalesForecastResponse =
        await forecastResponse.json();
      setData(forecastData);

      if (groupResponse.ok) {
        const groupData: ProductGroupResponse = await groupResponse.json();
        const labels = groupData.groups.reduce<Record<string, string>>(
          (acc, group) => {
            acc[group.code] = group.description;
            return acc;
          },
          {},
        );
        setGroupLabels(labels);
      } else {
        setGroupLabels({});
      }
    } catch (err) {
      console.error("Error fetching sales forecast:", err);
      setError("ไม่สามารถโหลดข้อมูลคาดการณ์ยอดขายได้");
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    groupLabels,
    loading,
    error,
    refresh: fetchData,
  };
};
