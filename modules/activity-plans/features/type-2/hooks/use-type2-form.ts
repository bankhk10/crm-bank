import { useState } from "react";
import { DEMO_PRODUCTS } from "@/modules/activity-plans/constants";
import type {
  Type2ProductFollowupItem,
  Type2FollowupProductLine,
} from "../shared/types";
import { validateType2FormItems } from "../create/validation";

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

  // Count how many stores have each non-null storeId
  const storeIdCounts = new Map<string, number>();
  stores.forEach((s) => {
    if (s.storeId) {
      storeIdCounts.set(s.storeId, (storeIdCounts.get(s.storeId) || 0) + 1);
    }
  });

  // Track assigned products
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
  // Distribute matched products sequentially among those stores
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

  // 3rd pass: Stores that have no products assigned yet (e.g. unregistered farmers or stores where storeId didn't match)
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

  // Convert to Type2FollowupProductLine[][]
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
  productsList = [],
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

        // If only products exist without stores
        if (type2Prods && type2Prods.length > 0) {
          const prodLines: Type2FollowupProductLine[] = type2Prods.map(
            (p: any, pIdx: number) => ({
              id: p.id || `p-0-${pIdx}`,
              productId: p.productId,
              productName: p.product?.name || p.productName || "",
              notes: p.notes || "",
            }),
          );
          const firstProd = prodLines[0];
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
              products: prodLines,
              productId: firstProd?.productId,
              productName: firstProd?.productName || "",
              detail: "",
            },
          ];
        }
      }
      if (Array.isArray(initDetails) && initDetails.length > 0) {
        const items = initDetails.filter(
          (item: any) =>
            item.itemType !== "MARKETING_PRODUCT" &&
            item.itemType !== "SALES_PROMOTION" &&
            item.visitTopic !== "MARKETING_PRODUCT" &&
            item.visitTopic !== "SALES_PROMOTION" &&
            (item.followupProductName || item.itemType === "TYPE_2"),
        );
        if (items.length > 0) {
          return items.map((item: any, idx: number) => {
            const pName =
              item.followupProductName ||
              item.productName ||
              DEMO_PRODUCTS[0] ||
              "";
            const prodLines: Type2FollowupProductLine[] =
              item.products && Array.isArray(item.products) && item.products.length > 0
                ? item.products
                : [
                    {
                      id: `p-${idx}-0`,
                      productId: item.productId,
                      productName: pName,
                      notes: item.notes || "",
                    },
                  ];
            return {
              id: item.id || String(idx + 1),
              visitPurpose: (item.visitPurpose === "STORE"
                ? "STORE"
                : "FARMER") as "FARMER" | "STORE",
              province: item.province || "",
              isUnregisteredFarmer: Boolean(item.isUnregisteredFarmer),
              unregisteredFarmerName: item.unregisteredFarmerName || "",
              unregisteredFarmerPhone: item.unregisteredFarmerPhone || "",
              storeId: item.storeId,
              productId: prodLines[0]?.productId || item.productId,
              productName: prodLines[0]?.productName || pName,
              customerName: item.customerName || item.ownerName || "",
              products: prodLines,
              detail: item.detail || "",
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
          products: [
            {
              id: "p-1",
              productName: "",
              notes: "",
            },
          ],
          productName: "",
          detail: "",
        },
      ];
    },
  );

  const addType2Row = () => {
    const newItem: Type2ProductFollowupItem = {
      id: Date.now().toString(),
      visitPurpose: "FARMER",
      province: "",
      isUnregisteredFarmer: false,
      storeId: undefined,
      customerName: "",
      unregisteredFarmerName: "",
      unregisteredFarmerPhone: "",
      products: [
        {
          id: `p-${Date.now()}-0`,
          productName: "",
          notes: "",
        },
      ],
      productName: "",
      detail: "",
    };
    setType2Items((prev) => [...prev, newItem]);
  };

  const updateType2Row = (
    id: string,
    field: keyof Type2ProductFollowupItem,
    val: any,
  ) => {
    setType2Items((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: val };
        if (field === "visitPurpose") {
          if (val === "STORE") {
            updated.province = "";
            updated.storeId = undefined;
            updated.customerName = "";
            updated.isUnregisteredFarmer = false;
            updated.unregisteredFarmerName = "";
            updated.unregisteredFarmerPhone = "";
          } else if (val === "FARMER") {
            updated.storeId = undefined;
            updated.customerName = "";
          }
        }
        if (field === "isUnregisteredFarmer") {
          if (val === true) {
            updated.storeId = undefined;
            updated.customerName = "";
          } else {
            updated.unregisteredFarmerName = "";
            updated.unregisteredFarmerPhone = "";
          }
        }
        if (field === "province") {
          updated.storeId = undefined;
          updated.customerName = "";
        }
        return updated;
      }),
    );
  };

  const deleteType2Row = (id: string) => {
    setType2Items((prev) => prev.filter((item) => item.id !== id));
  };

  const validateType2 = () => {
    return validateType2FormItems({
      items: type2Items,
      customersList,
      selectedWorkTypes,
    });
  };

  const mapType2Payload = (customers: any[], products: any[]) => {
    if (!selectedWorkTypes.includes("ติดตามผลการใช้สินค้า")) {
      return { planStores: [], planProducts: [] };
    }

    const planStores: Array<{
      workTypeCode: string;
      visitPurpose: "FARMER" | "STORE";
      storeId?: string | null;
      storeName?: string | null;
      notes?: string | null;
      province?: string | null;
      isUnregisteredFarmer?: boolean;
      unregisteredFarmerName?: string | null;
      unregisteredFarmerPhone?: string | null;
    }> = [];

    const planProducts: Array<{
      workTypeCode: string;
      storeId?: string | null;
      productId: string;
      productName?: string | null;
      isPriceOverridden?: boolean;
      notes?: string | null;
    }> = [];

    type2Items.forEach((item) => {
      const purpose = item.visitPurpose === "STORE" ? "STORE" : "FARMER";
      const productLines: Type2FollowupProductLine[] =
        item.products && item.products.length > 0
          ? item.products
          : item.productName || item.productId
            ? [
                {
                  id: `p-${item.id}-0`,
                  productId: item.productId,
                  productName: item.productName || "",
                  notes: "",
                },
              ]
            : [];

      if (purpose === "STORE") {
        const sId =
          item.storeId ||
          customers.find((c) => c.name === item.customerName)?.id;
        if (sId) {
          planStores.push({
            workTypeCode: "TYPE_2",
            visitPurpose: "STORE",
            storeId: sId,
            storeName: item.customerName || null,
            notes: item.detail || null,
            province: null,
            isUnregisteredFarmer: false,
            unregisteredFarmerName: null,
            unregisteredFarmerPhone: null,
          });
        }
        productLines.forEach((p) => {
          const pId =
            p.productId ||
            products.find((prod) => prod.name === p.productName)?.id;
          if (pId) {
            planProducts.push({
              workTypeCode: "TYPE_2",
              storeId: sId || null,
              productId: pId,
              productName: p.productName || null,
              isPriceOverridden: false,
              notes: p.notes || null,
            });
          }
        });
      } else {
        // FARMER
        if (item.isUnregisteredFarmer) {
          planStores.push({
            workTypeCode: "TYPE_2",
            visitPurpose: "FARMER",
            storeId: null,
            storeName: item.unregisteredFarmerName || null,
            notes: item.detail || null,
            province: item.province || null,
            isUnregisteredFarmer: true,
            unregisteredFarmerName: item.unregisteredFarmerName || null,
            unregisteredFarmerPhone: item.unregisteredFarmerPhone || null,
          });
          productLines.forEach((p) => {
            const pId =
              p.productId ||
              products.find((prod) => prod.name === p.productName)?.id;
            if (pId) {
              planProducts.push({
                workTypeCode: "TYPE_2",
                storeId: null,
                productId: pId,
                productName: p.productName || null,
                isPriceOverridden: false,
                notes: p.notes || null,
              });
            }
          });
        } else {
          const sId =
            item.storeId ||
            customers.find((c) => c.name === item.customerName)?.id;
          if (sId) {
            planStores.push({
              workTypeCode: "TYPE_2",
              visitPurpose: "FARMER",
              storeId: sId,
              storeName: item.customerName || null,
              notes: item.detail || null,
              province: item.province || null,
              isUnregisteredFarmer: false,
              unregisteredFarmerName: null,
              unregisteredFarmerPhone: null,
            });
          }
          productLines.forEach((p) => {
            const pId =
              p.productId ||
              products.find((prod) => prod.name === p.productName)?.id;
            if (pId) {
              planProducts.push({
                workTypeCode: "TYPE_2",
                storeId: sId || null,
                productId: pId,
                productName: p.productName || null,
                isPriceOverridden: false,
                notes: p.notes || null,
              });
            }
          });
        }
      }
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
