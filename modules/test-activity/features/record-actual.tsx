"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Leaf,
  ShoppingBag,
  Camera,
  CheckCircle2,
  AlertTriangle,
  X,
  Save,
  Upload,
  ImageIcon,
  Target,
  Banknote,
} from "lucide-react";
import {
  GROWTH_STAGE_OPTIONS,
  PLANT_CONDITIONS,
  PRODUCT_RESULTS,
  EVENT_FORMAT_OPTIONS,
  AGE_UNITS,
  DEFAULT_PLAN,
} from "../infrastructure/mock-data-actual";
import type {
  PlantCondition,
  ProductResult,
} from "../infrastructure/mock-data-actual";

// ─────────────────────────────────────
// Helpers
// ─────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("th-TH").format(n);

// ─────────────────────────────────────
// Field Label
// ─────────────────────────────────────
function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {label}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
  );
}

// ─────────────────────────────────────
// Text Input
// ─────────────────────────────────────
function TextInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 ${className ?? ""}`}
    />
  );
}

// ─────────────────────────────────────
// Textarea
// ─────────────────────────────────────
function TextArea({
  value,
  onChange,
  placeholder,
  maxLength,
  rows,
  hasError,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  hasError?: boolean;
}) {
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows ?? 3}
        maxLength={maxLength}
        className={`w-full px-3 py-2.5 border rounded-lg text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 ${
          hasError ? "border-rose-300 bg-rose-50/30" : "border-slate-200"
        }`}
      />
      {maxLength && (
        <div className="absolute bottom-2 right-2 text-xs text-slate-400">
          {value.length}/{maxLength}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────
// Image Upload Zone
// ─────────────────────────────────────
function ImageUploadZone({
  label,
  images,
  onImagesChange,
}: {
  label?: string;
  images: File[];
  onImagesChange: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    onImagesChange([...images, ...files]);
  };

  return (
    <div>
      {label && <FieldLabel label={label} required />}
      <div
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-emerald-300 rounded-xl p-6 bg-emerald-50/30 cursor-pointer hover:bg-emerald-50 hover:border-emerald-400 transition-colors"
      >
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
          <Camera className="w-6 h-6 text-emerald-600" />
        </div>
        <p className="text-sm font-medium text-emerald-700">
          คลิกเพื่ออัปโหลดรูปภาพ หรือ ถ่ายภาพ
        </p>
        <p className="text-xs text-slate-400">
          รองรับไฟล์ JPG, PNG (ขนาดไม่เกิน 10 MB ต่อไฟล์)
        </p>
        <p className="text-xs text-slate-400">สามารถอัปโหลดได้หลายรูป</p>

        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {images.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-1 bg-white border border-emerald-200 rounded-lg px-2 py-1 text-xs text-slate-600"
                onClick={(e) => e.stopPropagation()}
              >
                <ImageIcon className="w-3 h-3 text-emerald-500" />
                {f.name.slice(0, 16)}{f.name.length > 16 ? "..." : ""}
                <button
                  type="button"
                  onClick={() =>
                    onImagesChange(images.filter((_, j) => j !== i))
                  }
                  className="ml-1 text-slate-400 hover:text-rose-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────
// Toggle Button Group
// ─────────────────────────────────────
function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
  colorMap,
}: {
  options: readonly T[];
  value: T | null;
  onChange: (v: T) => void;
  colorMap: Record<string, { active: string; inactive: string; icon?: React.ReactNode }>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isActive = value === opt;
        const colors = colorMap[opt];
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
              isActive ? colors.active : colors.inactive
            }`}
          >
            {colors.icon}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────
// Section Header
// ─────────────────────────────────────
function SectionHeader({
  num,
  title,
  icon,
  color,
}: {
  num: number | string;
  title: string;
  icon: React.ReactNode;
  color: "emerald" | "blue" | "slate";
}) {
  const ringColor =
    color === "emerald"
      ? "bg-emerald-600"
      : color === "blue"
        ? "bg-blue-600"
        : "bg-slate-600";
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className={`w-7 h-7 rounded-full ${ringColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
      >
        {num}
      </div>
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-bold text-slate-800 text-sm">{title}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────
// Plan Summary (read-only)
// ─────────────────────────────────────
function PlanSummaryCard() {
  const plan = DEFAULT_PLAN;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
        <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs font-bold">
          S
        </div>
        <span className="font-bold text-slate-700 text-sm">
          ข้อมูลสรุปจากแผน
        </span>
        <span className="text-slate-400 text-xs">(Plan Summary)</span>
      </div>

      {/* Info row 1 */}
      <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-100">
        <div>
          <div className="text-xs text-slate-400 mb-0.5">ชื่อกิจกรรม</div>
          <div className="font-bold text-slate-900">{plan.activityName}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400 mb-1">วันที่จัดกิจกรรม</div>
          <div className="flex items-center gap-1.5 text-sm text-slate-700 mb-0.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {plan.activityDate}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {plan.timeRange}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400 mb-1">สถานที่</div>
          <div className="flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-slate-700">{plan.location}</div>
              <div className="text-xs text-slate-500">{plan.locationSub}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Info row 2: targets */}
      <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <Leaf className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-xs text-slate-400">เป้าหมายแปลงสาธิต</div>
            <div className="font-bold text-slate-800">{plan.plotTarget}</div>
          </div>
        </div>
        {plan.storeSalesTarget !== null && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <div className="text-xs text-slate-400">เป้าหมายยอดขายจากกิจกรรมหน้าร้าน</div>
              <div className="font-bold text-slate-800">
                {fmt(plan.storeSalesTarget)} บาท
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────
// Section 1: Plot Demo Tracking
// ─────────────────────────────────────
function PlotDemoSection() {
  const [plotName, setPlotName] = useState("");
  const [usageMethod, setUsageMethod] = useState("");
  const [ageValue, setAgeValue] = useState("");
  const [ageUnit, setAgeUnit] = useState("วัน");
  const [growthStage, setGrowthStage] = useState("");
  const [plantCondition, setPlantCondition] = useState<PlantCondition | null>(null);
  const [productResult, setProductResult] = useState<ProductResult | null>(null);
  const [problemText, setProblemText] = useState("");
  const [plotImages, setPlotImages] = useState<File[]>([]);

  const showProblemField =
    plantCondition === "ทรุดโทรม" || productResult === "พบปัญหา";

  const plantConditionColors: Record<string, { active: string; inactive: string; icon?: React.ReactNode }> = {
    สมบูรณ์: {
      active: "bg-emerald-500 text-white border-emerald-500",
      inactive: "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50",
      icon: <Leaf className="w-3.5 h-3.5" />,
    },
    ไม่เปลี่ยน: {
      active: "bg-amber-400 text-white border-amber-400",
      inactive: "bg-white text-amber-700 border-amber-300 hover:bg-amber-50",
    },
    ทรุดโทรม: {
      active: "bg-rose-500 text-white border-rose-500",
      inactive: "bg-white text-rose-700 border-rose-300 hover:bg-rose-50",
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
    },
  };

  const productResultColors: Record<string, { active: string; inactive: string; icon?: React.ReactNode }> = {
    "พัฒนาสมเจ็กดี": {
      active: "bg-emerald-500 text-white border-emerald-500",
      inactive: "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    "ยังไม่เห็นผลชัดเจน": {
      active: "bg-amber-400 text-white border-amber-400",
      inactive: "bg-white text-amber-700 border-amber-300 hover:bg-amber-50",
    },
    "พบปัญหา": {
      active: "bg-rose-500 text-white border-rose-500",
      inactive: "bg-white text-rose-700 border-rose-300 hover:bg-rose-50",
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
    },
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-emerald-200 shadow-sm p-5">
      <SectionHeader
        num={1}
        title="ติดตามแปลงสาธิต / พืชป้าหมาย"
        icon={<Leaf className="w-4 h-4 text-emerald-600" />}
        color="emerald"
      />

      {/* Row 1: Name + Usage Method */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <FieldLabel label="ชื่อแปลงสาธิต" required />
          <TextInput
            value={plotName}
            onChange={setPlotName}
            placeholder="เช่น แปลงทดสอบบ้านนา"
          />
        </div>
        <div>
          <FieldLabel label="วิธีการใช้ / อัตราการใช้" required />
          <TextArea
            value={usageMethod}
            onChange={setUsageMethod}
            placeholder="เช่น ฉีดพ่นทาง 50cc/น้ำ 20L"
            rows={2}
          />
        </div>
      </div>

      {/* Row 2: Age + Growth Stage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <FieldLabel label="อายุพืช" required />
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                value={ageValue}
                onChange={(e) => setAgeValue(e.target.value)}
                placeholder="ระบุจำนวน"
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
            <Select value={ageUnit} onValueChange={setAgeUnit}>
              <SelectTrigger className="w-28 h-10 text-sm border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGE_UNITS.map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <FieldLabel label="ระยะการเจริญเติบโต" required />
          <Select value={growthStage} onValueChange={setGrowthStage}>
            <SelectTrigger className="h-10 text-sm border-slate-200">
              <SelectValue placeholder="เลือกระยะการเจริญเติบโต" />
            </SelectTrigger>
            <SelectContent>
              {GROWTH_STAGE_OPTIONS.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 3: Plant Condition + Product Result */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <FieldLabel label="สภาพพืช" required />
          <ToggleGroup
            options={PLANT_CONDITIONS}
            value={plantCondition}
            onChange={setPlantCondition}
            colorMap={plantConditionColors}
          />
        </div>
        <div>
          <FieldLabel label="ผลการใช้ผลิตภัณฑ์" required />
          <ToggleGroup
            options={PRODUCT_RESULTS}
            value={productResult}
            onChange={setProductResult}
            colorMap={productResultColors}
          />
        </div>
      </div>

      {/* Problem field — conditional */}
      {showProblemField && (
        <div className="mb-4">
          <FieldLabel label="ระบุปัญหาที่พบ" required />
          <TextArea
            value={problemText}
            onChange={setProblemText}
            placeholder="เช่น ใบไหม้, แมลงลง, รากเน่า ฯลฯ"
            maxLength={500}
            rows={3}
            hasError
          />
        </div>
      )}

      {/* Image Upload */}
      <ImageUploadZone
        label="รูปภาพสภาพแปลงล่าสุด"
        images={plotImages}
        onImagesChange={setPlotImages}
      />
    </div>
  );
}

// ─────────────────────────────────────
// Section 2: Store Event Recording
// ─────────────────────────────────────
function StoreEventSection() {
  const [eventFormat, setEventFormat] = useState("");
  const [actualSales, setActualSales] = useState("");
  const [participants, setParticipants] = useState("");
  const [eventImages, setEventImages] = useState<File[]>([]);

  return (
    <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-sm p-5">
      <SectionHeader
        num={2}
        title="จัดกิจกรรมส่งเสริมการขายหน้าร้าน"
        icon={<ShoppingBag className="w-4 h-4 text-blue-600" />}
        color="blue"
      />

      {/* Row 1: Event Format + Actual Sales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <FieldLabel label="รูปแบบกิจกรรม" required />
          <Select value={eventFormat} onValueChange={setEventFormat}>
            <SelectTrigger className="h-10 text-sm border-slate-200">
              <SelectValue placeholder="เลือกรูปแบบกิจกรรม" />
            </SelectTrigger>
            <SelectContent>
              {EVENT_FORMAT_OPTIONS.map((e) => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <FieldLabel label="ยอดขายที่เกิดขึ้นจริง" required />
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">฿</span>
            <input
              type="number"
              value={actualSales}
              onChange={(e) => setActualSales(e.target.value)}
              placeholder="0.00"
              className="w-full h-10 pl-8 pr-16 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">บาท</span>
          </div>
        </div>
      </div>

      {/* Row 2: Participants */}
      <div className="mb-4">
        <FieldLabel label="จำนวนลูกค้าที่เข้าร่วมจริง" required />
        <div className="relative w-full md:w-64">
          <input
            type="number"
            value={participants}
            onChange={(e) => setParticipants(e.target.value)}
            placeholder="ระบุจำนวน"
            className="w-full h-10 px-3 pr-12 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">คน</span>
        </div>
      </div>

      {/* Image Upload */}
      <ImageUploadZone
        label="รูปภาพบรรยากาศ"
        images={eventImages}
        onImagesChange={setEventImages}
      />
    </div>
  );
}

// ─────────────────────────────────────
// Main Component
// ─────────────────────────────────────
export function RecordActual({ onBack }: { onBack?: () => void }) {
  const plan = DEFAULT_PLAN;
  const hasPlot = plan.activityTypes.includes("ติดตามแปลงสาธิต / พืชป้าหมาย");
  const hasStore = plan.activityTypes.includes("จัดกิจกรรมส่งเสริมการขายหน้าร้าน");

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-24">
      {/* ═══ Header ═══ */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600" />
            บันทึกผลการปฏิบัติงาน (Actual)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            กรอกผลการดำเนินงานตามแผน
          </p>
        </div>
      </div>

      {/* ═══ Plan Summary ═══ */}
      <PlanSummaryCard />

      {/* ═══ Dynamic Sections ═══ */}
      {hasPlot && <PlotDemoSection />}
      {hasStore && <StoreEventSection />}

      {/* ═══ Fixed Footer ═══ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-10 px-8 text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white border-slate-800"
            onClick={onBack}
          >
            <X className="w-4 h-4 mr-2" />
            ยกเลิก
          </Button>
          <Button
            type="button"
            className="h-10 px-10 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            บันทึก
          </Button>
        </div>
      </div>
    </div>
  );
}
