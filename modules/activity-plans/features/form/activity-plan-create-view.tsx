"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ActivityPlanForm } from "./activity-plan-form";
import { createActivityPlanAction } from "../../server/actions";
import { getAllEmployeesAction } from "@/modules/employee/server/actions";

export default function ActivityPlanCreateView() {
  const router = useRouter();
  const { hasPermission, allowed, isLoading } = usePermission("menu.activity_plans");

  const canCreate = hasPermission("activity.create") || hasPermission("activity.manage");
  const canView = allowed || hasPermission("activity.view") || hasPermission("activity.manage") || !isLoading;

  const [employees, setEmployees] = useState<any[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEmployees() {
      try {
        const res = await getAllEmployeesAction();
        if (res.success && res.employees) {
          setEmployees(res.employees);
        } else {
          setLoadError("ไม่สามารถดึงรายชื่อพนักงานได้");
        }
      } catch {
        setLoadError("เกิดข้อผิดพลาดในการโหลดรายชื่อพนักงาน");
      }
    }
    loadEmployees();
  }, []);

  const handleSubmit = async (payload: any) => {
    const res = await createActivityPlanAction(payload);
    if (res.success) {
      router.push("/activity-plans");
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  if (isLoading) {
    return <div className="p-6 text-center">กำลังโหลด...</div>;
  }

  if (!canView || !canCreate) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertDescription>คุณไม่มีสิทธิ์สร้างแผนกิจกรรม</AlertDescription>
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

      <ActivityPlanForm
        employees={employees}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/activity-plans")}
        submitLabel="บันทึก"
      />
    </section>
  );
}
