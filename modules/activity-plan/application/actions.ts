"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createActivityPlan(formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const requesterId = formData.get("requesterId") as string;
  const useSalesBudget = formData.get("useSalesBudget") === "true";
  const useMarketingBudget = formData.get("useMarketingBudget") === "true";
  const helperIds = formData.getAll("helperIds") as string[];

  if (!title || !requesterId) {
    throw new Error("Missing required fields");
  }

  // 1. Create the Activity Plan
  const plan = await db.activityPlan.create({
    data: {
      title,
      description,
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)), // 1 week
      requesterId,
      useSalesBudget,
      useMarketingBudget,
      status: "PENDING_APPROVAL",
      helpers: {
        connect: helperIds.map(id => ({ id }))
      }
    },
  });

  // 2. Fetch template routing config for this requester
  const employeeRoute = await db.employeeApprovalRoute.findUnique({
    where: { employeeId: requesterId },
    include: {
      template: {
        include: {
          steps: {
            orderBy: { stepOrder: "asc" },
          },
        },
      },
    },
  });

  if (!employeeRoute) {
    // If no template assigned, we can just throw or auto-approve. Let's auto-approve for now or throw.
    // Let's throw since they should be assigned a template.
    throw new Error("พนักงานคนนี้ยังไม่ได้ถูกกำหนดสายอนุมัติ (Template)");
  }

  const routeSteps = employeeRoute.template.steps;

  // 3. Filter steps based on budget conditions
  const validSteps = routeSteps.filter((config) => {
    if (config.budgetCondition === "ALWAYS") return true;
    if (config.budgetCondition === "SALES_ONLY" && useSalesBudget) return true;
    if (config.budgetCondition === "MARKETING_ONLY" && useMarketingBudget)
      return true;
    if (
      config.budgetCondition === "ANY_BUDGET" &&
      (useSalesBudget || useMarketingBudget)
    )
      return true;
    return false;
  });

  // 4. Create Approval Steps based on the filtered dynamic config
  for (const config of validSteps) {
    await db.activityApprovalStep.create({
      data: {
        activityPlanId: plan.id,
        stepOrder: config.stepOrder,
        requiredRole: config.stepName,
        approverId: config.approverId,
        status: "PENDING",
      },
    });
  }

  // 5. Add dynamic steps for Helper's Managers
  if (helperIds.length > 0) {
    const helpers = await db.employee.findMany({
      where: { id: { in: helperIds } },
      select: { id: true, name: true, managerId: true }
    });

    const highestStepOrder = validSteps.length > 0 
      ? Math.max(...validSteps.map(s => s.stepOrder)) 
      : 0;

    const helperStepOrder = highestStepOrder + 1; // Always happen after normal route

    // Add unique managers
    const managerIds = Array.from(new Set(helpers.map(h => h.managerId).filter(Boolean))) as string[];

    for (const managerId of managerIds) {
      // Find which helpers belong to this manager for comments/info
      const helpingEmployees = helpers.filter(h => h.managerId === managerId).map(h => h.name).join(", ");
      
      await db.activityApprovalStep.create({
        data: {
          activityPlanId: plan.id,
          stepOrder: helperStepOrder,
          requiredRole: `ผจก.ของผู้ช่วย (${helpingEmployees})`,
          approverId: managerId,
          status: "PENDING",
        }
      });
    }

    // If we added helper steps and had no validSteps initially, we need to make sure we don't auto-approve
    if (validSteps.length === 0 && managerIds.length > 0) {
      validSteps.push({ stepOrder: helperStepOrder } as any);
    }
  }

  // 6. Finalize plan status
  if (validSteps.length === 0) {
    await db.activityPlan.update({
      where: { id: plan.id },
      data: { status: "APPROVED" },
    });
  } else {
    // set the first active step order
    await db.activityPlan.update({
      where: { id: plan.id },
      data: { currentStepOrder: validSteps[0].stepOrder },
    });
  }

  revalidatePath("/activity-plan");
  return plan;
}

export async function approveStep(stepId: string, comments?: string) {
  const step = await db.activityApprovalStep.findUnique({
    where: { id: stepId },
    include: { activityPlan: { include: { approvalSteps: true } } },
  });

  if (!step) throw new Error("Step not found");

  // 1. Mark this step as APPROVED
  await db.activityApprovalStep.update({
    where: { id: stepId },
    data: { status: "APPROVED", actionDate: new Date(), comments },
  });

  // 2. Auto-Approve / Auto-Skip for same person in next steps
  const nextSteps = step.activityPlan.approvalSteps.filter(
    (s) =>
      s.stepOrder > step.stepOrder &&
      s.approverId === step.approverId &&
      s.status === "PENDING",
  );
  for (const nextStep of nextSteps) {
    await db.activityApprovalStep.update({
      where: { id: nextStep.id },
      data: {
        status: "SKIPPED",
        actionDate: new Date(),
        comments: "Auto-approved by multiple roles",
      },
    });
  }

  // 3. Check if all steps in current order are APPROVED or SKIPPED (Parallel Approval Logic)
  const allSteps = await db.activityApprovalStep.findMany({
    where: { activityPlanId: step.activityPlanId },
    orderBy: { stepOrder: "asc" },
  });

  const currentOrderSteps = allSteps.filter(
    (s) => s.stepOrder === step.stepOrder,
  );
  const isCurrentOrderCompleted = currentOrderSteps.every(
    (s) => s.status === "APPROVED" || s.status === "SKIPPED",
  );

  if (isCurrentOrderCompleted) {
    // Find next step order
    const nextPendingStep = allSteps.find(
      (s) => s.status === "PENDING" && s.stepOrder > step.stepOrder,
    );

    if (!nextPendingStep) {
      // All done!
      await db.activityPlan.update({
        where: { id: step.activityPlanId },
        data: { status: "APPROVED" },
      });
    } else {
      // Move to next order
      await db.activityPlan.update({
        where: { id: step.activityPlanId },
        data: { currentStepOrder: nextPendingStep.stepOrder },
      });
    }
  }

  revalidatePath("/activity-plan");
}

export async function rejectStep(stepId: string, comments?: string) {
  const step = await db.activityApprovalStep.findUnique({
    where: { id: stepId },
  });

  if (!step) throw new Error("Step not found");

  await db.activityApprovalStep.update({
    where: { id: stepId },
    data: { status: "REJECTED", actionDate: new Date(), comments },
  });

  await db.activityPlan.update({
    where: { id: step.activityPlanId },
    data: { status: "REJECTED" },
  });

  revalidatePath("/activity-plan");
}

type ConfigStep = {
  id?: string;
  stepName: string;
  stepOrder: number;
  approverId: string;
  budgetCondition: any;
};

export async function saveRouteTemplate(
  templateId: string | null,
  name: string,
  description: string,
  steps: ConfigStep[],
) {
  if (!name) throw new Error("Missing template name");

  await db.$transaction(async (tx) => {
    let tId = templateId;

    if (tId) {
      await tx.approvalRouteTemplate.update({
        where: { id: tId },
        data: { name, description },
      });
      // Delete old steps
      await tx.approvalRouteStep.deleteMany({
        where: { templateId: tId },
      });
    } else {
      const newTemplate = await tx.approvalRouteTemplate.create({
        data: { name, description },
      });
      tId = newTemplate.id;
    }

    for (const step of steps) {
      await tx.approvalRouteStep.create({
        data: {
          templateId: tId!,
          stepName: step.stepName,
          stepOrder: step.stepOrder,
          approverId: step.approverId,
          budgetCondition: step.budgetCondition,
        },
      });
    }
  });

  revalidatePath("/activity-plan/settings");
}

export async function deleteRouteTemplate(templateId: string) {
  await db.approvalRouteTemplate.delete({
    where: { id: templateId },
  });
  revalidatePath("/activity-plan/settings");
}

export async function assignTemplateToEmployee(
  employeeId: string,
  templateId: string | null,
) {
  if (!employeeId) throw new Error("Missing employeeId");

  if (!templateId) {
    await db.employeeApprovalRoute.deleteMany({
      where: { employeeId },
    });
  } else {
    await db.employeeApprovalRoute.upsert({
      where: { employeeId },
      update: { templateId },
      create: { employeeId, templateId },
    });
  }

  revalidatePath("/activity-plan/settings");
}

export async function bulkAssignTemplates(
  assignments: { employeeId: string; templateId: string | null }[],
) {
  await db.$transaction(async (tx) => {
    for (const a of assignments) {
      if (!a.templateId) {
        await tx.employeeApprovalRoute.deleteMany({
          where: { employeeId: a.employeeId },
        });
      } else {
        await tx.employeeApprovalRoute.upsert({
          where: { employeeId: a.employeeId },
          update: { templateId: a.templateId },
          create: { employeeId: a.employeeId, templateId: a.templateId },
        });
      }
    }
  });
  revalidatePath("/activity-plan/settings");
}
