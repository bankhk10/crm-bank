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
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/modules/sales/features/form/forms/section-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  getActivityPlanAction,
  getActivityPlansAction,
  saveActivityPlanActualAction,
} from "../../server/actions";
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

/**
 * Helper to determine which work types are present in a given activity plan (1-to-1 matching)
 */
function getPlanWorkTypes(p: any): string[] {
  if (!p) return WORK_TYPES;

  const rawTypes: string[] = p.activityType
    ? p.activityType.split(",").map((s: string) => s.trim())
    : [];
  const details = (p.details as Record<string, any>) || {};

  const detected = WORK_TYPES.filter((typeName) => {
    const shortName = typeName.split(" / ")[0];
    const isInActivityType = rawTypes.some(
      (t) => t.includes(shortName) || typeName.includes(t) || t === typeName,
    );

    const hasItemsInDetails =
      (typeName.includes("เข้าพบ") && details.type1Items?.length > 0) ||
      (typeName.includes("ติดตามผล") && details.type2Items?.length > 0) ||
      (typeName.includes("เสนอขาย") && details.type3Items?.length > 0) ||
      (typeName.includes("วางบิล") && details.type4Items?.length > 0) ||
      (typeName.includes("สำรวจตลาด") && details.type5Items?.length > 0) ||
      (typeName.includes("แก้ปัญหา") && details.type6Items?.length > 0) ||
      (typeName.includes("ติดตามแปลงสาธิต") &&
        details.type7Items?.length > 0) ||
      (typeName.includes("จัดประชุม") && details.type8Items?.length > 0) ||
      (typeName.includes("ส่งเสริมการขายหน้าร้าน") &&
        Boolean(details.type9Store)) ||
      (typeName.includes("Field Day") && Boolean(details.type10DemoPlot)) ||
      (typeName.includes("ตรวจเช็กสต็อก") && details.type11Stores?.length > 0);

    return isInActivityType || hasItemsInDetails;
  });

  return detected.length > 0 ? detected : WORK_TYPES;
}

export default function ActivityPlanActualView({
  id,
  onSuccess,
  onCancel,
}: ActivityPlanActualViewProps) {
  const router = useRouter();

  // Selected Plan State
  const [selectedPlanId, setSelectedPlanId] = useState<string>(id || "");
  const [plansList, setPlansList] = useState<
    Array<{ id: string; title: string; code: string | null; startDate: any }>
  >([]);

  // Available Work Types for the selected plan (strict 1-to-1 matching)
  const [availableWorkTypes, setAvailableWorkTypes] =
    useState<string[]>(WORK_TYPES);

  // Loading & Plan Summary State
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [planSummary, setPlanSummary] = useState<PlanSummaryData>({
    planNo: "---",
    title: "กำลังโหลดข้อมูลแผนกิจกรรม...",
    startDateStr: "---",
    endDateStr: "---",
    startTimeStr: "00:00",
    endTimeStr: "00:00",
    timeStr: "---",
    locationStr: "---",
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
    helperEmployeeNames: [],
  });

  // Active Work Type Selection Mode: "ALL" or specific type name
  const [activeTypeTab, setActiveTypeTab] = useState<string>("ALL");

  // Default targets schema fallback
  const [targets, setTargets] = useState({
    t1: {
      customer: DEMO_OWNERS[0],
      topic: "แจ้งข่าวสาร",
      detail: "เข้าพบเจ้าของร้านเพื่อแนะนำข้อมูลข่าวสารสินค้าประจำฤดูกาล",
      opportunity: "สูง",
      nextDate: "",
    },
    t2: {
      product: `${DEMO_PRODUCTS[0]}, ${DEMO_PRODUCTS[1]}`,
      customer: DEMO_OWNERS[0],
      detail: "ติดตามผลหลังเกษตรกรนำสินค้าไปทดลองใช้งานในพื้นที่",
      expectedResult: "พืชตอบสนองดี",
      items: [
        {
          productName: DEMO_PRODUCTS[0],
          customer: DEMO_OWNERS[0],
          expectedResult: "พืชตอบสนองดี",
        },
      ],
    },
    t3: {
      product: `${DEMO_PRODUCTS[0]}, ${DEMO_PRODUCTS[1]}`,
      customer: DEMO_OWNERS[0],
      targetQty: "30 ลัง",
      targetSales: "17,500 บาท",
      items: [
        { productName: DEMO_PRODUCTS[0], qty: "20 ลัง", price: "10,000 บาท" },
      ],
    },
    t4: {
      customer: DEMO_OWNERS[0],
      orderNo: "INV-2026-0789",
      targetCollect: "25,500 บาท",
      items: [
        {
          companyName: DEMO_OWNERS[0],
          targetCollect: "15,500 บาท",
          receivedAmount: "15500",
        },
      ],
    },
    t5: {
      store: STORES_LIST[0],
      product: DEMO_PRODUCTS[0],
      detail: "สำรวจเปรียบเทียบราคา ป้ายราคา และโปรโมชันสินค้าคู่แข่งในพื้นที่",
    },
    t6: {
      customer: DEMO_OWNERS[0],
      issueType: "เคลมของ",
      detail:
        "รับเรื่องร้องเรียนเรื่องสินค้าจากลูกค้าเพื่อประสานงานเปลี่ยน/เคลมสินค้า",
      targetStatus: "เสร็จสิ้น",
    },
    t7: {
      owner: DEMO_OWNERS[0],
      product: DEMO_PRODUCTS[0],
      crop: "ทุเรียน",
      plots: "20 ต้น",
      targetCondition: "สมบูรณ์",
    },
    t8: {
      topic: "ประชุมสัมมนาเทคนิคการใช้ปุ๋ยบำรุงพืชสวน",
      products: `${DEMO_PRODUCTS[0]}, ${DEMO_PRODUCTS[1]}`,
      targetAttendees: "10 คน",
    },
    t9: {
      store: STORES_LIST[0],
      product: DEMO_PRODUCTS[0],
      targetSales: "10,000 บาท",
      targetAttendees: "28 คน",
    },
    t10: {
      plot: `${USER_DEMO_PLOTS[0].name}`,
      location: USER_DEMO_PLOTS[0].location,
      showcase: `${USER_DEMO_PLOTS[0].targetCrop} / ${USER_DEMO_PLOTS[0].showcase}`,
      targetAttendees: "100 คน",
      targetSales: "150,000 บาท",
    },
    t11: {
      store: STORES_LIST[0],
      detail: `ตรวจเช็กสต็อกสินค้าเตรียมสั่งซื้อเติมหน้าร้าน`,
      targetOpportunity: "สูง",
    },
  });

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

  // 1. Fetch available plans for dropdown if id is not passed or to switch plans
  useEffect(() => {
    async function fetchPlansList() {
      try {
        const res = await getActivityPlansAction({ perPage: 50 });
        if (res.success && res.activityPlans) {
          const formatted = res.activityPlans.map((p: any) => ({
            id: p.id,
            title: p.title,
            code: p.code,
            startDate: p.startDate,
          }));
          setPlansList(formatted);
          if (!id && formatted.length > 0 && !selectedPlanId) {
            setSelectedPlanId(formatted[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch activity plans list", err);
      }
    }
    fetchPlansList();
  }, [id]);

  // 2. Load plan details when selectedPlanId changes
  useEffect(() => {
    if (!selectedPlanId) {
      setLoadingPlan(false);
      return;
    }

    async function loadPlanData() {
      try {
        setLoadingPlan(true);
        const res = await getActivityPlanAction(selectedPlanId);
        if (res.success && res.plan) {
          const p = res.plan;
          const start = p.startDate ? new Date(p.startDate) : new Date();
          const end = p.endDate ? new Date(p.endDate) : new Date();
          const details = (p.details as Record<string, any>) || {};

          // Extract helper names
          const helperEmployeeNames =
            p.helpers
              ?.map((h: any) => h.employee?.name || "")
              .filter((name: string) => name.length > 0) || [];

          // Compute Plan Summary
          setPlanSummary({
            planNo: p.code || `PLAN-${p.id.slice(-6).toUpperCase()}`,
            title: p.title || "แผนกิจกรรม",
            startDateStr: format(start, "d MMM yyyy", { locale: th }),
            endDateStr: format(end, "d MMM yyyy", { locale: th }),
            startTimeStr: format(start, "HH:mm"),
            endTimeStr: format(end, "HH:mm"),
            timeStr: `${format(start, "HH:mm")} - ${format(end, "HH:mm")} น.`,
            locationStr: p.location || "ไม่ระบุสถานที่",
            marketingBudget: p.marketingBudget
              ? Number(p.marketingBudget)
              : details.marketingBudgetAmount
                ? Number(details.marketingBudgetAmount)
                : undefined,
            salesPromotionBudget: p.salesPromotionBudget
              ? Number(p.salesPromotionBudget)
              : undefined,
            extraExpenseAmount: details.extraExpenseAmount
              ? Number(details.extraExpenseAmount)
              : undefined,
            extraExpenseDetail: details.extraExpenseDetail || "",
            targetSales:
              details.type3Items?.reduce(
                (acc: number, item: any) =>
                  acc + (Number(item.totalPrice) || 0),
                0,
              ) ||
              (details.type9Sales ? Number(details.type9Sales) : undefined) ||
              (details.type10BookingSales
                ? Number(details.type10BookingSales)
                : undefined),
            isPromotionalMediaSelected:
              details.isPromotionalMediaSelected ?? false,
            marketingProductItems: details.marketingProductItems || [],
            isSalesPromotionSelected: details.isSalesPromotionSelected ?? false,
            salesPromotionItems: details.salesPromotionItems || [],
            requisitionItems: details.requisitionItems || [],
            objective: p.objective || undefined,
            notes: p.notes || undefined,
            helperEmployeeNames,
          });

          // Extract 1-to-1 work types for this plan
          const planTypes = getPlanWorkTypes(p);
          setAvailableWorkTypes(planTypes);
          setActiveTypeTab("ALL");

          // Populate targets dynamically from DB details
          setTargets({
            t1: {
              customer:
                details.type1Items?.[0]?.customerName ||
                p.location ||
                DEMO_OWNERS[0],
              topic: details.type1Items?.[0]?.discussionTopic || p.title,
              detail: details.type1Items?.[0]?.note || p.description,
              opportunity: details.type1Items?.[0]?.salesOpportunity || "สูง",
              nextDate: details.type1Items?.[0]?.nextDate || "",
            },
            t2: {
              product:
                details.type2Items
                  ?.map((i: any) => i.productName)
                  .filter(Boolean)
                  .join(", ") || DEMO_PRODUCTS[0],
              customer: details.type2Items?.[0]?.customerName || DEMO_OWNERS[0],
              detail:
                details.type2Items?.[0]?.note ||
                "ติดตามผลหลังนำสินค้าไปทดลองใช้งาน",
              expectedResult:
                details.type2Items?.[0]?.expectedResult || "พืชตอบสนองดี",
              items: details.type2Items || [
                {
                  productName: DEMO_PRODUCTS[0],
                  customer: DEMO_OWNERS[0],
                  expectedResult: "พืชตอบสนองดี",
                },
              ],
            },
            t3: {
              product:
                details.type3Items
                  ?.map((i: any) => i.productName)
                  .filter(Boolean)
                  .join(", ") || DEMO_PRODUCTS[0],
              customer: p.location || DEMO_OWNERS[0],
              targetQty:
                details.type3Items
                  ?.map((i: any) => `${i.productName}: ${i.quantityCases} ลัง`)
                  .join(", ") || "30 ลัง",
              targetSales: details.type3Items?.reduce(
                (acc: number, i: any) => acc + (Number(i.totalPrice) || 0),
                0,
              )
                ? `${details.type3Items
                    .reduce(
                      (acc: number, i: any) =>
                        acc + (Number(i.totalPrice) || 0),
                      0,
                    )
                    .toLocaleString()} บาท`
                : "17,500 บาท",
              items:
                details.type3Items?.map((i: any) => ({
                  productName: i.productName,
                  qty: `${i.quantityCases} ลัง`,
                  price: `${Number(i.totalPrice || 0).toLocaleString()} บาท`,
                })) || [],
            },
            t4: {
              customer:
                details.type4Items
                  ?.map((i: any) => i.companyName)
                  .filter(Boolean)
                  .join(", ") || DEMO_OWNERS[0],
              orderNo: details.type4Items?.[0]?.invoiceNo || "INV-2026-0789",
              targetCollect: details.type4Items?.reduce(
                (acc: number, i: any) =>
                  acc + (Number(i.expectedCollectionAmount) || 0),
                0,
              )
                ? `${details.type4Items
                    .reduce(
                      (acc: number, i: any) =>
                        acc + (Number(i.expectedCollectionAmount) || 0),
                      0,
                    )
                    .toLocaleString()} บาท`
                : "25,500 บาท",
              items:
                details.type4Items?.map((i: any) => ({
                  companyName: i.companyName,
                  targetCollect: `${Number(
                    i.expectedCollectionAmount || 0,
                  ).toLocaleString()} บาท`,
                  receivedAmount: String(i.expectedCollectionAmount || ""),
                })) || [],
            },
            t5: {
              store: details.type5Items?.[0]?.storeName || STORES_LIST[0],
              product:
                details.type5Items?.[0]?.competitorProduct || DEMO_PRODUCTS[0],
              detail:
                details.type5Items?.[0]?.promotionDetail ||
                "สำรวจเปรียบเทียบราคา ป้ายราคา และโปรโมชันสินค้าคู่แข่ง",
            },
            t6: {
              customer: details.type6Items?.[0]?.customerName || DEMO_OWNERS[0],
              issueType: details.type6Items?.[0]?.issueType || "เคลมของ",
              detail:
                details.type6Items?.[0]?.issueDescription ||
                "รับเรื่องร้องเรียนเรื่องสินค้าจากลูกค้า",
              targetStatus:
                details.type6Items?.[0]?.expectedSolution || "เสร็จสิ้น",
            },
            t7: {
              owner: details.type7Items?.[0]?.ownerName || DEMO_OWNERS[0],
              product: details.type7Items?.[0]?.productName || DEMO_PRODUCTS[0],
              crop: details.type7Items?.[0]?.cropName || "ทุเรียน",
              plots: details.type7Items?.[0]?.areaRai
                ? `${details.type7Items[0].areaRai} ไร่`
                : `${details.type7Items?.[0]?.treeCount || 20} ต้น`,
              targetCondition:
                details.type7Items?.[0]?.targetCondition || "สมบูรณ์",
            },
            t8: {
              topic:
                details.type8Items?.[0]?.topic ||
                p.title ||
                "ประชุมสัมมนาวิชาการ",
              products:
                details.type8Items?.[0]?.productList || DEMO_PRODUCTS[0],
              targetAttendees: details.type8Items?.[0]?.targetAttendees
                ? `${details.type8Items[0].targetAttendees} คน`
                : "10 คน",
            },
            t9: {
              store: details.type9Store || STORES_LIST[0],
              product: details.type9Products || DEMO_PRODUCTS[0],
              targetSales: details.type9Sales
                ? `${Number(details.type9Sales).toLocaleString()} บาท`
                : "10,000 บาท",
              targetAttendees: details.type9Attendees
                ? `${details.type9Attendees} คน`
                : "28 คน",
            },
            t10: {
              plot: details.type10DemoPlot || USER_DEMO_PLOTS[0].name,
              location:
                details.type10Location ||
                p.location ||
                USER_DEMO_PLOTS[0].location,
              showcase: details.type10TargetCrop
                ? `${details.type10TargetCrop} / ${details.type10Showcase || ""}`
                : `${USER_DEMO_PLOTS[0].targetCrop} / ${USER_DEMO_PLOTS[0].showcase}`,
              targetAttendees: details.type10Attendees
                ? `${details.type10Attendees} คน`
                : "100 คน",
              targetSales: details.type10BookingSales
                ? `${Number(details.type10BookingSales).toLocaleString()} บาท`
                : "150,000 บาท",
            },
            t11: {
              store: details.type11Stores?.[0]?.storeName || STORES_LIST[0],
              detail:
                details.type11Stores?.[0]?.remarks || "ตรวจเช็กสต็อกสินค้า",
              targetOpportunity: "สูง",
            },
          });

          // Pre-fill existing actual record if stored in DB
          if (details.actualRecord) {
            const act = details.actualRecord;
            if (act.t1) {
              setT1ProductAdvice(act.t1.productAdvice || "");
              setT1Detail(act.t1.detail || "");
              setT1DiscussionResult(act.t1.discussionResult || "");
              setT1SalesOpportunity(act.t1.salesOpportunity || "");
              setT1NextAction(act.t1.nextAction || "");
              setT1NextMeetingDate(act.t1.nextMeetingDate || "");
            }
            if (act.t2) {
              setT2CustomerName(act.t2.customerName || "");
              setT2Detail(act.t2.detail || "");
              setT2UsageResult(act.t2.usageResult || "");
              setT2ProblemDetail(act.t2.problemDetail || "");
            }
            if (act.t3) {
              setT3SoldProducts(act.t3.soldProducts || "");
              setT3ActualSales(act.t3.actualSales || "");
              setT3ActualQuantity(act.t3.actualQuantity || "");
              setT3UnclosedReason(act.t3.unclosedReason || "");
            }
            if (act.t4) {
              setT4OrderNo(act.t4.orderNo || "");
              setT4ReceivedAmount(act.t4.receivedAmount || "");
              setT4PaymentImages(act.t4.paymentImages || []);
            }
            if (act.t5) {
              setT5CompetitorBrand(act.t5.competitorBrand || "");
              setT5CompetitorProduct(act.t5.competitorProduct || "");
              setT5CompetitorPrice(act.t5.competitorPrice || "");
              setT5CompetitorUnit(act.t5.competitorUnit || "ขวด");
              setT5PromotionDetail(act.t5.promotionDetail || "");
              setT5PriceTagImages(act.t5.priceTagImages || []);
            }
            if (act.t6) {
              setT6ProblemDetail(act.t6.problemDetail || "");
              setT6InitialSolution(act.t6.initialSolution || "");
              setT6Status(act.t6.status || "");
              setT6Images(act.t6.images || []);
            }
            if (act.t7) {
              setT7PlotName(act.t7.plotName || "");
              setT7UsageMethod(act.t7.usageMethod || "");
              setT7CropAgeValue(act.t7.cropAgeValue || "");
              setT7CropAgeUnit(act.t7.cropAgeUnit || "วัน");
              setT7GrowthStage(act.t7.growthStage || "");
              setT7CropCondition(act.t7.cropCondition || "");
              setT7CropProblemDescription(act.t7.cropProblemDescription || "");
              setT7ProductResponse(act.t7.productResponse || "");
              setT7ProblemDescription(act.t7.problemDescription || "");
              setT7PlotImages(act.t7.plotImages || []);
            }
            if (act.t8) {
              setT8ActualAttendees(act.t8.actualAttendees || "");
              setT8FeedbackQnA(act.t8.feedbackQnA || "");
              setT8ProductSalesDetails(act.t8.productSalesDetails || []);
              setT8Images(act.t8.images || []);
            }
            if (act.t9) {
              setT9Formats(act.t9.formats || []);
              setT9ActualSales(act.t9.actualSales || "");
              setT9ActualAttendees(act.t9.actualAttendees || "");
              setT9Images(act.t9.images || []);
            }
            if (act.t10) {
              setT10ActualAttendees(act.t10.actualAttendees || "");
              setT10ActualSalesOrBooking(act.t10.actualSalesOrBooking || "");
              setT10TargetFarmersList(act.t10.targetFarmersList || "");
              setT10FarmerFeedback(act.t10.farmerFeedback || "");
              setT10Images(act.t10.images || []);
            }
            if (act.t11) {
              setT11StockItems(act.t11.stockItems || []);
              setT11ProductList(act.t11.productList || "");
              setT11RemainingQty(act.t11.remainingQty || "");
              setT11Remarks(act.t11.remarks || "");
              setT11StockStatus(act.t11.stockStatus || "");
              setT11ReorderOpportunity(act.t11.reorderOpportunity || "");
              setT11NextAction(act.t11.nextAction || "");
            }
          }
        }
      } catch (e) {
        console.error("Failed to load plan for actual record", e);
      } finally {
        setLoadingPlan(false);
      }
    }
    loadPlanData();
  }, [selectedPlanId]);

  // Pre-fill sample data for testing
  const fillAllSampleData = () => {
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

    setT2CustomerName(
      `${DEMO_OWNERS[0]} / ${DEMO_OWNERS[3] || "ร้านสหายพานิช"}`,
    );
    setT2Detail(
      `ติดตามผลหลังเกษตรกรนำ ${DEMO_PRODUCTS[0]} ไปฉีดพ่นทางใบผ่านไป 10 วัน`,
    );
    setT2UsageResult("พืชตอบสนองดี");
    setT2ProblemDetail("");

    setT3SoldProducts(
      `${DEMO_PRODUCTS[0]} (20 ลัง), ${DEMO_PRODUCTS[1]} (10 ลัง)`,
    );
    setT3ActualSales("17500");
    setT3ActualQuantity("30 ลัง (A: 20 ลัง, B: 10 ลัง)");
    setT3UnclosedReason("ปิดการขายได้สำเร็จตามเป้าหมายทั้ง 2 สินค้า");

    setT4OrderNo("INV-2026-0789");
    setT4ReceivedAmount("25500");

    setT5CompetitorBrand("ตราเกษตรทองคำ, เสือคู่พรีเมียม");
    setT5CompetitorProduct(`เทียบกับ ${DEMO_PRODUCTS[0]} (ปุ๋ยทางใบ 1 ลิตร)`);
    setT5CompetitorPrice("850");
    setT5CompetitorUnit("ขวด");
    setT5PromotionDetail(
      "จัดโปรโมชัน ซื้อ 10 แถม 1 พร้อมแจกเสื้อยืดพนักงานหน้าร้าน",
    );

    setT6ProblemDetail(
      `ลูกค้าร้องเรียนเรื่องสินค้า ${DEMO_PRODUCTS[0]} ตกตะกอนเมื่อผสมน้ำในถัง 200 ลิตร`,
    );
    setT6InitialSolution(
      "แนะนำการผสมน้ำอุ่นกวนให้ละลายก่อนเทลงถังใหญ่ พร้อมเปลี่ยนสินค้าล็อตใหม่ให้ลูกค้าทันที",
    );
    setT6Status("เสร็จสิ้น");

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

    setT9Formats(["การสะสมคะแนน", "กิจกรรมลูกค้าสัมพันธ์"]);
    setT9ActualSales("18500");
    setT9ActualAttendees("28");

    setT10ActualAttendees("120");
    setT10ActualSalesOrBooking("150000");
    setT10TargetFarmersList(
      "นายประเสริฐ (100 ไร่), นายวิชัย (50 ไร่), สวนผู้ใหญ่สมศักดิ์",
    );
    setT10FarmerFeedback("สูง");

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

  // Save Actual performance to Database
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const targetId = selectedPlanId || id;
    if (!targetId) {
      setFormError("กรุณาเลือก Trip Plan ที่ต้องการบันทึกผลการปฏิบัติงาน");
      return;
    }

    const actualData = {
      t1: {
        productAdvice: t1ProductAdvice,
        detail: t1Detail,
        discussionResult: t1DiscussionResult,
        salesOpportunity: t1SalesOpportunity,
        nextAction: t1NextAction,
        nextMeetingDate: t1NextMeetingDate,
      },
      t2: {
        customerName: t2CustomerName,
        detail: t2Detail,
        usageResult: t2UsageResult,
        problemDetail: t2ProblemDetail,
      },
      t3: {
        soldProducts: t3SoldProducts,
        actualSales: t3ActualSales,
        actualQuantity: t3ActualQuantity,
        unclosedReason: t3UnclosedReason,
      },
      t4: {
        orderNo: t4OrderNo,
        receivedAmount: t4ReceivedAmount,
        paymentImages: t4PaymentImages,
      },
      t5: {
        competitorBrand: t5CompetitorBrand,
        competitorProduct: t5CompetitorProduct,
        competitorPrice: t5CompetitorPrice,
        competitorUnit: t5CompetitorUnit,
        promotionDetail: t5PromotionDetail,
        priceTagImages: t5PriceTagImages,
      },
      t6: {
        problemDetail: t6ProblemDetail,
        initialSolution: t6InitialSolution,
        status: t6Status,
        images: t6Images,
      },
      t7: {
        plotName: t7PlotName,
        usageMethod: t7UsageMethod,
        cropAgeValue: t7CropAgeValue,
        cropAgeUnit: t7CropAgeUnit,
        growthStage: t7GrowthStage,
        cropCondition: t7CropCondition,
        cropProblemDescription: t7CropProblemDescription,
        productResponse: t7ProductResponse,
        problemDescription: t7ProblemDescription,
        plotImages: t7PlotImages,
      },
      t8: {
        actualAttendees: t8ActualAttendees,
        feedbackQnA: t8FeedbackQnA,
        productSalesDetails: t8ProductSalesDetails,
        images: t8Images,
      },
      t9: {
        formats: t9Formats,
        actualSales: t9ActualSales,
        actualAttendees: t9ActualAttendees,
        images: t9Images,
      },
      t10: {
        actualAttendees: t10ActualAttendees,
        actualSalesOrBooking: t10ActualSalesOrBooking,
        targetFarmersList: t10TargetFarmersList,
        farmerFeedback: t10FarmerFeedback,
        images: t10Images,
      },
      t11: {
        stockItems: t11StockItems,
        productList: t11ProductList,
        remainingQty: t11RemainingQty,
        remarks: t11Remarks,
        stockStatus: t11StockStatus,
        reorderOpportunity: t11ReorderOpportunity,
        nextAction: t11NextAction,
      },
    };

    setIsSubmitting(true);
    try {
      const res = await saveActivityPlanActualAction(targetId, actualData);
      if (res.success) {
        setSubmitSuccess(true);
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            router.push(`/activity-plans/${targetId}`);
          }
        }, 1200);
      } else {
        setFormError(res.error || "เกิดข้อผิดพลาดในการบันทึกผลการปฏิบัติงาน");
      }
    } catch (err: any) {
      setFormError(err.message || "เกิดข้อผิดพลาดไม่คาดคิดในการบันทึก");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Strictly check visibility against availableWorkTypes (1-to-1 match with created plan)
  const isTypeVisible = (typeTitle: string) => {
    if (!availableWorkTypes.includes(typeTitle)) return false;
    if (activeTypeTab === "ALL") return true;
    return activeTypeTab === typeTitle;
  };

  if (loadingPlan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p>กำลังโหลดข้อมูลแผนกิจกรรมจากระบบ...</p>
      </div>
    );
  }

  return (
    <section className="space-y-4 md:space-y-6 container mx-auto px-0 sm:px-0">
      <Card>
        <div className="p-3 sm:p-4 md:p-6 space-y-4">
          <div className="text-center flex flex-col items-center justify-center gap-2">
            <h5 className="font-semibold text-lg sm:text-2xl md:text-3xl border-b pb-4 md:pb-6 leading-snug w-full">
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
            className="space-y-4 md:space-y-6 pt-2"
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
                <span>บันทึกผลการปฏิบัติงานลงในระบบเรียบร้อยแล้ว!</span>
              </div>
            )}

            {/* SECTION 1: ข้อมูลสรุปแผนงาน */}
            <SectionHeader title="ข้อมูลสรุปแผนงาน" color="gray" />

            {/* PLAN SUMMARY CARD */}
            <ActualPlanSummary summary={planSummary} />

            {/* SECTION 2: ผลการปฏิบัติงานตามประเภทงาน */}
            <SectionHeader title="ผลการปฏิบัติงานตามประเภทงาน" color="gray" />

            {/* WORK TYPE SELECTOR TABS & DROPDOWN (Strict 1-to-1 matching with plan) */}
            <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-3.5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  สลับดูแบบฟอร์มกิจกรรมที่ต้องกรอก ({
                    availableWorkTypes.length
                  }{" "}
                  กิจกรรมตามแผนงาน):
                </span>
                <Select value={activeTypeTab} onValueChange={setActiveTypeTab}>
                  <SelectTrigger className="w-64 h-9 text-xs bg-white border-slate-200">
                    <SelectValue placeholder="เลือกกิจกรรม" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">
                      📋 แสดงทั้งหมด ({availableWorkTypes.length} กิจกรรมตามแผน)
                    </SelectItem>
                    {availableWorkTypes.map((typeName) => {
                      const originalIdx = WORK_TYPES.indexOf(typeName) + 1;
                      return (
                        <SelectItem key={typeName} value={typeName}>
                          {originalIdx}. {typeName}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTypeTab("ALL")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                    activeTypeTab === "ALL"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100",
                  )}
                >
                  📋 ทั้งหมด ({availableWorkTypes.length})
                </button>

                {availableWorkTypes.map((typeName) => {
                  const originalIdx = WORK_TYPES.indexOf(typeName) + 1;
                  return (
                    <button
                      key={typeName}
                      type="button"
                      onClick={() => setActiveTypeTab(typeName)}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1",
                        activeTypeTab === typeName
                          ? "bg-blue-600 text-white shadow-xs font-semibold"
                          : "bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-semibold",
                      )}
                    >
                      <span>
                        {originalIdx}. {typeName.split(" / ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

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
              />

              {/* WORK TYPE 2 */}
              <ActualType2Followup
                isVisible={isTypeVisible("ติดตามผลการใช้สินค้า")}
                target={targets.t2}
                customerName={t2CustomerName}
                setCustomerName={setT2CustomerName}
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
                plotName={t7PlotName}
                setPlotName={setT7PlotName}
                usageMethod={t7UsageMethod}
                setUsageMethod={setT7UsageMethod}
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
