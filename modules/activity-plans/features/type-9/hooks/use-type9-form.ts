import { useState, useEffect } from "react";
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
  // Sub Dealer state
  subdealerId: string;
  setSubdealerId: React.Dispatch<React.SetStateAction<string>>;
  subdealerName: string;
  setSubdealerName: React.Dispatch<React.SetStateAction<string>>;
  isUnregisteredSubdealer: boolean;
  setIsUnregisteredSubdealer: React.Dispatch<React.SetStateAction<boolean>>;
  subDealerStore: string;
  setSubDealerStore: React.Dispatch<React.SetStateAction<string>>;
  subDealerProvince: string;
  setSubDealerProvince: React.Dispatch<React.SetStateAction<string>>;
  subDealerDistrict: string;
  setSubDealerDistrict: React.Dispatch<React.SetStateAction<string>>;
  parentDealerId: string;
  setParentDealerId: React.Dispatch<React.SetStateAction<string>>;
  parentDealerName: string;
  setParentDealerName: React.Dispatch<React.SetStateAction<string>>;

  // Backward compatibility
  type9Store: string;
  setType9Store: React.Dispatch<React.SetStateAction<string>>;
  type9IsSubDealer: boolean;
  setType9IsSubDealer: React.Dispatch<React.SetStateAction<boolean>>;
  type9SubDealerStore: string;
  setType9SubDealerStore: React.Dispatch<React.SetStateAction<string>>;

  // Sales & products
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
      storeId: string | null;
      storeName: string | null;
      subDealerStore: string | null;
      province: string | null;
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
  const primaryStore = (initial as any)?.stores?.find(
    (st: any) => st.workTypeCode === "TYPE_9",
  );

  const matchedCustomer = customersList.find(
    (c) => c.id === primaryStore?.storeId,
  );
  const isMatchedSubdealer =
    matchedCustomer &&
    (matchedCustomer.customerType === "SUBDEALER" ||
      matchedCustomer.customerType === "Subdealer");

  // 1. Is Unregistered Sub Dealer?
  const [isUnregisteredSubdealer, setIsUnregisteredSubdealer] = useState<boolean>(() => {
    if (primaryStore?.subDealerStore && !isMatchedSubdealer) return true;
    if (isMatchedSubdealer) return false;
    if (initDetails?.isUnregisteredSubdealer !== undefined) {
      return Boolean(initDetails.isUnregisteredSubdealer);
    }
    return false;
  });

  // 2. Subdealer ID (Customer Master)
  const [subdealerId, setSubdealerId] = useState<string>(() => {
    if (isMatchedSubdealer) return matchedCustomer.id;
    if (initDetails?.subdealerId) return initDetails.subdealerId;
    return "";
  });

  // 3. Subdealer Name (Customer Master)
  const [subdealerName, setSubdealerName] = useState<string>(() => {
    if (isMatchedSubdealer) return matchedCustomer.name;
    if (initDetails?.subdealerName) return initDetails.subdealerName;
    return "";
  });

  // 4. Subdealer Store (Manual text for Unregistered)
  const [subDealerStore, setSubDealerStore] = useState<string>(() => {
    if (primaryStore?.subDealerStore) return primaryStore.subDealerStore;
    if (initDetails?.subDealerStore) return initDetails.subDealerStore;
    if (initDetails?.type9SubDealerStore) return initDetails.type9SubDealerStore;
    return "";
  });

  // 5. Province (for Unregistered or synced from Sub Dealer)
  const [subDealerProvince, setSubDealerProvince] = useState<string>(() => {
    if (isMatchedSubdealer) return matchedCustomer.province || "";
    if (primaryStore?.province) return primaryStore.province;
    if ((initial as any)?.province) return (initial as any).province;
    if (initDetails?.province) return initDetails.province;
    return "";
  });

  // 6. District (for Unregistered or synced from Sub Dealer)
  const [subDealerDistrict, setSubDealerDistrict] = useState<string>(() => {
    if (isMatchedSubdealer) return matchedCustomer.district || "";
    if ((initial as any)?.district) return (initial as any).district;
    if (initDetails?.district) return initDetails.district;
    return "";
  });

  // 7. Parent Dealer ID
  const [parentDealerId, setParentDealerId] = useState<string>(() => {
    if (isMatchedSubdealer && matchedCustomer.parentDealerId) {
      return matchedCustomer.parentDealerId;
    }
    if (primaryStore && !isMatchedSubdealer && primaryStore.storeId) {
      return primaryStore.storeId;
    }
    if (initDetails?.parentDealerId) return initDetails.parentDealerId;
    return "";
  });

  // 8. Parent Dealer Name
  const [parentDealerName, setParentDealerName] = useState<string>(() => {
    if (isMatchedSubdealer && matchedCustomer.parentDealerId) {
      const parent = customersList.find((c) => c.id === matchedCustomer.parentDealerId);
      if (parent) return parent.name;
    }
    if (primaryStore && !isMatchedSubdealer) {
      return primaryStore.store?.name || primaryStore.storeName || "";
    }
    if (initDetails?.parentDealerName) return initDetails.parentDealerName;
    return "";
  });

  // Backward compatibility: type9Store, type9IsSubDealer, type9SubDealerStore
  const [type9Store, setType9Store] = useState<string>(() => {
    if (primaryStore) return primaryStore.store?.name || primaryStore.storeName || "";
    return "";
  });
  const [type9IsSubDealer, setType9IsSubDealer] = useState<boolean>(true);
  const [type9SubDealerStore, setType9SubDealerStore] = useState<string>(() => {
    return subDealerStore;
  });

  // Hydrate when customersList loads asynchronously
  useEffect(() => {
    if (!customersList || customersList.length === 0) return;
    const store = (initial as any)?.stores?.find(
      (st: any) => st.workTypeCode === "TYPE_9",
    );
    if (!store) return;

    const matched = customersList.find((c) => c.id === store.storeId);
    if (
      matched &&
      (matched.customerType === "SUBDEALER" ||
        matched.customerType === "Subdealer")
    ) {
      setIsUnregisteredSubdealer(false);
      setSubdealerId(matched.id);
      setSubdealerName(matched.name);
      setSubDealerProvince(matched.province || "");
      setSubDealerDistrict(matched.district || "");
      if (matched.parentDealerId) {
        setParentDealerId(matched.parentDealerId);
        const pDealer = customersList.find(
          (c) => c.id === matched.parentDealerId,
        );
        if (pDealer) setParentDealerName(pDealer.name);
      }
    } else if (store.subDealerStore) {
      setIsUnregisteredSubdealer(true);
      setSubDealerStore(store.subDealerStore);
      if (store.province) setSubDealerProvince(store.province);
      if ((initial as any)?.district)
        setSubDealerDistrict((initial as any).district);
      if (store.storeId) setParentDealerId(store.storeId);
      if (store.storeName || store.store?.name)
        setParentDealerName(store.storeName || store.store?.name);
    }
  }, [customersList, initial]);

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
    if (!selectedWorkTypes.includes("จัดกิจกรรมส่งเสริมการขายหน้าร้าน")) {
      return { isValid: true };
    }

    if (isUnregisteredSubdealer) {
      if (!subDealerStore || !subDealerStore.trim()) {
        return {
          isValid: false,
          error: "กรุณากรอกชื่อร้านค้า Sub Dealer",
        };
      }
      if (!subDealerProvince || !subDealerProvince.trim()) {
        return {
          isValid: false,
          error: "กรุณาเลือกจังหวัดของร้านค้า Sub Dealer",
        };
      }
      if (!subDealerDistrict || !subDealerDistrict.trim()) {
        return {
          isValid: false,
          error: "กรุณาเลือกอำเภอของร้านค้า Sub Dealer",
        };
      }
    } else {
      if (!subdealerId) {
        return {
          isValid: false,
          error: "กรุณาเลือกร้านค้า Sub Dealer จาก Customer Master",
        };
      }
    }

    return { isValid: true };
  };

  const mapType9Payload = (customers: any[], products: any[]) => {
    if (!selectedWorkTypes.includes("จัดกิจกรรมส่งเสริมการขายหน้าร้าน")) {
      return { planStores: [], planProducts: [] };
    }

    const planStores: Array<{
      workTypeCode: string;
      storeId: string | null;
      storeName: string | null;
      subDealerStore: string | null;
      province: string | null;
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

    let storeId: string | null = null;
    let storeName: string | null = null;
    let subDealerStoreVal: string | null = null;
    let storeProvince: string | null = null;

    if (!isUnregisteredSubdealer && subdealerId) {
      // Case A: Registered Sub Dealer
      const subdealer = customers.find((c) => c.id === subdealerId);
      storeId = subdealerId;
      storeName = subdealer?.name || subdealerName || null;
      subDealerStoreVal = null;
      storeProvince = subdealer?.province || subDealerProvince || null;
    } else {
      // Case B: Unregistered Sub Dealer
      storeId = parentDealerId || null;
      storeName = parentDealerName || null;
      subDealerStoreVal = subDealerStore?.trim() || null;
      storeProvince = subDealerProvince?.trim() || null;
    }

    if (storeId || subDealerStoreVal) {
      planStores.push({
        workTypeCode: "TYPE_9",
        storeId,
        storeName,
        subDealerStore: subDealerStoreVal,
        province: storeProvince,
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
            storeId: storeId || null,
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
    subdealerId,
    setSubdealerId,
    subdealerName,
    setSubdealerName,
    isUnregisteredSubdealer,
    setIsUnregisteredSubdealer,
    subDealerStore,
    setSubDealerStore,
    subDealerProvince,
    setSubDealerProvince,
    subDealerDistrict,
    setSubDealerDistrict,
    parentDealerId,
    setParentDealerId,
    parentDealerName,
    setParentDealerName,
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
