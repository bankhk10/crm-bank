import { salesTargetSchema, type SalesTargetFormValues } from "./validations";
import { createSalesTarget } from "../infrastructure/sales-target.repository";

/**
 * Use case: Create a new sales target.
 * Validates input, then persists via repository.
 */
export async function createSalesTargetUseCase(
  rawData: unknown,
  userId: string,
) {
  const parsed = salesTargetSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.errors.map((e) => e.message).join(", "),
    };
  }

  const data: SalesTargetFormValues = parsed.data;

  const result = await createSalesTarget({
    year: data.year,
    month: data.month,
    employeeId: data.employeeId,
    customerId: data.customerId,
    createdById: userId,
    items: data.items,
  });

  return { success: true as const, salesTarget: result };
}
