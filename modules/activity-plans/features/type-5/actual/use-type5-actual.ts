"use client";

import { useState, useRef, useCallback } from "react";
import type {
  ImageFile,
  Type5SurveyRecord,
} from "@/modules/activity-plans/features/shared/actual-view/types";
import {
  collectPermanentUrls,
  uploadActivityPlanImageGroup,
} from "@/modules/activity-plans/features/shared/actual-view/utils";

export function useType5Actual() {
  const [t5CompetitorBrand, setT5CompetitorBrand] = useState("");
  const [t5CompetitorProduct, setT5CompetitorProduct] = useState("");
  const [t5CompetitorPrice, setT5CompetitorPrice] = useState("");
  const [t5CompetitorUnit, setT5CompetitorUnit] = useState("");
  const [t5PromotionDetail, setT5PromotionDetail] = useState("");
  const [t5PriceTagImages, setT5PriceTagImages] = useState<ImageFile[]>([]);
  const [t5SurveyDetails, setT5SurveyDetails] = useState<Type5SurveyRecord[]>(
    [],
  );
  const initialT5SurveyDetailsRef = useRef<Type5SurveyRecord[]>([]);

  const handleUpdateT5SurveyItem = useCallback(
    (index: number, updated: Partial<Type5SurveyRecord>) => {
      setT5SurveyDetails((prev) => {
        const next = [...prev];
        if (next[index]) {
          next[index] = { ...next[index], ...updated };
        }
        return next;
      });
      if (index === 0) {
        if (updated.competitorBrand !== undefined)
          setT5CompetitorBrand(updated.competitorBrand);
        if (updated.competitorProduct !== undefined)
          setT5CompetitorProduct(updated.competitorProduct);
        if (updated.competitorPrice !== undefined)
          setT5CompetitorPrice(updated.competitorPrice);
        if (updated.competitorUnit !== undefined)
          setT5CompetitorUnit(updated.competitorUnit);
        if (updated.promotionDetail !== undefined)
          setT5PromotionDetail(updated.promotionDetail);
      }
    },
    [],
  );

  const hydrate = useCallback((parsed: any, extractedTargets?: any) => {
    const plannedT5Items = extractedTargets?.t5?.items || [];
    const defaultT5Records: Type5SurveyRecord[] = (
      plannedT5Items.length > 0
        ? plannedT5Items
        : [
            {
              store: extractedTargets?.t5?.store || "",
              product: extractedTargets?.t5?.product || "",
              detail: extractedTargets?.t5?.detail || "",
            },
          ]
    ).map((item: any) => ({
      id: item.id,
      storeId:
        item.storeId ||
        extractedTargets?.t5?.storeId ||
        undefined,
      store: item.store || "",
      productId: item.productId || undefined,
      product: item.product || "",
      detail: item.detail || "",
      competitorBrand: "",
      competitorProduct: "",
      posPrice: "",
      dealerPrice: "",
      subdealerPrice: "",
      farmerPrice: "",
      sellingPoints: "",
      bottleImages: [],
      promotionalImages: [],
    }));

    if (parsed) {
      if (parsed.t5CompetitorBrand) {
        setT5CompetitorBrand(parsed.t5CompetitorBrand);
      }
      if (parsed.t5CompetitorProduct) {
        setT5CompetitorProduct(parsed.t5CompetitorProduct);
      }
      if (parsed.t5CompetitorPrice) {
        setT5CompetitorPrice(parsed.t5CompetitorPrice);
      }
      if (parsed.t5CompetitorUnit) {
        setT5CompetitorUnit(parsed.t5CompetitorUnit);
      }
      if (parsed.t5PromotionDetail) {
        setT5PromotionDetail(parsed.t5PromotionDetail);
      }

      const savedT5List = parsed.t5SurveyDetails || [];
      const hydratedT5: Type5SurveyRecord[] = defaultT5Records.map(
        (plannedItem, idx) => {
          const matched =
            savedT5List.find(
              (s: any) =>
                (s.id && plannedItem.id && s.id === plannedItem.id) ||
                (s.store === plannedItem.store &&
                  s.product === plannedItem.product),
            ) || savedT5List[idx];

          if (matched) {
            return {
              id: plannedItem.id || matched.id,
              storeId:
                (matched as any).storeId ||
                (plannedItem as any).storeId ||
                extractedTargets?.t5?.storeId ||
                undefined,
              store: plannedItem.store || matched.store || "",
              productId:
                (matched as any).productId ||
                (plannedItem as any).productId ||
                undefined,
              product: plannedItem.product || matched.product || "",
              detail: plannedItem.detail || matched.detail || "",
              competitorBrand: matched.competitorBrand || "",
              competitorProduct: matched.competitorProduct || "",
              posPrice:
                matched.posPrice != null ? String(matched.posPrice) : "",
              dealerPrice:
                matched.dealerPrice != null
                  ? String(matched.dealerPrice)
                  : "",
              subdealerPrice:
                matched.subdealerPrice != null
                  ? String(matched.subdealerPrice)
                  : "",
              farmerPrice:
                matched.farmerPrice != null
                  ? String(matched.farmerPrice)
                  : "",
              sellingPoints: matched.sellingPoints || "",
              bottleImages: matched.bottleImages || [],
              promotionalImages: matched.promotionalImages || [],
            };
          }

          return {
            ...plannedItem,
            competitorBrand:
              idx === 0 ? parsed.t5CompetitorBrand || "" : "",
            competitorProduct:
              idx === 0 ? parsed.t5CompetitorProduct || "" : "",
            posPrice: "",
            dealerPrice: "",
            subdealerPrice: "",
            farmerPrice: "",
            sellingPoints: "",
            bottleImages: [],
            promotionalImages: [],
          };
        },
      );
      setT5SurveyDetails(hydratedT5);
      initialT5SurveyDetailsRef.current = JSON.parse(
        JSON.stringify(hydratedT5),
      );
    } else {
      setT5SurveyDetails(defaultT5Records);
      initialT5SurveyDetailsRef.current = JSON.parse(
        JSON.stringify(defaultT5Records),
      );
    }
  }, []);

  const uploadImages = useCallback(
    async (planId: string, newlyUploadedUrls: string[]): Promise<Type5SurveyRecord[]> => {
      if (!t5SurveyDetails || t5SurveyDetails.length === 0) {
        return t5SurveyDetails;
      }
      const updatedT5: Type5SurveyRecord[] = [];
      for (let i = 0; i < t5SurveyDetails.length; i++) {
        const rec = { ...t5SurveyDetails[i] };
        const surveyItemId = rec.id || `item-${i + 1}`;

        if (rec.bottleImages && rec.bottleImages.length > 0) {
          const res = await uploadActivityPlanImageGroup(
            planId,
            rec.bottleImages.slice(0, 2),
            "bottle",
            surveyItemId,
          );
          rec.bottleImages = res.updatedImages;
          newlyUploadedUrls.push(...res.newlyUploadedUrls);
        }

        if (rec.promotionalImages && rec.promotionalImages.length > 0) {
          const res = await uploadActivityPlanImageGroup(
            planId,
            rec.promotionalImages.slice(0, 3),
            "promo",
            surveyItemId,
          );
          rec.promotionalImages = res.updatedImages;
          newlyUploadedUrls.push(...res.newlyUploadedUrls);
        }

        updatedT5.push(rec);
      }
      setT5SurveyDetails(updatedT5);
      return updatedT5;
    },
    [t5SurveyDetails],
  );

  const collectOldImageUrlsToDelete = useCallback(
    (currentRecords: Type5SurveyRecord[] = t5SurveyDetails): string[] => {
      const initialUrls = (initialT5SurveyDetailsRef.current || []).flatMap(
        (rec) => [
          ...collectPermanentUrls(rec.bottleImages),
          ...collectPermanentUrls(rec.promotionalImages),
        ],
      );
      const currentUrls = new Set(
        currentRecords.flatMap((rec) => [
          ...collectPermanentUrls(rec.bottleImages),
          ...collectPermanentUrls(rec.promotionalImages),
        ]),
      );
      return initialUrls.filter((u) => !currentUrls.has(u));
    },
    [t5SurveyDetails],
  );

  const commitSavedImages = useCallback(
    (savedRecords: Type5SurveyRecord[] = t5SurveyDetails) => {
      initialT5SurveyDetailsRef.current = JSON.parse(
        JSON.stringify(savedRecords),
      );
    },
    [t5SurveyDetails],
  );

  const collectPayload = useCallback(
    (cleanDetails: Type5SurveyRecord[] = t5SurveyDetails) => {
      return {
        t5CompetitorBrand,
        t5CompetitorProduct,
        t5CompetitorPrice,
        t5CompetitorUnit,
        t5PromotionDetail,
        t5SurveyDetails: cleanDetails,
      };
    },
    [
      t5CompetitorBrand,
      t5CompetitorProduct,
      t5CompetitorPrice,
      t5CompetitorUnit,
      t5PromotionDetail,
      t5SurveyDetails,
    ],
  );

  return {
    t5CompetitorBrand,
    setT5CompetitorBrand,
    t5CompetitorProduct,
    setT5CompetitorProduct,
    t5CompetitorPrice,
    setT5CompetitorPrice,
    t5CompetitorUnit,
    setT5CompetitorUnit,
    t5PromotionDetail,
    setT5PromotionDetail,
    t5PriceTagImages,
    setT5PriceTagImages,
    t5SurveyDetails,
    setT5SurveyDetails,
    handleUpdateT5SurveyItem,
    hydrate,
    uploadImages,
    collectOldImageUrlsToDelete,
    commitSavedImages,
    collectPayload,
  };
}
