"use client";

import { useState, useCallback } from "react";
import type {
  Type3ProductSaleDetail,
  Type3ActualData,
} from "../types/actual.types";
import { validateType3Actual } from "../application/actual-validation";
import { parseType3ActualResult } from "../application/actual-mapper";

export function useType3Actual() {
  const [t3SoldProducts, setT3SoldProducts] = useState<string>("");
  const [t3ActualSales, setT3ActualSales] = useState<string>("");
  const [t3ActualQuantity, setT3ActualQuantity] = useState<string>("");
  const [t3UnclosedReason, setT3UnclosedReason] = useState<string>("");
  const [t3ProductSalesDetails, setT3ProductSalesDetails] = useState<
    Type3ProductSaleDetail[]
  >([]);

  const hydrate = useCallback((parsedInput: any) => {
    if (!parsedInput) return;
    const mapped = parseType3ActualResult(parsedInput);
    const parsed = { ...mapped, ...parsedInput };

    const soldProducts = parsed.t3SoldProducts ?? mapped.t3SoldProducts;
    const actualSales = parsed.t3ActualSales ?? mapped.t3ActualSales;
    const actualQuantity = parsed.t3ActualQuantity ?? mapped.t3ActualQuantity;
    const unclosedReason = parsed.t3UnclosedReason ?? mapped.t3UnclosedReason;
    const details =
      Array.isArray(parsedInput.t3ProductSalesDetails) &&
      parsedInput.t3ProductSalesDetails.length > 0
        ? parsedInput.t3ProductSalesDetails
        : mapped.t3ProductSalesDetails;

    if (soldProducts !== undefined) setT3SoldProducts(soldProducts);
    if (actualSales !== undefined && actualSales !== "") {
      setT3ActualSales(String(actualSales));
    }
    if (actualQuantity !== undefined && actualQuantity !== "") {
      setT3ActualQuantity(String(actualQuantity));
    }
    if (unclosedReason !== undefined) {
      setT3UnclosedReason(unclosedReason);
    }
    if (details && Array.isArray(details) && details.length > 0) {
      setT3ProductSalesDetails(details);
    }
  }, []);

  const collectPayload = useCallback((): Type3ActualData => {
    const normalizedDetails = (t3ProductSalesDetails || []).map((item) => {
      const qty = Number(item.actualQuantity ?? item.actualQty ?? 0) || 0;
      const uPrice = Number(item.actualUnitPrice ?? item.unitPrice ?? 0) || 0;
      const total =
        item.actualTotal != null && !isNaN(Number(item.actualTotal))
          ? Number(item.actualTotal)
          : item.actualSales != null && item.actualSales !== "" && !isNaN(Number(item.actualSales))
            ? Number(item.actualSales)
            : qty * uPrice;

      return {
        ...item,
        productId: item.productId || "",
        actualQty: qty,
        unitPrice: uPrice,
        actualSales: total,
        actualQuantity: qty,
        actualUnitPrice: uPrice,
        actualTotal: total,
      };
    });

    return {
      workTypeCode: "TYPE_3",
      soldProducts: t3SoldProducts,
      actualSales: t3ActualSales,
      actualQuantity: t3ActualQuantity,
      unclosedReason: t3UnclosedReason,
      productSalesDetails: normalizedDetails,
      saleResults: normalizedDetails.map((d) => ({
        id: d.id,
        productId: d.productId || "",
        productName: d.productName || null,
        storeId: d.storeId || null,
        isSubDealer: d.isSubDealer,
        isUnregisteredSubdealer: d.isUnregisteredSubdealer,
        subdealerId: d.subdealerId || null,
        subdealerName: d.subdealerName || null,
        subDealerStore: d.subDealerStore || null,
        dealerName: d.dealerName || null,
        actualQuantity: d.actualQuantity,
        actualUnitPrice: d.actualUnitPrice,
        actualTotal: d.actualTotal,
        unclosedReason: d.unclosedReason || null,
        isAdditional: Boolean(d.isAdditional),
      })),
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
