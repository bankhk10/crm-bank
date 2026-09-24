import { useState } from "react";
import {
  DEMO_PRODUCT_PRICES,
  isFieldDayItem,
} from "@/modules/activity-plans/constants";
import type {
  Type3SalesItem,
  Type3SalesProductLine,
} from "@/modules/activity-plans/features/shared/form/types";

export interface UseType3FormOptions {
  initial?: any;
  initDetails?: any;
  customersList?: any[];
  productsList?: any[];
  selectedWorkTypes?: string[];
}

export interface UseType3FormResult {
  type3Items: Type3SalesItem[];
  setType3Items: React.Dispatch<React.SetStateAction<Type3SalesItem[]>>;
  addType3Row: () => void;
  updateType3Row: (
    id: string,
    field: keyof Type3SalesItem,
    val: any,
  ) => void;
  deleteType3Row: (id: string) => void;
  validateType3: () => { isValid: boolean; error?: string };
  mapType3Payload: (
    customers: any[],
    products: any[],
  ) => {
    planStores: Array<{
      workTypeCode: string;
      storeId?: string | null;
      storeName?: string | null;
      subDealerStore?: string | null;
      notes?: string | null;
    }>;
    planProducts: Array<{
      workTypeCode: string;
      storeId?: string | null;
      productId: string;
      productName?: string | null;
      masterPrice?: number | null;
      unitPrice?: number | null;
      isPriceOverridden?: boolean;
      targetQuantity?: number | null;
      targetAmount?: number | null;
      notes?: string | null;
    }>;
  };
}

export function useType3Form({
  initial = {},
  initDetails,
  customersList = [],
  productsList = [],
  selectedWorkTypes = [],
}: UseType3FormOptions): UseType3FormResult {
  const [type3Items, setType3Items] = useState<Type3SalesItem[]>(() => {
    if (
      initDetails?.type3Items &&
      Array.isArray(initDetails.type3Items) &&
      initDetails.type3Items.length > 0
    ) {
      return initDetails.type3Items;
    }
    const type3Prods = (initial as any)?.products?.filter(
      (p: any) => p.workTypeCode === "TYPE_3",
    );
    const type3Stores = (initial as any)?.stores?.filter(
      (s: any) => s.workTypeCode === "TYPE_3",
    );
    if (
      (type3Prods && type3Prods.length > 0) ||
      (type3Stores && type3Stores.length > 0)
    ) {
      const storeMap = new Map<string, any[]>();
      if (type3Prods && type3Prods.length > 0) {
        type3Prods.forEach((p: any) => {
          const sId = p.storeId || "default";
          if (!storeMap.has(sId)) storeMap.set(sId, []);
          storeMap.get(sId)!.push(p);
        });
      }
      if (type3Stores && type3Stores.length > 0) {
        type3Stores.forEach((s: any) => {
          if (!storeMap.has(s.storeId)) storeMap.set(s.storeId, []);
        });
      }
      return Array.from(storeMap.entries()).map(([sId, prods], idx) => {
        const matchedStore = type3Stores?.find((s: any) => s.storeId === sId);
        const prodLines = (prods || []).map((p: any, pIdx: number) => ({
          id: p.id || `p-${idx}-${pIdx}`,
          productId: p.productId,
          productName: p.product?.name || p.productName || "",
          quantity: p.targetQuantity != null ? Number(p.targetQuantity) : 1,
          notes: p.notes || "",
          unitPrice: p.unitPrice != null ? Number(p.unitPrice) : 0,
          price:
            p.targetAmount != null
              ? Number(p.targetAmount)
              : (Number(p.targetQuantity) || 1) * (Number(p.unitPrice) || 0),
          masterPrice: p.masterPrice != null ? Number(p.masterPrice) : null,
          isPriceOverridden: p.isPriceOverridden ?? false,
        }));
        const firstProd = prodLines[0];
        return {
          id: String(idx + 1),
          storeId: sId !== "default" ? sId : undefined,
          isSubDealer: Boolean(matchedStore?.subDealerStore),
          subDealerStore: matchedStore?.subDealerStore || "",
          customerName:
            matchedStore?.store?.name || matchedStore?.storeName || "",
          products:
            prodLines.length > 0
              ? prodLines
              : [
                  {
                    id: `p-${idx}-0`,
                    productName: "",
                    quantity: 1,
                    notes: "",
                  },
                ],
          productId: firstProd?.productId,
          productName: firstProd?.productName || "",
          quantity: firstProd?.quantity || 1,
          notes: firstProd?.notes || "",
          detail: matchedStore?.notes || "",
        };
      });
    }
    if (Array.isArray(initDetails) && initDetails.length > 0) {
      const items = initDetails.filter(
        (item: any) =>
          !isFieldDayItem(item) &&
          item.itemType !== "MARKETING_PRODUCT" &&
          item.itemType !== "SALES_PROMOTION" &&
          item.visitTopic !== "MARKETING_PRODUCT" &&
          item.visitTopic !== "SALES_PROMOTION" &&
          (item.itemType === "TYPE_3" || item.saleProductName),
      );
      if (items.length > 0) {
        return items.map((item: any, idx: number) => {
          const qty = item.saleQuantity != null ? Number(item.saleQuantity) : 1;
          const uPrice =
            item.saleUnitPrice != null ? Number(item.saleUnitPrice) : 0;
          const totalPrice =
            item.saleTotalPrice != null
              ? Number(item.saleTotalPrice)
              : qty * uPrice;
          return {
            id: item.id || String(idx + 1),
            customerName: item.customerName || "",
            products: [
              {
                id: "p-" + idx,
                productName: item.saleProductName || "",
                quantity: qty,
                unitPrice: uPrice,
                price: totalPrice,
              },
            ],
            productName: item.saleProductName || "",
            quantity: qty,
            unitPrice: uPrice,
            price: totalPrice,
            detail: item.detail || "",
          };
        });
      }
    }
    return [
      {
        id: "1",
        customerName: "",
        products: [
          {
            id: "p-1",
            productName: "",
            quantity: 1,
            unitPrice: 0,
            price: 0,
          },
        ],
        productName: "",
        quantity: 1,
        unitPrice: 0,
        price: 0,
        detail: "",
      },
    ];
  });

  const addType3Row = () => {
    const newItem: Type3SalesItem = {
      id: Date.now().toString(),
      isSubDealer: false,
      subDealerStore: "",
      customerName: "",
      products: [
        {
          id: "p-" + Date.now().toString(),
          productName: "",
          quantity: 1,
          notes: "",
        },
      ],
      productName: "",
      quantity: 1,
      notes: "",
      detail: "",
    };
    setType3Items((prev) => [...prev, newItem]);
  };

  const updateType3Row = (
    id: string,
    field: keyof Type3SalesItem,
    val: any,
  ) => {
    setType3Items((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: val };
        if (field === "products" && Array.isArray(val)) {
          const first = val[0];
          if (first) {
            updated.productName = first.productName;
            updated.quantity = first.quantity;
            updated.unitPrice = first.unitPrice;
          }
          updated.price = val.reduce(
            (sum: number, p: any) =>
              sum + (p.quantity || 0) * (p.unitPrice || 0),
            0,
          );
        } else if (field === "productName") {
          const foundProd = productsList.find((p) => p.name === val);
          if (foundProd && foundProd.price != null) {
            updated.unitPrice = Number(foundProd.price);
          } else if (DEMO_PRODUCT_PRICES[val] !== undefined) {
            updated.unitPrice = DEMO_PRODUCT_PRICES[val];
          }
          const qty =
            typeof updated.quantity === "number"
              ? updated.quantity
              : parseInt(String(updated.quantity ?? 0)) || 0;
          const uPrice =
            typeof updated.unitPrice === "number"
              ? updated.unitPrice
              : parseFloat(String(updated.unitPrice ?? 0)) || 0;
          updated.price = qty * uPrice;
        }
        return updated;
      }),
    );
  };

  const deleteType3Row = (id: string) => {
    setType3Items((prev) => prev.filter((item) => item.id !== id));
  };

  const validateType3 = () => {
    return { isValid: true };
  };

  const mapType3Payload = (customers: any[], products: any[]) => {
    if (!selectedWorkTypes.includes("เสนอขายสินค้า")) {
      return { planStores: [], planProducts: [] };
    }

    const planStores: Array<{
      workTypeCode: string;
      storeId?: string | null;
      storeName?: string | null;
      subDealerStore?: string | null;
      notes?: string | null;
    }> = [];

    const planProducts: Array<{
      workTypeCode: string;
      storeId?: string | null;
      productId: string;
      productName?: string | null;
      masterPrice?: number | null;
      unitPrice?: number | null;
      isPriceOverridden?: boolean;
      targetQuantity?: number | null;
      targetAmount?: number | null;
      notes?: string | null;
    }> = [];

    type3Items.forEach((item) => {
      const sId =
        item.storeId ||
        customers.find((c) => c.name === item.customerName)?.id;
      if (sId || item.customerName) {
        planStores.push({
          workTypeCode: "TYPE_3",
          storeId: sId || null,
          storeName: item.customerName || null,
          subDealerStore: item.isSubDealer ? item.subDealerStore || null : null,
          notes: item.detail || null,
        });
      }
      const prodLines =
        item.products && item.products.length > 0
          ? item.products
          : [
              {
                productId: item.productId,
                productName: item.productName || "",
                quantity: item.quantity || 1,
                notes: item.notes || "",
              },
            ];
      prodLines.forEach((p) => {
        const matchedP = products.find(
          (prod) => prod.id === p.productId || prod.name === p.productName,
        );
        const pId = p.productId || matchedP?.id;
        if (pId) {
          const qty = p.quantity != null ? Number(p.quantity) : 1;
          planProducts.push({
            workTypeCode: "TYPE_3",
            storeId: sId || null,
            productId: pId,
            productName: p.productName || matchedP?.name || null,
            masterPrice: null,
            unitPrice: null,
            isPriceOverridden: false,
            targetQuantity: qty,
            targetAmount: null,
            notes: p.notes || null,
          });
        }
      });
    });

    return { planStores, planProducts };
  };

  return {
    type3Items,
    setType3Items,
    addType3Row,
    updateType3Row,
    deleteType3Row,
    validateType3,
    mapType3Payload,
  };
}
