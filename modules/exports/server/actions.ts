"use server";

import { auth } from "@/modules/auth/infrastructure/next-auth";
import { hasPermission } from "@/lib/permission-check";
import {
  getSalesAdminExportRecords,
  type ExportFilterParams,
} from "../infrastructure/export.repository";
import { buildSalesAdminExportWorkbook } from "../application/export-sales-admin";
import { format } from "date-fns";

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ExportFileResult {
  filename: string;
  base64: string;
}

/**
 * Server action to export Sales Admin sales data
 * Requires permission: export.sales_admin
 */
export async function exportSalesAdminAction(
  filters: ExportFilterParams
): Promise<ActionResult<ExportFileResult>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "กรุณาเข้าสู่ระบบก่อนใช้งาน" };
    }

    if (!hasPermission(session, "export.sales_admin")) {
      return { success: false, error: "คุณไม่มีสิทธิ์ในการส่งออกข้อมูลการขาย (ธุรการขาย)" };
    }

    const records = await getSalesAdminExportRecords(filters);
    const base64 = await buildSalesAdminExportWorkbook(records);
    const dateStr = format(new Date(), "yyyyMMdd-HHmm");
    const filename = `sales-admin-export-${dateStr}.xlsx`;

    return {
      success: true,
      data: { filename, base64 },
    };
  } catch (err: any) {
    console.error("exportSalesAdminAction error:", err);
    return {
      success: false,
      error: err.message || "เกิดข้อผิดพลาดในการส่งออกข้อมูลการขาย (ธุรการขาย)",
    };
  }
}

