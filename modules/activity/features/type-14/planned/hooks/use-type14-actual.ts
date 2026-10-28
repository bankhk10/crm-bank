"use client";

import { useState, useCallback, useRef } from "react";
import type {
  Type14SprayRoundState,
  Type14ActualProductState,
  Type14PlotActualState,
  Type14ImageFile,
} from "../../shared/types";
import {
  uploadActivityPlanImageGroup,
  collectPermanentUrls,
} from "@/modules/activity/application/media/image-uploader";
import { validateType14Actual } from "../application/actual-validation";

export type {
  Type14SprayRoundState,
  Type14ActualProductState,
  Type14PlotActualState,
};

const createDefaultInitialPlot = (idx = 0): Type14PlotActualState => ({
  clientPlotId: `plot-${Date.now()}-${idx}`,
  id: undefined,
  name: `แปลงที่ ${idx + 1}`,
  plotName: `แปลงที่ ${idx + 1}`,
  actualPlotsCount: 1,
  plannedPlotsCount: 1,
  daysAfterSpray: "",
  trackingResult: "ได้ผลตามเกณฑ์",
  productResponse: "ปกติ",
  additionalNotes: "",
  products: [],
  afterSprayImages: [],
});

export function useType14Actual() {
  const [plotsActual, setPlotsActual] = useState<Type14PlotActualState[]>([]);
  const planRef = useRef<any>(null);

  // Update field on a specific plot
  const updatePlotField = useCallback(
    (plotIndex: number, field: keyof Type14PlotActualState, value: any) => {
      setPlotsActual((prev) =>
        prev.map((p, idx) => (idx === plotIndex ? { ...p, [field]: value } : p)),
      );
    },
    [],
  );

  // Update a single product field within a plot
  const updatePlotProduct = useCallback(
    (
      plotIndex: number,
      prodIndex: number,
      field: keyof Type14ActualProductState,
      value: any,
      currentProds?: Type14ActualProductState[],
    ) => {
      setPlotsActual((prev) =>
        prev.map((p, idx) => {
          if (idx !== plotIndex) return p;
          const prods = [...(currentProds || p.products || [])];
          if (prods[prodIndex]) {
            prods[prodIndex] = {
              ...prods[prodIndex],
              [field]: value,
            };
            if (field === "actualQuantity") {
              prods[prodIndex].quantityUsed = value;
            }
          }
          return {
            ...p,
            products: prods,
          };
        }),
      );
    },
    [],
  );

  // Update multiple product fields within a plot
  const updatePlotProductFields = useCallback(
    (
      plotIndex: number,
      prodIndex: number,
      fields: Partial<Type14ActualProductState>,
    ) => {
      setPlotsActual((prev) =>
        prev.map((p, idx) => {
          if (idx !== plotIndex) return p;
          const prods = [...(p.products || [])];
          if (prods[prodIndex]) {
            prods[prodIndex] = {
              ...prods[prodIndex],
              ...fields,
            };
          }
          return {
            ...p,
            products: prods,
          };
        }),
      );
    },
    [],
  );

  // Add a product to a plot
  const addPlotProduct = useCallback(
    (plotIndex: number, product: Type14ActualProductState) => {
      setPlotsActual((prev) =>
        prev.map((p, idx) => {
          if (idx !== plotIndex) return p;
          return {
            ...p,
            products: [...(p.products || []), product],
          };
        }),
      );
    },
    [],
  );

  // Remove a product from a plot
  const removePlotProduct = useCallback(
    (plotIndex: number, prodIndex: number) => {
      setPlotsActual((prev) =>
        prev.map((p, idx) => {
          if (idx !== plotIndex) return p;
          return {
            ...p,
            products: (p.products || []).filter((_, i) => i !== prodIndex),
          };
        }),
      );
    },
    [],
  );

  // Hydrate state from plan, parsedResult, or targets
  const hydrate = useCallback(
    (plan: any, parsedResult?: any, _targets?: any) => {
      if (!plan) return;
      planRef.current = plan;

      // 1. Resolve raw candidate plots
      const rawPlots: any[] =
        (_targets && _targets.length > 0 && _targets) ||
        (parsedResult?.plots && parsedResult.plots.length > 0 && parsedResult.plots) ||
        (plan.type14Actual?.plots && plan.type14Actual.plots.length > 0 && plan.type14Actual.plots) ||
        (plan.type14?.plots && plan.type14.plots.length > 0 && plan.type14.plots) ||
        (plan.type14Plots && plan.type14Plots.length > 0 && plan.type14Plots) ||
        (plan.type14Targets && plan.type14Targets.length > 0 && plan.type14Targets) ||
        [];

      const rawAttachments: any[] =
        plan.attachments || plan.result?.attachments || [];

      // Collect all candidate results from dedicated relation or payload
      const candidateResults: any[] = [
        ...(Array.isArray(plan.type14Results) ? plan.type14Results : []),
        ...(Array.isArray(plan.result?.type14Results) ? plan.result.type14Results : []),
        ...(Array.isArray(parsedResult?.type14Results) ? parsedResult.type14Results : []),
      ];

      // Top-level plan products for Type 14 (if any)
      const planTopLevelProducts: any[] =
        plan.type14Products ||
        plan.type14?.products ||
        plan.products ||
        [];

      if (rawPlots.length > 0) {
        const mappedPlots: Type14PlotActualState[] = rawPlots.map((p: any, idx: number) => {
          const plotId = p.id || p.demoPlotId || p.type13TargetId || `plot-${idx}`;
          const matchedTargetResult =
            candidateResults.find(
              (r: any) =>
                (p.id && r.targetId === p.id) ||
                (p.type13TargetId && r.type13TargetId === p.type13TargetId) ||
                (p.demoPlotId && r.targetId === p.demoPlotId),
            ) ||
            candidateResults[idx] ||
            (p.results && p.results[0]) ||
            null;

          // Parse actualPlotsCount
          let actualCount = p.actualPlotsCount;
          if (actualCount == null && matchedTargetResult?.additionalNotes) {
            const m = String(matchedTargetResult.additionalNotes).match(/จำนวนแปลงจริง:\s*(\d+)/);
            if (m) actualCount = Number(m[1]);
          }
          if (actualCount == null && p.notes) {
            const m = String(p.notes).match(/จำนวนแปลงจริง:\s*(\d+)/);
            if (m) actualCount = Number(m[1]);
          }
          if (actualCount == null) {
            actualCount = p.plannedPlotsCount ?? p.type13Target?.plannedPlotsCount ?? 1;
          }

          // Parse daysAfterSpray
          const daysAfter =
            p.daysAfterSpray != null
              ? String(p.daysAfterSpray)
              : matchedTargetResult?.daysAfterSpray != null
                ? String(matchedTargetResult.daysAfterSpray)
                : "";

          // Parse trackingResult
          const trackingRes =
            p.trackingResult ||
            matchedTargetResult?.trackingResult ||
            matchedTargetResult?.productResponse ||
            "ได้ผลตามเกณฑ์";

          // Parse productResponse
          const prodResponse =
            p.productResponse ||
            matchedTargetResult?.productResponse ||
            "ปกติ";

          // Parse additionalNotes (strip internal tags)
          const notesText =
            p.additionalNotes ||
            (matchedTargetResult?.additionalNotes
              ? String(matchedTargetResult.additionalNotes)
                  .replace(/\[จำนวนแปลงจริง:\s*\d+\]/g, "")
                  .trim()
              : "") ||
            "";

          // Parse attachments for this plot
          const matchedAttachments = rawAttachments.filter((att: any) => {
            if (att.workTypeCode && att.workTypeCode !== "TYPE_14" && att.workTypeCode !== "type14") {
              return false;
            }
            if (matchedTargetResult?.id && att.type14ResultId === matchedTargetResult.id) {
              return true;
            }
            if (p.id && att.targetId === p.id) {
              return true;
            }
            if (rawPlots.length === 1) {
              return true;
            }
            return false;
          });

          const afterSprayImages: Type14ImageFile[] = (
            p.afterSprayImages ||
            matchedTargetResult?.attachments ||
            matchedAttachments
          ).map((img: any, imgIdx: number) => ({
            id: img.id || `img-${idx}-${imgIdx + 1}`,
            url: img.url || img.fileUrl || "",
            name: img.name || img.fileName || "รูปภาพหลังติดตามแปลง",
            size: img.size || img.fileSize || 0,
            type: img.type || img.mimeType || "image/jpeg",
          }));

          // Parse products for this plot
          const rawTargetProducts: any[] =
            (p.withdrawnProducts && p.withdrawnProducts.length > 0 && p.withdrawnProducts) ||
            (p.products && p.products.length > 0 && p.products) ||
            (p.type13Target?.products && p.type13Target.products.length > 0 && p.type13Target.products) ||
            (planTopLevelProducts.length > 0 && planTopLevelProducts) ||
            [];

          const existingProductsUsed: any[] =
            matchedTargetResult?.productsUsed ||
            (rawPlots.length === 1
              ? candidateResults.flatMap((r) => r.productsUsed || [])
              : []);

          const effectiveProducts: Type14ActualProductState[] = rawTargetProducts.map(
            (tp: any, pIdx: number) => {
              const pId = tp.productId || tp.product?.id || tp.id;
              const pName =
                tp.productName || tp.product?.name || tp.name || "สินค้าตามแผน";
              const unit = tp.unit || tp.product?.unit || "ขวด";
              const withdrawnQty =
                tp.quantity ?? tp.withdrawnQuantity ?? tp.targetQuantity ?? 1;

              const matchedUsed =
                existingProductsUsed.find((sp: any) => sp.productId === pId) ||
                existingProductsUsed[pIdx];

              let extraQty = tp.extraQuantity || "";
              let extraU = tp.extraUnit || "ซีซี";
              if (matchedUsed?.detail) {
                const match = String(matchedUsed.detail).match(
                  /^\+(\d+(?:\.\d+)?)\s*(.*)$/,
                );
                if (match) {
                  extraQty = match[1];
                  if (match[2]) extraU = match[2];
                }
              }

              return {
                productId: pId,
                productName: pName,
                unit,
                withdrawnQuantity: withdrawnQty,
                actualQuantity:
                  matchedUsed?.quantityUsed != null
                    ? Number(matchedUsed.quantityUsed)
                    : (tp.actualQuantity ?? withdrawnQty),
                extraQuantity: extraQty,
                extraUnit: extraU,
                actualRate:
                  matchedUsed?.actualRate ||
                  tp.actualRate ||
                  tp.applicationRate ||
                  "",
                quantityUsed:
                  matchedUsed?.quantityUsed != null
                    ? Number(matchedUsed.quantityUsed)
                    : (tp.actualQuantity ?? withdrawnQty),
                detail: matchedUsed?.detail || "",
              };
            },
          );

          // If no planned products were mapped but DB already has productsUsed recorded
          if (effectiveProducts.length === 0 && existingProductsUsed.length > 0) {
            existingProductsUsed.forEach((sp: any) => {
              let extraQty = "";
              let extraU = "ซีซี";
              if (sp.detail) {
                const match = String(sp.detail).match(
                  /^\+(\d+(?:\.\d+)?)\s*(.*)$/,
                );
                if (match) {
                  extraQty = match[1];
                  if (match[2]) extraU = match[2];
                }
              }
              effectiveProducts.push({
                productId: sp.productId,
                productName: sp.productName || sp.product?.name || "สินค้า",
                unit: sp.unit || sp.product?.unit || "ขวด",
                withdrawnQuantity: sp.quantityUsed != null ? Number(sp.quantityUsed) : 1,
                actualQuantity: sp.quantityUsed != null ? Number(sp.quantityUsed) : 1,
                extraQuantity: extraQty,
                extraUnit: extraU,
                actualRate: sp.actualRate || "",
                quantityUsed: sp.quantityUsed != null ? Number(sp.quantityUsed) : 1,
                detail: sp.detail || "",
              });
            });
          }

          return {
            id: p.id,
            demoPlotId: p.demoPlotId || p.type13TargetId || plotId,
            type13TargetId: p.type13TargetId || p.type13Target?.id || p.demoPlotId || plotId,
            clientPlotId: p.clientPlotId || `t14-plot-${idx}`,
            name: p.plotName || p.name || p.type13Target?.plotName || `แปลงที่ ${idx + 1}`,
            plotName: p.plotName || p.name || p.type13Target?.plotName || `แปลงที่ ${idx + 1}`,
            storeId: p.storeId || p.type13Target?.storeId || "",
            dealerName: p.dealerName || p.type13Target?.dealerName || p.store?.name || null,
            ownerName: p.ownerName || p.type13Target?.ownerName || null,
            cropCategory: p.cropCategory || null,
            cropName: p.cropName || null,
            province: p.province || p.type13Target?.province || "",
            district: p.district || p.type13Target?.district || "",
            subdistrict: p.subdistrict || p.type13Target?.subdistrict || null,
            village: p.village || p.type13Target?.village || null,
            plannedPlotsCount: p.plannedPlotsCount ?? p.type13Target?.plannedPlotsCount ?? 1,
            actualPlotsCount: actualCount,
            daysAfterSpray: daysAfter,
            trackingResult: trackingRes,
            productResponse: prodResponse,
            additionalNotes: notesText,
            notes: p.notes || null,
            latitude: p.latitude ? String(p.latitude) : null,
            longitude: p.longitude ? String(p.longitude) : null,
            products: effectiveProducts,
            afterSprayImages,
          };
        });

        setPlotsActual(mappedPlots);
      } else {
        setPlotsActual([createDefaultInitialPlot(0)]);
      }
    },
    [],
  );

  // Upload images for all plots
  const uploadImages = useCallback(
    async (
      planId: string,
      newlyUploadedUrls: string[],
      plotsToUpload?: Type14PlotActualState[],
    ): Promise<Type14PlotActualState[]> => {
      const sourcePlots = plotsToUpload || plotsActual;
      const updatedPlots: Type14PlotActualState[] = [];

      for (let i = 0; i < sourcePlots.length; i++) {
        const plot = sourcePlots[i];
        let cleanImages = plot.afterSprayImages || [];

        if (cleanImages.length > 0) {
          const res = await uploadActivityPlanImageGroup(
            planId,
            cleanImages,
            "type14",
            "after_spray",
          );
          cleanImages = res.updatedImages;
          newlyUploadedUrls.push(...res.newlyUploadedUrls);
        }

        updatedPlots.push({
          ...plot,
          afterSprayImages: cleanImages,
        });
      }

      setPlotsActual(updatedPlots);
      return updatedPlots;
    },
    [plotsActual],
  );

  // Collect payload for actual submission
  const collectPayload = useCallback(
    (plotsToCollect: Type14PlotActualState[] = plotsActual) => {
      const totalActualPlots = plotsToCollect.reduce(
        (sum, p) => sum + (Number(p.actualPlotsCount) || 1),
        0,
      );

      // Create a compatible mapped rounds list for backwards-compatibility
      const mappedRounds: Type14SprayRoundState[] = plotsToCollect.map(
        (plot, idx) => ({
          id: plot.id || `round-${idx + 1}`,
          roundNumber: idx + 1,
          actualVisitDate: new Date().toISOString().split("T")[0],
          daysAfterSpray: String(plot.daysAfterSpray ?? ""),
          trackingResult: plot.trackingResult || "ได้ผลตามเกณฑ์",
          productResponse: plot.productResponse || "ปกติ",
          additionalNotes: plot.additionalNotes || "",
          afterSprayImages: plot.afterSprayImages || [],
          products: (plot.products || []).map((p) => ({
            productId: p.productId,
            productName: p.productName || "",
            unit: p.unit || "ขวด",
            quantityUsed: p.actualQuantity ?? p.quantityUsed ?? 1,
            actualRate: p.actualRate || "",
            detail: p.extraQuantity
              ? `+${p.extraQuantity} ${p.extraUnit || "ซีซี"}`
              : (p.detail || ""),
          })),
        }),
      );

      return {
        type14Actual: {
          plots: plotsToCollect,
          rounds: mappedRounds,
          sprayRounds: mappedRounds,
          totalRounds: plotsToCollect.length,
          totalPlots: totalActualPlots,
        },
        type14Plots: plotsToCollect,
        demoPlotsFollowedUp: totalActualPlots,
      };
    },
    [plotsActual],
  );

  const validate = useCallback(() => {
    return validateType14Actual({ plots: plotsActual });
  }, [plotsActual]);

  // Backward-compatible round helpers (so nothing breaks if referenced)
  const rounds = plotsActual.map((p, idx) => ({
    id: p.id || `round-${idx + 1}`,
    roundNumber: idx + 1,
    actualVisitDate: new Date().toISOString().split("T")[0],
    daysAfterSpray: String(p.daysAfterSpray ?? ""),
    trackingResult: p.trackingResult || "ได้ผลตามเกณฑ์",
    productResponse: p.productResponse || "ปกติ",
    additionalNotes: p.additionalNotes || "",
    afterSprayImages: p.afterSprayImages || [],
    products: (p.products || []).map((prod) => ({
      productId: prod.productId,
      productName: prod.productName || "",
      unit: prod.unit || "ขวด",
      quantityUsed: prod.actualQuantity ?? prod.quantityUsed ?? 1,
      actualRate: prod.actualRate || "",
      detail: prod.extraQuantity
        ? `+${prod.extraQuantity} ${prod.extraUnit || "ซีซี"}`
        : (prod.detail || ""),
    })),
  }));

  return {
    plotsActual,
    setPlotsActual,
    updatePlotField,
    updatePlotProduct,
    updatePlotProductFields,
    addPlotProduct,
    removePlotProduct,
    uploadImages,
    collectPayload,
    validate,
    hydrate,

    // Backward compatibility delegates
    rounds,
    setRounds: () => {},
    addRound: () => {},
    removeRound: () => {},
    updateRoundField: () => {},
    addRoundProduct: () => {},
    removeRoundProduct: () => {},
    updateRoundProduct: () => {},
    updateRoundProductFields: () => {},
    addRoundImages: () => {},
    removeRoundImage: () => {},
  };
}

export const useType14ActualState = useType14Actual;
