"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, AlertTriangle, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getActivityPlanAction,
  recordActivityResultAction,
  recordDemoPlotVisitAction,
  getDemoPlotHistoryAction,
} from "../../server/actions";
import { getWorkTypeCode, getWorkTypeName } from "../../constants";
import { listProductsAction } from "@/modules/products/server/actions";
import { getCustomersAction } from "@/modules/customers/server/actions";
import type {
  PlanSummaryData,
  ImageFile,
  ActualTargetsState,
  ActivityResultStatusType,
  Type5SurveyRecord,
  Type6IssueRecord,
  FollowupProductItem,
  DemoPlotProductItem,
  DemoPlotExternalProductItem,
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
  const { data: session, status: sessionStatus } = useSession();
  const hasLoadedRef = useRef<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Loading & Feedback State
  const [loadingPlan, setLoadingPlan] = useState(!!id);
  const [unauthorizedError, setUnauthorizedError] = useState<string | null>(
    null,
  );
  const [planStatus, setPlanStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Plan Summary & Work Types
  const [planSummary, setPlanSummary] =
    useState<PlanSummaryData>(initialPlanSummary);
  const [planWorkTypes, setPlanWorkTypes] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
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
  const [t1FarmerHomeAddress, setT1FarmerHomeAddress] = useState("");
  const [t1PlotLatitude, setT1PlotLatitude] = useState<string>("");
  const [t1PlotLongitude, setT1PlotLongitude] = useState<string>("");
  const [t1PlotImages, setT1PlotImages] = useState<ImageFile[]>([]);
  const initialT1PlotImagesRef = useRef<ImageFile[]>([]);

  // Work Type 2 States
  const [t2CustomerName, setT2CustomerName] = useState("");
  const [t2FollowupDetail, setT2FollowupDetail] = useState("");
  const [t2Detail, setT2Detail] = useState("");
  const [t2UsageResult, setT2UsageResult] = useState<
    "พืชตอบสนองดี" | "พบปัญหา" | ""
  >("");
  const [t2ProblemDetail, setT2ProblemDetail] = useState("");
  const [t2FollowupResults, setT2FollowupResults] = useState<
    FollowupProductItem[]
  >([]);
  const [t2Images, setT2Images] = useState<ImageFile[]>([]);
  const initialT2ImagesRef = useRef<ImageFile[]>([]);

  // Work Type 3 States
  const [t3SoldProducts, setT3SoldProducts] = useState("");
  const [t3ActualSales, setT3ActualSales] = useState("");
  const [t3ActualQuantity, setT3ActualQuantity] = useState("");
  const [t3UnclosedReason, setT3UnclosedReason] = useState("");
  const [t3ProductSalesDetails, setT3ProductSalesDetails] = useState<any[]>([]);

  // Work Type 4 States
  const [t4OrderNo, setT4OrderNo] = useState("");
  const [t4ReceivedAmount, setT4ReceivedAmount] = useState("");
  const [t4BillingStatus, setT4BillingStatus] = useState("");
  const [t4Detail, setT4Detail] = useState("");
  const [t4PaymentImages, setT4PaymentImages] = useState<ImageFile[]>([]);

  // Work Type 5 States
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

  // Work Type 6 States
  const [t6ProblemDetail, setT6ProblemDetail] = useState("");
  const [t6InitialSolution, setT6InitialSolution] = useState("");
  const [t6Status, setT6Status] = useState<"เสร็จสิ้น" | "รอติดตาม" | "">(
    "เสร็จสิ้น",
  );
  const [t6Images, setT6Images] = useState<ImageFile[]>([]);
  const initialT6ImagesRef = useRef<ImageFile[]>([]);
  const [t6ProductId, setT6ProductId] = useState<string | null>(null);
  const [t6ProductName, setT6ProductName] = useState<string | null>("");
  const [t6LotNumber, setT6LotNumber] = useState<string>("");
  const [t6PurchaseChannel, setT6PurchaseChannel] = useState<
    "ร้านค้าตัวแทนจำหน่าย" | "ออนไลน์" | ""
  >("ร้านค้าตัวแทนจำหน่าย");
  const [t6StoreId, setT6StoreId] = useState<string | null>(null);
  const [t6StoreName, setT6StoreName] = useState<string | null>("");
  const [t6IssueType, setT6IssueType] = useState<string>(
    "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
  );
  const [t6Detail, setT6Detail] = useState<string>("");

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
  const [t7PlotStatus, setT7PlotStatus] = useState<
    "IN_PROGRESS" | "COMPLETED" | "FAILED"
  >("IN_PROGRESS");
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

  // Work Type 7A Specific States
  const [t7FarmerProvince, setT7FarmerProvince] = useState("");
  const [t7FarmerCustomerId, setT7FarmerCustomerId] = useState<string | null>(null);
  const [t7FarmerName, setT7FarmerName] = useState("");
  const [t7FarmerPhone, setT7FarmerPhone] = useState("");
  const [t7IsUnregisteredFarmer, setT7IsUnregisteredFarmer] = useState(false);
  const [t7DealerName, setT7DealerName] = useState("");
  const [t7DealerCode, setT7DealerCode] = useState("");
  const [t7Latitude, setT7Latitude] = useState("");
  const [t7Longitude, setT7Longitude] = useState("");
  const [t7District, setT7District] = useState("");
  const [t7CropCategory, setT7CropCategory] = useState("");
  const [t7CropName, setT7CropName] = useState("");
  const [t7CustomCropName, setT7CustomCropName] = useState("");
  const [t7AreaRai, setT7AreaRai] = useState("");
  const [t7TreeCount, setT7TreeCount] = useState("");
  const [t7ExperimentDetail, setT7ExperimentDetail] = useState("");
  const [t7MainCropInfo, setT7MainCropInfo] = useState("");
  const [t7Irrigations, setT7Irrigations] = useState<string[]>([]);
  const [t7InitialSprayDate, setT7InitialSprayDate] = useState("");
  const [t7NextSprayDate, setT7NextSprayDate] = useState("");
  const [t7DemoProducts, setT7DemoProducts] = useState<DemoPlotProductItem[]>([]);
  const [t7SprayMethod, setT7SprayMethod] = useState<"SINGLE" | "TANK_MIXED">("SINGLE");
  const [t7HasExternalChemicals, setT7HasExternalChemicals] = useState(false);
  const [t7ExternalProducts, setT7ExternalProducts] = useState<DemoPlotExternalProductItem[]>([]);
  const [t7InitialPhotos, setT7InitialPhotos] = useState<ImageFile[]>([]);
  const initialT7InitialPhotosRef = useRef<ImageFile[]>([]);

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

  // Load products & customers list once
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

    getCustomersAction({ perPage: 1000 })
      .then((res: any) => {
        if (res?.success && res?.customers) {
          setCustomers(res.customers);
        } else if (res?.customers) {
          setCustomers(res.customers);
        }
      })
      .catch(() => {});
  }, []);

  // Load plan details if ID passed
  useEffect(() => {
    if (!id) return;
    if (sessionStatus === "loading") return;
    if (hasLoadedRef.current === id) return;

    async function loadData() {
      try {
        if (!hasLoadedRef.current) {
          setLoadingPlan(true);
        } else {
          setIsRefreshing(true);
        }
        const res = await getActivityPlanAction(id!);
        if (!res.success || !res.plan) {
          setFormError(res.error || "ไม่สามารถโหลดข้อมูลแผนงานกิจกรรมได้");
          setLoadingPlan(false);
          setIsRefreshing(false);
          return;
        }
        hasLoadedRef.current = id!;
        const p = res.plan;

          // Check Creator ownership: Helper is NOT allowed to record actual results
          const roles = (session?.user as any)?.roles ?? [];
          const isSuperAdmin =
            roles.includes("administrator") ||
            roles.includes("admin") ||
            roles.includes("ceo") ||
            (session?.user as any)?.role === "administrator" ||
            (session?.user as any)?.role === "ADMIN";

          const currentUserId = session?.user?.id;
          const currentUserEmployeeId = session?.user?.employeeId;
          const isCreator =
            isSuperAdmin ||
            (currentUserEmployeeId && p.employeeId === currentUserEmployeeId) ||
            (currentUserId && p.createdById === currentUserId);

          if (!isCreator) {
            setUnauthorizedError(
              "คุณไม่มีสิทธิ์บันทึกผลการปฏิบัติงานจริง — สิทธิ์การบันทึกผลเป็นของเจ้าของแผนงาน (Creator) เท่านั้น ผู้ช่วยงาน (Helper) ไม่สามารถบันทึกผลแทนได้",
            );
            setLoadingPlan(false);
            return;
          }

          setPlanStatus(p.status);

          const extracted = extractPlanData(p, initialTargets);
          setPlanSummary(extracted.planSummary);
          setPlanWorkTypes(extracted.resolvedWorkTypes);
          setTargets(extracted.targets);

          const t7aTarget = extracted.targets.t7a || extracted.targets.t7;

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
                  const histPlotName =
                    histRes.plot.name || (histRes.plot as any).plotName;
                  if (histPlotName) {
                    setT7PlotName(histPlotName);
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

          // Check if plan has a linked DemoPlot (e.g. from previous save or relation)
          const linkedDemoPlot =
            (p as any).demoPlotVisits?.[0]?.demoPlot ||
            (p as any).demoPlot;

          if (linkedDemoPlot) {
            const dp = linkedDemoPlot;
            setT7DemoPlotId(dp.id);
            setT7DemoPlotData(dp);
            if (dp.ownerProvince) {
              setT7FarmerProvince(dp.ownerProvince);
            } else if (dp.customer?.customerType === "FARMER" && dp.customer?.province) {
              setT7FarmerProvince(dp.customer.province);
            }
            if (dp.district) setT7District(dp.district);
            if (dp.customerId && dp.customer?.customerType === "FARMER") {
              setT7FarmerCustomerId(dp.customerId);
            } else {
              setT7FarmerCustomerId("");
            }
            if (dp.ownerName) setT7FarmerName(dp.ownerName);
            if (dp.ownerPhone) setT7FarmerPhone(dp.ownerPhone);
            if (dp.isUnregisteredFarmer != null)
              setT7IsUnregisteredFarmer(Boolean(dp.isUnregisteredFarmer));
            const resolvedDealerName =
              dp.customer?.name ||
              (extracted.targets.t7a as any)?.dealerName ||
              (t7aTarget as any)?.dealerName ||
              "";
            if (resolvedDealerName) setT7DealerName(resolvedDealerName);
            const resolvedDealerCode =
              dp.customer?.customerCode ||
              (extracted.targets.t7a as any)?.dealerCode ||
              (t7aTarget as any)?.dealerCode ||
              "";
            if (resolvedDealerCode) setT7DealerCode(resolvedDealerCode);
            if (dp.latitude != null) setT7Latitude(String(dp.latitude));
            if (dp.longitude != null) setT7Longitude(String(dp.longitude));
            const resolvedPlotName = dp.name || dp.plotName;
            if (resolvedPlotName) setT7PlotName(resolvedPlotName);
            if (dp.cropCategory) setT7CropCategory(dp.cropCategory);
            if (dp.cropName) setT7CropName(dp.cropName);
            if (dp.customCropName) setT7CustomCropName(dp.customCropName);
            if (dp.areaRai != null) setT7AreaRai(String(dp.areaRai));
            if (dp.treeCount != null) setT7TreeCount(String(dp.treeCount));
            if (dp.objective) setT7PlotObjective(dp.objective);
            if (dp.experimentDetail) setT7ExperimentDetail(dp.experimentDetail);
            const resolvedMainCropInfo = dp.mainCropInfo || dp.plantingAreaCondition;
            if (resolvedMainCropInfo) setT7MainCropInfo(resolvedMainCropInfo);
            if (dp.irrigations && dp.irrigations.length > 0) {
              setT7Irrigations(dp.irrigations.map((ir: any) => ir.method || ir.methodName));
            }
            if (dp.plantingDate) {
              setT7PlantingDate(
                new Date(dp.plantingDate).toISOString().split("T")[0],
              );
            }
            if (dp.initialSprayDate) {
              setT7InitialSprayDate(
                new Date(dp.initialSprayDate).toISOString().split("T")[0],
              );
            }
            if (dp.nextSprayDate) {
              setT7NextSprayDate(
                new Date(dp.nextSprayDate).toISOString().split("T")[0],
              );
            }
            if (dp.sprayMethod) setT7SprayMethod(dp.sprayMethod);
            if (dp.hasExternalChemicals != null)
              setT7HasExternalChemicals(Boolean(dp.hasExternalChemicals));
            if (dp.externalProducts && dp.externalProducts.length > 0) {
              setT7ExternalProducts(
                dp.externalProducts.map((ep: any) => ({
                  company: ep.company,
                  productName: ep.productName,
                  activeIngredient: ep.activeIngredient || "",
                  formula: ep.formula,
                  customFormula: ep.customFormula || "",
                  applicationRate: ep.applicationRate,
                })),
              );
            }
            if (dp.demoProducts && dp.demoProducts.length > 0) {
              setT7DemoProducts(
                dp.demoProducts.map((dpr: any) => ({
                  productId: dpr.productId,
                  productName: dpr.product?.name || "",
                  quantity: dpr.quantity || 1,
                  unit: dpr.product?.unit || dpr.product?.packageSizeUnit || "",
                  applicationRate: dpr.applicationRate || "",
                })),
              );
            } else {
              const planT7aProducts = (
                (p as any).products ||
                (p as any).planProducts ||
                []
              ).filter(
                (pr: any) =>
                  pr.workTypeCode === "TYPE_7A" ||
                  pr.workTypeCode === "TYPE_7" ||
                  !pr.workTypeCode,
              );
              if (planT7aProducts.length > 0) {
                setT7DemoProducts(
                  planT7aProducts.map((pr: any) => ({
                    productId: pr.productId,
                    productName: pr.product?.name || pr.productName || "",
                    quantity: pr.targetQuantity || pr.quantity || 1,
                    unit: pr.product?.unit || pr.product?.packageSizeUnit || "",
                    applicationRate: "",
                  })),
                );
              }
            }
            const resolvedUsageMethod = dp.usageMethod || dp.notes;
            if (resolvedUsageMethod) setT7UsageMethod(resolvedUsageMethod);

            const latestVisit =
              (dp.visits && dp.visits.length > 0
                ? dp.visits[dp.visits.length - 1]
                : null) ||
              ((p as any).demoPlotVisits && (p as any).demoPlotVisits.length > 0
                ? (p as any).demoPlotVisits[(p as any).demoPlotVisits.length - 1]
                : null);

            if (latestVisit) {
              if (latestVisit.cropAgeValue != null)
                setT7CropAgeValue(String(latestVisit.cropAgeValue));
              if (latestVisit.cropAgeUnit)
                setT7CropAgeUnit(latestVisit.cropAgeUnit);
              if (latestVisit.growthStage)
                setT7GrowthStage(latestVisit.growthStage);
              if (latestVisit.cropCondition)
                setT7CropCondition(latestVisit.cropCondition);
              if (latestVisit.cropProblemDesc)
                setT7CropProblemDescription(latestVisit.cropProblemDesc);
              if (latestVisit.productResponse)
                setT7ProductResponse(latestVisit.productResponse);
              if (latestVisit.productProblemDesc)
                setT7ProblemDescription(latestVisit.productProblemDesc);
            }
            if (dp.attachments && dp.attachments.length > 0) {
              const mapped = dp.attachments.map((a: any) => ({
                id: a.id,
                url: a.fileUrl,
                fileName: a.fileName,
                fileSize: a.fileSize,
                mimeType: a.fileType,
              }));
              setT7InitialPhotos(mapped);
              initialT7InitialPhotosRef.current = JSON.parse(
                JSON.stringify(mapped),
              );
            }
          } else {
            // Initial pre-population from plan for TYPE_7A fallback
            if (t7aTarget) {
              const fallbackPlotName =
                (t7aTarget as any).plotName || (t7aTarget as any).name;
              if (fallbackPlotName) setT7PlotName(fallbackPlotName);
              if ((t7aTarget as any).district)
                setT7District((t7aTarget as any).district);
              if ((t7aTarget as any).dealerName)
                setT7DealerName((t7aTarget as any).dealerName);
              if ((t7aTarget as any).dealerCode)
                setT7DealerCode((t7aTarget as any).dealerCode);
              if (t7aTarget.owner) setT7FarmerName(t7aTarget.owner);
              if (t7aTarget.crop) setT7CropName(t7aTarget.crop);
              if ((t7aTarget as any).cropCategory)
                setT7CropCategory((t7aTarget as any).cropCategory);
              if ((t7aTarget as any).areaRai != null)
                setT7AreaRai(String((t7aTarget as any).areaRai));
              if ((t7aTarget as any).treeCount != null)
                setT7TreeCount(String((t7aTarget as any).treeCount));
              if (t7aTarget.objective) setT7PlotObjective(t7aTarget.objective);
              if (t7aTarget.experimentDetail || t7aTarget.detail) {
                setT7ExperimentDetail(
                  t7aTarget.experimentDetail || t7aTarget.detail || "",
                );
              }
            }
            if ((t7aTarget as any)?.district) {
              setT7District((t7aTarget as any).district);
            } else if (p.district) {
              setT7District(p.district);
            }
            if (p.latitude != null) setT7Latitude(String(p.latitude));
            if (p.longitude != null) setT7Longitude(String(p.longitude));
            if (p.stores && p.stores.length > 0) {
              const storeNames = p.stores
                .map((s: any) => s.store?.name || s.storeName)
                .filter(Boolean)
                .join(", ");
              if (storeNames) setT7DealerName(storeNames);
            }
            if (p.startDate) {
              const sDate = new Date(p.startDate).toISOString().split("T")[0];
              setT7InitialSprayDate(sDate);
            }

            // Pre-populate demoProducts from planProducts for TYPE_7A
            const planT7aProducts = (
              (p as any).products ||
              (p as any).planProducts ||
              []
            ).filter(
              (pr: any) =>
                pr.workTypeCode === "TYPE_7A" || !pr.workTypeCode,
            );
            if (planT7aProducts.length > 0) {
              setT7DemoProducts(
                planT7aProducts.map((pr: any) => ({
                  productId: pr.productId,
                  productName: pr.product?.name || pr.productName || "",
                  quantity: pr.targetQuantity || pr.quantity || 1,
                  unit: pr.product?.unit || pr.product?.packageSizeUnit || "",
                  applicationRate: "",
                })),
              );
            } else if (
              extracted.targets.t7?.plannedProductId ||
              extracted.targets.t7?.productId
            ) {
              const pId =
                extracted.targets.t7.plannedProductId ||
                extracted.targets.t7.productId;
              setT7DemoProducts([
                {
                  productId: pId!,
                  productName: extracted.targets.t7.product || "",
                  quantity:
                    Number(extracted.targets.t7.demoProductQuantity) || 1,
                  unit: "",
                  applicationRate: "",
                },
              ]);
            }
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
            if (parsed.postponedReason)
              setPostponedReason(parsed.postponedReason);
            if (parsed.postponedNotes) setPostponedNotes(parsed.postponedNotes);

            // Type 1
            if (parsed.t1ProductAdvice)
              setT1ProductAdvice(parsed.t1ProductAdvice);
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
            if (parsed.t1FarmerHomeAddress) {
              setT1FarmerHomeAddress(parsed.t1FarmerHomeAddress);
            }
            if (parsed.t1PlotLatitude != null) {
              setT1PlotLatitude(String(parsed.t1PlotLatitude));
            }
            if (parsed.t1PlotLongitude != null) {
              setT1PlotLongitude(String(parsed.t1PlotLongitude));
            }
            if (parsed.t1PlotImages && parsed.t1PlotImages.length > 0) {
              setT1PlotImages(parsed.t1PlotImages);
              initialT1PlotImagesRef.current = JSON.parse(
                JSON.stringify(parsed.t1PlotImages),
              );
            }

            // Type 2
            if (parsed.t2CustomerName) setT2CustomerName(parsed.t2CustomerName);
            if (
              parsed.t2FollowupResults &&
              parsed.t2FollowupResults.length > 0
            ) {
              setT2FollowupResults(parsed.t2FollowupResults);
            }
            if (parsed.t2UsageResult) {
              setT2UsageResult(parsed.t2UsageResult as any);
            }
            if (
              parsed.t2UsageResult === "พบปัญหา" ||
              (typeof parsed.t2UsageResult === "string" &&
                parsed.t2UsageResult.includes("พบปัญหา") &&
                !parsed.t2UsageResult.includes("พืชตอบสนองดี") &&
                !parsed.t2UsageResult.includes("ลูกค้าพึงพอใจ"))
            ) {
              setT2FollowupDetail("");
              setT2Detail("");
              if (parsed.t2ProblemDetail) {
                setT2ProblemDetail(parsed.t2ProblemDetail);
              }
            } else {
              if (parsed.t2FollowupDetail) {
                setT2FollowupDetail(parsed.t2FollowupDetail);
                setT2Detail(parsed.t2FollowupDetail);
              }
              if (
                parsed.t2UsageResult === "พืชตอบสนองดี" ||
                parsed.t2UsageResult === "ลูกค้าพึงพอใจ"
              ) {
                setT2ProblemDetail("");
              } else if (parsed.t2ProblemDetail) {
                setT2ProblemDetail(parsed.t2ProblemDetail);
              }
            }
            if (parsed.t2Images && parsed.t2Images.length > 0) {
              setT2Images(parsed.t2Images);
              initialT2ImagesRef.current = JSON.parse(
                JSON.stringify(parsed.t2Images),
              );
            }

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
            if (parsed.t4BillingStatus) {
              setT4BillingStatus(parsed.t4BillingStatus);
            }
            if (parsed.t4Detail) {
              setT4Detail(parsed.t4Detail);
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
              storeId:
                (item as any).storeId ||
                (extracted.targets.t5 as any).storeId ||
                undefined,
              store: item.store || "",
              productId: (item as any).productId || undefined,
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
                    storeId:
                      (matched as any).storeId ||
                      (plannedItem as any).storeId ||
                      (extracted.targets.t5 as any).storeId ||
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

            // Type 6
            if (parsed.t6IssueRecord) {
              const rec = parsed.t6IssueRecord;
              if (rec.productId) setT6ProductId(rec.productId);
              if (rec.productName) setT6ProductName(rec.productName);
              if (rec.lotNumber) setT6LotNumber(rec.lotNumber);
              if (rec.purchaseChannel) {
                setT6PurchaseChannel(
                  rec.purchaseChannel as "ร้านค้าตัวแทนจำหน่าย" | "ออนไลน์",
                );
              }
              if (rec.storeId) setT6StoreId(rec.storeId);
              if (rec.storeName) setT6StoreName(rec.storeName);
              if (rec.issueType) setT6IssueType(rec.issueType);
              if (rec.detail) setT6Detail(rec.detail);
              if (rec.status) {
                setT6Status(
                  rec.status === "รอติดตาม" ? "รอติดตาม" : "เสร็จสิ้น",
                );
              }
              if (rec.images && rec.images.length > 0) {
                setT6Images(rec.images);
                initialT6ImagesRef.current = JSON.parse(
                  JSON.stringify(rec.images),
                );
              }
            } else {
              // Backward compatibility fallback for old records
              if (parsed.t6ProblemDetail) {
                setT6ProblemDetail(parsed.t6ProblemDetail);
                setT6Detail(parsed.t6ProblemDetail);
              } else if (parsed.problemFound) {
                setT6ProblemDetail((prev) => prev || parsed.problemFound || "");
                setT6Detail((prev) => prev || parsed.problemFound || "");
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
            if (parsed.t7CropCondition)
              setT7CropCondition(parsed.t7CropCondition);
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

            // Restore TYPE_7A specific parsed fields
            if ((parsed as any).type7aDemoPlot) {
              const dp = (parsed as any).type7aDemoPlot;
              if (dp.ownerProvince) setT7FarmerProvince(dp.ownerProvince);
              if (dp.district) setT7District(dp.district);
              if (dp.customerId) setT7FarmerCustomerId(dp.customerId);
              if (dp.ownerName) setT7FarmerName(dp.ownerName);
              if (dp.ownerPhone) setT7FarmerPhone(dp.ownerPhone);
              if (dp.isUnregisteredFarmer != null)
                setT7IsUnregisteredFarmer(Boolean(dp.isUnregisteredFarmer));
              if (dp.dealerName) {
                setT7DealerName(dp.dealerName);
              } else if (linkedDemoPlot?.customer?.name) {
                setT7DealerName(linkedDemoPlot.customer.name);
              }
              if (linkedDemoPlot?.customer?.customerCode) {
                setT7DealerCode(linkedDemoPlot.customer.customerCode);
              }
              if (dp.latitude != null) setT7Latitude(String(dp.latitude));
              if (dp.longitude != null) setT7Longitude(String(dp.longitude));
              const resolvedPlotName = dp.name || dp.plotName;
              if (resolvedPlotName) setT7PlotName(resolvedPlotName);
              if (dp.cropCategory) setT7CropCategory(dp.cropCategory);
              if (dp.cropName) setT7CropName(dp.cropName);
              if (dp.customCropName) setT7CustomCropName(dp.customCropName);
              if (dp.areaRai != null) setT7AreaRai(String(dp.areaRai));
              if (dp.treeCount != null) setT7TreeCount(String(dp.treeCount));
              if (dp.objective) setT7PlotObjective(dp.objective);
              if (dp.experimentDetail) setT7ExperimentDetail(dp.experimentDetail);
              if (dp.mainCropInfo) setT7MainCropInfo(dp.mainCropInfo);
              if (dp.irrigations && dp.irrigations.length > 0)
                setT7Irrigations(dp.irrigations);
              if (dp.plantingDate) {
                setT7PlantingDate(
                  new Date(dp.plantingDate).toISOString().split("T")[0],
                );
              }
              if (dp.initialSprayDate) {
                setT7InitialSprayDate(
                  new Date(dp.initialSprayDate).toISOString().split("T")[0],
                );
              }
              if (dp.nextSprayDate) {
                setT7NextSprayDate(
                  new Date(dp.nextSprayDate).toISOString().split("T")[0],
                );
              }
              if (dp.sprayMethod) setT7SprayMethod(dp.sprayMethod);
              if (dp.hasExternalChemicals != null)
                setT7HasExternalChemicals(Boolean(dp.hasExternalChemicals));
              if (dp.externalProducts) setT7ExternalProducts(dp.externalProducts);
              if (dp.demoProducts) setT7DemoProducts(dp.demoProducts);
            }

            // Restore TYPE_7A photos from result attachments if present
            const t7aAttachments = ((p as any).result?.attachments || []).filter(
              (a: any) =>
                a.workTypeCode === "TYPE_7A" ||
                (a.fileCategory === "PLOT" && a.workTypeCode === "TYPE_7A"),
            );
            if (t7aAttachments.length > 0) {
              const mapped = t7aAttachments.map((a: any) => ({
                id: a.id,
                url: a.fileUrl,
                fileName: a.fileName,
                fileSize: a.fileSize,
                mimeType: a.fileType,
              }));
              setT7InitialPhotos(mapped);
              initialT7InitialPhotosRef.current = JSON.parse(
                JSON.stringify(mapped),
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
            if (parsed.t11RemainingQty)
              setT11RemainingQty(parsed.t11RemainingQty);
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
              storeId:
                (item as any).storeId ||
                (extracted.targets.t5 as any).storeId ||
                undefined,
              store: item.store || "",
              productId: (item as any).productId || undefined,
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
            setT5SurveyDetails(defaultT5Records);
          }
      } catch (e: any) {
        console.error("Failed to load plan for actual record", e);
        setFormError(e?.message || "เกิดข้อผิดพลาดในการโหลดข้อมูลแผนงาน");
      } finally {
        setLoadingPlan(false);
        setIsRefreshing(false);
      }
    }
    loadData();
  }, [id, sessionStatus, session?.user?.id]);

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

  const isTypeVisible = (typeTitleOrCode: string) => {
    if (loadingPlan) return false;
    const targetCode = getWorkTypeCode(typeTitleOrCode);
    if (!targetCode) return false;

    return planWorkTypes.some((t) => {
      const code = getWorkTypeCode(t);
      return code === targetCode;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (planStatus && planStatus !== "APPROVED") {
      setFormError(
        "สามารถบันทึกผลได้เฉพาะแผนกิจกรรมที่ได้รับการอนุมัติเรียบร้อยแล้วเท่านั้น",
      );
      return;
    }
    setFormError(null);
    setIsSubmitting(true);

    const allNewlyUploadedUrls: string[] = [];

    try {
      if (id) {
        // --- 1. UPLOAD NEW IMAGES ACROSS ALL WORK TYPES ---
        // Work Type 1
        let cleanT1PlotImages = t1PlotImages;
        if (
          isTypeVisible("TYPE_1") &&
          t1PlotImages &&
          t1PlotImages.length > 0
        ) {
          const res = await uploadActivityPlanImageGroup(
            id,
            t1PlotImages,
            "type1",
            "plot",
          );
          cleanT1PlotImages = res.updatedImages;
          allNewlyUploadedUrls.push(...res.newlyUploadedUrls);
          setT1PlotImages(cleanT1PlotImages);
        }

        // Work Type 2
        let cleanT2Images = t2Images;
        if (
          isTypeVisible("TYPE_2") &&
          t2Images &&
          t2Images.length > 0
        ) {
          const res = await uploadActivityPlanImageGroup(
            id,
            t2Images,
            "followup",
            "general",
          );
          cleanT2Images = res.updatedImages;
          allNewlyUploadedUrls.push(...res.newlyUploadedUrls);
          setT2Images(cleanT2Images);
        }

        // Work Type 5
        let cleanT5SurveyDetails = t5SurveyDetails;
        if (
          isTypeVisible("TYPE_5") &&
          t5SurveyDetails &&
          t5SurveyDetails.length > 0
        ) {
          const updatedT5: Type5SurveyRecord[] = [];
          for (let i = 0; i < t5SurveyDetails.length; i++) {
            const rec = { ...t5SurveyDetails[i] };
            const surveyItemId = rec.id || `item-${i + 1}`;

            if (rec.bottleImages && rec.bottleImages.length > 0) {
              const res = await uploadActivityPlanImageGroup(
                id,
                rec.bottleImages.slice(0, 2),
                "bottle",
                surveyItemId,
              );
              rec.bottleImages = res.updatedImages;
              allNewlyUploadedUrls.push(...res.newlyUploadedUrls);
            }

            if (rec.promotionalImages && rec.promotionalImages.length > 0) {
              const res = await uploadActivityPlanImageGroup(
                id,
                rec.promotionalImages.slice(0, 3),
                "promo",
                surveyItemId,
              );
              rec.promotionalImages = res.updatedImages;
              allNewlyUploadedUrls.push(...res.newlyUploadedUrls);
            }

            updatedT5.push(rec);
          }
          cleanT5SurveyDetails = updatedT5;
          setT5SurveyDetails(cleanT5SurveyDetails);
        }

        // Validate Work Type 6 if visible
        if (isTypeVisible("TYPE_6")) {
          if (!t6PurchaseChannel) {
            setFormError(
              "กรุณาระบุช่องทางการซื้อสินค้าสำหรับตรวจสอบเรื่องร้องเรียน",
            );
            setIsSubmitting(false);
            return;
          }
          if (t6PurchaseChannel === "ร้านค้าตัวแทนจำหน่าย" && !t6StoreId) {
            setFormError("กรุณาเลือกร้านค้าตัวแทนจำหน่าย");
            setIsSubmitting(false);
            return;
          }
          if (!t6ProductId) {
            setFormError("กรุณาเลือกชื่อสินค้าสำหรับตรวจสอบเรื่องร้องเรียน");
            setIsSubmitting(false);
            return;
          }
          if (!t6LotNumber?.trim()) {
            setFormError("กรุณาระบุเลข Lot");
            setIsSubmitting(false);
            return;
          }
          if (!t6IssueType) {
            setFormError("กรุณาเลือกประเภทปัญหา");
            setIsSubmitting(false);
            return;
          }
          if (t6IssueType === "อื่นๆ ระบุ" && !t6Detail?.trim()) {
            setFormError("กรุณาระบุรายละเอียดปัญหา");
            setIsSubmitting(false);
            return;
          }
        }

        // Work Type 6
        let cleanT6Images = t6Images;
        if (
          isTypeVisible("TYPE_6") &&
          t6Images &&
          t6Images.length > 0
        ) {
          const res = await uploadActivityPlanImageGroup(
            id,
            t6Images.slice(0, 5),
            "issue",
            "general",
          );
          cleanT6Images = res.updatedImages;
          allNewlyUploadedUrls.push(...res.newlyUploadedUrls);
          setT6Images(cleanT6Images);
        }

        // Work Type 7 (7A / 7B)
        let cleanT7CropImages = t7CropImages;
        let cleanT7PlotImages = t7PlotImages;
        let cleanT7InitialPhotos = t7InitialPhotos;
        if (
          isTypeVisible("TYPE_7A") ||
          isTypeVisible("TYPE_7B")
        ) {
          const plotItemId = t7DemoPlotId || targets.t7.owner || "demo-plot";
          if (t7InitialPhotos && t7InitialPhotos.length > 0) {
            const res = await uploadActivityPlanImageGroup(
              id,
              t7InitialPhotos,
              "plot",
              plotItemId,
            );
            cleanT7InitialPhotos = res.updatedImages;
            allNewlyUploadedUrls.push(...res.newlyUploadedUrls);
            setT7InitialPhotos(cleanT7InitialPhotos);
          }
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
          isTypeVisible("TYPE_8") &&
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
          isTypeVisible("TYPE_9") &&
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
          isTypeVisible("TYPE_10") &&
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
        // Type 1
        const initialT1Urls = collectPermanentUrls(
          initialT1PlotImagesRef.current,
        );
        const currentT1Urls = new Set(collectPermanentUrls(cleanT1PlotImages));
        const oldT1ToDelete = initialT1Urls.filter(
          (u) => !currentT1Urls.has(u),
        );

        // Type 2
        const initialT2Urls = collectPermanentUrls(initialT2ImagesRef.current);
        const currentT2Urls = new Set(collectPermanentUrls(cleanT2Images));
        const oldT2ToDelete = initialT2Urls.filter(
          (u) => !currentT2Urls.has(u),
        );

        // Type 5
        const initialT5Urls = (initialT5SurveyDetailsRef.current || []).flatMap(
          (rec) => [
            ...collectPermanentUrls(rec.bottleImages),
            ...collectPermanentUrls(rec.promotionalImages),
          ],
        );
        const currentT5Urls = new Set(
          cleanT5SurveyDetails.flatMap((rec) => [
            ...collectPermanentUrls(rec.bottleImages),
            ...collectPermanentUrls(rec.promotionalImages),
          ]),
        );
        const oldT5ToDelete = initialT5Urls.filter(
          (u) => !currentT5Urls.has(u),
        );

        // Type 6
        const initialT6Urls = collectPermanentUrls(initialT6ImagesRef.current);
        const currentT6Urls = new Set(collectPermanentUrls(cleanT6Images));
        const oldT6ToDelete = initialT6Urls.filter(
          (u) => !currentT6Urls.has(u),
        );

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

        const initialT7InitialUrls = collectPermanentUrls(
          initialT7InitialPhotosRef.current,
        );
        const currentT7InitialUrls = new Set(
          collectPermanentUrls(cleanT7InitialPhotos),
        );
        const oldT7InitialToDelete = initialT7InitialUrls.filter(
          (u) => !currentT7InitialUrls.has(u),
        );

        // Type 8
        const initialT8Urls = collectPermanentUrls(initialT8ImagesRef.current);
        const currentT8Urls = new Set(collectPermanentUrls(cleanT8Images));
        const oldT8ToDelete = initialT8Urls.filter(
          (u) => !currentT8Urls.has(u),
        );

        // Type 9
        const initialT9Urls = collectPermanentUrls(initialT9ImagesRef.current);
        const currentT9Urls = new Set(collectPermanentUrls(cleanT9Images));
        const oldT9ToDelete = initialT9Urls.filter(
          (u) => !currentT9Urls.has(u),
        );

        // Type 10
        const initialT10Urls = collectPermanentUrls(
          initialT10ImagesRef.current,
        );
        const currentT10Urls = new Set(collectPermanentUrls(cleanT10Images));
        const oldT10ToDelete = initialT10Urls.filter(
          (u) => !currentT10Urls.has(u),
        );

        const allOldUrlsToDelete = [
          ...oldT1ToDelete,
          ...oldT2ToDelete,
          ...oldT5ToDelete,
          ...oldT6ToDelete,
          ...oldT7CropToDelete,
          ...oldT7PlotToDelete,
          ...oldT7InitialToDelete,
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
          planWorkTypes,
          t1ProductAdvice,
          t1SalesOpportunity,
          t1DiscussionResult,
          t1Detail,
          t1NextAction,
          t1NextMeetingDate,
          t1FarmerHomeAddress,
          t1PlotLatitude,
          t1PlotLongitude,
          t1PlotImages: cleanT1PlotImages,
          t2CustomerName,
          t2FollowupDetail:
            t2UsageResult === "พบปัญหา" ||
            (typeof t2UsageResult === "string" &&
              t2UsageResult.includes("พบปัญหา") &&
              !t2UsageResult.includes("พืชตอบสนองดี") &&
              !t2UsageResult.includes("ลูกค้าพึงพอใจ"))
              ? ""
              : t2FollowupDetail,
          t2Detail:
            t2UsageResult === "พบปัญหา" ||
            (typeof t2UsageResult === "string" &&
              t2UsageResult.includes("พบปัญหา") &&
              !t2UsageResult.includes("พืชตอบสนองดี") &&
              !t2UsageResult.includes("ลูกค้าพึงพอใจ"))
              ? ""
              : t2Detail,
          t2UsageResult,
          t2ProblemDetail:
            t2UsageResult === "พืชตอบสนองดี" ||
            (t2UsageResult as string) === "ลูกค้าพึงพอใจ"
              ? ""
              : t2ProblemDetail,
          t2FollowupResults,
          t2Images: cleanT2Images,
          products,
          t3SoldProducts,
          t3ActualSales,
          t3ActualQuantity,
          t3UnclosedReason,
          t3ProductSalesDetails,
          t4OrderNo,
          t4ReceivedAmount,
          t4BillingStatus,
          t4Detail,
          t5CompetitorBrand,
          t5CompetitorProduct,
          t5CompetitorPrice,
          t5CompetitorUnit,
          t5PromotionDetail,
          t5SurveyDetails: cleanT5SurveyDetails,
          t6IssueRecord: isTypeVisible("ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา")
            ? {
                productId: t6ProductId || null,
                productName:
                  products.find((p) => p.id === t6ProductId)?.name ||
                  t6ProductName ||
                  null,
                lotNumber: t6LotNumber?.trim() || null,
                purchaseChannel: t6PurchaseChannel,
                storeId:
                  t6PurchaseChannel === "ร้านค้าตัวแทนจำหน่าย"
                    ? t6StoreId || null
                    : null,
                storeName:
                  t6PurchaseChannel === "ร้านค้าตัวแทนจำหน่าย"
                    ? customers.find((c) => c.id === t6StoreId)?.name ||
                      t6StoreName ||
                      null
                    : null,
                issueType: t6IssueType,
                detail: t6Detail?.trim() || null,
                status: t6Status || "เสร็จสิ้น",
                images: cleanT6Images,
              }
            : undefined,
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
          t7FarmerProvince,
          t7FarmerCustomerId,
          t7FarmerName,
          t7FarmerPhone,
          t7IsUnregisteredFarmer,
          t7DealerName,
          t7Latitude,
          t7Longitude,
          t7District,
          t7CropCategory,
          t7CropName,
          t7CustomCropName,
          t7AreaRai,
          t7TreeCount,
          t7ExperimentDetail,
          t7MainCropInfo,
          t7Irrigations,
          t7InitialSprayDate,
          t7NextSprayDate,
          t7DemoProducts,
          t7SprayMethod,
          t7HasExternalChemicals,
          t7ExternalProducts,
          t7InitialPhotos: cleanT7InitialPhotos,
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
        initialT2ImagesRef.current = JSON.parse(JSON.stringify(cleanT2Images));
        initialT5SurveyDetailsRef.current = JSON.parse(
          JSON.stringify(cleanT5SurveyDetails),
        );
        initialT6ImagesRef.current = JSON.parse(JSON.stringify(cleanT6Images));
        initialT7CropImagesRef.current = JSON.parse(
          JSON.stringify(cleanT7CropImages),
        );
        initialT7PlotImagesRef.current = JSON.parse(
          JSON.stringify(cleanT7PlotImages),
        );
        initialT8ImagesRef.current = JSON.parse(JSON.stringify(cleanT8Images));
        initialT9ImagesRef.current = JSON.parse(JSON.stringify(cleanT9Images));
        initialT10ImagesRef.current = JSON.parse(
          JSON.stringify(cleanT10Images),
        );

        const isType7AWork =
          isTypeVisible("TYPE_7A") || isTypeVisible("ทำแปลงสาธิต");
        const isType7BWork =
          isTypeVisible("TYPE_7B") || isTypeVisible("ติดตามแปลงสาธิต");

        if (
          !isType7AWork &&
          isType7BWork &&
          (t7DemoPlotId ||
            targets.t7.owner ||
            targets.t7.product ||
            targets.t7a?.owner ||
            targets.t7b?.owner)
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

  if (loadingPlan && !hasLoadedRef.current) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p>กำลังโหลดข้อมูลแผนกิจกรรม...</p>
      </div>
    );
  }

  if (unauthorizedError) {
    return (
      <section className="p-4 md:p-6 pb-24 md:pb-8 bg-slate-50/50 min-h-screen">
        <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-6 md:p-8 space-y-6 shadow-xs max-w-4xl mx-auto">
          <ActualViewHeader planNo={planSummary.planNo} />

          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 sm:p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                ไม่มีสิทธิ์บันทึกผลการปฏิบัติงาน
              </h3>
              <p className="text-sm text-slate-600">{unauthorizedError}</p>
            </div>
            <div className="pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (onCancel) onCancel();
                  else
                    router.push(
                      id ? `/activity-plans/${id}` : "/activity-plans",
                    );
                }}
                className="gap-2 font-semibold border-slate-300"
              >
                <ArrowLeft className="w-4 h-4" />
                กลับหน้ารายละเอียดแผนงาน
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!loadingPlan && id && formError && !planStatus) {
    return (
      <section className="p-4 md:p-6 pb-24 md:pb-8 bg-slate-50/50 min-h-screen">
        <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-6 md:p-8 space-y-6 shadow-xs max-w-4xl mx-auto">
          <ActualViewHeader planNo={planSummary.planNo} />

          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 sm:p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                เกิดข้อผิดพลาดในการโหลดข้อมูลแผนงาน
              </h3>
              <p className="text-sm text-slate-600">{formError}</p>
            </div>
            <div className="pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (onCancel) onCancel();
                  else
                    router.push(
                      id ? `/activity-plans/${id}` : "/activity-plans",
                    );
                }}
                className="gap-2 font-semibold border-slate-300"
              >
                <ArrowLeft className="w-4 h-4" />
                กลับหน้ารายละเอียดแผนงาน
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!loadingPlan && id && planStatus && planStatus !== "APPROVED") {
    return (
      <section className="p-4 md:p-6 pb-24 md:pb-8 bg-slate-50/50 min-h-screen">
        <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-6 md:p-8 space-y-6 shadow-xs max-w-4xl mx-auto">
          <ActualViewHeader planNo={planSummary.planNo} />

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 sm:p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                ไม่สามารถบันทึกผลการปฏิบัติงานได้
              </h3>
              <p className="text-sm text-slate-600">
                สามารถบันทึกผลได้เฉพาะแผนกิจกรรมที่ได้รับการอนุมัติเรียบร้อยแล้วเท่านั้น
              </p>
            </div>
            <div className="pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (onCancel) onCancel();
                  else router.push(`/activity-plans/${id}`);
                }}
                className="gap-2 font-semibold border-slate-300"
              >
                <ArrowLeft className="w-4 h-4" />
                กลับหน้ารายละเอียดแผนงาน
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="p-4 md:p-6 pb-24 md:pb-8 bg-slate-50/50 min-h-screen">
      <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 space-y-6 shadow-xs">
        {/* TOP HEADER */}
        <ActualViewHeader planNo={planSummary.planNo} />
        {isRefreshing && (
          <div className="flex items-center gap-2 text-xs text-slate-500 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            <span>กำลังอัปเดตข้อมูลแผนงานในพื้นหลัง...</span>
          </div>
        )}

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
            t1FarmerHomeAddress={t1FarmerHomeAddress}
            setT1FarmerHomeAddress={setT1FarmerHomeAddress}
            t1PlotLatitude={t1PlotLatitude}
            setT1PlotLatitude={setT1PlotLatitude}
            t1PlotLongitude={t1PlotLongitude}
            setT1PlotLongitude={setT1PlotLongitude}
            t1PlotImages={t1PlotImages}
            setT1PlotImages={setT1PlotImages}
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
            t2FollowupResults={t2FollowupResults}
            setT2FollowupResults={setT2FollowupResults}
            t2Images={t2Images}
            setT2Images={setT2Images}
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
            t4BillingStatus={t4BillingStatus}
            setT4BillingStatus={setT4BillingStatus}
            t4Detail={t4Detail}
            setT4Detail={setT4Detail}
            t4PaymentImages={t4PaymentImages}
            setT4PaymentImages={setT4PaymentImages}
            // Type 5
            t5SurveyDetails={t5SurveyDetails}
            onUpdateT5SurveyItem={handleUpdateT5SurveyItem}
            t5CompetitorBrand={t5CompetitorBrand}
            setT5CompetitorBrand={setT5CompetitorBrand}
            t5CompetitorProduct={t5CompetitorProduct}
            setT5CompetitorProduct={setT5CompetitorProduct}
            // Type 6
            t6ProductId={t6ProductId}
            setT6ProductId={setT6ProductId}
            t6ProductName={t6ProductName}
            setT6ProductName={setT6ProductName}
            t6LotNumber={t6LotNumber}
            setT6LotNumber={setT6LotNumber}
            t6PurchaseChannel={t6PurchaseChannel}
            setT6PurchaseChannel={setT6PurchaseChannel}
            t6StoreId={t6StoreId}
            setT6StoreId={setT6StoreId}
            t6StoreName={t6StoreName}
            setT6StoreName={setT6StoreName}
            t6IssueType={t6IssueType}
            setT6IssueType={setT6IssueType}
            t6Detail={t6Detail}
            setT6Detail={setT6Detail}
            t6ProblemDetail={t6ProblemDetail}
            setT6ProblemDetail={setT6ProblemDetail}
            t6InitialSolution={t6InitialSolution}
            setT6InitialSolution={setT6InitialSolution}
            t6Status={t6Status}
            setT6Status={setT6Status}
            t6Images={t6Images}
            setT6Images={setT6Images}
            customers={customers}
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
            planProvince={
              (t7DemoPlotData as any)?.province ||
              targets.t7a?.province ||
              planSummary?.province ||
              ""
            }
            t7FarmerProvince={t7FarmerProvince}
            setT7FarmerProvince={setT7FarmerProvince}
            t7FarmerCustomerId={t7FarmerCustomerId}
            setT7FarmerCustomerId={setT7FarmerCustomerId}
            t7FarmerName={t7FarmerName}
            setT7FarmerName={setT7FarmerName}
            t7FarmerPhone={t7FarmerPhone}
            setT7FarmerPhone={setT7FarmerPhone}
            t7IsUnregisteredFarmer={t7IsUnregisteredFarmer}
            setT7IsUnregisteredFarmer={setT7IsUnregisteredFarmer}
            t7DealerName={t7DealerName}
            setT7DealerName={setT7DealerName}
            t7DealerCode={t7DealerCode}
            t7Latitude={t7Latitude}
            setT7Latitude={setT7Latitude}
            t7Longitude={t7Longitude}
            setT7Longitude={setT7Longitude}
            t7District={t7District}
            setT7District={setT7District}
            t7CropCategory={t7CropCategory}
            setT7CropCategory={setT7CropCategory}
            t7CropName={t7CropName}
            setT7CropName={setT7CropName}
            t7CustomCropName={t7CustomCropName}
            setT7CustomCropName={setT7CustomCropName}
            t7AreaRai={t7AreaRai}
            setT7AreaRai={setT7AreaRai}
            t7TreeCount={t7TreeCount}
            setT7TreeCount={setT7TreeCount}
            t7ExperimentDetail={t7ExperimentDetail}
            setT7ExperimentDetail={setT7ExperimentDetail}
            t7MainCropInfo={t7MainCropInfo}
            setT7MainCropInfo={setT7MainCropInfo}
            t7Irrigations={t7Irrigations}
            setT7Irrigations={setT7Irrigations}
            t7InitialSprayDate={t7InitialSprayDate}
            setT7InitialSprayDate={setT7InitialSprayDate}
            t7NextSprayDate={t7NextSprayDate}
            setT7NextSprayDate={setT7NextSprayDate}
            t7DemoProducts={t7DemoProducts}
            setT7DemoProducts={setT7DemoProducts}
            t7SprayMethod={t7SprayMethod}
            setT7SprayMethod={setT7SprayMethod}
            t7HasExternalChemicals={t7HasExternalChemicals}
            setT7HasExternalChemicals={setT7HasExternalChemicals}
            t7ExternalProducts={t7ExternalProducts}
            setT7ExternalProducts={setT7ExternalProducts}
            t7InitialPhotos={t7InitialPhotos}
            setT7InitialPhotos={setT7InitialPhotos}
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
