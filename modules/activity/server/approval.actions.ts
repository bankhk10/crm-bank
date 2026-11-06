"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { getApproverDirectory } from "../infrastructure/employee-lookup.repository";
import {
  approveActivityPlanUseCase,
  rejectActivityPlanUseCase,
  requestCorrectionPlanUseCase,
  reviewSingleActivityHelperUseCase,
} from "../application/activity-plan-flow";
import { getApprovalQueueDataUseCase } from "../application/approval-queue";
import {
  canAccessApprovalQueue,
  canApproveActivityPlan,
} from "../domain/permissions";

function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Action: Get Approver Directory
 */
export async function getApproverDirectoryAction() {
  try {
    const result = await getApproverDirectory();
    return serialize(result);
  } catch (err: any) {
    console.error("Failed to get approver directory:", err);
    return {
      salesAdminEmployees: [],
      marketingEmployees: [],
      salesDirectorEmployees: [],
    };
  }
}

/**
 * Action: Get approval queue data and statistics
 */
export async function getApprovalQueueDataAction() {
  const session = await auth();
  if (!session?.user) {
    return { success: false as const, error: "Unauthorized" };
  }

  const authCheck = canAccessApprovalQueue(session.user);
  if (!authCheck.allowed) {
    return {
      success: false as const,
      error: authCheck.error || "Forbidden: คุณไม่มีสิทธิ์เข้าถึงคิวงานอนุมัติ",
    };
  }

  try {
    const result = await getApprovalQueueDataUseCase({
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      employeeId: (session.user as any)?.employeeId,
      permissions: session.user.permissionKeys ?? [],
      roles: (session.user as any)?.roles ?? [],
    });

    return serialize(result);
  } catch (err: any) {
    return {
      success: false as const,
      error: err.message || "เกิดข้อผิดพลาดในการโหลดคิวงานอนุมัติ",
    };
  }
}

/**
 * Action: Approve an Activity Plan
 */
export async function approveActivityPlanAction(
  id: string,
  comment?: string,
  selectedHelperEmployeeIds?: string[]
) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const authCheck = canApproveActivityPlan(session.user);
  if (!authCheck.allowed) {
    return {
      success: false,
      error: authCheck.error || "Forbidden: คุณไม่มีสิทธิ์อนุมัติ Trip Plan",
    };
  }

  try {
    const result = await approveActivityPlanUseCase(
      id,
      session.user.id,
      comment,
      selectedHelperEmployeeIds
    );
    if (result.success) {
      revalidatePath("/activity-plans");
      revalidatePath("/activity-plans/approvals");
      revalidatePath("/activity-plans/calendar");
      revalidatePath(`/activity-plans/${id}`);
    }
    return serialize(result);
  } catch (err: any) {
    return { success: false, error: err.message || "เกิดข้อผิดพลาดไม่คาดคิด" };
  }
}

/**
 * Action: Reject an Activity Plan
 */
export async function rejectActivityPlanAction(id: string, comment?: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const authCheck = canApproveActivityPlan(session.user);
  if (!authCheck.allowed) {
    return {
      success: false,
      error: authCheck.error || "Forbidden: คุณไม่มีสิทธิ์ปฏิเสธ Trip Plan",
    };
  }

  try {
    const result = await rejectActivityPlanUseCase(
      id,
      session.user.id,
      comment
    );
    if (result.success) {
      revalidatePath("/activity-plans");
      revalidatePath("/activity-plans/approvals");
      revalidatePath("/activity-plans/calendar");
      revalidatePath(`/activity-plans/${id}`);
    }
    return serialize(result);
  } catch (err: any) {
    return { success: false, error: err.message || "เกิดข้อผิดพลาดไม่คาดคิด" };
  }
}

/**
 * Action: Request Correction on an Activity Plan
 */
export async function requestCorrectionPlanAction(id: string, comment: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const authCheck = canApproveActivityPlan(session.user);
  if (!authCheck.allowed) {
    return {
      success: false,
      error: authCheck.error || "Forbidden: คุณไม่มีสิทธิ์ส่งตีกลับ Trip Plan",
    };
  }

  try {
    const result = await requestCorrectionPlanUseCase(
      id,
      session.user.id,
      comment
    );
    if (result.success) {
      revalidatePath("/activity-plans");
      revalidatePath("/activity-plans/approvals");
      revalidatePath("/activity-plans/calendar");
      revalidatePath(`/activity-plans/${id}`);
    }
    return serialize(result);
  } catch (err: any) {
    return { success: false, error: err.message || "เกิดข้อผิดพลาดไม่คาดคิด" };
  }
}

/**
 * Action: Review Single Activity Helper
 */
export async function reviewSingleActivityHelperAction(
  activityPlanId: string,
  helperEmployeeId: string,
  action: "APPROVE" | "REJECT",
  rejectionReason?: string
) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const result = await reviewSingleActivityHelperUseCase(
      activityPlanId,
      helperEmployeeId,
      session.user.id,
      action,
      rejectionReason
    );
    if (result.success) {
      revalidatePath("/activity-plans");
      revalidatePath("/activity-plans/approvals");
      revalidatePath("/activity-plans/calendar");
      revalidatePath(`/activity-plans/${activityPlanId}`);
    }
    return serialize(result);
  } catch (err: any) {
    return { success: false, error: err.message || "เกิดข้อผิดพลาดไม่คาดคิด" };
  }
}
