import { salesTargetSchema, type SalesTargetFormValues } from "./validations";
import {
  findSalesTargetById,
  updateSalesTarget,
} from "../infrastructure/sales-target.repository";

/**
 * Use case: Update an existing sales target.
 * Validates input, checks existence, then persists.
 */
export async function updateSalesTargetUseCase(id: string, rawData: unknown) {
  const parsed = salesTargetSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.errors.map((e) => e.message).join(", "),
    };
  }

  const existing = await findSalesTargetById(id);
  if (!existing) {
    return { success: false as const, error: "Sales target not found" };
  }

  const data: SalesTargetFormValues = parsed.data;

  const result = await updateSalesTarget(id, {
    year: data.year,
    month: data.month,
    employeeId: data.employeeId,
    stores: data.stores,
  });

  return { success: true as const, salesTarget: result };
}
