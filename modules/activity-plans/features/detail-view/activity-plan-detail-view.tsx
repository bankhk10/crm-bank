"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  Loader2,
  AlertCircle,
  Building2,
  Store as StoreIcon,
  Package,
  Tag,
  Users,
  DollarSign,
  History,
  Clock,
  Target,
  Layers,
  Calendar,
  MapPin,
  User,
  FileText,
  Gift,
  Boxes,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ActivityPlanWithRelations } from "../../types";
import {
  getActivityPlanAction,
  getDemoPlotHistoryAction,
} from "../../server/actions";
import { getWorkTypeName, getWorkTypeCode } from "../../constants";
import type { PlanSummaryData, ActualTargetsState } from "../actual-view/types";
import { extractPlanData, parseResultSummary } from "../actual-view/utils";
import type { ParsedSummaryValues } from "../actual-view/utils/summary-parser";
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
  t1: { customer: "", topic: "", detail: "", opportunity: "", nextDate: "" },
  t2: { product: "", customer: "", detail: "", expectedResult: "", items: [] },
  t3: { product: "", customer: "", targetQty: "", targetSales: "", items: [] },
  t4: { customer: "", orderNo: "", targetCollect: "", items: [] },
  t5: { store: "", product: "", detail: "", items: [] },
  t6: { customer: "", issueType: "", detail: "", targetStatus: "", items: [] },
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
  t8: { topic: "", products: "", targetAttendees: "" },
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
  t11: { store: "", detail: "", targetOpportunity: "" },
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
  const [planSummary, setPlanSummary] =
    useState<PlanSummaryData>(initialPlanSummary);
  const [planWorkTypes, setPlanWorkTypes] = useState<string[]>([]);
  const [targets, setTargets] = useState<ActualTargetsState>(initialTargets);
  const [parsedResults, setParsedResults] = useState<ParsedSummaryValues>({});

  // Type 7 Demo Plot state
  const [t7DemoPlotData, setT7DemoPlotData] = useState<any>(null);
  const [t7VisitHistory, setT7VisitHistory] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getActivityPlanAction(id);
      if (res.success && res.plan) {
        const p = res.plan as ActivityPlanWithRelations;
        setPlan(p);

        // Extract data
        const extracted = extractPlanData(p, initialTargets);
        setPlanSummary(extracted.planSummary);
        setPlanWorkTypes(extracted.resolvedWorkTypes);
        setTargets(extracted.targets);

        // Parse result summary if plan result exists in DB
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
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      (wt) =>
        wt.activityType?.code === "TYPE_12" ||
        wt.activityType?.name === "ทัวร์",
    ) ||
    planWorkTypes.includes("ทัวร์"),
  );

  const tourData = plan.tour;
  const item0 = (plan.items?.[0] || {}) as Record<string, any>;
  const tourType =
    tourData?.tourType ??
    (item0.visitTopic === "ทัวร์ร้านค้า" ? "STORE" : "CENTRAL");
  const tourSize = tourData?.tourSize ?? item0.tourSize ?? null;
  const tourCountry =
    tourData?.country ?? item0.country ?? item0.detail ?? null;
  const tourStoreName =
    tourData?.store?.name ?? item0.customerName ?? item0.store ?? null;
  const tourDestination =
    tourData?.destination ??
    item0.destination ??
    item0.location ??
    item0.detail ??
    null;

  // Check if plan contains any actual work types (Types 1 - 11)
  const hasActualWorkTypes = planWorkTypes.some((wt) => wt !== "ทัวร์");
  const isTourOnly = isTourPlan && !hasActualWorkTypes;

  // Check if plan has recorded actual result in database (Normalized Relation)
  const hasActualResult = Boolean((plan as any)?.result != null);

  // 1. Resolve Work Types from Normalized Relation
  const resolvedWorkTypes =
    plan.workTypes && plan.workTypes.length > 0
      ? plan.workTypes.map((wt) => ({
          code: wt.activityType?.code || "TYPE_1",
          name:
            wt.activityType?.name ||
            wt.activityType?.shortName ||
            "เข้าพบร้านค้า / Key Farmer",
        }))
      : plan.activityType
        ? [{ code: plan.activityType.code, name: plan.activityType.name }]
        : planWorkTypes.map((t) => ({ code: getWorkTypeCode(t), name: t }));

  // 2. Resolve Stores from Normalized Relation
  const normalizedStores =
    plan.stores && plan.stores.length > 0
      ? plan.stores.map((s) => ({
          id: s.id,
          name: s.store?.name || s.storeName || "ไม่ระบุชื่อร้านค้า",
          code: s.store?.customerCode || null,
          location:
            [
              s.store?.district ? `อ.${s.store.district}` : "",
              s.store?.province ? `จ.${s.store.province}` : "",
            ]
              .filter(Boolean)
              .join(" ") || null,
          workTypeCode: s.workTypeCode,
          workTypeName: getWorkTypeName(s.workTypeCode),
          remarks: s.remarks,
        }))
      : [];

  const allStoreNames = new Set(normalizedStores.map((s) => s.name));
  const additionalStores: Array<{
    id?: string;
    name: string;
    code: string | null;
    location: string | null;
    workTypeName: string;
    remarks: string | null;
  }> = [];

  if (plan.tour?.store && !allStoreNames.has(plan.tour.store.name)) {
    allStoreNames.add(plan.tour.store.name);
    additionalStores.push({
      id: plan.tour.store.id,
      name: plan.tour.store.name,
      code: plan.tour.store.customerCode || null,
      location: plan.tour.store.province
        ? `จ.${plan.tour.store.province}`
        : null,
      workTypeName: "ทัวร์ร้านค้า",
      remarks: null,
    });
  }

  if (normalizedStores.length === 0 && plan.items && plan.items.length > 0) {
    for (const item of plan.items) {
      const storeName = item.customerName || item.surveyStoreName;
      if (storeName && !allStoreNames.has(storeName)) {
        allStoreNames.add(storeName);
        additionalStores.push({
          id: item.id,
          name: storeName,
          code: null,
          location: null,
          workTypeName: item.workTypeCode
            ? getWorkTypeName(item.workTypeCode)
            : "ร้านค้าเป้าหมาย",
          remarks: item.detail || null,
        });
      }
    }
  }

  const combinedStores = [...normalizedStores, ...additionalStores];

  // 3. Resolve Products from Normalized Relation
  const normalizedProducts =
    plan.products && plan.products.length > 0
      ? plan.products.map((p) => ({
          id: p.id,
          name: p.product?.name || p.productName || "ไม่ระบุชื่อสินค้า",
          code: p.product?.productCode || null,
          storeName: p.store?.name || null,
          storeCode: p.store?.customerCode || null,
          workTypeCode: p.workTypeCode,
          workTypeName: getWorkTypeName(p.workTypeCode),
          targetQuantity: p.targetQuantity,
          unitPrice: p.unitPrice
            ? Number(p.unitPrice)
            : p.product?.price
              ? Number(p.product.price)
              : null,
          targetAmount: p.targetAmount ? Number(p.targetAmount) : null,
        }))
      : [];

  const additionalProducts: Array<{
    id?: string;
    name: string;
    code: string | null;
    storeName: string | null;
    workTypeName: string;
    targetQuantity: number | null;
    unitPrice: number | null;
    targetAmount: number | null;
  }> = [];

  if (normalizedProducts.length === 0 && plan.items && plan.items.length > 0) {
    for (const item of plan.items) {
      const prodName =
        item.saleProductName ||
        item.plotProductName ||
        item.followupProductName ||
        item.storeProductName;
      if (prodName) {
        additionalProducts.push({
          id: item.id,
          name: prodName,
          code: null,
          storeName: item.customerName || null,
          workTypeName: item.workTypeCode
            ? getWorkTypeName(item.workTypeCode)
            : "สินค้าเป้าหมาย",
          targetQuantity: item.saleQuantity || item.storeQuantityCases || null,
          unitPrice: item.saleUnitPrice
            ? Number(item.saleUnitPrice)
            : item.storePricePerCase
              ? Number(item.storePricePerCase)
              : null,
          targetAmount: item.saleTotalPrice
            ? Number(item.saleTotalPrice)
            : item.storeTotalAmount
              ? Number(item.storeTotalAmount)
              : null,
        });
      }
    }
  }

  const combinedProducts = [...normalizedProducts, ...additionalProducts];

  // 4. Budget calculations
  const start = new Date(plan.startDate);
  const end = new Date(plan.endDate);
  const salesPromo = plan.salesPromotionBudgetRequested
    ? Number(plan.salesPromotionBudgetRequested)
    : 0;
  const marketing = plan.marketingBudgetRequested
    ? Number(plan.marketingBudgetRequested)
    : 0;
  const budgetTotal = salesPromo + marketing;

  return (
    <section className="space-y-6 container mx-auto px-0 sm:px-0">
      <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 space-y-6 shadow-xs">
        {/* 1. TOP HEADER (READ-ONLY) */}
        <DetailViewHeader
          title="รายละเอียดแผนงาน ( Trip Plan Detail )"
          subtitle="ข้อมูลแผนงานและรายละเอียดกิจกรรม"
          planNo={plan.code || planSummary.planNo}
          status={plan.status}
          onBack={handleBack}
          backButtonLabel="กลับหน้ารายการแผนงาน"
        />

        {/* 2. GENERAL PLAN INFORMATION (READ-ONLY) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm sm:text-base text-slate-900">
                ข้อมูลแผนงาน (Activity Plan Overview)
              </h4>
              <p className="text-xs text-slate-500 font-medium">
                รายละเอียดทั่วไปและเป้าหมายของแผนงาน
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ชื่อกิจกรรม */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3.5 space-y-1 md:col-span-2">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                ชื่อแผนงาน / กิจกรรม
              </span>
              <span className="text-sm sm:text-base font-bold text-slate-900 block leading-snug">
                {plan.title}
              </span>
            </div>

            {/* ผู้จัดทำแผน */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3.5 space-y-1">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                ผู้จัดทำแผน
              </span>
              <span className="text-sm font-bold text-slate-900 block">
                {plan.employee.name}
              </span>
            </div>

            {/* ประเภทงาน (Normalized Relation) */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3.5 space-y-1.5">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-500" />
                ประเภทงานที่ระบุ
              </span>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {resolvedWorkTypes.length > 0 ? (
                  resolvedWorkTypes.map((wt, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className={cn(
                        "text-xs px-2.5 py-1 font-semibold rounded-lg border shadow-2xs",
                        wt.code === "TYPE_12"
                          ? "bg-sky-50 text-sky-800 border-sky-200"
                          : "bg-indigo-50 text-indigo-800 border-indigo-200",
                      )}
                    >
                      {wt.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">-</span>
                )}
              </div>
            </div>

            {/* วันที่และเวลาจัดงาน */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3.5 space-y-1">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                ช่วงวันเวลาจัดงาน ({plan.durationDays} วัน)
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                {format(start, "dd MMM yyyy", { locale: th })}{" "}
                {format(start, "HH:mm")} น.
                {" — "}
                {format(end, "dd MMM yyyy", { locale: th })}{" "}
                {format(end, "HH:mm")} น.
              </span>
            </div>

            {/* สถานที่ */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3.5 space-y-1">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                สถานที่จัดงาน
              </span>
              <span
                className="text-xs sm:text-sm font-bold text-slate-800 block truncate"
                title={plan.location || undefined}
              >
                {plan.location || "-"}
              </span>
            </div>
          </div>
        </div>

        {/* 3. TYPE_12: TOUR SECTION (IF APPLICABLE) */}
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

        {/* 4. RELATED STORES SECTION (NORMALIZED) */}
        {combinedStores.length > 0 && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                  <StoreIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-slate-900">
                    ร้านค้า / ลูกค้าที่เกี่ยวข้อง ({combinedStores.length}{" "}
                    รายการ)
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    รายชื่อร้านค้าหรือลูกค้าเป้าหมายสำหรับแผนงานนี้
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="text-xs font-semibold bg-amber-50 text-amber-800 border-amber-200"
              >
                {combinedStores.length} ร้านค้า
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {combinedStores.map((st, idx) => (
                <div
                  key={st.id || idx}
                  className="bg-slate-50/80 border border-slate-100 rounded-xl p-3.5 flex flex-col justify-between gap-2 hover:border-amber-200 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">{st.name}</span>
                      </span>
                      {st.code && (
                        <span className="font-mono text-[10px] bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded shrink-0">
                          {st.code}
                        </span>
                      )}
                    </div>
                    {st.location && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{st.location}</span>
                      </div>
                    )}
                    {st.remarks && (
                      <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-100 mt-1 italic">
                        &quot;{st.remarks}&quot;
                      </div>
                    )}
                  </div>
                  <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">ประเภท:</span>
                    <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                      {st.workTypeName}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. RELATED PRODUCTS SECTION (NORMALIZED) */}
        {combinedProducts.length > 0 && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-slate-900">
                    สินค้า / รายการเป้าหมาย ({combinedProducts.length} รายการ)
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    รายการสินค้าที่วางแผนเสนอขาย แนะนำ หรือตรวจสต็อก
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="text-xs font-semibold bg-teal-50 text-teal-800 border-teal-200"
              >
                {combinedProducts.length} สินค้า
              </Badge>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b">
                  <tr>
                    <th className="p-3">สินค้า</th>
                    <th className="p-3">ร้านค้าเป้าหมาย</th>
                    <th className="p-3 text-center">ประเภทงาน</th>
                    <th className="p-3 text-right">จำนวนเป้าหมาย</th>
                    <th className="p-3 text-right">ราคาต่อหน่วย</th>
                    <th className="p-3 text-right">ยอดเงินเป้าหมาย</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {combinedProducts.map((p, idx) => (
                    <tr key={p.id || idx} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3 h-3 text-teal-500 shrink-0" />
                          <span>{p.name}</span>
                        </div>
                        {p.code && (
                          <span className="font-mono text-[10px] text-slate-400 block pl-4.5">
                            {p.code}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-600">
                        {p.storeName || "-"}
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-slate-50 text-slate-700"
                        >
                          {p.workTypeName}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-medium text-slate-800">
                        {p.targetQuantity != null
                          ? p.targetQuantity.toLocaleString()
                          : "-"}
                      </td>
                      <td className="p-3 text-right text-slate-600">
                        {p.unitPrice != null
                          ? `${p.unitPrice.toLocaleString()} ฿`
                          : "-"}
                      </td>
                      <td className="p-3 text-right font-bold text-teal-700">
                        {p.targetAmount != null
                          ? `${p.targetAmount.toLocaleString()} ฿`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. BUDGET & EXPENSES SECTION */}
        <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/60 rounded-2xl border border-blue-100 p-4 sm:p-5 space-y-3.5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-blue-200/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm sm:text-base text-blue-950">
                  งบประมาณที่ขออนุมัติ
                </h4>
                <p className="text-xs text-blue-800 font-medium">
                  การจัดสรรงบส่งเสริมการขายและการตลาด
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">ยอดขอใช้รวม</span>
              <span className="text-base sm:text-lg font-black text-blue-700">
                {budgetTotal.toLocaleString()} ฿
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-white p-3.5 rounded-xl border border-blue-100 flex justify-between items-center shadow-2xs">
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-700 block">
                  งบส่งเสริมการขาย (Sales Promotion)
                </span>
                <span className="text-[11px] text-slate-400">
                  สำหรับจัดโปรโมชั่นและส่วนลด
                </span>
              </div>
              <span className="text-sm font-bold text-blue-700">
                {salesPromo > 0 ? `${salesPromo.toLocaleString()} ฿` : "-"}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-blue-100 flex justify-between items-center shadow-2xs">
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-700 block">
                  งบการตลาด (Marketing Expense)
                </span>
                <span className="text-[11px] text-slate-400">
                  สำหรับสื่อ ป้าย และกิจกรรม
                </span>
              </div>
              <span className="text-sm font-bold text-purple-700">
                {marketing > 0 ? `${marketing.toLocaleString()} ฿` : "-"}
              </span>
            </div>
          </div>
        </div>

        {/* 7. PROMOTIONAL MATERIALS & SALES PROMOTIONS SECTION */}
        {(planSummary.isPromotionalMediaSelected ||
          planSummary.isSalesPromotionSelected ||
          (planSummary.requisitionItems &&
            planSummary.requisitionItems.length > 0)) && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100">
                <Gift className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm sm:text-base text-slate-900">
                  สื่อและรายการส่งเสริมการขาย
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  รายการสื่อสิ่งพิมพ์และของแถมที่ขอเบิกใช้งาน
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {planSummary.marketingProductItems &&
                planSummary.marketingProductItems.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Boxes className="w-3.5 h-3.5 text-blue-600" />
                      สื่อส่งเสริมการขาย (
                      {planSummary.marketingProductItems.length} รายการ)
                    </span>
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b">
                          <tr>
                            <th className="p-2.5">รายการสื่อ</th>
                            <th className="p-2.5 text-right">จำนวน</th>
                            <th className="p-2.5 text-right">ราคา/หน่วย</th>
                            <th className="p-2.5 text-right">รวมเงิน</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {planSummary.marketingProductItems.map(
                            (mItem, idx) => (
                              <tr key={idx}>
                                <td className="p-2.5 font-semibold text-slate-900">
                                  {mItem.productName}
                                </td>
                                <td className="p-2.5 text-right">
                                  {mItem.quantityCases} ชิ้น
                                </td>
                                <td className="p-2.5 text-right text-slate-600">
                                  {mItem.pricePerCase
                                    ? `${mItem.pricePerCase.toLocaleString()} ฿`
                                    : "-"}
                                </td>
                                <td className="p-2.5 text-right font-bold text-blue-700">
                                  {(
                                    (mItem.quantityCases || 0) *
                                    (mItem.pricePerCase || 0)
                                  ).toLocaleString()}{" "}
                                  ฿
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              {planSummary.salesPromotionItems &&
                planSummary.salesPromotionItems.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5 text-emerald-600" />
                      รายการส่งเสริมการขาย (
                      {planSummary.salesPromotionItems.length} รายการ)
                    </span>
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b">
                          <tr>
                            <th className="p-2.5">ประเภทรอบงบ</th>
                            <th className="p-2.5">รายละเอียดโปรโมชั่น</th>
                            <th className="p-2.5 text-right">ยอดเงินที่ขอ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {planSummary.salesPromotionItems.map(
                            (spItem, idx) => (
                              <tr key={idx}>
                                <td className="p-2.5 font-medium text-slate-600">
                                  {spItem.budgetType}
                                </td>
                                <td className="p-2.5 text-slate-800">
                                  {spItem.detail || "-"}
                                </td>
                                <td className="p-2.5 text-right font-bold text-emerald-700">
                                  {spItem.amount != null
                                    ? `${spItem.amount.toLocaleString()} ฿`
                                    : "-"}
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* 8. HELPERS SECTION (NORMALIZED) */}
        {plan.helpers && plan.helpers.length > 0 && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-slate-900">
                    พนักงานช่วยงาน ({plan.helpers.length} คน)
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    รายชื่อเพื่อนร่วมงานที่ขอตัวไปช่วยปฏิบัติงาน
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="text-xs font-semibold bg-purple-50 text-purple-800 border-purple-200"
              >
                {plan.helpers.length} คน
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {plan.helpers.map((h, idx) => (
                <div
                  key={h.id || idx}
                  className="bg-slate-50/80 border border-slate-100 rounded-xl p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {idx + 1}. {h.employee?.name || "พนักงาน"}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {h.employee?.positionTitle ||
                        h.employee?.position?.name ||
                        "-"}{" "}
                      •{" "}
                      {h.departmentName ||
                        h.employee?.departmentName ||
                        h.employee?.department?.name ||
                        "ไม่ระบุแผนก"}
                    </div>
                    {h.rejectionReason && (
                      <div className="text-[10px] text-red-600 mt-1 italic">
                        เหตุผลปฏิเสธ: {h.rejectionReason}
                      </div>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 shrink-0 rounded-full",
                      h.status === "APPROVED" &&
                        "border-emerald-200 text-emerald-700 bg-emerald-50",
                      h.status === "REJECTED" &&
                        "border-red-200 text-red-700 bg-red-50",
                      h.status === "PENDING" &&
                        "border-amber-200 text-amber-700 bg-amber-50",
                    )}
                  >
                    {h.status === "APPROVED"
                      ? "อนุมัติแล้ว"
                      : h.status === "REJECTED"
                        ? "ปฏิเสธ"
                        : "รออนุมัติ"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* หมายเหตุเพิ่มเติม */}
        {plan.notes && (
          <div className="pt-2 border-t border-slate-100">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <FileText className="h-3.5 w-3.5 text-slate-600" />
              หมายเหตุเพิ่มเติม
            </h5>
            <p className="text-xs sm:text-sm text-slate-600 bg-slate-50/60 p-3 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-line">
              {plan.notes}
            </p>
          </div>
        )}

        {/* 9. APPROVAL AUDIT LOGS */}
        {plan.approvalLogs && plan.approvalLogs.length > 0 && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <History className="h-4 w-4 text-slate-500" />
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                ประวัติการดำเนินการ (Approval Audit Logs)
              </h4>
            </div>

            <div className="space-y-2">
              {plan.approvalLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {log.user?.name || "ผู้ใช้งาน"}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {log.action}
                      </Badge>
                    </div>
                    {log.comment && (
                      <div className="text-slate-600 text-xs italic bg-white p-1.5 rounded border border-slate-100 mt-1">
                        &quot;{log.comment}&quot;
                      </div>
                    )}
                  </div>
                  <div className="text-slate-400 text-[11px] whitespace-nowrap flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>
                      {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm", {
                        locale: th,
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 10. SECTION: ผลการปฏิบัติงานตามประเภทงาน (WORK TYPES 1 - 11) (READ-ONLY) - Only displayed when Actual Result exists in DB */}
        {hasActualResult && !isTourOnly && (
          <DetailActivityResultSection
            isTypeVisible={isTypeVisible}
            targets={targets}
            parsedResults={parsedResults}
            demoPlotData={t7DemoPlotData}
            visitHistory={t7VisitHistory}
          />
        )}

        {/* 11. SECTION: สถานะผลการทำกิจกรรม (READ-ONLY) - Only displayed when Actual Result exists in DB */}
        {hasActualResult &&
          !isTourOnly &&
          parsedResults.activityResultStatus && (
            <DetailActivityStatusSection
              activityResultStatus={parsedResults.activityResultStatus}
              cancelReason={parsedResults.cancelReason}
              postponedDate={parsedResults.postponedDate}
              postponedTime={parsedResults.postponedTime}
              postponedReason={parsedResults.postponedReason}
              postponedNotes={parsedResults.postponedNotes}
            />
          )}

        {/* 12. BOTTOM ACTIONS (READ-ONLY DETAIL VIEW) */}
        <DetailViewActions
          onBack={handleBack}
          backLabel="กลับหน้ารายการแผนงาน"
        />
      </div>
    </section>
  );
}
