"use client";

import { useState } from "react";
import type {
  Type7bUnplannedItem,
  Type7bUnplannedValidationResult,
  Type7bSprayRoundState,
  Type7bBaselineProductItem,
  Type7bAdditionalProductItem,
  Type7bExternalChemicalItem,
} from "../types/unplanned.types";
import type { Type7bWithdrawnProductLine } from "../../shared/types";
import { validateType7bUnplannedItems } from "../application/unplanned-validation";
import { mapType7bUnplannedToPayload } from "../application/unplanned-mapper";

export interface UseType7bUnplannedFormOptions {
  initialItems?: Type7bUnplannedItem[];
}

export const createDefaultSprayRound = (
  roundNumber = 1,
  sprayDate = "",
): Type7bSprayRoundState => ({
  id: `round-${Date.now()}-${roundNumber}`,
  roundNumber,
  sprayDate: sprayDate || new Date().toISOString().split("T")[0],
  sprayMethod: "SINGLE",
  sprayEquipment: "เครื่องพ่นสะพายหลัง (เครื่องยนต์ / แบตเตอรี่)",
  otherEquipment: "",
  productResponse: "พืชตอบสนองดี (เห็นผลตามเป้าหมาย)",
  problemDetail: "",
  baselineProducts: [],
  additionalProducts: [],
  roundImages: [],
});

export const createDefaultType7bUnplannedItem = (id = "1"): Type7bUnplannedItem => {
  const today = new Date().toISOString().split("T")[0];
  return {
    id,
    demoPlotId: null,
    plotName: "",
    farmerName: "",
    province: "",
    district: "",
    cropCategory: "",
    cropName: "",
    areaRai: null,
    treeCount: null,
    dealerName: "",
    visitDate: today,
    daysAfterSpray: 0,
    cropImages: [],
    sprayingRounds: [createDefaultSprayRound(1, today)],
    nextSprayDate: "",
    notes: "",
    plotStatus: "IN_PROGRESS",
    cropCondition: "สมบูรณ์",
    growthStage: "",
    productResponse: "พืชตอบสนองดี (เห็นผลตามเป้าหมาย)",
    cropProblemDescription: "",
    sprayMethod: "SINGLE",
    sprayEquipment: "เครื่องพ่นสะพายหลัง (เครื่องยนต์ / แบตเตอรี่)",
    objective: "",
    hasProductWithdrawal: false,
    withdrawnProducts: [],
    photos: [],
  };
};

export function useType7bUnplannedForm(options: UseType7bUnplannedFormOptions = {}) {
  const [items, setItems] = useState<Type7bUnplannedItem[]>(() => {
    if (options.initialItems && options.initialItems.length > 0) {
      return options.initialItems.map((item) => {
        const itemRounds =
          Array.isArray(item.sprayingRounds) && item.sprayingRounds.length > 0
            ? item.sprayingRounds
            : [createDefaultSprayRound(1, item.visitDate)];
        return {
          ...item,
          visitDate: item.visitDate || new Date().toISOString().split("T")[0],
          daysAfterSpray: item.daysAfterSpray ?? 0,
          cropImages: item.cropImages || item.photos || [],
          sprayingRounds: itemRounds,
          plotStatus: item.plotStatus || "IN_PROGRESS",
        };
      });
    }
    return [createDefaultType7bUnplannedItem(Date.now().toString())];
  });

  const addItem = () => {
    const newItem = createDefaultType7bUnplannedItem(Date.now().toString());
    setItems((prev) => [...prev, newItem]);
  };

  const updateItem = (
    id: string,
    field: keyof Type7bUnplannedItem | string,
    val: any,
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: val };

        // Keep legacy fields in sync for backward compatibility
        if (field === "visitDate") {
          // If rounds sprayDate is not set or matching old visitDate, sync
          if (updated.sprayingRounds && updated.sprayingRounds[0]) {
            updated.sprayingRounds = updated.sprayingRounds.map((r, idx) =>
              idx === 0 && (!r.sprayDate || r.sprayDate === item.visitDate)
                ? { ...r, sprayDate: val }
                : r,
            );
          }
        } else if (field === "cropImages") {
          updated.photos = val;
        } else if (field === "photos") {
          updated.cropImages = val;
        }

        return updated;
      }),
    );
  };

  const deleteItem = (id: string) => {
    setItems((prev) => {
      if (prev.length <= 1) {
        return [createDefaultType7bUnplannedItem(Date.now().toString())];
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  // =========================================================================
  // Spray Rounds Actions
  // =========================================================================

  const addRound = (itemId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const currentRounds = item.sprayingRounds || [];
        const newRoundNumber = currentRounds.length + 1;
        const baseProducts = currentRounds[0]?.baselineProducts || [];
        const newRound: Type7bSprayRoundState = {
          id: `round-${Date.now()}-${newRoundNumber}`,
          roundNumber: newRoundNumber,
          sprayDate: item.visitDate || new Date().toISOString().split("T")[0],
          sprayMethod: "SINGLE",
          sprayEquipment: "เครื่องพ่นสะพายหลัง (เครื่องยนต์ / แบตเตอรี่)",
          otherEquipment: "",
          productResponse: "พืชตอบสนองดี (เห็นผลตามเป้าหมาย)",
          problemDetail: "",
          baselineProducts: baseProducts.map((p) => ({
            ...p,
            actualRate: "",
            applicationRate: "",
            actualQuantity: p.withdrawnQuantity || p.plannedQuantity || 1,
            extraQuantity: "",
          })),
          additionalProducts: [],
          roundImages: [],
        };
        return {
          ...item,
          sprayingRounds: [...currentRounds, newRound],
        };
      }),
    );
  };

  const removeRound = (itemId: string, roundIndex: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const currentRounds = item.sprayingRounds || [];
        if (currentRounds.length <= 1) return item;
        const filtered = currentRounds.filter((_, idx) => idx !== roundIndex);
        const reindexed = filtered.map((r, idx) => ({ ...r, roundNumber: idx + 1 }));
        return { ...item, sprayingRounds: reindexed };
      }),
    );
  };

  const updateRoundField = (
    itemId: string,
    roundIndex: number,
    field: string,
    value: any,
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const rounds = [...(item.sprayingRounds || [])];
        if (rounds[roundIndex]) {
          rounds[roundIndex] = { ...rounds[roundIndex], [field]: value };
        }
        return { ...item, sprayingRounds: rounds };
      }),
    );
  };

  const addBaselineProduct = (itemId: string, roundIndex: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const rounds = [...(item.sprayingRounds || [])];
        if (rounds[roundIndex]) {
          const newProd: Type7bBaselineProductItem = {
            productId: "",
            productName: "",
            withdrawnQuantity: 1,
            plannedQuantity: 1,
            actualQuantity: 1,
            quantityUsed: 1,
            extraQuantity: "",
            extraUnit: "ซีซี",
            applicationRate: "",
            actualRate: "",
            unit: "ขวด",
          };
          rounds[roundIndex] = {
            ...rounds[roundIndex],
            baselineProducts: [...(rounds[roundIndex].baselineProducts || []), newProd],
          };
        }
        return { ...item, sprayingRounds: rounds };
      }),
    );
  };

  const updateBaselineProduct = (
    itemId: string,
    roundIndex: number,
    prodIndex: number,
    field: string,
    value: any,
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const rounds = [...(item.sprayingRounds || [])];
        if (rounds[roundIndex]?.baselineProducts?.[prodIndex]) {
          const prods = [...rounds[roundIndex].baselineProducts];
          prods[prodIndex] = { ...prods[prodIndex], [field]: value };
          if (field === "actualQuantity") {
            prods[prodIndex].plannedQuantity = value;
            prods[prodIndex].quantityUsed = value;
          } else if (field === "applicationRate") {
            prods[prodIndex].actualRate = value;
          } else if (field === "actualRate") {
            prods[prodIndex].applicationRate = value;
          }
          rounds[roundIndex] = { ...rounds[roundIndex], baselineProducts: prods };
        }
        return { ...item, sprayingRounds: rounds };
      }),
    );
  };

  const removeBaselineProduct = (
    itemId: string,
    roundIndex: number,
    prodIndex: number,
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const rounds = [...(item.sprayingRounds || [])];
        if (rounds[roundIndex]) {
          const prods = (rounds[roundIndex].baselineProducts || []).filter(
            (_, idx) => idx !== prodIndex,
          );
          rounds[roundIndex] = { ...rounds[roundIndex], baselineProducts: prods };
        }
        return { ...item, sprayingRounds: rounds };
      }),
    );
  };

  const addAdditionalProduct = (itemId: string, roundIndex: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const rounds = [...(item.sprayingRounds || [])];
        if (rounds[roundIndex]) {
          const newProd: Type7bAdditionalProductItem = {
            id: `add-prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            productId: "",
            productName: "",
            actualQuantity: 1,
            quantityUsed: 1,
            extraQuantity: "",
            extraUnit: "ซีซี",
            applicationRate: "",
            actualRate: "",
            unit: "ขวด",
          };
          rounds[roundIndex] = {
            ...rounds[roundIndex],
            additionalProducts: [...(rounds[roundIndex].additionalProducts || []), newProd],
          };
        }
        return { ...item, sprayingRounds: rounds };
      }),
    );
  };

  const updateAdditionalProduct = (
    itemId: string,
    roundIndex: number,
    prodIndex: number,
    field: string,
    value: any,
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const rounds = [...(item.sprayingRounds || [])];
        if (rounds[roundIndex]?.additionalProducts?.[prodIndex]) {
          const prods = [...rounds[roundIndex].additionalProducts];
          prods[prodIndex] = { ...prods[prodIndex], [field]: value };
          if (field === "actualQuantity") {
            prods[prodIndex].quantityUsed = value;
          } else if (field === "quantityUsed") {
            prods[prodIndex].actualQuantity = value;
          } else if (field === "applicationRate") {
            prods[prodIndex].actualRate = value;
          } else if (field === "actualRate") {
            prods[prodIndex].applicationRate = value;
          }
          rounds[roundIndex] = { ...rounds[roundIndex], additionalProducts: prods };
        }
        return { ...item, sprayingRounds: rounds };
      }),
    );
  };

  const removeAdditionalProduct = (
    itemId: string,
    roundIndex: number,
    prodIndex: number,
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const rounds = [...(item.sprayingRounds || [])];
        if (rounds[roundIndex]) {
          const prods = (rounds[roundIndex].additionalProducts || []).filter(
            (_, idx) => idx !== prodIndex,
          );
          rounds[roundIndex] = { ...rounds[roundIndex], additionalProducts: prods };
        }
        return { ...item, sprayingRounds: rounds };
      }),
    );
  };

  const addExternalProduct = (itemId: string, roundIndex: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const rounds = [...(item.sprayingRounds || [])];
        if (rounds[roundIndex]) {
          const newExt: Type7bExternalChemicalItem = {
            id: `ext-prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            company: "",
            productName: "",
            activeIngredient: "",
            formula: "SL",
            customFormula: "",
            applicationRate: "",
          };
          rounds[roundIndex] = {
            ...rounds[roundIndex],
            externalProducts: [...(rounds[roundIndex].externalProducts || []), newExt],
          };
        }
        return { ...item, sprayingRounds: rounds };
      }),
    );
  };

  const updateExternalProduct = (
    itemId: string,
    roundIndex: number,
    extIndex: number,
    field: string,
    value: any,
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const rounds = [...(item.sprayingRounds || [])];
        if (rounds[roundIndex]?.externalProducts?.[extIndex]) {
          const exts = [...(rounds[roundIndex].externalProducts || [])];
          exts[extIndex] = { ...exts[extIndex], [field]: value };
          rounds[roundIndex] = { ...rounds[roundIndex], externalProducts: exts };
        }
        return { ...item, sprayingRounds: rounds };
      }),
    );
  };

  const removeExternalProduct = (
    itemId: string,
    roundIndex: number,
    extIndex: number,
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const rounds = [...(item.sprayingRounds || [])];
        if (rounds[roundIndex]) {
          const exts = (rounds[roundIndex].externalProducts || []).filter(
            (_, idx) => idx !== extIndex,
          );
          rounds[roundIndex] = { ...rounds[roundIndex], externalProducts: exts };
        }
        return { ...item, sprayingRounds: rounds };
      }),
    );
  };

  const updateRoundImages = (
    itemId: string,
    roundIndex: number,
    images: any[],
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const rounds = [...(item.sprayingRounds || [])];
        if (rounds[roundIndex]) {
          rounds[roundIndex] = { ...rounds[roundIndex], roundImages: images };
        }
        return { ...item, sprayingRounds: rounds };
      }),
    );
  };

  // Legacy Withdrawn Products Handlers (kept for backward compatibility)
  const addWithdrawnProduct = (itemId: string) => {
    const newProd: Type7bWithdrawnProductLine = {
      id: Date.now().toString(),
      productId: "",
      productName: "",
      quantity: 1,
      unit: "ขวด",
    };
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          hasProductWithdrawal: true,
          withdrawnProducts: [...(item.withdrawnProducts || []), newProd],
        };
      }),
    );
  };

  const updateWithdrawnProduct = (
    itemId: string,
    prodId: string,
    field: keyof Type7bWithdrawnProductLine,
    val: any,
    selectedProduct?: any,
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const updated = (item.withdrawnProducts || []).map((p) => {
          if (p.id !== prodId) return p;
          if (field === "productId") {
            const resolvedId = selectedProduct?.id || val;
            const resolvedName = selectedProduct?.name || p.productName || "";
            const resolvedUnit = selectedProduct?.unit || p.unit || "ขวด";
            return {
              ...p,
              productId: resolvedId,
              productName: resolvedName,
              unit: resolvedUnit,
            };
          }
          return { ...p, [field]: val };
        });
        return { ...item, withdrawnProducts: updated };
      }),
    );
  };

  const deleteWithdrawnProduct = (itemId: string, prodId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const updated = (item.withdrawnProducts || []).filter((p) => p.id !== prodId);
        return { ...item, withdrawnProducts: updated };
      }),
    );
  };

  const validate = (): Type7bUnplannedValidationResult => {
    return validateType7bUnplannedItems(items);
  };

  const mapPayload = () => {
    return mapType7bUnplannedToPayload(items);
  };

  return {
    items,
    setItems,
    addItem,
    updateItem,
    deleteItem,
    addRound,
    removeRound,
    updateRoundField,
    addBaselineProduct,
    updateBaselineProduct,
    removeBaselineProduct,
    addAdditionalProduct,
    updateAdditionalProduct,
    removeAdditionalProduct,
    addExternalProduct,
    updateExternalProduct,
    removeExternalProduct,
    updateRoundImages,
    addWithdrawnProduct,
    updateWithdrawnProduct,
    deleteWithdrawnProduct,
    validate,
    mapPayload,
  };
}
