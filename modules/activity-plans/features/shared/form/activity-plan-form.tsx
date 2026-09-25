"use client";

import React, { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/custom/section-header";
import type { ActivityPlanFormValues } from "../../../application/validations";
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
import { Type12Tour } from "@/modules/activity-plans/features/type-12/create/type12-tour";
import { Type13Create } from "@/modules/activity-plans/features/type-13";
import type { Type13PlotItem } from "@/modules/activity-plans/application/validations";
import { Type14Create } from "@/modules/activity-plans/features/type-14";
import type { Type14PlanInput } from "@/modules/activity-plans/application/validations";

// Phase 1: Shared Sub-systems
import { useActivityPlanMasterData } from "../hooks/use-activity-plan-master-data";
import { usePlanLocationTeam } from "../hooks/use-plan-location-team";
import { usePlanBudget } from "../budget/hooks/use-plan-budget";
import { PlanBasicInfoCard } from "./plan-basic-info-card";
import { PlanWorkTypeSelector } from "./plan-work-type-selector";
import { PlanLocationTeamCard } from "./plan-location-team-card";
import { PlanBudgetSection } from "../budget/plan-budget-section";
import { PlanNotesCard } from "./plan-notes-card";

// Phase 2: Type-specific Form Hooks
import { useType1Form } from "@/modules/activity-plans/features/type-1/hooks/use-type1-form";
import { useType2Form } from "@/modules/activity-plans/features/type-2/hooks/use-type2-form";
import { useType3Form } from "@/modules/activity-plans/features/type-3/hooks/use-type3-form";
import { useType4Form } from "@/modules/activity-plans/features/type-4/hooks/use-type4-form";
import { useType5Form } from "@/modules/activity-plans/features/type-5/hooks/use-type5-form";
import { useType6Form } from "@/modules/activity-plans/features/type-6/hooks/use-type6-form";
import { useType7aForm } from "@/modules/activity-plans/features/type-7a/hooks/use-type7a-form";
import { useType7bForm } from "@/modules/activity-plans/features/type-7b/hooks/use-type7b-form";
import { useType8Form } from "@/modules/activity-plans/features/type-8/hooks/use-type8-form";
import { useType9Form } from "@/modules/activity-plans/features/type-9/hooks/use-type9-form";
import { useType10Form } from "@/modules/activity-plans/features/type-10/hooks/use-type10-form";
import { useType11Form } from "@/modules/activity-plans/features/type-11/hooks/use-type11-form";
import { useType12Form } from "@/modules/activity-plans/features/type-12/hooks/use-type12-form";
import { useType13Form } from "@/modules/activity-plans/features/type-13/hooks/use-type13-form";
import { useType14Form } from "@/modules/activity-plans/features/type-14/hooks/use-type14-form";


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
  // Phase 1: Master Data Loading Hook
  const {
    customersList,
    productsList,
    productCategoriesList,
    demoPlotsList,
    fetchedFollowUpDemoPlots,
    activeWorkTypeOptions,
    fetchedMaterialsByCategory,
  } = useActivityPlanMasterData({
    initialCustomers,
    initialProducts,
    initialProductCategories,
    initialChemicalGroups,
    initialActivityTypes,
    initialDemoPlots,
    promotionalMaterialsByCategory,
  });

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

  const initDetails = (initial as any)?.details;
  // Phase 2: Type-specific Form Hooks (TYPE_1 - TYPE_13)
  const {
    type1Items,
    setType1Items,
    addType1Row,
    updateType1Row,
    deleteType1Row,
    validateType1,
    mapType1Payload,
  } = useType1Form({
    initial,
    initDetails,
    customersList,
    selectedWorkTypes,
  });

  const {
    type2Items,
    setType2Items,
    addType2Row,
    updateType2Row,
    deleteType2Row,
    validateType2,
    mapType2Payload,
  } = useType2Form({
    initial,
    initDetails,
    customersList,
    productsList,
    selectedWorkTypes,
  });

  const {
    type3Items,
    setType3Items,
    addType3Row,
    updateType3Row,
    deleteType3Row,
    validateType3,
    mapType3Payload,
  } = useType3Form({
    initial,
    initDetails,
    customersList,
    productsList,
    selectedWorkTypes,
  });

  const {
    type4Items,
    setType4Items,
    addType4Row,
    updateType4Row,
    deleteType4Row,
    validateType4,
    mapType4Payload,
  } = useType4Form({
    initial,
    initDetails,
    customersList,
    selectedWorkTypes,
  });

  const {
    type5Items,
    setType5Items,
    addType5Row,
    updateType5Row,
    deleteType5Row,
    validateType5,
    mapType5Payload,
  } = useType5Form({
    initial,
    initDetails,
    customersList,
    productsList,
    selectedWorkTypes,
  });

  const {
    type6Items,
    setType6Items,
    addType6Row,
    updateType6Row,
    deleteType6Row,
    validateType6,
    mapType6Payload,
  } = useType6Form({
    initial,
    initDetails,
    customersList,
    selectedWorkTypes,
  });

  const {
    type7aItems,
    setType7aItems,
    addType7aRow,
    updateType7aRow,
    deleteType7aRow,
    validateType7a,
    mapType7aPayload,
  } = useType7aForm({
    initial,
    initDetails,
    initialTypes,
    customersList,
    productsList,
    productCategoriesList,
    selectedWorkTypes,
    parentStartDate: startDate,
  });

  const {
    type7bItems,
    setType7bItems,
    followUpPlotsForType7B,
    addType7bRow,
    updateType7bRow,
    deleteType7bRow,
    validateType7b,
    mapType7bPayload,
  } = useType7bForm({
    initial,
    initDetails,
    initialTypes,
    fetchedFollowUpDemoPlots,
    demoPlotsList,
    productsList,
    selectedWorkTypes,
    parentStartDate: startDate,
  });

  const {
    type8Items,
    setType8Items,
    addType8Row,
    updateType8Row,
    deleteType8Row,
    addPromotionProduct,
    updatePromotionProduct,
    deletePromotionProduct,
    validateType8,
    mapType8Payload,
  } = useType8Form({
    initial,
    initDetails,
    customersList,
    productsList,
    selectedWorkTypes,
  });

  const {
    type9Store,
    setType9Store,
    type9IsSubDealer,
    setType9IsSubDealer,
    type9SubDealerStore,
    setType9SubDealerStore,
    type9Sales,
    setType9Sales,
    type9Products,
    setType9Products,
    type9ProductItems,
    setType9ProductItems,
    addType9ProductItem,
    updateType9ProductItem,
    deleteType9ProductItem,
    validateType9,
    mapType9Payload,
  } = useType9Form({
    initial,
    initDetails,
    customersList,
    productsList,
    selectedWorkTypes,
  });

  const {
    type10DemoPlot,
    setType10DemoPlot,
    type10Location,
    setType10Location,
    type10TargetCrop,
    setType10TargetCrop,
    type10Showcase,
    setType10Showcase,
    type10Attendees,
    setType10Attendees,
    type10BookingSales,
    setType10BookingSales,
    validateType10,
    mapType10Payload,
  } = useType10Form({
    initial,
    initDetails,
    demoPlotsList,
    selectedWorkTypes,
  });

  const {
    type11Stores,
    setType11Stores,
    validateType11,
    mapType11Payload,
  } = useType11Form({
    initial,
    initDetails,
    customersList,
    selectedWorkTypes,
  });

  const {
    type12TourType,
    setType12TourType,
    type12TourSize,
    setType12TourSize,
    type12Country,
    setType12Country,
    type12Store,
    setType12Store,
    type12Destination,
    setType12Destination,
    validateType12,
    mapType12Payload,
  } = useType12Form({
    initial,
    initDetails,
    customersList,
    selectedWorkTypes,
  });

  const {
    type13Plots,
    setType13Plots,
    validateType13,
    mapType13Payload,
  } = useType13Form({
    initial,
    selectedWorkTypes,
  });


  // Phase 1: Location & Team State (usePlanLocationTeam hook)
  const {
    province,
    setProvince,
    district,
    setDistrict,
    locationText,
    setLocationText,
    helperEmployeeIds,
    setHelperEmployeeIds,
    helperSearch,
    setHelperSearch,
    showHelperDropdown,
    setShowHelperDropdown,
    isLocationTeamVisible,
    filteredEmployees,
    addHelper,
    removeHelper,
    validateLocationTeam,
  } = usePlanLocationTeam({
    initial,
    selectedWorkTypes,
    employees,
  });

  const {
    type14Data,
    setType14Data,
    validateType14,
    mapType14Payload,
  } = useType14Form({
    initial,
    selectedWorkTypes,
    defaultProvince: province,
    defaultDistrict: district,
  });


  // Phase 1: Budget & Expenses State (usePlanBudget hook)
  const {
    isPromotionalMediaSelected,
    setIsPromotionalMediaSelected,
    marketingBudgetAmount,
    setMarketingBudgetAmount,
    marketingProductItems,
    setMarketingProductItems,
    addMarketingProductItem,
    updateMarketingProductItem,
    deleteMarketingProductItem,

    isSalesPromotionSelected,
    setIsSalesPromotionSelected,
    salesPromotionItems,
    setSalesPromotionItems,
    addSalesPromotionRow,
    updateSalesPromotionRow,
    deleteSalesPromotionRow,

    extraExpenseAmount,
    setExtraExpenseAmount,
    extraExpenseDetail,
    setExtraExpenseDetail,

    requisitionItems,
    setRequisitionItems,
    addRequisitionRow,
    updateRequisitionRow,
    deleteRequisitionRow,

    salesPromotionBudget,
    marketingBudget,

    validateBudget,
    buildBudgetPayload,
  } = usePlanBudget({
    initial,
    initDetails,
  });

  // Section 7: Additional Info State
  const [notes, setNotes] = useState(initial.notes ?? "");

  // TYPE_8 Location & Venue Helpers
  const isType8Active = selectedWorkTypes.some(
    (t) =>
      getWorkTypeCode(t) === "TYPE_8" ||
      t === "จัดประชุม" ||
      t === "จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์",
  );

  const type8Item = type8Items[0];
  const type8DealerId = type8Item?.dealerId;

  const type8SelectedDealer = useMemo(() => {
    if (!type8DealerId) return null;
    return customersList.find((c: any) => c.id === type8DealerId) ?? null;
  }, [type8DealerId, customersList]);

  const type8VenueType: "STORE" | "OTHER" = type8Item?.venueType ?? "STORE";

  const handleType8VenueTypeChange = (newVenueType: "STORE" | "OTHER") => {
    if (type8Item) {
      updateType8Row(type8Item.id, "venueType", newVenueType);
      if (newVenueType === "STORE" && type8SelectedDealer) {
        if (type8SelectedDealer.province) setProvince(type8SelectedDealer.province);
        if (type8SelectedDealer.district) setDistrict(type8SelectedDealer.district);
        const storeAddr = [
          type8SelectedDealer.addressLine,
          type8SelectedDealer.subdistrict,
          type8SelectedDealer.district,
          type8SelectedDealer.province,
          type8SelectedDealer.postalCode,
        ]
          .filter(Boolean)
          .join(" ");
        if (storeAddr) setLocationText(storeAddr);
      }
    }
  };

  useEffect(() => {
    if (isType8Active && type8VenueType === "STORE" && type8SelectedDealer) {
      if (type8SelectedDealer.province) setProvince(type8SelectedDealer.province);
      if (type8SelectedDealer.district) setDistrict(type8SelectedDealer.district);
      const storeAddr = [
        type8SelectedDealer.addressLine,
        type8SelectedDealer.subdistrict,
        type8SelectedDealer.district,
        type8SelectedDealer.province,
        type8SelectedDealer.postalCode,
      ]
        .filter(Boolean)
        .join(" ");
      if (storeAddr) setLocationText(storeAddr);
    }
  }, [isType8Active, type8VenueType, type8SelectedDealer, setProvince, setDistrict, setLocationText]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    // Phase 2: Type-specific Validations
    const val1 = validateType1();
    if (!val1.isValid) {
      setError(val1.error || "ข้อมูล Work Type 1 ไม่ถูกต้อง");
      setLoading(false);
      return;
    }

    const val2 = validateType2();
    if (!val2.isValid) {
      setError(val2.error || "ข้อมูล Work Type 2 ไม่ถูกต้อง");
      setLoading(false);
      return;
    }

    const val3 = validateType3();
    if (!val3.isValid) {
      setError(val3.error || "ข้อมูล Work Type 3 ไม่ถูกต้อง");
      setLoading(false);
      return;
    }

    const val4 = validateType4();
    if (!val4.isValid) {
      setError(val4.error || "ข้อมูล Work Type 4 ไม่ถูกต้อง");
      setLoading(false);
      return;
    }

    const val5 = validateType5();
    if (!val5.isValid) {
      setError(val5.error || "ข้อมูล Work Type 5 ไม่ถูกต้อง");
      setLoading(false);
      return;
    }

    const val12 = validateType12();
    if (!val12.isValid) {
      setError(val12.error || "ข้อมูลทัวร์ไม่ถูกต้อง");
      setLoading(false);
      return;
    }

    const val6 = validateType6();
    if (!val6.isValid) {
      setError(val6.error || "ข้อมูล Work Type 6 ไม่ถูกต้อง");
      setLoading(false);
      return;
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

    const val7a = validateType7a();
    if (!val7a.isValid) {
      setError(val7a.error || "ข้อมูลทำแปลงสาธิตไม่ถูกต้อง");
      setLoading(false);
      return;
    }

    const val7b = validateType7b();
    if (!val7b.isValid) {
      setError(val7b.error || "ข้อมูลติดตามแปลงสาธิตไม่ถูกต้อง");
      setLoading(false);
      return;
    }

    const val8 = validateType8();
    if (!val8.isValid) {
      setError(val8.error || "ข้อมูลการประชุมไม่ถูกต้อง");
      setLoading(false);
      return;
    }

    const val9 = validateType9();
    if (!val9.isValid) {
      setError(val9.error || "ข้อมูลกิจกรรมส่งเสริมการขายหน้าร้านไม่ถูกต้อง");
      setLoading(false);
      return;
    }

    const val10 = validateType10();
    if (!val10.isValid) {
      setError(val10.error || "ข้อมูลงาน Field Day ไม่ถูกต้อง");
      setLoading(false);
      return;
    }

    const val11 = validateType11();
    if (!val11.isValid) {
      setError(val11.error || "ข้อมูลตรวจเช็กสต็อกหน้าร้านไม่ถูกต้อง");
      setLoading(false);
      return;
    }

    const val13 = validateType13();
    if (!val13.isValid) {
      setError(val13.error || "ข้อมูลฉีดแปลงแฮตแทคไม่ถูกต้อง");
      setLoading(false);
      return;
    }

    const val14 = validateType14();
    if (!val14.isValid) {
      setError(val14.error || "ข้อมูลติดตามแปลงแฮทแทคไม่ถูกต้อง");
      setLoading(false);
      return;
    }

    let cleanObjective = (initial as any)?.objective ?? "";
    const cleanDescription = (initial as any)?.description ?? null;

    // Phase 1: Budget validation (usePlanBudget hook)
    const budgetValidation = validateBudget();
    if (!budgetValidation.isValid) {
      setError(budgetValidation.error || "ข้อมูลสื่อส่งเสริมการขายไม่ถูกต้อง");
      setLoading(false);
      return;
    }

    // Phase 1: Location & Team validation (usePlanLocationTeam hook)
    const locationValidation = validateLocationTeam();
    if (!locationValidation.isValid) {
      setError(locationValidation.error || "กรุณากรอกรายละเอียดพื้นที่จัดกิจกรรม");
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

      // 1. TYPE_1
      const type1Payload = mapType1Payload(customersList);
      planStores.push(...type1Payload.planStores);

      // 2. TYPE_2
      const type2Payload = mapType2Payload(customersList, productsList);
      planStores.push(...type2Payload.planStores);
      planProducts.push(...type2Payload.planProducts);

      // 3. TYPE_3
      const type3Payload = mapType3Payload(customersList, productsList);
      planStores.push(...type3Payload.planStores);
      planProducts.push(...type3Payload.planProducts);

      // 4. TYPE_4
      const type4Payload = mapType4Payload(customersList);
      planStores.push(...type4Payload.planStores);

      // 5. TYPE_5
      const type5Payload = mapType5Payload(customersList, productsList);
      planStores.push(...type5Payload.planStores);
      planProducts.push(...type5Payload.planProducts);

      // 6. TYPE_6
      const type6Payload = mapType6Payload(customersList);
      planStores.push(...type6Payload.planStores);

      // 7. TYPE_7A / TYPE_7B
      const hasType7APlan = selectedWorkTypes.some(
        (t) => getWorkTypeCode(t) === "TYPE_7A",
      );
      const hasType7BPlan = selectedWorkTypes.some(
        (t) => getWorkTypeCode(t) === "TYPE_7B",
      );

      let submittedDemoPlotData: any = null;
      let submittedDemoPlotId: string | null = null;

      if (hasType7APlan) {
        const type7aPayload = mapType7aPayload(customersList, productsList);
        submittedDemoPlotData = type7aPayload.submittedDemoPlotData;
        planProducts.push(...type7aPayload.planProducts);
      } else if (hasType7BPlan) {
        const type7bPayload = mapType7bPayload(productsList);
        submittedDemoPlotId = type7bPayload.submittedDemoPlotId;
        if (type7bPayload.t7bObjective) {
          cleanObjective = type7bPayload.t7bObjective;
        }
        planProducts.push(...type7bPayload.planProducts);
      }

      // 8. TYPE_8
      let submittedTargetAttendees: number | null = null;
      let submittedTargetBookingSales: number | null = null;

      const type8Payload = mapType8Payload(customersList, productsList);
      if (type8Payload.targetAttendees > 0) {
        submittedTargetAttendees = (submittedTargetAttendees || 0) + type8Payload.targetAttendees;
      }
      planStores.push(...type8Payload.planStores);
      planProducts.push(...type8Payload.planProducts);

      // 9. TYPE_9
      const type9Payload = mapType9Payload(customersList, productsList);
      planStores.push(...type9Payload.planStores);
      planProducts.push(...type9Payload.planProducts);

      // 10. TYPE_10
      const type10Payload = mapType10Payload(demoPlotsList);
      if (type10Payload.submittedDemoPlotId) {
        submittedDemoPlotId = type10Payload.submittedDemoPlotId;
      }
      if (type10Payload.targetAttendees != null) {
        submittedTargetAttendees = type10Payload.targetAttendees;
      }
      if (type10Payload.targetBookingSales != null) {
        submittedTargetBookingSales = type10Payload.targetBookingSales;
      }

      // 11. TYPE_11
      const type11Payload = mapType11Payload(customersList);
      planStores.push(...type11Payload.planStores);

      // 12. TYPE_12
      const { tourData } = mapType12Payload(customersList);

      // 13. TYPE_13
      const type13Payload = mapType13Payload(customersList);
      planStores.push(...type13Payload.planStores);

      // 14. TYPE_14
      const type14Payload = mapType14Payload(customersList);
      planStores.push(...type14Payload.planStores);

      // Phase 1: Budget items mapping (usePlanBudget hook)
      const {
        marketingItems,
        promotionItems,
        salesPromotionBudgetRequested,
        marketingBudgetRequested,
      } = buildBudgetPayload();

      const res = await onSubmit({
        title,
        startDate: startDateTime,
        endDate: endDateTime,
        activityTypeId,
        workTypeCodes: selectedWorkTypes.map(getWorkTypeCode),
        tourData,
        demoPlotData: submittedDemoPlotData,
        type13Plots: type13Payload.type13Plots,
        type14Data: type14Payload.type14Data,
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
        salesPromotionBudgetRequested,
        marketingBudgetRequested,
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
            <PlanBasicInfoCard
              isEdit={isEdit}
              readonly={readonly}
              initial={initial}
              error={error}
              latestCorrectionLog={latestCorrectionLog}
              title={title}
              setTitle={setTitle}
              startDate={startDate}
              setStartDate={setStartDate}
              startTime={startTime}
              setStartTime={setStartTime}
              endDate={endDate}
              setEndDate={setEndDate}
              endTime={endTime}
              setEndTime={setEndTime}
              workTypeSelectorNode={
                <PlanWorkTypeSelector
                  selectedWorkTypes={selectedWorkTypes}
                  setSelectedWorkTypes={setSelectedWorkTypes}
                  activeWorkTypeOptions={activeWorkTypeOptions}
                  readonly={readonly}
                />
              }
            />

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
                      type7Items={type7aItems}
                      addType7Row={addType7aRow}
                      updateType7Row={updateType7aRow}
                      deleteType7Row={deleteType7aRow}
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
                      type7Items={type7bItems}
                      addType7Row={addType7bRow}
                      updateType7Row={updateType7bRow}
                      deleteType7Row={deleteType7bRow}
                      customers={customersList}
                      products={productsList}
                      productCategories={productCategoriesList}
                      chemicalGroups={productCategoriesList}
                      demoPlots={followUpPlotsForType7B}
                      parentStartDate={startDate}
                    />
                  )}

                  {/* Work Type 8: จัดประชุม */}
                  {selectedWorkTypes.some(
                    (t) =>
                      getWorkTypeCode(t) === "TYPE_8" ||
                      t === "จัดประชุม" ||
                      t === "จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์",
                  ) && (
                    <Type8Meeting
                      readonly={readonly}
                      type8Items={type8Items}
                      addType8Row={addType8Row}
                      updateType8Row={updateType8Row}
                      deleteType8Row={deleteType8Row}
                      products={productsList}
                      customers={customersList}
                      addPromotionProduct={addPromotionProduct}
                      updatePromotionProduct={updatePromotionProduct}
                      deletePromotionProduct={deletePromotionProduct}
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

                  {/* Work Type 13: ฉีดแปลงแฮตแทค */}
                  {selectedWorkTypes.some(
                    (t) => getWorkTypeCode(t) === "TYPE_13",
                  ) && (
                    <Type13Create
                      plots={type13Plots}
                      onChange={setType13Plots}
                      dealers={customersList}
                      products={productsList}
                      readonly={readonly}
                    />
                  )}

                  {/* Work Type 14: ติดตามแปลงแฮทแทค */}
                  {selectedWorkTypes.some(
                    (t) => getWorkTypeCode(t) === "TYPE_14",
                  ) && (
                    <Type14Create
                      value={type14Data}
                      onChange={setType14Data}
                      dealerCustomers={customersList}
                      planDate={startDate}
                      defaultProvince={province}
                      defaultDistrict={district}
                      readonly={readonly}
                    />
                  )}
                </div>
              </div>
            )}

            {/* SECTION 4: สถานที่และทีมงาน (Location & Team) */}
            <PlanLocationTeamCard
              isVisible={isLocationTeamVisible}
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
              isType8Active={isType8Active}
              selectedDealer={type8SelectedDealer}
              venueType={type8VenueType}
              onVenueTypeChange={handleType8VenueTypeChange}
            />

            {/* SECTION 5: งบประมาณและค่าใช้จ่าย (Budget & Expenses) */}
            <PlanBudgetSection
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
            <PlanNotesCard
              notes={notes}
              setNotes={setNotes}
              readonly={readonly}
            />

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
