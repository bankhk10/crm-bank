import { activityPlanSchema } from "./validations";
import {
  findActivityPlanById,
  findActivityPlans,
  createActivityPlan,
  updateActivityPlan,
  softDeleteActivityPlan,
  findEmployeeByUserId,
  findOrCreateEmployeeForUser,
  type ListActivityPlansParams,
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

  const { helperEmployeeIds, ...planFields } = parsed.data;

  // Set initial status to DRAFT
  const data = {
    ...planFields,
    salesPromotionBudget: planFields.salesPromotionBudget ?? null,
    marketingBudget: planFields.marketingBudget ?? null,
    details: planFields.details ?? null,
    status: ActivityStatus.DRAFT,
    employeeId: employee.id,
    createdById: userId,
    currentApproverId: employee.managerId ?? null,
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
  if (!plan) return { success: false as const, error: "ไม่พบ Trip Plan" };

  if (plan.createdById !== userId) {
    return { success: false as const, error: "คุณไม่มีสิทธิ์แก้ไข Trip Plan นี้" };
  }

  if (plan.status !== ActivityStatus.DRAFT && plan.status !== ActivityStatus.WAITING_FOR_CORRECTION) {
    return { success: false as const, error: "สามารถแก้ไขได้เฉพาะ Trip Plan ในสถานะร่างหรือรอแก้ไขเท่านั้น" };
  }

  const { helperEmployeeIds, ...planFields } = parsed.data;

  const data = {
    ...planFields,
    salesPromotionBudget: planFields.salesPromotionBudget ?? null,
    marketingBudget: planFields.marketingBudget ?? null,
    details: planFields.details ?? null,
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
export { findEmployeeById, findOrCreateEmployeeForUser } from "../infrastructure/activity-plan.repository";
export type { ListActivityPlansParams };
