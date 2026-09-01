"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle, Check } from "lucide-react";
import {
  getActivityPlanAction,
  recordActivityResultAction,
  recordDemoPlotVisitAction,
  getDemoPlotHistoryAction,
} from "../../server/actions";
import { listProductsAction } from "@/modules/products/server/actions";
import type {
  PlanSummaryData,
  ImageFile,
  ActualTargetsState,
  ActivityResultStatusType,
  Type5SurveyRecord,
} from "./types";
import {
  extractPlanData,
  parseResultSummary,
  buildResultSummary,
  parseCleanNumber,
  uploadActivityPlanImageGroup,
  collectPermanentUrls,
  deleteActivityPlanImagePaths,
} from "./utils";
import {
  ActualViewHeader,
  ActualPlanSummary,
  ActivityResultSection,
  ActivityStatusSection,
  ActualViewActions,
} from "./components";

interface ActivityPlanActualViewProps {
  id?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
}

const initialTargets: ActualTargetsState = {
  t1: {
    customer: "",
    topic: "",
    detail: "",
    opportunity: "",
    nextDate: "",
  },
  t2: {
    product: "",
    customer: "",
    detail: "",
    expectedResult: "",
    items: [],
  },
  t3: {
    product: "",
    customer: "",
    targetQty: "",
    targetSales: "",
    items: [],
  },
  t4: {
    customer: "",
    orderNo: "",
    targetCollect: "",
    items: [],
  },
  t5: {
    store: "",
    product: "",
    detail: "",
    items: [],
  },
  t6: {
    customer: "",
    issueType: "",
    detail: "",
    targetStatus: "",
    items: [],
  },
  t7: {
    owner: "",
    product: "",
    crop: "",
    plots: "",
    demoProductQuantity: "",
    objective: "",
    experimentDetail: "",
    detail: "",
    targetCondition: "",
    items: [],
  },
  t8: {
    topic: "",
    products: "",
    targetAttendees: "",
  },
  t9: {
    store: "",
    isSubDealer: false,
    subDealerStore: "",
    product: "",
    targetSales: "",
    targetAttendees: "",
    items: [],
  },
  t10: {
    plot: "",
    location: "",
    showcase: "",
    targetAttendees: "",
    targetSales: "",
  },
  t11: {
    store: "",
    detail: "",
    targetOpportunity: "",
  },
};

const initialPlanSummary: PlanSummaryData = {
  planNo: "",
  title: "",
  startDateStr: "",
  endDateStr: "",
  startTimeStr: "",
  endTimeStr: "",
  timeStr: "",
  locationStr: "",
  location: undefined,
  province: undefined,
  district: undefined,
  marketingBudget: undefined,
  salesPromotionBudget: undefined,
  extraExpenseAmount: undefined,
  extraExpenseDetail: "",
  targetSales: undefined,
  isPromotionalMediaSelected: false,
  marketingProductItems: [],
  isSalesPromotionSelected: false,
  salesPromotionItems: [],
  requisitionItems: [],
  objective: undefined,
  notes: undefined,
  helpers: undefined,
  helperEmployeeNames: undefined,
};

export default function ActivityPlanActualView({
  id,
  onCancel,
  onSuccess,
}: ActivityPlanActualViewProps) {
  const router = useRouter();

  // Loading & Feedback State
  const [loadingPlan, setLoadingPlan] = useState(!!id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Plan Summary & Work Types
  const [planSummary, setPlanSummary] =
    useState<PlanSummaryData>(initialPlanSummary);
  const [planWorkTypes, setPlanWorkTypes] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [targets, setTargets] = useState<ActualTargetsState>(initialTargets);

  // Activity Result Status
  const [activityResultStatus, setActivityResultStatus] =
    useState<ActivityResultStatusType>("PARTIAL");
  const [cancelReason, setCancelReason] = useState("");
  const [postponedDate, setPostponedDate] = useState("");
  const [postponedTime, setPostponedTime] = useState("");
  const [postponedReason, setPostponedReason] = useState("");
  const [postponedNotes, setPostponedNotes] = useState("");

  // Work Type 1 States
  const [t1ProductAdvice, setT1ProductAdvice] = useState("");
  const [t1Detail, setT1Detail] = useState("");
  const [t1DiscussionResult, setT1DiscussionResult] = useState("");
  const [t1SalesOpportunity, setT1SalesOpportunity] = useState<
    "สูง" | "ต่ำ" | ""
  >("");
  const [t1NextAction, setT1NextAction] = useState("");
  const [t1NextMeetingDate, setT1NextMeetingDate] = useState("");

  // Work Type 2 States
  const [t2CustomerName, setT2CustomerName] = useState("");
  const [t2FollowupDetail, setT2FollowupDetail] = useState("");
  const [t2Detail, setT2Detail] = useState("");
  const [t2UsageResult, setT2UsageResult] = useState<
    "พืชตอบสนองดี" | "พบปัญหา" | ""
  >("");
  const [t2ProblemDetail, setT2ProblemDetail] = useState("");

  // Work Type 3 States
  const [t3SoldProducts, setT3SoldProducts] = useState("");
  const [t3ActualSales, setT3ActualSales] = useState("");
  const [t3ActualQuantity, setT3ActualQuantity] = useState("");
  const [t3UnclosedReason, setT3UnclosedReason] = useState("");
  const [t3ProductSalesDetails, setT3ProductSalesDetails] = useState<any[]>([]);

  // Work Type 4 States
  const [t4OrderNo, setT4OrderNo] = useState("");
  const [t4ReceivedAmount, setT4ReceivedAmount] = useState("");
  const [t4PaymentImages, setT4PaymentImages] = useState<ImageFile[]>([]);

  // Work Type 5 States
  const [t5CompetitorBrand, setT5CompetitorBrand] = useState("");
  const [t5CompetitorProduct, setT5CompetitorProduct] = useState("");
  const [t5CompetitorPrice, setT5CompetitorPrice] = useState("");
  const [t5CompetitorUnit, setT5CompetitorUnit] = useState("");
  const [t5PromotionDetail, setT5PromotionDetail] = useState("");
  const [t5PriceTagImages, setT5PriceTagImages] = useState<ImageFile[]>([]);
  const [t5SurveyDetails, setT5SurveyDetails] = useState<Type5SurveyRecord[]>([]);
  const initialT5SurveyDetailsRef = useRef<Type5SurveyRecord[]>([]);

  // Work Type 6 States
  const [t6ProblemDetail, setT6ProblemDetail] = useState("");
  const [t6InitialSolution, setT6InitialSolution] = useState("");
  const [t6Status, setT6Status] = useState<"เสร็จสิ้น" | "รอติดตาม" | "">("เสร็จสิ้น");
  const [t6Images, setT6Images] = useState<ImageFile[]>([]);
  const initialT6ImagesRef = useRef<ImageFile[]>([]);

  // Work Type 7 States
  const [t7StartDate, setT7StartDate] = useState("");
  const [t7ProductPrice] = useState(500);
  const [t7PlotName, setT7PlotName] = useState("");
  const [t7PlannedProductId, setT7PlannedProductId] = useState<string | null>(
    null,
  );
  const [t7ActualProductId, setT7ActualProductId] = useState<string | null>(
    null,
  );
  const [t7ActualQuantity, setT7ActualQuantity] = useState("");
  const [t7ChangeReason, setT7ChangeReason] = useState("");
  const [t7PlotObjective, setT7PlotObjective] = useState("");
  const [t7CustomPlotDetail, setT7CustomPlotDetail] = useState("");
  const [t7UsageMethod, setT7UsageMethod] = useState("");
  const [t7PlantingDate, setT7PlantingDate] = useState("");
  const [t7PlantingAreaCondition, setT7PlantingAreaCondition] = useState("");
  const [t7CropImages, setT7CropImages] = useState<ImageFile[]>([]);
  const initialT7CropImagesRef = useRef<ImageFile[]>([]);
  const [t7CropAgeValue, setT7CropAgeValue] = useState("");
  const [t7CropAgeUnit, setT7CropAgeUnit] = useState("วัน");
  const [t7GrowthStage, setT7GrowthStage] = useState("");
  const [t7CropCondition, setT7CropCondition] = useState<
    "สมบูรณ์" | "มีปัญหา" | "ปานกลาง" | "ทรุดโทรม" | ""
  >("");
  const [t7CropProblemDescription, setT7CropProblemDescription] = useState("");
  const [t7ProductResponse, setT7ProductResponse] = useState<
    "พืชตอบสนองดี" | "พบปัญหา" | ""
  >("");
  const [t7ProblemDescription, setT7ProblemDescription] = useState("");
  const [t7PlotImages, setT7PlotImages] = useState<ImageFile[]>([]);
  const initialT7PlotImagesRef = useRef<ImageFile[]>([]);
  const [t7PlotStatus, setT7PlotStatus] =
    useState<"IN_PROGRESS" | "COMPLETED" | "FAILED">("IN_PROGRESS");
  const [t7NextFollowUpDate, setT7NextFollowUpDate] = useState("");
  const [t7FinalYieldKg, setT7FinalYieldKg] = useState("");
  const [t7ControlYieldKg, setT7ControlYieldKg] = useState("");
  const [t7YieldIncreasePercent, setT7YieldIncreasePercent] = useState("");
  const [t7FarmerSatisfaction, setT7FarmerSatisfaction] = useState(5);
  const [t7CommercialPotential, setT7CommercialPotential] = useState("");
  const [t7FinalSummaryNotes, setT7FinalSummaryNotes] = useState("");
  const [t7DemoPlotId, setT7DemoPlotId] = useState<string | null>(null);
  const [t7VisitHistory, setT7VisitHistory] = useState<any[]>([]);
  const [t7DemoPlotData, setT7DemoPlotData] = useState<any>(null);

  // Work Type 8 States
  const [t8ActualAttendees, setT8ActualAttendees] = useState("");
  const [t8FeedbackQnA, setT8FeedbackQnA] = useState("");
  const [t8ProductSalesDetails, setT8ProductSalesDetails] = useState<any[]>([]);
  const [t8Images, setT8Images] = useState<ImageFile[]>([]);
  const initialT8ImagesRef = useRef<ImageFile[]>([]);

  // Work Type 9 States
  const [t9Formats, setT9Formats] = useState<string[]>([]);
  const [t9ActualSales, setT9ActualSales] = useState("");
  const [t9ProductSalesDetails, setT9ProductSalesDetails] = useState<any[]>([]);
  const [t9ActualAttendees, setT9ActualAttendees] = useState("");
  const [t9Images, setT9Images] = useState<ImageFile[]>([]);
  const initialT9ImagesRef = useRef<ImageFile[]>([]);

  // Work Type 10 States
  const [t10ActualAttendees, setT10ActualAttendees] = useState("");
  const [t10ActualSalesOrBooking, setT10ActualSalesOrBooking] = useState("");
  const [t10TargetFarmersList, setT10TargetFarmersList] = useState("");
  const [t10FarmerFeedback, setT10FarmerFeedback] = useState<
    "สูง" | "กลาง" | "ต่ำ" | ""
  >("");
  const [t10Images, setT10Images] = useState<ImageFile[]>([]);
  const initialT10ImagesRef = useRef<ImageFile[]>([]);

  // Work Type 11 States
  const [t11StockItems, setT11StockItems] = useState<any[]>([]);
  const [t11ProductList, setT11ProductList] = useState("");
  const [t11RemainingQty, setT11RemainingQty] = useState("");
  const [t11Remarks, setT11Remarks] = useState("");
  const [t11StockStatus, setT11StockStatus] = useState<
    "ใกล้หมด" | "ขาดสต็อก" | ""
  >("");
  const [t11ReorderOpportunity, setT11ReorderOpportunity] = useState<
    "สูง" | "ต่ำ" | "ยังไม่แน่ใจ" | ""
  >("");
  const [t11NextAction, setT11NextAction] = useState("");

  // Load products list once
  useEffect(() => {
    listProductsAction({ status: "ACTIVE", perPage: 1000 })
      .then((res: any) => {
        if (res?.success && res?.data) {
          setProducts(res.data);
        } else if (res?.products) {
          setProducts(res.products);
        }
      })
      .catch(() => {});
  }, []);

  // Load plan details if ID passed
  useEffect(() => {
    if (!id) return;
    async function loadData() {
      try {
        setLoadingPlan(true);
        const res = await getActivityPlanAction(id!);
        if (res.success && res.plan) {
          const p = res.plan;

          const extracted = extractPlanData(p, initialTargets);
          setPlanSummary(extracted.planSummary);
          setPlanWorkTypes(extracted.resolvedWorkTypes);
          setTargets(extracted.targets);

          if (extracted.t7StartDate) {
            setT7StartDate(extracted.t7StartDate);
          }
          if (extracted.targets.t7?.plannedProductId) {
            setT7PlannedProductId(extracted.targets.t7.plannedProductId);
          } else if (extracted.targets.t7?.productId) {
            setT7PlannedProductId(extracted.targets.t7.productId);
          }
          if (extracted.targets.t7?.demoProductQuantity) {
            setT7ActualQuantity(
              String(extracted.targets.t7.demoProductQuantity),
            );
          }

          if (extracted.t7PlotIdentifier) {
            getDemoPlotHistoryAction(extracted.t7PlotIdentifier).then(
              (histRes) => {
                if (histRes.success && histRes.plot) {
                  setT7DemoPlotId(histRes.plot.id);
                  setT7DemoPlotData(histRes.plot);
                  setT7VisitHistory(histRes.plot.visits || []);
                  if (histRes.plot.plotName) {
                    setT7PlotName(histRes.plot.plotName);
                  }
                  if (histRes.plot.plantingDate) {
                    setT7PlantingDate(
                      new Date(histRes.plot.plantingDate)
                        .toISOString()
                        .split("T")[0],
                    );
                  }
                  if (histRes.plot.demoYieldKg) {
                    setT7FinalYieldKg(String(histRes.plot.demoYieldKg));
                  }
                  if (histRes.plot.controlYieldKg) {
                    setT7ControlYieldKg(String(histRes.plot.controlYieldKg));
                  }
                  if (histRes.plot.yieldIncreasePercent) {
                    setT7YieldIncreasePercent(
                      String(histRes.plot.yieldIncreasePercent),
                    );
                  }
                  if (histRes.plot.farmerSatisfaction) {
                    setT7FarmerSatisfaction(histRes.plot.farmerSatisfaction);
                  }
                  if (histRes.plot.commercialPotential) {
                    setT7CommercialPotential(histRes.plot.commercialPotential);
                  }
                  if (histRes.plot.finalSummaryNotes) {
                    setT7FinalSummaryNotes(histRes.plot.finalSummaryNotes);
                  }
                }
              },
            );
          }

          // Restore saved post-activity outcome (p.result) if exists
          if ((p as any).result) {
            const parsed = parseResultSummary((p as any).result);

            // Activity Result Status & Postponed / Cancelled fields
            if (parsed.activityResultStatus) {
              setActivityResultStatus(parsed.activityResultStatus);
            }
            if (parsed.cancelReason) setCancelReason(parsed.cancelReason);
            if (parsed.postponedDate) setPostponedDate(parsed.postponedDate);
            if (parsed.postponedTime) setPostponedTime(parsed.postponedTime);
            if (parsed.postponedReason) setPostponedReason(parsed.postponedReason);
            if (parsed.postponedNotes) setPostponedNotes(parsed.postponedNotes);

            // Type 1
            if (parsed.t1ProductAdvice) setT1ProductAdvice(parsed.t1ProductAdvice);
            if (parsed.t1SalesOpportunity) {
              setT1SalesOpportunity(parsed.t1SalesOpportunity);
            }
            if (parsed.t1DiscussionResult) {
              setT1DiscussionResult(parsed.t1DiscussionResult);
            }
            if (parsed.t1Detail) setT1Detail(parsed.t1Detail);
            if (parsed.t1NextAction) setT1NextAction(parsed.t1NextAction);
            if (parsed.t1NextMeetingDate) {
              setT1NextMeetingDate(parsed.t1NextMeetingDate);
            }

            // Type 2
            if (parsed.t2CustomerName) setT2CustomerName(parsed.t2CustomerName);
            if (parsed.t2FollowupDetail) {
              setT2FollowupDetail(parsed.t2FollowupDetail);
              setT2Detail(parsed.t2FollowupDetail);
            }
            if (parsed.t2UsageResult) setT2UsageResult(parsed.t2UsageResult);
            if (parsed.t2ProblemDetail) setT2ProblemDetail(parsed.t2ProblemDetail);

            // Type 3
            if (parsed.t3SoldProducts) setT3SoldProducts(parsed.t3SoldProducts);
            if (parsed.t3ActualSales) setT3ActualSales(parsed.t3ActualSales);
            if (parsed.t3ActualQuantity) {
              setT3ActualQuantity(parsed.t3ActualQuantity);
            }
            if (parsed.t3UnclosedReason) {
              setT3UnclosedReason(parsed.t3UnclosedReason);
            }
            if (parsed.t3ProductSalesDetails) {
              setT3ProductSalesDetails(parsed.t3ProductSalesDetails);
            }

            // Type 4
            if (parsed.t4OrderNo) setT4OrderNo(parsed.t4OrderNo);
            if (parsed.t4ReceivedAmount) {
              setT4ReceivedAmount(parsed.t4ReceivedAmount);
            }

            // Type 5
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

            const plannedT5Items = extracted.targets.t5.items || [];
            const defaultT5Records: Type5SurveyRecord[] = (
              plannedT5Items.length > 0
                ? plannedT5Items
                : [
                    {
                      store: extracted.targets.t5.store || "",
                      product: extracted.targets.t5.product || "",
                      detail: extracted.targets.t5.detail || "",
                    },
                  ]
            ).map((item) => ({
              id: item.id,
              store: item.store || "",
              product: item.product || "",
              detail: item.detail || "",
              competitorBrand: "",
              competitorProduct: "",
              competitorPrice: "",
              competitorUnit: "ขวด",
              promotionDetail: "",
              priceTagImages: [],
              shelfImages: [],
            }));

            const savedT5List = parsed.t5SurveyDetails || [];
            const hydratedT5: Type5SurveyRecord[] = defaultT5Records.map(
              (plannedItem, idx) => {
                const matched =
                  savedT5List.find(
                    (s) =>
                      (s.id && plannedItem.id && s.id === plannedItem.id) ||
                      (s.store === plannedItem.store &&
                        s.product === plannedItem.product),
                  ) || savedT5List[idx];

                if (matched) {
                  return {
                    id: plannedItem.id || matched.id,
                    store: plannedItem.store || matched.store || "",
                    product: plannedItem.product || matched.product || "",
                    detail: plannedItem.detail || matched.detail || "",
                    competitorBrand: matched.competitorBrand || "",
                    competitorProduct: matched.competitorProduct || "",
                    competitorPrice: matched.competitorPrice || "",
                    competitorUnit: matched.competitorUnit || "ขวด",
                    promotionDetail: matched.promotionDetail || "",
                    priceTagImages: matched.priceTagImages || [],
                    shelfImages: matched.shelfImages || [],
                  };
                }

                return {
                  ...plannedItem,
                  competitorBrand:
                    idx === 0 ? parsed.t5CompetitorBrand || "" : "",
                  competitorProduct:
                    idx === 0 ? parsed.t5CompetitorProduct || "" : "",
                  competitorPrice:
                    idx === 0 ? parsed.t5CompetitorPrice || "" : "",
                  competitorUnit:
                    idx === 0 ? parsed.t5CompetitorUnit || "ขวด" : "ขวด",
                  promotionDetail:
                    idx === 0 ? parsed.t5PromotionDetail || "" : "",
                  priceTagImages: [],
                  shelfImages: [],
                };
              },
            );
            setT5SurveyDetails(hydratedT5);
            initialT5SurveyDetailsRef.current = JSON.parse(
              JSON.stringify(hydratedT5),
            );

            // Type 6
            if (parsed.t6ProblemDetail) {
              setT6ProblemDetail(parsed.t6ProblemDetail);
            } else if (parsed.problemFound) {
              setT6ProblemDetail((prev) => prev || parsed.problemFound || "");
            }
            if (parsed.t6InitialSolution) {
              setT6InitialSolution(parsed.t6InitialSolution);
            }
            if (parsed.t6Status) setT6Status(parsed.t6Status);
            if (parsed.t6Images && parsed.t6Images.length > 0) {
              setT6Images(parsed.t6Images);
              initialT6ImagesRef.current = JSON.parse(
                JSON.stringify(parsed.t6Images),
              );
            }

            // Type 7
            if (parsed.t7PlotName) setT7PlotName(parsed.t7PlotName);
            if (parsed.t7PlannedProductId) {
              setT7PlannedProductId(parsed.t7PlannedProductId);
            }
            if (parsed.t7ActualProductId) {
              setT7ActualProductId(parsed.t7ActualProductId);
            }
            if (parsed.t7DemoProductQuantity) {
              setT7ActualQuantity(String(parsed.t7DemoProductQuantity));
            }
            if (parsed.t7ChangeReason) {
              setT7ChangeReason(parsed.t7ChangeReason);
            }
            if (parsed.t7PlotObjective) {
              setT7PlotObjective(parsed.t7PlotObjective);
            }
            if (parsed.t7CustomPlotDetail) {
              setT7CustomPlotDetail(parsed.t7CustomPlotDetail);
            }
            if (parsed.t7DemoPlotId) {
              setT7DemoPlotId(parsed.t7DemoPlotId);
            }
            if (parsed.t7UsageMethod) setT7UsageMethod(parsed.t7UsageMethod);
            if (parsed.t7CropAgeValue) setT7CropAgeValue(parsed.t7CropAgeValue);
            if (parsed.t7CropAgeUnit) setT7CropAgeUnit(parsed.t7CropAgeUnit);
            if (parsed.t7GrowthStage) setT7GrowthStage(parsed.t7GrowthStage);
            if (parsed.t7CropCondition) setT7CropCondition(parsed.t7CropCondition);
            if (parsed.t7CropProblemDescription) {
              setT7CropProblemDescription(parsed.t7CropProblemDescription);
            }
            if (parsed.t7ProductResponse) {
              setT7ProductResponse(parsed.t7ProductResponse);
            }
            if (parsed.t7ProblemDescription) {
              setT7ProblemDescription(parsed.t7ProblemDescription);
            }
            if (parsed.t7PlantingDate) setT7PlantingDate(parsed.t7PlantingDate);
            if (parsed.t7PlantingAreaCondition) {
              setT7PlantingAreaCondition(parsed.t7PlantingAreaCondition);
            }
            if (parsed.t7PlotStatus) setT7PlotStatus(parsed.t7PlotStatus);
            if (parsed.t7NextFollowUpDate) {
              setT7NextFollowUpDate(parsed.t7NextFollowUpDate);
            }
            if (parsed.t7FinalYieldKg) setT7FinalYieldKg(parsed.t7FinalYieldKg);
            if (parsed.t7ControlYieldKg) {
              setT7ControlYieldKg(parsed.t7ControlYieldKg);
            }
            if (parsed.t7YieldIncreasePercent) {
              setT7YieldIncreasePercent(parsed.t7YieldIncreasePercent);
            }
            if (parsed.t7FarmerSatisfaction) {
              setT7FarmerSatisfaction(parsed.t7FarmerSatisfaction);
            }
            if (parsed.t7CommercialPotential) {
              setT7CommercialPotential(parsed.t7CommercialPotential);
            }
            if (parsed.t7FinalSummaryNotes) {
              setT7FinalSummaryNotes(parsed.t7FinalSummaryNotes);
            }
            if (parsed.t7CropImages && parsed.t7CropImages.length > 0) {
              setT7CropImages(parsed.t7CropImages);
              initialT7CropImagesRef.current = JSON.parse(
                JSON.stringify(parsed.t7CropImages),
              );
            }
            if (parsed.t7PlotImages && parsed.t7PlotImages.length > 0) {
              setT7PlotImages(parsed.t7PlotImages);
              initialT7PlotImagesRef.current = JSON.parse(
                JSON.stringify(parsed.t7PlotImages),
              );
            }

            // Type 8
            if (parsed.t8ActualAttendees) {
              setT8ActualAttendees(parsed.t8ActualAttendees);
            }
            if (parsed.t8FeedbackQnA) setT8FeedbackQnA(parsed.t8FeedbackQnA);
            if (parsed.t8ProductSalesDetails) {
              setT8ProductSalesDetails(parsed.t8ProductSalesDetails);
            }
            if (parsed.t8Images && parsed.t8Images.length > 0) {
              setT8Images(parsed.t8Images);
              initialT8ImagesRef.current = JSON.parse(
                JSON.stringify(parsed.t8Images),
              );
            }

            // Type 9
            if (parsed.t9ActualSales) setT9ActualSales(parsed.t9ActualSales);
            if (parsed.t9ProductSalesDetails) {
              setT9ProductSalesDetails(parsed.t9ProductSalesDetails);
            }
            if (parsed.t9ActualAttendees) {
              setT9ActualAttendees(parsed.t9ActualAttendees);
            }
            if (parsed.t9Images && parsed.t9Images.length > 0) {
              setT9Images(parsed.t9Images);
              initialT9ImagesRef.current = JSON.parse(
                JSON.stringify(parsed.t9Images),
              );
            }

            // Type 10
            if (parsed.t10ActualAttendees) {
              setT10ActualAttendees(parsed.t10ActualAttendees);
            }
            if (parsed.t10ActualSalesOrBooking) {
              setT10ActualSalesOrBooking(parsed.t10ActualSalesOrBooking);
            }
            if (parsed.t10FarmerFeedback) {
              const fb = parsed.t10FarmerFeedback;
              if (fb === "สูง" || fb === "น้อย") {
                setT10FarmerFeedback(fb === "น้อย" ? "ต่ำ" : fb);
              } else if (fb === "ปานกลาง") {
                setT10FarmerFeedback("กลาง");
              }
            }
            if (parsed.t10TargetFarmersList) {
              setT10TargetFarmersList(parsed.t10TargetFarmersList);
            }
            if (parsed.t10Images && parsed.t10Images.length > 0) {
              setT10Images(parsed.t10Images);
              initialT10ImagesRef.current = JSON.parse(
                JSON.stringify(parsed.t10Images),
              );
            }

            // Type 11
            if (parsed.t11StockItems) setT11StockItems(parsed.t11StockItems);
            if (parsed.t11ProductList) setT11ProductList(parsed.t11ProductList);
            if (parsed.t11RemainingQty) setT11RemainingQty(parsed.t11RemainingQty);
            if (parsed.t11Remarks) setT11Remarks(parsed.t11Remarks);
            if (parsed.t11StockStatus) {
              const st = parsed.t11StockStatus;
              if (st === "ใกล้หมด") setT11StockStatus("ใกล้หมด");
              else if (st === "สินค้าขาดสต็อก") setT11StockStatus("ขาดสต็อก");
            }
            if (parsed.t11ReorderOpportunity) {
              const ro = parsed.t11ReorderOpportunity;
              if (ro === "สูง" || ro === "ต่ำ") setT11ReorderOpportunity(ro);
            }
            if (parsed.t11NextAction) {
              setT11NextAction(parsed.t11NextAction);
            } else if (parsed.nextAction) {
              setT11NextAction(parsed.nextAction);
            }
          } else {
            const plannedT5Items = extracted.targets.t5.items || [];
            const defaultT5Records: Type5SurveyRecord[] = (
              plannedT5Items.length > 0
                ? plannedT5Items
                : [
                    {
                      store: extracted.targets.t5.store || "",
                      product: extracted.targets.t5.product || "",
                      detail: extracted.targets.t5.detail || "",
                    },
                  ]
            ).map((item) => ({
              id: item.id,
              store: item.store || "",
              product: item.product || "",
              detail: item.detail || "",
              competitorBrand: "",
              competitorProduct: "",
              competitorPrice: "",
              competitorUnit: "ขวด",
              promotionDetail: "",
              priceTagImages: [],
              shelfImages: [],
            }));
            setT5SurveyDetails(defaultT5Records);
          }
        }
      } catch (e) {
        console.error("Failed to load plan for actual record", e);
      } finally {
        setLoadingPlan(false);
      }
    }
    loadData();
  }, [id]);

  // Image helpers
  const createUploadHandler = (
    setter: React.Dispatch<React.SetStateAction<ImageFile[]>>,
  ) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.length) return;
      const files = Array.from(e.target.files);
      const newItems = files.map((file, idx) => ({
        id: `img-${Date.now()}-${idx}`,
        url: URL.createObjectURL(file),
        name: file.name,
      }));
      setter((prev) => [...prev, ...newItems]);
    };
  };

  const handleUpdateT5SurveyItem = (
    index: number,
    updated: Partial<Type5SurveyRecord>,
  ) => {
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
  };

  const removeImage = (
    setter: React.Dispatch<React.SetStateAction<ImageFile[]>>,
    imgId: string,
  ) => {
    setter((prev) => prev.filter((img) => img.id !== imgId));
  };

  const handleBack = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  const isTypeVisible = (typeTitle: string) => {
    if (planWorkTypes.length > 0) {
      return planWorkTypes.includes(typeTitle);
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    const allNewlyUploadedUrls: string[] = [];

    try {
      if (id) {
        // --- 1. UPLOAD NEW IMAGES ACROSS ALL WORK TYPES ---
        // Work Type 5
        let cleanT5SurveyDetails = t5SurveyDetails;
        if (
          isTypeVisible("สำรวจตลาดของคู่แข่ง") &&
          t5SurveyDetails &&
          t5SurveyDetails.length > 0
        ) {
          const updatedT5: Type5SurveyRecord[] = [];
          for (let i = 0; i < t5SurveyDetails.length; i++) {
            const rec = { ...t5SurveyDetails[i] };
            const surveyItemId = rec.id || `item-${i + 1}`;

            if (rec.priceTagImages && rec.priceTagImages.length > 0) {
              const res = await uploadActivityPlanImageGroup(
                id,
                rec.priceTagImages,
                "price-tag",
                surveyItemId,
              );
              rec.priceTagImages = res.updatedImages;
              allNewlyUploadedUrls.push(...res.newlyUploadedUrls);
            }

            if (rec.shelfImages && rec.shelfImages.length > 0) {
              const res = await uploadActivityPlanImageGroup(
                id,
                rec.shelfImages,
                "shelf",
                surveyItemId,
              );
              rec.shelfImages = res.updatedImages;
              allNewlyUploadedUrls.push(...res.newlyUploadedUrls);
            }

            updatedT5.push(rec);
          }
          cleanT5SurveyDetails = updatedT5;
          setT5SurveyDetails(cleanT5SurveyDetails);
        }

        // Work Type 6
        let cleanT6Images = t6Images;
        if (
          isTypeVisible("แก้ปัญหา / รับเรื่องร้องเรียน") &&
          t6Images &&
          t6Images.length > 0
        ) {
          const res = await uploadActivityPlanImageGroup(
            id,
            t6Images,
            "issue",
            "general",
          );
          cleanT6Images = res.updatedImages;
          allNewlyUploadedUrls.push(...res.newlyUploadedUrls);
          setT6Images(cleanT6Images);
        }

        // Work Type 7
        let cleanT7CropImages = t7CropImages;
        let cleanT7PlotImages = t7PlotImages;
        if (isTypeVisible("ติดตามแปลงสาธิต / ทำแปลง")) {
          const plotItemId = t7DemoPlotId || targets.t7.owner || "demo-plot";
          if (t7CropImages && t7CropImages.length > 0) {
            const res = await uploadActivityPlanImageGroup(
              id,
              t7CropImages,
              "crop",
              plotItemId,
            );
            cleanT7CropImages = res.updatedImages;
            allNewlyUploadedUrls.push(...res.newlyUploadedUrls);
            setT7CropImages(cleanT7CropImages);
          }
          if (t7PlotImages && t7PlotImages.length > 0) {
            const res = await uploadActivityPlanImageGroup(
              id,
              t7PlotImages,
              "plot",
              plotItemId,
            );
            cleanT7PlotImages = res.updatedImages;
            allNewlyUploadedUrls.push(...res.newlyUploadedUrls);
            setT7PlotImages(cleanT7PlotImages);
          }
        }

        // Work Type 8
        let cleanT8Images = t8Images;
        if (
          isTypeVisible("จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์") &&
          t8Images &&
          t8Images.length > 0
        ) {
          const res = await uploadActivityPlanImageGroup(
            id,
            t8Images,
            "meeting",
            "general",
          );
          cleanT8Images = res.updatedImages;
          allNewlyUploadedUrls.push(...res.newlyUploadedUrls);
          setT8Images(cleanT8Images);
        }

        // Work Type 9
        let cleanT9Images = t9Images;
        if (
          isTypeVisible("จัดกิจกรรมส่งเสริมการขายหน้าร้าน") &&
          t9Images &&
          t9Images.length > 0
        ) {
          const res = await uploadActivityPlanImageGroup(
            id,
            t9Images,
            "store",
            "general",
          );
          cleanT9Images = res.updatedImages;
          allNewlyUploadedUrls.push(...res.newlyUploadedUrls);
          setT9Images(cleanT9Images);
        }

        // Work Type 10
        let cleanT10Images = t10Images;
        if (
          isTypeVisible("จัดงาน Field Day") &&
          t10Images &&
          t10Images.length > 0
        ) {
          const res = await uploadActivityPlanImageGroup(
            id,
            t10Images,
            "field-day",
            "general",
          );
          cleanT10Images = res.updatedImages;
          allNewlyUploadedUrls.push(...res.newlyUploadedUrls);
          setT10Images(cleanT10Images);
        }

        // --- 2. CALCULATE OLD REMOVED URLS ACROSS ALL WORK TYPES ---
        // Type 5
        const initialT5Urls = (initialT5SurveyDetailsRef.current || []).flatMap(
          (rec) => [
            ...collectPermanentUrls(rec.priceTagImages),
            ...collectPermanentUrls(rec.shelfImages),
          ],
        );
        const currentT5Urls = new Set(
          cleanT5SurveyDetails.flatMap((rec) => [
            ...collectPermanentUrls(rec.priceTagImages),
            ...collectPermanentUrls(rec.shelfImages),
          ]),
        );
        const oldT5ToDelete = initialT5Urls.filter((u) => !currentT5Urls.has(u));

        // Type 6
        const initialT6Urls = collectPermanentUrls(initialT6ImagesRef.current);
        const currentT6Urls = new Set(collectPermanentUrls(cleanT6Images));
        const oldT6ToDelete = initialT6Urls.filter((u) => !currentT6Urls.has(u));

        // Type 7
        const initialT7CropUrls = collectPermanentUrls(
          initialT7CropImagesRef.current,
        );
        const currentT7CropUrls = new Set(
          collectPermanentUrls(cleanT7CropImages),
        );
        const oldT7CropToDelete = initialT7CropUrls.filter(
          (u) => !currentT7CropUrls.has(u),
        );

        const initialT7PlotUrls = collectPermanentUrls(
          initialT7PlotImagesRef.current,
        );
        const currentT7PlotUrls = new Set(
          collectPermanentUrls(cleanT7PlotImages),
        );
        const oldT7PlotToDelete = initialT7PlotUrls.filter(
          (u) => !currentT7PlotUrls.has(u),
        );

        // Type 8
        const initialT8Urls = collectPermanentUrls(initialT8ImagesRef.current);
        const currentT8Urls = new Set(collectPermanentUrls(cleanT8Images));
        const oldT8ToDelete = initialT8Urls.filter((u) => !currentT8Urls.has(u));

        // Type 9
        const initialT9Urls = collectPermanentUrls(initialT9ImagesRef.current);
        const currentT9Urls = new Set(collectPermanentUrls(cleanT9Images));
        const oldT9ToDelete = initialT9Urls.filter((u) => !currentT9Urls.has(u));

        // Type 10
        const initialT10Urls = collectPermanentUrls(
          initialT10ImagesRef.current,
        );
        const currentT10Urls = new Set(collectPermanentUrls(cleanT10Images));
        const oldT10ToDelete = initialT10Urls.filter(
          (u) => !currentT10Urls.has(u),
        );

        const allOldUrlsToDelete = [
          ...oldT5ToDelete,
          ...oldT6ToDelete,
          ...oldT7CropToDelete,
          ...oldT7PlotToDelete,
          ...oldT8ToDelete,
          ...oldT9ToDelete,
          ...oldT10ToDelete,
        ];

        // --- 3. BUILD RESULT PAYLOAD & VALIDATE ---
        const buildResult = buildResultSummary({
          activityResultStatus,
          cancelReason,
          postponedDate,
          postponedTime,
          postponedReason,
          postponedNotes,
          planSummary,
          t1ProductAdvice,
          t1SalesOpportunity,
          t1DiscussionResult,
          t1Detail,
          t1NextAction,
          t1NextMeetingDate,
          t2CustomerName,
          t2FollowupDetail,
          t2Detail,
          t2UsageResult,
          t2ProblemDetail,
          t3SoldProducts,
          t3ActualSales,
          t3ActualQuantity,
          t3UnclosedReason,
          t3ProductSalesDetails,
          t4OrderNo,
          t4ReceivedAmount,
          t5CompetitorBrand,
          t5CompetitorProduct,
          t5CompetitorPrice,
          t5CompetitorUnit,
          t5PromotionDetail,
          t5SurveyDetails: cleanT5SurveyDetails,
          t6ProblemDetail,
          t6InitialSolution,
          t6Status,
          t6Images: cleanT6Images,
          t7PlotName,
          t7PlannedProductId:
            t7PlannedProductId ||
            targets.t7?.plannedProductId ||
            targets.t7?.productId ||
            null,
          t7ActualProductId:
            t7ActualProductId ||
            t7PlannedProductId ||
            targets.t7?.plannedProductId ||
            targets.t7?.productId ||
            null,
          t7PlannedProductName:
            products.find(
              (p) =>
                p.id ===
                (t7PlannedProductId ||
                  targets.t7?.plannedProductId ||
                  targets.t7?.productId),
            )?.name ||
            targets.t7?.product ||
            null,
          t7ActualProductName:
            products.find(
              (p) =>
                p.id ===
                (t7ActualProductId ||
                  t7PlannedProductId ||
                  targets.t7?.plannedProductId ||
                  targets.t7?.productId),
            )?.name ||
            targets.t7?.product ||
            null,
          t7DemoProductQuantity:
            t7ActualQuantity || targets.t7?.demoProductQuantity || null,
          t7ChangeReason,
          t7PlotObjective,
          t7CustomPlotDetail,
          t7DemoPlotId,
          t7PlantingDate,
          t7PlantingAreaCondition,
          t7UsageMethod,
          t7CropAgeValue,
          t7CropAgeUnit,
          t7GrowthStage,
          t7CropCondition,
          t7CropProblemDescription,
          t7ProductResponse,
          t7ProblemDescription,
          t7PlotStatus,
          t7NextFollowUpDate,
          t7FinalYieldKg,
          t7ControlYieldKg,
          t7YieldIncreasePercent,
          t7FarmerSatisfaction,
          t7CommercialPotential,
          t7FinalSummaryNotes,
          t7CropImages: cleanT7CropImages,
          t7PlotImages: cleanT7PlotImages,
          t8ActualAttendees,
          t8FeedbackQnA,
          t8ProductSalesDetails,
          t8Images: cleanT8Images,
          t9ActualSales,
          t9ProductSalesDetails,
          t9ActualAttendees,
          t9Images: cleanT9Images,
          t10ActualAttendees,
          t10ActualSalesOrBooking,
          t10FarmerFeedback,
          t10TargetFarmersList,
          t10Images: cleanT10Images,
          t11StockItems,
          t11ProductList,
          t11RemainingQty,
          t11Remarks,
          t11StockStatus,
          t11ReorderOpportunity,
          t11NextAction,
        });

        if (buildResult.validationError) {
          // Cleanup newly uploaded files if validation fails
          if (allNewlyUploadedUrls.length > 0) {
            await deleteActivityPlanImagePaths(id, allNewlyUploadedUrls);
          }
          setFormError(buildResult.validationError);
          setIsSubmitting(false);
          return;
        }

        // --- 4. RECORD TO DATABASE ---
        const res = await recordActivityResultAction(id, buildResult.payload);
        if (!res.success) {
          // Cleanup newly uploaded files if DB save fails
          if (allNewlyUploadedUrls.length > 0) {
            await deleteActivityPlanImagePaths(id, allNewlyUploadedUrls);
          }
          setFormError(res.error || "เกิดข้อผิดพลาดในการบันทึกผลกิจกรรม");
          setIsSubmitting(false);
          return;
        }

        // --- 5. DB SAVE SUCCEEDED: DELETE OLD REMOVED PHYSICAL FILES ---
        if (allOldUrlsToDelete.length > 0) {
          await deleteActivityPlanImagePaths(id, allOldUrlsToDelete);
        }

        // Update initial references to current saved state
        initialT5SurveyDetailsRef.current = JSON.parse(
          JSON.stringify(cleanT5SurveyDetails),
        );
        initialT6ImagesRef.current = JSON.parse(
          JSON.stringify(cleanT6Images),
        );
        initialT7CropImagesRef.current = JSON.parse(
          JSON.stringify(cleanT7CropImages),
        );
        initialT7PlotImagesRef.current = JSON.parse(
          JSON.stringify(cleanT7PlotImages),
        );
        initialT8ImagesRef.current = JSON.parse(
          JSON.stringify(cleanT8Images),
        );
        initialT9ImagesRef.current = JSON.parse(
          JSON.stringify(cleanT9Images),
        );
        initialT10ImagesRef.current = JSON.parse(
          JSON.stringify(cleanT10Images),
        );

        if (
          isTypeVisible("ติดตามแปลงสาธิต / ทำแปลง") &&
          (t7DemoPlotId || targets.t7.owner || targets.t7.product)
        ) {
          const qty =
            parseCleanNumber(
              t7ActualQuantity || targets.t7.demoProductQuantity,
            ) ?? 0;
          await recordDemoPlotVisitAction({
            demoPlotId: t7DemoPlotId || targets.t7.owner || "plot-default",
            activityPlanId: id,
            visitDate: new Date(),
            cropAgeValue: parseCleanNumber(t7CropAgeValue),
            cropAgeUnit: t7CropAgeUnit,
            growthStage: t7GrowthStage,
            cropCondition: t7CropCondition,
            cropProblemDesc: t7CropProblemDescription,
            productResponse: t7ProductResponse,
            productProblemDesc: t7ProblemDescription,
            usageMethod: t7UsageMethod,
            plantingDate: t7PlantingDate,
            plantingAreaCondition: t7PlantingAreaCondition,
            productUsedQty: qty,
            productUnitPrice: parseCleanNumber(t7ProductPrice) ?? 500,
            cropImageUrls: collectPermanentUrls(cleanT7CropImages),
            plotImageUrls: collectPermanentUrls(cleanT7PlotImages),
            imageUrls: collectPermanentUrls(cleanT7PlotImages),
            plotStatus: t7PlotStatus,
            finalYieldKg: parseCleanNumber(t7FinalYieldKg),
            controlYieldKg: parseCleanNumber(t7ControlYieldKg),
            yieldIncreasePercent: parseCleanNumber(t7YieldIncreasePercent),
            farmerSatisfaction: t7FarmerSatisfaction,
            commercialPotential: t7CommercialPotential,
            finalSummaryNotes: t7FinalSummaryNotes,
          }).catch((err) =>
            console.error("Failed to save DemoPlotVisit:", err),
          );
        }
      }

      setIsSubmitting(false);
      setSubmitSuccess(true);
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(id ? `/activity-plans/${id}` : "/activity-plans");
        }
      }, 1000);
    } catch (err: any) {
      if (id && allNewlyUploadedUrls.length > 0) {
        await deleteActivityPlanImagePaths(id, allNewlyUploadedUrls);
      }
      setFormError(err.message || "เกิดข้อผิดพลาดในการบันทึกผลกิจกรรม");
      setIsSubmitting(false);
    }
  };

  if (loadingPlan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p>กำลังโหลดข้อมูลแผนกิจกรรม...</p>
      </div>
    );
  }

  return (
    <section className="space-y-6 container mx-auto px-0 sm:px-0">
      <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 space-y-6 shadow-xs">
        {/* TOP HEADER */}
        <ActualViewHeader planNo={planSummary.planNo} />

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-500" />
              <span>{formError}</span>
            </div>
          )}

          {submitSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <Check className="h-4 w-4 flex-shrink-0 text-emerald-600 stroke-[3]" />
              <span>บันทึกผลการปฏิบัติงานเรียบร้อยแล้ว!</span>
            </div>
          )}

          {/* PLAN SUMMARY COMPONENT (ข้อมูลแผนงาน, งบประมาณและค่าใช้จ่าย, สื่อส่งเสริมการขาย, รายการส่งเสริมการขาย, ข้อมูลเพิ่มเติม) */}
          <ActualPlanSummary summary={planSummary} />

          {/* SECTION: ผลการปฏิบัติงานตามประเภทงาน (WORK TYPES 1 - 11) */}
          <ActivityResultSection
            isTypeVisible={isTypeVisible}
            targets={targets}
            products={products}
            createUploadHandler={createUploadHandler}
            removeImage={removeImage}
            // Type 1
            t1ProductAdvice={t1ProductAdvice}
            setT1ProductAdvice={setT1ProductAdvice}
            t1Detail={t1Detail}
            setT1Detail={setT1Detail}
            t1DiscussionResult={t1DiscussionResult}
            setT1DiscussionResult={setT1DiscussionResult}
            t1SalesOpportunity={t1SalesOpportunity}
            setT1SalesOpportunity={setT1SalesOpportunity}
            t1NextAction={t1NextAction}
            setT1NextAction={setT1NextAction}
            t1NextMeetingDate={t1NextMeetingDate}
            setT1NextMeetingDate={setT1NextMeetingDate}
            // Type 2
            t2CustomerName={t2CustomerName}
            setT2CustomerName={setT2CustomerName}
            t2FollowupDetail={t2FollowupDetail}
            setT2FollowupDetail={setT2FollowupDetail}
            t2Detail={t2Detail}
            setT2Detail={setT2Detail}
            t2UsageResult={t2UsageResult}
            setT2UsageResult={setT2UsageResult}
            t2ProblemDetail={t2ProblemDetail}
            setT2ProblemDetail={setT2ProblemDetail}
            // Type 3
            t3SoldProducts={t3SoldProducts}
            setT3SoldProducts={setT3SoldProducts}
            t3ActualSales={t3ActualSales}
            setT3ActualSales={setT3ActualSales}
            t3ActualQuantity={t3ActualQuantity}
            setT3ActualQuantity={setT3ActualQuantity}
            t3UnclosedReason={t3UnclosedReason}
            setT3UnclosedReason={setT3UnclosedReason}
            t3ProductSalesDetails={t3ProductSalesDetails}
            setT3ProductSalesDetails={setT3ProductSalesDetails}
            // Type 4
            t4OrderNo={t4OrderNo}
            setT4OrderNo={setT4OrderNo}
            t4ReceivedAmount={t4ReceivedAmount}
            setT4ReceivedAmount={setT4ReceivedAmount}
            t4PaymentImages={t4PaymentImages}
            setT4PaymentImages={setT4PaymentImages}
            // Type 5
            t5SurveyDetails={t5SurveyDetails}
            onUpdateT5SurveyItem={handleUpdateT5SurveyItem}
            t5CompetitorBrand={t5CompetitorBrand}
            setT5CompetitorBrand={setT5CompetitorBrand}
            t5CompetitorProduct={t5CompetitorProduct}
            setT5CompetitorProduct={setT5CompetitorProduct}
            t5CompetitorPrice={t5CompetitorPrice}
            setT5CompetitorPrice={setT5CompetitorPrice}
            t5CompetitorUnit={t5CompetitorUnit}
            setT5CompetitorUnit={setT5CompetitorUnit}
            t5PromotionDetail={t5PromotionDetail}
            setT5PromotionDetail={setT5PromotionDetail}
            t5PriceTagImages={t5PriceTagImages}
            setT5PriceTagImages={setT5PriceTagImages}
            // Type 6
            t6ProblemDetail={t6ProblemDetail}
            setT6ProblemDetail={setT6ProblemDetail}
            t6InitialSolution={t6InitialSolution}
            setT6InitialSolution={setT6InitialSolution}
            t6Status={t6Status}
            setT6Status={setT6Status}
            t6Images={t6Images}
            setT6Images={setT6Images}
            // Type 7
            t7StartDate={t7StartDate}
            t7ProductPrice={t7ProductPrice}
            t7PlotName={t7PlotName}
            setT7PlotName={setT7PlotName}
            t7PlannedProductId={t7PlannedProductId}
            setT7PlannedProductId={setT7PlannedProductId}
            t7ActualProductId={t7ActualProductId}
            setT7ActualProductId={setT7ActualProductId}
            t7ActualQuantity={t7ActualQuantity}
            setT7ActualQuantity={setT7ActualQuantity}
            t7ChangeReason={t7ChangeReason}
            setT7ChangeReason={setT7ChangeReason}
            t7PlotObjective={t7PlotObjective}
            setT7PlotObjective={setT7PlotObjective}
            t7CustomPlotDetail={t7CustomPlotDetail}
            setT7CustomPlotDetail={setT7CustomPlotDetail}
            t7UsageMethod={t7UsageMethod}
            setT7UsageMethod={setT7UsageMethod}
            t7PlantingDate={t7PlantingDate}
            setT7PlantingDate={setT7PlantingDate}
            t7PlantingAreaCondition={t7PlantingAreaCondition}
            setT7PlantingAreaCondition={setT7PlantingAreaCondition}
            t7CropImages={t7CropImages}
            setT7CropImages={setT7CropImages}
            t7CropAgeValue={t7CropAgeValue}
            setT7CropAgeValue={setT7CropAgeValue}
            t7CropAgeUnit={t7CropAgeUnit}
            setT7CropAgeUnit={setT7CropAgeUnit}
            t7GrowthStage={t7GrowthStage}
            setT7GrowthStage={setT7GrowthStage}
            t7CropCondition={t7CropCondition}
            setT7CropCondition={setT7CropCondition}
            t7CropProblemDescription={t7CropProblemDescription}
            setT7CropProblemDescription={setT7CropProblemDescription}
            t7ProductResponse={t7ProductResponse}
            setT7ProductResponse={setT7ProductResponse}
            t7ProblemDescription={t7ProblemDescription}
            setT7ProblemDescription={setT7ProblemDescription}
            t7PlotImages={t7PlotImages}
            setT7PlotImages={setT7PlotImages}
            t7PlotStatus={t7PlotStatus}
            setT7PlotStatus={setT7PlotStatus}
            t7NextFollowUpDate={t7NextFollowUpDate}
            setT7NextFollowUpDate={setT7NextFollowUpDate}
            t7FinalYieldKg={t7FinalYieldKg}
            setT7FinalYieldKg={setT7FinalYieldKg}
            t7ControlYieldKg={t7ControlYieldKg}
            setT7ControlYieldKg={setT7ControlYieldKg}
            t7YieldIncreasePercent={t7YieldIncreasePercent}
            setT7YieldIncreasePercent={setT7YieldIncreasePercent}
            t7FarmerSatisfaction={t7FarmerSatisfaction}
            setT7FarmerSatisfaction={setT7FarmerSatisfaction}
            t7CommercialPotential={t7CommercialPotential}
            setT7CommercialPotential={setT7CommercialPotential}
            t7FinalSummaryNotes={t7FinalSummaryNotes}
            setT7FinalSummaryNotes={setT7FinalSummaryNotes}
            t7VisitHistory={t7VisitHistory}
            t7DemoPlotData={t7DemoPlotData}
            t7DemoPlotId={t7DemoPlotId}
            setT7DemoPlotId={setT7DemoPlotId}
            // Type 8
            t8ActualAttendees={t8ActualAttendees}
            setT8ActualAttendees={setT8ActualAttendees}
            t8FeedbackQnA={t8FeedbackQnA}
            setT8FeedbackQnA={setT8FeedbackQnA}
            t8ProductSalesDetails={t8ProductSalesDetails}
            setT8ProductSalesDetails={setT8ProductSalesDetails}
            t8Images={t8Images}
            setT8Images={setT8Images}
            // Type 9
            t9Formats={t9Formats}
            setT9Formats={setT9Formats}
            t9ActualSales={t9ActualSales}
            setT9ActualSales={setT9ActualSales}
            t9ProductSalesDetails={t9ProductSalesDetails}
            setT9ProductSalesDetails={setT9ProductSalesDetails}
            t9ActualAttendees={t9ActualAttendees}
            setT9ActualAttendees={setT9ActualAttendees}
            t9Images={t9Images}
            setT9Images={setT9Images}
            // Type 10
            t10ActualAttendees={t10ActualAttendees}
            setT10ActualAttendees={setT10ActualAttendees}
            t10ActualSalesOrBooking={t10ActualSalesOrBooking}
            setT10ActualSalesOrBooking={setT10ActualSalesOrBooking}
            t10TargetFarmersList={t10TargetFarmersList}
            setT10TargetFarmersList={setT10TargetFarmersList}
            t10FarmerFeedback={t10FarmerFeedback}
            setT10FarmerFeedback={setT10FarmerFeedback}
            t10Images={t10Images}
            setT10Images={setT10Images}
            // Type 11
            t11StockItems={t11StockItems}
            setT11StockItems={setT11StockItems}
            t11ProductList={t11ProductList}
            setT11ProductList={setT11ProductList}
            t11RemainingQty={t11RemainingQty}
            setT11RemainingQty={setT11RemainingQty}
            t11Remarks={t11Remarks}
            setT11Remarks={setT11Remarks}
            t11StockStatus={t11StockStatus}
            setT11StockStatus={setT11StockStatus}
            t11ReorderOpportunity={t11ReorderOpportunity}
            setT11ReorderOpportunity={setT11ReorderOpportunity}
            t11NextAction={t11NextAction}
            setT11NextAction={setT11NextAction}
          />

          {/* SECTION: สถานะผลการทำกิจกรรม */}
          <ActivityStatusSection
            activityResultStatus={activityResultStatus}
            setActivityResultStatus={setActivityResultStatus}
            cancelReason={cancelReason}
            setCancelReason={setCancelReason}
            postponedDate={postponedDate}
            setPostponedDate={setPostponedDate}
            postponedTime={postponedTime}
            setPostponedTime={setPostponedTime}
            postponedReason={postponedReason}
            setPostponedReason={setPostponedReason}
            postponedNotes={postponedNotes}
            setPostponedNotes={setPostponedNotes}
          />

          {/* BOTTOM ACTIONS */}
          <ActualViewActions
            onBack={handleBack}
            loading={isSubmitting}
            submitLabel="บันทึกผล"
          />
        </form>
      </div>
    </section>
  );
}
