import { db } from "@/lib/db";
import {
  Prisma,
  ActivityStatus,
  ActivityHelperStatus,
  ActivityApprovalAction,
  ActivityApprovalStep,
} from "@prisma/client";
import {
  syncActivityPlanToCalendarUseCase,
  cancelActivityPlanCalendarUseCase,
} from "./calendar-integration";

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
  const posName = employee.position?.name || employee.positionTitle || "";
  const level = employee.position?.level ?? 0;
  return (
    posName.includes("ผู้จัดการแผนกบริหารงานขาย") ||
    posName.includes("บริหารงานขาย") ||
    (employee.department?.code === "SA" &&
      employee.position?.isManagerial &&
      level >= 3 &&
      !posName.includes("ภาค"))
  );
}

// Helper to determine if an employee is the Marketing Manager
function isMarketingManager(employee: any): boolean {
  if (!employee) return false;
  const posName = employee.position?.name || employee.positionTitle || "";
  return (
    posName.includes("ผู้จัดการแผนกการตลาด") ||
    posName.includes("ผจก.แผนก MKT") ||
    (employee.department?.code === "MKT" && employee.position?.isManagerial)
  );
}

// Helper to determine if an employee is the Sales Manager (Director / Overall Budget Approver)
function isSalesDirector(employee: any): boolean {
  if (!employee) return false;
  const posName = employee.position?.name || employee.positionTitle || "";
  const level = employee.position?.level ?? 0;
  return (
    posName.includes("ผู้จัดการฝ่ายขาย") ||
    posName.includes("ผจก.ฝ่ายขาย") ||
    level >= 4
  );
}

// Helper to check terminal line manager condition
function isTerminalLineManager(employee: any): boolean {
  if (!employee) return true;
  return (
    isSalesAdminManager(employee) ||
    isMarketingManager(employee) ||
    isSalesDirector(employee)
  );
}

// Dynamic Approver Lookup Helpers
async function getAreaManagers(tx: Prisma.TransactionClient, departmentId?: string | null) {
  return tx.employee.findMany({
    where: {
      deletedAt: null,
      OR: [
        { position: { name: "ผู้จัดการภาค" } },
        { positionTitle: { contains: "ผู้จัดการภาค" } },
      ],
      ...(departmentId ? { departmentId } : {}),
    },
    include: { position: true, department: true },
  });
}

async function getSalespersons(tx: Prisma.TransactionClient, departmentId?: string | null) {
  return tx.employee.findMany({
    where: {
      deletedAt: null,
      OR: [
        { position: { name: "พนักงานขาย" } },
        { positionTitle: { contains: "พนักงานขาย" } },
        { positionTitle: { contains: "เซลส์" } },
      ],
      ...(departmentId ? { departmentId } : {}),
    },
    include: { position: true, department: true },
  });
}

/**
 * Resolves the next approver in the Line Approval hierarchy.
 * Priority:
 * 1. Direct explicit managerId
 * 2. Position-based lookup:
 *    - Promoter -> Salesperson -> Area Manager -> Sales Admin Manager
 *    - Salesperson -> Area Manager -> Sales Admin Manager
 *    - Area Manager -> Sales Admin Manager
 */
async function resolveNextLineApprover(
  currentEmployee: any,
  tx: Prisma.TransactionClient,
): Promise<string | null> {
  if (!currentEmployee) return null;

  // 1. If explicit managerId exists, use it
  if (currentEmployee.managerId) {
    return currentEmployee.managerId;
  }

  const posName =
    currentEmployee.position?.name || currentEmployee.positionTitle || "";
  const deptId = currentEmployee.departmentId;

  // 2. Dynamic Position-based Lookup Fallback
  if (posName.includes("ส่งเสริม")) {
    // Promoter -> Salesperson
    const salespersons = await getSalespersons(tx, deptId);
    if (salespersons.length > 0 && salespersons[0].id !== currentEmployee.id) {
      return salespersons[0].id;
    }
    // Fallback to Area Manager
    const areaMgrs = await getAreaManagers(tx, deptId);
    if (areaMgrs.length > 0 && areaMgrs[0].id !== currentEmployee.id) {
      return areaMgrs[0].id;
    }
    // Fallback to Sales Admin Manager
    const saMgrs = await getSalesAdminManagers(tx);
    if (saMgrs.length > 0 && saMgrs[0].id !== currentEmployee.id) {
      return saMgrs[0].id;
    }
  }

  if (posName.includes("พนักงานขาย") || posName.includes("เซลส์")) {
    // Salesperson -> Area Manager
    const areaMgrs = await getAreaManagers(tx, deptId);
    if (areaMgrs.length > 0 && areaMgrs[0].id !== currentEmployee.id) {
      return areaMgrs[0].id;
    }
    // Fallback to Sales Admin Manager
    const saMgrs = await getSalesAdminManagers(tx);
    if (saMgrs.length > 0 && saMgrs[0].id !== currentEmployee.id) {
      return saMgrs[0].id;
    }
  }

  if (posName.includes("ผู้จัดการภาค")) {
    // Area Manager -> Sales Admin Manager
    const saMgrs = await getSalesAdminManagers(tx);
    if (saMgrs.length > 0 && saMgrs[0].id !== currentEmployee.id) {
      return saMgrs[0].id;
    }
  }

  // General Sales/Promotions fallback
  const saManagers = await getSalesAdminManagers(tx);
  if (saManagers.length > 0 && saManagers[0].id !== currentEmployee.id) {
    return saManagers[0].id;
  }

  return null;
}

// Helper to check if a user has Administrator role
async function checkIsAdministrator(
  userId: string,
  tx: Prisma.TransactionClient,
): Promise<boolean> {
  const user = await tx.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user) return false;

  return user.userRoles.some((ur) => {
    const slug = ur.role?.slug?.toLowerCase();
    const name = ur.role?.name?.toLowerCase();
    return (
      slug === "administrator" ||
      slug === "admin" ||
      slug === "ceo" ||
      name === "administrator"
    );
  });
}

// Fetch manager user IDs for notifications & approver resolution
async function getSalesAdminManagers(tx: Prisma.TransactionClient) {
  return tx.employee.findMany({
    where: {
      deletedAt: null,
      OR: [
        { position: { name: "ผู้จัดการแผนกบริหารงานขาย" } },
        { positionTitle: { contains: "ผู้จัดการแผนกบริหารงานขาย" } },
        { department: { code: "SA" }, position: { isManagerial: true, level: { gte: 3 } } },
      ],
    },
    select: { id: true, userId: true },
  });
}

async function getMarketingManagers(tx: Prisma.TransactionClient) {
  return tx.employee.findMany({
    where: {
      deletedAt: null,
      OR: [
        { position: { name: "ผู้จัดการแผนกการตลาด" } },
        { positionTitle: { contains: "ผู้จัดการแผนกการตลาด" } },
        { department: { code: "MKT" }, position: { isManagerial: true } },
      ],
    },
    select: { id: true, userId: true },
  });
}

async function getSalesDirectors(tx: Prisma.TransactionClient) {
  return tx.employee.findMany({
    where: {
      deletedAt: null,
      OR: [
        { position: { name: "ผู้จัดการฝ่ายขาย" } },
        { positionTitle: { contains: "ผู้จัดการฝ่ายขาย" } },
        { position: { level: { gte: 4 } } },
      ],
    },
    select: { id: true, userId: true },
  });
}

async function notifyBudgetApprovers(plan: any, tx: Prisma.TransactionClient) {
  const hasSalesPromotion =
    plan.salesPromotionBudgetRequested && plan.salesPromotionBudgetRequested.toNumber() > 0;
  const hasMarketing =
    plan.marketingBudgetRequested && plan.marketingBudgetRequested.toNumber() > 0;

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
    const isTerminalCreator = isTerminalLineManager(creator);

    if (isTerminalCreator) {
      // Terminal manager creates plan: skip line approval directly to budget
      await initiateBudgetApproval(
        plan,
        tx,
        userId,
        "ส่งแผนงานสำเร็จ (ผ่านขั้นตอนอนุมัติตามสายงานโดยอัตโนมัติสำหรับผู้บริหาร)",
      );
      return { success: true };
    }

    // Resolve next approver (by managerId or dynamic position lookup)
    const firstApproverId = await resolveNextLineApprover(creator, tx);

    if (!firstApproverId) {
      // Fallback only if no manager or position rule matched
      await initiateBudgetApproval(
        plan,
        tx,
        userId,
        "ส่งแผนงานสำเร็จ (ข้ามขั้นตอนอนุมัติตามสายงานเนื่องจากไม่พบผู้จัดการตามสายงาน)",
      );
      return { success: true };
    }

    // Set status to PENDING_LINE_APPROVAL and assign first approver
    await tx.activityPlan.update({
      where: { id: planId },
      data: {
        status: ActivityStatus.PENDING_LINE_APPROVAL,
        currentApproverEmployeeId: firstApproverId,
        submittedAt: new Date(),
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
      firstApproverId,
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

    const isAdmin = await checkIsAdministrator(userId, tx);

    // Fetch approver employee profile (optional if isAdmin)
    const approverEmployee = await tx.employee.findFirst({
      where: { userId, deletedAt: null },
      include: { position: true, department: true },
    });

    if (!approverEmployee && !isAdmin) {
      return { success: false, error: "ไม่พบโปรไฟล์พนักงานของผู้ดำเนินการ" };
    }

    // ────────────────────────────────────────────────────────
    // Step 2: Line Approval
    // ────────────────────────────────────────────────────────
    if (plan.status === ActivityStatus.PENDING_LINE_APPROVAL) {
      if (!isAdmin && plan.currentApproverEmployeeId !== approverEmployee?.id) {
        return {
          success: false,
          error: "คุณไม่มีสิทธิ์อนุมัติแผนงานนี้ในขั้นตอนนี้",
        };
      }

      // Check if this approver is terminal line manager or Admin
      if (isAdmin || isTerminalLineManager(approverEmployee)) {
        // Line approval is complete! Proceed to Step 3 Budget Approval
        await tx.activityApprovalLog.create({
          data: {
            activityPlanId: planId,
            userId,
            action: ActivityApprovalAction.APPROVE,
            step: ActivityApprovalStep.LINE_APPROVAL,
            comment:
              comment ||
              (isAdmin
                ? "อนุมัติตามสายงาน (Administrator)"
                : "อนุมัติตามสายงานขั้นสุดท้าย"),
          },
        });
        await initiateBudgetApproval(
          plan,
          tx,
          userId,
          "ผ่านการตรวจสอบตามสายงาน",
        );
      } else {
        // Not terminal, resolve next manager in chain (via managerId or dynamic position lookup)
        const nextManagerId = await resolveNextLineApprover(approverEmployee, tx);

        if (!nextManagerId || nextManagerId === approverEmployee?.id) {
          // Terminal reached or fallback
          await tx.activityApprovalLog.create({
            data: {
              activityPlanId: planId,
              userId,
              action: ActivityApprovalAction.APPROVE,
              step: ActivityApprovalStep.LINE_APPROVAL,
              comment:
                comment ||
                "อนุมัติตามสายงานสิ้นสุด",
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
            data: { currentApproverEmployeeId: nextManagerId },
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

      const hasSalesPromotion =
        Number(plan.salesPromotionBudgetRequested || 0) > 0;
      const hasMarketing =
        Number(plan.marketingBudgetRequested || 0) > 0;

      if (isAdmin) {
        // Administrator approves all pending budget stages at once
        if (hasSalesPromotion) plan.salesPromotionApproved = true;
        if (hasMarketing) plan.marketingApproved = true;
        plan.salesManagerApproved = true;
        isAnyBudgetApproved = true;

        await tx.activityApprovalLog.create({
          data: {
            activityPlanId: planId,
            userId,
            action: ActivityApprovalAction.APPROVE,
            step: ActivityApprovalStep.BUDGET_APPROVAL,
            comment: comment || "อนุมัติงบประมาณทั้งหมด (Administrator)",
          },
        });
      } else {
        // 1. Sales Promotion Budget Approval
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

        // 3. Sales Director Approval (Overall Budget Approval)
        const requiredSalesPromotionOk =
          !hasSalesPromotion || plan.salesPromotionApproved === true;
        const requiredMarketingOk =
          !hasMarketing || plan.marketingApproved === true;

        if (
          requiredSalesPromotionOk &&
          requiredMarketingOk &&
          plan.salesManagerApproved !== true
        ) {
          if (isSalesDirector(approverEmployee)) {
            plan.salesManagerApproved = true;
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
      }

      const requiredSalesPromotionOk =
        !hasSalesPromotion || plan.salesPromotionApproved === true;
      const requiredMarketingOk =
        !hasMarketing || plan.marketingApproved === true;
      const salesDirectorOk = plan.salesManagerApproved === true;

      if (!isAnyBudgetApproved) {
        return {
          success: false,
          error:
            "คุณไม่มีสิทธิ์อนุมัติงบประมาณประเภทนี้ หรือได้รับการอนุมัติไปแล้ว",
        };
      }

      // Update budget progress flags & approved budget amounts if complete
      const isBudgetFullyApproved =
        requiredSalesPromotionOk && requiredMarketingOk && salesDirectorOk;

      const spApprovedAmount =
        requiredSalesPromotionOk && hasSalesPromotion
          ? plan.salesPromotionBudgetRequested
          : null;
      const mktApprovedAmount =
        requiredMarketingOk && hasMarketing
          ? plan.marketingBudgetRequested
          : null;
      const totalApprovedAmount = isBudgetFullyApproved
        ? Number(spApprovedAmount || 0) + Number(mktApprovedAmount || 0)
        : null;

      const updatedPlan = await tx.activityPlan.update({
        where: { id: planId },
        data: {
          salesPromotionApproved: plan.salesPromotionApproved,
          marketingApproved: plan.marketingApproved,
          salesManagerApproved: plan.salesManagerApproved,
          salesPromotionBudgetApproved: spApprovedAmount,
          marketingBudgetApproved: mktApprovedAmount,
          totalBudgetApproved: totalApprovedAmount
            ? new Prisma.Decimal(totalApprovedAmount)
            : undefined,
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
      const pendingHelpers = plan.helpers.filter(
        (h) => h.status === ActivityHelperStatus.PENDING,
      );

      if (pendingHelpers.length === 0) {
        await tx.activityPlan.update({
          where: { id: planId },
          data: {
            status: ActivityStatus.APPROVED,
            approvedAt: new Date(),
            currentApproverEmployeeId: null,
          },
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

      if (isAdmin) {
        // Administrator approves ALL pending helpers at once
        for (const helper of pendingHelpers) {
          await tx.activityHelper.update({
            where: { id: helper.id },
            data: {
              status: ActivityHelperStatus.APPROVED,
              approvedById: approverEmployee?.id || null,
              approvedAt: new Date(),
            },
          });
        }

        await tx.activityPlan.update({
          where: { id: planId },
          data: {
            status: ActivityStatus.APPROVED,
            approvedAt: new Date(),
            currentApproverEmployeeId: null,
          },
        });

        await tx.activityApprovalLog.create({
          data: {
            activityPlanId: planId,
            userId,
            action: ActivityApprovalAction.APPROVE,
            step: ActivityApprovalStep.HELPER_APPROVAL,
            comment:
              comment ||
              `อนุมัติพนักงานช่วยงานทั้งหมด ${pendingHelpers.length} คน (Administrator)`,
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

        return { success: true };
      }

      // Non-admin helper approval
      let helperApprovedCount = 0;
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
              approvedById: approverEmployee!.id,
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
          data: {
            status: ActivityStatus.APPROVED,
            approvedAt: new Date(),
            currentApproverEmployeeId: null,
          },
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
 * Reject an Trip plan (Ends the flow, moves to REJECTED)
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

    const isAdmin = await checkIsAdministrator(userId, tx);

    const approverEmployee = await tx.employee.findFirst({
      where: { userId, deletedAt: null },
      include: { position: true, department: true },
    });

    if (!approverEmployee && !isAdmin)
      return { success: false, error: "ไม่พบโปรไฟล์พนักงานของคุณ" };

    // Verify authority based on current status
    let hasAuthority = isAdmin;
    let step: ActivityApprovalStep = ActivityApprovalStep.LINE_APPROVAL;

    if (plan.status === ActivityStatus.PENDING_LINE_APPROVAL) {
      if (!isAdmin) hasAuthority = plan.currentApproverEmployeeId === approverEmployee?.id;
      step = ActivityApprovalStep.LINE_APPROVAL;
    } else if (plan.status === ActivityStatus.PENDING_BUDGET_APPROVAL) {
      if (!isAdmin) {
        hasAuthority =
          isSalesAdminManager(approverEmployee) ||
          isMarketingManager(approverEmployee) ||
          isSalesDirector(approverEmployee);
      }
      step = ActivityApprovalStep.BUDGET_APPROVAL;
    } else if (plan.status === ActivityStatus.PENDING_HELPER_APPROVAL) {
      if (!isAdmin) {
        hasAuthority =
          isSalesAdminManager(approverEmployee) ||
          isMarketingManager(approverEmployee);
      }
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
        currentApproverEmployeeId: null,
        rejectedAt: new Date(),
      },
    });

    await cancelActivityPlanCalendarUseCase(planId, tx);

    await tx.activityApprovalLog.create({
      data: {
        activityPlanId: planId,
        userId,
        action: ActivityApprovalAction.REJECT,
        step,
        comment:
          comment ||
          (isAdmin ? "ปฏิเสธแผนกิจกรรม (Administrator)" : "ปฏิเสธแผนกิจกรรม"),
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

    const isAdmin = await checkIsAdministrator(userId, tx);

    const approverEmployee = await tx.employee.findFirst({
      where: { userId, deletedAt: null },
      include: { position: true, department: true },
    });

    if (!approverEmployee && !isAdmin)
      return { success: false, error: "ไม่พบโปรไฟล์พนักงานของคุณ" };

    // Verify authority
    let hasAuthority = isAdmin;
    let step: ActivityApprovalStep = ActivityApprovalStep.LINE_APPROVAL;

    if (plan.status === ActivityStatus.PENDING_LINE_APPROVAL) {
      if (!isAdmin) hasAuthority = plan.currentApproverEmployeeId === approverEmployee?.id;
      step = ActivityApprovalStep.LINE_APPROVAL;
    } else if (plan.status === ActivityStatus.PENDING_BUDGET_APPROVAL) {
      if (!isAdmin) {
        hasAuthority =
          isSalesAdminManager(approverEmployee) ||
          isMarketingManager(approverEmployee) ||
          isSalesDirector(approverEmployee);
      }
      step = ActivityApprovalStep.BUDGET_APPROVAL;
    } else if (plan.status === ActivityStatus.PENDING_HELPER_APPROVAL) {
      if (!isAdmin) {
        hasAuthority =
          isSalesAdminManager(approverEmployee) ||
          isMarketingManager(approverEmployee);
      }
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

          let match = isAdmin;
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
        currentApproverEmployeeId: null,
        salesPromotionApproved:
          plan.salesPromotionBudgetRequested &&
          plan.salesPromotionBudgetRequested.toNumber() > 0
            ? false
            : null,
        marketingApproved:
          plan.marketingBudgetRequested &&
          plan.marketingBudgetRequested.toNumber() > 0
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
        currentApproverEmployeeId: null,
        cancelledAt: new Date(),
      },
    });

    await cancelActivityPlanCalendarUseCase(planId, tx);

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
    Number(plan.salesPromotionBudgetRequested || 0) > 0;
  const hasMarketing =
    Number(plan.marketingBudgetRequested || 0) > 0;

  if (hasSalesPromotion || hasMarketing) {
    const updatedPlan = await tx.activityPlan.update({
      where: { id: plan.id },
      data: {
        status: ActivityStatus.PENDING_BUDGET_APPROVAL,
        currentApproverEmployeeId: null,
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
        currentApproverEmployeeId: null,
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
        currentApproverEmployeeId: null,
        approvedAt: new Date(),
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

/**
 * Review a single Helper employee (Approve or Reject with reason).
 * Allows department managers to approve or reject helpers under their supervision individually.
 */
export async function reviewSingleActivityHelperUseCase(
  activityPlanId: string,
  helperEmployeeId: string,
  userId: string,
  decision: "APPROVE" | "REJECT",
  rejectionReason?: string,
) {
  return db.$transaction(async (tx) => {
    const plan = await tx.activityPlan.findUnique({
      where: { id: activityPlanId, deletedAt: null },
      include: {
        employee: true,
        helpers: { where: { deletedAt: null }, include: { employee: true } },
      },
    });

    if (!plan) return { success: false, error: "ไม่พบแผนกิจกรรม" };
    if (plan.status !== ActivityStatus.PENDING_HELPER_APPROVAL) {
      return {
        success: false,
        error: "แผนกิจกรรมไม่อยู่ในสถานะรออนุมัติผู้ช่วยงาน",
      };
    }

    const isAdmin = await checkIsAdministrator(userId, tx);
    const approverEmployee = await tx.employee.findFirst({
      where: { userId, deletedAt: null },
      include: { position: true, department: true },
    });

    if (!approverEmployee && !isAdmin) {
      return { success: false, error: "ไม่พบโปรไฟล์พนักงานของคุณ" };
    }

    const helper = plan.helpers.find((h) => h.employeeId === helperEmployeeId);
    if (!helper) {
      return {
        success: false,
        error: "ไม่พบพนักงานช่วยงานที่ระบุในแผนงานนี้",
      };
    }

    const helperDept = await tx.department.findUnique({
      where: { id: helper.employee.departmentId || "" },
    });
    const deptCode = helperDept?.code || "";
    const isSalesAdmin = isSalesAdminManager(approverEmployee);
    const isMktManager = isMarketingManager(approverEmployee);

    let hasAuthority = isAdmin;
    if (
      isSalesAdmin &&
      (deptCode === "SA" ||
        deptCode === "SS" ||
        helper.employee.positionTitle?.includes("เซลส์") ||
        helper.employee.positionTitle?.includes("ส่งเสริม"))
    ) {
      hasAuthority = true;
    } else if (
      isMktManager &&
      (deptCode === "MKT" ||
        helper.employee.positionTitle?.includes("การตลาด"))
    ) {
      hasAuthority = true;
    }

    if (!hasAuthority) {
      return {
        success: false,
        error: "คุณไม่มีสิทธิ์พิจารณาพนักงานช่วยงานท่านนี้",
      };
    }

    if (decision === "APPROVE") {
      await tx.activityHelper.update({
        where: { id: helper.id },
        data: {
          status: ActivityHelperStatus.APPROVED,
          approvedById: approverEmployee?.id || null,
          approvedAt: new Date(),
          rejectionReason: null,
          respondedAt: new Date(),
        },
      });

      await tx.activityApprovalLog.create({
        data: {
          activityPlanId,
          userId,
          action: ActivityApprovalAction.APPROVE,
          step: ActivityApprovalStep.HELPER_APPROVAL,
          comment: `อนุมัติให้ ${helper.employee.name} ไปช่วยงานกิจกรรม`,
        },
      });

      // Check if all helpers are approved
      const allHelpers = await tx.activityHelper.findMany({
        where: { activityPlanId, deletedAt: null },
      });
      const allApproved = allHelpers.every(
        (h) => h.status === ActivityHelperStatus.APPROVED,
      );

      if (allApproved) {
        const updatedPlan = await tx.activityPlan.update({
          where: { id: activityPlanId },
          data: {
            status: ActivityStatus.APPROVED,
            approvedAt: new Date(),
            currentApproverEmployeeId: null,
          },
          include: { employee: true },
        });

        await sendNotificationHelper(
          plan.employee.userId,
          "แผนกิจกรรมได้รับการอนุมัติสำเร็จ 🚀",
          `แผนกิจกรรม "${plan.title}" ได้รับการอนุมัติเสร็จสิ้นเรียบร้อยแล้ว`,
          "APPROVED",
          `/activity-plans/${plan.id}`,
          tx,
        );

        // Sync to Calendar
        await syncActivityPlanToCalendarUseCase(updatedPlan, tx);
      }
      return { success: true };
    } else {
      // REJECT helper -> Reject the single helper and send back for correction
      await tx.activityHelper.update({
        where: { id: helper.id },
        data: {
          status: ActivityHelperStatus.REJECTED,
          rejectionReason: rejectionReason || "ไม่อนุญาตให้ไปช่วยงาน",
          respondedAt: new Date(),
        },
      });

      // Transition whole plan back to WAITING_FOR_CORRECTION so creator can replace the helper
      await tx.activityPlan.update({
        where: { id: activityPlanId },
        data: {
          status: ActivityStatus.WAITING_FOR_CORRECTION,
          currentApproverEmployeeId: null,
        },
      });

      await tx.activityApprovalLog.create({
        data: {
          activityPlanId,
          userId,
          action: ActivityApprovalAction.REQUEST_CORRECTION,
          step: ActivityApprovalStep.HELPER_APPROVAL,
          comment: `ไม่อนุมัติให้ ${helper.employee.name} ไปช่วยงาน: ${rejectionReason || "กรุณาเปลี่ยนผู้ช่วยงานใหม่"}`,
        },
      });

      await sendNotificationHelper(
        plan.employee.userId,
        "คำขอผู้ช่วยงานไม่ได้รับอนุมัติ (กรุณาแก้ไขรายชื่อ)",
        `แผนกิจกรรม "${plan.title}" ไม่อนุมัติให้ ${helper.employee.name} ไปช่วยงาน: "${rejectionReason || "กรุณาเปลี่ยนผู้ช่วยงานใหม่"}"`,
        "WARNING",
        `/activity-plans/${plan.id}/edit`,
        tx,
      );

      return { success: true };
    }
  });
}
