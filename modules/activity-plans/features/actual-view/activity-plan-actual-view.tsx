"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  ArrowLeft,
  X,
  Check,
  AlertTriangle,
  Save,
  Loader2,
  Sparkles,
  Layers,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/modules/sales/features/form/forms/section-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  getActivityPlanAction,
  recordActivityResultAction,
  getDemoPlotHistoryAction,
  recordDemoPlotVisitAction,
} from "../../server/actions";
import { listProductsAction } from "@/modules/products/server/actions";
import {
  WORK_TYPES,
  DEMO_OWNERS,
  DEMO_PRODUCTS,
  DEMO_PRODUCT_PRICES,
  STORES_LIST,
  USER_DEMO_PLOTS,
} from "../form/constants";
import { ImageFile, PlanSummaryData } from "./types";
import { ActualPlanSummary } from "./components/actual-plan-summary";
import { DateTimePicker } from "../form/components/date-time-picker";

// Work Type Components
import { ActualType1Visit } from "./components/work-types/actual-type1-visit";
import { ActualType2Followup } from "./components/work-types/actual-type2-followup";
import { ActualType3Sales } from "./components/work-types/actual-type3-sales";
import { ActualType4Collect } from "./components/work-types/actual-type4-collect";
import { ActualType5Survey } from "./components/work-types/actual-type5-survey";
import { ActualType6Issue } from "./components/work-types/actual-type6-issue";
import { ActualType7Demo } from "./components/work-types/actual-type7-demo";
import { ActualType8Meeting } from "./components/work-types/actual-type8-meeting";
import { ActualType9Store } from "./components/work-types/actual-type9-store";
import { ActualType10FieldDay } from "./components/work-types/actual-type10-field-day";
import {
  ActualType11Stock,
  StockCheckItem,
} from "./components/work-types/actual-type11-stock";

interface ActivityPlanActualViewProps {
  id?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ActivityPlanActualView({
  id,
  onSuccess,
  onCancel,
}: ActivityPlanActualViewProps) {
  const router = useRouter();

  // Loading & Plan Summary State
  const [loadingPlan, setLoadingPlan] = useState(!!id);
  const [planSummary, setPlanSummary] = useState<PlanSummaryData>({
    planNo: "2607-001",
    title: "แปลงสาธิตของบ้านนา และ กิจกรรมส่งเสริมการขายหน้าร้าน",
    startDateStr: "25 ก.ค. 2568",
    endDateStr: "25 ก.ค. 2568",
    startTimeStr: "09:00",
    endTimeStr: "15:00",
    timeStr: "09:00 - 15:00 น.",
    locationStr: `${DEMO_OWNERS[0]} อ.เมือง จ.จันทบุรี`,

    // งบประมาณและค่าใช้จ่าย (Budget & Expenses) (ถ้ามี)
    marketingBudget: 10000,
    salesPromotionBudget: 25000,
    extraExpenseAmount: 2000,
    extraExpenseDetail: "",
    targetSales: 200000,
    isPromotionalMediaSelected: true,
    marketingProductItems: [
      {
        id: "mkt-1",
        productName: "ป้ายไวนิล (Vinyl Banner)",
        quantityCases: 5,
        pricePerCase: 1000,
      },
      {
        id: "mkt-2",
        productName: "เสื้อยืดตราปืนใหญ่",
        quantityCases: 10,
        pricePerCase: 500,
      },
    ],
    isSalesPromotionSelected: true,
    salesPromotionItems: [
      {
        id: "sp-1",
        detail: "ส่วนลดพิเศษกระตุ้นยอดขายหน้าร้าน",
        amount: 15000,
        budgetType: "งบขาย",
      },
      {
        id: "sp-2",
        detail: "ของแถมพรีเมียมแจกลูกค้าหน้าร้าน",
        amount: 10000,
        budgetType: "งบการตลาด",
      },
    ],

    // รายการขอเบิกสินค้าจัดกิจกรรม (Material Requisition) (ถ้ามี)
    requisitionItems: [
      { id: "req-1", productName: "สินค้าทดสอบ A", quantity: 10, unit: "ลัง" },
      {
        id: "req-2",
        productName: "ปุ๋ยเคมีสูตรพิเศษ",
        quantity: 5,
        unit: "กระสอบ",
      },
    ],

    // ข้อมูลเพิ่มเติม (Additional Info) (ถ้ามี)
    objective:
      "เข้าพบเจ้าของร้านเพื่อเสนอขายและจัดกิจกรรมกระตุ้นยอดขายหน้าร้าน",
    notes: "โปรดเตรียมป้ายและของแถมพรีเมียมไปแจกลูกค้าหน้าร้าน",
    helperEmployeeNames: [
      "คุณวิชัย (ผู้ช่วยเขต)",
      "คุณสมชาย (เจ้าหน้าที่เทคนิค)",
    ],
  });

  // Active Work Type Selection Mode: "ALL" or specific type name
  const [activeTypeTab, setActiveTypeTab] = useState<string>("ALL");
  const [planWorkTypes, setPlanWorkTypes] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Targets derived from Create Plan Form Constants or DB
  const [targets, setTargets] = useState({
    t1: {
      customer: "",
      topic: "แจ้งข่าวสาร",
      detail: "",
      opportunity: "สูง",
      nextDate: "",
    },
    t2: {
      product: "",
      customer: "",
      detail: "",
      expectedResult: "พืชตอบสนองดี",
      items: [] as any[],
    },
    t3: {
      product: "",
      customer: "",
      targetQty: "",
      targetSales: "",
      items: [] as any[],
    },
    t4: {
      customer: "",
      orderNo: "",
      targetCollect: "",
      items: [] as any[],
    },
    t5: {
      store: "",
      product: "",
      detail: "",
      items: [] as any[],
    },
    t6: {
      customer: "",
      issueType: "เคลมของ",
      detail: "",
      targetStatus: "เสร็จสิ้น",
      items: [] as any[],
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
      targetCondition: "สมบูรณ์",
      items: [] as any[],
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
      items: [] as any[],
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
      targetOpportunity: "สูง",
    },
  });

  // ────────────────────────────────────────────────────────
  // ACTIVITY RESULT STATUS (สถานะผลการทำกิจกรรม)
  // ────────────────────────────────────────────────────────
  const [activityResultStatus, setActivityResultStatus] = useState<
    "PARTIAL" | "COMPLETED" | "POSTPONED" | "CANCELLED"
  >("PARTIAL");
  const [cancelReason, setCancelReason] = useState("");
  const [postponedDate, setPostponedDate] = useState("");
  const [postponedTime, setPostponedTime] = useState("");
  const [postponedReason, setPostponedReason] = useState("");
  const [postponedNotes, setPostponedNotes] = useState("");

  // ────────────────────────────────────────────────────────
  // FORM STATES (11 WORK TYPES)
  // ────────────────────────────────────────────────────────
  // Type 1
  const [t1ProductAdvice, setT1ProductAdvice] = useState("");
  const [t1Detail, setT1Detail] = useState("");
  const [t1DiscussionResult, setT1DiscussionResult] = useState("");
  const [t1SalesOpportunity, setT1SalesOpportunity] = useState<
    "สูง" | "ต่ำ" | ""
  >("");
  const [t1NextAction, setT1NextAction] = useState("");
  const [t1NextMeetingDate, setT1NextMeetingDate] = useState("");

  // Type 2
  const [t2CustomerName, setT2CustomerName] = useState("");
  const [t2FollowupDetail, setT2FollowupDetail] = useState("");
  const [t2Detail, setT2Detail] = useState("");
  const [t2UsageResult, setT2UsageResult] = useState<
    "พืชตอบสนองดี" | "พบปัญหา" | ""
  >("");
  const [t2ProblemDetail, setT2ProblemDetail] = useState("");

  // Type 3
  const [t3SoldProducts, setT3SoldProducts] = useState("");
  const [t3ActualSales, setT3ActualSales] = useState("");
  const [t3ActualQuantity, setT3ActualQuantity] = useState("");
  const [t3UnclosedReason, setT3UnclosedReason] = useState("");

  // Type 4
  const [t4OrderNo, setT4OrderNo] = useState("");
  const [t4ReceivedAmount, setT4ReceivedAmount] = useState("");
  const [t4PaymentImages, setT4PaymentImages] = useState<ImageFile[]>([]);

  // Type 5
  const [t5CompetitorBrand, setT5CompetitorBrand] = useState("");
  const [t5CompetitorProduct, setT5CompetitorProduct] = useState("");
  const [t5CompetitorPrice, setT5CompetitorPrice] = useState("");
  const [t5CompetitorUnit, setT5CompetitorUnit] = useState("ขวด");
  const [t5PromotionDetail, setT5PromotionDetail] = useState("");
  const [t5PriceTagImages, setT5PriceTagImages] = useState<ImageFile[]>([]);

  // Type 6
  const [t6ProblemDetail, setT6ProblemDetail] = useState("");
  const [t6InitialSolution, setT6InitialSolution] = useState("");
  const [t6Status, setT6Status] = useState<"เสร็จสิ้น" | "รอติดตาม" | "">("");
  const [t6Images, setT6Images] = useState<ImageFile[]>([]);

  // Type 7
  const [t7PlotName, setT7PlotName] = useState("");
  const [t7PlantingDate, setT7PlantingDate] = useState("");
  const [t7PlantingAreaCondition, setT7PlantingAreaCondition] = useState("");
  const [t7CropImages, setT7CropImages] = useState<ImageFile[]>([]);
  const [t7UsageMethod, setT7UsageMethod] = useState("");
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
  const [t7VisitHistory, setT7VisitHistory] = useState<any[]>([]);
  const [t7StartDate, setT7StartDate] = useState("");
  const [t7ProductPrice, setT7ProductPrice] = useState(500);
  const [t7DemoPlotId, setT7DemoPlotId] = useState("");
  const [t7DemoPlotData, setT7DemoPlotData] = useState<any>(null);

  // Type 8
  const [t8ActualAttendees, setT8ActualAttendees] = useState("");
  const [t8FeedbackQnA, setT8FeedbackQnA] = useState("");
  const [t8ProductSalesDetails, setT8ProductSalesDetails] = useState<
    { productName: string; actualQty: string; actualSales: string }[]
  >([]);
  const [t8Images, setT8Images] = useState<ImageFile[]>([]);

  // Type 9
  const [t9Formats, setT9Formats] = useState<string[]>([]);
  const [t9ActualSales, setT9ActualSales] = useState("");
  const [t9ActualAttendees, setT9ActualAttendees] = useState("");
  const [t9Images, setT9Images] = useState<ImageFile[]>([]);

  // Type 10
  const [t10ActualAttendees, setT10ActualAttendees] = useState("");
  const [t10ActualSalesOrBooking, setT10ActualSalesOrBooking] = useState("");
  const [t10TargetFarmersList, setT10TargetFarmersList] = useState("");
  const [t10FarmerFeedback, setT10FarmerFeedback] = useState<
    "สูง" | "กลาง" | "ต่ำ" | ""
  >("");
  const [t10Images, setT10Images] = useState<ImageFile[]>([]);

  // Type 11
  const [t11StockItems, setT11StockItems] = useState<StockCheckItem[]>([]);
  const [t11ProductList, setT11ProductList] = useState("");
  const [t11RemainingQty, setT11RemainingQty] = useState("");
  const [t11Remarks, setT11Remarks] = useState("");
  const [t11StockStatus, setT11StockStatus] = useState<
    "ใกล้หมด" | "ขาดสต็อก" | ""
  >("");
  const [t11ReorderOpportunity, setT11ReorderOpportunity] = useState<
    "สูง" | "ยังไม่แน่ใจ" | "ต่ำ" | ""
  >("");
  const [t11NextAction, setT11NextAction] = useState("");

  // Submitting & notifications
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch active products lookup
  useEffect(() => {
    listProductsAction({ status: "ACTIVE", perPage: 1000 })
      .then((res) => {
        if (res && res.products) {
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
          const start = p.startDate ? new Date(p.startDate) : new Date();
          const end = p.endDate ? new Date(p.endDate) : new Date();

          const mktProductItemsFromItems = p.items
            ? (p.items as any[])
                .filter(
                  (item) =>
                    item.visitTopic === "MARKETING_PRODUCT" ||
                    item.itemType === "MARKETING_PRODUCT",
                )
                .map((item) => ({
                  id: item.id,
                  productName:
                    item.storeProductName ||
                    item.productName ||
                    "สื่อส่งเสริมการขาย",
                  quantityCases: item.storeQuantityCases || 1,
                  pricePerCase: item.storePricePerCase
                    ? Number(item.storePricePerCase)
                    : 0,
                }))
            : [];

          const salesPromoItemsFromItems = p.items
            ? (p.items as any[])
                .filter(
                  (item) =>
                    item.visitTopic === "SALES_PROMOTION" ||
                    item.itemType === "SALES_PROMOTION",
                )
                .map((item) => ({
                  id: item.id,
                  detail: item.detail || "รายการส่งเสริมการขาย",
                  amount: item.collectAmount ? Number(item.collectAmount) : 0,
                  budgetType: item.plotCropCategory || "งบการตลาด",
                }))
            : [];

          setPlanSummary({
            planNo: p.code || p.id || "-",
            title: p.title || "แปลงสาธิตของบ้านนา",
            startDateStr: format(start, "d MMM yyyy", { locale: th }),
            endDateStr: format(end, "d MMM yyyy", { locale: th }),
            timeStr: `${format(start, "HH:mm")} - ${format(end, "HH:mm")} น.`,
            locationStr: p.location || `${DEMO_OWNERS[0]} อ.เมือง จ.จันทบุรี`,
            marketingBudget: (p as any).marketingBudgetRequested
              ? Number((p as any).marketingBudgetRequested)
              : undefined,
            salesPromotionBudget: (p as any).salesPromotionBudgetRequested
              ? Number((p as any).salesPromotionBudgetRequested)
              : undefined,
            isPromotionalMediaSelected:
              mktProductItemsFromItems.length > 0 ||
              ((p as any).marketingBudgetRequested
                ? Number((p as any).marketingBudgetRequested) > 0
                : false),
            marketingProductItems: mktProductItemsFromItems,
            isSalesPromotionSelected:
              salesPromoItemsFromItems.length > 0 ||
              ((p as any).salesPromotionBudgetRequested
                ? Number((p as any).salesPromotionBudgetRequested) > 0
                : false),
            salesPromotionItems: salesPromoItemsFromItems,
            notes: p.notes || undefined,
            objective: p.objective || undefined,
          });

          // ────────────────────────────────────────────────────────
          // 1. Detect ALL selected work types from the Trip Plan
          // ────────────────────────────────────────────────────────
          const detectedWorkTypes = new Set<string>();

          // (A) From activityType / activityTypeId (primary type)
          if (p.activityType) {
            if (typeof p.activityType === "object" && p.activityType.name) {
              if (WORK_TYPES.includes(p.activityType.name)) {
                detectedWorkTypes.add(p.activityType.name);
              }
            } else if (
              typeof p.activityType === "object" &&
              p.activityType.code
            ) {
              const idx =
                parseInt(p.activityType.code.replace("TYPE_", ""), 10) - 1;
              if (idx >= 0 && idx < WORK_TYPES.length) {
                detectedWorkTypes.add(WORK_TYPES[idx]);
              }
            } else if (typeof p.activityType === "string") {
              if (WORK_TYPES.includes(p.activityType)) {
                detectedWorkTypes.add(p.activityType);
              }
            }
          }
          if (p.activityTypeId) {
            const idx =
              parseInt(String(p.activityTypeId).replace("TYPE_", ""), 10) - 1;
            if (idx >= 0 && idx < WORK_TYPES.length) {
              detectedWorkTypes.add(WORK_TYPES[idx]);
            }
          }

          // (B) From objective / title (section headers / markers)
          const objectiveText = [p.objective, p.title]
            .filter(Boolean)
            .join("\n");

          if (objectiveText) {
            if (
              objectiveText.includes("[เข้าพบร้านค้า") ||
              objectiveText.includes("เข้าพบร้านค้า") ||
              objectiveText.includes("Key Farmer")
            ) {
              detectedWorkTypes.add(WORK_TYPES[0]);
            }
            if (
              objectiveText.includes("[ติดตามผลการใช้สินค้า]") ||
              objectiveText.includes("ติดตามผลการใช้สินค้า")
            ) {
              detectedWorkTypes.add(WORK_TYPES[1]);
            }
            if (
              objectiveText.includes("[เสนอขายสินค้า]") ||
              objectiveText.includes("เสนอขายสินค้า")
            ) {
              detectedWorkTypes.add(WORK_TYPES[2]);
            }
            if (
              objectiveText.includes("[วางบิล") ||
              objectiveText.includes("วางบิล / เก็บเงิน") ||
              objectiveText.includes("วางบิล/เก็บเงิน") ||
              objectiveText.includes("เป้ายอดเก็บเงิน")
            ) {
              detectedWorkTypes.add(WORK_TYPES[3]);
            }
            if (
              objectiveText.includes("[สำรวจตลาด") ||
              objectiveText.includes("สำรวจตลาดของคู่แข่ง") ||
              objectiveText.includes("สำรวจตลาดคู่แข่ง")
            ) {
              detectedWorkTypes.add(WORK_TYPES[4]);
            }
            if (
              objectiveText.includes("[แก้ปัญหา") ||
              objectiveText.includes("แก้ปัญหา / รับเรื่องร้องเรียน") ||
              objectiveText.includes("แก้ปัญหา/ร้องเรียน") ||
              objectiveText.includes("รับเรื่องร้องเรียน")
            ) {
              detectedWorkTypes.add(WORK_TYPES[5]);
            }
            if (
              objectiveText.includes("[ติดตามแปลงสาธิต") ||
              objectiveText.includes("ติดตามแปลงสาธิต / ทำแปลง") ||
              objectiveText.includes("ทำแปลงสาธิต") ||
              objectiveText.includes("แปลงสาธิต")
            ) {
              detectedWorkTypes.add(WORK_TYPES[6]);
            }
            if (
              objectiveText.includes("[จัดประชุม") ||
              objectiveText.includes("จัดประชุมการเกษตร") ||
              objectiveText.includes("ประชุมการเกษตร")
            ) {
              detectedWorkTypes.add(WORK_TYPES[7]);
            }
            if (
              objectiveText.includes("[กิจกรรมหน้าร้าน]") ||
              objectiveText.includes("จัดกิจกรรมส่งเสริมการขายหน้าร้าน")
            ) {
              detectedWorkTypes.add(WORK_TYPES[8]);
            }
            if (
              objectiveText.includes("[Field Day]") ||
              objectiveText.includes("Field Day") ||
              objectiveText.includes("จัดงาน Field Day")
            ) {
              detectedWorkTypes.add(WORK_TYPES[9]);
            }
            if (
              objectiveText.includes("[ตรวจเช็กสต็อก") ||
              objectiveText.includes("ตรวจเช็กสต็อกหน้าร้าน") ||
              objectiveText.includes("เช็กสต็อกหน้าร้าน") ||
              objectiveText.includes("สต็อกหน้าร้าน")
            ) {
              detectedWorkTypes.add(WORK_TYPES[10]);
            }
          }

          // (C) From DB items (excluding marketing & sales promo items)
          if (Array.isArray(p.items)) {
            const actualItems = (p.items as any[]).filter(
              (item) =>
                item.itemType !== "MARKETING_PRODUCT" &&
                item.itemType !== "SALES_PROMOTION" &&
                item.visitTopic !== "MARKETING_PRODUCT" &&
                item.visitTopic !== "SALES_PROMOTION",
            );

            for (const item of actualItems) {
              if (item.itemType === "TYPE_1" || item.visitTopic) {
                detectedWorkTypes.add(WORK_TYPES[0]);
              }
              if (item.itemType === "TYPE_2" || item.followupProductName) {
                detectedWorkTypes.add(WORK_TYPES[1]);
              }
              if (
                item.itemType === "TYPE_3" ||
                item.saleProductName ||
                item.saleQuantity != null ||
                item.saleUnitPrice != null ||
                item.saleTotalPrice != null
              ) {
                detectedWorkTypes.add(WORK_TYPES[2]);
              }
              if (item.itemType === "TYPE_4" || item.collectAmount != null) {
                detectedWorkTypes.add(WORK_TYPES[3]);
              }
              if (
                item.itemType === "TYPE_5" ||
                item.surveyCompetitorProduct ||
                item.surveyStoreName
              ) {
                detectedWorkTypes.add(WORK_TYPES[4]);
              }
              if (item.itemType === "TYPE_6" || item.issueType) {
                detectedWorkTypes.add(WORK_TYPES[5]);
              }
              if (
                item.itemType === "TYPE_7" ||
                item.plotActivityType ||
                item.plotCropName ||
                item.plotOwnerName ||
                item.plotAreaRai != null
              ) {
                detectedWorkTypes.add(WORK_TYPES[6]);
              }
              if (
                item.itemType === "TYPE_8" ||
                item.meetingTopic ||
                item.meetingAttendeesCount != null ||
                item.meetingTargetProducts
              ) {
                detectedWorkTypes.add(WORK_TYPES[7]);
              }
              if (
                item.itemType === "TYPE_9" ||
                item.storeProductName ||
                item.storeQuantityCases != null ||
                item.storePricePerCase != null ||
                item.storeTotalAmount != null
              ) {
                detectedWorkTypes.add(WORK_TYPES[8]);
              }
              if (item.itemType === "TYPE_10") {
                detectedWorkTypes.add(WORK_TYPES[9]);
              }
              if (item.itemType === "TYPE_11") {
                detectedWorkTypes.add(WORK_TYPES[10]);
              }
            }
          }

          const resolvedWorkTypes = WORK_TYPES.filter((t) =>
            detectedWorkTypes.has(t),
          );

          if (resolvedWorkTypes.length > 0) {
            setPlanWorkTypes(resolvedWorkTypes);
            setActiveTypeTab("ALL");
          } else {
            setPlanWorkTypes([]);
            setActiveTypeTab("ALL");
          }

          // ────────────────────────────────────────────────────────
          // 2. Populate target cards from real DB items
          // ────────────────────────────────────────────────────────
          if (p.items && p.items.length > 0) {
            const allItems = p.items as any[];
            const allCustomers = Array.from(
              new Set(allItems.map((i: any) => i.customerName).filter(Boolean)),
            ).join(", ");

            const t1Item =
              allItems.find((i) => i.itemType === "TYPE_1" || i.visitTopic) ||
              allItems[0];

            const type2DbItems = allItems.filter(
              (i) =>
                i.itemType === "TYPE_2" ||
                i.visitTopic === "FOLLOWUP" ||
                i.followupProductName,
            );
            const t2ItemsFromDb =
              type2DbItems.length > 0
                ? type2DbItems.map((item) => ({
                    productName:
                      item.followupProductName || item.productName || "สินค้า",
                    customer: item.customerName || p.location || "",
                    detail: item.detail || "",
                    expectedResult: item.expectedResult || "พืชตอบสนองดี",
                  }))
                : undefined;

            const type3DbItems = allItems.filter(
              (i) =>
                i.itemType !== "MARKETING_PRODUCT" &&
                i.itemType !== "SALES_PROMOTION" &&
                i.visitTopic !== "MARKETING_PRODUCT" &&
                i.visitTopic !== "SALES_PROMOTION" &&
                (i.itemType === "TYPE_3" ||
                  i.saleProductName ||
                  i.saleTotalPrice != null ||
                  i.saleQuantity != null ||
                  i.saleUnitPrice != null),
            );

            const t3ItemsFromDb =
              type3DbItems.length > 0
                ? type3DbItems.map((item) => {
                    const productName =
                      item.saleProductName || item.productName || "สินค้าเสนอขาย";
                    const qtyVal =
                      item.saleQuantity != null
                        ? String(item.saleQuantity)
                        : "";
                    const uPriceVal =
                      item.saleUnitPrice != null
                        ? `${Number(item.saleUnitPrice).toLocaleString()} บาท`
                        : "";
                    const totalPriceVal =
                      item.saleTotalPrice != null
                        ? `${Number(item.saleTotalPrice).toLocaleString()} บาท`
                        : item.saleQuantity != null && item.saleUnitPrice != null
                          ? `${(Number(item.saleQuantity) * Number(item.saleUnitPrice)).toLocaleString()} บาท`
                          : "";

                    return {
                      productName,
                      customer: item.customerName || p.location || "",
                      qty: qtyVal,
                      unitPrice: uPriceVal,
                      price: totalPriceVal,
                      detail: item.detail || "",
                    };
                  })
                : undefined;

            const t3Item = type3DbItems[0];
            const t3TotalSales = type3DbItems.reduce(
              (sum, item) =>
                sum +
                (item.saleTotalPrice != null
                  ? Number(item.saleTotalPrice)
                  : (Number(item.saleQuantity) || 0) *
                    (Number(item.saleUnitPrice) || 0)),
              0,
            );
            const t3ProdNames = Array.from(
              new Set(
                type3DbItems
                  .map((i) => i.saleProductName || i.productName)
                  .filter(Boolean),
              ),
            ).join(", ");
            const t3TotalQty = type3DbItems.reduce(
              (sum, item) => sum + (Number(item.saleQuantity) || 0),
              0,
            );
            const t3SingleQty =
              t3Item?.saleQuantity != null
                ? String(t3Item.saleQuantity)
                : t3TotalQty > 0
                  ? String(t3TotalQty)
                  : "";
            const t3SingleUnitPrice =
              t3Item?.saleUnitPrice != null
                ? `${Number(t3Item.saleUnitPrice).toLocaleString()} บาท`
                : "";

            const t4Item = allItems.find(
              (i) => i.itemType === "TYPE_4" || i.collectAmount != null,
            );

            const type5DbItems = allItems.filter(
              (i) =>
                i.itemType !== "MARKETING_PRODUCT" &&
                i.itemType !== "SALES_PROMOTION" &&
                i.visitTopic !== "MARKETING_PRODUCT" &&
                i.visitTopic !== "SALES_PROMOTION" &&
                (i.itemType === "TYPE_5" ||
                  i.surveyCompetitorProduct ||
                  i.surveyStoreName),
            );

            const t5ItemsFromDb =
              type5DbItems.length > 0
                ? type5DbItems.map((item) => ({
                    store:
                      item.surveyStoreName ||
                      item.customerName ||
                      p.location ||
                      "",
                    product: item.surveyCompetitorProduct || "",
                    detail: item.detail || "",
                  }))
                : undefined;

            const t5Item =
              type5DbItems[0] ||
              allItems.find(
                (i) =>
                  i.itemType === "TYPE_5" ||
                  i.surveyCompetitorProduct ||
                  i.surveyStoreName,
              );

            const type6DbItems = allItems.filter(
              (i) =>
                i.itemType !== "MARKETING_PRODUCT" &&
                i.itemType !== "SALES_PROMOTION" &&
                i.visitTopic !== "MARKETING_PRODUCT" &&
                i.visitTopic !== "SALES_PROMOTION" &&
                (i.itemType === "TYPE_6" || i.issueType),
            );

            const t6ItemsFromDb =
              type6DbItems.length > 0
                ? type6DbItems.map((item) => ({
                    customer: item.customerName || p.location || "",
                    issueType: item.issueType || "เคลมของ",
                    detail: item.detail || "",
                  }))
                : undefined;

            const t6Item =
              type6DbItems[0] ||
              allItems.find((i) => i.itemType === "TYPE_6" || i.issueType);

            const type7DbItems = allItems.filter(
              (i) =>
                i.itemType !== "MARKETING_PRODUCT" &&
                i.itemType !== "SALES_PROMOTION" &&
                i.visitTopic !== "MARKETING_PRODUCT" &&
                i.visitTopic !== "SALES_PROMOTION" &&
                (i.itemType === "TYPE_7" ||
                  i.plotActivityType ||
                  i.plotCropName ||
                  i.plotOwnerName ||
                  i.plotAreaRai != null ||
                  i.plotCount != null),
            );

            const t7ItemsFromDb =
              type7DbItems.length > 0
                ? type7DbItems.map((item) => {
                    let plotAreaStr = "";
                    if (
                      item.plotAreaRai != null &&
                      Number(item.plotAreaRai) > 0
                    ) {
                      plotAreaStr = `${item.plotAreaRai} ไร่`;
                    } else if (
                      item.plotTreeCount != null &&
                      item.plotTreeCount > 0
                    ) {
                      plotAreaStr = `${item.plotTreeCount} ต้น`;
                    }

                    const rawDetail = item.detail || "";
                    const objMatch = rawDetail.match(
                      /(?:วัตถุประสงค์ของแปลง|วัตถุประสงค์):\s*([^|]+)/,
                    );
                    const expMatch = rawDetail.match(
                      /(?:รายละเอียด \/ วิธีการทดลอง|วิธีการทดลอง|รายละเอียดการทดลอง):\s*([^|]+)/,
                    );

                    const parsedObjective = objMatch
                      ? objMatch[1].trim()
                      : item.objective || "";
                    let parsedExperiment = expMatch
                      ? expMatch[1].trim()
                      : item.experimentDetail || "";

                    if (!objMatch && !expMatch && rawDetail) {
                      parsedExperiment = rawDetail;
                    }

                    return {
                      activityType: item.plotActivityType || "CREATE",
                      owner:
                        item.plotOwnerName ||
                        item.customerName ||
                        p.location ||
                        "",
                      product: item.plotProductName || "",
                      crop: item.plotCropName || "",
                      plots: plotAreaStr,
                      demoProductQuantity:
                        item.plotCount != null ? String(item.plotCount) : "-",
                      objective: parsedObjective,
                      experimentDetail: parsedExperiment,
                      detail: rawDetail,
                    };
                  })
                : undefined;

            const t7Item =
              type7DbItems[0] ||
              allItems.find(
                (i) =>
                  i.itemType === "TYPE_7" ||
                  i.plotActivityType ||
                  i.plotCropName ||
                  i.plotOwnerName ||
                  i.plotAreaRai != null ||
                  i.plotCount != null,
              );

            const type8DbItems = allItems.filter(
              (i) =>
                i.itemType === "TYPE_8" ||
                i.meetingTopic ||
                i.meetingAttendeesCount != null,
            );

            const t8Item =
              type8DbItems[0] ||
              allItems.find(
                (i) =>
                  i.itemType === "TYPE_8" ||
                  i.meetingTopic ||
                  i.meetingAttendeesCount != null,
              );

            const type9DbItems = allItems.filter(
              (i) =>
                i.itemType !== "MARKETING_PRODUCT" &&
                i.itemType !== "SALES_PROMOTION" &&
                i.visitTopic !== "MARKETING_PRODUCT" &&
                i.visitTopic !== "SALES_PROMOTION" &&
                (i.itemType === "TYPE_9" ||
                  (i.storeProductName && !i.plotCropCategory) ||
                  (i.storeTotalAmount != null && !i.plotCropCategory)),
            );

            const t9Item =
              type9DbItems[0] ||
              allItems.find(
                (i) =>
                  i.itemType === "TYPE_9" ||
                  i.storeProductName ||
                  i.storeTotalAmount != null,
              );

            const t9ItemsFromDb =
              type9DbItems.length > 0
                ? type9DbItems
                    .filter((i) => i.storeProductName)
                    .map((item, idx) => ({
                      id: item.id || String(idx + 1),
                      productName: item.storeProductName || "",
                      quantityCases: item.storeQuantityCases
                        ? Number(item.storeQuantityCases)
                        : 0,
                      pricePerCase: item.storePricePerCase
                        ? Number(item.storePricePerCase)
                        : 0,
                      totalAmount: item.storeTotalAmount
                        ? Number(item.storeTotalAmount)
                        : (Number(item.storeQuantityCases) || 0) *
                          (Number(item.storePricePerCase) || 0),
                    }))
                : [];

            const rawCustomerName =
              type9DbItems.find((i) => i.customerName)?.customerName ||
              t9Item?.customerName ||
              "";

            let t9MainStore = rawCustomerName;
            let t9IsSubDealer = false;
            let t9SubDealerStore = "";

            const subDealerMatch = rawCustomerName.match(
              /^(.*?)\s*\((?:ร้าน\s*)?Sub Dealer:\s*(.*?)\)$/i,
            );
            if (subDealerMatch) {
              t9MainStore = subDealerMatch[1].trim();
              t9IsSubDealer = true;
              t9SubDealerStore = subDealerMatch[2].trim();
            } else if (p.objective) {
              const objMatch = p.objective.match(
                /\[กิจกรรมหน้าร้าน\].*?ร้านค้า:\s*([^|\n]+)/i,
              );
              if (objMatch) {
                const rawObjStore = objMatch[1].trim();
                const match = rawObjStore.match(
                  /^(.*?)\s*\((?:ร้าน\s*)?Sub Dealer:\s*(.*?)\)$/i,
                );
                if (match) {
                  if (!t9MainStore) t9MainStore = match[1].trim();
                  t9IsSubDealer = true;
                  t9SubDealerStore = match[2].trim();
                }
              }
            }

            const t9TotalSales = type9DbItems.reduce(
              (sum, item) =>
                sum +
                (item.storeTotalAmount != null
                  ? Number(item.storeTotalAmount)
                  : (Number(item.storeQuantityCases) || 0) *
                    (Number(item.storePricePerCase) || 0)),
              0,
            );

            const t9ProductSummary = t9ItemsFromDb
              .map((prod) => `${prod.productName} (${prod.quantityCases} ลัง)`)
              .join(", ");

            const t10Item = allItems.find((i) => i.itemType === "TYPE_10");
            const t11Item = allItems.find((i) => i.itemType === "TYPE_11");

            setTargets((prev) => ({
              ...prev,
              t1: {
                ...prev.t1,
                customer:
                  t1Item?.customerName || allCustomers || p.location || "",
                topic: t1Item?.visitTopic || prev.t1.topic,
                detail: t1Item?.detail || "",
              },
              t2: {
                ...prev.t2,
                customer:
                  (t2ItemsFromDb &&
                    Array.from(
                      new Set(
                        t2ItemsFromDb.map((i) => i.customer).filter(Boolean),
                      ),
                    ).join(", ")) ||
                  allCustomers ||
                  "",
                product:
                  (t2ItemsFromDb &&
                    t2ItemsFromDb.map((i) => i.productName).join(", ")) ||
                  "",
                detail:
                  (t2ItemsFromDb &&
                    t2ItemsFromDb
                      .map((i) => i.detail)
                      .filter(Boolean)
                      .join(" | ")) ||
                  "",
                items: t2ItemsFromDb || [],
              },
              t3: {
                ...prev.t3,
                customer:
                  (t3ItemsFromDb &&
                    Array.from(
                      new Set(
                        t3ItemsFromDb.map((i) => i.customer).filter(Boolean),
                      ),
                    ).join(", ")) ||
                  t3Item?.customerName ||
                  allCustomers ||
                  "",
                product: t3ProdNames || t3Item?.saleProductName || "",
                targetQty: t3SingleQty,
                unitPrice: t3SingleUnitPrice,
                detail:
                  (t3ItemsFromDb &&
                    t3ItemsFromDb
                      .map((i) => i.detail)
                      .filter(Boolean)
                      .join(" | ")) ||
                  t3Item?.detail ||
                  "",
                targetSales:
                  t3TotalSales > 0
                    ? `${t3TotalSales.toLocaleString()} บาท`
                    : t3Item?.saleTotalPrice
                      ? `${Number(t3Item.saleTotalPrice).toLocaleString()} บาท`
                      : "",
                items: t3ItemsFromDb || [],
              },
              t4: {
                ...prev.t4,
                customer: t4Item?.customerName || allCustomers || "",
                targetCollect: t4Item?.collectAmount
                  ? `${Number(t4Item.collectAmount).toLocaleString()} บาท`
                  : "",
              },
              t5: {
                ...prev.t5,
                store:
                  (t5ItemsFromDb &&
                    Array.from(
                      new Set(
                        t5ItemsFromDb.map((i) => i.store).filter(Boolean),
                      ),
                    ).join(", ")) ||
                  t5Item?.surveyStoreName ||
                  allCustomers ||
                  "",
                product:
                  (t5ItemsFromDb &&
                    t5ItemsFromDb
                      .map((i) => i.product)
                      .filter(Boolean)
                      .join(", ")) ||
                  t5Item?.surveyCompetitorProduct ||
                  "",
                detail:
                  (t5ItemsFromDb &&
                    t5ItemsFromDb
                      .map((i) => i.detail)
                      .filter(Boolean)
                      .join(" | ")) ||
                  t5Item?.detail ||
                  "",
                items: t5ItemsFromDb || [],
              },
              t6: {
                ...prev.t6,
                customer:
                  (t6ItemsFromDb &&
                    Array.from(
                      new Set(
                        t6ItemsFromDb.map((i) => i.customer).filter(Boolean),
                      ),
                    ).join(", ")) ||
                  t6Item?.customerName ||
                  allCustomers ||
                  "",
                issueType:
                  (t6ItemsFromDb &&
                    t6ItemsFromDb
                      .map((i) => i.issueType)
                      .filter(Boolean)
                      .join(", ")) ||
                  t6Item?.issueType ||
                  prev.t6.issueType,
                detail:
                  (t6ItemsFromDb &&
                    t6ItemsFromDb
                      .map((i) => i.detail)
                      .filter(Boolean)
                      .join(" | ")) ||
                  t6Item?.detail ||
                  "",
                items: t6ItemsFromDb || [],
              },
              t7: {
                ...prev.t7,
                activityType:
                  t7Item?.plotActivityType ||
                  (t7ItemsFromDb && t7ItemsFromDb[0]?.activityType) ||
                  "CREATE",
                owner:
                  (t7ItemsFromDb &&
                    Array.from(
                      new Set(
                        t7ItemsFromDb.map((i) => i.owner).filter(Boolean),
                      ),
                    ).join(", ")) ||
                  t7Item?.plotOwnerName ||
                  allCustomers ||
                  "",
                product:
                  (t7ItemsFromDb &&
                    Array.from(
                      new Set(
                        t7ItemsFromDb.map((i) => i.product).filter(Boolean),
                      ),
                    ).join(", ")) ||
                  t7Item?.plotProductName ||
                  "",
                crop:
                  (t7ItemsFromDb &&
                    Array.from(
                      new Set(t7ItemsFromDb.map((i) => i.crop).filter(Boolean)),
                    ).join(", ")) ||
                  t7Item?.plotCropName ||
                  "",
                plots:
                  (t7ItemsFromDb &&
                    t7ItemsFromDb
                      .map((i) => i.plots)
                      .filter(Boolean)
                      .join(", ")) ||
                  (t7Item?.plotAreaRai != null && Number(t7Item.plotAreaRai) > 0
                    ? `${t7Item.plotAreaRai} ไร่`
                    : t7Item?.plotTreeCount != null && t7Item.plotTreeCount > 0
                      ? `${t7Item.plotTreeCount} ต้น`
                      : ""),
                demoProductQuantity:
                  (t7ItemsFromDb &&
                    t7ItemsFromDb
                      .map((i) => i.demoProductQuantity)
                      .filter((v) => v && v !== "-")
                      .join(", ")) ||
                  (t7Item?.plotCount != null ? String(t7Item.plotCount) : "-"),
                objective:
                  (t7ItemsFromDb &&
                    t7ItemsFromDb
                      .map((i) => i.objective)
                      .filter(Boolean)
                      .join(" | ")) ||
                  "",
                experimentDetail:
                  (t7ItemsFromDb &&
                    t7ItemsFromDb
                      .map((i) => i.experimentDetail)
                      .filter(Boolean)
                      .join(" | ")) ||
                  "",
                detail:
                  (t7ItemsFromDb &&
                    t7ItemsFromDb
                      .map((i) => i.detail)
                      .filter(Boolean)
                      .join(" | ")) ||
                  t7Item?.detail ||
                  "",
                items: t7ItemsFromDb || [],
              },
              t8: {
                ...prev.t8,
                topic:
                  type8DbItems
                    .map((i) => i.meetingTopic)
                    .filter(Boolean)
                    .join(", ") ||
                  t8Item?.meetingTopic ||
                  "",
                products:
                  type8DbItems
                    .map((i) => i.meetingTargetProducts)
                    .filter(Boolean)
                    .join(", ") ||
                  t8Item?.meetingTargetProducts ||
                  "",
                targetAttendees:
                  type8DbItems
                    .map((i) =>
                      i.meetingAttendeesCount
                        ? `${i.meetingAttendeesCount} คน`
                        : "",
                    )
                    .filter(Boolean)
                    .join(", ") ||
                  (t8Item?.meetingAttendeesCount
                    ? `${t8Item.meetingAttendeesCount} คน`
                    : ""),
              },
              t9: {
                ...prev.t9,
                store:
                  t9MainStore ||
                  rawCustomerName ||
                  t9Item?.surveyStoreName ||
                  allCustomers ||
                  "",
                isSubDealer: t9IsSubDealer,
                subDealerStore: t9SubDealerStore,
                product: t9ProductSummary || t9Item?.storeProductName || "",
                targetSales:
                  t9TotalSales > 0
                    ? `${t9TotalSales.toLocaleString()} บาท`
                    : t9Item?.storeTotalAmount
                      ? `${Number(t9Item.storeTotalAmount).toLocaleString()} บาท`
                      : "",
                items: t9ItemsFromDb,
              },
              t10: {
                ...prev.t10,
                plot: t10Item?.customerName || allCustomers || "",
              },
              t11: {
                ...prev.t11,
                store: t11Item?.customerName || allCustomers || "",
                detail: t11Item?.detail || "",
              },
            }));

            if (p.startDate) {
              setT7StartDate(new Date(p.startDate).toISOString().split("T")[0]);
            }

            const t7PlotIdentifier =
              t7Item?.existingPlotId ||
              t7Item?.plotOwnerName ||
              t7Item?.plotCropName ||
              "";
            if (t7PlotIdentifier) {
              setT7DemoPlotId(t7PlotIdentifier);
              getDemoPlotHistoryAction(t7PlotIdentifier).then((histRes) => {
                if (histRes.success && histRes.plot) {
                  setT7DemoPlotData(histRes.plot);
                  if (histRes.plot.visits) setT7VisitHistory(histRes.plot.visits);
                  if (histRes.plot.status) setT7PlotStatus(histRes.plot.status as any);
                  if (histRes.plot.plantingDate) {
                    setT7PlantingDate(
                      new Date(histRes.plot.plantingDate)
                        .toISOString()
                        .split("T")[0],
                    );
                  } else if (histRes.plot.startDate) {
                    setT7PlantingDate(
                      new Date(histRes.plot.startDate)
                        .toISOString()
                        .split("T")[0],
                    );
                  }
                  if (histRes.plot.plantingAreaCondition) {
                    setT7PlantingAreaCondition(
                      histRes.plot.plantingAreaCondition,
                    );
                  }
                  if (histRes.plot.usageMethod && !t7UsageMethod) {
                    setT7UsageMethod(histRes.plot.usageMethod);
                  }
                  if (histRes.plot.startDate) {
                    setT7StartDate(
                      new Date(histRes.plot.startDate).toISOString().split("T")[0],
                    );
                  }
                  if (histRes.plot.demoYieldKg)
                    setT7FinalYieldKg(String(histRes.plot.demoYieldKg));
                  if (histRes.plot.controlYieldKg)
                    setT7ControlYieldKg(String(histRes.plot.controlYieldKg));
                  if (histRes.plot.yieldIncreasePercent)
                    setT7YieldIncreasePercent(
                      String(histRes.plot.yieldIncreasePercent),
                    );
                  if (histRes.plot.farmerSatisfaction)
                    setT7FarmerSatisfaction(histRes.plot.farmerSatisfaction);
                  if (histRes.plot.commercialPotential)
                    setT7CommercialPotential(histRes.plot.commercialPotential);
                  if (histRes.plot.finalSummaryNotes)
                    setT7FinalSummaryNotes(histRes.plot.finalSummaryNotes);
                }
              });
            }
          }

          // Restore saved post-activity outcome (p.result) if exists
          if ((p as any).result) {
            const resData = (p as any).result;
            if (resData.resultSummary) {
              const summaryText = resData.resultSummary;

              // Type 1
              const adviceMatch = summaryText.match(/สินค้าที่แนะนำ:\s*(.+)/);
              if (adviceMatch && adviceMatch[1]) {
                setT1ProductAdvice(adviceMatch[1].split("\n")[0].trim());
              }

              const opportunityMatch = summaryText.match(/โอกาสการขาย:\s*(.+)/);
              if (opportunityMatch && opportunityMatch[1]) {
                const oppVal = opportunityMatch[1].split("\n")[0].trim();
                if (oppVal === "สูง" || oppVal === "ต่ำ") {
                  setT1SalesOpportunity(oppVal);
                }
              }

              const discussionMatch = summaryText.match(/ผลการพูดคุย:\s*(.+)/);
              if (discussionMatch && discussionMatch[1]) {
                setT1DiscussionResult(discussionMatch[1].split("\n")[0].trim());
              }

              const detailMatch = summaryText.match(/รายละเอียดเข้าพบ:\s*(.+)/);
              if (detailMatch && detailMatch[1]) {
                setT1Detail(detailMatch[1].split("\n")[0].trim());
              }

              const nextActionMatch = summaryText.match(
                /สิ่งที่ต้องดำเนินการต่อ:\s*(.+)/,
              );
              if (nextActionMatch && nextActionMatch[1]) {
                setT1NextAction(nextActionMatch[1].split("\n")[0].trim());
              } else if (resData.nextAction) {
                setT1NextAction(resData.nextAction);
              }

              const nextMeetingMatch = summaryText.match(
                /วันที่นัดหมายครั้งถัดไป:\s*(.+)/,
              );
              if (nextMeetingMatch && nextMeetingMatch[1]) {
                let val = nextMeetingMatch[1].split("\n")[0].trim();
                if (val.includes("T")) {
                  val = val.split("T")[0];
                }
                setT1NextMeetingDate(val);
              }

              // Type 2 (Followup)
              const customerMatch = summaryText.match(/ลูกค้าติดตาม:\s*(.+)/);
              if (customerMatch && customerMatch[1]) {
                setT2CustomerName(customerMatch[1].split("\n")[0].trim());
              }

              const followupMatch = summaryText.match(/ติดตามผล:\s*(.+)/);
              if (followupMatch && followupMatch[1]) {
                const val = followupMatch[1].split("\n")[0].trim();
                setT2FollowupDetail(val);
                setT2Detail(val);
              }

              const usageResultMatch = summaryText.match(
                /ผลลัพธ์การใช้:\s*(.+)/,
              );
              if (usageResultMatch && usageResultMatch[1]) {
                const resVal = usageResultMatch[1].split("\n")[0].trim();
                setT2UsageResult(resVal as any);
                if (resVal === "พืชตอบสนองดี") {
                  setT2ProblemDetail("");
                }
              }

              const problemMatch = summaryText.match(
                /ปัญหาการใช้สินค้า:\s*(.+)/,
              );
              if (problemMatch && problemMatch[1]) {
                setT2ProblemDetail(problemMatch[1].split("\n")[0].trim());
              }

              // Type 3
              const soldMatch = summaryText.match(/รายการขาย:\s*(.+)/);
              if (soldMatch && soldMatch[1]) {
                setT3SoldProducts(soldMatch[1].split("\n")[0].trim());
              }
              const actualSalesMatch = summaryText.match(/ยอดขายจริง:\s*(.+)/);
              if (actualSalesMatch && actualSalesMatch[1]) {
                setT3ActualSales(actualSalesMatch[1].split("\n")[0].trim());
              } else if (resData.salesResultAmount) {
                setT3ActualSales(String(resData.salesResultAmount));
              }
              const actualQtyMatch = summaryText.match(
                /จำนวนที่ขายจริง:\s*(.+)/,
              );
              if (actualQtyMatch && actualQtyMatch[1]) {
                setT3ActualQuantity(actualQtyMatch[1].split("\n")[0].trim());
              }
              const unclosedMatch = summaryText.match(
                /เหตุผลที่ปิดการขายไม่ได้:\s*(.+)/,
              );
              if (unclosedMatch && unclosedMatch[1]) {
                setT3UnclosedReason(unclosedMatch[1].split("\n")[0].trim());
              }

              // Type 4
              const orderNoMatch = summaryText.match(
                /เลขที่บิล\/ใบแจ้งหนี้:\s*(.+)/,
              );
              if (orderNoMatch && orderNoMatch[1]) {
                setT4OrderNo(orderNoMatch[1].split("\n")[0].trim());
              }
              const receivedMatch = summaryText.match(
                /ยอดเงินที่เก็บได้จริง:\s*(.+)/,
              );
              if (receivedMatch && receivedMatch[1]) {
                setT4ReceivedAmount(receivedMatch[1].split("\n")[0].trim());
              } else if (resData.collectResultAmount) {
                setT4ReceivedAmount(String(resData.collectResultAmount));
              }

              // Type 5
              const compBrandMatch = summaryText.match(/แบรนด์คู่แข่ง:\s*(.+)/);
              if (compBrandMatch && compBrandMatch[1]) {
                setT5CompetitorBrand(compBrandMatch[1].split("\n")[0].trim());
              }
              const compProdMatch = summaryText.match(/สินค้าคู่แข่ง:\s*(.+)/);
              if (compProdMatch && compProdMatch[1]) {
                setT5CompetitorProduct(compProdMatch[1].split("\n")[0].trim());
              }
              const compPriceMatch = summaryText.match(/ราคาคู่แข่ง:\s*(.+)/);
              if (compPriceMatch && compPriceMatch[1]) {
                setT5CompetitorPrice(compPriceMatch[1].split("\n")[0].trim());
              }
              const compUnitMatch = summaryText.match(
                /(?:หน่วยนับคู่แข่ง|หน่วยนับ):\s*(.+)/,
              );
              if (compUnitMatch && compUnitMatch[1]) {
                setT5CompetitorUnit(compUnitMatch[1].split("\n")[0].trim());
              }
              const promoMatch = summaryText.match(/โปรโมชันคู่แข่ง:\s*(.+)/);
              if (promoMatch && promoMatch[1]) {
                setT5PromotionDetail(promoMatch[1].split("\n")[0].trim());
              }

              // Type 6
              const t6ProbMatch = summaryText.match(
                /ปัญหาลูกค้าร้องเรียน:\s*(.+)/,
              );
              if (t6ProbMatch && t6ProbMatch[1]) {
                setT6ProblemDetail(t6ProbMatch[1].split("\n")[0].trim());
              }
              const t6SolMatch = summaryText.match(
                /แนวทางแก้ไขเบื้องต้น:\s*(.+)/,
              );
              if (t6SolMatch && t6SolMatch[1]) {
                setT6InitialSolution(t6SolMatch[1].split("\n")[0].trim());
              }
              const t6StatusMatch = summaryText.match(
                /สถานะการแก้ปัญหา:\s*(.+)/,
              );
              if (t6StatusMatch && t6StatusMatch[1]) {
                const sVal = t6StatusMatch[1].split("\n")[0].trim();
                if (sVal === "เสร็จสิ้น" || sVal === "รอติดตาม")
                  setT6Status(sVal);
              }

              // Type 7
              const t7PlotMatch = summaryText.match(/ชื่อแปลงทดสอบ:\s*(.+)/);
              if (t7PlotMatch && t7PlotMatch[1]) {
                setT7PlotName(t7PlotMatch[1].split("\n")[0].trim());
              }
              const t7MethodMatch = summaryText.match(
                /วิธีใช้\/อัตราการใช้:\s*(.+)/,
              );
              if (t7MethodMatch && t7MethodMatch[1]) {
                setT7UsageMethod(t7MethodMatch[1].split("\n")[0].trim());
              }
              const t7AgeMatch = summaryText.match(
                /อายุพืช:\s*(\d+)\s*(วัน|สัปดาห์|เดือน|ปี)?/,
              );
              if (t7AgeMatch && t7AgeMatch[1]) {
                setT7CropAgeValue(t7AgeMatch[1].trim());
                if (t7AgeMatch[2]) {
                  setT7CropAgeUnit(t7AgeMatch[2].trim());
                }
              }
              const t7GrowthMatch = summaryText.match(
                /ระยะการเจริญเติบโต:\s*(.+)/,
              );
              if (t7GrowthMatch && t7GrowthMatch[1]) {
                setT7GrowthStage(t7GrowthMatch[1].split("\n")[0].trim());
              }
              const t7CondMatch = summaryText.match(/สภาพแปลง:\s*(.+)/);
              if (t7CondMatch && t7CondMatch[1]) {
                const cVal = t7CondMatch[1].split("\n")[0].trim();
                if (
                  cVal === "สมบูรณ์" ||
                  cVal === "มีปัญหา" ||
                  cVal === "ปานกลาง" ||
                  cVal === "ทรุดโทรม"
                ) {
                  setT7CropCondition(cVal as any);
                }
              }
              const t7DescMatch = summaryText.match(
                /(?:ปัญหาของสภาพพืช|รายละเอียดแปลง):\s*(.+)/,
              );
              if (t7DescMatch && t7DescMatch[1]) {
                setT7CropProblemDescription(
                  t7DescMatch[1].split("\n")[0].trim(),
                );
              }
              const t7ResponseMatch = summaryText.match(
                /ผลการใช้ผลิตภัณฑ์:\s*(.+)/,
              );
              if (t7ResponseMatch && t7ResponseMatch[1]) {
                const resp = t7ResponseMatch[1].split("\n")[0].trim();
                if (resp === "พืชตอบสนองดี" || resp === "พบปัญหา") {
                  setT7ProductResponse(resp);
                }
              }
              const t7ProblemMatch = summaryText.match(
                /รายละเอียดปัญหาการใช้ผลิตภัณฑ์:\s*(.+)/,
              );
              if (t7ProblemMatch && t7ProblemMatch[1]) {
                setT7ProblemDescription(
                  t7ProblemMatch[1].split("\n")[0].trim(),
                );
              }
              const plantingDateMatch = summaryText.match(/วันที่ปลูก:\s*(.+)/);
              if (plantingDateMatch && plantingDateMatch[1]) {
                setT7PlantingDate(plantingDateMatch[1].split("\n")[0].trim());
              }
              const areaCondMatch = summaryText.match(/สภาพพื้นที่ปลูก:\s*(.+)/);
              if (areaCondMatch && areaCondMatch[1]) {
                setT7PlantingAreaCondition(
                  areaCondMatch[1].split("\n")[0].trim(),
                );
              }
              const statusMatch = summaryText.match(/สถานะแปลง:\s*(.+)/);
              if (statusMatch && statusMatch[1]) {
                const s = statusMatch[1].split("\n")[0].trim();
                if (
                  s === "IN_PROGRESS" ||
                  s === "COMPLETED" ||
                  s === "FAILED"
                ) {
                  setT7PlotStatus(s as any);
                }
              }
              const nextVisitMatch = summaryText.match(
                /กำหนดการติดตามครั้งถัดไป:\s*(.+)/,
              );
              if (nextVisitMatch && nextVisitMatch[1]) {
                setT7NextFollowUpDate(nextVisitMatch[1].split("\n")[0].trim());
              }
              const yieldMatch = summaryText.match(/ผลผลิตแปลงสาธิต:\s*(.+)/);
              if (yieldMatch && yieldMatch[1]) {
                setT7FinalYieldKg(yieldMatch[1].replace(/[^0-9.]/g, ""));
              }
              const controlMatch = summaryText.match(/ผลผลิตแปลงควบคุม:\s*(.+)/);
              if (controlMatch && controlMatch[1]) {
                setT7ControlYieldKg(controlMatch[1].replace(/[^0-9.]/g, ""));
              }
              const incMatch = summaryText.match(/%\s*ผลผลิตเพิ่มขึ้น:\s*(.+)/);
              if (incMatch && incMatch[1]) {
                setT7YieldIncreasePercent(incMatch[1].replace(/[^0-9.]/g, ""));
              }
              const satMatch = summaryText.match(/ความพึงพอใจเกษตรกร:\s*(\d)/);
              if (satMatch && satMatch[1]) {
                setT7FarmerSatisfaction(parseInt(satMatch[1]) || 5);
              }
              const comMatch = summaryText.match(/โอกาสสั่งซื้อจริง:\s*(.+)/);
              if (comMatch && comMatch[1]) {
                setT7CommercialPotential(comMatch[1].split("\n")[0].trim());
              }
              const finalNotesMatch = summaryText.match(
                /สรุปผลสัมฤทธิ์แปลง:\s*(.+)/,
              );
              if (finalNotesMatch && finalNotesMatch[1]) {
                setT7FinalSummaryNotes(finalNotesMatch[1].split("\n")[0].trim());
              }

              // Type 8
              const t8AttendeesMatch = summaryText.match(
                /จำนวนผู้เข้าร่วมประชุมจริง:\s*(.+)/,
              );
              if (t8AttendeesMatch && t8AttendeesMatch[1]) {
                setT8ActualAttendees(t8AttendeesMatch[1].split("\n")[0].trim());
              }
              const qnaMatch = summaryText.match(/Q&A:\s*(.+)/);
              if (qnaMatch && qnaMatch[1]) {
                setT8FeedbackQnA(qnaMatch[1].split("\n")[0].trim());
              }
              const t8SalesMatch = summaryText.match(
                /ยอดขายแยกสินค้าประชุม:\s*(.+)/,
              );
              if (t8SalesMatch && t8SalesMatch[1]) {
                try {
                  const parsed = JSON.parse(t8SalesMatch[1].trim());
                  if (Array.isArray(parsed)) {
                    setT8ProductSalesDetails(parsed);
                  }
                } catch (e) {
                  console.error("Failed to parse t8ProductSalesDetails", e);
                }
              }

              // Type 9
              const t9SalesMatch = summaryText.match(
                /ยอดขายหน้าร้านจริง:\s*(.+)/,
              );
              if (t9SalesMatch && t9SalesMatch[1]) {
                setT9ActualSales(t9SalesMatch[1].split("\n")[0].trim());
              }
              const t9AttendeesMatch = summaryText.match(
                /จำนวนผู้เข้าร่วมกิจกรรมหน้าร้าน:\s*(.+)/,
              );
              if (t9AttendeesMatch && t9AttendeesMatch[1]) {
                setT9ActualAttendees(t9AttendeesMatch[1].split("\n")[0].trim());
              }

              // Type 10
              const t10AttendeesMatch = summaryText.match(
                /จำนวนผู้เข้าร่วม Field Day จริง:\s*(.+)/,
              );
              if (t10AttendeesMatch && t10AttendeesMatch[1]) {
                setT10ActualAttendees(
                  t10AttendeesMatch[1].split("\n")[0].trim(),
                );
              }
              const t10FeedbackMatch = summaryText.match(
                /ความสนใจเกษตรกร:\s*(.+)/,
              );
              if (t10FeedbackMatch && t10FeedbackMatch[1]) {
                setT10FarmerFeedback(t10FeedbackMatch[1].split("\n")[0].trim());
              }
              const t10FarmersMatch = summaryText.match(
                /รายชื่อเกษตรกรเป้าหมาย:\s*(.+)/,
              );
              if (t10FarmersMatch && t10FarmersMatch[1]) {
                setT10TargetFarmersList(
                  t10FarmersMatch[1].split("\n")[0].trim(),
                );
              }

              // Type 11
              const t11RemarksMatch = summaryText.match(
                /ข้อสังเกตสต็อก:\s*(.+)/,
              );
              if (t11RemarksMatch && t11RemarksMatch[1]) {
                setT11Remarks(t11RemarksMatch[1].split("\n")[0].trim());
              }
              const t11StatusMatch = summaryText.match(/สถานะสต็อก:\s*(.+)/);
              if (t11StatusMatch && t11StatusMatch[1]) {
                setT11StockStatus(
                  t11StatusMatch[1].split("\n")[0].trim() as any,
                );
              }
              const t11ReorderMatch = summaryText.match(
                /โอกาสสั่งซื้อซ้ำ:\s*(.+)/,
              );
              if (t11ReorderMatch && t11ReorderMatch[1]) {
                setT11ReorderOpportunity(
                  t11ReorderMatch[1].split("\n")[0].trim() as any,
                );
              }
              const t11NextActionMatch = summaryText.match(
                /แผนการติดตามสต็อก:\s*(.+)/,
              );
              if (t11NextActionMatch && t11NextActionMatch[1]) {
                setT11NextAction(t11NextActionMatch[1].split("\n")[0].trim());
              }
            }

            // Activity Result Status & Postponed / Cancelled fields
            if (resData.resultStatus) {
              setActivityResultStatus(resData.resultStatus as any);
            }
            if (resData.cancelReason) {
              setCancelReason(resData.cancelReason);
            }
            if (resData.postponedDate) {
              const d = new Date(resData.postponedDate);
              setPostponedDate(
                !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : "",
              );
            }
            if (resData.postponedTime) {
              setPostponedTime(resData.postponedTime);
            }
            if (resData.postponedReason) {
              setPostponedReason(resData.postponedReason);
            }
            if (resData.postponedNotes) {
              setPostponedNotes(resData.postponedNotes);
            }

            // Numeric and common fields from result
            if (resData.salesResultAmount) {
              setT3ActualSales(String(Number(resData.salesResultAmount)));
              setT9ActualSales(String(Number(resData.salesResultAmount)));
            }
            if (resData.collectResultAmount) {
              setT4ReceivedAmount(String(Number(resData.collectResultAmount)));
            }
            if (resData.actualAttendeesCount) {
              setT8ActualAttendees(String(resData.actualAttendeesCount));
              setT9ActualAttendees(String(resData.actualAttendeesCount));
              setT10ActualAttendees(String(resData.actualAttendeesCount));
            }
            if (resData.problemFound) {
              setT6ProblemDetail((prev) => prev || resData.problemFound || "");
            }
            if (resData.nextAction) {
              setT1NextAction(resData.nextAction);
              setT11NextAction(resData.nextAction);
            }
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

  // Pre-fill sample data
  const fillAllSampleData = () => {
    // Type 1
    setT1ProductAdvice(
      `${DEMO_PRODUCTS[0]}, ${DEMO_PRODUCTS[3] || "ปุ๋ยเคมีสูตรพิเศษ"}`,
    );
    setT1Detail(
      `เข้าพบเจ้าของ ${DEMO_OWNERS[0]} เพื่อแนะนำเทคนิคการดูแลพืชสวนช่วงทำใบ`,
    );
    setT1DiscussionResult(
      `ลูกค้าสนใจสั่งซื้อ ${DEMO_PRODUCTS[0]} ไปทดลองวางหน้าร้าน 50 ชุด และขอป้ายส่งเสริมการขาย`,
    );
    setT1SalesOpportunity("สูง");
    setT1NextAction(
      "นำส่งใบเสนอราคาพร้อมส่วนลดพิเศษ 5% และนำตัวอย่างสินค้ามาให้หน้าร้านลอง",
    );
    setT1NextMeetingDate("2026-08-05");

    // Type 2
    setT2CustomerName(
      `${DEMO_OWNERS[0]} / ${DEMO_OWNERS[3] || "ร้านสหายพานิช"}`,
    );
    setT2FollowupDetail(
      "พืชตอบสนองดี ใบเขียวเข้มขึ้นอย่างเห็นได้ชัด แตกยอดสม่ำเสมอ เกษตรกรพึงพอใจมาก",
    );
    setT2Detail(
      "พืชตอบสนองดี ใบเขียวเข้มขึ้นอย่างเห็นได้ชัด แตกยอดสม่ำเสมอ เกษตรกรพึงพอใจมาก",
    );
    setT2UsageResult("พืชตอบสนองดี");
    setT2ProblemDetail("");

    // Type 3
    setT3SoldProducts(
      `${DEMO_PRODUCTS[0]} (20 ลัง), ${DEMO_PRODUCTS[1]} (10 ลัง)`,
    );
    setT3ActualSales("17500");
    setT3ActualQuantity("30 ลัง (A: 20 ลัง, B: 10 ลัง)");
    setT3UnclosedReason("ปิดการขายได้สำเร็จตามเป้าหมายทั้ง 2 สินค้า");

    // Type 4
    setT4OrderNo("INV-2026-0789");
    setT4ReceivedAmount("25500");

    // Type 5
    setT5CompetitorBrand("ตราเกษตรทองคำ, เสือคู่พรีเมียม");
    setT5CompetitorProduct(`เทียบกับ ${DEMO_PRODUCTS[0]} (ปุ๋ยทางใบ 1 ลิตร)`);
    setT5CompetitorPrice("850");
    setT5CompetitorUnit("ขวด");
    setT5PromotionDetail(
      "จัดโปรโมชัน ซื้อ 10 แถม 1 พร้อมแจกเสื้อยืดพนักงานหน้าร้าน",
    );

    // Type 6
    setT6ProblemDetail(
      `ลูกค้าร้องเรียนเรื่องสินค้า ${DEMO_PRODUCTS[0]} ตกตะกอนเมื่อผสมน้ำในถัง 200 ลิตร`,
    );
    setT6InitialSolution(
      "แนะนำการผสมน้ำอุ่นกวนให้ละลายก่อนเทลงถังใหญ่ พร้อมเปลี่ยนสินค้าล็อตใหม่ให้ลูกค้าทันที",
    );
    setT6Status("เสร็จสิ้น");

    // Type 7
    setT7PlotName("แปลงทดสอบบ้านนา");
    setT7UsageMethod(
      `ฉีดพ่น ${DEMO_PRODUCTS[0]} อัตรา 50cc/น้ำ 20L ทุกๆ 7 วัน`,
    );
    setT7CropAgeValue("45");
    setT7CropAgeUnit("วัน");
    setT7GrowthStage("ระยะเจริญเติบโตทางลำต้น/ใบ");
    setT7CropCondition("สมบูรณ์");
    setT7ProductResponse("พบปัญหา");
    setT7ProblemDescription(
      "พบคราบใบไหม้เล็กน้อยบริเวณขอบใบ เนื่องจากสภาพอากาศแดดจัดจัดในวันที่ฉีดพ่น",
    );

    // Type 8
    setT8ActualAttendees("35");
    setT8FeedbackQnA(
      `เกษตรกรสอบถามเรื่องการใช้ ${DEMO_PRODUCTS[0]} ร่วมกับชีวภัณฑ์ป้องกันรากเน่า และต้องการแผ่นพับตารางการใส่ปุ๋ยรายเดือน`,
    );
    setT8ProductSalesDetails([
      {
        productName: DEMO_PRODUCTS[0],
        actualQty: "15 ลัง",
        actualSales: "7500",
      },
      {
        productName: DEMO_PRODUCTS[1],
        actualQty: "10 ลัง",
        actualSales: "7500",
      },
    ]);

    // Type 9
    setT9Formats(["การสะสมคะแนน", "กิจกรรมลูกค้าสัมพันธ์"]);
    setT9ActualSales("18500");
    setT9ActualAttendees("28");

    // Type 10
    setT10ActualAttendees("120");
    setT10ActualSalesOrBooking("150000");
    setT10TargetFarmersList(
      "นายประเสริฐ (100 ไร่), นายวิชัย (50 ไร่), สวนผู้ใหญ่สมศักดิ์",
    );
    setT10FarmerFeedback("สูง");

    // Type 11
    setT11StockItems([
      {
        productName: DEMO_PRODUCTS[0],
        remainingQty: "50 กระสอบ",
        remarks: "สินค้าใกล้งวดสต็อก ให้รีบเติมด่วน",
      },
      {
        productName: DEMO_PRODUCTS[1],
        remainingQty: "20 ขวด",
        remarks: "สต็อกวางหน้าร้านเริ่มพร่อง",
      },
    ]);
    setT11ProductList(`${DEMO_PRODUCTS[0]}, ${DEMO_PRODUCTS[1]}`);
    setT11RemainingQty("50 กระสอบ, 20 ขวด");
    setT11Remarks("สินค้าใกล้งวดสต็อก ให้รีบเติมด่วน");
    setT11StockStatus("ใกล้หมด");
    setT11ReorderOpportunity("สูง");
    setT11NextAction(
      "แจ้งฝ่ายขายออกใบสั่งซื้อสินค้าเติมสต็อกหน้าร้านภายในวันจันทร์นี้",
    );
  };

  // Helper for image upload
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      if (id) {
        // Validate Cancel / Postponed fields
        if (activityResultStatus === "CANCELLED" && !cancelReason.trim()) {
          setFormError("กรุณาระบุสาเหตุที่ยกเลิกกิจกรรม");
          setIsSubmitting(false);
          return;
        }

        if (activityResultStatus === "POSTPONED") {
          if (!postponedDate) {
            setFormError("กรุณาระบุวันที่ใหม่สำหรับการเลื่อนกิจกรรม");
            setIsSubmitting(false);
            return;
          }
          if (!postponedReason) {
            setFormError("กรุณาเลือกเหตุผลที่เลื่อนกิจกรรม");
            setIsSubmitting(false);
            return;
          }
        }

        const statusLabel =
          activityResultStatus === "COMPLETED"
            ? "สำเร็จ"
            : activityResultStatus === "POSTPONED"
              ? "เลื่อน"
              : activityResultStatus === "CANCELLED"
                ? "ยกเลิก"
                : "สำเร็จบางส่วน";

        const summaryParts = [
          `สถานะผลกิจกรรม: ${statusLabel}`,
          activityResultStatus === "CANCELLED" && cancelReason
            ? `สาเหตุที่ยกเลิก: ${cancelReason}`
            : null,
          activityResultStatus === "POSTPONED" && postponedDate
            ? `วันที่ใหม่: ${postponedDate}`
            : null,
          activityResultStatus === "POSTPONED" && postponedTime
            ? `เวลาใหม่: ${postponedTime}`
            : null,
          activityResultStatus === "POSTPONED" && postponedReason
            ? `เหตุผลที่เลื่อน: ${postponedReason}`
            : null,
          activityResultStatus === "POSTPONED" && postponedNotes
            ? `หมายเหตุการเลื่อน: ${postponedNotes}`
            : null,
          // Type 1
          t1ProductAdvice ? `สินค้าที่แนะนำ: ${t1ProductAdvice}` : null,
          t1SalesOpportunity ? `โอกาสการขาย: ${t1SalesOpportunity}` : null,
          t1DiscussionResult ? `ผลการพูดคุย: ${t1DiscussionResult}` : null,
          t1Detail ? `รายละเอียดเข้าพบ: ${t1Detail}` : null,
          t1NextAction ? `สิ่งที่ต้องดำเนินการต่อ: ${t1NextAction}` : null,
          t1NextMeetingDate
            ? `วันที่นัดหมายครั้งถัดไป: ${t1NextMeetingDate}`
            : null,

          // Type 2
          t2CustomerName ? `ลูกค้าติดตาม: ${t2CustomerName}` : null,
          t2FollowupDetail || t2Detail
            ? `ติดตามผล: ${t2FollowupDetail || t2Detail}`
            : null,
          t2UsageResult ? `ผลลัพธ์การใช้: ${t2UsageResult}` : null,
          (t2UsageResult === "พบปัญหา" ||
            (typeof t2UsageResult === "string" &&
              t2UsageResult.includes("พบปัญหา"))) &&
          t2ProblemDetail
            ? `ปัญหาการใช้สินค้า: ${t2ProblemDetail}`
            : null,

          // Type 3
          t3SoldProducts ? `รายการขาย: ${t3SoldProducts}` : null,
          t3ActualSales ? `ยอดขายจริง: ${t3ActualSales}` : null,
          t3ActualQuantity ? `จำนวนที่ขายจริง: ${t3ActualQuantity}` : null,
          t3UnclosedReason
            ? `เหตุผลที่ปิดการขายไม่ได้: ${t3UnclosedReason}`
            : null,

          // Type 4
          t4OrderNo ? `เลขที่บิล/ใบแจ้งหนี้: ${t4OrderNo}` : null,
          t4ReceivedAmount
            ? `ยอดเงินที่เก็บได้จริง: ${t4ReceivedAmount}`
            : null,

          // Type 5
          t5CompetitorBrand ? `แบรนด์คู่แข่ง: ${t5CompetitorBrand}` : null,
          t5CompetitorProduct ? `สินค้าคู่แข่ง: ${t5CompetitorProduct}` : null,
          t5CompetitorPrice ? `ราคาคู่แข่ง: ${t5CompetitorPrice}` : null,
          t5CompetitorUnit ? `หน่วยนับคู่แข่ง: ${t5CompetitorUnit}` : null,
          t5PromotionDetail ? `โปรโมชันคู่แข่ง: ${t5PromotionDetail}` : null,

          // Type 6
          t6ProblemDetail ? `ปัญหาลูกค้าร้องเรียน: ${t6ProblemDetail}` : null,
          t6InitialSolution
            ? `แนวทางแก้ไขเบื้องต้น: ${t6InitialSolution}`
            : null,
          t6Status ? `สถานะการแก้ปัญหา: ${t6Status}` : null,

          // Type 7
          t7PlotName ? `ชื่อแปลงทดสอบ: ${t7PlotName}` : null,
          t7PlantingDate ? `วันที่ปลูก: ${t7PlantingDate}` : null,
          t7PlantingAreaCondition
            ? `สภาพพื้นที่ปลูก: ${t7PlantingAreaCondition}`
            : null,
          t7UsageMethod ? `วิธีใช้/อัตราการใช้: ${t7UsageMethod}` : null,
          t7CropAgeValue
            ? `อายุพืช: ${t7CropAgeValue} ${t7CropAgeUnit || "วัน"}`
            : null,
          t7GrowthStage ? `ระยะการเจริญเติบโต: ${t7GrowthStage}` : null,
          t7CropCondition ? `สภาพแปลง: ${t7CropCondition}` : null,
          t7CropProblemDescription
            ? `ปัญหาของสภาพพืช: ${t7CropProblemDescription}`
            : null,
          t7ProductResponse
            ? `ผลการใช้ผลิตภัณฑ์: ${t7ProductResponse}`
            : null,
          t7ProblemDescription
            ? `รายละเอียดปัญหาการใช้ผลิตภัณฑ์: ${t7ProblemDescription}`
            : null,
          t7PlotStatus ? `สถานะแปลง: ${t7PlotStatus}` : null,
          t7NextFollowUpDate
            ? `กำหนดการติดตามครั้งถัดไป: ${t7NextFollowUpDate}`
            : null,
          t7FinalYieldKg
            ? `ผลผลิตแปลงสาธิต: ${t7FinalYieldKg} กก./ไร่`
            : null,
          t7ControlYieldKg
            ? `ผลผลิตแปลงควบคุม: ${t7ControlYieldKg} กก./ไร่`
            : null,
          t7YieldIncreasePercent
            ? `% ผลผลิตเพิ่มขึ้น: ${t7YieldIncreasePercent}%`
            : null,
          t7FarmerSatisfaction
            ? `ความพึงพอใจเกษตรกร: ${t7FarmerSatisfaction}/5`
            : null,
          t7CommercialPotential
            ? `โอกาสสั่งซื้อจริง: ${t7CommercialPotential}`
            : null,
          t7FinalSummaryNotes
            ? `สรุปผลสัมฤทธิ์แปลง: ${t7FinalSummaryNotes}`
            : null,

          // Type 8
          t8ActualAttendees
            ? `จำนวนผู้เข้าร่วมประชุมจริง: ${t8ActualAttendees}`
            : null,
          t8FeedbackQnA ? `Q&A: ${t8FeedbackQnA}` : null,
          t8ProductSalesDetails &&
          t8ProductSalesDetails.length > 0 &&
          t8ProductSalesDetails.some((d) => d.actualQty || d.actualSales)
            ? `ยอดขายแยกสินค้าประชุม: ${JSON.stringify(t8ProductSalesDetails)}`
            : null,

          // Type 9
          t9ActualSales ? `ยอดขายหน้าร้านจริง: ${t9ActualSales}` : null,
          t9ActualAttendees
            ? `จำนวนผู้เข้าร่วมกิจกรรมหน้าร้าน: ${t9ActualAttendees}`
            : null,

          // Type 10
          t10ActualAttendees
            ? `จำนวนผู้เข้าร่วม Field Day จริง: ${t10ActualAttendees}`
            : null,
          t10FarmerFeedback ? `ความสนใจเกษตรกร: ${t10FarmerFeedback}` : null,
          t10TargetFarmersList
            ? `รายชื่อเกษตรกรเป้าหมาย: ${t10TargetFarmersList}`
            : null,

          // Type 11
          t11Remarks ? `ข้อสังเกตสต็อก: ${t11Remarks}` : null,
          t11StockStatus ? `สถานะสต็อก: ${t11StockStatus}` : null,
          t11ReorderOpportunity
            ? `โอกาสสั่งซื้อซ้ำ: ${t11ReorderOpportunity}`
            : null,
          t11NextAction ? `แผนการติดตามสต็อก: ${t11NextAction}` : null,
        ].filter(Boolean);

        const t2HasProblem =
          t2UsageResult === "พบปัญหา" ||
          (typeof t2UsageResult === "string" &&
            t2UsageResult.includes("พบปัญหา"));

        const payload = {
          actualStartDate: new Date(),
          actualEndDate: new Date(),
          actualAttendeesCount: Number(
            t8ActualAttendees || t9ActualAttendees || t10ActualAttendees || 0,
          ),
          resultStatus: activityResultStatus,
          resultSummary:
            summaryParts.length > 0
              ? summaryParts.join("\n")
              : `สถานะผลกิจกรรม: ${statusLabel}`,
          problemFound:
            (t2HasProblem ? t2ProblemDetail : null) ||
            t6ProblemDetail ||
            t7ProblemDescription ||
            t7CropProblemDescription ||
            null,
          nextAction: t1NextAction || t11NextAction || null,
          cancelReason:
            activityResultStatus === "CANCELLED" ? cancelReason : null,
          postponedDate:
            activityResultStatus === "POSTPONED" && postponedDate
              ? new Date(postponedDate)
              : null,
          postponedTime:
            activityResultStatus === "POSTPONED" ? postponedTime || null : null,
          postponedReason:
            activityResultStatus === "POSTPONED"
              ? postponedReason || null
              : null,
          postponedNotes:
            activityResultStatus === "POSTPONED"
              ? postponedNotes || null
              : null,
          actualSalesPromotionSpent: Number(
            planSummary.salesPromotionBudget || 0,
          ),
          actualMarketingSpent: Number(planSummary.marketingBudget || 0),
          salesResultAmount: Number(t3ActualSales || t9ActualSales || 0),
          collectResultAmount: Number(t4ReceivedAmount || 0),
          demoPlotsCreated: t7PlotName ? 1 : 0,
        };

        const res = await recordActivityResultAction(id, payload);
        if (!res.success) {
          setFormError(res.error || "เกิดข้อผิดพลาดในการบันทึกผลกิจกรรม");
          setIsSubmitting(false);
          return;
        }

        if (
          isTypeVisible("ติดตามแปลงสาธิต / ทำแปลง") &&
          (t7DemoPlotId || targets.t7.owner || targets.t7.product)
        ) {
          const qty =
            targets.t7.demoProductQuantity != null &&
            targets.t7.demoProductQuantity !== ""
              ? Number(targets.t7.demoProductQuantity)
              : 0;
          await recordDemoPlotVisitAction({
            demoPlotId: t7DemoPlotId || targets.t7.owner || "plot-default",
            activityPlanId: id,
            visitDate: new Date(),
            cropAgeValue: t7CropAgeValue ? Number(t7CropAgeValue) : null,
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
            productUnitPrice: t7ProductPrice || 500,
            cropImageUrls: t7CropImages.map((img) => img.url),
            plotImageUrls: t7PlotImages.map((img) => img.url),
            imageUrls: t7PlotImages.map((img) => img.url),
            plotStatus: t7PlotStatus,
            finalYieldKg: t7FinalYieldKg ? Number(t7FinalYieldKg) : null,
            controlYieldKg: t7ControlYieldKg ? Number(t7ControlYieldKg) : null,
            yieldIncreasePercent: t7YieldIncreasePercent
              ? Number(t7YieldIncreasePercent)
              : null,
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
      setFormError(err.message || "เกิดข้อผิดพลาดในการบันทึกผลกิจกรรม");
      setIsSubmitting(false);
    }
  };

  const isTypeVisible = (typeTitle: string) => {
    if (planWorkTypes.length > 0) {
      return planWorkTypes.includes(typeTitle);
    }
    return true;
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
    <section className="space-y-4 md:space-y-6 container mx-auto px-0 sm:px-0">
      <Card>
        <div className="p-3 sm:p-4 md:p-6">
          <div className="text-center">
            <h5 className="font-semibold text-lg sm:text-2xl md:text-3xl border-b pb-4 md:pb-6 leading-snug">
              <span className="hidden sm:inline">
                บันทึกผลการปฏิบัติงาน ( Trip Plan Actual )
              </span>
              <span className="inline sm:hidden">
                บันทึกผลการปฏิบัติงาน
                <br />( Trip Plan Actual )
              </span>
            </h5>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 md:space-y-6 pt-4 md:pt-6"
            noValidate
          >
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

            {/* SECTION 1: ข้อมูลสรุปแผนงาน */}
            <SectionHeader title="ข้อมูลสรุปแผนงาน" color="gray" />

            {/* PLAN SUMMARY CARD */}
            <ActualPlanSummary summary={planSummary} />

            {/* SECTION 2: ผลการปฏิบัติงานตามประเภทงาน */}
            <SectionHeader title="ผลการปฏิบัติงานตามประเภทงาน" color="gray" />

            <div className="space-y-4 md:space-y-6">
              {/* WORK TYPE 1 */}
              <ActualType1Visit
                isVisible={isTypeVisible("เข้าพบร้านค้า / Key Farmer")}
                target={targets.t1}
                productAdvice={t1ProductAdvice}
                setProductAdvice={setT1ProductAdvice}
                detail={t1Detail}
                setDetail={setT1Detail}
                discussionResult={t1DiscussionResult}
                setDiscussionResult={setT1DiscussionResult}
                salesOpportunity={t1SalesOpportunity}
                setSalesOpportunity={setT1SalesOpportunity}
                nextAction={t1NextAction}
                setNextAction={setT1NextAction}
                nextMeetingDate={t1NextMeetingDate}
                setNextMeetingDate={setT1NextMeetingDate}
                products={products}
              />

              {/* WORK TYPE 2 */}
              <ActualType2Followup
                isVisible={isTypeVisible("ติดตามผลการใช้สินค้า")}
                target={targets.t2}
                customerName={t2CustomerName}
                setCustomerName={setT2CustomerName}
                followupDetail={t2FollowupDetail}
                setFollowupDetail={setT2FollowupDetail}
                detail={t2Detail}
                setDetail={setT2Detail}
                usageResult={t2UsageResult}
                setUsageResult={setT2UsageResult}
                problemDetail={t2ProblemDetail}
                setProblemDetail={setT2ProblemDetail}
              />

              {/* WORK TYPE 3 */}
              <ActualType3Sales
                isVisible={isTypeVisible("เสนอขายสินค้า")}
                target={targets.t3}
                soldProducts={t3SoldProducts}
                setSoldProducts={setT3SoldProducts}
                actualSales={t3ActualSales}
                setActualSales={setT3ActualSales}
                actualQuantity={t3ActualQuantity}
                setActualQuantity={setT3ActualQuantity}
                unclosedReason={t3UnclosedReason}
                setUnclosedReason={setT3UnclosedReason}
              />

              {/* WORK TYPE 4 */}
              <ActualType4Collect
                isVisible={isTypeVisible("วางบิล / เก็บเงิน")}
                target={targets.t4}
                orderNo={t4OrderNo}
                setOrderNo={setT4OrderNo}
                receivedAmount={t4ReceivedAmount}
                setReceivedAmount={setT4ReceivedAmount}
                paymentImages={t4PaymentImages}
                onUploadImages={createUploadHandler(setT4PaymentImages)}
                onRemoveImage={(id) => removeImage(setT4PaymentImages, id)}
              />

              {/* WORK TYPE 5 */}
              <ActualType5Survey
                isVisible={isTypeVisible("สำรวจตลาดของคู่แข่ง")}
                target={targets.t5}
                competitorBrand={t5CompetitorBrand}
                setCompetitorBrand={setT5CompetitorBrand}
                competitorProduct={t5CompetitorProduct}
                setCompetitorProduct={setT5CompetitorProduct}
                competitorPrice={t5CompetitorPrice}
                setCompetitorPrice={setT5CompetitorPrice}
                competitorUnit={t5CompetitorUnit}
                setCompetitorUnit={setT5CompetitorUnit}
                promotionDetail={t5PromotionDetail}
                setPromotionDetail={setT5PromotionDetail}
                priceTagImages={t5PriceTagImages}
                onUploadImages={createUploadHandler(setT5PriceTagImages)}
                onRemoveImage={(id) => removeImage(setT5PriceTagImages, id)}
              />

              {/* WORK TYPE 6 */}
              <ActualType6Issue
                isVisible={isTypeVisible("แก้ปัญหา / รับเรื่องร้องเรียน")}
                target={targets.t6}
                problemDetail={t6ProblemDetail}
                setProblemDetail={setT6ProblemDetail}
                initialSolution={t6InitialSolution}
                setInitialSolution={setT6InitialSolution}
                status={t6Status}
                setStatus={setT6Status}
                images={t6Images}
                onUploadImages={createUploadHandler(setT6Images)}
                onRemoveImage={(id) => removeImage(setT6Images, id)}
              />

              {/* WORK TYPE 7 */}
              <ActualType7Demo
                isVisible={isTypeVisible("ติดตามแปลงสาธิต / ทำแปลง")}
                target={targets.t7}
                startDate={t7StartDate}
                actualDate={new Date().toISOString().split("T")[0]}
                productPrice={t7ProductPrice}
                plotName={t7PlotName}
                setPlotName={setT7PlotName}
                usageMethod={t7UsageMethod}
                setUsageMethod={setT7UsageMethod}
                plantingDate={t7PlantingDate}
                setPlantingDate={setT7PlantingDate}
                plantingAreaCondition={t7PlantingAreaCondition}
                setPlantingAreaCondition={setT7PlantingAreaCondition}
                cropImages={t7CropImages}
                onUploadCropImages={createUploadHandler(setT7CropImages)}
                onRemoveCropImage={(id) => removeImage(setT7CropImages, id)}
                cropAgeValue={t7CropAgeValue}
                setCropAgeValue={setT7CropAgeValue}
                cropAgeUnit={t7CropAgeUnit}
                setCropAgeUnit={setT7CropAgeUnit}
                growthStage={t7GrowthStage}
                setGrowthStage={setT7GrowthStage}
                cropCondition={t7CropCondition}
                setCropCondition={setT7CropCondition}
                cropProblemDescription={t7CropProblemDescription}
                setCropProblemDescription={setT7CropProblemDescription}
                productResponse={t7ProductResponse}
                setProductResponse={setT7ProductResponse}
                problemDescription={t7ProblemDescription}
                setProblemDescription={setT7ProblemDescription}
                plotImages={t7PlotImages}
                onUploadImages={createUploadHandler(setT7PlotImages)}
                onRemoveImage={(id) => removeImage(setT7PlotImages, id)}
                plotStatus={t7PlotStatus}
                setPlotStatus={setT7PlotStatus}
                nextFollowUpDate={t7NextFollowUpDate}
                setNextFollowUpDate={setT7NextFollowUpDate}
                finalYieldKg={t7FinalYieldKg}
                setFinalYieldKg={setT7FinalYieldKg}
                controlYieldKg={t7ControlYieldKg}
                setControlYieldKg={setT7ControlYieldKg}
                yieldIncreasePercent={t7YieldIncreasePercent}
                setYieldIncreasePercent={setT7YieldIncreasePercent}
                farmerSatisfaction={t7FarmerSatisfaction}
                setFarmerSatisfaction={setT7FarmerSatisfaction}
                commercialPotential={t7CommercialPotential}
                setCommercialPotential={setT7CommercialPotential}
                finalSummaryNotes={t7FinalSummaryNotes}
                setFinalSummaryNotes={setT7FinalSummaryNotes}
                visitHistory={t7VisitHistory}
                demoPlotData={t7DemoPlotData}
              />

              {/* WORK TYPE 8 */}
              <ActualType8Meeting
                isVisible={isTypeVisible(
                  "จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์",
                )}
                target={targets.t8}
                actualAttendees={t8ActualAttendees}
                setActualAttendees={setT8ActualAttendees}
                feedbackQnA={t8FeedbackQnA}
                setFeedbackQnA={setT8FeedbackQnA}
                productSalesDetails={t8ProductSalesDetails}
                setProductSalesDetails={setT8ProductSalesDetails}
                images={t8Images}
                onUploadImages={createUploadHandler(setT8Images)}
                onRemoveImage={(id) => removeImage(setT8Images, id)}
              />

              {/* WORK TYPE 9 */}
              <ActualType9Store
                isVisible={isTypeVisible("จัดกิจกรรมส่งเสริมการขายหน้าร้าน")}
                target={targets.t9}
                formats={t9Formats}
                setFormats={setT9Formats}
                actualSales={t9ActualSales}
                setActualSales={setT9ActualSales}
                actualAttendees={t9ActualAttendees}
                setActualAttendees={setT9ActualAttendees}
                images={t9Images}
                onUploadImages={createUploadHandler(setT9Images)}
                onRemoveImage={(id) => removeImage(setT9Images, id)}
              />

              {/* WORK TYPE 10 */}
              <ActualType10FieldDay
                isVisible={isTypeVisible("จัดงาน Field Day")}
                target={targets.t10}
                actualAttendees={t10ActualAttendees}
                setActualAttendees={setT10ActualAttendees}
                actualSalesOrBooking={t10ActualSalesOrBooking}
                setActualSalesOrBooking={setT10ActualSalesOrBooking}
                targetFarmersList={t10TargetFarmersList}
                setTargetFarmersList={setT10TargetFarmersList}
                farmerFeedback={t10FarmerFeedback}
                setFarmerFeedback={setT10FarmerFeedback}
                images={t10Images}
                onUploadImages={createUploadHandler(setT10Images)}
                onRemoveImage={(id) => removeImage(setT10Images, id)}
              />

              {/* WORK TYPE 11 */}
              <ActualType11Stock
                isVisible={isTypeVisible("ตรวจเช็กสต็อกหน้าร้าน")}
                target={targets.t11}
                stockItems={t11StockItems}
                setStockItems={setT11StockItems}
                productList={t11ProductList}
                setProductList={setT11ProductList}
                remainingQty={t11RemainingQty}
                setRemainingQty={setT11RemainingQty}
                remarks={t11Remarks}
                setRemarks={setT11Remarks}
                stockStatus={t11StockStatus}
                setStockStatus={setT11StockStatus}
                reorderOpportunity={t11ReorderOpportunity}
                setReorderOpportunity={setT11ReorderOpportunity}
                nextAction={t11NextAction}
                setNextAction={setT11NextAction}
              />
            </div>

            {/* SECTION 3: สถานะผลการทำกิจกรรม */}
            <SectionHeader title="สถานะผลการทำกิจกรรม" color="gray" />

            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                    เลือกผลการทำกิจกรรม <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-xs text-slate-400 font-medium">
                    (กำหนดสถานะการดำเนินงานของกิจกรรมนี้)
                  </span>
                </div>

                {/* Status Radio / Selectable Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    {
                      id: "PARTIAL" as const,
                      label: "สำเร็จบางส่วน (ค่าเริ่มต้น)",
                      icon: "⏳",
                      activeClass:
                        "bg-amber-50/90 border-amber-500 text-amber-950 ring-2 ring-amber-500/20 shadow-xs",
                    },
                    {
                      id: "COMPLETED" as const,
                      label: "สำเร็จ",
                      icon: "✅",
                      activeClass:
                        "bg-emerald-50/90 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs",
                    },
                    {
                      id: "POSTPONED" as const,
                      label: "เลื่อน",
                      icon: "🗓️",
                      activeClass:
                        "bg-sky-50/90 border-sky-500 text-sky-950 ring-2 ring-sky-500/20 shadow-xs",
                    },
                    {
                      id: "CANCELLED" as const,
                      label: "ยกเลิก",
                      icon: "❌",
                      activeClass:
                        "bg-rose-50/90 border-rose-500 text-rose-950 ring-2 ring-rose-500/20 shadow-xs",
                    },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setActivityResultStatus(st.id)}
                      className={cn(
                        "py-3 px-3 rounded-xl border text-xs sm:text-sm font-semibold cursor-pointer transition-all flex items-center justify-center gap-2",
                        activityResultStatus === st.id
                          ? st.activeClass
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300",
                      )}
                    >
                      <span className="text-base">{st.icon}</span>
                      <span>{st.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* กรณีเลือก ยกเลิก (CANCELLED) */}
              {activityResultStatus === "CANCELLED" && (
                <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 sm:p-4 space-y-2 animate-in fade-in-50">
                  <label className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                    <span>⚠️</span> สาเหตุที่ยกเลิก{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <Textarea
                    rows={2}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="ระบุสาเหตุที่ต้องยกเลิกกิจกรรม..."
                    className="bg-white border-rose-200 text-xs sm:text-sm"
                  />
                </div>
              )}

              {/* กรณีเลือก เลื่อน (POSTPONED) */}
              {activityResultStatus === "POSTPONED" && (
                <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3.5 sm:p-4 space-y-3.5 animate-in fade-in-50">
                  <div>
                    <DateTimePicker
                      label="วันที่ใหม่"
                      required
                      dateValue={postponedDate}
                      timeValue={postponedTime || "10:00"}
                      onDateChange={setPostponedDate}
                      onTimeChange={setPostponedTime}
                      accentColor="blue"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-sky-900 flex items-center gap-1">
                      <span>📌</span> เหตุผลที่เลื่อน{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        "ลูกค้าขอเลื่อน",
                        "ผู้ปฏิบัติงานขอเลื่อน",
                        "ลูกค้าไม่สะดวก",
                        "สภาพอากาศ",
                        "เหตุสุดวิสัย",
                        "อื่น ๆ",
                      ].map((reason) => (
                        <button
                          key={reason}
                          type="button"
                          onClick={() => setPostponedReason(reason)}
                          className={cn(
                            "py-2 px-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-all text-left flex items-center justify-between",
                            postponedReason === reason
                              ? "bg-sky-600 text-white border-sky-600 shadow-2xs font-semibold"
                              : "bg-white border-sky-200/80 text-sky-950 hover:bg-sky-100/60",
                          )}
                        >
                          <span>{reason}</span>
                          {postponedReason === reason && (
                            <Check className="w-3.5 h-3.5 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-sky-900 flex items-center gap-1">
                      <span>📝</span> ช่องกรอกหมายเหตุ
                    </label>
                    <Textarea
                      rows={2}
                      value={postponedNotes}
                      onChange={(e) => setPostponedNotes(e.target.value)}
                      placeholder="ระบุหมายเหตุเพิ่มเติมกรณีเลื่อนกิจกรรม (ถ้ามี)..."
                      className="bg-white border-sky-200 text-xs sm:text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Action Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4 border-t border-slate-100">
              <Button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="w-full sm:w-32 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-xl h-11 shadow-sm flex items-center justify-center gap-1.5"
              >
                <X className="h-4 w-4" />
                <span>ยกเลิก</span>
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-32 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl h-11 shadow-md flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 stroke-[3]" />
                )}
                <span>{isSubmitting ? "กำลังบันทึก..." : "บันทึก"}</span>
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </section>
  );
}
