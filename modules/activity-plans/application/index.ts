import { db } from "@/lib/db";
import {
  activityPlanSchema,
  activityResultSchema,
  createSupplementalDrugWithdrawalSchema,
  type CreateSupplementalDrugWithdrawalInput,
} from "./validations";
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
  createSupplementalDrugWithdrawal,
  findSupplementalDrugWithdrawalById,
  updateSupplementalDrugWithdrawalStatus,
  deleteSupplementalDrugWithdrawal,
  type ListActivityPlansParams,
  type CreateActivityResultInput,
  type CreateActivityPlanInput,
} from "../infrastructure/activity-plan.repository";
import {
  ActivityPlanType,
  ActivityStatus,
  DrugWithdrawalStatus,
  ActivityApprovalAction,
  ActivityApprovalStep,
} from "@prisma/client";
import { isDrugWithdrawalSupported, getWorkTypeCode } from "../constants";
import { isActivityPlanTestMode } from "../config";
import { syncActivityResultToCalendarUseCase } from "./calendar-integration";
import {
  isUserAdmin,
  isUserMarketingManager,
  type ApproverUserContext,
} from "./can-approve";

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

  if (!demoPlotData.cropCategory || !demoPlotData.cropCategory.trim()) {
    return { valid: false, error: "กรุณาเลือกหมวดพืช" };
  }

  if (!demoPlotData.cropName || !demoPlotData.cropName.trim()) {
    return { valid: false, error: "กรุณาเลือกหรือระบุชื่อพืช" };
  }

  if (!demoPlotData.objective || !demoPlotData.objective.trim()) {
    return { valid: false, error: "กรุณาระบุวัตถุประสงค์การทำแปลง" };
  }

  // Check demo products if provided
  const type7aProducts = (planProducts || []).filter(
    (p) => p.workTypeCode === "TYPE_7A",
  );
  if (type7aProducts.length > 0) {
    if (!demoPlotData.categoryId || !demoPlotData.categoryId.trim()) {
      return { valid: false, error: "กรุณาเลือกหมวดสินค้า" };
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

  if (normalized.drugWithdrawal && normalized.drugWithdrawal.hasDrugWithdrawal) {
    const isSupported = normalized.workTypeCodes.some((wt) =>
      isDrugWithdrawalSupported(wt),
    );
    if (!isSupported) {
      return {
        success: false as const,
        error:
          "ประเภทกิจกรรมนี้ไม่รองรับการเบิกยา (รองรับเฉพาะ TYPE_13)",
      };
    }
  }

  const {
    helperEmployeeIds,
    items,
    tourData,
    planStores,
    planProducts,
    workTypeCodes,
    drugWithdrawal,
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
    demoPlotId: normalized.workTypeCodes.some((wt) => {
      const code = getWorkTypeCode(wt);
      return code === "TYPE_7B" || code === "TYPE_10";
    })
      ? normalized.demoPlotId
      : null,
    demoPlotData: normalized.demoPlotData,
    type13Plots: normalized.type13Plots,
    type14Data: normalized.type14Data,
    workTypeCodes: normalized.workTypeCodes,
    drugWithdrawal: normalized.drugWithdrawal,
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
    visitPurpose: s.visitPurpose ?? null,
    storeId: s.storeId,
    storeName: s.storeName,
    province: s.province ?? null,
    isUnregisteredFarmer: Boolean(s.isUnregisteredFarmer),
    unregisteredFarmerName: s.unregisteredFarmerName ?? null,
    unregisteredFarmerPhone: s.unregisteredFarmerPhone ?? null,
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
    notes: p.notes ?? null,
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

  // TYPE13 Plots
  const t13Visits = (originalPlan.demoPlotVisits || []).filter(
    (v) =>
      v.workTypeCode === "TYPE_13" || v.demoPlot?.plotType === "HATTACK",
  );

  const existingDwItems = (originalPlan as any).drugWithdrawal?.items || [];

  const type13Plots =
    t13Visits.length > 0
      ? t13Visits.map((v, idx) => {
          const plot = v.demoPlot;
          const plotName = plot?.name || `แปลงที่ ${idx + 1}`;
          const plotId = plot?.id;

          const matchedDw = existingDwItems.filter((item: any) => {
            if (plotId && item.demoPlotId && item.demoPlotId === plotId) return true;
            if (
              plotName &&
              item.plotIdentifier &&
              item.plotIdentifier.trim() === plotName.trim()
            )
              return true;
            if (
              item.plotIdentifier &&
              item.plotIdentifier.trim() === `แปลงที่ ${idx + 1}`
            )
              return true;
            return false;
          });

          return {
            id: `plot-${idx + 1}`,
            demoPlotId: null,
            name: plotName,
            storeId: plot?.customerId || "",
            ownerName: plot?.ownerName || null,
            province: plot?.province || "",
            district: plot?.district || "",
            products: [],
            hasDrugWithdrawal: matchedDw.length > 0,
            withdrawalItems: matchedDw.map((item: any, dwIdx: number) => ({
              id: `w-${idx + 1}-${dwIdx + 1}`,
              productId: item.productId,
              productName: item.productName || item.product?.name || null,
              quantity: Number(item.quantity) || 1,
              unit: item.unit || item.product?.unit || null,
              sortOrder: item.sortOrder ?? dwIdx,
            })),
          };
        })
      : undefined;

  const titlePrefix = "(สำเนา) ";
  const newTitle = originalPlan.title.startsWith(titlePrefix)
    ? originalPlan.title
    : `${titlePrefix}${originalPlan.title}`;

  // Check if plan contains TYPE_7A (ทำแปลงสาธิต), TYPE_7B (ติดตามแปลง), TYPE_10 (Field Day)
  const isType7A = workTypeCodes.some(
    (wt) => getWorkTypeCode(wt) === "TYPE_7A" || wt === "TYPE_7A",
  );
  const isType7B = workTypeCodes.some(
    (wt) => getWorkTypeCode(wt) === "TYPE_7B" || wt === "TYPE_7B",
  );
  const isType10 = workTypeCodes.some(
    (wt) => getWorkTypeCode(wt) === "TYPE_10" || wt === "TYPE_10",
  );

  const originalDemoPlot =
    originalPlan.demoPlotVisits && originalPlan.demoPlotVisits.length > 0
      ? originalPlan.demoPlotVisits[0]?.demoPlot
      : null;

  let demoPlotData: CreateActivityPlanInput["demoPlotData"] = null;
  let demoPlotId: string | null = null;

  if (isType7A && originalDemoPlot) {
    // For TYPE_7A: Deep clone demo plot data with new code/id so it does NOT share the original demo_plots record
    const rawPlotName =
      originalDemoPlot.name || originalPlan.title || "แปลงสาธิต";
    const plotTitlePrefix = "(สำเนา) ";
    const newPlotName = rawPlotName.startsWith(plotTitlePrefix)
      ? rawPlotName
      : `${plotTitlePrefix}${rawPlotName}`;

    demoPlotData = {
      name: newPlotName,
      ownerName: originalDemoPlot.ownerName || "",
      customerId: originalDemoPlot.customerId || null,
      cropCategory: originalDemoPlot.cropCategory || "",
      cropName: originalDemoPlot.cropName || "",
      customCropName: originalDemoPlot.customCropName || null,
      areaRai: originalDemoPlot.areaRai
        ? Number(originalDemoPlot.areaRai)
        : null,
      treeCount: originalDemoPlot.treeCount ?? null,
      location: originalDemoPlot.location || null,
      province: originalDemoPlot.province || null,
      district: originalDemoPlot.district || null,
      categoryId:
        (originalDemoPlot as any).categoryId ||
        (originalDemoPlot as any).chemicalGroupId ||
        null,
      objective: originalDemoPlot.objective || null,
    };
    demoPlotId = null;
  } else if (isType7B || isType10) {
    // For TYPE_7B (ติดตามแปลง) or TYPE_10 (Field Day): keep existing demoPlotId reference
    demoPlotId =
      (originalPlan.demoPlotVisits &&
        originalPlan.demoPlotVisits[0]?.demoPlotId) ||
      null;
  } else {
    // For TYPE_13 (ฉีดแปลงแฮตแทค) and other types: demo plots are managed separately via type13Plots
    demoPlotId = null;
  }

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
    demoPlotId,
    demoPlotData,
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
    type13Plots,
    drugWithdrawal: (originalPlan as any).drugWithdrawal
      ? {
          hasDrugWithdrawal: true,
          notes: (originalPlan as any).drugWithdrawal.notes ?? null,
          items: ((originalPlan as any).drugWithdrawal.items || []).map(
            (it: any) => ({
              demoPlotId: null,
              plotIdentifier: it.plotIdentifier,
              productId: it.productId,
              productName: it.productName ?? null,
              quantity: Number(it.quantity) || 0,
              unit: it.unit ?? null,
              sortOrder: it.sortOrder ?? 0,
            }),
          ),
        }
      : null,
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

  const canEdit =
    plan.status === ActivityStatus.DRAFT ||
    plan.status === ActivityStatus.WAITING_FOR_CORRECTION ||
    (plan.planType === ActivityPlanType.UNPLANNED &&
      plan.status === ActivityStatus.RETURNED);

  if (!canEdit) {
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

  if (normalized.drugWithdrawal && normalized.drugWithdrawal.hasDrugWithdrawal) {
    const isSupported = normalized.workTypeCodes.some((wt) =>
      isDrugWithdrawalSupported(wt),
    );
    if (!isSupported) {
      return {
        success: false as const,
        error:
          "ประเภทกิจกรรมนี้ไม่รองรับการเบิกยา (รองรับเฉพาะ TYPE_13)",
      };
    }
  }

  const isWithdrawalSupportedForPlan = normalized.workTypeCodes.some((wt) =>
    isDrugWithdrawalSupported(wt),
  );

  // Only evaluate withdrawal cancellation if the plan supports drug withdrawal and the field was provided
  if (
    isWithdrawalSupportedForPlan &&
    parsed.data.drugWithdrawal !== undefined &&
    (!normalized.drugWithdrawal ||
      !normalized.drugWithdrawal.hasDrugWithdrawal) &&
    (plan as any).drugWithdrawal
  ) {
    const dwStatus = (plan as any).drugWithdrawal.status;
    if (dwStatus === DrugWithdrawalStatus.PENDING_APPROVAL) {
      return {
        success: false as const,
        error:
          "ไม่สามารถยกเลิกคำขอเบิกยาที่อยู่ในสถานะรออนุมัติ (PENDING_APPROVAL) ได้",
      };
    }
    if (dwStatus === DrugWithdrawalStatus.APPROVED) {
      return {
        success: false as const,
        error:
          "ไม่สามารถยกเลิกคำขอเบิกยาที่ได้รับการอนุมัติแล้ว (APPROVED) ได้",
      };
    }
  }

  const {
    helperEmployeeIds,
    items,
    tourData,
    planStores,
    planProducts,
    workTypeCodes,
    drugWithdrawal,
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
    demoPlotId: normalized.workTypeCodes.some((wt) => {
      const code = getWorkTypeCode(wt);
      return code === "TYPE_7B" || code === "TYPE_10";
    })
      ? normalized.demoPlotId
      : null,
    demoPlotData: normalized.demoPlotData,
    type13Plots: normalized.type13Plots,
    type14Data: normalized.type14Data,
    workTypeCodes: normalized.workTypeCodes,
    drugWithdrawal:
      isWithdrawalSupportedForPlan && parsed.data.drugWithdrawal !== undefined
        ? normalized.drugWithdrawal
        : undefined,
    updatedUserId: userId,
  };

  try {
    const updated = await updateActivityPlan(id, data);
    return { success: true as const, plan: updated };
  } catch (err: any) {
    return {
      success: false as const,
      error: err.message || "เกิดข้อผิดพลาดในการแก้ไขข้อมูล",
    };
  }
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

  // Business Rule: TYPE_8 Actual requires 1-5 Registration Images on completion
  const isType8Plan =
    plan.workTypes?.some((wt) => wt.activityType?.code === "TYPE_8") ||
    plan.activityType?.code === "TYPE_8";

  if (
    isType8Plan &&
    (parsed.data.resultStatus === "COMPLETED" || !parsed.data.resultStatus)
  ) {
    const regAttachments = (parsed.data.attachments || []).filter(
      (a: any) =>
        (a.workTypeCode === "TYPE_8" ||
          a.workTypeCode === "จัดประชุม" ||
          a.workTypeCode === "จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์") &&
        (a.surveyItemId === "registration" ||
          (a.fileUrl && a.fileUrl.includes("/registration/")) ||
          (a.fileName && a.fileName.toLowerCase().includes("registration"))),
    );
    if (regAttachments.length === 0) {
      return {
        success: false as const,
        error: "กรุณาแนบรูปใบลงทะเบียนผู้เข้าร่วมงานอย่างน้อย 1 รูป",
      };
    }
    if (regAttachments.length > 5) {
      return {
        success: false as const,
        error: "รูปใบลงทะเบียนผู้เข้าร่วมงานต้องไม่เกิน 5 รูป",
      };
    }
  }

  // Business Rule: Validate Supplemental Drug Withdrawal in Actual Results
  if (parsed.data.sprayRounds && parsed.data.sprayRounds.length > 0) {
    for (const round of parsed.data.sprayRounds) {
      for (const prod of round.products || []) {
        if (prod.drugWithdrawalItemId && prod.supplementalDrugWithdrawalItemId) {
          return {
            success: false as const,
            error:
              "ไม่สามารถระบุทั้งรายการเบิกเดิมและรายการเบิกใหม่พร้อมกันในสินค้าเดียวได้",
          };
        }
        if (prod.supplementalDrugWithdrawalItemId) {
          const suppItem = await db.supplementalDrugWithdrawalItem.findUnique({
            where: { id: prod.supplementalDrugWithdrawalItemId },
            include: { supplementalDrugWithdrawal: true },
          });
          if (!suppItem) {
            return {
              success: false as const,
              error: `ไม่พบรายการเบิกยาเพิ่มเติม (ID: ${prod.supplementalDrugWithdrawalItemId})`,
            };
          }
          if (
            suppItem.supplementalDrugWithdrawal.status !==
            DrugWithdrawalStatus.APPROVED
          ) {
            return {
              success: false as const,
              error: `รายการเบิกยาเพิ่มเติม "${suppItem.productName}" ยังไม่ได้รับการอนุมัติ (APPROVED) ไม่สามารถบันทึกผลการใช้จริงได้`,
            };
          }
        }
      }
    }
  }

  const resultInput: CreateActivityResultInput = {
    activityPlanId: planId,
    actualStartDate: parsed.data.actualStartDate,
    actualEndDate: parsed.data.actualEndDate,
    actualAttendeesCount: parsed.data.actualAttendeesCount,
    resultStatus: parsed.data.resultStatus as any,
    resultSummary: parsed.data.resultSummary,
    type7aDemoPlot: parsed.data.type7aDemoPlot as any,
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
    sprayRounds: parsed.data.sprayRounds as any,
    type13PlotsActual: (parsed.data as any).type13PlotsActual,
    type13NewPlots: (parsed.data as any).type13NewPlots,
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
  getFollowUpDemoPlotsUseCase,
  getHattackFollowUpDemoPlotsUseCase,
  getHattackPlotContextUseCase,
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



export {
  canUserPerformApproval,
  getPlanActionScopes,
  isUserAdmin,
  type ApproverUserContext,
  type ActionScopeBadge,
} from "./can-approve";

export type { ListActivityPlansParams };

export {
  drugWithdrawalItemSchema,
  drugWithdrawalInputSchema,
  type DrugWithdrawalItemInput,
  type DrugWithdrawalInput,
  type ValidateDrugWithdrawalResult,
  validateDrugWithdrawal,
} from "./validations";

// ─────────────────────────────────────────────────────────────────────────────
// SUPPLEMENTAL DRUG WITHDRAWAL USE CASES
// ─────────────────────────────────────────────────────────────────────────────

async function getApproverContextForUser(userId: string): Promise<ApproverUserContext> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      employeeProfile: {
        include: {
          position: true,
          department: true,
        },
      },
      userRoles: {
        select: {
          role: {
            select: {
              slug: true,
              permissions: {
                select: {
                  permission: {
                    select: {
                      key: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      permissionOverrides: {
        select: {
          permission: {
            select: {
              key: true,
            },
          },
        },
      },
    },
  });

  const rolePermissionKeys =
    user?.userRoles?.flatMap(
      (ur) => ur.role.permissions?.map((p) => p.permission.key) || [],
    ) || [];
  const overridePermissionKeys =
    user?.permissionOverrides?.map((p) => p.permission.key) || [];
  const allPermissions = Array.from(
    new Set([...rolePermissionKeys, ...overridePermissionKeys]),
  );

  return {
    id: user?.id,
    employeeId: user?.employeeProfile?.id,
    roles: user?.userRoles?.map((r) => r.role.slug) || [],
    permissions: allPermissions,
    positionTitle:
      user?.employeeProfile?.position?.name ||
      user?.employeeProfile?.positionTitle,
    departmentCode: user?.employeeProfile?.department?.code,
  };
}

export async function createSupplementalDrugWithdrawalUseCase(
  userId: string,
  rawData: unknown,
) {
  const parsed = createSupplementalDrugWithdrawalSchema.safeParse(rawData);
  if (!parsed.success) {
    const errorMsg = parsed.error.errors.map((e) => e.message).join(", ");
    return { success: false as const, error: errorMsg };
  }

  const plan = await findActivityPlanById(parsed.data.activityPlanId);
  if (!plan) {
    return { success: false as const, error: "ไม่พบแผนกิจกรรม" };
  }

  const isTestMode = isActivityPlanTestMode();
  if (plan.status !== ActivityStatus.APPROVED && !isTestMode) {
    return {
      success: false as const,
      error: "สามารถขอเบิกยาเพิ่มเติมได้เฉพาะแผนกิจกรรมที่ได้รับการอนุมัติแล้วเท่านั้น",
    };
  }

  const requesterEmployee = await findOrCreateEmployeeForUser(userId);
  if (!requesterEmployee) {
    return { success: false as const, error: "ไม่พบข้อมูลพนักงานของผู้ขอเบิก" };
  }

  const initialStatus = parsed.data.autoSubmit
    ? DrugWithdrawalStatus.PENDING_APPROVAL
    : DrugWithdrawalStatus.DRAFT;

  const withdrawal = await createSupplementalDrugWithdrawal(db, {
    activityPlanId: parsed.data.activityPlanId,
    requestedById: requesterEmployee.id,
    status: initialStatus,
    notes: parsed.data.notes,
    items: parsed.data.items,
  });

  return { success: true as const, withdrawal };
}

export async function submitSupplementalDrugWithdrawalUseCase(
  withdrawalId: string,
  userId: string,
) {
  const withdrawal = await findSupplementalDrugWithdrawalById(withdrawalId);
  if (!withdrawal) {
    return { success: false as const, error: "ไม่พบรายการเบิกยาเพิ่มเติม" };
  }

  if (
    withdrawal.status !== DrugWithdrawalStatus.DRAFT &&
    withdrawal.status !== DrugWithdrawalStatus.RETURNED
  ) {
    return {
      success: false as const,
      error: `ไม่สามารถส่งขออนุมัติรายการในสถานะ '${withdrawal.status}' ได้`,
    };
  }

  const updated = await updateSupplementalDrugWithdrawalStatus(
    db,
    withdrawalId,
    {
      status: DrugWithdrawalStatus.PENDING_APPROVAL,
      rejectionReason: null,
    },
  );

  return { success: true as const, withdrawal: updated };
}

export async function approveSupplementalDrugWithdrawalUseCase(
  withdrawalId: string,
  userId: string,
  comment?: string,
) {
  const withdrawal = await findSupplementalDrugWithdrawalById(withdrawalId);
  if (!withdrawal) {
    return { success: false as const, error: "ไม่พบรายการเบิกยาเพิ่มเติม" };
  }

  if (withdrawal.status !== DrugWithdrawalStatus.PENDING_APPROVAL) {
    return {
      success: false as const,
      error: `รายการนี้ไม่อยู่ในสถานะรออนุมัติ (สถานะปัจจุบัน: ${withdrawal.status})`,
    };
  }

  const approverCtx = await getApproverContextForUser(userId);
  const canApprove =
    isUserAdmin(approverCtx) ||
    isUserMarketingManager(approverCtx) ||
    isActivityPlanTestMode();

  if (!canApprove) {
    return {
      success: false as const,
      error: "คุณไม่มีสิทธิ์อนุมัติรายการเบิกยาเพิ่มเติม (ต้องเป็น Marketing Manager หรือ Admin)",
    };
  }

  return db.$transaction(async (tx) => {
    const updated = await updateSupplementalDrugWithdrawalStatus(
      tx,
      withdrawalId,
      {
        status: DrugWithdrawalStatus.APPROVED,
        approvedById: approverCtx.employeeId || null,
        approvedAt: new Date(),
        rejectionReason: null,
      },
    );

    // Record approval log according to project pattern
    await tx.activityApprovalLog.create({
      data: {
        activityPlanId: withdrawal.activityPlanId,
        userId,
        action: ActivityApprovalAction.APPROVE,
        step: ActivityApprovalStep.BUDGET_APPROVAL,
        comment:
          comment ||
          "อนุมัติรายการเบิกยาเพิ่มเติมในการติดตามรอบนี้ (Supplemental Drug Withdrawal)",
      },
    });

    return { success: true as const, withdrawal: updated };
  });
}

export async function returnSupplementalDrugWithdrawalUseCase(
  withdrawalId: string,
  userId: string,
  reason: string,
) {
  if (!reason || !reason.trim()) {
    return { success: false as const, error: "กรุณาระบุเหตุผลการไม่อนุมัติ/ส่งคืน" };
  }

  const withdrawal = await findSupplementalDrugWithdrawalById(withdrawalId);
  if (!withdrawal) {
    return { success: false as const, error: "ไม่พบรายการเบิกยาเพิ่มเติม" };
  }

  if (withdrawal.status !== DrugWithdrawalStatus.PENDING_APPROVAL) {
    return {
      success: false as const,
      error: `รายการนี้ไม่อยู่ในสถานะรออนุมัติ (สถานะปัจจุบัน: ${withdrawal.status})`,
    };
  }

  const approverCtx = await getApproverContextForUser(userId);
  const canApprove =
    isUserAdmin(approverCtx) ||
    isUserMarketingManager(approverCtx) ||
    isActivityPlanTestMode();

  if (!canApprove) {
    return {
      success: false as const,
      error: "คุณไม่มีสิทธิ์ดำเนินการนี้ (ต้องเป็น Marketing Manager หรือ Admin)",
    };
  }

  return db.$transaction(async (tx) => {
    const updated = await updateSupplementalDrugWithdrawalStatus(
      tx,
      withdrawalId,
      {
        status: DrugWithdrawalStatus.RETURNED,
        approvedById: approverCtx.employeeId || null,
        rejectionReason: reason.trim(),
      },
    );

    await tx.activityApprovalLog.create({
      data: {
        activityPlanId: withdrawal.activityPlanId,
        userId,
        action: ActivityApprovalAction.REJECT,
        step: ActivityApprovalStep.BUDGET_APPROVAL,
        comment: reason.trim(),
      },
    });

    return { success: true as const, withdrawal: updated };
  });
}

export async function deleteSupplementalDrugWithdrawalUseCase(
  withdrawalId: string,
  userId: string,
) {
  const withdrawal = await findSupplementalDrugWithdrawalById(withdrawalId);
  if (!withdrawal) {
    return { success: false as const, error: "ไม่พบรายการเบิกยาเพิ่มเติม" };
  }

  if (
    withdrawal.status !== DrugWithdrawalStatus.DRAFT &&
    withdrawal.status !== DrugWithdrawalStatus.RETURNED
  ) {
    return {
      success: false as const,
      error: "สามารถลบได้เฉพาะรายการที่อยู่ในสถานะแบบร่าง (DRAFT) หรือส่งคืน (RETURNED) เท่านั้น",
    };
  }

  await deleteSupplementalDrugWithdrawal(db, withdrawalId);
  return { success: true as const };
}

export * from "./demo-plots";

