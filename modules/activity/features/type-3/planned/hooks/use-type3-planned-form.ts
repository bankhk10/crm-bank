import { useState, useCallback } from "react";
import type {
  Type3SalesItem,
  Type3SalesProductLine,
  Type3ValidationResult,
} from "../types/planned.types";
import type { StoreOption, ProductOption } from "../../shared/types";
import { validateType3FormItems } from "../application/planned-validation";
import { mapType3FormToPayload } from "../application/planned-mapper";

export interface UseType3PlannedFormOptions {
  initialItems?: Type3SalesItem[];
  customersList?: StoreOption[];
  productsList?: ProductOption[];
  selectedWorkTypes?: string[];
}

export type UseType3FormOptions = UseType3PlannedFormOptions;

export interface UseType3PlannedFormResult {
  type3Items: Type3SalesItem[];
  setType3Items: React.Dispatch<React.SetStateAction<Type3SalesItem[]>>;
  addType3Row: () => void;
  updateType3Row: (id: string, field: keyof Type3SalesItem, val: any) => void;
  deleteType3Row: (id: string) => void;
  addProductToRow: (rowId: string) => void;
  updateProductInRow: (
    rowId: string,
    prodId: string,
    field: keyof Type3SalesProductLine,
    val: any,
    productItem?: any,
  ) => void;
  deleteProductFromRow: (rowId: string, prodId: string) => void;
  resetType3Form: () => void;
  validateType3: () => Type3ValidationResult;
  mapType3Payload: (
    custs?: StoreOption[],
    prods?: ProductOption[],
  ) => ReturnType<typeof mapType3FormToPayload>;
  totalTargetAmount: number;
}

export type UseType3FormResult = UseType3PlannedFormResult;

export function useType3PlannedForm({
  initialItems,
  customersList = [],
  productsList = [],
  selectedWorkTypes = [],
}: UseType3PlannedFormOptions = {}): UseType3PlannedFormResult {
  const createDefaultItem = useCallback(
    (id = "1"): Type3SalesItem => ({
      id,
      customerName: "",
      isSubDealer: false,
      subDealerStore: "",
      products: [
        {
          id: `p-${id}-1`,
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
      notes: "",
    }),
    [],
  );

  const [type3Items, setType3Items] = useState<Type3SalesItem[]>(() => {
    if (initialItems && initialItems.length > 0) {
      return initialItems;
    }
    return [createDefaultItem()];
  });

  const addType3Row = useCallback(() => {
    const newId = Date.now().toString();
    setType3Items((prev) => [...prev, createDefaultItem(newId)]);
  }, [createDefaultItem]);

  const updateType3Row = useCallback(
    (id: string, field: keyof Type3SalesItem, val: any) => {
      setType3Items((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const updated: Type3SalesItem = { ...item, [field]: val };

          // If store is selected by storeId, auto-fill customerName
          if (field === "storeId") {
            const foundStore = customersList.find((c) => c.id === val);
            if (foundStore) {
              updated.customerName = foundStore.name;
            }
          }

          // If products array is updated directly, recalculate overall row totals
          if (field === "products" && Array.isArray(val)) {
            const first = val[0];
            if (first) {
              updated.productName = first.productName;
              updated.quantity = first.quantity;
              updated.unitPrice = first.unitPrice;
            }
            updated.price = val.reduce(
              (sum: number, p: Type3SalesProductLine) =>
                sum + (Number(p.quantity) || 0) * (Number(p.unitPrice) || 0),
              0,
            );
          }

          return updated;
        }),
      );
    },
    [customersList],
  );

  const deleteType3Row = useCallback((id: string) => {
    setType3Items((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      return filtered.length > 0
        ? filtered
        : [
            {
              id: Date.now().toString(),
              customerName: "",
              isSubDealer: false,
              subDealerStore: "",
              products: [
                {
                  id: `p-${Date.now()}-1`,
                  productName: "",
                  quantity: 1,
                  unitPrice: 0,
                  price: 0,
                },
              ],
            },
          ];
    });
  }, []);

  const addProductToRow = useCallback((rowId: string) => {
    setType3Items((prev) =>
      prev.map((item) => {
        if (item.id !== rowId) return item;
        const currentProducts = item.products || [];
        const newProd: Type3SalesProductLine = {
          id: `p-${rowId}-${Date.now()}`,
          productName: "",
          quantity: 1,
          unitPrice: 0,
          price: 0,
          notes: "",
        };
        const updatedProducts = [...currentProducts, newProd];
        const rowPrice = updatedProducts.reduce(
          (sum, p) => sum + (Number(p.quantity) || 0) * (Number(p.unitPrice) || 0),
          0,
        );
        return {
          ...item,
          products: updatedProducts,
          price: rowPrice,
        };
      }),
    );
  }, []);

  const updateProductInRow = useCallback(
    (
      rowId: string,
      prodId: string,
      field: keyof Type3SalesProductLine,
      val: any,
      productItem?: any,
    ) => {
      setType3Items((prev) =>
        prev.map((item) => {
          if (item.id !== rowId) return item;
          const currentProducts = item.products || [];
          const updatedProducts = currentProducts.map((p) => {
            if (p.id !== prodId) return p;
            const updatedProd = { ...p, [field]: val };

            // If productId or productName changes
            if (field === "productId" || field === "productName") {
              const matchedProd =
                productItem ||
                productsList.find((pr) => pr.id === val || pr.name === val);
              if (matchedProd) {
                updatedProd.productId = matchedProd.id;
                updatedProd.productName = matchedProd.name;
              }
            }

            if (field === "unitPrice") {
              updatedProd.isPriceOverridden = true;
            }

            const q = Number(updatedProd.quantity) || 0;
            const u = Number(updatedProd.unitPrice) || 0;
            updatedProd.price = q * u;

            return updatedProd;
          });

          const firstProd = updatedProducts[0];
          const rowPrice = updatedProducts.reduce(
            (sum, p) => sum + (Number(p.quantity) || 0) * (Number(p.unitPrice) || 0),
            0,
          );

          return {
            ...item,
            products: updatedProducts,
            productName: firstProd?.productName || item.productName,
            quantity: firstProd?.quantity || item.quantity,
            unitPrice: firstProd?.unitPrice || item.unitPrice,
            price: rowPrice,
          };
        }),
      );
    },
    [productsList],
  );

  const deleteProductFromRow = useCallback((rowId: string, prodId: string) => {
    setType3Items((prev) =>
      prev.map((item) => {
        if (item.id !== rowId) return item;
        const currentProducts = item.products || [];
        const filteredProducts = currentProducts.filter((p) => p.id !== prodId);
        const finalProducts =
          filteredProducts.length > 0
            ? filteredProducts
            : [
                {
                  id: `p-${rowId}-${Date.now()}`,
                  productName: "",
                  quantity: 1,
                  unitPrice: 0,
                  price: 0,
                },
              ];
        const firstProd = finalProducts[0];
        const rowPrice = finalProducts.reduce(
          (sum, p) => sum + (Number(p.quantity) || 0) * (Number(p.unitPrice) || 0),
          0,
        );
        return {
          ...item,
          products: finalProducts,
          productName: firstProd?.productName || "",
          quantity: firstProd?.quantity || 1,
          unitPrice: firstProd?.unitPrice || 0,
          price: rowPrice,
        };
      }),
    );
  }, []);

  const resetType3Form = useCallback(() => {
    setType3Items([createDefaultItem()]);
  }, [createDefaultItem]);

  const validateType3 = useCallback(() => {
    return validateType3FormItems({
      items: type3Items,
      customersList,
      selectedWorkTypes,
    });
  }, [type3Items, customersList, selectedWorkTypes]);

  const totalTargetAmount = type3Items.reduce(
    (sum, item) => sum + (Number(item.price) || 0),
    0,
  );

  const mapType3Payload = useCallback(
    (custs: StoreOption[] = customersList, prods: ProductOption[] = productsList) => {
      return mapType3FormToPayload(type3Items, custs, prods);
    },
    [type3Items, customersList, productsList],
  );

  return {
    type3Items,
    setType3Items,
    addType3Row,
    updateType3Row,
    deleteType3Row,
    addProductToRow,
    updateProductInRow,
    deleteProductFromRow,
    resetType3Form,
    validateType3,
    mapType3Payload,
    totalTargetAmount,
  };
}

export const useType3Form = useType3PlannedForm;
