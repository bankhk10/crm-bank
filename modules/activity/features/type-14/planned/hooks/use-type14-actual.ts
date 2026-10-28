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

const createDefaultInitialRound = (roundNumber = 1): Type14SprayRoundState => ({
  id: `temp-round-${Date.now()}-${roundNumber}`,
  roundNumber,
  actualVisitDate: new Date().toISOString().split("T")[0],
  daysAfterSpray: "",
  trackingResult: "ปกติ",
  productResponse: "ปกติ",
  additionalNotes: "",
  afterSprayImages: [],
  products: [],
});

export function useType14Actual() {
  const [rounds, setRounds] = useState<Type14SprayRoundState[]>([
    createDefaultInitialRound(1),
  ]);
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

  // Hydrate state from plan, parsedResult, or targets
  const hydrate = useCallback(
    (plan: any, parsedResult?: any, _targets?: any) => {
      if (!plan) return;
      planRef.current = plan;

      // 1. Hydrate plotsActual
      const rawPlots: any[] =
        (_targets && _targets.length > 0 && _targets) ||
        (parsedResult?.plots && parsedResult.plots.length > 0 && parsedResult.plots) ||
        (plan.type14Actual?.plots && plan.type14Actual.plots.length > 0 && plan.type14Actual.plots) ||
        (plan.type14?.plots && plan.type14.plots.length > 0 && plan.type14.plots) ||
        (plan.type14Plots && plan.type14Plots.length > 0 && plan.type14Plots) ||
        (plan.type14Targets && plan.type14Targets.length > 0 && plan.type14Targets) ||
        [];

      if (rawPlots.length > 0) {
        const mappedPlots: Type14PlotActualState[] = rawPlots.map((p: any, idx: number) => {
          const matchedTargetResult =
            (Array.isArray(plan.type14Results) &&
              (plan.type14Results.find((r: any) => r.targetId === p.id) ||
                plan.type14Results[idx])) ||
            null;

          let actualCount = p.actualPlotsCount;
          if (actualCount == null && matchedTargetResult?.additionalNotes) {
            const m = matchedTargetResult.additionalNotes.match(/จำนวนแปลงจริง:\s*(\d+)/);
            if (m) actualCount = Number(m[1]);
          }
          if (actualCount == null && p.notes) {
            const m = p.notes.match(/จำนวนแปลงจริง:\s*(\d+)/);
            if (m) actualCount = Number(m[1]);
          }
          if (actualCount == null) {
            actualCount = p.plannedPlotsCount ?? p.type13Target?.plannedPlotsCount ?? 1;
          }

          return {
            id: p.id,
            demoPlotId: p.demoPlotId || p.type13TargetId || p.id,
            type13TargetId: p.type13TargetId || p.type13Target?.id || p.demoPlotId || p.id,
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
            notes: p.notes || null,
            latitude: p.latitude ? String(p.latitude) : null,
            longitude: p.longitude ? String(p.longitude) : null,
          };
        });
        setPlotsActual(mappedPlots);
      }

      const rawRounds: any[] =
        plan.type14Actual?.rounds ||
        plan.type14Actual?.sprayRounds ||
        plan.result?.rounds ||
        plan.result?.sprayRounds ||
        parsedResult?.rounds ||
        parsedResult?.sprayRounds ||
        parsedResult?.type14Actual?.rounds ||
        [];

      const rawAttachments: any[] =
        plan.attachments || plan.result?.attachments || [];

      if (rawRounds.length > 0) {
        const mappedRounds: Type14SprayRoundState[] = rawRounds.map(
          (r: any, idx: number) => {
            const roundNum = r.roundNumber || idx + 1;
            const matchedImages = (
              r.afterSprayImages ||
              r.attachments ||
              []
            ).map((img: any, imgIdx: number) => ({
              id: img.id || `img-${roundNum}-${imgIdx + 1}`,
              url: img.url || img.fileUrl || "",
              name: img.name || img.fileName || "ภาพติดตามแปลงแฮตแทค",
              size: img.size || img.fileSize || 0,
              type: img.type || img.mimeType || "image/jpeg",
            }));

            return {
              id: r.id || `round-${roundNum}`,
              roundNumber: roundNum,
              actualVisitDate: r.actualVisitDate || r.visitDate || "",
              daysAfterSpray: String(
                r.daysAfterSpray ?? r.daysSinceStart ?? "",
              ),
              trackingResult: r.trackingResult || r.productResponse || "ปกติ",
              productResponse: r.productResponse || "ปกติ",
              additionalNotes: r.additionalNotes || r.notes || "",
              afterSprayImages: matchedImages,
              products: (r.products || []).map((p: any) => ({
                productId: p.productId,
                productName: p.productName || p.product?.name || "",
                unit: p.unit || p.product?.unit || "ขวด",
                quantityUsed: p.quantityUsed ?? p.quantity ?? "",
                actualRate: p.actualRate || p.applicationRate || "",
                detail: p.detail || "",
              })),
            };
          },
        );

        setRounds(mappedRounds);
      } else {
        // Check if demoPlotVisits exist for TYPE_14
        const t14Visits = (plan.demoPlotVisits || []).filter(
          (v: any) => v.workTypeCode === "TYPE_14",
        );

        if (t14Visits.length > 0) {
          const mappedFromVisits: Type14SprayRoundState[] = t14Visits.map(
            (v: any, idx: number) => ({
              id: v.id || `visit-${idx + 1}`,
              roundNumber: idx + 1,
              actualVisitDate: v.visitDate
                ? new Date(v.visitDate).toISOString().split("T")[0]
                : new Date().toISOString().split("T")[0],
              daysAfterSpray:
                v.daysSinceStart != null ? String(v.daysSinceStart) : "",
              trackingResult:
                v.productResponse || v.productProblemDesc || "ปกติ",
              productResponse: v.productResponse || "ปกติ",
              additionalNotes: v.notes || "",
              afterSprayImages: rawAttachments
                .filter(
                  (a: any) =>
                    a.workTypeCode === "TYPE_14" ||
                    a.category === "AFTER_SPRAY" ||
                    a.category === "TRACKING_AFTER_SPRAY",
                )
                .map((a: any) => ({
                  id: a.id,
                  url: a.fileUrl || a.url,
                  name: a.fileName || a.name || "ภาพติดตามแปลงแฮตแทค",
                  size: a.fileSize || a.size || 0,
                  type: a.mimeType || a.type || "image/jpeg",
                })),
              products: [],
            }),
          );
          setRounds(mappedFromVisits);
        } else {
          setRounds([createDefaultInitialRound(1)]);
        }
      }
    },
    [],
  );

  const addRound = useCallback(() => {
    setRounds((prev) => [...prev, createDefaultInitialRound(prev.length + 1)]);
  }, []);

  const removeRound = useCallback((roundIndex: number) => {
    setRounds((prev) => {
      if (prev.length <= 1) return prev;
      const filtered = prev.filter((_, idx) => idx !== roundIndex);
      return filtered.map((r, idx) => ({
        ...r,
        roundNumber: idx + 1,
      }));
    });
  }, []);

  const updateRoundField = useCallback(
    (roundIndex: number, field: keyof Type14SprayRoundState, value: any) => {
      setRounds((prev) =>
        prev.map((round, idx) =>
          idx === roundIndex ? { ...round, [field]: value } : round,
        ),
      );
    },
    [],
  );

  const addRoundProduct = useCallback(
    (roundIndex: number, product: Type14ActualProductState) => {
      setRounds((prev) =>
        prev.map((round, idx) => {
          if (idx !== roundIndex) return round;
          return {
            ...round,
            products: [...round.products, product],
          };
        }),
      );
    },
    [],
  );

  const removeRoundProduct = useCallback(
    (roundIndex: number, productIndex: number) => {
      setRounds((prev) =>
        prev.map((round, idx) => {
          if (idx !== roundIndex) return round;
          return {
            ...round,
            products: round.products.filter((_, pIdx) => pIdx !== productIndex),
          };
        }),
      );
    },
    [],
  );

  const updateRoundProduct = useCallback(
    (
      roundIndex: number,
      productIndex: number,
      field: keyof Type14ActualProductState,
      value: any,
    ) => {
      setRounds((prev) =>
        prev.map((round, idx) => {
          if (idx !== roundIndex) return round;
          const updatedProds = [...round.products];
          if (updatedProds[productIndex]) {
            updatedProds[productIndex] = {
              ...updatedProds[productIndex],
              [field]: value,
            };
          }
          return {
            ...round,
            products: updatedProds,
          };
        }),
      );
    },
    [],
  );

  const updateRoundProductFields = useCallback(
    (
      roundIndex: number,
      productIndex: number,
      fields: Partial<Type14ActualProductState>,
    ) => {
      setRounds((prev) =>
        prev.map((round, idx) => {
          if (idx !== roundIndex) return round;
          const updatedProds = [...round.products];
          if (updatedProds[productIndex]) {
            updatedProds[productIndex] = {
              ...updatedProds[productIndex],
              ...fields,
            };
          }
          return {
            ...round,
            products: updatedProds,
          };
        }),
      );
    },
    [],
  );

  const addRoundImages = useCallback((roundIndex: number, newFiles: File[]) => {
    if (!newFiles || newFiles.length === 0) return;
    const newImages: Type14ImageFile[] = newFiles.map((file, idx) => ({
      id: `local-t14-img-${Date.now()}-${idx}`,
      url: typeof window !== "undefined" ? URL.createObjectURL(file) : "",
      name: file.name,
      size: file.size,
      type: file.type,
      rawFile: file,
      file,
    }));

    setRounds((prev) =>
      prev.map((round, idx) => {
        if (idx !== roundIndex) return round;
        return {
          ...round,
          afterSprayImages: [...round.afterSprayImages, ...newImages],
        };
      }),
    );
  }, []);

  const removeRoundImage = useCallback(
    (roundIndex: number, imageIndex: number) => {
      setRounds((prev) =>
        prev.map((round, idx) => {
          if (idx !== roundIndex) return round;
          return {
            ...round,
            afterSprayImages: round.afterSprayImages.filter(
              (_, imgIdx) => imgIdx !== imageIndex,
            ),
          };
        }),
      );
    },
    [],
  );

  const uploadImages = useCallback(
    async (
      planId: string,
      newlyUploadedUrls: string[],
    ): Promise<Type14SprayRoundState[]> => {
      const updatedRounds: Type14SprayRoundState[] = [];

      for (let i = 0; i < rounds.length; i++) {
        const round = rounds[i];
        let cleanImages = round.afterSprayImages || [];

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

        updatedRounds.push({
          ...round,
          afterSprayImages: cleanImages,
        });
      }

      setRounds(updatedRounds);
      return updatedRounds;
    },
    [rounds],
  );

  const collectPayload = useCallback(
    (
      roundsToCollect: Type14SprayRoundState[] = rounds,
      plotsToCollect: Type14PlotActualState[] = plotsActual,
    ) => {
      const totalActualPlots = plotsToCollect.reduce(
        (sum, p) => sum + (Number(p.actualPlotsCount) || 1),
        0,
      );
      return {
        type14Actual: {
          plots: plotsToCollect,
          rounds: roundsToCollect,
          sprayRounds: roundsToCollect,
          totalRounds: roundsToCollect.length,
          totalPlots: totalActualPlots,
        },
        demoPlotsFollowedUp: totalActualPlots,
      };
    },
    [rounds, plotsActual],
  );

  const validate = useCallback(() => {
    return validateType14Actual({ rounds, plots: plotsActual });
  }, [rounds, plotsActual]);

  return {
    plotsActual,
    setPlotsActual,
    updatePlotField,
    rounds,
    setRounds,
    hydrate,
    addRound,
    removeRound,
    updateRoundField,
    addRoundProduct,
    removeRoundProduct,
    updateRoundProduct,
    updateRoundProductFields,
    addRoundImages,
    removeRoundImage,
    uploadImages,
    collectPayload,
    validate,
  };
}

export const useType14ActualState = useType14Actual;
