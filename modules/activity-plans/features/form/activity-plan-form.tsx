"use client";

import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  User,
  FileText,
  Plus,
  Trash2,
  Check,
  X,
  ChevronDown,
  Search,
  AlertCircle,
  Store,
  Sprout,
  ArrowLeft,
  Users,
  ShoppingCart,
  HelpCircle,
  CheckSquare,
  BarChart2,
  Receipt,
  ClipboardList,
  Package,
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
const DEMO_OWNERS = [
  "บริษัททดสอบ",
  "ร้านทดสอบ สาขา 1",
  "เกษตรกรตัวอย่าง 1",
  "ร้านสหายพานิช",
];
const DEMO_PRODUCTS = [
  "สินค้าทดสอบ A",
  "สินค้าทดสอบ B",
  "สินค้าทดสอบ C",
  "ปุ๋ยเคมีสูตรพิเศษ",
];
const DEMO_PRODUCT_PRICES: Record<string, number> = {
  "สินค้าทดสอบ A": 500,
  "สินค้าทดสอบ B": 750,
  "สินค้าทดสอบ C": 1200,
  "ปุ๋ยเคมีสูตรพิเศษ": 950,
};
const CROP_CATEGORIES = ["พืชไร่", "พืชสวน", "ผักและพืชล้มลุก"];
const TARGET_CROPS = [
  "ทุเรียน",
  "ข้าว",
  "มันสำปะหลัง",
  "ยางพารา",
  "อ้อย",
  "ส้ม",
];
const STORES_LIST = [
  "ร้านทดสอบ สาขา 1",
  "ร้านทดสอบ สาขา 2",
  "ร้านสหายพานิช จันทบุรี",
  "ร้านเกษตรพัฒนา",
];
const REQUISITION_UNITS = [
  "ขวด",
  "ซอง",
  "แผ่น",
  "กล่อง",
  "ชิ้น",
  "ถุง",
  "ชุด",
  "ม้วน",
];

interface RequisitionItem {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
  detail: string;
}

interface Type9ProductItem {
  id: string;
  productName: string;
  quantityCases: number;
  pricePerCase: number;
}

interface Type1VisitItem {
  id: string;
  customerName: string;
  topic: string;
  detail: string;
}

interface Type2ProductFollowupItem {
  id: string;
  productName: string;
  customerName: string;
  detail: string;
}

interface Type3SalesItem {
  id: string;
  productName: string;
  customerName: string;
  quantity: number;
  unitPrice: number;
  price: number;
  detail: string;
}

interface Type4CollectItem {
  id: string;
  customerName: string;
  collectAmount: number;
  detail: string;
}

interface Type5SurveyItem {
  id: string;
  competitorBrand: string;
  comparedProduct: string;
  storeCount: number;
  detail: string;
}

interface Type6IssueItem {
  id: string;
  customerName: string;
  issueType: string;
  detail: string;
}

interface Type7DemoPlotItem {
  id: string;
  ownerName: string;
  productName: string;
  cropCategory: string;
  cropName: string;
  plotsCount: number;
  detail: string;
}

interface Type8MeetingItem {
  id: string;
  topic: string;
  attendeesCount: number;
  detail: string;
}

interface MarketingBudgetProductItem {
  id: string;
  productName: string;
  quantityCases: number;
  pricePerCase: number;
}

interface SalesPromotionItem {
  id: string;
  budgetType: string;
  detail: string;
  amount: number;
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
    if (!date)
      return { dateStr: format(new Date(), "yyyy-MM-dd"), timeStr: "09:00" };
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime()))
      return { dateStr: format(new Date(), "yyyy-MM-dd"), timeStr: "09:00" };
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
    ? initial.activityType
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const [selectedWorkTypes, setSelectedWorkTypes] =
    useState<string[]>(initialTypes);
  const [isWorkTypesDropdownOpen, setIsWorkTypesDropdownOpen] = useState(false);
  const workTypesDropdownRef = useRef<HTMLDivElement>(null);

  // State for all 11 Work Type Objective Forms
  const [type1Topics, setType1Topics] = useState<string[]>([]);
  const [type1OtherTopic, setType1OtherTopic] = useState("");
  const [type1Customers, setType1Customers] = useState("");
  const [type1Detail, setType1Detail] = useState("");

  const [type2Items, setType2Items] = useState<Type2ProductFollowupItem[]>([
    {
      id: "1",
      productName: DEMO_PRODUCTS[0] || "",
      customerName: DEMO_OWNERS[0] || "",
      detail: "",
    },
  ]);

  const addType2Row = () => {
    const newItem: Type2ProductFollowupItem = {
      id: Date.now().toString(),
      productName: DEMO_PRODUCTS[0] || "",
      customerName: DEMO_OWNERS[0] || "",
      detail: "",
    };
    setType2Items((prev) => [...prev, newItem]);
  };

  const updateType2Row = (
    id: string,
    field: keyof Type2ProductFollowupItem,
    val: any,
  ) => {
    setType2Items((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)),
    );
  };

  const deleteType2Row = (id: string) => {
    setType2Items((prev) => prev.filter((item) => item.id !== id));
  };

  const defaultType3Product = DEMO_PRODUCTS[0] || "";
  const defaultType3UnitPrice = DEMO_PRODUCT_PRICES[defaultType3Product] ?? 500;

  const [type3Items, setType3Items] = useState<Type3SalesItem[]>([
    {
      id: "1",
      productName: defaultType3Product,
      customerName: DEMO_OWNERS[0] || "",
      quantity: 1,
      unitPrice: defaultType3UnitPrice,
      price: defaultType3UnitPrice * 1,
      detail: "",
    },
  ]);

  const addType3Row = () => {
    const prod = DEMO_PRODUCTS[0] || "";
    const uPrice = DEMO_PRODUCT_PRICES[prod] ?? 500;
    const newItem: Type3SalesItem = {
      id: Date.now().toString(),
      productName: prod,
      customerName: DEMO_OWNERS[0] || "",
      quantity: 1,
      unitPrice: uPrice,
      price: uPrice * 1,
      detail: "",
    };
    setType3Items((prev) => [...prev, newItem]);
  };

  const updateType3Row = (
    id: string,
    field: keyof Type3SalesItem,
    val: any,
  ) => {
    setType3Items((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: val };
        if (field === "productName" && DEMO_PRODUCT_PRICES[val] !== undefined) {
          updated.unitPrice = DEMO_PRODUCT_PRICES[val];
        }
        const qty = typeof updated.quantity === "number" ? updated.quantity : parseInt(updated.quantity) || 0;
        const uPrice = typeof updated.unitPrice === "number" ? updated.unitPrice : parseFloat(updated.unitPrice) || 0;
        updated.price = qty * uPrice;
        return updated;
      }),
    );
  };

  const deleteType3Row = (id: string) => {
    setType3Items((prev) => prev.filter((item) => item.id !== id));
  };

  // Work Type 4: วางบิล / เก็บเงิน
  const [type4Items, setType4Items] = useState<Type4CollectItem[]>([
    {
      id: "1",
      customerName: DEMO_OWNERS[0] || "",
      collectAmount: 0,
      detail: "",
    },
  ]);
  const addType4Row = () => {
    setType4Items((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        customerName: DEMO_OWNERS[0] || "",
        collectAmount: 0,
        detail: "",
      },
    ]);
  };
  const updateType4Row = (id: string, field: keyof Type4CollectItem, val: any) => {
    setType4Items((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)),
    );
  };
  const deleteType4Row = (id: string) => {
    setType4Items((prev) => prev.filter((item) => item.id !== id));
  };

  // Work Type 5: สำรวจตลาดของคู่แข่ง
  const [type5Items, setType5Items] = useState<Type5SurveyItem[]>([
    {
      id: "1",
      competitorBrand: "",
      comparedProduct: DEMO_PRODUCTS[0] || "",
      storeCount: 1,
      detail: "",
    },
  ]);
  const addType5Row = () => {
    setType5Items((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        competitorBrand: "",
        comparedProduct: DEMO_PRODUCTS[0] || "",
        storeCount: 1,
        detail: "",
      },
    ]);
  };
  const updateType5Row = (id: string, field: keyof Type5SurveyItem, val: any) => {
    setType5Items((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)),
    );
  };
  const deleteType5Row = (id: string) => {
    setType5Items((prev) => prev.filter((item) => item.id !== id));
  };

  // Work Type 6: แก้ปัญหา / รับเรื่องร้องเรียน
  const [type6Items, setType6Items] = useState<Type6IssueItem[]>([
    {
      id: "1",
      customerName: DEMO_OWNERS[0] || "",
      issueType: "เคลมของ",
      detail: "",
    },
  ]);
  const addType6Row = () => {
    setType6Items((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        customerName: DEMO_OWNERS[0] || "",
        issueType: "เคลมของ",
        detail: "",
      },
    ]);
  };
  const updateType6Row = (id: string, field: keyof Type6IssueItem, val: any) => {
    setType6Items((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)),
    );
  };
  const deleteType6Row = (id: string) => {
    setType6Items((prev) => prev.filter((item) => item.id !== id));
  };

  // Work Type 7: ติดตามแปลงสาธิต / พืชเป้าหมาย
  const [type7Items, setType7Items] = useState<Type7DemoPlotItem[]>([
    {
      id: "1",
      ownerName: DEMO_OWNERS[0] || "",
      productName: DEMO_PRODUCTS[0] || "",
      cropCategory: "ไม้ผล",
      cropName: "ทุเรียน",
      plotsCount: 1,
      detail: "",
    },
  ]);
  const addType7Row = () => {
    setType7Items((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        ownerName: DEMO_OWNERS[0] || "",
        productName: DEMO_PRODUCTS[0] || "",
        cropCategory: "ไม้ผล",
        cropName: "ทุเรียน",
        plotsCount: 1,
        detail: "",
      },
    ]);
  };
  const updateType7Row = (id: string, field: keyof Type7DemoPlotItem, val: any) => {
    setType7Items((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)),
    );
  };
  const deleteType7Row = (id: string) => {
    setType7Items((prev) => prev.filter((item) => item.id !== id));
  };

  // Work Type 8: จัดประชุมเกษตรกร / ร้านค้า
  const [type8Items, setType8Items] = useState<Type8MeetingItem[]>([
    {
      id: "1",
      topic: "",
      attendeesCount: 10,
      detail: "",
    },
  ]);
  const addType8Row = () => {
    setType8Items((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        topic: "",
        attendeesCount: 10,
        detail: "",
      },
    ]);
  };
  const updateType8Row = (id: string, field: keyof Type8MeetingItem, val: any) => {
    setType8Items((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)),
    );
  };
  const deleteType8Row = (id: string) => {
    setType8Items((prev) => prev.filter((item) => item.id !== id));
  };

  const [type9Store, setType9Store] = useState("");
  const [type9Sales, setType9Sales] = useState<number>(0);
  const [type9Products, setType9Products] = useState("");
  const [type9ProductItems, setType9ProductItems] = useState<
    Type9ProductItem[]
  >([
    {
      id: "1",
      productName: DEMO_PRODUCTS[0] || "สินค้าทดสอบ A",
      quantityCases: 10,
      pricePerCase: 500,
    },
  ]);

  const [type10DemoPlot, setType10DemoPlot] = useState("");
  const [type10Location, setType10Location] = useState("");
  const [type10Showcase, setType10Showcase] = useState("");
  const [type10Attendees, setType10Attendees] = useState<number>(0);
  const [type10BookingSales, setType10BookingSales] = useState<number>(0);

  const [type11Stores, setType11Stores] = useState("");

  // Section 4: Location & Team State
  const [locationText, setLocationText] = useState(initial.location ?? "");
  const [helperEmployeeIds, setHelperEmployeeIds] = useState<string[]>(
    initial.helperEmployeeIds ?? [],
  );
  const [helperSearch, setHelperSearch] = useState("");
  const [showHelperDropdown, setShowHelperDropdown] = useState(false);

  // Section 5: Budget & Expenses State
  const [isPromotionalMediaSelected, setIsPromotionalMediaSelected] =
    useState<boolean>((initial.marketingBudget ?? 0) > 0);
  const [marketingBudgetAmount, setMarketingBudgetAmount] = useState<number>(
    initial.marketingBudget ?? 10000,
  );
  const [marketingProductItems, setMarketingProductItems] = useState<
    MarketingBudgetProductItem[]
  >([
    {
      id: "1",
      productName: DEMO_PRODUCTS[0] || "สินค้าทดสอบ A",
      quantityCases: 10,
      pricePerCase: 500,
    },
  ]);

  const addMarketingProductItem = () => {
    const newItem: MarketingBudgetProductItem = {
      id: Date.now().toString(),
      productName: DEMO_PRODUCTS[0] || "",
      quantityCases: 1,
      pricePerCase: 0,
    };
    setMarketingProductItems((prev) => [...prev, newItem]);
  };

  const updateMarketingProductItem = (
    id: string,
    field: keyof MarketingBudgetProductItem,
    val: any,
  ) => {
    setMarketingProductItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)),
    );
  };

  const deleteMarketingProductItem = (id: string) => {
    setMarketingProductItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Section 5: Sales Promotion Items State & Helpers
  const [isSalesPromotionSelected, setIsSalesPromotionSelected] =
    useState<boolean>((initial.salesPromotionBudget ?? 0) > 0);
  const [salesPromotionItems, setSalesPromotionItems] = useState<
    SalesPromotionItem[]
  >([]);

  const addSalesPromotionRow = () => {
    const newItem: SalesPromotionItem = {
      id: Date.now().toString(),
      budgetType: "งบการตลาด",
      detail: "",
      amount: 0,
    };
    setSalesPromotionItems((prev) => [...prev, newItem]);
  };

  const updateSalesPromotionRow = (
    id: string,
    field: keyof SalesPromotionItem,
    val: any,
  ) => {
    setSalesPromotionItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)),
    );
  };

  const deleteSalesPromotionRow = (id: string) => {
    setSalesPromotionItems((prev) => prev.filter((item) => item.id !== id));
  };

  const [extraExpenseAmount, setExtraExpenseAmount] = useState<number>(0);
  const [extraExpenseDetail, setExtraExpenseDetail] = useState("");

  // Section 6: Material Requisition Items
  const [requisitionItems, setRequisitionItems] = useState<RequisitionItem[]>(
    [],
  );

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

  // Type 9 Store Promotion Product Table Helpers
  const addType9ProductItem = () => {
    const newItem: Type9ProductItem = {
      id: Date.now().toString(),
      productName: DEMO_PRODUCTS[0] || "",
      quantityCases: 1,
      pricePerCase: 0,
    };
    setType9ProductItems((prev) => [...prev, newItem]);
  };

  const updateType9ProductItem = (
    id: string,
    field: keyof Type9ProductItem,
    val: any,
  ) => {
    setType9ProductItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)),
    );
  };

  const deleteType9ProductItem = (id: string) => {
    setType9ProductItems((prev) => prev.filter((item) => item.id !== id));
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

  const updateRequisitionRow = (
    id: string,
    field: keyof RequisitionItem,
    val: any,
  ) => {
    setRequisitionItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)),
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
      const topicsText =
        type1Topics.join(", ") +
        (type1OtherTopic ? ` (${type1OtherTopic})` : "");
      summaryParts.push(
        `[เข้าพบร้านค้า/เกษตรกร] ประเด็น: ${topicsText} | ลูกค้า: ${type1Customers || "ไม่ระบุ"}${type1Detail ? ` | รายละเอียดเพิ่มเติม: ${type1Detail}` : ""}`,
      );
    }

    if (selectedWorkTypes.includes("ติดตามผลการใช้สินค้า")) {
      const followupSummary = type2Items
        .map(
          (item, i) =>
            `${i + 1}. สินค้า: ${item.productName} | ลูกค้า/ร้านค้า: ${item.customerName}${item.detail ? ` (${item.detail})` : ""}`,
        )
        .join(", ");
      summaryParts.push(
        `[ติดตามผลการใช้สินค้า] รายการติดตาม (${type2Items.length} รายการ): ${followupSummary || "ไม่มีรายการ"}`,
      );
    }

    if (selectedWorkTypes.includes("เสนอขายสินค้า")) {
      const salesSummary = type3Items
        .map(
          (item, i) =>
            `${i + 1}. สินค้า: ${item.productName} | ลูกค้า/ร้านค้า: ${item.customerName} | จำนวน: ${item.quantity} | ราคา/หน่วย: ฿${(item.unitPrice || 0).toLocaleString()} | ราคารวม: ฿${((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString()}${item.detail ? ` (${item.detail})` : ""}`,
        )
        .join(", ");
      summaryParts.push(
        `[เสนอขายสินค้า] รายการเสนอขาย (${type3Items.length} รายการ): ${salesSummary || "ไม่มีรายการ"}`,
      );
    }

    if (selectedWorkTypes.includes("วางบิล / เก็บเงิน")) {
      const collectSummary = type4Items
        .map(
          (item, i) =>
            `${i + 1}. ลูกค้า: ${item.customerName} | เป้ายอดเก็บเงิน: ฿${(item.collectAmount || 0).toLocaleString()}${item.detail ? ` (${item.detail})` : ""}`,
        )
        .join(", ");
      summaryParts.push(
        `[วางบิล/เก็บเงิน] รายการวางบิล (${type4Items.length} รายการ): ${collectSummary || "ไม่มีรายการ"}`,
      );
    }

    if (selectedWorkTypes.includes("สำรวจตลาดของคู่แข่ง")) {
      const surveySummary = type5Items
        .map(
          (item, i) =>
            `${i + 1}. แบรนด์: ${item.competitorBrand} | สินค้าเทียบ: ${item.comparedProduct} | เป้าหมายร้านค้า: ${item.storeCount} แห่ง${item.detail ? ` (${item.detail})` : ""}`,
        )
        .join(", ");
      summaryParts.push(
        `[สำรวจตลาดคู่แข่ง] รายการสำรวจ (${type5Items.length} รายการ): ${surveySummary || "ไม่มีรายการ"}`,
      );
    }

    if (selectedWorkTypes.includes("แก้ปัญหา / รับเรื่องร้องเรียน")) {
      const issueSummary = type6Items
        .map(
          (item, i) =>
            `${i + 1}. ลูกค้า: ${item.customerName} | ประเภทปัญหา: ${item.issueType}${item.detail ? ` (${item.detail})` : ""}`,
        )
        .join(", ");
      summaryParts.push(
        `[แก้ปัญหา/ร้องเรียน] รายการร้องเรียน (${type6Items.length} รายการ): ${issueSummary || "ไม่มีรายการ"}`,
      );
    }

    if (selectedWorkTypes.includes("ติดตามแปลงสาธิต / พืชเป้าหมาย")) {
      const demoSummary = type7Items
        .map(
          (item, i) =>
            `${i + 1}. เจ้าของ: ${item.ownerName} | สินค้า: ${item.productName} | หมวดพืช: ${item.cropCategory} (${item.cropName}) | จำนวน: ${item.plotsCount} แปลง/ต้น${item.detail ? ` (${item.detail})` : ""}`,
        )
        .join(", ");
      summaryParts.push(
        `[ติดตามแปลงสาธิต] รายการแปลงสาธิต (${type7Items.length} รายการ): ${demoSummary || "ไม่มีรายการ"}`,
      );
    }

    if (
      selectedWorkTypes.includes("จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์")
    ) {
      const meetingSummary = type8Items
        .map(
          (item, i) =>
            `${i + 1}. หัวข้อ: ${item.topic} | ผู้เข้าร่วม: ${item.attendeesCount} คน${item.detail ? ` (${item.detail})` : ""}`,
        )
        .join(", ");
      summaryParts.push(
        `[จัดประชุม] รายการประชุม (${type8Items.length} รายการ): ${meetingSummary || "ไม่มีรายการ"}`,
      );
    }

    if (selectedWorkTypes.includes("จัดกิจกรรมส่งเสริมการขายหน้าร้าน")) {
      const itemsText = type9ProductItems
        .map(
          (item, i) =>
            `${i + 1}. ${item.productName} (${item.quantityCases} ลัง @ ฿${item.pricePerCase.toLocaleString()}/ลัง = ฿${(item.quantityCases * item.pricePerCase).toLocaleString()})`,
        )
        .join(", ");
      const calculatedSales = type9ProductItems.reduce(
        (sum, item) =>
          sum + (item.quantityCases || 0) * (item.pricePerCase || 0),
        0,
      );
      const finalSales = calculatedSales > 0 ? calculatedSales : type9Sales;
      summaryParts.push(
        `[กิจกรรมหน้าร้าน] ร้านค้า: ${type9Store} | เป้ายอดขายรวม: ${finalSales.toLocaleString()} บาท | สินค้า: ${itemsText || type9Products || "ไม่ระบุ"}`,
      );
    }

    if (selectedWorkTypes.includes("จัดงาน Field Day")) {
      summaryParts.push(
        `[Field Day] แปลงสาธิต: ${type10DemoPlot} | สถานที่: ${type10Location} | สินค้าโชว์: ${type10Showcase} | เป้าผู้ร่วมงาน: ${type10Attendees} คน | เป้ายอดจอง: ${type10BookingSales.toLocaleString()} บาท`,
      );
    }

    if (selectedWorkTypes.includes("ตรวจเช็กสต็อกหน้าร้าน")) {
      summaryParts.push(`[ตรวจเช็กสต็อก] ร้านค้า: ${type11Stores}`);
    }

    const compiledObjective = summaryParts.join("\n") || title;

    // Serialize materials & sales promotions into description
    const salesPromotionSummary = salesPromotionItems
      .map(
        (item, i) =>
          `${i + 1}. [${item.budgetType || "งบการตลาด"}] ${item.detail} - ฿${(item.amount || 0).toLocaleString()}`,
      )
      .join("\n");

    const materialSummary = requisitionItems
      .map(
        (item, i) =>
          `${i + 1}. ${item.productName} (${item.quantity} ${item.unit}) - ${item.detail}`,
      )
      .join("\n");
    const compiledDescription = `[วัตถุประสงค์งาน]\n${compiledObjective}${salesPromotionSummary ? `\n\n[รายการส่งเสริมการขาย]\n${salesPromotionSummary}` : ""}\n\n[รายการขอเบิกสินค้า]\n${materialSummary}`;

    // Budgets mapping
    const salesPromotionBudget: number | null = null;
    let marketingBudget: number | null = null;

    const calculatedMarketingSum = marketingProductItems.reduce(
      (sum, item) => sum + (item.quantityCases || 0) * (item.pricePerCase || 0),
      0,
    );

    if (isPromotionalMediaSelected) {
      marketingBudget =
        marketingProductItems.length > 0
          ? calculatedMarketingSum
          : marketingBudgetAmount > 0
            ? marketingBudgetAmount
            : 10000;
    }

    const hasLocationRequirement = selectedWorkTypes.some((t) =>
      [
        "จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์",
        "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
        "จัดงาน Field Day",
      ].includes(t),
    );

    if (hasLocationRequirement && !locationText.trim()) {
      setError("กรุณากรอกรายละเอียดพื้นที่จัดกิจกรรม");
      setLoading(false);
      return;
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
        location: hasLocationRequirement
          ? locationText
          : locationText.trim() || "ไม่ระบุสถานที่",
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
                ผู้รับผิดชอบ{" "}
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
              <p className="text-xs font-medium text-slate-400">เลขที่แผน </p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
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
          {/* ประเภทงาน (เลือกได้มากกว่า 1) */}
          <div className="relative" ref={workTypesDropdownRef}>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              ประเภทงาน{" "}
              <span className="text-slate-400 text-[11px]">
                (เลือกได้มากกว่า 1)
              </span>{" "}
              <span className="text-red-500">*</span>
            </label>

            {/* Input Trigger Field */}
            <div
              onClick={() =>
                !readonly &&
                setIsWorkTypesDropdownOpen(!isWorkTypesDropdownOpen)
              }
              className={cn(
                "min-h-[40px] w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm flex flex-wrap items-center gap-1.5 cursor-pointer hover:border-slate-300 focus-within:ring-2 focus-within:ring-blue-500 transition-all",
                readonly && "cursor-not-allowed bg-slate-50",
              )}
            >
              {selectedWorkTypes.length === 0 ? (
                <span className="text-slate-400 text-xs px-1">
                  เลือกประเภทงาน...
                </span>
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
                            : "hover:bg-slate-50 text-slate-700",
                        )}
                      >
                        <div
                          className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0",
                            isChecked
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-slate-300 bg-white",
                          )}
                        >
                          {isChecked && (
                            <Check className="h-3 w-3 stroke-[3]" />
                          )}
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
        </div>

        {/* Warning alert banner */}
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 md:p-3.5 flex items-center gap-3 text-amber-800 text-xs md:text-sm">
          <div className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
            !
          </div>
          <p className="font-medium">
            เลือกประเภทงานได้หลากหลาย
            ระบบจะแสดงฟอร์มวัตถุประสงค์ตามประเภทงานที่เลือก
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
                  <span>เข้าพบร้านค้า / เกษตรกร</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    รายชื่อลูกค้า / ร้านค้า{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={type1Customers}
                    onChange={(e) => setType1Customers(e.target.value)}
                    disabled={readonly}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                  >
                    <option value="">-- เลือกร้านค้า / เกษตรกร --</option>
                    {DEMO_OWNERS.map((owner) => (
                      <option key={owner} value={owner}>
                        {owner}
                      </option>
                    ))}
                  </select>
                </div>
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
                                : "border-slate-300 bg-white",
                            )}
                          >
                            {isChecked && (
                              <Check className="h-3 w-3 stroke-[3]" />
                            )}
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
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  รายละเอียดเพิ่มเติม
                </label>
                <input
                  type="text"
                  value={type1Detail}
                  onChange={(e) => setType1Detail(e.target.value)}
                  disabled={readonly}
                  placeholder="ระบุรายละเอียดเพิ่มเติม..."
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          )}

          {/* Work Type 2: ติดตามผลการใช้สินค้า */}
          {selectedWorkTypes.includes("ติดตามผลการใช้สินค้า") && (
            <div className="bg-indigo-50/40 border border-indigo-200/80 rounded-xl p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-200/60 pb-2.5">
                <div className="flex items-center gap-2 text-indigo-800 font-bold text-sm">
                  <CheckSquare className="h-4 w-4 text-indigo-600" />
                  <span>ติดตามผลการใช้สินค้า</span>
                </div>

                {!readonly && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={addType2Row}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    เพิ่มรายการ
                  </Button>
                )}
              </div>

              {/* Dynamic Follow-up Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-12">ลำดับ</th>
                      <th className="py-2.5 px-3 min-w-[180px]">
                        เลือกสินค้าที่ต้องการติดตามผล{" "}
                        <span className="text-red-500">*</span>
                      </th>
                      <th className="py-2.5 px-3 min-w-[200px]">
                        รายชื่อลูกค้า / ร้านค้า / เจ้าของแปลง{" "}
                        <span className="text-red-500">*</span>
                      </th>
                      <th className="py-2.5 px-3 min-w-[200px]">
                        รายละเอียดเพิ่มเติม
                      </th>
                      {!readonly && (
                        <th className="py-2.5 px-3 text-center w-16">จัดการ</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {type2Items.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-4 text-center text-slate-400 italic"
                        >
                          ยังไม่มีรายการติดตามผล กด "เพิ่มรายการ" เพื่อบันทึก
                        </td>
                      </tr>
                    ) : (
                      type2Items.map((item, index) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="py-2.5 px-3 text-center font-medium text-slate-500">
                            {index + 1}
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={item.productName}
                              onChange={(e) =>
                                updateType2Row(
                                  item.id,
                                  "productName",
                                  e.target.value,
                                )
                              }
                              disabled={readonly}
                              className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                            >
                              {DEMO_PRODUCTS.map((prod) => (
                                <option key={prod} value={prod}>
                                  {prod}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={item.customerName}
                              onChange={(e) =>
                                updateType2Row(
                                  item.id,
                                  "customerName",
                                  e.target.value,
                                )
                              }
                              disabled={readonly}
                              className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                            >
                              <option value="">
                                -- เลือกร้านค้า / เจ้าของแปลง --
                              </option>
                              {DEMO_OWNERS.map((owner) => (
                                <option key={owner} value={owner}>
                                  {owner}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.detail}
                              onChange={(e) =>
                                updateType2Row(
                                  item.id,
                                  "detail",
                                  e.target.value,
                                )
                              }
                              disabled={readonly}
                              placeholder="ระบุรายละเอียดการติดตาม..."
                              className="w-full h-8 px-2.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </td>
                          {!readonly && (
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => deleteType2Row(item.id)}
                                className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Work Type 3: เสนอขายสินค้า */}
          {selectedWorkTypes.includes("เสนอขายสินค้า") && (
            <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-xl p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2.5">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <ShoppingCart className="h-4 w-4 text-emerald-600" />
                  <span>เสนอขายสินค้า</span>
                </div>

                {!readonly && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={addType3Row}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    เพิ่มรายการ
                  </Button>
                )}
              </div>

              {/* Dynamic Sales Proposal Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-12">ลำดับ</th>
                      <th className="py-2.5 px-3 min-w-[160px]">
                        สินค้าที่จะเสนอขาย{" "}
                        <span className="text-red-500">*</span>
                      </th>
                      <th className="py-2.5 px-3 min-w-[160px]">
                        รายชื่อลูกค้า / ร้านค้า / เจ้าของแปลง{" "}
                        <span className="text-red-500">*</span>
                      </th>
                      <th className="py-2.5 px-3 w-20 text-center">
                        จำนวน <span className="text-red-500">*</span>
                      </th>
                      <th className="py-2.5 px-3 w-28 text-center">
                        ราคา/หน่วย (บาท) <span className="text-red-500">*</span>
                      </th>
                      <th className="py-2.5 px-3 w-32 text-right">
                        ราคา (บาท)
                      </th>
                      <th className="py-2.5 px-3 min-w-[160px]">
                        รายละเอียดเพิ่มเติม
                      </th>
                      {!readonly && (
                        <th className="py-2.5 px-3 text-center w-16">จัดการ</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {type3Items.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="py-4 text-center text-slate-400 italic"
                        >
                          ยังไม่มีรายการเสนอขาย กด "เพิ่มรายการ" เพื่อบันทึก
                        </td>
                      </tr>
                    ) : (
                      type3Items.map((item, index) => {
                        const calculatedTotalPrice =
                          (item.quantity || 0) * (item.unitPrice || 0);
                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="py-2.5 px-3 text-center font-medium text-slate-500">
                              {index + 1}
                            </td>
                            <td className="py-2 px-3">
                              <select
                                value={item.productName}
                                onChange={(e) =>
                                  updateType3Row(
                                    item.id,
                                    "productName",
                                    e.target.value,
                                  )
                                }
                                disabled={readonly}
                                className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                              >
                                {DEMO_PRODUCTS.map((prod) => (
                                  <option key={prod} value={prod}>
                                    {prod}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-3">
                              <select
                                value={item.customerName}
                                onChange={(e) =>
                                  updateType3Row(
                                    item.id,
                                    "customerName",
                                    e.target.value,
                                  )
                                }
                                disabled={readonly}
                                className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                              >
                                <option value="">
                                  -- เลือกร้านค้า / เจ้าของแปลง --
                                </option>
                                {DEMO_OWNERS.map((owner) => (
                                  <option key={owner} value={owner}>
                                    {owner}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) =>
                                  updateType3Row(
                                    item.id,
                                    "quantity",
                                    parseInt(e.target.value) || 0,
                                  )
                                }
                                disabled={readonly}
                                className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <div className="relative">
                                <span className="absolute left-2.5 top-2 text-slate-400 text-[11px]">
                                  ฿
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  value={item.unitPrice}
                                  onChange={(e) =>
                                    updateType3Row(
                                      item.id,
                                      "unitPrice",
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                  disabled={readonly}
                                  placeholder="0"
                                  className="w-full h-8 pl-6 pr-2 rounded-md border border-slate-200 text-xs text-slate-800 text-right font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                              </div>
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-emerald-700">
                              ฿ {calculatedTotalPrice.toLocaleString()}
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={item.detail}
                                onChange={(e) =>
                                  updateType3Row(
                                    item.id,
                                    "detail",
                                    e.target.value,
                                  )
                                }
                                disabled={readonly}
                                placeholder="ระบุรายละเอียด..."
                                className="w-full h-8 px-2.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </td>
                            {!readonly && (
                              <td className="py-2 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => deleteType3Row(item.id)}
                                  className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {type3Items.length > 0 && (
                    <tfoot className="bg-emerald-50/80 border-t-2 border-emerald-200 text-xs font-bold text-emerald-900">
                      <tr>
                        <td colSpan={5} className="py-2.5 px-3 text-right">
                          รวมราคาเสนอขายทั้งสิ้น:
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-700 font-extrabold">
                          ฿{" "}
                          {type3Items
                            .reduce(
                              (sum, item) =>
                                sum + (item.quantity || 0) * (item.unitPrice || 0),
                              0,
                            )
                            .toLocaleString()}
                        </td>
                        <td colSpan={readonly ? 2 : 1}></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* Work Type 4: วางบิล / เก็บเงิน */}
          {selectedWorkTypes.includes("วางบิล / เก็บเงิน") && (
            <div className="bg-amber-50/40 border border-amber-200/80 rounded-xl p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                  <Receipt className="h-4 w-4 text-amber-600" />
                  <span>วางบิล / เก็บเงิน</span>
                </div>

                {!readonly && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={addType4Row}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    เพิ่มรายการ
                  </Button>
                )}
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-12">ลำดับ</th>
                      <th className="py-2.5 px-3 min-w-[180px]">
                        รายชื่อลูกค้า / ร้านค้า <span className="text-red-500">*</span>
                      </th>
                      <th className="py-2.5 px-3 w-36 text-center">
                        เป้ายอดเก็บเงิน (บาท) <span className="text-red-500">*</span>
                      </th>
                      <th className="py-2.5 px-3 min-w-[180px]">รายละเอียดเพิ่มเติม</th>
                      {!readonly && (
                        <th className="py-2.5 px-3 text-center w-16">จัดการ</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {type4Items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-slate-400 italic">
                          ยังไม่มีรายการวางบิล กด "เพิ่มรายการ" เพื่อบันทึก
                        </td>
                      </tr>
                    ) : (
                      type4Items.map((item, index) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 px-3 text-center font-medium text-slate-500">
                            {index + 1}
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={item.customerName}
                              onChange={(e) =>
                                updateType4Row(item.id, "customerName", e.target.value)
                              }
                              disabled={readonly}
                              className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                            >
                              <option value="">-- เลือกร้านค้า --</option>
                              {DEMO_OWNERS.map((owner) => (
                                <option key={owner} value={owner}>
                                  {owner}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <div className="relative">
                              <span className="absolute left-2.5 top-2 text-slate-400 text-[11px]">
                                ฿
                              </span>
                              <input
                                type="number"
                                min={0}
                                value={item.collectAmount}
                                onChange={(e) =>
                                  updateType4Row(
                                    item.id,
                                    "collectAmount",
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                disabled={readonly}
                                placeholder="0"
                                className="w-full h-8 pl-6 pr-2 rounded-md border border-slate-200 text-xs text-slate-800 text-right font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                              />
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.detail}
                              onChange={(e) =>
                                updateType4Row(item.id, "detail", e.target.value)
                              }
                              disabled={readonly}
                              placeholder="ระบุรายละเอียด..."
                              className="w-full h-8 px-2.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                          </td>
                          {!readonly && (
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => deleteType4Row(item.id)}
                                className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                  {type4Items.length > 0 && (
                    <tfoot className="bg-amber-50/80 border-t-2 border-amber-200 text-xs font-bold text-amber-900">
                      <tr>
                        <td colSpan={2} className="py-2.5 px-3 text-right">
                          รวมเป้ายอดเก็บเงินทั้งสิ้น:
                        </td>
                        <td className="py-2.5 px-3 text-right text-amber-700 font-extrabold">
                          ฿ {type4Items
                            .reduce((sum, item) => sum + (item.collectAmount || 0), 0)
                            .toLocaleString()}
                        </td>
                        <td colSpan={readonly ? 2 : 1}></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* Work Type 5: สำรวจตลาดของคู่แข่ง */}
          {selectedWorkTypes.includes("สำรวจตลาดของคู่แข่ง") && (
            <div className="bg-purple-50/40 border border-purple-200/80 rounded-xl p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-purple-200/60 pb-2.5">
                <div className="flex items-center gap-2 text-purple-800 font-bold text-sm">
                  <BarChart2 className="h-4 w-4 text-purple-600" />
                  <span>สำรวจตลาดของคู่แข่ง</span>
                </div>

                {!readonly && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={addType5Row}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    เพิ่มรายการ
                  </Button>
                )}
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-12">ลำดับ</th>
                      <th className="py-2.5 px-3 min-w-[160px]">
                        แบรนด์คู่แข่ง <span className="text-red-500">*</span>
                      </th>
                      <th className="py-2.5 px-3 min-w-[180px]">
                        สินค้าที่นำไปเปรียบเทียบ <span className="text-red-500">*</span>
                      </th>
                      <th className="py-2.5 px-3 w-32 text-center">
                        เป้าร้านค้า (แห่ง) <span className="text-red-500">*</span>
                      </th>
                      <th className="py-2.5 px-3 min-w-[180px]">รายละเอียดเพิ่มเติม</th>
                      {!readonly && (
                        <th className="py-2.5 px-3 text-center w-16">จัดการ</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {type5Items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-slate-400 italic">
                          ยังไม่มีรายการสำรวจ กด "เพิ่มรายการ" เพื่อบันทึก
                        </td>
                      </tr>
                    ) : (
                      type5Items.map((item, index) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 px-3 text-center font-medium text-slate-500">
                            {index + 1}
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.competitorBrand}
                              onChange={(e) =>
                                updateType5Row(item.id, "competitorBrand", e.target.value)
                              }
                              disabled={readonly}
                              placeholder="เช่น แบรนด์ X"
                              className="w-full h-8 px-2.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={item.comparedProduct}
                              onChange={(e) =>
                                updateType5Row(item.id, "comparedProduct", e.target.value)
                              }
                              disabled={readonly}
                              className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                            >
                              {DEMO_PRODUCTS.map((prod) => (
                                <option key={prod} value={prod}>
                                  {prod}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min={1}
                              value={item.storeCount}
                              onChange={(e) =>
                                updateType5Row(item.id, "storeCount", parseInt(e.target.value) || 0)
                              }
                              disabled={readonly}
                              className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.detail}
                              onChange={(e) =>
                                updateType5Row(item.id, "detail", e.target.value)
                              }
                              disabled={readonly}
                              placeholder="ระบุรายละเอียด..."
                              className="w-full h-8 px-2.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </td>
                          {!readonly && (
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => deleteType5Row(item.id)}
                                className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Work Type 6: แก้ปัญหา / รับเรื่องร้องเรียน */}
          {selectedWorkTypes.includes("แก้ปัญหา / รับเรื่องร้องเรียน") && (
            <div className="bg-rose-50/40 border border-rose-200/80 rounded-xl p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-rose-200/60 pb-2.5">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                  <HelpCircle className="h-4 w-4 text-rose-600" />
                  <span>แก้ปัญหา / รับเรื่องร้องเรียน</span>
                </div>

                {!readonly && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={addType6Row}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    เพิ่มรายการ
                  </Button>
                )}
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-12">ลำดับ</th>
                      <th className="py-2.5 px-3 min-w-[180px]">
                        รายชื่อลูกค้า / ร้านค้า <span className="text-red-500">*</span>
                      </th>
                      <th className="py-2.5 px-3 min-w-[160px]">
                        ประเภทปัญหา <span className="text-red-500">*</span>
                      </th>
                      <th className="py-2.5 px-3 min-w-[200px]">รายละเอียดเพิ่มเติม</th>
                      {!readonly && (
                        <th className="py-2.5 px-3 text-center w-16">จัดการ</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {type6Items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-slate-400 italic">
                          ยังไม่มีรายการร้องเรียน กด "เพิ่มรายการ" เพื่อบันทึก
                        </td>
                      </tr>
                    ) : (
                      type6Items.map((item, index) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 px-3 text-center font-medium text-slate-500">
                            {index + 1}
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={item.customerName}
                              onChange={(e) =>
                                updateType6Row(item.id, "customerName", e.target.value)
                              }
                              disabled={readonly}
                              className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                            >
                              <option value="">-- เลือกร้านค้า / เกษตรกร --</option>
                              {DEMO_OWNERS.map((owner) => (
                                <option key={owner} value={owner}>
                                  {owner}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={item.issueType}
                              onChange={(e) =>
                                updateType6Row(item.id, "issueType", e.target.value)
                              }
                              disabled={readonly}
                              className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                            >
                              <option value="เคลมของ">เคลมของ</option>
                              <option value="ฉีดยาแล้วพืชเสียหาย">
                                ฉีดยาแล้วพืชเสียหาย
                              </option>
                              <option value="อื่นๆ">อื่นๆ</option>
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.detail}
                              onChange={(e) =>
                                updateType6Row(item.id, "detail", e.target.value)
                              }
                              disabled={readonly}
                              placeholder="ระบุรายละเอียด..."
                              className="w-full h-8 px-2.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                            />
                          </td>
                          {!readonly && (
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => deleteType6Row(item.id)}
                                className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Work Type 7: ติดตามแปลงสาธิต / พืชเป้าหมาย */}
          {selectedWorkTypes.includes("ติดตามแปลงสาธิต / พืชเป้าหมาย") && (
            <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-xl p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2.5">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <Sprout className="h-4 w-4 text-emerald-600" />
                  <span>ติดตามแปลงสาธิต / พืชเป้าหมาย</span>
                </div>

                {!readonly && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={addType7Row}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    เพิ่มรายการ
                  </Button>
                )}
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-12">ลำดับ</th>
                      <th className="py-2.5 px-3 min-w-[160px]">
                        เจ้าของแปลง <span className="text-red-500">*</span>
                      </th>
                      <th className="py-2.5 px-3 min-w-[160px]">
                        สินค้าที่จะสาธิต <span className="text-red-500">*</span>
                      </th>
                      <th className="py-2.5 px-3 min-w-[120px]">หมวดพืช</th>
                      <th className="py-2.5 px-3 min-w-[120px]">ชื่อพืช</th>
                      <th className="py-2.5 px-3 w-28 text-center">
                        แปลง/ต้น <span className="text-red-500">*</span>
                      </th>
                      <th className="py-2.5 px-3 min-w-[160px]">รายละเอียดเพิ่มเติม</th>
                      {!readonly && (
                        <th className="py-2.5 px-3 text-center w-16">จัดการ</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {type7Items.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-4 text-center text-slate-400 italic">
                          ยังไม่มีรายการแปลงสาธิต กด "เพิ่มรายการ" เพื่อบันทึก
                        </td>
                      </tr>
                    ) : (
                      type7Items.map((item, index) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 px-3 text-center font-medium text-slate-500">
                            {index + 1}
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={item.ownerName}
                              onChange={(e) =>
                                updateType7Row(item.id, "ownerName", e.target.value)
                              }
                              disabled={readonly}
                              className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                            >
                              {DEMO_OWNERS.map((owner) => (
                                <option key={owner} value={owner}>
                                  {owner}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={item.productName}
                              onChange={(e) =>
                                updateType7Row(item.id, "productName", e.target.value)
                              }
                              disabled={readonly}
                              className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                            >
                              {DEMO_PRODUCTS.map((prod) => (
                                <option key={prod} value={prod}>
                                  {prod}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={item.cropCategory}
                              onChange={(e) =>
                                updateType7Row(item.id, "cropCategory", e.target.value)
                              }
                              disabled={readonly}
                              className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                            >
                              {CROP_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={item.cropName}
                              onChange={(e) =>
                                updateType7Row(item.id, "cropName", e.target.value)
                              }
                              disabled={readonly}
                              className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                            >
                              {TARGET_CROPS.map((crop) => (
                                <option key={crop} value={crop}>
                                  {crop}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min={1}
                              value={item.plotsCount}
                              onChange={(e) =>
                                updateType7Row(item.id, "plotsCount", parseInt(e.target.value) || 0)
                              }
                              disabled={readonly}
                              className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.detail}
                              onChange={(e) =>
                                updateType7Row(item.id, "detail", e.target.value)
                              }
                              disabled={readonly}
                              placeholder="ระบุรายละเอียด..."
                              className="w-full h-8 px-2.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </td>
                          {!readonly && (
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => deleteType7Row(item.id)}
                                className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Work Type 8: จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์ */}
          {selectedWorkTypes.includes(
            "จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์",
          ) && (
            <div className="bg-blue-50/40 border border-blue-200/80 rounded-xl p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-blue-200/60 pb-2.5">
                <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span>จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์</span>
                </div>

                {!readonly && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={addType8Row}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    เพิ่มรายการ
                  </Button>
                )}
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-12">ลำดับ</th>
                      <th className="py-2.5 px-3 min-w-[200px]">
                        หัวข้อที่จะประชุม <span className="text-red-500">*</span>
                      </th>
                      <th className="py-2.5 px-3 w-36 text-center">
                        เป้าหมายผู้เข้าร่วม (คน) <span className="text-red-500">*</span>
                      </th>
                      <th className="py-2.5 px-3 min-w-[180px]">รายละเอียดเพิ่มเติม</th>
                      {!readonly && (
                        <th className="py-2.5 px-3 text-center w-16">จัดการ</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {type8Items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-slate-400 italic">
                          ยังไม่มีรายการประชุม กด "เพิ่มรายการ" เพื่อบันทึก
                        </td>
                      </tr>
                    ) : (
                      type8Items.map((item, index) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 px-3 text-center font-medium text-slate-500">
                            {index + 1}
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.topic}
                              onChange={(e) =>
                                updateType8Row(item.id, "topic", e.target.value)
                              }
                              disabled={readonly}
                              placeholder="เช่น ประชุมวางแผนฤดูกาลเพาะปลูก"
                              className="w-full h-8 px-2.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min={1}
                              value={item.attendeesCount}
                              onChange={(e) =>
                                updateType8Row(item.id, "attendeesCount", parseInt(e.target.value) || 0)
                              }
                              disabled={readonly}
                              className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.detail}
                              onChange={(e) =>
                                updateType8Row(item.id, "detail", e.target.value)
                              }
                              disabled={readonly}
                              placeholder="ระบุรายละเอียด..."
                              className="w-full h-8 px-2.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          {!readonly && (
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => deleteType8Row(item.id)}
                                className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                  {type8Items.length > 0 && (
                    <tfoot className="bg-blue-50/80 border-t-2 border-blue-200 text-xs font-bold text-blue-900">
                      <tr>
                        <td colSpan={2} className="py-2.5 px-3 text-right">
                          รวมเป้าหมายผู้เข้าร่วมทั้งสิ้น:
                        </td>
                        <td className="py-2.5 px-3 text-center text-blue-700 font-extrabold">
                          {type8Items
                            .reduce((sum, item) => sum + (item.attendeesCount || 0), 0)
                            .toLocaleString()}{" "}
                          คน
                        </td>
                        <td colSpan={readonly ? 2 : 1}></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* Work Type 9: จัดกิจกรรมส่งเสริมการขายหน้าร้าน */}
          {selectedWorkTypes.includes("จัดกิจกรรมส่งเสริมการขายหน้าร้าน") && (
            <div className="bg-teal-50/40 border border-teal-200/80 rounded-xl p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-teal-200/60 pb-2.5">
                <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                  <Store className="h-4 w-4 text-teal-600" />
                  <span>จัดกิจกรรมส่งเสริมการขายหน้าร้าน</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    เป้ายอดขายรวมจากกิจกรรม (บาท){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-semibold">
                      ฿
                    </span>
                    <input
                      type="number"
                      value={
                        type9ProductItems.length > 0
                          ? type9ProductItems.reduce(
                              (sum, item) =>
                                sum +
                                (item.quantityCases || 0) *
                                  (item.pricePerCase || 0),
                              0,
                            )
                          : type9Sales
                      }
                      onChange={(e) =>
                        setType9Sales(parseFloat(e.target.value) || 0)
                      }
                      disabled={readonly || type9ProductItems.length > 0}
                      className="w-full h-10 pl-7 pr-3 rounded-lg border border-slate-200 bg-white text-xs font-bold text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Table / List of Products */}
              <div className="space-y-3 pt-2 border-t border-teal-200/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Package className="h-4 w-4 text-teal-600" />
                    รายการสินค้าที่เสนอขาย / โปรโมชันหน้าร้าน
                  </span>

                  {!readonly && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={addType9ProductItem}
                      className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      เพิ่มสินค้า
                    </Button>
                  )}
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-2 px-3 text-center w-10">ลำดับ</th>
                        <th className="py-2 px-3 min-w-[180px]">
                          เลือกสินค้า <span className="text-red-500">*</span>
                        </th>
                        <th className="py-2 px-3 w-28 text-center">
                          จำนวน (ลัง) <span className="text-red-500">*</span>
                        </th>
                        <th className="py-2 px-3 w-32 text-center">
                          ราคา (บาท/ลัง) <span className="text-red-500">*</span>
                        </th>
                        <th className="py-2 px-3 w-36 text-right">
                          รวมเป็นเงินทั้งหมด
                        </th>
                        {!readonly && (
                          <th className="py-2 px-3 text-center w-14">จัดการ</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {type9ProductItems.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-4 text-center text-slate-400 italic"
                          >
                            ยังไม่มีรายการสินค้า กด "+ เพิ่มสินค้า" เพื่อบันทึก
                          </td>
                        </tr>
                      ) : (
                        type9ProductItems.map((item, index) => {
                          const totalItemPrice =
                            (item.quantityCases || 0) *
                            (item.pricePerCase || 0);
                          return (
                            <tr
                              key={item.id}
                              className="hover:bg-slate-50/60 transition-colors"
                            >
                              <td className="py-2 px-3 text-center font-medium text-slate-500">
                                {index + 1}
                              </td>
                              <td className="py-1.5 px-3">
                                <select
                                  value={item.productName}
                                  onChange={(e) =>
                                    updateType9ProductItem(
                                      item.id,
                                      "productName",
                                      e.target.value,
                                    )
                                  }
                                  disabled={readonly}
                                  className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                >
                                  {DEMO_PRODUCTS.map((prod) => (
                                    <option key={prod} value={prod}>
                                      {prod}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-1.5 px-3">
                                <input
                                  type="number"
                                  min={1}
                                  value={item.quantityCases}
                                  onChange={(e) =>
                                    updateType9ProductItem(
                                      item.id,
                                      "quantityCases",
                                      parseInt(e.target.value) || 0,
                                    )
                                  }
                                  disabled={readonly}
                                  className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                              </td>
                              <td className="py-1.5 px-3">
                                <div className="relative">
                                  <span className="absolute left-2 top-2 text-slate-400 text-[11px]">
                                    ฿
                                  </span>
                                  <input
                                    type="number"
                                    min={0}
                                    value={item.pricePerCase}
                                    onChange={(e) =>
                                      updateType9ProductItem(
                                        item.id,
                                        "pricePerCase",
                                        parseFloat(e.target.value) || 0,
                                      )
                                    }
                                    disabled={readonly}
                                    className="w-full h-8 pl-5 pr-2 rounded-md border border-slate-200 text-xs text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-teal-500"
                                  />
                                </div>
                              </td>
                              <td className="py-1.5 px-3 text-right font-semibold text-teal-700">
                                ฿ {totalItemPrice.toLocaleString()}
                              </td>
                              {!readonly && (
                                <td className="py-1.5 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      deleteType9ProductItem(item.id)
                                    }
                                    className="p-1 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
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
                  <span>จัดงาน Field Day</span>
                </div>
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
                    พืชเป้าหมายและสินค้าที่โชว์ผลงาน{" "}
                    <span className="text-red-500">*</span>
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
                    เป้าหมายจำนวนผู้เข้าร่วม (คน){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={type10Attendees}
                    onChange={(e) =>
                      setType10Attendees(parseInt(e.target.value) || 0)
                    }
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
                      onChange={(e) =>
                        setType10BookingSales(parseFloat(e.target.value) || 0)
                      }
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
                  <span>ตรวจเช็กสต็อกหน้าร้าน</span>
                </div>
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
        </div>
      </div>

      {/* SECTION 4: สถานที่และทีมงาน (Location & Team) */}
      {selectedWorkTypes.some((t) =>
        [
          "จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์",
          "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
          "จัดงาน Field Day",
        ].includes(t),
      ) && (
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm p-5 md:p-6 space-y-5 relative z-20">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
              4
            </span>
            <h2 className="font-bold text-slate-800 text-base md:text-lg">
              สถานที่และทีมงาน (Location & Team)
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Col 3: ผู้ช่วยงานกิจกรรม */}
            <div className="lg:col-span-4 space-y-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ผู้ช่วยงานกิจกรรม{" "}
                <span className="text-slate-400 text-[11px]">
                  (เลือกได้หลายคน)
                </span>
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

                  {showHelperDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowHelperDropdown(false)}
                      />
                      <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-xl bg-white p-1 text-xs shadow-2xl border border-slate-200 custom-scrollbar">
                        {filteredEmployees.length === 0 ? (
                          <li className="p-3 text-slate-400 italic text-center">
                            ไม่พบข้อมูลพนักงาน
                          </li>
                        ) : (
                          filteredEmployees.map((emp) => (
                            <li
                              key={emp.id}
                              onClick={() => addHelper(emp.id)}
                              className="cursor-pointer p-2.5 hover:bg-blue-50 rounded-lg flex items-center justify-between text-slate-700 transition-colors"
                            >
                              <span className="font-medium text-slate-800">
                                {emp.name}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                (
                                {emp.positionTitle ||
                                  emp.departmentName ||
                                  "พนักงาน"}
                                )
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
            </div>
            {/* Col 1: รายละเอียดพื้นที่จัดกิจกรรม */}
            <div className="lg:col-span-full space-y-1">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                รายละเอียดพื้นที่จัดกิจกรรม{" "}
                <span className="text-red-500">*</span>
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
          </div>
        </div>
      )}

      {/* SECTION 5: งบประมาณและค่าใช้จ่าย (Budget & Expenses) */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden p-5 md:p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
            {selectedWorkTypes.some((t) =>
              [
                "จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์",
                "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
                "จัดงาน Field Day",
              ].includes(t),
            )
              ? 5
              : 4}
          </span>
          <h2 className="font-bold text-slate-800 text-base md:text-lg">
            งบประมาณและค่าใช้จ่าย (Budget & Expenses)
          </h2>
        </div>

        {/* Checkbox Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Checkbox 1: สื่อส่งเสริมการขาย */}
          <button
            type="button"
            onClick={() =>
              !readonly &&
              setIsPromotionalMediaSelected(!isPromotionalMediaSelected)
            }
            className={cn(
              "flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-all text-left",
              isPromotionalMediaSelected
                ? "bg-emerald-50/60 border-emerald-500 text-emerald-800 shadow-sm"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
            )}
          >
            <div
              className={cn(
                "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors",
                isPromotionalMediaSelected
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-slate-300 bg-white",
              )}
            >
              {isPromotionalMediaSelected && (
                <Check className="h-3 w-3 stroke-[3]" />
              )}
            </div>
            <span>สื่อส่งเสริมการขาย</span>
          </button>

          {/* Checkbox 2: รายการส่งเสริมการขาย */}
          <button
            type="button"
            onClick={() =>
              !readonly &&
              setIsSalesPromotionSelected(!isSalesPromotionSelected)
            }
            className={cn(
              "flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-all text-left",
              isSalesPromotionSelected
                ? "bg-blue-50/60 border-blue-500 text-blue-800 shadow-sm"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
            )}
          >
            <div
              className={cn(
                "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors",
                isSalesPromotionSelected
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-300 bg-white",
              )}
            >
              {isSalesPromotionSelected && (
                <Check className="h-3 w-3 stroke-[3]" />
              )}
            </div>
            <span>รายการส่งเสริมการขาย</span>
          </button>
        </div>

        {/* Details Card 1: รายละเอียดงบการตลาด & สัดส่วนต่อยอดขาย */}
        {isPromotionalMediaSelected && (
          <div className="bg-emerald-50/40 border border-emerald-200/70 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <Package className="h-4 w-4 text-emerald-600" />
                รายละเอียดงบการตลาด & สัดส่วนต่อยอดขาย
              </span>
            </div>

            {/* Summary & Ratio Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  งบการตลาด (บาท) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-semibold">
                    ฿
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={
                      marketingProductItems.length > 0
                        ? marketingProductItems.reduce(
                            (sum, item) =>
                              sum +
                              (item.quantityCases || 0) *
                                (item.pricePerCase || 0),
                            0,
                          )
                        : marketingBudgetAmount
                    }
                    onChange={(e) =>
                      setMarketingBudgetAmount(parseFloat(e.target.value) || 0)
                    }
                    disabled={readonly || marketingProductItems.length > 0}
                    className="w-full h-10 pl-7 pr-3 rounded-lg border border-slate-200 bg-white text-xs font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  เป้ายอดขายรวมจากกิจกรรม (บาท)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-semibold">
                    ฿
                  </span>
                  <input
                    type="number"
                    readOnly
                    value={
                      (type9ProductItems.length > 0
                        ? type9ProductItems.reduce(
                            (sum, item) =>
                              sum +
                              (item.quantityCases || 0) *
                                (item.pricePerCase || 0),
                            0,
                          )
                        : type9Sales) ||
                      type10BookingSales ||
                      0
                    }
                    className="w-full h-10 pl-7 pr-3 rounded-lg border border-slate-200 bg-slate-100/70 text-xs font-semibold text-slate-700 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  สัดส่วนต่อยอดขาย (%)
                </label>
                <div className="h-10 px-3 rounded-lg border border-emerald-300 bg-emerald-100/60 flex items-center justify-between text-xs font-bold text-emerald-900 shadow-sm">
                  <span className="text-sm text-emerald-700 font-extrabold">
                    {(() => {
                      const targetSales =
                        (type9ProductItems.length > 0
                          ? type9ProductItems.reduce(
                              (sum, item) =>
                                sum +
                                (item.quantityCases || 0) *
                                  (item.pricePerCase || 0),
                              0,
                            )
                          : type9Sales) ||
                        type10BookingSales ||
                        0;
                      const budgetSum =
                        marketingProductItems.length > 0
                          ? marketingProductItems.reduce(
                              (sum, item) =>
                                sum +
                                (item.quantityCases || 0) *
                                  (item.pricePerCase || 0),
                              0,
                            )
                          : marketingBudgetAmount;
                      return targetSales > 0
                        ? `${((budgetSum / targetSales) * 100).toFixed(2)} %`
                        : "0.00 %";
                    })()}
                  </span>
                </div>
              </div>
            </div>

            {/* Marketing Product Table */}
            <div className="space-y-2 pt-2 border-t border-emerald-200/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  สื่อส่งเสริมการขาย (PVC, ไวนิล, ของแถมตราปืนใหญ่ ทุกชนิด)
                </span>

                {!readonly && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={addMarketingProductItem}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    เพิ่มรายการ
                  </Button>
                )}
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2 px-3 text-center w-10">ลำดับ</th>
                      <th className="py-2 px-3 min-w-[180px]">
                        รายการ <span className="text-red-500">*</span>
                      </th>
                      <th className="py-2 px-3 w-28 text-center">
                        จำนวน <span className="text-red-500">*</span>
                      </th>
                      <th className="py-2 px-3 w-32 text-center">
                        ราคา <span className="text-red-500">*</span>
                      </th>
                      <th className="py-2 px-3 w-36 text-right">
                        รวมเป็นเงินทั้งหมด
                      </th>
                      {!readonly && (
                        <th className="py-2 px-3 text-center w-14">จัดการ</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {marketingProductItems.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-4 text-center text-slate-400 italic"
                        >
                          ยังไม่มีรายการสินค้า กดเพิ่มสินค้า เพื่อบันทึก
                        </td>
                      </tr>
                    ) : (
                      marketingProductItems.map((item, index) => {
                        const totalItemPrice =
                          (item.quantityCases || 0) * (item.pricePerCase || 0);
                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50/60 transition-colors"
                          >
                            <td className="py-2 px-3 text-center font-medium text-slate-500">
                              {index + 1}
                            </td>
                            <td className="py-1.5 px-3">
                              <select
                                value={item.productName}
                                onChange={(e) =>
                                  updateMarketingProductItem(
                                    item.id,
                                    "productName",
                                    e.target.value,
                                  )
                                }
                                disabled={readonly}
                                className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              >
                                {DEMO_PRODUCTS.map((prod) => (
                                  <option key={prod} value={prod}>
                                    {prod}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-1.5 px-3">
                              <input
                                type="number"
                                min={1}
                                value={item.quantityCases}
                                onChange={(e) =>
                                  updateMarketingProductItem(
                                    item.id,
                                    "quantityCases",
                                    parseInt(e.target.value) || 0,
                                  )
                                }
                                disabled={readonly}
                                className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </td>
                            <td className="py-1.5 px-3">
                              <div className="relative">
                                <span className="absolute left-2 top-2 text-slate-400 text-[11px]">
                                  ฿
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  value={item.pricePerCase}
                                  onChange={(e) =>
                                    updateMarketingProductItem(
                                      item.id,
                                      "pricePerCase",
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                  disabled={readonly}
                                  className="w-full h-8 pl-5 pr-2 rounded-md border border-slate-200 text-xs text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                              </div>
                            </td>
                            <td className="py-1.5 px-3 text-right font-semibold text-emerald-700">
                              ฿ {totalItemPrice.toLocaleString()}
                            </td>
                            {!readonly && (
                              <td className="py-1.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteMarketingProductItem(item.id)
                                  }
                                  className="p-1 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Details Card 2: รายการส่งเสริมการขาย */}
        {isSalesPromotionSelected && (
          <div className="bg-blue-50/40 border border-blue-200/70 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
              <span className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                <Receipt className="h-4 w-4 text-blue-600" />
                รายการส่งเสริมการขาย
              </span>

              {!readonly && (
                <Button
                  type="button"
                  size="sm"
                  onClick={addSalesPromotionRow}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  เพิ่มรายการ
                </Button>
              )}
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-12">ลำดับ</th>

                    <th className="py-2.5 px-3 min-w-[200px]">
                      รายละเอียด <span className="text-red-500">*</span>
                    </th>
                    <th className="py-2.5 px-3 w-36 text-center">
                      จำนวนเงิน (บาท) <span className="text-red-500">*</span>
                    </th>
                    <th className="py-2.5 px-3 min-w-[130px]">
                      การใช้งบ <span className="text-red-500">*</span>
                    </th>
                    {!readonly && (
                      <th className="py-2.5 px-3 text-center w-16">จัดการ</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {salesPromotionItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-4 text-center text-slate-400 italic"
                      >
                        ยังไม่มีรายการส่งเสริมการขาย กด "เพิ่มรายการ"
                        เพื่อบันทึก
                      </td>
                    </tr>
                  ) : (
                    salesPromotionItems.map((item, index) => {
                      const itemTotal = item.amount || 0;
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="py-2.5 px-3 text-center font-medium text-slate-500">
                            {index + 1}
                          </td>

                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.detail}
                              onChange={(e) =>
                                updateSalesPromotionRow(
                                  item.id,
                                  "detail",
                                  e.target.value,
                                )
                              }
                              disabled={readonly}
                              placeholder="ระบุรายละเอียดรายการ..."
                              className="w-full h-8 px-2.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <div className="relative">
                              <span className="absolute left-2.5 top-2 text-slate-400 text-[11px]">
                                ฿
                              </span>
                              <input
                                type="number"
                                min={0}
                                value={item.amount}
                                onChange={(e) =>
                                  updateSalesPromotionRow(
                                    item.id,
                                    "amount",
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                disabled={readonly}
                                placeholder="0"
                                className="w-full h-8 pl-6 pr-2 rounded-md border border-slate-200 text-xs text-slate-800 text-right font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={item.budgetType || "งบการตลาด"}
                              onChange={(e) =>
                                updateSalesPromotionRow(
                                  item.id,
                                  "budgetType",
                                  e.target.value,
                                )
                              }
                              disabled={readonly}
                              className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                            >
                              <option value="งบการตลาด">งบการตลาด</option>
                              <option value="งบขาย">งบขาย</option>
                            </select>
                          </td>
                          {!readonly && (
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => deleteSalesPromotionRow(item.id)}
                                className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {salesPromotionItems.length > 0 && (
                  <tfoot className="bg-slate-50/80 border-t-2 border-slate-200 text-xs font-bold text-slate-800">
                    <tr>
                      <td colSpan={2} className="py-3 px-3 text-left">
                        ผลรวมใช้งบทั้งสิ้น:{" "}
                        {salesPromotionItems
                          .reduce((sum, item) => sum + (item.amount || 0), 0)
                          .toLocaleString()}{" "}
                        ฿
                      </td>
                      {!readonly && <td></td>}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 6: รายการขอเบิกสินค้าจัดกิจกรรม (Material Requisition) */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
              {selectedWorkTypes.some((t) =>
                [
                  "จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์",
                  "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
                  "จัดงาน Field Day",
                ].includes(t),
              )
                ? 6
                : 5}
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
                {!readonly && (
                  <th className="py-2.5 px-3 text-center w-16">จัดการ</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {requisitionItems.map((item, index) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-2.5 px-3 text-center font-medium text-slate-500">
                    {index + 1}
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={item.productName}
                      onChange={(e) =>
                        updateRequisitionRow(
                          item.id,
                          "productName",
                          e.target.value,
                        )
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
                          parseInt(e.target.value) || 0,
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
            {selectedWorkTypes.some((t) =>
              [
                "จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์",
                "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
                "จัดงาน Field Day",
              ].includes(t),
            )
              ? 7
              : 6}
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
