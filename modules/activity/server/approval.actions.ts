"use server";

import { getApproverDirectory } from "../infrastructure/employee-lookup.repository";
import * as legacyActions from "@/modules/activity-plans/server/actions";

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

export async function getApprovalQueueDataAction(
  ...args: Parameters<typeof legacyActions.getApprovalQueueDataAction>
) {
  return legacyActions.getApprovalQueueDataAction(...args);
}

export async function approveActivityPlanAction(
  ...args: Parameters<typeof legacyActions.approveActivityPlanAction>
) {
  return legacyActions.approveActivityPlanAction(...args);
}

export async function rejectActivityPlanAction(
  ...args: Parameters<typeof legacyActions.rejectActivityPlanAction>
) {
  return legacyActions.rejectActivityPlanAction(...args);
}

export async function requestCorrectionPlanAction(
  ...args: Parameters<typeof legacyActions.requestCorrectionPlanAction>
) {
  return legacyActions.requestCorrectionPlanAction(...args);
}

export async function reviewSingleActivityHelperAction(
  ...args: Parameters<typeof legacyActions.reviewSingleActivityHelperAction>
) {
  return legacyActions.reviewSingleActivityHelperAction(...args);
}
