"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  User,
  FileText,
  Check,
  X,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/custom/section-header";
import { cn } from "@/lib/utils";
import type { ActivityPlanFormValues } from "../../application/validations";
import { DateTimePicker } from "./components/date-time-picker";
import { FormActionButtons } from "../../ui/form-action-buttons";

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
  promotionalMaterialsByCategory?: Record<
    string,
    Array<{ name: string; price: number; unit?: string }>
  >;
  onSubmit: (payload: ActivityPlanFormValues) => Promise<SubmitResult | void>;
  onCancel?: () => void;
  submitLabel?: string;
  readonly?: boolean;
  isEdit?: boolean;
}

import {
  WORK_TYPES,
  WORK_TYPE_CONFIG,
  getWorkTypeCode,
  getWorkTypeName,
  DEMO_OWNERS,
  DEMO_PRODUCTS,
  DEMO_PRODUCT_PRICES,
  MARKETING_PRODUCT_CATEGORIES,
  USER_DEMO_PLOTS,
  isFieldDayItem,
  type UserDemoPlotOption,
} from "../../constants";

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
import { Type12Tour } from "./components/work-types/type12-tour";
import { getDemoPlotsAction } from "../../server/actions";

export function ActivityPlanForm({
  initial = {},
  employees = [],
  customers: initialCustomers = [],
  products: initialProducts = [],
  demoPlots: initialDemoPlots = [],
  promotionalMaterialsByCategory,
  onSubmit,
  onCancel,
  submitLabel = "บันทึก",
  readonly = false,
  isEdit = false,
}: Props) {
  const [fetchedCustomers, setFetchedCustomers] = useState<any[]>([]);
  const [fetchedProducts, setFetchedProducts] = useState<any[]>([]);
  const [fetchedDemoPlots, setFetchedDemoPlots] = useState<
    UserDemoPlotOption[]
  >([]);
  const [fetchedMaterialsByCategory, setFetchedMaterialsByCategory] = useState<
    | Record<string, Array<{ name: string; price: number; unit?: string }>>
    | undefined
  >(promotionalMaterialsByCategory);

  useEffect(() => {
    if (promotionalMaterialsByCategory) {
      setFetchedMaterialsByCategory(promotionalMaterialsByCategory);
      return;
    }

    let isMounted = true;
    async function loadPromotionalMaterials() {
      try {
        const { getActivePromotionalMaterialsGroupedAction } =
          await import("../../server/actions");
        const res = await getActivePromotionalMaterialsGroupedAction();
        if (isMounted && res.success && res.grouped) {
          setFetchedMaterialsByCategory(res.grouped);
        }
      } catch (err) {
        console.error(
          "Failed to load promotional materials for Trip Plan:",
          err,
        );
      }
    }
    loadPromotionalMaterials();
    return () => {
      isMounted = false;
    };
  }, [promotionalMaterialsByCategory]);

  const customersList =
    initialCustomers && initialCustomers.length > 0
      ? initialCustomers
      : fetchedCustomers;

  const productsList =
    initialProducts && initialProducts.length > 0
      ? initialProducts
      : fetchedProducts;

  const demoPlotsList =
    initialDemoPlots && initialDemoPlots.length > 0
      ? initialDemoPlots
      : fetchedDemoPlots;

  useEffect(() => {
    if (initialCustomers && initialCustomers.length > 0) return;

    let isMounted = true;
    async function loadCustomers() {
      try {
        const res = await fetch("/api/customers?perPage=1000").then((r) =>
          r.json(),
        );
        if (isMounted && res.customers) {
          setFetchedCustomers(res.customers);
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
    if (initialProducts && initialProducts.length > 0) return;

    let isMounted = true;
    async function loadProducts() {
      try {
        const res = await fetch(
          "/api/products?status=ACTIVE&perPage=1000",
        ).then((r) => r.json());
        if (isMounted && res.products) {
          setFetchedProducts(res.products);
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

  useEffect(() => {
    if (initialDemoPlots && initialDemoPlots.length > 0) return;

    let isMounted = true;
    async function loadDemoPlots() {
      try {
        const res = await getDemoPlotsAction();
        if (isMounted && res.success && res.demoPlots) {
          setFetchedDemoPlots(res.demoPlots);
        }
      } catch (err) {
        console.error("Failed to load demo plots for Trip Plan:", err);
      }
    }
    loadDemoPlots();
    return () => {
      isMounted = false;
    };
  }, [initialDemoPlots]);
  // Format initial dates
  // กำหนด defaultTime ให้เป็น "08:00" ถ้าไม่ได้ส่งเข้ามา
  const parseInitialDate = (
    date?: Date | string,
    defaultTime: string = "08:00",
  ) => {
    if (!date)
      return {
        dateStr: format(new Date(), "yyyy-MM-dd"),
        timeStr: defaultTime,
      };

    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime()))
      return {
        dateStr: format(new Date(), "yyyy-MM-dd"),
        timeStr: defaultTime,
      };

    return {
      dateStr: format(d, "yyyy-MM-dd"),
      timeStr: format(d, "HH:mm"),
    };
  };

  // เรียกใช้งาน: startDate ใช้ 08:00 ส่วน endDate ส่ง "09:00" เข้าไป
  const initStart = parseInitialDate(initial.startDate);
  const initEnd = parseInitialDate(initial.endDate, "09:00");

  // Form Basic State
  const [title, setTitle] = useState(initial.title ?? "");
  const [startDate, setStartDate] = useState(initStart.dateStr);
  const [startTime, setStartTime] = useState(initStart.timeStr);
  const [endDate, setEndDate] = useState(initEnd.dateStr);
  const [endTime, setEndTime] = useState(initEnd.timeStr);

  // Work types selection state
  const initialTypes = useMemo(() => {
    const detectedTypes = new Set<string>();

    // 1. Direct check from normalized relation
    if (
      (initial as any)?.workTypes &&
      Array.isArray((initial as any).workTypes) &&
      (initial as any).workTypes.length > 0
    ) {
      const typesFromRelation = (initial as any).workTypes
        .map(
          (wt: any) =>
            wt.activityType?.name ||
            getWorkTypeName(wt.activityTypeId || wt.workTypeCode),
        )
        .filter(Boolean);
      if (typesFromRelation.length > 0) {
        return WORK_TYPES.filter((t) => typesFromRelation.includes(t));
      }
    }
    if ((initial as any)?.tour) {
      detectedTypes.add("ทัวร์");
    }

    const initialTypesRaw =
      (initial as any)?.activityType || (initial as any)?.activityTypeId || "";
    if (typeof initialTypesRaw === "string") {
      initialTypesRaw
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean)
        .forEach((t) => {
          if (WORK_TYPES.includes(t)) {
            detectedTypes.add(t);
          } else {
            const idx = parseInt(t.replace("TYPE_", ""), 10) - 1;
            if (idx >= 0 && idx < WORK_TYPES.length) {
              detectedTypes.add(WORK_TYPES[idx]);
            }
          }
        });
    }

    // Match explicit section headers in objective or title (do not scan description to avoid marketing/budget false-positives)
    const objectiveText = [initial.objective, initial.title]
      .filter(Boolean)
      .join("\n");

    if (objectiveText) {
      if (
        objectiveText.includes("[เข้าพบร้านค้า") ||
        objectiveText.includes("เข้าพบร้านค้า") ||
        objectiveText.includes("Key Farmer")
      ) {
        detectedTypes.add(WORK_TYPES[0]);
      }
      if (
        objectiveText.includes("[ติดตามผลการใช้สินค้า]") ||
        objectiveText.includes("ติดตามผลการใช้สินค้า")
      ) {
        detectedTypes.add(WORK_TYPES[1]);
      }
      if (
        objectiveText.includes("[เสนอขายสินค้า]") ||
        objectiveText.includes("เสนอขายสินค้า")
      ) {
        detectedTypes.add(WORK_TYPES[2]);
      }
      if (
        objectiveText.includes("[วางบิล") ||
        objectiveText.includes("วางบิล / เก็บเงิน") ||
        objectiveText.includes("วางบิล/เก็บเงิน") ||
        objectiveText.includes("เป้ายอดเก็บเงิน")
      ) {
        detectedTypes.add(WORK_TYPES[3]);
      }
      if (
        objectiveText.includes("[สำรวจตลาด") ||
        objectiveText.includes("สำรวจตลาดของคู่แข่ง") ||
        objectiveText.includes("สำรวจตลาดคู่แข่ง")
      ) {
        detectedTypes.add(WORK_TYPES[4]);
      }
      if (
        objectiveText.includes("[แก้ปัญหา") ||
        objectiveText.includes("แก้ปัญหา / รับเรื่องร้องเรียน") ||
        objectiveText.includes("แก้ปัญหา/ร้องเรียน") ||
        objectiveText.includes("รับเรื่องร้องเรียน")
      ) {
        detectedTypes.add(WORK_TYPES[5]);
      }
      if (
        objectiveText.includes("[ติดตามแปลงสาธิต") ||
        objectiveText.includes("ติดตามแปลงสาธิต / ทำแปลง") ||
        objectiveText.includes("ทำแปลงสาธิต") ||
        (objectiveText.includes("แปลงสาธิต") &&
          !objectiveText.includes("Field Day") &&
          !objectiveText.includes("[Field Day]"))
      ) {
        detectedTypes.add(WORK_TYPES[6]);
      }
      if (
        objectiveText.includes("[จัดประชุม") ||
        objectiveText.includes("จัดประชุมการเกษตร") ||
        objectiveText.includes("ประชุมการเกษตร")
      ) {
        detectedTypes.add(WORK_TYPES[7]);
      }
      if (
        objectiveText.includes("[กิจกรรมหน้าร้าน]") ||
        objectiveText.includes("จัดกิจกรรมส่งเสริมการขายหน้าร้าน")
      ) {
        detectedTypes.add(WORK_TYPES[8]);
      }
      if (
        objectiveText.includes("[Field Day]") ||
        objectiveText.includes("Field Day") ||
        objectiveText.includes("จัดงาน Field Day")
      ) {
        detectedTypes.add(WORK_TYPES[9]);
      }
      if (
        objectiveText.includes("[ตรวจเช็กสต็อก") ||
        objectiveText.includes("ตรวจเช็กสต็อกหน้าร้าน") ||
        objectiveText.includes("เช็กสต็อกหน้าร้าน") ||
        objectiveText.includes("สต็อกหน้าร้าน")
      ) {
        detectedTypes.add(WORK_TYPES[10]);
      }
      if (
        objectiveText.includes("[ทัวร์]") ||
        objectiveText.includes("[ทัวร์กลาง]") ||
        objectiveText.includes("[ทัวร์ร้านค้า]") ||
        objectiveText.includes("ทัวร์กลาง") ||
        objectiveText.includes("ทัวร์ร้านค้า") ||
        objectiveText.includes("ทัวร์")
      ) {
        detectedTypes.add(WORK_TYPES[11]);
      }
    }

    const items = (initial as any)?.details;
    if (Array.isArray(items)) {
      // Filter out promotional media and sales promotions to prevent false positive work types
      const actualItems = items.filter(
        (item: any) =>
          item.itemType !== "MARKETING_PRODUCT" &&
          item.itemType !== "SALES_PROMOTION" &&
          item.visitTopic !== "MARKETING_PRODUCT" &&
          item.visitTopic !== "SALES_PROMOTION",
      );

      for (const item of actualItems) {
        const isFD = isFieldDayItem(item);

        if (
          item.itemType === "TYPE_1" ||
          (item.visitTopic &&
            item.visitTopic !== "FOLLOWUP" &&
            item.visitTopic !== "MARKETING_PRODUCT" &&
            item.visitTopic !== "SALES_PROMOTION")
        ) {
          detectedTypes.add(WORK_TYPES[0]);
        }
        if (
          item.itemType === "TYPE_2" ||
          item.visitTopic === "FOLLOWUP" ||
          item.followupProductName
        ) {
          detectedTypes.add(WORK_TYPES[1]);
        }
        if (
          !isFD &&
          (item.itemType === "TYPE_3" ||
            item.saleProductName ||
            (item.saleQuantity != null && item.saleUnitPrice != null) ||
            (item.saleTotalPrice != null &&
              !item.storeTotalAmount &&
              !item.collectAmount &&
              item.meetingAttendeesCount == null))
        ) {
          detectedTypes.add(WORK_TYPES[2]);
        }
        if (
          !isFD &&
          (item.itemType === "TYPE_4" ||
            (item.collectAmount != null &&
              item.visitTopic !== "SALES_PROMOTION"))
        ) {
          detectedTypes.add(WORK_TYPES[3]);
        }
        if (
          item.itemType === "TYPE_5" ||
          item.surveyCompetitorProduct ||
          (item.surveyStoreName && item.itemType !== "TYPE_9")
        ) {
          detectedTypes.add(WORK_TYPES[4]);
        }
        if (item.itemType === "TYPE_6" || item.issueType) {
          detectedTypes.add(WORK_TYPES[5]);
        }
        if (
          !isFD &&
          (item.itemType === "TYPE_7" ||
            item.plotActivityType ||
            item.existingPlotId ||
            ((item.plotCropName ||
              item.plotOwnerName ||
              item.plotAreaRai != null) &&
              !item.storePricePerCase))
        ) {
          detectedTypes.add(WORK_TYPES[6]);
        }
        if (
          !isFD &&
          (item.itemType === "TYPE_8" ||
            item.meetingTopic ||
            item.meetingTargetProducts ||
            (item.meetingAttendeesCount != null && !item.storeProductName))
        ) {
          detectedTypes.add(WORK_TYPES[7]);
        }
        if (
          !isFD &&
          (item.itemType === "TYPE_9" ||
            (item.storeProductName &&
              item.visitTopic !== "MARKETING_PRODUCT") ||
            (item.storeQuantityCases != null &&
              item.visitTopic !== "MARKETING_PRODUCT") ||
            (item.storePricePerCase != null &&
              item.visitTopic !== "MARKETING_PRODUCT") ||
            (item.storeTotalAmount != null &&
              item.visitTopic !== "MARKETING_PRODUCT"))
        ) {
          detectedTypes.add(WORK_TYPES[8]);
        }
        if (isFD || item.itemType === "TYPE_10") {
          detectedTypes.add(WORK_TYPES[9]);
        }
        if (
          item.itemType === "TYPE_11" ||
          item.targetOpportunity ||
          (item.detail && item.detail.includes("ตรวจเช็กสต็อกหน้าร้าน"))
        ) {
          detectedTypes.add(WORK_TYPES[10]);
        }
        if (
          item.itemType === "TYPE_12" ||
          (item.detail && item.detail.includes("[ทัวร์")) ||
          (item.visitTopic &&
            (item.visitTopic === "ทัวร์กลาง" ||
              item.visitTopic === "ทัวร์ร้านค้า"))
        ) {
          detectedTypes.add(WORK_TYPES[11]);
        }
      }
    }

    return WORK_TYPES.filter((t) => detectedTypes.has(t));
  }, [initial]);

  const [selectedWorkTypes, setSelectedWorkTypes] =
    useState<string[]>(initialTypes);
  const [tempSelectedWorkTypes, setTempSelectedWorkTypes] =
    useState<string[]>(initialTypes);
  const [isWorkTypesDropdownOpen, setIsWorkTypesDropdownOpen] = useState(false);
  const workTypesDropdownRef = useRef<HTMLDivElement>(null);

  const initDetails = (initial as any)?.details;

  // Work Type 1: เข้าพบร้านค้า / Key Farmer
  const [type1Items, setType1Items] = useState<Type1VisitItem[]>(() => {
    if (
      initDetails?.type1Items &&
      Array.isArray(initDetails.type1Items) &&
      initDetails.type1Items.length > 0
    ) {
      return initDetails.type1Items;
    }
    if (Array.isArray(initDetails) && initDetails.length > 0) {
      const items = initDetails.filter(
        (item: any) =>
          item.visitTopic !== "MARKETING_PRODUCT" &&
          item.visitTopic !== "SALES_PROMOTION" &&
          item.itemType !== "MARKETING_PRODUCT" &&
          item.itemType !== "SALES_PROMOTION" &&
          (item.visitTopic || item.itemType === "TYPE_1"),
      );
      if (items.length > 0) {
        return items.map((item: any, idx: number) => ({
          id: item.id || String(idx + 1),
          customerName:
            item.customerName || item.storeName || item.ownerName || "",
          topic: item.visitTopic || item.topic || "แจ้งข่าวสาร",
          detail: item.detail || "",
        }));
      }
    }
    return [
      {
        id: "1",
        customerName: "",
        topic: "แจ้งข่าวสาร",
        detail: "",
      },
    ];
  });

  const addType1Row = () => {
    const newItem: Type1VisitItem = {
      id: Date.now().toString(),
      customerName: "",
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
    () => {
      if (
        initDetails?.type2Items &&
        Array.isArray(initDetails.type2Items) &&
        initDetails.type2Items.length > 0
      ) {
        return initDetails.type2Items;
      }
      if (Array.isArray(initDetails) && initDetails.length > 0) {
        const items = initDetails.filter(
          (item: any) =>
            item.itemType !== "MARKETING_PRODUCT" &&
            item.itemType !== "SALES_PROMOTION" &&
            item.visitTopic !== "MARKETING_PRODUCT" &&
            item.visitTopic !== "SALES_PROMOTION" &&
            (item.followupProductName || item.itemType === "TYPE_2"),
        );
        if (items.length > 0) {
          return items.map((item: any, idx: number) => ({
            id: item.id || String(idx + 1),
            productName:
              item.followupProductName ||
              item.productName ||
              DEMO_PRODUCTS[0] ||
              "",
            customerName: item.customerName || item.ownerName || "",
            detail: item.detail || "",
          }));
        }
      }
      return [
        {
          id: "1",
          productName: "",
          customerName: "",
          detail: "",
        },
      ];
    },
  );

  const addType2Row = () => {
    const newItem: Type2ProductFollowupItem = {
      id: Date.now().toString(),
      productName: "",
      customerName: "",
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

  const [type3Items, setType3Items] = useState<Type3SalesItem[]>(() => {
    if (
      initDetails?.type3Items &&
      Array.isArray(initDetails.type3Items) &&
      initDetails.type3Items.length > 0
    ) {
      return initDetails.type3Items;
    }
    if (Array.isArray(initDetails) && initDetails.length > 0) {
      const items = initDetails.filter(
        (item: any) =>
          !isFieldDayItem(item) &&
          item.itemType !== "MARKETING_PRODUCT" &&
          item.itemType !== "SALES_PROMOTION" &&
          item.visitTopic !== "MARKETING_PRODUCT" &&
          item.visitTopic !== "SALES_PROMOTION" &&
          (item.itemType === "TYPE_3" || item.saleProductName),
      );
      if (items.length > 0) {
        return items.map((item: any, idx: number) => {
          const qty = item.saleQuantity != null ? Number(item.saleQuantity) : 1;
          const uPrice =
            item.saleUnitPrice != null ? Number(item.saleUnitPrice) : 0;
          const totalPrice =
            item.saleTotalPrice != null
              ? Number(item.saleTotalPrice)
              : qty * uPrice;
          return {
            id: item.id || String(idx + 1),
            customerName: item.customerName || "",
            products: [
              {
                id: "p-" + idx,
                productName: item.saleProductName || "",
                quantity: qty,
                unitPrice: uPrice,
                price: totalPrice,
              },
            ],
            productName: item.saleProductName || "",
            quantity: qty,
            unitPrice: uPrice,
            price: totalPrice,
            detail: item.detail || "",
          };
        });
      }
    }
    return [
      {
        id: "1",
        customerName: "",
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
    ];
  });

  const addType3Row = () => {
    const newItem: Type3SalesItem = {
      id: Date.now().toString(),
      customerName: "",
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
  const [type4Items, setType4Items] = useState<Type4CollectItem[]>(() => {
    if (
      initDetails?.type4Items &&
      Array.isArray(initDetails.type4Items) &&
      initDetails.type4Items.length > 0
    ) {
      return initDetails.type4Items;
    }
    if (Array.isArray(initDetails) && initDetails.length > 0) {
      const items = initDetails.filter(
        (item: any) =>
          !isFieldDayItem(item) &&
          item.itemType !== "MARKETING_PRODUCT" &&
          item.itemType !== "SALES_PROMOTION" &&
          item.visitTopic !== "MARKETING_PRODUCT" &&
          item.visitTopic !== "SALES_PROMOTION" &&
          (item.itemType === "TYPE_4" ||
            (item.collectAmount != null && !item.visitTopic)),
      );
      if (items.length > 0) {
        return items.map((item: any, idx: number) => ({
          id: item.id || String(idx + 1),
          customerName: item.customerName || "",
          collectAmount: item.collectAmount ? Number(item.collectAmount) : 0,
          detail: item.detail || "",
        }));
      }
    }
    return [
      {
        id: "1",
        customerName: "",
        collectAmount: 0,
        detail: "",
      },
    ];
  });
  const addType4Row = () => {
    setType4Items((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        customerName: "",
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
  const [type5Items, setType5Items] = useState<Type5SurveyItem[]>(() => {
    if (
      initDetails?.type5Items &&
      Array.isArray(initDetails.type5Items) &&
      initDetails.type5Items.length > 0
    ) {
      return initDetails.type5Items;
    }
    if (Array.isArray(initDetails) && initDetails.length > 0) {
      const items = initDetails.filter(
        (item: any) =>
          !isFieldDayItem(item) &&
          item.itemType !== "MARKETING_PRODUCT" &&
          item.itemType !== "SALES_PROMOTION" &&
          (item.itemType === "TYPE_5" ||
            item.surveyCompetitorProduct ||
            item.surveyStoreName),
      );
      if (items.length > 0) {
        return items.map((item: any, idx: number) => ({
          id: item.id || String(idx + 1),
          storeName: item.surveyStoreName || item.storeName || "",
          comparedProduct:
            item.surveyCompetitorProduct || DEMO_PRODUCTS[0] || "",
          detail: item.detail || "",
        }));
      }
    }
    return [
      {
        id: "1",
        storeName: "",
        comparedProduct: DEMO_PRODUCTS[0] || "",
        detail: "",
      },
    ];
  });
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
  const [type6Items, setType6Items] = useState<Type6IssueItem[]>(() => {
    if (
      initDetails?.type6Items &&
      Array.isArray(initDetails.type6Items) &&
      initDetails.type6Items.length > 0
    ) {
      return initDetails.type6Items;
    }
    if (Array.isArray(initDetails) && initDetails.length > 0) {
      const items = initDetails.filter(
        (item: any) =>
          !isFieldDayItem(item) &&
          item.itemType !== "MARKETING_PRODUCT" &&
          item.itemType !== "SALES_PROMOTION" &&
          (item.itemType === "TYPE_6" || item.issueType),
      );
      if (items.length > 0) {
        return items.map((item: any, idx: number) => ({
          id: item.id || String(idx + 1),
          customerName: item.customerName || "",
          issueType: item.issueType || "เคลมของ",
          detail: item.detail || "",
        }));
      }
    }
    return [
      {
        id: "1",
        customerName: "",
        issueType: "เคลมของ",
        detail: "",
      },
    ];
  });
  const addType6Row = () => {
    setType6Items((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        customerName: "",
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
  const [type7Items, setType7Items] = useState<Type7DemoPlotItem[]>(() => {
    if (
      initDetails?.type7Items &&
      Array.isArray(initDetails.type7Items) &&
      initDetails.type7Items.length > 0
    ) {
      return initDetails.type7Items;
    }
    if (Array.isArray(initDetails) && initDetails.length > 0) {
      const items = initDetails.filter(
        (item: any) =>
          !isFieldDayItem(item) &&
          item.itemType !== "MARKETING_PRODUCT" &&
          item.itemType !== "SALES_PROMOTION" &&
          item.visitTopic !== "MARKETING_PRODUCT" &&
          item.visitTopic !== "SALES_PROMOTION" &&
          (item.itemType === "TYPE_7" ||
            item.plotActivityType ||
            item.plotOwnerName ||
            item.plotAreaRai != null),
      );
      if (items.length > 0) {
        return items.map((item: any, idx: number) => {
          const rawDetail = item.detail || "";
          const objMatch = rawDetail.match(
            /(?:วัตถุประสงค์ของแปลง|วัตถุประสงค์):\s*([^|]+)/,
          );
          const expMatch = rawDetail.match(
            /(?:รายละเอียด \/ วิธีการทดลอง|วิธีการทดลอง|รายละเอียดการทดลอง):\s*([^|]+)/,
          );

          const parsedObjective = objMatch
            ? objMatch[1].trim()
            : item.objective || "";
          const parsedExperiment = expMatch
            ? expMatch[1].trim()
            : item.experimentDetail ||
              (!objMatch && rawDetail ? rawDetail : "");

          return {
            id: item.id || String(idx + 1),
            plotActivityType: item.plotActivityType || "CREATE",
            ownerName: item.plotOwnerName || item.ownerName || "",
            productName: item.plotProductName || item.productName || "",
            cropCategory: item.plotCropCategory || item.cropCategory || "",
            cropName: item.plotCropName || item.cropName || "",
            customCropName: item.customCropName || "",
            areaRai: item.plotAreaRai
              ? Number(item.plotAreaRai)
              : item.areaRai || 0,
            treeCount: item.plotTreeCount ?? item.treeCount ?? 0,
            startDate:
              item.startDate || startDate || format(new Date(), "yyyy-MM-dd"),
            followUpDate:
              item.followUpDate ||
              startDate ||
              format(new Date(), "yyyy-MM-dd"),
            objective: parsedObjective,
            experimentDetail: parsedExperiment,
            plotsCount:
              item.plotCount != null
                ? Number(item.plotCount)
                : item.plotsCount != null && item.plotsCount !== ""
                  ? Number(item.plotsCount)
                  : "",
            existingPlotId: item.existingPlotId || "",
            detail: rawDetail,
          };
        });
      }
    }
    return [
      {
        id: "1",
        plotActivityType: "CREATE",
        ownerName: "",
        productName: "",
        cropCategory: "",
        cropName: "",
        areaRai: 0,
        treeCount: 0,
        startDate: format(new Date(), "yyyy-MM-dd"),
        followUpDate: startDate || format(new Date(), "yyyy-MM-dd"),
        objective: "",
        plotsCount: "",
        detail: "",
      },
    ];
  });
  const addType7Row = () => {
    setType7Items((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        plotActivityType: "CREATE",
        ownerName: "",
        productName: "",
        cropCategory: "",
        cropName: "",
        customCropName: "",
        areaRai: 0,
        treeCount: 0,
        startDate: startDate || format(new Date(), "yyyy-MM-dd"),
        followUpDate: startDate || format(new Date(), "yyyy-MM-dd"),
        objective: "",
        plotsCount: "",
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
  const [type8Items, setType8Items] = useState<Type8MeetingItem[]>(() => {
    if (
      initDetails?.type8Items &&
      Array.isArray(initDetails.type8Items) &&
      initDetails.type8Items.length > 0
    ) {
      return initDetails.type8Items;
    }
    if (Array.isArray(initDetails) && initDetails.length > 0) {
      const items = initDetails.filter(
        (item: any) =>
          !isFieldDayItem(item) &&
          item.itemType !== "MARKETING_PRODUCT" &&
          item.itemType !== "SALES_PROMOTION" &&
          (item.itemType === "TYPE_8" ||
            item.meetingTopic ||
            item.meetingAttendeesCount != null),
      );
      if (items.length > 0) {
        return items.map((item: any, idx: number) => ({
          id: item.id || String(idx + 1),
          topic: item.meetingTopic || item.topic || "",
          targetProducts: item.meetingTargetProducts
            ? Array.isArray(item.meetingTargetProducts)
              ? item.meetingTargetProducts
              : String(item.meetingTargetProducts)
                  .split(",")
                  .map((s: string) => s.trim())
            : [],
          attendeesCount:
            item.meetingAttendeesCount ?? item.attendeesCount ?? 1,
          detail: item.detail || "",
        }));
      }
    }
    return [
      {
        id: "1",
        topic: "",
        targetProducts: [],
        attendeesCount: 1,
        detail: "",
      },
    ];
  });
  const addType8Row = () => {
    setType8Items((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        topic: "",
        targetProducts: [],
        attendeesCount: 1,
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

  const [type9Store, setType9Store] = useState(() => {
    if (initDetails?.type9Store) return initDetails.type9Store;
    if (Array.isArray(initDetails)) {
      const item = initDetails.find(
        (i: any) =>
          !isFieldDayItem(i) &&
          (i.itemType === "TYPE_9" ||
            (i.itemType !== "MARKETING_PRODUCT" &&
              i.itemType !== "SALES_PROMOTION" &&
              i.visitTopic !== "MARKETING_PRODUCT" &&
              i.visitTopic !== "SALES_PROMOTION" &&
              i.storeProductName &&
              !i.plotCropCategory)),
      );
      if (item && item.customerName) {
        const match = item.customerName.match(
          /^(.*?)\s*\((?:ร้าน\s*)?Sub Dealer:\s*(.*?)\)$/i,
        );
        if (match) return match[1].trim();
        return item.customerName;
      }
    }
    return "";
  });
  const [type9IsSubDealer, setType9IsSubDealer] = useState(() => {
    if (initDetails?.type9IsSubDealer !== undefined)
      return initDetails.type9IsSubDealer;
    if (Array.isArray(initDetails)) {
      const item = initDetails.find(
        (i: any) =>
          !isFieldDayItem(i) &&
          (i.itemType === "TYPE_9" ||
            (i.itemType !== "MARKETING_PRODUCT" &&
              i.itemType !== "SALES_PROMOTION" &&
              i.visitTopic !== "MARKETING_PRODUCT" &&
              i.visitTopic !== "SALES_PROMOTION" &&
              i.storeProductName &&
              !i.plotCropCategory)),
      );
      if (item && item.customerName) {
        return /\((?:ร้าน\s*)?Sub Dealer:/i.test(item.customerName);
      }
    }
    return false;
  });
  const [type9SubDealerStore, setType9SubDealerStore] = useState(() => {
    if (initDetails?.type9SubDealerStore !== undefined)
      return initDetails.type9SubDealerStore;
    if (Array.isArray(initDetails)) {
      const item = initDetails.find(
        (i: any) =>
          !isFieldDayItem(i) &&
          (i.itemType === "TYPE_9" ||
            (i.itemType !== "MARKETING_PRODUCT" &&
              i.itemType !== "SALES_PROMOTION" &&
              i.visitTopic !== "MARKETING_PRODUCT" &&
              i.visitTopic !== "SALES_PROMOTION" &&
              i.storeProductName &&
              !i.plotCropCategory)),
      );
      if (item && item.customerName) {
        const match = item.customerName.match(
          /\((?:ร้าน\s*)?Sub Dealer:\s*(.*?)\)/i,
        );
        if (match) return match[1].trim();
      }
    }
    return "";
  });
  const [type9Sales, setType9Sales] = useState<number>(() => {
    if (initDetails?.type9Sales !== undefined) return initDetails.type9Sales;
    if (Array.isArray(initDetails)) {
      const items = initDetails.filter(
        (i: any) =>
          !isFieldDayItem(i) &&
          (i.itemType === "TYPE_9" ||
            (i.itemType !== "MARKETING_PRODUCT" &&
              i.itemType !== "SALES_PROMOTION" &&
              i.visitTopic !== "MARKETING_PRODUCT" &&
              i.visitTopic !== "SALES_PROMOTION" &&
              i.storeProductName &&
              !i.plotCropCategory)),
      );
      if (items.length > 0) {
        const sum = items.reduce(
          (acc: number, cur: any) =>
            acc +
            (cur.storeTotalAmount != null
              ? Number(cur.storeTotalAmount)
              : (Number(cur.storeQuantityCases) || 0) *
                (Number(cur.storePricePerCase) || 0)),
          0,
        );
        if (sum > 0) return sum;
      }
    }
    return 0;
  });
  const [type9Products, setType9Products] = useState(
    initDetails?.type9Products ?? "",
  );
  const [type9ProductItems, setType9ProductItems] = useState<
    Type9ProductItem[]
  >(() => {
    if (
      initDetails?.type9ProductItems &&
      Array.isArray(initDetails.type9ProductItems) &&
      initDetails.type9ProductItems.length > 0
    ) {
      return initDetails.type9ProductItems;
    }
    if (Array.isArray(initDetails) && initDetails.length > 0) {
      const items = initDetails.filter(
        (item: any) =>
          !isFieldDayItem(item) &&
          item.itemType !== "MARKETING_PRODUCT" &&
          item.itemType !== "SALES_PROMOTION" &&
          item.visitTopic !== "MARKETING_PRODUCT" &&
          item.visitTopic !== "SALES_PROMOTION" &&
          (item.itemType === "TYPE_9" ||
            (item.storeProductName && !item.plotCropCategory)),
      );
      const mapped = items
        .filter((item: any) => item.storeProductName || item.productName)
        .map((item: any, idx: number) => ({
          id: item.id || String(idx + 1),
          productName: item.storeProductName || item.productName || "",
          quantityCases: item.storeQuantityCases ?? item.quantityCases ?? 0,
          pricePerCase: item.storePricePerCase
            ? Number(item.storePricePerCase)
            : (item.pricePerCase ?? 0),
        }));
      if (mapped.length > 0) return mapped;
    }
    return [
      {
        id: "1",
        productName: "",
        quantityCases: 0,
        pricePerCase: 0,
      },
    ];
  });

  const [type10DemoPlot, setType10DemoPlot] = useState(() => {
    if (initDetails?.type10DemoPlot) return initDetails.type10DemoPlot;
    if (Array.isArray(initDetails)) {
      const item = initDetails.find(isFieldDayItem);
      if (item) return item.customerName || item.plotOwnerName || "";
    }
    return "";
  });
  const [type10Location, setType10Location] = useState(() => {
    if (initDetails?.type10Location) return initDetails.type10Location;
    if (Array.isArray(initDetails)) {
      const item = initDetails.find(isFieldDayItem);
      if (item?.detail) {
        const match = item.detail.match(/สถานที่:\s*([^|]+)/);
        if (match) return match[1].trim();
      }
    }
    return "";
  });
  const [type10TargetCrop, setType10TargetCrop] = useState(() => {
    if (initDetails?.type10TargetCrop) return initDetails.type10TargetCrop;
    if (Array.isArray(initDetails)) {
      const item = initDetails.find(isFieldDayItem);
      if (item?.plotCropName) return item.plotCropName;
      if (item?.detail) {
        const match = item.detail.match(/พืชเป้าหมาย:\s*([^|]+)/);
        if (match) return match[1].trim();
      }
    }
    return "";
  });
  const [type10Showcase, setType10Showcase] = useState(() => {
    if (initDetails?.type10Showcase) return initDetails.type10Showcase;
    if (Array.isArray(initDetails)) {
      const item = initDetails.find(isFieldDayItem);
      if (item?.plotProductName) return item.plotProductName;
      if (item?.detail) {
        const match = item.detail.match(/สินค้าโชว์:\s*([^|]+)/);
        if (match) return match[1].trim();
      }
    }
    return "";
  });
  const [type10Attendees, setType10Attendees] = useState<number>(() => {
    if (initDetails?.type10Attendees != null)
      return Number(initDetails.type10Attendees);
    if (Array.isArray(initDetails)) {
      const item = initDetails.find(isFieldDayItem);
      if (item?.meetingAttendeesCount != null)
        return Number(item.meetingAttendeesCount);
      if (item?.targetAttendees != null) return Number(item.targetAttendees);
      if (item?.detail) {
        const match =
          item.detail.match(/ผู้ร่วมงาน:\s*(\d+)/) ||
          item.detail.match(/เป้าผู้ร่วมงาน:\s*(\d+)/);
        if (match) return Number(match[1]);
      }
    }
    return 0;
  });
  const [type10BookingSales, setType10BookingSales] = useState<number>(() => {
    if (initDetails?.type10BookingSales != null)
      return Number(initDetails.type10BookingSales);
    if (Array.isArray(initDetails)) {
      const item = initDetails.find(isFieldDayItem);
      if (item?.saleTotalPrice != null) return Number(item.saleTotalPrice);
      if (item?.targetSales != null) return Number(item.targetSales);
      if (item?.detail) {
        const match = item.detail.match(/เป้ายอดจอง:\s*(?:฿)?([\d,]+)/);
        if (match) return Number(match[1].replace(/,/g, ""));
      }
    }
    return 0;
  });

  const [type11Stores, setType11Stores] = useState(() => {
    if (initDetails?.type11Stores) return initDetails.type11Stores;
    if (Array.isArray(initDetails)) {
      const item = initDetails.find((i: any) => i.itemType === "TYPE_11");
      if (item) return item.customerName || "";
    }
    return "";
  });

  // Work Type 12: ทัวร์
  const [type12TourType, setType12TourType] = useState<string>(() => {
    if ((initial as any)?.tour) {
      return (initial as any).tour.tourType === "STORE"
        ? "ทัวร์ร้านค้า"
        : "ทัวร์กลาง";
    }
    if (initDetails?.type12TourType) return initDetails.type12TourType;
    if (Array.isArray(initDetails)) {
      const item = initDetails.find(
        (i: any) =>
          i.itemType === "TYPE_12" ||
          (i.detail && i.detail.includes("[ทัวร์")) ||
          (i.visitTopic &&
            (i.visitTopic === "ทัวร์กลาง" || i.visitTopic === "ทัวร์ร้านค้า")),
      );
      if (item?.visitTopic) return item.visitTopic;
      if (item?.detail) {
        if (item.detail.includes("ทัวร์กลาง")) return "ทัวร์กลาง";
        if (item.detail.includes("ทัวร์ร้านค้า")) return "ทัวร์ร้านค้า";
      }
    }
    return "ทัวร์กลาง";
  });

  const [type12TourSize, setType12TourSize] = useState<string>(() => {
    if ((initial as any)?.tour) {
      return (initial as any).tour.tourSize === "LARGE"
        ? "ทัวร์ใหญ่"
        : "ทัวร์เล็ก";
    }
    if (initDetails?.type12TourSize) return initDetails.type12TourSize;
    if (Array.isArray(initDetails)) {
      const item = initDetails.find(
        (i: any) =>
          i.itemType === "TYPE_12" || (i.detail && i.detail.includes("[ทัวร์")),
      );
      if (item?.detail) {
        const m = item.detail.match(/ขนาดทัวร์:\s*([^|]+)/);
        if (m) return m[1].trim();
      }
    }
    return "ทัวร์เล็ก";
  });

  const [type12Country, setType12Country] = useState<string>(() => {
    if ((initial as any)?.tour) {
      return (initial as any).tour.country || "";
    }
    if (initDetails?.type12Country) return initDetails.type12Country;
    if (Array.isArray(initDetails)) {
      const item = initDetails.find(
        (i: any) =>
          i.itemType === "TYPE_12" || (i.detail && i.detail.includes("[ทัวร์")),
      );
      if (item?.detail) {
        const m = item.detail.match(/ประเทศ:\s*([^|]+)/);
        if (m) return m[1].trim();
      }
    }
    return "";
  });

  const [type12Store, setType12Store] = useState<string>(() => {
    if ((initial as any)?.tour) {
      return (initial as any).tour.store?.name || "";
    }
    if (initDetails?.type12Store) return initDetails.type12Store;
    if (Array.isArray(initDetails)) {
      const item = initDetails.find(
        (i: any) =>
          i.itemType === "TYPE_12" || (i.detail && i.detail.includes("[ทัวร์")),
      );
      if (item?.customerName) return item.customerName;
      if (item?.detail) {
        const m = item.detail.match(/ร้านค้า:\s*([^|]+)/);
        if (m) return m[1].trim();
      }
    }
    return "";
  });

  const [type12Destination, setType12Destination] = useState<string>(() => {
    if ((initial as any)?.tour) {
      return (initial as any).tour.destination || "";
    }
    if (initDetails?.type12Destination) return initDetails.type12Destination;
    if (Array.isArray(initDetails)) {
      const item = initDetails.find(
        (i: any) =>
          i.itemType === "TYPE_12" || (i.detail && i.detail.includes("[ทัวร์")),
      );
      if (item?.detail) {
        const m = item.detail.match(/สถานที่จะไป:\s*([^|]+)/);
        if (m) return m[1].trim();
      }
    }
    return "";
  });

  // Section 4: Location & Team State
  const [locationText, setLocationText] = useState(initial.location ?? "");
  const [helperEmployeeIds, setHelperEmployeeIds] = useState<string[]>(
    initial.helperEmployeeIds ?? [],
  );
  const [helperSearch, setHelperSearch] = useState("");
  const [showHelperDropdown, setShowHelperDropdown] = useState(false);

  // Section 5: Budget & Expenses State
  const [isPromotionalMediaSelected, setIsPromotionalMediaSelected] =
    useState<boolean>(() => {
      if (initDetails?.isPromotionalMediaSelected !== undefined) {
        return initDetails.isPromotionalMediaSelected;
      }
      if (Array.isArray(initDetails) && initDetails.length > 0) {
        const hasMkt = initDetails.some(
          (item: any) =>
            item.visitTopic === "MARKETING_PRODUCT" ||
            item.itemType === "MARKETING_PRODUCT",
        );
        if (hasMkt) return true;
      }
      return (
        (initial.marketingBudgetRequested ??
          (initial as any).marketingBudget ??
          0) > 0
      );
    });
  const [marketingBudgetAmount, setMarketingBudgetAmount] = useState<number>(
    initDetails?.marketingBudgetAmount ??
      initial.marketingBudgetRequested ??
      (initial as any).marketingBudget ??
      10000,
  );
  const [marketingProductItems, setMarketingProductItems] = useState<
    MarketingBudgetProductItem[]
  >(() => {
    if (
      initDetails?.marketingProductItems &&
      Array.isArray(initDetails.marketingProductItems) &&
      initDetails.marketingProductItems.length > 0
    ) {
      return initDetails.marketingProductItems;
    }
    if (Array.isArray(initDetails) && initDetails.length > 0) {
      const mktItems = initDetails.filter(
        (item: any) =>
          item.visitTopic === "MARKETING_PRODUCT" ||
          item.itemType === "MARKETING_PRODUCT",
      );
      if (mktItems.length > 0) {
        return mktItems.map((item: any, idx: number) => ({
          id: item.id || String(idx + 1),
          category:
            item.plotCropCategory ||
            item.category ||
            MARKETING_PRODUCT_CATEGORIES[0],
          productName: item.storeProductName || item.productName || "",
          quantityCases: item.storeQuantityCases ?? item.quantityCases ?? 1,
          unit: item.plotCropName || item.unit || "ชิ้น",
          pricePerCase: item.storePricePerCase
            ? Number(item.storePricePerCase)
            : (item.pricePerCase ?? 0),
        }));
      }
    }
    return [
      {
        id: "1",
        category: MARKETING_PRODUCT_CATEGORIES[0] || "Premium_item",
        productName: "สมุดฉีก",
        quantityCases: 1,
        unit: "เล่ม",
        pricePerCase: 25,
      },
    ];
  });

  const addMarketingProductItem = () => {
    const newItem: MarketingBudgetProductItem = {
      id: Date.now().toString(),
      category: "อื่นๆ",
      productName: "",
      quantityCases: 1,
      unit: "ชิ้น",
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
    useState<boolean>(() => {
      if (initDetails?.isSalesPromotionSelected !== undefined) {
        return initDetails.isSalesPromotionSelected;
      }
      if (Array.isArray(initDetails) && initDetails.length > 0) {
        const hasSp = initDetails.some(
          (item: any) =>
            item.visitTopic === "SALES_PROMOTION" ||
            item.itemType === "SALES_PROMOTION",
        );
        if (hasSp) return true;
      }
      return (
        (initial.salesPromotionBudgetRequested ??
          (initial as any).salesPromotionBudget ??
          0) > 0
      );
    });

  const [salesPromotionItems, setSalesPromotionItems] = useState<
    SalesPromotionItem[]
  >(() => {
    if (
      initDetails?.salesPromotionItems &&
      Array.isArray(initDetails.salesPromotionItems) &&
      initDetails.salesPromotionItems.length > 0
    ) {
      return initDetails.salesPromotionItems;
    }
    if (Array.isArray(initDetails) && initDetails.length > 0) {
      const spItems = initDetails.filter(
        (item: any) =>
          item.visitTopic === "SALES_PROMOTION" ||
          item.itemType === "SALES_PROMOTION",
      );
      if (spItems.length > 0) {
        return spItems.map((item: any, idx: number) => ({
          id: item.id || String(idx + 1),
          budgetType: item.plotCropCategory || item.budgetType || "งบการตลาด",
          detail: item.detail || "",
          amount: item.collectAmount
            ? Number(item.collectAmount)
            : (item.amount ?? 0),
        }));
      }
    }
    return [];
  });

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
    const newItem: Type9ProductItem = {
      id: Date.now().toString(),
      productName: "",
      quantityCases: 0,
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
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: val };
        if (field === "productName") {
          const foundProd = productsList.find((p) => p.name === val);
          if (foundProd && foundProd.price != null) {
            updated.pricePerCase = Number(foundProd.price);
          } else if (DEMO_PRODUCT_PRICES[val] !== undefined) {
            updated.pricePerCase = DEMO_PRODUCT_PRICES[val];
          } else {
            updated.pricePerCase = 0;
          }
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

    // Validation for Work Type 12: ทัวร์
    if (selectedWorkTypes.includes("ทัวร์")) {
      if (!type12TourType) {
        setError("กรุณาเลือกประเภททัวร์");
        setLoading(false);
        return;
      }
      if (type12TourType === "ทัวร์กลาง") {
        if (!type12TourSize) {
          setError("กรุณาเลือกขนาดทัวร์");
          setLoading(false);
          return;
        }
        if (!type12Country.trim()) {
          setError("กรุณากรอกชื่อประเทศ");
          setLoading(false);
          return;
        }
      } else if (type12TourType === "ทัวร์ร้านค้า") {
        if (!type12Store.trim()) {
          setError("กรุณาเลือกร้านค้า");
          setLoading(false);
          return;
        }
        if (!type12Destination.trim()) {
          setError("กรุณากรอกสถานที่จะไป");
          setLoading(false);
          return;
        }
      }
    }

    const cleanObjective = title.trim();
    const cleanDescription = notes.trim() || null;

    // Budgets mapping
    let salesPromotionBudget: number | null = null;
    let marketingBudget: number | null = null;

    if (isSalesPromotionSelected) {
      salesPromotionBudget = salesPromotionItems.reduce(
        (sum, item) => sum + (item.amount || 0),
        0,
      );
    }

    if (isPromotionalMediaSelected) {
      if (marketingProductItems.length === 0) {
        setError(
          "สื่อส่งเสริมการขาย (PVC, ไวนิล, ของแถมตราปืนใหญ่ ทุกชนิด) ต้องมีอย่างน้อย 1 ข้อมูล",
        );
        setLoading(false);
        return;
      }
      const calculatedMarketingSum = marketingProductItems.reduce(
        (sum, item) =>
          sum + (item.quantityCases || 0) * (item.pricePerCase || 0),
        0,
      );
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

    try {
      const firstType = selectedWorkTypes[0] || WORK_TYPES[0];
      const typeIndex = WORK_TYPES.indexOf(firstType);
      const activityTypeId =
        typeIndex >= 0 ? `TYPE_${typeIndex + 1}` : "TYPE_1";

      const allItemsToSend: any[] = [];

      selectedWorkTypes.forEach((workType) => {
        if (workType === "เข้าพบร้านค้า / Key Farmer") {
          type1Items.forEach((item) => {
            allItemsToSend.push({
              itemType: "TYPE_1",
              customerName: item.customerName,
              visitTopic: item.topic,
              detail: item.detail,
            });
          });
        } else if (workType === "ติดตามผลการใช้สินค้า") {
          type2Items.forEach((item) => {
            allItemsToSend.push({
              itemType: "TYPE_2",
              customerName: item.customerName,
              followupProductName: item.productName,
              detail: item.detail,
            });
          });
        } else if (workType === "เสนอขายสินค้า") {
          type3Items.forEach((item) => {
            const prodLines =
              item.products && item.products.length > 0
                ? item.products
                : [
                    {
                      productName: item.productName || "",
                      quantity: item.quantity || 1,
                      unitPrice: item.unitPrice || 0,
                      price: item.price || 0,
                    },
                  ];
            prodLines.forEach((p) => {
              allItemsToSend.push({
                itemType: "TYPE_3",
                customerName: item.customerName,
                saleProductName: p.productName,
                saleQuantity: p.quantity,
                saleUnitPrice: p.unitPrice,
                saleTotalPrice: (p.quantity || 0) * (p.unitPrice || 0),
                detail: item.detail,
              });
            });
          });
        } else if (workType === "วางบิล / เก็บเงิน") {
          type4Items.forEach((item) => {
            allItemsToSend.push({
              itemType: "TYPE_4",
              customerName: item.customerName,
              collectAmount: item.collectAmount,
              detail: item.detail,
            });
          });
        } else if (workType === "สำรวจตลาดของคู่แข่ง") {
          type5Items.forEach((item) => {
            allItemsToSend.push({
              itemType: "TYPE_5",
              surveyStoreName: item.storeName,
              surveyCompetitorProduct: item.comparedProduct,
              detail: item.detail,
            });
          });
        } else if (workType === "แก้ปัญหา / รับเรื่องร้องเรียน") {
          type6Items.forEach((item) => {
            allItemsToSend.push({
              itemType: "TYPE_6",
              customerName: item.customerName,
              issueType: item.issueType,
              detail: item.detail,
            });
          });
        } else if (workType === "ติดตามแปลงสาธิต / ทำแปลง") {
          type7Items.forEach((item) => {
            const detailParts = [];
            if (item.objective?.trim()) {
              detailParts.push(`วัตถุประสงค์: ${item.objective.trim()}`);
            }
            if (item.experimentDetail?.trim()) {
              detailParts.push(`วิธีการทดลอง: ${item.experimentDetail.trim()}`);
            }
            if (
              item.detail?.trim() &&
              !item.detail.includes("วัตถุประสงค์:") &&
              !item.detail.includes("วิธีการทดลอง:")
            ) {
              detailParts.push(item.detail.trim());
            }
            const combinedDetail =
              detailParts.length > 0
                ? detailParts.join(" | ")
                : item.detail || null;

            allItemsToSend.push({
              itemType: "TYPE_7",
              plotActivityType: item.plotActivityType,
              plotOwnerName: item.ownerName,
              plotProductName: item.productName,
              plotCropCategory: item.cropCategory,
              plotCropName: item.cropName || item.customCropName,
              plotAreaRai: item.areaRai,
              plotTreeCount: item.treeCount,
              plotCount:
                item.plotsCount !== "" && item.plotsCount != null
                  ? Number(item.plotsCount)
                  : null,
              existingPlotId: item.existingPlotId,
              growthStage: item.growthStage,
              plotStatus: item.plotStatus,
              detail: combinedDetail,
            });
          });
        } else if (workType === "จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์") {
          type8Items.forEach((item) => {
            allItemsToSend.push({
              itemType: "TYPE_8",
              meetingTopic: item.topic,
              meetingAttendeesCount: item.attendeesCount,
              meetingTargetProducts: item.targetProducts,
              detail: item.detail,
            });
          });
        } else if (workType === "จัดกิจกรรมส่งเสริมการขายหน้าร้าน") {
          const finalCustomerName =
            type9IsSubDealer && type9SubDealerStore
              ? `${type9Store} (Sub Dealer: ${type9SubDealerStore})`
              : type9Store;

          const validProductItems = type9ProductItems.filter(
            (item) => item.productName && item.productName.trim() !== "",
          );

          if (validProductItems.length > 0) {
            validProductItems.forEach((item) => {
              allItemsToSend.push({
                itemType: "TYPE_9",
                customerName: finalCustomerName,
                storeProductName: item.productName,
                storeQuantityCases: item.quantityCases,
                storePricePerCase: item.pricePerCase,
                storeTotalAmount:
                  (item.quantityCases || 0) * (item.pricePerCase || 0),
              });
            });
          } else if (finalCustomerName) {
            allItemsToSend.push({
              itemType: "TYPE_9",
              customerName: finalCustomerName,
              storeProductName: null,
              storeQuantityCases: null,
              storePricePerCase: null,
              storeTotalAmount: type9Sales || null,
            });
          }
        } else if (workType === "จัดงาน Field Day") {
          allItemsToSend.push({
            itemType: "TYPE_10",
            detail: "จัดงานวันถ่ายทอดเทคโนโลยีการเกษตร (Field Day)",
          });
        } else if (workType === "ตรวจเช็กสต็อกหน้าร้าน") {
          if (type11Stores) {
            allItemsToSend.push({
              itemType: "TYPE_11",
              customerName: type11Stores,
              detail: "ตรวจเช็กสต็อกสินค้าคงเหลือหน้าร้าน",
            });
          }
        }
      });

      if (isPromotionalMediaSelected && marketingProductItems.length > 0) {
        marketingProductItems.forEach((mItem) => {
          allItemsToSend.push({
            itemType: "MARKETING_PRODUCT",
            visitTopic: "MARKETING_PRODUCT",
            plotCropCategory: mItem.category || MARKETING_PRODUCT_CATEGORIES[0],
            storeProductName: mItem.productName,
            storeQuantityCases: mItem.quantityCases,
            plotCropName: mItem.unit || "ชิ้น",
            storePricePerCase: mItem.pricePerCase,
            storeTotalAmount:
              (mItem.quantityCases || 0) * (mItem.pricePerCase || 0),
          });
        });
      }

      if (isSalesPromotionSelected && salesPromotionItems.length > 0) {
        salesPromotionItems.forEach((spItem) => {
          allItemsToSend.push({
            itemType: "SALES_PROMOTION",
            visitTopic: "SALES_PROMOTION",
            plotCropCategory: spItem.budgetType || "งบการตลาด",
            detail: spItem.detail,
            collectAmount: spItem.amount,
          });
        });
      }

      const tourData = selectedWorkTypes.includes("ทัวร์")
        ? {
            tourType:
              type12TourType === "ทัวร์ร้านค้า"
                ? ("STORE" as const)
                : ("CENTRAL" as const),
            tourSize:
              type12TourType === "ทัวร์ร้านค้า"
                ? null
                : type12TourSize === "ทัวร์ใหญ่"
                  ? ("LARGE" as const)
                  : ("SMALL" as const),
            country:
              type12TourType === "ทัวร์กลาง"
                ? type12Country.trim() || null
                : null,
            storeId:
              type12TourType === "ทัวร์ร้านค้า"
                ? customersList.find((c) => c.name === type12Store)?.id || null
                : null,
            destination:
              type12TourType === "ทัวร์ร้านค้า"
                ? type12Destination.trim() || null
                : null,
          }
        : null;

      const planStores: Array<{
        workTypeCode: string;
        storeId: string;
        storeName?: string | null;
        remarks?: string | null;
      }> = [];
      const planProducts: Array<{
        workTypeCode: string;
        storeId?: string | null;
        productId: string;
        productName?: string | null;
        targetQuantity?: number | null;
        unitPrice?: number | null;
        targetAmount?: number | null;
      }> = [];

      // Extract stores & products
      if (selectedWorkTypes.includes("เข้าพบร้านค้า / Key Farmer")) {
        type1Items.forEach((item) => {
          const storeMatch = customersList.find(
            (c) => c.name === item.customerName,
          );
          if (storeMatch) {
            planStores.push({
              workTypeCode: "TYPE_1",
              storeId: storeMatch.id,
              storeName: storeMatch.name,
              remarks: item.topic,
            });
          }
        });
      }

      if (selectedWorkTypes.includes("เสนอขายสินค้า")) {
        type3Items.forEach((item) => {
          const storeMatch = customersList.find(
            (c) => c.name === item.customerName,
          );
          const pList =
            item.products && item.products.length > 0
              ? item.products
              : [
                  {
                    productName: item.productName || "",
                    quantity: item.quantity || 1,
                    unitPrice: item.unitPrice || 0,
                  },
                ];
          pList.forEach((p) => {
            const pMatch = productsList.find(
              (prod) => prod.name === p.productName,
            );
            if (pMatch) {
              planProducts.push({
                workTypeCode: "TYPE_3",
                storeId: storeMatch?.id || null,
                productId: pMatch.id,
                productName: pMatch.name,
                targetQuantity: p.quantity,
                unitPrice: p.unitPrice,
                targetAmount: (p.quantity || 0) * (p.unitPrice || 0),
              });
            }
          });
        });
      }

      const res = await onSubmit({
        title,
        startDate: startDateTime,
        endDate: endDateTime,
        activityTypeId,
        workTypeCodes: selectedWorkTypes.map(getWorkTypeCode),
        tourData,
        planStores,
        planProducts,
        province: (initial as any)?.province ?? null,
        district: (initial as any)?.district ?? null,
        location: hasLocationRequirement
          ? locationText
          : locationText.trim() || "ไม่ระบุสถานที่",
        objective: cleanObjective,
        description: cleanDescription,
        salesPromotionBudgetRequested: salesPromotionBudget,
        marketingBudgetRequested: marketingBudget,
        notes: extraNotes,
        items: allItemsToSend as any,
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
            <SectionHeader
              title="ข้อมูลระบบ"
              className="rounded-xl"
              accentColor="#808080"
            />

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
            <SectionHeader
              title="ข้อมูลหลักของกิจกรรม"
              className="rounded-xl"
              accentColor="#808080"
            />

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
                <SectionHeader
                  title="วัตถุประสงค์ของประเภทงาน"
                  className="rounded-xl"
                  accentColor="#808080"
                />

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
                      demoPlots={demoPlotsList}
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
                      demoPlots={demoPlotsList}
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

                  {/* Work Type 12: ทัวร์ */}
                  {selectedWorkTypes.includes("ทัวร์") && (
                    <Type12Tour
                      readonly={readonly}
                      type12TourType={type12TourType}
                      setType12TourType={setType12TourType}
                      type12TourSize={type12TourSize}
                      setType12TourSize={setType12TourSize}
                      type12Country={type12Country}
                      setType12Country={setType12Country}
                      type12Store={type12Store}
                      setType12Store={setType12Store}
                      type12Destination={type12Destination}
                      setType12Destination={setType12Destination}
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
              promotionalMaterialsByCategory={
                fetchedMaterialsByCategory || promotionalMaterialsByCategory
              }
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
            <SectionHeader
              title="ข้อมูลเพิ่มเติม"
              className="rounded-xl"
              accentColor="#808080"
            />

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
            <FormActionButtons
              onCancel={onCancel}
              loading={loading}
              readonly={readonly}
              submitLabel={submitLabel}
            />
          </form>
        </div>
      </Card>
    </section>
  );
}
