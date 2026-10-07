"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { getActivityPlanAction } from "@/modules/activity-plans/server/actions";
import { getWorkTypeCode } from "@/modules/activity-plans/constants";
import { listProductsAction } from "@/modules/products/server/actions";
import { getCustomersAction } from "@/modules/customers/server/actions";
import type { PlanSummaryData, ActualTargetsState } from "../types";
import { extractPlanData, parseResultSummary } from "../utils";
import { initialTargets, initialPlanSummary } from "../constants";

interface UseActualPlanLoaderProps {
  id?: string;
}

export function useActualPlanLoader({ id }: UseActualPlanLoaderProps) {
  const { data: session, status: sessionStatus } = useSession();
  const hasLoadedRef = useRef<string | null>(null);

  const [loadingPlan, setLoadingPlan] = useState(!!id);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unauthorizedError, setUnauthorizedError] = useState<string | null>(null);
  const [planStatus, setPlanStatus] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [plan, setPlan] = useState<any | null>(null);
  const [planSummary, setPlanSummary] = useState<PlanSummaryData>(initialPlanSummary);
  const [planWorkTypes, setPlanWorkTypes] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [targets, setTargets] = useState<ActualTargetsState>(initialTargets);
  const [extractedData, setExtractedData] = useState<ReturnType<typeof extractPlanData> | null>(null);
  const [parsedResult, setParsedResult] = useState<ReturnType<typeof parseResultSummary> | null>(null);

  // Load products & customers master list once
  useEffect(() => {
    listProductsAction({ status: "ACTIVE", perPage: 1000 })
      .then((res: any) => {
        if (res?.success && res?.data) {
          setProducts(res.data);
        } else if (res?.products) {
          setProducts(res.products);
        }
      })
      .catch(() => {});

    getCustomersAction({ perPage: 1000 })
      .then((res: any) => {
        if (res?.success && res?.customers) {
          setCustomers(res.customers);
        } else if (res?.customers) {
          setCustomers(res.customers);
        }
      })
      .catch(() => {});
  }, []);

  // Load plan details if ID passed
  useEffect(() => {
    if (!id) return;
    if (sessionStatus === "loading") return;
    if (hasLoadedRef.current === id) return;

    async function loadData() {
      try {
        if (!hasLoadedRef.current) {
          setLoadingPlan(true);
        } else {
          setIsRefreshing(true);
        }
        const res = await getActivityPlanAction(id!);
        if (!res.success || !res.plan) {
          setFormError(res.error || "ไม่สามารถโหลดข้อมูลแผนงานกิจกรรมได้");
          setLoadingPlan(false);
          setIsRefreshing(false);
          return;
        }
        hasLoadedRef.current = id!;
        const p = res.plan;
        setPlan(p);

        // Check Creator ownership: Helper is NOT allowed to record actual results
        const roles = (session?.user as any)?.roles ?? [];
        const isSuperAdmin =
          roles.includes("administrator") ||
          roles.includes("admin") ||
          roles.includes("ceo") ||
          (session?.user as any)?.role === "administrator" ||
          (session?.user as any)?.role === "ADMIN";

        const currentUserId = session?.user?.id;
        const currentUserEmployeeId = session?.user?.employeeId;
        const isCreator =
          isSuperAdmin ||
          (currentUserEmployeeId && p.employeeId === currentUserEmployeeId) ||
          (currentUserId && p.createdById === currentUserId);

        if (!isCreator) {
          setUnauthorizedError(
            "คุณไม่มีสิทธิ์บันทึกผลการปฏิบัติงานจริง — สิทธิ์การบันทึกผลเป็นของเจ้าของแผนงาน (Creator) เท่านั้น ผู้ช่วยงาน (Helper) ไม่สามารถบันทึกผลแทนได้",
          );
          setLoadingPlan(false);
          return;
        }

        setPlanStatus(p.status);

        const extracted = extractPlanData(p, initialTargets);
        setExtractedData(extracted);
        setPlanSummary(extracted.planSummary);
        setPlanWorkTypes(extracted.resolvedWorkTypes);
        setTargets(extracted.targets);

        if ((p as any).result) {
          const parsed = parseResultSummary((p as any).result);
          setParsedResult(parsed);
        }
      } catch (e: any) {
        console.error("Failed to load plan for actual record", e);
        setFormError(e?.message || "เกิดข้อผิดพลาดในการโหลดข้อมูลแผนงาน");
      } finally {
        setLoadingPlan(false);
        setIsRefreshing(false);
      }
    }

    loadData();
  }, [id, sessionStatus, session?.user?.id]);

  const isTypeVisible = useCallback(
    (typeTitleOrCode: string) => {
      if (loadingPlan) return false;
      const targetCode = getWorkTypeCode(typeTitleOrCode);
      if (!targetCode) return false;

      return planWorkTypes.some((t) => {
        const code = getWorkTypeCode(t);
        return code === targetCode;
      });
    },
    [loadingPlan, planWorkTypes],
  );

  return {
    session,
    sessionStatus,
    loadingPlan,
    isRefreshing,
    unauthorizedError,
    planStatus,
    formError,
    setFormError,
    plan,
    planSummary,
    planWorkTypes,
    products,
    customers,
    targets,
    extractedData,
    parsedResult,
    isTypeVisible,
    hasLoadedRef,
  };
}
