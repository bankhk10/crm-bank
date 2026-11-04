"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { LoadingOverlayDialog } from "@/modules/activity/ui";
import { PlannedActivityForm } from "./components/planned-activity-form";
import {
  createActivityPlanAction,
  getCurrentUserEmployeeAction,
  getDemoPlotsAction,
  getFollowUpPlansAction,
  getHattackFollowUpPlansAction,
  getProductCategoriesAction,
  getActivePromotionalMaterialsGroupedAction,
  getActivityTypesAction,
} from "@/modules/activity/server/actions";
import type { ActivityPlanMasterData } from "@/modules/activity/types";
import { getAllEmployeesAction } from "@/modules/employee/server/actions";
import { getCustomersAction } from "@/modules/customers/server/actions";
import { listProductsAction } from "@/modules/products/server/actions";
import {
  isActivityAdmin,
  canCreatePlannedActivity,
} from "@/modules/activity/domain/permissions";

export interface PlannedCreateViewProps {
  initialMasterData?: ActivityPlanMasterData;
}

export function PlannedCreateView({ initialMasterData }: PlannedCreateViewProps = {}) {
  const router = useRouter();
  const { data: session } = useSession();
  const { hasPermission, allowed, isLoading } = usePermission(
    "menu.activity_plans",
  );

  const user = session?.user;
  const isAdmin = isActivityAdmin(user);
  const canCreate = canCreatePlannedActivity(user).allowed;
  const canView =
    isAdmin ||
    allowed ||
    hasPermission("activity.view") ||
    hasPermission("activity.manage") ||
    !isLoading;

  const [employees, setEmployees] = useState<any[]>(
    initialMasterData?.employees ?? [],
  );
  const [customers, setCustomers] = useState<any[]>(
    initialMasterData?.customers ?? [],
  );
  const [products, setProducts] = useState<any[]>(
    initialMasterData?.products ?? [],
  );
  const [productCategories, setProductCategories] = useState<any[]>(
    initialMasterData?.productCategories ?? [],
  );
  const [activityTypes, setActivityTypes] = useState<any[]>(
    initialMasterData?.activityTypes ?? [],
  );
  const [demoPlots, setDemoPlots] = useState<any[]>(
    initialMasterData?.demoPlots ?? [],
  );
  const [followUpPlans, setFollowUpPlans] = useState<any[]>(
    initialMasterData?.followUpPlans ?? [],
  );
  const [hattackFollowUpPlans, setHattackFollowUpPlans] = useState<any[]>(
    initialMasterData?.hattackFollowUpPlans ?? [],
  );
  const [promotionalMaterialsByCategory, setPromotionalMaterialsByCategory] =
    useState<Record<string, any[]> | undefined>(
      initialMasterData?.promotionalMaterialsByCategory,
    );
  const [currentEmployeeName, setCurrentEmployeeName] = useState<string>(
    initialMasterData?.currentEmployeeName ?? "",
  );
  const [loadError, setLoadError] = useState<string | null>(
    initialMasterData?.loadError ?? null,
  );
  const [pageLoading, setPageLoading] = useState<boolean>(!initialMasterData);

  const initialData = React.useMemo(
    () => ({ employeeName: currentEmployeeName || session?.user?.name || "" }),
    [currentEmployeeName, session?.user?.name],
  );

  useEffect(() => {
    // If master data is already loaded and provided by server component, bypass client-side fetching
    if (initialMasterData) {
      return;
    }

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
          hattackFollowUpRes,
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

        if (hattackFollowUpRes && hattackFollowUpRes.hattackFollowUpPlans) {
          setHattackFollowUpPlans(hattackFollowUpRes.hattackFollowUpPlans);
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
  }, [initialMasterData]);

  const handleSubmit = async (payload: any) => {
    const res = await createActivityPlanAction(payload);
    if (res.success) {
      toast.success("บันทึก Trip Plan เรียบร้อยแล้ว");
      router.push("/activity-plans");
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  if (isLoading || pageLoading) {
    return (
      <div className="min-h-[400px]">
        <LoadingOverlayDialog
          open={true}
          title="กำลังโหลดข้อมูล..."
          description="กรุณารอสักครู่ ระบบกำลังเตรียมข้อมูลสำหรับสร้างแผนงาน"
        />
      </div>
    );
  }

  if (!canView || !canCreate) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertDescription>คุณไม่มีสิทธิ์สร้าง Trip Plan</AlertDescription>
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
      />
    </section>
  );
}

export default PlannedCreateView;
