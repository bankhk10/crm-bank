"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { ActivityPlanForm } from "./activity-plan-form";
import { createActivityPlanAction, getCurrentUserEmployeeAction } from "../../server/actions";
import { getAllEmployeesAction } from "@/modules/employee/server/actions";
import { getCustomersAction } from "@/modules/customers/server/actions";
import { listProductsAction } from "@/modules/products/server/actions";

export default function ActivityPlanCreateView() {
  const router = useRouter();
  const { hasPermission, allowed, isLoading } = usePermission("menu.activity_plans");

  const canCreate = hasPermission("activity.create") || hasPermission("activity.manage");
  const canView = allowed || hasPermission("activity.view") || hasPermission("activity.manage") || !isLoading;

  const [employees, setEmployees] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [currentEmployeeName, setCurrentEmployeeName] = useState<string>("");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [empRes, userRes, custRes, prodRes] = await Promise.all([
          getAllEmployeesAction(),
          getCurrentUserEmployeeAction(),
          getCustomersAction({ perPage: 1000 }).catch(() => ({ customers: [] })),
          listProductsAction({ status: "ACTIVE", perPage: 1000 }).catch(() => ({ products: [] })),
        ]);

        if (empRes.success && empRes.employees) {
          setEmployees(empRes.employees);
        } else {
          setLoadError("ไม่สามารถดึงรายชื่อพนักงานได้");
        }

        if (custRes && custRes.customers) {
          setCustomers(custRes.customers);
        }

        if (prodRes && prodRes.products) {
          setProducts(prodRes.products);
        }

        if (userRes.success) {
          if (userRes.employee?.name) {
            setCurrentEmployeeName(userRes.employee.name);
          } else if (userRes.user?.name) {
            setCurrentEmployeeName(userRes.user.name);
          }
        }
      } catch {
        setLoadError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (payload: any) => {
    const res = await createActivityPlanAction(payload);
    if (res.success) {
      toast.success("บันทึก Trip Plan เรียบร้อยแล้ว");
      router.push("/activity-plans");
      return { success: true };
    }
    toast.error(res.error || "ไม่สามารถบันทึกข้อมูลได้");
    return { success: false, error: res.error };
  };

  if (isLoading) {
    return <div className="p-6 text-center">กำลังโหลด...</div>;
  }

  if (!canView || !canCreate) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertDescription>คุณไม่มีสิทธิ์สร้าง Trip Plan</AlertDescription>
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
        initial={{ employeeName: currentEmployeeName }}
        employees={employees}
        customers={customers}
        products={products}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/activity-plans")}
        submitLabel="บันทึก"
      />
    </section>
  );
}
