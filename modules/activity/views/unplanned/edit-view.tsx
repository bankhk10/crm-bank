"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { UnplannedActivityForm } from "./components/unplanned-activity-form";
import {
  getActivityPlanAction,
  updateActivityPlanAction,
  getDemoPlotsAction,
  getFollowUpPlansAction,
  getProductCategoriesAction,
  getActivePromotionalMaterialsGroupedAction,
  getActivityTypesAction,
} from "@/modules/activity/server/actions";
import { getAllEmployeesAction } from "@/modules/employee/server/actions";
import { getCustomersAction } from "@/modules/customers/server/actions";
import { listProductsAction } from "@/modules/products/server/actions";
import { isActivityAdmin } from "@/modules/activity/domain/permissions";

interface UnplannedEditViewProps {
  id: string;
}

export function UnplannedEditView({ id }: UnplannedEditViewProps) {
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

        if (mktRes && mktRes.success && mktRes.grouped) {
          setPromotionalMaterialsByCategory(mktRes.grouped);
        }

        if (planRes.success && planRes.plan) {
          const plan = planRes.plan;

          const helperEmployeeIds = plan.helpers
            ? plan.helpers.map((h: any) => h.employeeId)
            : [];

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
            planType: plan.planType || "UNPLANNED",
            type13: (plan as any).type13 || null,
            type14: (plan as any).type14 || null,
            type14Targets: (plan as any).type14Targets || [],
            type14Plots: (plan as any).type14?.plots || (plan as any).type14Targets || [],
            type14Products: (plan as any).type14Products || [],
            type14Results: (plan as any).type14Results || (plan as any).result?.type14Results || [],
            type14Actual: (plan as any).type14Actual || (plan as any).result?.type14Actual || null,
            type14Data: (plan as any).type14Data || (plan as any).type14 || null,
            type14UnplannedItem: (plan as any).type14UnplannedItem || null,
            type14UnplannedItems: (plan as any).type14UnplannedItems || (plan as any).type14Targets || [],
            type7aTargets: (plan as any).type7aTargets || (plan as any).type7aPlots || [],
            type7aPlots: (plan as any).type7aTargets || (plan as any).type7aPlots || [],
            type7b: (plan as any).type7b || null,
            type13Targets: (plan as any).type13Targets || [],
            type13Plots: (plan as any).type13?.plots || (plan as any).type13Targets || [],
            type13Products: (plan as any).type13Products || [],
            type13Results: (plan as any).type13Results || [],
            type13Actual: (plan as any).type13Actual || (plan as any).result?.type13Actual || null,
            type13Data: (plan as any).type13Data || (plan as any).type13 || null,
            type13UnplannedItems: (plan as any).type13UnplannedItems || (plan as any).type13Targets || [],
            result: plan.result || (plan as any).activityResult || null,
            activityResult: plan.result || (plan as any).activityResult || null,
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
            type3Results:
              (plan as any).type3Results ||
              (plan as any).result?.type3Results ||
              [],
            followupResults:
              (plan as any).result?.followupResults ||
              (plan as any).followupResults ||
              [],
            attachments: plan.attachments || [],
            activityResultType1:
              (plan as any).type1Results?.[0] ||
              (plan as any).type1Result ||
              (plan as any).activityResultType1 ||
              null,
            type5Targets: (plan as any).type5Targets || [],
            type5SurveyRecords:
              (plan as any).result?.surveyResults ||
              (plan as any).surveyResults ||
              [],
            surveyResults:
              (plan as any).result?.surveyResults ||
              (plan as any).surveyResults ||
              [],
            t5SurveyDetails:
              (plan as any).result?.surveyResults ||
              (plan as any).surveyResults ||
              [],
            type5UnplannedItems: (plan as any).type5UnplannedItems || [],
            type6Targets: (plan as any).type6Targets || [],
            issueResults:
              (plan as any).result?.issueResults ||
              (plan as any).issueResults ||
              [],
            type6ActualIssues:
              (plan as any).result?.issueResults ||
              (plan as any).issueResults ||
              [],
            type6UnplannedItems: (plan as any).type6UnplannedItems || [],
          });
        } else {
          setLoadError(planRes.error || "ไม่สามารถดึงข้อมูลกิจกรรมนอกแผนได้");
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
      toast.success("อัปเดตกิจกรรมนอกแผนเรียบร้อยแล้ว");
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
        <AlertDescription>คุณไม่มีสิทธิ์แก้ไขกิจกรรมนอกแผนนี้</AlertDescription>
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
        <UnplannedActivityForm
          initialData={initialData}
          employees={employees}
          customers={customers}
          products={products}
          activityTypes={activityTypes}
          promotionalMaterialsByCategory={promotionalMaterialsByCategory}
          demoPlots={demoPlots}
          followUpPlans={followUpPlans}
          onSubmit={handleSubmit}
          onBack={() => router.push("/activity-plans")}
          isEdit
        />
      )}
    </section>
  );
}

export default UnplannedEditView;
