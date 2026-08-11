"use client";

import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  User,
  FileText,
  Check,
  X,
  ChevronDown,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/modules/sales/features/form/forms/section-header";
import { cn } from "@/lib/utils";
import type { ActivityPlanFormValues } from "../../application/validations";
import { DateTimePicker } from "./components/date-time-picker";

type SubmitResult = {
  success: boolean;
  error?: string;
};

interface Props {
  initial?: Partial<ActivityPlanFormValues> & {
    employeeName?: string;
    planCode?: string;
    details?: any;
  };
  employees?: Array<{
    id: string;
    name: string;
    positionTitle?: string | null;
    departmentName?: string | null;
  }>;
  customers?: Array<{
    id: string;
    name: string;
    customerCode?: string | null;
    responsibleEmployeeId?: string | null;
  }>;
  products?: Array<{
    id: string;
    name: string;
    productCode?: string | null;
    unit?: string | null;
    price?: number | null;
  }>;
  demoPlots?: Array<UserDemoPlotOption>;
  onSubmit: (payload: ActivityPlanFormValues) => Promise<SubmitResult | void>;
  onCancel?: () => void;
  submitLabel?: string;
  readonly?: boolean;
  isEdit?: boolean;
}

import {
  WORK_TYPES,
  DEMO_OWNERS,
  DEMO_PRODUCTS,
  DEMO_PRODUCT_PRICES,
  MARKETING_PRODUCT_CATEGORIES,
  MARKETING_PRODUCTS_BY_CATEGORY,
  USER_DEMO_PLOTS,
  type UserDemoPlotOption,
} from "./constants";

import {
  RequisitionItem,
  Type9ProductItem,
  Type1VisitItem,
  Type2ProductFollowupItem,
  Type3SalesItem,
  Type4CollectItem,
  Type5SurveyItem,
  Type6IssueItem,
  Type7DemoPlotItem,
  Type8MeetingItem,
  MarketingBudgetProductItem,
  SalesPromotionItem,
} from "./types";
import { BudgetSection } from "./components/budget-section";
import { LocationTeamSection } from "./components/location-team-section";
import { Type1Visit } from "./components/work-types/type1-visit";
import { Type2Followup } from "./components/work-types/type2-followup";
import { Type3Sales } from "./components/work-types/type3-sales";
import { Type4Collect } from "./components/work-types/type4-collect";
import { Type5Survey } from "./components/work-types/type5-survey";
import { Type6Issue } from "./components/work-types/type6-issue";
import { Type7Demo } from "./components/work-types/type7-demo";
import { Type8Meeting } from "./components/work-types/type8-meeting";
import { Type9Store } from "./components/work-types/type9-store";
import { Type10FieldDay } from "./components/work-types/type10-field-day";
import { Type11Stock } from "./components/work-types/type11-stock";

export function ActivityPlanForm({
  initial = {},
  employees = [],
  customers: initialCustomers = [],
  products: initialProducts = [],
  demoPlots = [],
  onSubmit,
  onCancel,
  submitLabel = "บันทึก",
  readonly = false,
  isEdit = false,
}: Props) {
  const [customersList, setCustomersList] = useState<any[]>(initialCustomers);
  const [productsList, setProductsList] = useState<any[]>(initialProducts);

  useEffect(() => {
    if (initialCustomers && initialCustomers.length > 0) {
      setCustomersList(initialCustomers);
      return;
    }
    let isMounted = true;
    async function loadCustomers() {
      try {
        const res = await fetch("/api/customers?perPage=1000").then((r) =>
          r.json(),
        );
        if (isMounted && res.customers) {
          setCustomersList(res.customers);
        }
      } catch (err) {
        console.error("Failed to load customers for Trip Plan:", err);
      }
    }
    loadCustomers();
    return () => {
      isMounted = false;
    };
  }, [initialCustomers]);

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProductsList(initialProducts);
      return;
    }
    let isMounted = true;
    async function loadProducts() {
      try {
        const res = await fetch(
          "/api/products?status=ACTIVE&perPage=1000",
        ).then((r) => r.json());
        if (isMounted && res.products) {
          setProductsList(res.products);
        }
      } catch (err) {
        console.error("Failed to load products for Trip Plan:", err);
      }
    }
    loadProducts();
    return () => {
      isMounted = false;
    };
  }, [initialProducts]);
  // Format initial dates
  const parseInitialDate = (date?: Date | string) => {
    if (!date)
      return { dateStr: format(new Date(), "yyyy-MM-dd"), timeStr: "00:00" };
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime()))
      return { dateStr: format(new Date(), "yyyy-MM-dd"), timeStr: "00:00" };
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
  const [tempSelectedWorkTypes, setTempSelectedWorkTypes] =
    useState<string[]>(initialTypes);
  const [isWorkTypesDropdownOpen, setIsWorkTypesDropdownOpen] = useState(false);
  const workTypesDropdownRef = useRef<HTMLDivElement>(null);

  const initDetails = (initial as any)?.details;

  // Work Type 1: เข้าพบร้านค้า / Key Farmer
  const [type1Items, setType1Items] = useState<Type1VisitItem[]>(
    initDetails?.type1Items ?? [
      {
        id: "1",
        customerName: DEMO_OWNERS[0] || "",
        topic: "แจ้งข่าวสาร",
        detail: "",
      },
    ],
  );

  const addType1Row = () => {
    const newItem: Type1VisitItem = {
      id: Date.now().toString(),
      customerName: DEMO_OWNERS[0] || "",
      topic: "แจ้งข่าวสาร",
      detail: "",
    };
    setType1Items((prev) => [...prev, newItem]);
  };

  const updateType1Row = (
    id: string,
    field: keyof Type1VisitItem,
    val: any,
  ) => {
    setType1Items((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)),
    );
  };

  const deleteType1Row = (id: string) => {
    setType1Items((prev) => prev.filter((item) => item.id !== id));
  };

  const [type2Items, setType2Items] = useState<Type2ProductFollowupItem[]>(
    initDetails?.type2Items ?? [
      {
        id: "1",
        productName: DEMO_PRODUCTS[0] || "",
        customerName: DEMO_OWNERS[0] || "",
        detail: "",
      },
    ],
  );

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

  const [type3Items, setType3Items] = useState<Type3SalesItem[]>(
    initDetails?.type3Items ?? [
      {
        id: "1",
        customerName: DEMO_OWNERS[0] || "",
        products: [
          {
            id: "p-1",
            productName: "",
            quantity: 1,
            unitPrice: 0,
            price: 0,
          },
        ],
        productName: "",
        quantity: 1,
        unitPrice: 0,
        price: 0,
        detail: "",
      },
    ],
  );

  const addType3Row = () => {
    const newItem: Type3SalesItem = {
      id: Date.now().toString(),
      customerName: DEMO_OWNERS[0] || "",
      products: [
        {
          id: "p-" + Date.now().toString(),
          productName: "",
          quantity: 1,
          unitPrice: 0,
          price: 0,
        },
      ],
      productName: "",
      quantity: 1,
      unitPrice: 0,
      price: 0,
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
        if (field === "products" && Array.isArray(val)) {
          const first = val[0];
          if (first) {
            updated.productName = first.productName;
            updated.quantity = first.quantity;
            updated.unitPrice = first.unitPrice;
          }
          updated.price = val.reduce(
            (sum: number, p: any) =>
              sum + (p.quantity || 0) * (p.unitPrice || 0),
            0,
          );
        } else if (field === "productName") {
          const foundProd = productsList.find((p) => p.name === val);
          if (foundProd && foundProd.price != null) {
            updated.unitPrice = Number(foundProd.price);
          } else if (DEMO_PRODUCT_PRICES[val] !== undefined) {
            updated.unitPrice = DEMO_PRODUCT_PRICES[val];
          }
          const qty =
            typeof updated.quantity === "number"
              ? updated.quantity
              : parseInt(String(updated.quantity ?? 0)) || 0;
          const uPrice =
            typeof updated.unitPrice === "number"
              ? updated.unitPrice
              : parseFloat(String(updated.unitPrice ?? 0)) || 0;
          updated.price = qty * uPrice;
        }
        return updated;
      }),
    );
  };

  const deleteType3Row = (id: string) => {
    setType3Items((prev) => prev.filter((item) => item.id !== id));
  };

  // Work Type 4: วางบิล / เก็บเงิน
  const [type4Items, setType4Items] = useState<Type4CollectItem[]>(
    initDetails?.type4Items ?? [
      {
        id: "1",
        customerName: DEMO_OWNERS[0] || "",
        collectAmount: 0,
        detail: "",
      },
    ],
  );
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
  const updateType4Row = (
    id: string,
    field: keyof Type4CollectItem,
    val: any,
  ) => {
    setType4Items((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)),
    );
  };
  const deleteType4Row = (id: string) => {
    setType4Items((prev) => prev.filter((item) => item.id !== id));
  };

  // Work Type 5: สำรวจตลาดของคู่แข่ง
  const [type5Items, setType5Items] = useState<Type5SurveyItem[]>(
    initDetails?.type5Items ?? [
      {
        id: "1",
        storeName: "",
        comparedProduct: DEMO_PRODUCTS[0] || "",
        detail: "",
      },
    ],
  );
  const addType5Row = () => {
    setType5Items((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        storeName: "",
        comparedProduct: DEMO_PRODUCTS[0] || "",
        detail: "",
      },
    ]);
  };
  const updateType5Row = (
    id: string,
    field: keyof Type5SurveyItem,
    val: any,
  ) => {
    setType5Items((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)),
    );
  };
  const deleteType5Row = (id: string) => {
    setType5Items((prev) => prev.filter((item) => item.id !== id));
  };

  // Work Type 6: แก้ปัญหา / รับเรื่องร้องเรียน
  const [type6Items, setType6Items] = useState<Type6IssueItem[]>(
    initDetails?.type6Items ?? [
      {
        id: "1",
        customerName: DEMO_OWNERS[0] || "",
        issueType: "เคลมของ",
        detail: "",
      },
    ],
  );
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
  const updateType6Row = (
    id: string,
    field: keyof Type6IssueItem,
    val: any,
  ) => {
    setType6Items((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)),
    );
  };
  const deleteType6Row = (id: string) => {
    setType6Items((prev) => prev.filter((item) => item.id !== id));
  };

  // Work Type 7: ติดตามแปลงสาธิต / ทำแปลง
  const [type7Items, setType7Items] = useState<Type7DemoPlotItem[]>(
    initDetails?.type7Items ?? [
      {
        id: "1",
        plotActivityType: "CREATE",
        ownerName: DEMO_OWNERS[0] || "",
        productName: DEMO_PRODUCTS[0] || "",
        cropCategory: "พืชสวน",
        cropName: "ทุเรียน",
        areaRai: 0,
        treeCount: 50,
        startDate: format(new Date(), "yyyy-MM-dd"),
        followUpDate: startDate || format(new Date(), "yyyy-MM-dd"),
        objective: "",
        plotsCount: 1,
        detail: "",
      },
    ],
  );
  const addType7Row = () => {
    setType7Items((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        plotActivityType: "CREATE",
        ownerName: DEMO_OWNERS[0] || "",
        productName: DEMO_PRODUCTS[0] || "",
        cropCategory: "พืชสวน",
        cropName: "ทุเรียน",
        customCropName: "",
        areaRai: 0,
        treeCount: 50,
        startDate: startDate || format(new Date(), "yyyy-MM-dd"),
        followUpDate: startDate || format(new Date(), "yyyy-MM-dd"),
        objective: "",
        plotsCount: 1,
        detail: "",
      },
    ]);
  };
  const updateType7Row = (
    id: string,
    field: keyof Type7DemoPlotItem,
    val: any,
  ) => {
    setType7Items((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)),
    );
  };
  const deleteType7Row = (id: string) => {
    setType7Items((prev) => prev.filter((item) => item.id !== id));
  };

  // Work Type 8: จัดประชุมเกษตรกร / ร้านค้า
  const [type8Items, setType8Items] = useState<Type8MeetingItem[]>(
    initDetails?.type8Items ?? [
      {
        id: "1",
        topic: "",
        locationArea: "",
        targetProducts: [],
        attendeesCount: 1,
        detail: "",
      },
    ],
  );
  const addType8Row = () => {
    setType8Items((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        topic: "",
        locationArea: "",
        targetProducts: [],
        attendeesCount: 10,
        detail: "",
      },
    ]);
  };
  const updateType8Row = (
    id: string,
    field: keyof Type8MeetingItem,
    val: any,
  ) => {
    setType8Items((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)),
    );
  };
  const deleteType8Row = (id: string) => {
    setType8Items((prev) => prev.filter((item) => item.id !== id));
  };

  const [type9Store, setType9Store] = useState(initDetails?.type9Store ?? "");
  const [type9IsSubDealer, setType9IsSubDealer] = useState(
    initDetails?.type9IsSubDealer ?? false,
  );
  const [type9SubDealerStore, setType9SubDealerStore] = useState(
    initDetails?.type9SubDealerStore ?? "",
  );
  const [type9Sales, setType9Sales] = useState<number>(
    initDetails?.type9Sales ?? 0,
  );
  const [type9Products, setType9Products] = useState(
    initDetails?.type9Products ?? "",
  );
  const [type9ProductItems, setType9ProductItems] = useState<
    Type9ProductItem[]
  >(
    initDetails?.type9ProductItems ?? [
      {
        id: "1",
        productName: DEMO_PRODUCTS[0] || "สินค้าทดสอบ A",
        quantityCases: 10,
        pricePerCase: 500,
      },
    ],
  );

  const [type10DemoPlot, setType10DemoPlot] = useState(
    initDetails?.type10DemoPlot ?? "",
  );
  const [type10Location, setType10Location] = useState(
    initDetails?.type10Location ?? "",
  );
  const [type10TargetCrop, setType10TargetCrop] = useState(
    initDetails?.type10TargetCrop ?? "",
  );
  const [type10Showcase, setType10Showcase] = useState(
    initDetails?.type10Showcase ?? "",
  );
  const [type10Attendees, setType10Attendees] = useState<number>(
    initDetails?.type10Attendees ?? 0,
  );
  const [type10BookingSales, setType10BookingSales] = useState<number>(
    initDetails?.type10BookingSales ?? 0,
  );

  const [type11Stores, setType11Stores] = useState(
    initDetails?.type11Stores ?? "",
  );

  // Section 4: Location & Team State
  const [locationText, setLocationText] = useState(initial.location ?? "");
  const [helperEmployeeIds, setHelperEmployeeIds] = useState<string[]>(
    initial.helperEmployeeIds ?? [],
  );
  const [helperSearch, setHelperSearch] = useState("");
  const [showHelperDropdown, setShowHelperDropdown] = useState(false);

  // Section 5: Budget & Expenses State
  const [isPromotionalMediaSelected, setIsPromotionalMediaSelected] =
    useState<boolean>(
      initDetails?.isPromotionalMediaSelected ??
        (initial.marketingBudget ?? 0) > 0,
    );
  const [marketingBudgetAmount, setMarketingBudgetAmount] = useState<number>(
    initDetails?.marketingBudgetAmount ?? initial.marketingBudget ?? 10000,
  );
  const [marketingProductItems, setMarketingProductItems] = useState<
    MarketingBudgetProductItem[]
  >(
    initDetails?.marketingProductItems ?? [
      {
        id: "1",
        category: MARKETING_PRODUCT_CATEGORIES[0],
        productName:
          MARKETING_PRODUCTS_BY_CATEGORY[MARKETING_PRODUCT_CATEGORIES[0]]?.[0]
            ?.name || "สมุดฉีก",
        quantityCases: 10,
        unit:
          MARKETING_PRODUCTS_BY_CATEGORY[MARKETING_PRODUCT_CATEGORIES[0]]?.[0]
            ?.unit || "เล่ม",
        pricePerCase:
          MARKETING_PRODUCTS_BY_CATEGORY[MARKETING_PRODUCT_CATEGORIES[0]]?.[0]
            ?.price || 25,
      },
    ],
  );

  const addMarketingProductItem = () => {
    const defaultCat = MARKETING_PRODUCT_CATEGORIES[0];
    const firstProdObj = MARKETING_PRODUCTS_BY_CATEGORY[defaultCat]?.[0];
    const firstProd = firstProdObj ? firstProdObj.name : "สมุดฉีก";
    const defaultPrice = firstProdObj ? firstProdObj.price : 25;
    const defaultUnit = firstProdObj?.unit || "เล่ม";
    const newItem: MarketingBudgetProductItem = {
      id: Date.now().toString(),
      category: defaultCat,
      productName: firstProd,
      quantityCases: 1,
      unit: defaultUnit,
      pricePerCase: defaultPrice,
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
    useState<boolean>(
      initDetails?.isSalesPromotionSelected ??
        (initial.salesPromotionBudget ?? 0) > 0,
    );
  const [salesPromotionItems, setSalesPromotionItems] = useState<
    SalesPromotionItem[]
  >(initDetails?.salesPromotionItems ?? []);

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

  const [extraExpenseAmount, setExtraExpenseAmount] = useState<number>(
    initDetails?.extraExpenseAmount ?? 0,
  );
  const [extraExpenseDetail, setExtraExpenseDetail] = useState(
    initDetails?.extraExpenseDetail ?? "",
  );

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
    if (tempSelectedWorkTypes.includes(typeStr)) {
      setTempSelectedWorkTypes(
        tempSelectedWorkTypes.filter((t) => t !== typeStr),
      );
    } else {
      setTempSelectedWorkTypes([...tempSelectedWorkTypes, typeStr]);
    }
  };

  const removeWorkType = (typeStr: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedWorkTypes(selectedWorkTypes.filter((t) => t !== typeStr));
  };

  // Type 9 Store Promotion Product Table Helpers
  const addType9ProductItem = () => {
    const prod = DEMO_PRODUCTS[0] || "";
    const pPrice = DEMO_PRODUCT_PRICES[prod] ?? 500;
    const newItem: Type9ProductItem = {
      id: Date.now().toString(),
      productName: prod,
      quantityCases: 1,
      pricePerCase: pPrice,
    };
    setType9ProductItems((prev) => [...prev, newItem]);
  };

  const updateType9ProductItem = (
    id: string,
    field: keyof Type9ProductItem,
    val: any,
  ) => {
    setType9ProductItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: val };
        if (field === "productName" && DEMO_PRODUCT_PRICES[val] !== undefined) {
          updated.pricePerCase = DEMO_PRODUCT_PRICES[val];
        }
        return updated;
      }),
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

    if (selectedWorkTypes.includes("เข้าพบร้านค้า / Key Farmer")) {
      const visitSummary = type1Items
        .map(
          (item, i) =>
            `${i + 1}. ลูกค้า/ร้านค้า: ${item.customerName} | ประเด็น: ${item.topic}${item.detail ? ` (${item.detail})` : ""}`,
        )
        .join(", ");
      summaryParts.push(
        `[เข้าพบร้านค้า/Key Farmer] รายการเข้าพบ (${type1Items.length} รายการ): ${visitSummary || "ไม่มีรายการ"}`,
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
        .map((item, i) => {
          const prodItems =
            item.products && item.products.length > 0
              ? item.products
              : [
                  {
                    productName: item.productName || "",
                    quantity: item.quantity || 1,
                    unitPrice: item.unitPrice || 0,
                  },
                ];
          const prodList = prodItems
            .map(
              (p) =>
                `${p.productName} (${p.quantity} x ฿${(p.unitPrice || 0).toLocaleString()} = ฿${((p.quantity || 0) * (p.unitPrice || 0)).toLocaleString()})`,
            )
            .join(", ");
          const itemTotal = prodItems.reduce(
            (s, p) => s + (p.quantity || 0) * (p.unitPrice || 0),
            0,
          );
          return `${i + 1}. ลูกค้า/ร้านค้า: ${item.customerName} | สินค้า: ${prodList} | รวม: ฿${itemTotal.toLocaleString()}${item.detail ? ` (${item.detail})` : ""}`;
        })
        .join("; ");
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
            `${i + 1}. ร้านค้า: ${item.storeName || "ไม่ระบุ"} | สินค้าเทียบ: ${item.comparedProduct}${item.detail ? ` (${item.detail})` : ""}`,
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

    if (selectedWorkTypes.includes("ติดตามแปลงสาธิต / ทำแปลง")) {
      const demoSummary = type7Items
        .map((item, i) => {
          const modeLabel =
            item.plotActivityType === "FOLLOW_UP" ? "ติดตามแปลง" : "ทำแปลงใหม่";
          if (item.plotActivityType === "FOLLOW_UP") {
            const plotName =
              item.existingPlotName || item.ownerName || "แปลงเดิม";
            return `${i + 1}. [${modeLabel}] แปลง: ${plotName} | วันที่ติดตาม: ${item.followUpDate || "ไม่ระบุ"}${item.detail ? ` | รายละเอียดเพิ่มเติม: ${item.detail}` : ""}`;
          }
          const cropDisplay =
            item.customCropName &&
            ["ผักและพืชล้มลุกอื่นๆ", "พืชไร่อื่นๆ", "พืชสวนอื่นๆ"].includes(
              item.cropName,
            )
              ? `${item.cropName}: ${item.customCropName}`
              : item.cropName;
          const isRaiUnit = ["พืชไร่", "ผักและพืชล้มลุก"].includes(
            item.cropCategory,
          );
          const sizeText = isRaiUnit
            ? `${item.areaRai || item.plotsCount || 1} ไร่`
            : `${item.treeCount || item.plotsCount || 1} ต้น`;
          return `${i + 1}. [${modeLabel}] เจ้าของ: ${item.ownerName} | สินค้า: ${item.productName} | หมวดพืช: ${item.cropCategory} (${cropDisplay}) | ขนาด: ${sizeText}${item.experimentDetail ? ` | วิธีทดลอง: ${item.experimentDetail}` : ""}`;
        })
        .join(", ");
      summaryParts.push(
        `[ติดตามแปลงสาธิต] รายการแปลงสาธิต (${type7Items.length} รายการ): ${demoSummary || "ไม่มีรายการ"}`,
      );
    }

    if (
      selectedWorkTypes.includes("จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์")
    ) {
      const meetingSummary = type8Items
        .map((item, i) => {
          const locText = item.locationArea
            ? ` | พื้นที่: ${item.locationArea}`
            : "";
          const prodsText =
            item.targetProducts && item.targetProducts.length > 0
              ? ` | สินค้าเป้าหมาย: ${item.targetProducts.join(", ")}`
              : "";
          return `${i + 1}. หัวข้อ: ${item.topic}${locText}${prodsText} | ผู้เข้าร่วม: ${item.attendeesCount} คน${item.detail ? ` (${item.detail})` : ""}`;
        })
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
      const storeText =
        type9IsSubDealer && type9SubDealerStore
          ? `${type9Store} (ร้าน Sub Dealer: ${type9SubDealerStore})`
          : type9Store;
      summaryParts.push(
        `[กิจกรรมหน้าร้าน] ร้านค้า: ${storeText} | เป้ายอดขายรวม: ${finalSales.toLocaleString()} บาท | สินค้า: ${itemsText || type9Products || "ไม่ระบุ"}`,
      );
    }

    if (selectedWorkTypes.includes("จัดงาน Field Day")) {
      summaryParts.push(
        `[Field Day] แปลงสาธิต: ${type10DemoPlot} | สถานที่: ${type10Location} | พืชเป้าหมาย: ${type10TargetCrop} | สินค้าโชว์: ${type10Showcase} | เป้าผู้ร่วมงาน: ${type10Attendees} คน | เป้ายอดจอง: ${type10BookingSales.toLocaleString()} บาท`,
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
      if (marketingProductItems.length === 0) {
        setError(
          "สื่อส่งเสริมการขาย (PVC, ไวนิล, ของแถมตราปืนใหญ่ ทุกชนิด) ต้องมีอย่างน้อย 1 ข้อมูล",
        );
        setLoading(false);
        return;
      }
      marketingBudget = calculatedMarketingSum;
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

    const details = {
      type1Items,
      type2Items,
      type3Items,
      type4Items,
      type5Items,
      type6Items,
      type7Items,
      type8Items,
      type9Store,
      type9IsSubDealer,
      type9SubDealerStore,
      type9Sales,
      type9Products,
      type9ProductItems,
      type10DemoPlot,
      type10Location,
      type10TargetCrop,
      type10Showcase,
      type10Attendees,
      type10BookingSales,
      type11Stores,
      isPromotionalMediaSelected,
      marketingBudgetAmount,
      marketingProductItems,
      isSalesPromotionSelected,
      salesPromotionItems,
      extraExpenseAmount,
      extraExpenseDetail,
      requisitionItems,
    };

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
        details,
        helperEmployeeIds,
      });

      if (res && !res.success) {
        setError(res.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
      setLoading(false);
    }
  };

  return (
    <section className="space-y-4 md:space-y-6 container mx-auto px-0 sm:px-0">
      <Card>
        <div className="p-3 sm:p-4 md:p-6">
          <div className="text-center">
            <h5 className="font-semibold text-lg sm:text-2xl md:text-3xl border-b pb-4 md:pb-6 leading-snug">
              <span className="hidden sm:inline">
                {isEdit
                  ? "แก้ไขแผนงาน ( Trip Plan )"
                  : "สร้างแผนงาน ( Trip Plan )"}
              </span>
              <span className="inline sm:hidden">
                {isEdit ? "แก้ไขแผนงาน" : "สร้างแผนงาน"}
                <br />( Trip Plan )
              </span>
            </h5>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 md:space-y-6 pt-4 md:pt-6"
            noValidate
          >
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* SECTION 1: ข้อมูลระบบ (System Info) */}
            <SectionHeader title="ข้อมูลระบบ" color="gray" />

            <div
              className={cn(
                "grid grid-cols-1 gap-3 md:gap-4",
                isEdit && "sm:grid-cols-2",
              )}
            >
              {/* Card 1: ผู้รับผิดชอบ */}
              <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-4 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">
                    ผู้รับผิดชอบ{" "}
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {initial.employeeName || "ผู้ใช้งานปัจจุบัน"}
                  </p>
                </div>
              </div>

              {/* Card 2: เลขที่แผน */}
              {isEdit && (
                <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-4 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      เลขที่แผน{" "}
                    </p>
                    <p className="text-sm font-semibold text-slate-800">
                      {initial.planCode || (initial as any).code}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 2: ข้อมูลหลักของกิจกรรม (Main Activity Details) */}
            <SectionHeader title="ข้อมูลหลักของกิจกรรม" color="gray" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {/* ชื่อกิจกรรม */}
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  ชื่อกิจกรรม <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={readonly}
                  placeholder="เช่น กิจกรรมส่งเสริมการขายตราปืนใหญ่"
                  className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* ประเภทงาน (เลือกได้มากกว่า 1) */}
              <div className="relative" ref={workTypesDropdownRef}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  ประเภทงาน{" "}
                  <span className="text-slate-400 text-[11px]">
                    (เลือกได้มากกว่า 1)
                  </span>{" "}
                  <span className="text-red-500">*</span>
                </label>

                {/* Input Trigger Field */}
                <div
                  onClick={() => {
                    if (!readonly) {
                      if (!isWorkTypesDropdownOpen) {
                        setTempSelectedWorkTypes(selectedWorkTypes);
                      }
                      setIsWorkTypesDropdownOpen(!isWorkTypesDropdownOpen);
                    }
                  }}
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
                  <div className="absolute left-0 sm:right-0 top-full mt-1.5 w-full sm:w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 p-3 space-y-2 animate-in fade-in-0 zoom-in-95">
                    <div className="max-h-80 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      {WORK_TYPES.map((typeStr) => {
                        const isChecked =
                          tempSelectedWorkTypes.includes(typeStr);
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

                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsWorkTypesDropdownOpen(false)}
                        className="px-4 py-1.5 rounded-xl border border-slate-300 bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-2xs transition-all active:scale-95"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedWorkTypes(tempSelectedWorkTypes);
                          setIsWorkTypesDropdownOpen(false);
                        }}
                        className="px-4 py-1.5 rounded-xl border border-slate-300 bg-green-600 hover:bg-green-700 text-xs font-bold text-white shadow-2xs transition-all active:scale-95"
                      >
                        ตกลง
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* วันที่เริ่ม */}
              <DateTimePicker
                label="วันที่เริ่ม"
                required
                dateValue={startDate}
                timeValue={startTime}
                onDateChange={setStartDate}
                onTimeChange={setStartTime}
                readonly={readonly}
                accentColor="blue"
              />

              {/* วันที่สิ้นสุด */}
              <DateTimePicker
                label="วันที่สิ้นสุด"
                required
                dateValue={endDate}
                timeValue={endTime}
                onDateChange={setEndDate}
                onTimeChange={setEndTime}
                readonly={readonly}
                accentColor="blue"
              />
            </div>

            {/* SECTION 3: วัตถุประสงค์ของประเภทงาน (Dynamic Objective) */}
            {selectedWorkTypes.length > 0 && (
              <div className="space-y-4">
                <SectionHeader title="วัตถุประสงค์ของประเภทงาน" color="gray" />

                <div className="space-y-5">
                  {/* Work Type 1: เข้าพบร้านค้า / Key Farmer */}
                  {selectedWorkTypes.includes("เข้าพบร้านค้า / Key Farmer") && (
                    <Type1Visit
                      readonly={readonly}
                      type1Items={type1Items}
                      addType1Row={addType1Row}
                      updateType1Row={updateType1Row}
                      deleteType1Row={deleteType1Row}
                      customers={customersList}
                    />
                  )}

                  {/* Work Type 2: ติดตามผลการใช้สินค้า */}
                  {selectedWorkTypes.includes("ติดตามผลการใช้สินค้า") && (
                    <Type2Followup
                      readonly={readonly}
                      type2Items={type2Items}
                      addType2Row={addType2Row}
                      updateType2Row={updateType2Row}
                      deleteType2Row={deleteType2Row}
                      customers={customersList}
                      products={productsList}
                    />
                  )}

                  {/* Work Type 3: เสนอขายสินค้า */}
                  {selectedWorkTypes.includes("เสนอขายสินค้า") && (
                    <Type3Sales
                      readonly={readonly}
                      type3Items={type3Items}
                      addType3Row={addType3Row}
                      updateType3Row={updateType3Row}
                      deleteType3Row={deleteType3Row}
                      customers={customersList}
                      products={productsList}
                    />
                  )}

                  {/* Work Type 4: วางบิล / เก็บเงิน */}
                  {selectedWorkTypes.includes("วางบิล / เก็บเงิน") && (
                    <Type4Collect
                      readonly={readonly}
                      type4Items={type4Items}
                      addType4Row={addType4Row}
                      updateType4Row={updateType4Row}
                      deleteType4Row={deleteType4Row}
                      customers={customersList}
                    />
                  )}

                  {/* Work Type 5: สำรวจตลาดของคู่แข่ง */}
                  {selectedWorkTypes.includes("สำรวจตลาดของคู่แข่ง") && (
                    <Type5Survey
                      readonly={readonly}
                      type5Items={type5Items}
                      addType5Row={addType5Row}
                      updateType5Row={updateType5Row}
                      deleteType5Row={deleteType5Row}
                      customers={customersList}
                      products={productsList}
                    />
                  )}

                  {/* Work Type 6: แก้ปัญหา / รับเรื่องร้องเรียน */}
                  {selectedWorkTypes.includes(
                    "แก้ปัญหา / รับเรื่องร้องเรียน",
                  ) && (
                    <Type6Issue
                      readonly={readonly}
                      type6Items={type6Items}
                      addType6Row={addType6Row}
                      updateType6Row={updateType6Row}
                      deleteType6Row={deleteType6Row}
                      customers={customersList}
                    />
                  )}

                  {/* Work Type 7: ติดตามแปลงสาธิต / ทำแปลง */}
                  {selectedWorkTypes.includes("ติดตามแปลงสาธิต / ทำแปลง") && (
                    <Type7Demo
                      readonly={readonly}
                      type7Items={type7Items}
                      addType7Row={addType7Row}
                      updateType7Row={updateType7Row}
                      deleteType7Row={deleteType7Row}
                      customers={customersList}
                      products={productsList}
                      demoPlots={demoPlots}
                      parentStartDate={startDate}
                    />
                  )}

                  {/* Work Type 8: จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์ */}
                  {selectedWorkTypes.includes(
                    "จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์",
                  ) && (
                    <Type8Meeting
                      readonly={readonly}
                      type8Items={type8Items}
                      addType8Row={addType8Row}
                      updateType8Row={updateType8Row}
                      deleteType8Row={deleteType8Row}
                      products={productsList}
                    />
                  )}

                  {/* Work Type 9: จัดกิจกรรมส่งเสริมการขายหน้าร้าน */}
                  {selectedWorkTypes.includes(
                    "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
                  ) && (
                    <Type9Store
                      readonly={readonly}
                      type9Store={type9Store}
                      setType9Store={setType9Store}
                      isSubDealer={type9IsSubDealer}
                      setIsSubDealer={setType9IsSubDealer}
                      subDealerStore={type9SubDealerStore}
                      setSubDealerStore={setType9SubDealerStore}
                      type9Sales={type9Sales}
                      setType9Sales={setType9Sales}
                      type9ProductItems={type9ProductItems}
                      addType9ProductItem={addType9ProductItem}
                      updateType9ProductItem={updateType9ProductItem}
                      deleteType9ProductItem={deleteType9ProductItem}
                      customers={customersList}
                      products={productsList}
                    />
                  )}

                  {/* Work Type 10: จัดงาน Field Day */}
                  {selectedWorkTypes.includes("จัดงาน Field Day") && (
                    <Type10FieldDay
                      readonly={readonly}
                      type10DemoPlot={type10DemoPlot}
                      setType10DemoPlot={setType10DemoPlot}
                      type10Location={type10Location}
                      setType10Location={setType10Location}
                      type10TargetCrop={type10TargetCrop}
                      setType10TargetCrop={setType10TargetCrop}
                      type10Showcase={type10Showcase}
                      setType10Showcase={setType10Showcase}
                      type10Attendees={type10Attendees}
                      setType10Attendees={setType10Attendees}
                      type10BookingSales={type10BookingSales}
                      setType10BookingSales={setType10BookingSales}
                    />
                  )}

                  {/* Work Type 11: ตรวจเช็กสต็อกหน้าร้าน */}
                  {selectedWorkTypes.includes("ตรวจเช็กสต็อกหน้าร้าน") && (
                    <Type11Stock
                      readonly={readonly}
                      type11Stores={type11Stores}
                      setType11Stores={setType11Stores}
                      customers={customersList}
                    />
                  )}
                </div>
              </div>
            )}

            {/* SECTION 4: สถานที่และทีมงาน (Location & Team) */}
            <LocationTeamSection
              selectedWorkTypes={selectedWorkTypes}
              readonly={readonly}
              helperSearch={helperSearch}
              setHelperSearch={setHelperSearch}
              showHelperDropdown={showHelperDropdown}
              setShowHelperDropdown={setShowHelperDropdown}
              filteredEmployees={filteredEmployees}
              addHelper={addHelper}
              helperEmployeeIds={helperEmployeeIds}
              employees={employees}
              removeHelper={removeHelper}
              locationText={locationText}
              setLocationText={setLocationText}
            />

            {/* SECTION 5: งบประมาณและค่าใช้จ่าย (Budget & Expenses) */}
            <BudgetSection
              selectedWorkTypes={selectedWorkTypes}
              readonly={readonly}
              isPromotionalMediaSelected={isPromotionalMediaSelected}
              setIsPromotionalMediaSelected={setIsPromotionalMediaSelected}
              isSalesPromotionSelected={isSalesPromotionSelected}
              setIsSalesPromotionSelected={setIsSalesPromotionSelected}
              marketingProductItems={marketingProductItems}
              marketingBudgetAmount={marketingBudgetAmount}
              setMarketingBudgetAmount={setMarketingBudgetAmount}
              addMarketingProductItem={addMarketingProductItem}
              updateMarketingProductItem={updateMarketingProductItem}
              deleteMarketingProductItem={deleteMarketingProductItem}
              salesPromotionItems={salesPromotionItems}
              addSalesPromotionRow={addSalesPromotionRow}
              updateSalesPromotionRow={updateSalesPromotionRow}
              deleteSalesPromotionRow={deleteSalesPromotionRow}
              targetSales={(() => {
                let total = 0;
                if (
                  selectedWorkTypes.includes("จัดกิจกรรมส่งเสริมการขายหน้าร้าน")
                ) {
                  total +=
                    type9ProductItems.length > 0
                      ? type9ProductItems.reduce(
                          (sum, item) =>
                            sum +
                            (item.quantityCases || 0) *
                              (item.pricePerCase || 0),
                          0,
                        )
                      : type9Sales || 0;
                }
                if (selectedWorkTypes.includes("จัดงาน Field Day")) {
                  total += type10BookingSales || 0;
                }
                return total;
              })()}
            />

            {/* SECTION 6: ข้อมูลเพิ่มเติม (Additional Info) */}
            <SectionHeader title="ข้อมูลเพิ่มเติม" color="gray" />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">
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

            {/* Bottom Action Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4 border-t border-slate-100">
              {onCancel && (
                <Button
                  type="button"
                  onClick={onCancel}
                  disabled={loading}
                  className="w-full sm:w-32 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-xl h-11 shadow-sm flex items-center justify-center gap-1.5"
                >
                  <X className="h-4 w-4" />
                  <span>ยกเลิก</span>
                </Button>
              )}

              {!readonly && (
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-32 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl h-11 shadow-md flex items-center justify-center gap-1.5"
                >
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>{loading ? "กำลังบันทึก..." : submitLabel}</span>
                </Button>
              )}
            </div>
          </form>
        </div>
      </Card>
    </section>
  );
}
