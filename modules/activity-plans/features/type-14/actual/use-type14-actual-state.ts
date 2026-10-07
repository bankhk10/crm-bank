"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import {
  uploadActivityPlanImageGroup,
  collectPermanentUrls,
} from "../../shared/actual-view/utils";
import type { ImageFile } from "../../shared/actual-view/types";
import { getHattackPlotContextAction } from "../../../server/actions";

import type {
  Type14ActualProductState,
  Type14ImageState,
  Type14SprayRoundState,
} from "./types";
import { validateType14Actual } from "./validation";

export type {
  Type14ActualProductState,
  Type14ImageState,
  Type14SprayRoundState,
};
export { validateType14Actual };

function formatToYMD(d?: string | Date | null): string {
  if (!d) return "";
  if (typeof d === "string") {
    const trimmed = d.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    if (trimmed.includes("T")) {
      return trimmed.split("T")[0];
    }
  }
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createDefaultRound(
  roundNumber: number,
  initialProducts: any[] = [],
): Type14SprayRoundState {
  return {
    roundNumber,
    actualVisitDate: formatToYMD(new Date()),
    daysAfterSpray: "",
    trackingResult: "",
    additionalNotes: "",
    afterSprayImages: [],
    products: initialProducts.map((item) => ({
      productId: item.productId,
      productName: item.productName || item.product?.name || "",
      unit: item.unit || item.product?.unit || "ขวด",
      quantityUsed: "",
      actualRate: "",
      detail: "",
    })),
  };
}

function hasPlotActualData(rounds: Type14SprayRoundState[]): boolean {
  if (!rounds || rounds.length === 0) return false;
  if (rounds.length > 1) return true;
  const r = rounds[0];
  if (!r) return false;
  if (r.trackingResult && r.trackingResult.trim() !== "") return true;
  if (
    r.products &&
    r.products.length > 0 &&
    r.products.some(
      (p) =>
        (p.productId && p.productId.trim() !== "") ||
        (p.quantityUsed !== "" && p.quantityUsed != null) ||
        (p.actualRate && p.actualRate.trim() !== "") ||
        (p.detail && p.detail.trim() !== ""),
    )
  )
    return true;
  if (r.afterSprayImages && r.afterSprayImages.length > 0) return true;
  if (r.additionalNotes && r.additionalNotes.trim() !== "") return true;
  if (
    r.daysAfterSpray !== "" &&
    r.daysAfterSpray != null &&
    String(r.daysAfterSpray).trim() !== "" &&
    String(r.daysAfterSpray).trim() !== "0"
  )
    return true;
  return false;
}

export function useType14ActualState() {
  const [demoPlotId, setDemoPlotId] = useState<string>("");
  const demoPlotIdRef = useRef<string>("");
  demoPlotIdRef.current = demoPlotId;

  const [dealerName, setDealerName] = useState<string>("");
  const [province, setProvince] = useState<string>("");
  const [district, setDistrict] = useState<string>("");

  // Per-plot Spray Rounds map: { [plotId: string]: Type14SprayRoundState[] }
  const [plotRoundsMap, setPlotRoundsMap] = useState<
    Record<string, Type14SprayRoundState[]>
  >({
    default: [createDefaultRound(1)],
  });
  const plotRoundsMapRef = useRef<Record<string, Type14SprayRoundState[]>>({
    default: [createDefaultRound(1)],
  });
  plotRoundsMapRef.current = plotRoundsMap;

  // Active rounds for currently selected demoPlotId
  const rounds = useMemo(() => {
    const key = demoPlotId || "default";
    return plotRoundsMap[key] || [createDefaultRound(1)];
  }, [demoPlotId, plotRoundsMap]);

  // Available plots under this Activity & Read-only Spray History
  const [availablePlots, setAvailablePlots] = useState<any[]>([]);
  const availablePlotsRef = useRef<any[]>([]);
  availablePlotsRef.current = availablePlots;

  const [sprayHistory, setSprayHistory] = useState<any[]>([]);
  const [loadingPlotContext, setLoadingPlotContext] = useState<boolean>(false);

  const initialImagesRef = useRef<Type14ImageState[]>([]);
  const planRef = useRef<any>(null);

  // Set selected plot and load plot context (Spray History)
  const handleSelectPlot = useCallback(
    async (plotId: string, plotObj?: any) => {
      setDemoPlotId(plotId);
      demoPlotIdRef.current = plotId;

      // Ensure rounds exist for this plot in plotRoundsMap
      if (plotId) {
        setPlotRoundsMap((prev) => {
          if (prev[plotId] && prev[plotId].length > 0) return prev;
          const refRounds = plotRoundsMapRef.current[plotId];
          if (refRounds && refRounds.length > 0) {
            return {
              ...prev,
              [plotId]: refRounds,
            };
          }
          return {
            ...prev,
            [plotId]: prev["default"] || [createDefaultRound(1)],
          };
        });
      }

      if (plotObj) {
        setDealerName(
          plotObj.dealerName ||
            plotObj.customer?.name ||
            plotObj.dealerCustomer?.name ||
            "",
        );
        setProvince(plotObj.province || "");
        setDistrict(plotObj.district || "");
      }

      if (!plotId) {
        setSprayHistory([]);
        return;
      }

      setLoadingPlotContext(true);
      try {
        const res = await getHattackPlotContextAction(
          plotId,
          planRef.current?.id,
        );
        if (res.success) {
          if (res.plot) {
            if (!plotObj?.dealerName && res.plot.dealerName) {
              setDealerName(res.plot.dealerName);
            }
            if (!plotObj?.province && res.plot.province) {
              setProvince(res.plot.province);
            }
            if (!plotObj?.district && res.plot.district) {
              setDistrict(res.plot.district);
            }
          }

          // Set read-only spray history (Section 1.5)
          setSprayHistory(res.sprayHistory || []);
        }
      } catch (err) {
        console.error("Failed to load plot context:", err);
      } finally {
        setLoadingPlotContext(false);
      }
    },
    [],
  );

  // Helper to update rounds for the currently active plot
  const setRoundsForCurrentPlot = useCallback(
    (updater: (prev: Type14SprayRoundState[]) => Type14SprayRoundState[]) => {
      const key = demoPlotId || "default";
      setPlotRoundsMap((prev) => {
        const currentPlotRounds = prev[key] || [createDefaultRound(1)];
        const nextPlotRounds = updater(currentPlotRounds);
        return {
          ...prev,
          [key]: nextPlotRounds,
        };
      });
    },
    [demoPlotId],
  );

  // ── Round Management ──
  const addSprayRound = useCallback(() => {
    setRoundsForCurrentPlot((prev) => {
      const nextNum = prev.length + 1;
      const newRound = createDefaultRound(nextNum, []);
      return [...prev, newRound];
    });
  }, [setRoundsForCurrentPlot]);

  const removeSprayRound = useCallback(
    (roundIndex: number) => {
      setRoundsForCurrentPlot((prev) => {
        if (prev.length <= 1) return prev;
        const next = prev.filter((_, idx) => idx !== roundIndex);
        return next.map((r, idx) => ({
          ...r,
          roundNumber: idx + 1,
        }));
      });
    },
    [setRoundsForCurrentPlot],
  );

  const updateRoundField = useCallback(
    (
      roundIndex: number,
      field: "actualVisitDate" | "daysAfterSpray" | "trackingResult" | "additionalNotes",
      value: any,
    ) => {
      setRoundsForCurrentPlot((prev) => {
        const next = [...prev];
        if (!next[roundIndex]) return prev;
        next[roundIndex] = { ...next[roundIndex], [field]: value };
        return next;
      });
    },
    [setRoundsForCurrentPlot],
  );

  // Product Management per Round
  const addRoundProduct = useCallback(
    (
      roundIndex: number,
      product?: { productId?: string; productName?: string; unit?: string },
    ) => {
      setRoundsForCurrentPlot((prev) => {
        const next = [...prev];
        const round = next[roundIndex];
        if (!round) return prev;
        const nextProducts: Type14ActualProductState[] = [
          ...(round.products || []),
          {
            productId: product?.productId || "",
            productName: product?.productName || "",
            unit: product?.unit || "ขวด",
            quantityUsed: "",
            actualRate: "",
            detail: "",
          },
        ];
        next[roundIndex] = { ...round, products: nextProducts };
        return next;
      });
    },
    [setRoundsForCurrentPlot],
  );

  const updateRoundProduct = useCallback(
    (
      roundIndex: number,
      productIndex: number,
      field: keyof Type14ActualProductState,
      value: any,
    ) => {
      setRoundsForCurrentPlot((prev) => {
        const next = [...prev];
        const round = next[roundIndex];
        if (!round || !round.products[productIndex]) return prev;
        const nextProducts = [...round.products];
        nextProducts[productIndex] = {
          ...nextProducts[productIndex],
          [field]: value,
        };
        next[roundIndex] = { ...round, products: nextProducts };
        return next;
      });
    },
    [setRoundsForCurrentPlot],
  );

  const removeRoundProduct = useCallback(
    (roundIndex: number, productIndex: number) => {
      setRoundsForCurrentPlot((prev) => {
        const next = [...prev];
        const round = next[roundIndex];
        if (!round) return prev;
        const nextProducts = round.products.filter(
          (_, idx) => idx !== productIndex,
        );
        next[roundIndex] = { ...round, products: nextProducts };
        return next;
      });
    },
    [setRoundsForCurrentPlot],
  );

  // Round-specific Image Management
  const addRoundAfterSprayImages = useCallback(
    (roundIndex: number, files: File[]) => {
      const toAdd: Type14ImageState[] = files.map((file) => ({
        id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        url: URL.createObjectURL(file),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
      }));
      setRoundsForCurrentPlot((prev) => {
        const next = [...prev];
        const round = next[roundIndex];
        if (!round) return prev;
        const combined = [...(round.afterSprayImages || []), ...toAdd];
        next[roundIndex] = {
          ...round,
          afterSprayImages: combined.slice(0, 5), // Max 5 images per round
        };
        return next;
      });
    },
    [setRoundsForCurrentPlot],
  );

  const removeRoundAfterSprayImage = useCallback(
    (roundIndex: number, imgIndex: number) => {
      setRoundsForCurrentPlot((prev) => {
        const next = [...prev];
        const round = next[roundIndex];
        if (!round) return prev;
        const nextImgs = round.afterSprayImages.filter(
          (_, idx) => idx !== imgIndex,
        );
        next[roundIndex] = { ...round, afterSprayImages: nextImgs };
        return next;
      });
    },
    [setRoundsForCurrentPlot],
  );

  // ── Hydration logic ──
  const hydrate = useCallback(
    (plan: any, parsedResult: any, _targets?: any) => {
      if (!plan) return;
      planRef.current = plan;

      // 1. Scoped Available Plots from this ActivityPlan
      const plotsMap = new Map<string, any>();
      (plan.demoPlotVisits || []).forEach((v: any) => {
        if (v.demoPlot) {
          plotsMap.set(v.demoPlot.id, {
            id: v.demoPlot.id,
            code: v.demoPlot.code,
            name: v.demoPlot.name,
            dealerName:
              v.demoPlot.customer?.name || v.demoPlot.dealerName || "",
            province: v.demoPlot.province || "",
            district: v.demoPlot.district || "",
            customer: v.demoPlot.customer,
          });
        }
      });
      if (plan.demoPlot && !plotsMap.has(plan.demoPlot.id)) {
        plotsMap.set(plan.demoPlot.id, {
          id: plan.demoPlot.id,
          code: plan.demoPlot.code,
          name: plan.demoPlot.name,
          dealerName: plan.demoPlot.customer?.name || "",
          province: plan.demoPlot.province || "",
          district: plan.demoPlot.district || "",
          customer: plan.demoPlot.customer,
        });
      }
      (plan.type14?.plots || plan.type14Plots || []).forEach((tp: any) => {
        if (tp.demoPlot) {
          plotsMap.set(tp.demoPlot.id, {
            id: tp.demoPlot.id,
            code: tp.demoPlot.code,
            name: tp.demoPlot.name,
            dealerName:
              tp.demoPlot.customer?.name ||
              tp.demoPlot.dealerName ||
              tp.dealerName ||
              "",
            province: tp.demoPlot.province || tp.province || "",
            district: tp.demoPlot.district || tp.district || "",
            customer: tp.demoPlot.customer,
          });
        } else if (tp.demoPlotId) {
          plotsMap.set(tp.demoPlotId, {
            id: tp.demoPlotId,
            code: tp.code || "",
            name: tp.plotName || tp.name || "แปลงแฮตแทค",
            dealerName: tp.dealerName || "",
            province: tp.province || "",
            district: tp.district || "",
          });
        }
      });
      (
        plan.result?.sprayRounds ||
        plan.activityResult?.sprayRounds ||
        parsedResult?.sprayRounds ||
        []
      ).forEach((r: any) => {
        if (r.demoPlot) {
          plotsMap.set(r.demoPlot.id, {
            id: r.demoPlot.id,
            code: r.demoPlot.code,
            name: r.demoPlot.name,
            dealerName:
              r.demoPlot.customer?.name || r.demoPlot.dealerName || "",
            province: r.demoPlot.province || "",
            district: r.demoPlot.district || "",
            customer: r.demoPlot.customer,
          });
        }
      });
      const resolvedPlots = Array.from(plotsMap.values());
      setAvailablePlots(resolvedPlots);

      // 2. Existing Result & Multiple Spray Rounds
      const resultObj =
        plan?.result ||
        plan?.activityResult ||
        plan?.details?.activityResult ||
        parsedResult;
      const rawRounds =
        resultObj?.sprayRounds &&
        Array.isArray(resultObj.sprayRounds) &&
        resultObj.sprayRounds.length > 0
          ? resultObj.sprayRounds
          : plan?.sprayRounds &&
              Array.isArray(plan.sprayRounds) &&
              plan.sprayRounds.length > 0
            ? plan.sprayRounds
            : parsedResult?.sprayRounds &&
                Array.isArray(parsedResult.sprayRounds) &&
                parsedResult.sprayRounds.length > 0
              ? parsedResult.sprayRounds
              : [];

      const allResultRounds = rawRounds.filter(
        (r: any) => !r.workTypeCode || r.workTypeCode === "TYPE_14",
      );
      const type14Rounds = allResultRounds
        .slice()
        .sort((a: any, b: any) => (a.roundNumber || 1) - (b.roundNumber || 1));

      const type14Visits = (plan.demoPlotVisits || [])
        .filter((v: any) => !v.workTypeCode || v.workTypeCode === "TYPE_14")
        .sort((a: any, b: any) => (a.visitNumber || 1) - (b.visitNumber || 1));

      // 3. Build Per-Plot Rounds Map
      const newPlotRoundsMap: Record<string, Type14SprayRoundState[]> = {};
      const allLoadedImages: Type14ImageState[] = [];

      const targetPlotsList =
        resolvedPlots.length > 0
          ? resolvedPlots
          : [{ id: "default", name: "แปลงแฮตแทค" }];

      for (const plot of targetPlotsList) {
        const plotId = plot.id;
        const matchingRounds = type14Rounds.filter(
          (r: any) =>
            r.demoPlotId === plotId ||
            (targetPlotsList.length === 1 && (!r.demoPlotId || r.demoPlotId === "default")),
        );
        const matchingVisits = type14Visits.filter(
          (v: any) =>
            v.demoPlotId === plotId ||
            (!v.demoPlotId && targetPlotsList.length === 1),
        );

        let hydratedRounds: Type14SprayRoundState[] = [];

        if (matchingRounds.length > 0) {
          hydratedRounds = matchingRounds.map((r: any, idx: number) => {
            const rNum = r.roundNumber || idx + 1;
            const rProducts: any[] = r.products || [];
            const matchingVisit = matchingVisits.find(
              (v: any) => v.visitNumber === rNum,
            );

            let resolvedDays = "";
            if (r.daysSinceStart != null && r.daysSinceStart !== "") {
              resolvedDays = String(r.daysSinceStart);
            } else if (
              matchingVisit &&
              matchingVisit.daysSinceStart != null &&
              matchingVisit.daysSinceStart !== ""
            ) {
              resolvedDays = String(matchingVisit.daysSinceStart);
            }

            // Images for this round
            const roundAttachments: any[] = [
              ...(r.attachments || []),
              ...(rNum === 1
                ? (resultObj?.attachments || []).filter(
                    (a: any) =>
                      a.workTypeCode === "TYPE_14" &&
                      (!a.sprayRoundId || a.sprayRoundId === r.id) &&
                      (!a.demoPlotId ||
                        targetPlotsList.length <= 1 ||
                        a.demoPlotId === plotId),
                  )
                : []),
            ];

            const uniqueUrls = new Set<string>();
            const roundImgs: Type14ImageState[] = [];
            roundAttachments.forEach((att: any) => {
              if (att.fileUrl && !uniqueUrls.has(att.fileUrl)) {
                uniqueUrls.add(att.fileUrl);
                const imgState: Type14ImageState = {
                  id: att.id || att.fileUrl,
                  url: att.fileUrl,
                  name: att.fileName || `type14-round${rNum}-photo.jpg`,
                  size: att.fileSize,
                  type: att.mimeType,
                };
                roundImgs.push(imgState);
                allLoadedImages.push(imgState);
              }
            });

            const productsList: Type14ActualProductState[] = rProducts.map(
              (p: any) => ({
                productId: p.productId,
                productName: p.productName || p.product?.name || "สินค้า",
                unit: p.unit || p.product?.unit || "ขวด",
                quantityUsed:
                  p.quantityUsed != null ? String(p.quantityUsed) : "",
                actualRate: p.actualRate ?? "",
                detail: p.detail ?? "",
              }),
            );

            return {
              id: r.id,
              roundNumber: rNum,
              actualVisitDate: r.sprayDate
                ? formatToYMD(r.sprayDate)
                : formatToYMD(matchingVisit?.visitDate) ||
                  formatToYMD(new Date()),
              daysAfterSpray: resolvedDays,
              trackingResult:
                r.productResponse || matchingVisit?.productResponse || "",
              additionalNotes: r.notes || matchingVisit?.notes || "",
              afterSprayImages: roundImgs.slice(0, 5),
              products: productsList,
            };
          });
        } else if (matchingVisits.length > 0) {
          hydratedRounds = matchingVisits.map((v: any, idx: number) => {
            const vNum = v.visitNumber || idx + 1;
            const visitAttachments = v.attachments || [];
            const roundImgs: Type14ImageState[] = [];
            visitAttachments.forEach((att: any) => {
              if (att.fileUrl) {
                const imgState: Type14ImageState = {
                  id: att.id || att.fileUrl,
                  url: att.fileUrl,
                  name: att.fileName || `type14-round${vNum}-photo.jpg`,
                  size: att.fileSize,
                  type: att.mimeType,
                };
                roundImgs.push(imgState);
                allLoadedImages.push(imgState);
              }
            });

            return {
              id: v.id,
              roundNumber: vNum,
              actualVisitDate: v.visitDate
                ? formatToYMD(v.visitDate)
                : formatToYMD(new Date()),
              daysAfterSpray:
                v.daysSinceStart != null && v.daysSinceStart !== ""
                  ? String(v.daysSinceStart)
                  : "",
              trackingResult: v.productResponse || "",
              additionalNotes: v.notes || "",
              afterSprayImages: roundImgs.slice(0, 5),
              products: [],
            };
          });
        } else {
          hydratedRounds = [createDefaultRound(1)];
        }

        newPlotRoundsMap[plotId] = hydratedRounds;
      }

      if (Object.keys(newPlotRoundsMap).length === 0) {
        newPlotRoundsMap["default"] = [createDefaultRound(1)];
      }

      plotRoundsMapRef.current = newPlotRoundsMap;
      setPlotRoundsMap(newPlotRoundsMap);
      initialImagesRef.current = JSON.parse(JSON.stringify(allLoadedImages));

      // Resolve initial active plot
      let initialPlotId = "";
      const firstRound = type14Rounds[0];
      const type14Visit = type14Visits[0] || plan.demoPlotVisits?.[0];

      if (firstRound?.demoPlotId && plotsMap.has(firstRound.demoPlotId)) {
        initialPlotId = firstRound.demoPlotId;
      } else if (type14Visit?.demoPlot?.id && plotsMap.has(type14Visit.demoPlot.id)) {
        initialPlotId = type14Visit.demoPlot.id;
      } else if (plan.demoPlot?.id && plotsMap.has(plan.demoPlot.id)) {
        initialPlotId = plan.demoPlot.id;
      } else if (plan.type14?.plots?.[0]?.demoPlotId && plotsMap.has(plan.type14.plots[0].demoPlotId)) {
        initialPlotId = plan.type14.plots[0].demoPlotId;
      } else if (resolvedPlots.length > 0) {
        initialPlotId = resolvedPlots[0].id;
      }

      if (initialPlotId) {
        setDemoPlotId(initialPlotId);
        const selectedPlotObj =
          plotsMap.get(initialPlotId) ||
          resolvedPlots.find((p) => p.id === initialPlotId);
        if (selectedPlotObj) {
          setDealerName(
            selectedPlotObj.dealerName ||
              selectedPlotObj.customer?.name ||
              "",
          );
          setProvince(selectedPlotObj.province || "");
          setDistrict(selectedPlotObj.district || "");
        }
        setLoadingPlotContext(true);
        getHattackPlotContextAction(initialPlotId, plan.id)
          .then((res) => {
            if (res.success) {
              if (res.plot) {
                if (!selectedPlotObj?.dealerName && res.plot.dealerName) {
                  setDealerName(res.plot.dealerName);
                }
                if (!selectedPlotObj?.province && res.plot.province) {
                  setProvince(res.plot.province);
                }
                if (!selectedPlotObj?.district && res.plot.district) {
                  setDistrict(res.plot.district);
                }
              }
              setSprayHistory(res.sprayHistory || []);
            }
          })
          .catch((err) => console.error("Failed to load plot context:", err))
          .finally(() => setLoadingPlotContext(false));
      }
    },
    [],
  );

  // ── Upload Images ──
  const uploadImages = useCallback(
    async (
      planId: string,
      newlyUploadedUrls: string[],
    ): Promise<Type14ImageState[]> => {
      const currentMap = { ...plotRoundsMapRef.current };
      const allImages: Type14ImageState[] = [];

      for (const [pId, pRounds] of Object.entries(currentMap)) {
        const updatedRounds = await Promise.all(
          pRounds.map(async (round, idx) => {
            if (!round.afterSprayImages || round.afterSprayImages.length === 0) {
              return round;
            }
            const imagesToUpload: ImageFile[] = round.afterSprayImages.map(
              (img) => ({
                id: img.id,
                url: img.url,
                name: img.name || `type14-image-${img.id}`,
                size: img.size,
                type: img.type,
                rawFile: img.file,
              }),
            );
            const res = await uploadActivityPlanImageGroup(
              planId,
              imagesToUpload,
              `type14-round-${round.roundNumber || idx + 1}`,
              pId && pId !== "default" ? pId : demoPlotId || "type14-plot",
            );
            newlyUploadedUrls.push(...res.newlyUploadedUrls);
            return {
              ...round,
              afterSprayImages: res.updatedImages.map((img) => ({
                id: img.id,
                url: img.url,
                name: img.name,
                size: img.size,
                type: img.type,
                file: img.rawFile,
              })),
            };
          }),
        );
        currentMap[pId] = updatedRounds;
        allImages.push(...updatedRounds.flatMap((r) => r.afterSprayImages));
      }

      setPlotRoundsMap(currentMap);
      return allImages;
    },
    [demoPlotId],
  );

  // Collect Old URLs to delete
  const collectOldImageUrlsToDelete = useCallback(
    (allCurrentImages?: Type14ImageState[]): string[] => {
      const initialImages: ImageFile[] = (initialImagesRef.current || []).map(
        (img) => ({
          id: img.id,
          url: img.url,
          name: img.name || "",
          size: img.size,
          type: img.type,
        }),
      );
      const initialUrls = collectPermanentUrls(initialImages);
      const currentImages =
        allCurrentImages ||
        Object.values(plotRoundsMapRef.current).flatMap((pRounds) =>
          pRounds.flatMap((r) => r.afterSprayImages),
        );
      const currentImageFiles: ImageFile[] = (currentImages || []).map(
        (img) => ({
          id: img.id,
          url: img.url,
          name: img.name || "",
          size: img.size,
          type: img.type,
        }),
      );
      const currentUrls = new Set(collectPermanentUrls(currentImageFiles));
      return initialUrls.filter((u) => !currentUrls.has(u));
    },
    [],
  );

  // Commit saved state to initial ref
  const commitSavedImages = useCallback(
    (savedImages?: Type14ImageState[]) => {
      const imgs =
        savedImages ||
        Object.values(plotRoundsMapRef.current).flatMap((pRounds) =>
          pRounds.flatMap((r) => r.afterSprayImages),
        );
      initialImagesRef.current = JSON.parse(JSON.stringify(imgs));
    },
    [],
  );

  // ── Build Payload for Submission (ALL PLOTS) ──
  const buildType14ActualPayload = useCallback(
    (_cleanImages?: Type14ImageState[]) => {
      const currentMap = plotRoundsMapRef.current;
      const targetPlots =
        availablePlots.length > 0
          ? availablePlots
          : demoPlotId
            ? [{ id: demoPlotId, name: "แปลงแฮตแทค" }]
            : [];

      if (targetPlots.length === 0 && !demoPlotId) {
        throw new Error("กรุณาเลือกแปลงที่ต้องการติดตาม");
      }

      const sprayRoundsPayload: any[] = [];

      for (const plot of targetPlots) {
        const plotId = plot.id;
        const plotRounds = currentMap[plotId] || currentMap["default"] || [];
        if (!hasPlotActualData(plotRounds)) {
          continue;
        }

        const validationRes = validateType14Actual({
          demoPlotId: plotId,
          rounds: plotRounds,
        });
        if (!validationRes.isValid) {
          throw new Error(
            `แปลง "${plot.name || plotId}": ${validationRes.error || "ข้อมูลการติดตามไม่ถูกต้อง"}`,
          );
        }

        for (const round of plotRounds) {
          const rNum = round.roundNumber;
          if (!round.actualVisitDate) {
            throw new Error(
              `แปลง "${plot.name}": กรุณาระบุวันที่ติดตามจริง ในรอบที่ ${rNum}`,
            );
          }
          if (
            round.daysAfterSpray === "" ||
            isNaN(Number(round.daysAfterSpray)) ||
            Number(round.daysAfterSpray) < 0
          ) {
            throw new Error(
              `แปลง "${plot.name}": กรุณาระบุจำนวนวันหลังฉีดพ่น (ตัวเลขตั้งแต่ 0 ขึ้นไป) ในรอบที่ ${rNum}`,
            );
          }
          if (!round.trackingResult || !round.trackingResult.trim()) {
            throw new Error(
              `แปลง "${plot.name}": กรุณากรอกผลการติดตาม ในรอบที่ ${rNum}`,
            );
          }

          const roundProductsPayload = (round.products || [])
            .filter((p) => p.productId && p.productId.trim() !== "")
            .map((p) => ({
              productId: p.productId,
              productName: p.productName,
              actualRate: p.actualRate || "-",
              quantityUsed: Number(p.quantityUsed) || 0,
              unit: p.unit,
              detail: p.detail || null,
            }));

          const roundAttachments = (round.afterSprayImages || []).map(
            (img) => ({
              fileUrl: img.url,
              fileName: img.name || `type14-round${rNum}-photo.jpg`,
              fileSize: img.size || null,
              mimeType: img.type || null,
            }),
          );

          sprayRoundsPayload.push({
            demoPlotId: plotId,
            roundNumber: rNum,
            sprayDate: new Date(round.actualVisitDate),
            sprayMethod: "FOLLOW_UP",
            sprayEquipment: "NONE",
            productResponse: round.trackingResult.trim(),
            daysSinceStart: Number(round.daysAfterSpray),
            notes: round.additionalNotes
              ? round.additionalNotes.trim()
              : null,
            workTypeCode: "TYPE_14",
            products: roundProductsPayload,
            externalProducts: [],
            attachments: roundAttachments,
          });
        }
      }

      if (sprayRoundsPayload.length === 0 && demoPlotId) {
        const plotRounds = currentMap[demoPlotId] || currentMap["default"] || [];
        if (hasPlotActualData(plotRounds)) {
          const validationRes = validateType14Actual({
            demoPlotId,
            rounds: plotRounds,
          });
          if (!validationRes.isValid) {
            throw new Error(
              validationRes.error || "ข้อมูลการติดตามแปลงไม่ถูกต้อง",
            );
          }
        }
      }

      return {
        sprayRounds: sprayRoundsPayload,
        attachments: [],
      };
    },
    [availablePlots, demoPlotId],
  );

  // Sync available plots dynamically (for Unplanned real-time synchronization)
  const syncAvailablePlots = useCallback(
    (plots: any[]) => {
      const validPlots = plots || [];
      const prevIds = (availablePlotsRef.current || [])
        .map((p) => p.id)
        .sort()
        .join(",");
      const nextIds = validPlots
        .map((p) => p.id)
        .sort()
        .join(",");

      if (prevIds === nextIds) {
        return;
      }

      availablePlotsRef.current = validPlots;
      setAvailablePlots(validPlots);

      if (validPlots.length > 0) {
        setPlotRoundsMap((prev) => {
          const next = { ...prev };
          let hasChanges = false;
          validPlots.forEach((p) => {
            if (!next[p.id] || next[p.id].length === 0) {
              next[p.id] = [createDefaultRound(1)];
              hasChanges = true;
            }
          });
          if (hasChanges) {
            plotRoundsMapRef.current = next;
            return next;
          }
          return prev;
        });

        const currentId = demoPlotIdRef.current;
        const isValidCurrent = Boolean(
          currentId && validPlots.some((p) => p.id === currentId),
        );
        const targetPlot = isValidCurrent
          ? validPlots.find((p) => p.id === currentId)
          : validPlots[0];

        if (targetPlot) {
          if (targetPlot.id !== currentId) {
            handleSelectPlot(targetPlot.id, targetPlot);
          }
        } else {
          setDemoPlotId("");
          demoPlotIdRef.current = "";
        }
      } else {
        setDemoPlotId("");
        demoPlotIdRef.current = "";
      }
    },
    [handleSelectPlot],
  );

  return {
    // Multi-round state & methods
    rounds,
    plotRoundsMap,
    addSprayRound,
    removeSprayRound,
    updateRoundField,
    addRoundProduct,
    updateRoundProduct,
    removeRoundProduct,
    addRoundAfterSprayImages,
    removeRoundAfterSprayImage,

    // Plot & context
    demoPlotId,
    dealerName,
    province,
    district,
    availablePlots,
    setAvailablePlots,
    syncAvailablePlots,
    sprayHistory,
    loadingPlotContext,
    handleSelectPlot,

    // Lifecycle & submit
    hydrate,
    uploadImages,
    collectOldImageUrlsToDelete,
    commitSavedImages,
    buildType14ActualPayload,
    validate: useCallback((): string | null => {
      const currentMap = plotRoundsMapRef.current;
      const targetPlots =
        availablePlots.length > 0
          ? availablePlots
          : demoPlotId
            ? [{ id: demoPlotId, name: "แปลงแฮตแทค" }]
            : [];
      for (const p of targetPlots) {
        const pRounds = currentMap[p.id] || currentMap["default"] || [];
        if (!hasPlotActualData(pRounds)) continue;
        const res = validateType14Actual({ demoPlotId: p.id, rounds: pRounds });
        if (!res.isValid) {
          return `แปลง "${p.name || p.id}": ${res.error || "ข้อมูลการติดตามแปลงไม่ถูกต้อง"}`;
        }
      }
      return null;
    }, [availablePlots, demoPlotId]),

    // Backwards-compatible aliases for single-round queries
    actualVisitDate: rounds[0]?.actualVisitDate || "",
    daysAfterSpray: rounds[0]?.daysAfterSpray || "",
    trackingResult: rounds[0]?.trackingResult || "",
    additionalNotes: rounds[0]?.additionalNotes || "",
    afterSprayImages: rounds.flatMap((r: Type14SprayRoundState) => r.afterSprayImages || []),
    products: rounds[0]?.products || [],
  };
}

export default useType14ActualState;

