"use server";

import * as legacyActions from "@/modules/activity-plans/server/actions";

/**
 * Action: Record Activity Result (Actual)
 */
export async function recordActivityResultAction(
  ...args: Parameters<typeof legacyActions.recordActivityResultAction>
) {
  return legacyActions.recordActivityResultAction(...args);
}
