"use client";

import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  User,
  FileText,
  Plus,
  Trash2,
  MapPin,
  Check,
  X,
  ChevronDown,
  Search,
  AlertCircle,
  Store,
  Sprout,
  DollarSign,
  Package,
  Layers,
  ArrowLeft,
  Users,
  ShoppingCart,
  FileCheck,
  Building,
  HelpCircle,
  CheckSquare,
  BarChart2,
  Receipt,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ActivityPlanFormValues } from "../../application/validations";

type SubmitResult = {
  success: boolean;
  error?: string;
};

interface Props {
  initial?: Partial<ActivityPlanFormValues> & {
    employeeName?: string;
    planCode?: string;
  };
  employees?: Array<{
    id: string;
    name: string;
    positionTitle?: string | null;
    departmentName?: string | null;
  }>;
  onSubmit: (payload: ActivityPlanFormValues) => Promise<SubmitResult>;
  onCancel?: () => void;
  submitLabel?: string;
  readonly?: boolean;
}

// Master 11 work types list
const WORK_TYPES = [
  "เข้าพบร้านค้า / เกษตรกร",
  "ติดตามผลการใช้สินค้า",
  "เสนอขายสินค้า",
  "วางบิล / เก็บเงิน",
  "สำรวจตลาดของคู่แข่ง",
  "แก้ปัญหา / รับเรื่องร้องเรียน",
  "ติดตามแปลงสาธิต / พืชเป้าหมาย",
  "จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์",
  "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
  "จัดงาน Field Day",
  "ตรวจเช็กสต็อกหน้าร้าน",
];

// Sample lists for dropdowns
const DEMO_OWNERS = ["บริษัททดสอบ", "ร้านทดสอบ สาขา 1", "เกษตรกรตัวอย่าง 1", "ร้านสหายพานิช"];
const DEMO_PRODUCTS = ["สินค้าทดสอบ A", "สินค้าทดสอบ B", "สินค้าทดสอบ C", "ปุ๋ยเคมีสูตรพิเศษ"];
const CROP_CATEGORIES = ["พืชไร่", "พืชสวน", "ผักและพืชล้มลุก"];
const TARGET_CROPS = ["ทุเรียน", "ข้าว", "มันสำปะหลัง", "ยางพารา", "อ้อย", "ส้ม"];
const STORES_LIST = ["ร้านทดสอบ สาขา 1", "ร้านทดสอบ สาขา 2", "ร้านสหายพานิช จันทบุรี", "ร้านเกษตรพัฒนา"];
const REQUISITION_UNITS = ["ขวด", "ซอง", "แผ่น", "กล่อง", "ชิ้น", "ถุง", "ชุด", "ม้วน"];

interface RequisitionItem {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
  detail: string;
}

export function ActivityPlanForm({
  initial = {},
  employees = [],
  onSubmit,
  onCancel,
  submitLabel = "บันทึก",
  readonly = false,
}: Props) {
  // Format initial dates
  const parseInitialDate = (date?: Date | string) => {
    if (!date) return { dateStr: format(new Date(), "yyyy-MM-dd"), timeStr: "09:00" };
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return { dateStr: format(new Date(), "yyyy-MM-dd"), timeStr: "09:00" };
    return {
      dateStr: format(d, "yyyy-MM-dd"),
      timeStr: format(d, "HH:mm"),
    };
  };

  const initStart = parseInitialDate(initial.startDate);
  const initEnd = parseInitialDate(initial.endDate);

  // Form Basic State
  const [title, setTitle] = useState(initial.title ?? "");
  const [startDate, setStartDate] = useState(initStart.dateStr);
  const [startTime, setStartTime] = useState(initStart.timeStr);
  const [endDate, setEndDate] = useState(initEnd.dateStr);
  const [endTime, setEndTime] = useState(initEnd.timeStr);

  // Work types selection state
  const initialTypes = initial.activityType
    ? initial.activityType.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const [selectedWorkTypes, setSelectedWorkTypes] = useState<string[]>(initialTypes);
  const [isWorkTypesDropdownOpen, setIsWorkTypesDropdownOpen] = useState(false);
  const workTypesDropdownRef = useRef<HTMLDivElement>(null);

  // State for all 11 Work Type Objective Forms
  const [type1Topics, setType1Topics] = useState<string[]>([]);
  const [type1OtherTopic, setType1OtherTopic] = useState("");
  const [type1Customers, setType1Customers] = useState("");

  const [type2Product, setType2Product] = useState("");
  const [type2CustomerCount, setType2CustomerCount] = useState<number>(0);

  const [type3ProductList, setType3ProductList] = useState("");
  const [type3TargetSales, setType3TargetSales] = useState<number>(0);
  const [type3TargetQty, setType3TargetQty] = useState<number>(0);

  const [type4Customers, setType4Customers] = useState("");
  const [type4CollectAmount, setType4CollectAmount] = useState<number>(0);

  const [type5Brand, setType5Brand] = useState("");
  const [type5Product, setType5Product] = useState("");
  const [type5StoreCount, setType5StoreCount] = useState<number>(0);

  const [type6Customers, setType6Customers] = useState("");
  const [type6IssueType, setType6IssueType] = useState("เคลมของ");

  const [type7Owner, setType7Owner] = useState("");
  const [type7Product, setType7Product] = useState("");
  const [type7CropCategory, setType7CropCategory] = useState("พืชไร่");
  const [type7Crop, setType7Crop] = useState("ทุเรียน");
  const [type7Plots, setType7Plots] = useState<number>(0);
  const [type7Trees, setType7Trees] = useState<number>(0);

  const [type8Topic, setType8Topic] = useState("");
  const [type8Attendees, setType8Attendees] = useState<number>(0);

  const [type9Store, setType9Store] = useState("");
  const [type9Sales, setType9Sales] = useState<number>(0);
  const [type9Products, setType9Products] = useState("");

  const [type10DemoPlot, setType10DemoPlot] = useState("");
  const [type10Location, setType10Location] = useState("");
  const [type10Showcase, setType10Showcase] = useState("");
  const [type10Attendees, setType10Attendees] = useState<number>(0);
  const [type10BookingSales, setType10BookingSales] = useState<number>(0);

  const [type11Stores, setType11Stores] = useState("");

  // Section 4: Location & Team State
  const [locationText, setLocationText] = useState(initial.location ?? "");
  const [helperEmployeeIds, setHelperEmployeeIds] = useState<string[]>(
    initial.helperEmployeeIds ?? []
  );
  const [helperSearch, setHelperSearch] = useState("");
  const [showHelperDropdown, setShowHelperDropdown] = useState(false);

  // Section 5: Budget & Expenses State
  const initialBudgetType =
    (initial.salesPromotionBudget ?? 0) > 0
      ? "SALES_PROMOTION"
      : (initial.marketingBudget ?? 0) > 0
      ? "MARKETING"
      : "NONE";
  const [budgetType, setBudgetType] = useState<"NONE" | "MARKETING" | "SALES_PROMOTION">(initialBudgetType);
  const [extraExpenseAmount, setExtraExpenseAmount] = useState<number>(0);
  const [extraExpenseDetail, setExtraExpenseDetail] = useState("");

  // Section 6: Material Requisition Items
  const [requisitionItems, setRequisitionItems] = useState<RequisitionItem[]>([]);

  // Section 7: Additional Info State
  const [notes, setNotes] = useState(initial.notes ?? "");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close work types dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        workTypesDropdownRef.current &&
        !workTypesDropdownRef.current.contains(event.target as Node)
      ) {
        setIsWorkTypesDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Work type selection toggling
  const toggleWorkType = (typeStr: string) => {
    if (selectedWorkTypes.includes(typeStr)) {
      setSelectedWorkTypes(selectedWorkTypes.filter((t) => t !== typeStr));
    } else {
      setSelectedWorkTypes([...selectedWorkTypes, typeStr]);
    }
  };

  const removeWorkType = (typeStr: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedWorkTypes(selectedWorkTypes.filter((t) => t !== typeStr));
  };

  const clearWorkTypes = () => {
    setSelectedWorkTypes([]);
  };

  // Requisition table helpers
  const addRequisitionRow = () => {
    const newItem: RequisitionItem = {
      id: Date.now().toString(),
      productName: DEMO_PRODUCTS[0],
      quantity: 1,
      unit: "ขวด",
      detail: "",
    };
    setRequisitionItems([...requisitionItems, newItem]);
  };

  const updateRequisitionRow = (id: string, field: keyof RequisitionItem, val: any) => {
    setRequisitionItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const deleteRequisitionRow = (id: string) => {
    setRequisitionItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Employee Helper Selection
  const filteredEmployees = employees.filter((emp) => {
    if (helperEmployeeIds.includes(emp.id)) return false;
    const search = helperSearch.toLowerCase();
    return (
      emp.name.toLowerCase().includes(search) ||
      (emp.positionTitle?.toLowerCase() || "").includes(search) ||
      (emp.departmentName?.toLowerCase() || "").includes(search)
    );
  });

  const addHelper = (id: string) => {
    setHelperEmployeeIds([...helperEmployeeIds, id]);
    setHelperSearch("");
    setShowHelperDropdown(false);
  };

  const removeHelper = (id: string) => {
    setHelperEmployeeIds(helperEmployeeIds.filter((hid) => hid !== id));
  };

  // Checkbox toggle for Type 1 topics
  const toggleType1Topic = (topic: string) => {
    if (type1Topics.includes(topic)) {
      setType1Topics(type1Topics.filter((t) => t !== topic));
    } else {
      setType1Topics([...type1Topics, topic]);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readonly || loading) return;

    if (!title.trim()) {
      setError("กรุณากรอกชื่อกิจกรรม");
      return;
    }
    if (selectedWorkTypes.length === 0) {
      setError("กรุณาเลือกประเภทงานอย่างน้อย 1 ประเภท");
      return;
    }

    setLoading(true);
    setError(null);

    // Build start & end date objects
    const startDateTime = new Date(`${startDate}T${startTime}:00`);
    const endDateTime = new Date(`${endDate}T${endTime}:00`);

    // Compile dynamic objectives for all selected types
    const summaryParts: string[] = [];

    if (selectedWorkTypes.includes("เข้าพบร้านค้า / เกษตรกร")) {
      const topicsText = type1Topics.join(", ") + (type1OtherTopic ? ` (${type1OtherTopic})` : "");
      summaryParts.push(`[เข้าพบร้านค้า/เกษตรกร] ประเด็น: ${topicsText} | ลูกค้า: ${type1Customers}`);
    }

    if (selectedWorkTypes.includes("ติดตามผลการใช้สินค้า")) {
      summaryParts.push(`[ติดตามผลการใช้สินค้า] สินค้า: ${type2Product} | เป้าหมายลูกค้า: ${type2CustomerCount} ราย`);
    }

    if (selectedWorkTypes.includes("เสนอขายสินค้า")) {
      summaryParts.push(`[เสนอขายสินค้า] สินค้า: ${type3ProductList} | เป้ายอดขาย: ${type3TargetSales.toLocaleString()} บาท (${type3TargetQty} หน่วย)`);
    }

    if (selectedWorkTypes.includes("วางบิล / เก็บเงิน")) {
      summaryParts.push(`[วางบิล/เก็บเงิน] ลูกค้า: ${type4Customers} | เป้ายอดเก็บเงิน: ${type4CollectAmount.toLocaleString()} บาท`);
    }

    if (selectedWorkTypes.includes("สำรวจตลาดของคู่แข่ง")) {
      summaryParts.push(`[สำรวจตลาดคู่แข่ง] แบรนด์: ${type5Brand} | สินค้าเทียบ: ${type5Product} | เป้าหมายร้านค้า: ${type5StoreCount} แห่ง`);
    }

    if (selectedWorkTypes.includes("แก้ปัญหา / รับเรื่องร้องเรียน")) {
      summaryParts.push(`[แก้ปัญหา/ร้องเรียน] ลูกค้า: ${type6Customers} | ประเภทปัญหา: ${type6IssueType}`);
    }

    if (selectedWorkTypes.includes("ติดตามแปลงสาธิต / พืชเป้าหมาย")) {
      summaryParts.push(`[ติดตามแปลงสาธิต] เจ้าของ: ${type7Owner} | สินค้า: ${type7Product} | พืช: ${type7CropCategory} (${type7Crop}) | เป้าหมาย: ${type7Plots} แปลง (${type7Trees} ต้น)`);
    }

    if (selectedWorkTypes.includes("จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์")) {
      summaryParts.push(`[จัดประชุม] หัวข้อ: ${type8Topic} | เป้าหมายผู้เข้าร่วม: ${type8Attendees} คน`);
    }

    if (selectedWorkTypes.includes("จัดกิจกรรมส่งเสริมการขายหน้าร้าน")) {
      summaryParts.push(`[กิจกรรมหน้าร้าน] ร้านค้า: ${type9Store} | เป้ายอดขาย: ${type9Sales.toLocaleString()} บาท | สินค้า: ${type9Products}`);
    }

    if (selectedWorkTypes.includes("จัดงาน Field Day")) {
      summaryParts.push(`[Field Day] แปลงสาธิต: ${type10DemoPlot} | สถานที่: ${type10Location} | สินค้าโชว์: ${type10Showcase} | เป้าผู้ร่วมงาน: ${type10Attendees} คน | เป้ายอดจอง: ${type10BookingSales.toLocaleString()} บาท`);
    }

    if (selectedWorkTypes.includes("ตรวจเช็กสต็อกหน้าร้าน")) {
      summaryParts.push(`[ตรวจเช็กสต็อก] ร้านค้า: ${type11Stores}`);
    }

    const compiledObjective = summaryParts.join("\n") || title;

    // Serialize materials into description
    const materialSummary = requisitionItems
      .map((item, i) => `${i + 1}. ${item.productName} (${item.quantity} ${item.unit}) - ${item.detail}`)
      .join("\n");
    const compiledDescription = `[วัตถุประสงค์งาน]\n${compiledObjective}\n\n[รายการขอเบิกสินค้า]\n${materialSummary}`;

    // Budgets mapping
    let salesPromotionBudget: number | null = null;
    let marketingBudget: number | null = null;

    if (budgetType === "SALES_PROMOTION") {
      salesPromotionBudget = extraExpenseAmount > 0 ? extraExpenseAmount : 10000;
    } else if (budgetType === "MARKETING") {
      marketingBudget = extraExpenseAmount > 0 ? extraExpenseAmount : 10000;
    }

    const extraNotes = extraExpenseAmount
      ? `${notes}\n(ค่าใช้จ่ายอื่นๆ: ${extraExpenseAmount} บาท - ${extraExpenseDetail})`
      : notes;

    try {
      const res = await onSubmit({
        title,
        startDate: startDateTime,
        endDate: endDateTime,
        activityType: selectedWorkTypes.join(", "),
        location: locationText,
        objective: compiledObjective,
        description: compiledDescription,
        salesPromotionBudget,
        marketingBudget,
        notes: extraNotes,
        helperEmployeeIds,
      });

      if (!res.success) {
        setError(res.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Top Header Card */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onCancel}
              className="h-9 w-9 rounded-full border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-200 flex items-center justify-center text-blue-600">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                สร้างแผนปฏิบัติงาน (Create Trip Plan)
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                วางแผนการลงพื้นที่ / กิจกรรมทางการตลาด
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 1: ข้อมูลระบบ (System Info) */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden p-5 md:p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
            1
          </span>
          <h2 className="font-bold text-slate-800 text-base md:text-lg">
            ข้อมูลระบบ (System Info)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Card 1: ผู้รับผิดชอบ */}
          <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">
                ผู้รับผิดชอบ <span className="text-slate-400 text-[11px]">(ดึงจากระบบ)</span>
              </p>
              <p className="text-sm font-semibold text-slate-800">
                {initial.employeeName || "นายวิทยา พันธุ์โชค"}
              </p>
            </div>
          </div>

          {/* Card 2: เลขที่แผน */}
          <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">
                เลขที่แผน <span className="text-slate-400 text-[11px]">(Auto-Generate)</span>
              </p>
              <p className="text-sm font-semibold text-slate-800">
                {initial.planCode || "2607-001"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: ข้อมูลหลักของกิจกรรม (Main Activity Details) */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm p-5 md:p-6 space-y-5 relative z-20">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
            2
          </span>
          <h2 className="font-bold text-slate-800 text-base md:text-lg">
            ข้อมูลหลักของกิจกรรม (Main Activity Details)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* ชื่อกิจกรรม */}
          <div className="lg:col-span-1">
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              ชื่อกิจกรรม <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={readonly}
              placeholder="เช่น แปลงสาธิตของบ้าหนาน"
              className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* วันที่จัดกิจกรรม */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              วันที่จัดกิจกรรม <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={readonly}
                className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={readonly}
                className="h-10 rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="08:00">08:00</option>
                <option value="09:00">09:00</option>
                <option value="10:00">10:00</option>
                <option value="13:00">13:00</option>
                <option value="14:00">14:00</option>
              </select>
            </div>
          </div>

          {/* วันที่สิ้นสุดกิจกรรม */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              วันที่สิ้นสุดกิจกรรม <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={readonly}
                className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={readonly}
                className="h-10 rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="11:00">11:00</option>
                <option value="12:00">12:00</option>
                <option value="16:00">16:00</option>
                <option value="17:00">17:00</option>
                <option value="18:00">18:00</option>
              </select>
            </div>
          </div>

          {/* ประเภทงาน (เลือกได้มากกว่า 1) */}
          <div className="relative" ref={workTypesDropdownRef}>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              ประเภทงาน <span className="text-slate-400 text-[11px]">(เลือกได้มากกว่า 1)</span>{" "}
              <span className="text-red-500">*</span>
            </label>

            {/* Input Trigger Field */}
            <div
              onClick={() => !readonly && setIsWorkTypesDropdownOpen(!isWorkTypesDropdownOpen)}
              className={cn(
                "min-h-[40px] w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm flex flex-wrap items-center gap-1.5 cursor-pointer hover:border-slate-300 focus-within:ring-2 focus-within:ring-blue-500 transition-all",
                readonly && "cursor-not-allowed bg-slate-50"
              )}
            >
              {selectedWorkTypes.length === 0 ? (
                <span className="text-slate-400 text-xs px-1">เลือกประเภทงาน...</span>
              ) : (
                selectedWorkTypes.map((wt) => (
                  <span
                    key={wt}
                    className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200/80 text-blue-700 text-xs px-2 py-0.5 rounded-md font-medium"
                  >
                    <span>{wt}</span>
                    {!readonly && (
                      <button
                        type="button"
                        onClick={(e) => removeWorkType(wt, e)}
                        className="hover:bg-blue-100 rounded p-0.5 text-blue-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))
              )}
              <ChevronDown className="h-4 w-4 text-slate-400 ml-auto flex-shrink-0" />
            </div>

            {/* Work types multi-select checkbox dropdown popup */}
            {isWorkTypesDropdownOpen && (
              <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 w-full sm:w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 p-3 space-y-2 animate-in fade-in-0 zoom-in-95">
                <div className="max-h-80 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {WORK_TYPES.map((typeStr) => {
                    const isChecked = selectedWorkTypes.includes(typeStr);
                    return (
                      <label
                        key={typeStr}
                        onClick={() => toggleWorkType(typeStr)}
                        className={cn(
                          "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-colors select-none",
                          isChecked
                            ? "bg-blue-50 text-blue-800 font-medium"
                            : "hover:bg-slate-50 text-slate-700"
                        )}
                      >
                        <div
                          className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0",
                            isChecked
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-slate-300 bg-white"
                          )}
                        >
                          {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                        <span>{typeStr}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-100 text-right">
                  <button
                    type="button"
                    onClick={clearWorkTypes}
                    className="text-xs font-medium text-slate-500 hover:text-slate-700 underline"
                  >
                    ล้างการเลือก
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Warning alert banner */}
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 md:p-3.5 flex items-center gap-3 text-amber-800 text-xs md:text-sm">
          <div className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
            !
          </div>
          <p className="font-medium">
            เลือกประเภทงานได้หลากหลาย ระบบจะแสดงฟอร์มวัตถุประสงค์ตามประเภทงานที่เลือก
          </p>
        </div>
      </div>

      {/* SECTION 3: วัตถุประสงค์ของประเภทงาน (Dynamic Objective) */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden p-5 md:p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
            3
          </span>
          <h2 className="font-bold text-slate-800 text-base md:text-lg">
            วัตถุประสงค์ของประเภทงาน (Dynamic Objective)
          </h2>
        </div>

        {/* Dynamic Cards Container for all 11 Work Types */}
        <div className="space-y-5">
          {/* Work Type 1: เข้าพบร้านค้า / เกษตรกร */}
          {selectedWorkTypes.includes("เข้าพบร้านค้า / เกษตรกร") && (
            <div className="bg-sky-50/40 border border-sky-200/80 rounded-xl p-4 md:p-5 space-y-4 relative">
              <div className="flex items-center justify-between border-b border-sky-200/60 pb-2.5">
                <div className="flex items-center gap-2 text-sky-800 font-bold text-sm">
                  <Users className="h-4 w-4 text-sky-600" />
                  <span>1. เข้าพบร้านค้า / เกษตรกร</span>
                </div>
                {!readonly && (
                  <button
                    type="button"
                    onClick={() => removeWorkType("เข้าพบร้านค้า / เกษตรกร")}
                    className="text-slate-400 hover:text-red-500 p-1 rounded-md transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-700">
                    ประเด็นหลัก <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-3 rounded-lg border border-slate-200">
                    {[
                      "แจ้งข่าวสาร",
                      "อัปเดตข้อมูลลูกค้า",
                      "เลี้ยงรับรอง / สังสรรค์",
                      "ให้คำแนะนำการใช้สินค้า",
                      "อื่นๆ",
                    ].map((topic) => {
                      const isChecked = type1Topics.includes(topic);
                      return (
                        <label
                          key={topic}
                          onClick={() => toggleType1Topic(topic)}
                          className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none"
                        >
                          <div
                            className={cn(
                              "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                              isChecked
                                ? "bg-sky-600 border-sky-600 text-white"
                                : "border-slate-300 bg-white"
                            )}
                          >
                            {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <span>{topic}</span>
                        </label>
                      );
                    })}
                  </div>
                  {type1Topics.includes("อื่นๆ") && (
                    <input
                      type="text"
                      value={type1OtherTopic}
                      onChange={(e) => setType1OtherTopic(e.target.value)}
                      disabled={readonly}
                      placeholder="โปรดระบุประเด็นอื่นๆ..."
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    รายชื่อลูกค้า / ร้านค้า <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={type1Customers}
                    onChange={(e) => setType1Customers(e.target.value)}
                    disabled={readonly}
                    placeholder="ระบุรายชื่อลูกค้า หรือ ร้านค้าที่จะเข้าพบ..."
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Work Type 2: ติดตามผลการใช้สินค้า */}
          {selectedWorkTypes.includes("ติดตามผลการใช้สินค้า") && (
            <div className="bg-indigo-50/40 border border-indigo-200/80 rounded-xl p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-200/60 pb-2.5">
                <div className="flex items-center gap-2 text-indigo-800 font-bold text-sm">
                  <CheckSquare className="h-4 w-4 text-indigo-600" />
                  <span>2. ติดตามผลการใช้สินค้า</span>
                </div>
                {!readonly && (
                  <button
                    type="button"
                    onClick={() => removeWorkType("ติดตามผลการใช้สินค้า")}
                    className="text-slate-400 hover:text-red-500 p-1 rounded-md transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    สินค้าที่ต้องการไปติดตามผล <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={type2Product}
                    onChange={(e) => setType2Product(e.target.value)}
                    disabled={readonly}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {DEMO_PRODUCTS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    เป้าหมายจำนวนลูกค้า (ราย) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min={1}
                      value={type2CustomerCount}
                      onChange={(e) => setType2CustomerCount(parseInt(e.target.value) || 0)}
                      disabled={readonly}
                      className="w-full h-10 pr-12 pl-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="absolute right-3 text-xs text-slate-400 font-medium">
                      ราย
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Work Type 3: เสนอขายสินค้า */}
          {selectedWorkTypes.includes("เสนอขายสินค้า") && (
            <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-xl p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2.5">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <ShoppingCart className="h-4 w-4 text-emerald-600" />
                  <span>3. เสนอขายสินค้า</span>
                </div>
                {!readonly && (
                  <button
                    type="button"
                    onClick={() => removeWorkType("เสนอขายสินค้า")}
                    className="text-slate-400 hover:text-red-500 p-1 rounded-md transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    รายการสินค้าที่จะเสนอขาย <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={type3ProductList}
                    onChange={(e) => setType3ProductList(e.target.value)}
                    disabled={readonly}
                    placeholder="เช่น สินค้าทดสอบ A, สินค้าทดสอบ B"
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    เป้ายอดขาย (บาท) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-semibold">
                      ฿
                    </span>
                    <input
                      type="number"
                      value={type3TargetSales}
                      onChange={(e) => setType3TargetSales(parseFloat(e.target.value) || 0)}
                      disabled={readonly}
                      className="w-full h-10 pl-7 pr-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    เป้าปริมาณขาย (หน่วย) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={type3TargetQty}
                    onChange={(e) => setType3TargetQty(parseInt(e.target.value) || 0)}
                    disabled={readonly}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Work Type 4: วางบิล / เก็บเงิน */}
          {selectedWorkTypes.includes("วางบิล / เก็บเงิน") && (
            <div className="bg-amber-50/40 border border-amber-200/80 rounded-xl p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                  <Receipt className="h-4 w-4 text-amber-600" />
                  <span>4. วางบิล / เก็บเงิน</span>
                </div>
                {!readonly && (
                  <button
                    type="button"
                    onClick={() => removeWorkType("วางบิล / เก็บเงิน")}
                    className="text-slate-400 hover:text-red-500 p-1 rounded-md transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    รายชื่อลูกค้า / ร้านค้า <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={type4Customers}
                    onChange={(e) => setType4Customers(e.target.value)}
                    disabled={readonly}
                    placeholder="เช่น ร้านทดสอบ สาขา 1"
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    เป้ายอดเก็บเงินรวม (บาท) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-semibold">
                      ฿
                    </span>
                    <input
                      type="number"
                      value={type4CollectAmount}
                      onChange={(e) => setType4CollectAmount(parseFloat(e.target.value) || 0)}
                      disabled={readonly}
                      className="w-full h-10 pl-7 pr-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Work Type 5: สำรวจตลาดของคู่แข่ง */}
          {selectedWorkTypes.includes("สำรวจตลาดของคู่แข่ง") && (
            <div className="bg-purple-50/40 border border-purple-200/80 rounded-xl p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-purple-200/60 pb-2.5">
                <div className="flex items-center gap-2 text-purple-800 font-bold text-sm">
                  <BarChart2 className="h-4 w-4 text-purple-600" />
                  <span>5. สำรวจตลาดของคู่แข่ง</span>
                </div>
                {!readonly && (
                  <button
                    type="button"
                    onClick={() => removeWorkType("สำรวจตลาดของคู่แข่ง")}
                    className="text-slate-400 hover:text-red-500 p-1 rounded-md transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    แบรนด์คู่แข่ง <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={type5Brand}
                    onChange={(e) => setType5Brand(e.target.value)}
                    disabled={readonly}
                    placeholder="เช่น แบรนด์ X"
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    สินค้าที่นำไปเปรียบเทียบ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={type5Product}
                    onChange={(e) => setType5Product(e.target.value)}
                    disabled={readonly}
                    placeholder="เช่น สินค้าสูตร A"
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    เป้าหมายจำนวนร้านค้า (แห่ง) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min={1}
                      value={type5StoreCount}
                      onChange={(e) => setType5StoreCount(parseInt(e.target.value) || 0)}
                      disabled={readonly}
                      className="w-full h-10 pr-14 pl-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="absolute right-3 text-xs text-slate-400 font-medium">
                      แห่ง
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Work Type 6: แก้ปัญหา / รับเรื่องร้องเรียน */}
          {selectedWorkTypes.includes("แก้ปัญหา / รับเรื่องร้องเรียน") && (
            <div className="bg-rose-50/40 border border-rose-200/80 rounded-xl p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-rose-200/60 pb-2.5">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                  <HelpCircle className="h-4 w-4 text-rose-600" />
                  <span>6. แก้ปัญหา / รับเรื่องร้องเรียน</span>
                </div>
                {!readonly && (
                  <button
                    type="button"
                    onClick={() => removeWorkType("แก้ปัญหา / รับเรื่องร้องเรียน")}
                    className="text-slate-400 hover:text-red-500 p-1 rounded-md transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    รายชื่อลูกค้า / ร้านค้า <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={type6Customers}
                    onChange={(e) => setType6Customers(e.target.value)}
                    disabled={readonly}
                    placeholder="เช่น ร้านสหายพานิช"
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    ประเภทปัญหา <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={type6IssueType}
                    onChange={(e) => setType6IssueType(e.target.value)}
                    disabled={readonly}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="เคลมของ">เคลมของ</option>
                    <option value="ฉีดยาแล้วพืชเสียหาย">ฉีดยาแล้วพืชเสียหาย</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Work Type 7: ติดตามแปลงสาธิต / พืชเป้าหมาย */}
          {selectedWorkTypes.includes("ติดตามแปลงสาธิต / พืชเป้าหมาย") && (
            <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-xl p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2.5">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <Sprout className="h-4 w-4 text-emerald-600" />
                  <span>7. ติดตามแปลงสาธิต / พืชเป้าหมาย</span>
                </div>
                {!readonly && (
                  <button
                    type="button"
                    onClick={() => removeWorkType("ติดตามแปลงสาธิต / พืชเป้าหมาย")}
                    className="text-slate-400 hover:text-red-500 p-1 rounded-md transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    เจ้าของแปลง <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={type7Owner}
                    onChange={(e) => setType7Owner(e.target.value)}
                    disabled={readonly}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {DEMO_OWNERS.map((owner) => (
                      <option key={owner} value={owner}>
                        {owner}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    สินค้าที่จะสาธิต <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={type7Product}
                    onChange={(e) => setType7Product(e.target.value)}
                    disabled={readonly}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {DEMO_PRODUCTS.map((prod) => (
                      <option key={prod} value={prod}>
                        {prod}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    ประเภทพืชเป้าหมาย <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={type7CropCategory}
                    onChange={(e) => setType7CropCategory(e.target.value)}
                    disabled={readonly}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {CROP_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    เลือกพืช <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={type7Crop}
                    onChange={(e) => setType7Crop(e.target.value)}
                    disabled={readonly}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {TARGET_CROPS.map((crop) => (
                      <option key={crop} value={crop}>
                        {crop}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    เป้าหมายจำนวนแปลง (แปลง) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min={1}
                      value={type7Plots}
                      onChange={(e) => setType7Plots(parseInt(e.target.value) || 0)}
                      disabled={readonly}
                      className="w-full h-10 pr-14 pl-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="absolute right-3 text-xs text-slate-400 font-medium">
                      แปลง
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    เป้าหมายจำนวนต้น (ต้น) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min={1}
                      value={type7Trees}
                      onChange={(e) => setType7Trees(parseInt(e.target.value) || 0)}
                      disabled={readonly}
                      className="w-full h-10 pr-12 pl-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="absolute right-3 text-xs text-slate-400 font-medium">
                      ต้น
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Work Type 8: จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์ */}
          {selectedWorkTypes.includes("จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์") && (
            <div className="bg-blue-50/40 border border-blue-200/80 rounded-xl p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-blue-200/60 pb-2.5">
                <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span>8. จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์</span>
                </div>
                {!readonly && (
                  <button
                    type="button"
                    onClick={() => removeWorkType("จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์")}
                    className="text-slate-400 hover:text-red-500 p-1 rounded-md transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    หัวข้อที่จะประชุม <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={type8Topic}
                    onChange={(e) => setType8Topic(e.target.value)}
                    disabled={readonly}
                    placeholder="เช่น ประชุมวางแผนฤดูกาลเพาะปลูก"
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    เป้าหมายจำนวนคนเข้าร่วม (คน) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min={1}
                      value={type8Attendees}
                      onChange={(e) => setType8Attendees(parseInt(e.target.value) || 0)}
                      disabled={readonly}
                      className="w-full h-10 pr-12 pl-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="absolute right-3 text-xs text-slate-400 font-medium">
                      คน
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Work Type 9: จัดกิจกรรมส่งเสริมการขายหน้าร้าน */}
          {selectedWorkTypes.includes("จัดกิจกรรมส่งเสริมการขายหน้าร้าน") && (
            <div className="bg-teal-50/40 border border-teal-200/80 rounded-xl p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-teal-200/60 pb-2.5">
                <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                  <Store className="h-4 w-4 text-teal-600" />
                  <span>9. จัดกิจกรรมส่งเสริมการขายหน้าร้าน</span>
                </div>
                {!readonly && (
                  <button
                    type="button"
                    onClick={() => removeWorkType("จัดกิจกรรมส่งเสริมการขายหน้าร้าน")}
                    className="text-slate-400 hover:text-red-500 p-1 rounded-md transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    ร้านค้าที่จะไปจัดงาน <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={type9Store}
                    onChange={(e) => setType9Store(e.target.value)}
                    disabled={readonly}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {STORES_LIST.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    เป้ายอดขายจากกิจกรรม (บาท) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-semibold">
                      ฿
                    </span>
                    <input
                      type="number"
                      value={type9Sales}
                      onChange={(e) => setType9Sales(parseFloat(e.target.value) || 0)}
                      disabled={readonly}
                      className="w-full h-10 pl-7 pr-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    สินค้าที่จะขาย <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={type9Products}
                    onChange={(e) => setType9Products(e.target.value)}
                    disabled={readonly}
                    placeholder="เช่น สินค้า A, สินค้า B"
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Work Type 10: จัดงาน Field Day */}
          {selectedWorkTypes.includes("จัดงาน Field Day") && (
            <div className="bg-amber-50/40 border border-amber-200/80 rounded-xl p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                  <Sprout className="h-4 w-4 text-amber-600" />
                  <span>10. จัดงาน Field Day</span>
                </div>
                {!readonly && (
                  <button
                    type="button"
                    onClick={() => removeWorkType("จัดงาน Field Day")}
                    className="text-slate-400 hover:text-red-500 p-1 rounded-md transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    ชื่อแปลงสาธิต <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={type10DemoPlot}
                    onChange={(e) => setType10DemoPlot(e.target.value)}
                    disabled={readonly}
                    placeholder="เช่น แปลงสาธิตสวนทุเรียน..."
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    สถานที่จัดงาน <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={type10Location}
                    onChange={(e) => setType10Location(e.target.value)}
                    disabled={readonly}
                    placeholder="ระบุสถานที่จัดงาน..."
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    พืชเป้าหมายและสินค้าที่โชว์ผลงาน <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={type10Showcase}
                    onChange={(e) => setType10Showcase(e.target.value)}
                    disabled={readonly}
                    placeholder="เช่น ทุเรียน & ปุ๋ยทดสอบ"
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    เป้าหมายจำนวนผู้เข้าร่วม (คน) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={type10Attendees}
                    onChange={(e) => setType10Attendees(parseInt(e.target.value) || 0)}
                    disabled={readonly}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    เป้ายอดขายจองในงาน (ถ้ามี)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-semibold">
                      ฿
                    </span>
                    <input
                      type="number"
                      value={type10BookingSales}
                      onChange={(e) => setType10BookingSales(parseFloat(e.target.value) || 0)}
                      disabled={readonly}
                      className="w-full h-10 pl-7 pr-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Work Type 11: ตรวจเช็กสต็อกหน้าร้าน */}
          {selectedWorkTypes.includes("ตรวจเช็กสต็อกหน้าร้าน") && (
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                  <ClipboardList className="h-4 w-4 text-slate-600" />
                  <span>11. ตรวจเช็กสต็อกหน้าร้าน</span>
                </div>
                {!readonly && (
                  <button
                    type="button"
                    onClick={() => removeWorkType("ตรวจเช็กสต็อกหน้าร้าน")}
                    className="text-slate-400 hover:text-red-500 p-1 rounded-md transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  รายชื่อร้านค้า <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={type11Stores}
                  onChange={(e) => setType11Stores(e.target.value)}
                  disabled={readonly}
                  placeholder="เช่น ร้านทดสอบ สาขา 1, ร้านสหายพานิช"
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>
            </div>
          )}

          {/* Button: + เพิ่มประเภทงาน */}
          {!readonly && (
            <button
              type="button"
              onClick={() => setIsWorkTypesDropdownOpen(true)}
              className="w-full py-2.5 border border-dashed border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-semibold text-center flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="h-4 w-4 text-slate-500" />
              <span>เพิ่มประเภทงาน</span>
            </button>
          )}
        </div>
      </div>

      {/* SECTION 4: สถานที่และทีมงาน (Location & Team) */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden p-5 md:p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
            4
          </span>
          <h2 className="font-bold text-slate-800 text-base md:text-lg">
            สถานที่และทีมงาน (Location & Team)
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Col 1: รายละเอียดพื้นที่จัดกิจกรรม */}
          <div className="lg:col-span-5 space-y-1">
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              รายละเอียดพื้นที่จัดกิจกรรม <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={locationText}
              maxLength={500}
              onChange={(e) => setLocationText(e.target.value)}
              disabled={readonly}
              placeholder="ระบุที่อยู่และจุดสังเกต..."
              className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
            />
            <div className="text-right text-[11px] text-slate-400">
              {locationText.length}/500
            </div>
          </div>

          {/* Col 2: Map Preview */}
          <div className="lg:col-span-3">
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 text-center relative group">
              <div className="h-28 bg-emerald-100/50 flex flex-col items-center justify-center relative p-3">
                {/* Map Pin Mock visual */}
                <div className="w-7 h-7 rounded-full bg-red-500 text-white shadow-md flex items-center justify-center font-bold text-xs mb-1 animate-bounce">
                  <MapPin className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-semibold text-slate-700 bg-white/90 px-2 py-0.5 rounded shadow-sm max-w-full truncate">
                  {locationText || "หมุดสถานที่"}
                </span>
              </div>
              <button
                type="button"
                className="w-full py-2 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1 border-t border-slate-200 transition-colors"
              >
                <MapPin className="h-3.5 w-3.5 text-indigo-600" />
                <span>หมุดแผนที่</span>
              </button>
            </div>
          </div>

          {/* Col 3: ผู้ช่วยงานกิจกรรม */}
          <div className="lg:col-span-4 space-y-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              ผู้ช่วยงานกิจกรรม <span className="text-slate-400 text-[11px]">(เลือกได้หลายคน)</span>
            </label>

            {/* Employee helpers search and selection */}
            {!readonly && (
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อผู้ช่วย..."
                  value={helperSearch}
                  onChange={(e) => {
                    setHelperSearch(e.target.value);
                    setShowHelperDropdown(true);
                  }}
                  onFocus={() => setShowHelperDropdown(true)}
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {showHelperDropdown && helperSearch.trim() && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowHelperDropdown(false)}
                    />
                    <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl bg-white p-1 text-xs shadow-xl border border-slate-200">
                      {filteredEmployees.length === 0 ? (
                        <li className="p-2 text-slate-400 italic text-center">ไม่พบข้อมูล</li>
                      ) : (
                        filteredEmployees.map((emp) => (
                          <li
                            key={emp.id}
                            onClick={() => addHelper(emp.id)}
                            className="cursor-pointer p-2 hover:bg-blue-50 rounded-lg flex items-center justify-between"
                          >
                            <span className="font-medium text-slate-800">{emp.name}</span>
                            <span className="text-[10px] text-slate-400">
                              ({emp.positionTitle || "พนักงาน"})
                            </span>
                          </li>
                        ))
                      )}
                    </ul>
                  </>
                )}
              </div>
            )}

            {/* Selected Tags list */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {helperEmployeeIds.map((hid) => {
                const emp = employees.find((e) => e.id === hid);
                const empName = emp ? emp.name : "ผู้ช่วยงาน";
                return (
                  <span
                    key={hid}
                    className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200/80 text-slate-700 text-[11px] px-2.5 py-1 rounded-full font-medium"
                  >
                    <span>{empName}</span>
                    {!readonly && (
                      <button
                        type="button"
                        onClick={() => removeHelper(hid)}
                        className="hover:text-red-500 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                );
              })}

              {helperEmployeeIds.length === 0 && (
                <p className="text-xs text-slate-400 italic py-1">
                  ยังไม่ได้เลือกผู้ช่วยงาน
                </p>
              )}
            </div>

            <p className="text-[11px] text-slate-400 pt-0.5">
              ตำแหน่ง : ส่งเสริม, เซลล์ เท่านั้น
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 5: งบประมาณและค่าใช้จ่าย (Budget & Expenses) */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden p-5 md:p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
            5
          </span>
          <h2 className="font-bold text-slate-800 text-base md:text-lg">
            งบประมาณและค่าใช้จ่าย (Budget & Expenses)
          </h2>
        </div>

        {/* ประเภทงบ (Radio options) */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            ประเภทงบ <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { id: "NONE", label: "ไม่มีการเลือกงบ" },
              { id: "MARKETING", label: "งบการตลาด" },
              { id: "SALES_PROMOTION", label: "งบส่งเสริมการขาย" },
            ].map((option) => {
              const isSelected = budgetType === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => !readonly && setBudgetType(option.id as any)}
                  className={cn(
                    "flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-all text-left",
                    isSelected
                      ? "bg-emerald-50/60 border-emerald-500 text-emerald-800 shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0",
                      isSelected
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-slate-300 bg-white"
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ค่าใช้จ่ายอื่นๆ (นอกเหนือจากงบ) */}
        <div className="bg-slate-50/60 border border-slate-200/60 rounded-xl p-4 space-y-3">
          <p className="text-xs font-medium text-slate-600">
            ค่าใช้จ่ายอื่นๆ (นอกเหนือจากงบ)
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                จำนวนเงิน
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-semibold">
                  ฿
                </span>
                <input
                  type="number"
                  value={extraExpenseAmount}
                  onChange={(e) => setExtraExpenseAmount(parseFloat(e.target.value) || 0)}
                  disabled={readonly}
                  className="w-full h-9 pl-7 pr-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                รายละเอียด
              </label>
              <input
                type="text"
                value={extraExpenseDetail}
                onChange={(e) => setExtraExpenseDetail(e.target.value)}
                disabled={readonly}
                placeholder="เช่น ค่าผ่านทาง"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 6: รายการขอเบิกสินค้าจัดกิจกรรม (Material Requisition) */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
              6
            </span>
            <h2 className="font-bold text-slate-800 text-base md:text-lg">
              รายการขอเบิกสินค้าจัดกิจกรรม (Material Requisition)
            </h2>
          </div>

          {!readonly && (
            <Button
              type="button"
              size="sm"
              onClick={addRequisitionRow}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg h-8 px-3 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              เพิ่มรายการเบิก
            </Button>
          )}
        </div>

        {/* Requisition Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-2.5 px-3 text-center w-12">ลำดับ</th>
                <th className="py-2.5 px-3 min-w-[200px]">
                  รายการสินค้า <span className="text-red-500">*</span>
                </th>
                <th className="py-2.5 px-3 w-24">
                  จำนวน <span className="text-red-500">*</span>
                </th>
                <th className="py-2.5 px-3 w-28">หน่วยนับ</th>
                <th className="py-2.5 px-3 min-w-[200px]">รายละเอียด</th>
                {!readonly && <th className="py-2.5 px-3 text-center w-16">จัดการ</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {requisitionItems.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 px-3 text-center font-medium text-slate-500">
                    {index + 1}
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={item.productName}
                      onChange={(e) =>
                        updateRequisitionRow(item.id, "productName", e.target.value)
                      }
                      disabled={readonly}
                      placeholder="ชื่อสินค้า..."
                      className="w-full h-8 px-2.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        updateRequisitionRow(
                          item.id,
                          "quantity",
                          parseInt(e.target.value) || 0
                        )
                      }
                      disabled={readonly}
                      className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <select
                      value={item.unit}
                      onChange={(e) =>
                        updateRequisitionRow(item.id, "unit", e.target.value)
                      }
                      disabled={readonly}
                      className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {REQUISITION_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={item.detail}
                      onChange={(e) =>
                        updateRequisitionRow(item.id, "detail", e.target.value)
                      }
                      disabled={readonly}
                      placeholder="วัตถุประสงค์การใช้..."
                      className="w-full h-8 px-2.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  {!readonly && (
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => deleteRequisitionRow(item.id)}
                        className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 7: ข้อมูลเพิ่มเติม (Additional Info) */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden p-5 md:p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
            7
          </span>
          <h2 className="font-bold text-slate-800 text-base md:text-lg">
            ข้อมูลเพิ่มเติม (Additional Info)
          </h2>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700 mb-1">
            หมายเหตุเพิ่มเติม
          </label>
          <textarea
            rows={3}
            value={notes}
            maxLength={500}
            onChange={(e) => setNotes(e.target.value)}
            disabled={readonly}
            placeholder="ข้อมูลเพิ่มเติมอื่นๆ..."
            className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
          />
          <div className="text-right text-[11px] text-slate-400">
            {notes.length}/500
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="flex items-center justify-center gap-4 pt-4">
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="w-32 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-xl h-11 shadow-sm flex items-center justify-center gap-1.5"
          >
            <X className="h-4 w-4" />
            <span>ยกเลิก</span>
          </Button>
        )}

        {!readonly && (
          <Button
            type="submit"
            disabled={loading}
            className="w-32 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl h-11 shadow-md flex items-center justify-center gap-1.5"
          >
            <Check className="h-4 w-4 stroke-[3]" />
            <span>{loading ? "กำลังบันทึก..." : submitLabel}</span>
          </Button>
        )}
      </div>
    </form>
  );
}
