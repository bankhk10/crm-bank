"use client";

import React, { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ActivityPlanFormValues } from "../../../application/validations";
import { FormActionButtons } from "../../../ui/form-action-buttons";

import {
  WORK_TYPES,
  WORK_TYPE_CONFIG,
  getWorkTypeCode,
  resolveWorkTypeCode,
  hydrateWorkTypesFromPlan,
  isWorkTypeAllowedForUnplanned,
  type UserDemoPlotOption,
} from "../../../constants";

// Shared Sub-systems & Hooks
import { useActivityPlanMasterData } from "../../shared/hooks/use-activity-plan-master-data";
import { usePlanLocationTeam } from "../../shared/hooks/use-plan-location-team";
import { usePlanBudget } from "../../shared/budget/hooks/use-plan-budget";
import { useAllTypeForms } from "../../shared/form/hooks/use-all-type-forms";
import { PlanWorkTypeRenderer } from "../../shared/form/plan-work-type-renderer";

import { PlanBasicInfoCard } from "../../shared/form/plan-basic-info-card";
import { PlanWorkTypeSelector } from "../../shared/form/plan-work-type-selector";
import { PlanLocationTeamCard } from "../../shared/form/plan-location-team-card";
import { PlanBudgetSection } from "../../shared/budget/plan-budget-section";
import { PlanNotesCard } from "../../shared/form/plan-notes-card";

// Actual Sub-systems & Hooks (Unplanned Activity)
import {
  ActivityResultSection,
  ActivityStatusSection,
} from "../../shared/actual-view/components";
import { initialTargets } from "../../shared/actual-view/constants";
import { useActualStatusState } from "../../shared/actual-view/hooks/use-actual-status-state";
import { useActualOrchestrator } from "../../shared/actual-view/hooks/use-actual-orchestrator";

// Drug Withdrawal
import { DrugWithdrawalCard } from "../../shared/drug-withdrawal/drug-withdrawal-card";
import { isDrugWithdrawalSupported } from "../../shared/drug-withdrawal";
import {
  validateDrugWithdrawal,
  type DrugWithdrawalInput,
} from "../../../application/validations";
import type { DrugWithdrawalPlotOption } from "../../shared/drug-withdrawal/types";

type SubmitResult = {
  success: boolean;
  error?: string;
};

export interface UnplannedActivityFormProps {
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
    activityResult?: any;
    result?: any;
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

export function UnplannedActivityForm({
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
  submitLabel = "บันทึกกิจกรรมนอกแผน",
  readonly = false,
  isEdit = false,
}: UnplannedActivityFormProps) {
  // Master Data Loading Hook
  const {
    customersList,
    productsList,
    productCategoriesList,
    demoPlotsList,
    fetchedFollowUpDemoPlots,
    fetchedFollowUpPlansWithPlots,
    fetchedHattackDemoPlots,
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

  // Date Parsing
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

  const initStart = parseInitialDate(initial.startDate);
  const initEnd = parseInitialDate(initial.endDate, "09:00");

  // Form Basic State
  const [title, setTitle] = useState(initial.title ?? "");
  const [startDate, setStartDate] = useState(initStart.dateStr);
  const [startTime, setStartTime] = useState(initStart.timeStr);
  const [endDate, setEndDate] = useState(initEnd.dateStr);
  const [endTime, setEndTime] = useState(initEnd.timeStr);

  // Approval Log for correction alert
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

  const unplannedWorkTypeOptions = useMemo(() => {
    return activeWorkTypeOptions.filter((item) =>
      isWorkTypeAllowedForUnplanned(item.code || item.id || item.name),
    );
  }, [activeWorkTypeOptions]);

  // Work types selection state (Single Selection for Unplanned)
  const initialTypes = useMemo(() => {
    const types = hydrateWorkTypesFromPlan(initial, initialActivityTypes);
    const filtered = types.filter((t) => isWorkTypeAllowedForUnplanned(t));
    return filtered.length > 0 ? [filtered[0]] : [];
  }, [initial, initialActivityTypes]);

  const [selectedWorkTypes, setSelectedWorkTypes] =
    useState<string[]>(initialTypes);

  const initDetails = (initial as any)?.details;

  // Location & Team State
  const {
    province,
    setProvince,
    district,
    setDistrict,
    locationText,
    setLocationText,
    helperEmployeeIds,
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
    isEdit,
  });

  // All Type Forms Orchestration Hook (Plan details)
  const typeForms = useAllTypeForms({
    initial,
    initDetails,
    initialTypes,
    selectedWorkTypes,
    customersList,
    productsList,
    productCategoriesList,
    demoPlotsList,
    fetchedFollowUpDemoPlots,
    fetchedFollowUpPlansWithPlots,
    startDate,
    defaultProvince: province,
    defaultDistrict: district,
  });

  // Budget & Expenses State
  const {
    isPromotionalMediaSelected,
    setIsPromotionalMediaSelected,
    marketingBudgetAmount,
    setMarketingBudgetAmount,
    marketingProductItems,
    addMarketingProductItem,
    updateMarketingProductItem,
    deleteMarketingProductItem,

    isSalesPromotionSelected,
    setIsSalesPromotionSelected,
    salesPromotionItems,
    addSalesPromotionRow,
    updateSalesPromotionRow,
    deleteSalesPromotionRow,

    extraExpenseAmount,
    setExtraExpenseAmount,
    extraExpenseDetail,
    setExtraExpenseDetail,

    requisitionItems,
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

  // Actual Sub-Systems & Hooks (Unplanned Activity)
  const statusState = useActualStatusState();

  const existingResult = useMemo(() => {
    return (
      initial?.activityResult ||
      initial?.result ||
      initial?.details?.activityResult ||
      null
    );
  }, [initial]);

  const actualOrchestrator = useActualOrchestrator({
    id: initial?.id,
    plan: initial,
    parsedResult: existingResult,
    targets: {},
    statusState,
  });

  // Hydrate actual hooks when editing an Unplanned draft
  useEffect(() => {
    if (existingResult) {
      statusState.hydrateStatus(existingResult);
      actualOrchestrator.hydrate(initial, existingResult, {});
    }
  }, [existingResult, initial]);

  // Drug Withdrawal State & Logic
  const [drugWithdrawal, setDrugWithdrawal] = useState<DrugWithdrawalInput>(
    () => {
      const rawDw = (initial as any)?.drugWithdrawal;
      if (!rawDw) {
        return {
          hasDrugWithdrawal: false,
          items: [],
        };
      }
      return {
        hasDrugWithdrawal: Boolean(
          rawDw.hasDrugWithdrawal ?? (rawDw.items && rawDw.items.length > 0),
        ),
        notes: rawDw.notes ?? undefined,
        items: (rawDw.items || []).map((it: any, idx: number) => ({
          id: it.id,
          demoPlotId: it.demoPlotId ?? undefined,
          plotIdentifier: it.plotIdentifier || it.demoPlot?.name || "",
          productId: it.productId,
          productName: it.productName || it.product?.name || "",
          quantity:
            typeof it.quantity === "number"
              ? it.quantity
              : parseFloat(String(it.quantity)) || 0,
          unit: it.unit || it.product?.unit || "",
          sortOrder: it.sortOrder ?? idx,
        })),
      };
    },
  );

  useEffect(() => {
    if ((initial as any)?.drugWithdrawal) {
      const rawDw = (initial as any).drugWithdrawal;
      setDrugWithdrawal({
        hasDrugWithdrawal: Boolean(
          rawDw.hasDrugWithdrawal ?? (rawDw.items && rawDw.items.length > 0),
        ),
        notes: rawDw.notes ?? undefined,
        items: (rawDw.items || []).map((it: any, idx: number) => ({
          id: it.id,
          demoPlotId: it.demoPlotId ?? undefined,
          plotIdentifier: it.plotIdentifier || it.demoPlot?.name || "",
          productId: it.productId,
          productName: it.productName || it.product?.name || "",
          quantity:
            typeof it.quantity === "number"
              ? it.quantity
              : parseFloat(String(it.quantity)) || 0,
          unit: it.unit || it.product?.unit || "",
          sortOrder: it.sortOrder ?? idx,
        })),
      });
    }
  }, [(initial as any)?.drugWithdrawal]);

  const isDrugWithdrawalEligible = useMemo(() => {
    return selectedWorkTypes.some((t) =>
      isDrugWithdrawalSupported(getWorkTypeCode(t)),
    );
  }, [selectedWorkTypes]);

  const hasGlobalDrugWithdrawal = useMemo(() => {
    return selectedWorkTypes.some((t) => {
      const code = getWorkTypeCode(t);
      return isDrugWithdrawalSupported(code) && code !== "TYPE_13";
    });
  }, [selectedWorkTypes]);

  const availableWithdrawalPlots = useMemo<DrugWithdrawalPlotOption[]>(() => {
    const plots: DrugWithdrawalPlotOption[] = [];
    const seenKeys = new Set<string>();

    const addPlot = (p: DrugWithdrawalPlotOption) => {
      const key = p.demoPlotId || p.plotIdentifier || p.name;
      if (!key || seenKeys.has(key)) return;
      seenKeys.add(key);
      plots.push(p);
    };

    const hasType14 = selectedWorkTypes.some(
      (t) => getWorkTypeCode(t) === "TYPE_14",
    );

    if (hasType14) {
      if (typeForms.type14.type14Data?.name?.trim()) {
        addPlot({
          id:
            typeForms.type14.type14Data.demoPlotId ||
            `type14-${typeForms.type14.type14Data.name}`,
          name: typeForms.type14.type14Data.name.trim(),
          subLabel:
            [
              typeForms.type14.type14Data.ownerName,
              typeForms.type14.type14Data.province,
            ]
              .filter(Boolean)
              .join(" - ") || undefined,
          plotIdentifier: typeForms.type14.type14Data.name.trim(),
          demoPlotId: typeForms.type14.type14Data.demoPlotId || null,
        });
      }
      if (Array.isArray(fetchedHattackDemoPlots)) {
        fetchedHattackDemoPlots.forEach((plot) => {
          addPlot({
            id: plot.id,
            name: plot.name,
            subLabel:
              [plot.ownerName, plot.location].filter(Boolean).join(" - ") ||
              undefined,
            plotIdentifier: plot.name,
            demoPlotId: plot.id,
          });
        });
      }
    }

    return plots;
  }, [selectedWorkTypes, typeForms.type14.type14Data, fetchedHattackDemoPlots]);

  // Section 6: Notes State
  const [notes, setNotes] = useState(initial.notes ?? "");

  // UI State
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

    const invalidUnplannedTypes = selectedWorkTypes.filter(
      (t) => !isWorkTypeAllowedForUnplanned(t),
    );
    if (invalidUnplannedTypes.length > 0) {
      setError(
        "ในกิจกรรมนอกแผน ห้ามเลือกประเภทงาน ทำแปลงสาธิต (TYPE7A) หรือ จัดงาน Field Day (TYPE10)",
      );
      return;
    }

    setLoading(true);
    setError(null);

    const startDateTime = new Date(`${startDate}T${startTime}:00`);
    const endDateTime = new Date(`${endDate}T${endTime}:00`);

    // 1. Validate work types
    const typeValidation = typeForms.validateWorkTypes();
    if (!typeValidation.isValid) {
      setError(typeValidation.error || "ข้อมูลประเภทงานไม่ถูกต้อง");
      setLoading(false);
      return;
    }

    // 2. Validate drug withdrawal (Global card)
    if (hasGlobalDrugWithdrawal && drugWithdrawal.hasDrugWithdrawal) {
      const activeDwType = selectedWorkTypes.find((t) => {
        const c = getWorkTypeCode(t);
        return isDrugWithdrawalSupported(c) && c !== "TYPE_13";
      });
      const dwCode = activeDwType ? getWorkTypeCode(activeDwType) : undefined;
      const dwValidation = validateDrugWithdrawal(drugWithdrawal, dwCode);
      if (!dwValidation.isValid) {
        setError(dwValidation.errors[0] || "ข้อมูลการเบิกยาไม่ถูกต้อง");
        setLoading(false);
        return;
      }
    }

    let cleanObjective = (initial as any)?.objective ?? "";
    const cleanDescription = (initial as any)?.description ?? null;

    // 3. Validate budget
    const budgetValidation = validateBudget();
    if (!budgetValidation.isValid) {
      setError(budgetValidation.error || "ข้อมูลสื่อส่งเสริมการขายไม่ถูกต้อง");
      setLoading(false);
      return;
    }

    // 4. Validate location & team
    const locationValidation = validateLocationTeam();
    if (!locationValidation.isValid) {
      setError(
        locationValidation.error || "กรุณากรอกรายละเอียดพื้นที่จัดกิจกรรม",
      );
      setLoading(false);
      return;
    }

    // 5. Build Actual Data Payload via useActualOrchestrator.buildActualData
    const { validationError, actualData } =
      actualOrchestrator.buildActualData({
        currentStatusState: statusState,
        planSummary: {
          planNo: initial?.planCode || "-",
          title,
          planDate: format(startDateTime, "dd/MM/yyyy"),
          activityTime: `${format(startDateTime, "HH:mm")} - ${format(endDateTime, "HH:mm")}`,
          ownerName: initial?.employeeName || "-",
          activityTypeTitle: selectedWorkTypes.join(", "),
        },
        planWorkTypes: selectedWorkTypes,
        productsList,
        selectedWorkTypes,
      });

    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    const extraNotes = extraExpenseAmount
      ? `${notes}\n(ค่าใช้จ่ายอื่นๆ: ${extraExpenseAmount} บาท - ${extraExpenseDetail})`
      : notes;

    try {
      const firstType = selectedWorkTypes[0] || WORK_TYPES[0];
      const activityTypeId = getWorkTypeCode(firstType) || "TYPE_1";

      const {
        planStores,
        planProducts,
        tourData,
        submittedDemoPlotData,
        submittedDemoPlotId,
        submittedDemoPlotIds,
        t7bObjective,
        submittedTargetAttendees,
        submittedTargetBookingSales,
        type13Payload,
        type14Payload,
      } = typeForms.collectPlanPayloads();

      if (t7bObjective) {
        cleanObjective = t7bObjective;
      }

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
        drugWithdrawal: (() => {
          if (!isDrugWithdrawalEligible) {
            return undefined;
          }

          const items: any[] = [];
          let hasDw = false;
          let notesVal: string | null = null;

          const hasType13Selected = selectedWorkTypes.some(
            (t) => getWorkTypeCode(t) === "TYPE_13",
          );

          if (
            hasType13Selected &&
            type13Payload.drugWithdrawal?.hasDrugWithdrawal
          ) {
            hasDw = true;
            items.push(...(type13Payload.drugWithdrawal.items || []));
            notesVal = type13Payload.drugWithdrawal.notes || null;
          }

          if (hasGlobalDrugWithdrawal && drugWithdrawal.hasDrugWithdrawal) {
            hasDw = true;
            items.push(...(drugWithdrawal.items || []));
            notesVal = notesVal || drugWithdrawal.notes || null;
          }

          if (hasDw && items.length > 0) {
            return {
              hasDrugWithdrawal: true,
              notes: notesVal,
              items,
            };
          }

          return { hasDrugWithdrawal: false, items: [] };
        })(),
        planStores,
        planProducts,
        marketingItems,
        promotionItems,
        targetAttendeesCount: submittedTargetAttendees,
        targetBookingSales: submittedTargetBookingSales,
        demoPlotId: submittedDemoPlotId,
        demoPlotIds: submittedDemoPlotIds,
        province: (() => {
          const isType9Active = selectedWorkTypes.includes(
            "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
          );
          if (isType9Active && typeForms.type9.subDealerProvince?.trim()) {
            return typeForms.type9.subDealerProvince.trim();
          }
          const isType10Active = selectedWorkTypes.some(
            (wt) =>
              wt.includes("Field Day") || getWorkTypeCode(wt) === "TYPE_10",
          );
          const hasOtherLocationWorkType = selectedWorkTypes.some((wt) => {
            const code = getWorkTypeCode(wt);
            if (code === "TYPE_8" || wt.includes("จัดประชุม")) return true;
            return false;
          });
          if (isType10Active && !hasOtherLocationWorkType) return null;
          return isLocationTeamVisible ? province.trim() || null : null;
        })(),
        district: (() => {
          const isType9Active = selectedWorkTypes.includes(
            "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
          );
          if (isType9Active && typeForms.type9.subDealerDistrict?.trim()) {
            return typeForms.type9.subDealerDistrict.trim();
          }
          const isType10Active = selectedWorkTypes.some(
            (wt) =>
              wt.includes("Field Day") || getWorkTypeCode(wt) === "TYPE_10",
          );
          const hasOtherLocationWorkType = selectedWorkTypes.some((wt) => {
            const code = getWorkTypeCode(wt);
            if (code === "TYPE_8" || wt.includes("จัดประชุม")) return true;
            return false;
          });
          if (isType10Active && !hasOtherLocationWorkType) return null;
          return isLocationTeamVisible ? district.trim() || null : null;
        })(),
        location: (() => {
          const isType9Active = selectedWorkTypes.includes(
            "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
          );
          const isType10Active = selectedWorkTypes.some(
            (wt) =>
              wt.includes("Field Day") || getWorkTypeCode(wt) === "TYPE_10",
          );
          const hasOtherLocationWorkType = selectedWorkTypes.some((wt) => {
            const code = getWorkTypeCode(wt);
            if (code === "TYPE_8" || wt.includes("จัดประชุม")) return true;
            return false;
          });
          if (isType9Active && !hasOtherLocationWorkType) return null;
          if (isType10Active && !hasOtherLocationWorkType) return null;
          return isLocationTeamVisible ? locationText.trim() || null : null;
        })(),
        objective: cleanObjective,
        description: cleanDescription,
        salesPromotionBudgetRequested,
        marketingBudgetRequested,
        notes: extraNotes,
        helperEmployeeIds: isLocationTeamVisible ? helperEmployeeIds : [],
        planType: "UNPLANNED",
        actualData,
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
                  ? "แก้ไขกิจกรรมนอกแผน (Unplanned Activity)"
                  : "สร้างกิจกรรมนอกแผน (Unplanned Activity)"}
              </span>
              <span className="inline sm:hidden">
                {isEdit ? "แก้ไขกิจกรรมนอกแผน" : "สร้างกิจกรรมนอกแผน"}
                <br />
                ( Unplanned Activity )
              </span>
            </h5>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 md:space-y-6 pt-4 md:pt-6"
            noValidate
          >
            {/* SECTION 1: Basic Info & Work Types Selector */}
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
                  activeWorkTypeOptions={unplannedWorkTypeOptions}
                  readonly={readonly}
                  isSingleSelect={true}
                />
              }
            />

            {/* SECTION 2: Dynamic Work Types (Plan details) */}
            <PlanWorkTypeRenderer
              selectedWorkTypes={selectedWorkTypes}
              typeForms={typeForms}
              readonly={readonly}
              isEdit={isEdit}
              startDate={startDate}
              customersList={customersList}
              productsList={productsList}
              productCategoriesList={productCategoriesList}
              chemicalGroups={productCategoriesList}
              demoPlotsList={demoPlotsList}
              followUpPlotsForType7B={fetchedFollowUpDemoPlots}
              followUpPlansWithPlots={fetchedFollowUpPlansWithPlots}
              combinedType10DemoPlots={typeForms.combinedType10DemoPlots}
              defaultProvince={province}
              defaultDistrict={district}
            />

            {/* SECTION 3: Global Drug Withdrawal Card */}
            {hasGlobalDrugWithdrawal && (
              <DrugWithdrawalCard
                readonly={readonly}
                value={drugWithdrawal}
                onChange={setDrugWithdrawal}
                products={productsList}
                availablePlots={availableWithdrawalPlots}
              />
            )}

            {/* SECTION 4: Location & Team */}
            {isLocationTeamVisible && (
              <PlanLocationTeamCard
                selectedWorkTypes={selectedWorkTypes}
                employees={employees}
                readonly={readonly}
                province={province}
                setProvince={setProvince}
                district={district}
                setDistrict={setDistrict}
                locationText={locationText}
                setLocationText={setLocationText}
                helperEmployeeIds={helperEmployeeIds}
                helperSearch={helperSearch}
                setHelperSearch={setHelperSearch}
                showHelperDropdown={showHelperDropdown}
                setShowHelperDropdown={setShowHelperDropdown}
                filteredEmployees={filteredEmployees}
                addHelper={addHelper}
                removeHelper={removeHelper}
              />
            )}

            {/* SECTION 5: Budget & Expenses */}
            <PlanBudgetSection
              selectedWorkTypes={selectedWorkTypes}
              readonly={readonly}
              isPromotionalMediaSelected={isPromotionalMediaSelected}
              setIsPromotionalMediaSelected={setIsPromotionalMediaSelected}
              marketingBudgetAmount={marketingBudgetAmount}
              setMarketingBudgetAmount={setMarketingBudgetAmount}
              marketingProductItems={marketingProductItems}
              addMarketingProductItem={addMarketingProductItem}
              updateMarketingProductItem={updateMarketingProductItem}
              deleteMarketingProductItem={deleteMarketingProductItem}
              isSalesPromotionSelected={isSalesPromotionSelected}
              setIsSalesPromotionSelected={setIsSalesPromotionSelected}
              salesPromotionItems={salesPromotionItems}
              addSalesPromotionRow={addSalesPromotionRow}
              updateSalesPromotionRow={updateSalesPromotionRow}
              deleteSalesPromotionRow={deleteSalesPromotionRow}
              promotionalMaterialsByCategory={fetchedMaterialsByCategory}
              targetSales={(() => {
                let total = 0;
                if (
                  selectedWorkTypes.includes("จัดกิจกรรมส่งเสริมการขายหน้าร้าน")
                ) {
                  total +=
                    typeForms.type9.type9ProductItems.length > 0
                      ? typeForms.type9.type9ProductItems.reduce(
                          (sum, item) =>
                            sum +
                            (item.quantityCases || 0) *
                              (item.pricePerCase || 0),
                          0,
                        )
                      : Number(typeForms.type9.type9Sales) || 0;
                }
                if (
                  selectedWorkTypes.includes(
                    "จัดงานแปลงใหญ่/วันถ่ายทอดเทคโนโลยี",
                  )
                ) {
                  total += Number(typeForms.type10.type10BookingSales) || 0;
                }
                if (selectedWorkTypes.includes("เจรจาซื้อขาย (ปิดการขาย)")) {
                  total += typeForms.type3.type3Items.reduce((sum, item) => {
                    const linesTotal =
                      item.products && item.products.length > 0
                        ? item.products.reduce(
                            (pSum, p) =>
                              pSum +
                              (p.quantity || 0) *
                                (p.unitPrice ?? p.price ?? p.masterPrice ?? 0),
                            0,
                          )
                        : (item.quantity || 0) *
                          (item.unitPrice ?? item.price ?? item.masterPrice ?? 0);
                    return sum + linesTotal;
                  }, 0);
                }
                return total;
              })()}
            />

            {/* SECTION 6: Notes */}
            <PlanNotesCard
              readonly={readonly}
              notes={notes}
              setNotes={setNotes}
            />

            {/* SECTION 7: Actual Results (Unplanned Activity) */}
            {selectedWorkTypes.length > 0 && (
              <div className="space-y-6 pt-6 border-t border-slate-200">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-lg">
                  <BarChart3 className="w-5 h-5" />
                  <span>ผลการปฏิบัติงานจริง (Actual Results)</span>
                </div>
                <ActivityResultSection
                  planType="UNPLANNED"
                  isTypeVisible={(codeOrTitle: string) => {
                    const targetCode = getWorkTypeCode(codeOrTitle);
                    if (!targetCode) return false;
                    return selectedWorkTypes.some((wt) => {
                      const code = getWorkTypeCode(wt);
                      return code === targetCode;
                    });
                  }}
                  targets={initialTargets}
                  products={productsList}
                  customers={customersList}
                  planProvince={province}
                  typeHooks={actualOrchestrator.typeHooks}
                />
                <ActivityStatusSection
                  activityResultStatus={statusState.activityResultStatus}
                  setActivityResultStatus={statusState.setActivityResultStatus}
                  cancelReason={statusState.cancelReason}
                  setCancelReason={statusState.setCancelReason}
                  postponedDate={statusState.postponedDate}
                  setPostponedDate={statusState.setPostponedDate}
                  postponedTime={statusState.postponedTime}
                  setPostponedTime={statusState.setPostponedTime}
                  postponedReason={statusState.postponedReason}
                  setPostponedReason={statusState.setPostponedReason}
                  postponedNotes={statusState.postponedNotes}
                  setPostponedNotes={statusState.setPostponedNotes}
                />
              </div>
            )}

            {/* SECTION 8: Action Buttons */}
            <FormActionButtons
              onCancel={onCancel}
              loading={loading}
              submitLabel={submitLabel}
              readonly={readonly}
            />
          </form>
        </div>
      </Card>
    </section>
  );
}

export default UnplannedActivityForm;
