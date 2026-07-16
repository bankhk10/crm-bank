import { activityPlanSchema } from "./validations";
import {
  findActivityPlanById,
  findActivityPlans,
  createActivityPlan,
  updateActivityPlan,
  softDeleteActivityPlan,
  findEmployeeByUserId,
  type ListActivityPlansParams,
} from "../infrastructure/activity-plan.repository";
import { ActivityStatus } from "@prisma/client";

// Facade Use Cases

/**
 * Get details of a single plan
 */
export async function getActivityPlanDetailUseCase(id: string) {
  const plan = await findActivityPlanById(id);
  if (!plan) return { success: false as const, error: "ไม่พบแผนกิจกรรม" };
  return { success: true as const, plan };
}

/**
 * List plans with filtering
 */
export async function listActivityPlansUseCase(params: ListActivityPlansParams) {
  return findActivityPlans(params);
}

/**
 * Create a new ActivityPlan (Draft by default)
 */
export async function createActivityPlanUseCase(userId: string, rawData: unknown) {
  const parsed = activityPlanSchema.safeParse(rawData);
  if (!parsed.success) {
    const errorMsg = parsed.error.errors.map((e) => e.message).join(", ");
    return { success: false as const, error: errorMsg };
  }

  const employee = await findEmployeeByUserId(userId);
  if (!employee) {
    return { success: false as const, error: "ไม่พบข้อมูลพนักงานของผู้ใช้งานนี้" };
  }

  const { helperEmployeeIds, ...planFields } = parsed.data;

  // Set initial status to DRAFT
  const data = {
    ...planFields,
    salesPromotionBudget: planFields.salesPromotionBudget ? new Object(planFields.salesPromotionBudget) as any : null,
    marketingBudget: planFields.marketingBudget ? new Object(planFields.marketingBudget) as any : null,
    status: ActivityStatus.DRAFT,
    employeeId: employee.id,
    createdById: userId,
  };

  const plan = await createActivityPlan(data, helperEmployeeIds);
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
  if (!plan) return { success: false as const, error: "ไม่พบแผนกิจกรรม" };

  if (plan.createdById !== userId) {
    return { success: false as const, error: "คุณไม่มีสิทธิ์แก้ไขแผนกิจกรรมนี้" };
  }

  if (plan.status !== ActivityStatus.DRAFT && plan.status !== ActivityStatus.WAITING_FOR_CORRECTION) {
    return { success: false as const, error: "สามารถแก้ไขได้เฉพาะแผนกิจกรรมในสถานะร่างหรือรอแก้ไขเท่านั้น" };
  }

  const { helperEmployeeIds, ...planFields } = parsed.data;

  const data = {
    ...planFields,
    salesPromotionBudget: planFields.salesPromotionBudget ? new Object(planFields.salesPromotionBudget) as any : null,
    marketingBudget: planFields.marketingBudget ? new Object(planFields.marketingBudget) as any : null,
    helperEmployeeIds,
    updatedUserId: userId,
  };

  const updated = await updateActivityPlan(id, data);
  return { success: true as const, plan: updated };
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
  type ActivityPlanFormValues,
  type ActivityApprovalFormValues,
} from "./validations";

export {
  submitActivityPlanUseCase,
  approveActivityPlanUseCase,
  rejectActivityPlanUseCase,
  requestCorrectionPlanUseCase,
  cancelActivityPlanUseCase,
} from "./activity-plan-flow";
export { findEmployeeById } from "../infrastructure/activity-plan.repository";
export type { ListActivityPlansParams };
