import { db } from "@/lib/db";
import {
  Prisma,
  ActivityStatus,
  ActivityHelperStatus,
  ActivityApprovalAction,
  ActivityApprovalStep,
} from "@prisma/client";
import {
  findActivityPlanById,
  createApprovalLog,
  updateHelperStatus,
} from "../infrastructure/activity-plan.repository";
import { syncActivityPlanToCalendarUseCase } from "./calendar-integration";

// ────────────────────────────────────────────────────────
// Notification Helper Functions (Transaction Safe)
// ────────────────────────────────────────────────────────

async function sendNotificationHelper(
  userId: string | null,
  title: string,
  message: string,
  type: any,
  link: string,
  tx: Prisma.TransactionClient,
) {
  if (!userId) return;
  await tx.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      link,
    },
  });
}

async function sendNotificationToEmployee(
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
    await sendNotificationHelper(emp.userId, title, message, type, link, tx);
  }
}

// Helper to determine if an employee is the terminal line manager (Sales Admin Manager)
function isSalesAdminManager(employee: any): boolean {
  if (!employee) return false;
  return (
    employee.position?.name === "ผู้จัดการแผนกบริหารงานขาย" ||
    (employee.department?.code === "SA" && employee.position?.isManagerial)
  );
}

// Helper to determine if an employee is the Marketing Manager
function isMarketingManager(employee: any): boolean {
  if (!employee) return false;
  return (
    employee.position?.name === "ผู้จัดการแผนกการตลาด" ||
    (employee.department?.code === "MKT" && employee.position?.isManagerial)
  );
}

// Helper to determine if an employee is the Sales Manager (Director / Overall Budget Approver)
function isSalesDirector(employee: any): boolean {
  if (!employee) return false;
  return (
    employee.position?.name === "ผู้จัดการฝ่ายขาย" ||
    employee.position?.level >= 3
  );
}

// Helper to check terminal line manager condition
function isTerminalLineManager(employee: any): boolean {
  if (!employee) return true;
  return (
    isSalesAdminManager(employee) ||
    isMarketingManager(employee) ||
    isSalesDirector(employee) ||
    employee.managerId === null
  );
}

// Fetch manager user IDs for notifications
async function getSalesAdminManagers(tx: Prisma.TransactionClient) {
  return tx.employee.findMany({
    where: {
      deletedAt: null,
      OR: [
        { position: { name: "ผู้จัดการแผนกบริหารงานขาย" } },
        { department: { code: "SA" }, position: { isManagerial: true } },
      ],
    },
    select: { userId: true },
  });
}

async function getMarketingManagers(tx: Prisma.TransactionClient) {
  return tx.employee.findMany({
    where: {
      deletedAt: null,
      OR: [
        { position: { name: "ผู้จัดการแผนกการตลาด" } },
        { department: { code: "MKT" }, position: { isManagerial: true } },
      ],
    },
    select: { userId: true },
  });
}

async function getSalesDirectors(tx: Prisma.TransactionClient) {
  return tx.employee.findMany({
    where: {
      deletedAt: null,
      OR: [
        { position: { name: "ผู้จัดการฝ่ายขาย" } },
        { position: { level: { gte: 3 } } },
      ],
    },
    select: { userId: true },
  });
}

async function notifyBudgetApprovers(plan: any, tx: Prisma.TransactionClient) {
  const hasSalesPromotion =
    plan.salesPromotionBudget && plan.salesPromotionBudget.toNumber() > 0;
  const hasMarketing =
    plan.marketingBudget && plan.marketingBudget.toNumber() > 0;

  if (hasSalesPromotion && plan.salesPromotionApproved !== true) {
    const managers = await getSalesAdminManagers(tx);
    for (const mgr of managers) {
      await sendNotificationHelper(
        mgr.userId,
        "มีงบส่งเสริมการขายรออนุมัติ",
        `แผนกิจกรรม "${plan.title}" โดย ${plan.employee?.name || "พนักงาน"} รออนุมัติงบส่งเสริมการขายจากคุณ`,
        "INFO",
        `/activity-plans/${plan.id}`,
        tx,
      );
    }
  }

  if (hasMarketing && plan.marketingApproved !== true) {
    const managers = await getMarketingManagers(tx);
    for (const mgr of managers) {
      await sendNotificationHelper(
        mgr.userId,
        "มีงบการตลาดรออนุมัติ",
        `แผนกิจกรรม "${plan.title}" โดย ${plan.employee?.name || "พนักงาน"} รออนุมัติงบการตลาดจากคุณ`,
        "INFO",
        `/activity-plans/${plan.id}`,
        tx,
      );
    }
  }

  const requiredSalesPromotionOk =
    !hasSalesPromotion || plan.salesPromotionApproved === true;
  const requiredMarketingOk = !hasMarketing || plan.marketingApproved === true;

  if (
    requiredSalesPromotionOk &&
    requiredMarketingOk &&
    plan.salesManagerApproved !== true
  ) {
    const directors = await getSalesDirectors(tx);
    for (const dir of directors) {
      await sendNotificationHelper(
        dir.userId,
        "มีงบประมาณกิจกรรมรวมรออนุมัติ",
        `แผนกิจกรรม "${plan.title}" โดย ${plan.employee?.name || "พนักงาน"} รออนุมัติงบประมาณรวมจากคุณในฐานะผู้จัดการฝ่ายขาย`,
        "INFO",
        `/activity-plans/${plan.id}`,
        tx,
      );
    }
  }
}

async function notifyHelperApprovers(plan: any, tx: Prisma.TransactionClient) {
  const pendingHelpers = await tx.activityHelper.findMany({
    where: {
      activityPlanId: plan.id,
      status: ActivityHelperStatus.PENDING,
      deletedAt: null,
    },
    include: { employee: { include: { department: true } } },
  });

  let notifySA = false;
  let notifyMKT = false;

  for (const helper of pendingHelpers) {
    const deptCode = helper.employee.department?.code || "";
    if (
      deptCode === "SA" ||
      deptCode === "SS" ||
      helper.employee.positionTitle?.includes("เซลส์") ||
      helper.employee.positionTitle?.includes("ส่งเสริม")
    ) {
      notifySA = true;
    } else if (
      deptCode === "MKT" ||
      helper.employee.positionTitle?.includes("การตลาด")
    ) {
      notifyMKT = true;
    }
  }

  if (notifySA) {
    const managers = await getSalesAdminManagers(tx);
    for (const mgr of managers) {
      await sendNotificationHelper(
        mgr.userId,
        "มีคำขออนุมัติพนักงานช่วยงาน",
        `แผนกิจกรรม "${plan.title}" ขอตัวพนักงานในสังกัดฝ่ายขายของคุณเพื่อช่วยงาน`,
        "INFO",
        `/activity-plans/${plan.id}`,
        tx,
      );
    }
  }

  if (notifyMKT) {
    const managers = await getMarketingManagers(tx);
    for (const mgr of managers) {
      await sendNotificationHelper(
        mgr.userId,
        "มีคำขออนุมัติพนักงานช่วยงาน",
        `แผนกิจกรรม "${plan.title}" ขอตัวพนักงานการตลาดในสังกัดของคุณเพื่อช่วยงาน`,
        "INFO",
        `/activity-plans/${plan.id}`,
        tx,
      );
    }
  }
}

// ────────────────────────────────────────────────────────
// Core Use Case Logic
// ────────────────────────────────────────────────────────

/**
 * Submit an Trip plan for approval (Transitions from DRAFT or WAITING_FOR_CORRECTION to LINE_APPROVAL)
 */
export async function submitActivityPlanUseCase(
  planId: string,
  userId: string,
) {
  return db.$transaction(async (tx) => {
    const plan = await tx.activityPlan.findUnique({
      where: { id: planId, deletedAt: null },
      include: {
        employee: {
          include: {
            position: true,
            department: true,
          },
        },
      },
    });

    if (!plan) {
      return { success: false, error: "ไม่พบแผนกิจกรรม" };
    }

    if (
      plan.status !== ActivityStatus.DRAFT &&
      plan.status !== ActivityStatus.WAITING_FOR_CORRECTION
    ) {
      return {
        success: false,
        error: "แผนกิจกรรมนี้ไม่ได้อยู่ในสถานะร่างหรือรอแก้ไข",
      };
    }

    const creator = plan.employee;
    if (!creator.managerId) {
      // No manager, skip directly to budget approval stage
      await initiateBudgetApproval(
        plan,
        tx,
        userId,
        "ส่งแผนงานสำเร็จ (ข้ามขั้นตอนอนุมัติตามสายงานเนื่องจากไม่มีหัวหน้างาน)",
      );
      return { success: true };
    }

    // Set status to PENDING_LINE_APPROVAL and assign first approver
    await tx.activityPlan.update({
      where: { id: planId },
      data: {
        status: ActivityStatus.PENDING_LINE_APPROVAL,
        currentApproverId: creator.managerId,
      },
    });

    await tx.activityApprovalLog.create({
      data: {
        activityPlanId: planId,
        userId,
        action: ActivityApprovalAction.SUBMIT,
        step: ActivityApprovalStep.LINE_APPROVAL,
        comment: "ส่งแผนงานเพื่อขออนุมัติตามสายงาน",
      },
    });

    // Notify Manager
    await sendNotificationToEmployee(
      creator.managerId,
      "แผนกิจกรรมรอการตรวจสอบ",
      `แผนกิจกรรม "${plan.title}" โดย ${creator.name} รอคุณตรวจสอบและอนุมัติตามสายงาน`,
      "INFO",
      `/activity-plans/${plan.id}`,
      tx,
    );

    return { success: true };
  });
}

/**
 * Approve an Trip plan
 */
export async function approveActivityPlanUseCase(
  planId: string,
  userId: string,
  comment?: string,
) {
  return db.$transaction(async (tx) => {
    const plan = await tx.activityPlan.findUnique({
      where: { id: planId, deletedAt: null },
      include: {
        employee: true,
        helpers: { where: { deletedAt: null }, include: { employee: true } },
      },
    });

    if (!plan) {
      return { success: false, error: "ไม่พบแผนกิจกรรม" };
    }

    // Fetch approver employee profile
    const approverEmployee = await tx.employee.findFirst({
      where: { userId, deletedAt: null },
      include: { position: true, department: true },
    });

    if (!approverEmployee) {
      return { success: false, error: "ไม่พบโปรไฟล์พนักงานของผู้ดำเนินการ" };
    }

    // ────────────────────────────────────────────────────────
    // Step 2: Line Approval
    // ────────────────────────────────────────────────────────
    if (plan.status === ActivityStatus.PENDING_LINE_APPROVAL) {
      if (plan.currentApproverId !== approverEmployee.id) {
        return {
          success: false,
          error: "คุณไม่มีสิทธิ์อนุมัติแผนงานนี้ในขั้นตอนนี้",
        };
      }

      // Check if this approver is terminal line manager
      if (isTerminalLineManager(approverEmployee)) {
        // Line approval is complete! Proceed to Step 3 Budget Approval
        await tx.activityApprovalLog.create({
          data: {
            activityPlanId: planId,
            userId,
            action: ActivityApprovalAction.APPROVE,
            step: ActivityApprovalStep.LINE_APPROVAL,
            comment: comment || "อนุมัติตามสายงานขั้นสุดท้าย",
          },
        });
        await initiateBudgetApproval(
          plan,
          tx,
          userId,
          "ผ่านการตรวจสอบตามสายงานในเบื้องต้นแล้ว",
        );
      } else {
        // Not terminal, route to their manager
        const nextManagerId = approverEmployee.managerId;
        if (!nextManagerId) {
          // Fallback if manager disappears
          await tx.activityApprovalLog.create({
            data: {
              activityPlanId: planId,
              userId,
              action: ActivityApprovalAction.APPROVE,
              step: ActivityApprovalStep.LINE_APPROVAL,
              comment:
                comment ||
                "อนุมัติตามสายงาน (ข้ามขั้นตอนถัดไปเนื่องจากไม่พบหัวหน้า)",
            },
          });
          await initiateBudgetApproval(
            plan,
            tx,
            userId,
            "ผ่านการตรวจสอบตามสายงาน",
          );
        } else {
          await tx.activityPlan.update({
            where: { id: planId },
            data: { currentApproverId: nextManagerId },
          });

          await tx.activityApprovalLog.create({
            data: {
              activityPlanId: planId,
              userId,
              action: ActivityApprovalAction.APPROVE,
              step: ActivityApprovalStep.LINE_APPROVAL,
              comment: comment || "อนุมัติและส่งต่อสายงานชั้นถัดไป",
            },
          });

          // Notify Next Manager
          await sendNotificationToEmployee(
            nextManagerId,
            "แผนกิจกรรมรอการตรวจสอบ",
            `แผนกิจกรรม "${plan.title}" โดย ${plan.employee.name} รอคุณตรวจสอบและอนุมัติตามสายงาน`,
            "INFO",
            `/activity-plans/${plan.id}`,
            tx,
          );
        }
      }
      return { success: true };
    }

    // ────────────────────────────────────────────────────────
    // Step 3: Budget Approval
    // ────────────────────────────────────────────────────────
    if (plan.status === ActivityStatus.PENDING_BUDGET_APPROVAL) {
      let isAnyBudgetApproved = false;

      // 1. Sales Promotion Budget Approval
      const hasSalesPromotion =
        plan.salesPromotionBudget && plan.salesPromotionBudget.toNumber() > 0;
      if (hasSalesPromotion && plan.salesPromotionApproved !== true) {
        if (isSalesAdminManager(approverEmployee)) {
          plan.salesPromotionApproved = true;
          isAnyBudgetApproved = true;
          await tx.activityApprovalLog.create({
            data: {
              activityPlanId: planId,
              userId,
              action: ActivityApprovalAction.APPROVE,
              step: ActivityApprovalStep.BUDGET_APPROVAL,
              comment: comment || "อนุมัติงบส่งเสริมการขาย",
            },
          });
        }
      }

      // 2. Marketing Budget Approval
      const hasMarketing =
        plan.marketingBudget && plan.marketingBudget.toNumber() > 0;
      if (hasMarketing && plan.marketingApproved !== true) {
        if (isMarketingManager(approverEmployee)) {
          plan.marketingApproved = true;
          isAnyBudgetApproved = true;
          await tx.activityApprovalLog.create({
            data: {
              activityPlanId: planId,
              userId,
              action: ActivityApprovalAction.APPROVE,
              step: ActivityApprovalStep.BUDGET_APPROVAL,
              comment: comment || "อนุมัติงบการตลาด",
            },
          });
        }
      }

      // If department budgets are not fully approved, wait
      const requiredSalesPromotionOk =
        !hasSalesPromotion || plan.salesPromotionApproved === true;
      const requiredMarketingOk =
        !hasMarketing || plan.marketingApproved === true;

      // 3. Sales Director Approval (Overall Budget Approval)
      let salesDirectorOk = plan.salesManagerApproved === true;
      if (
        requiredSalesPromotionOk &&
        requiredMarketingOk &&
        plan.salesManagerApproved !== true
      ) {
        if (isSalesDirector(approverEmployee)) {
          plan.salesManagerApproved = true;
          salesDirectorOk = true;
          isAnyBudgetApproved = true;
          await tx.activityApprovalLog.create({
            data: {
              activityPlanId: planId,
              userId,
              action: ActivityApprovalAction.APPROVE,
              step: ActivityApprovalStep.BUDGET_APPROVAL,
              comment: comment || "อนุมัติงบประมาณในภาพรวมทั้งหมด",
            },
          });
        }
      }

      if (!isAnyBudgetApproved) {
        return {
          success: false,
          error:
            "คุณไม่มีสิทธิ์อนุมัติงบประมาณประเภทนี้ หรือได้รับการอนุมัติไปแล้ว",
        };
      }

      // Update budget progress flags
      const updatedPlan = await tx.activityPlan.update({
        where: { id: planId },
        data: {
          salesPromotionApproved: plan.salesPromotionApproved,
          marketingApproved: plan.marketingApproved,
          salesManagerApproved: plan.salesManagerApproved,
        },
        include: { employee: true },
      });

      // If all budget stages approved, move to Step 4 Helper Approval
      if (requiredSalesPromotionOk && requiredMarketingOk && salesDirectorOk) {
        await initiateHelperApproval(updatedPlan, tx, userId);
      } else {
        // Budget stages still in progress, notify the remaining approvers
        await notifyBudgetApprovers(updatedPlan, tx);
      }

      return { success: true };
    }

    // ────────────────────────────────────────────────────────
    // Step 4: Helper Approval
    // ────────────────────────────────────────────────────────
    if (plan.status === ActivityStatus.PENDING_HELPER_APPROVAL) {
      let helperApprovedCount = 0;
      const pendingHelpers = plan.helpers.filter(
        (h) => h.status === ActivityHelperStatus.PENDING,
      );

      if (pendingHelpers.length === 0) {
        await tx.activityPlan.update({
          where: { id: planId },
          data: { status: ActivityStatus.APPROVED },
        });

        // Notify creator & helpers
        await sendNotificationHelper(
          plan.employee.userId,
          "แผนกิจกรรมได้รับการอนุมัติสำเร็จ 🚀",
          `แผนกิจกรรม "${plan.title}" ได้รับการอนุมัติและเข้าระบบสำเร็จแล้ว`,
          "APPROVED",
          `/activity-plans/${plan.id}`,
          tx,
        );

        // Sync to Calendar
        await syncActivityPlanToCalendarUseCase(plan, tx);

        return { success: true };
      }

      const isSalesAdmin = isSalesAdminManager(approverEmployee);
      const isMktManager = isMarketingManager(approverEmployee);

      if (!isSalesAdmin && !isMktManager) {
        return {
          success: false,
          error: "คุณไม่มีสิทธิ์อนุมัติผู้ช่วยงานกิจกรรม",
        };
      }

      for (const helper of pendingHelpers) {
        const helperDeptId = helper.employee.departmentId || "";

        // Fetch helper's full department code to check
        const dept = await tx.department.findUnique({
          where: { id: helperDeptId },
        });
        const deptCode = dept?.code || "";

        let shouldApprove = false;
        if (
          isSalesAdmin &&
          (deptCode === "SA" ||
            deptCode === "SS" ||
            helper.employee.positionTitle?.includes("เซลส์") ||
            helper.employee.positionTitle?.includes("ส่งเสริม"))
        ) {
          shouldApprove = true;
        } else if (
          isMktManager &&
          (deptCode === "MKT" ||
            helper.employee.positionTitle?.includes("การตลาด"))
        ) {
          shouldApprove = true;
        }

        if (shouldApprove) {
          await tx.activityHelper.update({
            where: { id: helper.id },
            data: {
              status: ActivityHelperStatus.APPROVED,
              approvedById: approverEmployee.id,
              approvedAt: new Date(),
            },
          });
          helperApprovedCount++;
        }
      }

      if (helperApprovedCount === 0) {
        return {
          success: false,
          error: "ไม่มีผู้ช่วยงานภายใต้สังกัดของคุณที่รอการอนุมัติในแผนงานนี้",
        };
      }

      await tx.activityApprovalLog.create({
        data: {
          activityPlanId: planId,
          userId,
          action: ActivityApprovalAction.APPROVE,
          step: ActivityApprovalStep.HELPER_APPROVAL,
          comment:
            comment ||
            `อนุมัติพนักงานช่วยงานในสังกัดจำนวน ${helperApprovedCount} คน`,
        },
      });

      // Reload helpers to check if all approved
      const allHelpers = await tx.activityHelper.findMany({
        where: { activityPlanId: planId, deletedAt: null },
      });
      const allApproved = allHelpers.every(
        (h) => h.status === ActivityHelperStatus.APPROVED,
      );

      if (allApproved) {
        // Complete the flow and transition to APPROVED (Step 5)
        await tx.activityPlan.update({
          where: { id: planId },
          data: { status: ActivityStatus.APPROVED },
        });

        await tx.activityApprovalLog.create({
          data: {
            activityPlanId: planId,
            userId,
            action: ActivityApprovalAction.APPROVE,
            step: ActivityApprovalStep.HELPER_APPROVAL,
            comment: "อนุมัติแผนกิจกรรมสมบูรณ์และบันทึกลงระบบสำเร็จ 🚀",
          },
        });

        // Notify Creator
        await sendNotificationHelper(
          plan.employee.userId,
          "แผนกิจกรรมได้รับการอนุมัติสำเร็จ 🚀",
          `แผนกิจกรรม "${plan.title}" ได้รับการอนุมัติเสร็จสิ้นเรียบร้อยแล้ว`,
          "APPROVED",
          `/activity-plans/${plan.id}`,
          tx,
        );

        // Notify Helpers
        const helpersWithUsers = await tx.activityHelper.findMany({
          where: {
            activityPlanId: plan.id,
            status: ActivityHelperStatus.APPROVED,
            deletedAt: null,
          },
          include: { employee: true },
        });
        for (const h of helpersWithUsers) {
          await sendNotificationHelper(
            h.employee.userId,
            "คุณได้รับมอบหมายงานช่วยกิจกรรม",
            `คุณได้รับมอบหมายให้ช่วยจัดกิจกรรม "${plan.title}" ณ ${plan.location}`,
            "INFO",
            `/activity-plans/${plan.id}`,
            tx,
          );
        }

        // Sync to Calendar
        await syncActivityPlanToCalendarUseCase(plan, tx);
      } else {
        // Helper stages still in progress, notify remaining helper managers
        await notifyHelperApprovers(plan, tx);
      }

      return { success: true };
    }

    return {
      success: false,
      error: "แผนกิจกรรมไม่อยู่ในสถานะที่ต้องการอนุมัติ",
    };
  });
}

/**
 * Reject an Trip  plan (Ends the flow, moves to REJECTED)
 */
export async function rejectActivityPlanUseCase(
  planId: string,
  userId: string,
  comment?: string,
) {
  return db.$transaction(async (tx) => {
    const plan = await tx.activityPlan.findUnique({
      where: { id: planId, deletedAt: null },
      include: {
        employee: true,
        helpers: { where: { deletedAt: null } },
      },
    });

    if (!plan) return { success: false, error: "ไม่พบแผนกิจกรรม" };

    const approverEmployee = await tx.employee.findFirst({
      where: { userId, deletedAt: null },
      include: { position: true, department: true },
    });

    if (!approverEmployee)
      return { success: false, error: "ไม่พบโปรไฟล์พนักงานของคุณ" };

    // Verify authority based on current status
    let hasAuthority = false;
    let step: ActivityApprovalStep = ActivityApprovalStep.LINE_APPROVAL;

    if (plan.status === ActivityStatus.PENDING_LINE_APPROVAL) {
      hasAuthority = plan.currentApproverId === approverEmployee.id;
      step = ActivityApprovalStep.LINE_APPROVAL;
    } else if (plan.status === ActivityStatus.PENDING_BUDGET_APPROVAL) {
      hasAuthority =
        isSalesAdminManager(approverEmployee) ||
        isMarketingManager(approverEmployee) ||
        isSalesDirector(approverEmployee);
      step = ActivityApprovalStep.BUDGET_APPROVAL;
    } else if (plan.status === ActivityStatus.PENDING_HELPER_APPROVAL) {
      hasAuthority =
        isSalesAdminManager(approverEmployee) ||
        isMarketingManager(approverEmployee);
      step = ActivityApprovalStep.HELPER_APPROVAL;
    }

    if (!hasAuthority)
      return {
        success: false,
        error: "คุณไม่มีสิทธิ์ปฏิเสธแผนกิจกรรมนี้ในขั้นตอนนี้",
      };

    // Reject the plan
    await tx.activityPlan.update({
      where: { id: planId },
      data: {
        status: ActivityStatus.REJECTED,
        currentApproverId: null,
      },
    });

    await tx.activityApprovalLog.create({
      data: {
        activityPlanId: planId,
        userId,
        action: ActivityApprovalAction.REJECT,
        step,
        comment: comment || "ปฏิเสธแผนกิจกรรม",
      },
    });

    // Notify Creator
    await sendNotificationHelper(
      plan.employee.userId,
      "แผนกิจกรรมของคุณไม่ได้รับการอนุมัติ",
      `แผนกิจกรรม "${plan.title}" ถูกปฏิเสธ: ${comment || "ไม่ระบุเหตุผล"}`,
      "REJECTED",
      `/activity-plans/${plan.id}`,
      tx,
    );

    return { success: true };
  });
}

/**
 * Request correction (Sends plan back to WAITING_FOR_CORRECTION)
 */
export async function requestCorrectionPlanUseCase(
  planId: string,
  userId: string,
  comment: string,
) {
  if (!comment)
    return {
      success: false,
      error: "กรุณาระบุสิ่งที่ต้องการให้แก้ไขลงในหมายเหตุ/คอมเมนต์",
    };

  return db.$transaction(async (tx) => {
    const plan = await tx.activityPlan.findUnique({
      where: { id: planId, deletedAt: null },
      include: {
        employee: true,
        helpers: { where: { deletedAt: null } },
      },
    });

    if (!plan) return { success: false, error: "ไม่พบแผนกิจกรรม" };

    const approverEmployee = await tx.employee.findFirst({
      where: { userId, deletedAt: null },
      include: { position: true, department: true },
    });

    if (!approverEmployee)
      return { success: false, error: "ไม่พบโปรไฟล์พนักงานของคุณ" };

    // Verify authority
    let hasAuthority = false;
    let step: ActivityApprovalStep = ActivityApprovalStep.LINE_APPROVAL;

    if (plan.status === ActivityStatus.PENDING_LINE_APPROVAL) {
      hasAuthority = plan.currentApproverId === approverEmployee.id;
      step = ActivityApprovalStep.LINE_APPROVAL;
    } else if (plan.status === ActivityStatus.PENDING_BUDGET_APPROVAL) {
      hasAuthority =
        isSalesAdminManager(approverEmployee) ||
        isMarketingManager(approverEmployee) ||
        isSalesDirector(approverEmployee);
      step = ActivityApprovalStep.BUDGET_APPROVAL;
    } else if (plan.status === ActivityStatus.PENDING_HELPER_APPROVAL) {
      hasAuthority =
        isSalesAdminManager(approverEmployee) ||
        isMarketingManager(approverEmployee);
      step = ActivityApprovalStep.HELPER_APPROVAL;

      // If helper manager rejects helper, also reject the helper's helper record
      const isSalesAdmin = isSalesAdminManager(approverEmployee);
      const isMktManager = isMarketingManager(approverEmployee);

      for (const helper of plan.helpers) {
        if (helper.status === ActivityHelperStatus.PENDING) {
          const emp = await tx.employee.findUnique({
            where: { id: helper.employeeId },
            include: { department: true },
          });
          const deptCode = emp?.department?.code || "";

          let match = false;
          if (isSalesAdmin && (deptCode === "SA" || deptCode === "SS"))
            match = true;
          if (isMktManager && deptCode === "MKT") match = true;

          if (match) {
            await tx.activityHelper.update({
              where: { id: helper.id },
              data: {
                status: ActivityHelperStatus.REJECTED,
                rejectionReason: comment,
              },
            });
          }
        }
      }
    }

    if (!hasAuthority)
      return {
        success: false,
        error: "คุณไม่มีสิทธิ์ส่งตีกลับแผนกิจกรรมนี้ในขั้นตอนนี้",
      };

    // Reset status back to WAITING_FOR_CORRECTION
    await tx.activityPlan.update({
      where: { id: planId },
      data: {
        status: ActivityStatus.WAITING_FOR_CORRECTION,
        currentApproverId: null,
        salesPromotionApproved:
          plan.salesPromotionBudget && plan.salesPromotionBudget.toNumber() > 0
            ? false
            : null,
        marketingApproved:
          plan.marketingBudget && plan.marketingBudget.toNumber() > 0
            ? false
            : null,
        salesManagerApproved: false,
      },
    });

    await tx.activityApprovalLog.create({
      data: {
        activityPlanId: planId,
        userId,
        action: ActivityApprovalAction.REQUEST_CORRECTION,
        step,
        comment,
      },
    });

    // Notify Creator
    await sendNotificationHelper(
      plan.employee.userId,
      "แผนกิจกรรมถูกส่งกลับให้แก้ไข",
      `แผนกิจกรรม "${plan.title}" ถูกตีกลับส่งแก้ไข: "${comment}"`,
      "WARNING",
      `/activity-plans/${plan.id}/edit`,
      tx,
    );

    return { success: true };
  });
}

/**
 * Cancel plan (Moves to CANCELLED, only creator can perform this)
 */
export async function cancelActivityPlanUseCase(
  planId: string,
  userId: string,
) {
  return db.$transaction(async (tx) => {
    const plan = await tx.activityPlan.findUnique({
      where: { id: planId, deletedAt: null },
    });

    if (!plan) return { success: false, error: "ไม่พบแผนกิจกรรม" };

    if (plan.createdById !== userId) {
      return {
        success: false,
        error: "คุณไม่ใช่ผู้สร้างแผนงานนี้ จึงไม่มีสิทธิ์ยกเลิก",
      };
    }

    if (
      plan.status === ActivityStatus.APPROVED ||
      plan.status === ActivityStatus.REJECTED ||
      plan.status === ActivityStatus.CANCELLED
    ) {
      return {
        success: false,
        error: "ไม่สามารถยกเลิกแผนงานที่สิ้นสุด Flow การทำงานแล้วได้",
      };
    }

    await tx.activityPlan.update({
      where: { id: planId },
      data: {
        status: ActivityStatus.CANCELLED,
        currentApproverId: null,
      },
    });

    await tx.activityApprovalLog.create({
      data: {
        activityPlanId: planId,
        userId,
        action: ActivityApprovalAction.CANCEL,
        step: ActivityApprovalStep.LINE_APPROVAL,
        comment: "ผู้สร้างแผนงานยกเลิกแผนกิจกรรม",
      },
    });

    return { success: true };
  });
}

// ────────────────────────────────────────────────────────
// Internal Transition Helpers (Run inside existing TX)
// ────────────────────────────────────────────────────────

async function initiateBudgetApproval(
  plan: any,
  tx: Prisma.TransactionClient,
  userId: string,
  logComment: string,
) {
  const hasSalesPromotion =
    plan.salesPromotionBudget && plan.salesPromotionBudget.toNumber() > 0;
  const hasMarketing =
    plan.marketingBudget && plan.marketingBudget.toNumber() > 0;

  if (hasSalesPromotion || hasMarketing) {
    const updatedPlan = await tx.activityPlan.update({
      where: { id: plan.id },
      data: {
        status: ActivityStatus.PENDING_BUDGET_APPROVAL,
        currentApproverId: null,
        salesPromotionApproved: hasSalesPromotion ? false : null,
        marketingApproved: hasMarketing ? false : null,
        salesManagerApproved: false,
      },
      include: { employee: true },
    });

    await tx.activityApprovalLog.create({
      data: {
        activityPlanId: plan.id,
        userId,
        action: ActivityApprovalAction.SUBMIT,
        step: ActivityApprovalStep.BUDGET_APPROVAL,
        comment: logComment || "เริ่มต้นการตรวจสอบงบประมาณประจำกิจกรรม",
      },
    });

    // Notify Budget Approvers
    await notifyBudgetApprovers(updatedPlan, tx);
  } else {
    // No budget, skip to helpers
    await initiateHelperApproval(plan, tx, userId);
  }
}

async function initiateHelperApproval(
  plan: any,
  tx: Prisma.TransactionClient,
  userId: string,
) {
  // Load helpers
  const helpers = await tx.activityHelper.findMany({
    where: { activityPlanId: plan.id, deletedAt: null },
  });

  if (helpers.length > 0) {
    // Reset helper status to PENDING
    await tx.activityHelper.updateMany({
      where: { activityPlanId: plan.id, deletedAt: null },
      data: {
        status: ActivityHelperStatus.PENDING,
        approvedById: null,
        approvedAt: null,
      },
    });

    const updatedPlan = await tx.activityPlan.update({
      where: { id: plan.id },
      data: {
        status: ActivityStatus.PENDING_HELPER_APPROVAL,
        currentApproverId: null,
      },
      include: { employee: true },
    });

    await tx.activityApprovalLog.create({
      data: {
        activityPlanId: plan.id,
        userId,
        action: ActivityApprovalAction.SUBMIT,
        step: ActivityApprovalStep.HELPER_APPROVAL,
        comment: "ส่งขออนุญาตพนักงานช่วยงานกับหัวหน้าแผนกของผู้ช่วย",
      },
    });

    // Notify Helper Approvers
    await notifyHelperApprovers(updatedPlan, tx);
  } else {
    // No helpers, fully approved!
    const updatedPlan = await tx.activityPlan.update({
      where: { id: plan.id },
      data: {
        status: ActivityStatus.APPROVED,
        currentApproverId: null,
      },
      include: { employee: true },
    });

    await tx.activityApprovalLog.create({
      data: {
        activityPlanId: plan.id,
        userId,
        action: ActivityApprovalAction.APPROVE,
        step: ActivityApprovalStep.HELPER_APPROVAL,
        comment: "อนุมัติแผนกิจกรรมสมบูรณ์สำเร็จ (ไม่มีผู้ช่วยงาน) 🚀",
      },
    });

    // Notify Creator
    await sendNotificationHelper(
      updatedPlan.employee.userId,
      "แผนกิจกรรมได้รับการอนุมัติสำเร็จ 🚀",
      `แผนกิจกรรม "${updatedPlan.title}" ได้รับการอนุมัติและจัดสรรเสร็จสมบูรณ์แล้ว`,
      "APPROVED",
      `/activity-plans/${updatedPlan.id}`,
      tx,
    );

    // Sync to Calendar
    await syncActivityPlanToCalendarUseCase(updatedPlan, tx);
  }
}
