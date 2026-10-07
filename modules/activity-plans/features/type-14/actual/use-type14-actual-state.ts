"use client";

import { useState, useCallback, useRef } from "react";
import {
  uploadActivityPlanImageGroup,
  collectPermanentUrls,
} from "../../shared/actual-view/utils";
import type { ImageFile } from "../../shared/actual-view/types";
import {
  createSupplementalDrugWithdrawalAction,
  submitSupplementalDrugWithdrawalAction,
  approveSupplementalDrugWithdrawalAction,
  returnSupplementalDrugWithdrawalAction,
  deleteSupplementalDrugWithdrawalAction,
  getHattackPlotContextAction,
} from "../../../server/actions";

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

function createDefaultRound(
  roundNumber: number,
  masterOriginal: any[] = [],
  supplemental: any[] = [],
): Type14SprayRoundState {
  return {
    roundNumber,
    actualVisitDate: new Date().toISOString().split("T")[0],
    daysAfterSpray: "",
    trackingResult: "",
    additionalNotes: "",
    afterSprayImages: [],
    originalProducts: masterOriginal.map((item) => ({
      productId: item.productId,
      productName: item.productName || item.product?.name || "",
      unit: item.unit || item.product?.unit || "ขวด",
      withdrawnQuantity: Number(item.quantity ?? item.withdrawnQuantity) || 0,
      quantityUsed: "",
      actualRate: "",
      detail: "",
      drugWithdrawalItemId: item.drugWithdrawalItemId || null,
      supplementalDrugWithdrawalItemId: null,
      sourceGroup: "ORIGINAL" as const,
    })),
    supplementalProducts: supplemental.flatMap((dw: any) =>
      (dw.items || []).map((item: any) => ({
        productId: item.productId,
        productName: item.productName || item.product?.name || "",
        unit: item.unit || item.product?.unit || "",
        withdrawnQuantity: Number(item.quantity) || 0,
        quantityUsed: "",
        actualRate: "",
        detail: "",
        drugWithdrawalItemId: null,
        supplementalDrugWithdrawalItemId: item.id,
        sourceGroup: "SUPPLEMENTAL" as const,
        supplementalStatus: dw.status,
        supplementalWithdrawalId: dw.id,
      })),
    ),
    actualOnlyProducts: [],
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

  // Raw supplemental withdrawals for workflow display
  const [rawSupplementalWithdrawals, setRawSupplementalWithdrawals] = useState<any[]>([]);
  const [isProcessingSupplemental, setIsProcessingSupplemental] = useState(false);
  const [supplementalActionError, setSupplementalActionError] = useState<string | null>(null);

  const initialImagesRef = useRef<Type14ImageState[]>([]);
  const planRef = useRef<any>(null);
  const masterPlanProductsRef = useRef<any[]>([]);
  const masterOriginalItemsRef = useRef<any[]>([]);
  const rawSupplementalWithdrawalsRef = useRef<any[]>([]);
  const savedRoundProductsByRoundRef = useRef<Map<number, any[]>>(new Map());

  // Set selected plot and load plot context (Group A items & Spray History)
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
        masterOriginalItemsRef.current = masterPlanProductsRef.current;
        setRounds((prev) =>
          prev.map((r) => {
            const savedProductsForRound = r.originalProducts || [];
            return {
              ...r,
              originalProducts: masterPlanProductsRef.current.map((item) => {
                const matched = savedProductsForRound.find(
                  (p: any) => p.productId === item.productId,
                );
                return {
                  ...item,
                  quantityUsed: matched?.quantityUsed ?? "",
                  actualRate: matched?.actualRate || "",
                  detail: matched?.detail || "",
                };
              }),
            };
          }),
        );
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

          // Store master items: Combine current plan's withdrawn products with previous plot items
          const originalWithdrawalItems = res.originalWithdrawalItems || [];
          const combinedItems: any[] = [...masterPlanProductsRef.current];
          originalWithdrawalItems.forEach((histItem: any) => {
            if (
              !combinedItems.some(
                (p: any) => p.productId === histItem.productId,
              )
            ) {
              combinedItems.push(histItem);
            }
          });
          masterOriginalItemsRef.current = combinedItems;

          // Map Group A into every round preserving round-specific saved products
          setRounds((prevRounds) =>
            prevRounds.map((round) => {
              const savedInRef =
                savedRoundProductsByRoundRef.current.get(round.roundNumber) || [];
              const savedProductsForRound =
                round.originalProducts && round.originalProducts.length > 0
                  ? round.originalProducts
                  : savedInRef;
              const mappedGroupA: Type14ActualProductState[] =
                combinedItems.map((item: any) => {
                  const matched =
                    savedProductsForRound.find(
                      (p: any) =>
                        p.productId === item.productId ||
                        (item.id && p.drugWithdrawalItemId === item.id),
                    ) ||
                    savedInRef.find(
                      (p: any) =>
                        p.productId === item.productId ||
                        (item.id && p.drugWithdrawalItemId === item.id),
                    );
                  const matchedDb = savedInRef.find(
                    (p: any) =>
                      p.productId === item.productId ||
                      (item.id && p.drugWithdrawalItemId === item.id),
                  );
                  return {
                    productId: item.productId,
                    productName: item.productName || item.product?.name || "",
                    unit: item.unit || item.product?.unit || "ขวด",
                    withdrawnQuantity:
                      Number(item.quantity ?? item.withdrawnQuantity) || 0,
                    quantityUsed:
                      matched &&
                      matched.quantityUsed != null &&
                      matched.quantityUsed !== ""
                        ? Number(matched.quantityUsed)
                        : matchedDb &&
                            matchedDb.quantityUsed != null &&
                            matchedDb.quantityUsed !== ""
                          ? Number(matchedDb.quantityUsed)
                          : "",
                    actualRate:
                      matched?.actualRate || matchedDb?.actualRate || "",
                    detail: matched?.detail || matchedDb?.detail || "",
                    drugWithdrawalItemId:
                      matched?.drugWithdrawalItemId ||
                      matchedDb?.drugWithdrawalItemId ||
                      item.drugWithdrawalItemId ||
                      null,
                    supplementalDrugWithdrawalItemId: null,
                    sourceGroup: "ORIGINAL" as const,
                  };
                });
              return {
                ...round,
                originalProducts: mappedGroupA,
              };
            }),
          );
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
      const effectiveMaster =
        masterOriginalItemsRef.current.length > 0
          ? masterOriginalItemsRef.current
          : masterPlanProductsRef.current;
      const newRound = createDefaultRound(
        nextNum,
        effectiveMaster,
        rawSupplementalWithdrawalsRef.current,
      );
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

  // Update Group A (Original) for a specific round
  const updateRoundOriginalProduct = useCallback(
    (
      roundIndex: number,
      productIndex: number,
      field: "quantityUsed" | "actualRate" | "detail",
      value: any,
    ) => {
      setRounds((prev) => {
        const next = [...prev];
        const round = next[roundIndex];
        if (!round || !round.originalProducts[productIndex]) return prev;
        const nextProducts = [...round.originalProducts];
        nextProducts[productIndex] = {
          ...nextProducts[productIndex],
          [field]: value,
        };
        next[roundIndex] = { ...round, originalProducts: nextProducts };
        return next;
      });
    },
    [],
  );

  // Update Group B (Supplemental) for a specific round
  const updateRoundSupplementalProduct = useCallback(
    (
      roundIndex: number,
      productIndex: number,
      field: "quantityUsed" | "actualRate" | "detail",
      value: any,
    ) => {
      setRounds((prev) => {
        const next = [...prev];
        const round = next[roundIndex];
        if (!round || !round.supplementalProducts[productIndex]) return prev;
        const nextProducts = [...round.supplementalProducts];
        nextProducts[productIndex] = {
          ...nextProducts[productIndex],
          [field]: value,
        };
        next[roundIndex] = { ...round, supplementalProducts: nextProducts };
        return next;
      });
    },
    [],
  );

  // Manage Group C (Actual-only) for a specific round
  const addRoundActualOnlyProduct = useCallback((roundIndex: number) => {
    setRounds((prev) => {
      const next = [...prev];
      const round = next[roundIndex];
      if (!round) return prev;
      const nextProducts: Type14ActualProductState[] = [
        ...round.actualOnlyProducts,
        {
          productId: "",
          productName: "",
          unit: "ขวด",
          withdrawnQuantity: 0,
          quantityUsed: "",
          actualRate: "",
          detail: "",
          drugWithdrawalItemId: null,
          supplementalDrugWithdrawalItemId: null,
          sourceGroup: "ACTUAL_ONLY",
        },
      ];
      next[roundIndex] = { ...round, actualOnlyProducts: nextProducts };
      return next;
    });
  }, []);

  const updateRoundActualOnlyProduct = useCallback(
    (
      roundIndex: number,
      productIndex: number,
      field: keyof Type14ActualProductState,
      value: any,
    ) => {
      setRounds((prev) => {
        const next = [...prev];
        const round = next[roundIndex];
        if (!round || !round.actualOnlyProducts[productIndex]) return prev;
        const nextProducts = [...round.actualOnlyProducts];
        nextProducts[productIndex] = {
          ...nextProducts[productIndex],
          [field]: value,
        };
        next[roundIndex] = { ...round, actualOnlyProducts: nextProducts };
        return next;
      });
    },
    [],
  );

  const removeRoundActualOnlyProduct = useCallback(
    (roundIndex: number, productIndex: number) => {
      setRounds((prev) => {
        const next = [...prev];
        const round = next[roundIndex];
        if (!round) return prev;
        const nextProducts = round.actualOnlyProducts.filter(
          (_, idx) => idx !== productIndex,
        );
        next[roundIndex] = { ...round, actualOnlyProducts: nextProducts };
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

  // Supplemental Drug Withdrawal Actions (Activity-Level Workflow)
  const createSupplementalWithdrawal = useCallback(
    async (
      items: Array<{
        productId: string;
        productName?: string;
        quantity: number;
        unit?: string;
      }>,
      autoSubmit: boolean = false,
      notes?: string,
    ) => {
      if (!planRef.current?.id) return { success: false, error: "ไม่พบ Plan ID" };
      setIsProcessingSupplemental(true);
      setSupplementalActionError(null);
      try {
        const res = (await createSupplementalDrugWithdrawalAction({
          activityPlanId: planRef.current.id,
          items,
          autoSubmit,
          notes,
        })) as any;
        if (res.success && res.withdrawal) {
          setRawSupplementalWithdrawals((prev) => [...prev, res.withdrawal]);
          rawSupplementalWithdrawalsRef.current = [
            ...(rawSupplementalWithdrawalsRef.current || []),
            res.withdrawal,
          ];

          const newItems: Type14ActualProductState[] = (
            res.withdrawal.items || []
          ).map((it: any) => ({
            productId: it.productId,
            productName: it.productName || it.product?.name || "",
            unit: it.unit || it.product?.unit || "",
            withdrawnQuantity: Number(it.quantity) || 0,
            quantityUsed: "",
            actualRate: "",
            detail: "",
            drugWithdrawalItemId: null,
            supplementalDrugWithdrawalItemId: it.id,
            sourceGroup: "SUPPLEMENTAL" as const,
            supplementalStatus: res.withdrawal.status,
            supplementalWithdrawalId: res.withdrawal.id,
          }));

          // Add to all rounds
          setRounds((prevRounds) =>
            prevRounds.map((round) => ({
              ...round,
              supplementalProducts: [...round.supplementalProducts, ...newItems],
            })),
          );
          return { success: true, withdrawal: res.withdrawal };
        } else {
          setSupplementalActionError(res.error || "เกิดข้อผิดพลาด");
          return { success: false, error: res.error };
        }
      } catch (err: any) {
        setSupplementalActionError(err.message || "เกิดข้อผิดพลาด");
        return { success: false, error: err.message };
      } finally {
        setIsProcessingSupplemental(false);
      }
    },
    [],
  );

  const submitSupplementalWithdrawal = useCallback(
    async (withdrawalId: string) => {
      setIsProcessingSupplemental(true);
      setSupplementalActionError(null);
      try {
        const res = (await submitSupplementalDrugWithdrawalAction(
          withdrawalId,
          planRef.current?.id,
        )) as any;
        if (res.success && res.withdrawal) {
          setRawSupplementalWithdrawals((prev) =>
            prev.map((w) => (w.id === withdrawalId ? res.withdrawal : w)),
          );
          rawSupplementalWithdrawalsRef.current = (
            rawSupplementalWithdrawalsRef.current || []
          ).map((w) => (w.id === withdrawalId ? res.withdrawal : w));

          setRounds((prevRounds) =>
            prevRounds.map((round) => ({
              ...round,
              supplementalProducts: round.supplementalProducts.map((p) =>
                p.supplementalWithdrawalId === withdrawalId
                  ? { ...p, supplementalStatus: res.withdrawal.status }
                  : p,
              ),
            })),
          );
          return { success: true };
        } else {
          setSupplementalActionError(res.error || "เกิดข้อผิดพลาด");
          return { success: false, error: res.error };
        }
      } catch (err: any) {
        setSupplementalActionError(err.message || "เกิดข้อผิดพลาด");
        return { success: false, error: err.message };
      } finally {
        setIsProcessingSupplemental(false);
      }
    },
    [],
  );

  const approveSupplementalWithdrawal = useCallback(
    async (withdrawalId: string, comment?: string) => {
      setIsProcessingSupplemental(true);
      setSupplementalActionError(null);
      try {
        const res = (await approveSupplementalDrugWithdrawalAction(
          withdrawalId,
          comment,
          planRef.current?.id,
        )) as any;
        if (res.success && res.withdrawal) {
          setRawSupplementalWithdrawals((prev) =>
            prev.map((w) => (w.id === withdrawalId ? res.withdrawal : w)),
          );
          rawSupplementalWithdrawalsRef.current = (
            rawSupplementalWithdrawalsRef.current || []
          ).map((w) => (w.id === withdrawalId ? res.withdrawal : w));

          setRounds((prevRounds) =>
            prevRounds.map((round) => ({
              ...round,
              supplementalProducts: round.supplementalProducts.map((p) =>
                p.supplementalWithdrawalId === withdrawalId
                  ? { ...p, supplementalStatus: "APPROVED" }
                  : p,
              ),
            })),
          );
          return { success: true };
        } else {
          setSupplementalActionError(res.error || "เกิดข้อผิดพลาด");
          return { success: false, error: res.error };
        }
      } catch (err: any) {
        setSupplementalActionError(err.message || "เกิดข้อผิดพลาด");
        return { success: false, error: err.message };
      } finally {
        setIsProcessingSupplemental(false);
      }
    },
    [],
  );

  const returnSupplementalWithdrawal = useCallback(
    async (withdrawalId: string, reason: string) => {
      setIsProcessingSupplemental(true);
      setSupplementalActionError(null);
      try {
        const res = (await returnSupplementalDrugWithdrawalAction(
          withdrawalId,
          reason,
          planRef.current?.id,
        )) as any;
        if (res.success && res.withdrawal) {
          setRawSupplementalWithdrawals((prev) =>
            prev.map((w) => (w.id === withdrawalId ? res.withdrawal : w)),
          );
          rawSupplementalWithdrawalsRef.current = (
            rawSupplementalWithdrawalsRef.current || []
          ).map((w) => (w.id === withdrawalId ? res.withdrawal : w));

          setRounds((prevRounds) =>
            prevRounds.map((round) => ({
              ...round,
              supplementalProducts: round.supplementalProducts.map((p) =>
                p.supplementalWithdrawalId === withdrawalId
                  ? { ...p, supplementalStatus: "RETURNED" }
                  : p,
              ),
            })),
          );
          return { success: true };
        } else {
          setSupplementalActionError(res.error || "เกิดข้อผิดพลาด");
          return { success: false, error: res.error };
        }
      } catch (err: any) {
        setSupplementalActionError(err.message || "เกิดข้อผิดพลาด");
        return { success: false, error: err.message };
      } finally {
        setIsProcessingSupplemental(false);
      }
    },
    [],
  );

  const deleteSupplementalWithdrawal = useCallback(
    async (withdrawalId: string) => {
      setIsProcessingSupplemental(true);
      setSupplementalActionError(null);
      try {
        const res = await deleteSupplementalDrugWithdrawalAction(
          withdrawalId,
          planRef.current?.id,
        );
        if (res.success) {
          setRawSupplementalWithdrawals((prev) =>
            prev.filter((w) => w.id !== withdrawalId),
          );
          rawSupplementalWithdrawalsRef.current = (
            rawSupplementalWithdrawalsRef.current || []
          ).filter((w) => w.id !== withdrawalId);

          setRounds((prevRounds) =>
            prevRounds.map((round) => ({
              ...round,
              supplementalProducts: round.supplementalProducts.filter(
                (p) => p.supplementalWithdrawalId !== withdrawalId,
              ),
            })),
          );
          return { success: true };
        } else {
          setSupplementalActionError(res.error || "เกิดข้อผิดพลาด");
          return { success: false, error: res.error };
        }
      } catch (err: any) {
        setSupplementalActionError(err.message || "เกิดข้อผิดพลาด");
        return { success: false, error: err.message };
      } finally {
        setIsProcessingSupplemental(false);
      }
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
      const resolvedPlots = Array.from(plotsMap.values());
      setAvailablePlots(resolvedPlots);

      // 2. Supplemental Drug Withdrawals (Activity Level)
      const suppWithdrawals: any[] = plan.supplementalDrugWithdrawals || [];
      setRawSupplementalWithdrawals(suppWithdrawals);
      rawSupplementalWithdrawalsRef.current = suppWithdrawals;

      // 2.5 Withdrawn Products from Plan (TYPE_14 Requisition)
      const planProducts = (plan.products || plan.planProducts || []).filter(
        (p: any) => p.workTypeCode === "TYPE_14",
      );
      const mappedPlanProducts: Type14ActualProductState[] = planProducts.map(
        (p: any) => ({
          productId: p.productId,
          productName: p.productName || p.product?.name || "",
          unit: p.product?.unit || p.product?.packageSizeUnit || p.unit || "ขวด",
          withdrawnQuantity: Number(p.targetQuantity ?? p.quantity) || 0,
          quantityUsed: "",
          actualRate: "",
          detail: "",
          drugWithdrawalItemId: null,
          supplementalDrugWithdrawalItemId: null,
          sourceGroup: "ORIGINAL" as const,
        }),
      );
      masterPlanProductsRef.current = mappedPlanProducts;
      masterOriginalItemsRef.current = mappedPlanProducts;

      // 3. Existing Result & Multiple Spray Rounds
      const resultObj = plan?.result || parsedResult;
      const allResultRounds: any[] =
        (plan?.result?.sprayRounds && plan.result.sprayRounds.length > 0)
          ? plan.result.sprayRounds
          : (parsedResult?.sprayRounds || []);
      const type14Rounds = allResultRounds
        .filter((r: any) => r.workTypeCode === "TYPE_14" || !r.workTypeCode)
        .sort((a: any, b: any) => (a.roundNumber || 1) - (b.roundNumber || 1));

      // Resolve demoPlotId
      const firstRound = type14Rounds[0];
      const type14Visit =
        (plan.demoPlotVisits || []).find(
          (v: any) => v.workTypeCode === "TYPE_14",
        ) || plan.demoPlotVisits?.[0];

      let plotId = "";
      if (firstRound?.demoPlotId) {
        plotId = firstRound.demoPlotId;
      } else if (type14Visit?.demoPlot?.id) {
        plotId = type14Visit.demoPlot.id;
      } else if (plan.demoPlot?.id) {
        plotId = plan.demoPlot.id;
      } else if (plan.payload?.type14Data?.demoPlotId) {
        plotId = plan.payload.type14Data.demoPlotId;
      } else if (resolvedPlots.length === 1) {
        plotId = resolvedPlots[0].id;
      }

      // Collect saved products by round number for matching Group A
      const savedProductsMap = new Map<number, any[]>();
      const allLoadedImages: Type14ImageState[] = [];

      let hydratedRounds: Type14SprayRoundState[] = [];

      if (type14Rounds.length > 0) {
        hydratedRounds = type14Rounds.map((r: any, idx: number) => {
          const rNum = r.roundNumber || idx + 1;
          const rProducts: any[] = r.products || [];
          savedProductsMap.set(rNum, rProducts);

          // Visit matching for fallback daysSinceStart
          const matchingVisit = (plan.demoPlotVisits || []).find(
            (v: any) => v.visitNumber === rNum,
          );

          // Days since start: prioritize round's daysSinceStart
          let resolvedDays = "";
          if (r.daysSinceStart != null) {
            resolvedDays = String(r.daysSinceStart);
          } else if (matchingVisit && matchingVisit.daysSinceStart != null) {
            resolvedDays = String(matchingVisit.daysSinceStart);
          }

          // Images for this round
          const roundAttachments: any[] = [
            ...(r.attachments || []),
            // Fallback for Round 1 from top-level attachments if legacy
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

          // Group A for this round (Matched against current plan's withdrawn products)
          const groupA: Type14ActualProductState[] = mappedPlanProducts.map(
            (item) => {
              const matched = rProducts.find(
                (p: any) =>
                  p.productId === item.productId ||
                  (item.drugWithdrawalItemId &&
                    p.drugWithdrawalItemId === item.drugWithdrawalItemId),
              );
              return {
                ...item,
                quantityUsed:
                  matched &&
                  matched.quantityUsed != null &&
                  matched.quantityUsed !== ""
                    ? Number(matched.quantityUsed)
                    : "",
                actualRate: matched?.actualRate || "",
                detail: matched?.detail || "",
                drugWithdrawalItemId: matched?.drugWithdrawalItemId || null,
              };
            },
          );

          // Group B for this round
          const groupB: Type14ActualProductState[] = [];
          suppWithdrawals.forEach((dw: any) => {
            (dw.items || []).forEach((item: any) => {
              const matched = rProducts.find(
                (p: any) => p.supplementalDrugWithdrawalItemId === item.id,
              );
              groupB.push({
                productId: item.productId,
                productName: item.productName || item.product?.name || "",
                unit: item.unit || item.product?.unit || "",
                withdrawnQuantity: Number(item.quantity) || 0,
                quantityUsed:
                  matched && matched.quantityUsed != null && matched.quantityUsed !== ""
                    ? Number(matched.quantityUsed)
                    : "",
                actualRate: matched?.actualRate || "",
                detail: matched?.detail || "",
                drugWithdrawalItemId: null,
                supplementalDrugWithdrawalItemId: item.id,
                sourceGroup: "SUPPLEMENTAL" as const,
                supplementalStatus: dw.status,
                supplementalWithdrawalId: dw.id,
              });
            });
          });

          // Group C for this round (exclude products that already belong to Group A plan products)
          const groupC: Type14ActualProductState[] = rProducts
            .filter(
              (p: any) =>
                !p.drugWithdrawalItemId &&
                !p.supplementalDrugWithdrawalItemId &&
                !mappedPlanProducts.some(
                  (planP) => planP.productId === p.productId,
                ),
            )
            .map((p: any) => ({
              productId: p.productId,
              productName: p.productName || p.product?.name || "",
              unit: p.unit || p.product?.unit || "",
              withdrawnQuantity: 0,
              quantityUsed:
                p.quantityUsed != null && p.quantityUsed !== ""
                  ? Number(p.quantityUsed)
                  : "",
              actualRate: p.actualRate || "",
              detail: p.detail || "",
              drugWithdrawalItemId: null,
              supplementalDrugWithdrawalItemId: null,
              sourceGroup: "ACTUAL_ONLY" as const,
            }));

          return {
            id: r.id,
            roundNumber: rNum,
            actualVisitDate: r.sprayDate
              ? new Date(r.sprayDate).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
            daysAfterSpray: resolvedDays,
            trackingResult: r.productResponse || matchingVisit?.productResponse || "",
            additionalNotes: r.notes || matchingVisit?.notes || "",
            afterSprayImages: roundImgs.slice(0, 5),
            originalProducts: groupA,
            supplementalProducts: groupB,
            actualOnlyProducts: groupC,
          };
        });
      } else {
        // Fallback: If no spray rounds yet, initialize Round 1 with any existing DemoPlotVisit
        const initVisit = type14Visit;
        const initGroupB: Type14ActualProductState[] = [];
        suppWithdrawals.forEach((dw: any) => {
          (dw.items || []).forEach((item: any) => {
            initGroupB.push({
              productId: item.productId,
              productName: item.productName || item.product?.name || "",
              unit: item.unit || item.product?.unit || "",
              withdrawnQuantity: Number(item.quantity) || 0,
              quantityUsed: "",
              actualRate: "",
              detail: "",
              drugWithdrawalItemId: null,
              supplementalDrugWithdrawalItemId: item.id,
              sourceGroup: "SUPPLEMENTAL" as const,
              supplementalStatus: dw.status,
              supplementalWithdrawalId: dw.id,
            });
          });
        });

        const initialRound1: Type14SprayRoundState = {
          roundNumber: 1,
          actualVisitDate: initVisit?.visitDate
            ? new Date(initVisit.visitDate).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          daysAfterSpray:
            initVisit?.daysSinceStart != null
              ? String(initVisit.daysSinceStart)
              : "",
          trackingResult: initVisit?.productResponse || "",
          additionalNotes: initVisit?.notes || "",
          afterSprayImages: [],
          originalProducts: mappedPlanProducts.map((p) => ({ ...p })),
          supplementalProducts: initGroupB,
          actualOnlyProducts: [],
        };
        hydratedRounds = [initialRound1];
      }

      savedRoundProductsByRoundRef.current = savedProductsMap;
      setRounds(hydratedRounds);
      initialImagesRef.current = JSON.parse(JSON.stringify(allLoadedImages));

      // 4. Trigger plot selection to load Group A and Spray History
      if (plotId) {
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
      // 1. Required validations using centralized validation helper
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

        // Validate Group B in this round
        const approvedGroupBProducts: any[] = [];
        for (const prod of round.supplementalProducts) {
          const used = Number(prod.quantityUsed) || 0;
          if (used > 0 || (prod.actualRate && prod.actualRate.trim() !== "")) {
            if (prod.supplementalStatus !== "APPROVED") {
              throw new Error(
                `รายการเบิกยาใหม่ "${prod.productName}" ในรอบที่ ${rNum} ยังไม่ได้รับการอนุมัติ (APPROVED) ไม่สามารถบันทึกการใช้จริงได้`,
              );
            }
            approvedGroupBProducts.push({
              productId: prod.productId,
              productName: prod.productName,
              actualRate: prod.actualRate || "-",
              quantityUsed: used,
              unit: prod.unit,
              drugWithdrawalItemId: null,
              supplementalDrugWithdrawalItemId:
                prod.supplementalDrugWithdrawalItemId,
              detail: prod.detail || null,
            });
          }
        }

        // Group A in this round
        const groupAProducts = round.originalProducts
          .filter(
            (p) =>
              Number(p.quantityUsed) > 0 ||
              (p.actualRate && p.actualRate.trim() !== ""),
          )
          .map((p) => ({
            productId: p.productId,
            productName: p.productName,
            actualRate: p.actualRate || "-",
            quantityUsed: Number(p.quantityUsed) || 0,
            unit: p.unit,
            drugWithdrawalItemId: p.drugWithdrawalItemId,
            supplementalDrugWithdrawalItemId: null,
            detail: p.detail || null,
          }));

        // Group C in this round
        const groupCProducts: any[] = [];
        for (let i = 0; i < round.actualOnlyProducts.length; i++) {
          const prod = round.actualOnlyProducts[i];
          if (!prod.productId || !prod.productId.trim()) {
            throw new Error(
              `กรุณาเลือกตัวยาสำหรับยานอกแผนรายการที่ ${i + 1} ในรอบที่ ${rNum}`,
            );
          }
          if (
            prod.quantityUsed === "" ||
            isNaN(Number(prod.quantityUsed)) ||
            Number(prod.quantityUsed) < 0
          ) {
            throw new Error(
              `กรุณาระบุจำนวนที่ใช้จริงของยานอกแผน "${prod.productName || "รายการที่ " + (i + 1)}" ในรอบที่ ${rNum}`,
            );
          }
          groupCProducts.push({
            productId: prod.productId,
            productName: prod.productName,
            actualRate: prod.actualRate || "-",
            quantityUsed: Number(prod.quantityUsed) || 0,
            unit: prod.unit,
            drugWithdrawalItemId: null,
            supplementalDrugWithdrawalItemId: null,
            detail: prod.detail || null,
          });
        }

        const allRoundProducts = [
          ...groupAProducts,
          ...approvedGroupBProducts,
          ...groupCProducts,
        ];

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
          products: allRoundProducts,
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
    updateRoundOriginalProduct,
    updateRoundSupplementalProduct,
    addRoundActualOnlyProduct,
    updateRoundActualOnlyProduct,
    removeRoundActualOnlyProduct,
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

    // Supplemental Workflow
    rawSupplementalWithdrawals,
    isProcessingSupplemental,
    supplementalActionError,
    createSupplementalWithdrawal,
    submitSupplementalWithdrawal,
    approveSupplementalWithdrawal,
    returnSupplementalWithdrawal,
    deleteSupplementalWithdrawal,

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
    originalProducts: rounds[0]?.originalProducts || [],
    supplementalProducts: rounds[0]?.supplementalProducts || [],
    actualOnlyProducts: rounds[0]?.actualOnlyProducts || [],
  };
}

export default useType14ActualState;
