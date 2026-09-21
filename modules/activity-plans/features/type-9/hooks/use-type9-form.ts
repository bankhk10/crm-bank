import { useState } from "react";
import { isFieldDayItem, DEMO_PRODUCT_PRICES } from "@/modules/activity-plans/constants";
import type { Type9ProductItem } from "@/modules/activity-plans/features/shared/form/types";

export interface UseType9FormOptions {
  initial?: any;
  initDetails?: any;
  customersList?: any[];
  productsList?: any[];
  selectedWorkTypes?: string[];
}

export interface UseType9FormResult {
  type9Store: string;
  setType9Store: React.Dispatch<React.SetStateAction<string>>;
  type9IsSubDealer: boolean;
  setType9IsSubDealer: React.Dispatch<React.SetStateAction<boolean>>;
  type9SubDealerStore: string;
  setType9SubDealerStore: React.Dispatch<React.SetStateAction<string>>;
  type9Sales: number;
  setType9Sales: React.Dispatch<React.SetStateAction<number>>;
  type9Products: string;
  setType9Products: React.Dispatch<React.SetStateAction<string>>;
  type9ProductItems: Type9ProductItem[];
  setType9ProductItems: React.Dispatch<React.SetStateAction<Type9ProductItem[]>>;
  addType9ProductItem: () => void;
  updateType9ProductItem: (
    id: string,
    field: keyof Type9ProductItem,
    val: any,
  ) => void;
  deleteType9ProductItem: (id: string) => void;
  validateType9: () => { isValid: boolean; error?: string };
  mapType9Payload: (
    customers: any[],
    products: any[],
  ) => {
    planStores: Array<{
      workTypeCode: string;
      storeId: string;
      storeName: string | null;
      subDealerStore: string | null;
      targetAmount: number | null;
    }>;
    planProducts: Array<{
      workTypeCode: string;
      storeId: string | null;
      productId: string;
      productName: string | null;
      targetQuantity: number;
      unitPrice: number;
      totalAmount: number;
      isPriceOverridden: boolean;
    }>;
  };
}

export function useType9Form({
  initial = {},
  initDetails,
  customersList = [],
  productsList = [],
  selectedWorkTypes = [],
}: UseType9FormOptions): UseType9FormResult {
  const [type9Store, setType9Store] = useState<string>(() => {
    const s = (initial as any)?.stores?.find(
      (st: any) => st.workTypeCode === "TYPE_9",
    );
    if (s) return s.store?.name || s.storeName || "";
    if (initDetails?.type9Store) return initDetails.type9Store;
    if (Array.isArray(initDetails)) {
      const item = initDetails.find(
        (i: any) =>
          !isFieldDayItem(i) &&
          (i.itemType === "TYPE_9" ||
            (i.itemType !== "MARKETING_PRODUCT" &&
              i.itemType !== "SALES_PROMOTION" &&
              i.visitTopic !== "MARKETING_PRODUCT" &&
              i.visitTopic !== "SALES_PROMOTION" &&
              i.storeProductName &&
              !i.plotCropCategory)),
      );
      if (item && item.customerName) {
        const match = item.customerName.match(
          /^(.*?)\s*\((?:ร้าน\s*)?Sub Dealer:\s*(.*?)\)$/i,
        );
        if (match) return match[1].trim();
        return item.customerName;
      }
    }
    return "";
  });

  const [type9IsSubDealer, setType9IsSubDealer] = useState<boolean>(() => {
    const s = (initial as any)?.stores?.find(
      (st: any) => st.workTypeCode === "TYPE_9",
    );
    if (s?.subDealerStore) return true;
    if (initDetails?.type9IsSubDealer !== undefined)
      return initDetails.type9IsSubDealer;
    if (Array.isArray(initDetails)) {
      const item = initDetails.find(
        (i: any) =>
          !isFieldDayItem(i) &&
          (i.itemType === "TYPE_9" ||
            (i.itemType !== "MARKETING_PRODUCT" &&
              i.itemType !== "SALES_PROMOTION" &&
              i.visitTopic !== "MARKETING_PRODUCT" &&
              i.visitTopic !== "SALES_PROMOTION" &&
              i.storeProductName &&
              !i.plotCropCategory)),
      );
      if (item && item.customerName) {
        return /\((?:ร้าน\s*)?Sub Dealer:/i.test(item.customerName);
      }
    }
    return false;
  });

  const [type9SubDealerStore, setType9SubDealerStore] = useState<string>(() => {
    const s = (initial as any)?.stores?.find(
      (st: any) => st.workTypeCode === "TYPE_9",
    );
    if (s?.subDealerStore) return s.subDealerStore;
    if (initDetails?.type9SubDealerStore !== undefined)
      return initDetails.type9SubDealerStore;
    if (Array.isArray(initDetails)) {
      const item = initDetails.find(
        (i: any) =>
          !isFieldDayItem(i) &&
          (i.itemType === "TYPE_9" ||
            (i.itemType !== "MARKETING_PRODUCT" &&
              i.itemType !== "SALES_PROMOTION" &&
              i.visitTopic !== "MARKETING_PRODUCT" &&
              i.visitTopic !== "SALES_PROMOTION" &&
              i.storeProductName &&
              !i.plotCropCategory)),
      );
      if (item && item.customerName) {
        const match = item.customerName.match(
          /\((?:ร้าน\s*)?Sub Dealer:\s*(.*?)\)/i,
        );
        if (match) return match[1].trim();
      }
    }
    return "";
  });

  const [type9Sales, setType9Sales] = useState<number>(() => {
    const s = (initial as any)?.stores?.find(
      (st: any) => st.workTypeCode === "TYPE_9",
    );
    if (s?.targetAmount != null) return Number(s.targetAmount);
    if (initDetails?.type9Sales !== undefined) return initDetails.type9Sales;
    if (Array.isArray(initDetails)) {
      const items = initDetails.filter(
        (i: any) =>
          !isFieldDayItem(i) &&
          (i.itemType === "TYPE_9" ||
            (i.itemType !== "MARKETING_PRODUCT" &&
              i.itemType !== "SALES_PROMOTION" &&
              i.visitTopic !== "MARKETING_PRODUCT" &&
              i.visitTopic !== "SALES_PROMOTION" &&
              i.storeProductName &&
              !i.plotCropCategory)),
      );
      if (items.length > 0) {
        const sum = items.reduce(
          (acc: number, cur: any) =>
            acc +
            (cur.storeTotalAmount != null
              ? Number(cur.storeTotalAmount)
              : (Number(cur.storeQuantityCases) || 0) *
                (Number(cur.storePricePerCase) || 0)),
          0,
        );
        if (sum > 0) return sum;
      }
    }
    return 0;
  });

  const [type9Products, setType9Products] = useState<string>(
    initDetails?.type9Products ?? "",
  );

  const [type9ProductItems, setType9ProductItems] = useState<Type9ProductItem[]>(() => {
    if (
      initDetails?.type9ProductItems &&
      Array.isArray(initDetails.type9ProductItems) &&
      initDetails.type9ProductItems.length > 0
    ) {
      return initDetails.type9ProductItems;
    }
    const type9Prods = (initial as any)?.products?.filter(
      (p: any) => p.workTypeCode === "TYPE_9",
    );
    if (type9Prods && type9Prods.length > 0) {
      return type9Prods.map((p: any, idx: number) => ({
        id: p.id || String(idx + 1),
        productId: p.productId,
        productName: p.product?.name || p.productName || "",
        quantityCases: p.targetQuantity != null ? Number(p.targetQuantity) : 0,
        pricePerCase: p.unitPrice != null ? Number(p.unitPrice) : 0,
      }));
    }
    if (Array.isArray(initDetails) && initDetails.length > 0) {
      const items = initDetails.filter(
        (item: any) =>
          !isFieldDayItem(item) &&
          item.itemType !== "MARKETING_PRODUCT" &&
          item.itemType !== "SALES_PROMOTION" &&
          item.visitTopic !== "MARKETING_PRODUCT" &&
          item.visitTopic !== "SALES_PROMOTION" &&
          (item.itemType === "TYPE_9" ||
            (item.storeProductName && !item.plotCropCategory)),
      );
      const mapped = items
        .filter((item: any) => item.storeProductName || item.productName)
        .map((item: any, idx: number) => ({
          id: item.id || String(idx + 1),
          productId: item.productId,
          productName: item.storeProductName || item.productName || "",
          quantityCases: item.storeQuantityCases ?? item.quantityCases ?? 0,
          pricePerCase: item.storePricePerCase
            ? Number(item.storePricePerCase)
            : (item.pricePerCase ?? 0),
        }));
      if (mapped.length > 0) return mapped;
    }
    return [
      {
        id: "1",
        productName: "",
        quantityCases: 0,
        pricePerCase: 0,
      },
    ];
  });

  const addType9ProductItem = () => {
    const newItem: Type9ProductItem = {
      id: Date.now().toString(),
      productName: "",
      quantityCases: 0,
      pricePerCase: 0,
    };
    setType9ProductItems((prev) => [...prev, newItem]);
  };

  const updateType9ProductItem = (
    id: string,
    field: keyof Type9ProductItem,
    val: any,
  ) => {
    setType9ProductItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: val };
        if (field === "productName") {
          const foundProd = productsList.find((p) => p.name === val);
          if (foundProd && foundProd.price != null) {
            updated.pricePerCase = Number(foundProd.price);
          } else if (DEMO_PRODUCT_PRICES[val] !== undefined) {
            updated.pricePerCase = DEMO_PRODUCT_PRICES[val];
          } else {
            updated.pricePerCase = 0;
          }
        }
        return updated;
      }),
    );
  };

  const deleteType9ProductItem = (id: string) => {
    setType9ProductItems((prev) => prev.filter((item) => item.id !== id));
  };

  const validateType9 = (): { isValid: boolean; error?: string } => {
    return { isValid: true };
  };

  const mapType9Payload = (customers: any[], products: any[]) => {
    if (!selectedWorkTypes.includes("จัดกิจกรรมส่งเสริมการขายหน้าร้าน")) {
      return { planStores: [], planProducts: [] };
    }

    const planStores: Array<{
      workTypeCode: string;
      storeId: string;
      storeName: string | null;
      subDealerStore: string | null;
      targetAmount: number | null;
    }> = [];

    const planProducts: Array<{
      workTypeCode: string;
      storeId: string | null;
      productId: string;
      productName: string | null;
      targetQuantity: number;
      unitPrice: number;
      totalAmount: number;
      isPriceOverridden: boolean;
    }> = [];

    const sId9 = customers.find((c) => c.name === type9Store)?.id;
    if (sId9) {
      planStores.push({
        workTypeCode: "TYPE_9",
        storeId: sId9,
        storeName: type9Store || null,
        subDealerStore:
          type9IsSubDealer && type9SubDealerStore
            ? type9SubDealerStore
            : null,
        targetAmount: type9Sales != null ? Number(type9Sales) : null,
      });
    }

    type9ProductItems
      .filter((item) => item.productName && item.productName.trim() !== "")
      .forEach((p) => {
        const matchedP = products.find(
          (prod) => prod.id === p.productId || prod.name === p.productName,
        );
        const pId = p.productId || matchedP?.id;
        if (pId) {
          const qty = p.quantityCases != null ? Number(p.quantityCases) : 0;
          const price = p.pricePerCase != null ? Number(p.pricePerCase) : 0;
          planProducts.push({
            workTypeCode: "TYPE_9",
            storeId: sId9 || null,
            productId: pId,
            productName: matchedP?.name || p.productName || null,
            targetQuantity: qty,
            unitPrice: price,
            totalAmount: qty * price,
            isPriceOverridden: false,
          });
        }
      });

    return { planStores, planProducts };
  };

  return {
    type9Store,
    setType9Store,
    type9IsSubDealer,
    setType9IsSubDealer,
    type9SubDealerStore,
    setType9SubDealerStore,
    type9Sales,
    setType9Sales,
    type9Products,
    setType9Products,
    type9ProductItems,
    setType9ProductItems,
    addType9ProductItem,
    updateType9ProductItem,
    deleteType9ProductItem,
    validateType9,
    mapType9Payload,
  };
}
