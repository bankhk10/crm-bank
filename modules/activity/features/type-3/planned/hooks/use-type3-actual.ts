"use client";

import { useState, useCallback } from "react";
import type {
  Type3ProductSaleDetail,
  Type3ActualData,
} from "../types/actual.types";
import { validateType3Actual } from "../application/actual-validation";

export function useType3Actual() {
  const [t3SoldProducts, setT3SoldProducts] = useState<string>("");
  const [t3ActualSales, setT3ActualSales] = useState<string>("");
  const [t3ActualQuantity, setT3ActualQuantity] = useState<string>("");
  const [t3UnclosedReason, setT3UnclosedReason] = useState<string>("");
  const [t3ProductSalesDetails, setT3ProductSalesDetails] = useState<
    Type3ProductSaleDetail[]
  >([]);

  const hydrate = useCallback((parsed: any) => {
    if (!parsed) return;
    if (parsed.t3SoldProducts) setT3SoldProducts(parsed.t3SoldProducts);
    if (parsed.t3ActualSales) setT3ActualSales(String(parsed.t3ActualSales));
    if (parsed.t3ActualQuantity) {
      setT3ActualQuantity(String(parsed.t3ActualQuantity));
    }
    if (parsed.t3UnclosedReason) {
      setT3UnclosedReason(parsed.t3UnclosedReason);
    }
    if (parsed.t3ProductSalesDetails && Array.isArray(parsed.t3ProductSalesDetails)) {
      setT3ProductSalesDetails(parsed.t3ProductSalesDetails);
    }
  }, []);

  const collectPayload = useCallback((): Type3ActualData => {
    return {
      workTypeCode: "TYPE_3",
      soldProducts: t3SoldProducts,
      actualSales: t3ActualSales,
      actualQuantity: t3ActualQuantity,
      unclosedReason: t3UnclosedReason,
      productSalesDetails: t3ProductSalesDetails,
    };
  }, [
    t3SoldProducts,
    t3ActualSales,
    t3ActualQuantity,
    t3UnclosedReason,
    t3ProductSalesDetails,
  ]);

  const validate = useCallback(() => {
    return validateType3Actual({
      productSalesDetails: t3ProductSalesDetails,
      soldProducts: t3SoldProducts,
      actualSales: t3ActualSales,
      actualQuantity: t3ActualQuantity,
      unclosedReason: t3UnclosedReason,
    });
  }, [
    t3ProductSalesDetails,
    t3SoldProducts,
    t3ActualSales,
    t3ActualQuantity,
    t3UnclosedReason,
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
    // Shorthand aliases for component compatibility
    soldProducts: t3SoldProducts,
    setSoldProducts: setT3SoldProducts,
    actualSales: t3ActualSales,
    setActualSales: setT3ActualSales,
    actualQuantity: t3ActualQuantity,
    setActualQuantity: setT3ActualQuantity,
    unclosedReason: t3UnclosedReason,
    setUnclosedReason: setT3UnclosedReason,
    productSalesDetails: t3ProductSalesDetails,
    setProductSalesDetails: setT3ProductSalesDetails,
    hydrate,
    collectPayload,
    validate,
  };
}
