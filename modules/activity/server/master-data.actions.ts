"use server";

import {
  getActivityPlanAction,
  getCurrentUserEmployeeAction,
  getDemoPlotsAction,
  getFollowUpPlansAction,
  getHattackFollowUpPlansAction,
  getProductCategoriesAction,
  getActivityTypesAction,
} from "./planned.actions";
import { getActivePromotionalMaterialsGroupedAction } from "./promotional.actions";
import { getAllEmployeesAction } from "@/modules/employee/server/actions";
import { getCustomersAction } from "@/modules/customers/server/actions";
import { listProductsAction } from "@/modules/products/server/actions";
import type {
  ActivityPlanMasterData,
  ActivityPlanEditMasterData,
  ActivityPlanActualInitialData,
  ActivityFilterMasterData,
} from "./types";

/**
 * Loads all master data required for activity plan creation in a single server-side pass.
 * Can be executed directly in Server Components (page.tsx) without issuing client HTTP POST requests.
 */
export async function getPlannedActivityMasterData(): Promise<ActivityPlanMasterData> {
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

    let loadError: string | null = null;
    let employees: any[] = [];
    if (empRes?.success && empRes?.employees) {
      employees = empRes.employees;
    } else {
      loadError = "ไม่สามารถดึงรายชื่อพนักงานได้";
    }

    let currentEmployeeName = "";
    if (userRes?.success) {
      if (userRes.employee?.name) {
        currentEmployeeName = userRes.employee.name;
      } else if (userRes.user?.name) {
        currentEmployeeName = userRes.user.name;
      }
    }

    return {
      employees,
      customers: custRes?.customers || [],
      products: prodRes?.products || [],
      productCategories:
        catRes?.success && catRes?.productCategories
          ? catRes.productCategories
          : [],
      activityTypes:
        actTypeRes?.success && actTypeRes?.types ? actTypeRes.types : [],
      demoPlots: plotRes?.demoPlots || [],
      followUpPlans: followUpRes?.followUpPlans || [],
      hattackFollowUpPlans: hattackFollowUpRes?.hattackFollowUpPlans || [],
      promotionalMaterialsByCategory:
        mktRes?.success && mktRes?.grouped ? mktRes.grouped : undefined,
      currentEmployeeName,
      loadError,
    };
  } catch (error: any) {
    console.error("Failed to load activity plan master data on server:", error);
    return {
      employees: [],
      customers: [],
      products: [],
      productCategories: [],
      activityTypes: [],
      demoPlots: [],
      followUpPlans: [],
      hattackFollowUpPlans: [],
      promotionalMaterialsByCategory: undefined,
      currentEmployeeName: "",
      loadError: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
    };
  }
}

/**
 * Loads the target activity plan along with all master data required for editing
 * (Planned & Unplanned Edit Views) in a single server-side pass, eliminating both
 * the 10-action initial burst and the 2-action follow-up plan waterfall.
 */
export async function getActivityPlanEditData(
  id: string,
): Promise<ActivityPlanEditMasterData> {
  try {
    const planPromise = getActivityPlanAction(id).catch((err: any) => ({
      success: false as const,
      plan: undefined,
      error: err?.message || "ไม่สามารถดึงข้อมูลแผนงานได้",
    }));

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
      planPromise,
      getCustomersAction({ perPage: 1000 }).catch(() => ({
        customers: [],
      })),
      listProductsAction({ status: "ACTIVE", perPage: 1000 }).catch(() => ({
        products: [],
      })),
      getDemoPlotsAction().catch(() => ({ demoPlots: [] })),
      planPromise
        .then((pRes) => getFollowUpPlansAction(pRes.plan?.employeeId))
        .catch(() => ({ followUpPlans: [] })),
      planPromise
        .then((pRes) => getHattackFollowUpPlansAction(pRes.plan?.employeeId))
        .catch(() => ({ hattackFollowUpPlans: [] })),
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

    let loadError: string | null = null;
    let employees: any[] = [];
    if (empRes?.success && empRes?.employees) {
      employees = empRes.employees;
    } else {
      loadError = "ไม่สามารถดึงรายชื่อพนักงานได้";
    }

    const plan = planRes?.success && planRes?.plan ? planRes.plan : null;
    const planError = !plan
      ? planRes?.error || "ไม่สามารถดึงข้อมูลแผนงานได้"
      : null;

    return {
      plan,
      planError,
      employees,
      customers: custRes?.customers || [],
      products: prodRes?.products || [],
      productCategories:
        catRes?.success && catRes?.productCategories
          ? catRes.productCategories
          : [],
      activityTypes:
        actTypeRes?.success && actTypeRes?.types ? actTypeRes.types : [],
      demoPlots: plotRes?.demoPlots || [],
      followUpPlans: followUpRes?.followUpPlans || [],
      hattackFollowUpPlans: hattackFollowUpRes?.hattackFollowUpPlans || [],
      promotionalMaterialsByCategory:
        mktRes?.success && mktRes?.grouped ? mktRes.grouped : undefined,
      currentEmployeeName: plan?.employee?.name || "",
      loadError,
    };
  } catch (error: any) {
    console.error("Failed to load activity plan edit data on server:", error);
    return {
      plan: null,
      planError: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
      employees: [],
      customers: [],
      products: [],
      productCategories: [],
      activityTypes: [],
      demoPlots: [],
      followUpPlans: [],
      hattackFollowUpPlans: [],
      promotionalMaterialsByCategory: undefined,
      currentEmployeeName: "",
      loadError: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
    };
  }
}

/**
 * Loads initial data for Actual Result Recording View (/activity-plans/[id]/actual)
 * in a single server-side pass.
 */
export async function getActivityPlanActualInitialData(
  id?: string,
): Promise<ActivityPlanActualInitialData> {
  try {
    const [planRes, prodRes, custRes] = await Promise.all([
      id
        ? getActivityPlanAction(id).catch((err: any) => ({
            success: false as const,
            plan: undefined,
            error: err?.message || "ไม่สามารถโหลดข้อมูลแผนงานกิจกรรมได้",
          }))
        : Promise.resolve(null),
      listProductsAction({ status: "ACTIVE", perPage: 1000 }).catch(() => ({
        products: [],
      })),
      getCustomersAction({ perPage: 1000 }).catch(() => ({
        customers: [],
      })),
    ]);

    const products =
      (prodRes as any)?.data || (prodRes as any)?.products || [];
    const customers = (custRes as any)?.customers || [];
    const plan = planRes?.success && planRes?.plan ? planRes.plan : null;
    const planError =
      id && !plan
        ? planRes?.error || "ไม่สามารถโหลดข้อมูลแผนงานกิจกรรมได้"
        : null;

    return {
      plan,
      planError,
      products,
      customers,
    };
  } catch (error: any) {
    console.error("Failed to load actual initial data on server:", error);
    return {
      plan: null,
      planError: id ? "เกิดข้อผิดพลาดในการโหลดข้อมูลแผนงาน" : null,
      products: [],
      customers: [],
    };
  }
}

/**
 * Loads filter options (Activity Types & Employees) for List View and Calendar View.
 */
export async function getActivityFilterMasterData(): Promise<ActivityFilterMasterData> {
  try {
    const [actTypeRes, empRes] = await Promise.all([
      getActivityTypesAction().catch(() => ({ success: false, types: [] })),
      getAllEmployeesAction().catch(() => ({ success: false, employees: [] })),
    ]);

    return {
      activityTypes:
        actTypeRes?.success && Array.isArray(actTypeRes.types)
          ? actTypeRes.types
          : [],
      employees:
        empRes?.success && Array.isArray(empRes.employees)
          ? empRes.employees
          : [],
    };
  } catch (error: any) {
    console.error("Failed to load activity filter master data on server:", error);
    return {
      activityTypes: [],
      employees: [],
    };
  }
}
