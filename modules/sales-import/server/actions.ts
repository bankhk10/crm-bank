"use server";

import { auth } from "@/modules/auth/infrastructure/next-auth";
import { processLegacySalesFile } from "../application/import-legacy-sales";

export async function importLegacySalesAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "กรุณาเข้าสู่ระบบ", errors: [] };
    }

    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, message: "ไม่พบไฟล์ที่อัปโหลด", errors: [] };
    }

    // You can parse using standard web API Buffer conversion since Next.js supports it
    const fileBuffer = await file.arrayBuffer();

    const result = await processLegacySalesFile(fileBuffer, session.user.id);
    
    if (result.success) {
        return {
          success: true,
          message: `นำเข้าข้อมูลสำเร็จ จำนวน ${result.importedRows} รายการ (จากทั้งหมด ${result.totalRows} แถว)`,
          errors: result.errors,
        };
    } else {
        return {
          success: false,
          message: result.message || "เกิดข้อผิดพลาดในการนำเข้าข้อมูล",
          errors: result.errors,
        };
    }

  } catch (err: any) {
    console.error("Action Error:", err);
    return { success: false, message: "ข้อผิดพลาดระบบ: " + err.message, errors: [] };
  }
}
