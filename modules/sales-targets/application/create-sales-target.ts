import { salesTargetSchema, type SalesTargetFormValues } from "./validations";
import {
  createSalesTarget,
  findDuplicateSalesTarget,
} from "../infrastructure/sales-target.repository";
import { MONTHS } from "../constants";

/**
 * Use case: Create a new sales target.
 * Validates input, checks for duplicates, then persists via repository.
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

  // Check for duplicate (same year, month, employee, customer)
  const duplicate = await findDuplicateSalesTarget({
    year: data.year,
    month: data.month,
    employeeId: data.employeeId,
    customerId: data.customerId,
  });

  if (duplicate) {
    const monthLabel =
      MONTHS.find((m) => m.value === data.month)?.label ?? `เดือน ${data.month}`;
    const empName = (duplicate as any).employee?.name ?? "พนักงาน";
    const custName = (duplicate as any).customer?.name ?? "ลูกค้า";
    return {
      success: false as const,
      error: `มีเป้าหมายการขายของ ${empName} และ ${custName} ใน${monthLabel} ${data.year} อยู่แล้ว กรุณาแก้ไขรายการที่มีอยู่แทนการสร้างใหม่`,
      duplicateId: duplicate.id,
    };
  }

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
