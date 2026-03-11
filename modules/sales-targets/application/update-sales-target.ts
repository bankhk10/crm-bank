import { salesTargetSchema, type SalesTargetFormValues } from "./validations";
import {
  findSalesTargetById,
  updateSalesTarget,
} from "../infrastructure/sales-target.repository";
import {
  recordSalesTargetHistory,
  buildSnapshot,
  isSnapshotDifferent,
} from "../infrastructure/sales-target-history.repository";

/**
 * Use case: Update an existing sales target.
 * Validates input, checks existence, then persists.
 * Also records an UPDATED history entry with before/after snapshots.
 */
export async function updateSalesTargetUseCase(
  id: string,
  rawData: unknown,
  updatedById?: string,
) {
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

  // เก็บ snapshot ก่อนแก้ไข
  const snapshotBefore = buildSnapshot(existing);

  const data: SalesTargetFormValues = parsed.data;

  const result = await updateSalesTarget(id, {
    year: data.year,
    month: data.month,
    employeeId: data.employeeId,
    stores: data.stores,
  });

  // เก็บ snapshot หลังแก้ไข แล้วบันทึกประวัติ (เฉพาะกรณีที่มีการเปลี่ยนแปลงจริง)
  if (updatedById) {
    const snapshotAfter = buildSnapshot(result);
    if (isSnapshotDifferent(snapshotBefore, snapshotAfter)) {
      await recordSalesTargetHistory({
        salesTargetId: id,
        changeType: "UPDATED",
        changedById: updatedById,
        snapshotBefore,
        snapshotAfter,
      });
    }
  }

  return { success: true as const, salesTarget: result };
}

