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
import { getActivityPlanAction, recordActivityResultAction } from "../../server/actions";
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
      customer: DEMO_OWNERS[0],
      topic: "แจ้งข่าวสาร",
      detail: "เข้าพบเจ้าของร้านเพื่อแนะนำข้อมูลข่าวสารสินค้าประจำฤดูกาล",
      opportunity: "สูง",
      nextDate: "05 ส.ค. 2568",
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
        {
          productName: DEMO_PRODUCTS[1],
          customer: DEMO_OWNERS[0],
          expectedResult: "พืชตอบสนองดี",
        },
      ],
    },
    t3: {
      product: `${DEMO_PRODUCTS[0]}, ${DEMO_PRODUCTS[1]}`,
      customer: DEMO_OWNERS[0],
      targetQty: "30 ลัง (A: 20 ลัง, B: 10 ลัง)",
      targetSales: "17,500 บาท",
      items: [
        { productName: DEMO_PRODUCTS[0], qty: "20 ลัง", price: "10,000 บาท" },
        { productName: DEMO_PRODUCTS[1], qty: "10 ลัง", price: "7,500 บาท" },
      ],
    },
    t4: {
      customer: `${DEMO_OWNERS[0]}, บริษัท ทรัพย์เกษตร จำกัด`,
      orderNo: "INV-2026-0789",
      targetCollect: "25,500 บาท",
      items: [
        {
          companyName: DEMO_OWNERS[0],
          targetCollect: "15,500 บาท",
          receivedAmount: "15500",
        },
        {
          companyName: "บริษัท ทรัพย์เกษตร จำกัด",
          targetCollect: "10,000 บาท",
          receivedAmount: "10000",
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
      detail: `ตรวจเช็กสต็อก ${DEMO_PRODUCTS[0]} และปุ๋ยเคมีเพื่อเตรียมสั่งซื้อเติมหน้าร้าน`,
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
            notes: p.notes || undefined,
            objective: p.objective || undefined,
          });

          // Match created work type
          let matchedWorkType = "";
          if (p.activityType) {
            if (typeof p.activityType === "object" && p.activityType.name) {
              matchedWorkType = p.activityType.name;
            } else if (typeof p.activityType === "object" && p.activityType.code) {
              const idx = parseInt(p.activityType.code.replace("TYPE_", ""), 10) - 1;
              if (idx >= 0 && idx < WORK_TYPES.length) {
                matchedWorkType = WORK_TYPES[idx];
              }
            }
          }
          if (!matchedWorkType && p.activityTypeId) {
            const idx = parseInt(p.activityTypeId.replace("TYPE_", ""), 10) - 1;
            if (idx >= 0 && idx < WORK_TYPES.length) {
              matchedWorkType = WORK_TYPES[idx];
            }
          }

          if (matchedWorkType) {
            setPlanWorkTypes([matchedWorkType]);
            setActiveTypeTab(matchedWorkType);
          }

          // Populate target cards from real DB items
          if (p.items && p.items.length > 0) {
            const firstItem = p.items[0] as any;
            const allCustomers = Array.from(
              new Set(p.items.map((i: any) => i.customerName).filter(Boolean)),
            ).join(", ");

            setTargets((prev) => ({
              ...prev,
              t1: {
                ...prev.t1,
                customer: allCustomers || firstItem.customerName || p.location || prev.t1.customer,
                topic: firstItem.visitTopic || firstItem.topic || prev.t1.topic,
                detail: firstItem.detail || prev.t1.detail,
              },
              t2: {
                ...prev.t2,
                customer: allCustomers || firstItem.customerName || prev.t2.customer,
                product: firstItem.followupProductName || firstItem.productName || prev.t2.product,
                detail: firstItem.detail || prev.t2.detail,
              },
              t3: {
                ...prev.t3,
                customer: allCustomers || firstItem.customerName || prev.t3.customer,
                product: firstItem.saleProductName || firstItem.productName || prev.t3.product,
                targetSales: firstItem.saleTotalPrice ? `${Number(firstItem.saleTotalPrice).toLocaleString()} บาท` : prev.t3.targetSales,
              },
              t4: {
                ...prev.t4,
                customer: allCustomers || firstItem.customerName || prev.t4.customer,
                targetCollect: firstItem.collectAmount ? `${Number(firstItem.collectAmount).toLocaleString()} บาท` : prev.t4.targetCollect,
              },
              t5: {
                ...prev.t5,
                store: firstItem.surveyStoreName || firstItem.storeName || allCustomers || prev.t5.store,
                product: firstItem.surveyCompetitorProduct || prev.t5.product,
                detail: firstItem.detail || prev.t5.detail,
              },
              t6: {
                ...prev.t6,
                customer: allCustomers || firstItem.customerName || prev.t6.customer,
                issueType: firstItem.issueType || prev.t6.issueType,
                detail: firstItem.detail || prev.t6.detail,
              },
              t7: {
                ...prev.t7,
                owner: firstItem.plotOwnerName || allCustomers || prev.t7.owner,
                product: firstItem.plotProductName || prev.t7.product,
                crop: firstItem.plotCropName || prev.t7.crop,
              },
              t8: {
                ...prev.t8,
                topic: firstItem.meetingTopic || prev.t8.topic,
                products: firstItem.meetingTargetProducts || prev.t8.products,
                targetAttendees: firstItem.meetingAttendeesCount ? `${firstItem.meetingAttendeesCount} คน` : prev.t8.targetAttendees,
              },
              t9: {
                ...prev.t9,
                store: allCustomers || firstItem.customerName || prev.t9.store,
                product: firstItem.storeProductName || prev.t9.product,
              },
              t10: {
                ...prev.t10,
                plot: allCustomers || firstItem.customerName || prev.t10.plot,
              },
              t11: {
                ...prev.t11,
                store: allCustomers || firstItem.customerName || prev.t11.store,
                detail: firstItem.detail || prev.t11.detail,
              },
            }));
          }

          // Restore saved post-activity outcome (p.result) if exists
          if ((p as any).result) {
            const resData = (p as any).result;
            if (resData.resultSummary) {
              const adviceMatch = resData.resultSummary.match(/สินค้าที่แนะนำ:\s*(.+)/);
              if (adviceMatch && adviceMatch[1]) {
                setT1ProductAdvice(adviceMatch[1].split("\n")[0].trim());
              }

              const discussionMatch = resData.resultSummary.match(/ผลการพูดคุย:\s*(.+)/);
              if (discussionMatch && discussionMatch[1]) {
                setT1DiscussionResult(discussionMatch[1].split("\n")[0].trim());
              }

              const detailMatch = resData.resultSummary.match(/รายละเอียดเข้าพบ:\s*(.+)/);
              if (detailMatch && detailMatch[1]) {
                setT1Detail(detailMatch[1].split("\n")[0].trim());
              }
            }

            if (resData.nextAction) {
              setT1NextAction(resData.nextAction);
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
    setT2Detail(
      `ติดตามผลหลังเกษตรกรนำ ${DEMO_PRODUCTS[0]} ไปฉีดพ่นทางใบผ่านไป 10 วัน`,
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
        const summaryParts = [
          t1ProductAdvice ? `สินค้าที่แนะนำ: ${t1ProductAdvice}` : null,
          t1DiscussionResult ? `ผลการพูดคุย: ${t1DiscussionResult}` : null,
          t1Detail ? `รายละเอียดเข้าพบ: ${t1Detail}` : null,
          t2Detail ? `ติดตามผล: ${t2Detail}` : null,
          t3SoldProducts ? `รายการขาย: ${t3SoldProducts}` : null,
          t6ProblemDetail ? `ปัญหา: ${t6ProblemDetail}` : null,
          t7ProblemDescription ? `รายละเอียดแปลง: ${t7ProblemDescription}` : null,
          t8FeedbackQnA ? `Q&A: ${t8FeedbackQnA}` : null,
        ].filter(Boolean);

        const payload = {
          actualStartDate: new Date(),
          actualEndDate: new Date(),
          actualAttendeesCount: Number(t8ActualAttendees || t9ActualAttendees || t10ActualAttendees || 0),
          resultStatus: "COMPLETED",
          resultSummary: summaryParts.length > 0 ? summaryParts.join("\n") : "ทำกิจกรรมสำเร็จตามเป้าหมาย",
          problemFound: t6ProblemDetail || t7CropProblemDescription || null,
          nextAction: t1NextAction || t11NextAction || null,
          actualSalesPromotionSpent: Number(planSummary.salesPromotionBudget || 0),
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
    if (activeTypeTab === "ALL") return true;
    return activeTypeTab === typeTitle;
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

            {/* WORK TYPE SELECTOR TABS & DROPDOWN */}
            <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-3.5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  {planWorkTypes.length > 0
                    ? `ประเภทงานที่เลือกในแผน (${planWorkTypes.length} กิจกรรม):`
                    : "สลับดูแบบฟอร์มตามกิจกรรม (11 รูปแบบ):"}
                </span>
                <Select value={activeTypeTab} onValueChange={setActiveTypeTab}>
                  <SelectTrigger className="w-64 h-9 text-xs bg-white border-slate-200">
                    <SelectValue placeholder="เลือกกิจกรรม" />
                  </SelectTrigger>
                  <SelectContent>
                    {(planWorkTypes.length > 0 ? planWorkTypes : WORK_TYPES).map(
                      (typeName) => {
                        const idx = WORK_TYPES.indexOf(typeName);
                        return (
                          <SelectItem key={typeName} value={typeName}>
                            {idx + 1}. {typeName}
                          </SelectItem>
                        );
                      },
                    )}
                    <SelectItem value="ALL">
                      📋 แสดงแบบฟอร์มทั้งหมด (All 11 Types)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(planWorkTypes.length > 0 ? planWorkTypes : WORK_TYPES).map(
                  (typeName) => {
                    const idx = WORK_TYPES.indexOf(typeName);
                    return (
                      <button
                        key={typeName}
                        type="button"
                        onClick={() => setActiveTypeTab(typeName)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                          activeTypeTab === typeName
                            ? "bg-blue-600 text-white shadow-xs font-semibold"
                            : "bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-100",
                        )}
                      >
                        {idx + 1}. {typeName}
                      </button>
                    );
                  },
                )}

                {planWorkTypes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTypeTab("ALL")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ml-auto",
                      activeTypeTab === "ALL"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100",
                    )}
                  >
                    📋 แสดงทั้งหมด
                  </button>
                )}
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
                products={products}
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
