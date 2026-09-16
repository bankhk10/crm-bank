import { db } from "@/lib/db";
import { activityPlanSchema, activityResultSchema } from "./validations";
import { normalizePlanInput } from "./plan-mapper";
import {
  findActivityPlanById,
  findActivityPlans,
  createActivityPlan,
  updateActivityPlan,
  softDeleteActivityPlan,
  upsertActivityResult,
  findActivityTypes,
  findProductCategories,
  findOrCreateEmployeeForUser,
  type ListActivityPlansParams,
  type CreateActivityResultInput,
} from "../infrastructure/activity-plan.repository";
import { ActivityStatus } from "@prisma/client";
import { isActivityPlanTestMode } from "../config";
import { syncActivityResultToCalendarUseCase } from "./calendar-integration";

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
export async function listActivityPlansUseCase(
  params: ListActivityPlansParams,
) {
  return findActivityPlans(params);
}

/**
 * Get all activity type master lookups
 */
export async function getActivityTypesUseCase() {
  return findActivityTypes();
}

/**
 * Get product categories (ProductCategory) master lookups
 */
export async function getProductCategoriesUseCase() {
  return findProductCategories();
}

export async function validateType7aPlan(
  workTypeCodes: string[],
  demoPlotData?: {
    name: string;
    customerId?: string | null;
    province?: string | null;
    district?: string | null;
    categoryId?: string | null;
    cropCategory: string;
    cropName: string;
    objective?: string | null;
  } | null,
  planProducts?: Array<{
    workTypeCode: string;
    productId: string;
    targetQuantity?: number | null;
  }>,
): Promise<{ valid: true } | { valid: false; error: string }> {
  if (!workTypeCodes.includes("TYPE_7A")) {
    return { valid: true };
  }

  if (!demoPlotData) {
    return {
      valid: false,
      error: "กรุณาระบุข้อมูลแปลงสาธิตสำหรับประเภทงานทำแปลงสาธิต",
    };
  }

  if (!demoPlotData.name || !demoPlotData.name.trim()) {
    return { valid: false, error: "กรุณากรอกชื่อแปลงสาธิต" };
  }

  if (!demoPlotData.customerId) {
    return {
      valid: false,
      error: "กรุณาเลือกร้านค้า Dealer สำหรับแปลงสาธิต",
    };
  }

  const customer = await db.customer.findUnique({
    where: { id: demoPlotData.customerId },
    select: { id: true, customerType: true },
  });
  if (!customer) {
    return { valid: false, error: "ไม่พบข้อมูลร้านค้า Dealer ในระบบ" };
  }
  if (customer.customerType !== "DEALER") {
    return {
      valid: false,
      error:
        "ร้านค้าของแปลงสาธิตต้องเป็นประเภทร้านค้าตัวแทนจำหน่าย (DEALER) เท่านั้น",
    };
  }

  if (!demoPlotData.province || !demoPlotData.province.trim()) {
    return { valid: false, error: "กรุณาเลือกจังหวัด" };
  }

  if (!demoPlotData.district || !demoPlotData.district.trim()) {
    return { valid: false, error: "กรุณาเลือกอำเภอ" };
  }

  if (!demoPlotData.categoryId || !demoPlotData.categoryId.trim()) {
    return { valid: false, error: "กรุณาเลือกหมวดสินค้า" };
  }

  if (!demoPlotData.cropCategory || !demoPlotData.cropCategory.trim()) {
    return { valid: false, error: "กรุณาเลือกหมวดพืช" };
  }

  if (!demoPlotData.cropName || !demoPlotData.cropName.trim()) {
    return { valid: false, error: "กรุณาเลือกหรือระบุชื่อพืช" };
  }

  if (!demoPlotData.objective || !demoPlotData.objective.trim()) {
    return { valid: false, error: "กรุณาระบุวัตถุประสงค์การทำแปลง" };
  }

  // Check demo products
  const type7aProducts = (planProducts || []).filter(
    (p) => p.workTypeCode === "TYPE_7A",
  );
  if (type7aProducts.length === 0) {
    return {
      valid: false,
      error: "กรุณาระบุสินค้าที่จะสาธิตอย่างน้อย 1 รายการ",
    };
  }

  for (const p of type7aProducts) {
    if (!p.productId) {
      return { valid: false, error: "กรุณาเลือกสินค้าที่จะสาธิต" };
    }
    if (!p.targetQuantity || p.targetQuantity <= 0) {
      return {
        valid: false,
        error: "จำนวนสินค้าที่จะสาธิตต้องมากกว่า 0",
      };
    }
  }

  // Validate that all selected products belong to the selected category
  const productIds = type7aProducts.map((p) => p.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, categoryId: true },
  });

  for (const p of products) {
    if (p.categoryId !== demoPlotData.categoryId) {
      return {
        valid: false,
        error: `สินค้า "${p.name}" ไม่ได้อยู่ในหมวดสินค้าที่เลือก กรุณาเลือกสินค้าให้ตรงกับหมวดสินค้า`,
      };
    }
  }

  return { valid: true };
}

export async function validateType1VisitPurposeCustomers(
  planStores: Array<{
    workTypeCode: string;
    visitPurpose?: "FARMER" | "STORE" | null;
    storeId?: string | null;
    isUnregisteredFarmer?: boolean;
  }>,
): Promise<{ valid: true } | { valid: false; error: string }> {
  for (const s of planStores) {
    if (s.workTypeCode === "TYPE_1" || s.workTypeCode === "TYPE_2") {
      const purpose = s.visitPurpose || "FARMER";
      if (purpose === "FARMER") {
        if (!s.isUnregisteredFarmer && s.storeId) {
          const customer = await db.customer.findUnique({
            where: { id: s.storeId },
            select: { id: true, customerType: true },
          });
          if (!customer) {
            return { valid: false, error: "ไม่พบข้อมูลเกษตรกรในระบบ" };
          }
          if (customer.customerType !== "FARMER") {
            return {
              valid: false,
              error:
                "วัตถุประสงค์เข้าพบเกษตรกร อนุญาตเฉพาะลูกค้าประเภทเกษตรกร (FARMER) เท่านั้น",
            };
          }
        }
      } else if (purpose === "STORE") {
        if (s.isUnregisteredFarmer) {
          return {
            valid: false,
            error: "วัตถุประสงค์เข้าพบร้านค้า ไม่อนุญาตให้ระบุว่าไม่มีในระบบ",
          };
        }
        if (!s.storeId) {
          return { valid: false, error: "กรุณาเลือกร้านค้า" };
        }
        const customer = await db.customer.findUnique({
          where: { id: s.storeId },
          select: { id: true, customerType: true },
        });
        if (!customer) {
          return { valid: false, error: "ไม่พบข้อมูลร้านค้าในระบบ" };
        }
        if (
          customer.customerType !== "DEALER" &&
          customer.customerType !== "SUBDEALER"
        ) {
          return {
            valid: false,
            error:
              "วัตถุประสงค์เข้าพบร้านค้า อนุญาตเฉพาะร้านค้าตัวแทนจำหน่าย (DEALER) หรือร้านค้าย่อย (SUBDEALER) เท่านั้น",
          };
        }
      }
    }
  }
  return { valid: true };
}

/**
 * Create a new ActivityPlan (Draft by default)
 */
export async function createActivityPlanUseCase(
  userId: string,
  rawData: unknown,
  userDetails?: { name?: string; email?: string },
) {
  const parsed = activityPlanSchema.safeParse(rawData);
  if (!parsed.success) {
    const errorMsg = parsed.error.errors.map((e) => e.message).join(", ");
    return { success: false as const, error: errorMsg };
  }

  const employee = await findOrCreateEmployeeForUser(
    userId,
    userDetails?.name,
    userDetails?.email,
  );
  if (!employee) {
    return {
      success: false as const,
      error: "ไม่สามารถสร้างหรือค้นหาโปรไฟล์พนักงานได้",
    };
  }

  const normalized = normalizePlanInput(parsed.data);

  const customerValidation = await validateType1VisitPurposeCustomers(
    normalized.planStores,
  );
  if (!customerValidation.valid) {
    return { success: false as const, error: customerValidation.error };
  }

  const type7aValidation = await validateType7aPlan(
    normalized.workTypeCodes,
    normalized.demoPlotData,
    normalized.planProducts,
  );
  if (!type7aValidation.valid) {
    return { success: false as const, error: type7aValidation.error };
  }

  const {
    helperEmployeeIds,
    items,
    tourData,
    planStores,
    planProducts,
    workTypeCodes,
    ...planFields
  } = parsed.data;

  const data = {
    ...planFields,
    salesPromotionBudgetRequested:
      planFields.salesPromotionBudgetRequested ?? null,
    marketingBudgetRequested: planFields.marketingBudgetRequested ?? null,
    province: planFields.province ?? null,
    district: planFields.district ?? null,
    helperEmployeeIds: normalized.helperEmployeeIds,
    tourData: normalized.tourData,
    planStores: normalized.planStores,
    planProducts: normalized.planProducts,
    marketingItems: normalized.marketingItems,
    promotionItems: normalized.promotionItems,
    targetAttendeesCount: normalized.targetAttendeesCount,
    targetBookingSales: normalized.targetBookingSales,
    demoPlotId: normalized.demoPlotId,
    demoPlotData: normalized.demoPlotData,
    workTypeCodes: normalized.workTypeCodes,
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
  userDetails?: { name?: string; email?: string },
) {
  const originalPlan = await findActivityPlanById(originalPlanId);
  if (!originalPlan) {
    return {
      success: false as const,
      error: "ไม่พบ Trip Plan ต้นฉบับที่ต้องการทำสำเนา",
    };
  }

  const employee = await findOrCreateEmployeeForUser(
    userId,
    userDetails?.name,
    userDetails?.email,
  );
  if (!employee) {
    return {
      success: false as const,
      error: "ไม่สามารถสร้างหรือค้นหาโปรไฟล์พนักงานได้",
    };
  }

  // Work type codes
  const workTypeCodes =
    originalPlan.workTypes && originalPlan.workTypes.length > 0
      ? (originalPlan.workTypes
          .map((wt) => wt.activityType?.code)
          .filter(Boolean) as string[])
      : originalPlan.activityType?.code
        ? [originalPlan.activityType.code]
        : ["TYPE_1"];

  // Stores
  const planStores = (originalPlan.stores || []).map((s) => ({
    workTypeCode: s.workTypeCode,
    storeId: s.storeId,
    storeName: s.storeName,
    targetAmount: s.targetAmount ? Number(s.targetAmount) : null,
    subDealerStore: s.subDealerStore,
    remarks: s.remarks,
    notes: s.notes,
  }));

  // Products
  const planProducts = (originalPlan.products || []).map((p) => ({
    workTypeCode: p.workTypeCode,
    storeId: p.storeId,
    productId: p.productId,
    productName: p.productName,
    masterPrice: p.masterPrice ? Number(p.masterPrice) : null,
    unitPrice: p.unitPrice ? Number(p.unitPrice) : null,
    isPriceOverridden: p.isPriceOverridden,
    targetQuantity: p.targetQuantity,
    targetAmount: p.targetAmount ? Number(p.targetAmount) : null,
  }));

  // Marketing Items
  const marketingItems = (originalPlan.marketingItems || []).map((m) => ({
    category: m.category,
    materialName: m.materialName,
    unit: m.unit,
    unitPrice: m.unitPrice ? Number(m.unitPrice) : null,
    quantity: m.quantity,
    totalAmount: m.totalAmount ? Number(m.totalAmount) : null,
  }));

  // Promotion Items
  const promotionItems = (originalPlan.promotionItems || []).map((p) => ({
    budgetType: p.budgetType,
    detail: p.detail,
    amount: p.amount ? Number(p.amount) : null,
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
  const helperEmployeeIds = (originalPlan.helpers || []).map(
    (h) => h.employeeId,
  );

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
    targetAttendeesCount: originalPlan.targetAttendeesCount ?? null,
    targetBookingSales: originalPlan.targetBookingSales
      ? Number(originalPlan.targetBookingSales)
      : null,
    demoPlotId:
      (originalPlan.demoPlotVisits &&
        originalPlan.demoPlotVisits[0]?.demoPlotId) ||
      null,
    status: ActivityStatus.DRAFT,
    employeeId: employee.id,
    createdById: userId,
    currentApproverEmployeeId: employee.managerId ?? null,
    workTypeCodes,
    tourData,
    planStores,
    planProducts,
    marketingItems,
    promotionItems,
    helperEmployeeIds,
  };

  const plan = await createActivityPlan(data);
  return { success: true as const, plan };
}

/**
 * Update an existing ActivityPlan
 */
export async function updateActivityPlanUseCase(
  id: string,
  userId: string,
  rawData: unknown,
) {
  const parsed = activityPlanSchema.safeParse(rawData);
  if (!parsed.success) {
    const errorMsg = parsed.error.errors.map((e) => e.message).join(", ");
    return { success: false as const, error: errorMsg };
  }

  const plan = await findActivityPlanById(id);
  if (!plan) return { success: false as const, error: "ไม่พบ Trip Plan" };

  if (plan.createdById !== userId) {
    const userRole = await db.userRole.findFirst({
      where: {
        userId,
        deletedAt: null,
        role: { slug: { in: ["administrator", "admin", "ceo"] } },
      },
    });
    if (!userRole) {
      return {
        success: false as const,
        error: "คุณไม่มีสิทธิ์แก้ไข Trip Plan นี้",
      };
    }
  }

  if (
    plan.status !== ActivityStatus.DRAFT &&
    plan.status !== ActivityStatus.WAITING_FOR_CORRECTION
  ) {
    return {
      success: false as const,
      error: "สามารถแก้ไขได้เฉพาะ Trip Plan ในสถานะร่างหรือรอแก้ไขเท่านั้น",
    };
  }

  const normalized = normalizePlanInput(parsed.data);

  // Safeguard against accidental work type data loss during edit
  if (
    plan.workTypes &&
    plan.workTypes.length > 0 &&
    (!normalized.workTypeCodes || normalized.workTypeCodes.length === 0)
  ) {
    return {
      success: false as const,
      error:
        "ไม่สามารถบันทึกได้เนื่องจากไม่มีข้อมูลประเภทงาน เพื่อป้องกันข้อมูลสูญหาย กรุณาเลือกประเภทงานอย่างน้อย 1 ประเภท",
    };
  }

  const customerValidation = await validateType1VisitPurposeCustomers(
    normalized.planStores,
  );
  if (!customerValidation.valid) {
    return { success: false as const, error: customerValidation.error };
  }

  const type7aValidation = await validateType7aPlan(
    normalized.workTypeCodes,
    normalized.demoPlotData,
    normalized.planProducts,
  );
  if (!type7aValidation.valid) {
    return { success: false as const, error: type7aValidation.error };
  }

  const {
    helperEmployeeIds,
    items,
    tourData,
    planStores,
    planProducts,
    workTypeCodes,
    ...planFields
  } = parsed.data;

  const data = {
    ...planFields,
    salesPromotionBudgetRequested:
      planFields.salesPromotionBudgetRequested ?? null,
    marketingBudgetRequested: planFields.marketingBudgetRequested ?? null,
    province: planFields.province ?? null,
    district: planFields.district ?? null,
    helperEmployeeIds: normalized.helperEmployeeIds,
    tourData: normalized.tourData,
    planStores: normalized.planStores,
    planProducts: normalized.planProducts,
    marketingItems: normalized.marketingItems,
    promotionItems: normalized.promotionItems,
    targetAttendeesCount: normalized.targetAttendeesCount,
    targetBookingSales: normalized.targetBookingSales,
    demoPlotId: normalized.demoPlotId,
    demoPlotData: normalized.demoPlotData,
    workTypeCodes: normalized.workTypeCodes,
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
  rawData: unknown,
) {
  const plan = await findActivityPlanById(planId);
  if (!plan) return { success: false as const, error: "ไม่พบ Trip Plan" };

  const isTestMode = isActivityPlanTestMode();
  if (plan.status !== ActivityStatus.APPROVED && !isTestMode) {
    return {
      success: false as const,
      error:
        "สามารถบันทึกผลได้เฉพาะแผนกิจกรรมที่ได้รับการอนุมัติเรียบร้อยแล้วเท่านั้น",
    };
  }

  // Verify Creator ownership: ONLY the creator (or super admin) can record/edit actual results
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      employeeProfile: { select: { id: true } },
      userRoles: { select: { role: { select: { slug: true } } } },
    },
  });

  const isSuperAdmin = user?.userRoles?.some((r) =>
    ["administrator", "admin", "ceo"].includes(r.role.slug),
  );

  const isCreator =
    plan.createdById === userId ||
    (user?.employeeProfile && plan.employeeId === user.employeeProfile.id);

  if (!isCreator && !isSuperAdmin) {
    return {
      success: false as const,
      error:
        "เฉพาะผู้สร้างแผนงาน (Creator) เท่านั้นที่มีสิทธิ์บันทึกผลการปฏิบัติงานจริง",
    };
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
    farmerHomeAddress: parsed.data.farmerHomeAddress,
    plotLatitude: parsed.data.plotLatitude,
    plotLongitude: parsed.data.plotLongitude,
    recordedById: userId,
    saleResults: parsed.data.saleResults as any,
    stockResults: parsed.data.stockResults as any,
    surveyResults: parsed.data.surveyResults as any,
    demoResults: parsed.data.demoResults as any,
    followupResults: parsed.data.followupResults as any,
    issueResults: parsed.data.issueResults as any,
    attachments: parsed.data.attachments as any,
  };

  const activityResult = await db.$transaction(async (tx) => {
    const res = await upsertActivityResult(resultInput, tx);
    await syncActivityResultToCalendarUseCase(
      planId,
      parsed.data.resultStatus,
      tx,
    );
    return res;
  });

  return { success: true as const, result: activityResult };
}

/**
 * Delete a plan
 */
export async function deleteActivityPlanUseCase(id: string, userId: string) {
  const plan = await findActivityPlanById(id);
  if (!plan) return { success: false as const, error: "ไม่พบแผนกิจกรรม" };

  if (plan.createdById !== userId) {
    const userRole = await db.userRole.findFirst({
      where: {
        userId,
        deletedAt: null,
        role: { slug: { in: ["administrator", "admin", "ceo"] } },
      },
    });
    if (!userRole) {
      return {
        success: false as const,
        error: "คุณไม่มีสิทธิ์ลบแผนกิจกรรมนี้",
      };
    }
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
  reviewSingleActivityHelperUseCase,
} from "./activity-plan-flow";

export {
  syncActivityPlanToCalendarUseCase,
  cancelActivityPlanCalendarUseCase,
  syncActivityResultToCalendarUseCase,
  listActivityCalendarEventsUseCase,
  type ListCalendarEventsParams,
} from "./calendar-integration";

export {
  getDemoPlotsUseCase,
  getFarmerCustomersUseCase,
  getDemoPlotHistoryUseCase,
  recordDemoPlotVisitUseCase,
} from "./demo-plots";

export { getApprovalQueueDataUseCase } from "./approval-queue";

export {
  findEmployeeById,
  findOrCreateEmployeeForUser,
  findActivityTypes,
  findActivityTypeByCode,
  resolveActivityTypeId,
  findApprovalQueueData,
} from "../infrastructure/activity-plan.repository";
export {
  getApproverDirectoryUseCase,
  formatEmployeeName,
  type ApproverDirectory,
} from "./approver-directory";

export { normalizePlanInput, type NormalizedPlanData } from "./plan-mapper";

export type { ListActivityPlansParams };
