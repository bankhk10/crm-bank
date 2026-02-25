import { createSalesTargetUseCase } from "./create-sales-target";
import { updateSalesTargetUseCase } from "./update-sales-target";
import { CreateDetailedTargetInput, UpdateDetailedTargetInput } from "../types";

/**
 * Use case: Save multiple detailed sales targets.
 */
export async function saveDetailedTargetsUseCase(
  targets: (CreateDetailedTargetInput | UpdateDetailedTargetInput)[],
  userId: string,
) {
  const results = [];

  for (const target of targets) {
    if ("id" in target && target.id) {
      const res = await updateSalesTargetUseCase(target.id, target);
      if (res.success) {
        results.push(res.salesTarget);
      }
    } else {
      const res = await createSalesTargetUseCase(target, userId);
      if (res.success) {
        results.push(res.salesTarget);
      }
    }
  }

  return { success: true as const, results };
}
