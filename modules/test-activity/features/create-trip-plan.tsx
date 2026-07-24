"use client";

import React, { useState, useCallback } from "react";
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
  FileText,
  User,
  Calendar,
  MapPin,
  Wallet,
  Package,
  Info,
  Plus,
  X,
  Trash2,
  CheckSquare,
  Square,
  Clock,
  Save,
  Send,
  ChevronDown,
} from "lucide-react";
import {
  ACTIVITY_TYPES,
  BUDGET_TYPES,
  MOCK_EMPLOYEES,
  MOCK_STORES,
  MOCK_PRODUCTS,
  MOCK_PLOT_OWNERS,
  MOCK_CROP_TYPES,
  MATERIAL_UNITS,
  MOCK_MATERIAL_CATEGORIES,
  generatePlanNumber,
} from "../infrastructure/mock-data-trip-plan";
import type { ActivityType } from "../infrastructure/mock-data-trip-plan";

// ─────────────────────────────────────
// Types
// ─────────────────────────────────────
interface PlotObjective {
  plotOwner: string;
  demoProduct: string;
  cropTarget: string;
  targetPlots: string;
  targetArea: string;
}

interface StoreObjective {
  store: string;
  targetSales: string;
  products: string;
}

interface MaterialItem {
  id: string;
  category: string;
  product: string;
  qty: string;
  unit: string;
  description: string;
}

// ─────────────────────────────────────
// Section Header
// ─────────────────────────────────────
function SectionHeader({
  num,
  icon,
  title,
  subtitle,
  color,
}: {
  num: number;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-600",
    green: "bg-emerald-600",
    orange: "bg-orange-500",
    purple: "bg-violet-600",
    teal: "bg-teal-600",
    rose: "bg-rose-500",
    amber: "bg-amber-500",
  };
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className={`w-7 h-7 rounded-full ${colorMap[color] ?? "bg-slate-600"} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
      >
        {num}
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-${color}-600`}>{icon}</span>
        <div>
          <span className="font-bold text-slate-800 text-sm">{title}</span>
          {subtitle && (
            <span className="text-slate-500 text-xs ml-1">({subtitle})</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────
// Form Field Label
// ─────────────────────────────────────
function FieldLabel({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <label className="block text-xs font-medium text-slate-600 mb-1.5">
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
      className={`w-full h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 ${className ?? ""}`}
    />
  );
}

// ─────────────────────────────────────
// Number Input
// ─────────────────────────────────────
function NumberInput({
  value,
  onChange,
  placeholder,
  suffix,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suffix?: string;
}) {
  return (
    <div className="relative flex items-center">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
      />
      {suffix && (
        <span className="absolute right-3 text-xs text-slate-400 pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────
// Date Time Picker (simplified)
// ─────────────────────────────────────
function DateTimeInput({
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
}: {
  dateValue: string;
  timeValue: string;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        <input
          type="date"
          value={dateValue}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full h-9 pl-8 pr-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>
      <div className="relative w-28">
        <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        <input
          type="time"
          value={timeValue}
          onChange={(e) => onTimeChange(e.target.value)}
          className="w-full h-9 pl-8 pr-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────
// Tag (removable chip)
// ─────────────────────────────────────
function Tag({
  label,
  onRemove,
  color,
}: {
  label: string;
  onRemove: () => void;
  color?: string;
}) {
  const bg = color === "blue" ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-violet-100 text-violet-700 border-violet-200";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${bg}`}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="hover:opacity-70 transition-opacity"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

// ─────────────────────────────────────
// Section Card Wrapper
// ─────────────────────────────────────
function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      {children}
    </div>
  );
}

// ─────────────────────────────────────
// Activity Type Checkbox Dropdown
// ─────────────────────────────────────
function ActivityTypeDropdown({
  selected,
  onToggle,
}: {
  selected: ActivityType[];
  onToggle: (type: ActivityType) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full min-h-[72px] px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 text-left"
      >
        <div className="flex flex-wrap gap-1.5 mb-1">
          {selected.map((t) => (
            <Tag
              key={t}
              label={t}
              color="blue"
              onRemove={() => {
                onToggle(t);
              }}
            />
          ))}
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs">{selected.length === 0 ? "เลือกประเภทงาน..." : ""}</span>
          <ChevronDown className="w-4 h-4" />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 top-full right-0 mt-1 w-72 bg-white rounded-xl border border-slate-200 shadow-lg p-2">
          <div className="max-h-72 overflow-y-auto space-y-0.5">
            {ACTIVITY_TYPES.map((type) => {
              const isChecked = selected.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onToggle(type)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 text-left transition-colors"
                >
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${isChecked ? "text-blue-700 font-medium" : "text-slate-600"}`}>
                    {type}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="pt-2 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full text-xs text-slate-500 hover:text-slate-700 py-1"
            >
              ← ล้างการเลือก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────
// SelectField
// ─────────────────────────────────────
function SelectField({
  value,
  onValueChange,
  options,
  placeholder,
}: {
  value: string;
  onValueChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-9 text-sm border-slate-200">
        <SelectValue placeholder={placeholder ?? "เลือก..."} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─────────────────────────────────────
// Map placeholder
// ─────────────────────────────────────
function MapPlaceholder({ location }: { location: string }) {
  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 h-44 flex flex-col items-center justify-center">
      {/* Fake map tiles */}
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, #94a3b8 0px, #94a3b8 1px, transparent 1px, transparent 40px),
                            repeating-linear-gradient(90deg, #94a3b8 0px, #94a3b8 1px, transparent 1px, transparent 40px)`,
        }}
      />
      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center shadow-lg">
          <MapPin className="w-4 h-4 text-white" />
        </div>
        {location && (
          <div className="bg-white px-2 py-1 rounded-lg shadow text-xs text-slate-700 max-w-[160px] text-center truncate">
            {location}
          </div>
        )}
      </div>
      <button
        type="button"
        className="absolute bottom-2 right-2 z-10 flex items-center gap-1 bg-white text-blue-600 text-xs font-semibold border border-blue-200 rounded-lg px-2.5 py-1 shadow hover:bg-blue-50 transition-colors"
      >
        <MapPin className="w-3 h-3" />
        หมุดแผนที่
      </button>
    </div>
  );
}

// ─────────────────────────────────────
// Main Component
// ─────────────────────────────────────
export function CreateTripPlan({ onBack }: { onBack?: () => void }) {
  const planNumber = useState(() => generatePlanNumber())[0];
  const currentUser = MOCK_EMPLOYEES[0];

  // Section 2 state
  const [activityName, setActivityName] = useState("แปลงสาธิตของบานา");
  const [startDate, setStartDate] = useState("2026-07-25");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("2026-07-25");
  const [endTime, setEndTime] = useState("12:00");
  const [selectedTypes, setSelectedTypes] = useState<ActivityType[]>([
    "ติดตามแปลงสาธิต / พืชป้าหมาย",
    "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
  ]);

  // Section 3 state — Plot objectives
  const [plotObj, setPlotObj] = useState<PlotObjective>({
    plotOwner: "PO01",
    demoProduct: "P01",
    cropTarget: "C01",
    targetPlots: "1",
    targetArea: "20",
  });

  // Section 3 state — Store objectives
  const [storeObjs, setStoreObjs] = useState<StoreObjective[]>([
    { store: "S01", targetSales: "10000", products: "P02, P03" },
  ]);

  // Section 4 state
  const [locationDetail, setLocationDetail] = useState(
    "บ้านสวนทุเรียน หมู่ 5 ตำบลนามายศี อำเภอทาเกอทำใน จังหวัดจันทบุรี จุดสังเกต เดินเลยถนนประมาณ 500 เมตร และเข้าซอยสวนทุเรียน"
  );
  const [selectedTeam, setSelectedTeam] = useState<string[]>(["E01", "E02", "E03"]);
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);

  // Section 5 state
  const [budgetType, setBudgetType] = useState<string>("ไม่มีการเบิกงบ");
  const [otherExpenseAmount, setOtherExpenseAmount] = useState("500");
  const [otherExpenseDetail, setOtherExpenseDetail] = useState("ลำภางทาง");

  // Section 6 state
  const [materials, setMaterials] = useState<MaterialItem[]>([
    { id: "m1", category: "สินค้าทดสอบ", product: "สินค้าทดสอบ A", qty: "5", unit: "ชิ้น", description: "สำหรับแจกนักศึกษาเกษตรกรงาน" },
    { id: "m2", category: "สินค้าทดสอบ", product: "สินค้าทดสอบ B", qty: "10", unit: "ของ", description: "สำหรับแจกแผ่นผู้เข้าแปลง" },
    { id: "m3", category: "เอกสาร/สื่อ", product: "ป้ายโปน จำนวน 3 แผ่น", qty: "3", unit: "แผ่น", description: "ติดในงาน" },
  ]);

  // Section 7 state
  const [additionalInfo, setAdditionalInfo] = useState(
    "กรุณาระยะ 3x แนว 3x1 แนว / เตรียมอุปกรณ์เพาะปลูกตามกิจกรรม / โปรดแจ้งจำนวนของแจกปลอกก่อนงาน 1.5น"
  );

  // Toggle activity type
  const toggleType = useCallback((type: ActivityType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }, []);

  // Team helpers
  const toggleTeam = (id: string) => {
    setSelectedTeam((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };
  const getEmployee = (id: string) => MOCK_EMPLOYEES.find((e) => e.id === id);

  // Material helpers
  const addMaterial = () => {
    setMaterials((prev) => [
      ...prev,
      { id: `m${Date.now()}`, category: "", product: "", qty: "", unit: "ชิ้น", description: "" },
    ]);
  };
  const removeMaterial = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };
  const updateMaterial = (id: string, field: keyof MaterialItem, value: string) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  // Store objective helpers
  const addStoreObjective = () => {
    setStoreObjs((prev) => [...prev, { store: "", targetSales: "", products: "" }]);
  };
  const removeStoreObjective = (idx: number) => {
    setStoreObjs((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-24">
      {/* ═══ Header ═══ */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            สร้างแผนปฏิบัติงาน (Create Trip Plan)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">รวมแผนการลงพื้นที่ / กิจกรรมทางการตลาด</p>
        </div>
      </div>

      {/* ═══ Section 1: System Info ═══ */}
      <SectionCard>
        <SectionHeader
          num={1}
          icon={<User className="w-4 h-4" />}
          title="ข้อมูลระบบ"
          subtitle="System Info"
          color="blue"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Responsible */}
          <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-0.5">ผู้รับผิดชอบ (ดึงจากระบบ)</div>
              <div className="font-semibold text-slate-800 text-sm">{currentUser.name}</div>
            </div>
          </div>
          {/* Plan Number */}
          <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-0.5">เลขที่แผน (Auto-Generate)</div>
              <div className="font-bold text-slate-800 text-lg tracking-wide">{planNumber}</div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ═══ Section 2: Main Activity Details ═══ */}
      <SectionCard>
        <SectionHeader
          num={2}
          icon={<Info className="w-4 h-4" />}
          title="ข้อมูลหลักของกิจกรรม"
          subtitle="Main Activity Details"
          color="blue"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Activity Name */}
          <div>
            <FieldLabel label="ชื่อกิจกรรม" required />
            <TextInput
              value={activityName}
              onChange={setActivityName}
              placeholder="ระบุชื่อกิจกรรม..."
            />
          </div>

          {/* Start Date & Time */}
          <div>
            <FieldLabel label="วันที่จัดกิจกรรม" required />
            <DateTimeInput
              dateValue={startDate}
              timeValue={startTime}
              onDateChange={setStartDate}
              onTimeChange={setStartTime}
            />
          </div>

          {/* End Date & Time */}
          <div>
            <FieldLabel label="วันที่สิ้นสุดกิจกรรม" required />
            <DateTimeInput
              dateValue={endDate}
              timeValue={endTime}
              onDateChange={setEndDate}
              onTimeChange={setEndTime}
            />
          </div>
        </div>

        {/* Activity Types */}
        <div>
          <FieldLabel label="ประเภทงาน *" required />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <ActivityTypeDropdown
                selected={selectedTypes}
                onToggle={toggleType}
              />
            </div>
            <div className="hidden lg:flex items-start">
              {selectedTypes.length > 0 && (
                <div className="w-full p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  <span className="font-semibold">💡 เลือกประเภทงานได้มากกว่า 1</span>
                  <span className="ml-1">ระบบจะแสดงฟอร์มวัตถุประสงค์สำหรับประเภทงานที่เลือก</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ═══ Section 3: Dynamic Objective ═══ */}
      {selectedTypes.length > 0 && (
        <SectionCard>
          <SectionHeader
            num={3}
            icon={<CheckSquare className="w-4 h-4" />}
            title="วัตถุประสงค์ของประเภทงาน"
            subtitle="Dynamic Objective"
            color="green"
          />

          <div className="space-y-5">
            {/* ---- Plot Objective ---- */}
            {selectedTypes.includes("ติดตามแปลงสาธิต / พืชป้าหมาย") && (
              <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/30">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-semibold text-emerald-800">
                    ติดตามแปลงสาธิต / พืชป้าหมาย
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <FieldLabel label="เจ้าของแปลง" required />
                    <SelectField
                      value={plotObj.plotOwner}
                      onValueChange={(v) => setPlotObj({ ...plotObj, plotOwner: v })}
                      options={MOCK_PLOT_OWNERS.map((p) => ({ value: p.id, label: p.name }))}
                      placeholder="เลือกเจ้าของแปลง..."
                    />
                  </div>
                  <div>
                    <FieldLabel label="สินค้าสาธิต" required />
                    <SelectField
                      value={plotObj.demoProduct}
                      onValueChange={(v) => setPlotObj({ ...plotObj, demoProduct: v })}
                      options={MOCK_PRODUCTS.map((p) => ({ value: p.id, label: p.name }))}
                      placeholder="เลือกสินค้า..."
                    />
                  </div>
                  <div>
                    <FieldLabel label="พืชป้าหมาย" required />
                    <SelectField
                      value={plotObj.cropTarget}
                      onValueChange={(v) => setPlotObj({ ...plotObj, cropTarget: v })}
                      options={MOCK_CROP_TYPES.map((c) => ({ value: c.id, label: c.name }))}
                      placeholder="เลือกชนิดพืช..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel label="เป้าหมายจำนวนแปลง" required />
                    <NumberInput
                      value={plotObj.targetPlots}
                      onChange={(v) => setPlotObj({ ...plotObj, targetPlots: v })}
                      suffix="แปลง"
                    />
                  </div>
                  <div>
                    <FieldLabel label="เป้าหมายจำนวนพื้นที่" required />
                    <NumberInput
                      value={plotObj.targetArea}
                      onChange={(v) => setPlotObj({ ...plotObj, targetArea: v })}
                      suffix="ไร่"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ---- Store Objective ---- */}
            {selectedTypes.includes("จัดกิจกรรมส่งเสริมการขายหน้าร้าน") && (
              <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/30">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-sm font-semibold text-blue-800">
                    จัดกิจกรรมส่งเสริมการขายหน้าร้าน
                  </span>
                </div>
                <div className="space-y-3">
                  {storeObjs.map((obj, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 relative">
                      <div>
                        <FieldLabel label="ร้านค้าที่ไปจัดงาน" required />
                        <SelectField
                          value={obj.store}
                          onValueChange={(v) =>
                            setStoreObjs((prev) =>
                              prev.map((o, i) => (i === idx ? { ...o, store: v } : o))
                            )
                          }
                          options={MOCK_STORES.map((s) => ({ value: s.id, label: s.name }))}
                          placeholder="เลือกร้านค้า..."
                        />
                      </div>
                      <div>
                        <FieldLabel label="เป้าหมายยอดขายจากกิจกรรม (บาท)" required />
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">฿</span>
                          <input
                            type="number"
                            value={obj.targetSales}
                            onChange={(e) =>
                              setStoreObjs((prev) =>
                                prev.map((o, i) =>
                                  i === idx ? { ...o, targetSales: e.target.value } : o
                                )
                              )
                            }
                            className="w-full h-9 pl-8 pr-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                          />
                        </div>
                      </div>
                      <div>
                        <FieldLabel label="สินค้าที่จะขาย" required />
                        <div className="flex gap-2">
                          <SelectField
                            value={obj.products}
                            onValueChange={(v) =>
                              setStoreObjs((prev) =>
                                prev.map((o, i) => (i === idx ? { ...o, products: v } : o))
                              )
                            }
                            options={MOCK_PRODUCTS.map((p) => ({ value: p.name, label: p.name }))}
                            placeholder="เลือกสินค้า..."
                          />
                          {storeObjs.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeStoreObjective(idx)}
                              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add more activity type button */}
            <button
              type="button"
              onClick={() => {}}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-slate-300 text-slate-500 text-sm hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition-colors w-full justify-center"
            >
              <Plus className="w-4 h-4" />
              + เพิ่มประเภทงาน
            </button>
          </div>
        </SectionCard>
      )}

      {/* ═══ Section 4: Location & Team ═══ */}
      <SectionCard>
        <SectionHeader
          num={4}
          icon={<MapPin className="w-4 h-4" />}
          title="สถานที่และทีมงาน"
          subtitle="Location & Team"
          color="orange"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left: Location detail + textarea */}
          <div className="space-y-3">
            <div>
              <FieldLabel label="รายละเอียดที่พิกัดกิจกรรม" required />
              <div className="relative">
                <textarea
                  value={locationDetail}
                  onChange={(e) => setLocationDetail(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <div className="absolute bottom-2 right-2 text-xs text-slate-400">
                  {locationDetail.length}/500
                </div>
              </div>
            </div>
          </div>

          {/* Right: Map */}
          <div>
            <MapPlaceholder location={locationDetail.slice(0, 30)} />
          </div>
        </div>

        {/* Team */}
        <div className="mt-4">
          <FieldLabel label="คู่งานกิจกรรม (เลือกได้หลายคน)" />
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedTeam.map((id) => {
              const emp = getEmployee(id);
              if (!emp) return null;
              return (
                <Tag
                  key={id}
                  label={`${emp.name} (${emp.position})`}
                  color="purple"
                  onRemove={() => toggleTeam(id)}
                />
              );
            })}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setTeamDropdownOpen(!teamDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              เพิ่มคู่งาน
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {teamDropdownOpen && (
              <div className="absolute z-50 top-full left-0 mt-1 w-64 bg-white rounded-xl border border-slate-200 shadow-lg p-2">
                {MOCK_EMPLOYEES.filter((e) => e.id !== currentUser.id).map((emp) => (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => { toggleTeam(emp.id); setTeamDropdownOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 text-left text-sm"
                  >
                    {selectedTeam.includes(emp.id) ? (
                      <CheckSquare className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 flex-shrink-0" />
                    )}
                    <div>
                      <div className="font-medium text-slate-800">{emp.name}</div>
                      <div className="text-xs text-slate-400">{emp.position}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="mt-1.5 text-xs text-slate-400">
            จำนวน: {selectedTeam.length} คน, เขต ตำบล ทำ
          </div>
        </div>
      </SectionCard>

      {/* ═══ Section 5: Budget & Expenses ═══ */}
      <SectionCard>
        <SectionHeader
          num={5}
          icon={<Wallet className="w-4 h-4" />}
          title="งบประมาณและค่าใช้จ่าย"
          subtitle="Budget & Expenses"
          color="purple"
        />

        {/* Budget Type Tabs */}
        <div>
          <FieldLabel label="ประเภทงบ" required />
          <div className="flex gap-2 flex-wrap mb-4">
            {BUDGET_TYPES.map((bt) => (
              <button
                key={bt}
                type="button"
                onClick={() => setBudgetType(bt)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  budgetType === bt
                    ? "bg-blue-600 text-white border-blue-600 shadow"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {budgetType === bt && <span className="text-emerald-300">✓</span>}
                {bt}
              </button>
            ))}
          </div>
        </div>

        {/* Other Expenses */}
        <div>
          <div className="text-xs font-semibold text-slate-600 mb-2">
            ค่าใช้จ่ายอื่นๆ (นอกเหตุอาหารกรณม)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <FieldLabel label="งบการตลาด" />
              <div className="h-9 flex items-center px-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-400">งบการตลาด</span>
              </div>
            </div>
            <div>
              <FieldLabel label="งบส่งเสริมการขาย" />
              <div className="h-9 flex items-center px-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-400">งบส่งเสริมการขาย</span>
              </div>
            </div>
            <div className="col-span-1" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div>
              <FieldLabel label="จำนวนเงิน" />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">฿</span>
                <input
                  type="number"
                  value={otherExpenseAmount}
                  onChange={(e) => setOtherExpenseAmount(e.target.value)}
                  className="w-full h-9 pl-8 pr-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
            </div>
            <div>
              <FieldLabel label="รายละเอียด" />
              <TextInput
                value={otherExpenseDetail}
                onChange={setOtherExpenseDetail}
                placeholder="ระบุรายละเอียด..."
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ═══ Section 6: Material Requisition ═══ */}
      <SectionCard>
        <div className="flex items-center justify-between mb-4">
          <SectionHeader
            num={6}
            icon={<Package className="w-4 h-4" />}
            title="รายการของเบิกสินค้าจัดกิจกรรม"
            subtitle="Material Requisition"
            color="teal"
          />
          <Button
            type="button"
            size="sm"
            onClick={addMaterial}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            + เพิ่มรายการนัก
          </Button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-600 font-semibold">
                <th className="px-3 py-2.5 text-left w-10">ลำดับ</th>
                <th className="px-3 py-2.5 text-left">รายการสินค้า</th>
                <th className="px-3 py-2.5 text-left w-24">จำนวน</th>
                <th className="px-3 py-2.5 text-left w-28">หน่วย</th>
                <th className="px-3 py-2.5 text-left">รายละเอียด</th>
                <th className="px-3 py-2.5 text-center w-16">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {materials.map((mat, idx) => (
                <tr key={mat.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2.5 text-slate-500 text-xs">{idx + 1}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400">🌱</span>
                      <SelectField
                        value={mat.product}
                        onValueChange={(v) => updateMaterial(mat.id, "product", v)}
                        options={MOCK_PRODUCTS.map((p) => ({ value: p.name, label: p.name }))}
                        placeholder="เลือกสินค้า..."
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      type="number"
                      value={mat.qty}
                      onChange={(e) => updateMaterial(mat.id, "qty", e.target.value)}
                      className="w-full h-8 px-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 text-center"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <SelectField
                      value={mat.unit}
                      onValueChange={(v) => updateMaterial(mat.id, "unit", v)}
                      options={MATERIAL_UNITS.map((u) => ({ value: u, label: u }))}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <TextInput
                      value={mat.description}
                      onChange={(v) => updateMaterial(mat.id, "description", v)}
                      placeholder="รายละเอียด..."
                    />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => removeMaterial(mat.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors mx-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {materials.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-slate-400 text-sm">
                    ยังไม่มีรายการสินค้า — กด "+ เพิ่มรายการ" เพื่อเพิ่ม
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* ═══ Section 7: Additional Info ═══ */}
      <SectionCard>
        <SectionHeader
          num={7}
          icon={<Info className="w-4 h-4" />}
          title="ข้อมูลเพิ่มเติม"
          subtitle="Additional Info"
          color="amber"
        />
        <div>
          <FieldLabel label="หมายเหตุอื่นๆ" />
          <div className="relative">
            <textarea
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="ระบุข้อมูลเพิ่มเติม..."
            />
            <div className="absolute bottom-2 right-2 text-xs text-slate-400">
              {additionalInfo.length}/500
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ═══ Footer Action Bar ═══ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            * ฟิลด์ที่มีเครื่องหมายดอกจันต้องกรอกให้ครบก่อนส่ง
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-10 px-6 text-sm font-semibold border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <Save className="w-4 h-4 mr-2" />
              บันทึกเป็นร่าง (Draft)
            </Button>
            <Button
              type="button"
              className="h-10 px-8 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Send className="w-4 h-4 mr-2" />
              ส่งขออนุมัติ (Submit)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
