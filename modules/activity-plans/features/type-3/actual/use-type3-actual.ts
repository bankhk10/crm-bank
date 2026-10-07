"use client";

import { useState, useCallback } from "react";

export function useType3Actual() {
  const [t3SoldProducts, setT3SoldProducts] = useState("");
  const [t3ActualSales, setT3ActualSales] = useState("");
  const [t3ActualQuantity, setT3ActualQuantity] = useState("");
  const [t3UnclosedReason, setT3UnclosedReason] = useState("");
  const [t3ProductSalesDetails, setT3ProductSalesDetails] = useState<any[]>([]);

  const hydrate = useCallback((parsed: any) => {
    if (!parsed) return;
    if (parsed.t3SoldProducts) setT3SoldProducts(parsed.t3SoldProducts);
    if (parsed.t3ActualSales) setT3ActualSales(parsed.t3ActualSales);
    if (parsed.t3ActualQuantity) {
      setT3ActualQuantity(String(parsed.t3ActualQuantity));
    }
    if (parsed.t3UnclosedReason) {
      setT3UnclosedReason(parsed.t3UnclosedReason);
    }
    if (parsed.t3ProductSalesDetails) {
      setT3ProductSalesDetails(parsed.t3ProductSalesDetails);
    }
  }, []);

  const collectPayload = useCallback(() => {
    return {
      t3SoldProducts,
      t3ActualSales,
      t3ActualQuantity,
      t3UnclosedReason,
      t3ProductSalesDetails,
    };
  }, [
    t3SoldProducts,
    t3ActualSales,
    t3ActualQuantity,
    t3UnclosedReason,
    t3ProductSalesDetails,
  ]);

  return {
    t3SoldProducts,
    setT3SoldProducts,
    t3ActualSales,
    setT3ActualSales,
    t3ActualQuantity,
    setT3ActualQuantity,
    t3UnclosedReason,
    setT3UnclosedReason,
    t3ProductSalesDetails,
    setT3ProductSalesDetails,
    hydrate,
    collectPayload,
  };
}
