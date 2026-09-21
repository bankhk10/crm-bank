"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  User,
  FileText,
  Check,
  X,
  ChevronDown,
  AlertCircle,
  RotateCcw,
  XCircle,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/custom/section-header";
import { cn } from "@/lib/utils";
import type { ActivityPlanFormValues } from "../../../application/validations";
import { DateTimePicker } from "./components/date-time-picker";
import { FormActionButtons } from "../../../ui/form-action-buttons";

type SubmitResult = {
  success: boolean;
  error?: string;
};

interface Props {
  initial?: Partial<ActivityPlanFormValues> & {
    id?: string;
    status?: string;
    employeeName?: string;
    planCode?: string;
    approvalLogs?: Array<{
      id: string;
      action: string;
      step?: string;
      comment?: string | null;
      createdAt: string | Date;
      user?: {
        id?: string;
        name?: string | null;
        email?: string | null;
      } | null;
    }>;
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
    categoryId?: string | null;
  }>;
  activityTypes?: Array<{
    id: string;
    code: string;
    name: string;
    shortName?: string | null;
    sortOrder: number;
    hasActual: boolean;
    requiresApproval: boolean;
    isActive: boolean;
  }>;
  productCategories?: Array<{
    id: string;
    code: string;
    description: string;
    isActive?: boolean;
  }>;
  chemicalGroups?: Array<{
    id: string;
    code: string;
    name: string;
    description?: string | null;
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
  resolveWorkTypeCode,
  hydrateWorkTypesFromPlan,
  DEMO_OWNERS,
  DEMO_PRODUCTS,
  DEMO_PRODUCT_PRICES,
  MARKETING_PRODUCT_CATEGORIES,
  USER_DEMO_PLOTS,
  isFieldDayItem,
  isLocationAndTeamRequired,
  type UserDemoPlotOption,
} from "../../../constants";

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
  Type11StoreItem,
  MarketingBudgetProductItem,
  SalesPromotionItem,
} from "./types";
import { BudgetSection } from "./components/budget-section";
import { LocationTeamSection } from "./components/location-team-section";
import { Type1Visit } from "@/modules/activity-plans/features/type-1/create/type1-visit";
import { Type2Followup } from "@/modules/activity-plans/features/type-2/create/type2-followup";
import { Type3Sales } from "@/modules/activity-plans/features/type-3/create/type3-sales";
import { Type4Collect } from "@/modules/activity-plans/features/type-4/create/type4-collect";
import { Type5Survey } from "@/modules/activity-plans/features/type-5/create/type5-survey";
import { Type6Issue } from "@/modules/activity-plans/features/type-6/create/type6-issue";
import { Type7Demo } from "./components/work-types/type7-demo";
import { Type8Meeting } from "@/modules/activity-plans/features/type-8/create/type8-meeting";
import { Type9Store } from "@/modules/activity-plans/features/type-9/create/type9-store";
import { Type10FieldDay } from "@/modules/activity-plans/features/type-10/create/type10-field-day";
import { Type11Stock } from "@/modules/activity-plans/features/type-11/create/type11-stock";
import { Type12Tour } from "./components/work-types/type12-tour";
import {
  getDemoPlotsAction,
  getFollowUpDemoPlotsAction,
} from "../../../server/actions";

export function ActivityPlanForm({
  initial = {},
  employees = [],
  customers: initialCustomers,
  products: initialProducts,
  productCategories: initialProductCategories,
  chemicalGroups: initialChemicalGroups,
  activityTypes: initialActivityTypes,
  demoPlots: initialDemoPlots,
  promotionalMaterialsByCategory,
  onSubmit,
  onCancel,
  submitLabel = "บันทึก",
  readonly = false,
  isEdit = false,
}: Props) {
  const [fetchedCustomers, setFetchedCustomers] = useState<any[]>([]);
  const [fetchedProducts, setFetchedProducts] = useState<any[]>([]);
  const [fetchedProductCategories, setFetchedProductCategories] = useState<
    any[]
  >([]);
  const [fetchedActivityTypes, setFetchedActivityTypes] = useState<any[]>([]);
  const [fetchedDemoPlots, setFetchedDemoPlots] = useState<
    UserDemoPlotOption[]
  >([]);
  const [fetchedFollowUpDemoPlots, setFetchedFollowUpDemoPlots] = useState<
    UserDemoPlotOption[]
  >([]);
  const [fetchedMaterialsByCategory, setFetchedMaterialsByCategory] = useState<
    | Record<string, Array<{ name: string; price: number; unit?: string }>>
    | undefined
  >(promotionalMaterialsByCategory);

  useEffect(() => {
    if (promotionalMaterialsByCategory !== undefined) {
      setFetchedMaterialsByCategory(promotionalMaterialsByCategory);
      return;
    }

    let isMounted = true;
    async function loadPromotionalMaterials() {
      try {
        const { getActivePromotionalMaterialsGroupedAction } =
          await import("@/modules/activity-plans/server/actions");
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
    initialCustomers !== undefined ? initialCustomers : fetchedCustomers;

  const productsList =
    initialProducts !== undefined ? initialProducts : fetchedProducts;

  const productCategoriesList =
    initialProductCategories !== undefined
      ? initialProductCategories
      : initialChemicalGroups !== undefined
        ? initialChemicalGroups
        : fetchedProductCategories;

  const demoPlotsList =
    initialDemoPlots !== undefined ? initialDemoPlots : fetchedDemoPlots;

  useEffect(() => {
    if (
      initialProductCategories !== undefined ||
      initialChemicalGroups !== undefined
    )
      return;

    let isMounted = true;
    async function loadProductCategories() {
      try {
        const { getProductCategoriesAction } =
          await import("@/modules/activity-plans/server/actions");
        const res = await getProductCategoriesAction();
        if (isMounted && res.success && res.productCategories) {
          setFetchedProductCategories(res.productCategories);
        }
      } catch (err) {
        console.error("Failed to load product categories for Trip Plan:", err);
      }
    }
    loadProductCategories();
    return () => {
      isMounted = false;
    };
  }, [initialProductCategories, initialChemicalGroups]);

  useEffect(() => {
    if (initialCustomers !== undefined) return;

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
    if (initialProducts !== undefined) return;

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
    if (initialDemoPlots !== undefined) return;

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

  useEffect(() => {
    let isMounted = true;
    async function loadFollowUpPlots() {
      try {
        const res = await getFollowUpDemoPlotsAction();
        if (isMounted && res.success && res.demoPlots) {
          setFetchedFollowUpDemoPlots(res.demoPlots);
        }
      } catch (err) {
        console.error(
          "Failed to load follow-up demo plots for Trip Plan:",
          err,
        );
      }
    }
    loadFollowUpPlots();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (initialActivityTypes !== undefined) return;

    let isMounted = true;
    async function loadActivityTypes() {
      try {
        const { getActivityTypesAction } = await import("@/modules/activity-plans/server/actions");
        const res = await getActivityTypesAction();
        if (isMounted && res && res.success && res.types) {
          setFetchedActivityTypes(res.types);
        }
      } catch (err) {
        console.error("Failed to load activity types for Trip Plan:", err);
      }
    }
    loadActivityTypes();
    return () => {
      isMounted = false;
    };
  }, [initialActivityTypes]);

  const activeWorkTypeOptions = useMemo(() => {
    const source =
      initialActivityTypes !== undefined
        ? initialActivityTypes
        : fetchedActivityTypes;

    if (source && source.length > 0) {
      return [...source]
        .filter((t) => t.isActive !== false)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((t) => ({
          ...t,
          displayName: getWorkTypeName(t.code) || t.name,
        }));
    }

    return [];
  }, [initialActivityTypes, fetchedActivityTypes]);

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

  // Find the latest correction or rejection log for read-only alert display
  const latestCorrectionLog = useMemo(() => {
    if (!initial.approvalLogs || initial.approvalLogs.length === 0) return null;
    return (
      initial.approvalLogs.find(
        (log) => log.action === "REQUEST_CORRECTION" || log.action === "REJECT",
      ) || null
    );
  }, [initial.approvalLogs]);

  // Safeguard: Check if initial relation work types existed and validate mappability
  const hydrationSafeguard = useMemo(() => {
    const rawWorkTypes = (initial as any)?.workTypes;
    if (!Array.isArray(rawWorkTypes) || rawWorkTypes.length === 0) {
      return { hasRelation: false, initialCodes: [], unmappableCount: 0 };
    }

    const initialCodes: string[] = [];
    let unmappableCount = 0;

    for (const wt of rawWorkTypes) {
      const code = resolveWorkTypeCode(wt, initialActivityTypes);
      if (code && WORK_TYPE_CONFIG[code]) {
        initialCodes.push(code);
      } else {
        unmappableCount++;
      }
    }

    return {
      hasRelation: true,
      initialCodes: Array.from(new Set(initialCodes)),
      unmappableCount,
    };
  }, [initial, initialActivityTypes]);

  // Work types selection state hydrated with Code as Canonical Identifier
  const initialTypes = useMemo(() => {
    return hydrateWorkTypesFromPlan(initial, initialActivityTypes);
  }, [initial, initialActivityTypes]);

  const [selectedWorkTypes, setSelectedWorkTypes] =
    useState<string[]>(initialTypes);
  const [tempSelectedWorkTypes, setTempSelectedWorkTypes] =
    useState<string[]>(initialTypes);
  const [isWorkTypesDropdownOpen, setIsWorkTypesDropdownOpen] = useState(false);
  const workTypesDropdownRef = useRef<HTMLDivElement>(null);

  const initDetails = (initial as any)?.details;

  // Work Type 1: เข้าพบเกษตรกร
  const [type1Items, setType1Items] = useState<Type1VisitItem[]>(() => {
    if (
      initDetails?.type1Items &&
      Array.isArray(initDetails.type1Items) &&
      initDetails.type1Items.length > 0
    ) {
      return initDetails.type1Items.slice(0, 1).map((item: any) => ({
        ...item,
        visitPurpose: item.visitPurpose || "FARMER",
      }));
    }
    const type1Stores = (initial as any)?.stores?.filter(
      (s: any) => s.workTypeCode === "TYPE_1",
    );
    if (type1Stores && type1Stores.length > 0) {
      return type1Stores.slice(0, 1).map((s: any, idx: number) => {
        const rawPurpose = s.visitPurpose;
        const inferredPurpose: "FARMER" | "STORE" = rawPurpose
          ? (rawPurpose as "FARMER" | "STORE")
          : s.isUnregisteredFarmer || s.store?.customerType === "FARMER"
            ? "FARMER"
            : ["DEALER", "SUBDEALER"].includes(s.store?.customerType)
              ? "STORE"
              : "FARMER";

        return {
          id: s.id || String(idx + 1),
          visitPurpose: inferredPurpose,
          storeId: s.storeId || undefined,
          customerName: s.isUnregisteredFarmer
            ? s.unregisteredFarmerName || ""
            : s.store?.name || s.storeName || "",
          topic: s.remarks || "แจ้งข่าวสาร",
          detail: s.notes || "",
          province: s.province || s.store?.province || "",
          isUnregisteredFarmer: Boolean(s.isUnregisteredFarmer),
          unregisteredFarmerName: s.unregisteredFarmerName || "",
          unregisteredFarmerPhone: s.unregisteredFarmerPhone || "",
        };
      });
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
        return items.slice(0, 1).map((item: any, idx: number) => ({
          id: item.id || String(idx + 1),
          visitPurpose: item.visitPurpose || "FARMER",
          storeId: item.storeId,
          customerName:
            item.customerName || item.storeName || item.ownerName || "",
          topic: item.visitTopic || item.topic || "แจ้งข่าวสาร",
          detail: item.detail || "",
          province: item.province || "",
          isUnregisteredFarmer: Boolean(item.isUnregisteredFarmer),
          unregisteredFarmerName: item.unregisteredFarmerName || "",
          unregisteredFarmerPhone: item.unregisteredFarmerPhone || "",
        }));
      }
    }
    return [
      {
        id: "1",
        visitPurpose: "FARMER",
        customerName: "",
        topic: "แจ้งข่าวสาร",
        detail: "",
        province: "",
        isUnregisteredFarmer: false,
        unregisteredFarmerName: "",
        unregisteredFarmerPhone: "",
      },
    ];
  });

  const addType1Row = () => {
    // 1 Plan : 1 Target (maximum 1 item)
    if (type1Items.length === 0) {
      const newItem: Type1VisitItem = {
        id: Date.now().toString(),
        visitPurpose: "FARMER",
        customerName: "",
        topic: "แจ้งข่าวสาร",
        detail: "",
        province: "",
        isUnregisteredFarmer: false,
        unregisteredFarmerName: "",
        unregisteredFarmerPhone: "",
      };
      setType1Items([newItem]);
    }
  };

  const updateType1Row = (
    id: string,
    field: keyof Type1VisitItem,
    val: any,
  ) => {
    setType1Items((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: val };
        if (field === "visitPurpose") {
          if (val === "STORE") {
            updated.province = "";
            updated.storeId = undefined;
            updated.customerName = "";
            updated.isUnregisteredFarmer = false;
            updated.unregisteredFarmerName = "";
            updated.unregisteredFarmerPhone = "";
          } else if (val === "FARMER") {
            updated.storeId = undefined;
            updated.customerName = "";
          }
        }
        if (field === "isUnregisteredFarmer") {
          if (val === true) {
            updated.storeId = undefined;
            updated.customerName = "";
          } else {
            updated.unregisteredFarmerName = "";
            updated.unregisteredFarmerPhone = "";
          }
        }
        if (field === "province") {
          updated.storeId = undefined;
          updated.customerName = "";
        }
        return updated;
      }),
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
      const type2Prods = (initial as any)?.products?.filter(
        (p: any) => p.workTypeCode === "TYPE_2",
      );
      const type2Stores = (initial as any)?.stores?.filter(
        (s: any) => s.workTypeCode === "TYPE_2",
      );
      if (
        (type2Prods && type2Prods.length > 0) ||
        (type2Stores && type2Stores.length > 0)
      ) {
        const count = Math.max(
          type2Prods?.length || 0,
          type2Stores?.length || 0,
        );
        return Array.from({ length: count }).map((_, idx) => {
          const p = type2Prods?.[idx];
          const s =
            type2Stores?.find((st: any) => st.storeId === p?.storeId) ||
            type2Stores?.[idx];
          const inferredPurpose: "FARMER" | "STORE" =
            s?.visitPurpose === "STORE"
              ? "STORE"
              : s?.visitPurpose === "FARMER"
                ? "FARMER"
                : ["DEALER", "SUBDEALER"].includes(s?.store?.customerType)
                  ? "STORE"
                  : "FARMER";

          return {
            id: p?.id || s?.id || String(idx + 1),
            visitPurpose: inferredPurpose,
            province: s?.province || s?.store?.province || "",
            isUnregisteredFarmer: Boolean(s?.isUnregisteredFarmer),
            unregisteredFarmerName: s?.unregisteredFarmerName || "",
            unregisteredFarmerPhone: s?.unregisteredFarmerPhone || "",
            storeId: s?.storeId || p?.storeId || undefined,
            customerName: s?.isUnregisteredFarmer
              ? s?.unregisteredFarmerName || ""
              : s?.store?.name || s?.storeName || "",
            productId: p?.productId || "",
            productName:
              p?.product?.name || p?.productName || DEMO_PRODUCTS[0] || "",
            detail: s?.notes || "",
          };
        });
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
            visitPurpose: (item.visitPurpose === "STORE"
              ? "STORE"
              : "FARMER") as "FARMER" | "STORE",
            province: item.province || "",
            isUnregisteredFarmer: Boolean(item.isUnregisteredFarmer),
            unregisteredFarmerName: item.unregisteredFarmerName || "",
            unregisteredFarmerPhone: item.unregisteredFarmerPhone || "",
            storeId: item.storeId,
            productId: item.productId,
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
          visitPurpose: "FARMER",
          province: "",
          isUnregisteredFarmer: false,
          storeId: undefined,
          customerName: "",
          unregisteredFarmerName: "",
          unregisteredFarmerPhone: "",
          productName: "",
          detail: "",
        },
      ];
    },
  );

  const addType2Row = () => {
    const newItem: Type2ProductFollowupItem = {
      id: Date.now().toString(),
      visitPurpose: "FARMER",
      province: "",
      isUnregisteredFarmer: false,
      storeId: undefined,
      customerName: "",
      unregisteredFarmerName: "",
      unregisteredFarmerPhone: "",
      productName: "",
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
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: val };
        if (field === "visitPurpose") {
          if (val === "STORE") {
            updated.province = "";
            updated.storeId = undefined;
            updated.customerName = "";
            updated.isUnregisteredFarmer = false;
            updated.unregisteredFarmerName = "";
            updated.unregisteredFarmerPhone = "";
          } else if (val === "FARMER") {
            updated.storeId = undefined;
            updated.customerName = "";
          }
        }
        if (field === "isUnregisteredFarmer") {
          if (val === true) {
            updated.storeId = undefined;
            updated.customerName = "";
          } else {
            updated.unregisteredFarmerName = "";
            updated.unregisteredFarmerPhone = "";
          }
        }
        if (field === "province") {
          updated.storeId = undefined;
          updated.customerName = "";
        }
        return updated;
      }),
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
    const type3Prods = (initial as any)?.products?.filter(
      (p: any) => p.workTypeCode === "TYPE_3",
    );
    const type3Stores = (initial as any)?.stores?.filter(
      (s: any) => s.workTypeCode === "TYPE_3",
    );
    if (
      (type3Prods && type3Prods.length > 0) ||
      (type3Stores && type3Stores.length > 0)
    ) {
      const storeMap = new Map<string, any[]>();
      if (type3Prods && type3Prods.length > 0) {
        type3Prods.forEach((p: any) => {
          const sId = p.storeId || "default";
          if (!storeMap.has(sId)) storeMap.set(sId, []);
          storeMap.get(sId)!.push(p);
        });
      }
      if (type3Stores && type3Stores.length > 0) {
        type3Stores.forEach((s: any) => {
          if (!storeMap.has(s.storeId)) storeMap.set(s.storeId, []);
        });
      }
      return Array.from(storeMap.entries()).map(([sId, prods], idx) => {
        const matchedStore = type3Stores?.find((s: any) => s.storeId === sId);
        const prodLines = (prods || []).map((p: any, pIdx: number) => ({
          id: p.id || `p-${idx}-${pIdx}`,
          productId: p.productId,
          productName: p.product?.name || p.productName || "",
          quantity: p.targetQuantity != null ? Number(p.targetQuantity) : 1,
          notes: p.notes || "",
          unitPrice: p.unitPrice != null ? Number(p.unitPrice) : 0,
          price:
            p.targetAmount != null
              ? Number(p.targetAmount)
              : (Number(p.targetQuantity) || 1) * (Number(p.unitPrice) || 0),
          masterPrice: p.masterPrice != null ? Number(p.masterPrice) : null,
          isPriceOverridden: p.isPriceOverridden ?? false,
        }));
        const firstProd = prodLines[0];
        return {
          id: String(idx + 1),
          storeId: sId !== "default" ? sId : undefined,
          isSubDealer: Boolean(matchedStore?.subDealerStore),
          subDealerStore: matchedStore?.subDealerStore || "",
          customerName:
            matchedStore?.store?.name || matchedStore?.storeName || "",
          products:
            prodLines.length > 0
              ? prodLines
              : [
                  {
                    id: `p-${idx}-0`,
                    productName: "",
                    quantity: 1,
                    notes: "",
                  },
                ],
          productId: firstProd?.productId,
          productName: firstProd?.productName || "",
          quantity: firstProd?.quantity || 1,
          notes: firstProd?.notes || "",
          detail: matchedStore?.notes || "",
        };
      });
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
      isSubDealer: false,
      subDealerStore: "",
      customerName: "",
      products: [
        {
          id: "p-" + Date.now().toString(),
          productName: "",
          quantity: 1,
          notes: "",
        },
      ],
      productName: "",
      quantity: 1,
      notes: "",
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
    const type4Stores = (initial as any)?.stores?.filter(
      (s: any) => s.workTypeCode === "TYPE_4",
    );
    if (type4Stores && type4Stores.length > 0) {
      return type4Stores.map((s: any, idx: number) => ({
        id: s.id || String(idx + 1),
        collectType:
          s.remarks === "BILLING" || s.remarks === "วางบิล"
            ? "BILLING"
            : "COLLECT",
        storeId: s.storeId,
        customerName: s.store?.name || s.storeName || "",
        collectAmount: s.targetAmount != null ? Number(s.targetAmount) : 0,
        detail: s.notes || "",
      }));
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
          collectType:
            item.collectType === "BILLING" ||
            item.collectType === "วางบิล" ||
            item.remarks === "BILLING" ||
            item.remarks === "วางบิล"
              ? "BILLING"
              : "COLLECT",
          storeId: item.storeId,
          customerName: item.customerName || "",
          collectAmount: item.collectAmount ? Number(item.collectAmount) : 0,
          detail: item.detail || "",
        }));
      }
    }
    return [
      {
        id: "1",
        collectType: "COLLECT",
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
        collectType: "COLLECT",
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
    const type5Stores = (initial as any)?.stores?.filter(
      (s: any) => s.workTypeCode === "TYPE_5",
    );
    const type5Prods = (initial as any)?.products?.filter(
      (p: any) => p.workTypeCode === "TYPE_5",
    );
    if (
      (type5Stores && type5Stores.length > 0) ||
      (type5Prods && type5Prods.length > 0)
    ) {
      const count = Math.max(type5Stores?.length || 0, type5Prods?.length || 0);
      return Array.from({ length: count }).map((_, idx) => {
        const s = type5Stores?.[idx];
        const p = type5Prods?.[idx];
        return {
          id: s?.id || p?.id || String(idx + 1),
          storeId: s?.storeId || "",
          storeName: s?.store?.name || s?.storeName || "",
          productId: p?.productId || "",
          comparedProduct:
            p?.product?.name || p?.productName || DEMO_PRODUCTS[0] || "",
          detail: s?.notes || "",
        };
      });
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
          storeId: item.storeId,
          productId: item.productId,
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

  // Work Type 6: ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา
  const normalizeType6Issue = (val?: string | null): string => {
    if (!val) return "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย";
    if (val === "อื่นๆ") return "อื่นๆ ระบุ";
    if (
      val === "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย" ||
      val === "เกิดความเสียหายหลังการใช้สินค้า" ||
      val === "อื่นๆ ระบุ"
    ) {
      return val;
    }
    return "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย";
  };

  const [type6Items, setType6Items] = useState<Type6IssueItem[]>(() => {
    if (
      initDetails?.type6Items &&
      Array.isArray(initDetails.type6Items) &&
      initDetails.type6Items.length > 0
    ) {
      return initDetails.type6Items.map((item: any) => {
        const isManual =
          item.isManualCustomer !== undefined
            ? item.isManualCustomer
            : !item.storeId &&
              Boolean(item.manualCustomerName || item.customerName);
        return {
          ...item,
          customerName: isManual ? "" : item.customerName || "",
          manualCustomerName: isManual
            ? item.manualCustomerName || item.customerName || ""
            : "",
          isManualCustomer: isManual,
          issueType: normalizeType6Issue(item.issueType),
        };
      });
    }
    const type6Stores = (initial as any)?.stores?.filter(
      (s: any) => s.workTypeCode === "TYPE_6",
    );
    if (type6Stores && type6Stores.length > 0) {
      return type6Stores.map((s: any, idx: number) => {
        const isManual = !s.storeId && Boolean(s.storeName);
        return {
          id: s.id || String(idx + 1),
          storeId: s.storeId || null,
          customerName: isManual ? "" : s.store?.name || s.storeName || "",
          manualCustomerName: isManual ? s.storeName || "" : "",
          isManualCustomer: isManual,
          issueType: normalizeType6Issue(s.remarks),
          detail: s.notes || "",
        };
      });
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
        return items.map((item: any, idx: number) => {
          const isManual =
            item.isManualCustomer !== undefined
              ? item.isManualCustomer
              : !item.storeId &&
                Boolean(item.manualCustomerName || item.customerName);
          return {
            id: item.id || String(idx + 1),
            storeId: item.storeId || null,
            customerName: isManual ? "" : item.customerName || "",
            manualCustomerName: isManual
              ? item.manualCustomerName || item.customerName || ""
              : "",
            isManualCustomer: isManual,
            issueType: normalizeType6Issue(item.issueType),
            detail: item.detail || "",
          };
        });
      }
    }
    return [
      {
        id: "1",
        customerName: "",
        manualCustomerName: "",
        isManualCustomer: false,
        issueType: "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
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
        manualCustomerName: "",
        isManualCustomer: false,
        issueType: "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
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
    if ((initial as any)?.demoPlot || (initial as any)?.demoPlotId) {
      const dp = (initial as any)?.demoPlot;
      const fallbackPlotId = dp?.id || (initial as any)?.demoPlotId || "";
      const isInitialType7B =
        initialTypes.some((t) => getWorkTypeCode(t) === "TYPE_7B") ||
        (initial as any)?.workTypes?.some(
          (wt: any) =>
            getWorkTypeCode(wt) === "TYPE_7B" ||
            wt?.activityType?.code === "TYPE_7B" ||
            wt === "TYPE_7B",
        );

      const type7aProds = ((initial as any)?.products || [])
        .filter((p: any) => p.workTypeCode === "TYPE_7A")
        .map((p: any, idx: number) => ({
          id: p.id || String(idx + 1),
          productId: p.productId,
          productName: p.productName || p.product?.name || "",
          quantity: p.targetQuantity || 1,
          unit: p.product?.unit || "",
        }));

      const type7bProds = ((initial as any)?.products || [])
        .filter((p: any) => p.workTypeCode === "TYPE_7B")
        .map((p: any, idx: number) => ({
          id: p.id || String(idx + 1),
          productId: p.productId,
          productName: p.productName || p.product?.name || "",
          quantity: p.targetQuantity || 1,
          unit: p.product?.unit || "",
        }));

      const has7bWithdrawal = isInitialType7B && type7bProds.length > 0;

      const derivedCategoryId =
        ((initial as any)?.products || []).find((p: any) => p.workTypeCode === "TYPE_7A")
          ?.product?.categoryId ||
        dp?.categoryId ||
        dp?.chemicalGroupId ||
        "";

      return [
        {
          id: fallbackPlotId || "1",
          plotActivityType: isInitialType7B ? "FOLLOW_UP" : "CREATE",
          demoPlotId: fallbackPlotId,
          existingPlotId: isInitialType7B ? fallbackPlotId : undefined,
          existingPlotName: isInitialType7B ? (dp?.name || "") : undefined,
          hasProductWithdrawal: has7bWithdrawal,
          withdrawnProducts: has7bWithdrawal ? type7bProds : [],
          plotName: dp?.name || "",
          storeId: dp?.customerId || "",
          ownerName: dp?.customer?.name || dp?.ownerName || "",
          cropCategory: dp?.cropCategory || "",
          cropName: dp?.cropName || "",
          customCropName: dp?.customCropName || "",
          areaRai: dp?.areaRai ? Number(dp.areaRai) : 0,
          treeCount: dp?.treeCount ?? 0,
          province: dp?.province || "",
          district: dp?.district || "",
          categoryId: derivedCategoryId,
          chemicalGroupId: derivedCategoryId,
          objective: dp?.objective || "",
          productId: type7bProds[0]?.productId || "",
          productName:
            type7bProds[0]?.productName || type7bProds[0]?.product?.name || "",
          demoProducts:
            type7aProds.length > 0
              ? type7aProds
              : [
                  {
                    id: "1",
                    productId: "",
                    productName: "",
                    quantity: 1,
                    unit: "",
                  },
                ],
          startDate: format(
            new Date(dp?.startDate || new Date()),
            "yyyy-MM-dd",
          ),
          followUpDate: format(new Date(), "yyyy-MM-dd"),
          detail: isInitialType7B
            ? ((initial as any)?.objective || (initial as any)?.notes || "")
            : (dp?.objective || ""),
        },
      ];
    }
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
            plotActivityType:
              item.plotActivityType ||
              (item.existingPlotId ? "FOLLOW_UP" : "CREATE"),
            plotName: item.plotName || item.name || "",
            storeId: item.storeId || item.customerId || "",
            ownerName: item.plotOwnerName || item.ownerName || "",
            cropCategory: item.plotCropCategory || item.cropCategory || "",
            cropName: item.plotCropName || item.cropName || "",
            customCropName: item.customCropName || "",
            areaRai: item.plotAreaRai
              ? Number(item.plotAreaRai)
              : item.areaRai || 0,
            treeCount: item.plotTreeCount ?? item.treeCount ?? 0,
            province: item.province || "",
            district: item.district || "",
            categoryId: item.categoryId || item.chemicalGroupId || "",
            chemicalGroupId: item.categoryId || item.chemicalGroupId || "",
            demoProducts: item.demoProducts || [
              {
                id: "1",
                productId: item.productId || "",
                productName: item.plotProductName || item.productName || "",
                quantity: item.plotCount != null ? Number(item.plotCount) : 1,
                unit: item.productUnit || "",
              },
            ],
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
        plotName: "",
        storeId: "",
        ownerName: "",
        province: "",
        district: "",
        categoryId: "",
        chemicalGroupId: "",
        productName: "",
        cropCategory: "",
        cropName: "",
        customCropName: "",
        areaRai: 0,
        treeCount: 0,
        startDate: format(new Date(), "yyyy-MM-dd"),
        followUpDate: startDate || format(new Date(), "yyyy-MM-dd"),
        objective: "",
        demoProducts: [
          {
            id: "1",
            productId: "",
            productName: "",
            quantity: 1,
            unit: "",
          },
        ],
        plotsCount: "",
        detail: "",
      },
    ];
  });

  // Dedicated follow-up demo plots for TYPE_7B (strictly completed TYPE_7A plots)
  // Preserves existing plot data for hydration when editing an existing plan
  const followUpPlotsForType7B = useMemo(() => {
    const list = [...fetchedFollowUpDemoPlots];
    type7Items.forEach((item) => {
      const targetPlotId = item.existingPlotId || item.demoPlotId;
      const targetPlotName = item.existingPlotName || item.plotName;
      if (targetPlotId || targetPlotName) {
        const exists = list.some(
          (p) =>
            (targetPlotId && p.id === targetPlotId) ||
            (targetPlotName && p.name === targetPlotName),
        );
        if (!exists) {
          const original = demoPlotsList.find(
            (p) =>
              (targetPlotId && p.id === targetPlotId) ||
              (targetPlotName && p.name === targetPlotName),
          );
          if (original) {
            list.push(original);
          } else if (
            (initial as any)?.demoPlot &&
            ((initial as any).demoPlot.id === targetPlotId ||
              (initial as any).demoPlot.name === targetPlotName)
          ) {
            const dp = (initial as any).demoPlot;
            const matchedProd = ((initial as any)?.products || []).find(
              (p: any) => p.workTypeCode === "TYPE_7B",
            );
            list.push({
              id: dp.id,
              code: dp.code || "",
              name: dp.name || targetPlotName || "",
              location:
                dp.district && dp.province
                  ? `${dp.district}, ${dp.province}`
                  : dp.province || "",
              targetCrop: dp.cropName || item.cropName || "",
              showcase:
                matchedProd?.productName ||
                matchedProd?.product?.name ||
                item.productName ||
                "",
              productId: matchedProd?.productId || item.productId || "",
              productName:
                matchedProd?.productName ||
                matchedProd?.product?.name ||
                item.productName ||
                "",
              ownerName:
                dp.customer?.name || dp.ownerName || item.ownerName || "",
              cropCategory: dp.cropCategory || item.cropCategory || "",
              cropName: dp.cropName || item.cropName || "",
              customCropName: dp.customCropName || item.customCropName || "",
              areaRai: dp.areaRai ? Number(dp.areaRai) : item.areaRai || 0,
              treeCount: dp.treeCount ?? (item.treeCount || 0),
              startDate: dp.startDate
                ? format(new Date(dp.startDate), "yyyy-MM-dd")
                : item.startDate || "",
              status: dp.status || "IN_PROGRESS",
              objective: dp.objective || undefined,
              experimentDetail: dp.experimentDetail || undefined,
            });
          } else if (targetPlotName || targetPlotId) {
            list.push({
              id: targetPlotId || targetPlotName || "",
              code: "",
              name: targetPlotName || targetPlotId || "",
              location: "",
              targetCrop: item.cropName || "",
              showcase: item.productName || "",
              ownerName: item.ownerName || "",
              cropCategory: item.cropCategory || "",
              cropName: item.cropName || "",
              areaRai: item.areaRai || 0,
              treeCount: item.treeCount || 0,
              startDate: item.startDate || "",
              status: "IN_PROGRESS",
            });
          }
        }
      }
    });
    return list;
  }, [fetchedFollowUpDemoPlots, type7Items, demoPlotsList, initial]);
  const addType7Row = (forcedType?: "CREATE" | "FOLLOW_UP") => {
    const isFollowUp =
      forcedType === "FOLLOW_UP" ||
      (!forcedType &&
        selectedWorkTypes.some((t) => getWorkTypeCode(t) === "TYPE_7B"));

    setType7Items((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        plotActivityType: isFollowUp ? "FOLLOW_UP" : "CREATE",
        plotName: "",
        storeId: "",
        ownerName: "",
        province: "",
        district: "",
        categoryId: "",
        chemicalGroupId: "",
        productName: "",
        cropCategory: "",
        cropName: "",
        customCropName: "",
        areaRai: 0,
        treeCount: 0,
        startDate: startDate || format(new Date(), "yyyy-MM-dd"),
        followUpDate: startDate || format(new Date(), "yyyy-MM-dd"),
        objective: "",
        demoProducts: [
          {
            id: Date.now().toString(),
            productId: "",
            productName: "",
            quantity: 1,
            unit: "",
          },
        ],
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
    const type8Prods = (initial as any)?.products?.filter(
      (p: any) => p.workTypeCode === "TYPE_8",
    );
    if (type8Prods && type8Prods.length > 0) {
      return [
        {
          id: "1",
          topic: "",
          targetProducts: type8Prods.map(
            (p: any) => p.product?.name || p.productName || "",
          ),
          targetProductIds: type8Prods
            .map((p: any) => p.productId)
            .filter(Boolean),
          attendeesCount:
            (initial as any)?.targetAttendeesCount != null
              ? Number((initial as any).targetAttendeesCount)
              : 1,
          detail: "",
        },
      ];
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
          targetProducts: Array.isArray(item.meetingTargetProducts)
            ? item.meetingTargetProducts
            : item.meetingTargetProducts
              ? [String(item.meetingTargetProducts).trim()]
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
    const s = (initial as any)?.stores?.find(
      (st: any) => st.workTypeCode === "TYPE_9",
    );
    if (s) return s.store?.name || s.storeName || "";
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
    const s = (initial as any)?.stores?.find(
      (st: any) => st.workTypeCode === "TYPE_9",
    );
    if (s?.subDealerStore) return true;
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
    const s = (initial as any)?.stores?.find(
      (st: any) => st.workTypeCode === "TYPE_9",
    );
    if (s?.subDealerStore) return s.subDealerStore;
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
    const s = (initial as any)?.stores?.find(
      (st: any) => st.workTypeCode === "TYPE_9",
    );
    if (s?.targetAmount != null) return Number(s.targetAmount);
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
    const type9Prods = (initial as any)?.products?.filter(
      (p: any) => p.workTypeCode === "TYPE_9",
    );
    if (type9Prods && type9Prods.length > 0) {
      return type9Prods.map((p: any, idx: number) => ({
        id: p.id || String(idx + 1),
        productId: p.productId,
        productName: p.product?.name || p.productName || "",
        quantityCases: p.targetQuantity != null ? Number(p.targetQuantity) : 0,
        pricePerCase: p.unitPrice != null ? Number(p.unitPrice) : 0,
      }));
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
          productId: item.productId,
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
    if ((initial as any)?.demoPlotId) return (initial as any).demoPlotId;
    if ((initial as any)?.demoPlotVisits?.[0]?.demoPlotId)
      return (initial as any).demoPlotVisits[0].demoPlotId;
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
    if ((initial as any)?.targetAttendeesCount != null)
      return Number((initial as any).targetAttendeesCount);
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
    if ((initial as any)?.targetBookingSales != null)
      return Number((initial as any).targetBookingSales);
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

  const [type11Stores, setType11Stores] = useState<Type11StoreItem[]>(() => {
    if (Array.isArray(initDetails?.type11Stores))
      return initDetails.type11Stores;
    const type11FromStores = (initial as any)?.stores?.filter(
      (s: any) => s.workTypeCode === "TYPE_11",
    );
    if (type11FromStores && type11FromStores.length > 0) {
      return type11FromStores.map((s: any) => ({
        storeId: s.storeId,
        storeName: s.store?.name || s.storeName || "",
      }));
    }
    if (Array.isArray(initDetails)) {
      const item = initDetails.find((i: any) => i.itemType === "TYPE_11");
      if (item && item.customerName) {
        const sMatch = customersList.find((c) => c.name === item.customerName);
        return [{ storeId: sMatch?.id || "", storeName: item.customerName }];
      }
    }
    return [];
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
  const [province, setProvince] = useState((initial as any)?.province ?? "");
  const [district, setDistrict] = useState((initial as any)?.district ?? "");
  const [locationText, setLocationText] = useState(initial.location ?? "");
  const [helperEmployeeIds, setHelperEmployeeIds] = useState<string[]>(() => {
    if (initial.helperEmployeeIds && Array.isArray(initial.helperEmployeeIds)) {
      return initial.helperEmployeeIds;
    }
    if ((initial as any)?.helpers && Array.isArray((initial as any).helpers)) {
      return (initial as any).helpers
        .map((h: any) => h.employeeId || h.id)
        .filter(Boolean);
    }
    return [];
  });
  const [helperSearch, setHelperSearch] = useState("");
  const [showHelperDropdown, setShowHelperDropdown] = useState(false);

  // Conditional visibility for Location & Team section:
  // Requires at least one of TYPE_8, TYPE_9, TYPE_10
  const isLocationTeamVisible = useMemo(
    () => isLocationAndTeamRequired(selectedWorkTypes),
    [selectedWorkTypes],
  );

  // Auto-clear Location & Team when switching from visible -> hidden
  // Protected against initial edit/create hydration via prevIsLocationTeamVisibleRef
  const prevIsLocationTeamVisibleRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (prevIsLocationTeamVisibleRef.current === null) {
      // Initial mount / hydration: record initial state, DO NOT clear
      prevIsLocationTeamVisibleRef.current = isLocationTeamVisible;
      return;
    }

    if (prevIsLocationTeamVisibleRef.current && !isLocationTeamVisible) {
      // User transitioned from eligible -> ineligible work types
      setProvince("");
      setDistrict("");
      setLocationText("");
      setHelperEmployeeIds([]);
      setHelperSearch("");
      setShowHelperDropdown(false);
    }

    prevIsLocationTeamVisibleRef.current = isLocationTeamVisible;
  }, [isLocationTeamVisible]);

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
      (initial as any)?.marketingItems &&
      Array.isArray((initial as any).marketingItems) &&
      (initial as any).marketingItems.length > 0
    ) {
      return (initial as any).marketingItems.map((m: any, idx: number) => ({
        id: m.id || String(idx + 1),
        category: m.category || MARKETING_PRODUCT_CATEGORIES[0],
        productName: m.materialName || "",
        quantityCases: m.quantity != null ? Number(m.quantity) : 1,
        unit: m.unit || "ชิ้น",
        pricePerCase: m.unitPrice != null ? Number(m.unitPrice) : 0,
      }));
    }
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
      (initial as any)?.promotionItems &&
      Array.isArray((initial as any).promotionItems) &&
      (initial as any).promotionItems.length > 0
    ) {
      return (initial as any).promotionItems.map((p: any, idx: number) => ({
        id: p.id || String(idx + 1),
        budgetType: p.budgetType || "งบการตลาด",
        detail: p.detail || "",
        amount: p.amount != null ? Number(p.amount) : 0,
      }));
    }
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
    const code = getWorkTypeCode(typeStr);
    const canonicalName = getWorkTypeName(code) || typeStr;
    const isSelected = tempSelectedWorkTypes.some(
      (t) =>
        t === canonicalName || t === typeStr || getWorkTypeCode(t) === code,
    );

    if (isSelected) {
      setTempSelectedWorkTypes(
        tempSelectedWorkTypes.filter(
          (t) =>
            t !== canonicalName && t !== typeStr && getWorkTypeCode(t) !== code,
        ),
      );
    } else {
      let next = [...tempSelectedWorkTypes];
      // Mutual Exclusivity between TYPE_7A ("ทำแปลงสาธิต") and TYPE_7B ("ติดตามแปลงสาธิต")
      if (code === "TYPE_7A") {
        next = next.filter((t) => getWorkTypeCode(t) !== "TYPE_7B");
      } else if (code === "TYPE_7B") {
        next = next.filter((t) => getWorkTypeCode(t) !== "TYPE_7A");
      }
      setTempSelectedWorkTypes([...next, canonicalName]);
    }
  };

  const removeWorkType = (typeStr: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const canonicalName = getWorkTypeName(getWorkTypeCode(typeStr)) || typeStr;
    setSelectedWorkTypes(
      selectedWorkTypes.filter(
        (t) =>
          t !== canonicalName &&
          t !== typeStr &&
          getWorkTypeCode(t) !== getWorkTypeCode(typeStr),
      ),
    );
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

    // Safeguard: Data Loss Protection
    if (isEdit && hydrationSafeguard.hasRelation) {
      if (hydrationSafeguard.unmappableCount > 0) {
        setError(
          "ไม่สามารถบันทึกได้เนื่องจากพบประเภทงานที่ไม่สามารถระบุได้ในระบบ เพื่อป้องกันข้อมูลสูญหาย กรุณาติดต่อผู้ดูแลระบบ",
        );
        return;
      }
      if (selectedWorkTypes.length === 0) {
        setError(
          "ไม่สามารถบันทึกได้เนื่องจากไม่มีการระบุประเภทงาน เพื่อป้องกันข้อมูลสูญหาย กรุณาเลือกประเภทงานอย่างน้อย 1 ประเภท",
        );
        return;
      }
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

    // Validation for Work Type 1: เข้าพบ (เกษตรกร / ร้านค้า)
    if (
      selectedWorkTypes.includes("เข้าพบเกษตรกร") ||
      selectedWorkTypes.includes("เข้าพบร้านค้า / Key Farmer")
    ) {
      const item = type1Items[0];
      const purpose = item?.visitPurpose === "STORE" ? "STORE" : "FARMER";

      if (purpose === "STORE") {
        const sId =
          item?.storeId ||
          customersList.find((c) => c.name === item?.customerName)?.id;
        if (!sId) {
          setError("กรุณาเลือกร้านค้า");
          setLoading(false);
          return;
        }
      } else {
        // purpose === "FARMER"
        if (!item || !item.province?.trim()) {
          setError("กรุณาเลือกจังหวัดสำหรับเข้าพบเกษตรกร");
          setLoading(false);
          return;
        }
        if (item.isUnregisteredFarmer) {
          if (!item.unregisteredFarmerName?.trim()) {
            setError("กรุณากรอกชื่อ - สกุล เกษตรกร");
            setLoading(false);
            return;
          }
          if (item.unregisteredFarmerPhone?.trim()) {
            const cleanedPhone = item.unregisteredFarmerPhone.replace(
              /[-\s]/g,
              "",
            );
            if (!/^\d{9,10}$/.test(cleanedPhone)) {
              setError("เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก");
              setLoading(false);
              return;
            }
          }
        } else {
          const sId =
            item.storeId ||
            customersList.find((c) => c.name === item.customerName)?.id;
          if (!sId) {
            setError("กรุณาเลือกเกษตรกร");
            setLoading(false);
            return;
          }
        }
      }
    }

    // Validation for Work Type 2: ติดตามผลการใช้สินค้า
    if (selectedWorkTypes.includes("ติดตามผลการใช้สินค้า")) {
      if (type2Items.length === 0) {
        setError("กรุณาเพิ่มรายการติดตามผลการใช้สินค้าอย่างน้อย 1 รายการ");
        setLoading(false);
        return;
      }

      for (let i = 0; i < type2Items.length; i++) {
        const item = type2Items[i];
        const rowNum = i + 1;

        if (!item.productName?.trim() && !item.productId?.trim()) {
          setError(`กรุณาเลือกสินค้าที่ต้องการติดตามผล (รายการที่ ${rowNum})`);
          setLoading(false);
          return;
        }

        const purpose = item.visitPurpose === "STORE" ? "STORE" : "FARMER";
        if (purpose === "STORE") {
          const sId =
            item.storeId ||
            customersList.find((c) => c.name === item.customerName)?.id;
          if (!sId) {
            setError(
              `กรุณาเลือกร้านค้าสำหรับติดตามผลการใช้สินค้า (รายการที่ ${rowNum})`,
            );
            setLoading(false);
            return;
          }
        } else {
          // purpose === "FARMER"
          if (!item.province?.trim()) {
            setError(
              `กรุณาเลือกจังหวัดสำหรับเข้าพบเกษตรกร (รายการที่ ${rowNum})`,
            );
            setLoading(false);
            return;
          }
          if (item.isUnregisteredFarmer) {
            if (!item.unregisteredFarmerName?.trim()) {
              setError(`กรุณากรอกชื่อ - สกุล เกษตรกร (รายการที่ ${rowNum})`);
              setLoading(false);
              return;
            }
            if (!item.unregisteredFarmerPhone?.trim()) {
              setError(`กรุณากรอกเบอร์โทรศัพท์เกษตรกร (รายการที่ ${rowNum})`);
              setLoading(false);
              return;
            }
            const cleanedPhone = item.unregisteredFarmerPhone.replace(
              /[-\s]/g,
              "",
            );
            if (!/^\d{9,10}$/.test(cleanedPhone)) {
              setError(
                `เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก (รายการที่ ${rowNum})`,
              );
              setLoading(false);
              return;
            }
          } else {
            const sId =
              item.storeId ||
              customersList.find((c) => c.name === item.customerName)?.id;
            if (!sId) {
              setError(`กรุณาเลือกเกษตรกร (รายการที่ ${rowNum})`);
              setLoading(false);
              return;
            }
          }
        }
      }
    }

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

    // Validation for Work Type 6: ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา
    if (selectedWorkTypes.includes("ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา")) {
      if (type6Items.length === 0) {
        setError(
          "กรุณาเพิ่มรายการตรวจสอบเรื่องร้องเรียน / แก้ปัญหาอย่างน้อย 1 รายการ",
        );
        setLoading(false);
        return;
      }
      for (let i = 0; i < type6Items.length; i++) {
        const item = type6Items[i];
        const rowNum = i + 1;
        if (item.isManualCustomer) {
          const manualName = (
            item.manualCustomerName ||
            item.customerName ||
            ""
          ).trim();
          if (!manualName) {
            setError(`กรุณากรอกชื่อลูกค้า / ร้านค้า (รายการที่ ${rowNum})`);
            setLoading(false);
            return;
          }
        } else {
          const sId =
            item.storeId ||
            customersList.find((c) => c.name === item.customerName)?.id;
          if (!sId) {
            setError(`กรุณาเลือกร้านค้า / Key Farmer (รายการที่ ${rowNum})`);
            setLoading(false);
            return;
          }
        }

        if (!item.issueType?.trim()) {
          setError(`กรุณาเลือกประเภทปัญหา (รายการที่ ${rowNum})`);
          setLoading(false);
          return;
        }

        if (item.issueType === "อื่นๆ ระบุ" && !item.detail?.trim()) {
          setError(
            `กรุณากรอกรายละเอียดสำหรับประเภทปัญหา "อื่นๆ ระบุ" (รายการที่ ${rowNum})`,
          );
          setLoading(false);
          return;
        }
      }
    }

    // Validation for Mutual Exclusivity: TYPE_7A vs TYPE_7B
    const hasType7ASelected = selectedWorkTypes.some(
      (t) => getWorkTypeCode(t) === "TYPE_7A",
    );
    const hasType7BSelected = selectedWorkTypes.some(
      (t) => getWorkTypeCode(t) === "TYPE_7B",
    );

    if (hasType7ASelected && hasType7BSelected) {
      setError("ห้ามเลือกทำแปลงสาธิตและติดตามแปลงสาธิตพร้อมกันในแผนเดียว");
      setLoading(false);
      return;
    }

    // Validation for Work Type 7A: ทำแปลงสาธิต
    if (hasType7ASelected) {
      if (type7Items.length === 0) {
        setError("กรุณาเพิ่มรายการทำแปลงสาธิตอย่างน้อย 1 รายการ");
        setLoading(false);
        return;
      }
      const item = type7Items[0];
      if (!item.plotName?.trim()) {
        setError("กรุณากรอกชื่อแปลงสาธิต");
        setLoading(false);
        return;
      }
      const dealerId =
        item.storeId ||
        customersList.find((c) => c.name === item.ownerName)?.id;
      if (!dealerId) {
        setError("กรุณาเลือกร้านค้า Dealer สำหรับแปลงสาธิต");
        setLoading(false);
        return;
      }
      const dealer = customersList.find((c) => c.id === dealerId);
      if (dealer?.customerType && dealer.customerType !== "DEALER") {
        setError(
          "ร้านค้าของแปลงสาธิตต้องเป็นประเภทร้านค้าตัวแทนจำหน่าย (DEALER) เท่านั้น",
        );
        setLoading(false);
        return;
      }
      if (!item.province?.trim()) {
        setError("กรุณาเลือกจังหวัดของแปลงสาธิต");
        setLoading(false);
        return;
      }
      if (!item.district?.trim()) {
        setError("กรุณาเลือกอำเภอของแปลงสาธิต");
        setLoading(false);
        return;
      }
      if (!item.cropCategory?.trim()) {
        setError("กรุณาเลือกหมวดพืช");
        setLoading(false);
        return;
      }
      if (!item.cropName?.trim()) {
        setError("กรุณาเลือกหรือระบุชื่อพืช");
        setLoading(false);
        return;
      }
      const isCustomCrop = [
        "ผักและพืชล้มลุกอื่นๆ",
        "พืชไร่อื่นๆ",
        "พืชสวนอื่นๆ",
      ].includes(item.cropName);
      if (isCustomCrop && !item.customCropName?.trim()) {
        setError("กรุณาระบุชื่อพืชเพิ่มเติม");
        setLoading(false);
        return;
      }
      const isRaiUnit = ["พืชไร่", "ผักและพืชล้มลุก"].includes(
        item.cropCategory,
      );
      if (isRaiUnit && (!item.areaRai || item.areaRai <= 0)) {
        setError("กรุณาระบุพื้นที่ (ไร่) ให้มากกว่า 0");
        setLoading(false);
        return;
      }
      if (!isRaiUnit && (!item.treeCount || item.treeCount <= 0)) {
        setError("กรุณาระบุจำนวนต้นให้มากกว่า 0");
        setLoading(false);
        return;
      }
      const selectedCatId = item.categoryId || item.chemicalGroupId;
      if (!selectedCatId?.trim()) {
        setError("กรุณาเลือกหมวดสินค้า");
        setLoading(false);
        return;
      }
      if (!item.objective?.trim()) {
        setError("กรุณาระบุวัตถุประสงค์การทำแปลง");
        setLoading(false);
        return;
      }
      const prods = (item.demoProducts || []).filter(
        (p) => p.productId || p.productName,
      );
      if (prods.length === 0) {
        setError("กรุณาระบุสินค้าที่จะสาธิตอย่างน้อย 1 รายการ");
        setLoading(false);
        return;
      }
      for (let i = 0; i < prods.length; i++) {
        const p = prods[i];
        if (!p.quantity || p.quantity <= 0) {
          setError(`จำนวนสินค้าที่จะสาธิตต้องมากกว่า 0 (รายการที่ ${i + 1})`);
          setLoading(false);
          return;
        }
        const matchedProd = productsList.find(
          (prod) => prod.id === p.productId || prod.name === p.productName,
        );
        const prodCatId =
          matchedProd?.categoryId || (matchedProd as any)?.productGroupId;
        if (matchedProd && prodCatId && prodCatId !== selectedCatId) {
          setError(
            `สินค้า "${matchedProd.name}" ไม่ได้อยู่ในหมวดสินค้าที่เลือก กรุณาเลือกสินค้าให้ตรงกับหมวดสินค้า`,
          );
          setLoading(false);
          return;
        }
      }
    }

    // Validation for Work Type 7B: ติดตามแปลงสาธิต
    if (hasType7BSelected) {
      if (type7Items.length === 0) {
        setError("กรุณาเพิ่มรายการติดตามแปลงสาธิตอย่างน้อย 1 รายการ");
        setLoading(false);
        return;
      }
    }

    let cleanObjective = (initial as any)?.objective ?? "";
    const cleanDescription = (initial as any)?.description ?? null;

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

    if (isLocationTeamVisible && !locationText.trim()) {
      setError("กรุณากรอกรายละเอียดพื้นที่จัดกิจกรรม");
      setLoading(false);
      return;
    }

    const extraNotes = extraExpenseAmount
      ? `${notes}\n(ค่าใช้จ่ายอื่นๆ: ${extraExpenseAmount} บาท - ${extraExpenseDetail})`
      : notes;

    try {
      const firstType = selectedWorkTypes[0] || WORK_TYPES[0];
      const activityTypeId = getWorkTypeCode(firstType) || "TYPE_1";

      const planStores: Array<{
        workTypeCode: string;
        visitPurpose?: "FARMER" | "STORE" | null;
        storeId?: string | null;
        storeName?: string | null;
        targetAmount?: number | null;
        subDealerStore?: string | null;
        remarks?: string | null;
        notes?: string | null;
        province?: string | null;
        isUnregisteredFarmer?: boolean;
        unregisteredFarmerName?: string | null;
        unregisteredFarmerPhone?: string | null;
      }> = [];

      const planProducts: Array<{
        workTypeCode: string;
        storeId?: string | null;
        productId: string;
        productName?: string | null;
        masterPrice?: number | null;
        unitPrice?: number | null;
        isPriceOverridden?: boolean;
        targetQuantity?: number | null;
        targetAmount?: number | null;
        notes?: string | null;
      }> = [];

      let submittedTargetAttendees: number | null = null;
      let submittedTargetBookingSales: number | null = null;
      let submittedDemoPlotId: string | null = null;

      // 1. TYPE_1: เข้าพบเกษตรกร / เข้าพบร้านค้า
      if (
        selectedWorkTypes.includes("เข้าพบเกษตรกร") ||
        selectedWorkTypes.includes("เข้าพบร้านค้า / Key Farmer")
      ) {
        const item = type1Items[0];
        if (item) {
          const purpose = item.visitPurpose === "STORE" ? "STORE" : "FARMER";
          if (purpose === "STORE") {
            const sId =
              item.storeId ||
              customersList.find((c) => c.name === item.customerName)?.id;
            if (sId) {
              planStores.push({
                workTypeCode: "TYPE_1",
                visitPurpose: "STORE",
                storeId: sId,
                storeName: item.customerName || null,
                remarks: item.topic || null,
                notes: item.detail || null,
                province: null,
                isUnregisteredFarmer: false,
                unregisteredFarmerName: null,
                unregisteredFarmerPhone: null,
              });
            }
          } else {
            // FARMER
            if (item.isUnregisteredFarmer) {
              planStores.push({
                workTypeCode: "TYPE_1",
                visitPurpose: "FARMER",
                storeId: null,
                storeName: item.unregisteredFarmerName || null,
                remarks: item.topic || null,
                notes: item.detail || null,
                province: item.province || null,
                isUnregisteredFarmer: true,
                unregisteredFarmerName: item.unregisteredFarmerName || null,
                unregisteredFarmerPhone: item.unregisteredFarmerPhone || null,
              });
            } else {
              const sId =
                item.storeId ||
                customersList.find((c) => c.name === item.customerName)?.id;
              if (sId) {
                planStores.push({
                  workTypeCode: "TYPE_1",
                  visitPurpose: "FARMER",
                  storeId: sId,
                  storeName: item.customerName || null,
                  remarks: item.topic || null,
                  notes: item.detail || null,
                  province: item.province || null,
                  isUnregisteredFarmer: false,
                  unregisteredFarmerName: null,
                  unregisteredFarmerPhone: null,
                });
              }
            }
          }
        }
      }

      // 2. TYPE_2: ติดตามผลการใช้สินค้า
      if (selectedWorkTypes.includes("ติดตามผลการใช้สินค้า")) {
        type2Items.forEach((item) => {
          const purpose = item.visitPurpose === "STORE" ? "STORE" : "FARMER";
          const pId =
            item.productId ||
            productsList.find((p) => p.name === item.productName)?.id;

          if (purpose === "STORE") {
            const sId =
              item.storeId ||
              customersList.find((c) => c.name === item.customerName)?.id;
            if (sId) {
              planStores.push({
                workTypeCode: "TYPE_2",
                visitPurpose: "STORE",
                storeId: sId,
                storeName: item.customerName || null,
                notes: item.detail || null,
                province: null,
                isUnregisteredFarmer: false,
                unregisteredFarmerName: null,
                unregisteredFarmerPhone: null,
              });
            }
            if (pId) {
              planProducts.push({
                workTypeCode: "TYPE_2",
                storeId: sId || null,
                productId: pId,
                productName: item.productName || null,
                isPriceOverridden: false,
              });
            }
          } else {
            // FARMER
            if (item.isUnregisteredFarmer) {
              planStores.push({
                workTypeCode: "TYPE_2",
                visitPurpose: "FARMER",
                storeId: null,
                storeName: item.unregisteredFarmerName || null,
                notes: item.detail || null,
                province: item.province || null,
                isUnregisteredFarmer: true,
                unregisteredFarmerName: item.unregisteredFarmerName || null,
                unregisteredFarmerPhone: item.unregisteredFarmerPhone || null,
              });
              if (pId) {
                planProducts.push({
                  workTypeCode: "TYPE_2",
                  storeId: null,
                  productId: pId,
                  productName: item.productName || null,
                  isPriceOverridden: false,
                });
              }
            } else {
              const sId =
                item.storeId ||
                customersList.find((c) => c.name === item.customerName)?.id;
              if (sId) {
                planStores.push({
                  workTypeCode: "TYPE_2",
                  visitPurpose: "FARMER",
                  storeId: sId,
                  storeName: item.customerName || null,
                  notes: item.detail || null,
                  province: item.province || null,
                  isUnregisteredFarmer: false,
                  unregisteredFarmerName: null,
                  unregisteredFarmerPhone: null,
                });
              }
              if (pId) {
                planProducts.push({
                  workTypeCode: "TYPE_2",
                  storeId: sId || null,
                  productId: pId,
                  productName: item.productName || null,
                  isPriceOverridden: false,
                });
              }
            }
          }
        });
      }

      // 3. TYPE_3: เสนอขายสินค้า
      if (selectedWorkTypes.includes("เสนอขายสินค้า")) {
        type3Items.forEach((item) => {
          const sId =
            item.storeId ||
            customersList.find((c) => c.name === item.customerName)?.id;
          if (sId || item.customerName) {
            planStores.push({
              workTypeCode: "TYPE_3",
              storeId: sId || null,
              storeName: item.customerName || null,
              subDealerStore: item.isSubDealer
                ? item.subDealerStore || null
                : null,
              notes: item.detail || null,
            });
          }
          const prodLines =
            item.products && item.products.length > 0
              ? item.products
              : [
                  {
                    productId: item.productId,
                    productName: item.productName || "",
                    quantity: item.quantity || 1,
                    notes: item.notes || "",
                  },
                ];
          prodLines.forEach((p) => {
            const matchedP = productsList.find(
              (prod) => prod.id === p.productId || prod.name === p.productName,
            );
            const pId = p.productId || matchedP?.id;
            if (pId) {
              const qty = p.quantity != null ? Number(p.quantity) : 1;
              planProducts.push({
                workTypeCode: "TYPE_3",
                storeId: sId || null,
                productId: pId,
                productName: p.productName || matchedP?.name || null,
                masterPrice: null,
                unitPrice: null,
                isPriceOverridden: false,
                targetQuantity: qty,
                targetAmount: null,
                notes: p.notes || null,
              });
            }
          });
        });
      }

      // 4. TYPE_4: วางบิล / เก็บเงิน
      if (selectedWorkTypes.includes("วางบิล / เก็บเงิน")) {
        type4Items.forEach((item) => {
          const sId =
            item.storeId ||
            customersList.find((c) => c.name === item.customerName)?.id;
          if (sId) {
            planStores.push({
              workTypeCode: "TYPE_4",
              storeId: sId,
              storeName: item.customerName || null,
              targetAmount:
                item.collectAmount != null ? Number(item.collectAmount) : null,
              remarks: item.collectType === "BILLING" ? "BILLING" : "COLLECT",
              notes: item.detail || null,
            });
          }
        });
      }

      // 5. TYPE_5: สำรวจตลาดของคู่แข่ง
      if (selectedWorkTypes.includes("สำรวจตลาดของคู่แข่ง")) {
        type5Items.forEach((item) => {
          const sId =
            item.storeId ||
            customersList.find((c) => c.name === item.storeName)?.id;
          const pId =
            item.productId ||
            productsList.find((p) => p.name === item.comparedProduct)?.id;
          if (sId) {
            planStores.push({
              workTypeCode: "TYPE_5",
              storeId: sId,
              storeName: item.storeName || null,
              notes: item.detail || null,
            });
          }
          if (pId) {
            planProducts.push({
              workTypeCode: "TYPE_5",
              storeId: sId || null,
              productId: pId,
              productName: item.comparedProduct || null,
              isPriceOverridden: false,
            });
          }
        });
      }

      // 6. TYPE_6: ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา
      if (selectedWorkTypes.includes("ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา")) {
        type6Items.forEach((item) => {
          const detailValue =
            item.issueType === "อื่นๆ ระบุ"
              ? item.detail?.trim() || null
              : item.detail?.trim() || null;

          if (item.isManualCustomer) {
            const manualName = (
              item.manualCustomerName ||
              item.customerName ||
              ""
            ).trim();
            if (manualName) {
              planStores.push({
                workTypeCode: "TYPE_6",
                storeId: null,
                storeName: manualName,
                remarks: item.issueType || null,
                notes: detailValue,
              });
            }
          } else {
            const sId =
              item.storeId ||
              customersList.find((c) => c.name === item.customerName)?.id;
            if (sId) {
              const matchedCust = customersList.find((c) => c.id === sId);
              planStores.push({
                workTypeCode: "TYPE_6",
                storeId: sId,
                storeName: matchedCust?.name || item.customerName || null,
                remarks: item.issueType || null,
                notes: detailValue,
              });
            }
          }
        });
      }

      // 7. TYPE_7A / TYPE_7B: ทำแปลงสาธิต / ติดตามแปลงสาธิต
      const hasType7APlan = selectedWorkTypes.some(
        (t) => getWorkTypeCode(t) === "TYPE_7A",
      );
      const hasType7BPlan = selectedWorkTypes.some(
        (t) => getWorkTypeCode(t) === "TYPE_7B",
      );

      let submittedDemoPlotData: any = null;

      if (hasType7APlan) {
        const item = type7Items[0];
        if (item) {
          const dealerId =
            item.storeId ||
            customersList.find((c) => c.name === item.ownerName)?.id ||
            null;
          const dealerCust = customersList.find((c) => c.id === dealerId);

          submittedDemoPlotData = {
            id: item.demoPlotId || null,
            name: item.plotName || "",
            customerId: dealerId,
            ownerName: dealerCust?.name || item.ownerName || "",
            cropCategory: item.cropCategory,
            cropName: item.cropName,
            customCropName: item.customCropName || null,
            areaRai: item.areaRai ? Number(item.areaRai) : null,
            treeCount: item.treeCount ? Number(item.treeCount) : null,
            location:
              item.province && item.district
                ? `${item.district}, ${item.province}`
                : null,
            province: item.province || null,
            district: item.district || null,
            categoryId: item.categoryId || item.chemicalGroupId || null,
            objective: item.objective || null,
          };

          const prods = (item.demoProducts || []).filter(
            (p) => p.productId || p.productName,
          );
          prods.forEach((dp) => {
            const pId =
              dp.productId ||
              productsList.find((p) => p.name === dp.productName)?.id;
            if (pId) {
              const matchedProd = productsList.find((p) => p.id === pId);
              planProducts.push({
                workTypeCode: "TYPE_7A",
                productId: pId,
                productName: matchedProd?.name || dp.productName || null,
                targetQuantity: dp.quantity ? Number(dp.quantity) : 1,
                isPriceOverridden: false,
              });
            }
          });
        }
      } else if (hasType7BPlan) {
        type7Items.forEach((item) => {
          if (
            item.hasProductWithdrawal &&
            item.withdrawnProducts &&
            item.withdrawnProducts.length > 0
          ) {
            item.withdrawnProducts.forEach((wp) => {
              const pId =
                wp.productId ||
                productsList.find((p) => p.name === wp.productName)?.id;
              if (pId) {
                const matchedP = productsList.find((p) => p.id === pId);
                planProducts.push({
                  workTypeCode: "TYPE_7B",
                  productId: pId,
                  productName: wp.productName || matchedP?.name || null,
                  targetQuantity: wp.quantity ? Number(wp.quantity) : 1,
                  isPriceOverridden: false,
                });
              }
            });
          }
          if (item.existingPlotId || item.demoPlotId) {
            submittedDemoPlotId =
              item.existingPlotId || item.demoPlotId || null;
          }
        });
        const t7bDetail = type7Items[0]?.detail?.trim();
        if (t7bDetail) {
          cleanObjective = t7bDetail;
        }
      }

      // 8. TYPE_8: จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์
      if (
        selectedWorkTypes.includes("จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์")
      ) {
        type8Items.forEach((item) => {
          if (item.attendeesCount != null && Number(item.attendeesCount) > 0) {
            submittedTargetAttendees =
              (submittedTargetAttendees || 0) + Number(item.attendeesCount);
          }
          const pNames = Array.isArray(item.targetProducts)
            ? item.targetProducts
            : item.targetProducts
              ? [item.targetProducts]
              : [];
          const pIds =
            Array.isArray(item.targetProductIds) &&
            item.targetProductIds.length > 0
              ? item.targetProductIds
              : pNames
                  .map((name) => productsList.find((p) => p.name === name)?.id)
                  .filter(Boolean);

          pIds.forEach((pId, idx) => {
            const matchedP = productsList.find((p) => p.id === pId);
            planProducts.push({
              workTypeCode: "TYPE_8",
              productId: pId as string,
              productName: matchedP?.name || pNames[idx] || null,
              isPriceOverridden: false,
            });
          });
        });
      }

      // 9. TYPE_9: จัดกิจกรรมส่งเสริมการขายหน้าร้าน
      if (selectedWorkTypes.includes("จัดกิจกรรมส่งเสริมการขายหน้าร้าน")) {
        const sId9 = customersList.find((c) => c.name === type9Store)?.id;
        if (sId9) {
          planStores.push({
            workTypeCode: "TYPE_9",
            storeId: sId9,
            storeName: type9Store || null,
            subDealerStore:
              type9IsSubDealer && type9SubDealerStore
                ? type9SubDealerStore
                : null,
            targetAmount: type9Sales != null ? Number(type9Sales) : null,
          });
        }
        type9ProductItems
          .filter((item) => item.productName && item.productName.trim() !== "")
          .forEach((p) => {
            const matchedP = productsList.find(
              (prod) => prod.id === p.productId || prod.name === p.productName,
            );
            const pId = p.productId || matchedP?.id;
            if (pId) {
              const qty = p.quantityCases != null ? Number(p.quantityCases) : 0;
              const price = p.pricePerCase != null ? Number(p.pricePerCase) : 0;
              planProducts.push({
                workTypeCode: "TYPE_9",
                storeId: sId9 || null,
                productId: pId,
                productName: p.productName || matchedP?.name || null,
                targetQuantity: qty,
                unitPrice: price,
                targetAmount: qty * price,
                isPriceOverridden: false,
              });
            }
          });
      }

      // 10. TYPE_10: จัดงาน Field Day
      if (selectedWorkTypes.includes("จัดงาน Field Day")) {
        const plotMatch = demoPlotsList.find(
          (dp) =>
            dp.id === type10DemoPlot ||
            dp.ownerName === type10DemoPlot ||
            dp.code === type10DemoPlot,
        );
        if (plotMatch?.id || type10DemoPlot) {
          submittedDemoPlotId = plotMatch?.id || type10DemoPlot || null;
        }
        if (type10Attendees != null && Number(type10Attendees) > 0) {
          submittedTargetAttendees = Number(type10Attendees);
        }
        if (type10BookingSales != null && Number(type10BookingSales) > 0) {
          submittedTargetBookingSales = Number(type10BookingSales);
        }
      }

      // 11. TYPE_11: ตรวจเช็กสต็อกหน้าร้าน
      if (selectedWorkTypes.includes("ตรวจเช็กสต็อกหน้าร้าน")) {
        if (Array.isArray(type11Stores)) {
          type11Stores.forEach((st) => {
            const sId =
              st.storeId ||
              customersList.find((c) => c.name === st.storeName)?.id;
            if (sId) {
              planStores.push({
                workTypeCode: "TYPE_11",
                storeId: sId,
                storeName: st.storeName || null,
                notes: "ตรวจเช็กสต็อกสินค้าคงเหลือหน้าร้าน",
              });
            }
          });
        }
      }

      // 12. TYPE_12: ทัวร์
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

      // Budget items
      const marketingItems: Array<{
        category: string;
        materialName: string;
        unit?: string | null;
        unitPrice: number;
        quantity: number;
        totalAmount: number;
      }> = [];
      if (isPromotionalMediaSelected && marketingProductItems.length > 0) {
        marketingProductItems.forEach((mItem) => {
          const qty = mItem.quantityCases || 1;
          const price = mItem.pricePerCase || 0;
          marketingItems.push({
            category: mItem.category || MARKETING_PRODUCT_CATEGORIES[0],
            materialName: mItem.productName || "สื่อส่งเสริมการขาย",
            unit: mItem.unit || "ชิ้น",
            unitPrice: price,
            quantity: qty,
            totalAmount: qty * price,
          });
        });
      }

      const promotionItems: Array<{
        budgetType: string;
        detail: string;
        amount: number;
      }> = [];
      if (isSalesPromotionSelected && salesPromotionItems.length > 0) {
        salesPromotionItems.forEach((spItem) => {
          promotionItems.push({
            budgetType: spItem.budgetType || "งบการตลาด",
            detail: spItem.detail || "",
            amount: spItem.amount || 0,
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
        demoPlotData: submittedDemoPlotData,
        planStores,
        planProducts,
        marketingItems,
        promotionItems,
        targetAttendeesCount: submittedTargetAttendees,
        targetBookingSales: submittedTargetBookingSales,
        demoPlotId: submittedDemoPlotId,
        province: isLocationTeamVisible ? province.trim() || null : null,
        district: isLocationTeamVisible ? district.trim() || null : null,
        location: isLocationTeamVisible ? locationText.trim() || null : null,
        objective: cleanObjective,
        description: cleanDescription,
        salesPromotionBudgetRequested: salesPromotionBudget,
        marketingBudgetRequested: marketingBudget,
        notes: extraNotes,
        helperEmployeeIds: isLocationTeamVisible ? helperEmployeeIds : [],
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

            {/* ALERT: เหตุผลที่ส่งกลับแก้ไข / ปฏิเสธ (Read-only) */}
            {latestCorrectionLog && (
              <div
                className={cn(
                  "rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs border",
                  latestCorrectionLog.action === "REQUEST_CORRECTION"
                    ? "bg-amber-50/90 border-amber-200 text-amber-900"
                    : "bg-red-50/90 border-red-200 text-red-900",
                )}
              >
                <div className="flex items-center gap-2 font-bold text-sm sm:text-base border-b pb-2.5 border-amber-200/60">
                  {latestCorrectionLog.action === "REQUEST_CORRECTION" ? (
                    <>
                      <RotateCcw className="w-4.5 h-4.5 text-amber-600 shrink-0" />
                      <span className="text-amber-950 font-bold">
                        เหตุผลที่ส่งกลับแก้ไข
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4.5 h-4.5 text-red-600 shrink-0" />
                      <span className="text-red-950 font-bold">
                        เหตุผลที่ปฏิเสธ
                      </span>
                    </>
                  )}
                </div>
                <div className="bg-white/95 rounded-xl p-3.5 sm:p-4 border border-amber-100/80 space-y-3 shadow-2xs">
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line font-medium">
                    {latestCorrectionLog.comment || "-"}
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium text-slate-600">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      ผู้ตรวจสอบ:{" "}
                      <span className="font-semibold text-slate-800">
                        {latestCorrectionLog.user?.name || "ผู้อนุมัติ"}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      วันที่:{" "}
                      {format(
                        new Date(latestCorrectionLog.createdAt),
                        "dd/MM/yyyy HH:mm",
                        { locale: th },
                      )}{" "}
                      น.
                    </span>
                  </div>
                </div>
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
                      {activeWorkTypeOptions.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-400">
                          กำลังโหลดประเภทงาน...
                        </div>
                      ) : (
                        activeWorkTypeOptions.map((typeItem) => {
                          const displayName =
                            (typeItem as any).displayName ||
                            getWorkTypeName(typeItem.code) ||
                            typeItem.name;
                          const isChecked = tempSelectedWorkTypes.some(
                            (t) =>
                              t === displayName ||
                              t === typeItem.name ||
                              getWorkTypeCode(t) === typeItem.code,
                          );
                          return (
                            <label
                              key={typeItem.code}
                              onClick={() => toggleWorkType(displayName)}
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
                              <span>{displayName}</span>
                            </label>
                          );
                        })
                      )}
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
                  {/* Work Type 1: เข้าพบเกษตรกร */}
                  {(selectedWorkTypes.includes("เข้าพบเกษตรกร") ||
                    selectedWorkTypes.includes(
                      "เข้าพบร้านค้า / Key Farmer",
                    )) && (
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

                  {/* Work Type 6: ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา */}
                  {selectedWorkTypes.includes(
                    "ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา",
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

                  {/* Work Type 7A: ทำแปลงสาธิต */}
                  {selectedWorkTypes.some(
                    (t) => getWorkTypeCode(t) === "TYPE_7A",
                  ) && (
                    <Type7Demo
                      mode="TYPE_7A"
                      readonly={readonly}
                      type7Items={type7Items}
                      addType7Row={() => addType7Row("CREATE")}
                      updateType7Row={updateType7Row}
                      deleteType7Row={deleteType7Row}
                      customers={customersList}
                      products={productsList}
                      productCategories={productCategoriesList}
                      chemicalGroups={productCategoriesList}
                      demoPlots={demoPlotsList}
                      parentStartDate={startDate}
                    />
                  )}

                  {/* Work Type 7B: ติดตามแปลงสาธิต */}
                  {selectedWorkTypes.some(
                    (t) => getWorkTypeCode(t) === "TYPE_7B",
                  ) && (
                    <Type7Demo
                      mode="TYPE_7B"
                      readonly={readonly}
                      type7Items={type7Items}
                      addType7Row={() => addType7Row("FOLLOW_UP")}
                      updateType7Row={updateType7Row}
                      deleteType7Row={deleteType7Row}
                      customers={customersList}
                      products={productsList}
                      productCategories={productCategoriesList}
                      chemicalGroups={productCategoriesList}
                      demoPlots={followUpPlotsForType7B}
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
            {isLocationTeamVisible && (
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
                province={province}
                setProvince={setProvince}
                district={district}
                setDistrict={setDistrict}
              />
            )}

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
