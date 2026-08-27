"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ActivityPlanWithRelations } from "../../types";
import {
  getActivityPlanAction,
  getDemoPlotHistoryAction,
} from "../../server/actions";
import type {
  PlanSummaryData,
  ActualTargetsState,
} from "../actual-view/types";
import {
  extractPlanData,
  parseResultSummary,
} from "../actual-view/utils";
import type { ParsedSummaryValues } from "../actual-view/utils/summary-parser";
import { ActualPlanSummary } from "../actual-view/components/actual-plan-summary";
import {
  DetailViewHeader,
  DetailActivityResultSection,
  DetailActivityStatusSection,
  DetailViewActions,
  DetailType12Tour,
} from "./components";

interface ActivityPlanDetailViewProps {
  id: string;
  onBack?: () => void;
}

const initialTargets: ActualTargetsState = {
  t1: {
    customer: "",
    topic: "",
    detail: "",
    opportunity: "",
    nextDate: "",
  },
  t2: {
    product: "",
    customer: "",
    detail: "",
    expectedResult: "",
    items: [],
  },
  t3: {
    product: "",
    customer: "",
    targetQty: "",
    targetSales: "",
    items: [],
  },
  t4: {
    customer: "",
    orderNo: "",
    targetCollect: "",
    items: [],
  },
  t5: {
    store: "",
    product: "",
    detail: "",
    items: [],
  },
  t6: {
    customer: "",
    issueType: "",
    detail: "",
    targetStatus: "",
    items: [],
  },
  t7: {
    owner: "",
    product: "",
    crop: "",
    plots: "",
    demoProductQuantity: "",
    objective: "",
    experimentDetail: "",
    detail: "",
    targetCondition: "",
    items: [],
  },
  t8: {
    topic: "",
    products: "",
    targetAttendees: "",
  },
  t9: {
    store: "",
    isSubDealer: false,
    subDealerStore: "",
    product: "",
    targetSales: "",
    targetAttendees: "",
    items: [],
  },
  t10: {
    plot: "",
    location: "",
    showcase: "",
    targetAttendees: "",
    targetSales: "",
  },
  t11: {
    store: "",
    detail: "",
    targetOpportunity: "",
  },
};

const initialPlanSummary: PlanSummaryData = {
  planNo: "",
  title: "",
  startDateStr: "",
  endDateStr: "",
  startTimeStr: "",
  endTimeStr: "",
  timeStr: "",
  locationStr: "",
  location: undefined,
  province: undefined,
  district: undefined,
  marketingBudget: undefined,
  salesPromotionBudget: undefined,
  extraExpenseAmount: undefined,
  extraExpenseDetail: "",
  targetSales: undefined,
  isPromotionalMediaSelected: false,
  marketingProductItems: [],
  isSalesPromotionSelected: false,
  salesPromotionItems: [],
  requisitionItems: [],
  objective: undefined,
  notes: undefined,
  helpers: undefined,
  helperEmployeeNames: undefined,
};

export default function ActivityPlanDetailView({
  id,
  onBack,
}: ActivityPlanDetailViewProps) {
  const router = useRouter();
  const [plan, setPlan] = useState<ActivityPlanWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extracted Plan Summary & Targets
  const [planSummary, setPlanSummary] = useState<PlanSummaryData>(initialPlanSummary);
  const [planWorkTypes, setPlanWorkTypes] = useState<string[]>([]);
  const [targets, setTargets] = useState<ActualTargetsState>(initialTargets);
  const [parsedResults, setParsedResults] = useState<ParsedSummaryValues>({});

  // Type 7 Demo Plot state
  const [t7DemoPlotData, setT7DemoPlotData] = useState<any>(null);
  const [t7VisitHistory, setT7VisitHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const res = await getActivityPlanAction(id);
        if (res.success && res.plan) {
          const p = res.plan;
          setPlan(p);

          // Extract data
          const extracted = extractPlanData(p, initialTargets);
          setPlanSummary(extracted.planSummary);
          setPlanWorkTypes(extracted.resolvedWorkTypes);
          setTargets(extracted.targets);

          // Parse result summary if plan result exists
          if ((p as any).result) {
            const parsed = parseResultSummary((p as any).result);
            setParsedResults(parsed);
          }

          // Fetch demo plot history if applicable
          if (extracted.t7PlotIdentifier) {
            getDemoPlotHistoryAction(extracted.t7PlotIdentifier)
              .then((histRes) => {
                if (histRes.success && histRes.plot) {
                  setT7DemoPlotData(histRes.plot);
                  setT7VisitHistory(histRes.plot.visits || []);
                }
              })
              .catch((e) => {
                console.error("Failed to load demo plot history:", e);
              });
          }
        } else {
          setError(res.error || "ไม่สามารถดึงข้อมูลรายละเอียด Trip Plan ได้");
        }
      } catch (err: any) {
        setError(err.message || "เกิดข้อผิดพลาดในการโหลดรายละเอียด Trip Plan");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push("/activity-plans");
    }
  };

  const isTypeVisible = (typeTitle: string) => {
    if (planWorkTypes.length > 0) {
      return planWorkTypes.includes(typeTitle);
    }
    return true;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium">กำลังโหลดข้อมูล Trip Plan...</p>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "ไม่พบข้อมูล Trip Plan"}
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={handleBack}>
          กลับหน้ารายการแผนงาน
        </Button>
      </div>
    );
  }

  // Tour (TYPE_12) resolution directly from Normalized Source of Truth
  const isTourPlan = Boolean(
    plan.tour ||
    plan.activityType?.code === "TYPE_12" ||
    plan.activityType?.name === "ทัวร์" ||
    plan.workTypes?.some(
      (wt) => wt.activityType?.code === "TYPE_12" || wt.activityType?.name === "ทัวร์"
    ) ||
    planWorkTypes.includes("ทัวร์")
  );

  const tourData = plan.tour;
  const item0 = (plan.items?.[0] || {}) as Record<string, any>;
  const tourType = tourData?.tourType ?? (item0.visitTopic === "ทัวร์ร้านค้า" ? "STORE" : "CENTRAL");
  const tourSize = tourData?.tourSize ?? item0.tourSize ?? null;
  const tourCountry = tourData?.country ?? item0.country ?? item0.detail ?? null;
  const tourStoreName = tourData?.store?.name ?? item0.customerName ?? item0.store ?? null;
  const tourDestination = tourData?.destination ?? item0.destination ?? item0.location ?? item0.detail ?? null;

  // Check if plan contains any actual work types (Types 1 - 11)
  const hasActualWorkTypes = planWorkTypes.some((wt) => wt !== "ทัวร์");
  const isTourOnly = isTourPlan && !hasActualWorkTypes;

  return (
    <section className="space-y-6 container mx-auto px-0 sm:px-0">
      <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 space-y-6 shadow-xs">
        {/* 1. TOP HEADER (READ-ONLY) */}
        <DetailViewHeader
          planNo={planSummary.planNo}
          status={plan.status}
          onBack={handleBack}
        />

        {/* 2. PLAN SUMMARY (ข้อมูลแผนงาน, งบประมาณและค่าใช้จ่าย, สื่อส่งเสริมการขาย, รายการส่งเสริมการขาย, ข้อมูลเพิ่มเติม) */}
        <ActualPlanSummary summary={planSummary} />

        {/* 3. TOUR DETAIL (TYPE_12: ทัวร์) - Normalized Relational Source of Truth */}
        {isTourPlan && (
          <DetailType12Tour
            isVisible={true}
            tourType={tourType}
            tourSize={tourSize}
            country={tourCountry}
            storeName={tourStoreName}
            destination={tourDestination}
          />
        )}

        {/* 4. SECTION: ผลการปฏิบัติงานตามประเภทงาน (WORK TYPES 1 - 11) (READ-ONLY) */}
        {!isTourOnly && (
          <DetailActivityResultSection
            isTypeVisible={isTypeVisible}
            targets={targets}
            parsedResults={parsedResults}
            demoPlotData={t7DemoPlotData}
            visitHistory={t7VisitHistory}
          />
        )}

        {/* 5. SECTION: สถานะผลการทำกิจกรรม (READ-ONLY) - Not displayed for Tour-only plans */}
        {!isTourOnly && parsedResults.activityResultStatus && (
          <DetailActivityStatusSection
            activityResultStatus={parsedResults.activityResultStatus}
            cancelReason={parsedResults.cancelReason}
            postponedDate={parsedResults.postponedDate}
            postponedTime={parsedResults.postponedTime}
            postponedReason={parsedResults.postponedReason}
            postponedNotes={parsedResults.postponedNotes}
          />
        )}

        {/* 6. BOTTOM ACTIONS (BACK ONLY) */}
        <DetailViewActions onBack={handleBack} />
      </div>
    </section>
  );
}
