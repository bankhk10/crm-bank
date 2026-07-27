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
  Upload,
  FileText,
  Save,
  Loader2,
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
    title: "แปลงสาธิตของบ้านนา",
    dateStr: "25 ก.ค. 2568",
    timeStr: "09:00 - 15:00",
    locationStr: "บริษัททดสอบ จำกัด อ.เมือง จ.จันทบุรี",
    demoPlotTarget: "1 แปลง | 20 ต้น",
    salesTarget: "10,000 บาท",
  });

  // Section 1 State: Demo Plot & Target Crop
  const [plotName, setPlotName] = useState("");
  const [usageMethod, setUsageMethod] = useState("");
  const [cropAgeValue, setCropAgeValue] = useState("");
  const [cropAgeUnit, setCropAgeUnit] = useState("วัน");
  const [growthStage, setGrowthStage] = useState("");
  const [cropCondition, setCropCondition] = useState<"สมบูรณ์" | "ไม่เปลี่ยนแปลง" | "ทรุดโทรม" | "">("");
  const [productResponse, setProductResponse] = useState<"พืชตอบสนองดี" | "ยังไม่เห็นผลชัดเจน" | "พบปัญหา" | "">("");
  const [problemDescription, setProblemDescription] = useState("");
  const [plotImages, setPlotImages] = useState<Array<{ id: string; url: string; name: string }>>([]);

  // Section 2 State: Store Promotion Activity
  const [activityFormat, setActivityFormat] = useState("");
  const [actualSales, setActualSales] = useState("");
  const [actualAttendees, setActualAttendees] = useState("");
  const [atmosphereImages, setAtmosphereImages] = useState<Array<{ id: string; url: string; name: string }>>([]);

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
            locationStr: p.location || "บริษัททดสอบ จำกัด อ.เมือง จ.จันทบุรี",
            demoPlotTarget: p.objective || "1 แปลง | 20 ต้น",
            salesTarget: p.salesPromotionBudget ? `${Number(p.salesPromotionBudget).toLocaleString()} บาท` : "10,000 บาท",
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

  // Image Upload Handlers (Simulation for local previews)
  const handlePlotImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);
    const newItems = files.map((file, idx) => ({
      id: `plot-${Date.now()}-${idx}`,
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setPlotImages((prev) => [...prev, ...newItems]);
  };

  const removePlotImage = (imgId: string) => {
    setPlotImages((prev) => prev.filter((img) => img.id !== imgId));
  };

  const handleAtmosphereImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);
    const newItems = files.map((file, idx) => ({
      id: `atmos-${Date.now()}-${idx}`,
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setAtmosphereImages((prev) => [...prev, ...newItems]);
  };

  const removeAtmosphereImage = (imgId: string) => {
    setAtmosphereImages((prev) => prev.filter((img) => img.id !== imgId));
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

    // Basic Validation
    if (!plotName.trim()) {
      setFormError("กรุณากรอกชื่อแปลงสาธิต");
      return;
    }
    if (!usageMethod.trim()) {
      setFormError("กรุณากรอกวิธีการใช้ / อัตราการใช้");
      return;
    }
    if (!cropAgeValue) {
      setFormError("กรุณาระบุอายุพืช");
      return;
    }
    if (!growthStage) {
      setFormError("กรุณาเลือกระยะการเจริญเติบโต");
      return;
    }
    if (!cropCondition) {
      setFormError("กรุณาเลือกสภาพพืช");
      return;
    }
    if (!productResponse) {
      setFormError("กรุณาเลือกผลการใช้ผลิตภัณฑ์");
      return;
    }
    if (productResponse === "พบปัญหา" && !problemDescription.trim()) {
      setFormError("กรุณาระบุปัญหาที่พบ");
      return;
    }

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
      <div className="flex items-center gap-3.5 border-b border-slate-200/80 pb-4">
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
            บันทึกผลการปฏิบัติงาน <span className="text-slate-500 font-medium text-lg">(Actual)</span>
          </h1>
          <p className="text-sm text-slate-500">กรอกผลการดำเนินการตามแผน</p>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* PLAN SUMMARY CARD */}
      {/* ──────────────────────────────────────────────────────── */}
      <div className="bg-blue-50/50 border border-blue-200/70 rounded-2xl p-4 md:p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-slate-800 font-semibold text-base">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs shadow-xs">
            <FileText className="w-4 h-4" />
          </span>
          <span>ข้อมูลสรุปจากแผน (Plan Summary)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Activity Name */}
          <div className="bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-blue-100">
            <p className="text-xs text-slate-500 font-medium mb-1">ชื่อกิจกรรม</p>
            <p className="text-sm md:text-base font-bold text-slate-900">{planSummary.title}</p>
          </div>

          {/* Activity Date & Time */}
          <div className="bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-blue-100">
            <p className="text-xs text-slate-500 font-medium mb-1">วันที่จัดกิจกรรม</p>
            <div className="flex flex-col gap-0.5 text-xs md:text-sm font-semibold text-slate-800">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                {planSummary.dateStr}
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 font-normal">
                <Clock className="w-4 h-4 text-blue-500" />
                {planSummary.timeStr}
              </span>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-blue-100">
            <p className="text-xs text-slate-500 font-medium mb-1">สถานที่</p>
            <p className="text-xs md:text-sm font-medium text-slate-800 flex items-start gap-1.5">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{planSummary.locationStr}</span>
            </p>
          </div>
        </div>

        {/* Sub-cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="bg-white border border-emerald-200/80 rounded-xl p-3.5 flex items-center gap-3 shadow-2xs">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600">เป้าหมายแปลงสาธิต</p>
              <p className="text-sm md:text-base font-bold text-slate-900">{planSummary.demoPlotTarget}</p>
            </div>
          </div>

          <div className="bg-white border border-rose-200/80 rounded-xl p-3.5 flex items-center gap-3 shadow-2xs">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600">เป้ายอดขายจากกิจกรรมหน้าร้าน</p>
              <p className="text-sm md:text-base font-bold text-slate-900">{planSummary.salesTarget}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {formError && (
        <Alert variant="destructive" className="animate-in fade-in-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {submitSuccess && (
        <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800 animate-in fade-in-50">
          <Check className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="font-semibold">บันทึกผลการปฏิบัติงานเรียบร้อยแล้ว!</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ──────────────────────────────────────────────────────── */}
        {/* SECTION 1: DEMO PLOT / TARGET CROP (GREEN CARD) */}
        {/* ──────────────────────────────────────────────────────── */}
        <div className="border-2 border-emerald-500 rounded-2xl p-4 md:p-6 bg-white space-y-5 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-sm shadow-2xs">
              1
            </span>
            <h2 className="font-bold text-emerald-800 text-base md:text-lg">
              ติดตามแปลงสาธิต / พืชเป้าหมาย
            </h2>
          </div>

          {/* Plot Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-800">
              ชื่อแปลงสาธิต <span className="text-rose-500">*</span>
            </label>
            <Input
              type="text"
              value={plotName}
              onChange={(e) => setPlotName(e.target.value)}
              placeholder="เช่น แปลงทดสอบบ้านนา"
              className="bg-white border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          {/* Usage Method & Dosage */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-800">
              วิธีการใช้ / อัตราการใช้ <span className="text-rose-500">*</span>
            </label>
            <Textarea
              rows={3}
              value={usageMethod}
              onChange={(e) => setUsageMethod(e.target.value)}
              placeholder="เช่น ฉีดพ่นทางใบ 50cc/น้ำ 20L"
              className="bg-white border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          {/* Crop Age & Growth Stage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Crop Age */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800">
                อายุพืช <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={cropAgeValue}
                  onChange={(e) => setCropAgeValue(e.target.value)}
                  placeholder="ระบุจำนวน"
                  className="bg-white border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
                <Select value={cropAgeUnit} onValueChange={setCropAgeUnit}>
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

            {/* Growth Stage */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800">
                ระยะการเจริญเติบโต <span className="text-rose-500">*</span>
              </label>
              <Select value={growthStage} onValueChange={setGrowthStage}>
                <SelectTrigger className="bg-white border-slate-300">
                  <SelectValue placeholder="เลือกระยะการเจริญเติบโต" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ระยะกล้า/ตั้งตัว">ระยะกล้า/ตั้งตัว</SelectItem>
                  <SelectItem value="ระยะเจริญเติบโตทางลำต้น/ใบ">ระยะเจริญเติบโตทางลำต้น/ใบ</SelectItem>
                  <SelectItem value="ระยะออกดอก/ติดผล">ระยะออกดอก/ติดผล</SelectItem>
                  <SelectItem value="ระยะเก็บเกี่ยว/พักต้น">ระยะเก็บเกี่ยว/พักต้น</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Crop Condition Pills */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800">
              สภาพพืช <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              <button
                type="button"
                onClick={() => setCropCondition("สมบูรณ์")}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs md:text-sm font-medium transition-all cursor-pointer",
                  cropCondition === "สมบูรณ์"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20 font-semibold shadow-2xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                )}
              >
                <span className="text-base">🌿</span>
                <span>สมบูรณ์</span>
              </button>

              <button
                type="button"
                onClick={() => setCropCondition("ไม่เปลี่ยนแปลง")}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs md:text-sm font-medium transition-all cursor-pointer",
                  cropCondition === "ไม่เปลี่ยนแปลง"
                    ? "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20 font-semibold shadow-2xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                )}
              >
                <span className="text-base">🟡</span>
                <span>ไม่เปลี่ยนแปลง</span>
              </button>

              <button
                type="button"
                onClick={() => setCropCondition("ทรุดโทรม")}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs md:text-sm font-medium transition-all cursor-pointer",
                  cropCondition === "ทรุดโทรม"
                    ? "bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20 font-semibold shadow-2xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                )}
              >
                <span className="text-base">🔴</span>
                <span>ทรุดโทรม</span>
              </button>
            </div>
          </div>

          {/* Product Response Pills */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800">
              ผลการใช้ผลิตภัณฑ์ <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              <button
                type="button"
                onClick={() => setProductResponse("พืชตอบสนองดี")}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs md:text-sm font-medium transition-all cursor-pointer",
                  productResponse === "พืชตอบสนองดี"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20 font-semibold shadow-2xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                )}
              >
                <span className="text-base">🟢</span>
                <span>พืชตอบสนองดี</span>
              </button>

              <button
                type="button"
                onClick={() => setProductResponse("ยังไม่เห็นผลชัดเจน")}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs md:text-sm font-medium transition-all cursor-pointer",
                  productResponse === "ยังไม่เห็นผลชัดเจน"
                    ? "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20 font-semibold shadow-2xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                )}
              >
                <span className="text-base">🕒</span>
                <span>ยังไม่เห็นผลชัดเจน</span>
              </button>

              <button
                type="button"
                onClick={() => setProductResponse("พบปัญหา")}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs md:text-sm font-medium transition-all cursor-pointer",
                  productResponse === "พบปัญหา"
                    ? "bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20 font-semibold shadow-2xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                )}
              >
                <span className="text-base">⚠️</span>
                <span>พบปัญหา</span>
              </button>
            </div>
          </div>

          {/* Conditional Problem Description Box */}
          {(productResponse === "พบปัญหา" || true) && (
            <div className="bg-rose-50/50 border border-rose-200/90 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-rose-800">
                  ระบุปัญหาที่พบ <span className="text-rose-500">*</span>
                </label>
              </div>
              <div className="relative">
                <Textarea
                  rows={3}
                  maxLength={500}
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="เช่น ใบไหม้, แมลงลง, รากเน่า ฯลฯ"
                  className="bg-white border-rose-200 focus:border-rose-400 focus:ring-rose-300 pb-7 text-slate-800"
                />
                <span className="absolute bottom-2 right-3 text-[11px] text-slate-400 font-mono">
                  {problemDescription.length}/500
                </span>
              </div>
            </div>
          )}

          {/* Upload Section: Latest Plot Image */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800">
              รูปภาพสภาพแปลงล่าสุด <span className="text-rose-500">*</span>
            </label>
            <div className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/20 hover:bg-emerald-50/40 rounded-2xl p-6 text-center transition-colors cursor-pointer relative group">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/jpg"
                onChange={handlePlotImagesUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-800">
                    คลิกเพื่ออัปโหลดรูปภาพ หรือ ถ่ายภาพ
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    รองรับไฟล์ JPG, PNG (ขนาดไม่เกิน 10 MB ต่อไฟล์)
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    สามารถอัปโหลดได้หลายรูป
                  </p>
                </div>
              </div>
            </div>

            {/* Display Plot Images */}
            {plotImages.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
                {plotImages.map((img) => (
                  <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePlotImage(img.id)}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-rose-600 text-white rounded-full p-1 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────── */}
        {/* SECTION 2: STORE PROMOTION ACTIVITY (BLUE CARD) */}
        {/* ──────────────────────────────────────────────────────── */}
        <div className="border-2 border-indigo-200 rounded-2xl p-4 md:p-6 bg-white space-y-5 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-sm shadow-2xs">
              2
            </span>
            <h2 className="font-bold text-indigo-900 text-base md:text-lg">
              จัดกิจกรรมส่งเสริมการขายหน้าร้าน
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Activity Format */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800">
                รูปแบบกิจกรรม <span className="text-rose-500">*</span>
              </label>
              <Select value={activityFormat} onValueChange={setActivityFormat}>
                <SelectTrigger className="bg-white border-slate-300">
                  <SelectValue placeholder="เลือกรูปแบบกิจกรรม" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ชงชิม/สาธิตสินค้า">ชงชิม/สาธิตสินค้า</SelectItem>
                  <SelectItem value="แจกของแถม/โปรโมชั่น">แจกของแถม/โปรโมชั่น</SelectItem>
                  <SelectItem value="บรรยายให้ความรู้">บรรยายให้ความรู้</SelectItem>
                  <SelectItem value="จัดบูธขายสินค้า">จัดบูธขายสินค้า</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actual Sales Amount */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800">
                ยอดขายที่เกิดขึ้นจริง <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={actualSales}
                  onChange={(e) => setActualSales(e.target.value)}
                  placeholder="0.00"
                  className="bg-white border-slate-300 pr-12 focus:border-indigo-500 focus:ring-indigo-500"
                />
                <span className="absolute right-3 text-xs font-semibold text-slate-500">
                  บาท
                </span>
              </div>
            </div>
          </div>

          {/* Actual Attendees */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-800">
              จำนวนลูกค้าที่เข้าร่วมจริง <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center max-w-md">
              <Input
                type="number"
                min="0"
                value={actualAttendees}
                onChange={(e) => setActualAttendees(e.target.value)}
                placeholder="ระบุจำนวน"
                className="bg-white border-slate-300 pr-12 focus:border-indigo-500 focus:ring-indigo-500"
              />
              <span className="absolute right-3 text-xs font-semibold text-slate-500">
                คน
              </span>
            </div>
          </div>

          {/* Upload Section: Event Atmosphere Images */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800">
              รูปภาพบรรยากาศ <span className="text-rose-500">*</span>
            </label>
            <div className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/20 hover:bg-indigo-50/40 rounded-2xl p-6 text-center transition-colors cursor-pointer relative group">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleAtmosphereImagesUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-indigo-900">
                    คลิกเพื่ออัปโหลดรูปภาพ หรือ ถ่ายภาพ
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    รองรับไฟล์ JPG, PNG (ขนาดไม่เกิน 10 MB ต่อไฟล์)
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    สามารถอัปโหลดได้หลายรูป
                  </p>
                </div>
              </div>
            </div>

            {/* Display Atmosphere Images */}
            {atmosphereImages.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
                {atmosphereImages.map((img) => (
                  <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeAtmosphereImage(img.id)}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-rose-600 text-white rounded-full p-1 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────── */}
        {/* FOOTER BUTTONS */}
        {/* ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-4 pt-4">
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
            <span>บันทึก</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
