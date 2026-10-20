"use client";

import { useState, useCallback } from "react";
import type { Type6UnplannedItem } from "../types/unplanned.types";

export interface UseType6UnplannedFormOptions {
  initialItems?: Type6UnplannedItem[];
}

export function useType6UnplannedForm(options: UseType6UnplannedFormOptions = {}) {
  const [items, setItems] = useState<Type6UnplannedItem[]>(() => {
    if (options.initialItems && options.initialItems.length > 0) {
      return options.initialItems;
    }
    return [
      {
        id: `type6-unplanned-${Date.now()}-0`,
        isManualCustomer: false,
        storeId: null,
        customerName: "",
        manualCustomerName: "",
        manualCustomerAddress: "",
        manualCustomerPhone: "",
        issueType: "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
        detail: "",
        purchaseChannel: "ร้านค้าตัวแทนจำหน่าย",
        productId: null,
        productName: "",
        lotNumber: "",
        status: "เสร็จสิ้น",
        images: [],
      },
    ];
  });

  const addItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      {
        id: `type6-unplanned-${Date.now()}-${prev.length}`,
        isManualCustomer: false,
        storeId: null,
        customerName: "",
        manualCustomerName: "",
        manualCustomerAddress: "",
        manualCustomerPhone: "",
        issueType: "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
        detail: "",
        purchaseChannel: "ร้านค้าตัวแทนจำหน่าย",
        productId: null,
        productName: "",
        lotNumber: "",
        status: "เสร็จสิ้น",
        images: [],
      },
    ]);
  }, []);

  const updateItem = useCallback(
    (id: string, field: keyof Type6UnplannedItem, val: any) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)),
      );
    },
    [],
  );

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  }, []);

  return {
    items,
    setItems,
    addItem,
    updateItem,
    deleteItem,
  };
}
