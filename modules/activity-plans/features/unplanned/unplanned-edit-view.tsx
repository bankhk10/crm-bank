"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePermission } from "@/hooks/use-permission";
import { Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UnplannedForm } from "./components/unplanned-form";
import { getActivityPlanAction } from "../../server/actions";
import { getCustomersAction } from "@/modules/customers/server/actions";
import { listProductsAction } from "@/modules/products/server/actions";
import type { ActivityPlanType, ActivityStatus } from "@prisma/client";

interface UnplannedEditViewProps {
  id: string;
  onBack?: () => void;
}

export default function UnplannedEditView({
  id,
  onBack,
}: UnplannedEditViewProps) {
  const { data: session, status: sessionStatus } = useSession();
  const { hasPermission, isLoading: permLoading } = usePermission(
    "menu.activity_plans",
  );

  const [plan, setPlan] = useState<any | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const roles = (session?.user as any)?.roles ?? [];
  const isAdmin =
    roles.includes("administrator") ||
    roles.includes("admin") ||
    roles.includes("ceo") ||
    (session?.user as any)?.role === "administrator" ||
    (session?.user as any)?.role === "ADMIN";

  const currentUserId = session?.user?.id;
  const currentUserEmployeeId = session?.user?.employeeId;

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [planRes, custRes, prodRes] = await Promise.all([
          getActivityPlanAction(id),
          getCustomersAction({ perPage: 1000 }),
          listProductsAction({ status: "ACTIVE", perPage: 1000 }),
        ]);

        if (!isMounted) return;

        if (!planRes.success || !planRes.plan) {
          setErrorMessage(
            planRes.error || "ไม่สามารถโหลดข้อมูลกิจกรรมนอกแผนงานได้",
          );
          return;
        }

        const loadedPlan = planRes.plan;
        if (loadedPlan.planType !== "UNPLANNED") {
          setErrorMessage(
            "รายการนี้ไม่ใช่กิจกรรมนอกแผนงาน (เป็นกิจกรรมตามแผน Trip Plan)",
          );
          return;
        }

        setPlan(loadedPlan);

        if (custRes?.success && custRes?.customers) {
          setCustomers(custRes.customers);
        } else if (custRes?.customers) {
          setCustomers(custRes.customers);
        }

        if (prodRes?.success && prodRes?.data) {
          setProducts(prodRes.data);
        } else if (prodRes?.products) {
          setProducts(prodRes.products);
        }
      } catch (err: any) {
        console.error("Failed to load unplanned activity data:", err);
        if (isMounted) {
          setErrorMessage("เกิดข้อผิดพลาดในการโหลดข้อมูล");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (id) {
      loadData();
    }
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (sessionStatus === "loading" || permLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500 font-medium">
          กำลังโหลดข้อมูลกิจกรรมนอกแผนงาน...
        </p>
      </div>
    );
  }

  if (errorMessage || !plan) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white border border-rose-200 rounded-3xl text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">เกิดข้อผิดพลาด</h2>
        <p className="text-sm text-slate-600">
          {errorMessage || "ไม่พบข้อมูลกิจกรรม"}
        </p>
        <div className="pt-2">
          {onBack ? (
            <Button
              variant="outline"
              onClick={onBack}
              className="border-slate-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับหน้ารายการ
            </Button>
          ) : (
            <Link href="/activity-plans">
              <Button variant="outline" className="border-slate-300">
                <ArrowLeft className="w-4 h-4 mr-2" />
                กลับหน้ารายการ
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Ownership & Permission check
  const isCreator =
    isAdmin ||
    (currentUserEmployeeId && plan.employeeId === currentUserEmployeeId) ||
    (currentUserId && plan.createdById === currentUserId);

  if (!isCreator && plan.status === "DRAFT") {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white border border-amber-200 rounded-3xl text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          ไม่มีสิทธิ์เข้าถึงร่างกิจกรรม
        </h2>
        <p className="text-sm text-slate-600">
          กิจกรรมในสถานะร่างสามารถเข้าถึงและแก้ไขได้เฉพาะผู้สร้างเท่านั้น
        </p>
        <div className="pt-2">
          <Link href="/activity-plans">
            <Button variant="outline" className="border-slate-300">
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับหน้ารายการ
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50/50 min-h-screen">
      <UnplannedForm
        initialPlan={plan}
        customers={customers}
        products={products}
        onCancel={onBack}
      />
    </div>
  );
}
