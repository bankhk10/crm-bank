import { activityPlanSchema, activityResultSchema } from "./validations";
import {
  findActivityPlanById,
  findActivityPlans,
  createActivityPlan,
  updateActivityPlan,
  softDeleteActivityPlan,
  upsertActivityResult,
  findActivityTypes,
  findOrCreateEmployeeForUser,
  type ListActivityPlansParams,
  type CreateActivityResultInput,
} from "../infrastructure/activity-plan.repository";
import { ActivityStatus } from "@prisma/client";
import { isActivityPlanTestMode } from "../config";

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

  const { helperEmployeeIds, items, tourData, planStores, planProducts, workTypeCodes, ...planFields } = parsed.data;

  const data = {
    ...planFields,
    salesPromotionBudgetRequested: planFields.salesPromotionBudgetRequested ?? null,
    marketingBudgetRequested: planFields.marketingBudgetRequested ?? null,
    province: planFields.province ?? null,
    district: planFields.district ?? null,
    items: items ?? [],
    helperEmployeeIds: helperEmployeeIds ?? [],
    tourData: tourData ?? null,
    planStores: planStores ?? [],
    planProducts: planProducts ?? [],
    workTypeCodes: workTypeCodes ?? [],
    status: ActivityStatus.DRAFT,
    employeeId: employee.id,
    createdById: userId,
    currentApproverEmployeeId: employee.managerId ?? null,
  };

  const plan = await createActivityPlan(data);
  return { success: true as const, plan };
}

/**
 * Duplicate an existing ActivityPlan to a new Draft Plan
 */
export async function duplicateActivityPlanUseCase(
  originalPlanId: string,
  userId: string,
  userDetails?: { name?: string; email?: string }
) {
  const originalPlan = await findActivityPlanById(originalPlanId);
  if (!originalPlan) {
    return { success: false as const, error: "ไม่พบ Trip Plan ต้นฉบับที่ต้องการทำสำเนา" };
  }

  const employee = await findOrCreateEmployeeForUser(userId, userDetails?.name, userDetails?.email);
  if (!employee) {
    return { success: false as const, error: "ไม่สามารถสร้างหรือค้นหาโปรไฟล์พนักงานได้" };
  }

  // Work type codes
  const workTypeCodes =
    originalPlan.workTypes && originalPlan.workTypes.length > 0
      ? (originalPlan.workTypes.map((wt) => wt.activityType?.code).filter(Boolean) as string[])
      : originalPlan.activityType?.code
      ? [originalPlan.activityType.code]
      : ["TYPE_1"];

  // Stores
  const planStores = (originalPlan.stores || []).map((s) => ({
    workTypeCode: s.workTypeCode,
    storeId: s.storeId,
    storeName: s.storeName,
    remarks: s.remarks,
  }));

  // Products
  const planProducts = (originalPlan.products || []).map((p) => ({
    workTypeCode: p.workTypeCode,
    storeId: p.storeId,
    productId: p.productId,
    productName: p.productName,
    targetQuantity: p.targetQuantity,
    unitPrice: p.unitPrice ? Number(p.unitPrice) : null,
    targetAmount: p.targetAmount ? Number(p.targetAmount) : null,
  }));

  // Tour
  const tourData = originalPlan.tour
    ? {
        tourType: originalPlan.tour.tourType as "CENTRAL" | "STORE",
        tourSize: originalPlan.tour.tourSize as "SMALL" | "LARGE" | null,
        country: originalPlan.tour.country,
        storeId: originalPlan.tour.storeId,
        destination: originalPlan.tour.destination,
      }
    : null;

  // Helpers
  const helperEmployeeIds = (originalPlan.helpers || []).map((h) => h.employeeId);

  // Items
  const items = (originalPlan.items || []).map((item) => ({
    workTypeCode: item.workTypeCode,
    customerName: item.customerName,
    detail: item.detail,
    visitTopic: item.visitTopic,
    followupProductName: item.followupProductName,
    saleProductName: item.saleProductName,
    saleQuantity: item.saleQuantity,
    saleUnitPrice: item.saleUnitPrice ? Number(item.saleUnitPrice) : null,
    saleTotalPrice: item.saleTotalPrice ? Number(item.saleTotalPrice) : null,
    collectAmount: item.collectAmount ? Number(item.collectAmount) : null,
    surveyCompetitorProduct: item.surveyCompetitorProduct,
    surveyStoreName: item.surveyStoreName,
    issueType: item.issueType,
    plotActivityType: item.plotActivityType,
    plotOwnerName: item.plotOwnerName,
    plotProductName: item.plotProductName,
    plotCropCategory: item.plotCropCategory,
    plotCropName: item.plotCropName,
    plotAreaRai: item.plotAreaRai ? Number(item.plotAreaRai) : null,
    plotTreeCount: item.plotTreeCount,
    plotCount: item.plotCount,
    existingPlotId: item.existingPlotId,
    plotGrowthStage: item.plotGrowthStage,
    plotStatus: item.plotStatus,
    meetingTopic: item.meetingTopic,
    meetingAttendeesCount: item.meetingAttendeesCount,
    meetingTargetProducts: item.meetingTargetProducts,
    storeProductName: item.storeProductName,
    storeQuantityCases: item.storeQuantityCases,
    storePricePerCase: item.storePricePerCase ? Number(item.storePricePerCase) : null,
    storeTotalAmount: item.storeTotalAmount ? Number(item.storeTotalAmount) : null,
  }));

  const titlePrefix = "(สำเนา) ";
  const newTitle = originalPlan.title.startsWith(titlePrefix)
    ? originalPlan.title
    : `${titlePrefix}${originalPlan.title}`;

  const data = {
    title: newTitle,
    startDate: new Date(originalPlan.startDate),
    endDate: new Date(originalPlan.endDate),
    location: originalPlan.location,
    province: originalPlan.province ?? null,
    district: originalPlan.district ?? null,
    objective: originalPlan.objective,
    description: originalPlan.description ?? null,
    notes: originalPlan.notes ?? null,
    salesPromotionBudgetRequested: originalPlan.salesPromotionBudgetRequested
      ? Number(originalPlan.salesPromotionBudgetRequested)
      : null,
    marketingBudgetRequested: originalPlan.marketingBudgetRequested
      ? Number(originalPlan.marketingBudgetRequested)
      : null,
    status: ActivityStatus.DRAFT,
    employeeId: employee.id,
    createdById: userId,
    currentApproverEmployeeId: employee.managerId ?? null,
    workTypeCodes,
    tourData,
    planStores,
    planProducts,
    helperEmployeeIds,
    items,
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

  const { helperEmployeeIds, items, tourData, planStores, planProducts, workTypeCodes, ...planFields } = parsed.data;

  const data = {
    ...planFields,
    salesPromotionBudgetRequested: planFields.salesPromotionBudgetRequested ?? null,
    marketingBudgetRequested: planFields.marketingBudgetRequested ?? null,
    province: planFields.province ?? null,
    district: planFields.district ?? null,
    items: items ?? [],
    helperEmployeeIds,
    tourData: tourData ?? null,
    planStores: planStores ?? [],
    planProducts: planProducts ?? [],
    workTypeCodes: workTypeCodes ?? [],
    updatedUserId: userId,
  };

  const updated = await updateActivityPlan(id, data);
  return { success: true as const, plan: updated };
}

/**
 * Record post-activity result (only when plan status is APPROVED, or when ACTIVITY_PLAN_TEST_MODE is enabled)
 */
export async function recordActivityResultUseCase(
  planId: string,
  userId: string,
  rawData: unknown
) {
  const plan = await findActivityPlanById(planId);
  if (!plan) return { success: false as const, error: "ไม่พบ Trip Plan" };

  const isTestMode = isActivityPlanTestMode();
  if (plan.status !== ActivityStatus.APPROVED && !isTestMode) {
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
    discussionResult: parsed.data.discussionResult,
    productAdvice: parsed.data.productAdvice,
    salesOpportunity: parsed.data.salesOpportunity,
    problemFound: parsed.data.problemFound,
    nextAction: parsed.data.nextAction,
    nextMeetingDate: parsed.data.nextMeetingDate,
    cancelReason: parsed.data.cancelReason,
    postponedDate: parsed.data.postponedDate,
    postponedTime: parsed.data.postponedTime,
    postponedReason: parsed.data.postponedReason,
    postponedNotes: parsed.data.postponedNotes,
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
    saleResults: parsed.data.saleResults as any,
    stockResults: parsed.data.stockResults as any,
    surveyResults: parsed.data.surveyResults as any,
    demoResults: parsed.data.demoResults as any,
    attachments: parsed.data.attachments as any,
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

export {
  getDemoPlotsUseCase,
  getFarmerCustomersUseCase,
  getDemoPlotHistoryUseCase,
  recordDemoPlotVisitUseCase,
} from "./demo-plots";

export {
  getApprovalQueueDataUseCase,
} from "./approval-queue";

export {
  findEmployeeById,
  findOrCreateEmployeeForUser,
  findActivityTypes,
  findActivityTypeByCode,
  resolveActivityTypeId,
  findApprovalQueueData,
} from "../infrastructure/activity-plan.repository";
export type { ListActivityPlansParams };
