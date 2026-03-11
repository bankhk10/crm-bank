import { salesTargetSchema, type SalesTargetFormValues } from "./validations";
import {
  createSalesTarget,
  findExistingSalesTarget,
} from "../infrastructure/sales-target.repository";
import {
  recordSalesTargetHistory,
  buildSnapshot,
} from "../infrastructure/sales-target-history.repository";
import { MONTHS } from "../constants";

/**
 * Use case: Create a new sales target.
 * Validates input, checks for duplicates, then persists via repository.
 * Also records a CREATED history entry.
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

  // Check for duplicate (same year, month, employee)
  const duplicate = await findExistingSalesTarget({
    year: data.year,
    month: data.month,
    employeeId: data.employeeId,
  });

  if (duplicate) {
    const monthLabel =
      MONTHS.find((m) => m.value === data.month)?.label ??
      `เดือน ${data.month}`;
    const empName = (duplicate as any).employee?.name ?? "พนักงาน";
    return {
      success: false as const,
      error: `มีเป้าหมายการขายของ ${empName} ใน${monthLabel} ${data.year} อยู่แล้ว กรุณาแก้ไขรายการที่มีอยู่แทนการสร้างใหม่`,
      duplicateId: duplicate.id,
    };
  }

  const result = await createSalesTarget({
    year: data.year,
    month: data.month,
    employeeId: data.employeeId,
    createdById: userId,
    stores: data.stores,
  });

  // บันทึกประวัติ: CREATED
  await recordSalesTargetHistory({
    salesTargetId: result.id,
    changeType: "CREATED",
    changedById: userId,
    snapshotBefore: null,
    snapshotAfter: buildSnapshot(result),
  });

  return { success: true as const, salesTarget: result };
}
