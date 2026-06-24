"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createActivityPlan(formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const requesterId = formData.get("requesterId") as string;
  const requesterRole = formData.get("requesterRole") as string;
  const useSalesBudget = formData.get("useSalesBudget") === "true";
  const useMarketingBudget = formData.get("useMarketingBudget") === "true";

  if (!title || !requesterId || !requesterRole) {
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
      requesterRole,
      useSalesBudget,
      useMarketingBudget,
      status: "PENDING_APPROVAL",
    },
  });

  // 2. Fetch dynamic routing config for this requester
  const routeConfigs = await db.activityApprovalRouteConfig.findMany({
    where: { requesterId },
    orderBy: { stepOrder: 'asc' }
  });

  // 3. Filter steps based on budget conditions
  const validSteps = routeConfigs.filter(config => {
    if (config.budgetCondition === "ALWAYS") return true;
    if (config.budgetCondition === "SALES_ONLY" && useSalesBudget) return true;
    if (config.budgetCondition === "MARKETING_ONLY" && useMarketingBudget) return true;
    if (config.budgetCondition === "ANY_BUDGET" && (useSalesBudget || useMarketingBudget)) return true;
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
      }
    });
  }

  // If no steps are required, auto-approve
  if (validSteps.length === 0) {
    await db.activityPlan.update({
      where: { id: plan.id },
      data: { status: "APPROVED" }
    });
  } else {
    // set the first active step order
    await db.activityPlan.update({
      where: { id: plan.id },
      data: { currentStepOrder: validSteps[0].stepOrder }
    });
  }

  revalidatePath("/activity-plan");
  return plan;
}

export async function approveStep(stepId: string, comments?: string) {
  const step = await db.activityApprovalStep.findUnique({
    where: { id: stepId },
    include: { activityPlan: { include: { approvalSteps: true } } }
  });

  if (!step) throw new Error("Step not found");

  // 1. Mark this step as APPROVED
  await db.activityApprovalStep.update({
    where: { id: stepId },
    data: { status: "APPROVED", actionDate: new Date(), comments }
  });

  // 2. Auto-Approve / Auto-Skip for same person in next steps
  const nextSteps = step.activityPlan.approvalSteps.filter(s => s.stepOrder > step.stepOrder && s.approverId === step.approverId && s.status === 'PENDING');
  for (const nextStep of nextSteps) {
    await db.activityApprovalStep.update({
      where: { id: nextStep.id },
      data: { status: "SKIPPED", actionDate: new Date(), comments: "Auto-approved by multiple roles" }
    });
  }

  // 3. Check if all steps in current order are APPROVED or SKIPPED (Parallel Approval Logic)
  const allSteps = await db.activityApprovalStep.findMany({
    where: { activityPlanId: step.activityPlanId },
    orderBy: { stepOrder: 'asc' }
  });

  const currentOrderSteps = allSteps.filter(s => s.stepOrder === step.stepOrder);
  const isCurrentOrderCompleted = currentOrderSteps.every(s => s.status === "APPROVED" || s.status === "SKIPPED");

  if (isCurrentOrderCompleted) {
    // Find next step order
    const nextPendingStep = allSteps.find(s => s.status === "PENDING" && s.stepOrder > step.stepOrder);
    
    if (!nextPendingStep) {
      // All done!
      await db.activityPlan.update({
        where: { id: step.activityPlanId },
        data: { status: "APPROVED" }
      });
    } else {
      // Move to next order
      await db.activityPlan.update({
        where: { id: step.activityPlanId },
        data: { currentStepOrder: nextPendingStep.stepOrder }
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
    data: { status: "REJECTED", actionDate: new Date(), comments }
  });

  await db.activityPlan.update({
    where: { id: step.activityPlanId },
    data: { status: "REJECTED" }
  });

  revalidatePath("/activity-plan");
}

type ConfigStep = { stepName: string; stepOrder: number; approverId: string; budgetCondition: any };

export async function saveDynamicRouteConfigs(requesterId: string, steps: ConfigStep[]) {
  if (!requesterId) throw new Error("Missing requester");

  // To make it easy, delete existing configs for this requester and insert new ones
  // We wrap in transaction
  await db.$transaction(async (tx) => {
    await tx.activityApprovalRouteConfig.deleteMany({
      where: { requesterId }
    });

    for (const step of steps) {
      await tx.activityApprovalRouteConfig.create({
        data: {
          requesterId,
          stepName: step.stepName,
          stepOrder: step.stepOrder,
          approverId: step.approverId,
          budgetCondition: step.budgetCondition,
        }
      });
    }
  });

  revalidatePath("/activity-plan/settings");
}
