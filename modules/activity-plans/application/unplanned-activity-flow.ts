import { db } from "@/lib/db";
import {
  ActivityPlanType,
  ActivityStatus,
  ActivityApprovalAction,
  ActivityApprovalStep,
  ActivityResultStatus,
  Prisma,
} from "@prisma/client";
import {
  createActivityPlan,
  upsertActivityResult,
  type CreateActivityResultInput,
} from "../infrastructure/activity-plan.repository";
import { getWorkTypeCode } from "../constants";

// ────────────────────────────────────────────────────────
// Work Type Validation for Unplanned Activity
// ────────────────────────────────────────────────────────

export const UNPLANNED_SUPPORTED_WORK_TYPES = [
  "TYPE_1",
  "TYPE_2",
  "TYPE_3",
  "TYPE_4",
  "TYPE_5",
  "TYPE_6",
  "TYPE_7A",
  "TYPE_7B",
  "TYPE_8",
  "TYPE_9",
  "TYPE_10",
  "TYPE_11",
  "TYPE_13",
] as const;

export const UNPLANNED_DISALLOWED_WORK_TYPES = ["TYPE_12", "TYPE_14"] as const;

export function validateUnplannedWorkTypes(workTypeCodes: string[]): {
  valid: boolean;
  error?: string;
} {
  if (!workTypeCodes || workTypeCodes.length === 0) {
    return {
      valid: false,
      error: "กรุณาระบุประเภทงานอย่างน้อย 1 ประเภทสำหรับกิจกรรมนอกแผนงาน",
    };
  }

  for (const rawCode of workTypeCodes) {
    const code = getWorkTypeCode(rawCode);
    if ((UNPLANNED_DISALLOWED_WORK_TYPES as readonly string[]).includes(code)) {
      return {
        valid: false,
        error: `กิจกรรมนอกแผนงานไม่รองรับประเภทงาน ${code}`,
      };
    }
    if (!(UNPLANNED_SUPPORTED_WORK_TYPES as readonly string[]).includes(code)) {
      return {
        valid: false,
        error: `ประเภทงาน ${code} ไม่ได้รับการรองรับสำหรับกิจกรรมนอกแผนงาน`,
      };
    }
  }

  return { valid: true };
}

// ────────────────────────────────────────────────────────
// Notification Helper (Transaction-Safe)
// ────────────────────────────────────────────────────────

async function notifyEmployee(
  employeeId: string | null,
  title: string,
  message: string,
  type: any,
  link: string,
  tx: Prisma.TransactionClient,
) {
  if (!employeeId) return;
  const emp = await tx.employee.findUnique({
    where: { id: employeeId, deletedAt: null },
    select: { userId: true },
  });
  if (emp?.userId) {
    await tx.notification.create({
      data: {
        userId: emp.userId,
        title,
        message,
        type,
        link,
      },
    });
  }
}

// ────────────────────────────────────────────────────────
// 1. Create Unplanned Activity
// ────────────────────────────────────────────────────────

export interface CreateUnplannedActivityInput {
  title: string;
  startDate: Date | string;
  endDate: Date | string;
  location?: string | null;
  province?: string | null;
  district?: string | null;
  objective?: string;
  description?: string | null;
  notes?: string | null;
  workTypeCodes: string[];
  planStores?: Array<{
    workTypeCode: string;
    visitPurpose?: string | null;
    storeId?: string | null;
    storeName?: string | null;
    province?: string | null;
    isUnregisteredFarmer?: boolean;
    unregisteredFarmerName?: string | null;
    unregisteredFarmerPhone?: string | null;
    targetAmount?: number | null;
    subDealerStore?: string | null;
    remarks?: string | null;
    notes?: string | null;
  }>;
  actualResult?: Partial<CreateActivityResultInput>;
  submitImmediately?: boolean;
  status?: ActivityStatus;
}

export async function createUnplannedActivityUseCase(
  userId: string,
  input: CreateUnplannedActivityInput,
  userDetails?: { name?: string; email?: string },
) {
  // 1. Employee profile lookup
  let employee = await db.employee.findFirst({
    where: { userId, status: "ACTIVE" },
  });

  if (!employee && userDetails?.email) {
    employee = await db.employee.findFirst({
      where: { email: userDetails.email, status: "ACTIVE" },
    });
    if (employee && !employee.userId) {
      employee = await db.employee.update({
        where: { id: employee.id },
        data: { userId },
      });
    }
  }

  if (!employee) {
    return {
      success: false as const,
      error: "ไม่สามารถสร้างหรือค้นหาโปรไฟล์พนักงานได้",
    };
  }

  // 2. Validate work types
  const workTypeValidation = validateUnplannedWorkTypes(input.workTypeCodes);
  if (!workTypeValidation.valid) {
    return {
      success: false as const,
      error: workTypeValidation.error || "ประเภทงานไม่ถูกต้อง",
    };
  }

  // 3. Determine status and reviewer
  const isSubmit =
    input.submitImmediately === true ||
    input.status === ActivityStatus.PENDING_REVIEW;
  const initialStatus = isSubmit
    ? ActivityStatus.PENDING_REVIEW
    : ActivityStatus.DRAFT;
  const reviewerEmployeeId = employee.managerId ?? null;

  // 4. Execute atomic transaction (ActivityPlan + ActivityResult)
  const result = await db.$transaction(async (tx) => {
    // 4.1 Create ActivityPlan header
    const plan = await createActivityPlan(
      {
        title: input.title,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        location: input.location ?? null,
        province: input.province ?? null,
        district: input.district ?? null,
        objective: input.objective || "บันทึกกิจกรรมนอกแผนงาน",
        description: input.description ?? null,
        notes: input.notes ?? null,
        workTypeCodes: input.workTypeCodes,
        planStores: input.planStores,
        // Unplanned restrictions
        planType: ActivityPlanType.UNPLANNED,
        salesPromotionBudgetRequested: null,
        marketingBudgetRequested: null,
        totalBudgetRequested: 0,
        planProducts: [],
        marketingItems: [],
        promotionItems: [],
        tourData: null,
        helperEmployeeIds: [],
        status: initialStatus,
        employeeId: employee.id,
        createdById: userId,
        currentApproverEmployeeId: reviewerEmployeeId,
      },
      tx,
    );

    // 4.2 Create ActivityResult in same transaction
    const actualData = input.actualResult || {};
    const createdResult = await upsertActivityResult(
      {
        activityPlanId: plan.id,
        actualStartDate: actualData.actualStartDate
          ? new Date(actualData.actualStartDate)
          : plan.startDate,
        actualEndDate: actualData.actualEndDate
          ? new Date(actualData.actualEndDate)
          : plan.endDate,
        resultStatus: actualData.resultStatus ?? ActivityResultStatus.COMPLETED,
        resultSummary: actualData.resultSummary ?? null,
        discussionResult: actualData.discussionResult ?? null,
        productAdvice: actualData.productAdvice ?? null,
        salesOpportunity: actualData.salesOpportunity ?? null,
        problemFound: actualData.problemFound ?? null,
        nextAction: actualData.nextAction ?? null,
        nextMeetingDate: actualData.nextMeetingDate
          ? new Date(actualData.nextMeetingDate)
          : null,
        farmerHomeAddress: actualData.farmerHomeAddress ?? null,
        plotLatitude: actualData.plotLatitude ?? null,
        plotLongitude: actualData.plotLongitude ?? null,
        actualSalesPromotionSpent: actualData.actualSalesPromotionSpent ?? null,
        actualMarketingSpent: actualData.actualMarketingSpent ?? null,
        salesResultAmount: actualData.salesResultAmount ?? null,
        salesOrdersCount: actualData.salesOrdersCount ?? null,
        collectResultAmount: actualData.collectResultAmount ?? null,
        actualAttendeesCount: actualData.actualAttendeesCount ?? null,
        distributorsCount: actualData.distributorsCount ?? null,
        farmersCount: actualData.farmersCount ?? null,
        saleResults: actualData.saleResults,
        stockResults: actualData.stockResults,
        surveyResults: actualData.surveyResults,
        demoResults: actualData.demoResults,
        followupResults: actualData.followupResults,
        issueResults: actualData.issueResults,
        sprayRounds: actualData.sprayRounds,
        attachments: actualData.attachments,
        recordedById: userId,
      },
      tx,
    );

    // 4.3 Create Approval Log if submitted immediately
    if (isSubmit) {
      await tx.activityPlan.update({
        where: { id: plan.id },
        data: {
          submittedAt: new Date(),
        },
      });

      await tx.activityApprovalLog.create({
        data: {
          activityPlanId: plan.id,
          userId,
          action: ActivityApprovalAction.SUBMIT,
          step: ActivityApprovalStep.POST_ACTIVITY_REVIEW,
          fromStatus: ActivityStatus.DRAFT,
          toStatus: ActivityStatus.PENDING_REVIEW,
          comment: "บันทึกและส่งผลการปฏิบัติงานนอกแผนงานเพื่อรอตรวจสอบ",
        },
      });

      if (reviewerEmployeeId) {
        await notifyEmployee(
          reviewerEmployeeId,
          "กิจกรรมนอกแผนงานรอการตรวจสอบ",
          `กิจกรรมนอกแผนงาน "${plan.title}" โดย ${employee.name} รอคุณตรวจสอบผลการปฏิบัติงาน`,
          "INFO",
          `/activity-plans/${plan.id}`,
          tx,
        );
      }
    }

    return { plan, result: createdResult };
  });

  return { success: true as const, plan: result.plan, result: result.result };
}

// ────────────────────────────────────────────────────────
// 2. Submit Unplanned Activity
// ────────────────────────────────────────────────────────

export async function submitUnplannedActivityUseCase(
  planId: string,
  userId: string,
  comment?: string,
) {
  const plan = await db.activityPlan.findUnique({
    where: { id: planId, deletedAt: null },
    include: {
      employee: true,
    },
  });

  if (!plan) {
    return { success: false as const, error: "ไม่พบกิจกรรม" };
  }

  if (plan.planType !== ActivityPlanType.UNPLANNED) {
    return {
      success: false as const,
      error: "รายการนี้ไม่ใช่กิจกรรมนอกแผนงาน",
    };
  }

  if (
    plan.status !== ActivityStatus.DRAFT &&
    plan.status !== ActivityStatus.RETURNED
  ) {
    return {
      success: false as const,
      error:
        "สามารถส่งตรวจสอบได้เฉพาะกิจกรรมในสถานะร่างหรือถูกส่งกลับแก้ไขเท่านั้น",
    };
  }

  // Security check: Only creator or admin can submit
  if (plan.createdById !== userId) {
    const userRoles = await db.userRole.findMany({
      where: { userId, deletedAt: null },
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } },
          },
        },
      },
    });

    const isAuthorized = userRoles.some(
      (ur) =>
        ["administrator", "admin", "ceo"].includes(
          ur.role.slug.toLowerCase(),
        ) ||
        ur.role.permissions.some((p) => p.permission.key === "activity.manage"),
    );

    if (!isAuthorized) {
      return {
        success: false as const,
        error: "คุณไม่มีสิทธิ์ส่งกิจกรรมนี้เพื่อตรวจสอบ",
      };
    }
  }

  const reviewerId = plan.employee?.managerId ?? null;
  const previousStatus = plan.status;

  await db.$transaction(async (tx) => {
    await tx.activityPlan.update({
      where: { id: planId },
      data: {
        status: ActivityStatus.PENDING_REVIEW,
        currentApproverEmployeeId: reviewerId,
        submittedAt: new Date(),
      },
    });

    await tx.activityApprovalLog.create({
      data: {
        activityPlanId: planId,
        userId,
        action: ActivityApprovalAction.SUBMIT,
        step: ActivityApprovalStep.POST_ACTIVITY_REVIEW,
        fromStatus: previousStatus,
        toStatus: ActivityStatus.PENDING_REVIEW,
        comment:
          comment?.trim() ||
          (previousStatus === ActivityStatus.RETURNED
            ? "ส่งผลการปฏิบัติงานที่แก้ไขแล้วเพื่อขอตรวจสอบใหม่"
            : "ส่งผลการปฏิบัติงานนอกแผนงานเพื่อขอตรวจสอบ"),
      },
    });

    if (reviewerId) {
      await notifyEmployee(
        reviewerId,
        "กิจกรรมนอกแผนงานรอการตรวจสอบ",
        `กิจกรรมนอกแผนงาน "${plan.title}" รอคุณตรวจสอบผลการปฏิบัติงาน`,
        "INFO",
        `/activity-plans/${plan.id}`,
        tx,
      );
    }
  });

  return { success: true as const };
}

// ────────────────────────────────────────────────────────
// 3. Manager Review Unplanned Activity
// ────────────────────────────────────────────────────────

export interface ReviewUnplannedActivityInput {
  planId: string;
  userId: string;
  action: "APPROVE" | "REQUEST_CORRECTION";
  comment?: string;
}

export async function reviewUnplannedActivityUseCase({
  planId,
  userId,
  action,
  comment,
}: ReviewUnplannedActivityInput) {
  const plan = await db.activityPlan.findUnique({
    where: { id: planId, deletedAt: null },
    include: {
      employee: true,
    },
  });

  if (!plan) {
    return { success: false as const, error: "ไม่พบกิจกรรม" };
  }

  if (plan.planType !== ActivityPlanType.UNPLANNED) {
    return {
      success: false as const,
      error: "รายการนี้ไม่ใช่กิจกรรมนอกแผนงาน",
    };
  }

  if (plan.status !== ActivityStatus.PENDING_REVIEW) {
    return {
      success: false as const,
      error: "กิจกรรมนี้ไม่ได้อยู่ในสถานะรอตรวจสอบ",
    };
  }

  if (action !== "APPROVE" && action !== "REQUEST_CORRECTION") {
    return {
      success: false as const,
      error: "คำสั่งการตรวจสอบไม่ถูกต้อง",
    };
  }

  // Comment is mandatory for REQUEST_CORRECTION
  if (action === "REQUEST_CORRECTION" && (!comment || !comment.trim())) {
    return {
      success: false as const,
      error: "กรุณาระบุเหตุผลหรือข้อความที่ต้องแก้ไขเมื่อส่งกลับ",
    };
  }

  // Reviewer permission validation
  const userRoles = await db.userRole.findMany({
    where: { userId, deletedAt: null },
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  });

  const isAdmin = userRoles.some(
    (ur) =>
      ["administrator", "admin", "ceo"].includes(ur.role.slug.toLowerCase()) ||
      ur.role.permissions.some((p) => p.permission.key === "activity.manage"),
  );

  const reviewerEmployee = await db.employee.findFirst({
    where: { userId, status: "ACTIVE" },
  });

  if (!isAdmin) {
    if (!reviewerEmployee) {
      return {
        success: false as const,
        error: "ไม่พบข้อมูลพนักงานของผู้ตรวจสอบ",
      };
    }

    // Employee cannot review their own activity
    if (reviewerEmployee.id === plan.employeeId) {
      return {
        success: false as const,
        error: "พนักงานไม่สามารถตรวจสอบกิจกรรมของตนเองได้",
      };
    }

    // Must be direct manager
    const isDirectManager =
      plan.employee?.managerId === reviewerEmployee.id ||
      plan.currentApproverEmployeeId === reviewerEmployee.id;

    if (!isDirectManager) {
      return {
        success: false as const,
        error:
          "คุณไม่มีสิทธิ์ตรวจสอบกิจกรรมนี้ (เฉพาะผู้จัดการสายตรงหรือผู้ดูแลระบบเท่านั้น)",
      };
    }
  }

  await db.$transaction(async (tx) => {
    if (action === "APPROVE") {
      await tx.activityPlan.update({
        where: { id: planId },
        data: {
          status: ActivityStatus.REVIEWED,
          currentApproverEmployeeId: null,
          approvedAt: new Date(),
        },
      });

      await tx.activityApprovalLog.create({
        data: {
          activityPlanId: planId,
          userId,
          action: ActivityApprovalAction.APPROVE,
          step: ActivityApprovalStep.POST_ACTIVITY_REVIEW,
          fromStatus: ActivityStatus.PENDING_REVIEW,
          toStatus: ActivityStatus.REVIEWED,
          comment: comment?.trim() || "ตรวจสอบผลการปฏิบัติงานผ่านเรียบร้อย",
        },
      });

      if (plan.employeeId) {
        await notifyEmployee(
          plan.employeeId,
          "กิจกรรมนอกแผนงานได้รับการตรวจสอบแล้ว",
          `กิจกรรมนอกแผนงาน "${plan.title}" ผ่านการตรวจสอบเรียบร้อยแล้ว`,
          "SUCCESS",
          `/activity-plans/${plan.id}`,
          tx,
        );
      }
    } else {
      // REQUEST_CORRECTION -> RETURNED
      await tx.activityPlan.update({
        where: { id: planId },
        data: {
          status: ActivityStatus.RETURNED,
          currentApproverEmployeeId: plan.employeeId,
        },
      });

      await tx.activityApprovalLog.create({
        data: {
          activityPlanId: planId,
          userId,
          action: ActivityApprovalAction.REQUEST_CORRECTION,
          step: ActivityApprovalStep.POST_ACTIVITY_REVIEW,
          fromStatus: ActivityStatus.PENDING_REVIEW,
          toStatus: ActivityStatus.RETURNED,
          comment: comment!.trim(),
        },
      });

      if (plan.employeeId) {
        await notifyEmployee(
          plan.employeeId,
          "กิจกรรมนอกแผนงานถูกส่งกลับแก้ไข",
          `กิจกรรมนอกแผนงาน "${plan.title}" ถูกส่งกลับแก้ไข: "${comment!.trim()}"`,
          "WARNING",
          `/activity-plans/${plan.id}`,
          tx,
        );
      }
    }
  });

  return { success: true as const };
}

// ────────────────────────────────────────────────────────
// 4. Update Unplanned Activity (Draft or Returned)
// ────────────────────────────────────────────────────────

export interface UpdateUnplannedActivityInput {
  planId: string;
  title?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  location?: string | null;
  province?: string | null;
  district?: string | null;
  objective?: string;
  description?: string | null;
  notes?: string | null;
  workTypeCodes?: string[];
  planStores?: Array<{
    workTypeCode: string;
    visitPurpose?: string | null;
    storeId?: string | null;
    storeName?: string | null;
    province?: string | null;
    isUnregisteredFarmer?: boolean;
    unregisteredFarmerName?: string | null;
    unregisteredFarmerPhone?: string | null;
    targetAmount?: number | null;
    subDealerStore?: string | null;
    remarks?: string | null;
    notes?: string | null;
  }>;
  actualResult?: Partial<CreateActivityResultInput>;
  submitImmediately?: boolean;
  comment?: string;
}

export async function updateUnplannedActivityUseCase(
  userId: string,
  input: UpdateUnplannedActivityInput,
) {
  const plan = await db.activityPlan.findUnique({
    where: { id: input.planId, deletedAt: null },
    include: {
      employee: true,
      workTypes: { include: { activityType: true } },
      stores: true,
      result: true,
    },
  });

  if (!plan) {
    return { success: false as const, error: "ไม่พบกิจกรรมนอกแผนงาน" };
  }

  if (plan.planType !== ActivityPlanType.UNPLANNED) {
    return {
      success: false as const,
      error: "รายการนี้ไม่ใช่กิจกรรมนอกแผนงาน",
    };
  }

  if (
    plan.status !== ActivityStatus.DRAFT &&
    plan.status !== ActivityStatus.RETURNED
  ) {
    return {
      success: false as const,
      error: "สามารถแก้ไขได้เฉพาะกิจกรรมในสถานะร่างหรือถูกส่งกลับแก้ไขเท่านั้น",
    };
  }

  // Security check: Only creator or admin
  if (plan.createdById !== userId) {
    const userRoles = await db.userRole.findMany({
      where: { userId, deletedAt: null },
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } },
          },
        },
      },
    });

    const isAuthorized = userRoles.some(
      (ur) =>
        ["administrator", "admin", "ceo"].includes(
          ur.role.slug.toLowerCase(),
        ) ||
        ur.role.permissions.some((p) => p.permission.key === "activity.manage"),
    );

    if (!isAuthorized) {
      return {
        success: false as const,
        error: "คุณไม่มีสิทธิ์แก้ไขกิจกรรมนอกแผนงานนี้",
      };
    }
  }

  if (input.workTypeCodes) {
    const validation = validateUnplannedWorkTypes(input.workTypeCodes);
    if (!validation.valid) {
      return {
        success: false as const,
        error: validation.error || "ประเภทงานไม่ถูกต้อง",
      };
    }
  }

  const isSubmit = input.submitImmediately === true;
  const reviewerEmployeeId = plan.employee?.managerId ?? null;
  const previousStatus = plan.status;

  const result = await db.$transaction(async (tx) => {
    // 1. Update basic fields
    const updateData: Prisma.ActivityPlanUncheckedUpdateInput = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.startDate !== undefined)
      updateData.startDate = new Date(input.startDate);
    if (input.endDate !== undefined)
      updateData.endDate = new Date(input.endDate);
    if (input.location !== undefined) updateData.location = input.location;
    if (input.province !== undefined) updateData.province = input.province;
    if (input.district !== undefined) updateData.district = input.district;
    if (input.objective !== undefined) updateData.objective = input.objective;
    if (input.description !== undefined)
      updateData.description = input.description;
    if (input.notes !== undefined) updateData.notes = input.notes;

    if (isSubmit) {
      updateData.status = ActivityStatus.PENDING_REVIEW;
      updateData.currentApproverEmployeeId = reviewerEmployeeId;
      updateData.submittedAt = new Date();
    }

    // Work types update
    if (input.workTypeCodes && input.workTypeCodes.length > 0) {
      await tx.activityPlanWorkType.deleteMany({
        where: { activityPlanId: plan.id },
      });

      const cleanCodes = input.workTypeCodes.map(getWorkTypeCode);
      const activityTypes = await tx.activityType.findMany({
        where: { code: { in: cleanCodes } },
      });

      if (activityTypes.length > 0) {
        updateData.activityTypeId = activityTypes[0].id;
        await tx.activityPlanWorkType.createMany({
          data: activityTypes.map((at) => ({
            activityPlanId: plan.id,
            activityTypeId: at.id,
            workTypeCode: at.code,
          })),
        });
      }
    }

    // Plan stores update
    if (input.planStores) {
      await tx.activityPlanStore.deleteMany({
        where: { activityPlanId: plan.id },
      });

      if (input.planStores.length > 0) {
        await tx.activityPlanStore.createMany({
          data: input.planStores.map((s) => ({
            activityPlanId: plan.id,
            workTypeCode: getWorkTypeCode(s.workTypeCode),
            visitPurpose: s.visitPurpose ?? null,
            storeId: s.storeId ?? null,
            storeName: s.storeName ?? null,
            province: s.province ?? null,
            isUnregisteredFarmer: s.isUnregisteredFarmer ?? false,
            unregisteredFarmerName: s.unregisteredFarmerName ?? null,
            unregisteredFarmerPhone: s.unregisteredFarmerPhone ?? null,
            targetAmount: null, // Strictly NO planned target
            subDealerStore: s.subDealerStore ?? null,
            remarks: s.remarks ?? null,
            notes: s.notes ?? null,
          })),
        });
      }
    }

    const updatedPlan = await tx.activityPlan.update({
      where: { id: plan.id },
      data: updateData,
    });

    // 2. Upsert ActivityResult
    let updatedResult = null;
    if (input.actualResult) {
      const actualData = input.actualResult;
      updatedResult = await upsertActivityResult(
        {
          activityPlanId: plan.id,
          actualStartDate: actualData.actualStartDate
            ? new Date(actualData.actualStartDate)
            : updatedPlan.startDate,
          actualEndDate: actualData.actualEndDate
            ? new Date(actualData.actualEndDate)
            : updatedPlan.endDate,
          resultStatus:
            actualData.resultStatus ?? ActivityResultStatus.COMPLETED,
          resultSummary: actualData.resultSummary ?? null,
          discussionResult: actualData.discussionResult ?? null,
          productAdvice: actualData.productAdvice ?? null,
          salesOpportunity: actualData.salesOpportunity ?? null,
          problemFound: actualData.problemFound ?? null,
          nextAction: actualData.nextAction ?? null,
          nextMeetingDate: actualData.nextMeetingDate
            ? new Date(actualData.nextMeetingDate)
            : null,
          farmerHomeAddress: actualData.farmerHomeAddress ?? null,
          plotLatitude: actualData.plotLatitude ?? null,
          plotLongitude: actualData.plotLongitude ?? null,
          actualSalesPromotionSpent:
            actualData.actualSalesPromotionSpent ?? null,
          actualMarketingSpent: actualData.actualMarketingSpent ?? null,
          salesResultAmount: actualData.salesResultAmount ?? null,
          salesOrdersCount: actualData.salesOrdersCount ?? null,
          collectResultAmount: actualData.collectResultAmount ?? null,
          actualAttendeesCount: actualData.actualAttendeesCount ?? null,
          distributorsCount: actualData.distributorsCount ?? null,
          farmersCount: actualData.farmersCount ?? null,
          saleResults: actualData.saleResults,
          stockResults: actualData.stockResults,
          surveyResults: actualData.surveyResults,
          demoResults: actualData.demoResults,
          followupResults: actualData.followupResults,
          issueResults: actualData.issueResults,
          sprayRounds: actualData.sprayRounds,
          attachments: actualData.attachments,
          recordedById: userId,
        },
        tx,
      );
    }

    // 3. Approval Log if submitting
    if (isSubmit) {
      await tx.activityApprovalLog.create({
        data: {
          activityPlanId: plan.id,
          userId,
          action: ActivityApprovalAction.SUBMIT,
          step: ActivityApprovalStep.POST_ACTIVITY_REVIEW,
          fromStatus: previousStatus,
          toStatus: ActivityStatus.PENDING_REVIEW,
          comment:
            input.comment?.trim() ||
            (previousStatus === ActivityStatus.RETURNED
              ? "ส่งผลการปฏิบัติงานที่แก้ไขแล้วเพื่อขอตรวจสอบใหม่"
              : "ส่งผลการปฏิบัติงานนอกแผนงานเพื่อขอตรวจสอบ"),
        },
      });

      if (reviewerEmployeeId) {
        await notifyEmployee(
          reviewerEmployeeId,
          "กิจกรรมนอกแผนงานรอการตรวจสอบ",
          `กิจกรรมนอกแผนงาน "${updatedPlan.title}" รอคุณตรวจสอบผลการปฏิบัติงาน`,
          "INFO",
          `/activity-plans/${updatedPlan.id}`,
          tx,
        );
      }
    }

    return { plan: updatedPlan, result: updatedResult };
  });

  return { success: true as const, plan: result.plan, result: result.result };
}

// ────────────────────────────────────────────────────────
// 5. Get Unplanned Review Queue Data
// ────────────────────────────────────────────────────────

export interface UnplannedReviewQueueUserContext {
  userId: string;
  employeeId?: string | null;
  roles: string[];
  permissions: string[];
}

export interface UnplannedReviewQueueFilter {
  status?: string; // "PENDING_REVIEW" | "RETURNED" | "REVIEWED" | "ALL"
  search?: string;
  scope?: "my_review" | "all";
}

export async function getUnplannedReviewQueueUseCase(
  user: UnplannedReviewQueueUserContext,
  filter?: UnplannedReviewQueueFilter,
) {
  const roles = user.roles ?? [];
  const permissions = user.permissions ?? [];
  const isAdmin =
    roles.some((r) =>
      ["administrator", "admin", "ceo"].includes(r.toLowerCase()),
    ) ||
    permissions.includes("activity.manage");

  let reviewerEmployeeId = user.employeeId;
  if (!reviewerEmployeeId) {
    const emp = await db.employee.findFirst({
      where: { userId: user.userId, status: "ACTIVE" },
      select: { id: true },
    });
    reviewerEmployeeId = emp?.id ?? null;
  }

  // Base where condition: ALWAYS planType = UNPLANNED and deletedAt = null
  const whereCondition: Prisma.ActivityPlanWhereInput = {
    planType: ActivityPlanType.UNPLANNED,
    deletedAt: null,
  };

  // Authority filtering:
  // If not admin and doesn't have activity.manage, they can ONLY see:
  // 1) Items where they are the direct manager of creator (employee.managerId === reviewerEmployeeId)
  // 2) Items assigned as currentApproverEmployeeId === reviewerEmployeeId
  if (!isAdmin) {
    if (!reviewerEmployeeId) {
      return {
        plans: [],
        counts: {
          pendingReviewCount: 0,
          returnedCount: 0,
          reviewedCount: 0,
          totalCount: 0,
        },
        currentUser: {
          id: user.userId,
          employeeId: null,
          isAdmin: false,
        },
      };
    }

    whereCondition.OR = [
      { employee: { managerId: reviewerEmployeeId } },
      { currentApproverEmployeeId: reviewerEmployeeId },
    ];
  } else if (filter?.scope === "my_review" && reviewerEmployeeId) {
    whereCondition.OR = [
      { employee: { managerId: reviewerEmployeeId } },
      { currentApproverEmployeeId: reviewerEmployeeId },
    ];
  }

  // Query counts grouped by status before applying the status filter
  const [pendingCount, returnedCount, reviewedCount, totalCount] = await Promise.all([
    db.activityPlan.count({
      where: { ...whereCondition, status: ActivityStatus.PENDING_REVIEW },
    }),
    db.activityPlan.count({
      where: { ...whereCondition, status: ActivityStatus.RETURNED },
    }),
    db.activityPlan.count({
      where: { ...whereCondition, status: ActivityStatus.REVIEWED },
    }),
    db.activityPlan.count({
      where: whereCondition,
    }),
  ]);

  // Apply Status filter
  const targetStatus = filter?.status || "PENDING_REVIEW";
  if (targetStatus !== "ALL") {
    whereCondition.status = targetStatus as ActivityStatus;
  }

  // Apply search query
  if (filter?.search?.trim()) {
    const q = filter.search.trim();
    whereCondition.AND = [
      {
        OR: [
          { code: { contains: q, mode: "insensitive" } },
          { title: { contains: q, mode: "insensitive" } },
          { employee: { name: { contains: q, mode: "insensitive" } } },
          { location: { contains: q, mode: "insensitive" } },
          { province: { contains: q, mode: "insensitive" } },
          { stores: { some: { store: { name: { contains: q, mode: "insensitive" } } } } },
        ],
      },
    ];
  }

  const rawPlans = await db.activityPlan.findMany({
    where: whereCondition,
    include: {
      employee: {
        include: {
          position: { select: { name: true } },
          department: { select: { name: true } },
        },
      },
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      currentApprover: {
        include: {
          position: { select: { name: true } },
          department: { select: { name: true } },
        },
      },
      activityType: true,
      workTypes: {
        include: {
          activityType: true,
        },
      },
      stores: {
        include: {
          store: {
            select: {
              id: true,
              name: true,
              customerCode: true,
              customerType: true,
              province: true,
              district: true,
            },
          },
        },
      },
      result: {
        include: {
          attachments: true,
        },
      },
      approvalLogs: {
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    orderBy: [
      { submittedAt: "desc" },
      { createdAt: "desc" },
    ],
  });

  const decoratedPlans = rawPlans.map((plan: any) => {
    const isDirectManager =
      Boolean(reviewerEmployeeId) &&
      (plan.employee?.managerId === reviewerEmployeeId ||
        plan.currentApproverEmployeeId === reviewerEmployeeId);

    const isCreator =
      plan.createdById === user.userId ||
      (Boolean(reviewerEmployeeId) && plan.employeeId === reviewerEmployeeId);

    const canReview =
      plan.status === ActivityStatus.PENDING_REVIEW &&
      !isCreator &&
      (isAdmin || isDirectManager);

    return {
      ...plan,
      canReview,
    };
  });

  return {
    plans: decoratedPlans,
    counts: {
      pendingReviewCount: pendingCount,
      returnedCount,
      reviewedCount,
      totalCount,
    },
    currentUser: {
      id: user.userId,
      employeeId: reviewerEmployeeId,
      isAdmin,
    },
  };
}
