"use client";

import { useState, useCallback, useRef } from "react";
import type { Type13SprayingRound, Type13PlotActual } from "../../../application/validations";

export interface Type13PlotActualState {
  demoPlotId: string;
  plotName: string;
  dealerName?: string;
  province?: string;
  district?: string;
  latitude: string;
  longitude: string;
  plannedProducts?: Array<{ productId: string; productName?: string; quantity?: number; unit?: string }>;
  sprayRounds: Type13SprayingRound[];
}

export function useType13ActualState() {
  const [plotsActual, setPlotsActual] = useState<Type13PlotActualState[]>([]);
  const initialPlotsRef = useRef<Type13PlotActualState[]>([]);

  // Hydrate state from plan and existing actual result
  const hydrate = useCallback((plan: any, parsedResult: any, targets?: any) => {
    if (!plan) return;

    // 1. Extract plots from demoPlotVisits or type13Plots
    const rawVisits = plan.demoPlotVisits || [];
    const hattackVisits = rawVisits.filter(
      (v: any) => v.demoPlot?.plotType === "HATTACK" || v.workTypeCode === "TYPE_13",
    );

    let basePlots: Type13PlotActualState[] = [];

    if (hattackVisits.length > 0) {
      basePlots = hattackVisits.map((v: any, idx: number) => {
        const plot = v.demoPlot;
        const pProducts = (plot?.demoProducts || []).map((dp: any) => ({
          productId: dp.productId,
          productName: dp.product?.name,
          quantity: dp.quantity ? Number(dp.quantity) : undefined,
          unit: dp.unit || undefined,
        }));

        return {
          demoPlotId: plot?.id || `plot-${idx}`,
          plotName: plot?.name || `แปลงที่ ${idx + 1}`,
          dealerName: plot?.customer?.name || undefined,
          province: plot?.province || undefined,
          district: plot?.district || undefined,
          latitude: plot?.latitude ? String(plot.latitude) : "",
          longitude: plot?.longitude ? String(plot.longitude) : "",
          plannedProducts: pProducts,
          sprayRounds: [],
        };
      });
    } else if (plan.type13Plots && Array.isArray(plan.type13Plots)) {
      basePlots = plan.type13Plots.map((p: any, idx: number) => ({
        demoPlotId: p.demoPlotId || p.id || `plot-${idx}`,
        plotName: p.name || `แปลงที่ ${idx + 1}`,
        dealerName: p.dealerName || undefined,
        province: p.province || undefined,
        district: p.district || undefined,
        latitude: p.latitude ? String(p.latitude) : "",
        longitude: p.longitude ? String(p.longitude) : "",
        plannedProducts: p.products || [],
        sprayRounds: [],
      }));
    }

    // 2. Hydrate existing spray rounds from parsedResult
    if (parsedResult) {
      const existingRounds: any[] = parsedResult.sprayRounds || [];
      const plotCoords: any[] = parsedResult.type13PlotsActual || [];

      basePlots = basePlots.map((plot) => {
        // Coords
        const matchedCoord = plotCoords.find((c) => c.demoPlotId === plot.demoPlotId);
        const lat = matchedCoord ? String(matchedCoord.latitude) : plot.latitude;
        const lng = matchedCoord ? String(matchedCoord.longitude) : plot.longitude;

        // Rounds
        const plotRounds = existingRounds
          .filter((r) => r.demoPlotId === plot.demoPlotId)
          .map((r) => ({
            id: r.id,
            demoPlotId: r.demoPlotId,
            roundNumber: r.roundNumber,
            sprayDate: r.sprayDate ? new Date(r.sprayDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
            sprayMethod: (r.sprayMethod === "TANK_MIXED" ? "TANK_MIXED" : "SINGLE") as "SINGLE" | "TANK_MIXED",
            sprayEquipment: r.sprayEquipment || "เครื่องยนต์พ่นยา",
            otherEquipment: r.otherEquipment || null,
            productResponse: r.productResponse || "ปกติ",
            problemDetail: r.problemDetail || null,
            products: (r.products || []).map((p: any) => ({
              productId: p.productId,
              productName: p.productName || null,
              actualRate: p.actualRate || "",
              quantityUsed: Number(p.quantityUsed) || 0,
              unit: p.unit || null,
            })),
            externalProducts: (r.externalProducts || []).map((ep: any) => ({
              company: ep.company || "",
              productName: ep.productName || "",
              activeIngredient: ep.activeIngredient || null,
              formula: ep.formula || "EC",
              customFormula: ep.customFormula || null,
              applicationRate: ep.applicationRate || "",
            })),
            attachments: (r.attachments || []).map((a: any) => ({
              fileUrl: a.fileUrl,
              fileName: a.fileName || "before-spray.jpg",
              fileSize: a.fileSize,
              mimeType: a.mimeType,
            })),
          }));

        // Default initial round if no rounds yet
        const defaultRounds: Type13SprayingRound[] =
          plotRounds.length > 0
            ? plotRounds
            : [
                {
                  demoPlotId: plot.demoPlotId,
                  roundNumber: 1,
                  sprayDate: new Date().toISOString().split("T")[0],
                  sprayMethod: "SINGLE",
                  sprayEquipment: "เครื่องยนต์พ่นยา",
                  otherEquipment: null,
                  productResponse: "ปกติ",
                  problemDetail: null,
                  products: (plot.plannedProducts || []).map((pp) => ({
                    productId: pp.productId,
                    productName: pp.productName || null,
                    actualRate: "",
                    quantityUsed: pp.quantity ? Number(pp.quantity) : 1,
                    unit: pp.unit || null,
                  })),
                  externalProducts: [],
                  attachments: [],
                },
              ];

        return {
          ...plot,
          latitude: lat,
          longitude: lng,
          sprayRounds: defaultRounds,
        };
      });
    }

    setPlotsActual(basePlots);
    initialPlotsRef.current = JSON.parse(JSON.stringify(basePlots));
  }, []);

  // Update plot GPS coordinates
  const updatePlotCoordinates = useCallback(
    (plotIndex: number, latitude: string, longitude: string) => {
      setPlotsActual((prev) => {
        const next = [...prev];
        next[plotIndex] = { ...next[plotIndex], latitude, longitude };
        return next;
      });
    },
    [],
  );

  // Add spraying round to a plot
  const addSprayingRound = useCallback(
    (plotIndex: number) => {
      setPlotsActual((prev) => {
        const next = [...prev];
        const plot = next[plotIndex];
        const currentRounds = plot.sprayRounds || [];
        const nextRoundNumber = currentRounds.length + 1;

        const newRound: Type13SprayingRound = {
          demoPlotId: plot.demoPlotId,
          roundNumber: nextRoundNumber,
          sprayDate: new Date().toISOString().split("T")[0],
          sprayMethod: "SINGLE",
          sprayEquipment: "เครื่องยนต์พ่นยา",
          otherEquipment: null,
          productResponse: "ปกติ",
          problemDetail: null,
          products: (plot.plannedProducts || []).map((pp) => ({
            productId: pp.productId,
            productName: pp.productName || null,
            actualRate: "",
            quantityUsed: pp.quantity ? Number(pp.quantity) : 1,
            unit: pp.unit || null,
          })),
          externalProducts: [],
          attachments: [],
        };

        next[plotIndex] = {
          ...plot,
          sprayRounds: [...currentRounds, newRound],
        };
        return next;
      });
    },
    [],
  );

  // Remove spraying round
  const removeSprayingRound = useCallback(
    (plotIndex: number, roundIndex: number) => {
      setPlotsActual((prev) => {
        const next = [...prev];
        const plot = next[plotIndex];
        if (plot.sprayRounds.length <= 1) return prev; // Keep at least 1 round
        const updatedRounds = plot.sprayRounds
          .filter((_, idx) => idx !== roundIndex)
          .map((r, idx) => ({ ...r, roundNumber: idx + 1 }));
        next[plotIndex] = { ...plot, sprayRounds: updatedRounds };
        return next;
      });
    },
    [],
  );

  // Update round field
  const updateRoundField = useCallback(
    (
      plotIndex: number,
      roundIndex: number,
      field: keyof Type13SprayingRound,
      value: any,
    ) => {
      setPlotsActual((prev) => {
        const next = [...prev];
        const plot = next[plotIndex];
        const rounds = [...plot.sprayRounds];
        rounds[roundIndex] = { ...rounds[roundIndex], [field]: value };
        next[plotIndex] = { ...plot, sprayRounds: rounds };
        return next;
      });
    },
    [],
  );

  // Update round spray product
  const updateRoundProduct = useCallback(
    (
      plotIndex: number,
      roundIndex: number,
      productIndex: number,
      field: string,
      value: any,
    ) => {
      setPlotsActual((prev) => {
        const next = [...prev];
        const plot = next[plotIndex];
        const rounds = [...plot.sprayRounds];
        const round = { ...rounds[roundIndex] };
        const prods = [...round.products];
        prods[productIndex] = { ...prods[productIndex], [field]: value };
        round.products = prods;
        rounds[roundIndex] = round;
        next[plotIndex] = { ...plot, sprayRounds: rounds };
        return next;
      });
    },
    [],
  );

  // External Chemicals (Tank-mixed)
  const addExternalProduct = useCallback(
    (plotIndex: number, roundIndex: number) => {
      setPlotsActual((prev) => {
        const next = [...prev];
        const plot = next[plotIndex];
        const rounds = [...plot.sprayRounds];
        const round = { ...rounds[roundIndex] };
        const externals = round.externalProducts || [];
        round.externalProducts = [
          ...externals,
          {
            company: "",
            productName: "",
            activeIngredient: null,
            formula: "EC",
            customFormula: null,
            applicationRate: "",
          },
        ];
        rounds[roundIndex] = round;
        next[plotIndex] = { ...plot, sprayRounds: rounds };
        return next;
      });
    },
    [],
  );

  const removeExternalProduct = useCallback(
    (plotIndex: number, roundIndex: number, extIndex: number) => {
      setPlotsActual((prev) => {
        const next = [...prev];
        const plot = next[plotIndex];
        const rounds = [...plot.sprayRounds];
        const round = { ...rounds[roundIndex] };
        round.externalProducts = (round.externalProducts || []).filter(
          (_, idx) => idx !== extIndex,
        );
        rounds[roundIndex] = round;
        next[plotIndex] = { ...plot, sprayRounds: rounds };
        return next;
      });
    },
    [],
  );

  const updateExternalProduct = useCallback(
    (
      plotIndex: number,
      roundIndex: number,
      extIndex: number,
      field: string,
      value: any,
    ) => {
      setPlotsActual((prev) => {
        const next = [...prev];
        const plot = next[plotIndex];
        const rounds = [...plot.sprayRounds];
        const round = { ...rounds[roundIndex] };
        const externals = [...(round.externalProducts || [])];
        externals[extIndex] = { ...externals[extIndex], [field]: value };
        round.externalProducts = externals;
        rounds[roundIndex] = round;
        next[plotIndex] = { ...plot, sprayRounds: rounds };
        return next;
      });
    },
    [],
  );

  // Attachments (Before spray photos - max 2 per round)
  const addRoundAttachment = useCallback(
    (
      plotIndex: number,
      roundIndex: number,
      att: { fileUrl: string; fileName?: string; fileSize?: number; mimeType?: string },
    ) => {
      setPlotsActual((prev) => {
        const next = [...prev];
        const plot = next[plotIndex];
        const rounds = [...plot.sprayRounds];
        const round = { ...rounds[roundIndex] };
        const currentAtts = round.attachments || [];
        if (currentAtts.length >= 2) return prev; // Max 2 photos per round
        round.attachments = [...currentAtts, att];
        rounds[roundIndex] = round;
        next[plotIndex] = { ...plot, sprayRounds: rounds };
        return next;
      });
    },
    [],
  );

  const removeRoundAttachment = useCallback(
    (plotIndex: number, roundIndex: number, attIndex: number) => {
      setPlotsActual((prev) => {
        const next = [...prev];
        const plot = next[plotIndex];
        const rounds = [...plot.sprayRounds];
        const round = { ...rounds[roundIndex] };
        round.attachments = (round.attachments || []).filter((_, idx) => idx !== attIndex);
        rounds[roundIndex] = round;
        next[plotIndex] = { ...plot, sprayRounds: rounds };
        return next;
      });
    },
    [],
  );

  // Build payload for submission
  const buildType13ActualPayload = useCallback(() => {
    // 1. Plot GPS coordinates
    const type13PlotsActual = plotsActual.map((p) => ({
      demoPlotId: p.demoPlotId,
      latitude: p.latitude.trim(),
      longitude: p.longitude.trim(),
    }));

    // 2. Flatten all spray rounds across all plots
    const sprayRounds: any[] = [];
    plotsActual.forEach((plot) => {
      (plot.sprayRounds || []).forEach((round) => {
        sprayRounds.push({
          demoPlotId: plot.demoPlotId,
          roundNumber: round.roundNumber,
          sprayDate: round.sprayDate,
          sprayMethod: round.sprayMethod,
          sprayEquipment: round.sprayEquipment,
          otherEquipment: round.otherEquipment,
          productResponse: round.productResponse,
          problemDetail: round.problemDetail,
          workTypeCode: "TYPE_13",
          products: round.products.map((prod) => ({
            productId: prod.productId,
            productName: prod.productName,
            actualRate: prod.actualRate,
            quantityUsed: Number(prod.quantityUsed) || 0,
            unit: prod.unit,
          })),
          externalProducts:
            round.sprayMethod === "TANK_MIXED"
              ? (round.externalProducts || []).map((ep) => ({
                  company: ep.company,
                  productName: ep.productName,
                  activeIngredient: ep.activeIngredient,
                  formula: ep.formula,
                  customFormula: ep.customFormula,
                  applicationRate: ep.applicationRate,
                }))
              : [],
          attachments: (round.attachments || []).map((att: any) => ({
            fileUrl: att.fileUrl,
            fileName: att.fileName || "before-spray.jpg",
            fileSize: att.fileSize,
            mimeType: att.mimeType,
          })),
        });
      });
    });

    return {
      type13PlotsActual,
      sprayRounds,
    };
  }, [plotsActual]);

  return {
    plotsActual,
    setPlotsActual,
    hydrate,
    updatePlotCoordinates,
    addSprayingRound,
    removeSprayingRound,
    updateRoundField,
    updateRoundProduct,
    addExternalProduct,
    removeExternalProduct,
    updateExternalProduct,
    addRoundAttachment,
    removeRoundAttachment,
    buildType13ActualPayload,
  };
}

export default useType13ActualState;
