"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { ActivityPlanForm } from "./activity-plan-form";
import { getActivityPlanAction, updateActivityPlanAction } from "../../server/actions";
import { getAllEmployeesAction } from "@/modules/employee/server/actions";
import { getCustomersAction } from "@/modules/customers/server/actions";
import { listProductsAction } from "@/modules/products/server/actions";

interface Props {
  id: string;
}

export default function ActivityPlanEditView({ id }: Props) {
  const router = useRouter();
  const { hasPermission, allowed, isLoading } = usePermission("menu.activity_plans");

  const canEdit = hasPermission("activity.edit") || hasPermission("activity.manage");
  const canView = allowed || hasPermission("activity.view") || hasPermission("activity.manage") || !isLoading;

  const [employees, setEmployees] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [initialData, setInitialData] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setPageLoading(true);
      try {
        const [empRes, planRes, custRes, prodRes] = await Promise.all([
          getAllEmployeesAction(),
          getActivityPlanAction(id),
          getCustomersAction({ perPage: 1000 }).catch(() => ({ customers: [] })),
          listProductsAction({ status: "ACTIVE", perPage: 1000 }).catch(() => ({ products: [] })),
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

        if (planRes.success && planRes.plan) {
          const plan = planRes.plan;

          // Map database helpers to simple array of employee IDs
          const helperEmployeeIds = plan.helpers
            ? plan.helpers.map((h: any) => h.employeeId)
            : [];

          setInitialData({
            title: plan.title,
            activityType: plan.activityType,
            startDate: plan.startDate,
            endDate: plan.endDate,
            location: plan.location,
            objective: plan.objective,
            description: plan.description,
            salesPromotionBudget: plan.salesPromotionBudget ? Number(plan.salesPromotionBudget) : 0,
            marketingBudget: plan.marketingBudget ? Number(plan.marketingBudget) : 0,
            notes: plan.notes || "",
            helperEmployeeIds,
            planCode: plan.code,
            employeeName: plan.employee?.name,
          });
        } else {
          setLoadError(planRes.error || "ไม่สามารถดึงข้อมูลแผนกิจกรรมได้");
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
      toast.success("อัปเดตแผนกิจกรรมเรียบร้อยแล้ว");
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
        <AlertDescription>คุณไม่มีสิทธิ์แก้ไขแผนกิจกรรมนี้</AlertDescription>
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
          onSubmit={handleSubmit}
          onCancel={() => router.push("/activity-plans")}
          submitLabel="อัปเดตแผนกิจกรรม"
          isEdit
        />
      )}
    </section>
  );
}

