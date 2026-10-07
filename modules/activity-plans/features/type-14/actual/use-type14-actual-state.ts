"use client";

import { useState, useCallback, useRef } from "react";
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

export function useType14ActualState() {
  const [demoPlotId, setDemoPlotId] = useState<string>("");
  const [dealerName, setDealerName] = useState<string>("");
  const [province, setProvince] = useState<string>("");
  const [district, setDistrict] = useState<string>("");

  // Multiple Spray Rounds state
  const [rounds, setRounds] = useState<Type14SprayRoundState[]>([
    createDefaultRound(1),
  ]);

  // Available plots under this Activity & Read-only Spray History
  const [availablePlots, setAvailablePlots] = useState<any[]>([]);
  const [sprayHistory, setSprayHistory] = useState<any[]>([]);
  const [loadingPlotContext, setLoadingPlotContext] = useState<boolean>(false);

  const initialImagesRef = useRef<Type14ImageState[]>([]);
  const planRef = useRef<any>(null);

  // Set selected plot and load plot context (Spray History)
  const handleSelectPlot = useCallback(
    async (plotId: string, plotObj?: any) => {
      setDemoPlotId(plotId);
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

  // ── Round Management ──
  const addSprayRound = useCallback(() => {
    setRounds((prev) => {
      const nextNum = prev.length + 1;
      const newRound = createDefaultRound(nextNum, []);
      return [...prev, newRound];
    });
  }, []);

  const removeSprayRound = useCallback((roundIndex: number) => {
    setRounds((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, idx) => idx !== roundIndex);
      return next.map((r, idx) => ({
        ...r,
        roundNumber: idx + 1,
      }));
    });
  }, []);

  const updateRoundField = useCallback(
    (
      roundIndex: number,
      field: "actualVisitDate" | "daysAfterSpray" | "trackingResult" | "additionalNotes",
      value: any,
    ) => {
      setRounds((prev) => {
        const next = [...prev];
        if (!next[roundIndex]) return prev;
        next[roundIndex] = { ...next[roundIndex], [field]: value };
        return next;
      });
    },
    [],
  );

  // Product Management per Round
  const addRoundProduct = useCallback(
    (
      roundIndex: number,
      product?: { productId?: string; productName?: string; unit?: string },
    ) => {
      setRounds((prev) => {
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
    [],
  );

  const updateRoundProduct = useCallback(
    (
      roundIndex: number,
      productIndex: number,
      field: keyof Type14ActualProductState,
      value: any,
    ) => {
      setRounds((prev) => {
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
    [],
  );

  const removeRoundProduct = useCallback(
    (roundIndex: number, productIndex: number) => {
      setRounds((prev) => {
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
    [],
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
      setRounds((prev) => {
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
    [],
  );

  const removeRoundAfterSprayImage = useCallback(
    (roundIndex: number, imgIndex: number) => {
      setRounds((prev) => {
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
    [],
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
              tp.demoPlot.customer?.name || tp.demoPlot.dealerName || tp.dealerName || "",
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

      // Resolve demoPlotId
      const firstRound = type14Rounds[0];
      const type14Visits = (plan.demoPlotVisits || [])
        .filter((v: any) => !v.workTypeCode || v.workTypeCode === "TYPE_14")
        .sort((a: any, b: any) => (a.visitNumber || 1) - (b.visitNumber || 1));
      const type14Visit = type14Visits[0] || plan.demoPlotVisits?.[0];

      let plotId = "";
      if (firstRound?.demoPlotId) {
        plotId = firstRound.demoPlotId;
      } else if (type14Visit?.demoPlot?.id || type14Visit?.demoPlotId) {
        plotId = type14Visit.demoPlot?.id || type14Visit.demoPlotId;
      } else if (plan.demoPlot?.id || plan.demoPlotId) {
        plotId = plan.demoPlot?.id || plan.demoPlotId;
      } else if (plan.type14?.plots?.[0]?.demoPlotId) {
        plotId = plan.type14.plots[0].demoPlotId;
      } else if (plan.payload?.type14Data?.demoPlotId) {
        plotId = plan.payload.type14Data.demoPlotId;
      } else if (resolvedPlots.length === 1) {
        plotId = resolvedPlots[0].id;
      }

      const allLoadedImages: Type14ImageState[] = [];
      let hydratedRounds: Type14SprayRoundState[] = [];

      if (type14Rounds.length > 0) {
        hydratedRounds = type14Rounds.map((r: any, idx: number) => {
          const rNum = r.roundNumber || idx + 1;
          const rProducts: any[] = r.products || [];

          // Visit matching for fallback daysSinceStart
          const matchingVisit = (plan.demoPlotVisits || []).find(
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
                    (!a.sprayRoundId || a.sprayRoundId === r.id),
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
      } else if (type14Visits.length > 0) {
        hydratedRounds = type14Visits.map((v: any, idx: number) => {
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
        const initVisit = type14Visit;
        const initialRound1: Type14SprayRoundState = {
          roundNumber: 1,
          actualVisitDate: initVisit?.visitDate
            ? formatToYMD(initVisit.visitDate)
            : formatToYMD(new Date()),
          daysAfterSpray:
            initVisit?.daysSinceStart != null &&
            initVisit.daysSinceStart !== ""
              ? String(initVisit.daysSinceStart)
              : "",
          trackingResult: initVisit?.productResponse || "",
          additionalNotes: initVisit?.notes || "",
          afterSprayImages: [],
          products: [],
        };
        hydratedRounds = [initialRound1];
      }

      setRounds(hydratedRounds);
      initialImagesRef.current = JSON.parse(JSON.stringify(allLoadedImages));

      if (plotId) {
        setDemoPlotId(plotId);
        const selectedPlotObj =
          plotsMap.get(plotId) ||
          resolvedPlots.find((p) => p.id === plotId);
        handleSelectPlot(plotId, selectedPlotObj);
      }
    },
    [handleSelectPlot],
  );

  // ── Upload Images ──
  const uploadImages = useCallback(
    async (
      planId: string,
      newlyUploadedUrls: string[],
    ): Promise<Type14ImageState[]> => {
      const updatedRounds = await Promise.all(
        rounds.map(async (round, idx) => {
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
            demoPlotId || "type14-plot",
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
      setRounds(updatedRounds);
      const allImages = updatedRounds.flatMap((r) => r.afterSprayImages);
      return allImages;
    },
    [rounds, demoPlotId],
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
        allCurrentImages || rounds.flatMap((r) => r.afterSprayImages);
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
    [rounds],
  );

  // Commit saved state to initial ref
  const commitSavedImages = useCallback(
    (savedImages?: Type14ImageState[]) => {
      const imgs = savedImages || rounds.flatMap((r) => r.afterSprayImages);
      initialImagesRef.current = JSON.parse(JSON.stringify(imgs));
    },
    [rounds],
  );

  // ── Build Payload for Submission ──
  const buildType14ActualPayload = useCallback(
    (_cleanImages?: Type14ImageState[]) => {
      const validationRes = validateType14Actual({ demoPlotId, rounds });
      if (!validationRes.isValid) {
        throw new Error(validationRes.error || "ข้อมูลการติดตามแปลงไม่ถูกต้อง");
      }

      const sprayRoundsPayload: any[] = [];

      for (const round of rounds) {
        const rNum = round.roundNumber;
        if (!round.actualVisitDate) {
          throw new Error(`กรุณาระบุวันที่ติดตามจริง ในรอบที่ ${rNum}`);
        }
        if (
          round.daysAfterSpray === "" ||
          isNaN(Number(round.daysAfterSpray)) ||
          Number(round.daysAfterSpray) < 0
        ) {
          throw new Error(
            `กรุณาระบุจำนวนวันหลังฉีดพ่น (ตัวเลขตั้งแต่ 0 ขึ้นไป) ในรอบที่ ${rNum}`,
          );
        }
        if (!round.trackingResult || !round.trackingResult.trim()) {
          throw new Error(`กรุณากรอกผลการติดตาม ในรอบที่ ${rNum}`);
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

        const roundAttachments = (round.afterSprayImages || []).map((img) => ({
          fileUrl: img.url,
          fileName: img.name || `type14-round${rNum}-photo.jpg`,
          fileSize: img.size || null,
          mimeType: img.type || null,
        }));

        sprayRoundsPayload.push({
          demoPlotId,
          roundNumber: rNum,
          sprayDate: new Date(round.actualVisitDate),
          sprayMethod: "FOLLOW_UP",
          sprayEquipment: "NONE",
          productResponse: round.trackingResult.trim(),
          daysSinceStart: Number(round.daysAfterSpray),
          notes: round.additionalNotes ? round.additionalNotes.trim() : null,
          workTypeCode: "TYPE_14",
          products: roundProductsPayload,
          externalProducts: [],
          attachments: roundAttachments,
        });
      }

      return {
        sprayRounds: sprayRoundsPayload,
        attachments: [],
      };
    },
    [demoPlotId, rounds],
  );

  return {
    // Multi-round state & methods
    rounds,
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
      const res = validateType14Actual({ demoPlotId, rounds });
      return res.isValid ? null : (res.error || "ข้อมูลการติดตามแปลงไม่ถูกต้อง");
    }, [demoPlotId, rounds]),

    // Backwards-compatible aliases for single-round queries
    actualVisitDate: rounds[0]?.actualVisitDate || "",
    daysAfterSpray: rounds[0]?.daysAfterSpray || "",
    trackingResult: rounds[0]?.trackingResult || "",
    additionalNotes: rounds[0]?.additionalNotes || "",
    afterSprayImages: rounds.flatMap((r) => r.afterSprayImages || []),
    products: rounds[0]?.products || [],
  };
}

export default useType14ActualState;
