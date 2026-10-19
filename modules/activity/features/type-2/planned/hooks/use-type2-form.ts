"use client";

import { useState } from "react";
import type {
  Type2ProductFollowupItem,
  Type2FollowupProductLine,
} from "../types/planned.types";
import { validateType2FormItems } from "../application/planned-validation";

export interface UseType2FormOptions {
  initial?: any;
  initDetails?: any;
  customersList?: any[];
  productsList?: any[];
  selectedWorkTypes?: string[];
}

export interface UseType2FormResult {
  type2Items: Type2ProductFollowupItem[];
  setType2Items: React.Dispatch<
    React.SetStateAction<Type2ProductFollowupItem[]>
  >;
  addType2Row: () => void;
  updateType2Row: (
    id: string,
    field: keyof Type2ProductFollowupItem,
    val: any,
  ) => void;
  deleteType2Row: (id: string) => void;
  validateType2: () => { isValid: boolean; error?: string };
  mapType2Payload: (
    customers: any[],
    products: any[],
  ) => {
    planStores: Array<{
      workTypeCode: string;
      visitPurpose: "FARMER" | "STORE";
      storeId?: string | null;
      storeName?: string | null;
      notes?: string | null;
      province?: string | null;
      isUnregisteredFarmer?: boolean;
      unregisteredFarmerName?: string | null;
      unregisteredFarmerPhone?: string | null;
    }>;
    planProducts: Array<{
      workTypeCode: string;
      storeId?: string | null;
      productId: string;
      productName?: string | null;
      isPriceOverridden?: boolean;
      notes?: string | null;
    }>;
  };
}

function matchProductsToStores(
  stores: any[],
  products: any[],
): Type2FollowupProductLine[][] {
  if (!stores || stores.length === 0) return [];
  if (!products || products.length === 0) {
    return stores.map(() => []);
  }
  if (stores.length === 1) {
    return [
      products.map((p, pIdx) => ({
        id: p.id || `p-0-${pIdx}`,
        productId: p.productId,
        productName: p.product?.name || p.productName || "",
        notes: p.notes || "",
      })),
    ];
  }

  const storeIdCounts = new Map<string, number>();
  stores.forEach((s) => {
    if (s.storeId) {
      storeIdCounts.set(s.storeId, (storeIdCounts.get(s.storeId) || 0) + 1);
    }
  });

  const assigned = new Set<any>();
  const storeProducts: any[][] = stores.map(() => []);

  // 1st pass: For stores with distinct non-null storeId
  stores.forEach((s, sIdx) => {
    if (s.storeId && storeIdCounts.get(s.storeId) === 1) {
      const matched = products.filter(
        (p) => !assigned.has(p) && p.storeId === s.storeId,
      );
      matched.forEach((p) => assigned.add(p));
      storeProducts[sIdx] = matched;
    }
  });

  // 2nd pass: For stores with duplicate non-null storeId
  storeIdCounts.forEach((count, sId) => {
    if (count > 1) {
      const matchedForId = products.filter(
        (p) => !assigned.has(p) && p.storeId === sId,
      );
      const targetStoreIndices = stores
        .map((s, idx) => (s.storeId === sId ? idx : -1))
        .filter((idx) => idx !== -1);

      const prodsPerStore = Math.max(
        1,
        Math.floor(matchedForId.length / targetStoreIndices.length),
      );
      let currentProdIdx = 0;

      targetStoreIndices.forEach((storeIdx, i) => {
        const isLast = i === targetStoreIndices.length - 1;
        const takeCount = isLast
          ? matchedForId.length - currentProdIdx
          : prodsPerStore;
        const slice = matchedForId.slice(
          currentProdIdx,
          currentProdIdx + takeCount,
        );
        slice.forEach((p) => assigned.add(p));
        storeProducts[storeIdx] = slice;
        currentProdIdx += takeCount;
      });
    }
  });

  // 3rd pass: Stores that have no products assigned yet
  const unassignedStoresIndices = stores
    .map((s, idx) => (storeProducts[idx].length === 0 ? idx : -1))
    .filter((idx) => idx !== -1);

  const remainingProducts = products.filter((p) => !assigned.has(p));

  if (unassignedStoresIndices.length > 0 && remainingProducts.length > 0) {
    const prodsPerStore = Math.max(
      1,
      Math.floor(remainingProducts.length / unassignedStoresIndices.length),
    );
    let currentProdIdx = 0;

    unassignedStoresIndices.forEach((storeIdx, i) => {
      const isLast = i === unassignedStoresIndices.length - 1;
      const takeCount = isLast
        ? remainingProducts.length - currentProdIdx
        : prodsPerStore;
      const slice = remainingProducts.slice(
        currentProdIdx,
        currentProdIdx + takeCount,
      );
      slice.forEach((p) => assigned.add(p));
      storeProducts[storeIdx] = slice;
      currentProdIdx += takeCount;
    });
  }

  return storeProducts.map((prods, sIdx) =>
    prods.map((p, pIdx) => ({
      id: p.id || `p-${sIdx}-${pIdx}`,
      productId: p.productId,
      productName: p.product?.name || p.productName || "",
      notes: p.notes || "",
    })),
  );
}

export function useType2Form({
  initial = {},
  initDetails,
  customersList = [],
  selectedWorkTypes = [],
}: UseType2FormOptions): UseType2FormResult {
  const [type2Items, setType2Items] = useState<Type2ProductFollowupItem[]>(
    () => {
      if (
        initDetails?.type2Items &&
        Array.isArray(initDetails.type2Items) &&
        initDetails.type2Items.length > 0
      ) {
        return initDetails.type2Items;
      }

      // Check dedicated relation first
      if (
        initial?.type2Targets &&
        Array.isArray(initial.type2Targets) &&
        initial.type2Targets.length > 0
      ) {
        return initial.type2Targets.map((t: any, idx: number) => ({
          id: t.id || String(idx + 1),
          visitPurpose: (t.visitPurpose === "STORE" ? "STORE" : "FARMER") as "FARMER" | "STORE",
          province: t.province || initial?.province || "",
          isUnregisteredFarmer: Boolean(t.isUnregisteredFarmer),
          unregisteredFarmerName: t.unregisteredFarmerName || "",
          unregisteredFarmerPhone: t.unregisteredFarmerPhone || "",
          storeId: t.storeId || undefined,
          customerName: t.isUnregisteredFarmer
            ? t.unregisteredFarmerName || ""
            : t.store?.name || "",
          products: (t.products || []).map((p: any, pIdx: number) => ({
            id: p.id || `p-${idx}-${pIdx}`,
            productId: p.productId,
            productName: p.product?.name || "",
            notes: p.notes || "",
          })),
          detail: t.notes || "",
        }));
      }

      const type2Prods = (initial as any)?.products?.filter(
        (p: any) => p.workTypeCode === "TYPE_2",
      );
      const type2Stores = (initial as any)?.stores?.filter(
        (s: any) => s.workTypeCode === "TYPE_2",
      );

      if (
        (type2Prods && type2Prods.length > 0) ||
        (type2Stores && type2Stores.length > 0)
      ) {
        if (type2Stores && type2Stores.length > 0) {
          const allMatchedProds = matchProductsToStores(
            type2Stores,
            type2Prods || [],
          );
          return type2Stores.map((s: any, idx: number) => {
            const inferredPurpose: "FARMER" | "STORE" =
              s?.visitPurpose === "STORE"
                ? "STORE"
                : s?.visitPurpose === "FARMER"
                  ? "FARMER"
                  : ["DEALER", "SUBDEALER"].includes(s?.store?.customerType)
                    ? "STORE"
                    : "FARMER";

            const prodLines = allMatchedProds[idx] || [];
            const firstProd = prodLines[0];

            return {
              id: s?.id || String(idx + 1),
              visitPurpose: inferredPurpose,
              province: s?.province || s?.store?.province || "",
              isUnregisteredFarmer: Boolean(s?.isUnregisteredFarmer),
              unregisteredFarmerName: s?.unregisteredFarmerName || "",
              unregisteredFarmerPhone: s?.unregisteredFarmerPhone || "",
              storeId: s?.storeId || undefined,
              customerName: s?.isUnregisteredFarmer
                ? s?.unregisteredFarmerName || ""
                : s?.store?.name || s?.storeName || "",
              products:
                prodLines.length > 0
                  ? prodLines
                  : [
                      {
                        id: `p-${idx}-0`,
                        productName: "",
                        notes: "",
                      },
                    ],
              productId: firstProd?.productId,
              productName: firstProd?.productName || "",
              detail: s?.notes || "",
            };
          });
        }
      }

      return [
        {
          id: "1",
          visitPurpose: "FARMER",
          province: "",
          isUnregisteredFarmer: false,
          storeId: undefined,
          customerName: "",
          unregisteredFarmerName: "",
          unregisteredFarmerPhone: "",
          products: [{ id: "p-0-0", productName: "", notes: "" }],
          productId: undefined,
          productName: "",
          detail: "",
        },
      ];
    },
  );

  const addType2Row = () => {
    setType2Items((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        visitPurpose: "FARMER",
        province: "",
        isUnregisteredFarmer: false,
        storeId: undefined,
        customerName: "",
        unregisteredFarmerName: "",
        unregisteredFarmerPhone: "",
        products: [{ id: `p-${Date.now()}-0`, productName: "", notes: "" }],
        productId: undefined,
        productName: "",
        detail: "",
      },
    ]);
  };

  const updateType2Row = (
    id: string,
    field: keyof Type2ProductFollowupItem,
    val: any,
  ) => {
    setType2Items((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)),
    );
  };

  const deleteType2Row = (id: string) => {
    setType2Items((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((item) => item.id !== id);
    });
  };

  const validateType2 = () => {
    return validateType2FormItems({
      items: type2Items,
      customersList,
      selectedWorkTypes,
    });
  };

  const mapType2Payload = (
    customers: any[],
    products: any[],
  ) => {
    const planStores: any[] = [];
    const planProducts: any[] = [];

    type2Items.forEach((item) => {
      let resolvedStoreId = item.storeId;
      let resolvedStoreName = item.customerName;

      if (!resolvedStoreId && !item.isUnregisteredFarmer && item.customerName) {
        const found = customers.find((c) => c.name === item.customerName);
        if (found) {
          resolvedStoreId = found.id;
          resolvedStoreName = found.name;
        }
      }

      planStores.push({
        workTypeCode: "TYPE_2",
        visitPurpose: item.visitPurpose || "FARMER",
        storeId: item.isUnregisteredFarmer ? null : resolvedStoreId || null,
        storeName: item.isUnregisteredFarmer ? null : resolvedStoreName || null,
        notes: item.detail || null,
        province: item.province || null,
        isUnregisteredFarmer: Boolean(item.isUnregisteredFarmer),
        unregisteredFarmerName: item.isUnregisteredFarmer
          ? item.unregisteredFarmerName || null
          : null,
        unregisteredFarmerPhone: item.isUnregisteredFarmer
          ? item.unregisteredFarmerPhone || null
          : null,
      });

      const effectiveProducts: Type2FollowupProductLine[] =
        item.products && item.products.length > 0
          ? item.products
          : [
              {
                id: "p0",
                productId: item.productId,
                productName: item.productName || "",
                notes: "",
              },
            ];

      effectiveProducts.forEach((pLine) => {
        let pId = pLine.productId;
        let pName = pLine.productName;

        if (!pId && pName) {
          const matchedProd = products.find((p) => p.name === pName);
          if (matchedProd) {
            pId = matchedProd.id;
            pName = matchedProd.name;
          }
        }

        if (pId) {
          planProducts.push({
            workTypeCode: "TYPE_2",
            storeId: item.isUnregisteredFarmer ? null : resolvedStoreId || null,
            productId: pId,
            productName: pName || null,
            notes: pLine.notes || null,
          });
        }
      });
    });

    return { planStores, planProducts };
  };

  return {
    type2Items,
    setType2Items,
    addType2Row,
    updateType2Row,
    deleteType2Row,
    validateType2,
    mapType2Payload,
  };
}
