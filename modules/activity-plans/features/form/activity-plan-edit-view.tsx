"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { ActivityPlanForm } from "./activity-plan-form";
import {
  getActivityPlanAction,
  updateActivityPlanAction,
  getDemoPlotsAction,
  getActivePromotionalMaterialsGroupedAction,
} from "../../server/actions";
import { getAllEmployeesAction } from "@/modules/employee/server/actions";
import { getCustomersAction } from "@/modules/customers/server/actions";
import { listProductsAction } from "@/modules/products/server/actions";

interface Props {
  id: string;
}

export default function ActivityPlanEditView({ id }: Props) {
  const router = useRouter();
  const { hasPermission, allowed, isLoading } = usePermission(
    "menu.activity_plans",
  );

  const canEdit =
    hasPermission("activity.edit") || hasPermission("activity.manage");
  const canView =
    allowed ||
    hasPermission("activity.view") ||
    hasPermission("activity.manage") ||
    !isLoading;

  const [employees, setEmployees] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [demoPlots, setDemoPlots] = useState<any[]>([]);
  const [promotionalMaterialsByCategory, setPromotionalMaterialsByCategory] = useState<
    Record<string, any[]> | undefined
  >(undefined);
  const [initialData, setInitialData] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setPageLoading(true);
      try {
        const [empRes, planRes, custRes, prodRes, plotRes, mktRes] = await Promise.all([
          getAllEmployeesAction(),
          getActivityPlanAction(id),
          getCustomersAction({ perPage: 1000 }).catch(() => ({
            customers: [],
          })),
          listProductsAction({ status: "ACTIVE", perPage: 1000 }).catch(() => ({
            products: [],
          })),
          getDemoPlotsAction().catch(() => ({ demoPlots: [] })),
          getActivePromotionalMaterialsGroupedAction().catch(() => ({ success: false, grouped: {} })),
        ]);

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

        if (mktRes && mktRes.success && mktRes.grouped) {
          setPromotionalMaterialsByCategory(mktRes.grouped);
        }

        if (planRes.success && planRes.plan) {
          const plan = planRes.plan;

          // Map database helpers to simple array of employee IDs
          const helperEmployeeIds = plan.helpers
            ? plan.helpers.map((h: any) => h.employeeId)
            : [];

          setInitialData({
            title: plan.title,
            activityTypeId: plan.activityTypeId || (typeof plan.activityType === "object" ? plan.activityType?.id : ""),
            activityType: typeof plan.activityType === "object" ? plan.activityType?.name : plan.activityType,
            startDate: plan.startDate,
            endDate: plan.endDate,
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
            details: plan.items || [],
            helperEmployeeIds,
            planCode: plan.code || plan.id,
            employeeName: plan.employee?.name,
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
    toast.error(res.error || "ไม่สามารถอัปเดตข้อมูลได้");
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
    <section className="p-4 md:p-6 pb-24 md:pb-8 bg-slate-50/50 min-h-screen">
      {loadError && (
        <Alert variant="destructive" className="mb-4 max-w-5xl mx-auto">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {initialData && (
        <ActivityPlanForm
          initial={initialData}
          employees={employees}
          customers={customers}
          products={products}
          demoPlots={demoPlots}
          promotionalMaterialsByCategory={promotionalMaterialsByCategory}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/activity-plans")}
          submitLabel="บันทึก"
          isEdit
        />
      )}
    </section>
  );
}
