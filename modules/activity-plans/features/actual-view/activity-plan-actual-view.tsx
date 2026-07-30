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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { getActivityPlanAction } from "../../server/actions";
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
import { ActualType11Stock } from "./components/work-types/actual-type11-stock";

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
    planNo: "PLAN-2026-0789",
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

  // Targets derived from Create Plan Form Constants
  const targets = {
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
      crop: "พืชสวน (ทุเรียน)",
      plots: "1 แปลง (20 ต้น)",
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
  };

  // ────────────────────────────────────────────────────────
  // FORM STATES (11 WORK TYPES)
  // ────────────────────────────────────────────────────────
  // Type 1
  const [t1ProductAdvice, setT1ProductAdvice] = useState("");
  const [t1Detail, setT1Detail] = useState("");
  const [t1DiscussionResult, setT1DiscussionResult] = useState("");
  const [t1SalesOpportunity, setT1SalesOpportunity] = useState<
    "สูง" | "กลาง" | "ต่ำ" | ""
  >("");
  const [t1NextAction, setT1NextAction] = useState("");
  const [t1NextMeetingDate, setT1NextMeetingDate] = useState("");

  // Type 2
  const [t2CustomerName, setT2CustomerName] = useState("");
  const [t2Detail, setT2Detail] = useState("");
  const [t2UsageResult, setT2UsageResult] = useState<
    "พืชตอบสนองดี" | "ยังไม่เห็นผลชัดเจน" | "พบปัญหา" | ""
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
    "สมบูรณ์" | "ปานกลาง" | "ทรุดโทรม" | ""
  >("");
  const [t7ProductResponse, setT7ProductResponse] = useState<
    "พืชตอบสนองดี" | "ยังไม่เห็นผลชัดเจน" | "พบปัญหา" | ""
  >("");
  const [t7ProblemDescription, setT7ProblemDescription] = useState("");
  const [t7PlotImages, setT7PlotImages] = useState<ImageFile[]>([]);

  // Type 8
  const [t8ActualAttendees, setT8ActualAttendees] = useState("");
  const [t8FeedbackQnA, setT8FeedbackQnA] = useState("");
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
  const [t11ProductList, setT11ProductList] = useState("");
  const [t11StockStatus, setT11StockStatus] = useState<
    "ใกล้หมด" | "ขาดสต็อก" | ""
  >("");
  const [t11ReorderOpportunity, setT11ReorderOpportunity] = useState<
    "สูง" | "กลาง" | "ต่ำ" | ""
  >("");
  const [t11NextAction, setT11NextAction] = useState("");

  // Submitting & notifications
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
            planNo: p.id
              ? `PLAN-${p.id.slice(-6).toUpperCase()}`
              : "PLAN-2026-0789",
            title: p.title || "แปลงสาธิตของบ้านนา",
            startDateStr: format(start, "d MMM yyyy", { locale: th }),
            endDateStr: format(end, "d MMM yyyy", { locale: th }),
            timeStr: `${format(start, "HH:mm")} - ${format(end, "HH:mm")} น.`,
            locationStr: p.location || `${DEMO_OWNERS[0]} อ.เมือง จ.จันทบุรี`,
            marketingBudget: p.marketingBudget
              ? Number(p.marketingBudget)
              : undefined,
            salesPromotionBudget: p.salesPromotionBudget
              ? Number(p.salesPromotionBudget)
              : undefined,
            notes: p.notes || undefined,
            objective: p.objective || undefined,
          });
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
    setT5CompetitorPrice("850 บาท/ขวด");
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
    setT11ProductList(
      `${DEMO_PRODUCTS[0]} (50 กระสอบ), ${DEMO_PRODUCTS[1]} (20 ขวด)`,
    );
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(id ? `/activity-plans/${id}` : "/activity-plans");
        }
      }, 1200);
    }, 800);
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
    <div className="max-w-4xl mx-auto p-4 md:p-6 pb-24 space-y-6">
      {/* WORK TYPE SELECTOR TABS & DROPDOWN */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-600" />
            สลับดูแบบฟอร์มตามกิจกรรม (11 รูปแบบ):
          </span>
          <Select value={activeTypeTab} onValueChange={setActiveTypeTab}>
            <SelectTrigger className="w-64 h-8 text-xs bg-slate-50 border-slate-300">
              <SelectValue placeholder="เลือกกิจกรรม" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">
                📋 แสดงแบบฟอร์มทั้งหมด (All 11 Types)
              </SelectItem>
              {WORK_TYPES.map((typeName, idx) => (
                <SelectItem key={typeName} value={typeName}>
                  {idx + 1}. {typeName}
                </SelectItem>
              ))}
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
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            📋 ทั้งหมด
          </button>

          {WORK_TYPES.map((typeName, idx) => (
            <button
              key={typeName}
              type="button"
              onClick={() => setActiveTypeTab(typeName)}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                activeTypeTab === typeName
                  ? "bg-blue-600 text-white shadow-xs font-semibold"
                  : "bg-slate-50 border border-slate-200/80 text-slate-700 hover:bg-slate-100",
              )}
            >
              {idx + 1}. {typeName.split(" / ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleBack}
            className="h-10 w-10 rounded-full border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
              บันทึกผลการปฏิบัติงาน{" "}
              <span className="text-slate-500 font-medium text-lg">
                (Actual)
              </span>
            </h1>
            <p className="text-sm text-slate-500">
              เปรียบเทียบเป้าหมายและบันทึกผลปฏิบัติงานจริง
            </p>
          </div>
        </div>

        {/* Fill Sample Data Button */}
        <Button
          type="button"
          onClick={fillAllSampleData}
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium gap-2 shadow-sm rounded-xl text-xs md:text-sm"
        >
          <Sparkles className="w-4 h-4 text-yellow-300 animate-bounce" />
          <span>เติมข้อมูลตัวอย่าง (ทั้ง 11 กิจกรรม)</span>
        </Button>
      </div>

      {/* PLAN SUMMARY CARD */}
      <ActualPlanSummary summary={planSummary} />

      {/* Notifications */}
      {formError && (
        <Alert variant="destructive" className="animate-in fade-in-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {submitSuccess && (
        <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800 animate-in fade-in-50">
          <Check className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="font-semibold">
            บันทึกผลการปฏิบัติงานเรียบร้อยแล้ว!
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* WORK TYPE 1 */}
        <ActualType1Visit
          isVisible={isTypeVisible("เข้าพบร้านค้า / เกษตรกร")}
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
          isVisible={isTypeVisible("ติดตามแปลงสาธิต / พืชเป้าหมาย")}
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
          productList={t11ProductList}
          setProductList={setT11ProductList}
          stockStatus={t11StockStatus}
          setStockStatus={setT11StockStatus}
          reorderOpportunity={t11ReorderOpportunity}
          setReorderOpportunity={setT11ReorderOpportunity}
          nextAction={t11NextAction}
          setNextAction={setT11NextAction}
        />

        {/* FOOTER BUTTONS */}
        <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-200">
          <Button
            type="button"
            onClick={handleBack}
            className="bg-[#64748B] hover:bg-[#475569] text-white font-medium px-8 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            <span>ยกเลิก</span>
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#45A744] hover:bg-[#398938] text-white font-medium px-8 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>บันทึกผลการปฏิบัติงาน</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
