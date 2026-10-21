"use client";

import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { X, UserCheck, Store, MapPin, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import DatePicker from "@/components/custom/DatePicker";
import {
  ActivityPhotoUpload,
  ActivityGpsPicker,
  ActivityProductSelect,
  type ActivityProductItem,
} from "@/modules/activity/ui";
import { Badge } from "@/components/ui/badge";
import { listProductsAction } from "@/modules/products/server/actions";
import { Type1PlanCard } from "./type1-plan-card";
import type {
  ProductOption,
  Type1ImageFile,
  Type1AdviceProductItem,
} from "../../shared/types";
import type { Type1TargetItem } from "../types/planned.types";
import type {
  Type1ActualFormProps,
  Type1TargetActualItem,
} from "../types/actual.types";

export type ActualType1VisitProps = Type1ActualFormProps;
export type {
  ProductOption,
  Type1ActualFormProps,
  Type1TargetActualItem,
  Type1AdviceProductItem,
};

import { parseTargetText } from "../application/actual-mapper";

/**
 * Initializes target actual items from effective plan targets and hydrated props
 */
function initializeTargetItems(
  targets: Type1TargetItem[],
  fallbackProps: {
    discussionResult: string;
    productAdvice: string;
    salesOpportunity: "สูง" | "ต่ำ" | "";
    nextAction: string;
    nextMeetingDate: string;
    farmerHomeAddress: string;
    plotLatitude: string;
    plotLongitude: string;
    plotImages: Type1ImageFile[];
  },
  savedResults?: Type1TargetActualItem[],
  productsList: ProductOption[] = [],
): Type1TargetActualItem[] {
  if (savedResults && savedResults.length === targets.length) {
    return savedResults;
  }

  const effectiveList: Type1TargetItem[] =
    targets.length > 0
      ? targets
      : [
          {
            customer: "เป้าหมายที่ 1",
            visitPurpose: "FARMER",
          } as Type1TargetItem,
        ];
  const isSingle = effectiveList.length === 1;

  const farmerTargets = effectiveList.filter((t) => t.visitPurpose !== "STORE");
  const isOnlyOneFarmer = farmerTargets.length === 1;

  return effectiveList.map((t, idx) => {
    const isStore = t.visitPurpose === "STORE";
    const name = t.isUnregisteredFarmer
      ? t.unregisteredFarmerName || t.customer || `เป้าหมายที่ ${idx + 1}`
      : t.customer || `เป้าหมายที่ ${idx + 1}`;

    const isFirstOrOnlyFarmer =
      !isStore &&
      (isOnlyOneFarmer ||
        farmerTargets[0]?.id === t.id ||
        farmerTargets[0]?.customer === name ||
        idx === 0);

    const parsedDiscussion =
      t.discussionResult ||
      parseTargetText(
        fallbackProps.discussionResult,
        name,
        isSingle
          ? fallbackProps.discussionResult
          : idx === 0 && !fallbackProps.discussionResult.includes(":")
            ? fallbackProps.discussionResult
            : "",
      ) ||
      (isSingle ? fallbackProps.discussionResult : "");

    const parsedNextAction =
      t.nextAction ||
      parseTargetText(
        fallbackProps.nextAction,
        name,
        isSingle
          ? fallbackProps.nextAction
          : idx === 0 && !fallbackProps.nextAction.includes(":")
            ? fallbackProps.nextAction
            : "",
      ) ||
      (isSingle ? fallbackProps.nextAction : "");

    const parsedAddress =
      t.farmerHomeAddress ||
      parseTargetText(
        fallbackProps.farmerHomeAddress,
        name,
        isSingle || isFirstOrOnlyFarmer
          ? fallbackProps.farmerHomeAddress
          : idx === 0 && !fallbackProps.farmerHomeAddress.includes(":")
            ? fallbackProps.farmerHomeAddress
            : "",
      ) ||
      (isSingle || isFirstOrOnlyFarmer ? fallbackProps.farmerHomeAddress : "");

    const matchedFromFallback = (fallbackProps.plotImages || []).filter(
      (img) =>
        (t.id && (img.targetId === t.id || img.url?.includes(`/${t.id}/`))) ||
        (t.storeId && img.storeId && img.storeId === t.storeId),
    );
    const hasAnyTargetedInFallback = (fallbackProps.plotImages || []).some(
      (img) =>
        Boolean(img.targetId) ||
        effectiveList.some((et) => et.id && img.url?.includes(`/${et.id}/`)),
    );
    const images =
      t.plotImages && t.plotImages.length > 0
        ? t.plotImages
        : matchedFromFallback.length > 0
          ? matchedFromFallback
          : (isSingle || (isOnlyOneFarmer && !isStore)) &&
              !hasAnyTargetedInFallback
            ? fallbackProps.plotImages
            : [];

    const adviceTargets = effectiveList.filter(
      (it) => it.topic?.trim() === "ให้คำแนะนำการใช้สินค้า",
    );
    const isTargetForAdvice =
      adviceTargets.length > 0
        ? t.topic?.trim() === "ให้คำแนะนำการใช้สินค้า"
        : isSingle || idx === 0;

    const parsedAdvice =
      t.productAdvice ||
      parseTargetText(fallbackProps.productAdvice, name, "") ||
      (isTargetForAdvice ? fallbackProps.productAdvice : "");

    const parsedSalesOpp =
      ((t.salesOpportunity || t.opportunity) as "สูง" | "ต่ำ" | "") ||
      (parseTargetText(fallbackProps.salesOpportunity, name, "") as
        | "สูง"
        | "ต่ำ"
        | "") ||
      (isTargetForAdvice ? fallbackProps.salesOpportunity : "");

    const parsedMeetingDate =
      t.nextMeetingDate ||
      t.nextDate ||
      parseTargetText(fallbackProps.nextMeetingDate, name, "") ||
      (isSingle || idx === 0 || isTargetForAdvice
        ? fallbackProps.nextMeetingDate
        : "");

    const initialAdvised: Type1AdviceProductItem[] =
      t.advisedProducts && t.advisedProducts.length > 0
        ? t.advisedProducts
        : parsedAdvice
          ? parsedAdvice
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
              .map((pName) => {
                const found = productsList.find((p) => p.name === pName);
                return {
                  productId: found?.id || pName,
                  productName: pName,
                  productCode: found?.productCode || null,
                  targetId: t.id,
                };
              })
          : [];

    return {
      id: t.id || `t1-target-${idx}`,
      targetId: t.id,
      storeId: t.storeId,
      customer: name,
      visitPurpose: t.visitPurpose || (isStore ? "STORE" : "FARMER"),
      topic: t.topic || "",
      notes: t.notes || "",
      province: t.province,
      isUnregisteredFarmer: Boolean(t.isUnregisteredFarmer),
      unregisteredFarmerName: t.unregisteredFarmerName,
      unregisteredFarmerPhone: t.unregisteredFarmerPhone,

      discussionResult: t.discussionResult || parsedDiscussion || "",
      productAdvice: t.productAdvice || parsedAdvice || "",
      advisedProducts: initialAdvised,
      salesOpportunity:
        (t.salesOpportunity as "สูง" | "ต่ำ" | "") || parsedSalesOpp || "",
      nextAction: t.nextAction || parsedNextAction || "",
      nextMeetingDate: t.nextMeetingDate || parsedMeetingDate || "",
      farmerHomeAddress: t.farmerHomeAddress || parsedAddress || "",
      plotLatitude:
        t.plotLatitude != null && String(t.plotLatitude).trim() !== ""
          ? String(t.plotLatitude)
          : isSingle || isFirstOrOnlyFarmer
            ? fallbackProps.plotLatitude || ""
            : "",
      plotLongitude:
        t.plotLongitude != null && String(t.plotLongitude).trim() !== ""
          ? String(t.plotLongitude)
          : isSingle || isFirstOrOnlyFarmer
            ? fallbackProps.plotLongitude || ""
            : "",
      plotImages: images,
    };
  });
}

export function Type1ActualForm(props: Type1ActualFormProps) {
  const {
    isVisible,
    actualState,
    target,
    targets,
    planType,
    products = [],
    targetActualResults,
    onUpdateTargetActualResults,
  } = props;

  const productAdvice =
    actualState?.t1ProductAdvice || props.productAdvice || "";
  const setProductAdvice =
    actualState?.setT1ProductAdvice ?? props.setProductAdvice ?? (() => {});
  const advisedProducts =
    actualState?.t1AdvisedProducts ?? props.advisedProducts;
  const setAdvisedProducts =
    actualState?.setT1AdvisedProducts ?? props.setAdvisedProducts;
  const discussionResult =
    actualState?.t1DiscussionResult || props.discussionResult || "";
  const setDiscussionResult =
    actualState?.setT1DiscussionResult ??
    props.setDiscussionResult ??
    (() => {});
  const salesOpportunity = (actualState?.t1SalesOpportunity ||
    props.salesOpportunity ||
    "") as "สูง" | "ต่ำ" | "";
  const setSalesOpportunity =
    actualState?.setT1SalesOpportunity ??
    props.setSalesOpportunity ??
    (() => {});
  const nextAction = actualState?.t1NextAction || props.nextAction || "";
  const setNextAction =
    actualState?.setT1NextAction ?? props.setNextAction ?? (() => {});
  const nextMeetingDate =
    actualState?.t1NextMeetingDate || props.nextMeetingDate || "";
  const setNextMeetingDate =
    actualState?.setT1NextMeetingDate ?? props.setNextMeetingDate ?? (() => {});
  const farmerHomeAddress =
    actualState?.t1FarmerHomeAddress || props.farmerHomeAddress || "";
  const setFarmerHomeAddress =
    actualState?.setT1FarmerHomeAddress ?? props.setFarmerHomeAddress;
  const plotLatitude = actualState?.t1PlotLatitude || props.plotLatitude || "";
  const setPlotLatitude =
    actualState?.setT1PlotLatitude ?? props.setPlotLatitude;
  const plotLongitude =
    actualState?.t1PlotLongitude || props.plotLongitude || "";
  const setPlotLongitude =
    actualState?.setT1PlotLongitude ?? props.setPlotLongitude;
  const plotImages =
    actualState?.t1PlotImages && actualState.t1PlotImages.length > 0
      ? actualState.t1PlotImages
      : (props.plotImages ?? []);
  const setPlotImages = actualState?.setT1PlotImages ?? props.setPlotImages;

  // Self-healing fallback: Load products from master if not supplied by parent view
  const [internalProducts, setInternalProducts] = useState<ProductOption[]>([]);
  useEffect(() => {
    if (products && products.length > 0) {
      setInternalProducts(products);
      return;
    }
    listProductsAction({ status: "ACTIVE", perPage: 1000 })
      .then((res: any) => {
        const list = res?.products || res?.data || [];
        if (list.length > 0) {
          setInternalProducts(list);
        }
      })
      .catch(() => {});
  }, [products]);

  const effectiveProducts =
    products && products.length > 0 ? products : internalProducts;

  const effectiveTargets = useMemo(
    () => (targets && targets.length > 0 ? targets : target ? [target] : []),
    [targets, target],
  );
  const count = effectiveTargets.length;
  const hasMultipleTargets = count > 1;

  // Internal per-target actual records
  const [targetItems, setTargetItems] = useState<Type1TargetActualItem[]>(() =>
    initializeTargetItems(
      effectiveTargets,
      {
        discussionResult,
        productAdvice,
        salesOpportunity,
        nextAction,
        nextMeetingDate,
        farmerHomeAddress,
        plotLatitude,
        plotLongitude,
        plotImages,
      },
      targetActualResults,
      products,
    ),
  );

  // Keep a stable ref of props for syncing without triggering infinite render loops
  const syncPropsRef = useRef({
    setDiscussionResult,
    setProductAdvice,
    setAdvisedProducts,
    setSalesOpportunity,
    setNextAction,
    setNextMeetingDate,
    setFarmerHomeAddress,
    setPlotLatitude,
    setPlotLongitude,
    setPlotImages,
    onUpdateTargetActualResults,
    setT1TargetItems: actualState?.setT1TargetItems,
  });
  syncPropsRef.current = {
    setDiscussionResult,
    setProductAdvice,
    setAdvisedProducts,
    setSalesOpportunity,
    setNextAction,
    setNextMeetingDate,
    setFarmerHomeAddress,
    setPlotLatitude,
    setPlotLongitude,
    setPlotImages,
    onUpdateTargetActualResults,
    setT1TargetItems: actualState?.setT1TargetItems,
  };

  // Synchronize internal targetItems changes to parent setters and optional callbacks
  const syncToParent = useCallback((items: Type1TargetActualItem[]) => {
    if (!items || items.length === 0) return;

    const {
      setDiscussionResult,
      setProductAdvice,
      setAdvisedProducts,
      setSalesOpportunity,
      setNextAction,
      setNextMeetingDate,
      setFarmerHomeAddress,
      setPlotLatitude,
      setPlotLongitude,
      setPlotImages,
      onUpdateTargetActualResults,
      setT1TargetItems,
    } = syncPropsRef.current;

    if (onUpdateTargetActualResults) {
      onUpdateTargetActualResults(items);
    }

    if (setT1TargetItems) {
      setT1TargetItems(items);
    }

    if (items.length === 1) {
      const single = items[0];
      setDiscussionResult(single.discussionResult || "");
      setProductAdvice(single.productAdvice || "");
      if (setAdvisedProducts) {
        setAdvisedProducts(single.advisedProducts || []);
      }
      setSalesOpportunity(single.salesOpportunity || "");
      setNextAction(single.nextAction || "");
      setNextMeetingDate(single.nextMeetingDate || "");
      if (setFarmerHomeAddress) {
        setFarmerHomeAddress(single.farmerHomeAddress || "");
      }
      if (setPlotLatitude) setPlotLatitude(single.plotLatitude || "");
      if (setPlotLongitude) setPlotLongitude(single.plotLongitude || "");
      if (setPlotImages) setPlotImages(single.plotImages || []);
      return;
    }

    // MULTI-TARGET COMBINATIONS:
    // 1. discussionResult: "ร้าน ก: ... | ร้าน ข: ..."
    const combinedDiscussion = items
      .map((item) =>
        item.discussionResult
          ? `${item.customer}: ${item.discussionResult}`
          : "",
      )
      .filter(Boolean)
      .join(" | ");
    setDiscussionResult(combinedDiscussion);

    // 2. productAdvice: unique product names
    const uniqueProducts = Array.from(
      new Set(
        items.flatMap((item) =>
          (item.productAdvice || "")
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean),
        ),
      ),
    );
    setProductAdvice(uniqueProducts.join(", "));

    // 2.1 advisedProducts: all advised items across all targets
    if (setAdvisedProducts) {
      const allAdvised = items.flatMap((i) => i.advisedProducts || []);
      setAdvisedProducts(allAdvised);
    }

    // 3. salesOpportunity: "สูง" if any target is สูง, else "ต่ำ" if any is ต่ำ, else ""
    const hasHigh = items.some((i) => i.salesOpportunity === "สูง");
    const hasLow = items.some((i) => i.salesOpportunity === "ต่ำ");
    setSalesOpportunity(hasHigh ? "สูง" : hasLow ? "ต่ำ" : "");

    // 4. nextAction: "ร้าน ก: ... | ร้าน ข: ..."
    const combinedNextAction = items
      .map((item) =>
        item.nextAction ? `${item.customer}: ${item.nextAction}` : "",
      )
      .filter(Boolean)
      .join(" | ");
    setNextAction(combinedNextAction);

    // 5. nextMeetingDate: first target with non-empty date
    const firstDate =
      items.find((i) => i.nextMeetingDate)?.nextMeetingDate || "";
    setNextMeetingDate(firstDate);

    // 6. farmerHomeAddress
    if (setFarmerHomeAddress) {
      const farmerAddresses = items
        .filter((i) => i.visitPurpose !== "STORE" && i.farmerHomeAddress)
        .map((i) =>
          items.filter((x) => x.visitPurpose !== "STORE").length > 1
            ? `${i.customer}: ${i.farmerHomeAddress}`
            : i.farmerHomeAddress!,
        );
      setFarmerHomeAddress(farmerAddresses.join(" | "));
    }

    // 7. plotLatitude & plotLongitude: first farmer with coordinates
    const firstCoord = items.find((i) => i.plotLatitude && i.plotLongitude);
    if (setPlotLatitude && setPlotLongitude) {
      if (firstCoord) {
        setPlotLatitude(firstCoord.plotLatitude || "");
        setPlotLongitude(firstCoord.plotLongitude || "");
      }
    }

    // 8. plotImages: combine all photos across all targets (preserving targetId)
    if (setPlotImages) {
      const allPlotImages = items.flatMap((i) =>
        (i.plotImages || []).map((img) => ({
          ...img,
          targetId: img.targetId || i.id || i.targetId,
          storeId: img.storeId || i.storeId || undefined,
        })),
      );
      setPlotImages(allPlotImages);
    }
  }, []);

  // Track initial mount and last targets key so we do not trigger infinite render loops
  const isInitialMountRef = useRef(true);
  const prevTargetItemsRef = useRef<string>("");
  const lastTargetsKeyRef = useRef<string>("");

  // Synchronize targetItems when effectiveTargets change or when targets have loaded actual outcomes
  useEffect(() => {
    if (!effectiveTargets || effectiveTargets.length === 0) return;

    const targetsKey = JSON.stringify(
      effectiveTargets.map((t) => ({
        id: t.id,
        customer: t.customer,
        discussionResult: t.discussionResult,
        nextAction: t.nextAction,
        farmerHomeAddress: t.farmerHomeAddress,
        plotLatitude: t.plotLatitude,
        plotLongitude: t.plotLongitude,
        plotImages: (t.plotImages || []).map((img) => img.url),
        productAdvice: t.productAdvice,
        salesOpportunity: t.salesOpportunity,
        nextMeetingDate: t.nextMeetingDate,
      })),
    );

    if (lastTargetsKeyRef.current === targetsKey) {
      return;
    }
    lastTargetsKeyRef.current = targetsKey;

    setTargetItems((prev) => {
      const fresh = initializeTargetItems(
        effectiveTargets,
        {
          discussionResult: discussionResult || "",
          productAdvice: productAdvice || "",
          salesOpportunity: salesOpportunity || "",
          nextAction: nextAction || "",
          nextMeetingDate: nextMeetingDate || "",
          farmerHomeAddress: farmerHomeAddress || "",
          plotLatitude: plotLatitude || "",
          plotLongitude: plotLongitude || "",
          plotImages: plotImages || [],
        },
        targetActualResults,
        products,
      );

      // If prev was empty or different length, use fresh
      if (prev.length !== fresh.length) {
        return fresh;
      }

      const prevHasData = prev.some(
        (it) =>
          Boolean(it.discussionResult) ||
          Boolean(it.nextAction) ||
          Boolean(it.farmerHomeAddress) ||
          Boolean(it.plotLatitude) ||
          Boolean(it.plotLongitude),
      );

      // If prev was empty / default unpopulated, take fresh
      if (!prevHasData) {
        return fresh;
      }

      // Merge: preserve user edits in prev, but fill in any empty fields from fresh
      return fresh.map((freshItem, idx) => {
        const prevItem = prev[idx];
        if (!prevItem) return freshItem;

        return {
          ...freshItem,
          discussionResult:
            prevItem.discussionResult || freshItem.discussionResult || "",
          nextAction: prevItem.nextAction || freshItem.nextAction || "",
          farmerHomeAddress:
            prevItem.farmerHomeAddress || freshItem.farmerHomeAddress || "",
          plotLatitude: prevItem.plotLatitude || freshItem.plotLatitude || "",
          plotLongitude:
            prevItem.plotLongitude || freshItem.plotLongitude || "",
          productAdvice:
            prevItem.productAdvice || freshItem.productAdvice || "",
          salesOpportunity:
            prevItem.salesOpportunity || freshItem.salesOpportunity || "",
          nextMeetingDate:
            prevItem.nextMeetingDate || freshItem.nextMeetingDate || "",
          plotImages:
            prevItem.plotImages && prevItem.plotImages.length > 0
              ? prevItem.plotImages
              : freshItem.plotImages,
          advisedProducts:
            prevItem.advisedProducts && prevItem.advisedProducts.length > 0
              ? prevItem.advisedProducts
              : freshItem.advisedProducts,
        };
      });
    });
  }, [effectiveTargets, targetActualResults, effectiveProducts]);

  // Synchronize internal targetItems changes to parent state safely in an effect
  useEffect(() => {
    const serialized = JSON.stringify(targetItems);
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      prevTargetItemsRef.current = serialized;
      const hasAny = targetItems.some(
        (it) =>
          Boolean(it.discussionResult) ||
          Boolean(it.nextAction) ||
          Boolean(it.farmerHomeAddress),
      );
      if (hasAny) {
        syncToParent(targetItems);
      }
      return;
    }
    if (prevTargetItemsRef.current === serialized) {
      return;
    }
    prevTargetItemsRef.current = serialized;
    syncToParent(targetItems);
  }, [targetItems, syncToParent]);

  // Handlers for individual target fields
  const handleTargetChange = (
    index: number,
    field: keyof Type1TargetActualItem,
    value: any,
  ) => {
    setTargetItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddProduct = (
    index: number,
    prod: string,
    matchedProduct?: ActivityProductItem | ProductOption,
  ) => {
    if (!prod) return;
    const target = targetItems[index];
    const current = target.productAdvice
      ? target.productAdvice
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    if (current.includes(prod)) return;

    const matchedProd =
      matchedProduct || effectiveProducts.find((p) => p.name === prod);
    const newAdvisedItem: Type1AdviceProductItem = {
      productId: matchedProd?.id || prod,
      productName: prod,
      productCode: matchedProd?.productCode || null,
      targetId: target.id,
    };

    const currentAdvised = target.advisedProducts || [];
    const updatedAdvised = [...currentAdvised, newAdvisedItem];
    const updated = [...current, prod].join(", ");

    setTargetItems((prev) => {
      const updatedList = [...prev];
      updatedList[index] = {
        ...updatedList[index],
        productAdvice: updated,
        advisedProducts: updatedAdvised,
      };
      return updatedList;
    });
  };

  const handleRemoveProduct = (index: number, prod: string) => {
    const target = targetItems[index];
    const current = target.productAdvice
      ? target.productAdvice
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const updated = current.filter((p) => p !== prod).join(", ");
    const currentAdvised = target.advisedProducts || [];
    const updatedAdvised = currentAdvised.filter((p) => p.productName !== prod);

    setTargetItems((prev) => {
      const updatedList = [...prev];
      updatedList[index] = {
        ...updatedList[index],
        productAdvice: updated,
        advisedProducts: updatedAdvised,
      };
      return updatedList;
    });
  };

  const isStore = target?.visitPurpose === "STORE";
  const hasFarmerTarget =
    effectiveTargets.some((t) => t.visitPurpose !== "STORE") || !isStore;

  if (!isVisible) return null;

  return (
    <div className="border border-emerald-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-emerald-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
            {isStore && !hasFarmerTarget ? (
              <Store className="w-4 h-4" />
            ) : (
              <UserCheck className="w-4 h-4" />
            )}
          </div>
          <div>
            <h2 className="font-bold text-emerald-900 text-base md:text-lg">
              บันทึกผลการเข้าพบจริง (ACTUAL) เข้าพบร้านค้า / Key Farmer
            </h2>
            <p className="text-xs text-slate-500">
              รายละเอียดแผนงานและบันทึกผลการเข้าพบจริง
            </p>
          </div>
        </div>
        {count > 1 && (
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            {count} เป้าหมาย
          </span>
        )}
      </div>

      {/* ACTUAL RESULTS FORM SECTION */}
      {hasMultipleTargets ? (
        /* MULTI-TARGET ACTUAL FORM (1 CARD PER TARGET) */
        <div className="space-y-4 pt-1">
          <div className="space-y-4">
            {targetItems.map((item, idx) => {
              const itemIsStore = item.visitPurpose === "STORE";
              const isAdviceTopic =
                item.topic?.trim() === "ให้คำแนะนำการใช้สินค้า" ||
                !!item.productAdvice ||
                !!item.salesOpportunity;

              const targetSelectedProducts = item.productAdvice
                ? item.productAdvice
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                : [];

              return (
                <div
                  key={item.id || idx}
                  className="border border-emerald-200/90 rounded-2xl p-4 sm:p-5 bg-emerald-50/25 space-y-4 shadow-2xs hover:border-emerald-300 transition-all"
                >
                  {/* Target Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100/90 pb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold shrink-0 shadow-2xs">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 text-sm block truncate">
                          เป้าหมายที่ {idx + 1}: {item.customer}
                        </span>
                        <span className="text-xs text-slate-500 block truncate">
                          {item.topic
                            ? `หัวข้อตามแผน: ${item.topic}`
                            : "ไม่ระบุหัวข้อ"}
                          {item.province ? ` • จังหวัด ${item.province}` : ""}
                          {item.notes ? ` (${item.notes})` : ""}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[11px] font-semibold px-2.5 py-0.5 rounded-lg shrink-0",
                        itemIsStore
                          ? "bg-sky-50 text-sky-800 border-sky-200"
                          : "bg-emerald-50 text-emerald-800 border-emerald-200",
                      )}
                    >
                      {itemIsStore ? "เข้าพบร้านค้า" : "เข้าพบเกษตรกร"}
                    </Badge>
                  </div>

                  {/* Target Specific Fields: FARMER ONLY */}
                  {!itemIsStore && (
                    <div className="space-y-4 pt-1 border-b border-emerald-100/70 pb-4">
                      {/* ที่อยู่บ้านเกษตรกร */}
                      <div className="space-y-1.5">
                        <label className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          ที่อยู่บ้านเกษตรกร ({item.customer})
                        </label>
                        <Textarea
                          rows={2}
                          value={item.farmerHomeAddress || ""}
                          onChange={(e) =>
                            handleTargetChange(
                              idx,
                              "farmerHomeAddress",
                              e.target.value,
                            )
                          }
                          placeholder="ระบุที่อยู่บ้านเกษตรกร เช่น เลขที่ หมู่ที่ ตำบล อำเภอ"
                          className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm"
                        />
                      </div>

                      {/* พิกัดแปลง (Plot Coordinates) */}
                      <ActivityGpsPicker
                        title={`พิกัดแปลงเกษตรกร - ${item.customer}`}
                        latitude={item.plotLatitude || ""}
                        longitude={item.plotLongitude || ""}
                        onLatitudeChange={(lat) =>
                          handleTargetChange(idx, "plotLatitude", lat)
                        }
                        onLongitudeChange={(lng) =>
                          handleTargetChange(idx, "plotLongitude", lng)
                        }
                        accentColor="emerald"
                      />

                      {/* รูปแปลงเกษตรกร (Plot Photos - Max 5) */}
                      <ActivityPhotoUpload
                        title={`รูปแปลงเกษตรกร - ${item.customer} (สูงสุด 5 รูป)`}
                        description="อัปโหลดรูปภาพแปลงเกษตรกร เช่น สภาพแปลง แปลงปลูก ต้นพืช"
                        images={item.plotImages || []}
                        onImagesChange={(imgs) =>
                          handleTargetChange(
                            idx,
                            "plotImages",
                            imgs.map((img) => ({
                              ...img,
                              targetId: item.id || item.targetId,
                              storeId: item.storeId || undefined,
                            })),
                          )
                        }
                        maxFiles={5}
                        accentColor="emerald"
                      />
                    </div>
                  )}

                  {/* สินค้าที่ให้คำแนะนำ & ประเมินโอกาสการขาย (Conditional) */}
                  {isAdviceTopic && (
                    <div className="space-y-3 pt-1 border-b border-emerald-100/70 pb-4">
                      <div className="space-y-1.5">
                        <label className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center justify-between">
                          <span>สินค้าที่ให้คำแนะนำ ({item.customer})</span>
                          {targetSelectedProducts.length > 0 && (
                            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              เลือกแล้ว {targetSelectedProducts.length} รายการ
                            </span>
                          )}
                        </label>

                        {targetSelectedProducts.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 p-2.5 bg-emerald-50/40 border border-emerald-200/60 rounded-xl mb-1.5">
                            {targetSelectedProducts.map((prod) => (
                              <span
                                key={prod}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-emerald-900 border border-emerald-200 shadow-2xs"
                              >
                                {prod}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProduct(idx, prod)}
                                  className="hover:bg-emerald-100 rounded-md p-0.5 transition-colors text-emerald-600 hover:text-red-600 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}

                        <ActivityProductSelect
                          id={`product-advice-select-${idx}`}
                          value=""
                          onChange={(val, prod) => {
                            if (val) handleAddProduct(idx, val, prod);
                          }}
                          products={effectiveProducts}
                          excludeValues={targetSelectedProducts}
                          subLabelType="code"
                          placeholder="เลือกสินค้าที่ให้คำแนะนำเพิ่มเติม (คลิกเลือกหลายรายการได้)"
                          searchPlaceholder="พิมพ์ชื่อ หรือรหัสสินค้าเพื่อค้นหา..."
                          emptyText="ไม่พบสินค้า"
                          triggerClassName="w-full bg-white border-slate-200 text-xs sm:text-sm h-10 min-h-[40px] rounded-xl font-normal hover:bg-slate-50 focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs sm:text-sm font-semibold text-slate-800">
                          ประเมินโอกาสการขาย{" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3 max-w-sm">
                          {(["สูง", "ต่ำ"] as const).map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() =>
                                handleTargetChange(idx, "salesOpportunity", opt)
                              }
                              className={cn(
                                "py-2 px-3 rounded-xl border text-xs sm:text-sm font-semibold cursor-pointer transition-all flex items-center justify-center",
                                item.salesOpportunity === opt
                                  ? opt === "สูง"
                                    ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                                    : "bg-amber-500 border-amber-500 text-white shadow-xs"
                                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                              )}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ผลการพูดคุย */}
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-semibold text-slate-800">
                      ผลการพูดคุยกับ {item.customer}{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <Textarea
                      rows={2}
                      value={item.discussionResult || ""}
                      onChange={(e) =>
                        handleTargetChange(
                          idx,
                          "discussionResult",
                          e.target.value,
                        )
                      }
                      placeholder={
                        itemIsStore
                          ? `สรุปประเด็นสำคัญจากการพูดคุยกับร้าน ${item.customer}`
                          : `สรุปประเด็นสำคัญจากการพูดคุยกับคุณ ${item.customer}`
                      }
                      className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm"
                    />
                  </div>

                  {/* สิ่งที่ต้องดำเนินการต่อ & วันที่นัดหมายครั้งถัดไป */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-semibold text-slate-800">
                        สิ่งที่ต้องดำเนินการต่อ ({item.customer})
                      </label>
                      <Input
                        value={item.nextAction || ""}
                        onChange={(e) =>
                          handleTargetChange(idx, "nextAction", e.target.value)
                        }
                        placeholder="เช่น ส่งตัวอย่างสินค้า, นัดหมายตรวจแปลง"
                        className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-semibold text-slate-800">
                        วันที่นัดหมายครั้งถัดไป
                      </label>
                      <DatePicker
                        value={item.nextMeetingDate || ""}
                        onChange={(v) =>
                          handleTargetChange(idx, "nextMeetingDate", v || "")
                        }
                        placeholder="เลือกวันที่นัดหมาย"
                        className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm h-10"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* SINGLE TARGET ACTUAL FORM (CLEAN STANDARD LAYOUT) */
        <div className="space-y-4 pt-1">
          <div className="flex items-center gap-2 pb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <h3 className="text-sm font-bold text-slate-800">
              บันทึกผลการเข้าพบจริง (ACTUAL)
            </h3>
          </div>

          {/* Farmer-Specific Actual Fields (Hidden in Store-Only Mode) */}
          {hasFarmerTarget && (
            <>
              {/* 1. ที่อยู่บ้านเกษตรกร */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  ที่อยู่บ้านเกษตรกร
                </label>
                <Textarea
                  rows={2}
                  value={
                    farmerHomeAddress ||
                    targetItems[0]?.farmerHomeAddress ||
                    target?.farmerHomeAddress ||
                    ""
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    if (setFarmerHomeAddress) setFarmerHomeAddress(v);
                    if (targetItems.length > 0) {
                      handleTargetChange(0, "farmerHomeAddress", v);
                    }
                  }}
                  placeholder="ระบุที่อยู่บ้านเกษตรกร เช่น เลขที่ หมู่ที่ ตำบล อำเภอ"
                  className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm"
                />
              </div>

              {/* 2. พิกัดแปลง (Plot Coordinates) */}
              <ActivityGpsPicker
                title="พิกัดแปลง (Plot Coordinates)"
                latitude={plotLatitude}
                longitude={plotLongitude}
                onLatitudeChange={(lat) => {
                  if (setPlotLatitude) setPlotLatitude(lat);
                  if (targetItems.length > 0) {
                    handleTargetChange(0, "plotLatitude", lat);
                  }
                }}
                onLongitudeChange={(lng) => {
                  if (setPlotLongitude) setPlotLongitude(lng);
                  if (targetItems.length > 0) {
                    handleTargetChange(0, "plotLongitude", lng);
                  }
                }}
                accentColor="emerald"
              />

              {/* 3. รูปแปลง (Plot Photos - Max 5) */}
              <ActivityPhotoUpload
                title="รูปแปลงเกษตรกร (สูงสุด 5 รูป)"
                description="อัปโหลดรูปภาพแปลงเกษตรกร เช่น สภาพแปลง แปลงปลูก ต้นพืช"
                images={plotImages}
                onImagesChange={(imgs) => {
                  if (setPlotImages) setPlotImages(imgs);
                  if (targetItems.length > 0) {
                    handleTargetChange(0, "plotImages", imgs);
                  }
                }}
                maxFiles={5}
                accentColor="emerald"
              />
            </>
          )}

          {/* 4. Conditional rendering for advice products & sales opportunity */}
          {(target?.topic?.trim() === "ให้คำแนะนำการใช้สินค้า" ||
            !!productAdvice ||
            !!salesOpportunity) && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center justify-between">
                  <span>สินค้าที่ให้คำแนะนำ (เลือกได้มากกว่า 1 รายการ)</span>
                  {productAdvice && (
                    <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      เลือกแล้ว{" "}
                      {
                        productAdvice
                          .split(",")
                          .map((s: string) => s.trim())
                          .filter(Boolean).length
                      }{" "}
                      รายการ
                    </span>
                  )}
                </label>

                {(() => {
                  const singleSelectedProducts = productAdvice
                    ? productAdvice
                        .split(",")
                        .map((s: string) => s.trim())
                        .filter(Boolean)
                    : [];

                  return (
                    <>
                      {singleSelectedProducts.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 p-2.5 bg-emerald-50/40 border border-emerald-200/60 rounded-xl mb-1.5">
                          {singleSelectedProducts.map((prod: string) => (
                            <span
                              key={prod}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-emerald-900 border border-emerald-200 shadow-2xs"
                            >
                              {prod}
                              <button
                                type="button"
                                onClick={() => {
                                  handleRemoveProduct(0, prod);
                                }}
                                className="hover:bg-emerald-100 rounded-md p-0.5 transition-colors text-emerald-600 hover:text-red-600 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      <ActivityProductSelect
                        id="product-advice-select-single"
                        value=""
                        onChange={(val, prod) => {
                          if (val) {
                            handleAddProduct(0, val, prod);
                          }
                        }}
                        products={effectiveProducts}
                        excludeValues={singleSelectedProducts}
                        subLabelType="code"
                        placeholder="เลือกสินค้าที่ให้คำแนะนำเพิ่มเติม (คลิกเลือกหลายรายการได้)"
                        searchPlaceholder="พิมพ์ชื่อ หรือรหัสสินค้าเพื่อค้นหา..."
                        emptyText="ไม่พบสินค้า"
                        triggerClassName="w-full bg-white border-slate-200 text-xs sm:text-sm h-10 min-h-[40px] rounded-xl font-normal hover:bg-slate-50 focus:ring-2 focus:ring-emerald-500"
                      />
                    </>
                  );
                })()}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-slate-800">
                  ประเมินโอกาสการขาย <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  {(["สูง", "ต่ำ"] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setSalesOpportunity(opt);
                        if (targetItems.length > 0) {
                          handleTargetChange(0, "salesOpportunity", opt);
                        }
                      }}
                      className={cn(
                        "py-2.5 px-4 rounded-xl border text-xs sm:text-sm font-semibold cursor-pointer transition-all flex items-center justify-center",
                        salesOpportunity === opt
                          ? opt === "สูง"
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                            : "bg-amber-500 border-amber-500 text-white shadow-xs"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* 5. ผลการพูดคุย */}
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-semibold text-slate-800">
              ผลการพูดคุย <span className="text-rose-500">*</span>
            </label>
            <Textarea
              rows={2}
              value={
                discussionResult ||
                targetItems[0]?.discussionResult ||
                target?.discussionResult ||
                ""
              }
              onChange={(e) => {
                const v = e.target.value;
                setDiscussionResult(v);
                if (targetItems.length > 0) {
                  handleTargetChange(0, "discussionResult", v);
                }
              }}
              placeholder={
                isStore
                  ? "สรุปประเด็นสำคัญจากการพูดคุยกับร้านค้า"
                  : "สรุปประเด็นสำคัญจากการพูดคุยกับเกษตรกร"
              }
              className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm"
            />
          </div>

          {/* 6. สิ่งที่ต้องดำเนินการต่อ & วันที่นัดหมายครั้งถัดไป */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-slate-800">
                สิ่งที่ต้องดำเนินการต่อ
              </label>
              <Input
                value={
                  nextAction ||
                  targetItems[0]?.nextAction ||
                  target?.nextAction ||
                  ""
                }
                onChange={(e) => {
                  const v = e.target.value;
                  setNextAction(v);
                  if (targetItems.length > 0) {
                    handleTargetChange(0, "nextAction", v);
                  }
                }}
                placeholder="เช่น ส่งตัวอย่างสินค้า, นัดหมายตรวจแปลง"
                className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm h-10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-slate-800">
                วันที่นัดหมายครั้งถัดไป
              </label>
              <DatePicker
                value={nextMeetingDate}
                onChange={(v) => {
                  const dateVal = v || "";
                  setNextMeetingDate(dateVal);
                  if (targetItems.length > 0) {
                    handleTargetChange(0, "nextMeetingDate", dateVal);
                  }
                }}
                placeholder="เลือกวันที่นัดหมาย"
                className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm h-10"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Backward-compatible alias
export const ActualType1Visit = Type1ActualForm;
