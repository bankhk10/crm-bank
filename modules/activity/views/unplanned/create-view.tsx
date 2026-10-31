"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { UnplannedActivityForm } from "./components/unplanned-activity-form";
import {
  createActivityPlanAction,
  getCurrentUserEmployeeAction,
  getDemoPlotsAction,
  getFollowUpPlansAction,
  getProductCategoriesAction,
  getActivePromotionalMaterialsGroupedAction,
  getActivityTypesAction,
} from "@/modules/activity/server/actions";
import { getAllEmployeesAction } from "@/modules/employee/server/actions";
import { getCustomersAction } from "@/modules/customers/server/actions";
import { listProductsAction } from "@/modules/products/server/actions";
import {
  isActivityAdmin,
  canCreateUnplannedActivity,
} from "@/modules/activity/domain/permissions";
import {
  useIsAdminTester,
  getAutoRedirectInspectPref,
} from "@/modules/activity/dev-tools";

export function UnplannedCreateView() {
  const router = useRouter();
  const { data: session } = useSession();
  const { isAdminTester } = useIsAdminTester();
  const { hasPermission, allowed, isLoading } = usePermission(
    "menu.activity_plans",
  );

  const user = session?.user;
  const isAdmin = isActivityAdmin(user);
  const canCreate = canCreateUnplannedActivity(user).allowed;
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
  const [currentEmployeeName, setCurrentEmployeeName] = useState<string>("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState<boolean>(true);

  const initialData = React.useMemo(
    () => ({ employeeName: currentEmployeeName }),
    [currentEmployeeName],
  );

  useEffect(() => {
    async function loadData() {
      setPageLoading(true);
      try {
        const [
          empRes,
          userRes,
          custRes,
          prodRes,
          plotRes,
          followUpRes,
          catRes,
          mktRes,
          actTypeRes,
        ] = await Promise.all([
          getAllEmployeesAction(),
          getCurrentUserEmployeeAction(),
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
        } else {
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

        if (userRes.success) {
          if (userRes.employee?.name) {
            setCurrentEmployeeName(userRes.employee.name);
          } else if (userRes.user?.name) {
            setCurrentEmployeeName(userRes.user.name);
          }
        }
      } catch {
        setLoadError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setPageLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (payload: any) => {
    const res = await createActivityPlanAction(payload);
    if (res.success) {
      toast.success("บันทึกกิจกรรมนอกแผนเรียบร้อยแล้ว");
      const createdId = (res as any).plan?.id || (res as any).id;
      if (isAdminTester && getAutoRedirectInspectPref() && createdId) {
        toast.info(
          "🔍 กำลังพาไปหน้าแก้ไขกิจกรรมนอกแผนเพื่อเช็คข้อมูลในช่อง UI...",
        );
        router.push(`/activity-plans/unplanned/${createdId}/edit?inspect=1`);
      } else {
        router.push("/activity-plans");
      }
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  if (isLoading || pageLoading) {
    return <div className="p-6 text-center">กำลังโหลด...</div>;
  }

  if (!canView || !canCreate) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertDescription>คุณไม่มีสิทธิ์สร้างกิจกรรมนอกแผน</AlertDescription>
      </Alert>
    );
  }

  if (loadError) {
    return (
      <section className="p-4 md:p-6 pb-24 md:pb-8 bg-slate-50/50 min-h-screen">
        <Alert variant="destructive" className="mb-4 max-w-5xl mx-auto">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      </section>
    );
  }

  return (
    <section className="p-4 md:p-6 pb-24 md:pb-8 bg-white min-h-screen rounded-2xl">
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
      />
    </section>
  );
}

export default UnplannedCreateView;
