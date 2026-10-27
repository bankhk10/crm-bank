"use client";

import { useState, useCallback, useRef } from "react";
import type {
  Type13PlotActualState,
  Type13ActualProductState,
} from "../types/actual.types";
import type {
  Type13ImageFile,
  Type13SprayingRound,
  Type13ExternalProduct,
} from "../../shared/types";
import {
  uploadActivityPlanImageGroup,
  collectPermanentUrls,
} from "@/modules/activity/application/media/image-uploader";
import { validateType13Actual } from "../application/actual-validation";

export type { Type13ActualProductState, Type13PlotActualState };
export { validateType13Actual };

const createDefaultInitialPlot = (): Type13PlotActualState => {
  const tempId = `temp-draft-${Date.now()}`;
  return {
    clientPlotId: tempId,
    demoPlotId: null,
    plotName: "",
    storeId: "",
    dealerName: "",
    province: "",
    district: "",
    subdistrict: "",
    village: "",
    plannedPlotsCount: "",
    actualPlotsCount: "",
    applicationRate: "",
    isNew: true,
    latitude: "",
    longitude: "",
    afterSprayImages: [],
    sprayRounds: [],
  };
};

export function useType13Actual() {
  const [plotsActual, setPlotsActual] = useState<Type13PlotActualState[]>([
    createDefaultInitialPlot(),
  ]);
  const initialPlotsRef = useRef<Type13PlotActualState[]>([]);
  const planRef = useRef<any>(null);

  // Hydrate state from plan and existing actual result
  const hydrate = useCallback((plan: any, parsedResult?: any, _targets?: any) => {
    if (!plan) return;
    planRef.current = plan;

    const rawVisits = plan.demoPlotVisits || [];
    const hattackVisits = rawVisits.filter(
      (v: any) => v.demoPlot?.plotType === "HATTACK" || v.workTypeCode === "TYPE_13",
    );

    const seenPlotIds = new Set<string>();
    const uniqueHattackVisits = hattackVisits.filter((v: any) => {
      const pId = v.demoPlot?.id || v.demoPlotId;
      if (!pId) return true;
      if (seenPlotIds.has(pId)) return false;
      seenPlotIds.add(pId);
      return true;
    });

    let basePlots: Type13PlotActualState[] = [];

    const rawPlots =
      (plan.type13?.plots && Array.isArray(plan.type13.plots) && plan.type13.plots.length > 0 && plan.type13.plots) ||
      (plan.type13Plots && Array.isArray(plan.type13Plots) && plan.type13Plots.length > 0 && plan.type13Plots) ||
      (plan.type13Targets && Array.isArray(plan.type13Targets) && plan.type13Targets.length > 0 && plan.type13Targets) ||
      null;

    if (rawPlots) {
      basePlots = rawPlots.map((p: any, idx: number) => {
        const plotId = p.demoPlotId || p.demoPlot?.id || p.id || `plot-${idx}`;
        const plotName =
          p.plotName || p.name || p.demoPlot?.name || `แปลงที่ ${idx + 1}`;
        const matchedStore =
          p.store ||
          p.demoPlot?.customer ||
          (p.storeId && plan.stores?.find((s: any) => s.storeId === p.storeId)?.store) ||
          (p.demoPlot?.customerId && plan.stores?.find((s: any) => s.storeId === p.demoPlot.customerId)?.store);

        const targetResult =
          (p.results && p.results[0]) ||
          (Array.isArray(plan.type13Results) &&
            plan.type13Results.find((r: any) => r.targetId === p.id)) ||
          (Array.isArray(plan.type13Results) && plan.type13Results[idx]) ||
          p.result;

        return {
          demoPlotId: plotId,
          plotName,
          dealerName:
            p.dealerName ||
            matchedStore?.name ||
            p.demoPlot?.customer?.name ||
            undefined,
          storeId:
            p.storeId ||
            matchedStore?.id ||
            p.demoPlot?.customerId ||
            undefined,
          province:
            p.province ||
            p.demoPlot?.province ||
            matchedStore?.province ||
            undefined,
          district:
            p.district ||
            p.demoPlot?.district ||
            matchedStore?.district ||
            undefined,
          subdistrict: p.subdistrict || undefined,
          village: p.village || targetResult?.notes || undefined,
          plannedPlotsCount: p.plannedPlotsCount ?? undefined,
          actualPlotsCount: targetResult?.actualPlotsCount ?? p.actualPlotsCount ?? undefined,
          applicationRate: p.applicationRate || undefined,
          latitude:
            targetResult?.actualLatitude != null
              ? String(targetResult.actualLatitude)
              : p.latitude != null
                ? String(p.latitude)
                : p.demoPlot?.latitude != null
                  ? String(p.demoPlot.latitude)
                  : "",
          longitude:
            targetResult?.actualLongitude != null
              ? String(targetResult.actualLongitude)
              : p.longitude != null
                ? String(p.longitude)
                : p.demoPlot?.longitude != null
                  ? String(p.demoPlot.longitude)
                  : "",
          isNew: false,
          afterSprayImages: [],
          sprayRounds: [],
          products: p.products || [],
        };
      });
    } else if (uniqueHattackVisits.length > 0) {
      basePlots = uniqueHattackVisits.map((v: any, idx: number) => {
        const demo = v.demoPlot || {};
        return {
          demoPlotId: demo.id || v.demoPlotId || `plot-${idx}`,
          plotName: demo.name || `แปลงที่ ${idx + 1}`,
          dealerName: demo.customer?.name || undefined,
          storeId: demo.customerId || undefined,
          province: demo.province || undefined,
          district: demo.district || undefined,
          subdistrict: undefined,
          village: undefined,
          plannedPlotsCount: undefined,
          actualPlotsCount: undefined,
          applicationRate: undefined,
          latitude: demo.latitude != null ? String(demo.latitude) : "",
          longitude: demo.longitude != null ? String(demo.longitude) : "",
          isNew: false,
          afterSprayImages: [],
          sprayRounds: [],
        };
      });
    }

    if (basePlots.length === 0) {
      basePlots = [createDefaultInitialPlot()];
    }

    // Hydrate existing actual results if present
    const existingSprayRounds: any[] =
      (plan.type13Results && plan.type13Results.flatMap((r: any) => r.sprayRounds || [])) ||
      (plan.type13Actual && plan.type13Actual.sprayRounds) ||
      plan.result?.sprayRounds ||
      parsedResult?.sprayRounds ||
      parsedResult?.type13Actual?.sprayRounds ||
      [];

    const existingAttachments: any[] =
      (plan.type13Results && plan.type13Results.flatMap((r: any) => r.attachments || [])) ||
      (plan.type13Actual && plan.type13Actual.attachments) ||
      plan.attachments ||
      plan.result?.attachments ||
      [];

    if (existingSprayRounds.length > 0 || existingAttachments.length > 0) {
      basePlots = basePlots.map((plot) => {
        const pId = plot.demoPlotId;
        const matchedRounds = existingSprayRounds.filter(
          (r: any) =>
            (pId && r.demoPlotId === pId) ||
            (plot.clientPlotId && r.clientPlotId === plot.clientPlotId),
        );

        const matchedAtts: Type13ImageFile[] = existingAttachments
          .filter(
            (a: any) =>
              (a.workTypeCode === "TYPE_13" || a.category === "AFTER_SPRAY" || a.category === "demo_plot_after_spray") &&
              ((pId && a.demoPlotId === pId) || (plot.clientPlotId && a.clientPlotId === plot.clientPlotId)),
          )
          .map((a: any) => ({
            id: a.id,
            url: a.fileUrl || a.url,
            name: a.fileName || a.name || "ภาพหลังฉีดพ่น",
            size: a.fileSize || a.size || 0,
            type: a.mimeType || a.type || "image/jpeg",
          }));

        return {
          ...plot,
          afterSprayImages: matchedAtts.length > 0 ? matchedAtts : plot.afterSprayImages,
          sprayRounds: matchedRounds.length > 0 ? matchedRounds : plot.sprayRounds,
        };
      });
    }

    setPlotsActual(basePlots);
    initialPlotsRef.current = JSON.parse(JSON.stringify(basePlots));
  }, []);

  const addPlot = useCallback(() => {
    setPlotsActual((prev) => [...prev, createDefaultInitialPlot()]);
  }, []);

  const removePlot = useCallback((index: number) => {
    setPlotsActual((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const updatePlotField = useCallback(
    (index: number, field: keyof Type13PlotActualState, value: any) => {
      setPlotsActual((prev) =>
        prev.map((plot, i) => (i === index ? { ...plot, [field]: value } : plot)),
      );
    },
    [],
  );

  const addSprayRound = useCallback((plotIndex: number) => {
    setPlotsActual((prev) =>
      prev.map((plot, i) => {
        if (i !== plotIndex) return plot;
        const newRoundNumber = (plot.sprayRounds?.length || 0) + 1;
        const newRound: any = {
          roundNumber: newRoundNumber,
          sprayDate: new Date().toISOString().split("T")[0],
          sprayMethod: "SINGLE",
          sprayEquipment: "เครื่องยนต์พ่นยา",
          productResponse: "ปกติ",
          problemDetail: "",
          products: [],
          externalProducts: [],
          attachments: [],
        };
        return {
          ...plot,
          sprayRounds: [...(plot.sprayRounds || []), newRound],
        };
      }),
    );
  }, []);

  const removeSprayRound = useCallback(
    (plotIndex: number, roundIndex: number) => {
      setPlotsActual((prev) =>
        prev.map((plot, i) => {
          if (i !== plotIndex) return plot;
          const filtered = (plot.sprayRounds || []).filter(
            (_, rIdx) => rIdx !== roundIndex,
          );
          const renumbered = filtered.map((r, idx) => ({
            ...r,
            roundNumber: idx + 1,
          }));
          return { ...plot, sprayRounds: renumbered };
        }),
      );
    },
    [],
  );

  const updateSprayRound = useCallback(
    (plotIndex: number, roundIndex: number, field: string, value: any) => {
      setPlotsActual((prev) =>
        prev.map((plot, i) => {
          if (i !== plotIndex) return plot;
          const rounds = [...(plot.sprayRounds || [])];
          if (rounds[roundIndex]) {
            rounds[roundIndex] = { ...rounds[roundIndex], [field]: value };
          }
          return { ...plot, sprayRounds: rounds };
        }),
      );
    },
    [],
  );

  const addProductToRound = useCallback(
    (plotIndex: number, roundIndex: number, product: Type13ActualProductState) => {
      setPlotsActual((prev) =>
        prev.map((plot, i) => {
          if (i !== plotIndex) return plot;
          const rounds = [...(plot.sprayRounds || [])];
          if (rounds[roundIndex]) {
            rounds[roundIndex] = {
              ...rounds[roundIndex],
              products: [...(rounds[roundIndex].products || []), product],
            };
          }
          return { ...plot, sprayRounds: rounds };
        }),
      );
    },
    [],
  );

  const removeProductFromRound = useCallback(
    (plotIndex: number, roundIndex: number, productIndex: number) => {
      setPlotsActual((prev) =>
        prev.map((plot, i) => {
          if (i !== plotIndex) return plot;
          const rounds = [...(plot.sprayRounds || [])];
          if (rounds[roundIndex]) {
            rounds[roundIndex] = {
              ...rounds[roundIndex],
              products: (rounds[roundIndex].products || []).filter(
                (_, pIdx) => pIdx !== productIndex,
              ),
            };
          }
          return { ...plot, sprayRounds: rounds };
        }),
      );
    },
    [],
  );

  const updateProductInRound = useCallback(
    (
      plotIndex: number,
      roundIndex: number,
      productIndex: number,
      field: keyof Type13ActualProductState,
      value: any,
    ) => {
      setPlotsActual((prev) =>
        prev.map((plot, i) => {
          if (i !== plotIndex) return plot;
          const rounds = [...(plot.sprayRounds || [])];
          if (rounds[roundIndex] && rounds[roundIndex].products?.[productIndex]) {
            const prods = [...rounds[roundIndex].products];
            prods[productIndex] = { ...prods[productIndex], [field]: value };
            rounds[roundIndex] = { ...rounds[roundIndex], products: prods };
          }
          return { ...plot, sprayRounds: rounds };
        }),
      );
    },
    [],
  );

  const addExternalProductToRound = useCallback(
    (plotIndex: number, roundIndex: number, extProduct: Type13ExternalProduct) => {
      setPlotsActual((prev) =>
        prev.map((plot, i) => {
          if (i !== plotIndex) return plot;
          const rounds = [...(plot.sprayRounds || [])];
          if (rounds[roundIndex]) {
            rounds[roundIndex] = {
              ...rounds[roundIndex],
              externalProducts: [
                ...(rounds[roundIndex].externalProducts || []),
                extProduct,
              ],
            };
          }
          return { ...plot, sprayRounds: rounds };
        }),
      );
    },
    [],
  );

  const removeExternalProductFromRound = useCallback(
    (plotIndex: number, roundIndex: number, extProductIndex: number) => {
      setPlotsActual((prev) =>
        prev.map((plot, i) => {
          if (i !== plotIndex) return plot;
          const rounds = [...(plot.sprayRounds || [])];
          if (rounds[roundIndex]) {
            rounds[roundIndex] = {
              ...rounds[roundIndex],
              externalProducts: (rounds[roundIndex].externalProducts || []).filter(
                (_, epIdx) => epIdx !== extProductIndex,
              ),
            };
          }
          return { ...plot, sprayRounds: rounds };
        }),
      );
    },
    [],
  );

  const updateExternalProductInRound = useCallback(
    (
      plotIndex: number,
      roundIndex: number,
      extProductIndex: number,
      field: keyof Type13ExternalProduct,
      value: any,
    ) => {
      setPlotsActual((prev) =>
        prev.map((plot, i) => {
          if (i !== plotIndex) return plot;
          const rounds = [...(plot.sprayRounds || [])];
          if (
            rounds[roundIndex] &&
            rounds[roundIndex].externalProducts?.[extProductIndex]
          ) {
            const extProds = [...rounds[roundIndex].externalProducts];
            extProds[extProductIndex] = {
              ...extProds[extProductIndex],
              [field]: value,
            };
            rounds[roundIndex] = {
              ...rounds[roundIndex],
              externalProducts: extProds,
            };
          }
          return { ...plot, sprayRounds: rounds };
        }),
      );
    },
    [],
  );

  const addPlotAfterSprayImages = useCallback(
    (plotIndex: number, newFiles: File[]) => {
      if (!newFiles || newFiles.length === 0) return;
      const newImages: Type13ImageFile[] = newFiles.map((file, idx) => ({
        id: `local-after-spray-${Date.now()}-${idx}`,
        url: typeof window !== "undefined" ? URL.createObjectURL(file) : "",
        name: file.name,
        size: file.size,
        type: file.type,
        rawFile: file,
        file,
      }));

      setPlotsActual((prev) =>
        prev.map((plot, i) => {
          if (i !== plotIndex) return plot;
          return {
            ...plot,
            afterSprayImages: [...(plot.afterSprayImages || []), ...newImages],
          };
        }),
      );
    },
    [],
  );

  const removePlotAfterSprayImage = useCallback(
    (plotIndex: number, imageIndex: number) => {
      setPlotsActual((prev) =>
        prev.map((plot, i) => {
          if (i !== plotIndex) return plot;
          return {
            ...plot,
            afterSprayImages: (plot.afterSprayImages || []).filter(
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
    ): Promise<Type13PlotActualState[]> => {
      const updatedPlots: Type13PlotActualState[] = [];

      for (let i = 0; i < plotsActual.length; i++) {
        const plot = plotsActual[i];
        let cleanImages = plot.afterSprayImages || [];

        if (cleanImages.length > 0) {
          const res = await uploadActivityPlanImageGroup(
            planId,
            cleanImages,
            "type13",
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

  const collectPayload = useCallback(
    (plotsToCollect: Type13PlotActualState[] = plotsActual) => {
      const allRounds = plotsToCollect.flatMap((p) => p.sprayRounds || []);
      const totalPlots = plotsToCollect.length;

      return {
        type13Plots: plotsToCollect,
        type13Actual: {
          plots: plotsToCollect,
          sprayRounds: allRounds,
          totalPlots,
        },
      };
    },
    [plotsActual],
  );

  const validate = useCallback(() => {
    return validateType13Actual(plotsActual);
  }, [plotsActual]);

  return {
    plotsActual,
    setPlotsActual,
    hydrate,
    addPlot,
    removePlot,
    updatePlotField,
    addSprayRound,
    removeSprayRound,
    updateSprayRound,
    addProductToRound,
    removeProductFromRound,
    updateProductInRound,
    addExternalProductToRound,
    removeExternalProductFromRound,
    updateExternalProductInRound,
    updatePlotInfo: (index: number, field: keyof Type13PlotActualState, value: any) =>
      updatePlotField(index, field, value),
    updatePlotDealer: (
      index: number,
      storeId: string,
      dealerName?: string,
      province?: string,
      district?: string,
    ) => {
      updatePlotField(index, "storeId", storeId);
      if (dealerName) updatePlotField(index, "dealerName", dealerName);
      if (province) updatePlotField(index, "province", province);
      if (district) updatePlotField(index, "district", district);
    },
    updatePlotCoordinates: (index: number, lat: string, lng: string) => {
      updatePlotField(index, "latitude", lat);
      updatePlotField(index, "longitude", lng);
    },
    addSprayingRound: addSprayRound,
    removeSprayingRound: removeSprayRound,
    updateRoundField: (plotIdx: number, rIdx: number, field: string, val: any) =>
      updateSprayRound(plotIdx, rIdx, field, val),
    updateRoundProduct: (
      plotIdx: number,
      rIdx: number,
      pIdx: number,
      field: keyof Type13ActualProductState,
      val: any,
    ) => updateProductInRound(plotIdx, rIdx, pIdx, field, val),
    addRoundProduct: (
      plotIdx: number,
      rIdx: number,
      prod: Type13ActualProductState,
    ) => addProductToRound(plotIdx, rIdx, prod),
    removeRoundProduct: (plotIdx: number, rIdx: number, pIdx: number) =>
      removeProductFromRound(plotIdx, rIdx, pIdx),
    addExternalProduct: (
      plotIdx: number,
      rIdx: number,
      ext: Type13ExternalProduct,
    ) => addExternalProductToRound(plotIdx, rIdx, ext),
    removeExternalProduct: (plotIdx: number, rIdx: number, epIdx: number) =>
      removeExternalProductFromRound(plotIdx, rIdx, epIdx),
    updateExternalProduct: (
      plotIdx: number,
      rIdx: number,
      epIdx: number,
      field: keyof Type13ExternalProduct,
      val: any,
    ) => updateExternalProductInRound(plotIdx, rIdx, epIdx, field, val),
    addPlotAfterSprayImages,
    removePlotAfterSprayImage,
    uploadImages,
    collectPayload,
    validate,
  };
}

export const useType13ActualState = useType13Actual;
