"use client";

import { useState, useCallback, useRef } from "react";
import type { Type13SprayingRound, Type13PlotActual } from "../../../application/validations";

export interface Type13PlotActualState {
  demoPlotId: string;
  plotName: string;
  storeId?: string;
  dealerName?: string;
  province?: string;
  district?: string;
  latitude: string;
  longitude: string;
  isNew?: boolean;
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

    // Deduplicate visits by demoPlotId to ensure each plot only appears once
    const seenPlotIds = new Set<string>();
    const uniqueHattackVisits = hattackVisits.filter((v: any) => {
      const pId = v.demoPlot?.id || v.demoPlotId;
      if (!pId) return true;
      if (seenPlotIds.has(pId)) return false;
      seenPlotIds.add(pId);
      return true;
    });

    let basePlots: Type13PlotActualState[] = [];

    if (uniqueHattackVisits.length > 0) {
      basePlots = uniqueHattackVisits.map((v: any, idx: number) => {
        const plot = v.demoPlot;
        const pProducts = (plot?.demoProducts || []).map((dp: any) => ({
          productId: dp.productId,
          productName: dp.product?.name,
          quantity: dp.quantity ? Number(dp.quantity) : undefined,
          unit: dp.unit || undefined,
        }));

        return {
          demoPlotId: plot?.id || v.demoPlotId || `plot-${idx}`,
          plotName: plot?.name || `แปลงที่ ${idx + 1}`,
          dealerName: plot?.customer?.name || undefined,
          storeId: plot?.customerId || undefined,
          province: plot?.province || undefined,
          district: plot?.district || undefined,
          latitude: plot?.latitude != null ? String(plot.latitude) : "",
          longitude: plot?.longitude != null ? String(plot.longitude) : "",
          isNew: false,
          plannedProducts: pProducts,
          sprayRounds: [],
        };
      });
    } else if (plan.type13Plots && Array.isArray(plan.type13Plots)) {
      basePlots = plan.type13Plots.map((p: any, idx: number) => ({
        demoPlotId: p.demoPlotId || p.id || `plot-${idx}`,
        plotName: p.name || `แปลงที่ ${idx + 1}`,
        dealerName: p.dealerName || undefined,
        storeId: p.storeId || undefined,
        province: p.province || undefined,
        district: p.district || undefined,
        latitude: p.latitude ? String(p.latitude) : "",
        longitude: p.longitude ? String(p.longitude) : "",
        isNew: false,
        plannedProducts: p.products || [],
        sprayRounds: [],
      }));
    }

    // 2. Hydrate existing spray rounds from parsedResult or plan.result normalized relation
    if (parsedResult || (plan as any)?.result) {
      const existingRounds: any[] =
        parsedResult?.sprayRounds && parsedResult.sprayRounds.length > 0
          ? parsedResult.sprayRounds
          : (plan as any)?.result?.sprayRounds || [];

      // Account for any plots that exist in rounds but weren't in visits
      if (existingRounds.length > 0) {
        const existingPlotIdsInBase = new Set(basePlots.map((p) => p.demoPlotId));
        const orphanPlotIds = Array.from(
          new Set(
            existingRounds
              .map((r: any) => r.demoPlotId)
              .filter((id: string) => id && !existingPlotIdsInBase.has(id)),
          ),
        );

        orphanPlotIds.forEach((pId) => {
          basePlots.push({
            demoPlotId: pId,
            plotName: `แปลงที่ ${basePlots.length + 1}`,
            isNew: false,
            latitude: "",
            longitude: "",
            sprayRounds: [],
          });
        });
      }

      const plotCoords: any[] =
        parsedResult?.type13PlotsActual && parsedResult.type13PlotsActual.length > 0
          ? parsedResult.type13PlotsActual
          : (plan?.demoPlotVisits || [])
              .filter(
                (v: any) =>
                  v.workTypeCode === "TYPE_13" ||
                  v.demoPlot?.plotType === "HATTACK",
              )
              .map((v: any) => ({
                demoPlotId: v.demoPlotId || v.demoPlot?.id,
                latitude:
                  v.demoPlot?.latitude != null ? String(v.demoPlot.latitude) : "",
                longitude:
                  v.demoPlot?.longitude != null ? String(v.demoPlot.longitude) : "",
              }))
              .filter((c: any) => c.latitude || c.longitude);

      basePlots = basePlots.map((plot) => {
        // Coords
        const matchedCoord = plotCoords.find((c: any) => c.demoPlotId === plot.demoPlotId);
        const lat =
          matchedCoord && matchedCoord.latitude != null && String(matchedCoord.latitude).trim() !== ""
            ? String(matchedCoord.latitude)
            : plot.latitude;
        const lng =
          matchedCoord && matchedCoord.longitude != null && String(matchedCoord.longitude).trim() !== ""
            ? String(matchedCoord.longitude)
            : plot.longitude;

        // Rounds
        const plotRounds = existingRounds
          .filter((r: any) => r.demoPlotId === plot.demoPlotId)
          .map((r: any) => ({
            id: r.id,
            demoPlotId: r.demoPlotId,
            roundNumber: r.roundNumber,
            sprayDate: r.sprayDate ? new Date(r.sprayDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
            sprayMethod: (r.sprayMethod === "TANK_MIXED" ? "TANK_MIXED" : "SINGLE") as "SINGLE" | "TANK_MIXED",
            sprayEquipment: r.sprayEquipment || "เครื่องยนต์พ่นยา",
            otherEquipment: r.otherEquipment || null,
            productResponse: r.productResponse || "ปกติ",
            problemDetail: r.problemDetail || null,
            products: (r.products && r.products.length > 0)
              ? r.products.map((p: any) => ({
                  productId: p.productId,
                  productName: p.productName || p.product?.name || null,
                  actualRate: p.actualRate || "",
                  quantityUsed: Number(p.quantityUsed) || 0,
                  unit: p.unit || p.product?.unit || null,
                }))
              : [
                  {
                    productId: "",
                    productName: null,
                    actualRate: "",
                    quantityUsed: 1,
                    unit: null,
                  },
                ],
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
                  products: (plot.plannedProducts && plot.plannedProducts.length > 0)
                    ? plot.plannedProducts.map((pp) => ({
                        productId: pp.productId,
                        productName: pp.productName || null,
                        actualRate: "",
                        quantityUsed: pp.quantity ? Number(pp.quantity) : 1,
                        unit: pp.unit || null,
                      }))
                    : [
                        {
                          productId: "",
                          productName: null,
                          actualRate: "",
                          quantityUsed: 1,
                          unit: null,
                        },
                      ],
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

    if (basePlots.length === 0) {
      const defaultTempId = `temp-plot-${Date.now()}-1`;
      basePlots = [
        {
          demoPlotId: defaultTempId,
          plotName: "แปลงที่ 1",
          isNew: true,
          latitude: "",
          longitude: "",
          sprayRounds: [
            {
              demoPlotId: defaultTempId,
              roundNumber: 1,
              sprayDate: new Date().toISOString().split("T")[0],
              sprayMethod: "SINGLE",
              sprayEquipment: "เครื่องยนต์พ่นยา",
              otherEquipment: null,
              productResponse: "ปกติ",
              problemDetail: null,
              products: [
                {
                  productId: "",
                  productName: null,
                  actualRate: "",
                  quantityUsed: 1,
                  unit: null,
                },
              ],
              externalProducts: [],
              attachments: [],
            },
          ],
        },
      ];
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

  // Add new plot on-the-fly (max 10)
  const addPlot = useCallback(() => {
    setPlotsActual((prev) => {
      if (prev.length >= 10) return prev;
      const nextPlotNum = prev.length + 1;
      const tempId = `temp-plot-${Date.now()}-${nextPlotNum}`;
      const newPlot: Type13PlotActualState = {
        demoPlotId: tempId,
        plotName: `แปลงที่ ${nextPlotNum}`,
        isNew: true,
        latitude: "",
        longitude: "",
        sprayRounds: [
          {
            demoPlotId: tempId,
            roundNumber: 1,
            sprayDate: new Date().toISOString().split("T")[0],
            sprayMethod: "SINGLE",
            sprayEquipment: "เครื่องยนต์พ่นยา",
            otherEquipment: null,
            productResponse: "ปกติ",
            problemDetail: null,
            products: [
              {
                productId: "",
                productName: null,
                actualRate: "",
                quantityUsed: 1,
                unit: null,
              },
            ],
            externalProducts: [],
            attachments: [],
          },
        ],
      };
      return [...prev, newPlot];
    });
  }, []);

  // Remove plot (minimum 1 plot must remain)
  const removePlot = useCallback((plotIndex: number) => {
    setPlotsActual((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, idx) => idx !== plotIndex);
    });
  }, []);

  // Update plot info (name, storeId, province, district)
  const updatePlotInfo = useCallback(
    (plotIndex: number, field: keyof Type13PlotActualState, value: any) => {
      setPlotsActual((prev) => {
        const next = [...prev];
        if (!next[plotIndex]) return prev;
        next[plotIndex] = { ...next[plotIndex], [field]: value };
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

        const defaultProducts =
          plot.plannedProducts && plot.plannedProducts.length > 0
            ? (plot.plannedProducts || []).map((pp) => ({
                productId: pp.productId,
                productName: pp.productName || null,
                actualRate: "",
                quantityUsed: pp.quantity ? Number(pp.quantity) : 1,
                unit: pp.unit || null,
              }))
            : [
                {
                  productId: "",
                  productName: null,
                  actualRate: "",
                  quantityUsed: 1,
                  unit: null,
                },
              ];

        const newRound: Type13SprayingRound = {
          demoPlotId: plot.demoPlotId,
          roundNumber: nextRoundNumber,
          sprayDate: new Date().toISOString().split("T")[0],
          sprayMethod: "SINGLE",
          sprayEquipment: "เครื่องยนต์พ่นยา",
          otherEquipment: null,
          productResponse: "ปกติ",
          problemDetail: null,
          products: defaultProducts,
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

  // Add a product line to a spray round
  const addRoundProduct = useCallback(
    (
      plotIndex: number,
      roundIndex: number,
      product?: { productId?: string; productName?: string; unit?: string },
    ) => {
      setPlotsActual((prev) => {
        const next = [...prev];
        const plot = next[plotIndex];
        const rounds = [...plot.sprayRounds];
        const round = { ...rounds[roundIndex] };
        round.products = [
          ...(round.products || []),
          {
            productId: product?.productId || "",
            productName: product?.productName || null,
            actualRate: "",
            quantityUsed: 1,
            unit: product?.unit || null,
          },
        ];
        rounds[roundIndex] = round;
        next[plotIndex] = { ...plot, sprayRounds: rounds };
        return next;
      });
    },
    [],
  );

  // Remove a product line from a spray round
  const removeRoundProduct = useCallback(
    (plotIndex: number, roundIndex: number, productIndex: number) => {
      setPlotsActual((prev) => {
        const next = [...prev];
        const plot = next[plotIndex];
        const rounds = [...plot.sprayRounds];
        const round = { ...rounds[roundIndex] };
        if (round.products.length <= 1) return prev;
        round.products = round.products.filter((_, idx) => idx !== productIndex);
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
    // 1. Existing plot GPS coordinates
    const type13PlotsActual = plotsActual
      .filter((p) => !p.isNew && !p.demoPlotId.startsWith("temp-"))
      .map((p) => ({
        demoPlotId: p.demoPlotId,
        latitude: p.latitude.trim(),
        longitude: p.longitude.trim(),
      }));

    // 2. New plots on-the-fly metadata and GPS
    const type13NewPlots = plotsActual
      .filter((p) => p.isNew || p.demoPlotId.startsWith("temp-"))
      .map((p) => ({
        clientPlotId: p.demoPlotId,
        plotName: p.plotName.trim() || `แปลงแฮตแทค`,
        storeId: p.storeId || null,
        province: p.province || null,
        district: p.district || null,
        latitude: p.latitude.trim(),
        longitude: p.longitude.trim(),
      }));

    // 3. Flatten all spray rounds across all plots
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
      type13NewPlots,
      sprayRounds,
    };
  }, [plotsActual]);

  return {
    plotsActual,
    setPlotsActual,
    hydrate,
    addPlot,
    removePlot,
    updatePlotInfo,
    updatePlotCoordinates,
    addSprayingRound,
    removeSprayingRound,
    updateRoundField,
    updateRoundProduct,
    addRoundProduct,
    removeRoundProduct,
    addExternalProduct,
    removeExternalProduct,
    updateExternalProduct,
    addRoundAttachment,
    removeRoundAttachment,
    buildType13ActualPayload,
  };
}

export default useType13ActualState;
