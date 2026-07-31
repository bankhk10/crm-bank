"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/custom/page-header";
import { toast } from "sonner";
import { ActivityPlanForm } from "./activity-plan-form";
import { getActivityPlanAction, updateActivityPlanAction } from "../../server/actions";
import { getAllEmployeesAction } from "@/modules/employee/server/actions";

interface Props {
  id: string;
}

export default function ActivityPlanEditView({ id }: Props) {
  const router = useRouter();
  const { hasPermission, allowed, isLoading } = usePermission("menu.activity_plans");

  const canEdit = hasPermission("activity.edit") || hasPermission("activity.manage");
  const canView = allowed || hasPermission("activity.view") || hasPermission("activity.manage") || !isLoading;

  const [employees, setEmployees] = useState<any[]>([]);
  const [initialData, setInitialData] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setPageLoading(true);
      try {
        const [empRes, planRes] = await Promise.all([
          getAllEmployeesAction(),
          getActivityPlanAction(id),
        ]);

        if (empRes.success && empRes.employees) {
          setEmployees(empRes.employees);
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
          });
        } else {
          setLoadError(planRes.error || "ไม่สามารถดึงข้อมูลแผนกิจกรรมได้");
        }
      } catch {
        setLoadError("เกิดข้อผิดพลาดในการโหลดข้อมูลหน้าแก้ไข");
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
    return <div className="p-6 text-center">กำลังโหลดข้อมูล...</div>;
  }

  if (!canView || !canEdit) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertDescription>คุณไม่มีสิทธิ์แก้ไขแผนกิจกรรมนี้</AlertDescription>
      </Alert>
    );
  }

  if (loadError || !initialData) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertDescription>{loadError || "ไม่พบข้อมูลกิจกรรม"}</AlertDescription>
      </Alert>
    );
  }

  return (
    <section className="space-y-6 p-6 pb-24 md:pb-8">
      <PageHeader
        title="แก้ไขแผนกิจกรรม"
        description="อัปเดตรายละเอียดแผนงานหรือแก้ไขตามที่หัวหน้างานแนะนำเพิ่มเติม"
      />

      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm max-w-4xl">
        <ActivityPlanForm
          initial={initialData}
          employees={employees}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/activity-plans")}
          submitLabel="อัปเดตแผนกิจกรรม"
        />
      </div>
    </section>
  );
}
