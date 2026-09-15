import { z } from "zod";
import { SaleStatus } from "@/lib/db";

export const validSaleStatuses = Object.values(SaleStatus) as [
  SaleStatus,
  ...SaleStatus[],
];
export const saleStatusEnum = z.enum(validSaleStatuses);

export const exportSalesAdminFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  statuses: z.array(z.string()).optional(),
  status: z.string().optional(),
  customerId: z.string().optional(),
  employeeId: z.string().optional(),
});

export type ExportSalesAdminFilterInput = z.infer<
  typeof exportSalesAdminFilterSchema
>;

export const EXPORT_PSEUDO_STATUSES = [
  "ALL",
  "FORECAST",
  "SALES_NOTE",
  "INVOICE",
] as const;

export type ExportPseudoStatus = (typeof EXPORT_PSEUDO_STATUSES)[number];
export type ExportSaleStatus = ExportPseudoStatus | SaleStatus;

/**
 * Validates and normalizes statuses into a deduplicated array of valid ExportSaleStatus values.
 *
 * Rules:
 * 1. If `statuses` array is provided:
 *    - Elements can be SaleStatus enum values or ExportPseudoStatus ("ALL", "FORECAST", "SALES_NOTE", "INVOICE").
 *    - Throws Error if any unrecognized status is encountered.
 *    - Deduplicates items preserving order.
 * 2. If `status` string is provided (backward compatibility):
 *    - Supports single status (e.g. "ALL", "FORECAST", "INVOICE") or comma-separated list.
 *    - Throws Error if any invalid status is encountered.
 * 3. Empty selection (`[]` or undefined) returns `[]`, meaning "no status filter" (ALL).
 */
export function normalizeAndValidateExportStatuses(input?: {
  statuses?: string[] | null;
  status?: string | null;
}): ExportSaleStatus[] {
  if (!input) return [];

  const rawValues: string[] = [];

  // Check statuses array
  if (input.statuses !== undefined && input.statuses !== null) {
    if (!Array.isArray(input.statuses)) {
      throw new Error("รูปแบบสถานะใบขายไม่ถูกต้อง (ต้องเป็น Array)");
    }
    rawValues.push(...input.statuses);
  } else if (typeof input.status === "string" && input.status.trim() !== "") {
    // Backward compatibility: single string or comma-separated
    const trimmed = input.status.trim();
    const parts = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
    rawValues.push(...parts);
  }

  if (rawValues.length === 0 || rawValues.includes("ALL")) {
    return [];
  }

  const validSet = new Set<string>([
    ...Object.values(SaleStatus),
    ...EXPORT_PSEUDO_STATUSES,
  ]);
  const deduplicated: ExportSaleStatus[] = [];

  for (const raw of rawValues) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    if (!validSet.has(trimmed)) {
      throw new Error(
        `สถานะใบขายไม่ถูกต้อง: "${trimmed}" (สถานะที่รองรับ: ${Array.from(validSet).join(", ")})`,
      );
    }

    const validStatus = trimmed as ExportSaleStatus;
    if (!deduplicated.includes(validStatus)) {
      deduplicated.push(validStatus);
    }
  }

  return deduplicated;
}

/**
 * Alias for backward compatibility
 */
export const normalizeExportStatuses = normalizeAndValidateExportStatuses;

