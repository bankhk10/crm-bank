"use client";

import { useCallback, useEffect, useState } from "react";
import { getSalesForecastAction } from "@/modules/sales-forecast/server/actions";

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
  actualSales: Array<{ month: number; totalAmount: number }>;
  groupLabels: Record<string, string>;
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
      const forecastData = await getSalesForecastAction(year);
      setData(forecastData);
      setGroupLabels(forecastData.groupLabels);
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
