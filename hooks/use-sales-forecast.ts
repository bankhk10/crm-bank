"use client";

import { useCallback, useEffect, useState } from "react";
import { getSalesForecastAction } from "@/modules/sales-forecast/server/actions";

import { SalesForecastResponse } from "@/modules/sales-forecast/types";

export const useSalesForecast = (year: number) => {
  const [data, setData] = useState<SalesForecastResponse | null>(null);
  const [tradeNameGroupLabels, setTradeNameGroupLabels] = useState<Record<string, string>>({});
  const [abcLabels, setAbcLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const forecastData = await getSalesForecastAction(year);
      setData(forecastData);
      setTradeNameGroupLabels(forecastData.tradeNameGroupLabels);
      setAbcLabels(forecastData.abcLabels);
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
    tradeNameGroupLabels,
    abcLabels,
    loading,
    error,
    refresh: fetchData,
  };
};
