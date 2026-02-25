import {
  upsertMonthlySalesTarget,
  findMonthlySalesTarget,
} from "../infrastructure/sales-target.repository";

interface SaveMonthlyTargetInput {
  year: number;
  month: number;
  targetAmount: number | string;
  notes?: string;
}

/**
 * Use case: Save multiple monthly sales targets (legacy mode).
 */
export async function saveMonthlyTargetsUseCase(
  targets: SaveMonthlyTargetInput[],
  createdById: string,
) {
  const results = [];

  for (const target of targets) {
    const existing = await findMonthlySalesTarget(target.year, target.month);

    const result = await upsertMonthlySalesTarget({
      id: existing?.id,
      year: target.year,
      month: target.month,
      targetAmount:
        typeof target.targetAmount === "string"
          ? parseFloat(target.targetAmount)
          : target.targetAmount,
      notes: target.notes,
      createdById,
    });

    results.push(result);
  }

  return { success: true as const, results };
}
