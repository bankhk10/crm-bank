import { activityPlanSchema, activityResultSchema } from "./validations";
import {
  findActivityPlanById,
  findActivityPlans,
  createActivityPlan,
  updateActivityPlan,
  softDeleteActivityPlan,
  upsertActivityResult,
  findActivityTypes,
  findActivityTypeByCode,
  findEmployeeByUserId,
  findOrCreateEmployeeForUser,
  type ListActivityPlansParams,
  type CreateActivityResultInput,
} from "../infrastructure/activity-plan.repository";
import { ActivityStatus } from "@prisma/client";

// Facade Use Cases

/**
 * Get details of a single plan
 */
export async function getActivityPlanDetailUseCase(id: string) {
  const plan = await findActivityPlanById(id);
  if (!plan) return { success: false as const, error: "ไม่พบ Trip Plan" };
  return { success: true as const, plan };
}

/**
 * List plans with filtering
 */
export async function listActivityPlansUseCase(params: ListActivityPlansParams) {
  return findActivityPlans(params);
}

/**
 * Get all activity type master lookups
 */
export async function getActivityTypesUseCase() {
  return findActivityTypes();
}

/**
 * Create a new ActivityPlan (Draft by default)
 */
export async function createActivityPlanUseCase(
  userId: string,
  rawData: unknown,
  userDetails?: { name?: string; email?: string }
) {
  const parsed = activityPlanSchema.safeParse(rawData);
  if (!parsed.success) {
    const errorMsg = parsed.error.errors.map((e) => e.message).join(", ");
    return { success: false as const, error: errorMsg };
  }

  const employee = await findOrCreateEmployeeForUser(userId, userDetails?.name, userDetails?.email);
  if (!employee) {
    return { success: false as const, error: "ไม่สามารถสร้างหรือค้นหาโปรไฟล์พนักงานได้" };
  }

  const { helperEmployeeIds, items, ...planFields } = parsed.data;

  const data = {
    ...planFields,
    salesPromotionBudgetRequested: planFields.salesPromotionBudgetRequested ?? null,
    marketingBudgetRequested: planFields.marketingBudgetRequested ?? null,
    province: planFields.province ?? null,
    district: planFields.district ?? null,
    items: items ?? [],
    helperEmployeeIds: helperEmployeeIds ?? [],
    status: ActivityStatus.DRAFT,
    employeeId: employee.id,
    createdById: userId,
    currentApproverEmployeeId: employee.managerId ?? null,
  };

  const plan = await createActivityPlan(data);
  return { success: true as const, plan };
}

/**
 * Update an existing ActivityPlan
 */
export async function updateActivityPlanUseCase(id: string, userId: string, rawData: unknown) {
  const parsed = activityPlanSchema.safeParse(rawData);
  if (!parsed.success) {
    const errorMsg = parsed.error.errors.map((e) => e.message).join(", ");
    return { success: false as const, error: errorMsg };
  }

  const plan = await findActivityPlanById(id);
  if (!plan) return { success: false as const, error: "ไม่พบ Trip Plan" };

  if (plan.createdById !== userId) {
    return { success: false as const, error: "คุณไม่มีสิทธิ์แก้ไข Trip Plan นี้" };
  }

  if (plan.status !== ActivityStatus.DRAFT && plan.status !== ActivityStatus.WAITING_FOR_CORRECTION) {
    return { success: false as const, error: "สามารถแก้ไขได้เฉพาะ Trip Plan ในสถานะร่างหรือรอแก้ไขเท่านั้น" };
  }

  const { helperEmployeeIds, items, ...planFields } = parsed.data;

  const data = {
    ...planFields,
    salesPromotionBudgetRequested: planFields.salesPromotionBudgetRequested ?? null,
    marketingBudgetRequested: planFields.marketingBudgetRequested ?? null,
    province: planFields.province ?? null,
    district: planFields.district ?? null,
    items: items ?? [],
    helperEmployeeIds,
    updatedUserId: userId,
  };

  const updated = await updateActivityPlan(id, data);
  return { success: true as const, plan: updated };
}

/**
 * Record post-activity result (only when plan status is APPROVED)
 */
export async function recordActivityResultUseCase(
  planId: string,
  userId: string,
  rawData: unknown
) {
  const plan = await findActivityPlanById(planId);
  if (!plan) return { success: false as const, error: "ไม่พบ Trip Plan" };

  if (plan.status !== ActivityStatus.APPROVED) {
    return { success: false as const, error: "สามารถบันทึกผลได้เฉพาะแผนกิจกรรมที่ได้รับการอนุมัติเรียบร้อยแล้วเท่านั้น" };
  }

  const parsed = activityResultSchema.safeParse(rawData);
  if (!parsed.success) {
    const errorMsg = parsed.error.errors.map((e) => e.message).join(", ");
    return { success: false as const, error: errorMsg };
  }

  const resultInput: CreateActivityResultInput = {
    activityPlanId: planId,
    actualStartDate: parsed.data.actualStartDate,
    actualEndDate: parsed.data.actualEndDate,
    actualAttendeesCount: parsed.data.actualAttendeesCount,
    resultStatus: parsed.data.resultStatus as any,
    resultSummary: parsed.data.resultSummary,
    problemFound: parsed.data.problemFound,
    nextAction: parsed.data.nextAction,
    actualSalesPromotionSpent: parsed.data.actualSalesPromotionSpent,
    actualMarketingSpent: parsed.data.actualMarketingSpent,
    salesResultAmount: parsed.data.salesResultAmount,
    salesOrdersCount: parsed.data.salesOrdersCount,
    collectResultAmount: parsed.data.collectResultAmount,
    demoPlotsCreated: parsed.data.demoPlotsCreated,
    demoPlotsFollowedUp: parsed.data.demoPlotsFollowedUp,
    distributorsCount: parsed.data.distributorsCount,
    farmersCount: parsed.data.farmersCount,
    recordedById: userId,
  };

  const activityResult = await upsertActivityResult(resultInput);
  return { success: true as const, result: activityResult };
}

/**
 * Delete a plan
 */
export async function deleteActivityPlanUseCase(id: string, userId: string) {
  const plan = await findActivityPlanById(id);
  if (!plan) return { success: false as const, error: "ไม่พบแผนกิจกรรม" };

  if (plan.createdById !== userId) {
    return { success: false as const, error: "คุณไม่มีสิทธิ์ลบแผนกิจกรรมนี้" };
  }

  await softDeleteActivityPlan(id);
  return { success: true as const };
}

// Re-exports validations, state machine transitions, and other functions
export {
  activityPlanSchema,
  activityApprovalSchema,
  activityResultSchema,
  type ActivityPlanFormValues,
  type ActivityApprovalFormValues,
  type ActivityResultFormValues,
} from "./validations";

export {
  submitActivityPlanUseCase,
  approveActivityPlanUseCase,
  rejectActivityPlanUseCase,
  requestCorrectionPlanUseCase,
  cancelActivityPlanUseCase,
} from "./activity-plan-flow";
export { findEmployeeById, findOrCreateEmployeeForUser, findActivityTypes, findActivityTypeByCode, resolveActivityTypeId } from "../infrastructure/activity-plan.repository";
export type { ListActivityPlansParams };
