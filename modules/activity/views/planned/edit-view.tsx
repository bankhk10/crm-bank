"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { PlannedActivityForm } from "./components/planned-activity-form";
import {
  getActivityPlanAction,
  updateActivityPlanAction,
  getDemoPlotsAction,
  getFollowUpPlansAction,
  getHattackFollowUpPlansAction,
  getProductCategoriesAction,
  getActivePromotionalMaterialsGroupedAction,
  getActivityTypesAction,
} from "@/modules/activity/server/actions";
import { getAllEmployeesAction } from "@/modules/employee/server/actions";
import { getCustomersAction } from "@/modules/customers/server/actions";
import { listProductsAction } from "@/modules/products/server/actions";
import { isActivityAdmin } from "@/modules/activity/domain/permissions";

interface PlannedEditViewProps {
  id: string;
}

export function PlannedEditView({ id }: PlannedEditViewProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { hasPermission, allowed, isLoading } = usePermission(
    "menu.activity_plans",
  );

  const user = session?.user;
  const isAdmin = isActivityAdmin(user);

  const canEdit =
    isAdmin ||
    hasPermission("activity.edit") ||
    hasPermission("activity.manage");
  const canView =
    isAdmin ||
    allowed ||
    hasPermission("activity.view") ||
    hasPermission("activity.manage") ||
    !isLoading;

  const [employees, setEmployees] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [productCategories, setProductCategories] = useState<any[]>([]);
  const [activityTypes, setActivityTypes] = useState<any[]>([]);
  const [demoPlots, setDemoPlots] = useState<any[]>([]);
  const [followUpPlans, setFollowUpPlans] = useState<any[]>([]);
  const [hattackFollowUpPlans, setHattackFollowUpPlans] = useState<any[]>([]);
  const [promotionalMaterialsByCategory, setPromotionalMaterialsByCategory] =
    useState<Record<string, any[]> | undefined>(undefined);
  const [initialData, setInitialData] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setPageLoading(true);
      try {
        const [
          empRes,
          planRes,
          custRes,
          prodRes,
          plotRes,
          followUpRes,
          hattackFollowUpRes,
          catRes,
          mktRes,
          actTypeRes,
        ] = await Promise.all([
          getAllEmployeesAction(),
          getActivityPlanAction(id),
          getCustomersAction({ perPage: 1000 }).catch(() => ({
            customers: [],
          })),
          listProductsAction({ status: "ACTIVE", perPage: 1000 }).catch(() => ({
            products: [],
          })),
          getDemoPlotsAction().catch(() => ({ demoPlots: [] })),
          getFollowUpPlansAction().catch(() => ({ followUpPlans: [] })),
          getHattackFollowUpPlansAction().catch(() => ({
            hattackFollowUpPlans: [],
          })),
          getProductCategoriesAction().catch(() => ({
            success: false,
            productCategories: [],
          })),
          getActivePromotionalMaterialsGroupedAction().catch(() => ({
            success: false,
            grouped: {},
          })),
          getActivityTypesAction().catch(() => ({ success: false, types: [] })),
        ]);

        if (actTypeRes && actTypeRes.success && actTypeRes.types) {
          setActivityTypes(actTypeRes.types);
        }

        if (catRes && catRes.success && catRes.productCategories) {
          setProductCategories(catRes.productCategories);
        }

        if (empRes.success && empRes.employees) {
          setEmployees(empRes.employees);
        } else if (!empRes.success) {
          setLoadError("ไม่สามารถดึงรายชื่อพนักงานได้");
        }

        if (custRes && custRes.customers) {
          setCustomers(custRes.customers);
        }

        if (prodRes && prodRes.products) {
          setProducts(prodRes.products);
        }

        if (plotRes && plotRes.demoPlots) {
          setDemoPlots(plotRes.demoPlots);
        }

        if (followUpRes && followUpRes.followUpPlans) {
          setFollowUpPlans(followUpRes.followUpPlans);
        }

        if (hattackFollowUpRes && hattackFollowUpRes.hattackFollowUpPlans) {
          setHattackFollowUpPlans(hattackFollowUpRes.hattackFollowUpPlans);
        }

        if (mktRes && mktRes.success && mktRes.grouped) {
          setPromotionalMaterialsByCategory(mktRes.grouped);
        }

        if (planRes.success && planRes.plan) {
          const plan = planRes.plan;

          const helperEmployeeIds = plan.helpers
            ? plan.helpers.map((h: any) => h.employeeId)
            : [];

          const rawType13Targets = (plan as any).type13Targets || [];
          const rawType13Products = (plan as any).type13Products || [];
          const rawType13Results = (plan as any).type13Results || [];
          const allT13Results =
            rawType13Results.length > 0
              ? rawType13Results
              : rawType13Targets.flatMap((t: any) => t.results || []);
          const allT13Attachments = [
            ...allT13Results.flatMap((r: any) => r.attachments || []),
            ...((plan.attachments || []).filter(
              (a: any) => a.workTypeCode === "TYPE_13" || a.type13ResultId,
            )),
          ];
          const allT13Rounds = allT13Results.flatMap(
            (r: any) => r.sprayRounds || [],
          );

          const mappedType13Plots = rawType13Targets.map(
            (t: any, idx: number) => {
              const plotProducts = t.products || [];
              const targetResult =
                (t.results && t.results[0]) ||
                allT13Results.find((r: any) => r.targetId === t.id) ||
                allT13Results[idx];
              const hasWithdrawal =
                t.hasProductWithdrawal !== undefined
                  ? Boolean(t.hasProductWithdrawal)
                  : plotProducts.length > 0;
              const withdrawnList = (
                t.withdrawnProducts || plotProducts
              ).map((p: any, pIdx: number) => ({
                id: p.id || `withdrawn-${idx}-${pIdx}`,
                productId: p.productId || "",
                productName: p.productName || p.product?.name || "",
                quantity: p.quantity != null ? Number(p.quantity) : 1,
                unit: p.unit || p.product?.unit || "ขวด",
              }));

              return {
                id: t.id,
                demoPlotId: t.id,
                plotIndex: t.plotIndex || idx + 1,
                name: t.plotName || t.name || `แปลงที่ ${idx + 1}`,
                plotName: t.plotName || t.name || `แปลงที่ ${idx + 1}`,
                storeId: t.storeId || t.store?.id || "",
                dealerName: t.dealerName || t.store?.name || null,
                ownerName: t.ownerName || "",
                province: t.province || t.store?.province || "",
                district: t.district || t.store?.district || "",
                subdistrict: t.subdistrict || t.store?.subdistrict || "",
                village: t.village || targetResult?.notes || "",
                objective: t.objective || "",
                plannedPlotsCount:
                  t.plannedPlotsCount != null ? t.plannedPlotsCount : "",
                actualPlotsCount:
                  targetResult?.actualPlotsCount != null
                    ? targetResult.actualPlotsCount
                    : "",
                latitude:
                  t.latitude != null && String(t.latitude).trim() !== ""
                    ? String(t.latitude)
                    : targetResult?.actualLatitude != null
                      ? String(targetResult.actualLatitude)
                      : "",
                longitude:
                  t.longitude != null && String(t.longitude).trim() !== ""
                    ? String(t.longitude)
                    : targetResult?.actualLongitude != null
                      ? String(targetResult.actualLongitude)
                      : "",
                hasProductWithdrawal: hasWithdrawal,
                withdrawnProducts: withdrawnList,
                products: plotProducts,
                result: targetResult || null,
                results: t.results || (targetResult ? [targetResult] : []),
              };
            },
          );

          const type13Object =
            (plan as any).type13 ||
            (rawType13Targets.length > 0
              ? {
                  id: rawType13Targets[0]?.id || plan.id,
                  activityPlanId: plan.id,
                  hasProducts:
                    rawType13Products.length > 0 ||
                    mappedType13Plots.some((p: any) => p.hasProductWithdrawal),
                  hasProductWithdrawal: mappedType13Plots.some(
                    (p: any) => p.hasProductWithdrawal,
                  ),
                  notes: rawType13Targets[0]?.notes || plan.notes || "",
                  plots: mappedType13Plots,
                  products: rawType13Products,
                  results: allT13Results,
                }
              : null);

          const type13ActualData =
            allT13Results.length > 0 ||
            allT13Rounds.length > 0 ||
            allT13Attachments.length > 0
              ? {
                  plots: allT13Results,
                  type13PlotsActual: allT13Results.map((r: any) => ({
                    demoPlotId: r.targetId || r.id,
                    latitude: r.actualLatitude,
                    longitude: r.actualLongitude,
                    actualPlotsCount: r.actualPlotsCount,
                  })),
                  sprayRounds: allT13Rounds,
                  attachments: allT13Attachments,
                  totalPlots: allT13Results.length,
                }
              : (plan as any).type13Actual || null;

          const rawType14Targets = (plan as any).type14Targets || [];
          const rawType14Products = (plan as any).type14Products || [];
          const rawType14Results = (plan as any).type14Results || [];
          const primaryT14Target = rawType14Targets[0];
          const type14Object =
            rawType14Targets.length > 0
              ? {
                  id: primaryT14Target?.id || plan.id,
                  activityPlanId: plan.id,
                  mode: primaryT14Target?.mode || "EXISTING_PLOT",
                  sourceActivityPlanId:
                    primaryT14Target?.sourceActivityPlanId ||
                    primaryT14Target?.type13Target?.activityPlanId ||
                    null,
                  selectedPlanId:
                    primaryT14Target?.sourceActivityPlanId ||
                    primaryT14Target?.type13Target?.activityPlanId ||
                    null,
                  hasProducts:
                    rawType14Products.length > 0 ||
                    Boolean((plan as any).hasProductWithdrawal),
                  hasProductWithdrawal:
                    rawType14Products.length > 0 ||
                    Boolean((plan as any).hasProductWithdrawal),
                  notes: primaryT14Target?.notes || plan.notes || "",
                  plots: rawType14Targets,
                  products: rawType14Products,
                  results: rawType14Results,
                }
              : (plan as any).type14 || null;

          setInitialData({
            ...plan,
            id: plan.id,
            status: plan.status,
            approvalLogs: plan.approvalLogs || [],
            title: plan.title,
            activityTypeId:
              plan.activityTypeId ||
              (typeof plan.activityType === "object"
                ? plan.activityType?.id
                : ""),
            activityType:
              typeof plan.activityType === "object"
                ? plan.activityType?.name
                : plan.activityType,
            workTypes: plan.workTypes || [],
            startDate: plan.startDate,
            endDate: plan.endDate,
            province: plan.province || "",
            district: plan.district || "",
            location: plan.location,
            objective: plan.objective,
            description: plan.description,
            salesPromotionBudgetRequested: plan.salesPromotionBudgetRequested
              ? Number(plan.salesPromotionBudgetRequested)
              : 0,
            marketingBudgetRequested: plan.marketingBudgetRequested
              ? Number(plan.marketingBudgetRequested)
              : 0,
            notes: plan.notes || "",
            stores: plan.stores || [],
            products: plan.products || [],
            marketingItems: plan.marketingItems || [],
            promotionItems: plan.promotionItems || [],
            tour: plan.tour || null,
            demoPlotVisits: plan.demoPlotVisits || [],
            demoPlotId:
              (plan as any).demoPlotVisits?.[0]?.demoPlotId ||
              (plan as any).demoPlotId ||
              null,
            demoPlot: (plan as any).demoPlotVisits?.[0]?.demoPlot || null,
            targetAttendeesCount: plan.targetAttendeesCount ?? null,
            targetBookingSales: plan.targetBookingSales
              ? Number(plan.targetBookingSales)
              : null,
            helperEmployeeIds,
            planCode: plan.code || plan.id,
            employeeName: plan.employee?.name,
            planType: plan.planType || "PLANNED",
            type1Targets: (plan as any).type1Targets || (plan as any).type1Stores || plan.stores || [],
            type1Stores: (plan as any).type1Targets || (plan as any).type1Stores || plan.stores || [],
            type1Results: (plan as any).type1Results || [],
            type1Result:
              (plan as any).type1Results?.[0] ||
              (plan as any).type1Result ||
              null,
            type1Products: (plan as any).type1Products || [],
            type2Targets: (plan as any).type2Targets || [],
            type2Products: (plan as any).type2Products || [],
            type3Targets: (plan as any).type3Targets || [],
            type4Targets: (plan as any).type4Targets || [],
            type5Targets: (plan as any).type5Targets || [],
            type6Targets: (plan as any).type6Targets || [],
            type7aTargets: (plan as any).type7aTargets || (plan as any).type7aPlots || [],
            type7aPlots: (plan as any).type7aTargets || (plan as any).type7aPlots || [],
            type7aProducts: (plan as any).type7aProducts || [],
            type7aResults: (plan as any).type7aResults || [],
            type7bTargets: (plan as any).type7bTargets || [],
            type7bProducts:
              ((plan as any).type7bProducts && (plan as any).type7bProducts.length > 0)
                ? (plan as any).type7bProducts
                : (plan as any).type7b?.products || [],
            type7b:
              (plan as any).type7b ||
              ((plan as any).type7bTargets && (plan as any).type7bTargets.length > 0
                ? {
                    id: (plan as any).type7bTargets[0]?.id || plan.id,
                    sourceActivityPlanId:
                      (plan as any).type7bTargets[0]?.sourceActivityPlanId ||
                      (plan as any).type7bTargets[0]?.sourceActivityPlan?.id ||
                      (plan as any).type7bTargets[0]?.demoPlot?.activityPlanId ||
                      null,
                    demoPlotId: (plan as any).type7bTargets[0]?.demoPlotId || null,
                    objective:
                      (plan as any).type7bTargets[0]?.objective ||
                      (plan as any).type7bTargets[0]?.notes ||
                      plan.objective ||
                      "",
                    notes:
                      (plan as any).type7bTargets[0]?.notes ||
                      (plan as any).type7bTargets[0]?.objective ||
                      plan.notes ||
                      "",
                    plots: (plan as any).type7bTargets,
                    products:
                      (plan as any).type7bProducts && (plan as any).type7bProducts.length > 0
                        ? (plan as any).type7bProducts
                        : (plan as any).type7bTargets[0]?.products || [],
                    hasProducts:
                      Boolean(
                        ((plan as any).type7bProducts && (plan as any).type7bProducts.length > 0) ||
                        ((plan as any).type7bTargets[0]?.products &&
                          (plan as any).type7bTargets[0].products.length > 0),
                      ),
                  }
                : null),
            type7bData:
              (plan as any).type7bData ||
              (plan as any).type7b ||
              ((plan as any).type7bTargets && (plan as any).type7bTargets.length > 0
                ? {
                    id: (plan as any).type7bTargets[0]?.id || plan.id,
                    sourceActivityPlanId:
                      (plan as any).type7bTargets[0]?.sourceActivityPlanId ||
                      (plan as any).type7bTargets[0]?.sourceActivityPlan?.id ||
                      (plan as any).type7bTargets[0]?.demoPlot?.activityPlanId ||
                      null,
                    demoPlotId: (plan as any).type7bTargets[0]?.demoPlotId || null,
                    objective:
                      (plan as any).type7bTargets[0]?.objective ||
                      (plan as any).type7bTargets[0]?.notes ||
                      plan.objective ||
                      "",
                    notes:
                      (plan as any).type7bTargets[0]?.notes ||
                      (plan as any).type7bTargets[0]?.objective ||
                      plan.notes ||
                      "",
                    plots: (plan as any).type7bTargets,
                    products:
                      (plan as any).type7bProducts && (plan as any).type7bProducts.length > 0
                        ? (plan as any).type7bProducts
                        : (plan as any).type7bTargets[0]?.products || [],
                  }
                : null),
            type7bPlots:
              (plan as any).type7b?.plots ||
              (plan as any).type7bPlots ||
              (plan as any).type7bTargets ||
              [],
            type8: (plan as any).type8 || null,
            type8Data: (plan as any).type8 || null,
            type9: (plan as any).type9 || null,
            type9Data: (plan as any).type9 || null,
            type10: (plan as any).type10 || null,
            type10Data: (plan as any).type10 || null,
            type10Targets: (plan as any).type10Targets || [],
            type10Plots: (plan as any).type10Targets || [],
            type11: (plan as any).type11 || null,
            type11Data: (plan as any).type11 || null,
            type13Targets: rawType13Targets,
            type13Products: rawType13Products,
            type13Results: allT13Results,
            type13: type13Object,
            type13Data: type13Object,
            type13Plots:
              mappedType13Plots.length > 0
                ? mappedType13Plots
                : (plan as any).type13?.plots || [],
            type13Actual: type13ActualData,
            type14: type14Object,
            type14Data: type14Object,
            type14Targets: rawType14Targets,
            type14Products: rawType14Products,
            type14Results: rawType14Results,
            type14Plots:
              rawType14Targets.length > 0
                ? rawType14Targets
                : (plan as any).type14?.plots || [],
            result: plan.result || (plan as any).activityResult || null,
            activityResult: plan.result || (plan as any).activityResult || null,
          });
        } else {
          setLoadError(planRes.error || "ไม่สามารถดึงข้อมูล Trip Plan ได้");
        }
      } catch {
        setLoadError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setPageLoading(false);
      }
    }

    loadData();
  }, [id]);

  const handleSubmit = async (payload: any) => {
    const res = await updateActivityPlanAction(id, payload);
    if (res.success) {
      toast.success("อัปเดต Trip Plan เรียบร้อยแล้ว");
      router.push("/activity-plans");
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  if (isLoading || pageLoading) {
    return <div className="p-6 text-center">กำลังโหลด...</div>;
  }

  if (!canView || !canEdit) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertDescription>คุณไม่มีสิทธิ์แก้ไข Trip Plan นี้</AlertDescription>
      </Alert>
    );
  }

  return (
    <section className="p-4 md:p-6 pb-24 md:pb-8 bg-white min-h-screen rounded-2xl">
      {loadError && (
        <Alert variant="destructive" className="mb-4 max-w-5xl mx-auto">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {initialData && (
        <PlannedActivityForm
          initialData={initialData}
          employees={employees}
          customers={customers}
          products={products}
          productCategories={productCategories}
          activityTypes={activityTypes}
          promotionalMaterialsByCategory={promotionalMaterialsByCategory}
          demoPlots={demoPlots}
          followUpPlans={followUpPlans}
          hattackFollowUpPlans={hattackFollowUpPlans}
          onSubmit={handleSubmit}
          onBack={() => router.push("/activity-plans")}
          isEdit
        />
      )}
    </section>
  );
}

export default PlannedEditView;
