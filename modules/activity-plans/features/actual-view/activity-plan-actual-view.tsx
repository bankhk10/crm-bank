"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Sprout,
  Target,
  Camera,
  X,
  Check,
  AlertTriangle,
  FileText,
  Save,
  Loader2,
  Sparkles,
  Users,
  Store,
  Receipt,
  ShoppingCart,
  Search,
  Wrench,
  Package,
  Layers,
  CheckCircle2,
  TrendingUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

  // Loading & Plan State
  const [loadingPlan, setLoadingPlan] = useState(!!id);
  const [planSummary, setPlanSummary] = useState({
    title: "แปลงสาธิตของบ้านนา และ กิจกรรมส่งเสริมการขายหน้าร้าน",
    dateStr: "25 ก.ค. 2568",
    timeStr: "09:00 - 15:00",
    locationStr: `${DEMO_OWNERS[0]} อ.เมือง จ.จันทบุรี`,
    demoPlotTarget: "1 แปลง | 20 ต้น",
    salesTarget: "35,000 บาท",
    attendeeTarget: "40 คน",
  });

  // Active Work Type Selection Mode: "ALL" or specific type name
  const [activeTypeTab, setActiveTypeTab] = useState<string>("ALL");

  // ────────────────────────────────────────────────────────
  // WORK TYPES TARGET OBJECTS (STRUCTURED & CLEAN FOR EASY READING)
  // ────────────────────────────────────────────────────────
  const targets = {
    t1: {
      customer: DEMO_OWNERS[0],
      topic: "แจ้งข่าวสาร",
      detail: "เข้าพบเจ้าของร้านเพื่อแนะนำข้อมูลข่าวสารสินค้าประจำฤดูกาล",
      opportunity: "สูง",
      nextDate: "05 ส.ค. 2568",
    },
    t2: {
      product: DEMO_PRODUCTS[0],
      customer: DEMO_OWNERS[0],
      detail: "ติดตามผลหลังเกษตรกรนำสินค้าไปทดลองใช้งานในพื้นที่",
      expectedResult: "พืชตอบสนองดี",
    },
    t3: {
      product: DEMO_PRODUCTS[0],
      customer: DEMO_OWNERS[0],
      targetQty: "10 ชิ้น",
      targetSales: `5,000 บาท (${DEMO_PRODUCT_PRICES[DEMO_PRODUCTS[0]] || 500} บาท/ชิ้น)`,
    },
    t4: {
      customer: DEMO_OWNERS[0],
      orderNo: "INV-2026-0789",
      targetCollect: "25,500 บาท",
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
  // WORK TYPES ACTUAL FORM STATES (11 TYPES)
  // ────────────────────────────────────────────────────────

  // Type 1: เข้าพบร้านค้า / เกษตรกร
  const [t1ProductAdvice, setT1ProductAdvice] = useState("");
  const [t1Detail, setT1Detail] = useState("");
  const [t1DiscussionResult, setT1DiscussionResult] = useState("");
  const [t1SalesOpportunity, setT1SalesOpportunity] = useState<
    "สูง" | "กลาง" | "ต่ำ" | ""
  >("");
  const [t1NextAction, setT1NextAction] = useState("");
  const [t1NextMeetingDate, setT1NextMeetingDate] = useState("");

  // Type 2: ติดตามผลการใช้สินค้า
  const [t2CustomerName, setT2CustomerName] = useState("");
  const [t2Detail, setT2Detail] = useState("");
  const [t2UsageResult, setT2UsageResult] = useState<
    "พืชตอบสนองดี" | "ยังไม่เห็นผลชัดเจน" | "พบปัญหา" | ""
  >("");
  const [t2ProblemDetail, setT2ProblemDetail] = useState("");

  // Type 3: เสนอขายสินค้า
  const [t3SoldProducts, setT3SoldProducts] = useState("");
  const [t3ActualSales, setT3ActualSales] = useState("");
  const [t3ActualQuantity, setT3ActualQuantity] = useState("");
  const [t3UnclosedReason, setT3UnclosedReason] = useState("");

  // Type 4: วางบิล / เก็บเงิน
  const [t4OrderNo, setT4OrderNo] = useState("");
  const [t4ReceivedAmount, setT4ReceivedAmount] = useState("");
  const [t4PaymentImages, setT4PaymentImages] = useState<
    Array<{ id: string; url: string; name: string }>
  >([]);

  // Type 5: สำรวจตลาดของคู่แข่ง
  const [t5CompetitorBrand, setT5CompetitorBrand] = useState("");
  const [t5CompetitorProduct, setT5CompetitorProduct] = useState("");
  const [t5CompetitorPrice, setT5CompetitorPrice] = useState("");
  const [t5PromotionDetail, setT5PromotionDetail] = useState("");
  const [t5PriceTagImages, setT5PriceTagImages] = useState<
    Array<{ id: string; url: string; name: string }>
  >([]);

  // Type 6: แก้ปัญหา / รับเรื่องร้องเรียน
  const [t6ProblemDetail, setT6ProblemDetail] = useState("");
  const [t6InitialSolution, setT6InitialSolution] = useState("");
  const [t6Status, setT6Status] = useState<"เสร็จสิ้น" | "รอติดตาม" | "">("");
  const [t6Images, setT6Images] = useState<
    Array<{ id: string; url: string; name: string }>
  >([]);

  // Type 7: ติดตามแปลงสาธิต / พืชเป้าหมาย
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
  const [t7PlotImages, setT7PlotImages] = useState<
    Array<{ id: string; url: string; name: string }>
  >([]);

  // Type 8: จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์
  const [t8ActualAttendees, setT8ActualAttendees] = useState("");
  const [t8FeedbackQnA, setT8FeedbackQnA] = useState("");
  const [t8Images, setT8Images] = useState<
    Array<{ id: string; url: string; name: string }>
  >([]);

  // Type 9: จัดกิจกรรมส่งเสริมการขายหน้าร้าน
  const [t9Formats, setT9Formats] = useState<string[]>([]);
  const [t9ActualSales, setT9ActualSales] = useState("");
  const [t9ActualAttendees, setT9ActualAttendees] = useState("");
  const [t9Images, setT9Images] = useState<
    Array<{ id: string; url: string; name: string }>
  >([]);

  // Type 10: จัดงาน Field Day
  const [t10ActualAttendees, setT10ActualAttendees] = useState("");
  const [t10ActualSalesOrBooking, setT10ActualSalesOrBooking] = useState("");
  const [t10TargetFarmersList, setT10TargetFarmersList] = useState("");
  const [t10FarmerFeedback, setT10FarmerFeedback] = useState<
    "สูง" | "กลาง" | "ต่ำ" | ""
  >("");
  const [t10Images, setT10Images] = useState<
    Array<{ id: string; url: string; name: string }>
  >([]);

  // Type 11: ตรวจเช็กสต็อกหน้าร้าน
  const [t11ProductList, setT11ProductList] = useState("");
  const [t11StockStatus, setT11StockStatus] = useState<
    "ใกล้หมด" | "ขาดสต็อก" | ""
  >("");
  const [t11ReorderOpportunity, setT11ReorderOpportunity] = useState<
    "สูง" | "กลาง" | "ต่ำ" | ""
  >("");
  const [t11NextAction, setT11NextAction] = useState("");

  // Form submitting & notifications
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
            title: p.title || "แปลงสาธิตของบ้านนา",
            dateStr: format(start, "d MMM yyyy", { locale: th }),
            timeStr: `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`,
            locationStr: p.location || `${DEMO_OWNERS[0]} อ.เมือง จ.จันทบุรี`,
            demoPlotTarget: p.objective || "1 แปลง | 20 ต้น",
            salesTarget: p.salesPromotionBudget
              ? `${Number(p.salesPromotionBudget).toLocaleString()} บาท`
              : "35,000 บาท",
            attendeeTarget: "40 คน",
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

  // PRE-FILL SAMPLE DATA FOR ALL 11 WORK TYPES
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
      `${DEMO_PRODUCTS[0]} (30 กระสอบ), ${DEMO_PRODUCTS[1]} (15 ขวด)`,
    );
    setT3ActualSales("35500");
    setT3ActualQuantity("45 ชิ้น");
    setT3UnclosedReason("ปิดการขายได้สำเร็จตามเป้าหมาย");

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

  // Image Upload Handler Simulation
  const createUploadHandler = (
    setter: React.Dispatch<
      React.SetStateAction<Array<{ id: string; url: string; name: string }>>
    >,
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
    setter: React.Dispatch<
      React.SetStateAction<Array<{ id: string; url: string; name: string }>>
    >,
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
      {/* ──────────────────────────────────────────────────────── */}
      {/* HEADER SECTION */}
      {/* ──────────────────────────────────────────────────────── */}
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

      {/* ──────────────────────────────────────────────────────── */}
      {/* PLAN SUMMARY CARD */}
      {/* ──────────────────────────────────────────────────────── */}
      <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4 md:p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs shadow-xs">
              <FileText className="w-4 h-4" />
            </span>
            <span>ข้อมูลสรุปจากแผน (Plan Summary)</span>
          </div>
          <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">
            🎯 ดึงข้อมูลจาก Create Trip Plan
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white p-3 rounded-xl border border-blue-100/80">
            <p className="text-[11px] text-slate-400 font-semibold mb-0.5">
              ชื่องานกิจกรรม
            </p>
            <p className="text-xs md:text-sm font-bold text-slate-900">
              {planSummary.title}
            </p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-blue-100/80">
            <p className="text-[11px] text-slate-400 font-semibold mb-0.5">
              วันเวลาจัดงาน
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>{planSummary.dateStr}</span>
              <span className="text-slate-400 font-normal">
                ({planSummary.timeStr})
              </span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-blue-100/80">
            <p className="text-[11px] text-slate-400 font-semibold mb-0.5">
              สถานที่
            </p>
            <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate">{planSummary.locationStr}</span>
            </p>
          </div>
        </div>

        {/* Planned Target Summary Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="bg-white border border-emerald-200 rounded-xl p-3 flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <Sprout className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500">
                เป้าหมายแปลงสาธิต
              </p>
              <p className="text-xs md:text-sm font-bold text-slate-900">
                {planSummary.demoPlotTarget}
              </p>
            </div>
          </div>

          <div className="bg-white border border-rose-200 rounded-xl p-3 flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <Target className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500">
                เป้ายอดขายที่ตั้งไว้
              </p>
              <p className="text-xs md:text-sm font-bold text-slate-900">
                {planSummary.salesTarget}
              </p>
            </div>
          </div>

          <div className="bg-white border border-violet-200 rounded-xl p-3 flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
              <Users className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500">
                เป้าผู้เข้าร่วมงาน
              </p>
              <p className="text-xs md:text-sm font-bold text-slate-900">
                {planSummary.attendeeTarget}
              </p>
            </div>
          </div>
        </div>
      </div>

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
        {/* ──────────────────────────────────────────────────────── */}
        {/* TYPE 1: เข้าพบร้านค้า / เกษตรกร */}
        {/* ──────────────────────────────────────────────────────── */}
        {isTypeVisible("เข้าพบร้านค้า / เกษตรกร") && (
          <div className="border-2 border-teal-500 rounded-2xl p-4 md:p-6 bg-white space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-teal-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-white font-bold text-sm shadow-2xs">
                  1
                </span>
                <h2 className="font-bold text-teal-900 text-base md:text-lg">
                  เข้าพบร้านค้า / เกษตรกร
                </h2>
              </div>
            </div>

            {/* Structured Target Box */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-teal-600" />
                  เป้าหมายที่ตั้งไว้ตอนสร้างแผน (Planned Target):
                </span>
                <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                  จากฟอร์มสร้างแผน
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">
                    ลูกค้า/ร้านค้า:
                  </span>
                  <span className="font-bold text-slate-900">
                    {targets.t1.customer}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">
                    หัวข้อเป้าหมาย:
                  </span>
                  <span className="font-bold text-slate-900">
                    {targets.t1.topic}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">
                    โอกาสขายเป้าหมาย:
                  </span>
                  <span className="font-bold text-emerald-700">
                    {targets.t1.opportunity}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-800">
                  สินค้าที่ให้คำแนะนำ (ถ้ามี)
                </label>
                <Input
                  value={t1ProductAdvice}
                  onChange={(e) => setT1ProductAdvice(e.target.value)}
                  placeholder="เช่น ปุ๋ยเคมีสูตร 15-15-15, สารบำรุงราก"
                  className="bg-white border-slate-300"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-800">
                  ประเมินโอกาสการขาย <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["สูง", "กลาง", "ต่ำ"] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setT1SalesOpportunity(opt)}
                      className={cn(
                        "py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all",
                        t1SalesOpportunity === opt
                          ? opt === "สูง"
                            ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20"
                            : opt === "กลาง"
                              ? "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20"
                              : "bg-slate-100 border-slate-400 text-slate-800"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800">
                รายละเอียด <span className="text-rose-500">*</span>
              </label>
              <Textarea
                rows={2}
                value={t1Detail}
                onChange={(e) => setT1Detail(e.target.value)}
                placeholder="ระบุรายละเอียดวัตถุประสงค์ในการเข้าพบ"
                className="bg-white border-slate-300"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800">
                ผลการพูดคุย <span className="text-rose-500">*</span>
              </label>
              <Textarea
                rows={2}
                value={t1DiscussionResult}
                onChange={(e) => setT1DiscussionResult(e.target.value)}
                placeholder="สรุปประเด็นสำคัญจากการพูดคุยกับลูกค้า"
                className="bg-white border-slate-300"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-800">
                  สิ่งที่ต้องดำเนินการต่อ
                </label>
                <Textarea
                  rows={2}
                  value={t1NextAction}
                  onChange={(e) => setT1NextAction(e.target.value)}
                  placeholder="เช่น ส่งใบเสนอราคา, นำตัวอย่างสินค้ามาให้ลอง"
                  className="bg-white border-slate-300"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-800">
                  วันที่นัดหมายครั้งถัดไป
                </label>
                <Input
                  type="date"
                  value={t1NextMeetingDate}
                  onChange={(e) => setT1NextMeetingDate(e.target.value)}
                  className="bg-white border-slate-300"
                />
              </div>
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────── */}
        {/* TYPE 2: ติดตามผลการใช้สินค้า */}
        {/* ──────────────────────────────────────────────────────── */}
        {isTypeVisible("ติดตามผลการใช้สินค้า") && (
          <div className="border-2 border-cyan-500 rounded-2xl p-4 md:p-6 bg-white space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-cyan-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-600 text-white font-bold text-sm shadow-2xs">
                  2
                </span>
                <h2 className="font-bold text-cyan-900 text-base md:text-lg">
                  ติดตามผลการใช้สินค้า
                </h2>
              </div>
            </div>

            {/* Structured Target Box */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-cyan-600" />
                  เป้าหมายที่ตั้งไว้ตอนสร้างแผน (Planned Target):
                </span>
                <span className="text-[10px] font-bold bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full">
                  จากฟอร์มสร้างแผน
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">
                    สินค้าที่ติดตาม:
                  </span>
                  <span className="font-bold text-slate-900">
                    {targets.t2.product}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">
                    ลูกค้า/ร้านค้า:
                  </span>
                  <span className="font-bold text-slate-900">
                    {targets.t2.customer}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">
                    คาดหวังผลลัพธ์:
                  </span>
                  <span className="font-bold text-emerald-700">
                    {targets.t2.expectedResult}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-sm font-semibold text-slate-800">
                รายชื่อลูกค้า / ร้านค้า <span className="text-rose-500">*</span>
              </label>
              <Input
                value={t2CustomerName}
                onChange={(e) => setT2CustomerName(e.target.value)}
                placeholder="เช่น นายสมชาย (สวนทุเรียน อ.แกลง)"
                className="bg-white border-slate-300"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800">
                รายละเอียดการติดตาม <span className="text-rose-500">*</span>
              </label>
              <Textarea
                rows={2}
                value={t2Detail}
                onChange={(e) => setT2Detail(e.target.value)}
                placeholder="ระบุรายละเอียดสินค้าและแปลงที่นำไปใช้งาน"
                className="bg-white border-slate-300"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800">
                ผลลัพธ์จากการใช้งาน <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  ["พืชตอบสนองดี", "ยังไม่เห็นผลชัดเจน", "พบปัญหา"] as const
                ).map((resOpt) => (
                  <button
                    key={resOpt}
                    type="button"
                    onClick={() => setT2UsageResult(resOpt)}
                    className={cn(
                      "py-2.5 px-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1",
                      t2UsageResult === resOpt
                        ? resOpt === "พืชตอบสนองดี"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20"
                          : resOpt === "ยังไม่เห็นผลชัดเจน"
                            ? "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20"
                            : "bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
                    )}
                  >
                    <span>
                      {resOpt === "พืชตอบสนองดี"
                        ? "🟢"
                        : resOpt === "ยังไม่เห็นผลชัดเจน"
                          ? "🕒"
                          : "⚠️"}
                    </span>
                    <span>{resOpt}</span>
                  </button>
                ))}
              </div>
            </div>

            {t2UsageResult === "พบปัญหา" && (
              <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3.5 space-y-1.5">
                <label className="text-xs font-bold text-rose-800">
                  ระบุรายละเอียดปัญหาที่พบ{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <Textarea
                  rows={2}
                  value={t2ProblemDetail}
                  onChange={(e) => setT2ProblemDetail(e.target.value)}
                  placeholder="เช่น ใบเหลือง, เกิดคราบไหม้, อัตราส่วนเข้มข้นเกินไป"
                  className="bg-white border-rose-200"
                />
              </div>
            )}
          </div>
        )}

        {/* ──────────────────────────────────────────────────────── */}
        {/* TYPE 3: เสนอขายสินค้า */}
        {/* ──────────────────────────────────────────────────────── */}
        {isTypeVisible("เสนอขายสินค้า") && (
          <div className="border-2 border-emerald-600 rounded-2xl p-4 md:p-6 bg-white space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-sm shadow-2xs">
                  3
                </span>
                <h2 className="font-bold text-emerald-900 text-base md:text-lg">
                  เสนอขายสินค้า
                </h2>
              </div>
            </div>

            {/* Structured Target Box */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-emerald-600" />
                  เป้าหมายที่ตั้งไว้ตอนสร้างแผน (Planned Target):
                </span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  จากฟอร์มสร้างแผน
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">
                    สินค้าเสนอขาย:
                  </span>
                  <span className="font-bold text-slate-900">
                    {targets.t3.product}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">
                    เป้าหมายปริมาณ:
                  </span>
                  <span className="font-bold text-slate-900">
                    {targets.t3.targetQty}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">
                    เป้ายอดขาย:
                  </span>
                  <span className="font-bold text-emerald-700">
                    {targets.t3.targetSales}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-sm font-semibold text-slate-800">
                รายการสินค้าที่ขายได้จริง{" "}
                <span className="text-rose-500">*</span>
              </label>
              <Input
                value={t3SoldProducts}
                onChange={(e) => setT3SoldProducts(e.target.value)}
                placeholder="เช่น ปุ๋ยสูตรพรีเมียม A (30 กระสอบ), สารบำรุงใบ (15 ขวด)"
                className="bg-white border-slate-300"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-800">
                  ยอดขายจริง (บาท) <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Input
                    type="number"
                    min="0"
                    value={t3ActualSales}
                    onChange={(e) => setT3ActualSales(e.target.value)}
                    placeholder="0.00"
                    className="bg-white border-slate-300 pr-12"
                  />
                  <span className="absolute right-3 text-xs font-semibold text-slate-500">
                    บาท
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-800">
                  ปริมาณขายจริง <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={t3ActualQuantity}
                  onChange={(e) => setT3ActualQuantity(e.target.value)}
                  placeholder="เช่น 45 ชิ้น / 30 กระสอบ"
                  className="bg-white border-slate-300"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800">
                เหตุผล (กรณีไม่สามารถปิดการขายได้)
              </label>
              <Textarea
                rows={2}
                value={t3UnclosedReason}
                onChange={(e) => setT3UnclosedReason(e.target.value)}
                placeholder="ระบุเหตุผล เช่น ติดปัญหาเครดิตเทอม หรือคู่แข่งเสนอส่วนลดสูงกว่า"
                className="bg-white border-slate-300"
              />
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────── */}
        {/* TYPE 4: วางบิล / เก็บเงิน */}
        {/* ──────────────────────────────────────────────────────── */}
        {isTypeVisible("วางบิล / เก็บเงิน") && (
          <div className="border-2 border-indigo-500 rounded-2xl p-4 md:p-6 bg-white space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-sm shadow-2xs">
                  4
                </span>
                <h2 className="font-bold text-indigo-900 text-base md:text-lg">
                  วางบิล / เก็บเงิน
                </h2>
              </div>
            </div>

            {/* Structured Target Box */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-indigo-600" />
                  เป้าหมายที่ตั้งไว้ตอนสร้างแผน (Planned Target):
                </span>
                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                  จากฟอร์มสร้างแผน
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">
                    ลูกค้า/ร้านค้า:
                  </span>
                  <span className="font-bold text-slate-900">
                    {targets.t4.customer}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">
                    เลขที่ออเดอร์:
                  </span>
                  <span className="font-bold text-slate-900">
                    {targets.t4.orderNo}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">
                    เป้ายอดเก็บเงิน:
                  </span>
                  <span className="font-bold text-indigo-700">
                    {targets.t4.targetCollect}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-800">
                  เลขที่ออเดอร์ / ใบแจ้งหนี้{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={t4OrderNo}
                  onChange={(e) => setT4OrderNo(e.target.value)}
                  placeholder="เช่น INV-2026-0789"
                  className="bg-white border-slate-300"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-800">
                  จำนวนเงินที่รับชำระจริง (บาท){" "}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Input
                    type="number"
                    min="0"
                    value={t4ReceivedAmount}
                    onChange={(e) => setT4ReceivedAmount(e.target.value)}
                    placeholder="0.00"
                    className="bg-white border-slate-300 pr-12"
                  />
                  <span className="absolute right-3 text-xs font-semibold text-slate-500">
                    บาท
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800">
                รูปภาพหลักฐานการรับชำระเงิน{" "}
                <span className="text-rose-500">*</span>
              </label>
              <div className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/20 hover:bg-indigo-50/40 rounded-2xl p-5 text-center transition-colors cursor-pointer relative group">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={createUploadHandler(setT4PaymentImages)}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-indigo-900">
                    คลิกเพื่ออัปโหลด สลิปโอนเงิน / ใบเสร็จรับเงิน
                  </p>
                </div>
              </div>
              {t4PaymentImages.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
                  {t4PaymentImages.map((img) => (
                    <div
                      key={img.id}
                      className="relative aspect-square rounded-lg overflow-hidden border border-slate-200"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(setT4PaymentImages, img.id)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────── */}
        {/* TYPE 5: สำรวจตลาดของคู่แข่ง */}
        {/* ──────────────────────────────────────────────────────── */}
        {isTypeVisible("สำรวจตลาดของคู่แข่ง") && (
          <div className="border-2 border-amber-500 rounded-2xl p-4 md:p-6 bg-white space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-600 text-white font-bold text-sm shadow-2xs">
                  5
                </span>
                <h2 className="font-bold text-amber-900 text-base md:text-lg">
                  สำรวจตลาดของคู่แข่ง
                </h2>
              </div>
            </div>

            {/* Structured Target Box */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-amber-600" />
                  เป้าหมายที่ตั้งไว้ตอนสร้างแผน (Planned Target):
                </span>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  จากฟอร์มสร้างแผน
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">
                    ร้านค้าที่สำรวจ:
                  </span>
                  <span className="font-bold text-slate-900">
                    {targets.t5.store}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">
                    สินค้าเปรียบเทียบ:
                  </span>
                  <span className="font-bold text-slate-900">
                    {targets.t5.product}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-800">
                  แบรนด์คู่แข่งที่พบหน้างาน{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={t5CompetitorBrand}
                  onChange={(e) => setT5CompetitorBrand(e.target.value)}
                  placeholder="เช่น ตราเกษตรทองคำ, เสือคู่"
                  className="bg-white border-slate-300"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-800">
                  สินค้าคู่แข่ง <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={t5CompetitorProduct}
                  onChange={(e) => setT5CompetitorProduct(e.target.value)}
                  placeholder="เช่น ปุ๋ยสูตร 20-20-20 (1 ลิตร)"
                  className="bg-white border-slate-300"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-800">
                  ราคาของคู่แข่ง <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={t5CompetitorPrice}
                  onChange={(e) => setT5CompetitorPrice(e.target.value)}
                  placeholder="เช่น 850 บาท/ขวด"
                  className="bg-white border-slate-300"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800">
                โปรโมชันของคู่แข่งในช่วงนี้
              </label>
              <Textarea
                rows={2}
                value={t5PromotionDetail}
                onChange={(e) => setT5PromotionDetail(e.target.value)}
                placeholder="เช่น ซื้อ 10 แถม 1 หรือ มีของแถมพรีเมียมหน้าร้าน"
                className="bg-white border-slate-300"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800">
                รูปภาพป้ายราคา / ชั้นวางสินค้า
              </label>
              <div className="border-2 border-dashed border-amber-200 hover:border-amber-400 bg-amber-50/20 hover:bg-amber-50/40 rounded-2xl p-5 text-center transition-colors cursor-pointer relative group">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={createUploadHandler(setT5PriceTagImages)}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Camera className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-amber-900">
                    คลิกเพื่ออัปโหลด รูปชั้นวางสินค้า หรือ ป้ายราคาคู่แข่ง
                  </p>
                </div>
              </div>
              {t5PriceTagImages.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
                  {t5PriceTagImages.map((img) => (
                    <div
                      key={img.id}
                      className="relative aspect-square rounded-lg overflow-hidden border border-slate-200"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(setT5PriceTagImages, img.id)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────── */}
        {/* TYPE 6: แก้ปัญหา / รับเรื่องร้องเรียน */}
        {/* ──────────────────────────────────────────────────────── */}
        {isTypeVisible("แก้ปัญหา / รับเรื่องร้องเรียน") && (
          <div className="border-2 border-rose-500 rounded-2xl p-4 md:p-6 bg-white space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-600 text-white font-bold text-sm shadow-2xs">
                  6
                </span>
                <h2 className="font-bold text-rose-900 text-base md:text-lg">
                  แก้ปัญหา / รับเรื่องร้องเรียน
                </h2>
              </div>
            </div>

            {/* Structured Target Box */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-rose-600" />
                  เป้าหมายที่ตั้งไว้ตอนสร้างแผน (Planned Target):
                </span>
                <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                  จากฟอร์มสร้างแผน
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">
                    ลูกค้า/ร้านค้า:
                  </span>
                  <span className="font-bold text-slate-900">
                    {targets.t6.customer}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">
                    ประเภทปัญหา:
                  </span>
                  <span className="font-bold text-slate-900">
                    {targets.t6.issueType}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">
                    เป้าหมายสถานะ:
                  </span>
                  <span className="font-bold text-emerald-700">
                    {targets.t6.targetStatus}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-sm font-semibold text-slate-800">
                รายละเอียดปัญหา <span className="text-rose-500">*</span>
              </label>
              <Textarea
                rows={2}
                value={t6ProblemDetail}
                onChange={(e) => setT6ProblemDetail(e.target.value)}
                placeholder="อธิบายอาการ หรือปัญหาที่ลูกค้าร้องเรียนอย่างละเอียด"
                className="bg-white border-slate-300"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800">
                แนวทางการแก้ไขเบื้องต้น <span className="text-rose-500">*</span>
              </label>
              <Textarea
                rows={2}
                value={t6InitialSolution}
                onChange={(e) => setT6InitialSolution(e.target.value)}
                placeholder="ระบุการให้คำแนะนำ การเปลี่ยนสินค้า หรือการดำเนินการแก้ไข"
                className="bg-white border-slate-300"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800">
                สถานะการดำเนินการ <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-xs">
                {(["เสร็จสิ้น", "รอติดตาม"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setT6Status(st)}
                    className={cn(
                      "py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all",
                      t6Status === st
                        ? st === "เสร็จสิ้น"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20"
                          : "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    {st === "เสร็จสิ้น" ? "✅ เสร็จสิ้น" : "⏳ รอติดตาม"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800">
                รูปภาพประกอบ
              </label>
              <div className="border-2 border-dashed border-rose-200 hover:border-rose-400 bg-rose-50/20 hover:bg-rose-50/40 rounded-2xl p-5 text-center transition-colors cursor-pointer relative group">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={createUploadHandler(setT6Images)}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                    <Camera className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-rose-900">
                    คลิกเพื่ออัปโหลด รูปภาพสินค้ามีปัญหา หรือ รูปหน้างาน
                  </p>
                </div>
              </div>
              {t6Images.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
                  {t6Images.map((img) => (
                    <div
                      key={img.id}
                      className="relative aspect-square rounded-lg overflow-hidden border border-slate-200"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(setT6Images, img.id)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────── */}
        {/* TYPE 7: ติดตามแปลงสาธิต / พืชเป้าหมาย */}
        {/* ──────────────────────────────────────────────────────── */}
        {isTypeVisible("ติดตามแปลงสาธิต / พืชเป้าหมาย") && (
          <div className="border-2 border-emerald-500 rounded-2xl p-4 md:p-6 bg-white space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-sm shadow-2xs">
                  7
                </span>
                <h2 className="font-bold text-emerald-800 text-base md:text-lg">
                  ติดตามแปลงสาธิต / พืชเป้าหมาย
                </h2>
              </div>
            </div>

            {/* Structured Target Box */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-emerald-600" />
                  เป้าหมายที่ตั้งไว้ตอนสร้างแผน (Planned Target):
                </span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  จากฟอร์มสร้างแผน
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">
                    เจ้าของแปลง:
                  </span>
                  <span className="font-bold text-slate-900">
                    {targets.t7.owner}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">
                    สินค้าที่สาธิต:
                  </span>
                  <span className="font-bold text-slate-900">
                    {targets.t7.product}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">
                    พืชเป้าหมาย:
                  </span>
                  <span className="font-bold text-slate-900">
                    {targets.t7.crop} ({targets.t7.plots})
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">
                    เป้าหมายสภาพพืช:
                  </span>
                  <span className="font-bold text-emerald-700">
                    {targets.t7.targetCondition}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-sm font-semibold text-slate-800">
                ชื่อแปลงสาธิต <span className="text-rose-500">*</span>
              </label>
              <Input
                value={t7PlotName}
                onChange={(e) => setT7PlotName(e.target.value)}
                placeholder="เช่น แปลงทดสอบบ้านนา"
                className="bg-white border-slate-300"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800">
                วิธีการใช้ / อัตราการใช้{" "}
                <span className="text-rose-500">*</span>
              </label>
              <Textarea
                rows={2}
                value={t7UsageMethod}
                onChange={(e) => setT7UsageMethod(e.target.value)}
                placeholder="เช่น ฉีดพ่นทางใบ 50cc/น้ำ 20L"
                className="bg-white border-slate-300"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-800">
                  อายุพืช <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    value={t7CropAgeValue}
                    onChange={(e) => setT7CropAgeValue(e.target.value)}
                    placeholder="ระบุจำนวน"
                    className="bg-white border-slate-300"
                  />
                  <Select
                    value={t7CropAgeUnit}
                    onValueChange={setT7CropAgeUnit}
                  >
                    <SelectTrigger className="w-28 bg-white border-slate-300">
                      <SelectValue placeholder="หน่วย" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="วัน">วัน</SelectItem>
                      <SelectItem value="สัปดาห์">สัปดาห์</SelectItem>
                      <SelectItem value="เดือน">เดือน</SelectItem>
                      <SelectItem value="ปี">ปี</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-800">
                  ระยะการเจริญเติบโต <span className="text-rose-500">*</span>
                </label>
                <Select value={t7GrowthStage} onValueChange={setT7GrowthStage}>
                  <SelectTrigger className="bg-white border-slate-300">
                    <SelectValue placeholder="เลือกระยะการเจริญเติบโต" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ระยะกล้า/ตั้งตัว">
                      ระยะกล้า/ตั้งตัว
                    </SelectItem>
                    <SelectItem value="ระยะเจริญเติบโตทางลำต้น/ใบ">
                      ระยะเจริญเติบโตทางลำต้น/ใบ
                    </SelectItem>
                    <SelectItem value="ระยะออกดอก/ติดผล">
                      ระยะออกดอก/ติดผล
                    </SelectItem>
                    <SelectItem value="ระยะเก็บเกี่ยว/พักต้น">
                      ระยะเก็บเกี่ยว/พักต้น
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800">
                สภาพพืช <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["สมบูรณ์", "ปานกลาง", "ทรุดโทรม"] as const).map((cond) => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setT7CropCondition(cond)}
                    className={cn(
                      "py-2.5 px-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1",
                      t7CropCondition === cond
                        ? cond === "สมบูรณ์"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20"
                          : cond === "ปานกลาง"
                            ? "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20"
                            : "bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
                    )}
                  >
                    <span>
                      {cond === "สมบูรณ์"
                        ? "🌿"
                        : cond === "ปานกลาง"
                          ? "🟡"
                          : "🔴"}
                    </span>
                    <span>{cond}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800">
                ผลการใช้ผลิตภัณฑ์ <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  ["พืชตอบสนองดี", "ยังไม่เห็นผลชัดเจน", "พบปัญหา"] as const
                ).map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => setT7ProductResponse(res)}
                    className={cn(
                      "py-2.5 px-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1",
                      t7ProductResponse === res
                        ? res === "พืชตอบสนองดี"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20"
                          : res === "ยังไม่เห็นผลชัดเจน"
                            ? "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20"
                            : "bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
                    )}
                  >
                    <span>
                      {res === "พืชตอบสนองดี"
                        ? "🟢"
                        : res === "ยังไม่เห็นผลชัดเจน"
                          ? "🕒"
                          : "⚠️"}
                    </span>
                    <span>{res}</span>
                  </button>
                ))}
              </div>
            </div>

            {t7ProductResponse === "พบปัญหา" && (
              <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3.5 space-y-1.5">
                <label className="text-xs font-bold text-rose-800">
                  ระบุปัญหาที่พบ <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Textarea
                    rows={2}
                    maxLength={500}
                    value={t7ProblemDescription}
                    onChange={(e) => setT7ProblemDescription(e.target.value)}
                    placeholder="เช่น ใบไหม้, แมลงลง, รากเน่า ฯลฯ"
                    className="bg-white border-rose-200 pb-6 text-slate-800"
                  />
                  <span className="absolute bottom-2 right-3 text-[10px] text-slate-400 font-mono">
                    {t7ProblemDescription.length}/500
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800">
                รูปภาพสภาพแปลงล่าสุด <span className="text-rose-500">*</span>
              </label>
              <div className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/20 hover:bg-emerald-50/40 rounded-2xl p-5 text-center transition-colors cursor-pointer relative group">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={createUploadHandler(setT7PlotImages)}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Camera className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-emerald-800">
                    คลิกเพื่ออัปโหลด รูปถ่ายสภาพแปลงล่าสุด
                  </p>
                </div>
              </div>
              {t7PlotImages.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
                  {t7PlotImages.map((img) => (
                    <div
                      key={img.id}
                      className="relative aspect-square rounded-lg overflow-hidden border border-slate-200"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(setT7PlotImages, img.id)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────── */}
        {/* TYPE 8: จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์ */}
        {/* ──────────────────────────────────────────────────────── */}
        {isTypeVisible("จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์") && (
          <div className="border-2 border-violet-500 rounded-2xl p-4 md:p-6 bg-white space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-violet-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-white font-bold text-sm shadow-2xs">
                  8
                </span>
                <h2 className="font-bold text-violet-900 text-base md:text-lg">
                  จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์
                </h2>
              </div>
            </div>

            {/* Structured Target Box */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-violet-600" />
                  เป้าหมายที่ตั้งไว้ตอนสร้างแผน (Planned Target):
                </span>
                <span className="text-[10px] font-bold bg-violet-100 text-violet-800 px-2 py-0.5 rounded-full">
                  จากฟอร์มสร้างแผน
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-white p-2 rounded-lg border border-slate-200/60 sm:col-span-2">
                  <span className="text-slate-400 block text-[10px]">
                    หัวข้อประชุม:
                  </span>
                  <span className="font-bold text-slate-900">
                    {targets.t8.topic}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">
                    เป้าหมายผู้เข้าร่วม:
                  </span>
                  <span className="font-bold text-violet-700">
                    {targets.t8.targetAttendees}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 max-w-xs pt-1">
              <label className="text-sm font-semibold text-slate-800">
                จำนวนผู้เข้าร่วมจริง (คน){" "}
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Input
                  type="number"
                  min="0"
                  value={t8ActualAttendees}
                  onChange={(e) => setT8ActualAttendees(e.target.value)}
                  placeholder="ระบุจำนวน"
                  className="bg-white border-slate-300 pr-12"
                />
                <span className="absolute right-3 text-xs font-semibold text-slate-500">
                  คน
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800">
                ประเด็นคำถามหรือข้อเสนอแนะที่ได้รับ{" "}
                <span className="text-rose-500">*</span>
              </label>
              <Textarea
                rows={3}
                value={t8FeedbackQnA}
                onChange={(e) => setT8FeedbackQnA(e.target.value)}
                placeholder="สรุปข้อซักถาม ข้อเสนอแนะ หรือความต้องการเพิ่มเติมจากผู้เข้าประชุม"
                className="bg-white border-slate-300"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800">
                รูปภาพบรรยากาศการประชุม <span className="text-rose-500">*</span>
              </label>
              <div className="border-2 border-dashed border-violet-200 hover:border-violet-400 bg-violet-50/20 hover:bg-violet-50/40 rounded-2xl p-5 text-center transition-colors cursor-pointer relative group">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={createUploadHandler(setT8Images)}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-violet-900">
                    คลิกเพื่ออัปโหลด รูปบรรยากาศการจัดประชุม
                  </p>
                </div>
              </div>
              {t8Images.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
                  {t8Images.map((img) => (
                    <div
                      key={img.id}
                      className="relative aspect-square rounded-lg overflow-hidden border border-slate-200"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(setT8Images, img.id)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────── */}
        {/* TYPE 9: จัดกิจกรรมส่งเสริมการขายหน้าร้าน */}
        {/* ──────────────────────────────────────────────────────── */}
        {isTypeVisible("จัดกิจกรรมส่งเสริมการขายหน้าร้าน") && (
          <div className="border-2 border-blue-600 rounded-2xl p-4 md:p-6 bg-white space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-blue-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-sm shadow-2xs">
                  9
                </span>
                <h2 className="font-bold text-blue-900 text-base md:text-lg">
                  จัดกิจกรรมส่งเสริมการขายหน้าร้าน
                </h2>
              </div>
            </div>

            {/* Structured Target Box */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-blue-600" />
                  เป้าหมายที่ตั้งไว้ตอนสร้างแผน (Planned Target):
                </span>
                <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  จากฟอร์มสร้างแผน
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">
                    ร้านค้าจัดกิจกรรม:
                  </span>
                  <span className="font-bold text-slate-900">
                    {targets.t9.store}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">
                    เป้ายอดขายหน้าร้าน:
                  </span>
                  <span className="font-bold text-blue-700">
                    {targets.t9.targetSales}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">
                    เป้าหมายผู้เข้าร่วม:
                  </span>
                  <span className="font-bold text-slate-900">
                    {targets.t9.targetAttendees}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <label className="text-sm font-semibold text-slate-800">
                รูปแบบกิจกรรม <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  "การสะสมคะแนน",
                  "การตลาดเฉพาะบุคคล",
                  "บริการหลังการขาย",
                  "กิจกรรมลูกค้าสัมพันธ์",
                ].map((fmt) => {
                  const isChecked = t9Formats.includes(fmt);
                  return (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setT9Formats(t9Formats.filter((f) => f !== fmt));
                        } else {
                          setT9Formats([...t9Formats, fmt]);
                        }
                      }}
                      className={cn(
                        "py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all text-center",
                        isChecked
                          ? "bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-500/20"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      {isChecked ? "✓ " : ""}
                      {fmt}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-800">
                  ยอดขายที่เกิดขึ้นจริง (บาท){" "}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Input
                    type="number"
                    min="0"
                    value={t9ActualSales}
                    onChange={(e) => setT9ActualSales(e.target.value)}
                    placeholder="0.00"
                    className="bg-white border-slate-300 pr-12"
                  />
                  <span className="absolute right-3 text-xs font-semibold text-slate-500">
                    บาท
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-800">
                  จำนวนลูกค้าที่เข้าร่วมจริง (คน){" "}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Input
                    type="number"
                    min="0"
                    value={t9ActualAttendees}
                    onChange={(e) => setT9ActualAttendees(e.target.value)}
                    placeholder="ระบุจำนวน"
                    className="bg-white border-slate-300 pr-12"
                  />
                  <span className="absolute right-3 text-xs font-semibold text-slate-500">
                    คน
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800">
                รูปภาพบรรยากาศ <span className="text-rose-500">*</span>
              </label>
              <div className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/20 hover:bg-blue-50/40 rounded-2xl p-5 text-center transition-colors cursor-pointer relative group">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={createUploadHandler(setT9Images)}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Store className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-blue-900">
                    คลิกเพื่ออัปโหลด รูปภาพบรรยากาศหน้าร้าน
                  </p>
                </div>
              </div>
              {t9Images.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
                  {t9Images.map((img) => (
                    <div
                      key={img.id}
                      className="relative aspect-square rounded-lg overflow-hidden border border-slate-200"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(setT9Images, img.id)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────── */}
        {/* TYPE 10: จัดงาน Field Day */}
        {/* ──────────────────────────────────────────────────────── */}
        {isTypeVisible("จัดงาน Field Day") && (
          <div className="border-2 border-orange-500 rounded-2xl p-4 md:p-6 bg-white space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-orange-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-600 text-white font-bold text-sm shadow-2xs">
                  10
                </span>
                <h2 className="font-bold text-orange-900 text-base md:text-lg">
                  จัดงาน Field Day
                </h2>
              </div>
            </div>

            {/* Structured Target Box */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-orange-600" />
                  เป้าหมายที่ตั้งไว้ตอนสร้างแผน (Planned Target):
                </span>
                <span className="text-[10px] font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                  จากฟอร์มสร้างแผน
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">
                    แปลงสาธิตจัดงาน:
                  </span>
                  <span className="font-bold text-slate-900">
                    {targets.t10.plot}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">
                    เป้าหมายผู้เข้าร่วม:
                  </span>
                  <span className="font-bold text-slate-900">
                    {targets.t10.targetAttendees}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">
                    เป้ายอดขาย/จอง:
                  </span>
                  <span className="font-bold text-orange-700">
                    {targets.t10.targetSales}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-800">
                  จำนวนผู้เข้าร่วมจริง (คน){" "}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Input
                    type="number"
                    min="0"
                    value={t10ActualAttendees}
                    onChange={(e) => setT10ActualAttendees(e.target.value)}
                    placeholder="ระบุจำนวน"
                    className="bg-white border-slate-300 pr-12"
                  />
                  <span className="absolute right-3 text-xs font-semibold text-slate-500">
                    คน
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-800">
                  ยอดขายหรือยอดจองที่เกิดขึ้นจริง (บาท){" "}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Input
                    type="number"
                    min="0"
                    value={t10ActualSalesOrBooking}
                    onChange={(e) => setT10ActualSalesOrBooking(e.target.value)}
                    placeholder="0.00"
                    className="bg-white border-slate-300 pr-12"
                  />
                  <span className="absolute right-3 text-xs font-semibold text-slate-500">
                    บาท
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800">
                รายชื่อเกษตรกรเป้าหมายที่สนใจ{" "}
                <span className="text-rose-500">*</span>
              </label>
              <Textarea
                rows={2}
                value={t10TargetFarmersList}
                onChange={(e) => setT10TargetFarmersList(e.target.value)}
                placeholder="เช่น นายประเสริฐ (100 ไร่), นายวิชัย (50 ไร่)"
                className="bg-white border-slate-300"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800">
                ผลตอบรับของเกษตรกรที่มาร่วมงาน{" "}
                <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2 max-w-sm">
                {(["สูง", "กลาง", "ต่ำ"] as const).map((fb) => (
                  <button
                    key={fb}
                    type="button"
                    onClick={() => setT10FarmerFeedback(fb)}
                    className={cn(
                      "py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all",
                      t10FarmerFeedback === fb
                        ? fb === "สูง"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20"
                          : fb === "กลาง"
                            ? "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20"
                            : "bg-slate-100 border-slate-400 text-slate-800"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    {fb}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800">
                รูปภาพบรรยากาศการจัดงานจัดเต็ม{" "}
                <span className="text-rose-500">*</span>
              </label>
              <div className="border-2 border-dashed border-orange-200 hover:border-orange-400 bg-orange-50/20 hover:bg-orange-50/40 rounded-2xl p-5 text-center transition-colors cursor-pointer relative group">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={createUploadHandler(setT10Images)}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                    <Camera className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-orange-900">
                    คลิกเพื่ออัปโหลด รูปบรรยากาศงาน Field Day
                  </p>
                </div>
              </div>
              {t10Images.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
                  {t10Images.map((img) => (
                    <div
                      key={img.id}
                      className="relative aspect-square rounded-lg overflow-hidden border border-slate-200"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(setT10Images, img.id)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────── */}
        {/* TYPE 11: ตรวจเช็กสต็อกหน้าร้าน */}
        {/* ──────────────────────────────────────────────────────── */}
        {isTypeVisible("ตรวจเช็กสต็อกหน้าร้าน") && (
          <div className="border-2 border-slate-600 rounded-2xl p-4 md:p-6 bg-white space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-white font-bold text-sm shadow-2xs">
                  11
                </span>
                <h2 className="font-bold text-slate-900 text-base md:text-lg">
                  ตรวจเช็กสต็อกหน้าร้าน
                </h2>
              </div>
            </div>

            {/* Structured Target Box */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-slate-600" />
                  เป้าหมายที่ตั้งไว้ตอนสร้างแผน (Planned Target):
                </span>
                <span className="text-[10px] font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full">
                  จากฟอร์มสร้างแผน
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">
                    ร้านค้าตรวจเช็ก:
                  </span>
                  <span className="font-bold text-slate-900">
                    {targets.t11.store}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">
                    โอกาสสั่งซื้อเป้าหมาย:
                  </span>
                  <span className="font-bold text-emerald-700">
                    {targets.t11.targetOpportunity}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-sm font-semibold text-slate-800">
                รายการสินค้าที่ตรวจเช็ก <span className="text-rose-500">*</span>
              </label>
              <Textarea
                rows={2}
                value={t11ProductList}
                onChange={(e) => setT11ProductList(e.target.value)}
                placeholder="เช่น ปุ๋ยสูตร 15-15-15, สารกำจัดแมลง X"
                className="bg-white border-slate-300"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-800">
                  สถานะสต็อกสินค้า <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(["ใกล้หมด", "ขาดสต็อก"] as const).map((stk) => (
                    <button
                      key={stk}
                      type="button"
                      onClick={() => setT11StockStatus(stk)}
                      className={cn(
                        "py-2.5 px-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all",
                        t11StockStatus === stk
                          ? stk === "ใกล้หมด"
                            ? "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20"
                            : "bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      {stk === "ใกล้หมด" ? "⚠️ ใกล้หมด" : "🚨 ขาดสต็อก"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-800">
                  โอกาสการสั่งซื้อรอบใหม่{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["สูง", "กลาง", "ต่ำ"] as const).map((opp) => (
                    <button
                      key={opp}
                      type="button"
                      onClick={() => setT11ReorderOpportunity(opp)}
                      className={cn(
                        "py-2.5 px-1 rounded-xl border text-xs font-semibold cursor-pointer transition-all",
                        t11ReorderOpportunity === opp
                          ? opp === "สูง"
                            ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20"
                            : opp === "กลาง"
                              ? "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20"
                              : "bg-slate-100 border-slate-400 text-slate-800"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                      )}
                    >
                      {opp}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800">
                สิ่งที่ต้องดำเนินการต่อ <span className="text-rose-500">*</span>
              </label>
              <Textarea
                rows={2}
                value={t11NextAction}
                onChange={(e) => setT11NextAction(e.target.value)}
                placeholder="เช่น ออกใบเสนอราคาสินค้าเพิ่มสต็อก หรือประสานงานฝ่ายจัดส่ง"
                className="bg-white border-slate-300"
              />
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────── */}
        {/* FOOTER BUTTONS */}
        {/* ──────────────────────────────────────────────────────── */}
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
