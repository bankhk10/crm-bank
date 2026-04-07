"use client";

/**
 * useSaleItems Hook
 * Manages sale items state and operations
 */

import { useState, useCallback, useMemo } from "react";
import type { SaleItemFormData } from "@/modules/sales/types";
import type { SaleFormProduct } from "../../types";

interface UseSaleItemsOptions {
  initialItems?: SaleItemFormData[];
  products: SaleFormProduct[];
}

interface UseSaleItemsResult {
  items: SaleItemFormData[];
  addItem: () => void;
  removeItem: (index: number) => void;
  updateItem: (
    index: number,
    field: keyof SaleItemFormData,
    value: unknown,
  ) => void;
  setItems: (items: SaleItemFormData[]) => void;
  subtotal: number;
  clearItemError: (index: number) => void;
}

/**
 * Hook to manage sale items
 */
export function useSaleItems(options: UseSaleItemsOptions): UseSaleItemsResult {
  const { initialItems = [], products } = options;
  const [items, setItems] = useState<SaleItemFormData[]>(initialItems);

  /**
   * Add a new empty item
   */
  const addItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      {
        productId: "",
        quantity: 1,
        unitPrice: 0,
        originalPrice: 0,
        priceModified: false,
      },
    ]);
  }, []);

  /**
   * Remove item at index
   */
  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * Update item field
   */
  const updateItem = useCallback(
    (index: number, field: keyof SaleItemFormData, value: unknown) => {
      setItems((prev) => {
        const newItems = [...prev];
        newItems[index] = { ...newItems[index], [field]: value };

        // Auto-fill price when product is selected
        if (field === "productId") {
          const product = products.find((p) => p.id === value);
          if (product && product.price) {
            newItems[index].unitPrice = product.price;
            newItems[index].originalPrice = product.price;
            newItems[index].priceModified = false;
          }
          // Auto-fill promotionBudget from product
          newItems[index].promotionBudget =
            product?.promotionBudget != null ? product.promotionBudget : null;
        }

        // Check if price was modified
        if (field === "unitPrice") {
          newItems[index].priceModified =
            Number(value) !== Number(newItems[index].originalPrice);
        }

        return newItems;
      });
    },
    [products],
  );

  /**
   * Clear error for item (placeholder for UI integration)
   */
  const clearItemError = useCallback(() => {
    // This can be used to clear field errors in parent component
  }, []);

  /**
   * Calculate subtotal
   */
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId);
      const packSize = parseFloat(product?.packageSizePerBox?.toString() || "1");
      const multiplier = isNaN(packSize) || packSize <= 0 ? 1 : packSize;
      return sum + item.quantity * item.unitPrice * multiplier;
    }, 0);
  }, [items, products]);

  return {
    items,
    addItem,
    removeItem,
    updateItem,
    setItems,
    subtotal,
    clearItemError,
  };
}

export default useSaleItems;
